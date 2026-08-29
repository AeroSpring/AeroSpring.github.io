// Кастомный компонент A-Frame для прямого захвата Three.js AnimationMixer
AFRAME.registerComponent('direct-gltf-animator', {
  init: function () {
    this.el.addEventListener('model-loaded', (evt) => {
      const modelStatusEl = document.getElementById('model-status');
      const animListEl = document.getElementById('anim-list');

      if (modelStatusEl) {
        modelStatusEl.innerText = 'OK (Загружена)';
        modelStatusEl.style.color = '#00ff66';
      }

      // Извлекаем GLTF данные прямо из события загрузки A-Frame
      const gltf = evt.detail.model;
      if (!gltf) return;

      // Получаем клипы напрямую из структуры GLTF
      const animations = gltf.animations || [];

      if (animations.length > 0) {
        // Ищем целевой клип или берем первый
        let targetClip = animations.find(a => a.name.includes('Start_Liftoff_Drone_Controller')) 
                      || animations.find(a => a.name.includes('Drone_Controller'))
                      || animations[0];

        if (animListEl) {
          animListEl.innerText = targetClip.name;
          animListEl.style.color = '#00ff66';
        }

        // Запускаем миксер на базе сцены Three.js
        this.mixer = new THREE.AnimationMixer(gltf);
        this.action = this.mixer.clipAction(targetClip);
        this.action.setLoop(THREE.LoopRepeat);
        this.action.play();
      } else {
        if (animListEl) {
          animListEl.innerText = 'Клипы не найдены в GLTF';
          animListEl.style.color = '#ff3366';
        }
      }
    });
  },

  // Обновляем миксер на каждом кадре через циклы A-Frame (tick)
  tick: function (t, dt) {
    if (this.mixer) {
      this.mixer.update(dt / 1000);
    }
  }
});

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