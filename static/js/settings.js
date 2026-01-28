document.addEventListener('DOMContentLoaded', () => {
    // 1. Инициализация UI (расстановка галочек)
    initSettingsUI();

    // 2. Подключение слушателей событий
    setupEventListeners();
});

function initSettingsUI() {
    const saved = JSON.parse(localStorage.getItem('app_appearance')) || {
        mode: 'preset',
        presetName: 'violet',
        customColor: '#d0bcff',
        background: 'default'
    };

    // Обновляем Swatches
    if (saved.mode === 'preset') {
        const swatch = document.querySelector(`.theme-swatch[data-theme="${saved.presetName}"]`);
        if (swatch) updateActiveSwatch(swatch);
    } else if (saved.mode === 'custom') {
        const input = document.getElementById('customColorInput');
        if (input) {
            input.value = saved.customColor;
            document.getElementById('hexValueLabel').innerText = saved.customColor.toUpperCase();
        }
        document.querySelectorAll('.theme-swatch').forEach(s => s.classList.remove('active'));
    }

    // Обновляем Background buttons
    document.querySelectorAll('.segment-btn').forEach(b => b.classList.remove('active'));
    const bgBtn = document.querySelector(`.segment-btn[data-bg="${saved.background}"]`);
    if (bgBtn) bgBtn.classList.add('active');
}

function setupEventListeners() {
    // Клик по Пресетам
    document.querySelectorAll('.theme-swatch').forEach(swatch => {
        swatch.addEventListener('click', (e) => {
            const themeName = e.target.dataset.theme;

            // Используем глобальную функцию из theme.js
            applyPreset(themeName);
            saveSettings({ mode: 'preset', presetName: themeName });

            updateActiveSwatch(e.target);
        });
    });

    // Изменение кастомного цвета
    const colorInput = document.getElementById('customColorInput');
    if (colorInput) {
        colorInput.addEventListener('input', (e) => {
            const hex = e.target.value;
            document.getElementById('hexValueLabel').innerText = hex.toUpperCase();

            // Глобальная функция
            applyCustomTheme(hex);
            document.querySelectorAll('.theme-swatch').forEach(s => s.classList.remove('active'));
        });

        colorInput.addEventListener('change', (e) => {
            saveSettings({ mode: 'custom', customColor: e.target.value });
        });
    }

    // Клик по фону (OLED/Default/Soft)
    document.querySelectorAll('.segment-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetBtn = e.target.closest('.segment-btn');
            const bgMode = targetBtn.dataset.bg;

            // Глобальная функция
            applyBackground(bgMode);
            saveSettings({ background: bgMode });

            document.querySelectorAll('.segment-btn').forEach(b => b.classList.remove('active'));
            targetBtn.classList.add('active');
        });
    });
}

function updateActiveSwatch(target) {
    document.querySelectorAll('.theme-swatch').forEach(s => s.classList.remove('active'));
    target.classList.add('active');
}