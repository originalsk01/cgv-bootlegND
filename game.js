import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { BufferGeometryUtils } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import Stats from "three/examples/jsm/libs/stats.module.js";
import * as CANNON from "cannon-es";
import { threeToCannon, ShapeType } from "three-to-cannon";

// three.js global vars
let camera, scene, stats, renderer, clock, controls;
let shipModel;

// global asset paths
const shipPath =
	"/models/low_poly_spaceship_pack/models/GLTF/LPSP_SmallStarfigher.gltf";


// global colour variables
const black = "rgb(0,0,0)";
const white = "rgb(255,255,255)";
const red = "rgb(255,0,0)";
const green = "rgb(10,200,10)";
const blue = "rgb(110,197,233)";
const vibrantYellow = new THREE.Color(0xf49f1c);
const darkBlue = new THREE.Color(0x003380);

// cannon-es global variables
let world;
let shipBody;
const timeStep = 1 / 60;
let lastCallTime;

// player control global variables
let keys


//cubemap
var cubeCamera = [];

var firstPerson

// flight camera a& controls global variables
let flightCamera, minimapCamera, mapWidth = 240, mapHeight = 160;
let acceleration = 0

let pitchSpeed = 0
let rollSpeed = 0
let yawSpeed = 0
let accelerationImpulse

let mouse

//token global variables
var tokensArray = []; //Array containing tokens
var boxArray = []; // Array containing box for tokens'
var innerCustomArray = []; //Array conatining the inner meh of the tokens

//ship model bounding box global vairables
var playerGeometry;
var playerBox;
var playerMaterial;
var playerCustom;

//global variable to keep track of the number of frames that havebeen rendered
var renderFrames = 0;

//timer variables

var minutes, seconds, milliseconds, gameStart, gameLoad, currentTime, endTime, gamePauseDate, gamePause, timeSincePause
var just_unpaused = false
var levelDuration = 3
var timeTaken = [0, 0]
var inprogress = true


//score variable
var totalTokens = 1;
var tokenScore = 0;
var maxScore = 1;

//animation variables
var requestAnimationFrameID

var pause = false;



var level = 1
// var levelOneComplete = false
//health bar
var health = 100
var hBar = $('.health-bar'),
	bar = hBar.find('.bar');
var totalHealth = 100
var healthBarWidth = (health / totalHealth) * 100;
bar.css('width', healthBarWidth + '%');
var floor_id

var playonce = true

class Game {

	async init() {
		////////// INITIALIZE THREE.JS SCENE AND CANNON-ES PHYSICS WORLD //////////////////

		//get html elements
		const timer = document.getElementById("timer");

		// Scene
		scene = new THREE.Scene();

		//Skybox

		const secondLevelLoader = new THREE.CubeTextureLoader();
		const gloomyskyBoxtexture = secondLevelLoader.load([
			"textures/penguins/arid_ft.jpg",
			"textures/penguins/arid_bk.jpg",
			"textures/penguins/arid_up.jpg",
			"textures/penguins/arid_dn.jpg",
			"textures/penguins/arid_rt.jpg",
			"textures/penguins/arid_lf.jpg",
		]);

		scene.background = gloomyskyBoxtexture;

		//Skybox
		const skyBoxLoader = new THREE.CubeTextureLoader();
		const skyBoxtexture = skyBoxLoader.load([
			"textures/skybox/indigo_ft.jpg",
			"textures/skybox/indigo_bk.jpg",
			"textures/skybox/indigo_up.jpg",
			"textures/skybox/indigo_dn.jpg",
			"textures/skybox/indigo_rt.jpg",
			"textures/skybox/indigo_lf.jpg",
		]);
		scene.background = skyBoxtexture;


		// Physics world
		world = new CANNON.World({
			// gravity: new CANNON.Vec3(0, -9.81, 0), // m/s??
		})
		//world.gravity.set(0, -20, 0)
		world.gravity.set(0, 0, 0)
		world.broadphase = new CANNON.NaiveBroadphase(); // Detect coilliding objects
		world.solver.iterations = 5; // collision detection sampling rate

		stats = new Stats();
		document.body.appendChild(stats.dom);
		// Initialise flight camera
		const fcFielOfView = 75;
		const fcNear = 0.1;
		const fcFar = 1000;

		flightCamera = new THREE.PerspectiveCamera(fcFielOfView, window.innerWidth / window.innerHeight, fcNear, fcFar);

		//Initialise Minimap Camera
		minimapCamera = new THREE.OrthographicCamera(
			window.innerWidth / -4,		// Left
			window.innerWidth / 4,		// Right
			window.innerHeight / 4,		// Top
			window.innerHeight / -4,	// Bottom
			-100,            			// Near 
			10000);           			// Far 
		minimapCamera.up = new THREE.Vector3(0, 0, -1);
		minimapCamera.position.y = 5;
		minimapCamera.lookAt(new THREE.Vector3(0, -1, 0));
		scene.add(minimapCamera)

		// Renderer
		renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setClearColor(blue);
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.setSize(window.innerWidth, window.innerHeight);
		//renderer.setSize(2*window.innerWidth/3, 2*window.innerHeight/3)
		window.addEventListener("resize", onWindowResize, false);
		document.body.appendChild(renderer.domElement);

		//add some background music
		if (playonce) {
			const listener = new THREE.AudioListener();
			flightCamera.add(listener);

			// create a global audio source
			const sound = new THREE.Audio(listener);

			// load a sound and set it as the Audio object's buffer
			const audioLoader = new THREE.AudioLoader();
			audioLoader.load('DOMN.mp3', function (buffer) {
				sound.setBuffer(buffer);
				sound.setLoop(true);
				sound.setVolume(0.2);
				if (!sound.isPlaying) {
					sound.play();
				}
			});
			playonce = false
		}


		// Size of one unit for world coordinates if Grid used as basis
		const gridSize = 500;
		const gridDivisions = 50;
		const gridSquareSize = gridSize / gridDivisions;

		// Lights
		const ambientLight = new THREE.AmbientLight(0xffffff, 0.25);
		scene.add(ambientLight);

		// const dirLight = new THREE.DirectionalLight(0xffffff,5);
		// dirLight.position.set(-20, 200,500);
		// dirLight.castShadow = true;
		// dirLight.shadow.camera.top = 180;
		// dirLight.shadow.camera.bottom = -100;
		// dirLight.shadow.camera.left = -120;
		// dirLight.shadow.camera.right = 120;
		// scene.add(dirLight);

		const spotLight = new THREE.SpotLight( 0xffffff,1);
		spotLight.position.set( -750, 1000, 1000 );
		spotLight.castShadow = true;
		spotLight.shadow.mapSize.width = 1024;
		spotLight.shadow.mapSize.height = 1024;
		spotLight.shadow.camera.near = 500;
		spotLight.shadow.camera.far = 4000;
		spotLight.shadow.camera.fov = 30;

		scene.add( spotLight );

		// Materials
		const groundMaterial = new CANNON.Material("groundMaterial");

		// Adjust constraint equation parameters for ground/ground contact
		const ground_ground_cm = new CANNON.ContactMaterial(
			groundMaterial,
			groundMaterial,
			{

				friction: 0.4,
				restitution: 0.3,
				contactEquationStiffness: 1e8,
				contactEquationRelaxation: 3,
				frictionEquationStiffness: 1e8,
				frictionEquationRegularizationTime: 3,

			}
		);

		// Add contact material to the world
		world.addContactMaterial(ground_ground_cm);

		// Create a slippery material (friction coefficient = 0.0)
		const slipperyMaterial = new CANNON.Material("slipperyMaterial");

		// The ContactMaterial defines what happens when two materials meet.
		// In this case we want friction coefficient = 0.0 when the slippery material touches ground.
		const slippery_ground_cm = new CANNON.ContactMaterial(
			groundMaterial,
			slipperyMaterial,
			{

				friction: 0.0,
				restitution: 0.3,
				contactEquationStiffness: 1e8,
				contactEquationRelaxation: 3,
			}
		);

		// We must add the contact materials to the world
		world.addContactMaterial(slippery_ground_cm);

		// Create a static ground plane for the ground
		const groundBody = new CANNON.Body({
			type: CANNON.Body.STATIC, // can also be achieved by setting the mass to 0
			shape: new CANNON.Plane(),
			material: groundMaterial,
		});
		groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); // make it face up

		//////////////// MAKE, AND ADD, LEVEL PLATFORMS //////////////////////////

		// Function to create a platform of size legth by width in world units
		// out of tiles(box geometries) using a BufferGeometry to provide the necessary performance improveement
		// your machine would otherwise die if it tried to render this many grouped objects normally
		const createPlatform = (length, width, height, tileColorMap) => {
			const tiles = [];

			const tileGeometry = new THREE.BoxGeometry(1, 1, 1);

			//const tileColorMap = new THREE.TextureLoader().load('./textures/temp_floor.png')
			const tileMaterial = new THREE.MeshPhongMaterial({ map: tileColorMap });

			const midpointOffset = 0.5;

			for (let y = 0; y < height; y++) {


				const ypos = y + midpointOffset;
				for (let x = 0; x < length; x++) {

					const xpos = x + midpointOffset;
					for (let z = 0; z < width; z++) {

						const zpos = z + midpointOffset;
						// instead of creating a new geometry, we just clone the bufferGeometry instance
						const newTile = tileGeometry.clone();
						//const y =  0 //getRandomInt(0,5)
						newTile.applyMatrix4(
							new THREE.Matrix4().makeTranslation(xpos, ypos, zpos)
						);
						// then, we push this bufferGeometry instance in our array
						tiles.push(newTile);
					}
				}
			}

			// merge into single super buffer geometry;
			const geometriesTiles = BufferGeometryUtils.mergeBufferGeometries(tiles);
			
			// centre super geometry at local origin

			geometriesTiles.applyMatrix4(new THREE.Matrix4().makeTranslation(-length / 2, -height / 2, -width / 2));
			geometriesTiles.applyMatrix4(new THREE.Matrix4().makeScale(gridSquareSize, gridSquareSize, gridSquareSize));


			// create one mega big platform mesh from super geometry
			const platform = new THREE.Mesh(geometriesTiles, tileMaterial);
			

			// place lower left corner of platform mesh  at X-Z (0,0)
			platform.translateX((gridSquareSize * length) / 2);
			platform.translateZ((gridSquareSize * width) / 2);
			platform.translateY((gridSquareSize * height) / 2);


			return platform;
		};

		// Function to set platform postition in gameboard coordinates in world
		const placePlatform = (platform, x, y, z) => {
			// translate platform in world coordinates
			x = x * gridSquareSize;
			y = y * gridSquareSize;
			z = z * gridSquareSize;
			platform.applyMatrix4(new THREE.Matrix4().makeTranslation(x, y, z));

			// create cannon body for platform
			const platformBody = new CANNON.Body({
				type: CANNON.Body.STATIC,
				material: groundMaterial,
				shape: threeToCannon(platform, { type: ShapeType.BOX }).shape,
			});

			const platformPos = new THREE.Vector3();
			platform.getWorldPosition(platformPos);
			platformBody.position.set(platformPos.x, platformPos.y, platformPos.z);
			return {
				threePlatform: platform,
				cannonPlatform: platformBody,
			};
		};

		// Function to add multiple platforms into a gameboard
		// allow different textures/colours for different sections
		const createGameBoard = ( x, y , z, scaleLength, scaleWidth, scaleHeight,) => {

			const board = new THREE.Group();
			const platformGeometries = [];
			const platformBodies = [];
			let newPlatform;
			let colorMap;

			colorMap = new THREE.TextureLoader().load("./textures/lime_floor.png");
			newPlatform = placePlatform(createPlatform(scaleLength*1, scaleWidth*50, scaleHeight*50, colorMap), x+ scaleLength*-25,y+ scaleLength*0,z+ scaleHeight*-25);
			platformGeometries.push(newPlatform.threePlatform);
			platformBodies.push(newPlatform.cannonPlatform);

			//final wall
			colorMap = new THREE.TextureLoader().load("./textures/dark_floor.png");
			newPlatform = placePlatform(createPlatform(scaleLength*1, scaleWidth*50, scaleHeight*40, colorMap),x+ scaleLength*25,y+ scaleLength*0,z+ scaleHeight*-25);
			platformGeometries.push(newPlatform.threePlatform);
			platformBodies.push(newPlatform.cannonPlatform);

			colorMap = new THREE.TextureLoader().load("./textures/dark_floor.png");
			newPlatform = placePlatform(createPlatform(scaleLength*1, scaleWidth*45, scaleHeight*20, colorMap),x+ scaleLength*25,y+ scaleLength*40,z+ scaleHeight*-35);
			platformGeometries.push(newPlatform.threePlatform);
			platformBodies.push(newPlatform.cannonPlatform);

			//floor 
			colorMap = new THREE.TextureLoader().load("./textures/lime_floor.png");
			newPlatform = placePlatform(createPlatform(scaleLength*50, scaleWidth*50, scaleHeight*1, colorMap),x+ scaleLength*-25,y+ scaleLength*0,z+ scaleHeight*-25);
			platformGeometries.push(newPlatform.threePlatform);
			platformBodies.push(newPlatform.cannonPlatform);
			floor_id = newPlatform.cannonPlatform.id

			for (var i = 0; i < 30; i++) {
				var randX = getRandomInt(-25, 0);
				var randY = getRandomInt(0, 50);
				var randZ = getRandomInt(-25, 0);
				colorMap = new THREE.TextureLoader().load("./textures/blue_floor.png");
				newPlatform = placePlatform(createPlatform(1, 1, 1, colorMap), randX, randY, randY);
				platformGeometries.push(newPlatform.threePlatform);
				platformBodies.push(newPlatform.cannonPlatform);
			}




			//ceiling
			colorMap = new THREE.TextureLoader().load("./textures/dark_floor.png");
			newPlatform = placePlatform(createPlatform(scaleLength*50, scaleWidth*50, scaleHeight*1, colorMap),x+ scaleLength*-25,y+ scaleLength*50,z+ scaleHeight*-25);
			platformGeometries.push(newPlatform.threePlatform);
			platformBodies.push(newPlatform.cannonPlatform);
			//world boundaries
			colorMap = new THREE.TextureLoader().load("./textures/light_floor.png");
			newPlatform = placePlatform(createPlatform(scaleLength*51, scaleWidth*1, scaleHeight*51, colorMap),x+ scaleLength*-26,y+ scaleLength*0,z+ scaleHeight*25);
			platformGeometries.push(newPlatform.threePlatform);
			platformBodies.push(newPlatform.cannonPlatform);

			colorMap = new THREE.TextureLoader().load("./textures/dark_floor.png");
			newPlatform = placePlatform(createPlatform(scaleLength*51, scaleWidth*1, scaleHeight*51, colorMap),x+ scaleLength*-25,y+ scaleLength*0,z+ scaleHeight*-25);
			platformGeometries.push(newPlatform.threePlatform);
			platformBodies.push(newPlatform.cannonPlatform);

			for (let i = 0; i < platformGeometries.length; i++) {
				board.add(platformGeometries[i]);
				world.addBody(platformBodies[i]);
			}

			return board;
		};

		const createSquareRing = (x,y,z, scaleLength, scaleWidth, scaleHeight, isZAxis) =>{
			const board = new THREE.Group();
			const platformGeometries = [];
			const platformBodies = [];
			let newPlatform;
			let colorMap;
			
			//ceiling
			colorMap = new THREE.TextureLoader().load("./textures/dark_floor.png");
			newPlatform = placePlatform(createPlatform(scaleLength*5, scaleWidth*5, scaleHeight*1, colorMap), x-1*scaleLength, y+5*scaleWidth, z-1*scaleHeight);
			platformGeometries.push(newPlatform.threePlatform);
			platformBodies.push(newPlatform.cannonPlatform);
		
			//floor 
			colorMap = new THREE.TextureLoader().load("./textures/lime_floor.png");
			newPlatform = placePlatform(createPlatform(scaleLength*5, scaleWidth*5, scaleHeight*1, colorMap), x-1*scaleLength, y, z-1*scaleHeight);
			platformGeometries.push(newPlatform.threePlatform);
			platformBodies.push(newPlatform.cannonPlatform);
			floor_id = newPlatform.cannonPlatform.id

			if (isZAxis) {
				//world boundaries
				colorMap = new THREE.TextureLoader().load("./textures/light_floor.png");
				newPlatform = placePlatform(createPlatform(scaleLength*1, scaleWidth*5, scaleHeight*6 -2, colorMap), x+3*scaleLength, y+1, z-1*scaleHeight);
				platformGeometries.push(newPlatform.threePlatform);
				platformBodies.push(newPlatform.cannonPlatform);
			
				colorMap = new THREE.TextureLoader().load("./textures/dark_floor.png");
				newPlatform = placePlatform(createPlatform(scaleLength*1, scaleWidth*5, scaleHeight*5 -1, colorMap), x-1*scaleLength, y+1, z-1*scaleHeight);
				platformGeometries.push(newPlatform.threePlatform);
				platformBodies.push(newPlatform.cannonPlatform);
			}else {
				//world boundaries
				colorMap = new THREE.TextureLoader().load("./textures/light_floor.png");
				newPlatform = placePlatform(createPlatform(scaleLength*5, scaleWidth*1, scaleHeight*6, colorMap), x-1*scaleLength, y, z+4*scaleHeight);
				platformGeometries.push(newPlatform.threePlatform);
				platformBodies.push(newPlatform.cannonPlatform);
			
				colorMap = new THREE.TextureLoader().load("./textures/dark_floor.png");
				newPlatform = placePlatform(createPlatform(scaleLength*5, scaleWidth*1, scaleHeight*5 -1, colorMap), x-1*scaleLength, y+1, z-1*scaleHeight);
				platformGeometries.push(newPlatform.threePlatform);
				platformBodies.push(newPlatform.cannonPlatform);
			}
		
			for (let i = 0; i < platformGeometries.length; i++) {
				board.add(platformGeometries[i]);
				world.addBody(platformBodies[i]);
			}
		
			return board;
		}

		const createFloor = (x,y,z, scaleLength, scaleWidth, scaleHeight) => {
			const board = new THREE.Group();
			const platformGeometries = [];
			const platformBodies = [];
			let newPlatform;
			let colorMap;
			//floor 
			colorMap = new THREE.TextureLoader().load("./textures/lime_floor.png");
			newPlatform = placePlatform(createPlatform(scaleLength*5, scaleWidth*5, scaleHeight*1, colorMap), x-1*scaleLength, y, z-1*scaleHeight);
			
			platformGeometries.push(newPlatform.threePlatform);
			platformBodies.push(newPlatform.cannonPlatform);
			floor_id = newPlatform.cannonPlatform.id

			for (let i = 0; i < platformGeometries.length; i++) {
				board.add(platformGeometries[i]);
				world.addBody(platformBodies[i]);
			}
		
			return board;
		}

		// Starting Platform
		const floorPlatform = createFloor(-10,0,0, 10,10,1);
		scene.add(floorPlatform)

		// Starting room
		// const gameboard = createGameBoard(0,0,0, 0.5,0.5,0.5);
		// scene.add(gameboard);


		
		// Ring obstacles to  drop tunnel
		const ringOne = createSquareRing(0, 0, 18 , 1,1,1, true);
		scene.add(ringOne)

		const ringTwo = createSquareRing(-10, 5, 50 , 1,1,1, true);
		scene.add(ringTwo)

		const ringThree = createSquareRing(0, 8, 80 , 1,1,1, true);
		scene.add(ringThree)

		const ringFour = createSquareRing(13, 2, 110 , 1,1,1, false);
		scene.add(ringFour)

		const ringFive = createSquareRing(23, 10, 90 , 1,1,1, false);
		scene.add(ringFive)

		const ringSix = createSquareRing(33, 7, 75 , 1,1,1, true);
		scene.add(ringSix)

		const createTunnelDown = (x,y,z, scaleLength, scaleWidth, scaleHeight) =>{
			const mazeGroup = new THREE.Group();
			const platformGeometries = [];
			const platformBodies = [];
			let newPlatform;
			let colorMap;
			
			colorMap = new THREE.TextureLoader().load("./textures/light_floor.png");
			newPlatform = placePlatform(createPlatform(scaleLength*1, scaleWidth*5, scaleHeight*5-1 , colorMap), x+3*scaleLength, y+1, z-1*scaleHeight);
			platformGeometries.push(newPlatform.threePlatform);
			platformBodies.push(newPlatform.cannonPlatform);
		
			colorMap = new THREE.TextureLoader().load("./textures/dark_floor.png");
			newPlatform = placePlatform(createPlatform(scaleLength*1, scaleWidth*5, scaleHeight*5-1, colorMap), x-1*scaleLength, y+1, z-1*scaleHeight);
			platformGeometries.push(newPlatform.threePlatform);
			platformBodies.push(newPlatform.cannonPlatform);

			colorMap = new THREE.TextureLoader().load("./textures/dark_floor.png");
			newPlatform = placePlatform(createPlatform(scaleLength*5 -1, scaleWidth*1, scaleHeight*5 -1, colorMap), x-1*scaleLength, y+1, z-1*scaleHeight);
			platformGeometries.push(newPlatform.threePlatform);
			platformBodies.push(newPlatform.cannonPlatform);

			colorMap = new THREE.TextureLoader().load("./textures/dark_floor.png");
			newPlatform = placePlatform(createPlatform(scaleLength*5 -1, scaleWidth*1, scaleHeight*5 -1, colorMap), x-1*scaleLength, y+1, z+1);
			platformGeometries.push(newPlatform.threePlatform);
			platformBodies.push(newPlatform.cannonPlatform);

			//floor 
			colorMap = new THREE.TextureLoader().load("./textures/lime_floor.png");
			newPlatform = placePlatform(createPlatform(scaleLength*5, scaleWidth*5, scaleHeight*1, colorMap), x-1*scaleLength, y-5, z-1*scaleHeight);
			platformGeometries.push(newPlatform.threePlatform);
			platformBodies.push(newPlatform.cannonPlatform);
			floor_id = newPlatform.cannonPlatform.id

			for (let i = 0; i < platformGeometries.length; i++) {
				mazeGroup.add(platformGeometries[i]);
				world.addBody(platformBodies[i]);
			}
		
			return mazeGroup;
		}

		var tunnel = createTunnelDown(33, -10, 65 ,1 ,1 ,3);
		scene.add(tunnel);




		// const ringOne = createSquareRing(0, 0, 18 , 1,1,1, true);
		// scene.add(ringOne)

		// const ringOne = createSquareRing(0, 0, 18 , 1,1,1, true);
		// scene.add(ringOne)

		// const ringTwo = createSquareRing(10, 0, 20 , 1, 0.8, 0.8, false);
		// scene.add(ringTwo)

		// const ringThree = createSquareRing(100, 50, 40 ,  1, 1, 1);
		// scene.add(ringThree)

		// //Drop Tunnel
		// const dropTunnel = createSquareRing(110, 20, 40 ,  2, 1, 1);
		// scene.add(dropTunnel)

		// Room two
		// const gameboardTwo = createGameBoard(150,160,118, 1,1,1);
		// scene.add(gameboardTwo);




		//////////////// ADD PLAYER SHIP //////////////////////////


		shipModel = new THREE.Object3D
		shipModel = await loadModel(shipPath)

		shipModel.applyMatrix4(new THREE.Matrix4().makeScale(1.9, 1.9, 1.9));
		shipModel.applyMatrix4(new THREE.Matrix4().makeTranslation(-5, 0, -5));
		shipModel.castShadow = true
		scene.add(shipModel)
		shipModel.add(flightCamera)

		flightCamera.position.set(0, 4, 7.5)
		

		// create cannon body for ship
		shipBody = new CANNON.Body({
			mass: 1,
			material: slipperyMaterial,
			shape: threeToCannon(shipModel).shape,

		})
		shipBody.position.set(0, 10, 0)

		shipBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI);
		world.addBody(shipBody)
		var lastCollisionTime = new Date().getTime();
		shipBody.addEventListener("collide", function (e) {
			timeTaken = time_taken(gameStart);
			var minutes_taken = timeTaken["minutes"]
			var seconds_taken = timeTaken["seconds"]
			const hurtListener = new THREE.AudioListener();
		flightCamera.add(hurtListener);

		// create a global audio source
		const hurtSound = new THREE.Audio(hurtListener);

		// load a sound and set it as the Audio object's buffer
		const hurtLoader = new THREE.AudioLoader();
		hurtLoader.load('./classic_hurt.mp3', function (buffer) {
			hurtSound.setBuffer(buffer);
			hurtSound.setLoop(false);
			hurtSound.setVolume(0.2);
			hurtSound.play()
		});
			if (lastCollisionTime + 2000 < new Date().getTime()) {
				var damage = 5
				updateHealth(damage);
				lastCollisionTime = new Date().getTime();
			}

		});


		// Initialize ship keyboard control

		initShipControls()



		//////////////// CREATE SHIP BOUNDING BOX //////////////////
		playerGeometry = new THREE.BoxGeometry(2, 2, 2);
		playerBox = new THREE.Box3(); //bounding box
		playerMaterial = new THREE.MeshLambertMaterial({
			color: 0xff0000,
			transparent: true,
			opacity: 0,
		});
		playerCustom = new THREE.Mesh(playerGeometry, playerMaterial);
		playerCustom.position.set(
			shipModel.position.x,
			shipModel.position.y,
			shipModel.position.z
		);
		//Compute initial bounding box
		playerCustom.geometry.computeBoundingBox();

		var playerCenter = new THREE.Vector3(2, 5, 8);
		playerCenter = playerBox.getCenter();

		scene.add(playerCustom);
		playerBox.copy(playerCustom.geometry.boundingBox).applyMatrix4(playerCustom.matrixWorld);

		//////////////// ADD THE TOKENS //////////////////
		//Create tokens

		for (let i = 0; i < totalTokens; i++) {


			//createToken(innerRadius, outerRadius, innerDetail, outerDetail, innerColour, outerColour, innerOpacity, outerOpacity);
			var tokenCustom = createToken(6, 8, 0, 0, vibrantYellow, darkBlue, 1, 0.3);
			//Generate random positions for each of the tokens
			tokenCustom.position.set(12, 30, 200);
			const tokenBox = new THREE.Box3(); //bounding box
			// ensure the bounding box is computed for its geometry
			// this should be done only once (assuming static geometries)
			tokenCustom.geometry.computeBoundingBox();
			//tokenBox.copy( tokenCustom.geometry.boundingBox ).applyMatrix4( tokenCustom.matrixWorld );

			//Calculate center of token just for debugging
			var tokenCenter = new THREE.Vector3();
			tokenCenter = tokenBox.getCenter();

			scene.add(tokenCustom);

			//Since the bounding box for each token must be computed within the animation loop,
			//we create the tokens and boxes as empty here and add them floorto their respective arrays,
			//which can be looped through and each token and box can be accessed within the animation loop.
			tokensArray.push(tokenCustom);
			boxArray.push(tokenBox);
		}

		clock = new THREE.Clock();

		gameLoad = Date.parse(new Date());
		gameStart = new Date();
		endTime = new Date(gameLoad + levelDuration * 60 * 1000);
		animate();
	}

}


function fly() {
	if (keys.h) { switchView() }
	if (keys.arrowup) { acceleration = -1 }
	if (keys.space) { acceleration -= 0.25 }
	if (keys.arrowdown) { acceleration = 1 }
	if (keys.arrowup || keys.arrowdown || keys.space) {
		let accelerationImpulseDirection = new CANNON.Vec3(0, 0, acceleration)
		accelerationImpulse = shipBody.quaternion.vmult(accelerationImpulseDirection)
		shipBody.applyImpulse(accelerationImpulse)
	}


	if (keys.w || keys.a || keys.s || keys.d || keys.arrowleft || keys.arrowright) {
		if (keys.w) { pitchSpeed = -1 } else if (keys.s) { pitchSpeed = 1 } else { pitchSpeed = 0 }
		if (keys.a) { rollSpeed = 0.75 } else if (keys.d) { rollSpeed = -0.75 } else { rollSpeed = 0 }
		if (keys.arrowleft) { rollSpeed += 2 } else if (keys.arrowright) { rollSpeed += -2 } else { rollSpeed += 0 }

		var directionVector = new CANNON.Vec3(pitchSpeed, yawSpeed, rollSpeed)

		var directionVector = shipBody.quaternion.vmult(directionVector)

		shipBody.angularVelocity.set(directionVector.x, directionVector.y, directionVector.z)

	}

	shipBody.linearDamping = 0.5
	shipBody.angularDamping = 0.9
}


function switchView() {
	let thirdPersonCam = new THREE.Vector3(0, 4, 7.5);
	let fp = new CANNON.Vec3(0, 0, -3);
	if (flightCamera.position.x == fp.x && flightCamera.position.y == fp.y && flightCamera.position.z == fp.z) {
		flightCamera.position.lerp(thirdPersonCam, 1)
	}
	else if (flightCamera.position.x == thirdPersonCam.x && flightCamera.position.y == thirdPersonCam.y && flightCamera.position.z == thirdPersonCam.z) {
		flightCamera.position.lerp(fp, 1);
	}
}

function animate() {

	renderFrames += 1;

	if (inprogress == true) {
		//request render scene at every frame
		requestAnimationFrameID = requestAnimationFrame(animate);
	}
	else {
		gameEnd();
	}

	/*************************************************************************************************************/

	if (!pause) {

		if (just_unpaused){
			timeSincePause = time_since_pause(gamePause);
			gameStart= new Date(Date.parse(gameStart)+ timeSincePause);

			endTime = new Date(Date.parse(endTime)+ timeSincePause);
			just_unpaused = false
		}
	
		//check for token intersection
		if (renderFrames >= 10) {
			//Loop through each of the tokens and their respective boxes, for each, compute the current bounding box with the world matrix
			for (let k = 0; k < tokensArray.length; k++) {
				boxArray[k]
					.copy(tokensArray[k].geometry.boundingBox)
					.applyMatrix4(tokensArray[k].matrixWorld);
				//Determine if player touches token
				const blue = new THREE.Color(0x0000ff);
				if (playerBox.intersectsBox(boxArray[k]) && tokensArray[k].material.color.equals(darkBlue)) {
					tokenScore += 1;

					//Make outer shape of token transparent
					tokensArray[k].material.transparent = true;
					tokensArray[k].material.opacity = 0;
					//Make inner shape of token transparent
					innerCustomArray[k].material.transparent = true;
					innerCustomArray[k].material.opacity = 0;

					
					tokensArray[k].material.color.setHex(0xffffff); //Trying to set to transparent when in contact, but failing so it is blue for now
				}
			}
		}


		//update timertimer
		var timeRemaining = time_remaining(endTime)
		minutes = timeRemaining["minutes"]
		seconds = timeRemaining["seconds"]
		if (minutes <= 0 && seconds <= 0) {
			timeTaken = time_taken(gameStart);
			var minutes_taken = timeTaken["minutes"]
			var seconds_taken = timeTaken["seconds"]
			timeTaken[0] = minutes_taken
			timeTaken[1] = seconds_taken
			inprogress = false
		}
		if (minutes > 0 && seconds > 30 && inprogress) {
			timer.innerHTML = "<h1>Snake Invader</h1>" + "<h2>Level " + level + "</h2>"
				+ '<div class ="timerSec">' + minutes + " Minutes" + " " + seconds + " Seconds" + '</div>' + '<div> Tokens Collected: ' + tokenScore + ' Out of ' + totalTokens + '</div>' + '</div>';
		}

		if (minutes == 0 && seconds <= 30 && seconds > 0 && inprogress) {
			timer.innerHTML = "<h1>Snake Invader</h1>" + "<h2>Level " + level + "</h2>"
				+ '<div style="color:red;" class ="timerSec">' + minutes + " Minutes" + " " + seconds + " Seconds" + '</div>' + '<div> Tokens Collected: ' + tokenScore + ' Out of ' + totalTokens + '</div>' + '</div>';
		}
		if (tokenScore == maxScore) { // checking if they have won the game
			timeTaken = time_taken(gameStart);
			var minutes_taken = timeTaken["minutes"]
			var seconds_taken = timeTaken["seconds"]
			timeTaken[0] = minutes_taken
			timeTaken[1] = seconds_taken
			inprogress = false

		}
		if (health <= 0) {//if the player loses all thier health end the game
			timeTaken = time_taken(gameStart);
			var minutes_taken = timeTaken["minutes"]
			var seconds_taken = timeTaken["seconds"]
			timeTaken[0] = minutes_taken
			timeTaken[1] = seconds_taken
			inprogress = false
		}



		/************************************************************************************************************************** */


		// take timestep in physics simulation
		stepPhysicsWorld()

		// update three.js meshes according to cannon-es simulations
		updatePhysicsBodies()

		// update flight camera
		fly()
		// models animations
		const delta = clock.getDelta()

		stats.update()
		//// render three.js

		var w = window.innerWidth, h = window.innerHeight;


		renderer.setViewport(0, 0, w, h);
		// renderer.clear()
		renderer.render(scene, flightCamera);

		//Renderer automaitcally clear before rendering new image so disable temporarily
		renderer.autoClear = false;
		renderer.setViewport(w - mapWidth - 20, h - mapHeight - 10, mapWidth, mapHeight);
		for (var i = 0; i<cubeCamera.length; i++){
			cubeCamera[i].update(renderer,scene)
		}

		//Change to minimapCamera 
		renderer.render(scene, minimapCamera);
		// minimap (overhead orthogonal camera)
		//  lower_left_x, lower_left_y, viewport_width, viewport_height

	}

	

}

// Update projection when viewing window is resized
function onWindowResize() {


	flightCamera.aspect = window.innerWidth / window.innerHeight
	flightCamera.updateProjectionMatrix()

	renderer.setSize(window.innerWidth, window.innerHeight)

}

// Make time step in physics simulation
function stepPhysicsWorld() {

	const time = performance.now() / 1000

	if (!lastCallTime) {
		world.step(timeStep)
	}
	else {
		const dt = time - lastCallTime
		world.step(timeStep, dt)
	}
	lastCallTime = time
}

// Update the positions and orientations of the dynamic three.js objects according to the current
// physics properties of their corresponding bodies in the physics sim
function updatePhysicsBodies() {
	// update three.js model positions using cannon-es simulation

	shipModel.position.copy(shipBody.position)
	shipModel.quaternion.copy(shipBody.quaternion)

	playerCustom.position.copy(shipBody.position)
	playerCustom.quaternion.copy(shipBody.quaternion)

	playerBox.copy(playerCustom.geometry.boundingBox).applyMatrix4(playerCustom.matrixWorld)

}

// load up gltf model asynchronously
async function loadModel(path) {

	const loader = new GLTFLoader()

	const model = await loader.loadAsync(path)

	return model.scene.children[0]
}

document.addEventListener('keydown', function(event) {
    if (event.code == 'KeyP') {
      pause=!pause
		//gazmePause = Date.parse(new Date());
		if(pause) {
			gamePause = new Date();
			console.log(gamePause)
			just_unpaused = true;
		}
	
    }
});


const timer = document.getElementById("timer");
function nextLevel() {
	timer.innerHTML = "<h1>Snake Invader</h1>" + "<h2>Level " + level + "</h2>"
		+ '<div style="color:red;" class ="timerSec">' + minutes + " Minutes" + " " + seconds + " Seconds" + '</div>' + '<div> Tokens Collected: ' + tokenScore + ' Out of ' + totalTokens + '</div>' + '</div>';

		if (level == 2) {
			//increase level goal
			inprogress = true
			maxScore = 3
			totalTokens = 3
			var xCoordinates = [-80, 12, 130]
			var yCoordinates = [80, 110, 55]
			var zCoordinates = [500, 800, 1125]
			animate()
			for (let i = 0; i < totalTokens; i++) {
				var tokenCustom = createToken(6,8, 0, 0, vibrantYellow, darkBlue, 1, 0.3);
				var randomX = Math.floor(Math.random() * 250);
				var randomZ = Math.floor(Math.random() * 250);
				var randomY = Math.floor(Math.random() * 100) + 10;
				tokenCustom.position.set(xCoordinates[i], yCoordinates[i], zCoordinates[i]); //sets location of thetoken to be in a random line location
				const tokenBox = new THREE.Box3(); //bounding box
				tokenCustom.geometry.computeBoundingBox();
	
				var tokenCenter = new THREE.Vector3();
				tokenCenter = tokenBox.getCenter();
	
				scene.add(tokenCustom);
				tokensArray.push(tokenCustom);
				boxArray.push(tokenBox);
			}
	
		}
		if (level == 3) {
			inprogress = true
			maxScore = 9
			totalTokens = 9
			var xCoordinates = [240, 345, 345, 345, 345]
			var yCoordinates = [120, 100, 50, -25, -70]
			var zCoordinates = [920, 750, 645, 645, 645]
			animate()
			for (let i = 0; i < 5; i++) {
				var tokenCustom = createToken(6, 8, 0, 0, vibrantYellow, darkBlue, 1, 0.3);
				tokenCustom.position.set(xCoordinates[i], yCoordinates[i], zCoordinates[i]);
				const tokenBox = new THREE.Box3(); //bounding box
				tokenCustom.geometry.computeBoundingBox();
	
				var tokenCenter = new THREE.Vector3();
				tokenCenter = tokenBox.getCenter();
	
				scene.add(tokenCustom);
				tokensArray.push(tokenCustom);
				boxArray.push(tokenBox);
			}
		}
	if (level == 4) { //end of the game
		timer.innerHTML = "<h1>Game Complete</h1>" + "<h2>Time Taken</h2>"
			+ '<div class ="timerSec" style="background: black">' + timeTaken[0] + " Minutes" + " " + timeTaken[1] + " Seconds" + '</div>';
		inprogress = false
	}
	return
}
// Initialise and create listeners for the keyboard controls
function initShipControls() {
	keys = {
		a: false,
		w: false,
		s: false,
		d: false,
		q: false,
		e: false,
		h: false,
		arrowup: false,
		arrowdown: false,
		arrowleft: false,
		arrowright: false,
		space: false,
	};

	document.body.addEventListener("keydown", function (e) {

		const key = e.code.replace("Key", "").toLowerCase()
		if (keys[key] !== undefined) keys[key] = true

	})

	document.body.addEventListener("keyup", function (e) {

		const key = e.code.replace("Key", "").toLowerCase()
		if (keys[key] !== undefined) keys[key] = false

	})
	

	document.addEventListener('mousemove', onDocumentMouseMove, false);

}

function onDocumentMouseMove(event) {
    event.preventDefault();
	mouse = new CANNON.Vec3();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

	pitchSpeed = mouse.y*1.1
	rollSpeed = -mouse.x*1.1

	var directionVector = new CANNON.Vec3(pitchSpeed, 0, rollSpeed)

	var directionVector = shipBody.quaternion.vmult(directionVector)

	shipBody.angularVelocity.set(directionVector.x, directionVector.y, directionVector.z)

	shipBody.linearDamping = 0.5
	shipBody.angularDamping = 0.9

}

// Randomizers that can be used for building Bufffer geometries

// random integer within range
function getRandomInt(min, max) {
	min = Math.ceil(min)
	max = Math.floor(max)
	return Math.floor(Math.random() * (max - min) + min) //The maximum is exclusive and the minimum is inclusive
}

// random float within range
// function getRandomArbitrary(min, max) {
// 	return Math.random() * (max - min) + min
// }
function createToken(

	innerRadius,
	outerRadius,
	innerDetail,
	outerDetail,
	innerColour,
	outerColour,
	innerOpacity,
	outerOpacity
) {

	//createToken creates a token consisting of 2 objects, one within the other.
	//Opacities may be set in order to alter the appearance as well as make the inner object visible
	var innerGeometry = new THREE.OctahedronBufferGeometry(innerRadius, innerDetail)

	// var innerMaterial = new THREE.MeshLambertMaterial({
	// 	color: innerColour,
	// 	transparent: true,
	// 	opacity: innerOpacity,
	// })
	var cubeRenderTarget = new THREE.WebGLCubeRenderTarget( 128, { format: THREE.RGBFormat, generateMipmaps: true, minFilter:THREE.LinearMipmapLinearFilter } );
	var cubeCam = new THREE.CubeCamera(.1, 1000, cubeRenderTarget);
	cubeCamera.push(cubeCam);

	var innerMaterial = new THREE.MeshPhongMaterial({
		emissive: 0xffffff,
		shininess: 100,
		color: 0xffffff,
		specular: 0xffffff,
		envMap: cubeRenderTarget.texture
	  });
	var innerCustom = new THREE.Mesh(innerGeometry, innerMaterial)
	innerCustom.add(cubeCam);

	var outerGeometry = new THREE.OctahedronBufferGeometry(
		outerRadius,
		outerDetail
	)
	var outerMaterial = new THREE.MeshLambertMaterial({
		color: outerColour,
		transparent: true,
		opacity: outerOpacity,
	})

	var outerCustom = new THREE.Mesh(outerGeometry, outerMaterial)

	outerCustom.add(innerCustom)
	innerCustomArray.push(innerCustom) // use separate array for innerCustom which will be global so that we can access them
	return outerCustom
}


// function AddMinutesToDate(date, minutes) {
// 	return new Date(date.getTime() + minutes * 60000);


// }

function time_remaining(endtime) {
	var t = Date.parse(endtime) - Date.parse(new Date());
	var seconds = Math.floor((t / 1000) % 60);
	var minutes = Math.floor((t / 1000 / 60) % 60);
	var hours = Math.floor((t / (1000 * 60 * 60)) % 24);
	var days = Math.floor(t / (1000 * 60 * 60 * 24));
	return { 'total': t, 'days': days, 'hours': hours, 'minutes': minutes, 'seconds': seconds };
}

function time_taken(startTime) {
	var t = Date.parse(new Date()) - Date.parse(startTime);
	var seconds = Math.floor((t / 1000) % 60);
	var minutes = Math.floor((t / 1000 / 60) % 60);
	var hours = Math.floor((t / (1000 * 60 * 60)) % 24);
	var days = Math.floor(t / (1000 * 60 * 60 * 24));
	return { 'total': t, 'days': days, 'hours': hours, 'minutes': minutes, 'seconds': seconds };
}
function time_since_pause(pauseTime){
	var t = Date.parse(new Date()) - Date.parse(pauseTime);
	return t;

}

function gameEnd() {
	if (tokenScore == maxScore) {
		level += 1
		timer.innerHTML = "<h1>Level Complete</h1>" + "<h2>Time Taken</h2>" + "<h2>Progress to level " + level + " </h2>" +
			+ '<div class ="timerSec">' + timeTaken[0] + " Minutes" + " " + timeTaken[1] + " Seconds" + '</div>';
		nextLevel()
	}
	else {
		timer.innerHTML = "<h1>Level failed</h1>" + "<h2>Time Taken</h2>"
			+ '<div class ="timerSec">' + timeTaken[0] + " Minutes" + " " + timeTaken[1] + " Seconds" + '</div>';


	}



}
function updateHealth(damage) {
	health = health - damage
	var healthBarWidth = (health / totalHealth) * 100;
	bar.css('width', healthBarWidth + '%');
}



export default Game
