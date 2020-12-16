let canvas, ctx;
let canvasBack, cbCtx;
let canvasSml, cSmlCtx;
let filterMode = 0;
let cw, ch;
let simplepeers = [];
let socket;
let myMessageBox;
let chatArray = [];
let messegesWindow;
let mystream;
let canvasStream, audioStream, videoStream, myCstream;
let isMuted = true;
let myLocalId;

// scene.js variables needed outside module script
let scene, clock;
let controls;
let redCube;
let redCubeMaterials = [];
let allMaterials = [];
let myGifAreaTextMesh;
let group;
let testMaterial;
let redCubeMaterialsGifs, redCubeMaterialsVideo;
let peerTattooPrimaryMaterial, peerCubeMaterialsGifs, peerTattooMaterial;

// setting global for testing
let peerGroup, peerCubeRaycaster, peerPosition;
let posX, posY, posZ, rotX, rotY, rotZ;

// wait for window to load
window.addEventListener('load', function () {

    // set up video, canvas, buttons
    let myVideo = document.getElementById('myVideo');
    let canvas = document.getElementById('canvas');
    let ctx = canvas.getContext('2d');

    let canvasBack = document.getElementById('canvasBack');
    let cbCtx = canvasBack.getContext('2d');

    let tempCanvas = document.createElement("canvas");
    let tctx = tempCanvas.getContext("2d");

    let inverseBtn = document.getElementById('inverBtn');
    inverseBtn.addEventListener('click', function () {
        filterMode = 1
    });
    let weirdCBtn = document.getElementById('weirdBtn');
    weirdCBtn.addEventListener('click', function () {
        filterMode = 2
    });
    let tintBtn = document.getElementById('tintBtn');
    tintBtn.addEventListener('click', function () {
        filterMode = 3
    });
    let brightBtn = document.getElementById('brightBtn');
    brightBtn.addEventListener('click', function () {
        filterMode = 5
    });

    let normBtn = document.getElementById('normBtn');
    normBtn.addEventListener('click', function () {
        filterMode = 0
    });

    // mute on off - defaults to muted
    let muteBtn = document.getElementById('muteBtn');
    muteBtn.addEventListener('click', function () {
        isMuted = !isMuted;
        console.log(isMuted);
        audioStream.getAudioTracks()[0].enabled = !audioStream.getAudioTracks()[0].enabled;
        // console.log("am i muting?");
        let mutedSym = document.getElementById('muteSym');
        if (isMuted) {
            mutedSym.style.display = "inline-block";
        } else {
            mutedSym.style.display = "none";
        }
    });

    let gifyoselfBtn = document.getElementById('gifyoselfBtn');
    gifyoselfBtn.addEventListener('click', gifYoSelfCubed);

    let videoyoselfBtn = document.getElementById('videoyoselfBtn');
    videoyoselfBtn.addEventListener('click', videoCubeMesh);

    let defaultcubeBtn = document.getElementById('defaultcubeBtn');
    defaultcubeBtn.addEventListener('click', defaultCubeMesh);

    let gifPeerBtn = document.getElementById('gifPeerBtn');
    gifPeerBtn.addEventListener('click', peerGifMaterial);




    let spotifyDisplayBtn = document.getElementById('fullSpotifyBtn');
    let spotifyIframe = document.getElementById('spotify-embed-iframe');
    
    
    spotifyDisplayBtn.addEventListener('click', function(){
        if(spotifyDisplayBtn.innerHTML == 'show playlist'){
            spotifyDisplayBtn.innerHTML = 'hide playlist';
            spotifyIframe.style.width = '300px';
            spotifyIframe.style.height = '380px';
        } else if(spotifyDisplayBtn.innerHTML == 'hide playlist'){
            spotifyDisplayBtn.innerHTML = 'show playlist';
            spotifyIframe.style.width = '80px';
            spotifyIframe.style.height = '80px';
        }


    });


    messegesWindow = document.getElementById('messages');
    myMessageBox = document.getElementById('message');

    // set up some initial canvas lets
    cw = myVideo.clientWidth;
    ch = myVideo.clientHeight;
    canvas.width = cw;
    canvas.height = ch;
    canvasBack.width = cw;
    canvasBack.height = ch;

    // set up some initial Media Stream lets - these are important to happen before we getUserMedia
    canvasStream = canvas.captureStream(25); // 25 FPS
    myCstream = new MediaStream;

    // simplified canvas manipulation func from http://html5doctor.com/video-canvas-magic/
    // modified to have multiple filters
    function draw(v, c, bc, w, h) {
        // First, draw it into the backing canvas
        bc.drawImage(v, 0, 0, w, h);
        // Grab the pixel data from the backing canvas
        let idata = bc.getImageData(0, 0, w, h);
        let data = idata.data;

        // apply filters based on filterMode set with button
        filters(filterMode, data);

        idata.data = data;
        // Draw the pixels onto the visible canvas
        c.putImageData(idata, 0, 0);

        setTimeout(function () {
            draw(v, c, bc, w, h);
        }, 0);
    }

    // Constraints - what do we want?
    let constraints = {
        audio: true,
        // video: true
        video: {
            // added width and height constraints to reduce size of stream and help with bandwidth strains.
            width: 160,
            height: 120,
            aspectRatio: 4 / 3
        }

    }

    // Prompt the user for permission, get the stream
    navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
        /* Use the stream */

        // Global object
        mystream = stream;

        // separate audio and video so we can add audio to canvas prior to streaming to peers    
        audioStream = new MediaStream(stream.getAudioTracks());
        videoStream = new MediaStream(stream.getVideoTracks());

        audioStream.getAudioTracks()[0].enabled = false;

        // Attach to our video object
        myVideo.srcObject = stream;

        // Wait for the audio and video streams to load enough to play
        myAudio.srcObject = audioStream;
        myAudio.muted = true;
        myAudio.onloadedmetadata = function (e) {
            myAudio.play();
        };

        myVideo.srcObject = videoStream;
        myVideo.onloadedmetadata = function (e) {
            myVideo.play();
            checkMyVidLoaded();
            // once stream has loaded add canvasStream and audioStream to myCstream (my Combinded stream)
            myCstream.addTrack(canvasStream.getTracks()[0]);
            myCstream.addTrack(audioStream.getTracks()[0]);

        };

        // Now setup socket
        setupSocket();
    }).catch(function (err) {
        /* Handle the error */
        alert(err);
    });

    function checkMyVidLoaded() {
        myVideo.addEventListener('play', function () {
            draw(myVideo, ctx, cbCtx, cw, ch);
        }, false);
    }


});


// text chat funcs
let sendmessage = function (message, user) {
    // console.log("sent chatmessage: " + message);
    socket.emit('chatmessage', message, liveWebUser);
    let localMsg = "<br><div class=\"localmsg\"><span class=\"user\">" + liveWebUser + "</span>:  " + message + "</div>";
    chatArray.push(localMsg);
    updateChat();
    clearChatInput();
    $("#messages").scrollTop($("#messages")[0].scrollHeight);
    messagesHeightAdj();
};

function updateChat() {
    console.log("run update chat");
    document.getElementById('messages').innerHTML = chatArray.join(' ');
}

function tabSubmit() {
    if (myMessageBox) {
        // console.log("we have a myMessageBox object");
        myMessageBox.addEventListener('keyup', function (e) {
            if (e.keyCode === 13 || e.keyCode === 9) {
                // console.log("msg sent from enter key from input w keycode " + e.keyCode);
                sendmessage(document.getElementById('message').value);
            }
        })
    } else console.log("no myMessageBox object");
}

function clearChatInput() {
    document.getElementById('message').value = '';
}

function localPlayerMove(group, groupRotation) {
    if (getLocalPlayerPosition(group, groupRotation) && socket) {
        socket.emit('move', getLocalPlayerPosition(group, groupRotation));
    }
}

function sendUpdatedLocalMaterial(mat, num) {
    socket.emit('tattooPeerSelf', mat, num);
}


function sendUpdatedPeerMaterial(pan, num, pid) {
    socket.emit('tattooPeer', pan, num, pid);
}



function setupSocket() {
    socket = io.connect();

    socket.on('connect', function () {
        console.log("Socket Connected**");
        console.log("My socket id: ", socket.id);
        myLocalId = socket.id;
        tabSubmit();
        // Tell the server we want a list of the other users
        socket.emit('list');
    });

    socket.on('disconnect', function (data) {
        console.log("Socket disconnected");
    });

    socket.on('chatmessage', function (data, rUser) {
        console.log("chat received from " + rUser);
        console.log("received chat msg: " + data);
        let remoteMsg = "<br><div class=\"remotemsg\"><span class=\"user\">" + rUser + "</span>: " + data + "</div>";
        chatArray.push(remoteMsg);
        updateChat();
        $("#messages").scrollTop($("#messages")[0].scrollHeight);
        messagesHeightAdj();
    });



    socket.on('peer_disconnect', function (data) {
        console.log("simplepeer has disconnected " + data);
        document.getElementById(data).remove();

        for (let i = 0; i < simplepeers.length; i++) {
            if (simplepeers[i].socket_id == data) {
                console.log("Removing simplepeer: " + i);
                scene.remove(simplepeers[i].peerGroup); // also remove cube from scene
                simplepeers.splice(i, 1);

            }
        }
    });

    // Receive listresults from server
    socket.on('listresults', function (data) {
        console.log("my listresults are:")
        console.log(data);
        for (let i = 0; i < data.length; i++) {
            // Make sure it's not us

            if (data[i] != socket.id) {

                // create a new simplepeer and we'll be the "initiator"			
                let simplepeer = new SimplePeerWrapper(
                    true, data[i], socket, myCstream, scene // send combined stream
                );

                // Push into our array
                simplepeers.push(simplepeer);
            }
        }
    });

    socket.on('signal', function (to, from, data) {

        console.log("Got a signal from the server: ", to, from, data);

        // to should be us
        if (to != socket.id) {
            console.log("Socket IDs don't match");
        }

        // Look for the right simplepeer in our array
        let found = false;
        for (let i = 0; i < simplepeers.length; i++) {

            if (simplepeers[i].socket_id == from) {
                console.log("Found right object");
                // Give that simplepeer the signal
                simplepeers[i].inputsignal(data);
                found = true;
                break;
            }

        }
        if (!found) {
            console.log("Never found right simplepeer object");
            // Let's create it then, we won't be the "initiator"
            let simplepeer = new SimplePeerWrapper(
                false, from, socket, myCstream, scene // send combined stream
            );

            // Push into our array
            simplepeers.push(simplepeer);

            // Tell the new simplepeer that signal
            simplepeer.inputsignal(data);
        }
    });

    // Update when one of the users moves in space
    socket.on('peerPositions', posData => {
        let delta = clock.getDelta(); // seconds.
        let tempPosData = posData.pos.toString();

        let tempPos = tempPosData.split(',');
        for (let i = 0; i < simplepeers.length; i++) {
            if (simplepeers[i].socket_id == posData.id) {
                if (simplepeers[i].peerGroup) {

                    simplepeers[i].peerGroup.position.set(tempPos[0], tempPos[1], tempPos[2]);

                    let tempLookAt = simplepeers[i].peerGroup.position.clone();

                    if (posData.pos[1][0] === -100) simplepeers[i].peerGroup.lookAt(-100, 0, 0);
                    if (posData.pos[1][0] === 100) simplepeers[i].peerGroup.lookAt(100, 0, 0);
                    if (posData.pos[1][2] === -100) simplepeers[i].peerGroup.lookAt(0, 0, -100);
                    if (posData.pos[1][2] === 100) simplepeers[i].peerGroup.lookAt(0, 0, 100);


                }
            }
        }

    });


    // Update peer material
    socket.on('peerTattoo', tatData => {

        console.log("rec'd peerTattoo " + JSON.stringify(tatData));

        // check if peer to update is local primary
        if (tatData.id == socket.id) {
            console.log("trying to tat the primary");

            if (!peerTattooPrimaryMaterial) {
                console.log("I don't have  a peerTattooPrimaryMaterial");
                peerTattooPrimaryMaterial = [
                    redCubeMaterials[0],
                    redCubeMaterials[1],
                    redCubeMaterials[2],
                    redCubeMaterials[3],
                    redCubeMaterials[4],
                    redCubeMaterials[5],
                ]
            } else {
                console.log("I already  have  a peerTattooPrimaryMaterial");
            }

            peerTattooPrimaryMaterial[tatData.pan] = allMaterials[tatData.num];

            redCube.traverse(function (child) {
                if (child instanceof THREE.Mesh) {
                    child.material = peerTattooPrimaryMaterial;
                }
                redCube.geometry.uvsNeedUpdate = true;
                redCube.needsUpdate = true;
            });

        } else {

            // iterate through peers array
            for (let peer in simplepeers) {
                if (simplepeers[peer].socket_id == tatData.id) {
                    console.log(`set peer texture of ${tatData.id}`);
                    peerTattooMaterial = [
                        simplepeers[peer].material[0],
                        simplepeers[peer].material[1],
                        simplepeers[peer].material[2],
                        simplepeers[peer].material[3],
                        simplepeers[peer].material[4],
                        simplepeers[peer].material[5],
                    ]

                    console.log(JSON.stringify(simplepeers[peer].material));

                    peerTattooMaterial[tatData.pan] = allMaterials[tatData.num];
                    simplepeers[peer].material = peerTattooMaterial;


                    simplepeers[peer].peerCube.traverse(function (child) {
                        if (child instanceof THREE.Mesh) {
                            child.material = peerTattooMaterial;
                        }
                        simplepeers[peer].geometry.uvsNeedUpdate = true;
                        simplepeers[peer].needsUpdate = true;
                        console.log(JSON.stringify(simplepeers[peer].material));
                    });

                }
            }
        }


    });

    socket.on('applyPeerSelfTattoo', recTatData => {
        let peerSelftattoodMaterial;

        for (let peer in simplepeers) {
            if (simplepeers[peer].socket_id == recTatData.id) {

                switch (recTatData.num) {
                    case (1): //gifyouself
                        peerSelftattoodMaterial = [
                            allMaterials[9],
                            allMaterials[6],
                            allMaterials[7],
                            allMaterials[8],
                            simplepeers[peer].material[4],
                            allMaterials[10],
                        ]
                        break;

                    case (2): //video self
                        peerSelftattoodMaterial = [
                            simplepeers[peer].material[4],
                            simplepeers[peer].material[4],
                            simplepeers[peer].material[4],
                            simplepeers[peer].material[4],
                            simplepeers[peer].material[4],
                            simplepeers[peer].material[4],
                        ]
                        break;

                    case (3): //defalut self
                        peerSelftattoodMaterial = [
                            new THREE.MeshBasicMaterial({
                                color: simplepeers[peer].materialColor,
                                wireframe: false
                            }),
                            new THREE.MeshBasicMaterial({
                                color: simplepeers[peer].materialColor,
                                wireframe: false
                            }),
                            new THREE.MeshBasicMaterial({
                                color: simplepeers[peer].materialColor,
                                wireframe: false
                            }),
                            new THREE.MeshBasicMaterial({
                                color: simplepeers[peer].materialColor,
                                wireframe: false
                            }),
                            simplepeers[peer].material[4],
                            new THREE.MeshBasicMaterial({
                                color: simplepeers[peer].materialColor,
                                wireframe: false
                            }),
                        ]
                        break;

                }
                simplepeers[peer].peerCube.traverse(function (child) {
                    if (child instanceof THREE.Mesh) {
                        child.material = peerSelftattoodMaterial;
                    }
                    simplepeers[peer].geometry.uvsNeedUpdate = true;
                    simplepeers[peer].needsUpdate = true;
                });
            }
        }


    });

}


// Aidan's audio code to modify for proximity.
function updateClientVolumes() {
    let distSquared;
    for (let peer in simplepeers) {
        let audioEl = document.getElementById(peer + "_audio");
        if (audioEl) {
            if (distSquared > 35) {
                // console.log('setting vol to 0')
                audioEl.volume = 0;
                // console.log("hey where is everybody?");
            } else {
                // from lucasio here: https://discourse.threejs.org/t/positionalaudio-setmediastreamsource-with-webrtc-question-not-hearing-any-sound/14301/29
                let volume = Math.min(1, 10 / distSquared);
                audioEl.volume = volume;
            }
        }
    }
}


// apply gif texture to peers in close proximity // based on Aidan's audio code to modify for proximity.
function peerGifMaterial() {

    for (let peer in simplepeers) {
        let distSquared;
        // if(simplepeers[peer].position) distSquared = group.position.distanceToSquared(simplepeers[peer].peerGroup.position);
        distSquared = group.position.distanceToSquared(simplepeers[peer].peerGroup.position);
        console.log("distSquared =" + distSquared)
        if (distSquared > 5) {
            console.log("hey where is everybody?");
        } else {
            console.log(`hey we're close. maybe? ${simplepeers[peer].socket_id}`);
            let randomGifNum = randomIntFromInterval(6, 11)
            let randomPanNum = randomIntFromInterval(1, 5)
            console.log("randomGifNum = " + randomGifNum)

            console.log(simplepeers[peer].material)

            // check if there is already a peerCubeMaterialsGifs array if not create it
            if (!peerCubeMaterialsGifs) {
                console.log("I don't have  a peerCubeMaterialsGifs");
                peerCubeMaterialsGifs = [
                    simplepeers[peer].material[0],
                    simplepeers[peer].material[1],
                    simplepeers[peer].material[2],
                    simplepeers[peer].material[3],
                    simplepeers[peer].material[4],
                    simplepeers[peer].material[5],
                ]
            } else {
                console.log("I already  have  a peerCubeMaterialsGifs");
            }

            // don't change primary video face
            if (randomPanNum == 4) {
                randomPanNum = randomPanNum + 1
            }

            peerCubeMaterialsGifs[randomPanNum] = allMaterials[randomGifNum];

            // traverse mesh and update materials
            simplepeers[peer].peerCube.traverse(function (child) {
                if (child instanceof THREE.Mesh) {
                    child.material = peerCubeMaterialsGifs;
                }
                simplepeers[peer].geometry.uvsNeedUpdate = true;
                simplepeers[peer].needsUpdate = true;
                console.log(simplepeers[peer].material)
            });

            console.log("peerGifMaterial simplepeers[peer].socket_id) " + simplepeers[peer].socket_id);

            sendUpdatedPeerMaterial(randomPanNum, randomGifNum, simplepeers[peer].socket_id);
        }


    }
}

function randomIntFromInterval(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// A wrapper for simplepeer as we need a bit more than it provides
class SimplePeerWrapper {

    // updated to create objects with scale and rotate properties
    constructor(initiator, socket_id, socket, stream, scene) {
        this.simplepeer = new SimplePeer({
            initiator: initiator,
            trickle: false
        });

        // Their socket id, our unique id for them
        this.socket_id = socket_id;

        // Socket.io Socket
        this.socket = socket;

        // Our video stream - need getters and setters for this
        this.stream = stream;

        this.scene = scene;

        // simplepeer generates signals which need to be sent across socket
        this.simplepeer.on('signal', data => {
            this.socket.emit('signal', this.socket_id, this.socket.id, data);
        });

        // When we have a connection, send our stream
        this.simplepeer.on('connect', () => {
            console.log('CONNECT')
            console.log(this.simplepeer);

            // Let's give them our stream
            this.simplepeer.addStream(stream);

            console.log("Send our stream");
        });

        this.simplepeer.on('close', () => {
            console.log('***Got close event***');
        });
        this.simplepeer.on('error', (err) => {
            console.log(err);
        });

        /// Stream coming in to us
        this.simplepeer.on('stream', stream => {
            //console.log('Incoming Stream');
            console.log("Incoming stream" + stream);

            // Create container div, and video objects
            let newDiv = document.createElement("div");
            let ovideo = document.createElement("VIDEO");
            let oCanvas = document.createElement("canvas");
            oCanvas.id = String(this.socket_id).concat("_canvas");

            oCanvas.width = cw;
            oCanvas.height = ch;

            document.body.appendChild(newDiv);
            newDiv.id = this.socket_id;
            newDiv.className = 'peerDiv';
            newDiv.style.position = "absolute";
            newDiv.style.width = 250;
            newDiv.style.height = 250;
            newDiv.style.top = 200;
            newDiv.style.left = 100;

            let mySocketID = document.getElementById(this.socket_id);

            mySocketID.appendChild(oCanvas);

            let peerCanvasCtx = oCanvas.getContext('2d');

            //adding "video" to id to differentiate between newDiv and ovideo id
            ovideo.id = String(this.socket_id).concat("video");
            ovideo.className = 'peerVid';
            ovideo.srcObject = stream;
            ovideo.muted = false;
            ovideo.overflow = "auto";

            ovideo.onloadedmetadata = function (e) {
                ovideo.play().then(ctxAnim);;
                peerCanvasCtx.drawImage(ovideo, 0, 0);
                if (ovideo.readyState === ovideo.HAVE_ENOUGH_DATA) {
                    updatePeerTexture();
                }
            };

            // animate the video on canvas w/ requestAnimationFrame
            function ctxAnim() {
                requestAnimationFrame(ctxAnim);
                peerCanvasCtx.drawImage(ovideo, 0, 0);
                updateClientVolumes();
            }


            mySocketID.appendChild(oCanvas);

            function addPeerCube(pId) {

                //import * as THREE from '../../../build/three.module.js';

                if (!pId) console.log("time from index.js script " + Date.now());

                else {
                    console.log("lets add a cube for peer id = " + pId);
                    // console.log("addPeerCube func = " + JSON.stringify(scene));

                    peerGroup = new THREE.Group(
                        new THREE.BoxBufferGeometry(),
                    );

                    //create video texture
                    const myPeerToMaterial = document.getElementById(String(pId).concat("_canvas"));
                    const myPeerVidtexture = new THREE.CanvasTexture(myPeerToMaterial);
                    myPeerVidtexture.minFilter = THREE.LinearFilter;

                    let ranR = Math.floor(Math.random() * 255);
                    let ranG = Math.floor(Math.random() * 255);
                    let ranB = Math.floor(Math.random() * 255);

                    let randomColor = new THREE.Color("rgb(" + ranR + ", " + ranG + ", " + ranB + ")");
                    let peerDefaultcolor = randomColor;
                    //create an array with six textures for a cool cube
                    let peerCubeGeometry = new THREE.BoxBufferGeometry(1, 1, 1);
                    let peerCubeMaterials = [
                        new THREE.MeshBasicMaterial({
                            color: randomColor,
                            wireframe: false
                        }),
                        new THREE.MeshBasicMaterial({
                            color: randomColor,
                            wireframe: false
                        }),
                        new THREE.MeshBasicMaterial({
                            color: randomColor,
                            wireframe: false
                        }),
                        new THREE.MeshBasicMaterial({
                            color: randomColor,
                            wireframe: false
                        }),
                        new THREE.MeshBasicMaterial({
                            map: myPeerVidtexture
                        }),
                        new THREE.MeshBasicMaterial({
                            color: randomColor,
                            wireframe: false
                        }),
                    ];

                    const peerCube = new THREE.Mesh(peerCubeGeometry, peerCubeMaterials);

                    peerCube.position.set(0, 0.5, 0);
                    peerGroup.add(peerCube);

                    let initialPeerX = Math.ceil(Math.random() * 5) * (Math.round(Math.random()) ? 1 : -1)

                    peerGroup.position.set(initialPeerX, 2, 0);

                    scene.add(peerGroup);

                    for (let i = 0; i < simplepeers.length; i++) {
                        if (simplepeers[i].socket_id == socket_id) {
                            //console.log("adding group vals for " + simplepeers[i].socket_id);
                            simplepeers[i].peerGroup = peerGroup;
                            simplepeers[i].peerCube = peerCube;
                            simplepeers[i].geometry = peerCubeGeometry;
                            simplepeers[i].material = peerCubeMaterials;
                            simplepeers[i].materialColor = peerDefaultcolor;
                            simplepeers[i].texture = myPeerVidtexture;
                            simplepeers[i].desiredPosition = new THREE.Vector3();
                            simplepeers[i].desiredRotation = new THREE.Quaternion();
                            simplepeers[i].oldPos = peerGroup.position
                            simplepeers[i].oldRot = peerGroup.quaternion;
                            simplepeers[i].movementAlpha = 0;
                        }
                    }



                }

            }




            // update all peer canvases  
            function updatePeerTexture() {
                requestAnimationFrame(updatePeerTexture);
                for (let i = 0; i < simplepeers.length; i++) {
                    //console.log("updating textures?")
                    let myText = simplepeers[i].texture
                    if (simplepeers[i].texture) myText.needsUpdate = true;
                }


            }


            try {
                addPeerCube(this.socket_id);
            } catch (err) {
                console.log(err);
                console.log(Date.now());
            }

        });

    }

    inputsignal(sig) {
        this.simplepeer.signal(sig);
    }
}





// mapping func similar to the p5 map() found here
// https://stackoverflow.com/questions/48802987/is-there-a-map-function-in-vanilla-javascript-like-p5-js
function mapRange(value, a, b, c, d) {
    // first map value from (a..b) to (0..1)
    value = (value - a) / (b - a);
    // then map it from (0..1) to (c..d) and return it
    return c + value * (d - c);
}

// handle manipulation filters
function filters(f, data) {
    for (let i = 0; i < data.length; i += 4) {
        switch (f) {
            case 0: //normal
                data[i] = data[i];
                data[i + 1] = data[i + 1];
                data[i + 2] = data[i + 2];
                break;
            case 1: //invert
                data[i] = data[i] ^ 255;
                data[i + 1] = data[i + 1] ^ 255;
                data[i + 2] = data[i + 2] ^ 255;
                break;
            case 2: //yellow pink - weird1
                data[i] = data[i] * Math.floor(Math.random() * 255);
                data[i + 1] = data[i + 1] + Math.floor(Math.random() * 255);
                data[i + 2] = data[i + 2] ^ 255;
                break;
            case 3: //weird 2
                data[i] = data[i + 2];
                data[i + 1] = 25;
                data[i + 2] = 255;
                break;
            case 4: // threshold
                let red, green, blue;
                red = data[i] / 255;
                green = data[i + 1] / 255;
                blue = data[i + 2] / 255;
                // if (red < 0.25|| green < 0.25 || blue < 0.25) {
                if (red < Math.floor(Math.random() * 255) || green < Math.floor(Math.random() * 255) || blue < Math.floor(Math.random() * 255)) {
                    data[i + 0] = 255;
                    data[i + 1] = 255;
                    data[i + 2] = 255;
                } else {
                    data[i + 0] = 0;
                    data[i + 1] = 0;
                    data[i + 2] = 0;
                }
                break;
            case 5: // brightness
                let r = data[i];
                let g = data[i + 1];
                let b = data[i + 2];
                let brightness = (3 * r + 4 * g + b) >>> 3;
                data[i] = brightness;
                data[i + 1] = brightness;
                data[i + 2] = brightness;
                break;
        }
    }
}

// init gif canvas
initGifs();

function getLocalPlayerPosition(group, groupRotation) {

    return [
        [group.position.x, group.position.y, group.position.z],
        [groupRotation.x, groupRotation.y, groupRotation.z]
    ];
}

function gifYoSelfCubed() {
    redCubeMaterialsGifs = [
        allMaterials[9],
        allMaterials[6],
        allMaterials[7],
        allMaterials[8],
        allMaterials[5],
        allMaterials[10]
    ]
    updateCubeMaterials(redCubeMaterialsGifs);
    sendUpdatedLocalMaterial(redCubeMaterialsGifs, 1);
}


function videoCubeMesh() {
    redCubeMaterialsVideo = [
        allMaterials[5],
        allMaterials[5],
        allMaterials[5],
        allMaterials[5],
        allMaterials[5],
        allMaterials[5],
    ]
    updateCubeMaterials(redCubeMaterialsVideo);
    sendUpdatedLocalMaterial(redCubeMaterialsVideo, 2);
}

function defaultCubeMesh() {
    updateCubeMaterials(redCubeMaterials);
    sendUpdatedLocalMaterial(redCubeMaterials, 3);
}

// modified from 
// https://stackoverflow.com/questions/36223281/three-js-changing-material-on-obj-with-button-click
function updateCubeMaterials(mat) {
    redCube.traverse(function (child) {
        if (child instanceof THREE.Mesh) {
            child.material = mat;
        }
        redCube.geometry.uvsNeedUpdate = true;
        redCube.needsUpdate = true;
    });
}



let liveWebUser = cookie.get('liveWebUser');
if (!liveWebUser) {
    //prompt them to set a user if no cookie found
    liveWebUser = prompt('Choose a username:');
    if (!liveWebUser) {
        alert('Something\'s wrong here');
    } else {
        // set cookie for username
        cookie.set('liveWebUser', liveWebUser);
        //  console.log("set liveWebUser = " + liveWebUser);
    }
}

let chatOpen = false;

function openRightMenu() {
    if (chatOpen == false) {
        document.getElementById("rightMenu").style.display = "block";
        chatOpen = true;

    } else {
        document.getElementById("rightMenu").style.display = "none";
        chatOpen = false;

    }
}

function closeRightMenu() {
    document.getElementById("rightMenu").style.display = "none";
    chatOpen = false;

}

let width = window.innerWidth;
let heightMinusBtm;
let messagesHeightjq = $('#messages').height();

let messagesHeightAdj = () => {
    if (width > 499) heightMinusBtm = $(window).height() - 100;
    else heightMinusBtm = $(window).height() - 150;
    //console.log(heightMinusBtm);
    if ($('#messages').height() > heightMinusBtm) $('#messages').css('height', heightMinusBtm);
}

$(document).ready(function () {
    messagesHeightAdj();
    if (messagesHeightjq > 50) console.log('messagesHeight = ' + messagesHeight +
        ' messagesHeightjq = ' + messagesHeightjq);
});

$(window).resize(function () {
    messagesHeightAdj();
});