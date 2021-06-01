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

} from 'three';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';


let camera, scene, renderer;

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
		let mixer
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
		var mixer2
		newLoader.load('models/snake/snake/scene.gltf', function (gltf) {
			snakeobj=gltf.scene;
		mixer2= new AnimationMixer(gltf.scene.children[0]);
		gltf.animations.forEach((clip) => {mixer2.clipAction(clip).play(); });
		scene.add(gltf.scene)
		})



		// const geometry = new BoxBufferGeometry( 200, 200, 200 );
		// const material = new MeshBasicMaterial();

		// const mesh = new Mesh( geometry, material );
		// scene.add( mesh );

		renderer = new WebGLRenderer( { antialias: true } );
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setSize( window.innerWidth, window.innerHeight );
		document.body.appendChild( renderer.domElement );

		window.addEventListener( 'resize', onWindowResize, false );

		const controls = new OrbitControls( camera, renderer.domElement );

		animate();

	}

}

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

	requestAnimationFrame( animate );
	renderer.render( scene, camera );

}

export default Game;
