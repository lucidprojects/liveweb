let container, stats;
let camera, renderer;
let mesh, texture;
let pointLight;
let loader;
let island;
let modelLoaded = false;

// set up three js space 
const cubeRaycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
scene = new THREE.Scene();
clock = new THREE.Clock();
const keyboard = new THREEx.KeyboardState();

// SELF - create, texture and add
group = new THREE.Group(
    new THREE.BoxBufferGeometry(),
);

let groupRotation; // use this to store rotation to send to peers
let groupLookat = {}; // use this to look at

// make textures from video and gif canvases
const myCanvasToMaterial = document.getElementById('canvas');

const myVidtexture = new THREE.CanvasTexture(myCanvasToMaterial);
myVidtexture.minFilter = THREE.LinearFilter;

const myGifTexture = new THREE.CanvasTexture(gifCanvas);
myGifTexture.minFilter = THREE.LinearFilter;
const myGifTexture2 = new THREE.CanvasTexture(gifCanvas2);
myGifTexture2.minFilter = THREE.LinearFilter;
const myGifTexture3 = new THREE.CanvasTexture(gifCanvas3);
myGifTexture3.minFilter = THREE.LinearFilter;
const myGifTexture4 = new THREE.CanvasTexture(gifCanvas4);
myGifTexture4.minFilter = THREE.LinearFilter;
const myGifTexture5 = new THREE.CanvasTexture(gifCanvas5);
myGifTexture5.minFilter = THREE.LinearFilter;
const myGifTexture6 = new THREE.CanvasTexture(gifCanvas6);
myGifTexture6.minFilter = THREE.LinearFilter;

let redCubeGeometry = new THREE.BoxBufferGeometry(1, 1, 1);

// array of all materials including gifs
allMaterials = [
    new THREE.MeshBasicMaterial({
        color: 0xff0000,
        wireframe: false
    }),
    new THREE.MeshBasicMaterial({
        color: 0xff0000,
        wireframe: false
    }),
    new THREE.MeshBasicMaterial({
        color: 0xff0000,
        wireframe: false
    }),
    new THREE.MeshBasicMaterial({
        color: 0xff0000,
        wireframe: false
    }),
    new THREE.MeshBasicMaterial({
        color: 0xff0000,
        wireframe: false
    }),
    new THREE.MeshBasicMaterial({
        map: myVidtexture
    }),
    new THREE.MeshBasicMaterial({
        map: myGifTexture
    }),
    new THREE.MeshBasicMaterial({
        map: myGifTexture3
    }),
    new THREE.MeshBasicMaterial({
        map: myGifTexture4
    }),
    new THREE.MeshBasicMaterial({
        map: myGifTexture6
    }),
    new THREE.MeshBasicMaterial({
        map: myGifTexture5
    }),
    new THREE.MeshBasicMaterial({
        map: myGifTexture2
    }),
]

testMaterial = allMaterials[0]

redCubeMaterials = [
    testMaterial,
    allMaterials[1],
    allMaterials[2],
    allMaterials[3],
    new THREE.MeshBasicMaterial({
        map: myVidtexture
    }),
    allMaterials[4],
];

redCube = new THREE.Mesh(redCubeGeometry, redCubeMaterials);

redCube.position.set(0, 0.5, 0);
group.add(redCube);

init();
animate();

function init() {

    container = document.getElementById('container');
    container.innerHTML = "";

    // renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer = new THREE.WebGLRenderer({
        canvas
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // SELF - set initial position of self
    group.position.set(0, 5, 0);

    // BACKGROUND  set background cube mapped image
    const path = 'space_cubemap/';
    const format = '.png';
    const urls = [
        path + 'px' + format, path + 'nx' + format,
        path + 'py' + format, path + 'ny' + format,
        path + 'pz' + format, path + 'nz' + format
    ];

    const reflectionCube = new THREE.CubeTextureLoader().load(urls);
    const refractionCube = new THREE.CubeTextureLoader().load(urls);
    refractionCube.mapping = THREE.CubeRefractionMapping;

    scene.background = reflectionCube;

    // CAMERA
    let SCREEN_WIDTH = window.innerWidth,
        SCREEN_HEIGHT = window.innerHeight;
    let VIEW_ANGLE = 45,
        ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT,
        NEAR = 0.1,
        FAR = 20000;
    camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
    scene.add(camera);
    camera.position.set(0, 5, 60);
    camera.lookAt(scene.position);

    controls = new THREE.OrbitControls(camera, renderer.domElement);

    scene.add(group);

    scene.updateMatrixWorld(true);

    const gridHelper = new THREE.GridHelper(50, 50);
    gridHelper.position.y = -1;
    scene.add(gridHelper);

    // lights
    pointLight = new THREE.PointLight(0xffffff, 2);
    scene.add(pointLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff);
    dirLight1.position.set(1, 1, 1);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x002288);
    dirLight2.position.set(-1, -1, -1);
    scene.add(dirLight2);

    const ambientLight = new THREE.AmbientLight(0x222222);
    scene.add(ambientLight);


    // MODEL - island
    loader = new THREE.GLTFLoader();

    loader.load('./icosphere_world.glb', function (gltf) {
        gltf.scene.scale.set(1.5, 1.5, 1.5) // scale here
        scene.add(gltf.scene);
        island = gltf.scene;
        modelLoaded = true;

    }, undefined, function (error) {

        console.error(error);

    });

    stats = new Stats();
    // container.appendChild( stats.dom );
    window.addEventListener('resize', onWindowResize, false);

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

}

function animate() {

    requestAnimationFrame(animate);
    render();
    update();
    // update three js textures
    myVidtexture.needsUpdate = true;
    myGifTexture.needsUpdate = true;
    myGifTexture2.needsUpdate = true;
    myGifTexture3.needsUpdate = true;
    myGifTexture4.needsUpdate = true;
    myGifTexture5.needsUpdate = true;
    myGifTexture6.needsUpdate = true;
    if (myGifArea) myGifArea.needsUpdate = true;

    //stats.update();

}

function update() {
    let delta = clock.getDelta(); // seconds.

    const time = performance.now();

    let moveDistance = 10 * delta; // 200 pixels per second
    let rotateAngle = Math.PI / 2 * delta; // pi/2 radians (90 degrees) per second

    // RAYCASTER 
    cubeRaycaster.set(new THREE.Vector3(group.position.x, 100, group.position.z), new THREE.Vector3(0, -1, 0));

    let islandIntersects;

    if (modelLoaded) {
        islandIntersects = cubeRaycaster.intersectObjects([island], true);
        if (islandIntersects.length > 0) {
            group.position.set(group.position.x, islandIntersects[0].point.y, group.position.z);
        }


    } else console.log("island not loaded yet");

    //KEYCMDS for cube movement
    if (chatOpen == false) {
        // global coordinates - keyboard cmds adapted from https://stemkoski.github.io/Three.js/js/THREEx.KeyboardState.js
        if (keyboard.pressed("left") || keyboard.pressed("Q")) {
            if (group.position.x < -25) {

            } else {
                group.position.x -= moveDistance;
                group.lookAt(-100, 0, 0);
                groupLookat = {
                    x: -100,
                    y: 0,
                    z: 0,
                }

            }
        }
        if (keyboard.pressed("right") || keyboard.pressed("E")) {
            if (group.position.x > +25) {

            } else {
                group.position.x += moveDistance;
                group.lookAt(100, 0, 0);
                groupLookat = {
                    x: 100,
                    y: 0,
                    z: 0,
                }


            }
        }
        if (keyboard.pressed("up") || keyboard.pressed("W")) {
            // console.log(group.position.z );
            if (group.position.z < -25) {

            } else {

                group.position.z -= moveDistance;
                group.lookAt(0, 0, -100);
                groupLookat = {
                    x: 0,
                    y: 0,
                    z: -100,
                }


            }
        }
        if (keyboard.pressed("down") || keyboard.pressed("S")) {
            // console.log(group.position.z );
            if (group.position.z > +25) {

            } else {
                group.position.z += moveDistance;
                group.lookAt(0, 0, 100);
                groupLookat = {
                    x: 0,
                    y: 0,
                    z: 100,

                }

            }
        }
        if (keyboard.pressed("G")) {
            group.translateY(-moveDistance);
        }
        if (keyboard.pressed("T")) group.translateY(moveDistance);

        // rotate left/right/up/down
        let rotation_matrix = new THREE.Matrix4().identity();
        if (keyboard.pressed("A")) {
            group.rotateOnAxis(new THREE.Vector3(0, 1, 0), rotateAngle);
            groupRotation = new THREE.Vector3(0, 1, 0);
            groupRotation.applyQuaternion(group.quaternion)
            //console.log(groupRotation);
        }

        if (keyboard.pressed("D"))
            group.rotateOnAxis(new THREE.Vector3(0, 1, 0), -rotateAngle);
        if (keyboard.pressed("R"))
            group.rotateOnAxis(new THREE.Vector3(1, 0, 0), rotateAngle);
        if (keyboard.pressed("F"))
            group.rotateOnAxis(new THREE.Vector3(1, 0, 0), -rotateAngle);
        if (keyboard.pressed("Z")) {
            group.position.set(0, 1, 0);
            group.rotation.set(0, 0, 0);
        }

        if (keyboard.pressed("space")) {
            console.log("spacebar pressed");
            peerGifMaterial();
        }

    }

    localPlayerMove(group, groupLookat);

}

function render() {
    renderer.render(scene, camera);
}






