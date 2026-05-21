# BeerCorner Menu Host

A lightweight Node.js website that hosts menu images for `Taplist`, `MilkshakeP1`, and `MilkshakeP2` and updates connected projector browser clients in real time.

## What it does

- Serves three pages:
  - `/taplist`
  - `/milkshakep1`
  - `/milkshakep2`
- Receives image uploads from Excel via HTTP POST
- Saves each image as a fixed file name in `uploads/`
- Uses Socket.IO to notify connected browsers when a new image is available
- Auto-reloads the visible image without manual refresh

## No local Node required — GitHub-first workflow

This repository is ready to be pushed to GitHub and used with CI to build container images. You do not need to run Node locally.

Recommended workflow:

- Push this repository to GitHub.
- Use the included GitHub Actions workflow to build and publish a Docker image to GitHub Container Registry (GHCR).
- Deploy the container to any container host (Render, Fly.io, Railway, DigitalOcean App Platform, etc.).

After deployment your public URLs will be:

- `https://<your-host>/taplist`
- `https://<your-host>/milkshakep1`
- `https://<your-host>/milkshakep2`

If you prefer a hosted PaaS with minimal setup, Render and Fly.io both support direct Docker/GitHub deploys.

### Deploying to Render

1. Push this repository to GitHub. The repo should include these files:
   - `server.js`
   - `package.json`
   - `Dockerfile`
   - `.github/workflows/build-and-publish.yml`
   - `public/`
   - `excel/UploadMenuToWebsite.bas`
2. Sign in to Render and create a new Web Service.
3. Connect your GitHub account and select this repository.
4. Choose the `main` branch.
5. Select `Docker` for the runtime environment.
6. Set the service port to `3000` if Render does not detect it automatically.
7. Deploy the service.
8. After deployment, use the Render URL as the VBA upload host.

Example final upload endpoint URLs:

- `https://<your-app>.onrender.com/upload/taplist`
- `https://<your-app>.onrender.com/upload/milkshakep1`
- `https://<your-app>.onrender.com/upload/milkshakep2`

Then use these visitor URLs for projectors/QR codes:

- `https://<your-app>.onrender.com/taplist`
- `https://<your-app>.onrender.com/milkshakep1`
- `https://<your-app>.onrender.com/milkshakep2`

Render will run the app in the cloud, so you do not need to run Node locally. If you want, I can also write a short GitHub repo creation and push command sequence for you.

## Excel VBA upload

The sample VBA in `excel/UploadMenuToWebsite.bas` shows how to upload a generated JPG to the website.

Set `serverUrl` to your deployed host, for example:

```vb
Const serverUrl As String = "http://your-server-address:3000"
```

Upload endpoints:

- `http://your-server-address:3000/upload/taplist`
- `http://your-server-address:3000/upload/milkshakep1`
- `http://your-server-address:3000/upload/milkshakep2`

## Future-proofing

- The backend supports adding new image IDs in `server.js` via `ALLOWED_IDS`.
- New pages can be added by copying `public/taplist.html`, renaming it, and updating `data-image-id`.
- The same Socket.IO update flow works for any new menu page.
- The upload API can be extended for more image types or metadata if needed.

## QR Code usage

Once the server is running, create QR codes that point to:

- `http://<server>:3000/taplist`
- `http://<server>:3000/milkshakep1`
- `http://<server>:3000/milkshakep2`

Use the projector laptop on one of these pages in fullscreen so the browser updates automatically whenever images are uploaded.

## Notes

- `uploads/` is ignored by Git, so uploaded images are not committed.
- For public access, deploy this server to any Node-capable host and use the host's URL in the VBA `SERVER_URL`.
- If you want HTTPS, use a reverse proxy or hosting provider that provides TLS.
