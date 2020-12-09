var sup1 = new SuperGif({
    gif: document.getElementById('gif1')
});
sup1.load();
var gifCanvas = sup1.get_canvas();
gifCanvas.id = "gifCanvas";

var sup2 = new SuperGif({
    gif: document.getElementById('gif2')
});
sup2.load();
var gifCanvas2 = sup2.get_canvas();
gifCanvas2.id = "gifCanvas2";

var sup3 = new SuperGif({
    gif: document.getElementById('gif3')
});
sup3.load();
var gifCanvas3 = sup3.get_canvas();
gifCanvas3.id = "gifCanvas3";

var sup4 = new SuperGif({
    gif: document.getElementById('gif4')
});
sup4.load();
var gifCanvas4 = sup4.get_canvas();
gifCanvas4.id = "gifCanvas4";

var sup5 = new SuperGif({
    gif: document.getElementById('gif5')
});
sup5.load();
var gifCanvas5 = sup5.get_canvas();
gifCanvas5.id = "gifCanvas5";

var sup6 = new SuperGif({
    gif: document.getElementById('gif6')
});
sup6.load();
var gifCanvas6 = sup6.get_canvas();
gifCanvas6.id = "gifCanvas6";

let myGifs = []

var goUp = false;
let mySlowDown = -30

let myReq;



function initGifs() {
    myGifs[0] = new gifTexture(200, 200, gifCanvas, 0, 1, "canvas");
    myGifs[1] = new gifTexture(200, 200, gifCanvas2, 0, 200, "canvas");
    myGifs[2] = new gifTexture(200, 200, gifCanvas3, 0, 400, "canvas");
    myGifs[3] = new gifTexture(200, 200, gifCanvas4, 0, 600, "canvas");
    myGifs[4] = new gifTexture(200, 200, gifCanvas5, 0, 800, "canvas");
    myGifs[5] = new gifTexture(200, 200, gifCanvas6, 0, 1000, "canvas");
    myGifArea.start();
}

var myGifArea = {
    canvas: document.createElement("canvas"),
    start: function () {
        this.canvas.width = 200;
        this.canvas.height = 200;
        this.canvas.id = 'myGifArea';
        this.context = this.canvas.getContext("2d");
        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
        this.frameNo = 0;
        this.interval = setInterval(updateGifArea, 20);
        const myGifAreaText = new THREE.CanvasTexture(myGifArea);
        myGifAreaText.minFilter = THREE.LinearFilter;
        console.log("myGifAreaText " + myGifAreaText);
        myGifAreaTextMesh = new THREE.MeshBasicMaterial( { map: myGifAreaText });
        
        console.log(redCubeMaterials[0]);
    },
    clear: function () {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },
    stop: function () {
        clearInterval(this.interval);
    }
    
}


function gifTexture(width, height, color, x, y, type) {
    this.type = type;
    if (type == "image") {
        this.image = new Image();
        this.image.src = color;
    }

    this.width = width;
    this.height = height;
    this.speedX = 0;
    this.speedY = 0;
    this.x = x;
    this.y = y;
    this.update = function () {
        ctx = myGifArea.context;
        if (type == "image") {
            ctx.drawImage(this.image,
                this.x,
                this.y,
                this.width, this.height);
        } else if (type == "canvas") {
            ctx.drawImage(color,
                this.x,
                this.y,
                this.width, this.height);
        } else {
            ctx.fillStyle = color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
    this.newPos = function () {
        this.x += this.speedX;
        this.y += this.speedY;
    }
}

function updateGifArea() {
    myGifArea.clear();

    for (let i = 0; i < myGifs.length; i++) {
        myGifs[i].newPos();
        myGifs[i].update();
    }


}

function move(dir) {
    console.log("dir = " + dir);
    if (dir == "up" && goUp == true) {
        for (let i = 0; i < myGifs.length; i++) {

            if (myGifs[i].y > 0) {
                myGifs[i].speedY = mySlowDown;
            } else {
                myGifs[i].y = 200 * i;
            }
        }
    }


    if (dir == "slow" && goUp == true) {
        for (let i = 0; i < myGifs.length; i++) {
            if (myGifs[i].y >= 0) {
                timerInterval = setInterval(() => {

                    if (mySlowDown < 0) {

                        console.log("mySlowDown" + mySlowDown);
                        mySlowDown++;
                        myGifs[i].speedY = mySlowDown;
                    }
                    if (mySlowDown == 0 && goUp == true) {
                        goUp = false;
                        console.log("goUp set to false");
                        myGifs[i].speedY = 0;
                        cancelAnimationFrame(myReq);
                        clearmove();
                    }
                }, 1000);

            } else {
                myGifs[i].y = 200;
            }
        }

    }

}

function clearmove() {
    for (let i = 0; i < myGifs.length; i++) {
        myGifs[i].speedX = 0;
        myGifs[i].speedY = 0;
    }

    let myWinnerIndex = Math.floor(Math.random() * 6)
    console.log("myWinnerIndex " + myWinnerIndex);
    myGifs[myWinnerIndex].y = 0;

    for (let i = 0; i < myGifs.length; i++) {
        if (myGifs[0] != myGifs[myWinnerIndex]) {
            myGifs[0].y = 200 * myWinnerIndex;
        }
        if (myGifs[i] === myGifs[myWinnerIndex]) {
            continue;
        }
        myGifs[i].y = 200 * i;
    }


}

function roulette() {
    animateRoulette();
}

function animateRoulette() {
    myReq = requestAnimationFrame(animateRoulette);
    if (goUp == true) {
        move('up');
    }

}


function stop() {
    move("slow");

}