const mixers = [];
let currentUserLat = null;
let currentUserLng = null;

const activeCategories = {
  auto: true,
  it: true,
  beauty: true,
  med: true
};

// База данных объектов (тысячи объектов могут храниться здесь или прилетать с бэкенда)
const poiDatabase = [
  // Армавир
  {
    id: 'poi-1',
    title: 'Авторемонт',
    lat: 51.672602,
    lng: 39.237782,
    category: 'auto',
    url: 'assets/drone/drone.glb',
    siteUrl: 'https://autoknowledge.tech/ru/pages/36',
    scaleMultiplier: 1.0
  },
  {
    id: 'poi-2',
    title: 'ИТ-услуги 1С',
    lat: 45.013888,
    lng: 41.131294,
    category: 'it',
    url: 'assets/model1C/model1C.glb',
    siteUrl: 'https://autoknowledge.tech/ru/pages/33',
    scaleMultiplier: 1.0
  },
  {
    id: 'poi-3',
    title: 'Ремонт двигателей и КПП',
    lat: 44.970499,
    lng: 41.153234,
    category: 'auto',
    url: 'assets/earth_cartoon/earth_cartoon.glb',
    siteUrl: 'https://autoknowledge.tech/ru/pages/34',
    scaleMultiplier: 1.0
  },
  {
    id: 'poi-4',
    title: 'Фито',
    lat: 44.989088,
    lng: 41.161151,
    category: 'med',
    url: 'assets/animated_venus/animated_venus.glb',
    siteUrl: 'https://autoknowledge.tech/ru/pages/35',
    scaleMultiplier: 1.0
  },

  // Москва
  {
    id: 'poi-21',
    title: 'Авторемонт (Сколково)',
    lat: 55.690777,
    lng: 37.347615,
    category: 'auto',
    url: 'assets/drone/drone.glb',
    siteUrl: 'https://autoknowledge.tech/ru/pages/36',
    scaleMultiplier: 1.0
  },
  {
    id: 'poi-22',
    title: 'ИТ-услуги 1С',
    lat: 55.832466,
    lng: 37.627483,
    category: 'it',
    url: 'assets/model1C/model1C.glb',
    siteUrl: 'https://autoknowledge.tech/ru/pages/33',
    scaleMultiplier: 1.0
  },
  {
    id: 'poi-23',
    title: 'Ремонт двигателей и КПП',
    lat: 55.755046,
    lng: 37.675149,
    category: 'auto',
    url: 'assets/earth_cartoon/earth_cartoon.glb',
    siteUrl: 'https://autoknowledge.tech/ru/pages/34',
    scaleMultiplier: 1.0
  },
  {
    id: 'poi-24',
    title: 'Фито',
    lat: 55.784717,
    lng: 37.615695,
    category: 'med',
    url: 'assets/animated_venus/animated_venus.glb',
    siteUrl: 'https://autoknowledge.tech/ru/pages/35',
    scaleMultiplier: 1.0
  },

  // С.Петербург
  {
    id: 'poi-31',
    title: 'Авторемонт (Александровская колонна)',
    lat: 59.938596,
    lng: 30.316432,
    category: 'auto',
    url: 'assets/drone/drone.glb',
    siteUrl: 'https://autoknowledge.tech/ru/pages/36',
    scaleMultiplier: 1.0
  },
  {
    id: 'poi-32',
    title: 'ИТ-услуги 1С (Яблоневый сад)',
    lat: 59.863311,
    lng: 30.363718,
    category: 'it',
    url: 'assets/model1C/model1C.glb',
    siteUrl: 'https://autoknowledge.tech/ru/pages/33',
    scaleMultiplier: 1.0
  },
  {
    id: 'poi-33',
    title: 'Ремонт двигателей и КПП',
    lat: 59.953499,
    lng: 30.314097,
    category: 'auto',
    url: 'assets/earth_cartoon/earth_cartoon.glb',
    siteUrl: 'https://autoknowledge.tech/ru/pages/34',
    scaleMultiplier: 1.0
  },
  {
    id: 'poi-34',
    title: 'Фито (Викторная оранжерея)',
    lat: 59.969335,
    lng: 30.324118,
    category: 'med',
    url: 'assets/animated_venus/animated_venus.glb',
    siteUrl: 'https://autoknowledge.tech/ru/pages/35',
    scaleMultiplier: 1.0
  },

  // Новосибирск
  {
    id: 'poi-41',
    title: 'Авторемонт (Аквапарк)',
    lat: 55.019934,
    lng: 82.885092,
    category: 'auto',
    url: 'assets/drone/drone.glb',
    siteUrl: 'https://autoknowledge.tech/ru/pages/36',
    scaleMultiplier: 1.0
  },
  {
    id: 'poi-42',
    title: 'ИТ-услуги 1С (Михайловская набережная)',
    lat: 55.006194,
    lng: 82.937931,
    category: 'it',
    url: 'assets/model1C/model1C.glb',
    siteUrl: 'https://autoknowledge.tech/ru/pages/33',
    scaleMultiplier: 1.0
  },
  {
    id: 'poi-43',
    title: 'Ремонт двигателей и КПП (много воды)',
    lat: 54.997813,
    lng: 82.910019,
    category: 'auto',
    url: 'assets/earth_cartoon/earth_cartoon.glb',
    siteUrl: 'https://autoknowledge.tech/ru/pages/34',
    scaleMultiplier: 1.0
  },
  {
    id: 'poi-44 (Дендропарк)',
    title: 'Фито',
    lat: 55.059916,
    lng: 82.887384,
    category: 'med',
    url: 'assets/animated_venus/animated_venus.glb',
    siteUrl: 'https://autoknowledge.tech/ru/pages/35',
    scaleMultiplier: 1.0
  },
];

const loadedPois = new Set(); // Хранилище ID уже загруженных моделей

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

function calculateBearing(lat1, lon1, lat2, lon2) {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180);
  const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
            Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLon);
  let brng = Math.atan2(y, x) * 180 / Math.PI;
  return (brng + 360) % 360;
}

function formatDist(meters) {
  return meters < 1000 ? `${Math.round(meters)} м` : `${(meters / 1000).toFixed(2)} км`;
}

function getRadiusFromSlider(sliderValue) {
  const minKm = 1;
  const maxKm = 1000;
  const minLog = Math.log10(minKm);
  const maxLog = Math.log10(maxKm);
  const scale = (maxLog - minLog) / 100;
  return Math.pow(10, minLog + scale * sliderValue);
}

function updateCategoryStatusText() {
  const total = Object.keys(activeCategories).length;
  const selectedCount = Object.values(activeCategories).filter(Boolean).length;
  const statusTextEl = document.getElementById('category-status-text');
  if (statusTextEl) {
    statusTextEl.innerText = `Категории: ${selectedCount} из ${total} выбрано`;
  }
}

// Загрузка конкретной 3D-модели
function spawnPoiModel(poi) {
  if (loadedPois.has(poi.id)) return;
  loadedPois.add(poi.id);

  const containerEl = document.getElementById('objects-container');
  if (!containerEl) return;

  // Создаем маркер-контейнер
  const marker = document.createElement('a-entity');
  marker.id = `target-${poi.id}`;
  marker.className = 'ar-gps-marker';
  marker.setAttribute('data-id', poi.id);
  marker.setAttribute('data-lat', poi.lat);
  marker.setAttribute('data-lng', poi.lng);
  marker.setAttribute('data-category', poi.category);

  // Контейнер под саму GLTF модель
  const modelContainer = document.createElement('a-entity');
  marker.appendChild(modelContainer);

  // Хитбоксы для клика
  const hitbox = document.createElement('a-plane');
  hitbox.className = 'clickable-hitbox';
  hitbox.setAttribute('width', '6');
  hitbox.setAttribute('height', '6');
  hitbox.setAttribute('material', 'opacity: 0.0; transparent: true; side: double; shader: flat;');
  hitbox.setAttribute('data-title', poi.title);
  hitbox.setAttribute('data-lat', poi.lat);
  hitbox.setAttribute('data-lng', poi.lng);
  hitbox.setAttribute('data-url', poi.siteUrl);
  marker.appendChild(hitbox);

  containerEl.appendChild(marker);

  // Грузим GLTF
  const loader = new THREE.GLTFLoader();
  loader.load(
    poi.url,
    (gltf) => {
      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      model.position.sub(center);

      const maxDim = Math.max(size.x, size.y, size.z);
      const targetSize = 3.0; 
      let autoScale = maxDim > 0 ? targetSize / maxDim : 1;
      autoScale *= poi.scaleMultiplier;
      model.scale.set(autoScale, autoScale, autoScale);

      model.traverse((node) => {
        if (node.isMesh && node.material) {
          if (Array.isArray(node.material)) {
            node.material.forEach(mat => { mat.side = THREE.DoubleSide; mat.needsUpdate = true; });
          } else {
            node.material.side = THREE.DoubleSide;
            node.material.needsUpdate = true;
          }
        }
      });

      modelContainer.object3D.add(model);

      if (gltf.animations && gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(model);
        const action = mixer.clipAction(gltf.animations[0]);
        action.setLoop(THREE.LoopRepeat);
        action.play();
        mixers.push(mixer);
      }

      const loadedCountEl = document.getElementById('loaded-count');
      if (loadedCountEl) loadedCountEl.innerText = loadedPois.size;
    },
    undefined,
    (err) => console.error(`Ошибка загрузки модели ${poi.id}:`, err)
  );
}

// Главный цикл проверки расстояний и ленивой загрузки
function updateMarkersPositionAndScale() {
  const cameraEl = document.querySelector('a-camera');
  const radiusRange = document.getElementById('radius-range');
  const maxRadiusKm = radiusRange ? getRadiusFromSlider(parseFloat(radiusRange.value)) : 1000;
  const maxRadiusMeters = maxRadiusKm * 1000;

  poiDatabase.forEach(poi => {
    const isCategoryActive = activeCategories[poi.category] === true;

    if (currentUserLat === null || currentUserLng === null) return;

    const realMeters = calculateDistance(currentUserLat, currentUserLng, poi.lat, poi.lng);
    const isInRadius = realMeters <= maxRadiusMeters;
    const shouldBeLoaded = isCategoryActive && isInRadius;

    // ЛЕНИВАЯ ЗАГРУЗКА: Если объект попал в радиус и категорию — подгружаем, если еще не загружен
    if (shouldBeLoaded && !loadedPois.has(poi.id)) {
      spawnPoiModel(poi);
    }

    // Управляем видимостью уже созданных маркеров
    const marker = document.getElementById(`target-${poi.id}`);
    if (marker) {
      const isVisible = shouldBeLoaded;
      marker.setAttribute('visible', isVisible);
      marker.object3D.visible = isVisible;

      if (isVisible && cameraEl) {
        const bearing = calculateBearing(currentUserLat, currentUserLng, poi.lat, poi.lng);
        const safeVisualDist = 20;
        const angleRad = (bearing - 90) * (Math.PI / 180);
        const posX = -Math.cos(angleRad) * safeVisualDist;
        const posZ = Math.sin(angleRad) * safeVisualDist;

        marker.object3D.position.set(posX, 1.5, posZ);

        const distanceKm = realMeters / 1000;
        const scaleFactor = Math.max(0.25, 1 / (1 + distanceKm * 0.003)); 
        marker.object3D.scale.set(scaleFactor, scaleFactor, scaleFactor);
        marker.object3D.lookAt(cameraEl.object3D.position);
      }
    }
  });
}

if ('geolocation' in navigator) {
  navigator.geolocation.watchPosition(
    (pos) => {
      currentUserLat = pos.coords.latitude;
      currentUserLng = pos.coords.longitude;
      document.getElementById('my-coords').innerText = `${currentUserLat.toFixed(6)}, ${currentUserLng.toFixed(6)}`;
      updateMarkersPositionAndScale();
    },
    (err) => console.warn('Ошибка геолокации:', err),
    { enableHighAccuracy: true }
  );
}

window.addEventListener('load', () => {
  const sceneEl = document.querySelector('a-scene');
  const radiusRange = document.getElementById('radius-range');
  const radiusValueEl = document.getElementById('radius-value');

  document.getElementById('total-points').innerText = poiDatabase.length;

  const savedRadiusVal = localStorage.getItem('ar_radius_slider_val');
  if (radiusRange && savedRadiusVal !== null) radiusRange.value = savedRadiusVal;

  const updateRadiusDisplay = () => {
    if (radiusRange && radiusValueEl) {
      const val = parseFloat(radiusRange.value);
      const radiusKm = getRadiusFromSlider(val);
      radiusValueEl.innerText = radiusKm >= 10 ? `${Math.round(radiusKm)} км` : `${radiusKm.toFixed(1)} км`;
    }
  };

  if (radiusRange) {
    updateRadiusDisplay();
    radiusRange.addEventListener('input', () => {
      localStorage.setItem('ar_radius_slider_val', radiusRange.value);
      updateRadiusDisplay();
      updateMarkersPositionAndScale();
    });
  }

  // Шторка категорий
  const toggleHeader = document.getElementById('category-toggle-header');
  const dropdownContent = document.getElementById('category-dropdown-content');
  const arrowEl = document.getElementById('category-arrow');

  if (toggleHeader && dropdownContent) {
    toggleHeader.addEventListener('click', () => {
      const isHidden = dropdownContent.style.display === 'none' || dropdownContent.style.display === '';
      dropdownContent.style.display = isHidden ? 'flex' : 'none';
      arrowEl.innerText = isHidden ? '▲' : '▼';
    });
  }

  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.getAttribute('data-category');
      activeCategories[cat] = !activeCategories[cat];
      let text = btn.innerText.replace('✓ ', '').replace('✗ ', '');
      btn.style.background = activeCategories[cat] ? '#00ff66' : '#334155';
      btn.style.color = activeCategories[cat] ? '#000' : '#94a3b8';
      btn.innerText = `${activeCategories[cat] ? '✓' : '✗'} ${text}`;

      updateCategoryStatusText();
      updateMarkersPositionAndScale();
    });
  });

  updateCategoryStatusText();

  const clock = new THREE.Clock();
  const animateTicker = () => {
    requestAnimationFrame(animateTicker);
    const delta = clock.getDelta();
    mixers.forEach(mixer => mixer.update(delta));
  };
  animateTicker();

  // Обработка кликов по динамическим элементам
  const setupScreenSpaceClickDetection = () => {
    const statusEl = document.getElementById('click-status');
    const infoTile = document.getElementById('info-tile');

    window.addEventListener('pointerdown', (e) => {
      if (e.target.closest('#debug-panel') || e.target.closest('#info-tile')) return;

      const cameraEl = document.querySelector('a-camera') || document.querySelector('[camera]');
      const camera = cameraEl && cameraEl.components && cameraEl.components.camera 
        ? cameraEl.components.camera.camera 
        : (sceneEl ? sceneEl.camera : null);

      if (!camera) return;

      const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : null);
      const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : null);
      if (clientX === null || clientY === null) return;

      if (sceneEl) sceneEl.object3D.updateMatrixWorld(true);
      camera.updateMatrixWorld(true);

      const markers = document.querySelectorAll('.ar-gps-marker');
      let closestMarker = null;
      let minDistanceToTap = Infinity;
      const hitRadiusPixels = 80;

      markers.forEach(marker => {
        if (!marker.object3D.visible) return;

        const worldPos = new THREE.Vector3();
        marker.object3D.getWorldPosition(worldPos);

        const vector = worldPos.project(camera);
        if (vector.z > 1) return;

        const screenX = (vector.x *  .5 + .5) * window.innerWidth;
        const screenY = (vector.y * -.5 + .5) * window.innerHeight;

        const dist = Math.hypot(screenX - clientX, screenY - clientY);
        if (dist < hitRadiusPixels && dist < minDistanceToTap) {
          minDistanceToTap = dist;
          closestMarker = marker;
        }
      });

      const isTileOpen = infoTile && window.getComputedStyle(infoTile).display !== 'none';

      if (closestMarker) {
        const hitbox = closestMarker.querySelector('.clickable-hitbox');
        const title = hitbox.dataset.title || 'Объект';

        if (isTileOpen && document.getElementById('tile-title').innerText === title) {
          infoTile.style.display = 'none';
          return;
        }

        const lat = parseFloat(hitbox.dataset.lat);
        const lng = parseFloat(hitbox.dataset.lng);
        const siteUrl = hitbox.dataset.url || '#';

        let distText = 'Ожидание GPS...';
        if (currentUserLat !== null && currentUserLng !== null) {
          const meters = calculateDistance(currentUserLat, currentUserLng, lat, lng);
          distText = formatDist(meters);
        }

        document.getElementById('tile-title').innerText = title;
        document.getElementById('tile-coords').innerText = `Координаты: ${lat}, ${lng}`;
        document.getElementById('tile-distance').innerText = `Расстояние: ${distText}`;

        document.getElementById('tile-route-btn').href = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        document.getElementById('tile-site-btn').href = siteUrl;

        if (infoTile) infoTile.style.display = 'block';
      } else {
        if (isTileOpen) infoTile.style.display = 'none';
      }
    });
  };

  setupScreenSpaceClickDetection();
});