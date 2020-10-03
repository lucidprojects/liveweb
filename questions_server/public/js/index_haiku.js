 let allAnswers = false;
 let usersCount = 1;

 var socket = io.connect();

 socket.on('connect', function (connectCounter) {
     console.log("Connected");
     myMessageBox = document.getElementById('message');
     updateUserCount(connectCounter);
 });

 socket.on('pollUsers', function (connectCounter) {
     updateUserCount(connectCounter);
 });

 socket.on('pollAnswers', function (answerCounter) {
     updateAnswerCount(answerCounter);
 });

 // starting values to work with 
 //adjectives
 var feelings = ["tired", "hot", "hungry", "thirst", "dirty", "excited", "artistic", "aloof", "hot", "intreiged",
     "overjoyous", "determined"
 ];

 //nones
 var objects = ["square", "black", "plastic", "hollow", "zipper", "red", "fuzzy", "cotton", "warm", "old"];
 //nones
 var loves = ["skateboarding", "dogs", "people", "cat", "family", "animals", "art", "nature", "sleep",
     "knowledge"
 ];
 //nones
 var tech = ["terminator", "electricity", "raspberrypi", "surveillence", "laptop", "arduino", "resistors",
     "kinect", "drones", "vehicles"
 ];

 // these valuse don't get passed
 var preps = ['in the', 'on a', 'with the', 'after', 'during', 'before', 'unlike', 'according to', 'under',
     'in front of', 'above', 'behind', 'near', 'following', 'inside', 'besides',
     'unlike', 'like', 'beneath', 'against', 'into', 'beyond', 'considering', 'without',
     'with', 'towards'
 ];
 var time = ['day.', 'morning.', 'weekday.', 'weekend.', 'yesterday.', 'saturday.', 'future.'];

 var arts = ['the', 'my', 'your', 'our', 'that', 'this', 'every', 'one', 'the only', 'his', 'her', 'a'];

 //verbs
 var ver = [
     "sings", "dances", "was dancing", "runs", "will run", "walks",
     "flies", "moves", "moved", "will move", "glows", "glowed", "spins", "promised",
     "hugs", "cheated", "waits", "is waiting", "is studying", "swims",
     "travels", "traveled", "plays", "played", "enjoys", "will enjoy",
     "illuminates", "arises", "eats", "drinks", "calculates", "kissed", "faded", "listens",
     "navigated", "responds", "smiles", "will smile", "will succeed",
     "is wondering", "is thinking", "is", "was", "will be", "might be", "was never"
 ];

 let topVals = [];
 let leftVals = [];


 window.addEventListener('load', function () {
     // var resetBtn = document.getElementById('reset');
     // resetBtn.addEventListener('click', reset);

     // var resultBtn = document.getElementById('results');
     // resultBtn.addEventListener('click', displayTextLoop);

     socket.on('localData', receiveData);



     function receiveData(data) {

         // get length of data received - count keys in the data object
         var dataCount = Object.keys(data).length;

         function cleanArrays(rArray, lArray) {
             // array for pushing received data to
             let result = [];

             for (var i in rArray)
                 result.push(rArray[i]);

             // set it to sring and split it on comma
             let resultsString = result.toString();

             //then add seperate values to shared local array
             let tempArr1 = resultsString.split(",");
             for (i = 0; i < tempArr1.length; i++) {
                 lArray.push(tempArr1[i]);
             }
             // push them into a set for unique values to shared local array
             // also first time using the 'spread' oporator yay
             let lArrayTemp = [...new Set(lArray)];

             // finally set unique values to shared
             lArray = lArrayTemp;
             console.log(lArray);
         }

         // loop through data object received
         for (let j = 0; j < dataCount; j++) {
             switch (j) {
                 case 0:
                     cleanArrays(data.arr1, feelings);
                     break;
                 case 1:
                     cleanArrays(data.arr2, objects);
                     break;
                 case 2:
                     cleanArrays(data.arr3, loves);
                     break;
                 case 3:
                     cleanArrays(data.arr4, tech);
                     break;
             }
         }
     }
 });


 // when all the questions have been answered
 function done() {

     // remove the box if there is no next question
     register.className = 'close'

     // add the h1 at the end with the welcome text
     var h1 = document.createElement('h1')
     // h1.appendChild(document.createTextNode('Welcome ' + questions[0].value + '!'))

     if (allAnswers == false) {
         h1.appendChild(document.createTextNode('Thank you! Please wait'))
         h1.setAttribute("id", "myH1");
     }

     setTimeout(function () {
         register.parentElement.appendChild(h1)
         setTimeout(function () {
             h1.style.opacity = 1
         }, 50)
     }, eTime)

 }

 // when submitting the current question
 function validate() {

     // set the value of the field into the array
     questions[position].value = inputField.value
     questionInput = questions[position].value;

     switch (position) {
         case 0:
             addToLocalArray(feelings);
             break;
         case 1:
             addToLocalArray(objects);
             break;
         case 2:
             addToLocalArray(loves);
             break;
         case 3:
             addToLocalArray(tech);
             break;
     }

     // check if the pattern matches
     if (!inputField.value.match(questions[position].pattern || /.+/)) wrong()
     else ok(function () {

         // set the progress of the background
         progress.style.width = ++position * 100 / questions.length + 'vw'

         // if there is a new question, hide current and load next
         if (questions[position]) hideCurrent(putQuestion)
         else {
             hideCurrent(done);

             let dataToSend = {
                 arr1: feelings,
                 arr2: objects,
                 arr3: loves,
                 arr4: tech
             };
             //send data to everyone
             socket.emit('localData', dataToSend);
         }
     })
 }


 let addToLocalArray = (arrayName) => {
     var tempAnswer = questionInput.split(" ");
     // console.log("tempAnswer" + tempAnswer);
     for (i = 0; i < tempAnswer.length; i++) {
         arrayName.push(tempAnswer[i]);
     }
 }

 // helper
 // --------------

 function hideCurrent(callback) {
     inputContainer.style.opacity = 0
     inputProgress.style.transition = 'none'
     inputProgress.style.width = 0
     setTimeout(callback, wTime)
 }

 function showCurrent(callback) {
     inputContainer.style.opacity = 1
     inputProgress.style.transition = ''
     inputProgress.style.width = '100%'
     setTimeout(callback, wTime)
 }

 function transform(x, y) {
     register.style.transform = 'translate(' + x + 'px ,  ' + y + 'px)'
 }

 function ok(callback) {
     register.className = ''
     setTimeout(transform, tTime * 0, 0, 10)
     setTimeout(transform, tTime * 1, 0, 0)
     setTimeout(callback, tTime * 2)
 }

 function wrong(callback) {
     register.className = 'wrong'
     for (var i = 0; i < 6; i++) // shaking motion
         setTimeout(transform, tTime * i, (i % 2 * 2 - 1) * 20, 0)
     setTimeout(transform, tTime * 6, 0, 0)
     setTimeout(callback, tTime * 7)
 }

 function reset() {
     position = 0;
     putQuestion();
     progress.style.width = 0;
     register.classList.remove('close');
     var h1 = document.getElementById('myH1');
     // h1.setAttribute("style", "display:none");
     h1.remove();

 }

 // stackOverflow thread https://stackoverflow.com/questions/6454198/check-if-a-value-is-within-a-range-of-numbers
 function between(x, min, max) {
     return x >= min && x <= max;
 }

 // stackOverflow https://stackoverflow.com/questions/8584902/get-the-closest-number-out-of-an-array
 var findClosest = function (x, arr) {
     var indexArr = arr.map(function (k) {
         return Math.abs(k - x)
     })
     var min = Math.min.apply(Math, indexArr)
     var max = Math.max.apply(Math, indexArr)
     return [arr[indexArr.indexOf(min)], arr[indexArr.indexOf(max)]]

 }


 // https://jsfiddle.net/Dwaaren/j9zahaLL/
 function vwTOpx(value) {
     var w = window,
         d = document,
         e = d.documentElement,
         g = d.getElementsByTagName('body')[0],
         x = w.innerWidth || e.clientWidth || g.clientWidth,
         y = w.innerHeight || e.clientHeight || g.clientHeight;

     var result = (x * value) / 100;
     return result;
 }

 function pxTOvw(value) {
     var w = window,
         d = document,
         e = d.documentElement,
         g = d.getElementsByTagName('body')[0],
         x = w.innerWidth || e.clientWidth || g.clientWidth,
         y = w.innerHeight || e.clientHeight || g.clientHeight;

     var result = (100 * value) / x;
     return result;
 }

 function pxTOvh(value) {
     var w = window,
         d = document,
         e = d.documentElement,
         g = d.getElementsByTagName('body')[0],
         x = w.innerWidth || e.clientWidth || g.clientWidth,
         y = w.innerHeight || e.clientHeight || g.clientHeight;

     var result = (100 * value) / y;
     return result;
 }

 //adapted random style code from https://github.com/marcelwang/LiveWeb-week2/blob/master/public/chat204.html
 var randomPos = function () {
     let topMath = Math.random() * (1, 86);
     let leftMath = Math.random() * 100;
     let winWidth = window.innerWidth;
     let leftMathPxVW = vwTOpx(leftMath);

     // console.log("leftMath = " + leftMath + " leftMatPx = " + leftMathPxVW);
     // console.log("winWidth = " + winWidth);

     // check if too wide
     if (leftMathPxVW > winWidth - 500) {
         // leftMath = Math.floor(Math.random(400, 600));
         leftMath = Math.floor(Math.random() * Math.floor(winWidth - 700));
         leftMathPxVW = pxTOvw(leftMath);
         // console.log("leftMath updated to " + leftMathPxVW);
         leftMath = leftMathPxVW;
     }

     var top = 'top:' + topMath + 'vh;';
     var left = 'left:' + leftMath + 'vw;';

     topVals.push(Math.floor(topMath));
     leftVals.push(Math.floor(leftMath));

     return top + left;
 }


 var syllableCount = function (string) {
     //modified code from Haiku.js http://harcourtprogramming.co.uk/blogs/benh/tag/javascript/
     var matches = string.match(syllableCount.pattern);
     if (matches == null) return 0; // No vowels found...

     currentSyllableCount = matches.length;

     if (string.match(syllableCount.silentE) != null) currentSyllableCount -= string.match(syllableCount.silentEs).length;
     //   console.log(currentSyllableCount);
     return currentSyllableCount;
 }
 syllableCount.pattern = new RegExp("[aeiouy]([^aieouy]|$)", 'gim'); // Vowel followed be non-vowel or end of string. Matches all in multi-line string, case insensitively.
 syllableCount.silentE = new RegExp("[aeiouy][^aeiouy]e([^a-z]s|[^a-z]|$)", 'i'); // words ending vce / vces where v is some vowel, c is some consonant
 syllableCount.silentEs = new RegExp("[aeiouy][^aeiouy]e([^a-z]s|[^a-z]|$)", 'gim'); // as above, but match all in multi=line string (previous matches only first - used to find if there are any quickly)

 function getSyls(arry, syls) {
     let tempArr = [];

     for (let i = 0; i < arry.length; i++) {

         let myWord = syllableCount(arry[i]);
         if (myWord == syls) {
             tempArr.push(arry[i]);
         }

     }
     let word = tempArr[Math.floor(Math.random() * tempArr.length)]
     console.log(word);
     return word;
 }

 let haiku = () => {
     // suggest haiku pattern https://www.chegg.com/homework-help/questions-and-answers/problem-2-50-points-haiku-japanese-poetic-form-typically-three-lines-five-syllables-seven--q45522452
     // < two syllable adjective > < two syllable adjective > < one syllable noun>
     // < two syllable verb > the < two syllable noun > < two syllable adjective >
     // < two syllable adjective > < two syllable adjective > < one syllable noun >
     // 5 7 5 syllables

     document.getElementById('progress').innerHTML = '<div id="outerHaiku"  style="' + randomPos() + '">' +
         '<div id="haiku0"><span class="haiku">' + getSyls(feelings, 2) + ' ' + getSyls(feelings, 2) + ' ' + getSyls(loves, 1) + '</span></div><br>' +
         '<div id="haiku1"><span class="haiku">' + getSyls(ver, 2) + ' ' + getSyls(arts, 1) + " " + getSyls(loves, 2) + ' ' + getSyls(objects, 2) + '</span></div><br>' +
         '<div id="haiku2"><span class="haiku">' + getSyls(feelings, 2) + ' ' + getSyls(feelings, 1) + ' ' + getSyls(tech, 2) + '</span></div><br>' +
         '<div id="foryou">a collaborative haiku, unique for you</div>' +
         '</div>';


 }


 //  var updateUserCount = (connectCounter) => {
 function updateUserCount(connectCounter) {
     if (!connectCounter) document.getElementById('numUsers').innerHTML = ("1 participant");
     else document.getElementById('numUsers').innerHTML = (connectCounter + " participants");
     usersCount = connectCounter;
 }

 //  var updateAnswerCount = (answerCounter) => {
 function updateAnswerCount(answerCounter) {
     if (!answerCounter) document.getElementById('numAnswers').innerHTML = ("0 participants answered");
     else if (answerCounter == 1) document.getElementById('numAnswers').innerHTML = (
         "1 participant answered");
     else document.getElementById('numAnswers').innerHTML = (answerCounter + " participants answered");
 }


 function displayHaikuLoop() {
     haiku();
     for (let i = 0; i < 3; i++) {
         var mySpan = document.getElementById('haiku' + i).getElementsByTagName('span')[0];
         var mySpanWidth = mySpan.offsetWidth;
         displayHaiku(i, mySpanWidth);
     }
 }

 function displayHaiku(i, mySpanWidth) {
    setTimeout(function () {
         var myDiv = document.getElementById('haiku' + i)
         Velocity(myDiv, { width: mySpanWidth}, 2500);
    }, 2500 * i);
    
    setTimeout(function () {
        unfade(foryou);
    }, 7500)

 }

 function unfade(element) {
     var op = 0.1; // initial opacity
     element.style.display = 'block';
     var timer = setInterval(function () {
         if (op >= 1) {
             clearInterval(timer);
         }
         element.style.opacity = op;
         element.style.filter = 'alpha(opacity=' + op * 100 + ")";
         op += op * 0.1;
     }, 50);
 }





//  function showCollabLine() {
//      var haiku4you = document.getElementById('foryou');
//      let showline = true;
//      if(showline) Velocity(haiku4you, {opacity: 1.0 }, 2500);
//      showline = false;
//     // for (let i = 0 ; i < 101; i ++){
//     //     haiku4you.style.opacity = "0." + i;

//     // }

//  }

 socket.on('allAnswered', function () {
     setTimeout(function () {
         console.log("all answers sent");
         showResults();
     }, 2500);
 });

 function showResults() {
     let userNum = document.getElementById('numUsers');
     let numAns = document.getElementById('numAnswers');
     let myH1 = document.getElementById('myH1');

     userNum.style.display = "none";
     numAns.style.display = "none";

     allAnswers = true;

     if (myH1) {
         myH1.style.display = "none";
     }
     displayHaikuLoop();

 }