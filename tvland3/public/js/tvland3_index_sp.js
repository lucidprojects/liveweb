let canvas, ctx;
let canvasBack, cbCtx;
let canvasSml, cSmlCtx;
let mappedY, mappedX, mappedT, mappedR, mappedS, mappedScale, mappedRotate;

let isMouseDown = false;
let isDragging = false;
let x = 0;
let y = 0;
let filterMode = 0;

let cw, ch;

let simplepeers = [];
var socket;
var myMessageBox;
var chatArray = [];
var messegesWindow;


var mystream;
var canvasStream, audioStream, videoStream, myCstream;
var isMuted = true;
var doRotate = false;
var doScale = false;

let localtv, myLocalId;

let angle = 90;

// wait for window to load
window.addEventListener('load', function () {
    // var messagesHeight = document.getElementById('messages').clientHeight;
    
    // modified code from https://www.smashingmagazine.com/2018/01/drag-drop-file-uploader-vanilla-js/
    // set up element to drag to
    var dropRegion = document.getElementById("drop-region");

    function preventDefault(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    dropRegion.addEventListener('dragenter', preventDefault, false)
    dropRegion.addEventListener('dragleave', preventDefault, false)
    dropRegion.addEventListener('dragover', preventDefault, false)
    dropRegion.addEventListener('drop', preventDefault, false)

    function handleDrop(e) {
        var dt = e.dataTransfer,
            files = dt.files;

        if (files.length) {

            handleFiles(files);

        } else {
            // check for img
            var html = dt.getData('text/html'),
                match = html && /\bsrc="?([^"\s]+)"?\s*/.exec(html),
                url = match && match[1];
        }

    }

    dropRegion.addEventListener('drop', handleDrop, false);

    function handleFiles(files) {
        for (var i = 0, len = files.length; i < len; i++) {
            if (validateImage(files[i]))
                previewAnduploadImage(files[i]);
        }
    }

    function validateImage(image) {
        // check the type
        var validTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (validTypes.indexOf(image.type) === -1) {
            alert("Invalid File Type");
            return false;
        }

        // check the size
        var maxSizeInBytes = 10e6; // 10MB
        if (image.size > maxSizeInBytes) {
            alert("File too large");
            return false;
        }

        return true;

    }

    function previewAnduploadImage(image) {

        // read the image...
        var reader = new FileReader();
        reader.onload = function (e) {
            // img.src = e.target.result;

            // set the dragged in image as the background
            dropRegion.style.backgroundImage = "url(" + e.target.result + ")";
        }
        reader.readAsDataURL(image);

    }
    // set up video, canvas, buttons
    let myVideo = document.getElementById('myVideo');
    let canvas = document.getElementById('canvas');
    let ctx = canvas.getContext('2d');

    let canvasBack = document.getElementById('canvasBack');
    var cbCtx = canvasBack.getContext('2d');

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
    let threshBtn = document.getElementById('threshBtn');
    threshBtn.addEventListener('click', function () {
        filterMode = 4
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

    // hide your view
    let showMeBtn = document.getElementById('showMe');
    showMeBtn.addEventListener('click', showHideSelf);

    let hideBtn = document.getElementById('hideBtn');
    hideBtn.addEventListener('click', showHideSelf);

    function showHideSelf() {
        if (localtv.style.display === "none") {
            localtv.style.display = "block";
            showMeBtn.style.display = "none";
        } else {
            localtv.style.display = "none";
            showMeBtn.style.display = "block";

        }

    }
    
    localtv = document.getElementById('local_tv_ctnr');
  
    messegesWindow = document.getElementById('messages');
    myMessageBox = document.getElementById('message');

    // set up some initial canvas vars
    cw = myVideo.clientWidth;
    ch = myVideo.clientHeight;
    canvas.width = cw;
    canvas.height = ch;
    canvasBack.width = cw;
    canvasBack.height = ch;
  
    // set up some initial Media Stream vars - these are important to happen before we getUserMedia
    canvasStream = canvas.captureStream(25); // 25 FPS
    // canvasSml = canvasSml.captureStream(25); // 25 FPS
    myCstream = new MediaStream;

    // simplified canvas maniuplation func from http://html5doctor.com/video-canvas-magic/
    // modified to have mulitple filters

    function draw(v, c, bc, w, h) {
        // First, draw it into the backing canvas
        bc.drawImage(v, 0, 0, w, h);
        // Grab the pixel data from the backing canvas
        var idata = bc.getImageData(0, 0, w, h);
        var data = idata.data;

        // apply filters based on filterMode set with button
        filters(filterMode, data);

        idata.data = data;
        // Draw the pixels onto the visible canvas
        c.putImageData(idata, 0, 0);

        // Draw to small canvas and scaledown for streaming
        // sc.putImageData(idata, 0, 0);
        //canvasResize(sc, 0.2);

        // Start over!
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

        // get stats on the stream
        // console.log(stream.getVideoTracks()[0].getSettings().deviceId);
        // console.log(stream.getVideoTracks()[0].getSettings().frameRate);
        // console.log(stream.getVideoTracks()[0].getSettings().height);
        // console.log(stream.getVideoTracks()[0].getSettings().width);
        // console.log(stream.getVideoTracks()[0].getSettings().frameRate);


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

    canvas.addEventListener('mousemove', e => {
        // console.log("isDragging = " + isDragging);
        if (isMouseDown === true && isDragging == false) {
            x = e.offsetX;
            y = e.offsetY;
            mappedY = mapRange(e.clientY, 0, 300, 0, 255);
            mappedX = mapRange(e.clientX, 0, 400, 0, 255);
            //   mappedT = mapRange(e.clientX, 0, canvas.width, 0, 0.9);
            mappedT = mapRange(e.clientX, 0, 400, 0, 0.9);

        }
    });

    // double click on canvas to inact pixel manipulations with mouse x,y
    canvas.addEventListener('dblclick', e => {
        if (isMouseDown === true) {
            x = 0;
            y = 0;
            isMouseDown = false;
        } else {
            x = e.offsetX;
            y = e.offsetY;
            isMouseDown = true;
        }
    });

});


// text chat funcs
var sendmessage = function (message, user) {
    // console.log("sent chatmessage: " + message);
    socket.emit('chatmessage', message, liveWebUser);
    var localMsg = "<br><div class=\"localmsg\"><span class=\"user\">" + liveWebUser + "</span>:  " + message + "</div>";
    chatArray.push(localMsg);
    updateChat();
    clearChatInput();
    $("#messages").scrollTop($("#messages")[0].scrollHeight);
    messagesHeightAdj();
};

function updateChat() {
    console.log("run update chat");
    var myChats;
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


function setupSocket() {
    socket = io.connect();

    socket.on('connect', function () {
        console.log("Socket Connected**");
        console.log("My socket id: ", socket.id);
        myLocalId = socket.id;
        tabSubmit();
        localtv.addEventListener('click', changeMe(localtv, socket.id, mappedS, mappedR));   

        // Tell the server we want a list of the other users
        socket.emit('list');
    });

    socket.on('disconnect', function (data) {
        console.log("Socket disconnected");
    });

    socket.on('chatmessage', function (data, rUser) {
        console.log("chat received from " + rUser);
        console.log("received chat msg: " + data);
        var remoteMsg = "<br><div class=\"remotemsg\"><span class=\"user\">" + rUser + "</span>: " + data + "</div>";
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
                    // true, data[i], socket, mystream 
                    true, data[i], socket, myCstream, mappedScale, mappedRotate // send combined stream
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
                // false, from, socket, mystream  
                false, from, socket, myCstream,  mappedScale, mappedRotate // send combined stream
            );

            // Push into our array
            simplepeers.push(simplepeer);

            // Tell the new simplepeer that signal
            simplepeer.inputsignal(data);
        }
    });

}


// A wrapper for simplepeer as we need a bit more than it provides
class SimplePeerWrapper {

    // updated to create objects with scale and rotate properties
    constructor(initiator, socket_id, socket, stream,  mappedScale, mappedRotate) {
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

        this.mappedScale = mappedScale;
        this.mappedRotate = mappedRotate;



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

            // Create container div, tv frame, and video objects
            let newDiv = document.createElement("div");
            let ovideo = document.createElement("VIDEO");
            let tvImage = document.createElement("img")
            let windowW = window.innerWidth / 2;
            let windowH = window.innerHeight / 2;
            let randomX = Math.floor(Math.random() * windowW) - 200;
            let randomY = Math.floor(Math.random() * windowH) - 200;
            let midX = Math.floor(Math.random() * windowW / 2);
            let midY = Math.floor(Math.random() * windowH / 2);
            let randomWidth = Math.floor(Math.random() * 200 + 200);

            document.body.appendChild(newDiv);
            newDiv.id = this.socket_id;
            newDiv.className = 'peerDiv';
            newDiv.classList.add('rotate-target');
            newDiv.style.position = "absolute";
            newDiv.style.width = randomWidth;
            newDiv.style.height = randomWidth / 2;
            newDiv.style.top = midX;
            newDiv.style.left = midY;

            let mySocketID = document.getElementById(this.socket_id);

            mySocketID.appendChild(ovideo);
            // document.getElementById(this.socket_id).appendChild(ovideo);

            //adding "video" to id to differentiate between newDiv and ovideo id
            ovideo.id = String(this.socket_id).concat("video");
            ovideo.className = 'peerTv';
            ovideo.srcObject = stream;
            ovideo.muted = false;
            ovideo.overlow = "auto";

            ovideo.onloadedmetadata = function (e) {
                ovideo.play();
            };

            //select random num for tv image frame and append to parent container
            let randomInt = Math.floor((Math.random() * 9) + 1);

            //double click existing tv to change frame
            mySocketID.addEventListener('dblclick', function () {
                console.log("I was clicked " + socket_id)
                randomInt = Math.floor((Math.random() * 9) + 1);
                console.log("my new randomInt = " + randomInt);
                tvImage.src = 'tvs/tv' + randomInt + '.png';
                tvImage.className = 'peerTvImg' + randomInt;
            })


            tvImage.src = 'tvs/tv' + randomInt + '.png';
            tvImage.className = 'tvImg';
            tvImage.className = 'peerTvImg' + randomInt;

            mySocketID.appendChild(tvImage);

            changeMe(document.getElementById(this.socket_id), this.socket_id, this.mappedScale, this.mappedRotate);

        });

    }

    inputsignal(sig) {
        this.simplepeer.signal(sig);
    }

}

// added key cmds for experemintal scale and reszie
window.addEventListener('keyup', function (e) {
    if (e.defaultPrevented) {
        return;
    }
    var key = e.key;
    if (key == 'd') {
        console.log("d is pressed");
    }
    // if (key == 'r') {
    //     doRotate = !doRotate;
    //     console.log("r is pressed doRotate =" + doRotate);
    // }
    // if (key == 's') {
    //     doScale = !doScale;
    //     console.log("s is pressed doScale =" + doScale);
    //     //scaleMe(document.getElementById(this.socket_id));
    // }

    // modified to just b c.   r & s were when I was doing it separately but it was buggy
    if (key == 'c') {
        doScale = !doScale;
        doRotate = !doRotate;
        console.log("s is pressed doScale =" + doScale + "r is pressed doRotate =" + doRotate);
        
    }
});


// mapping func similar to the p5 map() found here
// https://stackoverflow.com/questions/48802987/is-there-a-map-function-in-vanilla-javascript-like-p5-js
function mapRange(value, a, b, c, d) {
    // first map value from (a..b) to (0..1)
    value = (value - a) / (b - a);
    // then map it from (0..1) to (c..d) and return it
    return c + value * (d - c);
}

window.addEventListener('mousemove', e => {
    x = e.offsetX;
    y = e.offsetY;
    
});

//modified drag func from //https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_draggable
//updated previous drag function to allow for scale and rotate or drag
function changeMe(elem, myID, myScale, myRotate) {
    elem.onmousedown = changeMouseDown;

    let pos1 = 0,
        pos2 = 0,
        pos3 = 0,
        pos4 = 0;

    function changeMouseDown(e) {
        pos3 = e.clientX;
        pos4 = e.clientY;

        console.log("my elem is " + myID);
        e = e || window.event;
        e.preventDefault();
        document.onmouseup = closeChangeElement;
        document.onmousemove = elemChange;
    }

    function elemChange(e) {

        e = e || window.event;
        e.preventDefault();

        // getComputerStyle code from https://css-tricks.com/get-value-of-css-rotation-through-javascript/
        // this never worked I couldn't get the matrix string to split properly.
        
        let st = window.getComputedStyle(elem, null);
        let tr = st.getPropertyValue("transform");
        
        if (doRotate) {
            mappedR = mapRange(e.clientX, 0, window.innerWidth, 0, 360);

        }
        if (doScale) {
            mappedS = mapRange(e.clientY, 0, window.innerHeight, 0.01, 1.5);
        }

        for (i = 0; i < simplepeers.length; i++) {
            //console.log(simplepeers[i].socket_id);
            
            if(myID == myLocalId){
                // console.log("main TV found");
                elem.style.transform = 'scale(' + mappedS + ') rotate(' + mappedR + 'deg)';
                mappedR = '';
                mappedS = '';
            }

            if (simplepeers[i].socket_id == myID) {
                console.log("found my id = " + myID);
                simplepeers[i].mappedScale = mappedS;
                simplepeers[i].mappedRotate = mappedR;
                //console.log(simplepeers[i]);
                // elem.style.transform = 'scale(' + simplepeers[i].mappedScale + ') rotate(' + simplepeers[i].mappedRotate + 'deg)';
                elem.style.transform = 'scale(' + simplepeers[i].mappedScale + ') rotate(' + simplepeers[i].mappedRotate + 'deg)';
                mappedR = '';
                mappedS = '';
            }
        }

       //elem.style.transform = 'scale(' + mappedS + ') rotate(' + mappedR + 'deg)';

        if (!doScale && !doRotate) {
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;

            elem.style.top = (elem.offsetTop - pos2) + "px";
            elem.style.left = (elem.offsetLeft - pos1) + "px";
        }

    }

    function closeChangeElement() {
        document.onmousup = null;
        document.onmousemove = null;
        isDragging = false;
    }

}

// handle manipulation filters
function filters(f, data) {
    for (var i = 0; i < data.length; i += 4) {
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
            case 2: //yellow pink
                data[i] = data[i] * mappedX;
                data[i + 1] = data[i + 1] + mappedY;
                data[i + 2] = data[i + 2] ^ 255;
                break;
            case 3: //tint
                data[i] = data[i + 2];
                data[i + 1] = mappedY;
                data[i + 2] = mappedX;
                break;
            case 4: // threshold
                let red, green, blue;
                red = data[i] / 255;
                green = data[i + 1] / 255;
                blue = data[i + 2] / 255;
                // if (red < 0.25|| green < 0.25 || blue < 0.25) {
                if (red < mappedT || green < mappedT || blue < mappedT) {
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