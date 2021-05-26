import { GLTFLoader } from './js/GLTFLoader.js'
import { FBXLoader } from './js/FBXLoader.js'
import { OrbitControls } from './js/OrbitControls.js';

// import { RGBDEncoding } from './js/three.module.js';
var jumpheight=10
var scene,camera
var snakeobj , mixer2
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



init()
function init(){
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

    
}

//



//Animated model
var mixer
const loader = new FBXLoader()
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

var snakeobj = new THREE.Object3D;

var newLoader = new GLTFLoader()
newLoader.load('./resources/snake/scene.gltf', function (gltf) {
    snakeobj = gltf.scene;
    mixer2 = new THREE.AnimationMixer(gltf.scene.children[0]);
    gltf.animations.forEach((clip) => { mixer2.clipAction(clip).play(); });
    scene.add(gltf.scene)

})
scene.add(snakeobj);


var renderer = new THREE.WebGLRenderer()


renderer.setClearColor(blue)
renderer.setSize(window.innerWidth, window.innerHeight)




//Load textures
var groundTexture = new THREE.TextureLoader().load('./Rock_041_SD/Rock_041_ambientOcclusion.jpg');

//plane
var planeGeometry = new THREE.PlaneGeometry(500, 500, 1, 1)
//using standard material so its got the same properties as unity rendering
//meaning its affected by lights , basic means its unaffected by lights
var planeMaterial = new THREE.MeshBasicMaterial({ map: groundTexture })
var plane = new THREE.Mesh(planeGeometry, planeMaterial)
plane.rotation.x = -0.5 * Math.PI
scene.add(plane)





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
            snakeobj.position.y+=jumpheight
            
    }
    e.preventDefault();

}

//Initial camera position

var clock = new THREE.Clock()

var step = 0

function updateSnake(delta){
    if (snakeobj) {//checks if snake object defined before doing loop for jump
        if(snakeobj.position.y>=jumpheight){
            snakeobj.position.y=jumpheight // set max height for jump
        }
        if(snakeobj.position.y>0 ){//check if the snake is above groun
    
            snakeobj.position.y -= delta*20// make snake fall at rate of loop animation
        }
    }

}


function renderScene() {
    //Model
    camera.position.set(snakeobj.position.x,snakeobj.position.y+10,snakeobj.position.z-10);//camera will always be set to the snakes current position by some offset
    const delta = clock.getDelta()

    if (mixer) mixer.update(delta)
    if (mixer2) mixer2.update(delta)
    updateSnake(delta);
    //Before request add changes in rotation and camera movements
    step += 0.005

    camera.lookAt(snakeobj.position.x+5,snakeobj.position.y+5,snakeobj.position.z+10)
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
