        // Установка просматриваемого пользователя

document.addEventListener('DOMContentLoaded', () => {
    const studentOptions = document.querySelectorAll('.student-option');
    const dropdownButton = document.getElementById('studentDropdown');

    // Функция для активации элемента
    function activateOption(option) {
        // Удаляем класс 'active' у всех элементов
        studentOptions.forEach(opt => opt.classList.remove('active'));

        // Добавляем класс 'active' к выбранному элементу
        option.classList.add('active');

        // Обновляем текст кнопки на имя выбранного ученика
        dropdownButton.textContent = option.textContent;
    }

    // Добавляем обработчики кликов для каждого элемента
    studentOptions.forEach(option => {
        option.addEventListener('click', (event) => {
            event.preventDefault();
            activateOption(option);
            studentId = option.dataset.studentId;
        });
    });

    // По умолчанию активируем первый элемент
    if (studentOptions.length > 0) {
        activateOption(studentOptions[0]);
    }
});




        // Панель управления

function disableCopying() {
    // Запрещаем выделение текста
    document.addEventListener('selectstart', preventSelection);
    document.addEventListener('contextmenu', preventContextMenu);
    document.addEventListener('copy', preventCopy);
}

function enableCopying() {
    // Возвращаем стандартное поведение
    document.removeEventListener('selectstart', preventSelection);
    document.removeEventListener('contextmenu', preventContextMenu);
    document.removeEventListener('copy', preventCopy);
}

function preventSelection(event) {
    event.preventDefault();
}

function preventContextMenu(event) {
    event.preventDefault();
}

function preventCopy(event) {
    event.preventDefault();
}

document.addEventListener('DOMContentLoaded', function () {
    const disableCopyingButton = document.getElementById('disableCopyingButton');
    const refreshPageButton = document.getElementById('refreshPageButton');
    const studentDropdown = document.getElementById('studentDropdown');
    const controlPanelDropdown = document.getElementById('controlPanelDropdown');
    const studentOptions = document.querySelectorAll('.student-option');
    const studentDropdownContainer = studentDropdown?.closest('.dropdown');
    const controlPanelContainer = controlPanelDropdown?.closest('.dropdown');
    const bottomPanel = document.querySelector('.position-fixed.bottom-0.start-0');

    // Функция для показа кнопки "Пригласить ученика"
    function showInviteButtonOnly() {
        if (!bottomPanel) return;
        bottomPanel.innerHTML = `
            <button
                class="btn btn-primary d-flex align-items-center rounded shadow"
                id="inviteStudentButton"
                data-bs-toggle="modal"
                data-bs-target="#invitationModal"
            >
                <i class="bi bi-person-plus me-2"></i> Пригласить ученика
            </button>
        `;
    }

    // Проверка количества учеников
    if (!studentOptions.length) {
        showInviteButtonOnly();
    }

    // Инициализация состояния копирования
    const isCopyingAllowed = mainContainer.dataset.copyingMode; // Начальное состояние
    if (isCopyingAllowed === "false" && userRole !== "teacher") {
        disableCopying();
    }

    if (disableCopyingButton) {
        disableCopyingButton.addEventListener('click', function () {
            const currentAction = disableCopyingButton.querySelector('.text').textContent.trim();
            const isCopyingAllowed = currentAction === 'Запретить копирование';

            fetch(`/classroom/${classroomId}/toggle-copying/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({ allow_copying: !isCopyingAllowed })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    if (data.new_state) {
                        sendMessage("copying-enable", "", "", "all");
                        showNotification("Копирование разрешено", "success");

                        disableCopyingButton.querySelector('.text').textContent = 'Запретить копирование';
                        disableCopyingButton.classList.remove('text-success');
                        disableCopyingButton.classList.add('text-danger');

                        const icon = disableCopyingButton.querySelector('i');
                        if (icon) {
                            icon.classList.add('bi-ban');
                            icon.classList.remove('bi-check-circle');
                        }
                    } else {
                        sendMessage("copying-disable", "", "", "all");
                        showNotification("Копирование запрещено", "success");

                        disableCopyingButton.querySelector('.text').textContent = 'Разрешить копирование';
                        disableCopyingButton.classList.remove('text-danger');
                        disableCopyingButton.classList.add('text-success');

                        const icon = disableCopyingButton.querySelector('i');
                        if (icon) {
                            icon.classList.add('bi-check-circle');
                            icon.classList.remove('bi-ban');
                        }
                    }
                } else {
                    alert('Ошибка при обновлении настроек.');
                }
            })
            .catch(error => console.error('Ошибка:', error));
        });
    }

    if (refreshPageButton) {
        refreshPageButton.addEventListener('click', function () {
            sendMessage("page-reload", "", "", "all");
            showNotification("Обновляем страницы учеников", "success");
            refreshPageButton.disabled = true;
            refreshPageButton.title = 'Обновление страницы учеников...';
            setTimeout(() => {
                refreshPageButton.disabled = false;
                refreshPageButton.title = '';
            }, 10000);
        });
    }
});





        //ВебСокет


    //Получаем токен из сессионных данных или хранилища (например, из cookies или localStorage)
const token = localStorage.getItem('auth_token') || document.cookie.replace(/(?:(?:^|.*;\s*)auth_token\s*\=\s*([^;]*).*$)|^.*$/, "$1");


 //Создаем WebSocket-соединение с токеном в URL или через query-параметры
const socket = new WebSocket(`wss://${window.location.host}/ws/classroom/${classroomId}/?token=${token}`);

socket.onopen = function () {
    sendMessage("user-enter", "", {"username": document.getElementById('main-container').dataset.username}, "teacher");
};

socket.onmessage = function (event) {
    const { request_type, task_id, data, sender_id } = JSON.parse(event.data);

    // Показываем только ответы от выбранного ученика
    if (
        userRole === 'teacher' &&
        request_type === 'task-answer'
    ) {
        const selectedIds = Array.isArray(studentId) ? studentId : [parseInt(studentId)];
        if (!selectedIds.includes(sender_id)) return;
    }

    const handlers = {
        "task-attention": () => moveToPointedTask(task_id),
        "task-answer": () => {
            handleTaskAnswer(task_id, data, data.isCorrect);
            updateProgressBar(task_id, data.correct_count, data.incorrect_count, data.max_score);
        },
        "test-check": () => {
            checkTestAnswer(task_id);
            updateProgressBar(task_id, data.correct_count, data.incorrect_count, data.max_score);
        },
        "truefalse-check": () => {
            checkTrueFalseAnswers(task_id);
            updateProgressBar(task_id, data.correct_count, data.incorrect_count, data.data.max_score);
        },
        "task-reset": () => {
            const taskContainer = document.getElementById(task_id);
            const taskType = taskContainer.getAttribute('data-task-type');
            const functionName = `clear${taskType.charAt(0).toUpperCase() + taskType.slice(1)}Answer`;
            if (typeof window[functionName] === 'function') {
                window[functionName](task_id);
            }
            updateProgressBar(task_id, 0, 0, 100, false);
        },
        "user-enter": () => {
            console.log(data.username);
            showNotification(`${data.username} присоединился к классу.`, "success");
            if (userRole === 'teacher') {
                const studentExists = Array.from(document.querySelectorAll('.student-option')).some(
                    el => el.textContent.trim() === data.username
                );
                if (!studentExists) window.location.reload();
            }
        },
        "user-leave": () => showNotification(`${data.username} покинул класс.`, "warning"),
        "copying-enable": () => enableCopying(),
        "copying-disable": () => disableCopying(),
        "page-reload": () => location.reload()
    };

    if (handlers[request_type]) handlers[request_type]();
};


socket.onerror = function (error) {
    console.error("WebSocket ошибка:", error);
};

function sendMessage(request_type, task_id, data, receivers = 'all') {
    const message = {
        request_type: request_type,
        task_id: task_id,
        data: data,
        receivers: receivers
    };

    // Если студент — всегда отправляем только учителю
    if (userRole === 'student') {
        message.receivers = 'teacher';
    }

    // Если учитель и receivers == 'student', то добавляем конкретного ученика
    if (userRole === 'teacher' && receivers === 'student') {
        if (Array.isArray(studentId)) {
            message.receivers = studentId;  // [id1, id2, ...]
        } else if (studentId) {
            message.receivers = [parseInt(studentId)];
        }
    }

    socket.send(JSON.stringify(message));
}





        // Общие функции


async function fetchUserAnswers(userId, taskId, classroomId) {
    try {
        const params = new URLSearchParams({
            user_id: userId,
            task_id: taskId,
            classroom_id: classroomId
        });

        const response = await fetch(`/api/get_answers/?${params}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken') // Функция для получения CSRF токена
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.status === 'error') {
            console.error('Error fetching answers:', data.message);
            return null;
        }

        return data;

    } catch (error) {
        console.error('Error fetching user answers:', error);
        return null;
    }
}








    // Функции для обработки действий

function taskAttention(taskId) {
    sendMessage('task-attention', taskId, {}, 'all');
    return;
}

function handleTaskAnswer(taskId, data) {
    const answer = data.answer;
    const isCorrect = data.isCorrect;
    const taskContainer = document.getElementById(taskId);
    if (!taskContainer) {
        return;
    }

    const task_type = taskContainer.dataset.taskType;
    const functionName = `fill${task_type.charAt(0).toUpperCase()}${task_type.slice(1)}Answer`;
    if (typeof window[functionName] === 'function') {
        window[functionName](taskId, answer, isCorrect);
    } else {
        console.warn(`Функция ${functionName} не найдена`);
    }
}

async function moveToPointedTask(taskId) {
    const taskContainer = document.getElementById(taskId);
    if (!taskContainer) {
        console.error("Задание не найдено!");
        return;
    }

    const sectionId = taskContainer.dataset.sectionId;
    // Загружаем раздел перед прокруткой
    await loadSection(sectionId);
    // Прокручиваем к заданию после загрузки
    taskContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function deleteAnswers(task_id, classroom_id, user_id) {
    try {
        // Отправляем POST-запрос
        const response = await fetch('/api/delete_answers/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                task_id: task_id,
                classroom_id: classroomId,
                user_id: user_id
            })
        });

        // Обрабатываем ответ
        const data = await response.json();
        const messageDiv = document.getElementById('response-message');
        if (response.ok) {
            const taskContainer = document.getElementById(task_id);
            const taskType = taskContainer.getAttribute('data-task-type');
            const capitalizedTaskType = taskType.charAt(0).toUpperCase() + taskType.slice(1);
            const functionName = `clear${capitalizedTaskType}Answer`;
            if (typeof window[functionName] === 'function') {
                window[functionName](task_id);
            }
            updateProgressBar(task_id, 0, 0, 100, false);
        } else {
            showNotification(data.message, 'danger');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}



