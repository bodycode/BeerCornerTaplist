const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use((req, res, next) => {
  console.log("INCOMING:", req.method, req.url);
  next();
});

const UPLOAD_DIR = path.join(__dirname, 'uploads');
const ALLOWED_IDS = ['menuboard', 'mobile'];

// Ensure uploads folder exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Accept multipart/raw uploads from VBA
app.use(express.raw({ type: '*/*', limit: '50mb' }));

// Upload endpoint
// Excel/VBA posts to: /upload/menuboard or /upload/mobile
app.post('/upload/:imageId', (req, res) => {
  const imageId = req.params.imageId.toLowerCase();

  console.log("UPLOAD HIT:", imageId);

  if (!ALLOWED_IDS.includes(imageId)) {
    return res.status(400).json({
      success: false,
      error: "Invalid image id"
    });
  }

  if (!req.body || !Buffer.isBuffer(req.body)) {
    return res.status(400).json({
      success: false,
      error: "No body received"
    });
  }

  const filePath = path.join(UPLOAD_DIR, `${imageId}.jpg`);

  try {
    // VBA is sending multipart/form-data, so we need to strip the multipart wrapper.
    const body = req.body.toString('binary');
    const start = body.indexOf("\r\n\r\n") + 4;
    const end = body.lastIndexOf("\r\n--");

    if (start < 4 || end <= start) {
      return res.status(400).json({
        success: false,
        error: "Invalid multipart format"
      });
    }

    const fileData = Buffer.from(body.substring(start, end), 'binary');

    fs.writeFileSync(filePath, fileData);

    const timestamp = Date.now();

    console.log(`SAVED IMAGE: ${filePath}`);

    io.emit('imageUpdated', {
      id: imageId,
      timestamp
    });

    res.json({
      success: true,
      url: `/uploads/${imageId}.jpg?ts=${timestamp}`
    });

  } catch (err) {
    console.error("Upload error:", err.message);

    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Static files
// Browser loads images from: /uploads/menuboard.jpg or /uploads/mobile.jpg
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOAD_DIR));

// Pages
app.get('/', (req, res) => {
  res.redirect('/menuboard');
});

app.get('/menuboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'menuboard.html'));
});

app.get('/mobile', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'mobile.html'));
});

// Socket.IO
io.on('connection', (socket) => {
  console.log("Client connected:", socket.id);

  socket.on('requestCurrent', ({ id }) => {
    if (!ALLOWED_IDS.includes(id)) {
      return;
    }

    const filePath = path.join(UPLOAD_DIR, `${id}.jpg`);

    if (fs.existsSync(filePath)) {
      socket.emit('imageUpdated', {
        id,
        timestamp: Date.now()
      });
    }
  });

  socket.on('disconnect', () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', () => {
  console.log("Server running on port", PORT);
});
