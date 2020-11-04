function roulSettings(){

	$('.roulette').find('img').hover(function(){
		console.log($(this).height());
	});
	var appendLogMsg = function(msg) {
		$('#msg')
	.append('<p class="muted">' + msg + '</p>')
	.scrollTop(100000000);

	}
	var p = {
		startCallback : function() {
			appendLogMsg('start');
			startBtn.disabled = true;
			stopBtn.disabled = false;
			//$('.start').prop('disabled', 'true');
			//$('.stop').removeProp('disabled');
			
		},
		slowDownCallback : function() {
			appendLogMsg('slowdown');
			
			// $('.stop').attr('disabled', 'true');
			// $('.start').attr('disabled', 'false');
		},
		stopCallback : function($stopElm) {
			appendLogMsg('stop');
			startBtn.disabled = false;
			stopBtn.disabled = true;
			//$('.stop').prop('disabled', 'true');
			//$('.start').removeProp('disabled');
		
		}

	}
	var rouletter = $('div.roulette');
	rouletter.roulette(p);	
	$('.stop').click(function(){
		console.log("stop clicked");
		// var stopImageNumber = defaultProperty.originalStopImageNumber;
		// if(stopImageNumber == "") {
		// 	stopImageNumber = null;
		// }
		
		rouletter.roulette('stop');	
	});
	//$('.stop').attr('disabled', 'true');
	$('.start').click(function(){
		rouletter.roulette('start');	
		$('.stop').prop('disabled', '');
	});

	var updateParamater = function(){
		
		p['speed'] = 10;
		p['duration'] = 4;
		p['stopImageNumber'] = Math.floor(Math.random() * imgCount);
		
		rouletter.roulette('option', p);	
	}
	updateParamater();
	
}

