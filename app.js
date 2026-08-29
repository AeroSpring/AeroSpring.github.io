// Компонент плавного сглаживания позиции (фильтрация GPS-дрожи)
AFRAME.registerComponent('smooth-position', {
  init: function () {
    this.targetPos = new THREE.Vector3();
    this.initialized = false;
  },
  tick: function () {
    const currentPositionAttr = this.el.getAttribute('position');
    if (!currentPositionAttr) return;

    this.targetPos.set(currentPositionAttr.x, currentPositionAttr.y, currentPositionAttr.z);

    if (!this.initialized) {
      this.el.object3D.position.copy(this.targetPos);
      this.initialized = true;
      return;
    }

    const smoothingFactor = 0.08; 
    this.el.object3D.position.lerp(this.targetPos, smoothingFactor);
  }
});

const TARGET_LAT = 44.970635;
const TARGET_LNG = 41.153389;
let currentDistanceMeters = 0;
const mixers = []; // Массив для всех анимационных миксеров

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
  const marker1 = document.getElementById('target-marker-1');
  const marker2 = document.getElementById('target-marker-2');
  const infoTile = document.getElementById('info-tile');

  if (!radiusInput) return;

  const maxRadiusKm = parseFloat(radiusInput.value) || 0;
  const currentDistanceKm = currentDistanceMeters / 1000;

  // Пример фильтрации для первой точки (можно настраивать для каждой индивидуально)
  if (marker1) {
    marker1.setAttribute('visible', currentDistanceKm <= maxRadiusKm ? 'true' : 'false');
  }
  if (marker2) {
    marker2.setAttribute('visible', currentDistanceKm <= maxRadiusKm ? 'true' : 'false');
  }

  if (currentDistanceKm > maxRadiusKm && infoTile) {
    infoTile.style.display = 'none';
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

// Универсальная функция загрузки моделей с помощью конфигурационного массива
function loadModelToContainer(config) {
  const loader = new THREE.GLTFLoader();
  const container = document.getElementById(config.containerId);
  const statusEl = document.getElementById(config.statusElId);
  const animEl = document.getElementById(config.animElId);

  loader.load(
    config.url,
    (gltf) => {
      if (statusEl) {
        statusEl.innerText = 'OK';
        statusEl.style.color = '#00ff66';
      }

      const model = gltf.scene;
      model.scale.set(...config.scale);
      container.object3D.add(model);

      const animations = gltf.animations;
      if (animations && animations.length > 0) {
        const names = animations.map(a => a.name).join(', ');
        if (animEl) {
          animEl.innerText = names;
          animEl.style.color = '#38bdf8';
        }

        const mixer = new THREE.AnimationMixer(model);
        const action = mixer.clipAction(animations[0]); // Запускаем первую доступную анимацию
        action.setLoop(THREE.LoopRepeat);
        action.play();
        mixers.push(mixer);
      } else {
        if (animEl) {
          animEl.innerText = 'Нет анимаций';
          animEl.style.color = '#ff3366';
        }
      }
    },
    undefined,
    (error) => {
      if (statusEl) {
        statusEl.innerText = 'ОШИБКА';
        statusEl.style.color = '#ff3366';
      }
      console.error(`Ошибка загрузки модели (${config.url}):`, error);
    }
  );
}

window.addEventListener('load', () => {
  const sceneEl = document.querySelector('a-scene');
  const radiusInput = document.getElementById('radius-input');

  if (radiusInput) {
    radiusInput.addEventListener('input', checkRadiusFilter);
  }

  // Список всех моделей, которые нужно загрузить на карту. 
  // Чтобы добавить третью модель, достаточно просто дописать объект в этот массив!
  const modelsToLoad = [
    {
      containerId: 'model1-container',
      url: 'assets/drone/drone.glb',
      scale: [2, 2, 2],
      statusElId: 'model-status',
      animElId: 'anim-list'
    },
    {
      containerId: 'model2-container',
      url: 'assets/model1C/model1C.glb',
      scale: [2, 2, 2], // Подправь масштаб под модель 1C, если окажется слишком большой/маленькой
      statusElId: 'model2-status',
      animElId: 'anim2-list'
    }
  ];

  // Запускаем загрузку каждой модели
  modelsToLoad.forEach(config => loadModelToContainer(config));

  // Единый тикер для обновления всех анимационных миксеров
  const clock = new THREE.Clock();
  const animateTicker = () => {
    requestAnimationFrame(animateTicker);
    const delta = clock.getDelta();
    mixers.forEach(mixer => mixer.update(delta));
  };
  animateTicker();

  // Настройка кликов по хитбоксам
  const setupPointerRaycaster = () => {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let isClickBlocked = false;

    function handlePointer(e) {
      if (isClickBlocked) return;

      const camera = sceneEl.camera;
      const statusEl = document.getElementById('click-status');
      if (!camera) return;

      const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : null);
      const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : null);
      if (clientX === null || clientY === null) return;

      camera.updateMatrixWorld(true);

      mouse.x = (clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      // Ищем пересечения со всеми объектами, имеющими класс .clickable-hitbox
      const hitboxes = Array.from(document.querySelectorAll('.clickable-hitbox'))
                            .map(el => el.object3D)
                            .filter(obj => obj !== undefined);

      const intersects = raycaster.intersectObjects(hitboxes, true);

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