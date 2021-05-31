import { GLTFLoader } from './js/libs/GLTFLoader.js'
import { FBXLoader } from './js/libs/FBXLoader.js'
import { OrbitControls } from './js/libs/OrbitControls.js'
import * as THREE from './js/libs/three.module.js'
import { PointerLockControls } from './js/libs/PointerLockControls.js'

//import { RGBDEncoding } from './js/three.module.js';

var jumpheight = 10
var scene, camera
var snakeobj, mixer2
var spotlight = new THREE.SpotLight(0xffffff)
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.1)
const hemiLight = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75)
const dirLight = new THREE.DirectionalLight(0xffffff)
//colours
var black = 'rgb(0,0,0)'
var white = 'rgb(255,255,255)'
var red = 'rgb(255,0,0)'
var green = 'rgb(10,200,10)'
var blue = 'rgb(100,177,255)'

var mixer
const loader = new FBXLoader()
var snakeobj = new THREE.Object3D()
var newLoader = new GLTFLoader()
var clock = new THREE.Clock()
var step = 0

let controls

let raycaster

//Movement
let moveForward = false
let moveBackward = false
let moveLeft = false
let moveRight = false
let canJump = false

let prevTime = performance.now()
const velocity = new THREE.Vector3()
const direction = new THREE.Vector3()
const vertex = new THREE.Vector3()
const color = new THREE.Color()

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
  // spotlight.position.set(-40, 60, 40)
  // scene.add(spotlight)
  //directionalLight light
  directionalLight.position.set(0, 10, 10)
  scene.add(directionalLight)

  //Ambient Light
  const light = new THREE.AmbientLight(0x808080) // soft white light
  scene.add(light)

  //HEMILIGHT??
  hemiLight.position.set(0.5, 1, 0.75)
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
  // var groundTexture = new THREE.TextureLoader().load('./textures/Rock_041_SD/Rock_041_ambientOcclusion.jpg');
  // //plane
  // var planeGeometry = new THREE.PlaneGeometry(1000, 1000, 1, 1)
  // //using standard material so its got the same properties as unity rendering
  // //meaning its affected by lights , basic means its unaffected by lights
  // var planeMaterial = new THREE.MeshBasicMaterial({ map: groundTexture })
  // var plane = new THREE.Mesh(planeGeometry, planeMaterial)
  // plane.rotation.x = -0.5 * Math.PI
  // scene.add(plane)
  var meshPlane = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(10000, 10000),
    new THREE.MeshPhongMaterial({ color: 0x111111, depthWrite: false })
  )
  meshPlane.rotation.x = -Math.PI / 2
  meshPlane.receiveShadow = true
  scene.add(meshPlane)
  //Grid for floor
  var grid = new THREE.GridHelper(5000, 40, 0xff0000, 0x0000ff)
  grid.material.opacity = 0.7
  grid.material.transparent = true
  scene.add(grid)

  //Skybox
  const loader = new THREE.CubeTextureLoader()
  const texture = loader.load([
    'textures/skybox/indigo_ft.jpg',
    'textures/skybox/indigo_bk.jpg',
    'textures/skybox/indigo_up.jpg',
    'textures/skybox/indigo_dn.jpg',
    'textures/skybox/indigo_rt.jpg',
    'textures/skybox/indigo_lf.jpg',
  ])
  scene.background = texture

  //Create first person controls
  controls = new PointerLockControls(camera, document.body)

  //blocker and instructions is used to pause and start game
  const blocker = document.getElementById('blocker')
  const instructions = document.getElementById('instructions')

  instructions.addEventListener('click', function () {
    controls.lock()
  })

  controls.addEventListener('lock', function () {
    instructions.style.display = 'none'
    blocker.style.display = 'none'
  })

  controls.addEventListener('unlock', function () {
    blocker.style.display = 'block'
    instructions.style.display = ''
  })

  scene.add(controls.getObject())

  const onKeyDown = function (event) {
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        moveForward = true
        break

      case 'ArrowLeft':
      case 'KeyA':
        moveLeft = true
        break

      case 'ArrowDown':
      case 'KeyS':
        moveBackward = true
        break

      case 'ArrowRight':
      case 'KeyD':
        moveRight = true
        break

      case 'Space':
        if (canJump === true) velocity.y += 350
        canJump = false
        break
    }
  }

  const onKeyUp = function (event) {
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        moveForward = false
        break

      case 'ArrowLeft':
      case 'KeyA':
        moveLeft = false
        break

      case 'ArrowDown':
      case 'KeyS':
        moveBackward = false
        break

      case 'ArrowRight':
      case 'KeyD':
        moveRight = false
        break
    }
  }

  document.addEventListener('keydown', onKeyDown)
  document.addEventListener('keyup', onKeyUp)

  raycaster = new THREE.Raycaster(
    new THREE.Vector3(),
    new THREE.Vector3(0, -1, 0),
    0,
    10
  )
}

//Animated model

loader.load('character/Samba Dancing.fbx', (fbx) => {
  mixer = new THREE.AnimationMixer(fbx)
  fbx.scale.set(0.15, 0.15, 0.15)
  fbx.position.set(25, 0, 0)

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
  mixer2 = new THREE.AnimationMixer(gltf.scene.children[0])
  gltf.animations.forEach((clip) => {
    mixer2.clipAction(clip).play()
  })
  // mixer2.clipAction(gltf.animations[0]).play()
  snakeobj.add(gltf.scene)
})
scene.add(snakeobj)

var renderer = new THREE.WebGLRenderer({ antialias: true })

renderer.setClearColor(blue)
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)

//when window resizes
window.addEventListener('resize', function () {
  renderer.setSize(window.innerWidth, window.innerHeight)
  camera.aspect = window.innerWidth / window.innerHeight
})

//Add boxes to the world
const boxGeometry = new THREE.BoxGeometry(50, 10, 30).toNonIndexed()

// position = boxGeometry.attributes.position;
const colorsBox = []

for (let i = 0, l = 36; i < l; i++) {
  color.setHSL(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75)
  colorsBox.push(color.r, color.g, color.b)
}

boxGeometry.setAttribute(
  'color',
  new THREE.Float32BufferAttribute(colorsBox, 3)
)

for (let i = 0; i < 2000; i++) {
  const boxMaterial = new THREE.MeshPhongMaterial({
    specular: 0xffffff,
    flatShading: true,
    vertexColors: true,
  })
  boxMaterial.color.setHSL(
    Math.random() * 0.2 + 0.5,
    0.75,
    Math.random() * 0.25 + 0.75
  )

  const box = new THREE.Mesh(boxGeometry, boxMaterial)
  box.position.x = Math.floor(Math.random() * 20 - 10) * 135 + Math.random() * 100 
  box.position.y =  10
  box.position.z = Math.floor(Math.random() * 20 - 10) * 100 +  Math.random() * 100

  scene.add(box)
  // objects.push(box)
}

function renderScene() {
  renderer.clear()

  const delta = clock.getDelta()
  //Animate snake and person
  if (mixer) mixer.update(delta)
  if (mixer2) mixer2.update(delta)

  //Set snake position and direction
  //   snakeobj.position.set(camera.position.x, camera.position.y-5, camera.position.z)
  //   let cameraDirection = camera.getWorldDirection();
  //   //snakeobj.lookAt(cameraDirection);
  //   let snakeDirection = snakeobj.getWorldDirection();
  //   let angle = snakeDirection.angleTo(cameraDirection);
  //   snakeobj.rotateY(angle);
  // //   let snakeDir = new THREE.Vector3();
  // //   camera.getWorldDirection(snakeDir);
  // //   snakeobj.lookAt(snakeDir);

  requestAnimationFrame(renderScene) //request render scene at every frame
  const time = performance.now()

  if (controls.isLocked === true) {
    // const delta = (time - prevTime) / 1000;

    velocity.x -= velocity.x * 10.0 * delta
    velocity.z -= velocity.z * 10.0 * delta

    velocity.y -= 9.8 * 100.0 * delta // 100.0 = mass

    direction.z = Number(moveForward) - Number(moveBackward)
    direction.x = Number(moveRight) - Number(moveLeft)
    direction.normalize() // this ensures consistent movements in all directions

    if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta
    if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta

    controls.moveRight(-velocity.x * delta)
    controls.moveForward(-velocity.z * delta)

    controls.getObject().position.y += velocity.y * delta // new behavior

    if (controls.getObject().position.y < 10) {
      velocity.y = 0
      controls.getObject().position.y = 10

      canJump = true
    }
  }

  prevTime = time
  renderer.render(scene, camera)
}

$('#gameCanvas').append(renderer.domElement)
// var controls = new THREE.OrbitControls(camera, renderer.domElement)
// controls.update()
renderScene()
