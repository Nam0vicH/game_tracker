document.addEventListener('DOMContentLoaded', () => {
    const rollBtn = document.getElementById('rollBtn');
    const pickerCard = document.getElementById('pickerCard');
    const bgLayer = document.getElementById('pickerBackground');

    // Находим все инпуты внутри чипов
    const filterInputs = document.querySelectorAll('.filter-chip input');

    // Элементы внутри карточки
    const placeholder = document.querySelector('.poster-placeholder');
    const content = document.querySelector('.poster-content'); // Был класс .card-content или .poster-content? Проверь CSS. В прошлом ответе был .poster-content
    // Если в CSS (прошлый шаг) использовался .poster-content, то оставляем так.
    // Если .card-content (как в самой первой версии), то поправь селектор.
    // В версии "Кинематографичный" это .poster-content.

    const elImage = document.getElementById('resultImage');
    const elTitle = document.getElementById('resultTitle');
    const elFranchise = document.getElementById('resultFranchise');
    const elGenre = document.getElementById('resultGenre');
    const elPlatform = document.getElementById('resultPlatform');

    // --- ИСПРАВЛЕННАЯ ЛОГИКА ФИЛЬТРОВ ---
    filterInputs.forEach(input => {
        // Слушаем именно изменение галочки (которое делает браузер сам)
        input.addEventListener('change', function() {
            const chip = this.closest('.filter-chip');
            if (this.checked) {
                chip.classList.add('active');
            } else {
                chip.classList.remove('active');
            }
        });
    });

    // --- ЛОГИКА РУЛЕТКИ ---
    rollBtn.addEventListener('click', () => {
        // 1. Собираем статусы с отмеченных чекбоксов
        const activeStatuses = Array.from(filterInputs)
            .filter(input => input.checked)
            .map(input => input.value);

        if (activeStatuses.length === 0) {
            alert("Выберите хотя бы одну категорию!");
            return;
        }

        // Фильтруем список игр
        const candidates = ALL_GAMES.filter(g => activeStatuses.includes(g.status));

        if (candidates.length === 0) {
            alert("Игр с такими статусами не найдено!");
            return;
        }

        startRoulette(candidates);
    });

    function startRoulette(candidates) {
        rollBtn.disabled = true;
        pickerCard.classList.remove('winner');
        pickerCard.classList.add('shuffling');

        // Показываем контент, скрываем заглушку
        if(placeholder) placeholder.style.display = 'none';

        // ВАЖНО: убедись, что класс в HTML совпадает (.poster-content)
        const contentBlock = document.querySelector('.poster-content');
        if(contentBlock) contentBlock.classList.remove('hidden');

        bgLayer.classList.add('active');

        let duration = 2000;
        let interval = 50;
        let elapsed = 0;
        let timer;

        const step = () => {
            const game = candidates[Math.floor(Math.random() * candidates.length)];
            renderGame(game, false);

            elapsed += interval;
            if (elapsed < duration) {
                if (elapsed > duration * 0.6) interval += 20;
                timer = setTimeout(step, interval);
            } else {
                finish(candidates);
            }
        };
        step();
    }

    function finish(candidates) {
        const winner = candidates[Math.floor(Math.random() * candidates.length)];
        renderGame(winner, true);

        pickerCard.classList.remove('shuffling');
        pickerCard.classList.add('winner');
        rollBtn.disabled = false;

        if (navigator.vibrate) navigator.vibrate(50);
    }

    function renderGame(game, updateBackground) {
        if(elTitle) elTitle.textContent = game.title;

        const imgUrl = game.thumbnail || '/static/img/logo.svg';
        if(elImage) elImage.src = imgUrl;

        if (elFranchise) {
            if (game.franchise_name) {
                elFranchise.textContent = game.franchise_name;
                elFranchise.style.display = 'block';
            } else {
                elFranchise.style.display = 'none';
            }
        }

        if(elGenre) elGenre.textContent = game.genre || 'Game';
        if(elPlatform) elPlatform.textContent = game.platform || 'Unknown';

        if (updateBackground && bgLayer) {
            bgLayer.style.backgroundImage = `url('${imgUrl}')`;
        }
    }
});