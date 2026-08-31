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

function updateMarkersPositionAndScale() {
  const markers = document.querySelectorAll('.ar-gps-marker');
  const cameraEl = document.querySelector('a-camera');
  const radiusRange = document.getElementById('radius-range');
  const maxRadiusKm = radiusRange ? getRadiusFromSlider(parseFloat(radiusRange.value)) : 1000;
  const maxRadiusMeters = maxRadiusKm * 1000;

  markers.forEach(marker => {
    const targetLat = parseFloat(marker.getAttribute('data-lat'));
    const targetLng = parseFloat(marker.getAttribute('data-lng'));
    const category = marker.getAttribute('data-category');
    const distId = marker.querySelector('.clickable-hitbox').getAttribute('data-dist-id');
    const distEl = document.getElementById(distId);

    const isCategoryActive = activeCategories[category] === true;

    if (currentUserLat === null || currentUserLng === null) {
      if (distEl) distEl.innerText = 'Ожидание GPS...';
      marker.setAttribute('visible', isCategoryActive);
      marker.object3D.visible = isCategoryActive;
      return;
    }

    const realMeters = calculateDistance(currentUserLat, currentUserLng, targetLat, targetLng);
    if (distEl) {
      distEl.innerText = formatDist(realMeters);
    }

    const isInRadius = realMeters <= maxRadiusMeters;
    const shouldBeVisible = isCategoryActive && isInRadius;

    marker.setAttribute('visible', shouldBeVisible);
    marker.object3D.visible = shouldBeVisible;

    if (!shouldBeVisible || !cameraEl) return;

    const bearing = calculateBearing(currentUserLat, currentUserLng, targetLat, targetLng);
    
    const safeVisualDist = 20;
    const angleRad = (bearing - 90) * (Math.PI / 180);
    const posX = Math.cos(angleRad) * safeVisualDist;
    const posZ = -Math.sin(angleRad) * safeVisualDist;

    marker.object3D.position.set(posX, 1.5, posZ);

    const baseScale = marker.dataset.baseScale ? parseFloat(marker.dataset.baseScale) : 1;
    const distanceKm = realMeters / 1000;
    const scaleFactor = Math.max(0.25, 1 / (1 + distanceKm * 0.003)); 
    const finalScale = baseScale * scaleFactor;

    marker.object3D.scale.set(finalScale, finalScale, finalScale);
    marker.object3D.lookAt(cameraEl.object3D.position);
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
    (err) => {
      console.warn('Ошибка геолокации:', err);
      updateMarkersPositionAndScale();
    },
    { enableHighAccuracy: true }
  );
} else {
  updateMarkersPositionAndScale();
}

function loadModelToContainer(config) {
  const loader = new THREE.GLTFLoader();
  const container = document.getElementById(config.containerId);
  const statusEl = document.getElementById(config.statusElId);
  const markerEl = document.getElementById(config.markerId);

  loader.load(
    config.url,
    (gltf) => {
      if (statusEl) {
        statusEl.innerText = 'OK';
        statusEl.style.color = '#00ff66';
      }

      const model = gltf.scene;

      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      model.position.sub(center);

      const maxDim = Math.max(size.x, size.y, size.z);
      const targetSize = 3.0; 
      let autoScale = maxDim > 0 ? targetSize / maxDim : 1;
      autoScale *= config.scaleMultiplier;

      model.scale.set(autoScale, autoScale, autoScale);

      if (markerEl) {
        markerEl.dataset.baseScale = 1;
      }

      model.traverse((node) => {
        if (node.isMesh && node.material) {
          if (Array.isArray(node.material)) {
            node.material.forEach(mat => {
              mat.side = THREE.DoubleSide;
              mat.needsUpdate = true;
            });
          } else {
            node.material.side = THREE.DoubleSide;
            node.material.needsUpdate = true;
          }
        }
      });

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
      console.error(`Ошибка загрузки (${config.url}):`, error);
    }
  );
}

window.addEventListener('load', () => {
  const sceneEl = document.querySelector('a-scene');
  const radiusRange = document.getElementById('radius-range');
  const radiusValueEl = document.getElementById('radius-value');

  // Восстанавливаем позицию ползунка из памяти устройства
  const savedRadiusVal = localStorage.getItem('ar_radius_slider_val');
  if (radiusRange && savedRadiusVal !== null) {
    radiusRange.value = savedRadiusVal;
  }

  const updateRadiusDisplay = () => {
    if (radiusRange && radiusValueEl) {
      const val = parseFloat(radiusRange.value);
      const radiusKm = getRadiusFromSlider(val);
      if (radiusKm >= 10) {
        radiusValueEl.innerText = `${Math.round(radiusKm)} км`;
      } else {
        radiusValueEl.innerText = `${radiusKm.toFixed(1)} км`;
      }
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
      updateMarkersPositionAndScale();
    });
  });

  updateCategoryStatusText();

  const modelsToLoad = [
    { containerId: 'model1-container', markerId: 'target-marker-1', url: 'assets/drone/drone.glb', scaleMultiplier: 1.0, statusElId: 'model-status' },
    { containerId: 'model2-container', markerId: 'target-marker-2', url: 'assets/model1C/model1C.glb', scaleMultiplier: 1.0, statusElId: 'model2-status' },
    { containerId: 'model3-container', markerId: 'target-marker-3', url: 'assets/earth_cartoon/earth_cartoon.glb', scaleMultiplier: 1.0, statusElId: 'model3-status' },
    { containerId: 'model4-container', markerId: 'target-marker-4', url: 'assets/animated_venus/animated_venus.glb', scaleMultiplier: 1.0, statusElId: 'model4-status' },
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
      if (e.target.closest('#debug-panel') || e.target.closest('#info-tile')) {
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

      const markers = document.querySelectorAll('.ar-gps-marker');
      let closestMarker = null;
      let minDistanceToTap = Infinity;
      const hitRadiusPixels = 80;

      markers.forEach(marker => {
        const isVisibleAttr = marker.getAttribute('visible');
        if (isVisibleAttr === false || isVisibleAttr === 'false' || !marker.object3D.visible) return;

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
        const title = hitbox.getAttribute('data-title') || 'Объект';

        if (isTileOpen && document.getElementById('tile-title').innerText === title) {
          infoTile.style.display = 'none';
          if (statusEl) {
            statusEl.innerText = `Плитка закрыта`;
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
          statusEl.innerText = `ВЫБРАНО: ${title}`;
          statusEl.style.color = '#00ff66';
        }
      } else {
        if (isTileOpen) {
          infoTile.style.display = 'none';
        }
        if (statusEl) {
          statusEl.innerText = `Мимо [X:${Math.round(clientX)}, Y:${Math.round(clientY)}]`;
          statusEl.style.color = '#ff3366';
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