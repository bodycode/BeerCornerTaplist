const express = require('express');
const http = require('http');
const path = require('path');
const multer = require('multer');
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

// Ensure uploads directory exists
try {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    console.log(`Created uploads directory: ${UPLOAD_DIR}`);
  } else {
    console.log(`Uploads directory exists: ${UPLOAD_DIR}`);
  }
} catch (err) {
  console.error(`Failed to create uploads directory: ${err.message}`);
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log(`Saving file to: ${UPLOAD_DIR}`);
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const filename = `${req.params.imageId}.jpg`;
    console.log(`Filename: ${filename}`);
    cb(null, filename);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOAD_DIR));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uploadsDir: UPLOAD_DIR, uploadsDirExists: fs.existsSync(UPLOAD_DIR) });
});

// Root redirect
app.get('/', (req, res) => {
  res.redirect('/taplist');
});

// Serve menu pages
app.get('/:page', (req, res) => {
  const page = req.params.page.toLowerCase();
  if (!ALLOWED_IDS.includes(page)) {
    return res.status(404).send('Page not found');
  }
  res.sendFile(path.join(__dirname, 'public', `${page}.html`));
});

// Image upload endpoint
app.post('/upload/:imageId', upload.single('menuImage'), (req, res) => {
  const imageId = req.params.imageId.toLowerCase();
  
  console.log(`Upload request for: ${imageId}`);
  
  if (!ALLOWED_IDS.includes(imageId)) {
    console.warn(`Invalid image ID: ${imageId}`);
    return res.status(400).json({ success: false, error: 'Invalid image id' });
  }
  
  if (!req.file) {
    console.warn(`No file uploaded for: ${imageId}`);
    return res.status(400).json({ success: false, error: 'No file uploaded' });
  }

  const timestamp = Date.now();
  const filePath = path.join(UPLOAD_DIR, `${imageId}.jpg`);
  
  // Verify file was actually saved
  if (fs.existsSync(filePath)) {
    console.log(`File saved successfully: ${filePath}`);
  } else {
    console.error(`File NOT saved: ${filePath}`);
  }
  
  // Notify all connected clients
  try {
    io.emit('imageUpdated', { id: imageId, timestamp });
    console.log(`Broadcast sent for image: ${imageId}`);
  } catch (err) {
    console.error(`Error broadcasting: ${err.message}`);
  }

  res.json({
    success: true,
    url: `/uploads/${imageId}.jpg?ts=${timestamp}`,
    message: `Image ${imageId} uploaded and broadcast to clients`
  });
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  socket.on('requestCurrent', ({ id }) => {
    console.log(`Client ${socket.id} requested current image for: ${id}`);
    
    if (!ALLOWED_IDS.includes(id)) {
      console.warn(`Invalid ID requested: ${id}`);
      return;
    }
    
    const filePath = path.join(UPLOAD_DIR, `${id}.jpg`);
    if (fs.existsSync(filePath)) {
      console.log(`File exists, sending update for: ${id}`);
      socket.emit('imageUpdated', { id, timestamp: Date.now() });
    } else {
      console.log(`File not found: ${filePath}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });

  socket.on('error', (error) => {
    console.error(`Socket error from ${socket.id}: ${error}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`BeerCorner menu server running on port ${PORT}`);
  console.log(`Uploads directory: ${UPLOAD_DIR}`);
  console.log(`Uploads directory exists: ${fs.existsSync(UPLOAD_DIR)}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
