


// Setup BabylonJS in the usual way
const canvas = document.createElement('canvas');
document.body.appendChild(canvas);

const engine = new BABYLON.Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true
});

export const scene = new BABYLON.Scene(engine);
const light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), scene);

// Setup a Zappar camera instead of one of Babylon's cameras
export const camera = new ZapparBabylon.Camera('camera', scene);

// Request the necessary permission from the user
ZapparBabylon.permissionRequestUI().then((granted) => {
    if (granted) camera.start();
    else ZapparBabylon.permissionDeniedUI();
});


const url = new URL("./example-tracking-image.zpt", import.meta.url).href;
const imageTracker = new ZapparBabylon.ImageTrackerLoader().load(url);

const trackerTransformNode = new ZapparBabylon.ImageAnchorTransformNode('tracker', camera, imageTracker, scene);

// Add some content to the image tracker
const box = BABYLON.Mesh.CreateBox('box', 1, scene, false, BABYLON.Mesh.DOUBLESIDE)
box.parent = trackerTransformNode;
box.visibility = 0;

imageTracker.onVisible.bind(() => {
  box.visibility = 1;
});

imageTracker.onNotVisible.bind(() => {
  box.visibility = 0;
});


window.addEventListener('resize', () => {
    engine.resize();
});

// Set up our render loop
engine.runRenderLoop(() => {
    camera.updateFrame();
    scene.render();
});
