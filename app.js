const TARGET_LAT = 44.970635;
const TARGET_LNG = 41.153389;
let currentDistanceMeters = 0;

// Регистрация A-Frame компонента для обработки нажатий
AFRAME.registerComponent('marker-click', {
  init: function () {
    this.el.addEventListener('click', () => {
      const infoTile = document.getElementById('info-tile');
      if (infoTile) {
        infoTile.classList.toggle('hidden');
      }
    });
  }
});

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Фильтрация отображения маркера по радиусу в км
function checkRadiusVisibility() {
  const radiusInput = document.getElementById('radius-input');
  const marker = document.getElementById('target-marker');
  
  if (!radiusInput || !marker) return;

  const maxRadiusKm = parseFloat(radiusInput.value) || 0;
  const currentDistanceKm = currentDistanceMeters / 1000;

  if (currentDistanceKm <= maxRadiusKm) {
    marker.setAttribute('visible', 'true');
  } else {
    marker.setAttribute('visible', 'false');
  }
}

function updateUIData(lat, lng) {
  document.getElementById('my-coords').innerText = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

  currentDistanceMeters = calculateDistance(lat, lng, TARGET_LAT, TARGET_LNG);
  const distText = currentDistanceMeters < 1000 
    ? `${Math.round(currentDistanceMeters)} м` 
    : `${(currentDistanceMeters / 1000).toFixed(2)} км`;

  document.getElementById('calc-dist').innerText = distText;
  document.getElementById('tile-distance').innerText = `Расстояние: ${distText}`;

  checkRadiusVisibility();
}

// Слушатели GPS
window.addEventListener('gps-camera-update-position', (e) => {
  updateUIData(e.detail.position.latitude, e.detail.position.longitude);
});

if ('geolocation' in navigator) {
  navigator.geolocation.watchPosition(
    (pos) => updateUIData(pos.coords.latitude, pos.coords.longitude),
    null,
    { enableHighAccuracy: true }
  );
}

// Отслеживание изменения радиуса в инпуте
document.addEventListener('DOMContentLoaded', () => {
  const radiusInput = document.getElementById('radius-input');
  if (radiusInput) {
    radiusInput.addEventListener('input', checkRadiusVisibility);
  }
});