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

		// When this user emits, client side: socket.emit('otherevent',some data);
        socket.on('chatmessage', function (data, rUser) {
            // Data comes in as whatever was sent, including objects
            console.log("Received: 'chatmessage' " + data);
            console.log("Received: 'chatmessage from user' " + rUser);
            var myrUser = rUser;
            // console.log("myrUser = " + myrUser)
            socket.broadcast.emit('chatmessage', data, myrUser);
            
		});
		
		socket.on('move', (data) => {
			//console.log(socket.id + ", " + data);

			let posData = {
				id : socket.id,
				pos : data
			}

			socket.broadcast.emit('peerPositions', posData);
		});

		socket.on('tattooPeer', (pan, num, pid) => {
			console.log("tattooPeer " + socket.id + ", " + pan + ", " + num + ", " + pid);

			let tatData = {
				id : pid,
				pan : pan,
				num : num
			}

			socket.broadcast.emit('peerTattoo', tatData);
		});

		socket.on('tattooPeerSelf', (data, num) => {
			// console.log("tattooPeerSelf " + socket.id + ", " + data);
			// console.log("tattooPeerSelf " + socket.id + ", " + JSON.stringify(num));

			let recTatData = {
				id : socket.id,
				material : data,
				num : num
			}

			socket.broadcast.emit('applyPeerSelfTattoo', recTatData);
		});


		
		//	socket.on("call-user", data => {
		//    socket.to(data.to).emit("call-made", {
		//      offer: data.offer,
		//      socket: socket.id
		//    });
		//  });
		
		socket.on('disconnect', function() {
            console.log("Client has disconnected " + socket.id);
            io.emit('peer_disconnect', socket.id);
			for (let i = 0; i < peers.length; i++) {
				if (peers[i].socket.id == socket.id) {
					peers.splice(i,1);
                } 
                // else {
				// 	peers[i].socket.emit('peer_disconnect', socket.id);
				// }
			}			
		});
	}
);