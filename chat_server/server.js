// Express is a node module for building HTTP servers
var express = require('express');
var app = express();

// Tell Express to look in the "public" folder for any files first
app.use(express.static('public'));
app.use('/css', express.static(__dirname + '/public'));
app.use('/images', express.static(__dirname + '/public'));
app.use('/js', express.static(__dirname + '/public'));
//app.use('/css', express.static(__dirname + '/public/css'));

// If the user just goes to the "route" / then run this function
app.get('/', function (req, res) {
    res.send('Hello World Again and Agains!')
});

// Here is the actual HTTP server 
var http = require('http');
// We pass in the Express object
var httpServer = http.createServer(app);
// Listen on port 80
httpServer.listen(80);

// WebSocket Portion
// WebSockets work with the HTTP server
var io = require('socket.io').listen(httpServer);

var connectCounter = 0;
var serverChatArray = [];

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
                 socket.broadcast.emit('pollUsers', connectCounter);
                 console.log("ran updateCount from updateCount " + connectCounter);
        }
        
        updateCount();

        // When this user emits, client side: socket.emit('otherevent',some data);
        socket.on('chatmessage', function (data, rUser) {
            // Data comes in as whatever was sent, including objects
            console.log("Received: 'chatmessage' " + data);
            console.log("Received: 'chatmessage from user' " + rUser);
            var myrUser = rUser;
            // console.log("myrUser = " + myrUser)
            socket.broadcast.emit('chatmessage', data, myrUser);
            updateCount();
        });

        socket.on('connect', function () {
            console.log("do I work?");
            updateCount();
        });

        socket.on('disconnect', function () {
            connectCounter--;
            console.log("connectCounter " + connectCounter);
            console.log("Client has disconnected " + socket.id);
            // updateCount();
             console.log("ran disconnect updateCount");
            //socket.broadcast.emit('disconnect', connectCounter);
            updateCount();
        });
    }
);