// server.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

const app = express();
const PORT = process.env.PORT || 8080;

// Ermitteln des aktuellen Verzeichnisses (für ES-Module)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Erstelle einen HTTP-Server basierend auf Express
const httpServer = createServer(app);

// Integriere Socket.IO in den HTTP-Server
const io = new SocketIOServer(httpServer);

// Statische Dateien aus dem "public"-Ordner ausliefern
app.use(express.static(path.join(__dirname, '../public')));

// Beispiel: Root-Route liefert index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Socket.IO Logik
io.on('connection', (socket) => {
  console.log(`Neuer Client verbunden: ${socket.id}`);

  // Spieler beitreten
  socket.on('playerJoined', (playerInfo) => {
    console.log(`Player joined: ${socket.id}`, playerInfo);
    // Sende an alle anderen Clients: Neuer Spieler
    socket.broadcast.emit('newPlayer', { id: socket.id, ...playerInfo });
  });

  // Spieler bewegt sich
  socket.on('playerMoved', (playerInfo) => {
    // Leite die Bewegung an alle anderen weiter
    socket.broadcast.emit('playerMoved', { id: socket.id, ...playerInfo });
  });

  // Trenne die Verbindung
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    socket.broadcast.emit('playerDisconnected', socket.id);
  });
});

// Starte den Server auf Port 8080 und binde an alle Interfaces
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
