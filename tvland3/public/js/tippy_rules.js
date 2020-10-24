tippy('#weirdBtn, #tintBtn, #threshBtn', {
            content: 'apply filter. double click screen to start/stop mouse adjust',
            placement: 'right-start',
            animation: 'scale',
            arrow: true,
        });
        tippy('#inverBtn, #brightBtn', {
            content: 'apply filter',
            placement: 'right-start',
            animation: 'scale',
            arrow: true,
        });
        tippy('#normBtn', {
            content: 'back to normal',
            placement: 'right-start',
            animation: 'scale',
            arrow: true,
        });
        tippy('#showMe', {
            content: 'show yourself',
            placement: 'right-start',
            animation: 'scale',
        });
        tippy('#hideBtn', {
            content: 'hide yourself',
            placement: 'right-start',
            animation: 'scale',
        });

        tippy('#muteBtn', {
            content: 'mute on/off',
            placement: 'right-start',
            animation: 'scale',
        });

        tippy('.chat-button', {
            content: 'show/hide chat',
            placement: 'left-start',
            animation: 'scale',
        });

        tippy('#question', {
            content: 'General use:<br> 1) Drag/drop png, jpg, gif to browser window to change bg image.<br>2) Longpress on TV(s) to rotate (by 90º)<br>3) Double click peer TV to change frame<br>4) Apply filters with buttons on main TV<br>5) Onload you\'re muted.  Unmute yourself with mute button on main TV<br><br><u>Experimental</u><br>Hit "c" to rotate & scale<br>move mouse Y to scale<br>move mouse X to rotate<br>hit "c" again to turn off and return to drag mode',
            placement: 'bottom-start',
            animation: 'scale',
            allowHTML: true,


        })