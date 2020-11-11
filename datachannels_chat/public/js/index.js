let simplepeers = [];
var socket;
var mystream;

let sendDataButton;
let dataInput;
let dataDiv;
let chatArray = [];
let chatSelect;
let chatSelectVal = 'all';
let chatOptions = [];

let privateMsg = false;
let happyTreesVid;

let colorsOpen = false;
let showLocalCss = false;

let help;

// check cookies for user name
let liveWebUser = cookie.get('liveWebUser');
if (!liveWebUser) {
    //prompt them to set a user if no cookie found
    liveWebUser = prompt('Choose a username:');
    if (!liveWebUser) {
        alert('Something\'s wrong here');
    } else {
        // set cookie for username
        cookie.set('liveWebUser', liveWebUser);
    }
}


window.addEventListener('load', function () {
    chatSelect = document.getElementById("users");
    // This kicks it off
    //initCapture();

    setupSocket();

    setupGUI();


});

function initCapture() {
    console.log("initCapture");

    // The video element on the page to display the webcam
    let video = document.getElementById('myvideo');

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

            // Attach to our video object
            video.srcObject = stream;

            // Wait for the stream to load enough to play
            video.onloadedmetadata = function (e) {
                video.play();
            };

            // Now setup socket
            setupSocket();
        })
        .catch(function (err) {
            /* Handle the error */
            alert(err);
        });
}

function setupSocket() {
    socket = io.connect();

    socket.on('connect', function () {
        console.log("Socket Connected**");
        console.log("My socket id: ", socket.id);

        // send localUser name to server.
        socket.emit('setUser', liveWebUser, socket.id);

        // Tell the server we want a list of the other users
        socket.emit('list');

    });

    socket.on('disconnect', function (data) {
        console.log("Socket disconnected");
    });

    socket.on('peer_disconnect', function (data) {
        console.log("simplepeer has disconnected " + data);
        for (let i = 0; i < simplepeers.length; i++) {
            if (simplepeers[i].socket_id == data) {
                console.log("Removing simplepeer: " + i);
                console.log("chatUser to remove = " + chatSelect.options[i + 2].value);
                let removeChatSelect = chatSelect.options[i + 2].value;
                removeChatSelectOption(removeChatSelect);
                simplepeers.splice(i, 1);

            }
        }
    });

    // Receive listresults from server
    socket.on('listresults', function (data, dataNames) {

        for (let i = 0; i < data.length; i++) {
            // Make sure it's not us
            if (data[i] != socket.id) {
                // create a new simplepeer and we'll be the "initiator"			
                let simplepeer = new SimplePeerWrapper(
                    true, data[i], socket, mystream, receivedStream, receivedData, dataNames[i],
                    privateMsg
                );
                // Push into our array
                simplepeers.push(simplepeer);
            }

        }
        updateChatSelect();

    });

    socket.on('signal', function (to, from, data, rUser) {

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
                false, from, socket, mystream, receivedStream, receivedData, rUser, privateMsg
            );

            // Push into our array
            simplepeers.push(simplepeer);

            // Tell the new simplepeer that signal
            simplepeer.inputsignal(data);
        }
        updateChatSelect();
    });

    chatSelect.addEventListener('change', function () {
        // console.log("private msg to " + chatSelect.value);
        chatSelectVal = chatSelect.value;
        if (chatSelectVal != 'all') privateMsg = true;
        else privateMsg = false;

    })

}


function updateChatSelect() {
    console.log("update chat select");

    // iterate through options 	
    Array.from(chatSelect.options).forEach(function (option_element) {
        let option_text = option_element.text;
        let option_value = option_element.value;
        let is_option_selected = option_element.selected;
        let optionInArray = chatOptions.includes(option_value);
        if (!optionInArray) chatOptions.push(option_value);

        // console.log('Option Value : ' + option_value);

    });

    for (let i = 0; i < simplepeers.length; i++) {
        let chatUser = simplepeers[i].user;
        let optionAlready = chatOptions.includes(chatUser);
        if (!optionAlready) {
            let el = document.createElement("option");
            el.textContent = chatUser;
            el.value = chatUser;
            chatSelect.appendChild(el);
        }
    }

    // console.log(JSON.stringify(chatOptions));

}

function removeChatSelectOption(elem) {
    let myIndex = chatOptions.indexOf(elem);
    console.log("myIndex = " + myIndex + " elem = " + elem);
    chatSelect.options[myIndex].remove();
    chatOptions.splice(myIndex, 1);

}


// Whenever we get a stream from a peer
function receivedStream(stream, simplePeerWrapper) {
    let ovideo = document.createElement("VIDEO");
    ovideo.id = simplePeerWrapper.socket_id;
    ovideo.srcObject = stream;
    ovideo.muted = true;
    ovideo.onloadedmetadata = function (e) {
        ovideo.play();
    };
    document.body.appendChild(ovideo);
    console.log(ovideo);
}

// Whenever we get data from a peer
function receivedData(theData, simplePeerWrapper) {

    let recdData = JSON.parse(theData);

    colorActions(recdData.data)

    let recdMsg;

    if (recdData.prv) {
        console.log("rec private msg");
        recdMsg = "<br><div class=\"remotemsg\"><span class=\"user\">" + simplePeerWrapper.user + "</span>: " +
            recdData.data + "<span class=\"private_msg\"> pvtmsg</span></div>";
    } else {
        console.log("rec public msg");
        recdMsg = "<br><div class=\"remotemsg\"><span class=\"user\">" + simplePeerWrapper.user + "</span>: " +
            recdData.data + "</div>";
    }
    let msgDiv = document.createElement('div');
    let tempId = simplePeerWrapper.socket_id + "_" + Math.floor(Math.random() * 10);
    msgDiv.id = tempId;
    dataDiv = document.getElementById('data');
    msgDiv.innerHTML = recdMsg;

    dataDiv.appendChild(msgDiv);
    dataDiv.scrollTop = dataDiv.scrollHeight;
}

// When the button is clicked - send it to everyone we are connected to
function sendData(data) {
    let myLocalMsg;
    if (chatSelectVal != 'all') {
        let userIndex = simplepeers.findIndex(u => u.user == chatSelectVal);

        let prvData = {
            data: data,
            prv: true
        };
        let stringPrvData = JSON.stringify(prvData);

        simplepeers[userIndex].sendData(stringPrvData, liveWebUser);
        myLocalMsg = "<br><div class=\"localmsg\"><span class=\"user\">" + liveWebUser + "</span>: " + prvData
            .data +
            "<span class=\"private_msg\"> pvtmsg to: " + chatSelectVal + "</span></div>";

    } else {
        for (let i = 0; i < simplepeers.length; i++) {
            let pubData = {
                data: data,
                prv: false
            }

            let stringPubData = JSON.stringify(pubData);

            simplepeers[i].sendData(stringPubData, liveWebUser);
            myLocalMsg = "<br><div class=\"localmsg\"><span class=\"user\">" + liveWebUser + "</span>: " +
                pubData
                .data + "</div>";

        }
    }
    let msgDiv = document.createElement('div');
    let tempId = socket.id + "_" + Math.floor(Math.random() * 2);
    msgDiv.id = tempId;
    dataDiv = document.getElementById('data');
    msgDiv.innerHTML = myLocalMsg;
    dataDiv.appendChild(msgDiv);
    dataDiv.scrollTop = dataDiv.scrollHeight;
    if (showLocalCss) colorActions(data);
}

function colorActions(msgData) {

    let inColors = CSS_COLOR_NAMES.includes(msgData);

    if (inColors) {

        function rmHappyTrees() {
            if (happyTreesVid) happyTreesVid.remove();
        }

        function setCss(img, color, bgSize) {
            document.body.style.backgroundImage = "url('')";
            document.body.style.backgroundImage = "url('images/" + img + "')";
            // document.body.style.color = color;
            document.body.style.backgroundSize = bgSize;
        }

        if (msgData == 'blue') {
            rmHappyTrees();
            setCss("nyan_cat_graybg.gif", "#ffffff");

        } else if (msgData == 'orange') {
            rmHappyTrees();
            setCss("trump_fired.jpg", "#000", "fill");
            document.body.style.backgroundRepeat = "repeat";
        } else if (msgData == 'white') {
            setCss("", "#000");
            rmHappyTrees();
        } else if (msgData == 'purple') {
            rmHappyTrees();
            setCss("itp_large.jpg", "#000", "contain");
            document.body.style.backgroundRepeat = "no-repeat";
        } else if (msgData == 'turquoise') {
            rmHappyTrees();
            setCss("beach_turquoise.gif", "#000", "cover");
        } else if (msgData == 'green') {
            rmHappyTrees();
            setCss("homer_green.gif", "#FFF", "cover");
        } else if (msgData == 'red') {
            rmHappyTrees();
            setCss("this_is_fine_yellow.gif", "#000", "cover");
        } else if (msgData == 'yellow') {
            rmHappyTrees();
            setCss("magic.gif", "#fff", "fill");
            document.body.style.backgroundRepeat = "repeat";
        } else if (msgData == 'grey') {
            rmHappyTrees();
            setCss("shaq_gray.gif", "#000", "cover");
        } else if (msgData == 'lime') {
            document.body.style.backgroundImage = "url('')";
            happyTreesVid = document.createElement('video');
            happyTreesVid.src = 'videos/happy_trees.mp4';
            happyTreesVid.id = 'happyTrees';
            document.body.appendChild(happyTreesVid);
            happyTreesVid.controls = true;
            happyTreesVid.muted = true;
            happyTreesVid.play();
            document.body.style.color = "#ffffff";
        } else {
            document.body.style.backgroundImage = "url('')";
            document.body.style.color = "#000";
            document.body.style.backgroundColor = msgData;
            setTimeout(function () {
                document.body.style.backgroundColor = "white";
            }, 100);
        }

    } else {
        document.body.style.backgroundColor = "BlueViolet";
        setTimeout(function () {
            document.body.style.backgroundColor = "white";
        }, 100);

    }
}

// Register listeners to the HTML Elements
function setupGUI() {
    sendDataButton = document.getElementById("sendDataButton");
    dataInput = document.getElementById("dataInput");
    help = document.getElementById('help');
    help.addEventListener('click', showTooltips);

    sendDataButton.addEventListener('click', function () {
        sendData(dataInput.value);
        for (let i = 0; i < simplepeers.length; i++) {
            console.log(simplepeers[i].user);
        }
        dataInput.value = '';
    });
    tabSubmit();

}

function openRightMenu() {
    if (colorsOpen == false) {
        document.getElementById("colorsSection").style.display = "block";
        colorsOpen = true;
    } else {
        document.getElementById("colorsSection").style.display = "none";
        colorsOpen = false;
    }
}

function closeRightMenu() {
    document.getElementById("colorsSection").style.display = "none";
    colorsOpen = false;
}

function showLocal() {
    var checkBox = document.getElementById("localCheck");
    //var text = document.getElementById("text");
    if (checkBox.checked == true) {
        showLocalCss = true;
    } else {
        showLocalCss = false;
    }
}


function tabSubmit() {
    if (dataInput) {
        console.log("we have a myMessageBox object");
        dataInput.addEventListener('keyup', function (e) {
            if (e.keyCode === 13 || e.keyCode === 9) {
                console.log("msg sent from enter key from input");
                //sendmessage(document.getElementById('message').value);
                sendData(dataInput.value);
                dataInput.value = '';
            }
        })
    } else console.log("no myMessageBox object");
}

// A wrapper for simplepeer as we need a bit more than it provides
class SimplePeerWrapper {

    constructor(initiator, socket_id, socket, stream, streamCallback, dataCallback, user, pvr) {
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

        // Callback for when we get a stream from a peer
        this.streamCallback = streamCallback;

        // Callback for when we get data form a peer
        this.dataCallback = dataCallback;

        // localUser to send
        this.user = user;

        // is this a private msg
        this.pvr = pvr

        // simplepeer generates signals which need to be sent across socket
        this.simplepeer.on('signal', data => {
            this.socket.emit('signal', this.socket_id, this.socket.id, data, liveWebUser, pvr);
            // console.log('signal', this.socket_id, this.socket.id, data, liveWebUser, pvr);
        });

        // When we have a connection, send our stream
        this.simplepeer.on('connect', () => {
            console.log('CONNECT')
            console.log(this.simplepeer);
            updateChatSelect();
            //p.send('whatever' + Math.random())

            // Let's give them our stream
            // this.simplepeer.addStream(stream);
            // console.log("Send our stream");
        });

        // Stream coming in to us
        // this.simplepeer.on('stream', stream => {
        // 	console.log('Incoming Stream');
        // 	streamCallback(stream, this);
        // });

        this.simplepeer.on('data', data => {
            dataCallback(data, this);
            // console.log(data, user);
        });


    }

    inputsignal(sig) {
        this.simplepeer.signal(sig);
    }

    sendData(data) {
        this.simplepeer.send(data);
    }



}