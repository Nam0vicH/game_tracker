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