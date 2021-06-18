import Game from './game.js';

const NewStuff = document.getElementById("instructions");

NewStuff.innerHTML = "<body class='intro'>" + 
"<div class= 'wrapper'>" + '<div class= "scroll-text">' +
"<h1>Welcome to: Space Invaders except its a project made by coms students tryna survive the Rona</h1>" + 
"<h2>And also its not really space invaders </h2>" +
"<h3>Part II</h3>" +
"<h4>Instructions </h4>" +
"<p>You are a rookie pilot Ricch Heard with 10 PhDs in everyfield aboard the Transdimensional Interstellar Neutron Observer (T.I.N.O) Spacecraft. Your head pilots Darth Stevovo and PRAvenman VESHim'l have been knocked out from stress of studying for\
their pilot exams which are taking place on Monday the 21st!(The Cross-dimensional Orbital Milky-way Spacemen (C.O.M.S) board has no mercy on them :( ) Your job is to fly the ship and collect Past Paper tokens so they can buy past papers to help them \
study when they wake up! Youre new to the pilot game but youre a quick learner. Goodluck Captain! Heres your manual</p> " + 
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
var gameStart=false
function startGame(){
    if(gameStart==false){
    NewStuff.innerHTML = ''
    document.getElementById('instructions').className = '';
    document.body.style.marginTop = 0;
    const game = new Game();
    gameStart=true
        game.init();
    }
}
