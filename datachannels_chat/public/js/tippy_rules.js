tippy('#sendDataButton', {
    content: 'send message',
    placement: 'right-start',
    animation: 'scale',
});
tippy('#users', {
    content: 'send public or private messages',
    placement: 'right-start',
    animation: 'scale',
});
tippy('#localCheck', {
    content: 'see what affect color has / show color affects locally',
    placement: 'right-start',
    animation: 'scale',
});
tippy('#help', {
    content: 'click help to turn tooltips back on.<br>tooltips disable after 15 sec<br>send white with \'see\' checked to clear your window back to white',
    placement: 'right-start',
    animation: 'scale',
    allowHTML: true,
});


tippy('#colors', {
    content: 'Hide / Show Color options:<br>Sending colors in the chat will affect the user\'s browser.<br>There are a few easter egg colors',
    placement: 'bottom-start',
    animation: 'scale',
    allowHTML: true,


})

// turn off tooltips after 15 seconds
// destroy exampe found here.  modified to disable
// https://github.com/atomiks/tippyjs/issues/473#issuecomment-485055710

function hideTooltips() {
    setTimeout(function () {
        // tippy.hideAll();
        [...document.querySelectorAll('*')].forEach(node => {
            if (node._tippy) {
                node._tippy.disable();
            }
        });
    }, 15000);
}

hideTooltips();

function showTooltips() {
    [...document.querySelectorAll('*')].forEach(node => {
        if (node._tippy) {
            node._tippy.enable();
        }
    });

    hideTooltips();
}