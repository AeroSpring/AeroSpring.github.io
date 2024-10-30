AFRAME.registerComponent('markerhandler', {

    init: function() {
        const animatedMarker = document.querySelector("#animated-marker");
        const aEntity = document.querySelector("#animated-model");

        // every click, we make our model grow in size :)
        animatedMarker.addEventListener('click', function(ev, _target){
            const intersectedElement = ev && ev.detail && ev.detail.intersectedEl;
            if (aEntity && intersectedElement === aEntity) {
                const animationMixer = aEntity.getAttribute('animation-mixer');
                Object.keys(animationMixer).forEach((key) => animationMixer[key] = "clip: ConeAction; autoplay: true; loop: false");
                aEntity.setAttribute('animation-mixer', animationMixer);
            }
            console.log('I was clicked at: ', evt.detail.intersection.point);
        });
}});