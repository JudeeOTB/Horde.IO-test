// server.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 8080;

// Ermitteln des aktuellen Verzeichnisses (für ES-Module)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Statische Dateien aus dem "public"-Ordner (angepasst an deine Struktur)
// Hier gehen wir davon aus, dass der "public"-Ordner sich im Root-Verzeichnis befindet,
// also eine Ebene über dem "server"-Ordner.
app.use(express.static(path.join(__dirname, '../public')));

// Test-Route: Liefert die index.html aus dem "public"-Ordner
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Starte den Server auf Port 8080 und binde an alle Interfaces
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server läuft auf Port ${PORT}`);
});
