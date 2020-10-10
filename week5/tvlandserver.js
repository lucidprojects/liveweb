let tvs = [];

// We need the file system here
var fs = require('fs');

// Express is a node module for building HTTP servers
var express = require('express');
var app = express();


// tried a bunch of error handling before I found that it was OOM error and got to know the oom_reaper 
process.on('uncaughtException', (error) => {
    console.log('Oh my god, something terrible happened: ', error);
    process.exit(1); // exit application 
})

process.on('unhandledRejection', (error, promise) => {
    console.log(' Oh Lord! We forgot to handle a promise rejection here: ', promise);
    console.log(' The error was: ', error);
});

var errorhandler = require('errorhandler');
var notifier = require('node-notifier')

if (process.env.NODE_ENV === 'development') {
    // only use in development
    app.use(errorhandler({
        log: errorNotification
    }))
}

function errorNotification(err, str, req) {
    var title = 'Error in ' + req.method + ' ' + req.url

    notifier.notify({
        title: title,
        message: str
    })
}
// end error handling attempts

// using underscore util script for easier array handling i.e. searching array of objects
var _ = require('underscore');


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
    // key: fs.readFileSync('star_itp_io.key'),
    // cert: fs.readFileSync('star_itp_io.pem')
   
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


        // console.log("We have a new client: " + socket.id);
        peers.push({ socket: socket });
        console.log("We have a new client: " + socket.id + " peers length: " + peers.length);

        socket.on('list', function () {
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


        // client join
        socket.on("join", function (data) {
            const tv = {
                id: socket.id,
                toDataURL: data
            };

            tvs.push({
                'id': tv.id
                // 'toDataURL': tv.toDataURL  // I was adding the toDataURL to a local array on the sever.  disabling that did not help OOM issues
            });

            console.log("tvs.length is " + tvs.length);

            console.log(tv.id + " joined the tvland.");

            io.emit("join", tv);
            //  console.log(tvs);

            // looping through tvs array and emit each index
            // on new join iterate though all tvs array and emmit values
            for (let i = 0; i < tvs.length; i++) {
                let ptv = {
                    id: tvs[i].id,
                    // toDataURL: tvs[i].toDataURL
                    toDataURL: data.toDataURL
                };
                io.emit("others", ptv);
                console.log("sending tvs[" + i + "]");

            }
        });

        //send new image to every client
        socket.on('image', function (data) {
            let udatedTv = {
                id: socket.id,
                toDataURL: data
            };

            // I was adding D2U here again

            io.emit('image', data, udatedTv);
        });

        //loop through tvs array and remove disconnected socketID
        socket.on('disconnect', function () {
            console.log("tvs length = " + tvs.length);
            console.log(socket.id + " has disconnected");
            let myIndex = _.findLastIndex(tvs, {
                id: socket.id
            });
            if (myIndex > -1) tvs.splice(myIndex, 1);
            console.log("tvs length = " + tvs.length);
            io.emit('disconnected', socket.id);

            console.log("Client has disconnected " + socket.id);
            for (let i = 0; i < peers.length; i++) {
                if (peers[i].socket.id == socket.id) {
                    peers.splice(i, 1);
                } else {
                    peers[i].socket.emit('peer_disconnect', socket.id);
                }
            }	

        });

    }
);