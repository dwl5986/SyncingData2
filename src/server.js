var http = require('http');
var fs = require('fs');
var socketio = require('socket.io');
var port = process.env.PORT || process.env.NODE_PORT || 3000;

//read the client html file into memory
//__dirname in node is the current directory
//in this case the same folder as the server js file
var index = fs.readFileSync(__dirname + '/../client/client.html');

function onRequest(request, response) {

 response.writeHead(200, {"Content-Type": "text/html"});
 response.write(index);
 response.end();
}
var app = http.createServer(onRequest).listen(port);
console.log("Listening on 127.0.0.1:" + port);

//pass in the http server into socketio and grab the websocket server as io
var io = socketio(app);
var allSquares = {};
var allScores = {};

// When there is a server connection
io.sockets.on("connection", function(socket) {

  socket.join('Main Room');

  socket.on('newRect', function(data) {
    allSquares[data.userRect.userID] = {
      x: data.userRect.x,
      y: data.userRect.y,
      width: data.userRect.width,
      height: data.userRect.height
    };

    allScores[data.userRect.userID] = data.userRect.score;

    allSquares[data.newObjective.userID] = {
      x: data.newObjective.x,
      y: data.newObjective.y,
      width: data.newObjective.width,
      height: data.newObjective.height
    };

    io.sockets.in('Main Room').emit('updateCanvas', { squares: allSquares, scores: allScores });
  });

  socket.on('updateRect', function(data) {
    allSquares[data.userID].x = data.x;
    allSquares[data.userID].y = data.y;
    io.sockets.in('Main Room').emit('updateCanvas', { squares: allSquares, scores: allScores });
  });

  socket.on('updateScore', function(data) {
    allSquares[data.newObj.userID].x = data.newObj.x;
    allSquares[data.newObj.userID].y = data.newObj.y;
    allScores[data.newScore.userID] = data.newScore.score;

    io.sockets.in('Main Room').emit('updateCanvas', { squares: allSquares, scores: allScores });
  });

  //When someone disconnects, remove their websocket from the socket room
  socket.on('disconnect', function(data) {
    delete allSquares[data.userID];
    io.sockets.in('Main Room').emit('updateCanvas', { squares: allSquares, scores: allScores });
    socket.leave('Main Room');
  });
});

console.log('websocket server started');
