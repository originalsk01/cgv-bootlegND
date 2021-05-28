import { GLTFLoader } from './js/libs/GLTFLoader.js'
import { FBXLoader } from './js/libs/FBXLoader.js'
import { OrbitControls } from './js/libs/OrbitControls.js';

// import { RGBDEncoding } from './js/three.module.js';

var jumpheight = 10
var scene, camera


var orthoScene = new THREE.Scene();
//creating the camera for the overlay
var orthoCamera = new THREE.OrthographicCamera(
    window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2,
    window.innerHeight / - 2, - 500, 1000);
orthoCamera.position.x = 0;
orthoCamera.position.y = 0;
orthoCamera.position.z = 0;




var snakeobj, mixer2
var spotlight = new THREE.SpotLight(0xffffff)
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.1)
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444)
const dirLight = new THREE.DirectionalLight(0xffffff)
//colours
var black = 'rgb(0,0,0)'
var white = 'rgb(255,255,255)'
var red = 'rgb(255,0,0)'
var green = 'rgb(10,200,10)'
var blue = 'rgb(100,177,255)'

var mixer
const loader = new FBXLoader()
var snakeobj = new THREE.Object3D;
var newLoader = new GLTFLoader()
var clock = new THREE.Clock()
var step = 0



init()
function init() {
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0xa0a0a0)
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        1,
        2000
    )

    //spotlight
    spotlight.position.set(-40, 60, 40)
    scene.add(spotlight)
    //directionalLight light
    directionalLight.position.set(0, 10, 10)
    scene.add(directionalLight)

    //HEMILIGHT??
    hemiLight.position.set(0, 200, 0)
    scene.add(hemiLight)

    dirLight.position.set(0, 200, 100)
    dirLight.castShadow = true
    dirLight.shadow.camera.top = 180
    dirLight.shadow.camera.bottom = -100
    dirLight.shadow.camera.left = -120
    dirLight.shadow.camera.right = 120
    scene.add(dirLight)

    var axes = new THREE.AxesHelper(30)
    scene.add(axes)

    //Load textures
    var groundTexture = new THREE.TextureLoader().load('./textures/Rock_041_SD/Rock_041_ambientOcclusion.jpg');
    //plane
    var planeGeometry = new THREE.PlaneGeometry(1000, 1000, 1, 1)
    //using standard material so its got the same properties as unity rendering
    //meaning its affected by lights , basic means its unaffected by lights
    var planeMaterial = new THREE.MeshBasicMaterial({ map: groundTexture })
    var plane = new THREE.Mesh(planeGeometry, planeMaterial)
    plane.rotation.x = -0.5 * Math.PI
    scene.add(plane)

    //Begin creating hud element

    var container = document.createElement('div');
    container.setAttribute(
        "style", "width:100%; height:100%");
    document.body.appendChild(container);




    var spriteMaterial = new THREE.SpriteMaterial({
        map:
            THREE.ImageUtils.loadTexture(
                "./resources/mchotbar.png")
    });
    var sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.set(-400, -300, 0);
    sprite.scale.set(window.innerHeight, window.innerWidth/14, 1); //set dimensions for the hud
    orthoScene.add(sprite);




}

//Animated model

loader.load('character/Samba Dancing.fbx', (fbx) => {
    mixer = new THREE.AnimationMixer(fbx)
    fbx.scale.set(.15, .15, .15);
    fbx.position.set(25, 0, 0);

    const action = mixer.clipAction(fbx.animations[0])
    action.play()

    fbx.traverse(function (child) {
        if (child.isMesh) {
            child.castShadow = true
            child.receiveShadow = true
        }
    })

    scene.add(fbx)
})


newLoader.load('./resources/snake/scene.gltf', function (gltf) {
    mixer2 = new THREE.AnimationMixer(gltf.scene.children[0]);
    gltf.animations.forEach((clip) => { mixer2.clipAction(clip).play(); });
    // mixer2.clipAction(gltf.animations[0]).play()
    snakeobj.add(gltf.scene)

})
scene.add(snakeobj);


var renderer = new THREE.WebGLRenderer()
renderer.setClearColor(0xf0f0f0);
renderer.setSize(800, 600);
renderer.autoClear = false;

renderer.setClearColor(blue)
renderer.setSize(window.innerWidth, window.innerHeight)

window.addEventListener('resize', function () {
    renderer.setSize(window.innerWidth, window.innerHeight)
    camera.aspect = window.innerWidth / window.innerHeight
})


document.body.addEventListener('keydown', keyPressed);

function keyPressed(e) {
    switch (e.key) {
        case 'ArrowUp':
            snakeobj.position.z += 1;
            break;
        case 'ArrowDown':
            snakeobj.position.z += -1;
            break;
        case 'ArrowLeft':
            snakeobj.position.x += 1;
            break;
        case 'ArrowRight':
            snakeobj.position.x += -1;
            break;
        case " ": // check if the space button pressed
            snakeobj.position.y += jumpheight

    }
    e.preventDefault();

}

//Initial camera position

function updateSnake(delta) {

    camera.lookAt(snakeobj.position.x + 15, snakeobj.position.y + 5, snakeobj.position.z + 10) //updates where the camera looks at bacsed on snake


    if (snakeobj) {//checks if snake object defined before doing loop for jump
        if (snakeobj.position.y >= jumpheight) {
            snakeobj.position.y = jumpheight // set max height for jump
        }
        if (snakeobj.position.y > 0) {//check if the snake is above groun

            snakeobj.position.y -= delta * 20// make snake fall at rate of loop animation
        }
    }

}


function renderScene() {
    //Model
    renderer.clear()
    camera.position.set(snakeobj.position.x, snakeobj.position.y + 10, snakeobj.position.z - 10);//camera will always be set to the snakes current position by some offset
    const delta = clock.getDelta()

    if (mixer) mixer.update(delta)
    if (mixer2) mixer2.update(delta)
    updateSnake(delta);
    //Before request add changes in rotation and camera movements
    step += 0.005

    // var delta = clock.getDelta();//Gives time from when it was last called
    // cameraControls.update(delta);//Updates position
    renderer.clear()

    requestAnimationFrame(renderScene) //request render scene at every frame
    renderer.render(scene, camera)

    renderer.clearDepth()
    renderer.render(orthoScene, orthoCamera)
}

$('#gameCanvas').append(renderer.domElement)
// var controls = new THREE.OrbitControls(camera, renderer.domElement)
// controls.update()
renderScene()
