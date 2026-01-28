document.addEventListener('DOMContentLoaded', () => {
    const dialog = document.getElementById('editDialog');
    const form = document.getElementById('editForm');
    const cancelBtn = document.getElementById('cancelBtn');

    // Inputs
    const inputTitle = document.getElementById('inputTitle');
    const inputImage = document.getElementById('inputImage');
    const inputStatus = document.getElementById('inputStatus');
    const inputRating = document.getElementById('inputRating');
    const inputPlatform = document.getElementById('inputPlatform');
    const previewImage = document.getElementById('previewImage');

    // Переменная для хранения старого названия (как ID)
    let currentOriginalTitle = "";

    // 1. Open Dialog Logic
    document.body.addEventListener('click', (e) => {
        const btn = e.target.closest('.edit-fab');
        if (!btn) return;

        // Сохраняем оригинальное название для поиска в БД
        currentOriginalTitle = btn.dataset.title;

        // Заполнение полей
        inputTitle.value = btn.dataset.title;
        inputImage.value = btn.dataset.image;
        inputStatus.value = btn.dataset.status;
        inputRating.value = btn.dataset.rating;
        inputPlatform.value = btn.dataset.platform;

        updatePreview(btn.dataset.image);
        dialog.showModal();
    });

    // 2. Update Preview Function
    function updatePreview(url) {
        if (url && url.trim() !== '') {
            previewImage.src = url;
            previewImage.style.opacity = '1';
        } else {
            previewImage.src = '';
            previewImage.style.opacity = '0';
        }
    }

    // 3. Event Listeners
    inputImage.addEventListener('input', (e) => updatePreview(e.target.value));
    previewImage.addEventListener('error', () => { previewImage.style.opacity = '0'; });
    cancelBtn.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (e) => {
        const rect = dialog.getBoundingClientRect();
        if (e.clientY < rect.top || e.clientY > rect.bottom ||
            e.clientX < rect.left || e.clientX > rect.right) {
            dialog.close();
        }
    });

    // 4. Save Logic
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        saveGameData();
    });

    async function saveGameData() {
        const formData = {
            original_title: currentOriginalTitle, // ВАЖНО: Отправляем старое имя для поиска
            title: inputTitle.value,              // Новое имя для сохранения
            thumbnail: inputImage.value,
            status: inputStatus.value,
            rating: parseFloat(inputRating.value),
            platform: inputPlatform.value
        };

        const saveBtn = document.getElementById('saveBtn');
        const originalText = saveBtn.textContent;
        saveBtn.disabled = true;
        saveBtn.textContent = "Saving...";

        try {
            const response = await fetch('/api/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                saveBtn.textContent = "Saved!";
                saveBtn.style.backgroundColor = "#c4eed0"; // Green
                saveBtn.style.color = "#0c3b1c";

                setTimeout(() => {
                    dialog.close();
                    location.reload();
                }, 800);
            } else {
                throw new Error(result.error || "Unknown error");
            }
        } catch (error) {
            console.error("Save error:", error);
            saveBtn.textContent = "Error!";
            saveBtn.style.backgroundColor = "#ffdad6"; // Red
            saveBtn.style.color = "#410002";

            setTimeout(() => {
                saveBtn.textContent = originalText;
                saveBtn.style.backgroundColor = "";
                saveBtn.style.color = "";
                saveBtn.disabled = false;
            }, 2000);
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. DOM Elements ---
    const elements = {
        dialog: document.getElementById('editDialog'),
        form: document.getElementById('editForm'),
        cancelBtn: document.getElementById('cancelBtn'),
        saveBtn: document.getElementById('saveBtn'),

        // FAB Elements
        fabWrapper: document.getElementById('fabSpeedDial'),
        fabTrigger: document.getElementById('fabTrigger'),

        // Inputs
        title: document.getElementById('inputTitle'),
        image: document.getElementById('inputImage'),
        status: document.getElementById('inputStatus'),
        rating: document.getElementById('inputRating'),
        platform: document.getElementById('inputPlatform'),
        genre: document.getElementById('inputGenre'),
        franchise: document.getElementById('inputFranchise'),
        franchiseSelectWrapper: document.getElementById('franchiseSelectWrapper'),

        // Preview
        previewImg: document.getElementById('previewImage'),
        dialogTitle: document.querySelector('.dialog-header .headline-small'),

        // Franchise Dialog Elements
        franchiseDialog: document.getElementById('franchiseDialog'),
        franchiseForm: document.getElementById('franchiseForm'),
        franchiseName: document.getElementById('inputFranchiseName'),
        totalCount: document.getElementById('inputTotalCount'),
        cancelFranchiseBtn: document.getElementById('cancelFranchiseBtn'),
        saveFranchiseBtn: document.getElementById('saveFranchiseBtn')
    };

    // --- 2. State Management ---
    let state = {
        mode: 'edit', // 'edit' or 'add'
        originalTitle: null // Ключ для поиска в БД при редактировании
    };

    // --- 3. FAB Speed Dial Logic (Menu) ---

    // Переключение меню
    if (elements.fabTrigger) {
        elements.fabTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            elements.fabWrapper.classList.toggle('is-open');
        });
    }

    // Закрытие при клике вне меню
    document.addEventListener('click', (e) => {
        if (elements.fabWrapper &&
            elements.fabWrapper.classList.contains('is-open') &&
            !elements.fabWrapper.contains(e.target)) {
            elements.fabWrapper.classList.remove('is-open');
        }
    });

    // Глобальные функции для вызова из HTML (onclick="...")
    window.openAddGameModal = function() {
        elements.fabWrapper.classList.remove('is-open');
        openModal('add');
    };

    window.openAddFranchiseModal = function() {
        elements.fabWrapper.classList.remove('is-open');
        if (elements.franchiseForm) {
            elements.franchiseForm.reset();
        }
        if (elements.franchiseDialog) {
            elements.franchiseDialog.showModal();
        }
    };

    // --- 4. Modal Logic (Open/Close) ---

    // Делегирование событий для кнопок редактирования (карандаш на карточке)
    document.body.addEventListener('click', (e) => {
        const btn = e.target.closest('.edit-fab');
        if (btn) {
            openModal('edit', btn.dataset);
        }
    });

    function openModal(mode, data = {}) {
        state.mode = mode;
        state.originalTitle = data.title || null;
        state.originalFranchise = data.franchise || ''; // Сохраняем текущую франшизу

        // Сброс ошибок картинки
        elements.previewImg.style.opacity = '0';

        // Показываем выбор франшизы в обоих режимах
        if (elements.franchiseSelectWrapper) {
            elements.franchiseSelectWrapper.style.display = 'block';
        }

        if (mode === 'edit') {
            // Заполняем поля
            elements.dialogTitle.textContent = "Edit Game";
            elements.title.value = data.title;
            elements.image.value = data.image;
            elements.status.value = data.status;
            elements.rating.value = data.rating;
            elements.platform.value = data.platform;
            elements.genre.value = data.genre || 'Unknown';
            if (elements.franchise) {
                elements.franchise.value = data.franchise || '';
            }

            updatePreview(data.image);
        } else {
            // Очищаем поля для новой игры
            elements.dialogTitle.textContent = "Add New Game";
            elements.form.reset();
            elements.genre.value = 'Unknown';
            if (elements.franchise) {
                elements.franchise.value = '';
            }
            updatePreview('');
        }

        elements.dialog.showModal();
    }

    // Закрытие диалога
    elements.cancelBtn.addEventListener('click', () => closeDialog());

    // Закрытие по клику на backdrop
    elements.dialog.addEventListener('click', (e) => {
        const rect = elements.dialog.getBoundingClientRect();
        if (e.clientY < rect.top || e.clientY > rect.bottom ||
            e.clientX < rect.left || e.clientX > rect.right) {
            closeDialog();
        }
    });

    function closeDialog() {
        elements.dialog.close();
        // Сброс кнопки сохранения в исходное состояние
        resetSaveButton();
    }

    // --- 5. Live Preview Logic ---

    elements.image.addEventListener('input', (e) => updatePreview(e.target.value));

    function updatePreview(src) {
        if (!src || src.trim() === '') {
            elements.previewImg.style.opacity = '0';
            elements.previewImg.src = '';
        } else {
            elements.previewImg.src = src;
            // Opacity ставим в 1 только когда картинка загрузилась (см. listener ниже)
        }
    }

    // Когда картинка загрузилась успешно
    elements.previewImg.addEventListener('load', () => {
        elements.previewImg.style.opacity = '1';
    });

    // Если ошибка загрузки
    elements.previewImg.addEventListener('error', () => {
        elements.previewImg.style.opacity = '0';
    });


    // --- 6. Form Submission (Save) ---

    elements.form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            original_title: state.originalTitle, // Старое имя (null если новая игра)
            title: elements.title.value,
            thumbnail: elements.image.value,
            status: elements.status.value,
            rating: parseFloat(elements.rating.value) || 0,
            platform: elements.platform.value,
            genre: elements.genre.value || 'Unknown',
            franchise: elements.franchise ? elements.franchise.value : '',
            mode: state.mode // Можно отправить на сервер, чтобы понять, это update или insert
        };

        // UI Feedback: Loading
        const originalBtnText = elements.saveBtn.textContent;
        setButtonState('loading', 'Saving...');

        try {
            // ВАЖНО: Если вы реализуете добавление, вам понадобится '/api/add'
            // Пока шлем всё на update, или меняем URL в зависимости от режима
            const url = state.mode === 'add' ? '/api/add' : '/api/update';

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            // Обработка 404 для API, которого нет (например, если нет /api/add)
            if (response.status === 404) throw new Error("API endpoint not found");

            const result = await response.json();

            if (result.success) {
                setButtonState('success', 'Saved!');
                setTimeout(() => {
                    closeDialog();
                    location.reload();
                }, 800);
            } else {
                throw new Error(result.error || "Unknown error");
            }
        } catch (error) {
            console.error("Save error:", error);
            setButtonState('error', 'Error!');

            // Возврат кнопки в норму через 2 секунды
            setTimeout(() => {
                resetSaveButton(originalBtnText);
            }, 2000);
        }
    });

    // --- 7. UI Helpers ---

    function setButtonState(status, text) {
        elements.saveBtn.disabled = true;
        elements.saveBtn.textContent = text;

        if (status === 'success') {
            elements.saveBtn.style.backgroundColor = 'var(--status-completed)'; // Green
            elements.saveBtn.style.color = '#0c3b1c';
        } else if (status === 'error') {
            elements.saveBtn.style.backgroundColor = 'var(--status-dropped)'; // Red
            elements.saveBtn.style.color = '#410002';
        }
    }

    function resetSaveButton(text = 'Save Changes') {
        elements.saveBtn.disabled = false;
        elements.saveBtn.textContent = text;
        elements.saveBtn.style.backgroundColor = '';
        elements.saveBtn.style.color = '';
    }

    // --- 8. Franchise Dialog Logic ---

    if (elements.cancelFranchiseBtn) {
        elements.cancelFranchiseBtn.addEventListener('click', () => {
            elements.franchiseDialog.close();
        });
    }

    if (elements.franchiseDialog) {
        elements.franchiseDialog.addEventListener('click', (e) => {
            const rect = elements.franchiseDialog.getBoundingClientRect();
            if (e.clientY < rect.top || e.clientY > rect.bottom ||
                e.clientX < rect.left || e.clientX > rect.right) {
                elements.franchiseDialog.close();
            }
        });
    }

    if (elements.franchiseForm) {
        elements.franchiseForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = {
                name: elements.franchiseName.value,
                total_count: parseInt(elements.totalCount.value) || 1
            };

            elements.saveFranchiseBtn.disabled = true;
            elements.saveFranchiseBtn.textContent = 'Creating...';

            try {
                const response = await fetch('/api/add-franchise', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                const result = await response.json();

                if (result.success) {
                    elements.saveFranchiseBtn.textContent = 'Created!';
                    elements.saveFranchiseBtn.style.backgroundColor = 'var(--status-completed)';
                    elements.saveFranchiseBtn.style.color = '#0c3b1c';

                    setTimeout(() => {
                        elements.franchiseDialog.close();
                        location.reload();
                    }, 800);
                } else {
                    throw new Error(result.error || 'Unknown error');
                }
            } catch (error) {
                console.error('Franchise save error:', error);
                elements.saveFranchiseBtn.textContent = 'Error!';
                elements.saveFranchiseBtn.style.backgroundColor = 'var(--status-dropped)';
                elements.saveFranchiseBtn.style.color = '#410002';

                setTimeout(() => {
                    elements.saveFranchiseBtn.disabled = false;
                    elements.saveFranchiseBtn.textContent = 'Create Franchise';
                    elements.saveFranchiseBtn.style.backgroundColor = '';
                    elements.saveFranchiseBtn.style.color = '';
                }, 2000);
            }
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. VIEW SWITCHER ---
    const viewBtns = document.querySelectorAll('.view-btn');
    const libraryFeed = document.getElementById('libraryFeed');

    // Load saved view preference
    const savedView = localStorage.getItem('library_view_mode') || 'grid';
    applyView(savedView);

    viewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            applyView(view);
            localStorage.setItem('library_view_mode', view);
        });
    });

    function applyView(viewMode) {
        // Update Buttons
        viewBtns.forEach(b => b.classList.remove('active'));
        document.querySelector(`.view-btn[data-view="${viewMode}"]`)?.classList.add('active');

        // Update All Grid Containers
        const grids = document.querySelectorAll('.cards-grid');
        grids.forEach(grid => {
            grid.classList.remove('view-grid', 'view-list', 'view-compact');
            grid.classList.add(`view-${viewMode}`);
        });
    }

    // --- 2. ACCORDIONS ---
    // Global function used in HTML onclick="toggleSection(this)"
    window.toggleSection = function(header) {
        const section = header.parentElement;
        section.classList.toggle('is-collapsed');
    };

    const toggleAllBtn = document.getElementById('toggleAllBtn');
    let allCollapsed = false;

    toggleAllBtn.addEventListener('click', () => {
        const sections = document.querySelectorAll('.franchise-group');
        allCollapsed = !allCollapsed;

        sections.forEach(sec => {
            if(allCollapsed) sec.classList.add('is-collapsed');
            else sec.classList.remove('is-collapsed');
        });

        // Toggle icon
        toggleAllBtn.querySelector('span').textContent =
            allCollapsed ? 'unfold_more' : 'unfold_less';
    });

    // --- 3. SEARCH (Live Filter) ---
    const searchInput = document.getElementById('librarySearch');

    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const franchises = document.querySelectorAll('.franchise-group');

        franchises.forEach(franchise => {
            let visibleCount = 0;
            const games = franchise.querySelectorAll('.game-card');

            games.forEach(game => {
                // Combine title, franchise name, and genre for search
                const title = game.querySelector('.game-title')?.textContent.toLowerCase() || "";
                const franchiseName = franchise.dataset.franchiseName.toLowerCase();
                // We could add data attributes for better searching

                if (title.includes(term) || franchiseName.includes(term)) {
                    game.style.display = '';
                    visibleCount++;
                } else {
                    game.style.display = 'none';
                }
            });

            // Hide entire franchise if no games match
            if (visibleCount === 0) {
                franchise.style.display = 'none';
            } else {
                franchise.style.display = '';
            }
        });
    });

    // --- 4. SORTING (Client Side DOM Sort) ---
    const sortSelect = document.getElementById('sortSelect');

    sortSelect.addEventListener('change', () => {
        const sortType = sortSelect.value;
        const grids = document.querySelectorAll('.cards-grid');

        grids.forEach(grid => {
            const cards = Array.from(grid.querySelectorAll('.game-card'));

            cards.sort((a, b) => {
                let valA, valB;

                switch(sortType) {
                    case 'name':
                        // Assuming you added data-title to <article> as suggested
                        valA = a.querySelector('.game-title').textContent.trim();
                        valB = b.querySelector('.game-title').textContent.trim();
                        return valA.localeCompare(valB);

                    case 'rating':
                        // Parse rating (extract number from text or data attr)
                        valA = parseFloat(a.dataset.rating || 0);
                        valB = parseFloat(b.dataset.rating || 0);
                        return valB - valA; // Descending

                    case 'status':
                        const statusOrder = { 'playing': 4, 'on_hold': 3, 'completed': 2, 'dropped': 1, 'not_started': 0 };
                        valA = statusOrder[a.dataset.status] || 0;
                        valB = statusOrder[b.dataset.status] || 0;
                        return valB - valA;

                    default: // Default (DOM order usually implies release date or DB order)
                         return 0;
                }
            });

            // Re-append in new order
            cards.forEach(card => grid.appendChild(card));
        });
    });
});