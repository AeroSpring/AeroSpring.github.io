// Данные точек
const points = [
  { id: 1, lat: 44.970635, lng: 41.153389, name: "Первая точка" }
];

let userCoords = null;
let activePointId = null;

// Формула гаверсинусов для точного расчета дистанции по сфере Земли
function getDistanceInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Отрисовка маркеров на сцене
function renderMarkers() {
  const scene = document.querySelector('a-scene');

  points.forEach(point => {
    const sphere = document.createElement('a-sphere');
    sphere.setAttribute('gps-entity-place', `latitude: ${point.lat}; longitude: ${point.lng};`);
    sphere.setAttribute('position', '0 4 0'); // Высота 4 метра
    sphere.setAttribute('radius', '3');
    sphere.setAttribute('material', 'color: #ff3366;');
    sphere.setAttribute('class', 'clickable');

    // Нажатие на маркер
    sphere.addEventListener('click', () => {
      toggleTile(point);
    });

    scene.appendChild(sphere);
  });
}

// Переключение видимости плитки
function toggleTile(point) {
  const tile = document.getElementById('info-tile');
  
  if (activePointId === point.id) {
    tile.classList.add('hidden');
    activePointId = null;
    return;
  }

  activePointId = point.id;
  document.getElementById('info-coords').innerText = `Координаты: ${point.lat}, ${point.lng}`;
  
  if (userCoords) {
    const dist = getDistanceInKm(userCoords.latitude, userCoords.longitude, point.lat, point.lng);
    const distText = dist < 1 ? `${Math.round(dist * 1000)} м` : `${dist.toFixed(2)} км`;
    document.getElementById('info-distance').innerText = `Расстояние: ${distText}`;
  } else {
    document.getElementById('info-distance').innerText = `Расстояние: Определение GPS...`;
  }

  tile.classList.remove('hidden');
}

// Получение GPS координат пользователя от AR.js
window.addEventListener('gps-camera-update-position', (e) => {
  userCoords = e.detail.position;
});

window.onload = renderMarkers;
