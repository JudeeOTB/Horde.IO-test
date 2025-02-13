// server.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = process.env.PORT || 8080;

// Damit Express den richtigen Ordner findet:
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Statische Dateien aus dem 'public'-Ordner ausliefern
app.use(express.static(path.join(__dirname, 'public')));

// Optional: Falls du alle Anfragen auf index.html umleiten möchtest (Single-Page-App)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server läuft auf Port ${port}`);
});
