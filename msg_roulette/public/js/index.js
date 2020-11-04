let canvas, ctx, video, myImage, myImage2, myVideo, rouletteRow, rouletteBtn, stopBtn;
		let canvasWidth = 480;
		let canvasHeight = 360;
		let myNewHeight, stopImg, orecord, text, counter, recordingCounter, newText;
		let recordedCount = 0;
		var folder = "stills/";
		var roulDiv, imgCount;

		// Setup and Record using MediaRecorder for 2 seconds
		function startMediaRecorder(streamToRecord) {
			startStillRecord(mystream);
			// This array will contain "chunks" of the video captured by the MediaRecorder
			var chunks = [];

			// Give the MediaRecorder the stream to record
			var mediaRecorder = new MediaRecorder(streamToRecord);

			// This is an event listener for the "stop" event on the MediaRecorder
			// Probably should write it:
			// mediaRecorder.addEventListener('stop', function(e) { ... });    
			mediaRecorder.onstop = function (e) {
				console.log("stop");

				// Create a new video element on the page
				video = document.createElement('video');
				video.controls = true;

				// Create a blob - Binary Large Object of type video/webm
				var blob = new Blob(chunks, {
					'type': 'video/webm'
				});

				// Generate a URL for the blob
				var videoURL = window.URL.createObjectURL(blob);
				// Make the video element source point to that URL
				video.src = videoURL;

				// Send to server - if you want to store it there
				socket.emit('video', blob);
			};

			// Another callback/event listener - "dataavailable"
			mediaRecorder.ondataavailable = function (e) {
				console.log("data");
				// Whenever data is available from the MediaRecorder put it in the array
				chunks.push(e.data);
			};

			// Start the MediaRecorder
			mediaRecorder.start();


			// After 2 seconds, stop the MediaRecorder
			setTimeout(function () {
				mediaRecorder.stop();
				// startStillRecord(mystream);
				if (recordedCount > 0) hdrMsg.innerHTML = "Record Again or Roulette Message";

			}, 10000);

			// if (recordedCount > 0) hdrMsg.innerHTML = "Record or Recieve Roulette Message";

		}

		// Setup and Record using MediaRecorder for 2 seconds
		function startStillRecord(streamToRecord) {
			canvas.width = myVideo.videoWidth;
			canvas.height = myVideo.videoHeight;
			ctx.drawImage(myVideo, 0, 0, canvas.width, canvas.height);

			let newImgSrc, url;

			canvas.toBlob(function (blob) {
				newImg = document.createElement('img');
				newImg.id = "newImg";
				url = URL.createObjectURL(blob);

				newImg.src = url;
				document.body.appendChild(newImg);
				newImgSrc = document.getElementById("newImg").src;

			});

			let myStill = canvas.toDataURL('image/png');
			myImage.src = myStill;

			var jpegFile64 = myStill.replace(/^data:image\/(png|jpeg);base64,/, "");
			var jpegBlob = base64ToBlob(jpegFile64, 'image/jpeg');

			socket.emit('still', jpegBlob);

		}

		// https://stackoverflow.com/questions/50537735/convert-blob-to-image-file
		function base64ToBlob(base64, mime) {
			mime = mime || '';
			var sliceSize = 1024;
			var byteChars = window.atob(base64);
			var byteArrays = [];

			for (var offset = 0, len = byteChars.length; offset < len; offset += sliceSize) {
				var slice = byteChars.slice(offset, offset + sliceSize);

				var byteNumbers = new Array(slice.length);
				for (var i = 0; i < slice.length; i++) {
					byteNumbers[i] = slice.charCodeAt(i);
				}

				var byteArray = new Uint8Array(byteNumbers);

				byteArrays.push(byteArray);
			}

			return new Blob(byteArrays, {
				type: mime
			});
		}

		// This is mostly from the week 5 example except the buttons to do the recording for us and each peer

		let simplepeers = [];
		var socket;
		var mystream;
		// let imgHeight = 120;
		let imgHeight = 300;

		window.addEventListener('load', function () {
			// This kicks it off
			initCapture();
		});

		// button count down text - modified from jquery to vanillajs 
		// jquery version https://stackoverflow.com/questions/27001664/how-do-make-a-count-down-inside-the-button
		function timer() {
			if (counter == 5) {
				orecord.value = text + ' in ' + counter;
				counter--;
			}
			setTimeout(function () {
				orecord.value = text + ' in ' + counter;
				// orecord.getAtrribute('data-delay', counter);
				if (counter == 0) {
					next();
				} else {
					counter--;
					timer();
				}
			}, 1000);
		}

		function next() {
			orecord.value = 'Recording!';
			newText = orecord.value;
			timer2();
		}

		function timer2() {
			if (recordingCounter == 10) {
				orecord.value = newText + ' for ' + recordingCounter;
				recordingCounter--;
			}
			setTimeout(function () {
				orecord.value = newText + ' for ' + recordingCounter;
				if (recordingCounter == 0) {
					done();
				} else {
					recordingCounter--;
					timer2();
				}
			}, 1000);
		}

		function done() {
			orecord.value = 'done';
			rouletteBtn.style.display = "inline-block";
			rouletteBtn.disabled = false;
			setTimeout(function () {
				orecord.value = 'record';
				counter = 5;
				recordingCounter = 10;
			}, 2500)
		}
		// end button count down

		function initCapture() {
			console.log("initCapture");

			hdrMsg = document.getElementById('hdrMsg');

			// set canvas elements
			canvas = document.getElementById('canvas');
			ctx = canvas.getContext('2d');

			myImage = document.getElementById('myImg');
			rouletteBtn = document.getElementById('rouletteBtn');
			rouletteBtn.addEventListener('click', runImgRoulette);

			rouletteRow = document.getElementById('roulette_row');

			startBtn = document.getElementById('startBtn');
			startBtn.addEventListener('click', function () {
				stopImg = Math.floor(Math.random() * imgCount);
				defaultProperty.originalStopImageNumber = stopImg;
				console.log("got new number " + stopImg);

			});

			stopBtn = document.getElementById('stopBtn');
			stopBtn.addEventListener('click', function () {
				setLastImg();
				let rouletteDiv = document.getElementById('rouletteDiv');
				rouletteDiv.prepend(myMovieMsg);
				rouletteDiv.style.border = "thick solid pink";
				console.log("why aren't I working?");
				
			});

			// The video element on the page to display the webcam
			// let video = document.getElementById('myvideo');
			myVideo = document.getElementById('myvideo');

			// Constraints - what do we want?
			let constraints = {
				audio: true,
				video: {
					width: 400,
					height: 300,
					aspectRatio: 4 / 3
				}
			}

			// Prompt the user for permission, get the stream
			navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
					/* Use the stream */

					// Global object
					mystream = stream;

					// Attach to our video object
					myVideo.srcObject = stream;

					// Wait for the stream to load enough to play
					myVideo.onloadedmetadata = function (e) {
						myVideo.play();
					};

					// Setup button to record this stream
					orecord = document.getElementById("myvideorbutton");

					text = 'record';
					counter = 5;
					recordingCounter = 10;
					newText;

					orecord.addEventListener('click', function () {
						hdrMsg.innerHTML = "Record a 10 Second Message";
						recordedCount++;
						timer();
						setTimeout(function () {
							startMediaRecorder(stream);
						}, 5000)
						if (recordedCount > 0) {
							rouletteRow.style.top = "-1000px";
							startBtn.style.display = "none";
							stopBtn.style.display = "none";
							rouletteBtn.style.display = "none";
						}
						
					});

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
				console.log("Socket Connected");
				console.log("My socket id: ", socket.id);

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
						simplepeers.splice(i, 1);
						// Should also remove video from page
						document.getElementById(data).remove();
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
						// let simplepeer = new SimplePeerWrapper(
						// 	true, data[i], socket, mystream
						// );

						// // Push into our array
						// simplepeers.push(simplepeer);
					}
				}
			});

		}
		
		// var folder = "stills/";
		// var roulDiv, imgCount;

		function runImgRoulette() {
			if (!roulDiv) console.log("I don't have a rouletteDiv");
			else roulDiv.remove();

			rouletteRow.style.position = "relative";
			rouletteRow.style.top = "-359px";
			roulDiv = document.createElement("div");
			roulDiv.id = 'rouletteDiv';
			roulDiv.classList.add('roulette');
			roulDiv.style.display = "none";
			rouletteBtn.disabled = true;
			let roulCtnr = document.getElementById('roulette_container');

			roulCtnr.appendChild(roulDiv);

			// ajax call to load imgs from dir from here https://stackoverflow.com/questions/18480550/how-to-load-all-the-images-from-one-of-my-folder-into-my-web-page-using-jquery
			imgCount = 0;
			$.ajax({
				url: folder,
				success: function (data) {
					$(data).find("a").attr("href", function (i, val) {
						if (val.match(/\.(jpe?g|png|gif)$/)) {
							// $("body").append("<img src='" + folder + val + "'>");
							$(".roulette-inner").append("<img id='" + imgCount + "'src='" + val +
								"' style='display:block'>");
							imgCount++
						}
					});
					console.log(imgCount);


				},
				complete: function () {

					myNewHeight = imgHeight * imgCount;
					console.log("myNewHeight " + myNewHeight);
					
					//roulette(imgCount);	
					//roulSettings();
				}

			});

			roulette();
			roulSettings();
			startBtn.click();

			startBtn.disabled = true;
			startBtn.style.display = "inline-block";
			stopBtn.style.display = "inline-block";
			//stopBtn.disabled = true;

		}