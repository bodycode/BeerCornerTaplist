const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const UPLOAD_DIR = path.join(__dirname, 'uploads');
const ALLOWED_IDS = ['taplist', 'milkshakep1', 'milkshakep2'];

// Ensure uploads folder exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Accept raw uploads
app.use(express.raw({ type: 'application/octet-stream', limit: '50mb' }));

// ✅ Upload route FIRST
app.post('/upload/:imageId', (req, res) => {
  const imageId = req.params.imageId.toLowerCase();

  if (!ALLOWED_IDS.includes(imageId)) {
    return res.status(400).json({ success: false });
  }

  if (!req.body || !Buffer.isBuffer(req.body)) {
    return res.status(400).json({ success: false });
  }

  const filePath = path.join(UPLOAD_DIR, `${imageId}.jpg`);

  fs.writeFileSync(filePath, req.body);

  const timestamp = Date.now();
  io.emit('imageUpdated', { id: imageId, timestamp });

  res.json({
    success: true,
    url: `/uploads/${imageId}.jpg?ts=${timestamp}`
  });
});

// ✅ Static files AFTER upload
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOAD_DIR));

// ✅ Explicit pages (no catch-all!)
app.get('/taplist', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'taplist.html'));
});

app.get('/milkshakep1', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'milkshakep1.html'));
});

app.get('/milkshakep2', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'milkshakep2.html'));
});

// socket
io.on('connection', (socket) => {
  console.log("Client connected:", socket.id);
});

// start server
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
