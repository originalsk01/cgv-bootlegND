import Game from './game.js';

// const intructions = document.getElementById("instance");
// 	instructions.innerHTML = "<h1>Welcome to:Snake Invader</h1>" +
//     "<h4> (Click anywhere to start)</h4>" +
//     "<h2>Instructions</h2>"+ 
//     "<div id='leftHandControls'> <h3> Left Hand controls </h3>" +
//         "<div>Tilt Left: A</div>" +
//         "<div>Tilt Right:D</div>"+
//         "<div>Tilt Up:W</div>"+
//         "<div>Tilt Down:S</div>"+
//     "</div>"+
//     "<div id = 'rightHandControls'> <h3>Right Hand controls </h3>" +
//     "<div>Turn Left: &#8592</div>" +
//     "<div>Turn Right:&#8594</div>"+
//     "<div>Move Forward:&#8593</div>"+
//     "<div>Move Back:&#8595</div>"+
//     "</div>"+
//     "<h4> (Click anywhere to start)</h4>" 

const NewStuff = document.getElementById("instructions");

NewStuff.innerHTML = "<body class='intro'>" + 
"<div class= 'wrapper'>" + '<div class= "scroll-text">' +
"<h1>Welcome to: Space Invaders except its a project made by Coms students tryna survive the Rona</h1>" + 
"<h2>And also its not really space invaders </h2>" +
"<h3>Part II (dont sue us Disney pls)</h3>" +
"<h4>Instructions </h4>" +
"<p>You are a Padawan Jedi pilot Ricch Heard with 42 PhDs in everyfield (except flying because all the energade , coke and redbull you drink gives you the jitters!) aboard the Transdimensional Interstellar Neutron Observer (T.I.N.O) Spacecraft. Your head pilots Darth Stevovo and Padawan PRAvenman VESHim'l have been knocked out from stress of studying for\
their pilot exams which are taking place on Monday the 21st!(The Cross-dimensional Orbital Milky-way Spacemen (C.O.M.S) board has no mercy on them :( ) Your job is to fly the ship and collect Past Paper Tokens so they can buy past papers to help them \
study when they wake up! Youre new to the pilot game but youre a quick learner. Goodluck Master! Heres your Sacred Text</p> " + 
"<h2>Left Hand controls</h2>" +
"<p>Tilt Left : A</p>" + 
"<p>Tilt Right : D</p>" + 
"<p>Tilt Up : W</p>" + 
"<p>Tilt Down : S</p>" + 
"<p>Switch Perspective : H</p>" +
"<h2>Right Hand controls</h2> " + 
"<p>Turn Left: &#8592</p>" + 
"<p>Turn Right: &#8594</p>" + 
"<p>Move Forward: &#8593</p>" + 
"<p>Move Back: &#8595</p>" + 
"<h1>(Click anywhere to start)</h1>"
"</div>" +
"</div>" + 
"</body>"
document.addEventListener("click",startGame);
function startGame(){
    NewStuff.innerHTML = ''
    document.getElementById('instructions').className = '';
    document.body.style.marginTop = 0;
    const game = new Game();
    game.init();

}

