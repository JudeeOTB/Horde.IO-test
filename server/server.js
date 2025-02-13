// server.js (ES Module Syntax)
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
// Beispiel: direkter Import von der dist/index.js Datei
import { Server as SocketIOServer } from '../node_modules/socket.io/dist/index.js';

const app = express();
const PORT = process.env.PORT || 8080;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const httpServer = createServer(app);
const io = new SocketIOServer(httpServer);

app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

io.on('connection', (socket) => {
  console.log(`Neuer Client verbunden: ${socket.id}`);

  socket.on('playerJoined', (playerInfo) => {
    console.log(`Player joined: ${socket.id}`, playerInfo);
    socket.broadcast.emit('newPlayer', { id: socket.id, ...playerInfo });
  });

  socket.on('lobbyReady', () => {
    const numPlayers = io.engine.clientsCount;
    console.log(`LobbyReady von ${socket.id}. Aktuelle Spieler: ${numPlayers}`);
    if (numPlayers >= 2) {
      io.emit('startGame');
    }
  });

  socket.on('playerMoved', (playerInfo) => {
    socket.broadcast.emit('playerMoved', { id: socket.id, ...playerInfo });
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    socket.broadcast.emit('playerDisconnected', socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
