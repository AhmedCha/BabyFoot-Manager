const slider = document.getElementById("slider");
const gamesSection = document.getElementById("games-section");
const chatSection = document.getElementById("chat-section");
const socket = new WebSocket('ws://localhost:3000');
const gamesList = document.getElementById('games-list');
const player1Input = document.getElementById('player1');
const player2Input = document.getElementById('player2');
const addGameBtn = document.getElementById('add-game-btn');
const userNameInput = document.getElementById('user-name');
const chatHistory = document.getElementById('chat-history');
const chatForm = document.getElementById('chat-form');
const chatMessageInput = document.getElementById('chat-message');
let isDragging = false;
let unfinishedGameCount = 0;
let currentUserName = null;
let currentUserId = null;



slider.addEventListener("mousedown", () => {
	document.onmousemove = (event) => {
	  const containerWidth = slider.parentElement.offsetWidth;
	  const newGamesWidth = (event.clientX / containerWidth) * 100;
  
	  gamesSection.style.flex = `${newGamesWidth} 0 0`;
	  chatSection.style.flex = `${100 - newGamesWidth} 0 0`;
	};
  
	document.onmouseup = () => {
	  document.onmousemove = null;
	  document.onmouseup = null;
	};
  });


// Display a game in the list
function displayGame({ id, player1, player2, is_finished }) {
	const li = document.createElement('li');
	li.classList.add('game-item');
	li.dataset.id = id;
	updateGameStyles(li, is_finished);

	li.innerHTML = `
        <input type="checkbox" class="status-toggle" ${is_finished ? 'checked' : ''} />
        <span>${player1} VS ${player2}</span>
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

function updateUnfinishedCounter() {
	const unfinishedGames = Array.from(document.querySelectorAll('.game-item')).filter(
		(gameItem) => !gameItem.classList.contains('finished')
	).length;

	document.getElementById('unfinished-counter').textContent = unfinishedGames;
}

// Update the styling for a game item
function updateGameStyles(li, isFinished) {
	li.classList.toggle('finished', isFinished); // Add/remove 'finished' class
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

// Handle WebSocket messages
socket.onmessage = ({ data }) => {
	const parsedData = JSON.parse(data);
	const { type } = parsedData;

	switch (type) {
		case 'gameCreated':
			displayGame(parsedData.game);
			updateUnfinishedCounter(); // Recalculate the counter
			break;
		case 'gameUpdated': {
			const gameItem = document.querySelector(`li[data-id="${parsedData.game.id}"]`);
			if (gameItem) {
				updateGameStyles(gameItem, parsedData.game.is_finished);
				updateUnfinishedCounter(); // Recalculate the counter
				gameItem.querySelector('.status-toggle').checked = parsedData.game.is_finished;
			}
			break;
		}
		case 'gameDeleted':
			const gameItem = document.querySelector(`li[data-id="${parsedData.id}"]`);
			gameItem?.remove();
			updateUnfinishedCounter(); // Recalculate the counter
			break;
		case 'chatMessage':
			displayChatMessage(parsedData);
			break;
	}
};

// Add a new game
addGameBtn.addEventListener('click', (event) => {
	event.preventDefault();
	const player1 = player1Input.value.trim();
	const player2 = player2Input.value.trim();
	console.log(player1);
	console.log(player2);
	if (!player1Input || !player2Input){
		alert('Please enter a game name!');
		return;
	}
	if (player1Input && player1Input) {
		socket.send(JSON.stringify({ type: 'create', player1, player2 }));
		player1Input.value = '';
		player2Input.value = '';
	} else {
		alert('Please enter a game name!');
	}
});

// Send a chat message
chatForm.addEventListener('submit', (e) => {
	e.preventDefault();
	const name = userNameInput.value.trim();
	const message = chatMessageInput.value.trim();

	if (!name) {
		alert('Veuillez saisir votre nom !');
		return;
	}

	if (!message) {
		return;
	}

	socket.send(JSON.stringify({ type: 'chatMessage', name, message, id: currentUserId }));
	chatMessageInput.value = ''; 
});

// Set username
document.getElementById('set-name-btn').addEventListener('click', () => {
	const name = userNameInput.value.trim();

	if (!name) {
		alert('Le champ du nom ne peut pas être vide!');
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
	.then((res) => (res.ok ? res.json() : Promise.reject('Failed to fetch games')))
	.then((games) => {
		games.forEach(displayGame);
		updateUnfinishedCounter(); // Update the counter after displaying all games
	})
	.catch((err) => console.error('Error fetching games:', err));




