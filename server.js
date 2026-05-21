const express = require('express');
const http = require('http');
const path = require('path');
const multer = require('multer');
const { Server } = require('socket.io');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const UPLOAD_DIR = path.join(__dirname, 'uploads');
const ALLOWED_IDS = ['taplist', 'milkshakep1', 'milkshakep2'];

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `${req.params.imageId}.jpg`)
});

const upload = multer({ storage });

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOAD_DIR));

app.get('/', (req, res) => {
  res.redirect('/taplist');
});

app.get('/:page', (req, res) => {
  const page = req.params.page.toLowerCase();
  if (!ALLOWED_IDS.includes(page)) {
    return res.status(404).send('Page not found');
  }
  res.sendFile(path.join(__dirname, 'public', `${page}.html`));
});

app.post('/upload/:imageId', upload.single('menuImage'), (req, res) => {
  const imageId = req.params.imageId.toLowerCase();
  if (!ALLOWED_IDS.includes(imageId)) {
    return res.status(400).json({ success: false, error: 'Invalid image id' });
  }
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' });
  }

  const timestamp = Date.now();
  io.emit('imageUpdated', { id: imageId, timestamp });

  res.json({
    success: true,
    url: `/uploads/${imageId}.jpg?ts=${timestamp}`
  });
});

io.on('connection', (socket) => {
  socket.on('requestCurrent', ({ id }) => {
    if (!ALLOWED_IDS.includes(id)) return;
    const filePath = path.join(UPLOAD_DIR, `${id}.jpg`);
    if (fs.existsSync(filePath)) {
      socket.emit('imageUpdated', { id, timestamp: Date.now() });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`BeerCorner menu server running on http://localhost:${PORT}`);
});
