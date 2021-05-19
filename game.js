import {GLTFLoader} from "./js/GLTFLoader.js"
import { RGBDEncoding } from "./js/three.module.js";

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const loader = new GLTFLoader();


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

    function(gltf){
        obj = gltf.scene;
        scene.add( gltf.scene );
    }
)

//plane
var planeGeometry = new THREE.PlaneGeometry(500,500,1,1);
var planeMaterial = new THREE.MeshBasicMaterial({color: green});
var plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -0.5 * Math.PI;
scene.add(plane);

//cube
var cubeGeometry = new THREE.BoxGeometry(6,6,6);
var cubeMaterial = new THREE.MeshLambertMaterial({color: red});
var cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
cube.position.x = -10;
cube.position.y = 3;
scene.add(cube);

//sphere
var sphereGeometry = new THREE.SphereGeometry(4,20,20);
var sphereMaterial = new THREE.MeshLambertMaterial({color: red});
var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphere.position.y = 4
sphere.position.x = 10;
scene.add(sphere);

//spotlight
var spotlight = new THREE.SpotLight(0xffffff);
spotlight.position.set(-40, 60, 40);
scene.add(spotlight)

//First person Controls section
var cameraControls = new THREE.FirstPersonControls(camera);



window.addEventListener('resize', function(){
    renderer.setSize(window.innerWidth,window.innerHeight);
    camera.aspect=window.innerWidth/window.innerHeight;

})


//Initial camera position
camera.position.x = 10;
camera.position.y = 10;
camera.position.z = 50;
camera.lookAt(scene.position);

var clock = new THREE.Clock();

var step = 0;
function renderScene(){
    //Before request add changes in rotation and camera movements
    step += 0.005;
    camera.position.x = 60*Math.cos(step);
    camera.position.z = 60*Math.sin(step); 
    camera.lookAt(scene.position);

    // var delta = clock.getDelta();//Gives time from when it was last called
    // cameraControls.update(delta);//Updates position
    // renderer.clear();


    requestAnimationFrame(renderScene);//request render scene at every frame
    renderer.render(scene,camera);
}

$("#gameCanvas").append(renderer.domElement);
// renderer.render(scene,camera);
renderScene()