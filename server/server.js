import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path'; // <<< NEU: Importiere das 'path' Modul
import { fileURLToPath } from 'url'; // <<< NEU: Für ES-Module __dirname Alternative

const __filename = fileURLToPath(import.meta.url); // <<< NEU
const __dirname = path.dirname(__filename);      // <<< NEU

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server);

// Middleware, um statische Dateien aus dem 'public'-Ordner bereitzustellen
// Da server.js im Ordner 'server' ist und 'public' eine Ebene höher liegt:
app.use(express.static(path.join(__dirname, '../public'))); // <<< DAS IST DIE WICHTIGE ZEILE

// Beispielhafte Map-Daten (könnten dynamisch generiert werden)
function generateMap() {
  // ... (dein Code bleibt gleich)
  return {
    buildings: [
      { id: 1, x: 500, y: 300, type: 'house' },
      { id: 2, x: 1200, y: 800, type: 'castle' }
    ],
    obstacles: [
      { id: 1, x: 800, y: 600, type: 'rock' },
      { id: 2, x: 1000, y: 400, type: 'tree' }
    ]
  };
}

let gameState = {
  players: {},
  map: generateMap(),
  inCharacterSelection: false
};

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  socket.on('playerJoined', (data) => {
    gameState.players[socket.id] = {
      id: socket.id,
      x: data.x,
      y: data.y,
      faction: data.faction,
      hp: 100,
      ready: false // noch nicht bereit – wartet auf Charakterauswahl
    };
    // Sende den initialen State nur an den neu verbundenen Client
    socket.emit('initialState', gameState); // Oder 'stateUpdate' wenn das für dich passt
    
    // Informiere andere Spieler über den neuen Spieler
    socket.broadcast.emit('newPlayer', gameState.players[socket.id]);
    
    if (Object.keys(gameState.players).length >= 2 && !gameState.inCharacterSelection) {
      gameState.inCharacterSelection = true;
      io.emit('showCharacterSelection');
      console.log("Mindestens 2 Spieler verbunden. Sende 'showCharacterSelection'.");
    }
  });
  
  socket.on('characterSelected', (data) => {
    if (gameState.players[socket.id]) {
      gameState.players[socket.id].faction = data.faction;
      // Hier noch nicht auf ready setzen, das passiert mit 'lobbyReady'
      // gameState.players[socket.id].ready = true; 
      console.log(`Player ${socket.id} hat ${data.faction} ausgewählt.`);
      // Sende ein Update, damit der Client die Auswahl bestätigen kann oder die UI aktualisiert
      io.emit('playerUpdated', gameState.players[socket.id]);
    }
  });
  
  socket.on('lobbyReady', () => {
    if (gameState.players[socket.id]) {
      gameState.players[socket.id].ready = true;
      console.log(`Player ${socket.id} ist in der Lobby bereit.`);
      io.emit('playerUpdated', gameState.players[socket.id]); // Informiere Clients über Ready-Status
    }

    let allReady = Object.values(gameState.players).every(player => player.ready);
    if (Object.keys(gameState.players).length >= 2 && allReady) {
      console.log("Alle Spieler sind bereit. Starte das Spiel.");
      gameState.inCharacterSelection = false; // Charakterauswahl ist vorbei
      io.emit('startGame', gameState); // Sende den initialen Spielzustand beim Start
    } else {
      console.log("Noch nicht alle Spieler sind bereit oder nicht genug Spieler.");
    }
  });
  
  socket.on('playerMoved', (data) => {
    if (gameState.players[socket.id]) {
      gameState.players[socket.id].x = data.x;
      gameState.players[socket.id].y = data.y;
      // Kein Broadcast hier, das macht der Interval unten
    }
  });
  
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    delete gameState.players[socket.id];
    io.emit('playerDisconnected', socket.id); // Sende an alle, auch den der ging (falls noch möglich)

    // Überprüfe, ob nach dem Disconnect die Bedingungen für CharacterSelection nicht mehr gelten
    if (Object.keys(gameState.players).length < 2 && gameState.inCharacterSelection) {
        gameState.inCharacterSelection = false;
        // Optional: Clients zurück zum Hauptmenü oder Wartebildschirm schicken
        io.emit('characterSelectionCancelled'); 
        console.log("Zu wenige Spieler, Charakterauswahl abgebrochen.");
    }
  });
});

// Sende 10-mal pro Sekunde den aktuellen Zustand an alle Clients
// Nur relevante Updates senden oder wenn sich was geändert hat, ist effizienter,
// aber für den Anfang ist das okay.
setInterval(() => {
  io.emit('stateUpdate', gameState);
}, 100); // 100ms = 10 FPS

server.listen(8080, () => {
  console.log('Server listening on port 8080');
});
