// We need the file system here
var fs = require('fs');
				
// Express is a node module for building HTTP servers
var express = require('express');
var app = express();

// set path for stills to access from frontend
const path = require('path');

// Allow stills directory listings
const serveIndex = require('serve-index'); 
app.use('/stills/', serveIndex(path.join(__dirname, '/public/stills/')));

// Tell Express to look in the "public" folder for any files first
app.use(express.static('public'));

// If the user just goes to the "route" / then run this function
app.get('/', function (req, res) {
  res.send('Hello World!')
});

// Here is the actual HTTP server 
// In this case, HTTPS (secure) server
var https = require('https');

// Security options - key and certificate
var options = {
    key: fs.readFileSync('path_to_key'),
    cert: fs.readFileSync('path_to_pem')
};

// We pass in the Express object and the options object
var httpServer = https.createServer(options, app);

// Default HTTPS port
httpServer.listen(443);

/* 
This server simply keeps track of the peers all in one big "room"
and relays signal messages back and forth.
*/

let peers = [];
let tempFilename;



// WebSocket Portion
// WebSockets work with the HTTP server
var io = require('socket.io').listen(httpServer);

// Register a callback function to run when we have an individual connection
// This is run for each individual user that connects
io.sockets.on('connection', 

	// We are given a websocket object in our function
	function (socket) {
	
		peers.push({socket: socket});
		console.log("We have a new client: " + socket.id + " peers length: " + peers.length);
		
		socket.on('list', function() {
			let ids = [];
			for (let i = 0; i < peers.length; i++) {
				ids.push(peers[i].socket.id);
			}
			console.log("ids length: " + ids.length);
			socket.emit('listresults', ids);			
		});
		
		// Relay signals back and forth
		socket.on('signal', (to, from, data) => {
			console.log("SIGNAL", to, data);
			let found = false;
			for (let i = 0; i < peers.length; i++) {
				console.log(peers[i].socket.id, to);
				if (peers[i].socket.id == to) {
					console.log("Found Peer, sending signal");
					peers[i].socket.emit('signal', to, from, data);
					found = true;
					break;
				}				
			}	
			if (!found) {
				console.log("never found peer");
			}
		});

		

		// Save Still
		socket.on('still', function(data){
			console.log(data);
			// save in stills dir
			let stillDir = "/public/stills/";
			let filename = Date.now() + "_" + Math.random();
			tempFilename = filename;
			console.log(filename);
			fs.writeFile(__dirname + stillDir + filename + '.png', data, function(err){
				if (err) console.log(err);
				console.log("image saved!")
			});
		});		

		// Save Recording
		socket.on('video', function(data){
			console.log(data);
			//save in vidoes dir
			let vidDir = "/public/videos/";
			// use same name set from still above
			let filename = tempFilename;
			console.log(tempFilename);
			fs.writeFile(__dirname + vidDir + filename + '.webm', data, function(err){
				if (err) console.log(err);
				console.log("video saved!")
			});
		});	
		
		socket.on('disconnect', function() {
			console.log("Client has disconnected " + socket.id);
		    io.emit('peer_disconnect', socket.id);
			for (let i = 0; i < peers.length; i++) {
				if (peers[i].socket.id == socket.id) {
					peers.splice(i,1);
				}
			}			
		});
	}
);