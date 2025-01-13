const http = require('http');
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const WebSocket = require('ws');
const app = express();

// PostgreSQL connection setup
const pool = new Pool({
  user: '<votre_postgre_username>',
  host: '<votre_url>',                         // Mettez 'localhaut' pour un serveur local
  database: 'babyfoot_db',
  password: '<votre_postgre_mot_de_passe>',
  port: /*votre_port_postgres*/,               // 5432 par default
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
  const { player1, player2 } = req.body;
  if (!player1 || !player2) {
    return res.status(400).json({ error: 'Nom des joueurs manquant' });
  }

  try {
    const { rows } = await pool.query(
      'INSERT INTO games (player1, player2, is_finished) VALUES ($1, $2, $3) RETURNING *',
      [player1, player2, false]
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

      switch (data.type) {
        case 'create': {
          const { player1, player2 } = data;
          if (!player1 || !player2) {
            ws.send(JSON.stringify({ error: 'Nom des joueurs manquant' }));
            return;
          }

          const { rows } = await pool.query(
            'INSERT INTO games (player1, player2, is_finished) VALUES ($1, $2, $3) RETURNING *',
            [player1, player2, false]
          );
          const newGame = rows[0];
          broadcastToClients({ type: 'gameCreated', game: newGame });
          break;
        }
        case 'chatMessage': {
          const { id, name, message } = data;
          if (!id || !name || !message) {
            return;
          }
          broadcastToClients({ type: 'chatMessage', id, name, message });
          break;
        }
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
