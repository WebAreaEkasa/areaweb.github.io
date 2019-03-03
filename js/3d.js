var SKYBOX_IMAGES_PATH = "/img/skybox";
var LINK_PAGE_PATH = "/agenda.html";
var CUBE_IMAGE_PATH = '/img/retatalks_logo.jpg';

window.addEventListener('DOMContentLoaded', function () {
    // get the canvas DOM element
    var canvas = document.getElementById('renderCanvas');

    // load the 3D engine
    var engine = new BABYLON.Engine(canvas, true);

    // call the createScene function
    var scene = createScene(canvas, engine);

    // run the render loop
    engine.runRenderLoop(function () {
        scene.render();
    });

    // the canvas/window resize event handler
    window.addEventListener('resize', function () {
        engine.resize();
    });
});


function createScene(canvas, engine) {
    //  Particle parameters
    var size = 10;                      // particle size
    var widthNb = 30;                   // width particle number
    var heightNb = 20;                  // height particle number
    var gravity = -0.07;                // gravity
    var restitution = 0.9;              // energy restitution on ground collision ex : 0.6 => 60 %
    var friction = 0.995;               // ground friction once the particle has landed
    var radius = size * heightNb / 12;  // explosion radius
    var speed = radius * 1.2;           // particle max speed

    // Ground parameters
    var subdivisions = 50;
    var width = 1000;
    var height = 1000;
    var groungHeight = width / 6;


    var scene = new BABYLON.Scene(engine);
    var camera = new BABYLON.ArcRotateCamera("cam", -Math.PI / 2, Math.PI / 2, 10, BABYLON.Vector3.Zero());
    var anchor = new BABYLON.TransformNode("");

    camera.setPosition(new BABYLON.Vector3(-10, 20, -100));
    camera.wheelDeltaPercentage = 0.01;
    camera.attachControl(canvas, true);

    // Lights
    var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
    light.groundColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    light.intensity = 0.2;

    var dir = new BABYLON.Vector3(0, -1, 1);
    var dirLight = new BABYLON.DirectionalLight("dl", dir, scene);
    dirLight.position = new BABYLON.Vector3(0, 200, -1000);
    dirLight.diffuse = BABYLON.Color3.White();
    dirLight.intensity = 0.8;
    dirLight.specular = new BABYLON.Color3(0.5, 0.5, 0.2);

    var pl = new BABYLON.PointLight("pl", new BABYLON.Vector3(0, 0, 0), scene);
    pl.diffuse = new BABYLON.Color3(1, 1, 1);
    pl.specular = BABYLON.Color3.Black();
    pl.intensity = 0.4;


    // Create the 3D UI manager
    var manager = new BABYLON.GUI.GUI3DManager(scene);

    var panel = new BABYLON.GUI.StackPanel3D();
    panel.isVertical = true;
    panel.margin = 1;
    panel.columns = 2;

    manager.addControl(panel);
    panel.linkToTransformNode(anchor);
    panel.position.z = -1.5;

    var addButton = function () {
        var button = createCube(scene);
        panel.addControl(button);
    }

    panel.blockLayout = true;
    for (var index = 0; index < 1; index++) {
        addButton();
    }
    panel.blockLayout = false;

    return createSkyBox(scene);

}

function createCube(scene) {
    var textureResolution = 100;
    var myDynamicTexture = new BABYLON.DynamicTexture("dt", textureResolution, scene);

    var ctx = myDynamicTexture.getContext();

    var img = new Image();
    img.src = CUBE_IMAGE_PATH;
    img.onload = function () {
        ctx.drawImage(this, 0, 0, 100, 100);
        myDynamicTexture.update();
    }

    var mat = new BABYLON.StandardMaterial("mat", scene);
    mat.diffuseTexture = myDynamicTexture;

    mat.freeze();

    var boxOptions = { height: 10, width: 10, depth: 10 }

    var panelBox = BABYLON.MeshBuilder.CreateBox("panelBox", boxOptions, scene);
    panelBox.position.x = 0;
    panelBox.position.z = 0;
    panelBox.material = mat;

    var pushButton = new BABYLON.GUI.MeshButton3D(panelBox, "pushButton");

    pushButton.onPointerClickObservable.add(function (e, t, i) {
        window.location = LINK_PAGE_PATH;
    });


    return pushButton;
}

function createSkyBox(scene) {
    var skybox = BABYLON.Mesh.CreateBox("skyBox", 1024.0, scene);
    var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture(SKYBOX_IMAGES_PATH + "/skybox", scene);
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.disableLighting = true;
    skybox.material = skyboxMaterial;

    return scene;
}