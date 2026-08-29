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

const mixers = [];

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

function formatDist(meters) {
  return meters < 1000 ? `${Math.round(meters)} м` : `${(meters / 1000).toFixed(2)} км`;
}

function updateUIData(userLat, userLng) {
  document.getElementById('my-coords').innerText = `${userLat.toFixed(6)}, ${userLng.toFixed(6)}`;

  const maxRadiusKm = parseFloat(document.getElementById('radius-input').value) || 0;

  // Обновляем дистанции для всех хитбоксов на основе их data-атрибутов
  const hitboxes = document.querySelectorAll('.clickable-hitbox');
  hitboxes.forEach(hb => {
    const lat = parseFloat(hb.getAttribute('data-lat'));
    const lng = parseFloat(hb.getAttribute('data-lng'));
    const distId = hb.getAttribute('data-dist-id');
    const markerId = hb.parentElement.id;
    const marker = document.getElementById(markerId);

    const distMeters = calculateDistance(userLat, userLng, lat, lng);
    const distKm = distMeters / 1000;

    // Выводим дистанцию в отладочную панель
    const distEl = document.getElementById(distId);
    if (distEl) {
      distEl.innerText = formatDist(distMeters);
    }

    // Фильтрация радиуса показа
    if (marker) {
      marker.setAttribute('visible', distKm <= maxRadiusKm ? 'true' : 'false');
    }
  });
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

function loadModelToContainer(config) {
  const loader = new THREE.GLTFLoader();
  const container = document.getElementById(config.containerId);
  const statusEl = document.getElementById(config.statusElId);

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
        const mixer = new THREE.AnimationMixer(model);
        const action = mixer.clipAction(animations[0]);
        action.setLoop(THREE.LoopRepeat);
        action.play();
        mixers.push(mixer);
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
    radiusInput.addEventListener('input', () => {
      // Принудительно пересчитываем радиус с последними известными координатами или дефолтными
      const myCoordsText = document.getElementById('my-coords').innerText;
      if (myCoordsText.includes(',')) {
        const [lat, lng] = myCoordsText.split(',').map(s => parseFloat(s.trim()));
        if (!isNaN(lat) && !isNaN(lng)) updateUIData(lat, lng);
      }
    });
  }

  const modelsToLoad = [
    { containerId: 'model1-container', url: 'assets/drone/drone.glb', scale: [2, 2, 2], statusElId: 'model-status' },
    { containerId: 'model2-container', url: 'assets/model1C/model1C.glb', scale: [2, 2, 2], statusElId: 'model2-status' }
  ];

  modelsToLoad.forEach(config => loadModelToContainer(config));

  const clock = new THREE.Clock();
  const animateTicker = () => {
    requestAnimationFrame(animateTicker);
    const delta = clock.getDelta();
    mixers.forEach(mixer => mixer.update(delta));
  };
  animateTicker();

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

      // Собираем все хитбоксы и их Three.js объекты
      const hitboxEls = Array.from(document.querySelectorAll('.clickable-hitbox'));
      const hitboxObjects = hitboxEls.map(el => el.object3D).filter(obj => obj !== undefined);

      const intersects = raycaster.intersectObjects(hitboxObjects, true);

      if (intersects.length > 0) {
        isClickBlocked = true;
        setTimeout(() => { isClickBlocked = false; }, 300);

        // Находим, в какой именно хитбокс попал луч
        const intersectedObject = intersects[0].object;
        let matchedEl = null;
        hitboxEls.forEach(el => {
          if (el.object3D === intersectedObject || el.object3D.children.includes(intersectedObject) || isChildOf(intersectedObject, el.object3D)) {
            matchedEl = el;
          }
        });

        const infoTile = document.getElementById('info-tile');
        if (infoTile && matchedEl) {
          // Читаем уникальные данные из data-атрибутов конкретного хитбокса
          const title = matchedEl.getAttribute('data-title');
          const lat = matchedEl.getAttribute('data-lat');
          const lng = matchedEl.getAttribute('data-lng');
          const distId = matchedEl.getAttribute('data-dist-id');
          const currentDistText = document.getElementById(distId).innerText;

          // Заполняем плитку уникальными данными выбранной модели
          document.getElementById('tile-title').innerText = title;
          document.getElementById('tile-coords').innerText = `Координаты: ${lat}, ${lng}`;
          document.getElementById('tile-distance').innerText = `Расстояние: ${currentDistText}`;

          const isHidden = infoTile.style.display === 'none' || infoTile.style.display === '';
          infoTile.style.display = isHidden ? 'block' : 'none';
          
          if (statusEl) {
            statusEl.innerText = isHidden ? `ПОПАДАНИЕ (${title})!` : 'Плитка скрыта';
          }
        }
      } else {
        if (statusEl) statusEl.innerText = `Мимо [X:${Math.round(clientX)}, Y:${Math.round(clientY)}]`;
      }
    }

    // Вспомогательная функция для проверки вложенности Three.js объектов
    function isChildOf(child, parent) {
      let node = child.parent;
      while (node) {
        if (node === parent) return true;
        node = node.parent;
      }
      return false;
    }

    window.addEventListener('pointerdown', handlePointer);
  };

  if (sceneEl.hasLoaded) {
    setupPointerRaycaster();
  } else {
    sceneEl.addEventListener('loaded', setupPointerRaycaster);
  }
});