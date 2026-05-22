const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const UPLOAD_DIR = path.join(__dirname, 'uploads');
const ALLOWED_IDS = ['taplist', 'milkshakep1', 'milkshakep2'];

// ✅ Ensure uploads folder exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log("Created uploads folder:", UPLOAD_DIR);
}

// ✅ ✅ ACCEPT RAW IMAGE DATA (matches your VBA)
app.use(express.raw({ type: 'application/octet-stream', limit: '50mb' }));
app.use(express.raw({ type: 'image/jpeg', limit: '50mb' }));

// ✅ ✅ UPLOAD ROUTE (MUST BE BEFORE STATIC)
app.post('/upload/:imageId', (req, res) => {
  const imageId = req.params.imageId.toLowerCase();

  console.log("Upload hit:", imageId);

  if (!ALLOWED_IDS.includes(imageId)) {
    return res.status(400).json({ success: false, error: 'Invalid image id' });
  }

  if (!req.body || !Buffer.isBuffer(req.body) || req.body.length === 0) {
    return res.status(400).json({ success: false, error: 'No file received' });
  }

  const filePath = path.join(UPLOAD_DIR, `${imageId}.jpg`);

  try {
    fs.writeFileSync(filePath, req.body);
    const timestamp = Date.now();

    console.log("Saved:", filePath);

    // notify frontend
    io.emit('imageUpdated', { id: imageId, timestamp });

    res.json({
      success: true,
      url: `/uploads/${imageId}.jpg?ts=${timestamp}`
    });

  } catch (err) {
    console.error("Save error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ STATIC FILES (AFTER upload route)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOAD_DIR));

// ✅ ROUTES
app.get('/', (req, res) => {
  res.redirect('/taplist');
});

app.get('/taplist', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'taplist.html'));
});

app.get('/milkshakep1', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'milkshakep1.html'));
});

app.get('/milkshakep2', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'milkshakep2.html'));
});
  const page = req.params.page.toLowerCase();
  if (!ALLOWED_IDS.includes(page)) {
    return res.status(404).send('Page not found');
  }
  res.sendFile(path.join(__dirname, 'public', `${page}.html`));
});

// ✅ SOCKET.IO
io.on('connection', (socket) => {
  console.log("Client connected:", socket.id);

  socket.on('requestCurrent', ({ id }) => {
    if (!ALLOWED_IDS.includes(id)) return;

    const filePath = path.join(UPLOAD_DIR, `${id}.jpg`);
    if (fs.existsSync(filePath)) {
      socket.emit('imageUpdated', { id, timestamp: Date.now() });
    }
  });

  socket.on('disconnect', () => {
    console.log("Client disconnected:", socket.id);
  });
});

// ✅ START SERVER
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Server running on port", PORT);
  console.log("Uploads dir:", UPLOAD_DIR);
});
``
