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

// Инициализация рейкастера после готовности A-Frame
window.addEventListener('load', () => {
  const sceneEl = document.querySelector('a-scene');

  const setupPointerRaycaster = () => {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function handlePointer(e) {
      const statusEl = document.getElementById('click-status');
      
      // Вычисляем координаты тапа
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      mouse.x = (clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(clientY / window.innerHeight) * 2 + 1;

      const camera = sceneEl.camera;
      const markerEl = document.getElementById('target-marker');

      if (!camera || !markerEl || !markerEl.object3D) {
        if (statusEl) statusEl.innerText = '3D-сцена загружается...';
        return;
      }

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(markerEl.object3D, true);

      if (intersects.length > 0) {
        if (statusEl) statusEl.innerText = 'Попадание!';
        const infoTile = document.getElementById('info-tile');
        if (infoTile) infoTile.classList.toggle('hidden');
      } else {
        if (statusEl) statusEl.innerText = `Клик [${Math.round(clientX)}, ${Math.round(clientY)}] — Мимо`;
      }
    }

    document.addEventListener('pointerdown', handlePointer);
    document.addEventListener('touchstart', handlePointer, { passive: true });
  };

  if (sceneEl.hasLoaded) {
    setupPointerRaycaster();
  } else {
    sceneEl.addEventListener('loaded', setupPointerRaycaster);
  }
});