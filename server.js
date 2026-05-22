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

// Middleware to handle raw binary uploads
app.use(express.raw({ type: 'image/jpeg', limit: '50mb' }));
app.use(express.raw({ type: 'application/octet-stream', limit: '50mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOAD_DIR));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    uploadsDir: UPLOAD_DIR, 
    uploadsDirExists: fs.existsSync(UPLOAD_DIR),
    port: process.env.PORT || 3000
  });
});

// Test POST endpoint (for debugging)
app.post('/test-upload', (req, res) => {
  console.log('=== TEST UPLOAD RECEIVED ===');
  console.log(`Content-Type: ${req.get('content-type')}`);
  console.log(`Content-Length: ${req.get('content-length')}`);
  console.log(`Body size: ${Buffer.isBuffer(req.body) ? req.body.length : 'not a buffer'}`);
  
  if (Buffer.isBuffer(req.body) && req.body.length > 0) {
    console.log('✓ Test upload received successfully');
    res.json({ success: true, message: 'Test upload received', bytes: req.body.length });
  } else {
    console.log('✗ No data in request body');
    res.status(400).json({ success: false, message: 'No data received' });
  }
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

// Image upload endpoint - accepts raw binary data
app.post('/upload/:imageId', (req, res) => {
  const imageId = req.params.imageId.toLowerCase();
  
  console.log(`=== UPLOAD REQUEST ===${imageId}`);
  console.log(`Content-Type: ${req.get('content-type')}`);
  console.log(`Content-Length: ${req.get('content-length')}`);
  console.log(`Body size: ${Buffer.isBuffer(req.body) ? req.body.length : 'not a buffer'}`);
  
  if (!ALLOWED_IDS.includes(imageId)) {
    console.warn(`Invalid image ID: ${imageId}`);
    return res.status(400).json({ success: false, error: 'Invalid image id' });
  }
  
  // Check if we received any data
  if (!req.body || !Buffer.isBuffer(req.body) || req.body.length === 0) {
    console.warn(`No file data received for: ${imageId}`);
    return res.status(400).json({ success: false, error: 'No file data received' });
  }

  const filePath = path.join(UPLOAD_DIR, `${imageId}.jpg`);
  
  try {
    // Write the binary data to file
    fs.writeFileSync(filePath, req.body);
    const stats = fs.statSync(filePath);
    console.log(`✓ File saved: ${filePath} (${stats.size} bytes)`);
    
    const timestamp = Date.now();
    
    // Notify all connected clients
    io.emit('imageUpdated', { id: imageId, timestamp });
    console.log(`✓ Broadcast sent for image: ${imageId}`);

    res.json({
      success: true,
      url: `/uploads/${imageId}.jpg?ts=${timestamp}`,
      message: `Image ${imageId} uploaded successfully (${stats.size} bytes)`
    });
  } catch (err) {
    console.error(`✗ Error saving file ${filePath}: ${err.message}`);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to save file',
      details: err.message 
    });
  }
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log(`[SOCKET] Client connected: ${socket.id}`);
  
  socket.on('requestCurrent', ({ id }) => {
    console.log(`[SOCKET] Client ${socket.id} requested current image for: ${id}`);
    
    if (!ALLOWED_IDS.includes(id)) {
      console.warn(`[SOCKET] Invalid ID requested: ${id}`);
      return;
    }
    
    const filePath = path.join(UPLOAD_DIR, `${id}.jpg`);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      console.log(`[SOCKET] File exists (${stats.size} bytes), sending update for: ${id}`);
      socket.emit('imageUpdated', { id, timestamp: Date.now() });
    } else {
      console.log(`[SOCKET] File not found: ${filePath}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[SOCKET] Client disconnected: ${socket.id}`);
  });

  socket.on('error', (error) => {
    console.error(`[SOCKET] Error from ${socket.id}: ${error}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 BeerCorner menu server running on port ${PORT}`);
  console.log(`📁 Uploads directory: ${UPLOAD_DIR}`);
  console.log(`✓ Directory exists: ${fs.existsSync(UPLOAD_DIR)}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
