const TARGET_LAT = 44.970635;
const TARGET_LNG = 41.153389;

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

function updateUIData(lat, lng, accuracy) {
  document.getElementById('gps-status').innerText = 'Активен';
  document.getElementById('my-coords').innerText = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  
  if (accuracy !== undefined) {
    document.getElementById('gps-accuracy').innerText = `±${Math.round(accuracy)} м`;
  }

  const distanceMeters = calculateDistance(lat, lng, TARGET_LAT, TARGET_LNG);
  document.getElementById('calc-dist').innerText = `${Math.round(distanceMeters)} м`;
}

// 1. Основной поток от AR.js
window.addEventListener('gps-camera-update-position', (e) => {
  updateUIData(e.detail.position.latitude, e.detail.position.longitude, e.detail.position.accuracy);
});

// 2. Прямой дублирующий опрос GPS
if ('geolocation' in navigator) {
  navigator.geolocation.watchPosition(
    (pos) => updateUIData(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy),
    (err) => { document.getElementById('gps-status').innerText = `Ошибка: ${err.message}`; },
    { enableHighAccuracy: true }
  );
}