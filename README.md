# 🎮 Game Tracker

Персональная библиотека видеоигр с Material Design 3 интерфейсом. Отслеживайте прогресс, группируйте игры по франшизам и просматривайте статистику.

![Python](https://img.shields.io/badge/Python-3.10+-blue?logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.1-lightgrey?logo=flask)
![License](https://img.shields.io/badge/License-MIT-green)

## Возможности

- **Библиотека** — карточки игр с обложками, рейтингами и статусами (Играю / Пройдено / На паузе / Брошено / В планах)
- **Франшизы** — группировка игр по сериям с аккордеон-секциями
- **Поиск и сортировка** — мгновенный поиск по названию/франшизе, сортировка по имени, рейтингу, статусу
- **Три режима отображения** — сетка, список, компактный вид
- **Статистика (Journey)** — дашборд прогресса по франшизам
- **Темы оформления** — пресеты (Violet, Ocean, Emerald, Volcanic), кастомный цвет, выбор фона (OLED / Default / Soft)
- **Адаптивный дизайн** — десктоп (Navigation Rail) и мобильные устройства (Floating Island)

## Стек

| Компонент | Технология |
|-----------|-----------|
| Backend | Python, Flask |
| Frontend | Jinja2, Vanilla JS |
| Стили | CSS (Material Design 3 Expressive) |
| Шрифты | Roboto Flex, Material Symbols Rounded |
| Хранение | JSON (`data/games_data.json`) |

## Структура проекта

```
game_tracker/
├── app.py                  # Flask-приложение, API-эндпоинты
├── requirements.txt        # Зависимости Python
├── data/
│   └── games_data.json     # База данных игр
├── static/
│   ├── css/
│   │   ├── base.css        # Базовые стили, навигация
│   │   ├── library.css     # Стили библиотеки и карточек
│   │   ├── journey.css     # Стили страницы статистики
│   │   ├── mobile.css      # Адаптация под мобильные
│   │   └── settings.css    # Стили настроек
│   ├── js/
│   │   ├── theme.js        # Система тем (инлайнится в HTML)
│   │   ├── main.js         # Диалоги, FAB-меню, CRUD
│   │   ├── library.js      # Поиск, сортировка, переключение вида
│   │   └── settings.js     # Логика страницы настроек
│   └── img/
│       └── logo.svg        # Логотип
└── templates/
    ├── base.html           # Базовый шаблон с навигацией
    ├── library.html        # Главная — библиотека игр
    ├── journey.html        # Статистика по франшизам
    └── settings.html       # Настройки внешнего вида
```

## Установка и запуск

```bash
# Клонировать репозиторий
git clone https://github.com/<username>/game_tracker.git
cd game_tracker

# Создать виртуальное окружение
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/macOS

# Установить зависимости
pip install -r requirements.txt

# Запустить
python app.py
```

Приложение будет доступно по адресу **http://localhost:5000**

## API

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| `GET` | `/` | Библиотека игр |
| `GET` | `/journey` | Статистика |
| `GET` | `/settings` | Настройки |
| `POST` | `/api/add` | Добавить игру |
| `POST` | `/api/update` | Обновить игру |
| `POST` | `/api/add-franchise` | Создать франшизу |

