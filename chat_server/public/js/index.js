 // Modified code from https://serverjs.io/tutorials/chat/ tutorial by Francisco Presencia 

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
        //  console.log("set liveWebUser = " + liveWebUser);
     }
 }

 var socket = io.connect();
 var myMessageBox
 var chatArray = [];
 var messegesWindow = document.getElementById('messages');
 
 socket.on('connect', function (connectCounter) {
     console.log("Connected");
     myMessageBox = document.getElementById('message');
     updateUserCount(connectCounter);
     tabSubmit();
 });

 socket.on('pollUsers', function (connectCounter) {
     updateUserCount(connectCounter);
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

 var sendmessage = function (message, user) {
     console.log("sent chatmessage: " + message);
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
         console.log("we have a myMessageBox object");
         myMessageBox.addEventListener('keyup', function (e) {
             if (e.keyCode === 13 || e.keyCode === 9) {
                 console.log("msg sent from enter key from input");
                 sendmessage(document.getElementById('message').value);
             }
         })
     } else console.log("no myMessageBox object");
 }

 function clearChatInput() {
     document.getElementById('message').value = '';
 }

 var updateUserCount = (connectCounter) => {
     if (!connectCounter) document.getElementById('numUsers').innerHTML = ("1 user");
     else document.getElementById('numUsers').innerHTML = (connectCounter + " users");
     console.log("you are chatting with " + connectCounter + " users");
 }