let playColors = document.querySelectorAll('.play-color');
let level;
let stage;
let score, totalScore;
let time, totalTime;
let totalScoreDisplay = document.querySelector('.total-score');
let scoreDisplay = document.querySelector('.score');
let timeDisplay = document.querySelector('.time');
let totalTimeDisplay = document.querySelector('.total-time');
let scoreTimer, timeTimer;

let resetGame = () => {
  level = 1;
  stage = 1;
  score = 100;
  scoreTimer && clearInterval(scoreTimer);
  timeTimer && clearInterval(timeTimer);
  totalScore = 0;
  totalTime = 0;
}

resetGame();

let fetchLevelData = level => {
  let token = localStorage.getItem("token");
  fetch('/api/level_data/' + level, {
    headers: {
      "token": token
    }
  })
  .then(res => {
    console.log(res);
    return res.json();
  })
  .then(data => {
    console.log(data);
    let i;
    let iArr = [];
    // eventually we will want to create play-color elements in these while loops
    let j = 0;
    while (iArr.length < data.solutionColors.length + data.decoyColors.length){
      i = Math.floor(Math.random() * (data.solutionColors.length + data.decoyColors.length));
      if (j < data.solutionColors.length && !iArr.includes(i)) {
        playColors[i].setAttribute('data-target', true);
        playColors[i].style.backgroundColor = data.solutionColors[j];
        j++;
        iArr.push(i);
      } else if (!iArr.includes(i)) {
        playColors[i].style.backgroundColor = data.decoyColors[j - data.solutionColors.length];
        iArr.push(i);
        j++;
      }
    }
    let color_1 = $.Color(data.solutionColors[0]);
    let color_2 = $.Color(data.solutionColors[1]);
    document.querySelector('.mixed-color').style.backgroundColor = Color_mixer.mix(color_1, color_2).toHexString();
    // Starting score
    score = 100;
    scoreDisplay.textContent = score;
    scoreTimer = setInterval(() => {
      if (score > 0) {
        score--;
        scoreDisplay.textContent = score;
      }
    }, 200);
    totalScoreDisplay.textContent = totalScore;
    // Starting time
    time = 0;
    timeDisplay.textContent = time;
    timeTimer = setInterval(() => {
      time++;
      timeDisplay.textContent = time;
    }, 1000);
    totalTimeDisplay.textContent = totalTime;
  });
}
// reset position of element
let resetElement = (element => {
  element.style.transform = 'translate(0px, 0px)';
  element.setAttribute('data-x', 0);
  element.setAttribute('data-y', 0);
})
// target elements with the "draggable" class
interact('.play-color')
  .draggable({
    // enable inertial throwing
    inertia: true,
    // enable autoScroll
    autoScroll: true,

    // call this function on every dragmove event
    onmove: dragMoveListener,
    // call this function on every dragend event
    onend: function (event) {
      resetElement(event.target);
      event.target.style.zIndex = 0;
    }
  });

  function dragMoveListener (event) {
    var target = event.target,
        // keep the dragged position in the data-x/data-y attributes
        x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx,
        y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

    // translate the element
    target.style.webkitTransform =
    target.style.transform =
      'translate(' + x + 'px, ' + y + 'px)';

    // update the posiion attributes
    target.setAttribute('data-x', x);
    target.setAttribute('data-y', y);
    // set z-index
    target.style.zIndex = 1;
  }

// enable draggables to be dropped into this
interact('.play-color').dropzone({
  // only accept elements matching this CSS selector
  accept: '.play-color',
  // Require a 25% element overlap for a drop to be possible
  overlap: 0.25,

  // listen for drop related events:

  ondropactivate: function (event) {
    // add active dropzone feedback
    // event.target.classList.add('drop-active');
  },
  ondragenter: function (event) {
    var draggableElement = event.relatedTarget,
        dropzoneElement = event.target;

    // feedback the possibility of a drop
    dropzoneElement.classList.add('drop-target');
    draggableElement.classList.add('can-drop');
  },
  ondrop: function (event) {
    let feedbackDisplay = document.querySelector('.feedback');
    if (event.target.getAttribute('data-target') === 'true' &&
    event.relatedTarget.getAttribute('data-target') === 'true') {
      feedbackDisplay.textContent = "Correct!";
      // Insert Game logic for correct answer
      let color_1 = $.Color(event.relatedTarget.style.backgroundColor);
      let color_2 = $.Color(event.target.style.backgroundColor);
      let result_color = Color_mixer.mix(color_1,color_2);
      event.target.style.backgroundColor = result_color.toHexString();
      event.relatedTarget.classList.add('hidden');
      event.target.setAttribute('data-target', false)
      event.relatedTarget.setAttribute('data-target', false)
      clearInterval(scoreTimer);
      clearInterval(timeTimer);
      totalScore += score;
      totalScoreDisplay.textContent = totalScore;
      totalTime += time;
      totalTimeDisplay.textContent = totalTime;
      // Send level data to server.
      let sendLevelData = levelData => {
        fetch('/api/game_data',  {
          method: 'POST',
          headers: {
            "Content-Type": "application/json",
            "token": token
          },
          body: JSON.stringify(levelData)
        }).then(res => {
          return res.json();
        })
        .then(data => {
          console.log(data);
        });
      }
      let levelData = {
        stage,
        level,
        score,
        time
      };
      console.log(JSON.stringify(levelData));
      let token = localStorage.getItem("token");
      console.log(token);
      sendLevelData(levelData);
      setTimeout(() => {
        level++;
        resetElement(event.relatedTarget);
        event.relatedTarget.classList.remove('hidden');
        feedbackDisplay.textContent = '';
        if (level > 4) {
          level = 0;  // Send total game data to level = 0
          score = totalScore;
          time = totalTime;
          levelData = {
            stage,
            level,
            score,
            time
          };
          sendLevelData(levelData);
          showStatsButton();
          showStats();
          resetGame();
          return;
        }
        fetchLevelData(level);
      }, 1000);
    } else {
      // Insert Game logic for wrong answer
      if (score > 0) {
        feedbackDisplay.textContent = "Penalty, wrong answer: -10 points";
        score -= 10;
        scoreDisplay.textContent = score;
        setTimeout(() => {
          feedbackDisplay.textContent = '';
        }, 1000)
      }
      resetElement(event.relatedTarget);
    }
  },
  ondropdeactivate: function (event) {
    // remove active dropzone feedback
    event.target.classList.remove('drop-active');
    event.target.classList.remove('drop-target');
  }
});
