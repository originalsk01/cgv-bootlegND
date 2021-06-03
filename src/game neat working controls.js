import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import Stats from  'three/examples/jsm/libs/stats.module.js'
import * as CANNON from 'cannon-es'

import { threeToCannon, ShapeType } from 'three-to-cannon'

// three.js global vars
let camera, scene, stats, renderer, clock
let sphereMesh, shipModel


// global asset paths
const shipPath = '/models/low_poly_spaceship_pack/models/GLTF/LPSP_SmallStarfigher.gltf'

// global colour variables
const black = 'rgb(0,0,0)'
const white = 'rgb(255,255,255)'
const red = 'rgb(255,0,0)'
const green = 'rgb(10,200,10)'
const blue = 'rgb(110,197,233)'

// cannon-es global variables
let world
let sphereBody, shipBody
const timeStep = 1 / 60 
let lastCallTime


// player control global variables
let keys

// followCam global variables
let followCam, followCamRig, followCamTarget
let lerpedShipPos = new THREE.Vector3
let followingDistance = 15
let rigToTargetDist = followingDistance
let shipVelocity = 0.0


class Game {

	async init() {


		////////// INITIALIZE THREE.JS SCENE AND CANNON-ES PHYSICS WORLD //////////////////


		// Scene
		scene = new THREE.Scene()
		//scene.background = new THREE.Color(0xa0a0a0)


		//Skybox
		const skyBoxLoader = new THREE.CubeTextureLoader()
		const skyBoxtexture = skyBoxLoader.load([
		  'textures/skybox/indigo_ft.jpg',
		  'textures/skybox/indigo_bk.jpg',
		  'textures/skybox/indigo_up.jpg',
		  'textures/skybox/indigo_dn.jpg',
		  'textures/skybox/indigo_rt.jpg',
		  'textures/skybox/indigo_lf.jpg',
		])
		// console.log(skyBoxtexture)
		scene.background = skyBoxtexture


		// Physics world
		world = new CANNON.World({
			gravity: new CANNON.Vec3(0, -9.82, 0), // m/s²
		})

		stats = new Stats()
		document.body.appendChild(stats.dom)

		
		// Normale camera
		camera = new THREE.PerspectiveCamera( 80, window.innerWidth / window.innerHeight, 1, 1000 )

		// Normal camera initial position and orientation
		camera.quaternion.setFromAxisAngle(new CANNON.Vec3(0,1,0), Math.PI)
		camera.position.set(0,10,10)


		// Renderer
		renderer = new THREE.WebGLRenderer( { antialias: true } );
		renderer.setClearColor(blue)
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setSize(window.innerWidth, window.innerHeight)
		//renderer.setSize(2*window.innerWidth/3, 2*window.innerHeight/3)
		window.addEventListener( 'resize', onWindowResize, false );
		document.body.appendChild(renderer.domElement)


		// Orbit Controls for normal camera (currently does nothing)
		const controls = new OrbitControls(camera, renderer.domElement)
		controls.update()
		
		// Axes Helper
		const axes = new THREE.AxesHelper(100)
		scene.add(axes)

		// X-Z plane Grid, we could use this for our world cooridinates in the XZ plane
		const gridSize = 500
		const gridDivisions = 50
		const gridHelper = new THREE.GridHelper( gridSize, gridDivisions )
		scene.add( gridHelper )

		// Size of one unit for world coordinates if Grid used as basis
		const gridSquareSize =gridSize/gridDivisions

		// Lights
		const ambientLight = new THREE.AmbientLight(0xffffff,0.6)
		scene.add(ambientLight)
	
		const dirLight = new THREE.DirectionalLight(0xffffff)
		dirLight.position.set(0, 200, 100)
		dirLight.castShadow = true
		dirLight.shadow.camera.top = 180
		dirLight.shadow.camera.bottom = -100
		dirLight.shadow.camera.left = -120
		dirLight.shadow.camera.right = 120
		scene.add(dirLight)


		// Create a static ground plane for the ground
		const groundBody = new CANNON.Body({
		type: CANNON.Body.STATIC, // can also be achieved by setting the mass to 0
		shape: new CANNON.Plane(),
		})
		groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0) // make it face up
		world.addBody(groundBody)


		// Add sphere model to three scene
		const radius = 5 // m
		const geometry = new THREE.SphereGeometry(radius,20,20)
		const material = new THREE.MeshLambertMaterial({ color: blue })
		sphereMesh = new THREE.Mesh(geometry, material)
		scene.add(sphereMesh)

		
		// Create sphere body in physics world
		sphereBody = new CANNON.Body({
			mass: 50, // kg
			//shape: new CANNON.Sphere(radius),
			shape: threeToCannon(sphereMesh, {type: ShapeType.SPHERE}).shape,
		})
		sphereBody.position.set(21, 50, 21)
		world.addBody(sphereBody)


		//////////////// MAKE, AND ADD, LEVEL PLATFORMS //////////////////////////

		// Function to create a platform of size legth by width in world units
		// out of tiles(box geometries) using a BufferGeometry to provide the necessary performance improveement
		// your machine would otherwise die if it tried to render this many grouped objects normally
		const createPlatform =(length,width,tileColorMap)=>{
			
			const tiles = []

			const tileGeometry = new THREE.BoxGeometry(1,0.25, 1)
			
			//const tileColorMap = new THREE.TextureLoader().load('./textures/temp_floor.png')
			const tileMaterial = new THREE.MeshPhongMaterial({ map: tileColorMap })
			
			const midpointOffset=0.5

			
			for(let x=0;x<length;x++){
				const xpos=x+midpointOffset
				for(let z=0;z<width;z++){
					const zpos=z+midpointOffset
					// instead of creating a new geometry, we just clone the bufferGeometry instance
					const newTile = tileGeometry.clone()
					const y =  0 //getRandomInt(0,5)
					newTile.applyMatrix4( new THREE.Matrix4().makeTranslation(xpos,y,zpos) )
					// then, we push this bufferGeometry instance in our array
					tiles.push(newTile)
				}
			
			}

			// merge into single super buffer geometry;
			const geometriesTiles = BufferGeometryUtils.mergeBufferGeometries(tiles)
			// centre super geometry at local origin
			geometriesTiles.applyMatrix4( new THREE.Matrix4().makeTranslation(-length/2,0,-width/2 ) );
			geometriesTiles.applyMatrix4( new THREE.Matrix4().makeScale(gridSquareSize,gridSquareSize,gridSquareSize) );


			// create one mega big platform mesh from super geometry 
			const platform = new THREE.Mesh(geometriesTiles, tileMaterial);

			// place lower left corner of platform mesh  at X-Z (0,0)
			platform.translateX(gridSquareSize*length/2)
			platform.translateZ(gridSquareSize*width/2)
		
			return platform
		}


		// Function to set platform postition in gameboard coordinates in world
		const placePlatform=(platform,x,y,z)=>{
			
			// translate platform in world coordinates
			x=x*gridSquareSize
			y=y*gridSquareSize*0.25
			z=z*gridSquareSize
			platform.applyMatrix4( new THREE.Matrix4().makeTranslation(x,y,z));

			
			// create cannon body for platform
			const platformBody = new CANNON.Body({
				type: CANNON.Body.STATIC,
				shape: threeToCannon(platform, {type: ShapeType.BOX}).shape,
			})
			const platformPos = new THREE.Vector3()
			platform.getWorldPosition(platformPos)
			platformBody.position.set(platformPos.x, platformPos.y, platformPos.z)

			return {
				threePlatform: platform,
				cannonPlatform: platformBody
			}
		}

		// Function to add multiple platforms into a gameboard
		// allow different textures/colours for different sections
		const createGameBoard=()=>{

			const board = new THREE.Group()
			const platformGeometries = []
			const platformBodies = []
			let newPlatform
			let colorMap

			colorMap = new THREE.TextureLoader().load('./textures/blue_floor.png')
			newPlatform = placePlatform(createPlatform(2,2,colorMap),0,5,0)
			platformGeometries.push(newPlatform.threePlatform)
			platformBodies.push(newPlatform.cannonPlatform)


			colorMap = new THREE.TextureLoader().load('./textures/blue_floor.png')
			newPlatform = placePlatform(createPlatform(5,5,colorMap),3,0,3)
			platformGeometries.push(newPlatform.threePlatform)
			platformBodies.push(newPlatform.cannonPlatform)


			for (let i=0;i<platformGeometries.length;i++){
				board.add(platformGeometries[i])
				world.addBody(platformBodies[i])
			}

			return board
    	}

		// Add gameboard to world
		const gameboard = createGameBoard()
		scene.add(gameboard)
		

		//////////////// ADD PLAYER SHIP //////////////////////////


		shipModel = new THREE.Object3D
		shipModel = await loadModel(shipPath)
		//console.log(shipModel)
		
		// Rotate children of ship model to correct their orientation
		shipModel.children[0].quaternion.setFromAxisAngle(new THREE.Vector3(0,1,0), Math.PI);
		shipModel.children[1].quaternion.setFromAxisAngle(new THREE.Vector3(0,1,0), Math.PI);
		
		shipModel.applyMatrix4( new THREE.Matrix4().makeScale(1.9,1.9,1.9) );
		shipModel.applyMatrix4( new THREE.Matrix4().makeTranslation(-5,0,-5) );


		// create cannon body for ship
		shipBody = new CANNON.Body({
			mass: 10,
			shape: threeToCannon(shipModel).shape,
		})
		shipBody.position.set(25, 5, 25)
		shipBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0,1,0), Math.PI);
		world.addBody(shipBody)
		//console.log(shipBody)
		
		// Initialze followCam (height of camera above the ship, following distance behind ship)
		initFollowCam(10,15)

		// Place the target of the followCam on the ship model & place the followCam itself in a rig above the ship
		shipModel.add( followCamTarget )
    	followCamRig.add( followCam )
		scene.add(shipModel)

		// Initialize ship keyboard control
		initShipControls()
		
		clock = new THREE.Clock()

		animate()

	}
}


function followShip(){
    
    let shipSpeed = 0.0;
    let camRigPos = new THREE.Vector3;
    let camWorldPos = new THREE.Vector3;
    let shipToRigDir = new THREE.Vector3;

    if ( keys.w )
        shipSpeed = 0.25;
    else if ( keys.s )
        shipSpeed = -0.25;

    shipVelocity += ( shipSpeed - shipVelocity ) * .1;
    shipModel.translateZ( shipVelocity );
	//shipBody.position.x+=shipVelocity
	//shipBody.applyImpulse(new CANNON.Vec3(0,0,shipVelocity))
    if ( keys.a )
        shipModel.rotateY(0.05);
		//shipBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0,1,0), 0.05);
    else if ( keys.d )
        shipModel.rotateY(-0.05);
		//shipBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0,1,0), -0.05);

	//shipModel.position.copy(shipBody.position)
	//shipModel.quaternion.copy(shipBody.quaternion)
	
	lerpedShipPos.lerp(shipModel.position, 0.4);
	//lerpedShipPos.lerp(shipBody.position, 0.4);
    
    camRigPos.copy(followCamRig.position);

    camWorldPos.setFromMatrixPosition(followCam.matrixWorld);
  
    shipToRigDir.copy( lerpedShipPos ).sub( camRigPos ).normalize();
  
    rigToTargetDist += ( followingDistance - rigToTargetDist ) * 0.2;
  
    let camToRigDist = lerpedShipPos.distanceTo( camRigPos ) - rigToTargetDist
  
    followCamRig.position.addScaledVector( shipToRigDir, camToRigDist );
    camWorldPos.setFromMatrixPosition(followCamTarget.matrixWorld);
    followCamRig.position.lerp(camWorldPos, 0.02);

}


function animate() {
	
	//request render scene at every frame
	requestAnimationFrame(animate) 
	
	// update followCam
	followShip()

	// take timestep in physics simulation
	stepPhysicsWorld()
	
	// update three.js meshes according to cannon-es simulations
	updatePhysicsBodies()

	
	// models animations
	const delta = clock.getDelta()
	// if (dancerMixer) dancerMixer.update(delta)
	// if (snakeMixer) snakeMixer.update(delta)
  
	//// render three.js
	//renderer.clear()
	//renderer.render(scene, camera)
	followCam.lookAt( shipModel.position );
	renderer.render(scene, followCam)
	stats.update()
}

// Update projection when viewing window is resized
function onWindowResize() {

	followCam.aspect = window.innerWidth / window.innerHeight;
	followCam.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );

}

// Make time step in physics simulation
function stepPhysicsWorld(){
	
	const time = performance.now() / 1000
	if (!lastCallTime) {
		world.step(timeStep)
	} else {
		const dt = time - lastCallTime
		world.step(timeStep, dt)
	}
	lastCallTime = time	
}

// Update the positions and orientations of the dynamic three.js objects according to the current
// physics properties of their corresponding bodies in the physics sim
function updatePhysicsBodies(){
	// three.js model positions updates using cannon-es simulation
	sphereMesh.position.copy(sphereBody.position)
	sphereMesh.quaternion.copy(sphereBody.quaternion)

	//shipModel.position.copy(shipBody.position)
	//shipModel.quaternion.copy(shipBody.quaternion)
}

// load up gltf model asynchronously
async function loadModel(path){
	const loader = new GLTFLoader()	

	const model = await loader.loadAsync(path)

	return model.scene.children[0]
}

// Initialize the variables for the followCam
function initFollowCam(camHeight, newFollowingDistance){
    followingDistance = newFollowingDistance
    
    followCam = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 1000 );
    followCam.position.set( 0, camHeight, 0 );
    followCam.lookAt( scene.position );

    followCamRig = new THREE.Object3D;
    followCamTarget = new THREE.Object3D;
    followCamTarget.position.z = -followingDistance;
}

// Initialise and create listeners for the keyboard controls
function initShipControls(){
    
    keys = {
        a: false,
        s: false,
        d: false,
        w: false
    };

    document.body.addEventListener( 'keydown', function(e) {
    
        const key = e.code.replace('Key', '').toLowerCase();
        if ( keys[ key ] !== undefined )
            keys[ key ] = true;
        
    });

    document.body.addEventListener( 'keyup', function(e) {
        
        const key = e.code.replace('Key', '').toLowerCase();
        if ( keys[ key ] !== undefined )
            keys[ key ] = false;
        
    });
}




// Randomizers that can be used for building Bufffer geometries

// random integer within range
function getRandomInt(min, max){
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

// random float within range
function getRandomArbitrary(min, max){
    return Math.random() * (max - min) + min;
}


export default Game;
