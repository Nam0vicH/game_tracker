document.addEventListener('DOMContentLoaded', () => {

    // --- 1. ПЕРЕКЛЮЧЕНИЕ ВИДА (VIEW SWITCHER) ---
    const viewBtns = document.querySelectorAll('.view-btn');
    const libraryFeed = document.getElementById('libraryFeed');

    // Загружаем сохраненный режим из localStorage
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
        // Обновляем состояние кнопок
        viewBtns.forEach(b => b.classList.remove('active'));
        document.querySelector(`.view-btn[data-view="${viewMode}"]`)?.classList.add('active');

        // Обновляем классы у всех сеток
        const grids = document.querySelectorAll('.cards-grid');
        grids.forEach(grid => {
            grid.classList.remove('view-grid', 'view-list', 'view-compact');
            grid.classList.add(`view-${viewMode}`);
        });
    }

    // --- 2. АККОРДЕОНЫ (СВОРАЧИВАНИЕ СЕКЦИЙ) ---
    // Глобальная функция для вызова из HTML: onclick="toggleSection(this)"
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

        // Меняем иконку кнопки (развернуть/свернуть)
        // unfold_less - стрелки друг к другу (свернуть)
        // unfold_more - стрелки друг от друга (развернуть)
        toggleAllBtn.querySelector('span').textContent =
            allCollapsed ? 'unfold_more' : 'unfold_less';
    });

    // --- 3. ПОИСК (ЖИВОЙ ФИЛЬТР) ---
    const searchInput = document.getElementById('librarySearch');

    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const franchises = document.querySelectorAll('.franchise-group');

        franchises.forEach(franchise => {
            let visibleCount = 0;
            const games = franchise.querySelectorAll('.game-card');

            // Получаем название франшизы для поиска
            const franchiseName = franchise.dataset.franchiseName.toLowerCase();

            games.forEach(game => {
                const title = game.dataset.title.toLowerCase();

                // Ищем совпадение в названии игры ИЛИ названии франшизы
                if (title.includes(term) || franchiseName.includes(term)) {
                    game.style.display = '';
                    visibleCount++;
                } else {
                    game.style.display = 'none';
                }
            });

            // Если в франшизе не найдено игр, скрываем всю секцию
            if (visibleCount === 0) {
                franchise.style.display = 'none';
            } else {
                franchise.style.display = '';
            }
        });
    });

    // --- 4. СОРТИРОВКА (Client Side) ---
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
                        valA = a.dataset.title;
                        valB = b.dataset.title;
                        // Используем localeCompare с 'ru' для правильной сортировки кириллицы
                        return valA.localeCompare(valB, 'ru');

                    case 'rating':
                        valA = parseFloat(a.dataset.rating || 0);
                        valB = parseFloat(b.dataset.rating || 0);
                        return valB - valA; // По убыванию (сначала 10, потом 1)

                    case 'status':
                        // Приоритет статусов: Играю > Пауза > Прошел > Бросил > В планах
                        const statusOrder = { 'playing': 4, 'on_hold': 3, 'completed': 2, 'dropped': 1, 'not_started': 0 };
                        valA = statusOrder[a.dataset.status] || 0;
                        valB = statusOrder[b.dataset.status] || 0;
                        return valB - valA;

                    default: // Default (Порядок в DOM, обычно по дате добавления или как в БД)
                         return 0;
                }
            });

            // Переставляем отсортированные элементы в DOM
            cards.forEach(card => grid.appendChild(card));
        });
    });
});