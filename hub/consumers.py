from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
import json


class ClassConsumer(AsyncWebsocketConsumer):
    connected_teachers = {}  # class_id: channel_name
    connected_students = {}  # class_id: {student_id: channel_name}

    async def connect(self):
        user = self.scope.get("user")
        if not user or not user.is_authenticated:
            await self.close()
            return

        self.classroom_id = self.scope['url_route']['kwargs']['classroom_id']
        self.group_name = f'classroom_{self.classroom_id}'

        # Кешируем статус — учитель или нет
        self.is_teacher_cached = await self.check_if_user_is_teacher()

        if self.is_teacher_cached:
            ClassConsumer.connected_teachers[self.classroom_id] = self.channel_name
            print(f"Teacher connected, channel: {self.channel_name}")
        else:
            # Связываем студентов с их каналами
            student_id = self.scope["user"].id
            if self.classroom_id not in ClassConsumer.connected_students:
                ClassConsumer.connected_students[self.classroom_id] = {}
            ClassConsumer.connected_students[self.classroom_id][student_id] = self.channel_name
            print(f"Student connected, channel: {self.channel_name}")

        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        if self.is_teacher_cached:
            current = ClassConsumer.connected_teachers.get(self.classroom_id)
            if current == self.channel_name:
                del ClassConsumer.connected_teachers[self.classroom_id]
        else:
            # Убираем студента из списка
            student_id = self.scope["user"].id
            if self.classroom_id in ClassConsumer.connected_students:
                ClassConsumer.connected_students[self.classroom_id].pop(student_id, None)

        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)

        request_type = data.get('request_type')
        task_id = data.get('task_id')
        payload = data.get('data')
        receivers = data.get('receivers')
        sender_id = self.scope["user"].id

        if (receivers == 'all' or isinstance(receivers, list)) and not self.is_teacher_cached:
            receivers = 'teacher'

        if receivers == 'teacher':
            teacher_channel = ClassConsumer.connected_teachers.get(self.classroom_id)
            if teacher_channel:
                await self.channel_layer.send(teacher_channel, {
                    'type': 'forward_message',
                    'request_type': request_type,
                    'task_id': task_id,
                    'data': payload,
                    'sender_id': sender_id,
                    'sender_channel': self.channel_name,
                    'receivers': 'teacher',
                })
            return

        # Учитель отправляет конкретным ученикам (массив ID)
        if isinstance(receivers, list):
            for receiver_id in receivers:
                student_channel = ClassConsumer.connected_students.get(self.classroom_id, {}).get(receiver_id)
                if student_channel:
                    await self.channel_layer.send(student_channel, {
                        'type': 'forward_message',
                        'request_type': request_type,
                        'task_id': task_id,
                        'data': payload,
                        'sender_id': sender_id,
                        'sender_channel': self.channel_name,
                        'receivers': 'student',
                        'receiver_id': receiver_id,
                    })
            return

        # Отправка сообщения всем участникам класса
        await self.channel_layer.group_send(self.group_name, {
            'type': 'forward_message',
            'request_type': request_type,
            'task_id': task_id,
            'data': payload,
            'sender_id': sender_id,
            'sender_channel': self.channel_name,
            'receivers': receivers,
        })

    async def forward_message(self, event):
        if event['sender_channel'] == self.channel_name:
            return

        if event.get('receivers') == 'filter' and not self.is_teacher_cached:
            return

        await self.send(text_data=json.dumps({
            'request_type': event['request_type'],
            'task_id': event['task_id'],
            'data': event['data'],
            'sender_id': event['sender_id'],
        }))

    @database_sync_to_async
    def check_if_user_is_teacher(self):
        from .models import Classroom
        classroom = Classroom.objects.get(id=self.classroom_id)
        return self.scope["user"].id in classroom.teachers.values_list('id', flat=True)
