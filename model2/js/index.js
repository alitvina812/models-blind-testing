var model;
var canvas;
var classNames = [];
var coords = [];
var mousePressed = false;
var mode;
var timer;
var eval;
var word;

/*
Screens
*/
var startScreen = document.getElementById("start");
var gameScreen = document.getElementById("game");
var endScreen = document.getElementById("end");
// var defeatScreen = document.getElementById("endDefeat");
// var victoryScreen = document.getElementById("endVictory");

function startGame() {
    erase();
    resetTimer(timer);
    clearInterval(eval);
    word = classNames[getRandomInt(99)];
    console.log(word);
    gameScreen.scrollIntoView();
    countdown(word);
    setTimeout(function() {
        startTimer();
        evaluate(word);
    }, 7000)
}   

$('.start-game').on('click', tutorial);

function tutorial(){
    gameScreen.scrollIntoView();
    document.getElementById("overlay").style.display = "block";
    document.getElementById("skip").style.display = "block";
    document.getElementById("overlay-text").innerText = "Tutorial: Draw the word! Get it to the top before the times runs out!";
}

function skipTutorial(){
    document.getElementById("skip").style.display = "none";
    startGame();
}



function stopGame() {
    endScreen.scrollIntoView();
    resetTimer(timer);
    clearInterval(eval);
}

function evaluate(word) {        
    eval = setInterval(function() {
        var firstWord = document.getElementById('prob1').innerText;
        console.log(firstWord);
        var res = document.getElementById('result');
        var resButton = document.getElementById('res-button');
        if (firstWord == word) {
            var percent = document.getElementById('prob1').style.width;
            res.innerHTML = "<h1>You won!</h1><p>The AI is</p><p>" + percent + "</p><p>sure.</p>";
            resButton.innerText = 'Next';
            stopGame();
        } else {
            res.innerHTML = "<h1>You lost!</h1><p>You were a little to slow.</p>";
            resButton.innerText = 'Try again';
        }
    }, 1000);
}
/*
Countdown word,3,2,1
*/
var countdownTotal = 6;
var countdownNumber = countdownTotal;
function countdown(word) {
    document.getElementById("overlay").style.display = "block";
    document.getElementById("overlay-text").innerText = word;
    var count = setInterval(function(){ 
        countdownNumber--;
        if(countdownNumber <= 4 && countdownNumber > 1){
        document.getElementById("overlay-text").textContent = countdownNumber-1;
        }
        if(countdownNumber == 1){
            document.getElementById("overlay-text").textContent = "Go!";
        }
        if(countdownNumber <= 0){
        clearInterval(count);
        document.getElementById("overlay").style.display = "none";
        countdownNumber = countdownTotal;
        }
        }, 1000);  
}

/*
Timer
*/
var timerWidth = 100; 
var totalTime = 20000;
var timeLeft = totalTime;
function startTimer() {
    timer = setInterval(function(){ 
        timeLeft = timeLeft-0.1;
        timeLeft = timeLeft.toFixed(2);
        timerWidth = timeLeft * (100/totalTime);
        document.getElementById("timer").style.width = timerWidth + '%';
        // document.getElementById("timerNumber").textContent = timeLeft;
        if (timerWidth <= 30 && timerWidth > 10 ){
            document.getElementById("timer").style.backgroundColor = "#ffde59";
        }
        if (timerWidth <= 10){
            document.getElementById("timer").style.backgroundColor = "#ff5757";
        }
        if (timeLeft <= 0){
            stopGame();
        }
    },100);
}

function resetTimer(timer) {
    clearInterval(timer);
    timerWidth = 100;
    timeLeft = totalTime;
    document.getElementById("timer").style.width = timerWidth + '%';
    // document.getElementById("timerNumber").textContent = timeLeft;
    document.getElementById("timer").style.backgroundColor = "#7ed957";
}

/*
prepare the drawing canvas 
*/
$(function() {
    canvas = window._canvas = new fabric.Canvas('canvas');
    canvas.backgroundColor = '#ffffff';
    canvas.isDrawingMode = 0;
    canvas.freeDrawingBrush.color = "black";
    canvas.freeDrawingBrush.width = 10;
    canvas.renderAll();
    //setup listeners 
    canvas.on('mouse:up', function(e) {
        getFrame();
        mousePressed = false
    });
    canvas.on('mouse:down', function(e) {
        mousePressed = true
    });
    canvas.on('mouse:move', function(e) {
        recordCoor(e)
    });
})

/*
set the table of the predictions 
*/
function setTable(top5, probs) {
    //loop over the predictions 
    for (var i = 0; i < top5.length; i++) {
        let sym = document.getElementById('sym' + (i + 1));
        let prob = document.getElementById('prob' + (i + 1));
        let temp = probs[i];
        let mr = Math.round(temp * 100);
        prob.style.width = mr + '%';
        prob.innerHTML = top5[i];
        if (top5[i] == word) {
            prob.style.backgroundColor = "#5271ff";
        } else {
            prob.style.backgroundColor = "#545454";
        }
    }

}

/*
record the current drawing coordinates
*/
function recordCoor(event) {
    var pointer = canvas.getPointer(event.e);
    var posX = pointer.x;
    var posY = pointer.y;

    if (posX >= 0 && posY >= 0 && mousePressed) {
        coords.push(pointer)
    }
}

/*
get the best bounding box by trimming around the drawing
*/
function getMinBox() {
    //get coordinates 
    var coorX = coords.map(function(p) {
        return p.x
    });
    var coorY = coords.map(function(p) {
        return p.y
    });

    //find top left and bottom right corners 
    var min_coords = {
        x: Math.min.apply(null, coorX),
        y: Math.min.apply(null, coorY)
    }
    var max_coords = {
        x: Math.max.apply(null, coorX),
        y: Math.max.apply(null, coorY)
    }

    //return as strucut 
    return {
        min: min_coords,
        max: max_coords
    }
}

/*
get the current image data 
*/
function getImageData() {
        //get the minimum bounding box around the drawing 
        const mbb = getMinBox()

        //get image data according to dpi 
        const dpi = window.devicePixelRatio
        const imgData = canvas.contextContainer.getImageData(mbb.min.x * dpi, mbb.min.y * dpi,
                                                      (mbb.max.x - mbb.min.x) * dpi, (mbb.max.y - mbb.min.y) * dpi);
        return imgData
    }

/*
get the prediction 
*/
function getFrame() {
    //make sure we have at least two recorded coordinates 
    if (coords.length >= 2) {

        //get the image data from the canvas 
        const imgData = getImageData()

        //get the prediction 
        const pred = model.predict(preprocess(imgData)).dataSync()
        //find the top 5 predictions 
        const indices = findIndicesOfMax(pred, 5)
        const probs = findTopValues(pred, 5)
        const names = getClassNames(indices)

        //set the table 
        setTable(names, probs)
    }

}

/*
get the the class names 
*/
function getClassNames(indices) {
    var outp = []
    for (var i = 0; i < indices.length; i++)
        outp[i] = classNames[indices[i]]
    return outp
}

/*
load the class names 
*/
async function loadDict() {
    loc = 'model/class_names.txt'
    
    await $.ajax({
        url: loc,
        dataType: 'text',
    }).done(success);
}

/*
load the class names
*/
function success(data) {
    const lst = data.split(/\n/)
    for (var i = 0; i < lst.length - 1; i++) {
        let symbol = lst[i]
        classNames[i] = symbol
    }
}

/*
get indices of the top probs
*/
function findIndicesOfMax(inp, count) {
    var outp = [];
    for (var i = 0; i < inp.length; i++) {
        outp.push(i); // add index to output array
        if (outp.length > count) {
            outp.sort(function(a, b) {
                return inp[b] - inp[a];
            }); // descending sort the output array
            outp.pop(); // remove the last index (index of smallest element in output array)
        }
    }
    return outp;
}

/*
find the top 5 predictions
*/
function findTopValues(inp, count) {
    var outp = [];
    let indices = findIndicesOfMax(inp, count)
    // show 5 greatest scores
    for (var i = 0; i < indices.length; i++)
        outp[i] = inp[indices[i]]
    return outp
}

/*
preprocess the data
*/
function preprocess(imgData) {
    return tf.tidy(() => {
        //convert to a tensor 
        let tensor = tf.fromPixels(imgData, numChannels = 1)
        
        //resize 
        const resized = tf.image.resizeBilinear(tensor, [28, 28]).toFloat()
        
        //normalize 
        const offset = tf.scalar(255.0);
        const normalized = tf.scalar(1.0).sub(resized.div(offset));

        //We add a dimension to get a batch shape 
        const batched = normalized.expandDims(0)
        return batched
    })
}

/*
load the model
*/
async function start(cur_mode) {
    //arabic or english
    mode = cur_mode;
    
    //load the model 
    model = await tf.loadModel('model/model.json');
    
    //warm up 
    model.predict(tf.zeros([1, 28, 28, 1]));
    
    //allow drawing on the canvas 
    allowDrawing();
    
    //load the class names
    await loadDict();
    console.log('started');
    
}

// allow drawing
function allowDrawing() {
    canvas.isDrawingMode = 1;
    $('button').prop('disabled', false);
    // var slider = document.getElementById('myRange');
    // slider.oninput = function() {
    //     canvas.freeDrawingBrush.width = this.value;
    // };
}

// clear the canvas
function erase() {
    canvas.clear();
    canvas.backgroundColor = '#ffffff';
    coords = [];
    var bars = document.getElementsByClassName("bar__full");
    for (let bar of bars) {
        bar.innerHTML = " ";
        bar.style.width = "0%";
    }
}

let info = document.getElementsByClassName('info__container')[0];
function showInfo() {
    info.classList.add('active');
}

function hideInfo() {
    info.classList.remove('active')
}

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
  }