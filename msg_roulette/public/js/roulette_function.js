var defaultSettings;
var defaultProperty = {
			originalStopImageNumber : null,
			totalHeight : 3000
			};

var myMovieMsg;
var vidHeight = 300;

var setLastImg = function() {
			// let myResetHeight = (imgHeight * stopImg) + imgHeight;
			let myResetHeight = imgHeight * stopImg;
			// console.log('myResetHeight ' + myResetHeight);
			let myElem = document.getElementsByClassName('roulette-inner')[0];
			myElem.style.transform = 'translate(0px, -' + myResetHeight + 'px';
			// console.log("ran js style update");

			let myMovieElem = document.getElementById(stopImg).src;
			let myMovieSrc = myMovieElem.split('/stills/');
			// console.log(myMovieSrc[1]);	
			let myMovie = myMovieSrc[1].split('.png');
			// console.log(myMovie);
			
			let myMovieUrl = "videos/" + myMovie[0] + ".webm";

			myMovieMsg = document.createElement('video');
			myMovieMsg.src = myMovieUrl;
			myMovieMsg.id = 'myMovieMsg' + stopImg;
			myMovieMsg.classList.add('movieMsgClass');
			myMovieMsg.setAttribute("controls","controls")   
			
			let rouletteDiv = document.getElementById('rouletteDiv');

			setTimeout( function(){
				rouletteDiv.prepend(myMovieMsg);

			}, 1500)


			// let myMovieSrc = myMovieElem.src();

			console.log("play video from id = " + stopImg + " myMovie = '/videos/" + myMovie[0] + ".webm'");
		}



function roulette(imgCnt){

	var Roulette = function(options) {
		defaultSettings = {
			maxPlayCount : null, // x >= 0 or null
			speed : 10, // x > 0
			stopImageNumber : null, // x >= 0 or null or -1
			rollCount : 3, // x >= 0
			duration : 3, //(x second)
			totalHeight : 3000,
			stopCallback : function() {
			},
			startCallback : function() {
			},
			slowDownCallback : function() {
			}
		}


	defaultProperty = {
			playCount : 0,
			$rouletteTarget : null,
			// imageCount : imgCnt,
			imageCount : null,
			$images : null,
			originalStopImageNumber : null,
			//totalHeight : null,
			// totalHeight : imgCnt * 120,
			//totalHeight : 1680,
			
			topPosition : 0,

			maxDistance : null,
			slowDownStartDistance : null,

			isRunUp : true,
			isSlowdown : false,
			isStop : false,

			distance : 0,
			runUpDistance : null,
			slowdownTimer : null,
			isIE : navigator.userAgent.toLowerCase().indexOf('msie') > -1 // TODO IE
		}; 


		
		var p = $.extend({}, defaultSettings, options, defaultProperty);

		let updatedHeight = imgCount * vidHeight;
		console.log("updatedHeight = " + updatedHeight);

		var reset = function() {
			p.maxDistance = defaultProperty.maxDistance;
			p.slowDownStartDistance = defaultProperty.slowDownStartDistance;
			p.distance = defaultProperty.distance;
			p.isRunUp = defaultProperty.isRunUp;
			p.isSlowdown = defaultProperty.isSlowdown;
			p.isStop = defaultProperty.isStop;
			p.topPosition = defaultProperty.topPosition;
			setLastImg();
			clearTimeout(p.slowDownTimer);
		}

		var slowDownSetup = function() {
			if(p.isSlowdown){
				return;
			}
			p.slowDownCallback();
			p.isSlowdown = true;
			p.slowDownStartDistance = p.distance;
			if(!updatedHeight) p.maxDistance = p.distance + (2*p.totalHeight);
			else p.maxDistance = p.distance + (2*updatedHeight);




			// p.maxDistance += p.imageHeight - p.topPosition % p.imageHeight;
			p.maxDistance += vidHeight - p.topPosition % vidHeight;
			if (p.stopImageNumber != null) {
				// p.maxDistance += (p.totalHeight - (p.maxDistance % p.totalHeight) + (p.stopImageNumber * p.imageHeight))
				if(!updatedHeight)p.maxDistance += (p.totalHeight - (p.maxDistance % p.totalHeight) + (p.stopImageNumber * vidHeight)) % p.totalHeight;
				else p.maxDistance += (updatedHeight - (p.maxDistance % updatedHeight) + (p.stopImageNumber * vidHeight)) % updatedHeight;
			}

			



		}

		var roll = function() {
			var speed_ = p.speed;
			if(myMovieMsg) myMovieMsg.remove();

			if (p.isRunUp) {
				if (p.distance <= p.runUpDistance) {
					var rate_ = ~~((p.distance / p.runUpDistance) * p.speed);
					speed_ = rate_ + 1;
				} else {
					p.isRunUp = false;
				}

			} else if (p.isSlowdown) {
				var rate_ = ~~(((p.maxDistance - p.distance) / (p.maxDistance - p.slowDownStartDistance)) * (p.speed));
				speed_ = rate_ + 1;
			}

			if (p.maxDistance && p.distance >= p.maxDistance) {
				p.isStop = true;
				reset();
				startBtn.disabled = false;
				// console.log("stop image = ");
				// console.log(myNewHeight);
				// console.log(defaultProperty.originalStopImageNumber );
				// console.log(imgCount);
				// console.log(imgHeight);
				console.log((imgHeight * defaultProperty.originalStopImageNumber) - imgHeight);
				if(myNewHeight > p.totalHeight){
					console.log("myNewHeight " + myNewHeight + " > p.totalHeight " +p.totalHeight);
					// $('.roulette-inner').css('transform','translate(0px, -' + (imgHeight * defaultProperty.originalStopImageNumber) - imgHeight  + 'px)');
				} 
				p.stopCallback(p.$rouletteTarget.find('img').eq(p.stopImageNumber));
				return;
			}

			p.distance += speed_;
			p.topPosition += speed_;
			if (p.topPosition >= p.totalHeight) {
				p.topPosition = p.topPosition - p.totalHeight;
			}
			// TODO IE
			if (p.isIE) { 
				p.$rouletteTarget.css('top', '-' + p.topPosition + 'px');
			} else {
				// TODO more smooth roll
				p.$rouletteTarget.css('transform', 'translate(0px, -' + p.topPosition + 'px)');
			}
			setTimeout(roll, 1);
		}

		var init = function($roulette) {
			console.log("in init");
			$roulette.css({ 'overflow' : 'hidden' });
			defaultProperty.originalStopImageNumber = p.stopImageNumber;
			if (!p.$images) {
				console.log("do I get here");
				p.$images = $roulette.find('img').remove();
				p.imageCount = p.$images.length;
				p.$images.eq(0).bind('load',function(){
					// p.imageHeight = $(this).height();

					p.imageHeight = vidHeight;
					console.log("p.imageHeight" + p.imageHeight);


					// $roulette.css({ 'height' : (p.imageHeight + 'px') });
					//$roulette.css({ 'height' : ('120px') });
					// $roulette.css({ 'height' : ('120px') });
					
					$roulette.css({ 'height' : (vidHeight) });
					
					
					// p.totalHeight = p.imageCount * p.imageHeight;
					p.totalHeight = imgCount * vidHeight;
					// p.runUpDistance = 2 * p.imageHeight;
					p.runUpDistance = 2 * vidHeight;
				}).each(function(){
					if (this.complete || this.complete === undefined){
						var src = this.src;
						// set BLANK image
						this.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
						this.src = src;
					}
				});
			}
			$roulette.find('div').remove();
			p.$images.css({
				'display' : 'block'
			});
			p.$rouletteTarget = $('<div>').css({
				'position' : 'relative',
				'top' : '0'
			}).attr('class',"roulette-inner");
			$roulette.append(p.$rouletteTarget);
			p.$rouletteTarget.append(p.$images);
			p.$rouletteTarget.append(p.$images.eq(0).clone());
			$roulette.show();
		}

		var start = function() {
			p.playCount++;
			if (p.maxPlayCount && p.playCount > p.maxPlayCount) {
				return;
			}
			p.stopImageNumber = $.isNumeric(defaultProperty.originalStopImageNumber) && Number(defaultProperty.originalStopImageNumber) >= 0 ?
									Number(defaultProperty.originalStopImageNumber) : Math.floor(Math.random() * p.imageCount);
			p.startCallback();
			roll();
			p.slowDownTimer = setTimeout(function(){
				slowDownSetup();
			}, p.duration * 1000);
		}

		var stop = function(option) {
			if (!p.isSlowdown) {
				if (option) {
					var stopImageNumber = Number(option.stopImageNumber);
					if (0 <= stopImageNumber && stopImageNumber <= (p.imageCount - 1)) {
						p.stopImageNumber = option.stopImageNumber;
					}
				}
				slowDownSetup();
			}
		}
		var option = function(options) {
			p = $.extend(p, options);
			p.speed = Number(p.speed);
			p.duration = Number(p.duration);
			p.duration = p.duration > 1 ? p.duration - 1 : 1;
			defaultProperty.originalStopImageNumber = options.stopImageNumber;
		}

		// var setLastImg = function() {
		// 	// let myResetHeight = (imgHeight * stopImg) + imgHeight;
		// 	let myResetHeight = imgHeight * stopImg;
		// 	// console.log('myResetHeight ' + myResetHeight);
		// 	let myElem = document.getElementsByClassName('roulette-inner')[0];
		// 	myElem.style.transform = 'translate(0px, -' + myResetHeight + 'px';
		// 	// console.log("ran js style update");

		// 	let myMovieElem = document.getElementById(stopImg).src;
		// 	let myMovieSrc = myMovieElem.split('/stills/');
		// 	// console.log(myMovieSrc[1]);	
		// 	let myMovie = myMovieSrc[1].split('.png');
		// 	// console.log(myMovie);
			
		// 	let myMovieUrl = "videos/" + myMovie[0] + ".webm";

		// 	myMovieMsg = document.createElement('video');
		// 	myMovieMsg.src = myMovieUrl;
		// 	myMovieMsg.id = 'myMovieMsg' + stopImg;
		// 	myMovieMsg.classList.add('movieMsgClass');
		// 	myMovieMsg.setAttribute("controls","controls")   
			
		// 	let rouletteDiv = document.getElementById('rouletteDiv');

		// 	setTimeout( function(){
		// 		rouletteDiv.prepend(myMovieMsg);

		// 	}, 1500)


		// 	// let myMovieSrc = myMovieElem.src();

		// 	console.log("play video from id = " + stopImg + " myMovie = '/videos/" + myMovie[0] + ".webm'");
		// }

		var ret = {
			start : start,
			stop : stop,
			init : init,
			option : option
		}
		return ret;
	}

	var pluginName = 'roulette';
	$.fn[pluginName] = function(method, options) {
		return this.each(function() {
			var self = $(this);
			var roulette = self.data('plugin_' + pluginName);

			if (roulette) {
				if (roulette[method]) {
					roulette[method](options);
				} else {
					console && console.error('Method ' + method + ' does not exist on jQuery.roulette');
				}
			} else {
				roulette = new Roulette(method);
				roulette.init(self, method);
				$(this).data('plugin_' + pluginName, roulette);
			}
		});
	}
}