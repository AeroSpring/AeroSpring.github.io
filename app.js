// Отслеживание обновлений GPS
window.addEventListener('gps-camera-update-position', (e) => {
  console.log('GPS обновлен:', e.detail.position.latitude, e.detail.position.longitude);
});