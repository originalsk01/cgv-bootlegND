import { GLTFLoader } from "./js/libs/GLTFLoader.js";
import { FBXLoader } from "./js/libs/FBXLoader.js";
import { OrbitControls } from "./js/libs/OrbitControls.js";
import * as THREE from "./js/libs/three.module.js";
import { PointerLockControls } from "./js/libs/PointerLockControls.js";

//import { RGBDEncoding } from './js/three.module.js';

var jumpheight = 10;
var scene, camera;
var snakeobj, mixer2;
var spotlight = new THREE.SpotLight(0xffffff);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.1);
const hemiLight = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
const dirLight = new THREE.DirectionalLight(0xffffff);
//colours
var black = "rgb(0,0,0)";
var white = "rgb(255,255,255)";
var red = "rgb(255,0,0)";
var green = "rgb(10,200,10)";
var blue = "rgb(100,177,255)";

//Models and loaders
const loader = new FBXLoader();
var snakeobj = new THREE.Object3D();
var newLoader = new GLTFLoader();
var shipModel = new THREE.Object3D();
var shipLoader = new GLTFLoader();
var tokenModel = new THREE.Object3D();
var tokenLoader = new GLTFLoader();

var mixer;
var clock = new THREE.Clock();
var step = 0;

let controls;

let raycaster;

//Movement
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;

let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const vertex = new THREE.Vector3();
const color = new THREE.Color();

var minutes, seconds, milliseconds, gameStart,gameLoad

var timer = document.createElement('div');
timer.style.position = 'absolute';
timer.style.color = 'white';
timer.style.top = '0%';
timer.style.textAlign = 'center';
timer.style.width = '100%';
timer.style.margin = '0 auto';
timer.innerHTML = '<div id = "timer"></div>';

init();
function init() {
  gameLoad=new Date().getTime();
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xa0a0a0);
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    1,
    2000
  );
  camera.position.set(0, 50, -10);
  // camera.lookAt(shipModel.position);

  //spotlight
  // spotlight.position.set(-40, 60, 40)
  // scene.add(spotlight)
  //directionalLight light
  directionalLight.position.set(0, 10, 10);
  scene.add(directionalLight);

  //Ambient Light
  const light = new THREE.AmbientLight(0x808080); // soft white light
  scene.add(light);

  //HEMILIGHT??
  hemiLight.position.set(0.5, 1, 0.75);
  scene.add(hemiLight);

  dirLight.position.set(0, 200, 100);
  dirLight.castShadow = true;
  dirLight.shadow.camera.top = 180;
  dirLight.shadow.camera.bottom = -100;
  dirLight.shadow.camera.left = -120;
  dirLight.shadow.camera.right = 120;
  scene.add(dirLight);

  var axes = new THREE.AxesHelper(30);
  scene.add(axes);

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

  //Create Floor
  // var meshPlane = new THREE.Mesh(
  //   new THREE.PlaneBufferGeometry(10000, 10000),
  //   new THREE.MeshPhongMaterial({ color: 0x111111, depthWrite: false })
  // );
  // meshPlane.rotation.x = -Math.PI / 2;
  // meshPlane.receiveShadow = true;
  // scene.add(meshPlane);
  // //Grid for floor
  // var grid = new THREE.GridHelper(5000, 40, 0xff0000, 0x0000ff);
  // grid.material.opacity = 0.7;
  // grid.material.transparent = true;
  // scene.add(grid);

  //Skybox
  const loader = new THREE.CubeTextureLoader();
  const texture = loader.load([
    "textures/skybox/indigo_ft.jpg",
    "textures/skybox/indigo_bk.jpg",
    "textures/skybox/indigo_up.jpg",
    "textures/skybox/indigo_dn.jpg",
    "textures/skybox/indigo_rt.jpg",
    "textures/skybox/indigo_lf.jpg",
  ]);
  scene.background = texture;

  //Create first person controls
  controls = new PointerLockControls(camera, document.body);

  //blocker and instructions is used to pause and start game
  const blocker = document.getElementById("blocker");
  const instructions = document.getElementById("instructions");
  const timer = document.getElementById("timer");

  instructions.addEventListener("click", function () {
    controls.lock();
  });

  controls.addEventListener("lock", function () {
    instructions.style.display = "none";
    blocker.style.display = "none";
    // gameLoad = new Date().getTime();
  });

  controls.addEventListener("unlock", function () {
    blocker.style.display = "block";
    instructions.style.display = "";
  });

  scene.add(controls.getObject());

  const onKeyDown = function (event) {
    switch (event.code) {
      case "ArrowUp":
      case "KeyW":
        moveForward = true;
        break;

      case "ArrowLeft":
      case "KeyA":
        moveLeft = true;
        break;

      case "ArrowDown":
      case "KeyS":
        moveBackward = true;
        break;

      case "ArrowRight":
      case "KeyD":
        moveRight = true;
        break;

      case "Space":
        if (canJump === true) velocity.y += 350;
        canJump = false;
        break;
    }
  };

  const onKeyUp = function (event) {
    switch (event.code) {
      case "ArrowUp":
      case "KeyW":
        moveForward = false;
        break;

      case "ArrowLeft":
      case "KeyA":
        moveLeft = false;
        break;

      case "ArrowDown":
      case "KeyS":
        moveBackward = false;
        break;

      case "ArrowRight":
      case "KeyD":
        moveRight = false;
        break;
    }
  };

  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);

  // raycaster = new THREE.Raycaster(
  //   new THREE.Vector3(),
  //   new THREE.Vector3(0, -1, 0),
  //   0,
  //   10
  // );

  loadModels();
}

//Function to load all models
function loadModels() {
  //Samba Dancer
  loader.load("character/Samba Dancing.fbx", (fbx) => {
    mixer = new THREE.AnimationMixer(fbx);
    fbx.scale.set(0.15, 0.15, 0.15);
    fbx.position.set(25, 0, 0);

    const action = mixer.clipAction(fbx.animations[0]);
    action.play();

    fbx.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    scene.add(fbx);
  });

  //Snake
  newLoader.load("./resources/snake/scene.gltf", function (gltf) {
    mixer2 = new THREE.AnimationMixer(gltf.scene.children[0]);
    gltf.animations.forEach((clip) => {
      mixer2.clipAction(clip).play();
    });
    // mixer2.clipAction(gltf.animations[0]).play()
    snakeobj.add(gltf.scene);
  });
  scene.add(snakeobj);

  //Starship
  shipLoader.load("character/LPSP_SmallStarfigher.gltf", function (gltfModel) {
    gltfModel.scene.scale.multiplyScalar(1.9);
    gltfModel.scene.traverse(function (child) {
      //console.log(child);
    });
    shipModel.add(gltfModel.scene);

  });


  scene.add(shipModel);

  
  //Token that the playr collects
  tokenLoader.load("character/token.gltf", function (gltfModel) {
    gltfModel.scene.scale.multiplyScalar(0.1);
    gltfModel.scene.traverse(function (child) {
      //console.log(child);
    });
    tokenModel.add(gltfModel.scene);
  });
  scene.add(tokenModel);

  //Create tokens
  for (let i = 0; i < 20; i++) {
    const tokenGeometry = new THREE.BoxGeometry(20,20,20);
    const tokenBox = new THREE.Box3(); //bounding box
    const tokenMaterial = new THREE.MeshLambertMaterial( { color: 0x00ff00 } );
    const tokenCustom = new THREE.Mesh( tokenGeometry, tokenMaterial );

    //Generate random positions for each of the tokens
    var randomX = Math.floor(Math.random() * 100);
    var randomZ = Math.floor(Math.random() * 100);
    tokenCustom.position.set(randomX, 0, randomZ)
    // ensure the bounding box is computed for its geometry
    // this should be done only once (assuming static geometries)
    tokenCustom.geometry.computeBoundingBox();

    scene.add(tokenCustom);
    

    //Since the bounding box for each token must be computed within the animation loop,
    //we create the tokens and boxes as empty here and add them to their respective arrays,
    //which can be looped through and each token and box can be accessed within the animation loop.
    tokensArray.push(tokenCustom);
    boxArray.push(tokenBox);
    console.log(boxArray)
  }

  //Create Player bounding box
  // playerBox = new THREE.Box3();
  // playerMesh = new THREE.Mesh(
  //   new THREE.SphereGeometry(),
  //   new THREE.MeshBasicMaterial()
  // );
  playerGeometry = new THREE.BoxGeometry(5, 5, 5);
  playerBox = new THREE.Box3(); //bounding box
  playerMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
  playerCustom = new THREE.Mesh(playerGeometry, playerMaterial);
  //Compute initial bounding box
  playerCustom.geometry.computeBoundingBox();

  scene.add(playerCustom);

  //console.log(scene.children);
}

var renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setClearColor(blue);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

//when window resizes
window.addEventListener("resize", function () {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
});

//Add boxes to the world
// const boxGeometry = new THREE.BoxGeometry(50, 10, 30).toNonIndexed();

// // position = boxGeometry.attributes.position;
// const colorsBox = [];

// for (let i = 0, l = 36; i < l; i++) {
//   color.setHSL(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75);
//   colorsBox.push(color.r, color.g, color.b);
// }

// boxGeometry.setAttribute(
//   "color",
//   new THREE.Float32BufferAttribute(colorsBox, 3)
// );

// for (let i = 0; i < 2000; i++) {
//   const boxMaterial = new THREE.MeshPhongMaterial({
//     specular: 0xffffff,
//     flatShading: true,
//     vertexColors: true,
//   });
//   boxMaterial.color.setHSL(
//     Math.random() * 0.2 + 0.5,
//     0.75,
//     Math.random() * 0.25 + 0.75
//   );

//   const box = new THREE.Mesh(boxGeometry, boxMaterial);
//   box.position.x =
//     Math.floor(Math.random() * 20 - 10) * 135 + Math.random() * 100;
//   box.position.y = 10;
//   box.position.z =
//     Math.floor(Math.random() * 20 - 10) * 100 + Math.random() * 100;

//   scene.add(box);
// objects.push(box)
//}



function renderScene() {
  gameStart=new Date().getTime();

  var distance=gameStart-gameLoad
  minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  seconds = Math.floor((distance % (1000 * 60)) / 1000);
  milliseconds = Math.floor((distance % (1000 * 60)) * 1000 / 1000);

  document.getElementById("timer").innerHTML ="<h1>Snake Invader</h1><h2>Snake Invader</h2>"
  +'<div class ="timerSec">'+ minutes + " Minutes" +"</div><div class ='timerSec'>"+ seconds + " Seconds"+'</div></div>';


  renderer.clear();

  const delta = clock.getDelta();
  //Animate snake and person
  if (mixer) mixer.update(delta);
  if (mixer2) mixer2.update(delta);

  //let cameraDirectionNormalised = new THREE.Vector3();
  // shipModel.position.set(camera.position.x, camera.position.y-10, camera.position.z);
  //shipModel.translateZ(camera.position.x, camera.position.y-10, camera.position.z+10);
  //camera.getWorldDirection(cameraDirectionNormalised);
  //let cameraDirection = new THREE.Vector3(camera.position.x + cameraDirectionNormalised.x, shipModel.position.y , camera.position.z + cameraDirectionNormalised.z);
  //shipModel.lookAt(cameraDirection);

  //var goal = new THREE.Object3D;
  //var temp = new THREE.Vector3();
  //goal.position.set( 0, 50, - 10 );
  //temp.setFromMatrixPosition(goal.matrixWorld);
  //camera.position.set( shipModel.position.x-5, shipModel.position.y+10, shipModel.position.x - 10 );
  //camera.position.lerp(shipModel.position, 0.2);
  //camera.lookAt(shipModel.position);

  requestAnimationFrame(renderScene); //request render scene at every frame
  const time = performance.now();

 
  //Compute bounding box for player
  playerCustom.position.set(camera.position.x, camera.position.y, camera.position.z)
  playerBox.copy( playerCustom.geometry.boundingBox ).applyMatrix4( playerCustom.matrixWorld );
  
  //playerBox.position.set(camera.position.x, camera.position.y, camera.position.z);

  //Loop through each of the tokens and their respective boxes, for each, compute the current bounding box with the world matrix
  for (let k = 0; k < tokensArray.length; k++) {
    boxArray[k].copy(tokensArray[k].geometry.boundingBox).applyMatrix4(tokensArray[k].matrixWorld);
    //Determine if player touches token
    if (playerBox.intersectsBox(boxArray[k])) {
      tokenScore += 1;
      tokensArray[k].material.color.setHex(0x000000ff); //Trying to set to transparent when in contact, but failing so it is blue for now
      console.log(tokenScore);
    }
  }


  if (controls.isLocked === true) {
    // const delta = (time - prevTime) / 1000;

    //Set movement velocity in each direction
    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;
    velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

    //Determine direction since Number(direction) evaluates to true or false since
    //moveForward, moveBackwards, moveLeft and moveRight are all boolean values
    //and so if moveForward is True(1) and moveBackward is false(0) then 1-0=1 and so we
    //move in the positive z direction
    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize(); // this ensures consistent movements in all directions

    //Move in direction
    if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;

    if (moveLeft) {
      velocity.x -= direction.x * 400.0 * delta;
      shipModel.rotateY(0.2);
    }

    if (moveRight) {
      velocity.x -= direction.x * 400.0 * delta;
      shipModel.rotateY(-0.2);
    }

    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);

    controls.getObject().position.y += velocity.y * delta; // new behavior

    //If player height is below 10 then set vertical velocity to 0,
    //without this the player falls through the map
    if (controls.getObject().position.y < 10) {
      velocity.y = 0;
      controls.getObject().position.y = 10;
      canJump = true;
    }
  }

  prevTime = time;
  renderer.render(scene, camera);
}

$("#gameCanvas").append(renderer.domElement);
// var controls = new THREE.OrbitControls(camera, renderer.domElement)
// controls.update()
renderScene();
