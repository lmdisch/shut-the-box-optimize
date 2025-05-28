// Global Variables / State
let currentTiles = [];
let currentDiceSum = 0;

document.addEventListener('DOMContentLoaded', () => {
    // Element References
    const tilesContainer = document.getElementById('tiles-container');
    const rollDiceBtn = document.getElementById('roll-dice-btn');
    const diceResultDisplay = document.getElementById('dice-result-display');
    const movesContainer = document.getElementById('moves-container');
    const submitMoveBtn = document.getElementById('submit-move-btn');
    const messageArea = document.getElementById('message-area');

    // --- Helper Functions ---

    /**
     * Renders the current state of tiles to the DOM.
     */
    function renderTiles() {
        tilesContainer.innerHTML = ''; // Clear previous tiles
        currentTiles.forEach(tileNumber => {
            const tileDiv = document.createElement('div');
            tileDiv.className = 'tile';
            tileDiv.textContent = tileNumber;
            tilesContainer.appendChild(tileDiv);
        });
    }

    /**
     * Updates the message area with a new message and type.
     * @param {string} message - The message to display.
     * @param {string} type - The type of message (e.g., 'info', 'error', 'success', 'win', 'loss').
     */
    function updateMessage(message, type = 'info') {
        messageArea.textContent = message;
        messageArea.className = 'message-area'; // Reset classes
        if (type) {
            messageArea.classList.add(type); // Add specific type class for styling
        }
    }

    /**
     * Enables or disables the main action buttons.
     * @param {boolean} rollingDisabled - True to disable roll dice button.
     * @param {boolean} submittingDisabled - True to disable submit move button.
     */
    function disableButtons(rollingDisabled, submittingDisabled) {
        rollDiceBtn.disabled = rollingDisabled;
        submitMoveBtn.disabled = submittingDisabled;
    }

    // --- Game Logic Functions ---

    /**
     * Initializes or restarts the game.
     */
    async function startGame() {
        try {
            const response = await fetch('/start_game');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();

            currentTiles = data.tiles;
            renderTiles();
            updateMessage('Game started! Roll the dice.');
            disableButtons(false, true); // Enable roll, disable submit
            diceResultDisplay.innerHTML = '';
            movesContainer.innerHTML = '';
            currentDiceSum = 0;
        } catch (error) {
            console.error('Error starting game:', error);
            updateMessage('Error starting game. Check console for details.', 'error');
        }
    }

    /**
     * Handles the dice roll action.
     */
    async function handleRollDice() {
        disableButtons(true, true); // Disable both while processing
        try {
            const response = await fetch('/roll');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();

            currentDiceSum = data.dice_sum;
            diceResultDisplay.textContent = `Rolled: ${data.dice1} + ${data.dice2} = ${data.dice_sum}`;
            updateMessage('Fetching possible moves...', 'info');
            await fetchPossibleMoves(); // This will handle button states based on outcome
        } catch (error) {
            console.error('Error rolling dice:', error);
            updateMessage('Error rolling dice. Check console.', 'error');
            disableButtons(false, true); // Re-enable roll if error occurs before move fetching
        }
    }

    /**
     * Fetches possible moves from the backend based on current tiles and dice sum.
     */
    async function fetchPossibleMoves() {
        try {
            const response = await fetch('/get_moves', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tiles: currentTiles, dice_sum: currentDiceSum })
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();

            renderMoves(data.possible_moves);

            if (data.possible_moves.length === 0) {
                const score = currentTiles.reduce((a, b) => a + b, 0);
                updateMessage(`No possible moves for sum ${currentDiceSum}. Game Over! Your score: ${score}`, 'loss');
                disableButtons(true, true); // Game over
            } else {
                updateMessage('Select a move and submit.');
                disableButtons(true, false); // Disable roll, enable submit
            }
        } catch (error) {
            console.error('Error fetching moves:', error);
            updateMessage('Error fetching moves. Check console.', 'error');
            // Potentially offer to roll again or restart, depending on game rules for this scenario
            disableButtons(false, true); // Or true, true if game should halt
        }
    }

    /**
     * Renders the possible moves as radio buttons in the DOM.
     * @param {Array<Array<number>>} moves - An array of possible moves.
     */
    function renderMoves(moves) {
        movesContainer.innerHTML = ''; // Clear previous moves
        if (!moves || moves.length === 0) {
            // This case is handled by fetchPossibleMoves for game over message
            // movesContainer.textContent = 'No moves available.'; 
            return;
        }

        moves.forEach((move, index) => {
            const moveId = `move-${index}`;
            const radioInput = document.createElement('input');
            radioInput.type = 'radio';
            radioInput.name = 'move';
            radioInput.id = moveId;
            radioInput.value = JSON.stringify(move);
            // radioInput.required = true; // Ensure a move is selected if form submitted

            const label = document.createElement('label');
            label.htmlFor = moveId;
            label.textContent = move.join(' + ');

            movesContainer.appendChild(radioInput);
            movesContainer.appendChild(label);
            movesContainer.appendChild(document.createElement('br')); // For line break
        });
    }

    /**
     * Handles the submission of a chosen move.
     */
    async function handleSubmitMove() {
        const selectedMoveInput = document.querySelector('input[name="move"]:checked');
        if (!selectedMoveInput) {
            updateMessage('Please select a move.', 'error');
            return;
        }

        disableButtons(true, true); // Disable both during processing
        const chosenMove = JSON.parse(selectedMoveInput.value);

        try {
            const response = await fetch('/update_tiles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tiles: currentTiles, chosen_move: chosenMove })
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();

            currentTiles = data.updated_tiles;
            renderTiles();
            diceResultDisplay.innerHTML = ''; // Clear dice display
            movesContainer.innerHTML = '';    // Clear moves

            if (data.status === 'win') {
                updateMessage('Congratulations! You shut the box!', 'win');
                disableButtons(true, true); // Game won
            } else { // 'continue'
                updateMessage('Move submitted. Roll the dice again.');
                disableButtons(false, true); // Enable roll, disable submit
            }
        } catch (error) {
            console.error('Error submitting move:', error);
            updateMessage('Error submitting move. Check console.', 'error');
            disableButtons(true, false); // Re-enable submit if error, roll stays disabled
        }
    }

    // --- Event Listeners ---
    rollDiceBtn.addEventListener('click', handleRollDice);
    submitMoveBtn.addEventListener('click', handleSubmitMove);

    // --- Initial Call ---
    startGame();
});
