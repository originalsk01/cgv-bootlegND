import { GLTFLoader } from './js/GLTFLoader.js'
import { FBXLoader } from './js/FBXLoader.js'
import { OrbitControls } from './js/OrbitControls.js';

import { RGBDEncoding } from './js/three.module.js'
;('use strict')

var scene = new THREE.Scene()
scene.background = new THREE.Color(0xa0a0a0)
// var scene = new Physijs.Scene;
// scene.setGravity(new THREE.Vector3(0, -10, 0));

var camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  1,
  2000
)

//Animated model
let mixer
const loader = new FBXLoader()
loader.load('character/Samba Dancing.fbx', (fbx) => {
  mixer = new THREE.AnimationMixer(fbx)
  fbx.scale.set(.15,.15,.15);
  fbx.position.set(25,0,0);

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

var newLoader = new GLTFLoader()
newLoader.load('/resources/snake/scene.gltf', function (gltf) {
  scene.add(gltf.scene)
})

var renderer = new THREE.WebGLRenderer()

//colours
var black = 'rgb(0,0,0)'
var white = 'rgb(255,255,255)'
var red = 'rgb(255,0,0)'
var green = 'rgb(10,200,10)'
var blue = 'rgb(110,197,233)'

renderer.setClearColor(blue)
renderer.setSize(window.innerWidth, window.innerHeight)

const controls = new OrbitControls(camera, renderer.domElement)
controls.target.set(0, 100, 0)
controls.update()

var axes = new THREE.AxesHelper(30)
scene.add(axes)

//Load model

//plane
var planeGeometry = new THREE.PlaneGeometry(500, 500, 1, 1)
var planeMaterial = new THREE.MeshBasicMaterial({ color: green })
var plane = new THREE.Mesh(planeGeometry, planeMaterial)
plane.rotation.x = -0.5 * Math.PI
scene.add(plane)

//cube
var cubeGeometry = new THREE.BoxGeometry(6, 6, 6)
var cubeMaterial = new THREE.MeshLambertMaterial({ color: blue })
var cube = new THREE.Mesh(cubeGeometry, cubeMaterial)
cube.position.x = -10
cube.position.y = 3
scene.add(cube)


//spotlight
var spotlight = new THREE.SpotLight(0xffffff)
spotlight.position.set(-40, 60, 40)
scene.add(spotlight)

//
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
directionalLight.position.set(0, 10, 10)
scene.add(directionalLight)

//More lights
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444)
hemiLight.position.set(0, 200, 0)
scene.add(hemiLight)

const dirLight = new THREE.DirectionalLight(0xffffff)
dirLight.position.set(0, 200, 100)
dirLight.castShadow = true
dirLight.shadow.camera.top = 180
dirLight.shadow.camera.bottom = -100
dirLight.shadow.camera.left = -120
dirLight.shadow.camera.right = 120
scene.add(dirLight)


window.addEventListener('resize', function () {
  renderer.setSize(window.innerWidth, window.innerHeight)
  camera.aspect = window.innerWidth / window.innerHeight
})

//Initial camera position
camera.position.set(50, 50, 50)

var clock = new THREE.Clock()

var step = 0
var rad = 2
cube.position.z = -20
cube.position.x = 0
cube.position.y = 4
function renderScene() {
  //Model
  const delta = clock.getDelta()

  if (mixer) mixer.update(delta)

  //Before request add changes in rotation and camera movements
  step += 0.005

  camera.lookAt(scene.position)
  cube.position.z += Math.sin(step * Math.PI * rad)
  cube.position.x += Math.cos(step * Math.PI * rad)
  // var delta = clock.getDelta();//Gives time from when it was last called
  // cameraControls.update(delta);//Updates position
  renderer.clear()

  requestAnimationFrame(renderScene) //request render scene at every frame
  renderer.render(scene, camera)
}

$('#gameCanvas').append(renderer.domElement)
// var controls = new THREE.OrbitControls(camera, renderer.domElement)
// controls.update()
// renderer.render(scene,camera);
renderScene()
