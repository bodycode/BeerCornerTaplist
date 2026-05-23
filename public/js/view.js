const imageId = document.body.dataset.imageId;
const imageElement = document.getElementById('menuImage');
const socket = io();

function refreshImage() {
  const url = `/uploads/${imageId}.png?ts=${Date.now()}`;
  imageElement.src = url;
}

socket.on('connect', () => {
  socket.emit('requestCurrent', { id: imageId });
});

socket.on('imageUpdated', (data) => {
  if (data.id === imageId) {
    refreshImage();
  }
});

imageElement.addEventListener('error', () => {
  imageElement.alt = 'No image uploaded yet.';
});
