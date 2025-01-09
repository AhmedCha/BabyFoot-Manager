const socket = new WebSocket('ws://localhost:3000');
const gamesList = document.getElementById('games-list');
const gameNameInput = document.getElementById('game-name');
const addGameBtn = document.getElementById('add-game-btn');

// Display a game in the list
function displayGame({ id, name, is_finished }) {
    const li = document.createElement('li');
    li.classList.add('game-item');
    li.dataset.id = id;
    updateGameStyles(li, is_finished);

    li.innerHTML = `
        <input type="checkbox" class="status-toggle" ${is_finished ? 'checked' : ''} />
        <span>${name}</span>
        <button class="delete-button">
            <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
    `;

    li.querySelector('.status-toggle').addEventListener('change', (e) =>
        updateGame(id, { is_finished: e.target.checked })
    );

    li.querySelector('.delete-button').addEventListener('click', () => deleteGame(id));

    gamesList.appendChild(li);
}

// Update the styling for a game item
function updateGameStyles(li, isFinished) {
    li.style.color = isFinished ? 'red' : 'black';
    li.style.textDecoration = isFinished ? 'line-through' : 'none';
}

// Update game status or other properties
function updateGame(id, updates) {
    fetch(`http://localhost:3000/games/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
    }).catch((error) => console.error('Error updating game:', error));
}

// Delete a game
function deleteGame(id) {
    fetch(`http://localhost:3000/games/${id}`, { method: 'DELETE' })
        .catch((error) => console.error('Error deleting game:', error));
}

// Handle WebSocket messages
socket.onmessage = ({ data }) => {
    const { type, game, id } = JSON.parse(data);

    switch (type) {
        case 'gameCreated':
            displayGame(game);
            break;
        case 'gameUpdated': {
            const gameItem = document.querySelector(`li[data-id="${game.id}"]`);
            if (gameItem) {
                // Update styles and checkbox state
                updateGameStyles(gameItem, game.is_finished);
                gameItem.querySelector('.status-toggle').checked = game.is_finished;
            }
            break;
        }
        case 'gameDeleted':
            document.querySelector(`li[data-id="${id}"]`)?.remove();
            break;
    }
};

// Add a new game
addGameBtn.addEventListener('click', (event) => {
    event.preventDefault();
    const name = gameNameInput.value.trim();
    if (name) {
        socket.send(JSON.stringify({ type: 'create', name }));
        gameNameInput.value = '';
    } else {
        alert('Please enter a game name!');
    }
});

// Fetch existing games on page load
fetch('http://localhost:3000/games')
    .then((response) => response.ok ? response.json() : Promise.reject('Failed to fetch games'))
    .then((games) => games.forEach(displayGame))
    .catch((error) => console.error('Error fetching games:', error));
