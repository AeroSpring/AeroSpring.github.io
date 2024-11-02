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


//const url = new URL("./example-tracking-image.zpt", import.meta.url).href;    assets/Fan/
const url = new URL("./assets/pictures/qr-code_ar-1c_2_400.zpt", import.meta.url).href;
const imageTracker = new ZapparBabylon.ImageTrackerLoader().load(url);

const trackerTransformNode = new ZapparBabylon.ImageAnchorTransformNode('tracker', camera, imageTracker, scene);


// Add some content to the image tracker
const box = BABYLON.Mesh.CreateBox('box', 1, scene, false, BABYLON.Mesh.DOUBLESIDE)
//const box = BABYLON.MeshBuilder.CreateBox("box", {});
box.parent = trackerTransformNode;
box.visibility = 0;
//box.scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);
//box.position.x = 0.5;
//box.position.y = 1;

const boxMaterial = new BABYLON.StandardMaterial("material", scene);
boxMaterial.diffuseColor = BABYLON.Color3.Random();
box.material = boxMaterial;

box.actionManager = new BABYLON.ActionManager(scene);
box.actionManager.registerAction(
  new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, 
    function (evt) {
        const sourceBox = evt.meshUnderPointer;
        sourceBox.position.x += 0.1;
        sourceBox.position.y += 0.1;
        boxMaterial.diffuseColor = BABYLON.Color3.Random();
    }
  )
);


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
