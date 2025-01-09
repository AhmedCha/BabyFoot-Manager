const socket = new WebSocket('ws://localhost:3000');
const gamesList = document.getElementById('games-list');
const gameNameInput = document.getElementById('game-name');
const addGameBtn = document.getElementById('add-game-btn');
const userNameInput = document.getElementById('user-name');
const chatHistory = document.getElementById('chat-history');
const chatForm = document.getElementById('chat-form');
const chatMessageInput = document.getElementById('chat-message');
let currentUserName = null; // Tracks the current user's name securely
let currentUserId = null; // Unique identifier for the current user


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

// Display a chat message
function displayChatMessage({ id, name, message }) {
	const div = document.createElement('div');
	div.classList.add('chat-message');

	// Display "Me" if the sender's ID matches the current user's ID
	const displayName = id === currentUserId ? 'Me' : name;

	div.innerHTML = `<strong>${displayName}:</strong> ${message}`;
	chatHistory.appendChild(div);
	chatHistory.scrollTop = chatHistory.scrollHeight; // Scroll to the newest message
}


// Send a chat message
function sendChatMessage() {
	const name = userNameInput.value.trim();
	const message = chatMessageInput.value.trim();

	if (!name) {
		alert('Please enter your name!');
		return;
	}

	if (!message) {
		return; // Do nothing if the message is empty
	}

	// Send message to WebSocket server
	socket.send(JSON.stringify({ type: 'chatMessage', name, message, id:  currentUserId}));
	chatMessageInput.value = ''; // Clear the input field
}

// Handle WebSocket messages
socket.onmessage = ({ data }) => {
	const parsedData = JSON.parse(data);
	const { type } = parsedData;

	switch (type) {
		case 'gameCreated':
			displayGame(parsedData.game);
			break;
		case 'gameUpdated':
			const gameItem = document.querySelector(`li[data-id="${parsedData.game.id}"]`);
			if (gameItem) {
				updateGameStyles(gameItem, parsedData.game.is_finished);
			}
			break;
		case 'gameDeleted':
			document.querySelector(`li[data-id="${parsedData.id}"]`)?.remove();
			break;
		case 'chatMessage':
			displayChatMessage(parsedData);
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

// Send a chat message
chatForm.addEventListener('submit', (e) => {
	e.preventDefault();
	sendChatMessage();
});

// Set username
document.getElementById('set-name-btn').addEventListener('click', () => {
	const name = userNameInput.value.trim();

	if (!name) {
		alert('Please enter a valid name!');
		return;
	}

	// Generate a unique ID for this user (UUID-like approach)
	currentUserId = `${name}-${Date.now()}`;

	// Notify the server of the user's name and ID
	socket.send(JSON.stringify({ type: 'setName', name, id: currentUserId }));

	currentUserName = name; // Securely set the current user's name
	userNameInput.value = name;
	userNameInput.disabled = true; // Disable the name input
	document.getElementById('set-name-btn').disabled = true; // Disable the button
});


// Fetch existing games on page load
fetch('http://localhost:3000/games')
	.then((response) => response.ok ? response.json() : Promise.reject('Failed to fetch games'))
	.then((games) => games.forEach(displayGame))
	.catch((error) => console.error('Error fetching games:', error));



