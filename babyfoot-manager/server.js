const http = require('http');
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const WebSocket = require('ws');

// Initialize Express app
const app = express();

// PostgreSQL connection setup
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'babyfoot_db',
    password: 'Ahmed*1234',
    port: 5432,
});

// Middleware for JSON parsing and CORS
app.use(cors());
app.use(express.json());

// Helper function to broadcast messages to all WebSocket clients
const broadcastToClients = (message) => {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
};

// Get all games
app.get('/games', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM games ORDER BY id DESC');
        res.json(rows);
    } catch (error) {
        console.error('Error retrieving games:', error);
        res.status(500).json({ error: 'Error retrieving games' });
    }
});

// Create a new game
app.post('/games', async (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Game name is required' });
    }

    try {
        const { rows } = await pool.query(
            'INSERT INTO games (name, is_finished) VALUES ($1, $2) RETURNING *',
            [name, false]
        );
        const newGame = rows[0];

        broadcastToClients({ type: 'gameCreated', game: newGame });
        res.status(201).json(newGame);
    } catch (error) {
        console.error('Error creating game:', error);
        res.status(500).json({ error: 'Error creating game' });
    }
});

// Update game status
app.patch('/games/:id', async (req, res) => {
    const { id } = req.params;
    const { is_finished } = req.body;

    try {
        const { rows } = await pool.query(
            'UPDATE games SET is_finished = $1 WHERE id = $2 RETURNING *',
            [is_finished, id]
        );

        if (!rows.length) {
            return res.status(404).json({ error: 'Game not found' });
        }

        const updatedGame = rows[0];
        broadcastToClients({ type: 'gameUpdated', game: updatedGame });
        res.json(updatedGame);
    } catch (error) {
        console.error('Error updating game:', error);
        res.status(500).json({ error: 'Error updating game' });
    }
});

// Delete a game
app.delete('/games/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const { rows } = await pool.query('DELETE FROM games WHERE id = $1 RETURNING *', [id]);

        if (!rows.length) {
            return res.status(404).json({ error: 'Game not found' });
        }

        broadcastToClients({ type: 'gameDeleted', id: parseInt(id, 10) });
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting game:', error);
        res.status(500).json({ error: 'Error deleting game' });
    }
});

// HTTP server with WebSocket support
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// WebSocket handling
wss.on('connection', (ws) => {
    console.log('WebSocket connection established.');

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);

            if (data.type === 'create') {
                const { name } = data;
                if (!name) {
                    return ws.send(JSON.stringify({ error: 'Game name is required' }));
                }

                const { rows } = await pool.query(
                    'INSERT INTO games (name, is_finished) VALUES ($1, $2) RETURNING *',
                    [name, false]
                );
                const newGame = rows[0];
                broadcastToClients({ type: 'gameCreated', game: newGame });
            }
        } catch (error) {
            console.error('Error handling WebSocket message:', error);
        }
    });

    ws.on('close', () => console.log('WebSocket connection closed.'));
});

// Start the server
const PORT = 3000;
server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
