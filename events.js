AFRAME.registerComponent('markerhandler', {

    init: function() {
        const animatedMarker = document.querySelector("#animated-marker");
        const aEntity = document.querySelector("#animated-model");

        alert('From script');

        animatedMarker.addEventListener('click', function(ev){//, target){
            const intersectedElement = ev && ev.detail && ev.detail.intersectedEl;
            //if (aEntity && intersectedElement === aEntity) {

                const rotation = aEntity.getAttribute('animation-mixer');
                var arrayOfStrings = rotation.split(/\s/);
                Object.keys(rotation).forEach((key) => rotation[key] = "0 0 " + (Number(arrayOfStrings[2]) + 45));
                aEntity.setAttribute('rotation', rotation);

                const animationMixer = aEntity.getAttribute('animation-mixer');
                Object.keys(animationMixer).forEach((key) => animationMixer[key] = "clip: ConeAction; autoplay: true; loop: false");
                aEntity.setAttribute('animation-mixer', animationMixer);

            //}
            alert('Clicked at: ', evt.detail.intersection.point);
            //console.log('I was clicked at: ', evt.detail.intersection.point);
        });
}});