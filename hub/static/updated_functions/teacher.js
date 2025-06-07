const addTextContextButtons = document.querySelectorAll(".addTextContentButton");

const elementRussianNames = {
    "wordlist": "Список слов",
    "matchupthewords": "Соотнесите слова",
    "essay": "Эссе",
    "note": "Заметка",
    "image": "Изображение",
    "sortintocolumns": "Распределить по колонкам",
    "makeasentence": "Составить предложение",
    "unscramble": "Составить слово из букв",
    "fillintheblanks": "Заполнить пропуски",
    "dialogue": "Диалог",
    "article": "Статья",
    "audio": "Аудио",
    "test": "Тест",
    "trueorfalse": "Правда или ложь",
    "labelimages": "Подпишите изображения",
    "embeddedtask": "Интерактивное задание"
};





        // Разделы урока

function scrollToBottom(container) {
    const overflowContainer = container.closest('.overflow-y-auto');
    if (overflowContainer) {
        overflowContainer.scrollTo({
            top: overflowContainer.scrollHeight,
            behavior: 'smooth'
        });
    }
}

function handleSectionNameEdit(sectionId, name) {
    // Отправляем запрос на сервер для обновления названия раздела
    fetch(`/hub/section/${sectionId}/update`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken') // Получаем CSRF-токен
        },
        body: JSON.stringify({ name: name })
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('Ошибка при обновлении названия раздела.');
        }
    })
    .catch(error => {
        showNotification('Не удалось обновить название раздела.', "danger");
    });
}

function handleAddSection(lessonId, sectionName) {
    return fetch(`/hub/lesson/${lessonId}/add_section/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({ name: sectionName })
    })
    .then(response => {
        if (response.ok) return response.json();
        else throw new Error('Ошибка при добавлении раздела');
    })
    .then(data => {
        const csrfToken = getCookie('csrftoken');
        const sectionList = document.querySelector('#section-list');
        const newSection = document.createElement('li');
        newSection.className = 'list-group-item d-flex justify-content-between align-items-center text-primary';
        newSection.dataset.sectionId = data.section_id;

        newSection.innerHTML = `
            <button type="button" class="btn btn-link p-0 section-link text-decoration-none" data-section-id="${data.section_id}">
                ${data.name}
            </button>
            <div class="section-action-buttons align-items-center d-flex">
                <i class="bi bi-pencil-fill text-secondary me-2 edit-section-icon"
                   data-section-id="${data.section_id}"
                   title="Редактировать название"></i>
                <form method="POST" action="/section/${data.section_id}/delete/" class="delete-section m-0">
                    <input type="hidden" name="csrfmiddlewaretoken" value="${csrfToken}">
                    <button class="btn btn-link p-0" title="Удалить">
                        <i class="bi bi-trash3-fill text-secondary"></i>
                    </button>
                </form>
            </div>
        `;

        // Обработчик перехода к разделу
        const button = newSection.querySelector('.section-link');
        const sectionButtons = document.querySelectorAll('.section-link');
        button.addEventListener('click', async function () {
            const sectionId = data.section_id;
            loadSection(sectionId);
        });

        sectionList.appendChild(newSection);
        sectionListInitialization();
        scrollToBottom(sectionList);

        const addSectionButton = document.querySelector('.add-section-link');
        addSectionButton.style.display = 'block';

        return data;
    })
    .catch(error => {
        showNotification(error.message, "danger");
    });
}

function sectionListInitialization() {
    // Проходим по каждому значку редактирования секции и добавляем обработчик события
    document.querySelectorAll('.edit-section-icon').forEach(icon => {
        icon.addEventListener('click', async (event) => {
            const sectionId = event.target.dataset.sectionId;
            const listItem = event.target.closest('.list-group-item');
            // Находим кнопку, содержащую название секции
            const sectionLinkButton = listItem.querySelector('.section-link');
            if (!sectionLinkButton) return;

            const currentName = sectionLinkButton.textContent.trim();
            // Создаем input для редактирования
            const inputField = document.createElement('input');
            inputField.type = 'text';
            inputField.value = currentName;
            inputField.classList.add('form-control', 'form-control-sm');

            // Заменяем кнопку на input
            sectionLinkButton.replaceWith(inputField);
            inputField.focus();

            // Функция для сохранения изменений
            const saveChanges = async () => {
                const newName = inputField.value.trim();
                // Если имя изменилось и не пустое, отправляем изменения на сервер
                if (newName && newName !== currentName) {
                    await handleSectionNameEdit(sectionId, newName);
                }
                // Создаем новую кнопку с обновленным (или прежним) названием
                const newSectionLinkButton = document.createElement('button');
                newSectionLinkButton.type = 'button';
                newSectionLinkButton.className = 'btn btn-link p-0 section-link text-decoration-none';
                newSectionLinkButton.dataset.sectionId = sectionId;
                newSectionLinkButton.textContent = newName || currentName;
                // Возвращаем кнопку вместо input
                inputField.replaceWith(newSectionLinkButton);
            };

            // Сохраняем изменения по нажатию Enter
            inputField.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    saveChanges();
                }
            });
            // Или при потере фокуса
            inputField.addEventListener('blur', () => {
                saveChanges();
            });
        });
    });
}

function addSectionButtonInitialization() {
    // Обработчик для кнопки "Добавить раздел"
    document.querySelector('.add-section-link').parentNode.style.display = 'block';
    const button = document.querySelector('.add-section-link');
    button.addEventListener('click', (e) => {
        e.preventDefault();
        const lessonId = e.target.dataset.lessonId;

        // Создаем поле ввода
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Название раздела';
        input.className = 'form-control form-control-sm mb-2';

        // Убираем ссылку "Добавить раздел"
        const addSectionButton = document.querySelector('.add-section-link');
        addSectionButton.style.display = 'none';

        // Кнопка сохранения
        const saveButton = document.createElement('button');
        saveButton.className = 'btn btn-primary btn-sm w-100';
        saveButton.textContent = 'Создать';

        // Контейнер для формы
        const formContainer = document.createElement('div');
        formContainer.className = 'mb-2';
        formContainer.appendChild(input);
        formContainer.appendChild(saveButton);

        // Вставляем форму перед ссылкой "Добавить раздел"
        e.target.parentNode.insertBefore(formContainer, e.target);

        // Обработчик сохранения
        saveButton.addEventListener('click', () => {
            const sectionName = input.value.trim();
            if (sectionName) {
                handleAddSection(lessonId, sectionName)
                    .then(() => {
                        formContainer.remove();
                    });
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    sectionListInitialization();
    addSectionButtonInitialization();

    const sectionList = document.querySelector('#section-list');

    const addToClassButton = document.querySelector('#addToClassButton');
    if (addToClassButton) addToClassButton.style.display = 'block';

    const sectionActionButtons = document.querySelectorAll('.section-action-buttons');
    sectionActionButtons.forEach(button => {
        button.style.display = 'flex';
    });

    // Инициализируем кнопку добавления заметки контекста
    addTextContextButtons.forEach(button => {
        button.style.display = 'block';
        button.addEventListener('click', addTextContext);
    });
    setTimeout(() => {
        createAddTaskButton();
    }, 1000)

    // Модальное окно для добавления урока в класс
    const cards = document.querySelectorAll('.classroom-card');

    cards.forEach(card => {
        const radio = card.querySelector('input[type="radio"]');

        card.addEventListener('click', () => {
            // Снимаем выделение со всех карточек
            cards.forEach(c => c.classList.remove('active'));

            // Выделяем текущую
            card.classList.add('active');

            // Активируем radio, если не был выбран
            if (!radio.checked) {
                radio.checked = true;
            }
        });
    });
});





        // Обработчики заданий

function organizeActionButtons(taskhtml, elems, color = 'dark') {
    const wrapper = document.createElement('div');
    wrapper.className = "d-flex justify-content-end align-items-center";

    const actionsContainer = document.createElement('div');
    actionsContainer.className = "actions-container ms-2 d-flex align-items-center rounded-3 border border-white bg-opacity-25 bg-white";

    // Кнопка "Призвать учеников" — на мобильных слева от дропдауна
    if (elems.summon && mode === "classroom") {
        const summonBtn = createIconButton("Призвать учеников", "bi-broadcast", `text-${color}`, "ms-2 d-md-none");
        actionsContainer.appendChild(summonBtn);
    }

    // Dropdown (на мобилках)
    const dropdown = document.createElement('div');
    dropdown.className = "dropdown d-md-none d-inline z-5";

    const dropdownToggle = document.createElement('button');
    dropdownToggle.className = `btn btn-sm text-${color} border-0`;
    dropdownToggle.setAttribute('type', 'button');
    dropdownToggle.setAttribute('data-bs-toggle', 'dropdown');
    dropdownToggle.setAttribute('aria-expanded', 'false');
    dropdownToggle.innerHTML = `<i class="bi bi-three-dots-vertical"></i>`;

    const dropdownMenu = document.createElement('div');
    dropdownMenu.className = 'dropdown-menu dropdown-menu-end';

    if (elems.edit) dropdownMenu.appendChild(createDropdownItem("Редактировать", "bi-pencil"));
    if (elems.mark) dropdownMenu.appendChild(createDropdownItem("Добавить в контекст", "bi-bookmark"));
    if (elems.mark) dropdownMenu.appendChild(createDropdownItem("Скрыть из контекста", "bi-bookmark-check"));
    if (elems.restart) dropdownMenu.appendChild(createDropdownItem("Сбросить", "bi-arrow-clockwise"));
    if (elems.deleteListener) dropdownMenu.appendChild(createDropdownItem("Удалить", "bi-trash"));

    dropdown.appendChild(dropdownToggle);
    dropdown.appendChild(dropdownMenu);
    actionsContainer.appendChild(dropdown);

    // Кнопки для desktop
    const desktopButtons = document.createElement('div');
    desktopButtons.className = "d-none d-md-flex";

    if (elems.edit) desktopButtons.appendChild(createIconButton("Редактировать", "bi-pencil", `text-${color}`, "ms-2"));
    if (elems.mark) desktopButtons.appendChild(createIconButton("Добавить в контекст", "bi-bookmark", `text-${color}`, "ms-2"));
    if (elems.mark) desktopButtons.appendChild(createIconButton("Скрыть из контекста", "bi-bookmark-check", `text-${color}`, "ms-2"));

    // summon — после edit, только на десктопе
    if (elems.summon && mode === "classroom") {
        const summonBtnDesktop = createIconButton("Призвать учеников", "bi-broadcast", `text-${color}`, "ms-2");
        desktopButtons.appendChild(summonBtnDesktop);
    }

    if (elems.restart) desktopButtons.appendChild(createIconButton("Сбросить", "bi-arrow-clockwise", `text-${color}`, "ms-2"));
    if (elems.deleteListener) desktopButtons.appendChild(createIconButton("Удалить", "bi-trash", `text-${color}`, "ms-2 me-2"));

    actionsContainer.appendChild(desktopButtons);
    wrapper.appendChild(actionsContainer);

    const taskHeader = taskhtml.querySelector('.card-header');
    if (taskHeader) {
        taskHeader.appendChild(wrapper);
    }

    // Инициализация событий
    if (elems.mark) initAttachTaskListeners(taskhtml);
    if (elems.edit) initEditTaskListeners(taskhtml);
    if (elems.summon) initSummonTaskListeners(taskhtml);
    if (elems.restart) initResetTaskListeners(taskhtml);
    if (elems.deleteListener) initDeleteTaskListener(taskhtml);
}

// Вспомогательная функция для создания пунктов меню
function createDropdownItem(title, icon) {
    const item = document.createElement('button');
    item.className = 'dropdown-item align-items-center gap-2';
    item.style.display = 'flex';
    if (title === "Удалить") {
        item.className += " text-danger";
    }
    item.type = 'button';
    item.innerHTML = `<i class="bi ${icon}"></i> <span class="action-text">${title}</span>`;
    return item;
}



// Добавление обработчиков
function initAttachTaskListeners(taskContainer) {
    const bookmarks = taskContainer.querySelectorAll(".bi-bookmark");
    const taskId = taskContainer.id;
    if (!bookmarks || !taskId) return;

    bookmarks.forEach(icon => {
        const button = icon.parentElement;
        button.addEventListener("click", function () {
            formatAndAddTaskToContext(taskId);
        });
        button.style.display = "flex";
    });

    const checkedBookmarks = taskContainer.querySelectorAll(".bi-bookmark-check");
    checkedBookmarks.forEach(icon => {
        const button = icon.parentElement;
        button.addEventListener("click", function () {
            removeTaskFromContext(taskId);
        });
        button.style.display = "none";
    });
}

function initSummonTaskListeners(taskContainer) {
    const icons = taskContainer.querySelectorAll(".bi-broadcast");

    if (!icons.length) return;

    icons.forEach(icon => {
        const button = icon.closest("button");
        if (!button) return;

        button.addEventListener("click", async function () {
            const taskContainer = this.closest(".task-item");
            if (!taskContainer) return;

            const taskId = taskContainer.id;
            if (!taskId) {
                showNotification("Ошибка: отсутствуют данные задания.", "danger");
                return;
            }

            taskAttention(taskId);
        });
    });
}

function initEditTaskListeners(taskContainer) {
    const icons = taskContainer.querySelectorAll(".bi-pencil");

    if (!icons.length) return;

    icons.forEach(icon => {
        const button = icon.closest("button");
        if (!button) return;

        button.addEventListener("click", async function () {
            const header = this.closest(".card-header");
            if (!header) return;

            const taskContainer = header.parentElement;
            if (!taskContainer) return;

            const taskId = taskContainer.id;
            if (!taskId) {
                showNotification("Ошибка: отсутствует ID задания.", "danger");
                return;
            }

            editTask(taskId);
        });
    });
}

function initResetTaskListeners(taskContainer) {
    const icons = taskContainer.querySelectorAll(".bi-arrow-clockwise");

    icons.forEach(icon => {
        const button = icon.closest("button");
        if (!button) return;

        if (mode === "classroom") {
            button.addEventListener("click", async function () {
                try {
                    const taskContainer = this.closest(".task-item");
                    if (!taskContainer) {
                        showNotification("Ошибка: отсутствует контейнер задачи.", "danger");
                        return;
                    }

                    const taskId = taskContainer.id;
                    if (!taskId) {
                        showNotification("Ошибка: отсутствуют данные задания.", "danger");
                        return;
                    }

                    await deleteAnswers(taskId, classroomId, studentId || userId);
                    sendMessage('task-reset', taskId, {}, 'student');
                    showNotification("Ответы успешно удалены.", "success");
                } catch (error) {
                    console.error("Ошибка при удалении ответов:", error);
                    showNotification("Произошла ошибка при удалении ответов.", "danger");
                }
            });
        } else {
            button.remove();
        }
    });
}

function initDeleteTaskListener(taskContainer) {
    const taskId = taskContainer.id;
    const icons = taskContainer.querySelectorAll(".bi-trash");

    icons.forEach(icon => {
        const button = icon.closest("button");
        if (!button || !taskId) return;

        button.addEventListener("click", async function () {
            const confirmDelete = confirm("Вы уверены, что хотите удалить это задание?");
            if (!confirmDelete) return;

            try {
                const response = await fetch(`/hub/tasks/${taskId}/delete/`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken'),
                    },
                });

                if (response.ok) {
                    checkAndRemoveTaskFromContext(taskId);
                    taskContainer.parentElement.remove();
                } else {
                    showNotification("Ошибка при удалении задания", "danger");
                }
            } catch (error) {
                showNotification("Произошла ошибка. Обновите страницу.", "danger");
            }
        });
    });
}






        // Контекст

function addTaskToContext(lesson_id, task_id, header, content) {
    fetch(`/hub/add-context-element/${lesson_id}/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken")
        },
        body: JSON.stringify({
            task_id: task_id,
            header: header,
            content: content
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            showNotification(data.error, "danger");
        } else {
            showTaskInContextWindow(data.task_id, data.header, data.content);
            const context_window = document.querySelector(".context-window");
            if (context_window.querySelectorAll(".accordion").length === 1) {
                const generation_container = document.getElementById("generation-container");
                if (generation_container) {
                    generation_container.innerHTML = "";
                    const generate_btn = document.getElementById("task-generate");
                    if (generate_btn) {
                        generate_btn.style.display = "flex";
                    }
                }
            }
        }
    })
    .catch(error => {
        showNotification("Произошла ошибка. Попробуйте выбрать другое задание или обратитесь в поддержку.", "danger");
    });
}

function removeTaskFromContext(taskId) {
    const lessonId = document.getElementById("main-container").dataset.lessonId;

    fetch(`/hub/remove-context-element/${lessonId}/${taskId}/`, {
        method: "DELETE",
        headers: {
            "X-CSRFToken": getCookie("csrftoken"),
            "Content-Type": "application/json"
        }
    }).then(response => response.json())
        .then(data => {
            if (data.error && data.error !== "Такого задания в контексте нет.") {
                showNotification(data.error, "danger");
            } else {
                removeAccordionElementFromContextWindow(data.task_id)
            }
        }).catch(error => showNotification("Произошла ошибка. Измените параметры или обратитесь в поддержку.", "danger"));
}

function addTextContext() {
    // Получаем все контейнеры заметок
    const containers = document.querySelectorAll(".noteContainer");

    // Массивы для хранения текстовых полей и кнопок сохранения
    const textareas = [];
    const saveButtons = [];

    // Заполняем массивы для textareas и saveButtons
    containers.forEach(function(container) {
        textareas.push(container.querySelector("textarea"));
        saveButtons.push(container.querySelector(".save-note-btn"));
    });

    containers.forEach(function(container, index) {
        // Скрываем все кнопки добавления текста
        addTextContextButtons.forEach(function(element) {
            element.style.display = "none";
        });

        // Создаем текстовое поле, если его еще нет
        let textarea = textareas[index];
        if (!textarea) {
            textarea = document.createElement("textarea");
            textarea.classList.add("form-control", "mb-2");
            textarea.placeholder = "Введите текст...";
            container.appendChild(textarea);
            textareas[index] = textarea;  // Обновляем массив с textarea
        }
        textarea.focus();

        // Проверяем, есть ли уже кнопка сохранения
        let saveButton = saveButtons[index];
        if (!saveButton) {
            saveButton = document.createElement("button");
            saveButton.classList.add("btn", "btn-primary", "save-note-btn", "d-flex", "me-auto");
            saveButton.textContent = "Сохранить";
            container.appendChild(saveButton);
            saveButtons[index] = saveButton;  // Обновляем массив с кнопками сохранения

            // Добавляем обработчик клика для сохранения заметки
            saveButton.addEventListener("click", function () {
                const content = textarea.value.trim();
                if (content) {
                    addTaskToContext(lessonId, null, null, content);
                    // Удаляем все текстовые поля и кнопки сохранения
                    textareas.forEach(function(textarea) {
                        textarea.remove();
                    });
                    saveButtons.forEach(function(button) {
                        button.remove();
                    });
                    // Показываем кнопку добавления текста снова
                    addTextContextButtons.forEach(function (element) {
                        element.style.display = "block";
                    });
                } else {
                    showNotification("Заметка не может быть пустой", "warning");
                }
            });
        }
    });
}

async function checkAndRemoveTaskFromContext(taskId) {
    const context = await getContext(lessonId, "view");

    const taskExists = Object.entries(context).some(
        ([existingTaskId]) => existingTaskId === taskId
    );

    if (taskExists) {
        removeTaskFromContext(taskId);
    }
}

function formatTaskContent(taskType, raw_content) {
    let content;
    if (taskType === "wordlist") {
        content = raw_content
            .map(({word, translation}) => `<b>${word}</b> - ${translation}`)
            .join('<br>');
    } else if (taskType === "matchupthewords") {
        content = Object.entries(raw_content)
            .map(([word, translation]) => `${word} - ${translation}`)
            .join('\n');
    } else if (taskType === "labelimages") {
        content = raw_content.join(', ');
    } else if (taskType === "unscramble") {
        content = raw_content.map(({ word, shuffled_word, hint }) => {
            let formatted = `${word.replaceAll("␣", " ")}`;
            if (hint) {
                formatted += ` (${hint})`;
            }
            return formatted;
        }).join(', ');
    } else if (taskType === "fillintheblanks") {
        content = raw_content.replaceAll(/\[(.*?)\]/g, "_");
    } else if (taskType === "test") {
        content = raw_content.map((q, qIndex) => {
            let answers = q.answers.map((a, aIndex) =>
                `   ${aIndex + 1}. ${a.text} ${a.is_correct ? "(✔)" : ""}`
            ).join("\n");
            return `${qIndex + 1}. ${q.text}\n${answers}<br>`;
        }).join("\n\n");
    } else if (taskType === "makeasentence") {
        content = raw_content.map(sentence => sentence.correct).join("<br>");
    } else if (taskType === "sortintocolumns") {
        content = raw_content
            .map(col => `${col.name} - ${col.words.join(", ")}`)
            .join("<br>");
    } else if (taskType === "trueorfalse") {
        content = raw_content.map(statement => `${statement.text}: ${statement.is_true ? "Правда" : "Ложь"}`)
            .join("<br>");
    } else if (taskType === "audio") {
        content = "Audio script: " + raw_content;
    } else {
        content = raw_content;
    }
    return content;
}


async function formatAndAddTaskToContext(taskId) {
    // Получаем данные с сервера
    const taskData = await fetchTaskData(taskId);
    if (!taskData) return;

    // Убираем id и title, оставляем только контент
    const { id, title, image_urls, audio_url, display_format, taskType, ...contentData } = taskData;
    const raw_content = Object.values(contentData)[0] || "Нет данных";

    let header = elementRussianNames[taskType];
    const content = formatTaskContent(taskType, raw_content);

    // Добавляем задание в контекст
    console.log(lessonId, taskId, header, content);
    addTaskToContext(lessonId, taskId, header, content);
}

async function updateTaskInContext(taskId) {
    const context = await getContext(lessonId, "view");

    if (!context) {
        console.error("Context not found");
        return;
    }

    // Преобразуем context в массив для удобства
    const contextEntries = Object.entries(context);

    contextEntries.forEach(([existingTaskId, taskData]) => {
        if (existingTaskId === taskId) {
            // Удаляем старое
            removeTaskFromContext(taskId);
            // Добавляем новое
            formatAndAddTaskToContext(taskId);
        }
    });
}





        // Выбор и добавление учеников

const activeTaskTypes = ['matchupthewords', 'labelimages', 'unscramble', 'fillintheblanks', 'test', 'makeasentence', 'sortintocolumns', 'trueorfalse', 'essay'];

document.addEventListener('DOMContentLoaded', () => {
    const studentOptions = document.querySelectorAll('.student-option');

    studentOptions.forEach(option => {
        option.addEventListener('click', (event) => {
            event.preventDefault(); // Предотвращаем переход по ссылке

            // Получаем ID выбранного ученика
            studentId = option.dataset.studentId;

            const taskContainers = document.querySelectorAll('.task-item');
            taskContainers.forEach(container => {
                const taskId = container.id;
                const taskType = container.getAttribute('data-task-type');
                const capitalizedTaskType = taskType.charAt(0).toUpperCase() + taskType.slice(1);

                if (taskType && activeTaskTypes.includes(taskType)) {
                    const functionName = `clear${capitalizedTaskType}Answer`;
                    if (typeof window[functionName] === 'function') {
                        window[functionName](taskId);
                    }
                    displayUserStats(taskId);
                }
            });

            // Обновляем текст кнопки на имя выбранного ученика
            const dropdownButton = document.getElementById('studentDropdown');
            dropdownButton.textContent = option.textContent;

            // Здесь можно добавить AJAX-запрос или другую логику
        });
    });
});

if (mode === 'classroom') {
    document.addEventListener('DOMContentLoaded', function () {
        const invitationModal = document.getElementById('invitationModal');
        const invitationLinkInput = document.getElementById('invitationLink');
        const copyLinkButton = document.getElementById('copyLinkButton');

        // Обработчик открытия модального окна
        invitationModal.addEventListener('show.bs.modal', function () {
            fetch(`/invite/${classroomId}/`)
                .then(response => response.json())
                .then(data => {
                    invitationLinkInput.value = data.invitation_url; // Вставляем ссылку в поле
                })
                .catch(error => console.error('Ошибка при получении ссылки:', error));
        });

        // Обработчик копирования ссылки
        copyLinkButton.addEventListener('click', function () {
            invitationLinkInput.select();
            document.execCommand('copy');
            showNotification('Ссылка скопирована!', "success");
        });
    });
}



        // Сохранение задания

async function saveTask(params, payloads) {
    const url = `/hub/section/${params.section_id}/task/save`;

    const requestData = {
        obj_id: params.obj_id || null,
        task_type: params.task_type,
        payloads: payloads
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(requestData)
        });

        const data = await response.json();

        if (data.success) {
            return data.task_id;
        } else {
            showNotification(data.error, "danger");
            return null;
        }
    } catch (error) {
        showNotification('Ошибка сети при сохранении задания.', "danger");
        return null;
    }
}




