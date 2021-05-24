import { GLTFLoader } from "./js/GLTFLoader.js"
import { RGBDEncoding } from "./js/three.module.js";
'use strict'

var scene = new THREE.Scene();
scene.background = new THREE.Color(0xff0000)
// var scene = new Physijs.Scene;
// scene.setGravity(new THREE.Vector3(0, -10, 0));

var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const loader = new GLTFLoader();


var newLoader = new GLTFLoader();
newLoader.load('/resources/snake/scene.gltf', function (gltf) {
    scene.add(gltf.scene)
});


var renderer = new THREE.WebGLRenderer();


//colours
var black = "rgb(0,0,0)";
var white = "rgb(255,255,255)";
var red = "rgb(255,0,0)";
var green = "rgb(10,200,10)";
var blue = "rgb(110,197,233)";

renderer.setClearColor(blue);
renderer.setSize(window.innerWidth, window.innerHeight);

var axes = new THREE.AxesHelper(30);
scene.add(axes);

//Load model
var obj;
loader.load(
    'thermos/scene.gltf',

    function (gltf) {
        obj = gltf.scene;
        scene.add(gltf.scene);
    }
)

//plane
var planeGeometry = new THREE.PlaneGeometry(500, 500, 1, 1);
var planeMaterial = new THREE.MeshBasicMaterial({ color: green });
var plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -0.5 * Math.PI;
scene.add(plane);

//cube
var cubeGeometry = new THREE.BoxGeometry(6, 6, 6);
var cubeMaterial = new THREE.MeshLambertMaterial({ color: blue });
var cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
cube.position.x = -10;
cube.position.y = 3;
scene.add(cube);


//sphere
var sphereGeometry = new THREE.SphereGeometry(4, 20, 20);
var sphereMaterial = new THREE.MeshLambertMaterial({ color: white });
var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphere.position.y = 4
sphere.position.x = 10;
scene.add(sphere);

//spotlight
var spotlight = new THREE.SpotLight(0xffffff);
spotlight.position.set(-40, 60, 40);
scene.add(spotlight)


//
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
directionalLight.position.set(0, 10, 10);
scene.add(directionalLight)

//First person Controls section
var cameraControls = new THREE.FirstPersonControls(camera);
// cameraControls.lookSpeed = 0.05
// cameraControls.movementSpeed = 5


window.addEventListener('resize', function () {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;

})


//Initial camera position
camera.position.x = 50;
camera.position.y = 50;
camera.position.z = 50;
camera.lookAt(scene.position);

var clock = new THREE.Clock();

var step = 0;
var rad = 2;
cube.position.z = -20
cube.position.x = 0
cube.position.y = 4
function renderScene() {
    //Before request add changes in rotation and camera movements
    step += 0.005;

    camera.lookAt(scene.position);
    cube.position.z += Math.sin(step * Math.PI * rad)
    cube.position.x += Math.cos(step * Math.PI * rad)
    // var delta = clock.getDelta();//Gives time from when it was last called
    // cameraControls.update(delta);//Updates position
    renderer.clear();

    requestAnimationFrame(renderScene);//request render scene at every frame
    renderer.render(scene, camera);
}

$("#gameCanvas").append(renderer.domElement);
// var controls = new THREE.OrbitControls(camera, renderer.domElement)
// controls.update()
// renderer.render(scene,camera);
renderScene()