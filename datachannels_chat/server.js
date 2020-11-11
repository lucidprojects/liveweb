// We need the file system here
var fs = require('fs');

// Express is a node module for building HTTP servers
var express = require('express');
var app = express();

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
	key: fs.readFileSync('/Users/dezbookpro/itp/liveweb/itp_io.key_cert/star_itp_io.key'),
	cert: fs.readFileSync('/Users/dezbookpro/itp/liveweb/itp_io.key_cert/star_itp_io.pem')
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
let peerNames = [];

// WebSocket Portion
// WebSockets work with the HTTP server
var io = require('socket.io').listen(httpServer);

// Register a callback function to run when we have an individual connection
// This is run for each individual user that connects
io.sockets.on('connection',

	// We are given a websocket object in our function
	function (socket) {

		peers.push({
			socket: socket
		});
		console.log("We have a new client: " + socket.id + " peers length: " + peers.length);

		socket.on('setUser', (user, rId) => {
			for (let i = 0; i < peers.length; i++) {
				if (peers[i].socket.id == rId) {
					peerNames.push(user);
					// console.log("setUser = " + peers[i].name + " =? " + peerNames[i]);
				}
			}

		});


		socket.on('list', function () {
			let ids = [];
			let names = [];
			for (let i = 0; i < peers.length; i++) {
				
				ids.push(peers[i].socket.id);
		
				let myName = peerNames[i];
				console.log("my id = " + peers[i].socket.id + ' my name = ' + myName)
				names.push(myName);
			
			}
		
			socket.emit('listresults', ids, names);
						
		});

		// Relay signals back and forth
		socket.on('signal', (to, from, data, rUser) => {
			myUser = rUser;
			let found = false;
			for (let i = 0; i < peers.length; i++) {
							if (peers[i].name != myUser) {
					if (peers[i].socket.id == to) {
						console.log("Found Peer, sending signal " + peers[i].socket.id + " to " + from + " name " + myUser + " " + peerNames[i]);
						peers[i].socket.emit('signal', to, from, data, myUser);
						found = true;
						break;
					}
				}
			}
			if (!found) {
				console.log("never found peer");
			}
		});


		socket.on('disconnect', function () {
			console.log("Client has disconnected " + socket.id);
			io.emit('peer_disconnect', socket.id);
			for (let i = 0; i < peers.length; i++) {
				if (peers[i].socket.id == socket.id) {
					peers.splice(i, 1);
					peerNames.splice(i, 1);
					break;
				}

			}
		});

		
	}
);