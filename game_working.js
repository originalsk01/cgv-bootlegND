import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import * as CANNON from 'cannon-es';

// three.js global vars
let camera, scene, renderer, clock, snakeMixer, dancerMixer
let sphereMesh, snakeModel, dancerModel

// cannon-es global vars
let world
let sphereBody
const timeStep = 1 / 60 
let lastCallTime


// gameplay vars
const jumpheight=10

// other globals 
const black = 'rgb(0,0,0)'
const white = 'rgb(255,255,255)'
const red = 'rgb(255,0,0)'
const green = 'rgb(10,200,10)'
const blue = 'rgb(110,197,233)'


class Game {

	init() {

		// Scene
		scene = new THREE.Scene()
		scene.background = new THREE.Color(0xa0a0a0)

		// Physics world
		world = new CANNON.World({
			gravity: new CANNON.Vec3(0, -9.82, 0), // m/s²
		})

		
		// Camera
		camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 1000 )
		camera.position.z = 400
	
		// Initial camera position
		camera.position.set(50, 50, 50)


		// Renderer
		renderer = new THREE.WebGLRenderer( { antialias: true } );
		renderer.setClearColor(blue)
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setSize(window.innerWidth, window.innerHeight)
		window.addEventListener( 'resize', onWindowResize, false );
		document.body.appendChild(renderer.domElement)


		// Orbit Controls
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
	
		// const directionalLight = new THREE.DirectionalLight(0xffffff, 0.1)
		// directionalLight.position.set(0, 10, 10)
		// scene.add(directionalLight)
	
		// spotlight
		// var spotlight = new THREE.SpotLight(0xffffff)
		// spotlight.position.set(-40, 60, 40)
		// scene.add(spotlight)
	
		// //More lights
		// const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444)
		// hemiLight.position.set(0, 200, 0)
		// scene.add(hemiLight)
	
		const dirLight = new THREE.DirectionalLight(0xffffff)
		dirLight.position.set(0, 200, 100)
		dirLight.castShadow = true
		dirLight.shadow.camera.top = 180
		dirLight.shadow.camera.bottom = -100
		dirLight.shadow.camera.left = -120
		dirLight.shadow.camera.right = 120
		scene.add(dirLight)

		
		// game board
		// const  createBoard=()=>{
	
		// 	const board = new Group();
		
		// 	const quadrantGeometry = new BoxGeometry(250, 2, 250)
		// 	const boardMaterial = new MeshLambertMaterial({ color: black })
		
		// 	const quaudrant1 = new Mesh(quadrantGeometry, boardMaterial)
		// 	quaudrant1.position.set(125,-1,125)
		// 	const quaudrant2 = new Mesh(quadrantGeometry, boardMaterial)
		// 	quaudrant2.position.set(-125,-1,125)
		// 	const quaudrant3 = new Mesh(quadrantGeometry, boardMaterial)
		// 	quaudrant3.position.set(125,-1,-125)
		// 	const quaudrant4 = new Mesh(quadrantGeometry, boardMaterial)
		// 	quaudrant4.position.set(-125,-1,-125)
			
		// 	board.add(quaudrant1)
		// 	board.add(quaudrant2)
		// 	board.add(quaudrant3)
		// 	board.add(quaudrant4)
		
		// 	return board
		
		// }
		// scene.add(createBoard())

		// Create a static ground plane for the ground
		const groundBody = new CANNON.Body({
		type: CANNON.Body.STATIC, // can also be achieved by setting the mass to 0
		shape: new CANNON.Plane(),
		})
		groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0) // make it face up
		world.addBody(groundBody)


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
					const y = 0 //getRandomArbitrary(-0.1,0.1)
					newTile.applyMatrix( new THREE.Matrix4().makeTranslation(xpos,y,zpos) )
					// then, we push this bufferGeometry instance in our array
					tiles.push(newTile)
				}
			
			}


			const geometriesTiles = BufferGeometryUtils.mergeBufferGeometries(tiles)

			// now we got 1 mega big mesh 

			const platform = new THREE.Mesh(geometriesTiles, tileMaterial);

			//platform.rotateX(Math.PI/4)
			platform.scale.set(gridSquareSize,gridSquareSize,gridSquareSize)
			platform.position.set(gridSquareSize*(Math.floor(length/2)),0,gridSquareSize*(Math.floor(width/2)))
			platform.translateX(-gridSquareSize*length/2)
			platform.translateZ(-gridSquareSize*width/2)
		
			return platform

		}


		// Function to set platform postition in gameboard coordinates in world
		const placePlatform=(platform,x,y,z)=>{
			x=x*gridSquareSize
			y=y*gridSquareSize*0.25
			z=z*gridSquareSize

			platform.position.set(x,y,z)

			return platform
		}

		// Function to add multiple platforms into a gameboard
		// allow different textures/colours for different sections
		const createGameBoard=()=>{
        
			const board = new THREE.Group()

			const centerColorMap = new THREE.TextureLoader().load('./textures/blue_floor.png')

			const plat0 = placePlatform(createPlatform(10,10,centerColorMap),-5,0,-5)

			const corridorColorMap = new THREE.TextureLoader().load('./textures/yellow_floor.png')

			const plat1 = placePlatform(createPlatform(20,10,corridorColorMap),5,2,-5)
			const plat2 = placePlatform(createPlatform(20,10,corridorColorMap),-25,2,-5)
			const plat3 = placePlatform(createPlatform(10,20,corridorColorMap),-5,2,-25)
			const plat4 = placePlatform(createPlatform(10,20,corridorColorMap),-5,2,5)

			const quadrantColorMap = new THREE.TextureLoader().load('./textures/pink_floor.png')

			const plat5 = placePlatform(createPlatform(20,20,quadrantColorMap),5,0,5)
			const plat6 = placePlatform(createPlatform(20,20,quadrantColorMap),-25,0,5)
			const plat7 = placePlatform(createPlatform(20,20,quadrantColorMap),5,0,-25)
			const plat8 = placePlatform(createPlatform(20,20,quadrantColorMap),-25,0,-25)


			board.add(plat0)

			board.add(plat1)
			board.add(plat2)
			board.add(plat3)
			board.add(plat4)

			board.add(plat5)
			board.add(plat6)
			board.add(plat7)
			board.add(plat8)

			return board
    	}

		// Add gameboard to world
		const gameboard = createGameBoard()
		scene.add(gameboard)


		// Add animated dancer model
		// const dancerLoader = new FBXLoader()
		// dancerLoader.load('models/dancing_queen/Samba Dancing.fbx', (fbx) => {
		//   dancerMixer = new AnimationMixer(fbx)
		//   fbx.scale.set(.15,.15,.15);
		//   fbx.position.set(25,0,0);
		//   const action = dancerMixer.clipAction(fbx.animations[0])
		//   action.play()

		//   fbx.traverse(function (child) {
		//     if (child.isMesh) {
		//       child.castShadow = true
		//       child.receiveShadow = true
		//     }
		//   })

		//   scene.add(fbx)
		// })


		// Add animated snake
		const snakeLoader = new GLTFLoader()
		snakeLoader.load('models/snake/snake/scene.gltf', function (gltf) {
			snakeModel = gltf.scene
			snakeMixer = new THREE.AnimationMixer(snakeModel.children[0]);
			//snakeobj.position.setY(5)
			gltf.animations.forEach((clip) => { snakeMixer.clipAction(clip).play(); });
			scene.add(snakeModel)
		})

		
		//cube
		const cubeGeometry = new THREE.BoxGeometry(6, 6, 6)
		const cubeMaterial = new THREE.MeshLambertMaterial({ color: blue })
		const cube = new THREE.Mesh(cubeGeometry, cubeMaterial)
		cube.position.x = -10
		cube.position.y = 3
		scene.add(cube)


		// Add sphere model to three scene
		const radius = 5 // m
		const geometry = new THREE.SphereGeometry(radius,20,20)
		const material = new THREE.MeshLambertMaterial({ color: blue })
		sphereMesh = new THREE.Mesh(geometry, material)
		scene.add(sphereMesh)

		// Create sphere body in physics world
		sphereBody = new CANNON.Body({
			mass: 20, // kg
			shape: new CANNON.Sphere(radius),
		})
		sphereBody.position.set(0, 1000, 0) // m
		world.addBody(sphereBody)

		


		document.body.addEventListener('keydown', keyPressed);

		function keyPressed(e){
			switch(e.key) {
			case 'ArrowUp':
				snakeobj.position.z+=1;
				break;
			case 'ArrowDown':
				snakeobj.position.z+=-1;
				break;
			case 'ArrowLeft':
				snakeobj.position.x+=1;
				break;
			case 'ArrowRight':
				snakeobj.position.x+=-1;
				break;
			}
			e.preventDefault();

		}
		
		clock = new THREE.Clock()
		
		//initCannon()
		
		animate()


	}

	

	

}

// function initCannon(){
// 	world = new CANNON.World({
// 		gravity: new CANNON.Vec3(0, -9.82, 0), // m/s²
// 	})

// 	// Create a sphere body
// 	const radius = 5 // m
// 	sphereBody = new CANNON.Body({
// 		mass: 20, // kg
// 		shape: new CANNON.Sphere(radius),
// 	})
// 	sphereBody.position.set(0, 1000, 0) // m
// 	world.addBody(sphereBody)

// 	// Create a static plane for the ground
// 	const groundBody = new CANNON.Body({
// 	type: CANNON.Body.STATIC, // can also be achieved by setting the mass to 0
// 	shape: new CANNON.Plane(),
// 	})
// 	groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0) // make it face up
// 	world.addBody(groundBody)
// }



function animate() {
	
	// cannon-es world stepping
	updatePhysics()
	

	// three.js model positions updates using cannon-es simulation
	sphereMesh.position.copy(sphereBody.position)
	sphereMesh.quaternion.copy(sphereBody.quaternion)
	
	// models animations
	const delta = clock.getDelta()
	if (dancerMixer) dancerMixer.update(delta)
	if (snakeMixer) snakeMixer.update(delta)
  
	// render three.js

	renderer.clear()
	requestAnimationFrame(animate) //request render scene at every frame
	renderer.render(scene, camera)
}


function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );

}


function updatePhysics(){
	
	const time = performance.now() / 1000
	if (!lastCallTime) {
		world.step(timeStep)
	} else {
		const dt = time - lastCallTime
		world.step(timeStep, dt)
	}
	lastCallTime = time	
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
