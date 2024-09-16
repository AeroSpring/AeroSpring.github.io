AFRAME.registerComponent('markerhandler', {

    init: function() {
        const animatedMarker = document.querySelector("#animated-marker");
        const aEntity = document.querySelector("#animated-model");

        // every click, we make our model grow in size :)
        animatedMarker.addEventListener('click', function(ev, target){
            const intersectedElement = ev && ev.detail && ev.detail.intersectedEl;
            if (aEntity && intersectedElement === aEntity) {
                const rotation = aEntity.getAttribute('rotation');
                Object.keys(rotation).forEach((key) => rotation[key] = rotation[key] - 90);
                aEntity.setAttribute('rotation', rotation);
            }
        });
}});