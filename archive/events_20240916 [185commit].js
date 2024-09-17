AFRAME.registerComponent('markerhandler', {

    init: function() {
        const animatedMarker = document.querySelector("#animated-marker");
        const aEntity = document.querySelector("#animated-model");

        //alert('From script');

        animatedMarker.addEventListener('click', function(ev, target){
            //alert('Clicked at: ', evt.detail.intersection.point);
            alert('From script');
            const intersectedElement = ev && ev.detail && ev.detail.intersectedEl;
            //if (aEntity && intersectedElement === aEntity) {

                const position = aEntity.getAttribute('position');
                var arrayOfStrings = position.split(/\s/);
                Object.keys(position).forEach((key) => position[key] = "0 0 " + (Number(arrayOfStrings[2]) + 0.5));
                aEntity.setAttribute('position', position);

                const animationMixer = aEntity.getAttribute('animation-mixer');
                Object.keys(animationMixer).forEach((key) => animationMixer[key] = "clip: ConeAction; loop: false");
                aEntity.setAttribute('animation-mixer', animationMixer);

            //}
            alert('Clicked at: ', evt.detail.intersection.point);
            //console.log('Clicked at: ', evt.detail.intersection.point);
        });
}});