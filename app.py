import os
import json
from flask import Flask, render_template, request, jsonify

from collections import Counter
import statistics
from datetime import datetime

app = Flask(__name__)

DATA_FILE = os.path.join(os.path.dirname(__file__), 'data', 'games_data.json')
THEME_JS_FILE = os.path.join(os.path.dirname(__file__), 'static', 'js', 'theme.js')

# Cache theme.js content for inlining into templates (avoids render-blocking script)
_theme_js_cache = None

def get_theme_js():
    global _theme_js_cache
    if _theme_js_cache is None or app.debug:
        with open(THEME_JS_FILE, 'r', encoding='utf-8') as f:
            _theme_js_cache = f.read()
    return _theme_js_cache


@app.context_processor
def inject_theme_js():
    return dict(theme_js=get_theme_js())


def load_library():
    if not os.path.exists(DATA_FILE):
        return {"franchises": {}, "singles": []}

    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data


@app.route('/')
def index():
    data = load_library()

    # Подсчет статистики для бейджей в хедере
    stats = {
        'total': 0,
        'playing': 0,
        'completed': 0
    }

    # Вспомогательная функция для подсчета
    def count_game(game):
        stats['total'] += 1
        if game.get('status') == 'playing':
            stats['playing'] += 1
        elif game.get('status') == 'completed':
            stats['completed'] += 1

    # Считаем игры во франшизах
    for f_data in data.get('franchises', {}).values():
        for game in f_data.get('games', []):
            count_game(game)

    # Считаем одиночные игры
    for game in data.get('singles', []):
        count_game(game)

    # Передаем data целиком, чтобы сохранить группировку
    return render_template('library.html', data=data, stats=stats)


@app.route('/journey')
def journey():
    data = load_library()
    # Подсчет статистики для бейджей в хедере
    stats = {
        'total': 0,
        'playing': 0,
        'completed': 0
    }

    # Вспомогательная функция для подсчета
    def count_game(game):
        stats['total'] += 1
        if game.get('status') == 'playing':
            stats['playing'] += 1
        elif game.get('status') == 'completed':
            stats['completed'] += 1

    # Считаем игры во франшизах
    for f_data in data.get('franchises', {}).values():
        for game in f_data.get('games', []):
            count_game(game)

    # Считаем одиночные игры
    for game in data.get('singles', []):
        count_game(game)

    return render_template('journey.html', data=data, stats=stats)


@app.route('/settings')
def settings():
    return render_template('settings.html')

@app.route('/picker')
def picker():
    data = load_library()

    # Собираем все игры в один плоский список для JS
    all_games = []

    # Добавляем игры из франшиз
    for franchise_name, f_data in data.get('franchises', {}).items():
        for game in f_data.get('games', []):
            # Добавляем имя франшизы в объект игры для отображения
            game_copy = game.copy()
            game_copy['franchise_name'] = franchise_name
            all_games.append(game_copy)

    # Добавляем одиночные игры
    for game in data.get('singles', []):
        all_games.append(game)

    return render_template('picker.html', games=all_games)

@app.route('/api/update', methods=['POST'])
def update_game():
    """API endpoint для обновления данных игры"""
    try:
        game_data = request.get_json()

        new_title = game_data.get('title')
        original_title = game_data.get('original_title', new_title)
        new_franchise = game_data.get('franchise', '').strip()

        if not game_data or not new_title:
            return jsonify({'success': False, 'error': 'Invalid data'}), 400

        data = load_library()
        found_game = None
        found_in_franchise = None  # Название франшизы где нашли игру (или None если в singles)

        # 1. Поиск игры и удаление из текущего места
        # Ищем во франшизах
        for franchise_name, franchise_data in data.get('franchises', {}).items():
            for i, game in enumerate(franchise_data.get('games', [])):
                if game['title'] == original_title:
                    found_game = franchise_data['games'].pop(i)
                    found_in_franchise = franchise_name
                    break
            if found_game:
                break

        # Ищем в singles
        if not found_game:
            for i, game in enumerate(data.get('singles', [])):
                if game['title'] == original_title:
                    found_game = data['singles'].pop(i)
                    found_in_franchise = None
                    break

        if not found_game:
            print(f"Game not found. Searching for: {original_title}")
            return jsonify({'success': False, 'error': 'Game not found'}), 404

        # 2. Обновляем поля игры
        found_game['title'] = new_title
        if 'thumbnail' in game_data:
            found_game['thumbnail'] = game_data['thumbnail']
        if 'status' in game_data:
            found_game['status'] = game_data['status']
        if 'rating' in game_data:
            try:
                found_game['rating'] = float(game_data['rating'])
            except (ValueError, TypeError):
                found_game['rating'] = 0.0
        if 'platform' in game_data:
            found_game['platform'] = game_data['platform']
        if 'genre' in game_data:
            found_game['genre'] = game_data['genre']

        # 3. Добавляем игру в новое место
        if new_franchise and new_franchise in data.get('franchises', {}):
            # Добавляем в указанную франшизу
            data['franchises'][new_franchise]['games'].append(found_game)
        else:
            # Добавляем в singles
            if 'singles' not in data:
                data['singles'] = []
            data['singles'].append(found_game)

        # Сохранение
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)

        return jsonify({'success': True, 'message': 'Game updated successfully'})

    except Exception as e:
        print(f"Error updating game: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/add', methods=['POST'])
def add_game():
    """API endpoint для добавления новой игры"""
    try:
        game_data = request.get_json()

        title = game_data.get('title')
        if not game_data or not title:
            return jsonify({'success': False, 'error': 'Title is required'}), 400

        data = load_library()

        # Создаем новую игру
        from datetime import datetime
        new_game = {
            "title": title,
            "rating": float(game_data.get('rating', 0)) if game_data.get('rating') else 0.0,
            "status": game_data.get('status', 'not_started'),
            "platform": game_data.get('platform', 'PC'),
            "genre": game_data.get('genre', 'Unknown'),
            "date_added": datetime.now().strftime("%Y-%m-%d"),
            "thumbnail": game_data.get('thumbnail', '')
        }

        # Проверяем, указана ли франшиза
        franchise_name = game_data.get('franchise', '').strip()

        if franchise_name and franchise_name in data.get('franchises', {}):
            # Добавляем в указанную франшизу
            data['franchises'][franchise_name]['games'].append(new_game)
        else:
            # Добавляем в singles (одиночные игры)
            if 'singles' not in data:
                data['singles'] = []
            data['singles'].append(new_game)

        # Сохранение
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)

        return jsonify({'success': True, 'message': 'Game added successfully'})

    except Exception as e:
        print(f"Error adding game: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/add-franchise', methods=['POST'])
def add_franchise():
    """API endpoint для добавления новой франшизы"""
    try:
        franchise_data = request.get_json()

        name = franchise_data.get('name')
        if not franchise_data or not name:
            return jsonify({'success': False, 'error': 'Franchise name is required'}), 400

        data = load_library()

        # Проверяем, существует ли уже такая франшиза
        if name in data.get('franchises', {}):
            return jsonify({'success': False, 'error': 'Franchise already exists'}), 400

        # Создаем новую франшизу
        if 'franchises' not in data:
            data['franchises'] = {}

        data['franchises'][name] = {
            "total_count": int(franchise_data.get('total_count', 1)),
            "games": []
        }

        # Сохранение
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)

        return jsonify({'success': True, 'message': 'Franchise added successfully'})

    except Exception as e:
        print(f"Error adding franchise: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/dashboard')
def dashboard():
    data = load_library()

    # 1. Собираем все игры в плоский список
    all_games = []
    # Игры из франшиз
    for f_name, f_data in data.get('franchises', {}).items():
        for game in f_data.get('games', []):
            game_copy = game.copy()
            game_copy['franchise_name'] = f_name
            all_games.append(game_copy)
    # Одиночные игры
    for game in data.get('singles', []):
        game_copy = game.copy()
        game_copy['franchise_name'] = None
        all_games.append(game_copy)

    total_games = len(all_games)

    # Если библиотека пуста, отдаем пустой контекст
    if total_games == 0:
        return render_template('dashboard.html', analytics=None)

    # --- 2. ПРОГРЕСС (Progress & Status) ---
    status_counts = Counter(g.get('status', 'not_started') for g in all_games)

    completed = status_counts['completed']
    dropped = status_counts['dropped']
    playing = status_counts['playing']
    backlog = status_counts['not_started'] + status_counts['on_hold']

    completion_rate = round((completed / total_games * 100)) if total_games else 0
    drop_rate = round((dropped / total_games * 100)) if total_games else 0

    # --- 3. КАЧЕСТВО (Quality & Ratings) ---
    rated_games = [g for g in all_games if g.get('rating', 0) > 0]
    ratings = [float(g['rating']) for g in rated_games]

    avg_score = round(statistics.mean(ratings), 1) if ratings else 0.0
    masterpieces = len([r for r in ratings if r >= 9.5])
    disappointments = len([r for r in ratings if r < 5.0])

    # Гистограмма распределения (1..10)
    rating_dist = {i: 0 for i in range(1, 11)}
    for r in ratings:
        bucket = int(round(r))
        if bucket < 1: bucket = 1
        if bucket > 10: bucket = 10
        rating_dist[bucket] += 1

    # Нормализация для CSS-графика (находим макс. значение, чтобы считать %)
    max_dist_count = max(rating_dist.values()) if rating_dist else 0

    # --- 4. ПРЕДПОЧТЕНИЯ (Preferences) ---
    platforms = [g.get('platform', 'Unknown') for g in all_games]
    genres = [g.get('genre', 'Unknown') for g in all_games]

    top_platform = Counter(platforms).most_common(1)
    top_genre = Counter(genres).most_common(1)

    # Эффективность платформ (Средний рейтинг)
    plat_ratings = {}
    for g in rated_games:
        p = g.get('platform', 'Unknown')
        if p not in plat_ratings: plat_ratings[p] = []
        plat_ratings[p].append(g['rating'])

    platform_efficiency = []
    for p, scores in plat_ratings.items():
        if len(scores) >= 2:  # Считаем только если есть хотя бы 2 оценки
            platform_efficiency.append({
                'name': p,
                'avg': round(statistics.mean(scores), 1),
                'count': len(scores)
            })
    platform_efficiency.sort(key=lambda x: x['avg'], reverse=True)

    # --- 5. ВРЕМЯ (Time Analysis) ---
    # Парсим даты
    dated_games = []
    for g in all_games:
        if g.get('date_added'):
            try:
                dt = datetime.strptime(g['date_added'], '%Y-%m-%d')
                dated_games.append({'game': g, 'date': dt})
            except:
                pass

    # Пиковый год
    years = [d['date'].year for d in dated_games]
    peak_year = Counter(years).most_common(1)

    # Старейший бэклог
    backlog_items = [d for d in dated_games if d['game']['status'] in ['not_started', 'on_hold']]
    backlog_items.sort(key=lambda x: x['date'])
    oldest_backlog = backlog_items[0]['game'] if backlog_items else None

    # --- 6. ФРАНШИЗЫ ---
    franchise_stats = []
    for f_name, f_data in data.get('franchises', {}).items():
        f_games = f_data.get('games', [])
        f_total_planned = f_data.get('total_count', len(f_games))

        f_ratings = [g['rating'] for g in f_games if g.get('rating', 0) > 0]
        f_avg = round(statistics.mean(f_ratings), 1) if f_ratings else 0

        # Считаем завершенные
        f_comp_count = len([g for g in f_games if g.get('status') == 'completed'])
        is_completed = (f_comp_count >= f_total_planned) and (f_total_planned > 0)

        franchise_stats.append({
            'name': f_name,
            'total_count': f_total_planned,
            'avg_rating': f_avg,
            'is_completed': is_completed
        })

    longest_franchise = max(franchise_stats, key=lambda x: x['total_count']) if franchise_stats else None
    best_franchise = max(franchise_stats, key=lambda x: x['avg_rating']) if franchise_stats else None
    completed_series_count = len([f for f in franchise_stats if f['is_completed']])

    analytics = {
        'total': total_games,
        'completion_rate': completion_rate,
        'drop_rate': drop_rate,
        'playing_count': playing,
        'backlog_count': backlog,

        'avg_score': avg_score,
        'masterpieces': masterpieces,
        'disappointments': disappointments,
        'rating_dist': rating_dist,
        'max_dist_count': max_dist_count,

        'top_platform': top_platform[0][0] if top_platform else "N/A",
        'top_genre': top_genre[0][0] if top_genre else "N/A",
        'platform_efficiency': platform_efficiency[:3],

        'peak_year': peak_year[0][0] if peak_year else "N/A",
        'oldest_backlog': oldest_backlog,

        'longest_franchise': longest_franchise,
        'best_franchise': best_franchise,
        'completed_series_count': completed_series_count
    }

    return render_template('dashboard.html', analytics=analytics)


if __name__ == '__main__':
    app.run(debug=True, port=5000)