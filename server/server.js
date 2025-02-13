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

// Socket.IO-Server initialisieren
const io = new SocketIOServer(httpServer);

// Statische Dateien aus dem "public"-Ordner ausliefern
app.use(express.static(path.join(__dirname, '../public')));

// Root-Route liefert index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Socket.IO Logik
io.on('connection', (socket) => {
  console.log(`Neuer Client verbunden: ${socket.id}`);

  // Wenn ein Spieler beitritt, erhält er seine eigenen Daten später vom Client
  socket.on('playerJoined', (playerInfo) => {
    console.log(`Player joined: ${socket.id}`, playerInfo);
    // Hier könntest du Spielerinformationen in einer globalen Struktur speichern.
    // Informiere alle anderen Clients:
    socket.broadcast.emit('newPlayer', { id: socket.id, ...playerInfo });
  });
  
  // Wenn der Client signalisiert, dass er in der Lobby bereit ist
  socket.on('lobbyReady', () => {
    // Prüfe die Anzahl der verbundenen Clients:
    const numPlayers = io.engine.clientsCount; // Anzahl aller verbundenen Clients
    console.log(`LobbyReady von ${socket.id}. Aktuelle Spieler: ${numPlayers}`);
    if (numPlayers >= 2) {
      // Sobald mindestens 2 Spieler verbunden sind, starte das Spiel
      io.emit('startGame');
    }
  });
  
  // Spielerbewegung weiterleiten
  socket.on('playerMoved', (playerInfo) => {
    socket.broadcast.emit('playerMoved', { id: socket.id, ...playerInfo });
  });
  
  // Wenn ein Spieler die Verbindung trennt
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    socket.broadcast.emit('playerDisconnected', socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
