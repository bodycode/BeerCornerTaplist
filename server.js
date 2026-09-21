const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Log every request received by the server
app.use((req, res, next) => {
  console.log("INCOMING:", req.method, req.url);
  next();
});

// =====================================================
// FILE PATHS AND ALLOWED IMAGE IDS
// =====================================================

const UPLOAD_DIR = path.join(__dirname, 'uploads');

// Store the popup configuration inside the uploads folder.
// This keeps it with the persistent Render disk.
const POPUP_CONFIG_FILE = path.join(
  UPLOAD_DIR,
  'popup-config.json'
);

const ALLOWED_IDS = [
  'menuboard',
  'mobile',
  'popup'
];

// =====================================================
// ENSURE REQUIRED STORAGE EXISTS
// =====================================================

// Ensure uploads folder exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log("Created uploads directory:", UPLOAD_DIR);
}

// Ensure popup configuration file exists
if (!fs.existsSync(POPUP_CONFIG_FILE)) {
  fs.writeFileSync(
    POPUP_CONFIG_FILE,
    JSON.stringify({
      enabled: false,
      url: "",
      expiry: ""
    }, null, 2)
  );

  console.log(
    "Created popup configuration file:",
    POPUP_CONFIG_FILE
  );
}

// =====================================================
// POPUP CONFIG POST
// IMPORTANT: This must be above express.raw()
// =====================================================

app.post('/popup-config', express.json(), (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({
        success: false,
        error: "No valid JSON body received"
      });
    }

    const config = {
      enabled:
        req.body.enabled === true ||
        String(req.body.enabled).toLowerCase() === 'true',

      url:
        typeof req.body.url === 'string'
          ? req.body.url.trim()
          : "",

      expiry:
        typeof req.body.expiry === 'string'
          ? req.body.expiry.trim()
          : ""
    };

    fs.writeFileSync(
      POPUP_CONFIG_FILE,
      JSON.stringify(config, null, 2),
      'utf8'
    );

    console.log("POPUP CONFIG SAVED:", config);

    // Notify connected mobile pages that the popup changed
    io.emit('popupUpdated', config);

    res.json({
      success: true,
      config
    });

  } catch (err) {
    console.error(
      "Popup configuration save error:",
      err.message
    );

    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// =====================================================
// ORIGINAL WORKING VBA IMAGE PARSER
// Keep this after POST /popup-config
// =====================================================

app.use(express.raw({
  type: '*/*',
  limit: '50mb'
}));

// =====================================================
// IMAGE UPLOAD ENDPOINT
// =====================================================

app.post('/upload/:imageId', (req, res) => {
  const imageId = req.params.imageId.toLowerCase();

  console.log("UPLOAD HIT:", imageId);

  if (!ALLOWED_IDS.includes(imageId)) {
    return res.status(400).json({
      success: false,
      error: "Invalid image id"
    });
  }

  if (
    !req.body ||
    !Buffer.isBuffer(req.body) ||
    req.body.length === 0
  ) {
    return res.status(400).json({
      success: false,
      error: "No body received"
    });
  }

  const filePath = path.join(
    UPLOAD_DIR,
    `${imageId}.png`
  );

  try {
    // VBA sends multipart/form-data.
    // Strip away the multipart headers and boundary,
    // leaving only the PNG image bytes.
    const body = req.body.toString('binary');

    const headerEnd = body.indexOf("\r\n\r\n");
    const fileEnd = body.lastIndexOf("\r\n--");

    if (
      headerEnd === -1 ||
      fileEnd === -1 ||
      fileEnd <= headerEnd + 4
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid multipart format"
      });
    }

    const fileStart = headerEnd + 4;

    const fileData = Buffer.from(
      body.substring(fileStart, fileEnd),
      'binary'
    );

    fs.writeFileSync(filePath, fileData);

    const timestamp = Date.now();

    console.log(
      `SAVED IMAGE: ${filePath} (${fileData.length} bytes)`
    );

    // Notify all connected menu pages
    io.emit('imageUpdated', {
      id: imageId,
      timestamp
    });

    res.json({
      success: true,
      url: `/uploads/${imageId}.png?ts=${timestamp}`
    });

  } catch (err) {
    console.error("Upload error:", err.message);

    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// =====================================================
// POPUP CONFIG GET
// =====================================================

app.get('/popup-config', (req, res) => {
  try {
    const config = JSON.parse(
      fs.readFileSync(POPUP_CONFIG_FILE, 'utf8')
    );

    // Prevent the browser from showing an old cached config
    res.setHeader(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate'
    );

    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.json(config);

  } catch (err) {
    console.error(
      "Popup configuration read error:",
      err.message
    );

    res.status(500).json({
      enabled: false,
      url: "",
      expiry: "",
      error: err.message
    });
  }
});

// =====================================================
// STATIC FILES
// =====================================================

app.use(
  express.static(path.join(__dirname, 'public'))
);

app.use(
  '/uploads',
  express.static(UPLOAD_DIR, {
    etag: false,
    lastModified: false,
    setHeaders: (res) => {
      res.setHeader(
        'Cache-Control',
        'no-store, no-cache, must-revalidate'
      );
    }
  })
);

// =====================================================
// WEBSITE PAGES
// =====================================================

app.get('/', (req, res) => {
  res.redirect('/menuboard');
});

app.get('/menuboard', (req, res) => {
  res.sendFile(
    path.join(
      __dirname,
      'public',
      'menuboard.html'
    )
  );
});

app.get('/mobile', (req, res) => {
  res.sendFile(
    path.join(
      __dirname,
      'public',
      'mobile.html'
    )
  );
});

app.get('/display', (req, res) => {
  res.sendFile(
    path.join(
      __dirname,
      'public',
      'display.html'
    )
  );
});

// =====================================================
// SOCKET.IO
// =====================================================

io.on('connection', (socket) => {
  console.log("Client connected:", socket.id);

  socket.on('requestCurrent', ({ id }) => {
    if (
      typeof id !== 'string' ||
      !ALLOWED_IDS.includes(id)
    ) {
      return;
    }

    const filePath = path.join(
      UPLOAD_DIR,
      `${id}.png`
    );

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

  socket.on('error', (err) => {
    console.error(
      "Socket error:",
      socket.id,
      err.message
    );
  });
});

// =====================================================
// START SERVER
// =====================================================

const PORT = process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', () => {
  console.log("Server running on port", PORT);
  console.log("Uploads directory:", UPLOAD_DIR);
  console.log(
    "Popup configuration file:",
    POPUP_CONFIG_FILE
  );
});
