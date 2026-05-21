const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const OUTPUT_DIR = path.join(__dirname, 'public', 'outputs');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const upload = multer({ dest: OUTPUT_DIR });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/upload', upload.single('file'), (req, res) => {
  const dest = path.join(OUTPUT_DIR, 'latest.pdf');
  fs.rename(req.file.path, dest, err => {
    if (err) {
      console.error('Rename error:', err);
      return res.status(500).send('rename error');
    }
    broadcast('reload');
    res.send({ ok: true });
  });
});

app.post('/notify', (req, res) => {
  broadcast('reload');
  res.send({ ok: true });
});

function broadcast(msg) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on http://0.0.0.0:${PORT}`));
