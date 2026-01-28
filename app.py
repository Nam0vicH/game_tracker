import os
import json
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

DATA_FILE = os.path.join(os.path.dirname(__file__), 'data', 'games_data.json')


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


if __name__ == '__main__':
    app.run(debug=True, port=5000)