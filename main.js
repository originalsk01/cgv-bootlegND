import Game from './game.js';

const intructions = document.getElementById("instance");
// instructions.body.style.lineHeight="1.0rem"
	instructions.innerHTML = "<h1>Welcome to: Space Invaders except its a project made by coms students tryna survive the Rona</h1>" +
    "<h4> And also its not really space invaders</h4>" +
    "<h6> Part II(The Snyder cut)</h6>" +
    "<h2>Instructions</h2>"+ 
    "<p>You are a rookie pilot Ricch Heard with 10 PhDs in everyfield aboard the Transdimensional Interstellar Neutron Observer (T.I.N.O) Spacecraft. Your head pilots Darth Stevovo and PRAvenman VESHim'l have been knocked out from stress of studying for\
    their pilot exams which are taking place on Monday the 21st!(The Cross-dimensional Orbital Milky-way Spacemen (C.O.M.S) board has no mercy on them :( ) Your job is to fly the ship and collect Past Paper tokens so they can buy past papers to help them \
    study when they wake up! Youre new to the pilot game but youre a quick learner. Goodluck Captain! Heres your manual</p>"+
    "<div id='leftHandControls'> <h3> Left Hand controls </h3> " +
        "<div>Tilt Left : A</div>" +
        "<div>Tilt Right : D</div>"+
        "<div>Tilt Up : W</div>"+
        "<div>Tilt Down : S</div>"+
        "<div>Switch Perspective : H</div>"+
    "</div>"+
    "<div id = 'rightHandControls'> <h3>Right Hand controls </h3>" +
    "<div>Turn Left: &#8592</div>" +
    "<div>Turn Right: &#8594</div>"+
    "<div>Move Forward: &#8593</div>"+
    "<div>Move Back: &#8595</div>"+
    "</div>"+
    "<h4> (Click anywhere to start)</h4>" 


document.addEventListener("click",startGame);
function startGame(){
    instructions.innerHTML = ''
    const game = new Game();
    game.init();

}

