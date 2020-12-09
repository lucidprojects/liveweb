tippy('#weirdBtn, #tintBtn, #threshBtn', {
            content: 'apply filter',
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
            content: 'General use:<br> 1) Navigate: Up, Down, Left, Right arrows.<br>    also w (up), s (down), q (left), e(right)<br>    experimental: a & d rotate Y axis, r & f rotate X axis *note does not send to peer<br> 2) Pan camera: mouse click and drag <br> 3) Drag camera: ctrl + mouse click and drag <br> 4) Zoom camera: mouse scroll <br>  5) Apply filters with buttons <br> 6) Space bar to gif tattoo peers 7) Onload you\'re muted.  Unmute yourself with mute button on main TV<br>',
            placement: 'bottom-start',
            animation: 'scale',
            allowHTML: true,


        })