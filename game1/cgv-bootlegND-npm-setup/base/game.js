import {
	BoxBufferGeometry,
	Mesh,
	MeshBasicMaterial,
	PerspectiveCamera,
	Scene,
	WebGLRenderer,
	GridHelper,
	BoxGeometry,
	MeshLambertMaterial,
	Group,
	AnimationMixer,
	AxesHelper,
	SpotLight,
	DirectionalLight,
	HemisphereLight,
	Clock,

} from 'three';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

let camera, scene, renderer, clock,mixer, mixer2;

class Game {

	init() {

		camera = new PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 1000 );
		camera.position.z = 400;

		scene = new Scene();

		//Grid
		const size = 500
		const divisions = 100
		const gridHelper = new GridHelper( size, divisions )
		scene.add( gridHelper )

		var blue = 'rgb(110,197,233)'
		
		// game board
		function createBoard(){
	
			const board = new Group();
		
			const quadrantGeometry = new BoxGeometry(250, 2, 250)
			const boardMaterial = new MeshLambertMaterial({ color: blue })
		
			const quaudrant1 = new Mesh(quadrantGeometry, boardMaterial)
			quaudrant1.position.set(125,-1,125)
			const quaudrant2 = new Mesh(quadrantGeometry, boardMaterial)
			quaudrant2.position.set(-125,-1,125)
			const quaudrant3 = new Mesh(quadrantGeometry, boardMaterial)
			quaudrant3.position.set(125,-1,-125)
			const quaudrant4 = new Mesh(quadrantGeometry, boardMaterial)
			quaudrant4.position.set(-125,-1,-125)
			
			board.add(quaudrant1)
			board.add(quaudrant2)
			board.add(quaudrant3)
			board.add(quaudrant4)
		
			return board
		
		}
		scene.add(createBoard())


		//Animated model
		const loader = new FBXLoader()

		loader.load('models/dancing_queen/Samba Dancing.fbx', (fbx) => {
		  mixer = new AnimationMixer(fbx)
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

		var snakeobj
		var newLoader = new GLTFLoader()
		newLoader.load('models/snake/snake/scene.gltf', function (gltf) {
			snakeobj=gltf.scene;
			mixer2= new AnimationMixer(snakeobj.children[0]);
			gltf.animations.forEach((clip) => {mixer2.clipAction(clip).play(); });
			scene.add(snakeobj)
		})

		



		// const geometry = new BoxBufferGeometry( 200, 200, 200 );
		// const material = new MeshBasicMaterial();

		// const mesh = new Mesh( geometry, material );
		// scene.add( mesh );

		renderer = new WebGLRenderer( { antialias: true } );
		renderer.setClearColor(blue)
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setSize( window.innerWidth, window.innerHeight );
		document.body.appendChild( renderer.domElement );

		const controls = new OrbitControls( camera, renderer.domElement );
		
		
		var axes = new AxesHelper(30)
		scene.add(axes)

		//cube
		var cubeGeometry = new BoxGeometry(6, 6, 6)
		var cubeMaterial = new MeshLambertMaterial({ color: blue })
		var cube = new Mesh(cubeGeometry, cubeMaterial)
		cube.position.x = -10
		cube.position.y = 3
		scene.add(cube)


		//spotlight
		var spotlight = new SpotLight(0xffffff)
		spotlight.position.set(-40, 60, 40)
		scene.add(spotlight)

		//
		const directionalLight = new DirectionalLight(0xffffff, 0.1)
		directionalLight.position.set(0, 10, 10)
		scene.add(directionalLight)

		//More lights
		const hemiLight = new HemisphereLight(0xffffff, 0x444444)
		hemiLight.position.set(0, 200, 0)
		scene.add(hemiLight)

		const dirLight = new DirectionalLight(0xffffff)
		dirLight.position.set(0, 200, 100)
		dirLight.castShadow = true
		dirLight.shadow.camera.top = 180
		dirLight.shadow.camera.bottom = -100
		dirLight.shadow.camera.left = -120
		dirLight.shadow.camera.right = 120
		scene.add(dirLight)
		
		window.addEventListener( 'resize', onWindowResize, false );
		
		clock = new Clock()

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

		renderScene()


	}

}

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );

}

function renderScene() {
	//Model
	const delta = clock.getDelta()
	if (mixer) mixer.update(delta)
	if (mixer2) mixer2.update(delta)
	renderer.clear()
  
	requestAnimationFrame(renderScene) //request render scene at every frame
	renderer.render(scene, camera)
  }



export default Game;
