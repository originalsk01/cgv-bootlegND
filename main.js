import Game from './game.js';

const intructions = document.getElementById("instance");
	instructions.innerHTML = "<h1>Welcome to:Snake Invader</h1>" +
    "<h4> (Click anywhere to start)</h4>" +
    "<h2>Instructions</h2>"+ 
    "<div id='leftHandControls'> <h3> Left Hand controls </h3>" +
        "<div>Tilt Left: A</div>" +
        "<div>Tilt Right:D</div>"+
        "<div>Tilt Up:W</div>"+
        "<div>Tilt Down:S</div>"+
    "</div>"+
    "<div id = 'rightHandControls'> <h3>Right Hand controls </h3>" +
    "<div>Turn Left: &#8592</div>" +
    "<div>Turn Right:&#8594</div>"+
    "<div>Move Forward:&#8593</div>"+
    "<div>Move Back:&#8595</div>"+
    "</div>"+
    "<h4> (Click anywhere to start)</h4>" 


document.addEventListener("click",startGame);
function startGame(){
    instructions.innerHTML = ''
    const game = new Game();
    game.init();

}

