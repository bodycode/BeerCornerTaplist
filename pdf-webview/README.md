# PDF WebView

A small live PDF viewer project that serves a `latest.pdf` file and automatically refreshes connected browsers whenever the PDF is updated or a notification is received.

## Usage

1. Install dependencies:
```bash
cd pdf-webview
npm install
```

2. Start the server:
```bash
npm start
```

3. Load the viewer in any browser:
```text
http://<server-ip>:3000/
```

4. Save the PDF file as `public/outputs/latest.pdf`, or POST an updated PDF to `/upload`.

5. Call `/notify` after your VBA export to trigger the live refresh.

## VBA Example

Use this after exporting the worksheet to PDF:

```vb
Sub SavePdfAndNotify()
  Dim pdfPath As String
  pdfPath = "\\SERVER\share\pdf-webview\public\outputs\latest.pdf"

  ActiveSheet.ExportAsFixedFormat Type:=xlTypePDF, Filename:=pdfPath, Quality:=xlQualityStandard

  Dim http As Object
  Set http = CreateObject("MSXML2.XMLHTTP")
  Dim serverUrl As String
  serverUrl = "http://your-server-host:3000/notify"
  http.Open "POST", serverUrl, False
  http.setRequestHeader "Content-Type", "application/json"
  http.send "{\"file\":\"" & pdfPath & "\"}"
End Sub
```

## Deployment on GitHub

This repository is ready to publish a static viewer on GitHub Pages from the `public` folder. If you want the browser view only, push the `public` folder to GitHub Pages and point users at the generated Pages URL.

For live auto-refresh, the `public` page still needs the WebSocket backend from `server.js` running on a reachable host. The easiest setup is:

- Host `public` on GitHub Pages for the webpage UI.
- Host `server.js` on any server or VM with a public URL.
- Update the WebSocket URL in `public/index.html` if needed.

If you need, I can also add a second static-only fallback that polls the file instead of using WebSocket.

## Notes

- The `public/outputs/latest.pdf` file will be served at `/outputs/latest.pdf`.
- Browsers connected to the page will reload automatically when `/notify` is called.
- If you want a fully static GitHub Pages site, use the static `public` folder and add a separate hosted notification endpoint.
