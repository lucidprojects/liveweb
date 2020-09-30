// Express is a node module for building HTTP servers
var express = require('express');
var app = express();

// read files
var fs = require('fs');

// Tell Express to look in the "public" folder for any files first
app.use(express.static('public'));

// If the user just goes to the "route" / then run this function
app.get('/', function (req, res) {
    res.send('Hello World!')
});


// Here is the actual HTTP server
var http = require('http');
// We pass in the Express object
var httpServer = http.createServer(app);
// Listen on port 8080
httpServer.listen(8080);


// WebSocket Portion
// WebSockets work with the HTTP server
var io = require('socket.io').listen(httpServer);

var connectCounter = 0;
var answerCounter = 0;

// Register a callback function to run when we have an individual connection
// This is run for each individual user that connects
io.sockets.on('connection',
    // We are given a websocket object in our function
    function (socket) {
        connectCounter++;
        console.log("connectCounter" + connectCounter);
        console.log("We have a new client: " + socket.id);


        function updateCount() {
            console.log("ran connect updateCount");
            io.emit('pollUsers', connectCounter);
            //  socket.broadcast.emit('pollUsers', connectCounter);
            console.log("ran updateCount from updateCount " + connectCounter);
        }

        updateCount();

        function updateAnswerCount() {
            console.log("ran update answerCount");
            io.emit('pollAnswers', answerCounter);
            //  socket.broadcast.emit('pollUsers', connectCounter);
            console.log("ran updateAnswerCount from updateAnswerCount " + answerCounter);

            if(connectCounter > 1 && connectCounter == answerCounter)  {
                io.emit('allAnswered', true);
                console.log("all users answered");
            }


        }

        updateAnswerCount();

        

        console.log("We have a new client: " + socket.id);

        socket.on('localData', function (data) {
            io.emit('localData', data);
            console.log("Received: 'chatmessage' " + data + " from: " + socket.id);
            answerCounter++;
            updateAnswerCount();
        });


        


        socket.on('disconnect', function () {
            console.log("Client has disconnected " + socket.id);
            connectCounter--;
            updateCount();
        });
    }
);