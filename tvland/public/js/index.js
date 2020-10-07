let friendTvs = [];
let canvas1, ctx1;
let ctx1Clicked = false;
let mappedY, mappedX, mappedT;
let isMouseDown = false;
let isManipulated = false;
let x = 0;
let y = 0;
let filterMode = 1;
let myId;
let mmyAudio;
let audio = new Audio(),
    i = 0;
let playlist = ["/audio/80s_ch_surfing.mp3", "/audio/90s_ch_surfing.mp3", "/audio/channel_surfing.mp3", "/audio/tv_static.mp3", "/audio/80_sitcom_flip.mp3"];

window.addEventListener('load', function () {

    // start socket
    var socket = io.connect();

    socket.on('connect', function () {
        console.log("Connected");
    });

    // set up video and canvas
    let myVideo = document.getElementById('myVideo');
    let constraints = {
        audio: false,
        video: true
    }

    canvas1 = document.getElementById('canvas1');
    ctx1 = canvas1.getContext('2d');

    let tvCanvas = document.getElementById('tvCanvas');
    let tvCtx = tvCanvas.getContext('2d');

    let background = new Image();
    background.src = "images/tv_pile_1080_trans15.png";

    background.onload = function () {
        tvCtx.drawImage(background, 0, 0);
    }

    // set up buttons
    let newImgBtn = document.getElementById('myBtn');
    newImgBtn.addEventListener('click', loadDataImg);

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


    // video stuff
    // Prompt the user for permission, get the stream
    navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
            /* Use the stream */
            // Attach to our video object
            myVideo.srcObject = stream;
            // Wait for the stream to load enough to play
            myVideo.onloadedmetadata = function (e) {
                myVideo.play();
                setup();
                draw();
            };
        })
        .catch(function (err) {
            /* Handle the error */
            alert(err);
        });


    function setup() {
        socket.emit('join', canvas1.toDataURL('image/webp', 1.0))
    }

    // draw keeps looping on setTimeout checking the ctx1Clicked boolean and emiting toDataURL accordingly
    function draw() {
        if (!ctx1Clicked) ctx1.drawImage(myVideo, 0, 0, 174, 140);
        else {
            if (isManipulated) isManipulated = false;
            window.setTimeout(drawDataToCtx1, 1);
        }
        socket.emit('image', canvas1.toDataURL('image/webp', 1.0))
        loadDataImg();
        window.setTimeout(draw, 500);

    }

    // without this func, manipulating the canvas would only get the single frame added to the canvas prior to manipulation
    function drawDataToCtx1() {
        // get canvas image again
        ctx1.drawImage(myVideo, 0, 0, 174, 140);
        // get canvas data
        let imageData = ctx1.getImageData(0, 0, canvas1.width, canvas1.height);
        // !isManipulated run selected filter
        if (!isManipulated) filters(filterMode, imageData.data);
        // set isManipulated = true so it doesn't keep flipping
        isManipulated = true;
        // clear previous canvas image
        ctx1.clearRect(0, 0, canvas1.width, canvas1.height);
        // write new imageData
        ctx1.putImageData(imageData, 0, 0);

    }

    canvas1.addEventListener('click', function () {
        ctx1Clicked = !ctx1Clicked;
        if (isManipulated) isManipulated = false;
        playRandomAudio();
    });

    // accept id, toDataURL on initial join
    socket.on("join", function (tv) {
        friendTvs.push({
            'id': tv.id,
            'toDataURL': tv.toDataURL
        });
        if (!myId) myId = tv.id;  // set myId to first socket.id received
        console.log(myId);
        playRandomAudio(); // everytime we get a new join play random track

    });

    // add id, toDataURL from other users to array
    socket.on("others", function (tv) {
        let myFriendTvsIndex = _.findLastIndex(friendTvs, {
            id: tv.id
        });
        console.log("myFriendTvsIndex = " + myFriendTvsIndex);

        // check if id already in array
        if (myFriendTvsIndex < 0 && tv.id != myId) {
            console.log("friendsTvs did not include " + tv.id + "so adding");
            friendTvs.push({
                'id': tv.id,
                'toDataURL': tv.toDataURL
            });
        }
    });

    //on each image emit event check friendsTvs array for existing user id and set accordingly.
    socket.on('image', function (data, tvsid) {
        for (let i = 0; i < friendTvs.length; i++) {
            if (_.contains(friendTvs[i], tvsid.id)) {
                friendTvs[i].toDataURL = tvsid.toDataURL;
            } //else console.log("socketID doesn't exist");
        }
    })

    // mapping func similar to the p5 map() found here
    // https://stackoverflow.com/questions/48802987/is-there-a-map-function-in-vanilla-javascript-like-p5-js
    function mapRange(value, a, b, c, d) {
        // first map value from (a..b) to (0..1)
        value = (value - a) / (b - a);
        // then map it from (0..1) to (c..d) and return it
        return c + value * (d - c);
    }

    // check mouse events and pos for manipulations
    canvas1.addEventListener('mousedown', e => {
        x = e.offsetX;
        y = e.offsetY;
        isMouseDown = true;

    });

    canvas1.addEventListener('mousemove', e => {
        if (isMouseDown === true) {
            x = e.offsetX;
            y = e.offsetY;
            mappedY = mapRange(e.clientY, 0, canvas1.height, 0, 255);
            mappedX = mapRange(e.clientX, 0, canvas1.width, 0, 255);
            mappedT = mapRange(e.clientX, 0, canvas1.width, 0, 1);
        }
    });

    window.addEventListener('dblclick', e => {
        if (isMouseDown === true) {
            x = 0;
            y = 0;
            isMouseDown = false;
        }
    });

    //loop through friendTvs array and remove disconnected socketID
    socket.on('disconnected', function (sId) {
        console.log("friendTvs length = " + friendTvs.length);
        console.log(socket.id + " has disconnected");
        let myIndex = _.findLastIndex(friendTvs, {
            id: sId
        });
        if (myIndex > -1) friendTvs.splice(myIndex, 1);
        console.log("friendTvs length = " + friendTvs.length);

        // find div by disconnected id and set back to bars
        let tempDiv = document.getElementsByClassName(sId)[0].id;
        let myDiv = document.getElementById(tempDiv);
        myDiv.style.backgroundImage = "url('/images/tvbars.gif')"; // set back to bars bg
        if (myDiv.classList.contains("tvSize")) {
            myDiv.className = ''; // clear all classes
            myDiv.classList.add("bars"); // set back to bars class

        }


    });

    // handle audio - modified audio code from here 
    // https://stackoverflow.com/questions/48802987/is-there-a-map-function-in-vanilla-javascript-like-p5-js
    // play next track if it plays all the way through
    audio.addEventListener('ended', function () {
        i = ++i < playlist.length ? i : 0;
        console.log(i)
        audio.src = playlist[i];
        audio.play();
    }, true);

    audio.volume = 1.0;
    audio.loop = false;

    function playRandomAudio() {
        myAudio = Math.floor(Math.random() * 5);
        console.log("myAudio =" + myAudio);
        audio.src = playlist[myAudio];
        audio.play();

    }

})

// add toDataURL images to tvs
function loadDataImg() {
    for (let i = 1; i < friendTvs.length; i++) {
        let tempDiv = document.getElementById('image' + i);
        tempDiv.style.backgroundImage = "url('" + friendTvs[i].toDataURL + "')";
        if (tempDiv.classList.contains("bars")) {
            tempDiv.classList.remove("bars");
            tempDiv.classList.add("tvSize");
            tempDiv.classList.add(friendTvs[i].id);
        }

    }
}

// handle manipulation filters
function filters(f, data) {
    for (var i = 0; i < data.length; i += 4) {
        switch (f) {
            case 1:
                data[i] = data[i] ^ 255;
                data[i + 1] = data[i + 1] ^ 255;
                data[i + 2] = data[i + 2] ^ 255;
                break;
            case 2:
                data[i] = data[i] * mappedX;
                data[i + 1] = data[i + 1] + mappedY;
                data[i + 2] = data[i + 2] ^ 255;
                break;
            case 3:
                data[i] = data[i + 2];
                data[i + 1] = mappedY;
                data[i + 2] = mappedX;
                break;
            case 4:
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

        }
    }
}