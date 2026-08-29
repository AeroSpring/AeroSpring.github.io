const TARGET_LAT = 44.970635;
const TARGET_LNG = 41.153389;
let currentDistanceMeters = 0;

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

function checkRadiusFilter() {
  const radiusInput = document.getElementById('radius-input');
  const targetMarker = document.getElementById('target-marker');
  const infoTile = document.getElementById('info-tile');

  if (!radiusInput || !targetMarker) return;

  const maxRadiusKm = parseFloat(radiusInput.value) || 0;
  const currentDistanceKm = currentDistanceMeters / 1000;

  if (currentDistanceKm <= maxRadiusKm) {
    targetMarker.setAttribute('visible', 'true');
  } else {
    targetMarker.setAttribute('visible', 'false');
    if (infoTile) {
      infoTile.style.display = 'none';
    }
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

  checkRadiusFilter();
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

window.addEventListener('load', () => {
  const sceneEl = document.querySelector('a-scene');
  const radiusInput = document.getElementById('radius-input');
  const modelEl = document.getElementById('ar-model');
  const modelStatusEl = document.getElementById('model-status');
  const animListEl = document.getElementById('anim-list');

  if (modelEl) {
    modelEl.addEventListener('model-loaded', (e) => {
      if (modelStatusEl) {
        modelStatusEl.innerText = 'OK (Загружена)';
        modelStatusEl.style.color = '#00ff66';
      }

      // Получаем встроенные анимации из 3D-модели Three.js
      const model3D = modelEl.getObject3D('mesh');
      const animations = e.detail.model.animations || (model3D ? model3D.animations : []);

      if (animations && animations.length > 0) {
        const names = animations.map(a => a.name).join(', ');
        if (animListEl) animListEl.innerText = names;
        console.log('Найденные анимации в GLTF:', names);

        // Принудительный запуск первой найденной анимации через Three.js Mixer
        const mixer = new THREE.AnimationMixer(model3D);
        const action = mixer.clipAction(animations[0]);
        action.play();

        // Обновляем миксер каждый кадр
        const clock = new THREE.Clock();
        const tick = () => {
          requestAnimationFrame(tick);
          const delta = clock.getDelta();
          mixer.update(delta);
        };
        tick();

      } else {
        if (animListEl) {
          animListEl.innerText = 'НЕТ (0 треков)';
          animListEl.style.color = '#ff3366';
        }
        console.warn('В файле drone.glb не найдено анимационных треков!');
      }
    });

    modelEl.addEventListener('model-error', (evt) => {
      if (modelStatusEl) {
        modelStatusEl.innerText = 'ОШИБКА (404 / не найден)';
        modelStatusEl.style.color = '#ff3366';
      }
    });
  }

  if (radiusInput) {
    radiusInput.addEventListener('input', checkRadiusFilter);
  }

  const setupPointerRaycaster = () => {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let isClickBlocked = false;

    function handlePointer(e) {
      if (isClickBlocked) return;

      const hitboxEl = document.getElementById('hitbox');
      const targetMarker = document.getElementById('target-marker');
      const camera = sceneEl.camera;
      const statusEl = document.getElementById('click-status');

      if (!camera || !hitboxEl || !hitboxEl.object3D || targetMarker.getAttribute('visible') === 'false') return;

      const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : null);
      const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : null);

      if (clientX === null || clientY === null) return;

      camera.updateMatrixWorld(true);
      hitboxEl.object3D.updateMatrixWorld(true);

      mouse.x = (clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(hitboxEl.object3D, true);

      if (intersects.length > 0) {
        isClickBlocked = true;
        setTimeout(() => { isClickBlocked = false; }, 300);

        const infoTile = document.getElementById('info-tile');
        if (infoTile) {
          const isHidden = infoTile.style.display === 'none' || infoTile.style.display === '';
          infoTile.style.display = isHidden ? 'block' : 'none';
          
          if (statusEl) {
            statusEl.innerText = isHidden ? 'ПОПАДАНИЕ! (Плитка открыта)' : 'ПОПАДАНИЕ! (Плитка скрыта)';
          }
        }
      } else {
        if (statusEl) statusEl.innerText = `Мимо [X:${Math.round(clientX)}, Y:${Math.round(clientY)}]`;
      }
    }

    window.addEventListener('pointerdown', handlePointer);
  };

  if (sceneEl.hasLoaded) {
    setupPointerRaycaster();
  } else {
    sceneEl.addEventListener('loaded', setupPointerRaycaster);
  }
});