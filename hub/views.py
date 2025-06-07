from django.shortcuts import render, redirect, get_object_or_404
from django.views.decorators.http import require_http_methods
from .ai_calls import generate_text
from .models import course, section, lesson, BaseTask, WordList, Image, MatchUpTheWords, Essay, Note, SortIntoColumns, MakeASentence, Unscramble, FillInTheBlanks, Dialogue, Article, Audio, Test, TrueOrFalse, LabelImages, EmbeddedTask, Classroom, ClassroomInvitation, UserAnswer
from django.http import HttpResponseRedirect, JsonResponse
from django.db import transaction
from django.db.models import Max
from .forms import ClassroomForm
from django.core.files.base import ContentFile
from html import unescape
from django.urls import reverse
from django.views.decorators.http import require_POST
import json
import uuid
from bs4 import BeautifulSoup
import random
from django.conf import settings
import secrets
from datetime import timezone
from django.contrib.auth import get_user_model
from django.http import HttpResponseForbidden, StreamingHttpResponse
from django.db.models import Q
from django.utils import timezone
from django.contrib.auth.decorators import login_required
import re
from django.contrib.contenttypes.models import ContentType
from django.core.files.storage import default_storage
from edge_tts import Communicate

User = get_user_model()

def home_view(request):
    if request.user.is_authenticated:
        return render(request, 'home/home.html', {
            'username': request.user.username,
            'role': getattr(request.user, 'role', None)  # безопасный доступ к роли
        })
    else:
        return render(request, 'home/landing.html')

def create_course(request):
    if request.method == 'POST':
        name = request.POST.get('name')
        description = request.POST.get('description')
        student_level = request.POST.get('student_level')

        if request.user.role != "teacher":
            return JsonResponse({'error': 'You are not a teacher'})

        course.objects.create(
            name=name,
            description=description,
            student_level=student_level,
            user=request.user
        )
        return redirect('home')

    return redirect('home')

def delete_course(request, course_id):
    course_to_delete = get_object_or_404(course, id=course_id)

    if request.method == "POST" and course_to_delete.user == request.user:
        with transaction.atomic():
            # Удаляем все задания, секции и уроки
            for lesson in course_to_delete.lessons.all():
                BaseTask.objects.filter(section__lesson=lesson).delete()
                lesson.sections.all().delete()
                lesson.delete()

            # Удаляем сам курс
            course_to_delete.delete()

    return redirect('home')

def lesson_list_view(request, course_id):
    selected_course = get_object_or_404(course, id=course_id)
    if not (request.user == selected_course.user):
        return HttpResponseForbidden("You do not have access to this lesson.")

    lessons = lesson.objects.filter(course=selected_course)

    # Передаём уроки и пользователя в контекст для рендера
    return render(request, 'home/lesson_list.html', {
        'lessons': lessons,
        'user': request.user,
        'course': selected_course,
    })

def add_lesson(request, course_id):
    selected_course = get_object_or_404(course, id=course_id)

    if request.method == 'POST':
        name = request.POST.get('name')
        description = request.POST.get('description')
        lexical_topics = request.POST.get('lexical_topics')
        grammar_topics = request.POST.get('grammar_topics')
        extra_topics = request.POST.get('extra_topics')

        # Проверяем наличие предыдущего урока
        previous_lesson = selected_course.lessons.order_by('-created_at').first()

        # Копируем контекст из предыдущего урока, если он существует
        context = previous_lesson.context if previous_lesson else {}

        # Создаем новый урок с контекстом
        lesson_obj = lesson.objects.create(
            course=selected_course,
            name=name,
            description=description,
            lexical_topics=lexical_topics,
            grammar_topics=grammar_topics,
            extra_topics=extra_topics,
            context=context  # Присваиваем контекст
        )

        # Создаем начальную секцию для нового урока
        section.objects.create(
            lesson=lesson_obj,
            name="Let's begin! 😉",
            order=1,
        )

        return redirect('lesson_list', course_id=course_id)

    return redirect('lesson_list', course_id=course_id)

def lesson_page_view(request, lesson_id):
    lesson_obj = get_object_or_404(lesson, id=lesson_id)
    course_obj = get_object_or_404(course, id=lesson_obj.course.id)
    if request.user != course_obj.user:
        return HttpResponseForbidden("You do not have access to this lesson.")

    sections = lesson_obj.sections.all().order_by('order')
    tasks = BaseTask.objects.filter(section__lesson=lesson_obj).order_by('section__order', 'order')
    classrooms = Classroom.objects.filter(Q(teachers=request.user) | Q(students=request.user)).distinct()

    return render(request, 'builder/updated_templates/generation.html', {
        'lesson': lesson_obj,
        'section_list': sections,
        'tasks': tasks,
        'classrooms': classrooms,
        'user_role': 'teacher',
        "mode": "generation"
    })

def delete_lesson(request, lesson_id):
    lesson_to_delete = get_object_or_404(lesson, id=lesson_id)

    if request.user != lesson_to_delete.course.user:
        return HttpResponseForbidden("You do not have access to this lesson.")

    for section in lesson_to_delete.sections.all():
        tasks = BaseTask.objects.filter(section=section)
        for task in tasks:
            delete_task_handler(request.user, task)
        section.delete()

    course_id = lesson_to_delete.course.id

    if request.method == "POST":
        lesson_to_delete.delete()

    return HttpResponseRedirect(reverse('lesson_list', args=[course_id]))

def add_section(request, lesson_id):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            section_name = data.get('name')

            if not section_name:
                return JsonResponse({'error': 'Название раздела не может быть пустым'}, status=400)

            lesson_obj = get_object_or_404(lesson, id=lesson_id)

            if lesson_obj.course.user != request.user:
                return JsonResponse({'error': 'Вы не можете добавлять разделы в урок, который не принадлежит вам.'}, status=403)

            max_order = lesson_obj.sections.aggregate(Max('order'))['order__max']
            next_order = (max_order or 0) + 1  # Если max_order None (разделов нет), то начать с 1

            section_obj = section.objects.create(
                lesson=lesson_obj,
                name=section_name,
                order=next_order
            )
            return JsonResponse({
                'success': True,
                'section_id': section_obj.id,
                'name': section_obj.name
            })
        except Exception as e:
            print(e)
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Метод не поддерживается'}, status=405)

def update_section(request, section_id):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            new_name = data.get('name')

            if not new_name:
                return JsonResponse({'error': 'Название раздела не может быть пустым.'}, status=400)

            section_obj = get_object_or_404(section, id=section_id)

            if section_obj.lesson.course.user != request.user:
                return JsonResponse({'error': 'Вы не можете редактировать разделы урока, который не принадлежит вам.'}, status=403)

            section_obj.name = new_name
            section_obj.save()

            return JsonResponse({'success': True, 'new_name': new_name})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Метод не поддерживается.'}, status=405)

def delete_section_view(request, section_id):
    section_obj = get_object_or_404(section, id=section_id)
    lesson_id = section_obj.lesson.id  # Для редиректа обратно на страницу урока

    if len(section_obj.lesson.sections.all()) == 1:
        return JsonResponse({'error': 'Нельзя удалить последний раздел.'}, status=400)

    if request.user != section_obj.lesson.course.user:
        return JsonResponse({'error': 'Вы не можете удалять разделы этого урока.'}, status=403)

    if request.method == "POST":
        with transaction.atomic():
            tasks = BaseTask.objects.filter(section=section_obj)
            for task in tasks:
                delete_task_handler(request.user, task)

            section_obj.delete()

            sections = section.objects.filter(lesson_id=lesson_id).order_by('order')

            for index, section_obj in enumerate(sections, start=1):
                section.objects.filter(id=section_obj.id).update(order=index)

    return redirect('lesson_page', lesson_id=lesson_id)




def getContext(request, lesson_id):
    lesson_obj = get_object_or_404(lesson, id=lesson_id)

    if request.method == "GET":
        return JsonResponse({'context': lesson_obj.context or ""})

def addContextElement(request, lesson_id):
    if request.method != "POST":
        return JsonResponse({"error": "Доступ запрещен."}, status=405)

    # Получаем урок
    lesson_instance = get_object_or_404(lesson, id=lesson_id)

    # Проверяем, является ли пользователь создателем курса
    if request.user != lesson_instance.course.user:
        return JsonResponse({"error": "Доступ запрещен."}, status=403)

    # Получаем данные из тела запроса
    try:
        data = json.loads(request.body)
        task_id = data.get("task_id")
        header = data.get("header", "")
        content = data.get("content", "")
    except json.JSONDecodeError:
        return JsonResponse({"error": "Данные переданы неверно."}, status=400)

    if not content:
        return JsonResponse({"error": "Текст не найден."}, status=400)

    # Загружаем существующий контекст
    context = lesson_instance.context or {}

    # Если task_id отсутствует, используем текстовый ключ
    if not task_id:
        task_id = f"text_{uuid.uuid4().hex[:8]}"

    # Проверяем, существует ли уже такой task_id
    if task_id in context:
        return JsonResponse({"error": "Вы уже добавили это задание в контекст."}, status=400)


    # Добавляем новый элемент
    context[task_id] = {"header": header, "content": content}
    lesson_instance.context = context
    lesson_instance.save()

    return JsonResponse({"message": "Задание успешно добавлено", "task_id": task_id, "header": header, "content": content}, status=201)

def removeTaskFromContext(request, lesson_id, task_id):
    if request.method != "DELETE":
        return JsonResponse({"error": "Доступ запрещен."}, status=405)

    # Получаем урок
    lesson_instance = get_object_or_404(lesson, id=lesson_id)

    # Проверяем, имеет ли пользователь доступ
    if request.user != lesson_instance.course.user:
        return JsonResponse({"error": "Доступ запрещен."}, status=403)

    # Получаем текущий контекст урока
    context = lesson_instance.context or {}

    # Проверяем, есть ли такой task_id
    if task_id not in context:
        return JsonResponse({"error": "Такого задания в контексте нет."}, status=404)

    # Удаляем задание
    del context[task_id]
    lesson_instance.context = context
    lesson_instance.save()

    return JsonResponse({"message": "Задание успешно удалено.", "task_id": task_id}, status=200)





        # Получение заданий





def get_section_tasks(request, section_id):
    try:
        section_instance = get_object_or_404(section, id=section_id)
        tasks = BaseTask.objects.filter(section=section_instance)
        data = {}
        for task in tasks:
            data[task.content_type.model] = task.id
        return JsonResponse(data)
    except Exception as e:
        print(e)
        return JsonResponse({"error": str(e)}, status=500)

def get_task_data(request, task_id):
    try:
        task_instance = get_object_or_404(BaseTask, id=task_id)
        content_type = task_instance.content_type
        content_object = task_instance.content_object
        model_class = content_type.model_class()
        is_owner = request.user == task_instance.section.lesson.course.user

        # Common data for all task types
        base_data = {
            "id": task_id,
            "taskType": content_type.model,
            "title": getattr(content_object, 'title', None),
        }

        # Handle task types that don't depend on ownership
        match model_class:
            case WordList:
                return JsonResponse({
                    **base_data,
                    "words": content_object.words,
                })

            case MatchUpTheWords:
                return JsonResponse({
                    **base_data,
                    "pairs": content_object.pairs,
                })

            case Essay:
                return JsonResponse({
                    **base_data,
                    "conditions": content_object.conditions,
                })

            case Note | Article:
                return JsonResponse({
                    **base_data,
                    "content": content_object.content,
                })

            case Image:
                return JsonResponse({
                    **base_data,
                    "image_url": content_object.image_url,
                })

            case Dialogue:
                return JsonResponse({
                    **base_data,
                    "lines": content_object.lines,
                })

            case Audio:
                return JsonResponse({
                    **base_data,
                    "audio_url": content_object.audio_url,
                    "transcript": content_object.transcript,
                })

            case EmbeddedTask:
                return JsonResponse({
                    **base_data,
                    "embed_code": content_object.embed_code,
                })

        # Handle task types that depend on ownership
        if is_owner:
            match model_class:
                case SortIntoColumns:
                    labels = []
                    for column in content_object.columns:
                        labels.extend(column['words'])
                    random.shuffle(labels)
                    return JsonResponse({
                        **base_data,
                        "columns": content_object.columns,
                        "labels": labels,
                    })

                case MakeASentence:
                    return JsonResponse({
                        **base_data,
                        "sentences": content_object.sentences,
                    })

                case Unscramble:
                    return JsonResponse({
                        **base_data,
                        "words": content_object.words,
                    })

                case FillInTheBlanks:
                    labels = re.findall(r'\[(.*?)\]', content_object.text)
                    random.shuffle(labels)
                    return JsonResponse({
                        **base_data,
                        "text": content_object.text,
                        "display_format": content_object.display_format,
                        "labels": labels,
                    })

                case Test:
                    return JsonResponse({
                        **base_data,
                        "questions": content_object.questions,
                    })

                case TrueOrFalse:
                    return JsonResponse({
                        **base_data,
                        "statements": content_object.statements,
                    })

                case LabelImages:
                    labels = [img['label'] for img in content_object.images]
                    random.shuffle(labels)
                    return JsonResponse({
                        **base_data,
                        "images": content_object.images,
                        "labels": labels,
                    })
        else:
            match model_class:
                case SortIntoColumns:
                    columns = content_object.columns
                    labels = []
                    for column in columns:
                        for i in range(len(column['words'])):
                            word = column['words'][i]
                            column['words'][i] = '/'
                            labels.append(word)
                    random.shuffle(labels)
                    return JsonResponse({
                        **base_data,
                        "columns": columns,
                        "labels": labels,
                    })

                case MakeASentence:
                    array = content_object.sentences
                    for sentence_data in array:
                        sentence_data['correct'] = '/ ' * (len(sentence_data['correct'].split(' ')) - 1)
                    return JsonResponse({
                        **base_data,
                        "sentences": array,
                    })

                case Unscramble:
                    array = content_object.words
                    for word_data in array:
                        word_data['word'] = '/' * len(word_data['word'])
                    return JsonResponse({
                        **base_data,
                        "words": array,
                    })

                case FillInTheBlanks:
                    text = content_object.text
                    labels = re.findall(r'\[(.*?)\]', text)
                    text = re.sub(r'\[(.*?)\]', lambda m: '[' + '/' + ']', text)
                    if content_object.display_format != "withList":
                        labels = []
                    else:
                        random.shuffle(labels)
                    return JsonResponse({
                        **base_data,
                        "text": text,
                        "display_format": content_object.display_format,
                        "labels": labels,
                    })

                case Test:
                    questions = content_object.questions
                    for q in questions:
                        for answer in q["answers"]:
                            answer["is_correct"] = False
                    return JsonResponse({
                        **base_data,
                        "questions": questions,
                    })

                case TrueOrFalse:
                    statements = content_object.statements
                    for s in statements:
                        s["is_true"] = False
                    return JsonResponse({
                        **base_data,
                        "statements": statements,
                    })

                case LabelImages:
                    array = content_object.images
                    labels = []
                    for image_data in array:
                        labels.append(image_data['label'])
                        image_data['label'] = '/'
                    random.shuffle(labels)
                    return JsonResponse({
                        **base_data,
                        "images": array,
                        "labels": labels,
                    })

        # If no match found
        return JsonResponse({"error": "Unknown task type"}, status=400)

    except Exception as e:
        print(e)
        return JsonResponse({"error": str(e)}, status=500)







ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif"]
MAX_SIZE = 5 * 1024 * 1024  # 5MB

ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav']
MAX_AUDIO_SIZE = 10 * 1024 * 1024  # 10MB

@transaction.atomic
@require_POST
def taskSave(request, section_id):
    """
    Сохраняет задание (без файлов) в модели. Ожидает, что тело запроса содержит JSON:

        {
            "obj_id": <optional: id существующего задания>,
            "task_type": "<тип задания>",
            "payloads": { ... }  # данные задания (payloads)
        }

    Для задания типа LabelImages вызывается отдельная функция process_label_images.
    """
    section_instance = get_object_or_404(section, id=section_id)

    # Проверка прав доступа пользователя
    if request.user != section_instance.lesson.course.user:
        return JsonResponse({'success': False, 'error': 'У Вас нет доступа к этому курсу.'}, status=403)

    try:
        # Проверка на слишком большие данные
        if len(request.body) > settings.DATA_UPLOAD_MAX_MEMORY_SIZE:
            return JsonResponse({'success': False,
                                 'error': f'Превышен максимальный размер данных. Максимальный размер: {settings.DATA_UPLOAD_MAX_MEMORY_SIZE / 1024 / 1024}MB'},
                                status=413)

        data = json.loads(request.body)
        obj_id = data.get('obj_id')
        task_type = data.get('task_type')
        payloads = data.get('payloads', {})

        model_class = globals().get(task_type)
        if not model_class:
            return JsonResponse({'success': False, 'error': 'Invalid task type'}, status=400)

        # Сначала считаем общий объем данных
        total_size = len(request.body)  # Размер запроса в байтах

        with transaction.atomic():
            # Общая логика для всех типов заданий
            if obj_id:
                task_instance = get_object_or_404(BaseTask, id=obj_id)
                task_instance.size = total_size
                print(task_instance.size)
                content_object = task_instance.content_object
                if not isinstance(content_object, model_class):
                    return JsonResponse({'success': False, 'error': 'Task type mismatch'}, status=400)
                for key, value in payloads.items():
                    setattr(content_object, key, value)
                content_object.save()
                task_instance.save()
            else:
                content_object = model_class.objects.create(**payloads)
                current_order = BaseTask.objects.filter(section=section_instance).aggregate(Max('order'))['order__max']
                new_order = 1 if current_order is None else current_order + 1
                task_instance = BaseTask.objects.create(
                    section=section_instance,
                    content_object=content_object,
                    content_type=ContentType.objects.get_for_model(model_class),
                    order=new_order,
                    size=total_size,
                )

            # Обновляем информацию о занимаемом объеме памяти пользователя
            request.user.update_used_storage(total_size)

        return JsonResponse({'success': True, 'task_id': task_instance.id, 'section_id': section_id})

    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        print(e)
        return JsonResponse({'success': False, 'error': "Ошибка сервера."}, status=500)

def upload_image(request):
    if request.method == 'POST' and request.FILES.get('image'):
        image = request.FILES['image']

        # Проверка типа файла
        if image.content_type not in ALLOWED_TYPES:
            return JsonResponse({'error': 'Неверный формат файла. Допустимы: JPG, PNG, GIF'}, status=400)

        # Проверка размера
        if image.size > MAX_SIZE:
            return JsonResponse({'error': 'Файл слишком большой. Максимальный размер — 5MB'}, status=400)

        # Читаем содержимое файла
        image_data = image.read()

        # Генерация короткого уникального имени файла
        ext = image.name.split('.')[-1].lower()
        short_id = secrets.token_urlsafe(6)
        file_name = f'uploads/i_{short_id}.{ext}'

        saved_path = default_storage.save(file_name, ContentFile(image_data))
        full_url = f'/media/{saved_path}'

        # Обновляем использованное хранилище
        request.user.update_used_storage(image.size)

        return JsonResponse({
            'success': True,
            'message': 'Файл загружен',
            'url': full_url
        })

    return JsonResponse({'error': 'Файл не передан'}, status=400)

def upload_audio(request):
    if request.method == 'POST' and request.FILES.get('audio'):
        audio = request.FILES['audio']

        # Проверка типа
        if audio.content_type not in ALLOWED_AUDIO_TYPES:
            return JsonResponse({'error': 'Неверный формат файла. Допустимы: MP3, WAV'}, status=400)

        # Проверка размера
        if audio.size > MAX_AUDIO_SIZE:
            return JsonResponse({'error': 'Файл слишком большой. Максимум 10MB'}, status=400)

        audio_data = audio.read()

        ext = audio.name.split('.')[-1].lower()

        # Генерация короткого уникального имени
        short_id = secrets.token_urlsafe(6)  # Примерно 8 символов
        file_name = f'uploads/a_{short_id}.{ext}'

        saved_path = default_storage.save(file_name, ContentFile(audio_data))
        full_url = f'/media/{saved_path}'

        request.user.update_used_storage(audio.size)

        return JsonResponse({
            'success': True,
            'message': 'Аудио загружено',
            'url': full_url
        })

    return JsonResponse({'error': 'Аудиофайл не передан'}, status=400)







def delete_task_handler(user, task):
    # Удаление содержимого задания
    # Если контент - это изображение, то удаляем сам файл и объект

    if isinstance(task.content_object, Image):
        image_file_path = task.content_object.image_url  # Получаем путь к файлу (URL)
        delete_image(user, image_file_path)


    elif isinstance(task.content_object, LabelImages):
        image_files = [image_object['url'] for image_object in task.content_object.images]
        for image_file in image_files:
            delete_image(user, image_file)

    user.used_storage -= task.size
    user.save()
    print('После', user.used_storage)
    task.delete()





    # Запрос к ИИ

def delete_image(user, image_url):
    """
    Удаляет один файл изображения по его URL и обновляет used_storage пользователя.
    """
    print(image_url)
    if not image_url or not image_url.startswith('/media/'):
        return {"success": False, "error": "Некорректный URL"}

    relative_path = image_url.replace('/media/', '', 1)
    print(relative_path, default_storage.exists(relative_path))

    if default_storage.exists(relative_path):
        image_size = default_storage.size(relative_path)
        default_storage.delete(relative_path)

        # Обновляем used_storage
        user.used_storage = max(0, user.used_storage - image_size)
        user.save()

        print(user.used_storage, 'lol')

        return {"success": True, "freed_storage_bytes": image_size}

    return {"success": False, "error": "Файл не найден"}

@require_http_methods(["DELETE"])
def delete_task(request, task_id):
    try:
        with transaction.atomic():
            task_instance = BaseTask.objects.get(id=task_id)
            course_instance = task_instance.section.lesson.course

            if request.user != course_instance.user:
                return JsonResponse({"error": "У вас нет прав на удаление задания"}, status=403)

            # Сохраняем нужные данные до удаления
            section_instance = task_instance.section
            task_order = task_instance.order

            # Удаляем связанные данные
            if task_instance.content_object:
                delete_task_handler(request.user, task_instance)

            # Удаляем саму задачу
            if task_instance.id is not None:
                task_instance.delete()

            # Обновляем порядок оставшихся заданий
            remaining_tasks = BaseTask.objects.filter(section=section_instance, order__gt=task_order)
            for task_elem in remaining_tasks:
                task_elem.order -= 1
                task_elem.save()

            return JsonResponse({"success": True})
    except BaseTask.DoesNotExist:
        return JsonResponse({"error": "Задание не найдено"}, status=404)
    except Exception as e:
        print(e)
        return JsonResponse({"error": str(e)}, status=500)


# Запрос к ИИ
def generateRequest(request):
    # Initial validation
    match request.method:
        case 'POST':
            pass
        case _:
            return JsonResponse({'status': 'error', 'message': 'POST only'}, status=405)

    try:
        # Authorization check
        match request.user.role:
            case 'teacher':
                pass
            case _:
                return JsonResponse(
                    {'status': 'error', 'message': 'Only teachers can generate requests'},
                    status=403
                )

        # Parse request data
        data = json.loads(request.body)
        lesson_id = data.get('lessonId')
        task_type = data.get('taskType')
        context_flag = data.get('context', False)
        emoji = data.get('emoji', False)
        quantity = data.get('quantity', 2)
        fill_type = data.get('fillType', 'lexical')
        match_type = data.get('matchType', '')
        test_type = data.get('testType', 'auto')
        language = data.get('language', 'en')
        sentence_length = data.get('sentenceLength', 6)
        user_query = data.get('query', '')
        image_data = data.get('image', None)

        # Process image data if present
        if image_data:
            match image_data:
                case str() as img_str if img_str.startswith('data:image/'):
                    image_data = img_str.split(',')[1]
                case _:
                    return JsonResponse({
                        'status': 'error',
                        'message': 'Invalid image format. Expected base64 data URL.'
                    }, status=400)

        lesson_obj = get_object_or_404(lesson, id=lesson_id)

        # Determine model based on image presence
        use_image_model = image_data is not None and image_data != ''
        model = "meta-llama/llama-4-maverick-17b-128e-instruct" if use_image_model else "llama3-70b-8192"
        print(model)

        # Generate query based on task type
        base_query = ""
        match task_type:
            case "WordList":
                base_query = "Create a list of English words with Russian translations"
                if user_query:
                    base_query += f" on the topic: '{user_query}'"
                base_query += ". The words should be useful for learning, including common vocabulary."
                base_query += " JSON format: ```json{'title': str, 'words': [{'word': str, 'translation': str}]}```."

            case "Note":
                base_query = "Write a well-structured note"
                if user_query:
                    base_query += f" on the topic: '{user_query}'"
                else:
                    base_query += " based on the provided context"
                base_query += ". Use HTML tags + Bootstrap for nice formatting."
                base_query += " JSON format: ```json{'title': str, 'content': str}```."

            case "FillInTheBlanks":
                type_desc = {
                    'lexical': "lexical ",
                    'grammar': "grammar ",
                    None: ""
                }.get(fill_type, "")

                base_query = f"Create a {type_desc}fill-in-the-blanks exercise"
                if user_query:
                    base_query += f" on the topic: '{user_query}'"
                base_query += " Each sentence should contain exactly one gap (mark as _), with one correct answer. Sentences should be completely in English."
                base_query += " JSON format: ```json{'title': str, 'instructions': str, 'sentences': [{'text': str, 'answer': str}]}```."

            case "MatchUpTheWords":
                type_desc = {
                    'word-translate': "matching English words with their translations",
                    'question-answer': "questions and answers",
                    'beginning-continuation': "phrase beginnings and their continuations",
                    'card1-card2': "words and their antonyms/synonyms",
                    None: "paired elements"
                }.get(match_type, "")

                base_query = f"Create a matching exercise for {type_desc}"
                if user_query:
                    base_query += f" on the topic: '{user_query}'"
                base_query += ". Ensure logical connection between paired elements."
                base_query += " JSON format: ```json{'title': str, 'pairs': [{'card1': str, 'card2': str}]}```."

            case "Article":
                lang_desc = "English" if language == 'en' else "Russian"
                base_query = f"Write an informative article in {lang_desc}."
                if user_query:
                    base_query += f" on the topic: '{user_query}'"
                base_query += ". Use HTML tags + Bootstrap for nice formatting."
                base_query += " JSON format: ```json{'title': str, 'content': str}```."

            case "Test":
                type_desc = {
                    'lexical': "lexical test",
                    'grammar': "grammar test",
                    'understanding': "reading comprehension test",
                    None: "test"
                }.get(test_type, "")

                lang_desc = "English" if language == 'en' else "Russian"
                base_query = f"Create a {type_desc} in {lang_desc} with answer options"
                if user_query:
                    base_query += f" on the topic: '{user_query}'"
                base_query += " JSON format: ```json{'title': str, 'questions': [{'text': str, 'answers': [{'text': str, 'is_correct': bool}]}]}```."

            case "TrueOrFalse":
                type_desc = {
                    'lexical': "testing vocabulary knowledge",
                    'grammar': "testing grammar knowledge",
                    'understanding': "testing text comprehension",
                    None: ""
                }.get(test_type, "")

                lang_desc = "English" if language == 'en' else "Russian"
                base_query = f"Create True/False questions {type_desc} in {lang_desc}"
                if user_query:
                    base_query += f" on the topic: '{user_query}'"
                base_query += ". Questions should be clear and unambiguous."
                base_query += " JSON format: ```json{'title': str, 'statements': [{'text': str, 'is_true': bool}]}```."

            case "MakeASentence":
                length_desc = {
                    1: "simple short sentences (5-7 words)",
                    2: "standard sentences (8-12 words)",
                    3: "complex long sentences (13+ words)"
                }.get(sentence_length, "sentences")

                base_query = f"Create {length_desc} in English"
                if user_query:
                    base_query += f" using vocabulary on the topic: '{user_query}'"
                base_query += ". Sentences should be grammatically correct and natural."
                base_query += " JSON format: ```json{'title': str, 'sentences': [{'sentence': str}]}```."

            case "SortIntoColumns":
                base_query = "Create an exercise for sorting English words into categories"
                if user_query:
                    base_query += f" on the topic: '{user_query}'"
                base_query += ". Categories should be clearly defined, and words should be unambiguously classifiable."
                base_query += " JSON format: ```json{'title': str, 'columns': [{'title': str, 'words': [...]}]}```."

            case "Essay":
                base_query = "Come up with an interesting essay topic in English"
                if user_query:
                    base_query += f" within the theme: '{user_query}'"
                base_query += ". The topic should be debatable and provoke a detailed response."
                base_query += " JSON format: ```json{'title': str}```."

            case "Transcript":
                base_query = "Create a transcript of an English monologue"
                if user_query:
                    base_query += f" on the topic: '{user_query}'"
                base_query += " JSON format: ```json{'title': str, 'transcript': str}```."

            case _:
                return JsonResponse(
                    {'status': 'error', 'message': 'Invalid task type'},
                    status=400
                )

        # Add common parameters
        match quantity:
            case 1:
                base_query += " Prepare a small exercise."
            case 3:
                base_query += " Prepare a large exercise."

        if emoji:
            base_query += " Add Unicode characters for the emojis."

        # Context handling
        if context_flag and not use_image_model:
            lesson_context = lesson_obj.context
            context_lines = []

            for key, value in lesson_context.items():
                if key == "base":
                    continue

                header = value.get("header", "")
                content = value.get("content", "")

                match header:
                    case "Word list":
                        words = re.findall(r"<b>(.*?)</b>", content)
                        line = f"{header}: {','.join(words)}"
                        context_lines.append(line)
                    case _:
                        text = BeautifulSoup(content, "html.parser").get_text()
                        text = re.sub(r'[^\w\s,.!?-]', '', text)
                        cleaned = text.strip()
                        if cleaned:
                            line = f"{header}: {cleaned}"
                            context_lines.append(line)

            context = "Context: \n" + '\n'.join(context_lines) + '\n'
            base_query = context + base_query

        print(image_data)
        # Generate response
        response = generate_text(
            prompt=base_query,
            model=model,
            image_data=image_data,
        )
        print(response)

        try:
            return JsonResponse({
                'status': 'success',
                'data': response
            })
        except ValueError as e:
            print("Error:", e)
            return JsonResponse({
                'status': 'error',
                'message': str(e),
                'raw_response': response[:1000]
            }, status=500)

    except Exception as e:
        print("Error:", e)
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)




def normalize(text: str) -> str:
    """Нормализует текст: разворачивает сокращения, удаляет пунктуацию, убирает лишние пробелы, приводит к нижнему регистру."""
    if not isinstance(text, str):
        return ''

    # Специальная замена для "won't" -> "will not"
    text = re.sub(r"\bwon't\b", "will not", text, flags=re.IGNORECASE)

    # Заменяем окончания n't на not
    text = re.sub(r"n't\b", " not", text, flags=re.IGNORECASE)

    # Обрабатываем I'm -> I am
    text = re.sub(r"\bI'm\b", "I am", text, flags=re.IGNORECASE)

    # Обрабатываем you're, we're, they're -> you are, we are, they are
    text = re.sub(r"\b(\w+)'re\b", r"\1 are", text, flags=re.IGNORECASE)

    # Обрабатываем he's, she's, it's, what's, who's, where's, how's -> he is, she is и т.п.
    def replace_s(match):
        word = match.group(1).lower()
        if word in ['he', 'she', 'it', 'that', 'what', 'where', 'who', 'how', 'there']:
            return match.group(1) + " is"
        else:
            return match.group(1)

    text = re.sub(r"\b(\w+)'s\b", replace_s, text, flags=re.IGNORECASE)

    # Обрабатываем let’s -> let us
    text = re.sub(r"\blet's\b", "let us", text, flags=re.IGNORECASE)

    # Удаляем все лишние символы кроме букв, цифр и пробелов
    text = re.sub(r"[^\w\s]", "", text)

    # Заменяем множественные пробелы на один
    text = re.sub(r"\s+", " ", text)

    # Приводим к нижнему регистру и обрезаем
    return text.strip().lower()

def handleLabelimagesAnswer(object, answer):
    """
    object.images = [
        {"url": "...", "label": "dance"},
        ...
    ]

    answer = {
        "image_index": 0,
        "label": "dance"
    }
    """
    try:
        image = object.images[answer['image_index']]
        return normalize(image['label'].strip()) == normalize(answer['label'].strip())
    except (IndexError, KeyError, AttributeError):
        return False

def handleMakeasentenceAnswer(object, answer):
    """
    answer = {
        sentenceIndex: 0,      # индекс предложения в списке
        fromIndex: 0,          # индекс слова в перемешанном (shuffled)
        toIndex: 2             # предполагаемая позиция в правильном (correct)
    }
    """
    sentence_index = answer['sentenceIndex']
    from_index = answer['fromIndex']
    to_index = answer['toIndex']

    try:
        sentence_obj = object.sentences[sentence_index]
        correct_words = sentence_obj['correct'].split()
        shuffled_words = sentence_obj['shuffled'].split()

        if from_index >= len(shuffled_words) or to_index >= len(correct_words):
            return False

        word_from_shuffled = shuffled_words[from_index]
        expected_word_in_correct = correct_words[to_index]

        return normalize(word_from_shuffled) == normalize(expected_word_in_correct)
    except (IndexError, KeyError):
        return False

def handleUnscrambleAnswer(object, answer):
    """
    answer = {
        wordIndex: 0,      // индекс слова в списке
        fromIndex: 0,      // индекс буквы в shuffled_word
        toIndex: 2         // предполагаемая позиция в правильном слове
    }
    """
    word_index = answer['word_index']
    gap_index = answer['gap_index']
    letter_index = answer['letter_index']

    try:
        target_word = object.words[word_index]
        correct_letter = target_word['word'][gap_index]
        provided_letter = target_word['shuffled_word'][letter_index]

        return normalize(correct_letter) == normalize(provided_letter)
    except (IndexError, KeyError):
        return False

def handleTrueorfalseAnswer(object, answer):
    """
    object — словарь с данными утверждений, содержащий список заявлений:
        [{"text": "Small animals do not play a crucial role in maintaining the balance of nature.", "is_true": false}, ...]
    answer — словарь вида:
        {"statement": "Insects help in pollination, which is vital for plant reproduction.", "selected_answer": "true"}
    """
    statement_text = answer.get("statement", "").strip()
    selected_answer = answer.get("selected_answer", "").strip().lower()

    if not statement_text or selected_answer not in ["true", "false"]:
        return False

    # Ищем соответствующее утверждение
    for statement in object.statements:
        if statement.get("text", "") == statement_text:
            # Проверяем правильность выбранного ответа
            correct_answer = "true" if statement.get("is_true", False) else "false"
            return selected_answer == correct_answer

    return False

def handleTestAnswer(object, answer):
    """
    object — словарь с данными теста, содержащий список вопросов:
        [{"text": "Question?", "answers": [{"text": "a", "is_correct": true}, ...]}, ...]
    answer — словарь вида:
        {"question": "What animal is known for its meow?", "selected_answer": "cat"}
    """
    question_text = answer.get("question", "").strip()
    selected_text = answer.get("selected_answer", "").strip()

    if not question_text or not selected_text:
        return False

    # Ищем соответствующий вопрос
    for question in object.questions:
        if question.get("text", "") == question_text:
            # Ищем выбранный пользователем ответ среди вариантов
            for option in question.get("answers", []):
                if option.get("text", "") == selected_text:
                    return option.get("is_correct", False)

    return False

def handleFillintheblanksAnswer(object, answer):
    """
    content — HTML-строка с пропусками, например:
        'The [wolf] is a wild animal...'
    answer — словарь вида {'index': 0, 'answer': 'wolf'}
    """
    index = answer.get('index')
    user_input = answer.get('answer', '').strip()

    if index is None or not user_input:
        return False

    # Убираем HTML-теги и экранирование
    clean_text = unescape(re.sub(r'<[^>]+>', '', object.text))

    # Находим все пропуски в виде [word]
    correct_answers = re.findall(r'\[(.+?)\]', clean_text)

    if index >= len(correct_answers):
        return False

    # Нормализуем строки (без пунктуации, в нижнем регистре)
    correct_word = normalize(correct_answers[index])
    user_word = normalize(user_input)

    return user_word == correct_word

def handleMatchupthewordsAnswer(object, answer):
    """
    object — список словарей вида [{'card1': 'read', 'card2': 'читать'}, ...]
    answer — словарь вида {'card 1': 'read', 'card 2': 'читать'}
    """
    print(answer)
    card1 = answer.get('card 1')
    card2 = answer.get('card 2')

    for pair in object.pairs:
        if normalize(pair.get('card1')) == normalize(card1) and normalize(pair.get('card2')) == normalize(card2):
            return True
    return False

def handleSortintocolumnsAnswer(object, answer):
    column_name = answer.get('column_name')
    word = answer.get('word')

    is_correct = False
    for category in object.columns:
        if category['name'] == column_name:
            is_correct = word in category['words']
            break

    return is_correct

def check_answer(task_id, answer):
    task = get_object_or_404(BaseTask, id=task_id)
    task_type = task.content_type.model

    if task_type == 'essay':
        return True

    handler_name = f"handle{task_type.capitalize()}Answer"

    handler_func = globals().get(handler_name)
    if callable(handler_func):
        return handler_func(task.content_object, answer)
    else:
        return JsonResponse({'status': 'error', 'message': f'Handler {handler_name} not found'}, status=500)

def calculate_max_score(task_obj):
    """Вычисляет максимальный балл для задания на основе его типа и содержания"""
    content = task_obj.content_object
    task_type = task_obj.content_type.model

    if task_type == 'matchupthewords':
        return len(content.pairs)

    elif task_type == 'fillintheblanks':
        clean_text = unescape(re.sub(r'<[^>]+>', '', content.text))
        return len(re.findall(r'\[(.+?)\]', clean_text))

    elif task_type == 'test':
        return sum(1 for question in content.questions if any(ans['is_correct'] for ans in question['answers']))

    elif task_type == 'trueorfalse':
        return len(content.statements)

    elif task_type == 'labelimages':
        return len(content.images)

    elif task_type == 'unscramble':
        words = [word['word'] for word in content.words]
        total_length = sum(len(word) for word in words)  # Общая длина всех слов
        print(words, total_length)
        return total_length

    elif task_type == 'makeasentence':
        return sum(len(sentence['correct'].split()) for sentence in content.sentences)

    elif task_type == 'sortintocolumns':
        return sum(len(col['words']) for col in content.columns)

    return 10

@require_POST
def receiveAnswer(request):
    try:
        data = json.loads(request.body)
        task_id = data.get('task_id')
        answer = data.get('answer')
        classroom_id = data.get('classroom_id')
        user_id = data.get('user_id')

        # Проверка наличия обязательных параметров
        if not task_id or not answer:
            return JsonResponse({
                'status': 'error',
                'message': 'Missing task_id, answer or classroom_id in request'
            }, status=400)

        isCorrect = check_answer(task_id, answer)

        if not classroom_id:
            task_obj = BaseTask.objects.get(id=task_id)
            if request.user != task_obj.section.lesson.course.user:
                return JsonResponse({
                    'status': 'error',
                    'message': 'You can not receive answers for this task'
                }, status=404)
            return JsonResponse({
                'status': 'success',
                'isCorrect': isCorrect,
                'task_id': task_id,
                'received_answer': answer,
            })

        task_obj = BaseTask.objects.get(id=task_id)
        classroom_obj = Classroom.objects.get(id=classroom_id)
        user = User.objects.get(id=user_id)

        if not task_obj or not classroom_obj or not user:
            return JsonResponse({
                'status': 'error',
                'message': 'Task or classroom or user not found'
            }, status=404)

        if request.user != user and request.user not in classroom_obj.teachers.all() and request.user not in classroom_obj.students.all():
            return JsonResponse({
                'status': 'error',
                'message': 'You are not authorized to see this answer.'
            }, status=403)

        # Получаем или создаем запись UserAnswer
        user_answer, created = UserAnswer.objects.get_or_create(
            classroom=classroom_obj,
            task=task_obj,
            user=user,
            defaults={
                'answer_data': [],
                'correct_answers': 0,
                'incorrect_answers': 0,
                'max_score': calculate_max_score(task_obj),
            }
        )

        # Проверяем, был ли такой ответ уже зарегистрирован
        answer_exists = any(
            existing_answer['answer'] == answer
            for existing_answer in user_answer.answer_data
        )

        # Добавляем новый ответ в массив (для истории)
        answer_entry = {
            'answer': answer,
            'is_correct': isCorrect,
            'timestamp': timezone.now().isoformat(),
            'counted': not answer_exists
        }

        # Обновляем счетчики только если ответ новый
        if not answer_exists:
            if task_obj.content_type == 'essay':
                user_answer.answer_data = [answer_entry]
            else:
                user_answer.answer_data.append(answer_entry)
                if isCorrect:
                    user_answer.correct_answers += 1
                else:
                    user_answer.incorrect_answers += 1

        user_answer.save()

        max_progress_score = user_answer.max_score + user_answer.incorrect_answers
        if task_obj.content_type.model == 'test' or task_obj.content_type.model == 'trueorfalse':
            max_progress_score = user_answer.max_score

        # Возвращаем результат
        return JsonResponse({
            'status': 'success',
            'isCorrect': isCorrect,
            'task_id': task_id,
            'received_answer': answer,
            'correct_count': user_answer.correct_answers,
            'incorrect_count': user_answer.incorrect_answers,
            'max_score': max_progress_score,
            'answer_exists': answer_exists
        })

    except json.JSONDecodeError:
        return JsonResponse({
            'status': 'error',
            'message': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        print(e)
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)





@login_required
def getAnswers(request):
    try:
        task_id = request.GET.get('task_id')
        classroom_id = request.GET.get('classroom_id')
        user_id = request.GET.get('user_id')  # Получаем user_id из параметров запроса

        # Проверка обязательных параметров
        if not all([task_id, classroom_id, user_id]):
            return JsonResponse({
                'status': 'error',
                'message': 'Missing required parameters: task_id, classroom_id or user_id'
            }, status=400)

        # Получаем пользователя по user_id
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return JsonResponse({
                'status': 'error',
                'message': f'User with id {user_id} does not exist'
            }, status=404)

        # Получаем объекты задачи и класса
        task_obj = get_object_or_404(BaseTask, id=task_id)
        classroom_obj = get_object_or_404(Classroom, id=classroom_id)

        if request.user != user and request.user not in classroom_obj.teachers.all() and request.user not in classroom_obj.students.all():
            return JsonResponse({
                'status': 'error',
                'message': 'User does not have access to this task'
            }, status=403)

        # Получаем запись UserAnswer или создаём новую, если не существует
        user_answer, created = UserAnswer.objects.get_or_create(
            user=user,
            task=task_obj,
            classroom=classroom_obj,
            defaults={
                'answer_data': [],
                'correct_answers': 0,
                'incorrect_answers': 0,
                'max_score': calculate_max_score(task_obj)
            }
        )

        # Формируем ответ
        response_data = {
            'status': 'success',
            'user_id': user.id,
            'task_id': task_id,
            'classroom_id': classroom_id,
            'correct_answers': user_answer.correct_answers,
            'incorrect_answers': user_answer.incorrect_answers,
            'max_score': user_answer.max_score + user_answer.incorrect_answers,
            'answers_history': user_answer.answer_data,
            'last_updated': user_answer.updated_at.isoformat(),
            'is_new_record': created
        }

        return JsonResponse(response_data)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({
            'status': 'error',
            'message': str(e),
            'details': traceback.format_exc()
        }, status=500)

def delete_answers(request):
    if request.method == 'POST':
        try:
            # Получаем данные из тела запроса
            data = json.loads(request.body)
            task_id = data.get('task_id')
            classroom_id = data.get('classroom_id')
            user_id = data.get('user_id')

            # Проверяем обязательные параметры
            if not all([task_id, classroom_id, user_id]):
                return JsonResponse({
                    'status': 'error',
                    'message': 'Missing required parameters: task_id or classroom_id'
                }, status=400)

            # Получаем объекты задачи и класса
            task_obj = get_object_or_404(BaseTask, id=task_id)
            classroom_obj = get_object_or_404(Classroom, id=classroom_id)
            user = User.objects.get(id=user_id)

            if request.user != user and request.user not in classroom_obj.teachers.all() and request.user not in classroom_obj.students.all():
                return JsonResponse({
                    'status': 'error',
                    'message': 'You are not authorized to delete this answer.'
                }, status=403)

            # Фильтруем ответы по task_id и classroom_id
            answers_query = UserAnswer.objects.filter(
                task=task_obj,
                classroom=classroom_obj,
                user=user
            )

            # Удаляем найденные записи
            deleted_count, _ = answers_query.delete()

            # Формируем ответ
            return JsonResponse({
                'status': 'success',
                'message': f'Successfully deleted {deleted_count} answer(s)',
                'deleted_count': deleted_count
            })

        except Exception as e:
            import traceback
            traceback.print_exc()
            return JsonResponse({
                'status': 'error',
                'message': str(e),
                'details': traceback.format_exc()
            }, status=500)

    else:
        return JsonResponse({
            'status': 'error',
            'message': 'Invalid request method. Use POST.'
        }, status=405)

def reorder_tasks(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            if not data.get('tasks'):
                return JsonResponse(
                    {"status": "error", "message": "Отсутствуют данные о задачах"},
                    status=400
                )

            with transaction.atomic():
                # Получаем все задачи одним запросом
                task_ids = [item['id'] for item in data['tasks']]
                existing_tasks = BaseTask.objects.filter(id__in=task_ids)
                existing_ids = set(str(task.id) for task in existing_tasks)

                task_to_check = existing_tasks[0]
                if task_to_check.section.lesson.course.user != request.user:
                    return JsonResponse(
                        {"status": "error", "message": "У вас нет доступа к данной задаче"},
                        status=403
                    )

                # Проверяем, что все задачи существуют
                for item in data['tasks']:
                    if str(item['id']) not in existing_ids:
                        return JsonResponse(
                            {"status": "error", "message": f"Задача {item['id']} не найдена"},
                            status=404
                        )

                # Обновляем порядок
                for item in data['tasks']:
                    BaseTask.objects.filter(id=item['id']).update(order=item['order'])

                return JsonResponse({"status": "success"})

        except Exception as e:
            return JsonResponse(
                {"status": "error", "message": str(e)},
                status=400
            )

def edge_tts_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            text = data.get('text', '')
            voice = data.get('voice', 'en-US-JennyNeural')
            rate = data.get('rate', '+0%')
            pitch = data.get('pitch', '+0Hz')

            # Валидация
            if not text or len(text) < 3 or len(text) > 5000:
                return JsonResponse({'error': 'Text must be between 3 and 5000 characters'}, status=400)

            # Генерация аудио потоком
            async def audio_stream():
                communicate = Communicate(text, voice, rate=rate, pitch=pitch)
                async for chunk in communicate.stream():
                    if chunk["type"] == "audio":
                        yield chunk["data"]

            response = StreamingHttpResponse(audio_stream(), content_type='audio/mpeg')
            response['Content-Disposition'] = 'inline; filename="speech.mp3"'
            return response

        except Exception as e:
            print(e)
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Only POST method allowed'}, status=405)






def choose_classroom(request, lesson_id):
    """Страница выбора класса с AJAX-поддержкой."""
    lesson_instance = get_object_or_404(lesson, id=lesson_id)

    if request.method == "POST":
        selected_class_id = request.POST.get("classroom_id")
        if selected_class_id:
            classroom = get_object_or_404(Classroom, id=selected_class_id)
            if request.user not in classroom.teachers.all():
                return JsonResponse({"success": False, "message": "You are not a teacher of this classroom"}, status=403)
            classroom.lesson = lesson_instance
            classroom.save()
            return redirect("classroom_view", classroom_id=selected_class_id)
        return JsonResponse({"success": False})

def create_classroom(request, lesson_id):
    if request.method == 'POST':
        # Проверяем, является ли пользователь учителем
        if request.user.role != 'teacher':
            return JsonResponse({"success": False, "message": "You are not a teacher"}, status=403)

        # Создаем форму с данными из POST-запроса
        form = ClassroomForm(request.POST)
        if form.is_valid():
            # Создаем новый класс
            classroom = form.save(commit=False)
            classroom.lesson = lesson.objects.get(id=lesson_id)
            classroom.features = {"copying": True}
            classroom.save()

            # Добавляем текущего пользователя как учителя
            classroom.teachers.add(request.user)

            # Генерируем URL для перенаправления
            redirect_url = reverse("classroom_view", args=[classroom.id])

            # Если запрос AJAX, возвращаем JSON-ответ
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({"success": True, "redirect_url": redirect_url})

            # Иначе выполняем стандартное перенаправление
            return redirect(redirect_url)
        else:
            # Если форма невалидна, возвращаем ошибки
            errors = {field: error for field, error in form.errors.items()}
            return JsonResponse({"success": False, "errors": errors}, status=400)
    else:
        # Если метод GET, отображаем форму
        form = ClassroomForm()

    return render(request, 'classroom/create_classroom.html', {'form': form})

@login_required
def classroom_view(request, classroom_id):
    classroom_obj = Classroom.objects.get(id=classroom_id)

    if not classroom_obj or (request.user not in classroom_obj.teachers.all() and request.user not in classroom_obj.students.all()):
        return HttpResponseForbidden("У вас нет доступа к этому классу.")

    lesson_obj = classroom_obj.lesson
    sections = lesson_obj.sections.all().order_by('order')
    students = classroom_obj.students.all()  # Получаем всех учеников класса
    teachers = classroom_obj.teachers.all()
    if request.user in teachers:
        user_role = 'teacher'
    else:
        user_role = 'student'

    # Получаем все задачи и группируем их по секциям
    tasks = BaseTask.objects.filter(section__in=sections).select_related('content_type').order_by('order')

    section_tasks = []
    for section in sections:
        section_tasks.append({
            'id': section.id,
            'section_title': section.name,
            'tasks': [task for task in tasks if task.section_id == section.id]
        })

    return render(request, 'builder/updated_templates/classroom.html', {
        'classroom_id': classroom_obj.id,
        'classroom': classroom_obj,
        'lesson': lesson_obj,
        'section_list': sections,
        'section_tasks': section_tasks,
        'students': students,
        'teachers': teachers,
        'user_role': user_role,
        "tasks": tasks,
        "mode": "classroom",
        "user_id": request.user.id,
    })

@require_POST
def delete_classroom(request, classroom_id):
    classroom = get_object_or_404(Classroom, id=classroom_id)

    # Проверяем, что пользователь - учитель в этом классе
    if request.user not in classroom.teachers.all():
        return JsonResponse({'error': 'Недостаточно прав'}, status=403)

    try:
        with transaction.atomic():
            classroom.delete()
            return JsonResponse({'success': True})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

def toggle_copying(request, classroom_id):
    if request.method == 'POST':
        try:
            # Получаем класс по ID
            classroom = Classroom.objects.get(id=classroom_id)

            if request.user not in classroom.teachers.all():
                return JsonResponse({
                    'success': False,
                    'error': 'У вас нет доступа к данному классу.'
                }, status=403)

            # Получаем данные из тела запроса
            data = json.loads(request.body)
            allow_copying = data.get('allow_copying')

            # Проверяем, что значение allow_copying было передано
            if allow_copying is None:
                return JsonResponse({
                    'success': False,
                    'error': 'Параметр "allow_copying" отсутствует.'
                }, status=400)

            # Обновляем параметр features["copying"]
            classroom.features['copying'] = allow_copying
            classroom.save()

            # Возвращаем успешный ответ
            return JsonResponse({
                'success': True,
                'new_state': allow_copying
            })

        except ObjectDoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Класс не найден.'
            }, status=404)

        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)

    # Если метод запроса не POST
    return JsonResponse({
        'success': False,
        'error': 'Метод не поддерживается.'
    }, status=405)



@login_required
def accept_invitation(request, code):
    """Обработка перехода по ссылке приглашения."""
    invitation = get_object_or_404(ClassroomInvitation, code=code)

    # Проверяем, не истекло ли приглашение
    if timezone.now() > invitation.expires_at:
        return redirect("invitation_expired")  # Редирект на страницу с сообщением об истечении срока

    classroom = invitation.classroom

    # Проверяем, не является ли пользователь уже участником класса
    if request.user in classroom.students.all() or request.user in classroom.teachers.all():
        return redirect("classroom_view", classroom_id=classroom.id)  # Редирект на страницу класса

    # Если пользователь авторизован, добавляем его как постоянного ученика
    if request.user.is_authenticated:
        classroom.students.add(request.user)
        invitation.delete()  # Удаляем приглашение после использования
        return redirect("classroom_view", classroom_id=classroom.id)

    # Если пользователь не авторизован, перенаправляем на регистрацию
    return redirect("register")

def create_invitation(request, classroom_id):
    """Создает приглашение и возвращает короткую ссылку."""
    classroom = get_object_or_404(Classroom, id=classroom_id)
    invitation = classroom.create_invitation()

    # Формируем короткую ссылку
    invitation_url = request.build_absolute_uri(
        reverse("accept_invitation", args=[invitation.code])
    )

    return JsonResponse({"invitation_url": invitation_url})
