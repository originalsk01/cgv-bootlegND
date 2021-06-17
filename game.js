import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import Stats from  'three/examples/jsm/libs/stats.module.js'
import * as CANNON from 'cannon-es'

import { threeToCannon, ShapeType } from 'three-to-cannon'

// three.js global vars
let camera, scene, stats, renderer, clock, controls
let shipModel


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
let shipBody
const timeStep = 1.0 / 60.0 
let lastCallTime

// player control global variables
let keys

// flight camera a& controls global variables
let flightCamera
let acceleration = 0 
let pitchSpeed = 0
let rollSpeed = 0
let yawSpeed = 0
let accelerationImpulse


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
			// gravity: new CANNON.Vec3(0, -9.81, 0), // m/s²
		})
		//world.gravity.set(0, -20, 0)
		world.gravity.set(0, 0, 0)
		world.broadphase = new CANNON.NaiveBroadphase(); // Detect coilliding objects
		world.solver.iterations = 5; // collision detection sampling rate


		stats = new Stats()
		document.body.appendChild(stats.dom)

		
		// Normale camera
		//camera = new THREE.PerspectiveCamera( 80, window.innerWidth / window.innerHeight, 1, 1000 )

		// Normal camera initial position and orientation
		//camera.quaternion.setFromAxisAngle(new CANNON.Vec3(0,1,0), Math.PI)
		//camera.position.set(0,10,10)
		

		// Initialise flight camera
		const fcFielOfView = 75;
		const fcNear = 0.1;
		const fcFar = 1000;
		flightCamera = new THREE.PerspectiveCamera( fcFielOfView, window.innerWidth / window.innerHeight, fcNear, fcFar );


		// Renderer
		renderer = new THREE.WebGLRenderer( { antialias: true } );
		renderer.setClearColor(blue)
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setSize(window.innerWidth, window.innerHeight)
		//renderer.setSize(2*window.innerWidth/3, 2*window.innerHeight/3)
		window.addEventListener( 'resize', onWindowResize, false );
		document.body.appendChild(renderer.domElement)


		//var pmremGenerator = new THREE.PMREMGenerator( renderer);
		//pmremGenerator.fromScene

		// Orbit Controls for normal camera (currently does nothing)
		//const controls = new OrbitControls(camera, renderer.domElement)
		//controls.update()
		
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

		
		// Materials
		const groundMaterial = new CANNON.Material("groundMaterial");

		// Adjust constraint equation parameters for ground/ground contact
		const ground_ground_cm = new CANNON.ContactMaterial(groundMaterial, groundMaterial, {
			friction: 0.4,
			restitution: 0.3,
			contactEquationStiffness: 1e8,
			contactEquationRelaxation: 3,
			frictionEquationStiffness: 1e8,
			frictionEquationRegularizationTime: 3,
		});

		// Add contact material to the world
		world.addContactMaterial(ground_ground_cm);

		// Create a slippery material (friction coefficient = 0.0)
        const slipperyMaterial = new CANNON.Material("slipperyMaterial");

        // The ContactMaterial defines what happens when two materials meet.
        // In this case we want friction coefficient = 0.0 when the slippery material touches ground.
        const slippery_ground_cm = new CANNON.ContactMaterial(groundMaterial, slipperyMaterial, {
            friction: 0.0,
            restitution: 0.3,
            contactEquationStiffness: 1e8,
            contactEquationRelaxation: 3
        });

        // We must add the contact materials to the world
        world.addContactMaterial(slippery_ground_cm);

		// Create a static ground plane for the ground
		const groundBody = new CANNON.Body({
			type: CANNON.Body.STATIC, // can also be achieved by setting the mass to 0
			shape: new CANNON.Plane(),
			//material: groundMaterial ,
		})
		groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0) // make it face up
		world.addBody(groundBody)


		//////////////// MAKE, AND ADD, LEVEL PLATFORMS //////////////////////////

		// Function to create a platform of size legth by width in world units
		// out of tiles(box geometries) using a BufferGeometry to provide the necessary performance improveement
		// your machine would otherwise die if it tried to render this many grouped objects normally
		const createPlatform =(length,width,height,tileColorMap)=>{
			
			const tiles = []

			const tileGeometry = new THREE.BoxGeometry(1,1, 1)
			
			const tileEmissiveMap = new THREE.TextureLoader().load('./textures/Sci-fi_Floor_001_emission.jpg')
			const tileMaterial = new THREE.MeshPhongMaterial({ 
				map: tileColorMap,
				emissiveMap: tileEmissiveMap,
				emissive: "#ffffff"
			})
		
			
			const midpointOffset=0.5

			
			for(let y=0;y<height;y++){
				const ypos=y+midpointOffset
				for(let x=0;x<length;x++){
					const xpos=x+midpointOffset
					for(let z=0;z<width;z++){
						const zpos=z+midpointOffset
						// instead of creating a new geometry, we just clone the bufferGeometry instance
						const newTile = tileGeometry.clone()
						//const y =  0 //getRandomInt(0,5)
						newTile.applyMatrix4( new THREE.Matrix4().makeTranslation(xpos,ypos,zpos) )
						// then, we push this bufferGeometry instance in our array
						tiles.push(newTile)
					}
				
				}
			}

			// merge into single super buffer geometry;
			const geometriesTiles = BufferGeometryUtils.mergeBufferGeometries(tiles)
			// centre super geometry at local origin
			//geometriesTiles.applyMatrix4( new THREE.Matrix4().makeTranslation(-length/2,0,-width/2 ) );
			geometriesTiles.applyMatrix4( new THREE.Matrix4().makeTranslation(-length/2,-height/2,-width/2 ) );
			geometriesTiles.applyMatrix4( new THREE.Matrix4().makeScale(gridSquareSize,gridSquareSize,gridSquareSize) );


			// create one mega big platform mesh from super geometry 
			const platform = new THREE.Mesh(geometriesTiles, tileMaterial);

			// place lower left corner of platform mesh  at X-Z (0,0)
			platform.translateX(gridSquareSize*length/2)
			platform.translateZ(gridSquareSize*width/2)
			platform.translateY(gridSquareSize*height/2)
			return platform
		}


		// Function to set platform postition in gameboard coordinates in world
		const placePlatform=(platform,x,y,z)=>{
			
			// translate platform in world coordinates
			x=x*gridSquareSize
			y=y*gridSquareSize
			z=z*gridSquareSize
			platform.applyMatrix4( new THREE.Matrix4().makeTranslation(x,y,z));




			// create cannon body for platform
			const platformBody = new CANNON.Body({
				type: CANNON.Body.STATIC,
				material: groundMaterial ,
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
			newPlatform = placePlatform(createPlatform(2,2,1,colorMap),-5,5,0)
			platformGeometries.push(newPlatform.threePlatform)
			platformBodies.push(newPlatform.cannonPlatform)


			colorMap = new THREE.TextureLoader().load('./textures/blue_floor.png')
			newPlatform = placePlatform(createPlatform(2,5,1,colorMap),-15,2,-15)
			platformGeometries.push(newPlatform.threePlatform)
			platformBodies.push(newPlatform.cannonPlatform)

			colorMap = new THREE.TextureLoader().load('./textures/blue_floor.png')
			newPlatform = placePlatform(createPlatform(2,1,2,colorMap),2,2,2)
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
		//shipModel.children[0].quaternion.setFromAxisAngle(new THREE.Vector3(0,1,0), Math.PI);
		//shipModel.children[1].quaternion.setFromAxisAngle(new THREE.Vector3(0,1,0), Math.PI);
		
		shipModel.applyMatrix4( new THREE.Matrix4().makeScale(1.9,1.9,1.9) );
		shipModel.applyMatrix4( new THREE.Matrix4().makeTranslation(-5,0,-5) );

		scene.add(shipModel)
		shipModel.add(flightCamera)
		flightCamera.position.set(0,4,7.5)

		// create cannon body for ship
		shipBody = new CANNON.Body({
			mass: 1,
			material: slipperyMaterial,
			//angularFactor: new CANNON.Vec3(0,1,0),
			shape: threeToCannon(shipModel).shape,
			//linearDamping: 0.5,
			//angularDamping: 0.9,
		})
		shipBody.position.set(0, 3, 0)
		shipBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0,1,0), Math.PI);
		world.addBody(shipBody)
		//console.log(shipBody)

		// Initialize ship keyboard control
		initShipControls()
		
		clock = new THREE.Clock()

		animate()

	}
}


function fly(){

	if (keys.arrowup){acceleration = -1}
	if (keys.arrowdown){acceleration = 1}
	if (keys.arrowup||keys.arrowdown){
		let accelerationImpulseDirection = new CANNON.Vec3(0,0,acceleration)
		accelerationImpulse = shipBody.quaternion.vmult( accelerationImpulseDirection )
		shipBody.applyImpulse ( accelerationImpulse)	
	
	}

	if( keys.w || keys.a || keys.s || keys.d || keys.arrowleft || keys.arrowright ){
		if (keys.w) { pitchSpeed = -0.5 }	else if (keys.s) { pitchSpeed = 0.5 } else { pitchSpeed = 0 }
		if (keys.a) { rollSpeed = 1 } else if (keys.d){ rollSpeed = -1 } else { rollSpeed = 0 }
		if (keys.arrowleft) { yawSpeed = 1 } else if (keys.arrowright){ yawSpeed = -1 } else { yawSpeed = 0 }

		// if (keys.w) { pitchSpeed = -0.5 }	else if (keys.s) { pitchSpeed = 0.5 } else { pitchSpeed = 0 }
		// if (keys.arrowleft) { rollSpeed = 1 } else if (keys.arrowright){ rollSpeed = -1 } else { rollSpeed = 0 }
		// if (keys.a) { yawSpeed = 1 } else if (keys.d){ yawSpeed = -1 } else { yawSpeed = 0 }

		var directionVector = new CANNON.Vec3(pitchSpeed, yawSpeed, rollSpeed)
		var directionVector = shipBody.quaternion.vmult( directionVector )

		shipBody.angularVelocity.set(
			directionVector.x,
			directionVector.y,
			directionVector.z
		)
	}

	shipBody.linearDamping = 0.5
	shipBody.angularDamping = 0.9
}


 function animate() {
	
	//request render scene at every frame
	requestAnimationFrame(animate) 

	// take timestep in physics simulation
	stepPhysicsWorld()

	// // update three.js meshes according to cannon-es simulations
	updatePhysicsBodies()

	// update flight camera
	fly()
	// let fp= new CANNON.Vec3(0,0,-3);
	// flightCamera.position.lerp(fp,0.01)
	
	// models animations
	const delta = clock.getDelta()
	// if (dancerMixer) dancerMixer.update(delta)
	// if (snakeMixer) snakeMixer.update(delta)
  
	stats.update()
	//// render three.js
	//renderer.clear()
	//renderer.render(scene, camera)
	//controls.update()
	renderer.render(scene, flightCamera)
}

// Update projection when viewing window is resized
function onWindowResize() {

	flightCamera.aspect = window.innerWidth / window.innerHeight
	flightCamera.updateProjectionMatrix()

	renderer.setSize( window.innerWidth, window.innerHeight )

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

	shipModel.position.copy(shipBody.position)
	shipModel.quaternion.copy(shipBody.quaternion)

}

// load up gltf model asynchronously
async function loadModel(path){
	const loader = new GLTFLoader()	

	const model = await loader.loadAsync(path)

	return model.scene.children[0]
}


// Initialise and create listeners for the keyboard controls
function initShipControls(){
    
    keys = {
        a: false,
        w: false,
        s: false,
        d: false,
		q: false,
		e: false,
		arrowup :false,
		arrowdown:false,
		arrowleft: false,
		arrowright: false
    };


    document.body.addEventListener( 'keydown', function(e) {
    
        const key = e.code.replace('Key', '').toLowerCase()
        if ( keys[ key ] !== undefined )
            keys[ key ] = true
        
    })

    document.body.addEventListener( 'keyup', function(e) {
        
        const key = e.code.replace('Key', '').toLowerCase()
        if ( keys[ key ] !== undefined )
            keys[ key ] = false
        
    })

}

// Randomizers that can be used for building Bufffer geometries

// random integer within range
function getRandomInt(min, max){
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min) + min) //The maximum is exclusive and the minimum is inclusive
}

// random float within range
function getRandomArbitrary(min, max){
    return Math.random() * (max - min) + min
}


export default Game
