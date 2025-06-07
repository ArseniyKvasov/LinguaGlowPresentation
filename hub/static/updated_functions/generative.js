        // Переменные, общие для всего файла

const taskTypes = [
    { type: 'wordlist',         title: 'Список слов',            icon: 'bi-list' },
    { type: 'test',             title: 'Тест',                   icon: 'bi-check-circle' },
    { type: 'fillintheblanks',  title: 'Заполни пропуски',        icon: 'bi-pen' },
    { type: 'matchupthewords',  title: 'Соотнеси слова',         icon: 'bi-arrow-left-right' },
    { type: 'makeasentence',    title: 'Составь предложение',    icon: 'bi-text-paragraph' },
    { type: 'unscramble',       title: 'Собери слово',           icon: 'bi-puzzle' },
    { type: 'trueorfalse',      title: 'Правда или ложь',        icon: 'bi-check' },
    { type: 'audio',            title: 'Аудио',                  icon: 'bi-volume-up' },
    { type: 'essay',            title: 'Эссе',                   icon: 'bi-file-earmark-text' },
    { type: 'note',             title: 'Заметка',                icon: 'bi-sticky' },
    { type: 'image',            title: 'Картинка',               icon: 'bi-image' },
    { type: 'article',          title: 'Статья',                 icon: 'bi-newspaper' },
    { type: 'sortintocolumns',  title: 'Распредели по колонкам', icon: 'bi-layout-split' },
    { type: 'labelimages',      title: 'Подпиши картинку',       icon: 'bi-tag' },
    { type: 'embeddedtask',     title: 'Интеграция',             icon: 'bi-tag' }
];

const taskEditorContainer = document.getElementById('task-editor-container');








        // Отображение окна добавления и выбора типа задания
        
function createAddTaskButton() {
    const buttonWrapper = document.getElementById('add-task-button-wrapper');
    const selectorContainer = document.getElementById('task-selector-container');

    // Создание кнопки добавления задания
    const button = document.createElement('button');
    button.className = 'btn btn-outline-primary w-100 p-4 fs-5 fw-bold shadow-sm border-primary';
    button.innerHTML = '<i class="bi bi-plus-circle me-2"></i>Добавить задание';

    // Обработчик нажатия на кнопку
    button.addEventListener('click', () => {
        selectorContainer.innerHTML = '';

        // Создаем обертку для селектора
        const selectorWrapper = document.createElement('div');
        selectorWrapper.className = 'position-relative p-3 rounded shadow-sm bg-white';
        selectorWrapper.style.overflowY = 'auto';
        selectorWrapper.style.overflowX = 'hidden';

        // Создаем кнопку закрытия
        const closeButton = document.createElement('button');
        closeButton.className = 'btn-close btn-close-danger sticky-top ms-auto m-2 d-block';

        closeButton.setAttribute('aria-label', 'Закрыть');
        closeButton.addEventListener('click', () => {
            closeWindow();
        });

        selectorWrapper.appendChild(closeButton);
        selectorWrapper.appendChild(taskTypeSelector());

        selectorContainer.appendChild(selectorWrapper);
        selectorContainer.style.display = 'block';
        buttonWrapper.style.display = 'none';

        // *** Добавляем прокрутку к селектору ***
        setTimeout(() => {
            selectorContainer.scrollIntoView({
                behavior: 'smooth', // Плавная прокрутка
                block: 'center'
            });
        }, 100); // Небольшая задержка, чтобы DOM успел отрендерить элемент
    });

    buttonWrapper.appendChild(button);
}

function taskTypeSelector() {
    try {
        // Создаем основной контейнер селектора
        const container = document.createElement('div');
        container.className = 'container my-4';
    
        const row = document.createElement('div');
        row.className = 'row';
        container.appendChild(row);
    
        // Для каждого типа задания создаем карточку
        taskTypes.forEach(task => {
            const col = document.createElement('div');
            col.className = 'col-6 col-md-3 col-lg-2 mb-3';
    
            const card = document.createElement('div');
            card.className = 'card text-center h-100 bg-light border-primary';
            card.style.cursor = 'pointer';
            card.style.transition = 'transform 0.2s, box-shadow 0.2s, border-color 0.2s';
    
            // Hover эффекты
            card.addEventListener('mouseover', () => {
                card.style.transform = 'scale(1.05)';
                card.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                card.style.borderColor = 'var(--bs-success)';
            });
            card.addEventListener('mouseout', () => {
                card.style.transform = 'scale(1)';
                card.style.boxShadow = 'none';
                card.style.borderColor = 'var(--bs-primary)';
            });
    
            // При клике генерируем редактор задания
            card.addEventListener('click', () => {
                // Скрываем контейнер селектора
                closeWindow();
    
                const functionName = 'generate' + task.type.charAt(0).toUpperCase() + task.type.slice(1);
                if (typeof window[functionName] === 'function') {
                    const newContent = window[functionName]();
                    taskEditorContainer.appendChild(newContent);
                    taskEditorContainer.style.display = 'block';
                    taskEditorContainer.querySelector('.btn-close').addEventListener('click', () => {
                        closeWindow();
                    });
    
                    // Скрываем кнопку "Добавить задание"
                    document.getElementById('add-task-button-wrapper').style.display = 'none';
                } else {
                    throw new Error(`Функция ${functionName} не найдена.`);
                }
            });
    
            const cardBody = document.createElement('div');
            cardBody.className = 'card-body p-2';
    
            const icon = document.createElement('i');
            icon.className = `bi ${task.icon} fs-2 text-primary mb-2`;
    
            const title = document.createElement('h6');
            title.className = 'card-title mb-0';
            title.textContent = task.title;
    
            cardBody.appendChild(icon);
            cardBody.appendChild(title);
            card.appendChild(cardBody);
            col.appendChild(card);
            row.appendChild(col);
        });

        return container;
    } catch (error) {
        showNotification("Произошла ошибка при добавлении задания.", 'danger');
    }
}

function closeWindow() {
    taskEditorContainer.innerHTML = '';
    taskEditorContainer.style.display = 'none';

    const selectorContainer = document.getElementById('task-selector-container');
    if (selectorContainer) {
        selectorContainer.style.display = 'none';
    }

    const buttonWrapper = document.getElementById('add-task-button-wrapper');
    buttonWrapper.style.display = 'block';
}



        // Организация HTML-контейнеров

// Нужно создать 2-3 функции: createSomethingContainer (разметка HTML + функции обработки событий),
// Для каждого задания будут следующие элементы: task-title, task-save, task-generate (опционально)
// Также нужна валидация - убедиться, что пользователь добавил данные
// По умолчанию task-title должен быть заполнен кратко и на английском. Например, для списка слов будет написано Word List
// generateSomething (сбор данных, сохранение и инициализация задания),
// Здесь стоит избавиться от лишних обработчиков и оставить только сохранение, генерация ИИ (если есть)
// handleSomethingGeneration (try-catch, минимализация сложных проверок)
// editSomething (заполнение уже существующих данных)


function createWordlistContainer() {
    const container = document.createElement('div');
    container.className = 'wordlist-container p-3 border rounded';

    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <input type="text" id="task-title" class="form-control me-2" placeholder="Название" value="Список слов">
            <button class="btn btn-close" aria-label="Закрыть"></button>
        </div>
        <div id="generation-container"></div>
        <div id="wordlist-rows" class="mb-3"></div>
        <div class="d-flex gap-2 mb-2 justify-content-between">
            <button class="btn border-0 text-primary fw-bold" id="wordlist-add-row" title="Добавить пару">
                <i class="bi bi-plus-lg"></i>
            </button>
            <div class="d-flex gap-2 flex-wrap justify-content-end">
                <button class="btn btn-primary" id="task-generate" title="Сгенерировать">
                    <i class="bi bi-lightning-charge"></i>
                </button>
                <button class="btn btn-success" id="task-save" title="Сохранить">
                    <i class="bi bi-check-lg"></i>
                </button>
            </div>
        </div>
    `;

    const rowsContainer = container.querySelector('#wordlist-rows');

    // Добавим первую строку правильно через addRow
    addRow('', '', '', container);

    container.querySelector('#wordlist-add-row').addEventListener('click', () => {
        addRow('', '', '', container);
    });

    container.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault();
            addRow('', '', '', container);
            const newRow = container.querySelector('#wordlist-rows').lastElementChild;
            const newWordInput = newRow.querySelector('.word-input');
            newWordInput.focus();
        }
    });

    rowsContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.remove-row');
        if (btn) {
            btn.closest('.wordlist-row').remove();
            updateRemoveButtons();
        }
    });

    rowsContainer.addEventListener('paste', (e) => handlePasteEvent(container, e));

    container.getData = function() {
        return {
            title: container.querySelector('#task-title').value.trim(),
            words: Array.from(rowsContainer.querySelectorAll('.wordlist-row')).map(row => ({
                word: row.querySelector('.word-input').value.trim(),
                translation: row.querySelector('.translation-input').value.trim()
            })).filter(item => item.word && item.translation)
        };
    };

    return container;
}

function createMatchUpTheWordsContainer() {
    const container = document.createElement('div');
    container.className = 'match-up-the-words-container p-3 border rounded';

    // Заголовок с полем для названия и кнопкой закрытия
    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <input type="text" id="task-title" class="form-control me-2" placeholder="Название" value="Сопоставь пары карточек">
            <button class="btn btn-close" aria-label="Закрыть"></button>
        </div>
        <div id="generation-container"></div>
        <div id="wordlist-rows" class="mb-3"></div>
        <div class="d-flex gap-2 mb-2 justify-content-between">
            <button class="btn btn-outline-secondary" id="wordlist-add-row" title="Добавить пару">
                <i class="bi bi-plus-lg"></i>
            </button>
            <div class="d-flex gap-2 flex-wrap justify-content-end">
                <button class="btn btn-warning text-white" id="task-fill" title="Заполнить">
                    <i class="bi bi-clipboard-plus"></i>
                </button>
                <button class="btn btn-primary" id="task-generate" title="Сгенерировать">
                    <i class="bi bi-lightning-charge"></i>
                </button>
                <button class="btn btn-success" id="task-save" title="Сохранить">
                    <i class="bi bi-check-lg"></i>
                </button>
            </div>
        </div>
    `;

    // Добавляем базовые обработчики
    const rowsContainer = container.querySelector('#wordlist-rows');

    addRow('', '', 'Match', container);

    // Обработчик добавления строк
    container.querySelector('#wordlist-add-row').addEventListener('click', () => {
        addRow('', '', 'Match', container);
    });

    // Обработчик удаления строк
    rowsContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.remove-row');
        if (btn) {
            btn.closest('.wordlist-row').remove();
            updateRemoveButtons();
        }
    });

    // Обработчик вставки данных
    rowsContainer.addEventListener('paste', (e) => handlePasteEvent(container, e));

    // Метод для получения данных
    container.getData = function() {
        const rows = Array.from(rowsContainer.querySelectorAll('.wordlist-row'));
        const pairs = rows.map(row => ({
            card1: row.querySelector('.word-input').value.trim(),
            card2: row.querySelector('.translation-input').value.trim()
        })).filter(item => item.card1 && item.card2);

        return {
            title: container.querySelector('#task-title').value.trim(),
            pairs: pairs
        };
    };

    return container;
}

function createFillInTheBlanksContainer() {
    const container = document.createElement('div');
    container.className = 'fill-in-the-blanks-container p-3 border rounded';

    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <input type="text" id="task-title" class="form-control me-2" placeholder="Название" value="Заполни пропуски">
            <button class="btn btn-close" aria-label="Закрыть"></button>
        </div>
        <div id="generation-container" class="mb-3"></div>
        <div class="mb-3">
            <label class="form-label me-2">Тип задания:</label>
            <select id="fill-type" class="form-select d-inline-block w-auto">
                <option value="withList">Со списком</option>
                <option value="withoutList">Без списка</option>
            </select>
        </div>
        <div class="mb-3">
            <div id="fill-textarea" contenteditable="true" class="form-control"></div>
        </div>
        <div class="d-flex gap-2 justify-content-end">
            <button class="btn btn-primary" id="task-generate" title="Сгенерировать">
                <i class="bi bi-lightning-charge"></i>
            </button>
            <button class="btn btn-success" id="task-save" title="Сохранить">
                <i class="bi bi-check-lg"></i>
            </button>
        </div>
    `;

    // Настройка textarea с автоматическим изменением высоты
    const textarea = container.querySelector('#fill-textarea');
    textarea.addEventListener('input', () => {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    });
    enhanceTextarea(textarea);

    // Метод для получения данных
    container.getData = function() {
        return {
            title: container.querySelector('#task-title').value.trim(),
            display_format: container.querySelector('#fill-type').value,
            text: container.querySelector('#fill-textarea').innerHTML.trim()
        };
    };

    return container;
}

function createNoteContainer() {
    const container = document.createElement('div');
    container.className = 'note-container p-3 border rounded';

    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <input type="text" id="task-title" class="form-control me-2" placeholder="Заголовок заметки" value="Заметка">
            <button class="btn btn-close" aria-label="Close"></button>
        </div>
        <div id="note-generation-container" class="mb-3"></div>
        <div class="mb-3">
            <div id="note-content" contenteditable="true" class="form-control note-content"
                 placeholder="Введите текст"></div>
        </div>
        <div class="d-flex gap-2 justify-content-end">
            <button class="btn btn-primary" id="task-generate" title="Сгенерировать заметку">
                <i class="bi bi-magic"></i>
            </button>
            <button class="btn btn-success" id="task-save" title="Сохранить">
                <i class="bi bi-check-lg"></i>
            </button>
        </div>
    `;

    // Настройка автоматического изменения высоты текстового поля
    const contentEditable = container.querySelector('#note-content');
    contentEditable.addEventListener('input', () => {
        contentEditable.style.height = 'auto';
        contentEditable.style.height = contentEditable.scrollHeight + 'px';
    });
    enhanceTextarea(contentEditable);

    // Метод для получения данных
    container.getData = function() {
        return {
            title: container.querySelector('#task-title').value.trim(),
            content: container.querySelector('#note-content').innerHTML.trim()
        };
    };

    return container;
}

function createArticleContainer() {
    const container = document.createElement('div');
    container.className = 'article-container p-3 border rounded';

    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <input type="text" id="task-title" class="form-control me-2" placeholder="Заголовок статьи">
            <button class="btn btn-close" aria-label="Close"></button>
        </div>
        <div id="article-generation-container" class="mb-3"></div>
        <div class="mb-3">
            <div id="article-content" contenteditable="true" class="form-control article-content"
                 placeholder="Введите текст статьи"></div>
        </div>
        <div class="d-flex gap-2 justify-content-end">
            <button class="btn btn-primary" id="task-generate" title="Сгенерировать статью">
                <i class="bi bi-magic"></i>
            </button>
            <button class="btn btn-success" id="task-save" title="Сохранить">
                <i class="bi bi-check-lg"></i>
            </button>
        </div>
    `;

    // Auto-resize textarea
    const contentEditable = container.querySelector('#article-content');
    contentEditable.addEventListener('input', () => {
        contentEditable.style.height = 'auto';
        contentEditable.style.height = contentEditable.scrollHeight + 'px';
    });
    enhanceTextarea(contentEditable);

    // Data getter method
    container.getData = function() {
        return {
            title: container.querySelector('#task-title').value.trim(),
            content: container.querySelector('#article-content').innerHTML.trim()
        };
    };

    return container;
}

function createTestContainer() {
    const container = document.createElement('div');
    container.className = 'test-container p-3 border rounded';

    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <input type="text" id="task-title" class="form-control me-2" placeholder="Название теста" value="Выбери правильный ответ">
            <button class="btn btn-close" aria-label="Close"></button>
        </div>
        <div id="generation-container" class="mb-3"></div>
        <div id="test-questions" class="mb-3"></div>
        <div class="d-flex gap-2 justify-content-between">
            <button class="btn btn-outline-secondary" id="add-question-btn">
                <i class="bi bi-plus-lg"></i>
            </button>
            <div class="d-flex gap-2">
                <button class="btn btn-primary" id="task-generate" title="Сгенерировать задание">
                    <i class="bi bi-lightning-charge"></i>
                </button>
                <button class="btn btn-success" id="task-save" title="Сохранить">
                    <i class="bi bi-check-lg"></i>
                </button>
            </div>
        </div>
    `;

    const questionsContainer = container.querySelector('#test-questions');

    // Question management event delegation
    questionsContainer.addEventListener('click', (e) => {
        const target = e.target;

        // Remove question
        if (target.closest('.remove-question-btn')) {
            const questionElement = target.closest('.question-container');
            if (document.querySelectorAll('.question-container').length > 1) {
                questionElement.remove();
            } else {
                showNotification('Test must contain at least one question', 'warning');
            }
        }

        // Remove answer
        if (target.closest('.remove-answer-btn')) {
            const answerElement = target.closest('.answer-row');
            const answersContainer = answerElement.closest('.answers-container');
            if (answersContainer.querySelectorAll('.answer-row').length > 1) {
                answerElement.remove();
            } else {
                showNotification('Question must contain at least one answer', 'warning');
            }
        }

        // Add answer
        if (target.closest('.add-answer-btn')) {
            const questionElement = target.closest('.question-container');
            if (questionElement) {
                const answersContainer = questionElement.querySelector('.answers-container');
                if (answersContainer) {
                    addAnswer(answersContainer);
                }
            }
        }
    });

    // Add question button handler
    container.querySelector('#add-question-btn').addEventListener('click', () => {
        addQuestion(questionsContainer);
    });

    // Data collection method
    container.getData = function() {
        const title = container.querySelector('#task-title').value.trim();
        const questions = [];

        container.querySelectorAll('.question-container').forEach(questionElement => {
            const questionText = questionElement.querySelector('.question-text').value.trim();
            if (!questionText) return;

            const answers = [];
            let hasCorrectAnswer = false;

            questionElement.querySelectorAll('.answer-row').forEach(answerElement => {
                const answerText = answerElement.querySelector('.answer-text').value.trim();
                if (!answerText) return;

                const isCorrect = answerElement.querySelector('.correct-answer-checkbox').checked;
                if (isCorrect) hasCorrectAnswer = true;

                answers.push({
                    text: answerText,
                    is_correct: isCorrect
                });
            });

            if (answers.length > 0 && hasCorrectAnswer) {
                questions.push({
                    text: questionText,
                    answers: answers
                });
            }
        });

        return { title, questions };
    };

    return container;
}

function createTrueFalseContainer() {
    const container = document.createElement('div');
    container.className = 'truefalse-container p-3 border rounded';

    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <input type="text" id="task-title" class="form-control me-2" placeholder="Заголовок задания" value="Правда или ложь">
            <button class="btn btn-close" aria-label="Close"></button>
        </div>
        <div id="generation-container" class="mb-3"></div>
        <div id="truefalse-statements" class="mb-3"></div>
        <div class="d-flex gap-2 justify-content-between">
            <button class="btn btn-outline-secondary" id="add-statement-btn">
                <i class="bi bi-plus-lg"></i>
            </button>
            <div class="d-flex gap-2">
                <button class="btn btn-primary" id="task-generate" title="Сгенерировать задание">
                    <i class="bi bi-lightning-charge"></i>
                </button>
                <button class="btn btn-success" id="task-save" title="Сохранить">
                    <i class="bi bi-check-lg"></i>
                </button>
            </div>
        </div>
    `;

    const statementsContainer = container.querySelector('#truefalse-statements');

    // Add first statement by default
    addStatement(statementsContainer);

    // Event delegation for statement management
    statementsContainer.addEventListener('click', (e) => {
        if (e.target.closest('.remove-statement-btn')) {
            const statementElement = e.target.closest('.statement-row');
            if (statementsContainer.querySelectorAll('.statement-row').length > 1) {
                statementElement.remove();
            } else {
                showNotification('Должно остаться как минимум одно утверждение', 'warning');
            }
        }
    });

    // Add statement button handler
    container.querySelector('#add-statement-btn').addEventListener('click', () => {
        addStatement(statementsContainer);
    });

    // Data collection method
    container.getData = function() {
        const title = container.querySelector('#task-title').value.trim();
        const statements = [];

        container.querySelectorAll('.statement-row').forEach(row => {
            const text = row.querySelector('.statement-text').value.trim();
            const isTrue = row.querySelector('.statement-select').value === 'true';

            if (text) {
                statements.push({
                    text: text,
                    is_true: isTrue
                });
            }
        });

        return { title, statements };
    };

    return container;
}

function createUnscrambleContainer() {
    const container = document.createElement('div');
    container.className = 'unscramble-container p-3 border rounded';

    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <input type="text" id="task-title" class="form-control me-2" placeholder="Составь слова" value="Составь слова">
            <button class="btn btn-close" aria-label="Close"></button>
        </div>
        <div id="generation-container" class="mb-3"></div>
        <div id="unscramble-cards" class="mb-3"></div>
        <div class="d-flex gap-2 justify-content-between">
            <button class="btn btn-outline-secondary" id="add-card-btn" title="Добавить блок">
                <i class="bi bi-plus-lg"></i>
            </button>
            <div class="d-flex gap-2">
                <button class="btn btn-warning text-white" id="task-fill" title="Заполнить">
                    <i class="bi bi-clipboard-plus"></i>
                </button>
                <button class="btn btn-success" id="task-save" title="Сохранить">
                    <i class="bi bi-check-lg"></i>
                </button>
            </div>
        </div>
    `;

    const cardsContainer = container.querySelector('#unscramble-cards');

    // Add first card by default
    addUnscrambleCard(container);

    // Event delegation for card management
    cardsContainer.addEventListener('click', (e) => {
        // Remove card
        if (e.target.closest('.remove-card-btn')) {
            const card = e.target.closest('.unscramble-card');
            if (cardsContainer.querySelectorAll('.unscramble-card').length > 1) {
                card.remove();
            } else {
                showNotification('Должно остаться как минимум одно слово', 'warning');
            }
        }

        // Add hint
        if (e.target.closest('.add-hint-btn')) {
            const card = e.target.closest('.unscramble-card');
            if (card && !card.querySelector('.hint-input')) {
                addHintInput(card);
            }
        }
    });

    // Add card button handler
    container.querySelector('#add-card-btn').addEventListener('click', () => {
        addUnscrambleCard(container);
    });

    // Data collection method
    container.getData = function() {
        const title = container.querySelector('#task-title').value.trim();
        const words = [];

        container.querySelectorAll('.unscramble-card').forEach(card => {
            const wordInput = card.querySelector('.word-input');
            const word = wordInput ? wordInput.value.trim() : '';

            if (word) {
                const hintInput = card.querySelector('.hint-input');
                const hint = hintInput ? hintInput.value.trim() : '';

                const visibleSpace = '⎵'; // Можно заменить на другой символ при желании

                words.push({
                    word: word.replace(/ /g, visibleSpace),
                    shuffled_word: shuffleString(word).replace(/ /g, visibleSpace),
                    hint: hint
                });
            }
        });

        return { title, words };
    };

    return container;
}

function createSentenceContainer() {
    const container = document.createElement('div');
    container.className = 'sentence-container p-3 border rounded mb-3';

    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <input type="text" id="task-title" class="form-control me-2"
                   placeholder="Название задания" value="Составь предложение">
            <button class="btn btn-close" aria-label="Закрыть"></button>
        </div>
        <div id="generation-container" class="mb-3"></div>
        <div id="sentence-cards" class="mb-3"></div>
        <div class="d-flex justify-content-between mt-3">
            <button class="btn btn-outline-secondary" id="add-card-btn">
                <i class="bi bi-plus-lg"></i>
            </button>
            <div class="d-flex gap-2">
                <button class="btn btn-primary" id="task-generate" title="Сгенерировать задание">
                    <i class="bi bi-magic"></i>
                </button>
                <button class="btn btn-success" id="task-save" title="Сохранить">
                    <i class="bi bi-check-lg"></i>
                </button>
            </div>
        </div>
    `;

    const cardsContainer = container.querySelector('#sentence-cards');

    // Добавление первой карточки по умолчанию
    addSentenceCard(cardsContainer);

    // Обработчик закрытия контейнера
    container.querySelector('.btn-close').addEventListener('click', () => {
        container.remove();
    });

    // Обработчик добавления карточки
    container.querySelector('#add-card-btn').addEventListener('click', () => {
        addSentenceCard(cardsContainer);
    });

    // Делегирование событий для удаления карточек
    cardsContainer.addEventListener('click', (e) => {
        if (e.target.closest('.remove-card-btn')) {
            const card = e.target.closest('.sentence-card');
            if (cardsContainer.querySelectorAll('.sentence-card').length > 1) {
                card.remove();
            } else {
                showNotification('Должно остаться хотя бы одно предложение', 'warning');
            }
        }
    });

    // Метод для сбора данных
    container.getData = function() {
        const title = container.querySelector('#task-title').value.trim();
        const sentences = [];

        container.querySelectorAll('.sentence-card').forEach(card => {
            const input = card.querySelector('.sentence-input');
            const correct = input.value.trim();

            if (correct) {
                const words = correct.split(' ');
                let shuffled = shuffleSentence(words);

                sentences.push({
                    correct: correct,
                    shuffled: shuffled.join(' ')
                });
            }
        });

        return { title, sentences };
    };

    return container;
}

function createEssayContainer() {
    const container = document.createElement('div');
    container.className = 'essay-container p-3 border rounded mb-3';

    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <input type="text" id="task-title" class="form-control me-2"
                   placeholder="Заголовок эссе">
            <button class="btn btn-close"></button>
        </div>
        <div id="generation-container" class="mb-3"></div>
        <div id="criteria-container" class="mb-3"></div>
        <div class="d-flex justify-content-between">
            <button class="btn btn-outline-secondary" id="add-criteria-btn">
                <i class="bi bi-plus-lg"></i>
            </button>
            <div class="d-flex gap-2">
                <button class="btn btn-primary" id="task-generate" title="Сгенерировать задание">
                    <i class="bi bi-magic"></i>
                </button>
                <button class="btn btn-success" id="task-save" title="Сохранить">
                    <i class="bi bi-check-lg"></i>
                </button>
            </div>
        </div>
    `;

    const criteriaContainer = container.querySelector('#criteria-container');

    // Обработчики
    container.querySelector('.btn-close').addEventListener('click', () => container.remove());
    container.querySelector('#add-criteria-btn').addEventListener('click', () => {
        addEssayCriteria(criteriaContainer);
    });

    criteriaContainer.addEventListener('click', (e) => {
        if (e.target.closest('.btn-close')) {
            const item = e.target.closest('.criteria-item');
            item.remove();
        }
    });

    // Добавление первой строки по умолчанию
    addEssayCriteria(criteriaContainer);

    // Метод сбора данных
    container.getData = function () {
        const title = container.querySelector('#task-title').value.trim();
        const conditions = Array.from(criteriaContainer.querySelectorAll('.criteria-item')).map(item => ({
            text: item.querySelector('.criteria-text').value.trim(),
            points: parseInt(item.querySelector('.criteria-points').value) || 0
        }));

        return { title, conditions };
    };

    return container;
}

function createImageTaskContainer() {
    const container = document.createElement('div');
    container.className = 'task-container image-container p-3 border rounded mb-3';

    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <input type="text" class="form-control me-2 task-title" placeholder="Название задания">
            <button class="btn btn-close"></button>
        </div>

        <div class="image-upload-area border rounded p-4 text-center mb-3">
            <div class="upload-content">
                <i class="bi bi-image fs-1 text-muted"></i>
                <div class="mt-2">Перетащите изображение или нажмите для загрузки</div>
                <input type="file" class="d-none" accept="image/*">
            </div>
            <div class="image-preview mt-3"></div>
        </div>

        <div class="image-search mb-3">
            <div class="input-group">
                <input type="text" class="form-control search-query" placeholder="Поиск изображений...">
                <button class="btn btn-outline-secondary search-button"><i class="bi bi-search"></i></button>
            </div>
            <div class="search-results row row-cols-4 g-2 mt-2"></div>
        </div>

        <div class="d-flex justify-content-between mt-3">
            <button class="btn btn-outline-secondary task-generate" title="Сгенерировать">
                <i class="bi bi-magic"></i>
            </button>
            <button class="btn btn-success task-save" title="Сохранить">
                <i class="bi bi-check-lg"></i>
            </button>
        </div>
    `;

    const fileInput = container.querySelector('input[type="file"]');
    const uploadArea = container.querySelector('.image-upload-area');
    const preview = container.querySelector('.image-preview');
    const searchBtn = container.querySelector('.search-button');
    const searchInput = container.querySelector('.search-query');
    const searchResults = container.querySelector('.search-results');

    fileInput.addEventListener('change', handleFileUpload);
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });
    uploadArea.addEventListener('dragleave', (e) => {
        if (!uploadArea.contains(e.relatedTarget)) {
            uploadArea.classList.remove('drag-over');
        }
    });
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (files[0]?.type.startsWith('image/')) {
            fileInput.files = files;
            handleFileUpload();
        }
    });
    searchBtn.addEventListener('click', handleImageSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleImageSearch();
        }
    });
    container.querySelector('.btn-close').addEventListener('click', () => container.remove());

    function handleFileUpload() {
        const file = fileInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.innerHTML = `<img src="${e.target.result}" class="img-fluid rounded" alt="Превью">`;
                delete container.dataset.imageUrl;
            };
            reader.readAsDataURL(file);
        }
    }

    async function handleImageSearch() {
        const query = searchInput.value.trim();
        if (!query) return;
        searchBtn.disabled = true;

        try {
            const response = await fetch('/search-images/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken'),
                },
                body: JSON.stringify({ query })
            });

            const data = await response.json();
            searchBtn.disabled = false;

            if (data.images) {
                searchResults.innerHTML = data.images.map(img => `
                    <div class="col">
                        <div class="image-result-card h-100">
                            <img src="${img.url}" class="img-fluid rounded cursor-pointer" data-url="${img.url}" alt="${img.title}">
                        </div>
                    </div>
                `).join('');

                searchResults.querySelectorAll('img').forEach(img => {
                    img.addEventListener('click', () => {
                        preview.innerHTML = `<img src="${img.src}" class="img-fluid rounded" alt="Выбранное изображение">`;
                        container.dataset.imageUrl = img.dataset.url;
                        searchResults.innerHTML = '';
                    });
                });
            }
        } catch (error) {
            console.error('Ошибка поиска изображений:', error);
            searchBtn.disabled = false;
        }
    }

    return container;
}

function createLabelImagesContainer() {
    const container = document.createElement('div');
    container.className = 'label-images-container p-3 border rounded mb-3';

    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <input type="text" id="task-title" class="form-control me-2"
                   placeholder="Название задания" value="Подпиши изображения">
            <button class="btn btn-close" aria-label="Закрыть"></button>
        </div>

        <div id="generation-container" class="mb-3"></div>

        <div class="image-upload-area border rounded p-4 text-center mb-3 position-relative">
            <div class="upload-content">
                <i class="bi bi-images fs-1 text-muted"></i>
                <div class="mt-2">Перетащите изображения или нажмите для загрузки</div>
                <input type="file" id="image-upload-input" class="d-none" accept="image/*" multiple>
            </div>
        </div>

        <div class="image-search mb-3">
            <div class="input-group">
                <input type="text" class="form-control search-query" placeholder="Поиск изображений...">
                <button class="btn btn-outline-secondary search-button">
                    <i class="bi bi-search"></i>
                </button>
            </div>
            <div class="search-results row row-cols-2 row-cols-md-4 g-2 mt-2"></div>
        </div>

        <div class="images-list mb-3">
            <div class="images-grid row row-cols-1 row-cols-md-2 row-cols-lg-4 d-flex justify-content-center"></div>
        </div>

        <div class="d-flex justify-content-end gap-2">
            <button class="btn btn-success" id="task-save" title="Сохранить">
                <i class="bi bi-check-lg"></i>
            </button>
        </div>
    `;

    // Элементы интерфейса
    const uploadArea = container.querySelector('.image-upload-area');
    const fileInput = container.querySelector('#image-upload-input');
    const imagesGrid = container.querySelector('.images-grid');
    const searchInput = container.querySelector('.search-query');
    const searchBtn = container.querySelector('.search-button');
    const searchResults = container.querySelector('.search-results');

    // Обработчики событий
    fileInput.addEventListener('change', handleFilesUpload);
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('drop', handleFilesDrop);
    searchBtn.addEventListener('click', handleImageSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleImageSearch();
    });
    container.querySelector('.btn-close').addEventListener('click', () => container.remove());

    // Функции обработки
    function handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.add('bg-light');
    }

    function handleFilesDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('bg-light');
        handleFiles(e.dataTransfer.files);
    }

    function handleFilesUpload() {
        handleFiles(fileInput.files);
    }

    function handleFiles(files) {
        const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
        if (imageFiles.length === 0) {
            showNotification('Пожалуйста, выберите только изображения', 'warning');
            return;
        }

        imageFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                createImageItemElement(e.target.result, file.name.replace(/\.[^/.]+$/, ""));
            };
            reader.readAsDataURL(file);
        });
    }

    async function handleImageSearch() {
        const query = searchInput.value.trim();
        if (!query) {
            showNotification('Введите поисковый запрос', 'warning');
            return;
        }

        searchBtn.disabled = true;
        try {
            const response = await fetch("/search-images/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCookie("csrftoken"),
                },
                body: JSON.stringify({ query: query }),
            });

            if (!response.ok) throw new Error('Ошибка сервера');

            const data = await response.json();
            if (!data.images || !Array.isArray(data.images)) {
                throw new Error('Неверный формат ответа');
            }

            if (data.images.length === 0) {
                showNotification('Изображения не найдены', 'warning');
                return;
            }

            searchResults.innerHTML = data.images.map(img => `
                <div class="col image-square">
                    <img src="${escapeHtml(img.url)}" class="img-fluid rounded cursor-pointer"
                         data-url="${escapeHtml(img.url)}" alt="${escapeHtml(img.title || '')}">
                </div>
            `).join('');

            searchResults.querySelectorAll('img').forEach(img => {
                img.addEventListener('click', () => {
                    createImageItemElement(img.dataset.url, query);
                    searchResults.innerHTML = '';
                    searchInput.value = '';
                    searchInput.focus();
                });
            });

        } catch (error) {
            console.error('Ошибка поиска изображений:', error);
            showNotification('Ошибка при поиске изображений', 'danger');
        } finally {
            searchBtn.disabled = false;
        }
    }

    // Метод для получения данных
    container.getData = function() {
        const title = container.querySelector('#task-title').value.trim();
        const images = [];

        container.querySelectorAll('.image-item').forEach(item => {
            const img = item.querySelector('img');
            const label = item.querySelector('.caption-input').value.trim();

            if (img && img.src) {
                images.push({
                    url: img.src,
                    label: label
                });
            }
        });

        return { title, images };
    };

    return container;
}

function createSortintocolumnsContainer() {
    const container = document.createElement('div');
    container.className = 'sort-columns-container p-3 border rounded mb-3';

    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <input type="text" id="task-title" class="form-control me-2"
                   placeholder="Название задания" value="Распределите по колонкам">
            <button class="btn btn-close" aria-label="Закрыть"></button>
        </div>
        <div id="generation-container" class="mb-3"></div>
        <div class="columns-container mb-3 row g-3 d-flex justify-content-center"></div>
        <div class="d-flex justify-content-between">
            <button class="btn btn-outline-secondary" id="add-column-btn">
                <i class="bi bi-plus-lg"></i>
            </button>
            <div class="d-flex gap-2">
                <button class="btn btn-primary" id="task-generate" title="Сгенерировать задание">
                    <i class="bi bi-lightning-charge"></i>
                </button>
                <button class="btn btn-success" id="task-save" title="Сохранить">
                    <i class="bi bi-check-lg"></i>
                </button>
            </div>
        </div>
    `;

    const columnsContainer = container.querySelector('.columns-container');

    // Удаление задания
    container.querySelector('.btn-close').addEventListener('click', () => {
        container.remove();
    });

    // Добавление колонки
    container.querySelector('#add-column-btn').addEventListener('click', () => {
        columnsContainer.appendChild(createColumnElement());
    });

    // Добавление первой колонки по умолчанию
    columnsContainer.appendChild(createColumnElement());

    // Метод для получения данных
    container.getData = function() {
        const title = container.querySelector('#task-title').value.trim();
        const columns = [];

        container.querySelectorAll('.column-card').forEach(card => {
            const columnName = card.querySelector('.column-name').value.trim();
            const words = [];

            card.querySelectorAll('.word-input').forEach(input => {
                const val = input.value.trim();
                if (val) words.push(val);
            });

            if (columnName && words.length > 0) {
                columns.push({
                    name: columnName,
                    words: words
                });
            }
        });

        return { title, columns };
    };

    return container;
}

function createAudioContainer() {
    const container = document.createElement('div');
    container.className = 'audio-container p-3 border rounded mb-3';

    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <input type="text" id="task-title" class="form-control me-2"
                   placeholder="Название аудио">
            <button class="btn btn-close"></button>
        </div>
        <div id="generation-container" class="mb-3"></div>
        <div class="audio-upload-area border rounded p-4 text-center mb-3">
            <div class="upload-content">
                <i class="bi bi-music-note-beamed fs-1 text-muted"></i>
                <div class="mt-2">Перетащите аудиофайл или нажмите для загрузки</div>
                <input type="file" class="d-none" accept="audio/*">
            </div>
        </div>

        <div class="audio-preview my-3"></div>

        <!-- Текстовое поле для транскрипта -->
        <div class="mb-3">
            <textarea id="audio-transcript" class="form-control" rows="4" placeholder="Введите транскрипт"></textarea>
        </div>

        <div class="d-flex justify-content-end gap-2">
            <button class="btn border-0" id="task-speak" title="Озвучить текст">
                <i class="bi bi-play bi-lg"></i>
            </button>
            <button class="btn btn-primary" id="task-generate" title="Сгенерировать задание">
                <i class="bi bi-lightning-charge"></i>
            </button>
            <button class="btn btn-success" id="task-save">
                <i class="bi bi-check-lg"></i>
            </button>
        </div>
    `;

    const uploadArea = container.querySelector('.audio-upload-area');
    const fileInput = container.querySelector('input[type="file"]');
    const preview = container.querySelector('.audio-preview');

    fileInput.addEventListener('change', handleFileUpload);
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleFileDrop);
    container.querySelector('.btn-close').addEventListener('click', () => container.remove());

    function handleDragOver(e) {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    }

    function handleDragLeave(e) {
        if (!uploadArea.contains(e.relatedTarget)) {
            uploadArea.classList.remove('drag-over');
        }
    }

    function handleFileDrop(e) {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (files[0]?.type.startsWith('audio/')) {
            fileInput.files = files;
            handleFileUpload();
        }
    }

    function handleFileUpload() {
        const file = fileInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.innerHTML = `
                    <audio controls class="w-100">
                        <source src="${e.target.result}" type="${file.type}">
                        Ваш браузер не поддерживает воспроизведение аудио.
                    </audio>
                `;
                setupModernAudioPlayer(preview.querySelector('audio'));
            };
            reader.readAsDataURL(file);
        }
    }

    container.getData = function() {
        const audioPreview = container.querySelector('.audio-preview audio');
        const transcript = container.querySelector('#audio-transcript').value.trim();

        // Приоритеты: 1) Blob URL (новое сгенерированное), 2) загруженный файл, 3) сохраненный URL
        let audioUrl = container.dataset.audioBlobUrl ||
                      (audioPreview?.querySelector('source')?.src?.startsWith('data:') ?
                       audioPreview.querySelector('source').src : null) ||
                      container.dataset.audioUrl;

        return {
            title: container.querySelector('#task-title').value.trim(),
            audio_url: audioUrl,
            transcript: transcript
        };
    };

    return container;
}

function createEmbeddedTaskContainer() {
    const container = document.createElement('div');
    container.className = 'embeddedtask-container p-3 border rounded';

    // Заголовок с полем для названия и кнопкой закрытия
    const headerDiv = document.createElement('div');
    headerDiv.className = 'd-flex justify-content-between align-items-center mb-3';
    headerDiv.innerHTML = `
        <input type="text" id="task-title" class="form-control me-2" placeholder="Название задания">
        <button class="btn btn-close" aria-label="Закрыть"></button>
    `;
    container.appendChild(headerDiv);

    // Поле для ввода embed-кода + знак вопроса
    const embedCodeDiv = document.createElement('div');
    embedCodeDiv.className = 'mb-2 position-relative';
    embedCodeDiv.innerHTML = `
        <label class="form-label d-flex align-items-center">
            Встроенный код
            <i class="bi bi-question-circle-fill ms-2 text-primary"
               style="cursor: pointer;"
               data-bs-toggle="tooltip"
               data-bs-placement="top"
               title="Где взять код?"
               onclick="embedInstructions()"></i>
        </label>
        <textarea id="embeddedtask-embed-code" class="form-control" placeholder="Вставьте встроенный HTML-код, например с YouTube, Wordwall и др."></textarea>
    `;
    container.appendChild(embedCodeDiv);

    // Отображение поддерживаемых платформ
    const supportedDiv = document.createElement('div');
    supportedDiv.className = 'mb-4';
    supportedDiv.innerHTML = `
        <small class="text-muted">
            Поддерживаются:
            <span class="badge bg-light text-dark me-1"><i class="bi bi-youtube me-1 text-danger"></i>YouTube</span>
            <span class="badge bg-light text-dark me-1"><i class="bi bi-grid-3x3-gap-fill me-1 text-success"></i>Wordwall</span>
            <span class="badge bg-light text-dark me-1"><i class="bi bi-columns-gap me-1 text-info"></i>Miro</span>
            <span class="badge bg-light text-dark me-1"><i class="bi bi-lightbulb me-1 text-warning"></i>Quizlet</span>
            <span class="badge bg-light text-dark me-1"><i class="bi bi-app-indicator me-1 text-primary"></i>LearningApps</span>
            <span class="badge bg-light text-dark me-1"><i class="bi bi-film me-1 text-secondary"></i>Rutube</span>
        </small>
    `;
    container.appendChild(supportedDiv);

    // Кнопки управления
    const footerDiv = document.createElement('div');
    footerDiv.className = 'd-flex gap-2 justify-content-end';
    footerDiv.innerHTML = `
        <button class="btn btn-success" id="task-save" title="Сохранить">
            <i class="bi bi-check-lg"></i>
        </button>
    `;
    container.appendChild(footerDiv);

    // Метод для получения данных
    container.getData = function() {
        return {
            title: container.querySelector('#task-title').value.trim(),
            embed_code: container.querySelector('#embeddedtask-embed-code').value.trim()
        };
    };

    // Инициализация тултипов Bootstrap
    setTimeout(() => {
        const tooltipTriggerList = [].slice.call(container.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.forEach(el => new bootstrap.Tooltip(el));
    }, 0);

    return container;
}
















        // Отображение окна создания конкретного типа задания

function generateWordlist(taskId = '') {
    const container = createWordlistContainer();
    const editMode = !!taskId;

    // Обработчик сохранения
    container.querySelector('#task-save').addEventListener('click', () => {
        const data = container.getData();
        if (!validateData(data)) return;

        saveTaskWithData(container, {
            taskType: 'WordList',
            taskId,
            editMode
        }, data);
    });

    // Обработчик генерации
    container.querySelector('#task-generate').addEventListener('click', async () => {
        container.querySelector('#task-generate').style.display = 'none';
        const generationWindow = await initializeGenerationWindow("WordList", ["context", "quantity", "query"]);
        container.querySelector('#generation-container').appendChild(generationWindow);
        generationWindow.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    // Валидация данных
    function validateData(data) {
        if (data.words.length < 3) {
            showNotification('Добавьте минимум 3 пары слов', "warning");
            return false;
        }
        return true;
    }

    return container;
}

function generateMatchupthewords(taskId = '') {
    const container = createMatchUpTheWordsContainer();
    const editMode = !!taskId;

    // Обработчик сохранения
    container.querySelector('#task-save').addEventListener('click', () => {
        const data = container.getData();
        if (!validateData(data)) return;

        saveTaskWithData(container, {
            taskType: 'MatchUpTheWords',
            taskId,
            editMode
        }, data);
    });

    // Обработчик генерации
    container.querySelector('#task-generate').addEventListener('click', async () => {
        container.querySelector('#task-generate').style.display = 'none';
        const generationWindow = await initializeGenerationWindow("MatchUpTheWords", ["context", "quantity", "matchType", "query"]);
        container.querySelector('#generation-container').appendChild(generationWindow);
        generationWindow.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    // Обработчик заполнения
    container.querySelector('#task-fill').addEventListener('click', async() => {
        const pairs = await getWordListsFromContext();

        if (pairs) {
            pairs.forEach(pair => {
                addRow(pair.word, pair.translation);
            });
            removeEmptyLines();
        }
    });

    // Валидация данных
    function validateData(data) {
        // Проверка минимального количества пар
        if (data.pairs.length < 3) {
            showNotification('Добавьте минимум 3 пары карточек', "warning");
            return false;
        }

        // Проверка на уникальность слов и переводов
        const words = new Set(); // Для хранения уникальных слов (card1)
        const translations = new Set(); // Для хранения уникальных переводов (card2)
        const pairsSet = new Set(); // Для хранения уникальных пар (card1 + card2)

        for (const pair of data.pairs) {
            const { card1, card2 } = pair;

            // Проверка на дубликаты слов
            if (words.has(card1)) {
                showNotification(`Слово "${card1}" повторяется. Все слова должны быть уникальными.`, "warning");
                return false;
            }

            // Проверка на дубликаты переводов
            if (translations.has(card2)) {
                showNotification(`Перевод "${card2}" повторяется. Все переводы должны быть уникальными.`, "warning");
                return false;
            }

            // Проверка на дубликаты пар
            const pairKey = `${card1}|${card2}`;
            if (pairsSet.has(pairKey)) {
                showNotification(`Пара "${card1}" - "${card2}" уже существует. Все пары должны быть уникальными.`, "warning");
                return false;
            }

            // Добавление в множества для дальнейших проверок
            words.add(card1);
            translations.add(card2);
            pairsSet.add(pairKey);
        }

        // Если все проверки пройдены
        return true;
    }

    return container;
}

function generateFillintheblanks(taskId = '') {
    const container = createFillInTheBlanksContainer();
    const editMode = !!taskId;

    // Обработчик сохранения
    container.querySelector('#task-save').addEventListener('click', async () => {
        const data = container.getData();
        if (!validateFillData(data)) return;

        await saveTaskWithData(container, {
            taskType: 'FillInTheBlanks',
            taskId: taskId,
            editMode: editMode
        }, data);
    });

    // Обработчик генерации
    container.querySelector('#task-generate').addEventListener('click', async () => {
        container.querySelector('#task-generate').style.display = 'none';
        const generationWindow = await initializeGenerationWindow("FillInTheBlanks", ["context", "quantity", "fillType", "query"]);
        container.querySelector('#generation-container').appendChild(generationWindow);
        generationWindow.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    // Валидация данных
    function validateFillData(data) {
        if (!data.text) {
            showNotification('Введите текст с пропусками', "warning");
            return false;
        }

        // Проверка наличия пропусков (текста в квадратных скобках)
        if (!data.text.match(/\[.*?\]/)) {
            showNotification('Добавьте пропуски, заключив слова в квадратные скобки [пример]', "warning");
            return false;
        }

        return true;
    }

    return container;
}

function generateNote(taskId = '') {
    const container = createNoteContainer();
    const editMode = !!taskId;

    // Обработчик сохранения
    container.querySelector('#task-save').addEventListener('click', async () => {
        const data = container.getData();
        if (!validateNoteData(data)) return;

        await saveTaskWithData(container, {
            taskType: 'Note',
            taskId: taskId,
            editMode: editMode
        }, data);
    });

    // Обработчик генерации
    container.querySelector('#task-generate').addEventListener('click', async () => {
        container.querySelector('#task-generate').style.display = 'none';

        const generationWindow = await initializeGenerationWindow("Note", ["context", "language", "query"]);

        container.querySelector('#note-generation-container').appendChild(generationWindow);
        generationWindow.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    // Валидация данных
    function validateNoteData(data) {
        if (!data.content) {
            showNotification('Note content cannot be empty', 'warning');
            return false;
        }
        return true;
    }

    return container;
}

function generateArticle(taskId = '') {
    const container = createArticleContainer();
    const editMode = !!taskId;

    // Save handler
    container.querySelector('#task-save').addEventListener('click', async () => {
        const data = container.getData();
        if (!validateArticleData(data)) return;

        await saveTaskWithData(container, {
            taskType: 'Article',
            taskId: taskId,
            editMode: editMode
        }, data);
    });

    // Generate handler
    container.querySelector('#task-generate').addEventListener('click', async () => {
        container.querySelector('#task-generate').style.display = 'none';

        const generationWindow = await initializeGenerationWindow("Article", ["context", "query"]);

        container.querySelector('#article-generation-container').appendChild(generationWindow);
        generationWindow.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    // Data validation
    function validateArticleData(data) {
        if (!data.content) {
            showNotification('Вы не можете оставить текстовое поле пустым.', 'warning');
            return false;
        }

        if (data.content.length < 20) {
            showNotification('Статья должна содержать как минимум 20 слов.', 'warning');
            return false;
        }

        if (!data.title) {
            showNotification('Вы не можете оставить поле заголовка пустым.', 'warning');
            return false;
        }

        return true;
    }

    return container;
}

function generateTest(taskId = '') {
    const editMode = !!taskId;
    const container = createTestContainer();
    const questionsContainer = container.querySelector('#test-questions');

    // Add first question for new tests
    if (!editMode) {
        addQuestion(questionsContainer);
    }

    // Save handler
    container.querySelector('#task-save').addEventListener('click', async () => {
        const data = container.getData();

        if (!validateTestData(data)) return;

        await saveTaskWithData(container, {
            taskType: 'Test',
            taskId: taskId,
            editMode: editMode
        }, data);
    });

    // Generate handler
    container.querySelector('#task-generate').addEventListener('click', async () => {
        container.querySelector('#task-generate').style.display = 'none';

        const generationWindow = await initializeGenerationWindow("Test", ["context", "testType", "quantity", "language", "query"]);

        container.querySelector('#generation-container').appendChild(generationWindow);
        generationWindow.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    // Validation function
    function validateTestData(data) {
        if (data.questions.length === 0) {
            showNotification('Добавьте как минимум один вопрос.', 'warning');
            return false;
        }

        // Check each question has at least one correct answer
        const invalidQuestions = data.questions.filter(q =>
            !q.answers.some(a => a.is_correct)
        );

        if (invalidQuestions.length > 0) {
            showNotification('Каждый вопрос должен содержать хотя бы один правильный ответ.', 'warning');
            return false;
        }

        return true;
    }

    return container;
}

function generateTrueorfalse(taskId = '') {
    const editMode = !!taskId;
    const container = createTrueFalseContainer();

    // Save handler
    container.querySelector('#task-save').addEventListener('click', async () => {
        const data = container.getData();

        if (!validateTrueFalseData(data)) return;

        await saveTaskWithData(container, {
            taskType: 'TrueOrFalse',
            taskId: taskId,
            editMode: editMode
        }, data);
    });

    // Generate handler
    container.querySelector('#task-generate').addEventListener('click', async () => {
        container.querySelector('#task-generate').style.display = 'none';

        const generationWindow = await initializeGenerationWindow("TrueOrFalse", ["context", "testType", "quantity", "language", "query"]);

        container.querySelector('#generation-container').appendChild(generationWindow);
        generationWindow.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    // Validation function
    function validateTrueFalseData(data) {
        if (data.statements.length === 0) {
            showNotification('Добавьте как минимум одно утверждение', 'warning');
            return false;
        }

        // Check for empty statements
        const emptyStatements = data.statements.filter(s => !s.text.trim());
        if (emptyStatements.length > 0) {
            showNotification('Во всех утверждениях должен быть текст', 'warning');
            return false;
        }

        return true;
    }

    return container;
}

function generateUnscramble(taskId = '') {
    const editMode = !!taskId;
    const container = createUnscrambleContainer();

    // Save handler
    container.querySelector('#task-save').addEventListener('click', async () => {
        const data = container.getData();

        if (!validateUnscrambleData(data)) return;

        await saveTaskWithData(container, {
            taskType: 'Unscramble',
            taskId: taskId,
            editMode: editMode
        }, data);
    });

    // Обработчик заполнения
    container.querySelector('#task-fill').addEventListener('click', async() => {
        const pairs = await getWordListsFromContext();

        if (pairs) {
            pairs.forEach(pair => {
                addUnscrambleCard(taskEditorContainer, removeEmojis(pair.word), removeEmojis(pair.translation));
            });
        }
    });

    // Validation function
    function validateUnscrambleData(data) {
        if (data.words.length === 0) {
            showNotification('Добавьте как минимум одно слово', 'warning');
            return false;
        }

        // Check for empty words
        const emptyWords = data.words.filter(w => !w.word.trim());
        if (emptyWords.length > 0) {
            showNotification('Все блоки должны содержать текст', 'warning');
            return false;
        }

        return true;
    }

    return container;
}

function generateMakeasentence(taskId = '') {
    const editMode = !!taskId;
    const container = createSentenceContainer();

    // Обработчик сохранения
    container.querySelector('#task-save').addEventListener('click', async () => {
        const data = container.getData();

        if (!validateSentenceData(data)) return;

        await saveTaskWithData(container, {
            taskType: 'MakeASentence',
            taskId: taskId,
            editMode: editMode
        }, data);
    });

    // Обработчик генерации
    container.querySelector('#task-generate').addEventListener('click', async () => {
        container.querySelector('#task-generate').style.display = 'none';

        const generationWindow = await initializeGenerationWindow("MakeASentence", ["context", "quantity", "sentenceLength", "query"]);

        container.querySelector('#generation-container').appendChild(generationWindow);
        generationWindow.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    // Функция валидации
    function validateSentenceData(data) {
        if (data.sentences.length === 0) {
            showNotification('Добавьте хотя бы одно предложение', 'warning');
            return false;
        }

        // Проверка на пустые предложения
        const emptySentences = data.sentences.filter(s => !s.correct.trim());
        if (emptySentences.length > 0) {
            showNotification('Все предложения должны содержать текст', 'warning');
            return false;
        }

        return true;
    }

    return container;
}

function generateEssay(taskId = '') {
    const editMode = !!taskId;
    const container = createEssayContainer();

    container.querySelector('#task-save').addEventListener('click', async () => {
        const data = container.getData();

        if (!validateEssayData(data)) return;

        await saveTaskWithData(container, {
            taskType: 'Essay',
            taskId: taskId,
            editMode: editMode
        }, data);
    });

    container.querySelector('#task-generate').addEventListener('click', async () => {
        const generationWindow = await initializeGenerationWindow("Essay", ["context", "query"]);

        container.querySelector('#generation-container').appendChild(generationWindow);
        container.querySelector('#task-generate').style.display = 'none';
        generationWindow.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    function validateEssayData(data) {
        if (!data.title) {
            showNotification('Укажите заголовок эссе', 'warning');
            return false;
        }

        const emptyCriteria = data.conditions.filter(c => !c.text);
        if (emptyCriteria.length > 0) {
            showNotification('Все критерии должны содержать описание', 'warning');
            return false;
        }

        return true;
    }

    return container;
}

function generateImage(taskId = '') {
    const editMode = !!taskId;
    const container = createImageTaskContainer();
    const sectionId = document.getElementById('main-container').dataset.sectionId;

    container.getData = function () {
        const preview = container.querySelector('.image-preview img');
        const title = container.querySelector('.task-title').value.trim();

        let image_url = container.dataset.imageUrl || null;

        if (!image_url && preview?.src?.startsWith('data:')) {
            image_url = preview.src;
        }

        return { title, image_url };
    };

    container.querySelector('.task-save').addEventListener('click', async () => {
        let data = container.getData();

        if (!validateImageTaskData(data)) {
            return;
        }

        if (data.image_url.startsWith('data:')) {
            try {
                const blob = await (await fetch(data.image_url)).blob();
                const file = new File([blob], "uploaded-image.png", { type: blob.type });
                const uploadResult = await uploadImage(file);
                data.image_url = uploadResult.url;
            } catch (error) {
                showNotification('Ошибка загрузки изображения. Используйте картинки png, jpeg или gif.', "warning");
                return;
            }
        }

        const params = {
            section_id: sectionId,
            task_type: 'Image',
            obj_id: taskId || null
        };

        await saveTaskWithData(container, {
            taskType: 'Image',
            taskId: taskId,
            editMode: editMode
        }, data);
    });

    function validateImageTaskData(data) {
        if (!data || typeof data !== 'object') {
            showNotification('Ошибка: данные задания не найдены', 'danger');
            return false;
        }

        if (!data.image_url || typeof data.image_url !== 'string') {
            showNotification('Пожалуйста, загрузите или выберите изображение', 'warning');
            return false;
        }

        // Проверка base64 или URL
        const isBase64 = data.image_url.startsWith('data:image/');
        const isURL = /^\/media\/uploads\/.+\.(png|jpe?g|gif)$/i.test(data.image_url);

        if (!isBase64 && !isURL) {
            showNotification('Формат изображения некорректен. Используйте png, jpeg или gif.', 'warning');
            return false;
        }

        return true;
    }

    return container;
}

function generateLabelimages(taskId = '') {
    const editMode = !!taskId;
    const container = createLabelImagesContainer();

    // Обработчик сохранения
    container.querySelector('#task-save').addEventListener('click', async () => {
        const data = container.getData();

        if (!validateLabelImagesData(data)) return;

        // Загружаем изображения если они в base64
        try {
            const processedData = await processImageData(data);
            await saveTaskWithData(container, {
                taskType: 'LabelImages',
                taskId: taskId,
                editMode: editMode
            }, processedData);
        } catch (error) {
            showNotification(`Ошибка загрузки изображений: ${error.message}`, 'danger');
        }
    });

    // Функция валидации
    function validateLabelImagesData(data) {
        if (data.images.length <= 1) {
            showNotification('Добавьте хотя бы два изображения', 'warning');
            return false;
        }

        return true;
    }

    // Обработка изображений (загрузка на сервер если они в base64)
    async function processImageData(data) {
        const processedImages = [];

        for (const img of data.images) {
            if (img.url.startsWith('data:')) {
                try {
                    const blob = await (await fetch(img.url)).blob();
                    const file = new File([blob], `image-${Date.now()}.png`, { type: blob.type });
                    const uploadResult = await uploadImage(file);
                    processedImages.push({ ...img, url: uploadResult.url });
                } catch (error) {
                    throw new Error(`Не удалось загрузить изображение: ${error.message}`);
                }
            } else {
                processedImages.push(img);
            }
        }

        return { ...data, images: processedImages };
    }

    return container;
}

function generateSortintocolumns(taskId = '') {
    const editMode = !!taskId;
    const container = createSortintocolumnsContainer();

    // Обработчик сохранения
    container.querySelector('#task-save').addEventListener('click', async () => {
        const data = container.getData();

        if (!validateColumnsData(data)) return;

        await saveTaskWithData(container, {
            taskType: 'SortIntoColumns',
            taskId: taskId,
            editMode: editMode
        }, data);
    });

    // Обработчик генерации
    container.querySelector('#task-generate').addEventListener('click', async () => {
        container.querySelector('#task-generate').style.display = 'none';

        const generationWindow = await initializeGenerationWindow("SortIntoColumns", ["context", "quantity", "query"]);

        container.querySelector('#generation-container').appendChild(generationWindow);
        generationWindow.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    // Функция валидации
    function validateColumnsData(data) {
        if (data.columns.length <= 1) {
            showNotification('Добавьте хотя бы две колонки с названием и словами', 'warning');
            return false;
        }

        // Проверка что в каждой колонке есть слова
        const invalidColumns = data.columns.filter(col => col.words.length === 0);
        if (invalidColumns.length > 1) {
            showNotification('Все колонки должны содержать хотя бы одно слово', 'warning');
            return false;
        }

        return true;
    }

    return container;
}

function generateAudio(taskId = '') {
    const editMode = !!taskId;
    const container = createAudioContainer();

    container.querySelector('#task-save').addEventListener('click', async () => {
        let data = container.getData();

        if (!validateAudioTaskData(data)) return;

        if (data.audio_url.startsWith('blob:') || data.audio_url.startsWith('data:')) {
            try {
                const blob = await (await fetch(data.audio_url)).blob();
                const file = new File([blob], "uploaded-audio.mp3", { type: blob.type });
                const uploadResult = await uploadAudio(file);
                data.audio_url = uploadResult.url;
            } catch (error) {
                showNotification('Ошибка загрузки аудио. Используйте аудио mp3.', "warning");
                return;
            }
        }

        await saveTaskWithData(container, {
            taskType: 'Audio',
            taskId: taskId,
            editMode: editMode
        }, data);
    });

    // Обработчик генерации
    container.querySelector('#task-generate').addEventListener('click', async () => {
        container.querySelector('#task-generate').style.display = 'none';

        const generationWindow = await initializeGenerationWindow("Transcript", ["context", "query"]);

        container.querySelector('#generation-container').appendChild(generationWindow);
        generationWindow.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    // Обработчик озвучивания текста
    container.querySelector('#task-speak').addEventListener('click', async () => {
        const transcript = container.querySelector('#audio-transcript').value.trim();

        if (!validateTextForSpeech(transcript)) {
            return;
        }

        const speakBtn = container.querySelector('#task-speak');
        const originalIcon = speakBtn.innerHTML;
        speakBtn.innerHTML = '<i class="bi bi-arrow-repeat spin"></i>';
        speakBtn.disabled = true;

        try {
            const response = await fetch('/api/edge-tts/', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCookie("csrftoken"),
                },
                body: JSON.stringify({
                    text: transcript,
                    voice: 'en-US-JennyNeural'
                })
            });

            if (!response.ok) {
                throw new Error(await response.text());
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);

            const preview = container.querySelector('.audio-preview');
            preview.innerHTML = `
                <audio controls class="w-100">
                    <source src="${audioUrl}" type="audio/mpeg">
                    Ваш браузер не поддерживает воспроизведение аудио.
                </audio>
            `;
            setupModernAudioPlayer(preview.querySelector('audio'));

            // Очищаем предыдущий URL и сохраняем новый
            if (container.dataset.audioBlobUrl) {
                URL.revokeObjectURL(container.dataset.audioBlobUrl);
            }
            container.dataset.audioBlobUrl = audioUrl;
            delete container.dataset.audioUrl; // Удаляем старый URL если был

        } catch (error) {
            console.error('Ошибка генерации речи:', error);
            showNotification('Ошибка при генерации аудио: ' + error.message, 'danger');
        } finally {
            speakBtn.innerHTML = originalIcon;
            speakBtn.disabled = false;
        }
    });

    function validateTextForSpeech(text) {
        if (!text || text.trim().length < 3) {
            showNotification('Текст для озвучивания должен содержать не менее 3 символов', 'warning');
            return false;
        }

        if (text.length > 5000) {
            showNotification('Текст для озвучивания должен быть не более 5000 символов', 'warning');
            return false;
        }

        return true;
    }

    function validateAudioTaskData(data) {
        if (!data || typeof data !== 'object') {
            showNotification('Ошибка: данные задания не найдены', 'danger');
            return false;
        }

        if (!data.title || data.title.trim() === '') {
            showNotification('Пожалуйста, введите название аудио', 'warning');
            return false;
        }

        if (!data.audio_url) {
            showNotification('Пожалуйста, загрузите или сгенерируйте аудиофайл', 'warning');
            return false;
        }

        const isBlobUrl = data.audio_url.startsWith('blob:');
        const isBase64 = data.audio_url.startsWith('data:audio/');
        const isURL = /^\/media\/uploads\/.+\.(mp3|wav|ogg|m4a)$/i.test(data.audio_url);

        if (!isBlobUrl && !isBase64 && !isURL) {
            showNotification('Формат аудиофайла некорректен. Загрузите или сгенерируйте файл снова.', 'warning');
            return false;
        }

        return true;
    }

    return container;
}

function generateEmbeddedtask(taskId = '') {
    const editMode = !!taskId;
    const container = createEmbeddedTaskContainer();

    container.querySelector('#task-save').addEventListener('click', async () => {
        const data = container.getData();

        const isValid = checkEmbed(data.embed_code);
        if (!isValid) {
            showNotification('Некорректный embed-код. Поддерживаются только Wordwall, Miro, Quizlet, LearningApps, Rutube и YouTube.', 'warning');
            return;
        }

        await saveTaskWithData(container, {
            taskType: 'EmbeddedTask',
            taskId: taskId,
            editMode: editMode
        }, data);
    });

    return container;
}













        // Функции обработки ответа ИИ


function handleWordListGeneration(result) {
    try {
        console.log(result.data);
        const data = result.data;

        if (!data.title || typeof data.title !== 'string') {
            throw new Error('Некорректный или отсутствующий title в данных.');
        }

        if (!Array.isArray(data.words) || data.words.length === 0) {
            throw new Error('Массив words отсутствует или пуст.');
        }

        const container = taskEditorContainer.querySelector('.wordlist-container');
        if (!container) {
            throw new Error('Контейнер wordlist не найден.');
        }

        const titleInput = container.querySelector('#task-title');
        if (!titleInput) {
            throw new Error('Поле заголовка (#task-title) не найдено.');
        }

        titleInput.value = data.title.replace(/[^a-zA-Zа-яА-Я0-9\s-]/g, '');

        data.words.forEach((item) => {
            if (item.word && item.translation) {
                if (item.emoji) {
                    item.translation += ` ${item.emoji}`;
                }
                addRow(item.word, item.translation);
            }
        });

        removeEmptyLines();

    } catch (error) {
        console.error('Ошибка генерации списка слов:', error);
        showRawAnswer(result.data);
    }
}

function handleMatchUpTheWordsGeneration(result) {
    try {
        const data = result.data;

        if (!data.title || typeof data.title !== 'string') {
            throw new Error('Invalid or missing title in generated data');
        }

        if (!Array.isArray(data.pairs) || data.pairs.length === 0) {
            throw new Error('Pairs array is missing or empty');
        }

        const container = document.querySelector('.match-up-the-words-container');
        if (!container) {
            throw new Error('MatchUpTheWords container not found');
        }

        container.querySelector('#task-title').value = data.title.replace(/[^a-zA-Z0-9\s-]/g, '');

        // Очищаем существующие строки (кроме первой)
        const rowsContainer = container.querySelector('#wordlist-rows');
        while (rowsContainer.children.length > 1) {
            rowsContainer.lastChild.remove();
        }

        // Заполняем первую строку и добавляем остальные
        data.pairs.forEach((item, index) => {
            addRow(item.card1, item.card2, "Match");
        });

        removeEmptyLines();

    } catch (error) {
        console.error(error);
        showRawAnswer(result.data);
    }
}

function handleFillInTheBlanksGeneration(result) {
    try {
        // Извлекаем JSON из результата
        const data = result.data;

        // Проверяем структуру данных
        if (!data || !data.title || !Array.isArray(data.sentences)) {
            throw new Error('Invalid or missing title or sentences in generated data');
        }

        const container = document.querySelector('.fill-in-the-blanks-container');
        if (!container) {
            throw new Error('FillInTheBlanks container not found');
        }

        // Устанавливаем заголовок
        const titleField = container.querySelector('#task-title');
        if (titleField && typeof data.title === 'string') {
            titleField.value = data.title.replace(/[^a-zA-Z0-9\s-]/g, '');
        }

        // Перемешиваем предложения
        const shuffledSentences = [...data.sentences].sort(() => Math.random() - 0.5);

        // Формируем HTML
        const textarea = container.querySelector('#fill-textarea');
        if (textarea) {
            const sentencesHTML = shuffledSentences.map(({ text, answer }) => {
                const normalized = text.replace(/_+/g, '_'); // заменяем подряд идущие подчеркивания на одно
                const replaced = normalized.replace('_', `[${answer}]`); // вставляем ответ в квадратных скобках
                return `<p>${replaced}</p>`;
            }).join('');

            textarea.innerHTML += convertMarkdownToHTML(sentencesHTML);

            // Подгоняем высоту
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        }

        // Устанавливаем формат отображения (если указан)
        if (data.display_format) {
            const typeSelect = container.querySelector('#fill-type');
            if (typeSelect) {
                typeSelect.value = data.display_format;
            }
        }

    } catch (error) {
        console.error('Generation handling error:', error);
        showRawAnswer(result.data);
    }
}

function handleNoteGeneration(result) {
    try {
        const parsedData = result.data;

        if (!parsedData.content || typeof parsedData.content !== 'string') {
            throw new Error("Missing or invalid content field");
        }

        const container = document.querySelector('.note-container');
        if (!container) {
            throw new Error("Note container not found");
        }

        if (parsedData.title && typeof parsedData.title === 'string') {
            container.querySelector('#task-title').value = parsedData.title;
        }

        const noteContent = container.querySelector('#note-content');
        noteContent.innerHTML = convertMarkdownToHTML(parsedData.content);
        noteContent.style.height = 'auto';
        noteContent.style.height = noteContent.scrollHeight + 'px';

    } catch (error) {
        console.error('Note generation error:', error);
        showRawAnswer(result.data);
    }
}

function handleArticleGeneration(result) {
    try {
        const parsedData = result.data;

        // Required fields validation
        if (!parsedData.content || typeof parsedData.content !== 'string') {
            throw new Error("Missing or invalid content field");
        }

        const container = taskEditorContainer.querySelector('.article-container');
        if (!container) {
            throw new Error("Article container not found");
        }

        // Set title if available
        if (parsedData.title && typeof parsedData.title === 'string') {
            container.querySelector('#task-title').value = parsedData.title;
        }

        // Set article content
        const articleContent = container.querySelector('#article-content');
        articleContent.innerHTML = convertMarkdownToHTML(parsedData.content);
        articleContent.style.height = 'auto';
        articleContent.style.height = articleContent.scrollHeight + 'px';

    } catch (error) {
        console.error('Article generation error:', error);
        showRawAnswer(result.data);
    }
}

function handleTestGeneration(result) {
    try {
        const parsedData = result.data;

        // Get questions array
        const questions = Array.isArray(parsedData)
            ? parsedData
            : parsedData.questions;

        if (!Array.isArray(questions)) {
            throw new Error("Invalid questions format");
        }

        const container = taskEditorContainer.querySelector('.test-container');
        if (!container) {
            throw new Error("Test container not found");
        }

        // Set title if available
        if (parsedData.title && typeof parsedData.title === 'string') {
            container.querySelector('#task-title').value = parsedData.title;
        }

        // Clear existing questions if empty
        const questionsContainer = container.querySelector('#test-questions');
        const hasContent = Array.from(questionsContainer.querySelectorAll('.question-container'))
            .some(q => q.querySelector('.question-text').value.trim());

        if (!hasContent) {
            questionsContainer.innerHTML = '';
        }

        // Add new questions with shuffled answers
        questions.forEach(question => {
            if (question.text && Array.isArray(question.answers)) {
                // Shuffle answers array
                const shuffledAnswers = [...question.answers]
                    .filter(a => a.text)
                    .map(a => ({
                        text: escapeHtml(a.text),
                        is_correct: Boolean(a.is_correct)
                    }))
                    .sort(() => Math.random() - 0.5);

                addQuestion(questionsContainer, {
                    text: escapeHtml(question.text),
                    answers: shuffledAnswers
                });
            }
        });

    } catch (error) {
        console.error('Test generation error:', error);
        showRawAnswer(result.data);
    }
}

function handleTrueOrFalseGeneration(result) {
    try {
        const parsedData = result.data;

        // Get statements array
        const statements = Array.isArray(parsedData)
            ? parsedData
            : parsedData.statements;

        if (!Array.isArray(statements)) {
            throw new Error("Invalid statements format");
        }

        const container = taskEditorContainer.querySelector('.truefalse-container');
        if (!container) {
            throw new Error("TrueFalse container not found");
        }

        // Set title if available
        if (parsedData.title && typeof parsedData.title === 'string') {
            container.querySelector('#task-title').value = parsedData.title;
        }

        // Clear existing statements if empty
        const statementsContainer = container.querySelector('#truefalse-statements');
        const hasContent = Array.from(statementsContainer.querySelectorAll('.statement-row'))
            .some(row => row.querySelector('.statement-text').value.trim());

        if (!hasContent) {
            statementsContainer.innerHTML = '';
        }

        // Add new statements
        statements.forEach(statement => {
            if (statement.text) {
                addStatement(statementsContainer, {
                    text: escapeHtml(statement.text),
                    is_true: Boolean(statement.is_true)
                });
            }
        });

    } catch (error) {
        console.error('TrueFalse generation error:', error);
        showRawAnswer(result.data);
    }
}

function handleMakeASentenceGeneration(result) {
    try {
        const parsedData = result.data;

        // Проверка структуры данных
        const sentences = parsedData[0].sentences;

        if (!Array.isArray(sentences)) {
            throw new Error("Неверный формат предложений");
        }

        const container = taskEditorContainer.querySelector('.sentence-container');
        if (!container) {
            throw new Error("Контейнер не найден");
        }

        // Установка заголовка
        if (parsedData.title && typeof parsedData.title === 'string') {
            container.querySelector('#task-title').value = parsedData.title;
        }

        // Очистка контейнера если нет данных
        const cardsContainer = container.querySelector('#sentence-cards');
        const hasContent = Array.from(cardsContainer.querySelectorAll('.sentence-card'))
            .some(card => card.querySelector('.sentence-input').value.trim());

        if (!hasContent) {
            cardsContainer.innerHTML = '';
        }

        // Добавление предложений
        sentences.forEach(sentence => {
            if (sentence.sentence) {
                addSentenceCard(cardsContainer, sentence.sentence);
            }
        });

    } catch (error) {
        console.error('Ошибка обработки предложений:', error);
        showRawAnswer(result.data);
    }
}

function handleEssayGeneration(result) {
    try {
        const parsedData = result.data;

        document.querySelector('#task-title').value = parsedData.title;
    } catch (error) {
        console.error("Ошибка обработки генерации эссе:", error);
        showRawAnswer(result.data);
    }
}

function handleSortIntoColumnsGeneration(result) {
    try {
        const parsedData = result.data;

        // Проверка структуры данных
        const columns = Array.isArray(parsedData)
            ? parsedData
            : parsedData.columns;

        if (!Array.isArray(columns)) {
            throw new Error("Неверный формат колонок");
        }

        const container = document.querySelector('.sort-columns-container');
        if (!container) {
            throw new Error("Контейнер не найден");
        }

        // Установка заголовка
        if (parsedData.title && typeof parsedData.title === 'string') {
            container.querySelector('#task-title').value = parsedData.title;
        }

        // Очистка контейнера если нет данных
        const columnsContainer = container.querySelector('.columns-container');
        const hasContent = columnsContainer.querySelectorAll('.column-card').length > 0;

        if (!hasContent) {
            columnsContainer.innerHTML = '';
        }

        // Добавление колонок
        columns.forEach(col => {
            if (col.title || col.name) {
                const columnName = col.title || col.name;
                const words = Array.isArray(col.words) ? col.words : [];

                columnsContainer.appendChild(createColumnElement({
                    name: columnName,
                    words: words
                }));
            }
        });

    } catch (error) {
        console.error('Ошибка обработки колонок:', error);
        showRawAnswer(result.data);
    }
}

function handleTranscriptGeneration(result) {
    try {
        const parsedData = result.data;

        // Проверяем наличие полей title и transcript
        if (!parsedData.title || typeof parsedData.title !== 'string') {
            throw new Error("Missing or invalid title field");
        }

        if (!parsedData.transcript || typeof parsedData.transcript !== 'string') {
            throw new Error("Missing or invalid transcript field");
        }

        const container = document.querySelector('.audio-container');
        if (!container) {
            throw new Error("Audio container not found");
        }

        // Заполняем заголовок
        container.querySelector('#task-title').value = parsedData.title;

        // Заполняем транскрипт
        const transcriptField = container.querySelector('#audio-transcript');
        transcriptField.value = parsedData.transcript;
        transcriptField.style.height = 'auto';
        transcriptField.style.height = transcriptField.scrollHeight + 'px';
        transcriptField.dispatchEvent(new Event('input'));

    } catch (error) {
        console.error('Transcript generation error:', error);
        showRawAnswer(result.data);
    }
}







        // Функции редактирования

async function editTask(taskId) {
    try {
        const data = await fetchTaskData(taskId); // Загружаем данные задания
        const functionNameTaskContainer = 'generate' + data.taskType.charAt(0).toUpperCase() + data.taskType.slice(1);
        const taskContainer = window[functionNameTaskContainer](taskId);
        
        if (data && taskContainer) {
            closeWindow();
            const addTaskButton = document.getElementById('add-task-button-wrapper');
            if (addTaskButton) {
                addTaskButton.style.display = 'none';
            }
            const functionName = 'edit' + data.taskType.charAt(0).toUpperCase() + data.taskType.slice(1);
            window[functionName](data, taskContainer);

            taskEditorContainer.style.display = 'block';

            taskEditorContainer.querySelector('.btn-close').addEventListener('click', async () => {
                closeWindow();
            });
        } else {
            throw new Error('Task data or task container not found');
        }

        taskEditorContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (error) {
        showNotification('Ошибка при загрузке данных задания', 'warning');
    }
}

function editWordlist(data, taskContainer) {
    try {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid data format');
        }

        const titleInput = taskContainer.querySelector('#task-title');
        if (data.title && typeof data.title === 'string') {
            titleInput.value = data.title.replace(/[^a-zA-Z0-9\s-]/g, '');
        } else {
            titleInput.value = 'Список слов'; // Значение по умолчанию
        }

        taskEditorContainer.appendChild(taskContainer);

        const rowsContainer = taskContainer.querySelector('#wordlist-rows');

        if (Array.isArray(data.words)) {
            data.words.forEach((item, index) => {
                const word = item.word || '';
                const translation = item.translation || '';

                addRow(word, translation);
            });
        } else {
            throw new Error('Invalid words format');
        }

        removeEmptyLines();
    } catch (error) {
        showNotification('Ошибка загрузки данных. Пожалуйста, проверьте формат.', "danger");
    }
}

function editMatchupthewords(data, taskContainer) {
    try {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid data format');
        }

        const titleInput = taskContainer.querySelector('#task-title');
        if (data.title && typeof data.title === 'string') {
            titleInput.value = data.title.replace('<', '');
        }

        taskEditorContainer.appendChild(taskContainer);

        const rowsContainer = taskContainer.querySelector('#wordlist-rows');
        rowsContainer.innerHTML = ''; // Очищаем все строки

        data.pairs.forEach((item, index) => {
                const card1 = item.card1 || '';
                const card2 = item.card2 || '';

                addRow(card1, card2, "Match");
            });

        removeEmptyLines();
    } catch (error) {
        console.error(error);
        showNotification('Ошибка загрузки данных. Пожалуйста, проверьте формат.', "danger");
    }
}

function editFillintheblanks(data, taskContainer) {
    try {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid data format');
        }

        // Устанавливаем заголовок
        const titleInput = taskContainer.querySelector('#task-title');
        if (data.title && typeof data.title === 'string') {
            titleInput.value = data.title.replace(/[^a-zA-Z0-9\s-]/g, '');
        }

        // Устанавливаем тип задания
        if (data.display_format) {
            const typeSelect = taskContainer.querySelector('#fill-type');
            if (typeSelect) {
                typeSelect.value = data.display_format;
            }
        }

        // Добавляем контейнер в редактор
        taskEditorContainer.appendChild(taskContainer);

        // Устанавливаем текст
        if (data.text) {
            const editableDiv = taskContainer.querySelector('#fill-textarea');

            if (editableDiv) {
                editableDiv.innerHTML = convertMarkdownToHTML(data.text);

                // Форсируем перерисовку
                editableDiv.style.display = 'none';
                editableDiv.offsetHeight;
                editableDiv.style.display = '';

                // Генерируем событие input
                editableDiv.dispatchEvent(new Event('input'));
            }
        }
    } catch (error) {
        console.error('Edit error:', error);
        showNotification('Ошибка загрузки данных. Пожалуйста, проверьте формат.', "danger");
    }
}

function editNote(data, taskContainer) {
    try {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid data format');
        }

        // Установка заголовка
        const titleInput = taskContainer.querySelector('#task-title');
        if (data.title && typeof data.title === 'string') {
            titleInput.value = data.title;
        }

        // Установка содержимого
        if (data.content) {
            const contentDiv = taskContainer.querySelector('#note-content');
            contentDiv.innerHTML = convertMarkdownToHTML(data.content);
            contentDiv.style.height = 'auto';
            contentDiv.style.height = contentDiv.scrollHeight + 'px';
        }

        // Добавление контейнера в редактор
        taskEditorContainer.appendChild(taskContainer);

    } catch (error) {
        console.error('Edit note error:', error);
        showNotification('Error loading note data', 'danger');
    }
}

function editArticle(data, taskContainer) {
    try {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid data format');
        }

        // Set title
        const titleInput = taskContainer.querySelector('#task-title');
        if (data.title && typeof data.title === 'string') {
            titleInput.value = data.title;
        }

        // Set content
        if (data.content) {
            const contentDiv = taskContainer.querySelector('#article-content');
            contentDiv.innerHTML = convertMarkdownToHTML(data.content);
            contentDiv.style.height = 'auto';
            contentDiv.style.height = contentDiv.scrollHeight + 'px';
        }

        // Add to editor
        taskEditorContainer.appendChild(taskContainer);

    } catch (error) {
        console.error('Edit article error:', error);
        showNotification('Error loading article data', 'danger');
    }
}

function editTest(data, taskContainer) {
    try {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid data format');
        }

        // Set title
        const titleInput = taskContainer.querySelector('#task-title');
        if (data.title && typeof data.title === 'string') {
            titleInput.value = data.title;
        }

        // Clear existing questions
        const questionsContainer = taskContainer.querySelector('#test-questions');
        questionsContainer.innerHTML = '';

        // Add questions from data
        if (Array.isArray(data.questions)) {
            data.questions.forEach(question => {
                addQuestion(questionsContainer, {
                    text: escapeHtml(question.text),
                    answers: question.answers.map(a => ({
                        text: escapeHtml(a.text),
                        is_correct: Boolean(a.is_correct)
                    }))
                });
            });
        }

        // Add to editor
        taskEditorContainer.appendChild(taskContainer);

    } catch (error) {
        console.error('Edit test error:', error);
        showNotification('Error loading test data', 'danger');
    }
}

function editTrueorfalse(data, taskContainer) {
    try {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid data format');
        }

        // Set title
        const titleInput = taskContainer.querySelector('#task-title');
        if (data.title && typeof data.title === 'string') {
            titleInput.value = data.title;
        }

        // Clear existing statements
        const statementsContainer = taskContainer.querySelector('#truefalse-statements');
        statementsContainer.innerHTML = '';

        // Add statements from data
        if (Array.isArray(data.statements)) {
            data.statements.forEach(statement => {
                addStatement(statementsContainer, {
                    text: escapeHtml(statement.text),
                    is_true: Boolean(statement.is_true)
                });
            });
        }

        // Add to editor
        taskEditorContainer.appendChild(taskContainer);

    } catch (error) {
        console.error('Edit TrueFalse error:', error);
        showNotification('Error loading quiz data', 'danger');
    }
}

function editUnscramble(data, taskContainer) {
    try {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid data format');
        }

        // Set title
        const titleInput = taskContainer.querySelector('#task-title');
        if (data.title && typeof data.title === 'string') {
            titleInput.value = data.title;
        }

        // Clear existing cards
        const cardsContainer = taskContainer.querySelector('#unscramble-cards');
        cardsContainer.innerHTML = '';

        // Add cards from data
        data.words.forEach(word => {
            addUnscrambleCard(taskContainer, word.word, word.hint);
        });

        // Add to editor
        taskEditorContainer.appendChild(taskContainer);

    } catch (error) {
        console.error('Edit Unscramble error:', error);
        showNotification('Error loading puzzle data', 'danger');
    }
}

function editMakeasentence(data, taskContainer) {
    try {
        if (!data || typeof data !== 'object') {
            throw new Error('Неверный формат данных');
        }

        // Установка заголовка
        const titleInput = taskContainer.querySelector('#task-title');
        if (data.title && typeof data.title === 'string') {
            titleInput.value = data.title;
        }

        // Очистка и добавление предложений
        const cardsContainer = taskContainer.querySelector('#sentence-cards');
        cardsContainer.innerHTML = '';

        if (Array.isArray(data.sentences)) {
            data.sentences.forEach(sentence => {
                addSentenceCard(cardsContainer, sentence.correct);
            });
        }

        // Добавление пустой карточки если нет предложений
        if (cardsContainer.children.length === 0) {
            addSentenceCard(cardsContainer);
        }

        // Добавление в редактор
        taskEditorContainer.appendChild(taskContainer);

    } catch (error) {
        console.error('Ошибка редактирования:', error);
        showNotification('Ошибка загрузки данных задания', 'danger');
    }
}

function editEssay(data, taskContainer) {
    try {
        if (!data || typeof data !== 'object') {
            throw new Error('Неверный формат данных');
        }

        const titleInput = taskContainer.querySelector('#task-title');
        titleInput.value = data.title || 'Essay';

        const criteriaContainer = taskContainer.querySelector('#criteria-container');
        criteriaContainer.innerHTML = '';

        if (Array.isArray(data.conditions)) {
            data.conditions.forEach(condition => {
                addEssayCriteria(criteriaContainer, condition.text, condition.points);
            });
        }

        if (criteriaContainer.children.length === 0) {
            addEssayCriteria(criteriaContainer);
        }

        taskEditorContainer.appendChild(taskContainer);
    } catch (error) {
        console.error('Ошибка редактирования эссе:', error);
        showNotification('Ошибка загрузки эссе', 'danger');
    }
}

function editImage(data, container) {
    container.querySelector('.task-title').value = data.title;
    if (data.image_url) {
        container.querySelector('.image-preview').innerHTML = `
            <img src="${data.image_url}" class="img-fluid rounded" alt="Превью">
        `;
        container.dataset.imageUrl = data.image_url;
    }

    taskEditorContainer.appendChild(container);
}

function editLabelimages(data, taskContainer) {
    try {
        if (!data || typeof data !== 'object') {
            throw new Error('Неверный формат данных');
        }

        // Установка заголовка
        const titleInput = taskContainer.querySelector('#task-title');
        if (data.title && typeof data.title === 'string') {
            titleInput.value = data.title;
        }

        // Очистка и добавление изображений
        const imagesGrid = taskContainer.querySelector('.images-grid');
        imagesGrid.innerHTML = '';

        // Добавление в редактор
        taskEditorContainer.appendChild(taskContainer);

        if (Array.isArray(data.images)) {
            data.images.forEach(img => {
                if (img.url) {
                    createImageItemElement(img.url, img.label || '');
                }
            });
        }

    } catch (error) {
        console.error('Ошибка редактирования:', error);
        showNotification('Ошибка загрузки данных задания', 'danger');
    }
}

function editSortintocolumns(data, taskContainer) {
    try {
        if (!data || typeof data !== 'object') {
            throw new Error('Неверный формат данных');
        }

        // Установка заголовка
        const titleInput = taskContainer.querySelector('#task-title');
        if (data.title && typeof data.title === 'string') {
            titleInput.value = data.title;
        }

        // Очистка и добавление колонок
        const columnsContainer = taskContainer.querySelector('.columns-container');
        columnsContainer.innerHTML = '';

        if (Array.isArray(data.columns)) {
            data.columns.forEach(col => {
                columnsContainer.appendChild(createColumnElement({
                    name: col.name,
                    words: col.words
                }));
            });
        }

        // Добавление пустой колонки если нет данных
        if (columnsContainer.children.length === 0) {
            columnsContainer.appendChild(createColumnElement());
        }

        // Добавление в редактор
        taskEditorContainer.appendChild(taskContainer);

    } catch (error) {
        console.error('Ошибка редактирования:', error);
        showNotification('Ошибка загрузки данных задания', 'danger');
    }
}

function editAudio(data, container) {
    console.log(container);

    // Устанавливаем название аудио
    container.querySelector('#task-title').value = data.title;

    // Устанавливаем транскрипт
    container.querySelector('#audio-transcript').value = data.transcript || '';

    taskEditorContainer.appendChild(container);

    // Если есть URL аудио, обновляем аудиоплеер
    if (data.audio_url) {
        container.querySelector('.audio-preview').innerHTML = `
            <audio controls class="w-100 mt-2">
                <source src="${data.audio_url}" type="audio/mpeg">
                Ваш браузер не поддерживает воспроизведение аудио.
            </audio>
        `;
        setupModernAudioPlayer(container.querySelector('.audio-preview audio'));
        container.dataset.audioUrl = data.audio_url;
    }
}

function editEmbeddedtask(data, container) {
    container.querySelector('#task-title').value = data.title;
    container.querySelector('#embeddedtask-embed-code').value = data.embed_code;

    taskEditorContainer.appendChild(container);
}










        // Вспомогательные функции

function addRow(word = '', translation = '', mode = "", container = taskEditorContainer) {
    word = typeof word === 'string' ? word : String(word);
    translation = typeof translation === 'string' ? translation : String(translation);

    const rowsContainer = container.querySelector('#wordlist-rows');
    const row = document.createElement('div');
    row.className = 'd-flex align-items-center mb-2 wordlist-row';
    row.innerHTML = `
        <div class="input-group">
            <input type="text" class="form-control word-input" placeholder="${mode === 'Match' ? 'Первая карточка' : 'Слово'}" value="${escapeHtml(word)}">
            <input type="text" class="form-control translation-input" placeholder="${mode === 'Match' ? 'Вторая карточка' : 'Перевод'}" value="${escapeHtml(translation)}">
        </div>
        <button class="btn-close ms-2 remove-row" type="button" aria-label="Удалить" style="display: none; transform: scale(0.7);"></button>
    `;
    rowsContainer.appendChild(row);

    const wordInput = row.querySelector('.word-input');
    const translationInput = row.querySelector('.translation-input');

    wordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            translationInput.focus();
        }
    });

    translationInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            addRow('', '', mode, container);
            const newRow = container.querySelector('#wordlist-rows').lastElementChild;
            newRow.querySelector('.word-input').focus();
        }
    });

    updateRemoveButtons();
}

function updateRemoveButtons() {
    const rows = taskEditorContainer.querySelectorAll('.wordlist-row');
    rows.forEach((row, index) => {
        const removeButton = row.querySelector('.remove-row');
        const translationInput = row.querySelector('.translation-input');

        removeButton.style.display = rows.length > 1 ? 'block' : 'none';

        translationInput.classList.remove('rounded-end');

        if (index === rows.length - 1 && rows.length <= 1) {
            translationInput.classList.add('rounded-end');
        }
    });
}

function removeEmptyLines() {
    // Удаляем все пустые строки
    const allRows = taskEditorContainer.querySelectorAll('.wordlist-row');

    let emptyRows = [];

    allRows.forEach((row) => {
        const wordInput = row.querySelector('.word-input');
        const translationInput = row.querySelector('.translation-input');

        if (wordInput && translationInput) {
            const word = wordInput.value.trim();
            const translation = translationInput.value.trim();

            if (!word && !translation) {
                emptyRows.push(row); // Собираем пустые строки
            }
        }
    });

    if (emptyRows.length === allRows.length) {
        // Если ВСЕ строки пустые, оставляем одну, удаляем остальные
        emptyRows.slice(1).forEach(row => row.remove());
    } else {
        // Если есть непустые, удаляем все пустые строки
        emptyRows.forEach(row => row.remove());
    }

    updateRemoveButtons();
}

function handlePasteEvent(container, e) {
    // Функция для обработки вставки текста в поля
    const target = e.target;
    if (!target || (!target.classList.contains('word-input') && !target.classList.contains('translation-input'))) return;

    const pastedText = (e.clipboardData || window.clipboardData).getData('text');
    if (pastedText.includes('\n')) {
        e.preventDefault();
        const lines = pastedText.split('\n').map(l => l.trim()).filter(l => l !== '');
        if (lines.length === 0) return;
        let delimiter = '';
        const firstLine = lines[0];
        if (firstLine.includes('\t')) {
            delimiter = '\t';
        } else if (firstLine.includes('—')) {
            delimiter = '—';
        } else if (firstLine.includes('-')) {
            delimiter = '-';
        } else if (firstLine.includes(':')) {
            delimiter = ':';
        } else if (firstLine.includes('–')) {
            delimiter = '–';
        }

        lines.forEach((line, index) => {
            let word = '', translation = '';
            if (delimiter && line.includes(delimiter)) {
                const parts = line.split(delimiter);
                word = parts[0].trim();
                translation = parts.slice(1).join(delimiter).trim();
            } else {
                // Если разделителя нет, игнорируем строку или предполагаем, что перевод отсутствует
                word = line.trim();
                translation = ''; // Предполагаем, что перевод отсутствует
            }

            if (index === 0) {
                const row = target.closest('.wordlist-row');
                if (row) {
                    row.querySelector('.word-input').value = word;
                    row.querySelector('.translation-input').value = translation;
                }
            } else {
                addRow(word, translation); // Убедитесь, что addRow корректно обрабатывает аргументы
            }
        });
    }
}

function addQuestion(container, questionData = null) {
    // Важно! Обработчики находится в createTestContainer
    const questionId = 'question-' + Date.now();
    const questionElement = document.createElement('div');
    questionElement.className = 'question-container mb-4 p-3 border rounded';
    questionElement.dataset.questionId = questionId;

    // Заголовок вопроса: поле ввода и кнопка удаления (btn-close, большая)
    const questionHeader = document.createElement('div');
    questionHeader.className = 'd-flex justify-content-between align-items-center mb-3';
    questionHeader.innerHTML = `
        <input type="text" class="form-control question-text" placeholder="Вопрос" value="${questionData?.text || ''}">
        <button class="btn-close remove-question-btn ms-1" type="button" title="Удалить вопрос"></button>
    `;
    questionElement.appendChild(questionHeader);

    // Контейнер для вариантов ответа
    const answersContainer = document.createElement('div');
    answersContainer.className = 'answers-container mb-2';
    questionElement.appendChild(answersContainer);

    // Если передан questionData, добавляем его варианты, иначе определяем количество вариантов на основе последнего вопроса
    if (questionData?.answers?.length > 0) {
        questionData.answers.forEach(answer => {
            addAnswer(answersContainer, answer);
        });
    } else {
        // Если есть предыдущий вопрос, берем количество его вариантов, иначе создаем 1 вариант
        let defaultAnswersCount = 3;
        const lastQuestion = container.querySelector('.question-container:last-child');
        if (lastQuestion) {
            const lastAnswers = lastQuestion.querySelectorAll('.answer-row');
            defaultAnswersCount = lastAnswers.length || 1;
        }
        for (let i = 0; i < defaultAnswersCount; i++) {
            addAnswer(answersContainer);
        }
    }

    // Кнопка добавления варианта ответа
    const addAnswerBtn = document.createElement('button');
    addAnswerBtn.className = 'btn border-0 add-answer-btn text-secondary';
    addAnswerBtn.type = 'button';
    addAnswerBtn.title = 'Добавить вариант';
    addAnswerBtn.innerHTML = '<i class="bi bi-plus me-1"></i>Добавить вариант';
    questionElement.appendChild(addAnswerBtn);

    // Добавление вопроса в контейнер
    container.appendChild(questionElement);
}

function addAnswer(container, answerData = null) {
    // Важно! Обработчики находится в createTestContainer
    const checkboxId = 'correct-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);

    const answerElement = document.createElement('div');
    answerElement.className = 'answer-row mb-2 d-flex align-items-center me-4 ms-2';

    answerElement.innerHTML = `
        <input type="checkbox" class="form-check-input correct-answer-checkbox me-3 mb-1" style="transform: scale(1.5);" id="${checkboxId}" autocomplete="off" ${answerData?.is_correct ? 'checked' : ''}>
        <input type="text" class="form-control answer-text" placeholder="Ответ" value="${answerData?.text || ''}">
        <button class="btn-close remove-answer-btn ms-2" style="transform: scale(0.75);" type="button" title="Удалить вариант"></button>
    `;

    container.appendChild(answerElement);
}

function addStatement(container, statementData = null) {
    const statementRow = document.createElement('div');
    statementRow.className = 'statement-row d-flex align-items-center gap-2 mb-2';

    statementRow.innerHTML = `
        <select class="form-select statement-select" style="width: 120px;">
            <option value="true" ${statementData?.is_true ? 'selected' : ''}>Правда</option>
            <option value="false" ${!statementData?.is_true ? 'selected' : ''}>Ложь</option>
        </select>
        <input type="text" class="form-control statement-text" placeholder="Утверждение"
               value="${statementData?.text || ''}">
        <button class="btn-close remove-statement-btn" title="Удалить утверждение" style="transform: scale(0.7);"></button>
    `;

    container.appendChild(statementRow);
}

function addUnscrambleCard(container, word = '', hint = '') {
    const cardsContainer = container.querySelector('#unscramble-cards');
    if (!cardsContainer) return;

    const card = document.createElement('div');
    card.className = 'unscramble-card card mb-3';
    card.style.position = 'relative';

    card.innerHTML = `
        <div class="card-body">
            <div class="d-flex align-items-center">
                <input type="text" class="form-control word-input mt-2" placeholder="Введите слово" value="${escapeHtml(word)}">
                <i class="bi bi-question-circle ms-2" data-bs-toggle="tooltip"
                   title="Буквы будут перемешаны автоматически"></i>
            </div>
            <button class="btn btn-sm border-0 text-primary fw-bold ms-2 mt-2 add-hint-btn">
                <i class="bi bi-plus"></i> Добавить подсказку
            </button>
            <button class="btn btn-close remove-card-btn"
                    style="position: absolute; top: 5px; right: 5px; transform: scale(0.7);"></button>
        </div>
    `;

    if (hint) {
        addHintInput(card, hint);
    }

    // Initialize tooltip
    const tooltipElement = card.querySelector('[data-bs-toggle="tooltip"]');
    if (window.bootstrap) {
        new bootstrap.Tooltip(tooltipElement);
    }

    cardsContainer.appendChild(card);
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function addHintInput(card, hint = '') {
    const hintInput = document.createElement('input');
    hintInput.type = 'text';
    hintInput.className = 'form-control mt-2 hint-input';
    hintInput.placeholder = 'Введите подсказку (необязательно)';
    hintInput.value = escapeHtml(hint);

    const addHintBtn = card.querySelector('.add-hint-btn');
    addHintBtn.parentNode.insertBefore(hintInput, addHintBtn.nextSibling);
    addHintBtn.style.display = 'none';
}

function shuffleString(str) {
    const res = str.split('').sort(() => 0.5 - Math.random()).join('');
    return res;
}

function addSentenceCard(container, sentence = '') {
    if (!container) return;

    const card = document.createElement('div');
    card.className = 'sentence-card card mb-3';
    card.style.position = 'relative';

    card.innerHTML = `
        <div class="card-body">
            <div class="d-flex align-items-center">
                <input type="text" class="form-control sentence-input"
                       placeholder="Введите предложение" value="${escapeHtml(sentence)}">
                <i class="bi bi-info-circle ms-2" data-bs-toggle="tooltip"
                   title="Слова будут автоматически перемешаны"></i>
            </div>
            <button class="btn btn-close remove-card-btn"
                    style="position: absolute; top: 5px; right: 5px; transform: scale(0.7);"></button>
        </div>
    `;

    // Инициализация тултипа
    const tooltipElement = card.querySelector('[data-bs-toggle="tooltip"]');
    if (window.bootstrap) {
        new bootstrap.Tooltip(tooltipElement);
    }

    container.appendChild(card);
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function shuffleSentence(words) {
    let shuffled;
    do {
        shuffled = [...words].sort(() => Math.random() - 0.5);
    } while (shuffled.join(' ') === words.join(' '));

    return shuffled;
}

function addEssayCriteria(container, text = '', points = 1) {
    const criteriaItem = document.createElement('div');
    criteriaItem.className = 'criteria-item card mb-2';

    criteriaItem.innerHTML = `
        <div class="card-body d-flex align-items-center gap-2">
            <input type="text" class="form-control criteria-text"
                   placeholder="Критерий" value="${escapeHtml(text)}">
            <input type="number" class="form-control criteria-points"
                   placeholder="Балл" min="0" value="${points}" style="width: 100px;">
            <button class="btn btn-close" type="button"></button>
        </div>
    `;

    container.appendChild(criteriaItem);
    criteriaItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function uploadImage(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject("Файл не выбран");
            return;
        }

        let formData = new FormData();
        formData.append('image', file);

        const csrfToken = getCookie('csrftoken');  // Получаем токен из куки

        fetch('/upload-image/', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': csrfToken
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                resolve(data);
            } else {
                reject(data); // Возвращаем ошибку от сервера
            }
        })
        .catch(error => {
            showNotification('Ошибка загрузки изображения: ' + error, "danger");
            reject({ error: "Ошибка загрузки" });
        });
    });
}

function createImageItemElement(image_url, title="") {
    const item = document.createElement('div');
    item.className = 'image-item card border-0 m-2';
    item.innerHTML = `
        <div class="card-body m-0">
            <div class="image-preview image-square mb-2">
                <img src="${image_url}" class="img-fluid rounded" alt="Превью">
            </div>
            <div class="d-flex align-items-center gap-2">
                <input type="text" class="form-control form-control-sm caption-input"
                       value="${title}"
                       placeholder="Введите подпись">
                <button type="button" class="btn-close" aria-label="Удалить"></button>
            </div>
        </div>
    `;

    // Добавляем обработчик удаления
    const closeBtn = item.querySelector('.btn-close');
    closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        item.remove();
    });

    // Добавляем стиль для серой кнопки закрытия
    closeBtn.style.filter = 'grayscale(1) opacity(0.7)';

    taskEditorContainer.querySelector('.images-grid').appendChild(item);
}

function createColumnElement(columnData = null) {
    const columnContainer = document.createElement('div');
    columnContainer.className = 'col-12 col-md-6 col-lg-4 position-relative';

    const columnCard = document.createElement('div');
    columnCard.className = 'card column-card m-2';

    columnCard.innerHTML = `
        <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <input type="text" class="form-control column-name"
                       placeholder="Название колонки" value="${escapeHtml(columnData?.name || '')}">
                <button class="btn btn-close remove-column-btn ms-2" title="Удалить колонку"></button>
            </div>
            <div class="words-container mb-2"></div>
            <button class="btn btn-sm border-0 ms-1 text-primary fw-bold add-word-btn">
                <i class="bi bi-plus"></i> Добавить слово
            </button>
        </div>
    `;

    const wordsContainer = columnCard.querySelector('.words-container');

    // Добавление слов если есть данные
    if (columnData?.words?.length > 0) {
        columnData.words.forEach(word => {
            wordsContainer.appendChild(createWordField(word));
        });
    } else {
        wordsContainer.appendChild(createWordField());
    }

    // Обработчики событий
    columnCard.querySelector('.add-word-btn').addEventListener('click', () => {
        wordsContainer.appendChild(createWordField());
    });

    columnCard.querySelector('.remove-column-btn').addEventListener('click', () => {
        columnContainer.remove();
    });

    columnContainer.appendChild(columnCard);
    return columnContainer;
}

function createWordField(initialValue = '') {
    const wordField = document.createElement('div');
    wordField.className = 'mb-2 word-field w-100';

    wordField.innerHTML = `
        <div class="d-flex align-items-center">
            <input type="text" class="form-control word-input"
                   placeholder="Введите слово" value="${escapeHtml(initialValue)}">
            <button class="btn btn-close remove-word-btn ms-1 me-3" style="transform: scale(0.7);"></button>
        </div>
    `;

    const inputEl = wordField.querySelector('.word-input');
    const closeBtn = wordField.querySelector('.remove-word-btn');

    // Обновление видимости кнопки удаления
    const updateCloseButtons = () => {
        const parent = wordField.parentElement;
        if (!parent) return;

        const fields = parent.querySelectorAll('.word-field');
        fields.forEach(field => {
            const btn = field.querySelector('.remove-word-btn');
            btn.style.display = fields.length > 1 ? 'block' : 'none';
        });
    };

    // Обработчик удаления слова
    closeBtn.addEventListener('click', () => {
        wordField.remove();
        updateCloseButtons();
    });

    // Обработка вставки с разделителями
    inputEl.addEventListener('paste', (e) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text');
        const parent = wordField.parentElement;

        if (/[,\n\/]/.test(pasteData)) {
            const parts = pasteData.split(/[,\/\n]+/)
                                 .map(part => part.trim())
                                 .filter(part => part);

            if (parts.length > 0) {
                wordField.remove();
                parts.forEach(part => {
                    parent.appendChild(createWordField(part));
                });
                updateCloseButtons();
            }
        } else {
            // Обычная вставка если нет разделителей
            const start = inputEl.selectionStart;
            const end = inputEl.selectionEnd;
            const currentValue = inputEl.value;
            inputEl.value = currentValue.slice(0, start) + pasteData + currentValue.slice(end);
            inputEl.setSelectionRange(start + pasteData.length, start + pasteData.length);
        }
    });

    // Первоначальное обновление
    setTimeout(updateCloseButtons, 0);

    return wordField;
}

function uploadAudio(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject("Файл не выбран");
            return;
        }

        let formData = new FormData();
        formData.append('audio', file);

        fetch('/upload-audio/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                resolve(data);
            } else {
                reject(data.error || 'Ошибка загрузки');
            }
        })
        .catch(err => {
            reject('Ошибка загрузки: ' + err);
        });
    });
}

function embedInstructions() {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.tabIndex = -1;
    modal.innerHTML = `
        <div class="modal-dialog modal-lg modal-dialog-centered">
            <div class="modal-content shadow">
                <div class="modal-header">
                    <h5 class="modal-title">Как получить embed-код?</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Закрыть"></button>
                </div>
                <div class="modal-body">
                    <p>Вставьте embed-код (встроенный HTML) с одного из следующих ресурсов:</p>
                    <ul>
                        <li><strong>Wordwall:</strong> кнопка <em>«Поделиться»</em> → <em>«Встраивание»</em> → скопируйте HTML.</li>
                        <li><strong>Miro:</strong> кнопка <em>«Поделиться»</em> → <em>«Встроить на сайт»</em>.</li>
                        <li><strong>Quizlet:</strong> кнопка <em>«Поделиться»</em> → <em>«Встроить»</em>.</li>
                        <li><strong>LearningApps:</strong> внизу под приложением есть кнопка <em>«Встроить»</em>.</li>
                        <li><strong>Rutube:</strong> кнопка <em>«Поделиться»</em> → <em>«HTML-код»</em>.</li>
                        <li><strong>YouTube:</strong> кнопка <em>«Поделиться»</em> → <em>«Встроить»</em>.</li>
                    </ul>
                    <div class="alert alert-info mt-4">
                        Вставляемый код должен начинаться с <code>&lt;iframe ...&gt;</code> и содержать ссылку на один из поддерживаемых сайтов.
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Понятно</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();

    modal.addEventListener('hidden.bs.modal', () => {
        modal.remove();
    });
}

async function saveTaskWithData(container, { taskType, taskId = null, editMode = false }, data) {
    try {
        const sectionId = document.getElementById('main-container').dataset.sectionId;

        const params = {
            section_id: sectionId,
            task_type: taskType,
            obj_id: taskId || null
        };

        const savedTaskId = await saveTask(params, data);
        if (!savedTaskId) return;

        if (!editMode) {
            initializeBasicContainer(savedTaskId, sectionId, taskType);
        } else {
            updateTaskInContext(savedTaskId);
        }

        document.getElementById(savedTaskId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const fetchedData = await fetchTaskData(savedTaskId);
        if (fetchedData) {
            const handleFnName = 'handle' + (taskType.charAt(0).toUpperCase() + taskType.slice(1).toLowerCase());
            const handler = window[handleFnName];
            if (typeof handler === 'function') {
                handler(savedTaskId, fetchedData);
            } else {
                showNotification("Не удалось отобразить задание. Обновите страницу. Если ошибка повториться - пожалуйста, сообщите в поддержку.", "warning");
            }
        }

        closeWindow();

    } catch (error) {
        showNotification("Произошла ошибки при сохранении и отображении задания. Обратитесь в поддержку.", "danger")
    }
}

async function getWordListsFromContext() {
    try {
        // Шаг 1: Получаем контекст
        const contextData = await getContext(lessonId, "view");
        if (!contextData) {
            throw new Error("Контекст не найден");
        }

        // Шаг 2: Извлекаем все wordlist с заголовком "Список слов"
        const wordlists = Object.entries(contextData)
            .filter(([_, taskData]) => taskData.header === "Список слов")
            .map(([wordlistId]) => wordlistId);

        if (wordlists.length === 0) {
            throw new Error('Нет доступных wordlist с заголовком "Список слов"');
        }

        // Шаг 3: Получаем данные для каждого wordlist
        const allPairs = [];
        for (const wordlistId of wordlists) {
            const taskData = await fetchTaskData(wordlistId);
            if (!taskData || !Array.isArray(taskData.words)) {
                console.warn(`Данные для wordlist ${wordlistId} не найдены или имеют некорректный формат`);
                continue;
            }

            // Добавляем пары слово-перевод в общий массив
            allPairs.push(...taskData.words.map(pair => ({
                word: pair.word,
                translation: pair.translation
            })));
        }

        // Шаг 4: Возвращаем объединенный массив пар
        return allPairs;

    } catch (error) {
        console.error("Ошибка при получении wordlist из контекста:", error);
        showNotification("Не удалось получить данные wordlist. Обратитесь в поддержку.", "danger");
        return [];
    }
}

function removeEmojis(text) {
    // Регулярное выражение для поиска эмодзи
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F1E6}-\u{1F1FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F600}-\u{1F64F}]|[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]/gu;

    // Удаляем эмодзи из текста
    return text.replace(emojiRegex, '').trim();
}















        // Запросы к генерации ИИ и окно генерации
        
async function generateRequest(data, callback) {
    try {
        const response = await fetch('/hub/generate-request/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            showNotification('Ошибка генерации запроса.', "danger");
        }

        const result = await response.json();

        callback(result);
    } catch (error) {
        showNotification(error, 'danger')
        return { status: 'error', message: error.message };
    }
}

async function initializeGenerationWindow(type, options = ["context", "quantity", "fillType", "matchType", "language", "sentenceLength", "query", "image"]) {
    const container = document.createElement('div');
    container.className = 'mb-3 bg-light rounded p-3 generation-container';

    // Default options that should always be included
    if (["WordList", "FillInTheBlanks", "Note", "Article", "SortIntoColumns", "Essay"].includes(type)) options.push("emoji");
    if (!options.includes("context")) options.push("context");
    if (!options.includes("image")) options.push("image");

    const renderSelectRow = (id, label, values, selectedIndex = 1) => `
        <div class="col-md-4 mb-3">
            <label for="${id}" class="form-label small mb-1">${label}</label>
            <select class="form-select form-select-sm" id="${id}">
                ${values.map((opt, index) =>
                    `<option value="${opt.value}" ${index === selectedIndex ? 'selected' : ''}>${opt.label}</option>`
                ).join('')}
            </select>
        </div>
    `;

    container.innerHTML = `
        <div class="row">
            ${options.includes("context") ? renderSelectRow("contextSelect", "Контекст", [
                { value: true, label: "Учитывать" },
                { value: false, label: "Игнорировать" },
            ], 0) : ""}

            ${options.includes("emoji") ? renderSelectRow("emoji", "Эмодзи", [
                { value: true, label: "Включить" },
                { value: false, label: "Выключить" },
            ], 0) : ""}

            ${options.includes("quantity") ? renderSelectRow("quantity", "Количество", [
                { value: 1, label: "Мало" },
                { value: 2, label: "Средне" },
                { value: 3, label: "Много" },
            ], 1) : ""}

            ${options.includes("sentenceLength") ? renderSelectRow("length", "Длина", [
                { value: 1, label: "Короткие" },
                { value: 2, label: "Средние" },
                { value: 3, label: "Длинные" },
            ], 1) : ""}
        </div>

        <div class="row">
            ${options.includes("fillType") ? renderSelectRow("taskTypeSelect", "Тип", [
                { value: "lexical", label: "Лексика" },
                { value: "grammar", label: "Грамматика" },
            ]) : ""}

            ${options.includes("matchType") ? renderSelectRow("taskSubTypeSelect", "Формат", [
                { value: "word-translate", label: "Слово-перевод" },
                { value: "question-answer", label: "Вопрос-ответ" },
                { value: "beginning-continuation", label: "Начало-продолжение" },
                { value: "card1-card2", label: "Противоположности" },
                { value: "auto", label: "Авто" }
            ], 4) : ""}

            ${options.includes("testType") ? renderSelectRow("testTypeSelect", "Тест", [
                { value: "understanding", label: "Понимание" },
                { value: "lexical", label: "Лексика" },
                { value: "grammar", label: "Грамматика" },
                { value: "auto", label: "Авто" }
            ], 3) : ""}

            ${options.includes("language") ? renderSelectRow("languageSelect", "Язык", [
                { value: "en", label: "English" },
                { value: "ru", label: "Русский" }
            ]) : ""}
        </div>

        ${options.includes("query") ? `
            <div class="mb-3">
                <input type="text" class="form-control form-control-sm" id="queryInput" placeholder="Дополнительный запрос (необязательно)">
            </div>
        ` : ""}

        ${options.includes("image") ? `
            <div class="mb-3">
                <label class="form-label small mb-1">Изображение</label>
                <input type="file" class="form-control form-control-sm" id="imageInput" accept="image/*">
            </div>
        ` : ""}

        <div class="text-center mt-3">
            <button class="btn btn-primary btn-sm" id="generateButton">
                <span id="generateText">Сгенерировать</span>
                <span id="loadingIcon" class="spinner-border spinner-border-sm d-none" role="status" aria-hidden="true"></span>
            </button>
        </div>
    `;

    const generateButton = container.querySelector("#generateButton");
    generateButton?.addEventListener("click", async () => {
        const data = {};

        if (options.includes("context")) data.context = container.querySelector("#contextSelect").value === "true";
        if (options.includes("emoji")) data.emoji = container.querySelector("#emoji").value === "true";
        if (options.includes("quantity")) data.quantity = parseInt(container.querySelector("#quantity").value);
        if (options.includes("fillType")) data.fillType = container.querySelector("#taskTypeSelect").value;
        if (options.includes("matchType")) data.matchType = container.querySelector("#taskSubTypeSelect").value;
        if (options.includes("testType")) data.testType = container.querySelector("#testTypeSelect").value;
        if (options.includes("language")) data.language = container.querySelector("#languageSelect").value;
        if (options.includes("sentenceLength")) data.sentenceLength = parseInt(container.querySelector("#length").value);
        if (options.includes("query")) data.query = container.querySelector("#queryInput").value;
        if (options.includes("image")) {
            const file = container.querySelector("#imageInput").files[0];
            const reader = new FileReader();

            if (file) {
                reader.onload = function(e) {
                    // Get base64 string with data URL prefix
                    const base64String = e.target.result;
                    data.image = base64String;
                };

                reader.readAsDataURL(file);
            }
        }
        data.lessonId = lessonId;
        data.taskType = type;

        generateButton.disabled = true;
        const originalText = generateButton.querySelector("#generateText").textContent;
        generateButton.querySelector("#generateText").textContent = "Генерация...";
        generateButton.querySelector("#loadingIcon").classList.remove("d-none");

        setTimeout(() => {
            generateRequest(data, (result) => {
                generateButton.disabled = false;
                generateButton.querySelector("#generateText").textContent = originalText;
                generateButton.querySelector("#loadingIcon").classList.add("d-none");

                const handlerFunctionName = `handle${type}Generation`;
                if (typeof window[handlerFunctionName] === "function") {
                    window[handlerFunctionName](result);
                } else {
                    showRawAnswer(result);
                }
        });
        }, 1000)

        if (container.querySelector("#queryInput")?.classList.contains('required') &&
            container.querySelector("#queryInput").value.trim() === '') {
            showNotification("Запрос не может быть пустым.", "warning");
            return;
        }
    });

    return container;
}


function showRawAnswer(text) {
    showNotification("Не удалось обработать ответ.", "warning");
    const container = document.getElementById("generation-container");
    if (container) {
        const wrapper = document.createElement("div");
        wrapper.className = "bg-light position-relative p-3 rounded mb-3";
        wrapper.innerHTML = `
            <button class="btn btn-close position-absolute top-0 end-0 m-2" aria-label="Закрыть"></button>
            <pre class="mt-3">${text}</pre>
        `;

        // Удаление блока по нажатию крестика
        wrapper.querySelector(".btn-close").addEventListener("click", () => {
            wrapper.remove();
        });

        container.appendChild(wrapper);
    }
}





        // Функционал drag-and-drop для изменения порядка заданий

if (userRole === 'teacher' && mode === 'generation') {
    const dragToggle = document.getElementById('dragToggle');
    dragToggle.style.display = 'inline-block';

    document.addEventListener('DOMContentLoaded', () => {
        // Динамическая загрузка SortableJS
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js';
        script.onload = () => {
            console.log('SortableJS загружен');
        };
        document.head.appendChild(script);

        // Флаг для отслеживания состояния drag-and-drop
        let isDragAndDropEnabled = false;

        // Кнопка включения/выключения drag-and-drop
        dragToggle.addEventListener('click', toggleDragAndDrop);

        function toggleDragAndDrop() {
            const taskList = document.getElementById('task-list');

            // Проверяем, существует ли список задач и содержит ли он больше одной ВИДИМОЙ задачи
            if (!hasEnoughVisibleTasks(taskList)) {
                console.warn('Недостаточно задач для сортировки');
                showNotification('Недостаточно задач для сортировки', 'warning');
                return;
            }

            // Если drag-and-drop уже включен, выключаем его
            if (isDragAndDropEnabled) {
                disableDragAndDrop();
            } else {
                enableDragAndDrop();
            }

            function hasEnoughVisibleTasks(taskList) {
                if (!taskList) return false;

                // Фильтруем только видимые задачи
                const visibleTasks = Array.from(taskList.children).filter((task) => {
                    const style = window.getComputedStyle(task);
                    return style.display !== 'none';
                });

                return visibleTasks.length > 1;
            }
        }

        function enableDragAndDrop() {
            const taskList = document.getElementById('task-list');

            // Инициализируем SortableJS
            if (!taskList.sortableInstance) {
                taskList.sortableInstance = new Sortable(taskList, {
                    handle: '.drag-handle',
                    animation: 150,
                    scroll: true, // Включаем автопрокрутку
                    scrollSensitivity: 200, // Как близко к краю начинать прокрутку (px)
                    scrollSpeed: 20, // Скорость прокрутки
                    bubbleScroll: true,
                    ghostClass: 'sortable-ghost',
                    chosenClass: 'sortable-chosen',
                    dragClass: 'sortable-drag',
                    onStart: function(evt) {
                        document.body.style.cursor = 'grabbing';
                        document.querySelectorAll(".full-task-container").forEach((task) => {
                            task.style.opacity = 0.5;
                        });
                        evt.item.style.opacity = 1;
                    },
                    onEnd: function(evt) {
                        document.body.style.cursor = '';
                        document.querySelectorAll(".full-task-container").forEach((task) => {
                            task.style.opacity = 1;
                        });
                        updateTaskOrder();
                    }
                });
            }

            // Меняем состояние и текст кнопки
            isDragAndDropEnabled = true;
            changeMoveStatus(true); // Показываем drag-handles
        }

        function disableDragAndDrop() {
            const taskList = document.getElementById('task-list');

            // Удаляем экземпляр SortableJS
            if (taskList.sortableInstance) {
                taskList.sortableInstance.destroy();
                taskList.sortableInstance = null;
            }

            // Меняем состояние и текст кнопки
            isDragAndDropEnabled = false;
            changeMoveStatus(false); // Скрываем drag-handles
        }

        async function updateTaskOrder() {
            try {
                const taskItems = document.querySelectorAll('.task-item');
                if (taskItems.length === 0) {
                    throw new Error('Не найдены задачи для обновления порядка');
                }
                console.log(taskItems);
                const tasksData = Array.from(taskItems).map((item, index) => ({
                    id: item.id,
                    order: index + 1
                }));
                console.log(tasksData);

                const response = await fetch('/api/reorder-tasks/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken'),
                    },
                    body: JSON.stringify({ tasks: tasksData }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Ошибка сервера');
                }

                const data = await response.json();

                if (data.status !== 'success') {
                    throw new Error(data.message || 'Не удалось обновить порядок');
                }

            } catch (error) {
                console.error('Ошибка при обновлении порядка:', error);
                showNotification(`Ошибка: ${error.message}`, 'danger');
            }
        }
    });
}

// Функция для изменения состояния drag-handles
function changeMoveStatus(show) {
    const dragHandles = document.querySelectorAll('.drag-handle');
    if (!dragHandles || dragHandles.length === 0) {
        console.warn('Элементы drag-handle не найдены');
        return;
    }

    dragHandles.forEach((dragHandle) => {
        dragHandle.style.display = show ? 'flex' : 'none';
    });

    // Изменяем видимость других элементов
    const secondaryContainer = document.getElementById("secondary-container");
    const taskCreation = document.getElementById("task-creation");

    if (secondaryContainer) secondaryContainer.style.display = show ? "none" : "block";
    if (taskCreation) taskCreation.style.display = show ? "none" : "block";

    // Изменяем стили задач
    document.querySelectorAll(".full-task-container").forEach((task) => {
        task.style.maxHeight = show ? "200px" : "";
        task.style.overflow = show ? "hidden" : "";
    });
}