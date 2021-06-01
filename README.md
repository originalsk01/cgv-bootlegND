To set up environment run the following commands in the project folder:  

npm install --global rollup  
npm install --global http-server  
npm i @rollup/plugin-node-resolve  
npm i three  
npm i cannon-es  
npm i three-to-cannon  

To build project run:  
rollup -c  

To start server run:  
http-server

You need to run rollup -c everytime you make changes to game.js in order  
for them to reflected in the running game instance. Then reload the tab in  
your browser running the http-server instance.
