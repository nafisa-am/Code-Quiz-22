const startBtn = document.getElementById("start-quiz");

// To start the game //
let game = null;

// Generic event listeners //
window.addEventListener("load", () => {
  game = new Game();
});

document.querySelector("#scoreboard").addEventListener("click", () => {
  if (!game.timer) {
    document.querySelector("#intro").classList.remove("active");
    HighScores.viewHighScores();
  }
});

document.querySelector(".highscore-back").addEventListener("click", () => {
  document.querySelector("#leaderboard-section").classList.remove("active");
  document.querySelector("#intro").classList.add("active");
});

document.querySelector(".highscore-clear").addEventListener("click", () => {
  if (confirm("Do you really want to remove all your highscores?")) {
    HighScores.clear();
    HighScores.viewHighScores();
  }
});

startBtn.addEventListener("click", () => {
  game.startQuiz(90, true);
});

class Timer {
  constructor(remainingTime = 90, game) {
    if (game) {
      this.remainingTime = remainingTime;
      this.timer = null;
    }
  }

  start() {
    document
      .querySelector(".see-remaining-time")
      .classList.add("js-is-counting");

    if (this.timer === null) {
      clearTimeout(this.timer);
    }

    this.tick();
  }

  modifyTime(change) {
    this.remainingTime += change;
  }

  tick() {
    this.remainingTime -= 1;

    if (this.remainingTime <= 0) {
      // time up!
      game.timerElement.innerHTML = 0;

      clearTimeout(this.timer);
      game.endQuiz();
    } else {
      game.timerElement.innerHTML = this.remainingTime;

      this.timer = setTimeout(() => {
        this.tick();
      }, 1000);
    }
  }

  end() {
    clearTimeout(this.timer);
    this.timer = null;
    document
      .querySelector(".see-remaining-time")
      .classList.remove("js-is-counting");
  }
}

class Game {
  constructor() {
    this.answers = {};
    this.timer = null;
    this.question = 0;
    this.score = 0;
    this.remainingTime = 0;
    this.timerElement = document.querySelector("#time-remaining");
  }

  startQuiz(timer, random) {
    this.question = 0;
    this.generateQuestions(random);
    this.timer = new Timer(timer ? timer : 90, this);

    this.timer.start();
    this.score = 0;

    document.querySelector("#intro").classList.remove("active");
    document.querySelector("#questions-section").classList.add("active");
  }

  generateQuestions(random = false) {
    let output = ``;

    document.querySelector("#questions").innerHTML = "";

    let questionsArray = random
      ? questions.sort(() => Math.random() - 0.5)
      : questions;

    for (var key in questionsArray) {
      let sectionClass = parseInt(key) === 0 ? "active" : "";
      let answers = `<section class="question-set-${key} ${sectionClass}">
                  <h2>${questionsArray[key].questionText}</h2>
                  <ul class="questions-list" data-question-id="${key}">
              `;

      questionsArray[key].options.forEach((answer, i) => {
        answers += `<li>
                      <label>
                          <input type="radio" name="question-${key}" value="${i}">
                          <span>${answer}</span>
                      </label>
                  </li>`;
      });

      answers += `</ul><div class="js-feedback"></div></section>`;

      output += answers;
    }
    document.querySelector("#questions").innerHTML = output;

    this.addEvents();
  }

  generateInputScreen(score) {
    let template = `<h1>Quiz Completed</h1>
              <p>Your final score is ${score ? score : 0}</p>
              <form id="js-highscore-submit" name="highscore-submit">
                  <input type="hidden" name="score" value="${score}"">
                  <label>Enter initials<input type="text" name="initials" maxlength="3"></label>
                  <button type="submit">Submit</submit>
              </form>`;

    document.querySelector("#highscore-input").innerHTML = template;

    (() => {
      // add event listeners to form
      const form = document.getElementById("js-highscore-submit");

      form.addEventListener("submit", (event) => {
        event.preventDefault();

        let formData = new FormData(event.target);

        if (formData.get("initials").length > 0) {
          HighScores.addScore(formData.get("initials"), score);
          document.querySelector("#highscore-input").classList.remove("active");
          HighScores.viewHighScores();
        } else {
          alert("invalid initials");
        }
      });
    })();
  }

  addEvents() {
    let questionsInputs = document.querySelectorAll(
      "section input[type=radio]"
    );

    questionsInputs.forEach((question) => {
      question.addEventListener(
        "click",
        ({ target }) => {
          if (
            this.verifyAnswer(
              target.name.replace("question-", ""),
              target.value
            )
          ) {
            // correct answer
            this.score++;

            if (this.question === questions.length - 1) {
              this.endQuiz();
            } else {
              this.showNextQuestion();
            }
          } else {
            // incorrect answer
            this.showIncorrect();
            this.timer.modifyTime(-10);
          }
        },
        true
      );
    });
  }

  endQuiz() {
    this.timer.end();
    this.showScoreForm(this.calculateFinalScore());
    this.timer = null;
  }

  showNextQuestion() {
    // hide previous question
    const curQuestion = document.querySelector(
      `.question-set-${this.question}`
    );
    const nextQuestion = document.querySelector(
      `.question-set-${this.question + 1}`
    );
    const feedback = curQuestion.querySelector(".js-feedback");

    feedback.innerHTML = "Correct, Well Done ✅";
    curQuestion.style.pointerEvents = "none";

    setTimeout(() => {
      curQuestion.classList.toggle("active");
      nextQuestion.classList.toggle("active");

      this.question++;
    }, 100);
  }

  showScoreForm(score) {
    document.querySelector("#questions-section").classList.remove("active");
    document.querySelector("#highscore-input").classList.add("active");

    this.generateInputScreen(score);
  }

  calculateFinalScore() {
    return (
      this.score * 10 +
      (this.timer.remainingTime < 0 ? 0 : this.timer.remainingTime)
    );
  }

  showIncorrect() {
    const curQuestion = document.querySelector(
      `.question-set-${this.question}`
    );
    const feedback = curQuestion.querySelector(".js-feedback");

    feedback.innerHTML = "Incorrect answer, 10 seconds lost ❌";
  }

  verifyAnswer(questionNo, answer) {
    // Correct answers
    if (
      questions[questionNo].answer === questions[questionNo].options[answer]
    ) {
      return true;
    } else {
      return false;
    }
  }

  calculateResults() {
    let questions = document.querySelectorAll(
      "section input[type=radio]:checked"
    );
    let score = 0;

    questions.forEach((question, index) => {
      if (
        this.verifyAnswer(
          question.name.replace("question-", ""),
          question.value
        )
      ) {
        score = score + 10;
      }
    });

    return score;
  }
}

class HighScores {
  static localStorageKey = "game-highscore";

  // Adds score to local storage
  static addScore(initials, score) {
    let currentScores = this.getScores();
    currentScores.push({ initials, score });
    this.saveLeaderBoard(currentScores);
  }

  // Retrieves scores from local storage
  static getScores() {
    let highScore = localStorage.getItem(this.localStorageKey);

    if (highScore) {
      return JSON.parse(highScore);
    } else {
      return [];
    }
  }

  static saveLeaderBoard(scores) {
    localStorage.setItem(this.localStorageKey, JSON.stringify(scores));
  }

  static clear() {
    localStorage.clear(this.localStorageKey);
  }

  static viewHighScores() {
    let scores = this.getScores();
    let template = `<ul>`;

    scores.sort((score1, score2) => {
      if (score1.score > score2.score) {
        return -1;
      } else {
        return 1;
      }
    });

    scores.forEach((entry) => {
      template += `<li>${entry.initials} - ${entry.score}</li>`;
    });

    template += "</ul>";

    document.querySelector("#leaderboard-section").classList.add("active");
    document.querySelector("#leaderboard-section .highscores-list").innerHTML =
      template;
  }
}
