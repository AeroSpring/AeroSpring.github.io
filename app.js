const TARGET_LAT = 44.970635;
const TARGET_LNG = 41.153389;

// Компонент A-Frame для клика / тапа по 3D-объекту
AFRAME.registerComponent('marker-click', {
  init: function () {
    const el = this.el;

    const handleTap = (e) => {
      // Предотвращаем фантомные двойные срабатывания на телефонах
      if (e.type === 'touchstart') {
        e.preventDefault();
      }

      const infoTile = document.getElementById('info-tile');
      if (infoTile) {
        infoTile.classList.toggle('hidden');
      }
    };

    // Слушаем и клик мыши, и касание пальцем на мобильном
    el.addEventListener('click', handleTap);
    el.addEventListener('touchstart', handleTap);
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

function updateUIData(lat, lng) {
  document.getElementById('my-coords').innerText = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

  const distMeters = calculateDistance(lat, lng, TARGET_LAT, TARGET_LNG);
  const distText = distMeters < 1000 
    ? `${Math.round(distMeters)} м` 
    : `${(distMeters / 1000).toFixed(2)} км`;

  document.getElementById('calc-dist').innerText = distText;
  document.getElementById('tile-distance').innerText = `Расстояние: ${distText}`;
}

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