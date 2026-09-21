const popupOverlay = document.getElementById('eventPopup');
const popupLink = document.getElementById('eventPopupLink');
const popupImage = document.getElementById('eventPopupImage');
const popupClose = document.getElementById('eventPopupClose');

async function loadPopup() {
  try {
    const response = await fetch(`/popup-config?ts=${Date.now()}`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Popup config returned ${response.status}`);
    }

    const config = await response.json();

    const enabled = config.enabled === true;
    const hasUrl =
      typeof config.url === 'string' &&
      config.url.trim() !== '';

    let notExpired = true;

    if (config.expiry) {
      const expiryDate = new Date(`${config.expiry}T23:59:59`);
      notExpired =
        !Number.isNaN(expiryDate.getTime()) &&
        new Date() <= expiryDate;
    }

    if (enabled && hasUrl && notExpired) {
      popupLink.href = config.url;
      popupImage.src = `/uploads/popup.png?ts=${Date.now()}`;
      popupOverlay.hidden = false;
      document.body.classList.add('popup-open');
    } else {
      closePopup();
    }
  } catch (error) {
    console.error('Popup loading error:', error);
    closePopup();
  }
}

function closePopup() {
  popupOverlay.hidden = true;
  document.body.classList.remove('popup-open');
}

popupClose.addEventListener('click', (event) => {
  event.preventDefault();
  event.stopPropagation();
  closePopup();
});

popupOverlay.addEventListener('click', (event) => {
  if (event.target === popupOverlay) {
    closePopup();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closePopup();
  }
});

popupImage.addEventListener('error', () => {
  console.error('Popup image could not be loaded.');
  closePopup();
});

socket.on('popupUpdated', () => {
  loadPopup();
});

loadPopup();
