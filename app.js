AFRAME.registerComponent('billboard-scale', {
  schema: {
    multiplier: { type: 'number', default: 0.1 }
  },
  tick: function () {
    const cameraEl = document.querySelector('a-camera');
    if (!cameraEl) return;

    const pos = this.el.object3D.position;
    const distance = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);

    if (distance < 1) return;

    let currentScale = distance * this.data.multiplier;
    if (currentScale < 2) currentScale = 2;
    if (currentScale > 150) currentScale = 150;

    this.el.object3D.scale.set(currentScale, currentScale, currentScale);
    this.el.object3D.lookAt(cameraEl.object3D.position);
  }
});

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
let currentUserLat = null;
let currentUserLng = null;

const activeCategories = {
  auto: true,
  it: true,
  beauty: true,
  med: true
};

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

function updateUIData(userLat, userLng) {
  if (userLat !== null && userLng !== null) {
    currentUserLat = userLat;
    currentUserLng = userLng;
    document.getElementById('my-coords').innerText = `${userLat.toFixed(6)}, ${userLng.toFixed(6)}`;
  }

  const radiusRange = document.getElementById('radius-range');
  const radiusValueEl = document.getElementById('radius-value');
  
  let maxRadiusKm = 50;
  if (radiusRange) {
    const sliderVal = parseFloat(radiusRange.value);
    maxRadiusKm = getRadiusFromSlider(sliderVal);
    
    if (radiusValueEl) {
      if (maxRadiusKm < 10) {
        radiusValueEl.innerText = `${maxRadiusKm.toFixed(1)} км`;
      } else {
        radiusValueEl.innerText = `${Math.round(maxRadiusKm)} км`;
      }
    }
  }

  const hitboxes = document.querySelectorAll('.clickable-hitbox');
  hitboxes.forEach(hb => {
    const lat = parseFloat(hb.getAttribute('data-lat'));
    const lng = parseFloat(hb.getAttribute('data-lng'));
    const distId = hb.getAttribute('data-dist-id');
    const marker = hb.parentElement;
    const category = marker.getAttribute('data-category');

    let distMeters = 0;
    let distKm = 0;

    if (currentUserLat !== null && currentUserLng !== null) {
      distMeters = calculateDistance(currentUserLat, currentUserLng, lat, lng);
      distKm = distMeters / 1000;

      const distEl = document.getElementById(distId);
      if (distEl) {
        distEl.innerText = formatDist(distMeters);
      }
    }

    const isWithinRadius = distKm <= maxRadiusKm;
    const isCategoryActive = activeCategories[category] === true;

    if (marker) {
      marker.setAttribute('visible', (isWithinRadius && isCategoryActive) ? 'true' : 'false');
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
  const radiusRange = document.getElementById('radius-range');

  if (radiusRange) {
    radiusRange.addEventListener('input', () => {
      updateUIData(currentUserLat, currentUserLng);
    });
  }

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

  const categoryButtons = document.querySelectorAll('.category-btn');
  categoryButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.getAttribute('data-category');
      activeCategories[cat] = !activeCategories[cat];

      let text = btn.innerText.replace('✓ ', '').replace('✗ ', '');
      if (activeCategories[cat]) {
        btn.style.background = '#00ff66';
        btn.style.color = '#000';
        btn.innerText = `✓ ${text}`;
      } else {
        btn.style.background = '#334155';
        btn.style.color = '#94a3b8';
        btn.innerText = `✗ ${text}`;
      }

      updateCategoryStatusText();
      updateUIData(currentUserLat, currentUserLng);
    });
  });

  updateCategoryStatusText();

  const modelsToLoad = [
    { containerId: 'model1-container', url: 'assets/drone/drone.glb', scale: [50, 50, 50], statusElId: 'model-status' },
    { containerId: 'model2-container', url: 'assets/model1C/model1C.glb', scale: [1, 1, 1], statusElId: 'model2-status' }
  ];

  modelsToLoad.forEach(config => loadModelToContainer(config));

  const clock = new THREE.Clock();
  const animateTicker = () => {
    requestAnimationFrame(animateTicker);
    const delta = clock.getDelta();
    mixers.forEach(mixer => mixer.update(delta));
  };
  animateTicker();

  const setupScreenSpaceClickDetection = () => {
    const statusEl = document.getElementById('click-status');
    const infoTile = document.getElementById('info-tile');

    window.addEventListener('pointerdown', (e) => {
      if (e.target.closest('#ui-container') || e.target.closest('#info-tile') || e.target.closest('.category-dropdown')) {
        return;
      }

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

      const markers = document.querySelectorAll('a-entity[gps-entity-place]');
      let closestMarker = null;
      let minDistanceToTap = Infinity;
      const hitRadiusPixels = 60; // Строгий размер по модели

      markers.forEach(marker => {
        if (marker.getAttribute('visible') === 'false') return;

        const worldPos = new THREE.Vector3();
        marker.object3D.getWorldPosition(worldPos);

        const vector = worldPos.project(camera);
        const screenX = (vector.x *  .5 + .5) * window.innerWidth;
        const screenY = (vector.y * -.5 + .5) * window.innerHeight;

        const dist = Math.hypot(screenX - clientX, screenY - clientY);
        if (dist < hitRadiusPixels && dist < minDistanceToTap) {
          minDistanceToTap = dist;
          closestMarker = marker;
        }
      });

      // Надежная проверка видимости плитки через вычисляемый стиль
      const isTileOpen = infoTile && window.getComputedStyle(infoTile).display !== 'none';

      if (closestMarker) {
        const hitbox = closestMarker.querySelector('.clickable-hitbox') || closestMarker;
        const title = hitbox.getAttribute('data-title') || 'Объект';

        if (isTileOpen && document.getElementById('tile-title').innerText === title) {
          infoTile.style.display = 'none';
          if (statusEl) {
            statusEl.innerText = `Плитка закрыта (повторный клик)`;
            statusEl.style.color = '#94a3b8';
          }
          return;
        }

        const lat = parseFloat(hitbox.getAttribute('data-lat'));
        const lng = parseFloat(hitbox.getAttribute('data-lng'));

        let distText = 'Ожидание GPS...';
        if (currentUserLat !== null && currentUserLng !== null) {
          const meters = calculateDistance(currentUserLat, currentUserLng, lat, lng);
          distText = formatDist(meters);
        }

        document.getElementById('tile-title').innerText = title;
        document.getElementById('tile-coords').innerText = `Координаты: ${lat}, ${lng}`;
        document.getElementById('tile-distance').innerText = `Расстояние: ${distText}`;

        if (infoTile) {
          infoTile.style.display = 'block';
        }
        if (statusEl) {
          statusEl.innerText = `ПОПАДАНИЕ (${title})!`;
          statusEl.style.color = '#00ff66';
        }
      } else {
        if (isTileOpen) {
          infoTile.style.display = 'none';
          if (statusEl) {
            statusEl.innerText = `Плитка закрыта (клик мимо)`;
            statusEl.style.color = '#94a3b8';
          }
        } else {
          if (statusEl) {
            statusEl.innerText = `Мимо [X:${Math.round(clientX)}, Y:${Math.round(clientY)}]`;
            statusEl.style.color = '#ff3366';
          }
        }
      }
    });
  };

  if (sceneEl && sceneEl.hasLoaded) {
    setupScreenSpaceClickDetection();
  } else if (sceneEl) {
    sceneEl.addEventListener('loaded', setupScreenSpaceClickDetection);
  } else {
    setupScreenSpaceClickDetection();
  }
});