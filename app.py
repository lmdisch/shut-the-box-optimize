from flask import Flask, jsonify, request
from game_logic import roll_dice, get_possible_moves

app = Flask(__name__)

@app.route('/start_game', methods=['GET'])
def start_game():
    """Initializes the game tiles."""
    tiles = list(range(1, 11))
    return jsonify({'tiles': tiles})

@app.route('/roll', methods=['GET'])
def roll():
    """Rolls the dice and returns the outcome."""
    dice1, dice2 = roll_dice()
    dice_sum = dice1 + dice2
    return jsonify({'dice1': dice1, 'dice2': dice2, 'dice_sum': dice_sum})

@app.route('/get_moves', methods=['POST'])
def get_moves_route():
    """Calculates possible moves based on current tiles and dice sum."""
    data = request.get_json()
    tiles = data['tiles']
    dice_sum = data['dice_sum']
    possible_moves = get_possible_moves(tiles, dice_sum)
    return jsonify({'possible_moves': possible_moves})

@app.route('/update_tiles', methods=['POST'])
def update_tiles_route():
    """Updates the tiles based on the chosen move and checks for win condition."""
    data = request.get_json()
    current_tiles = data['tiles']
    chosen_move = data['chosen_move']

    updated_tiles = [tile for tile in current_tiles if tile not in chosen_move]
    
    game_status = 'continue'
    if not updated_tiles:
        game_status = 'win'
        
    return jsonify({'updated_tiles': updated_tiles, 'status': game_status})

if __name__ == '__main__':
    app.run(debug=True)
