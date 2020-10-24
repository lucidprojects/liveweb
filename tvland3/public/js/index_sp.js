 let canvas, ctx;
 let canvasBack, cbCtx;
 let mappedY, mappedX, mappedT;
 let isMouseDown = false;
 let isDragging = false;
 let x = 0;
 let y = 0;
 let filterMode = 0;

 let cw, ch;

 let simplepeers = [];
 var socket;
 var mystream;
 var canvasStream, audioStream, videoStream, myCstream;

 // wait for window to load
 window.addEventListener('load', function () {

     // set up video, canvas, buttons
     let myVideo = document.getElementById('myVideo');
     let canvas = document.getElementById('canvas');
     let ctx = canvas.getContext('2d');

     let canvasBack = document.getElementById('canvasBack');
     var cbCtx = canvasBack.getContext('2d');

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

     let localtv = document.getElementById('local_tv_ctnr');
     localtv.addEventListener('click', dragElement(localtv));

     // set up some initial canvas vars
     cw = myVideo.clientWidth;
     ch = myVideo.clientHeight;
     canvas.width = cw;
     canvas.height = ch;
     canvasBack.width = cw;
     canvasBack.height = ch;

     // set up some initial Media Stream vars - these are important to happen before we getUserMedia
     canvasStream = canvas.captureStream(25); // 25 FPS
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
         // Start over!
         setTimeout(function () {

             draw(v, c, bc, w, h);
         }, 0);
     }

     // Constraints - what do we want?
     let constraints = {
         audio: true,
         video: true
     }

     // Prompt the user for permission, get the stream
     navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
             /* Use the stream */

             // Global object
             mystream = stream;

             // separate audio and video so we can add audio to canvas prior to streaming to peers    
             audioStream = new MediaStream(stream.getAudioTracks());
             videoStream = new MediaStream(stream.getVideoTracks());

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
         })
         .catch(function (err) {
             /* Handle the error */
             alert(err);
         });

     function checkMyVidLoaded() {
         myVideo.addEventListener('play', function () {
             draw(myVideo, ctx, cbCtx, cw, ch);
         }, false);
     }

     // mapping func similar to the p5 map() found here
     // https://stackoverflow.com/questions/48802987/is-there-a-map-function-in-vanilla-javascript-like-p5-js
     function mapRange(value, a, b, c, d) {
         // first map value from (a..b) to (0..1)
         value = (value - a) / (b - a);
         // then map it from (0..1) to (c..d) and return it
         return c + value * (d - c);
     }

     // check mouse events and pos for manipulations
     canvas.addEventListener('mousedown', e => {
         x = e.offsetX;
         y = e.offsetY;
         isMouseDown = true;

     });

     canvas.addEventListener('mousemove', e => {
         if (isMouseDown === true && isDragging == false) {
             x = e.offsetX;
             y = e.offsetY;
             mappedY = mapRange(e.clientY, 0, canvas.height, 0, 255);
             mappedX = mapRange(e.clientX, 0, canvas.width, 0, 255);
             mappedT = mapRange(e.clientX, 0, canvas.width, 0, 0.9);
         }
     });

     window.addEventListener('dblclick', e => {
         if (isMouseDown === true) {
             x = 0;
             y = 0;
             isMouseDown = false;
         }
     });

 });


 function setupSocket() {
     socket = io.connect();

     socket.on('connect', function () {
         console.log("Socket Connected**");
         console.log("My socket id: ", socket.id);

         // Tell the server we want a list of the other users
         socket.emit('list');
     });

     socket.on('disconnect', function (data) {
         console.log("Socket disconnected");
     });

     socket.on('peer_disconnect', function (data) {
         console.log("simplepeer has disconnected " + data);
         document.getElementById(data).remove();

         //  let tempDiv = document.getElementById(data);
         //  console.log("going to remove " + tempDiv); 
         //  tempDiv.remove();

         for (let i = 0; i < simplepeers.length; i++) {
             if (simplepeers[i].socket_id == data) {
                 console.log("Removing simplepeer: " + i);
                 simplepeers.splice(i, 1);
                 // doesn't always remove on page refresh
                 // document.getElementById(data).remove();
             }
         }
     });

     // Receive listresults from server
     socket.on('listresults', function (data) {
         console.log(data);
         for (let i = 0; i < data.length; i++) {
             // Make sure it's not us
             if (data[i] != socket.id) {

                 // create a new simplepeer and we'll be the "initiator"			
                 let simplepeer = new SimplePeerWrapper(
                     // true, data[i], socket, mystream 
                     true, data[i], socket, myCstream // send combined stream
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
                 false, from, socket, myCstream // send combined stream
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

     constructor(initiator, socket_id, socket, stream) {
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
             newDiv.style.position = "absolute";
             newDiv.style.width = randomWidth;
             newDiv.style.height = randomWidth / 2;
             newDiv.style.top = midX;
             newDiv.style.left = midY;

             document.getElementById(this.socket_id).appendChild(ovideo);

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
             let randomInt = Math.floor((Math.random() * 3) + 1);
             tvImage.src = 'tvs/tv' + randomInt + '.png';
             tvImage.className = 'peerTvImg' + randomInt;
             document.getElementById(this.socket_id).appendChild(tvImage);

             //resize not working! - tried applying to both div and video
             //document.getElementById(this.socket_id).style.resize = "both";

             // make the new pearTv draggable
             dragElement(document.getElementById(this.socket_id));
         });

     }

     inputsignal(sig) {
         this.simplepeer.signal(sig);
     }

 }

 //https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_draggable
 function dragElement(elmnt) {


     let pos1 = 0,
         pos2 = 0,
         pos3 = 0,
         pos4 = 0;

     elmnt.onmousedown = dragMouseDown;

     function dragMouseDown(e) {

         e = e || window.event;
         e.preventDefault();
         pos3 = e.clientX;
         pos4 = e.clientY;

         document.onmouseup = closeDragElement;
         document.onmousemove = elementDrag;
     }

     function elementDrag(e) {
         isDragging = true;
         e = e || window.event;
         e.preventDefault();
         pos1 = pos3 - e.clientX;
         pos2 = pos4 - e.clientY;
         pos3 = e.clientX;
         pos4 = e.clientY;

         elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
         elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
     }

     function closeDragElement() {
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