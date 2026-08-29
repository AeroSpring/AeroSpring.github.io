// Компонент плавного сглаживания позиции (фильтрация GPS-дрожи)
AFRAME.registerComponent('smooth-position', {
  init: function () {
    this.targetPos = new THREE.Vector3();
    this.initialized = false;
  },
  tick: function (time, delta) {
    // Получаем текущую позицию, куда AR.js пытается поставить объект по GPS
    const currentPositionAttr = this.el.getAttribute('position');
    if (!currentPositionAttr) return;

    this.targetPos.set(currentPositionAttr.x, currentPositionAttr.y, currentPositionAttr.z);

    if (!this.initialized) {
      // При самом первом кадре ставим без задержки
      this.el.object3D.position.copy(this.targetPos);
      this.initialized = true;
      return;
    }

    // Плавное приближение (lerp). Чем меньше коэффициент (например, 0.05), тем плавнее и инертнее движение.
    const smoothingFactor = 0.08; 
    this.el.object3D.position.lerp(this.targetPos, smoothingFactor);
  }
});

const TARGET_LAT = 44.970635;
const TARGET_LNG = 41.153389;
let currentDistanceMeters = 0;
let mixer = null;

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
  const container = document.getElementById('drone-container');
  const modelStatusEl = document.getElementById('model-status');
  const animListEl = document.getElementById('anim-list');

  if (radiusInput) {
    radiusInput.addEventListener('input', checkRadiusFilter);
  }

  const loader = new THREE.GLTFLoader();
  loader.load(
    'assets/drone/drone.glb',
    (gltf) => {
      if (modelStatusEl) {
        modelStatusEl.innerText = 'OK (Загружена)';
        modelStatusEl.style.color = '#00ff66';
      }

      const model = gltf.scene;
      model.scale.set(2, 2, 2);
      container.object3D.add(model);

      const animations = gltf.animations;
      if (animations && animations.length > 0) {
        const names = animations.map(a => a.name).join(', ');
        if (animListEl) {
          animListEl.innerText = names;
          animListEl.style.color = '#00ff66';
        }

        mixer = new THREE.AnimationMixer(model);
        const clip = animations.find(a => a.name.includes('Drone_Controller') || a.name.includes('Liftoff')) || animations[0];
        const action = mixer.clipAction(clip);
        action.setLoop(THREE.LoopRepeat);
        action.play();
      } else {
        if (animListEl) {
          animListEl.innerText = 'Анимации отсутствуют в файле';
          animListEl.style.color = '#ff3366';
        }
      }
    },
    undefined,
    (error) => {
      if (modelStatusEl) {
        modelStatusEl.innerText = 'ОШИБКА ЗАГРУЗКИ';
        modelStatusEl.style.color = '#ff3366';
      }
      console.error('Ошибка загрузки GLTF:', error);
    }
  );

  const clock = new THREE.Clock();
  const animateTicker = () => {
    requestAnimationFrame(animateTicker);
    const delta = clock.getDelta();
    if (mixer) {
      mixer.update(delta);
    }
  };
  animateTicker();

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
    setupPointerRaycaster();
  }
});