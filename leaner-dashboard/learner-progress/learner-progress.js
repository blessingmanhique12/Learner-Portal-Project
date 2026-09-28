
/* =========================
   QUIZ QUESTIONS
========================= */

const quizBank = {

  html: [
    [
      "Which tag is used for the largest heading?",
      ["h1", "p", "div"],
      0
    ],

    [
      "Which tag creates a paragraph?",
      ["section", "p", "header"],
      1
    ],

    [
      "Which attribute provides alternative text for an image?",
      ["src", "alt", "href"],
      1
    ],

    [
      "Which element creates a hyperlink?",
      ["a", "link", "url"],
      0
    ],

    [
      "Which tag is used for an unordered list?",
      ["ol", "ul", "li"],
      1
    ]
  ],

  css: [
    [
      "Which property changes text color?",
      ["font-size", "color", "background"],
      1
    ],

    [
      "Which property controls space inside an element?",
      ["margin", "padding", "display"],
      1
    ],

    [
      "Which value makes an element a flex container?",
      ["block", "grid", "flex"],
      2
    ],

    [
      "Which symbol selects a class in CSS?",
      ["#", ".", "*"],
      1
    ],

    [
      "Which property rounds corners?",
      ["border-radius", "corner", "radius"],
      0
    ]
  ],

  javascript: [
    [
      "Which keyword creates a block-scoped variable that can be reassigned?",
      ["const", "let", "static"],
      1
    ],

    [
      "Which keyword cannot normally be reassigned?",
      ["let", "var", "const"],
      2
    ],

    [
      "Which method adds an item to the end of an array?",
      ["push()", "pop()", "shift()"],
      0
    ],

    [
      "What does typeof return?",
      ["A value's type", "A value's length", "A value's index"],
      0
    ],

    [
      "Which symbol is used for strict equality?",
      ["=", "==", "==="],
      2
    ]
  ]
};


/* =========================
   GET HTML ELEMENTS
========================= */

const app = document.getElementById("app");

const loginScreen =
  document.getElementById("loginScreen");

const modal =
  document.getElementById("modal");

const modalContent =
  document.getElementById("modalContent");


/* =========================
   SAVE DATA
========================= */

function saveState() {

  localStorage.setItem(
    "learnerHubState",
    JSON.stringify(state)
  );

}


/* =========================
   LOAD DATA
========================= */

function loadState() {

  const saved =
    localStorage.getItem("learnerHubState");

  if (!saved) {
    return;
  }

  try {

    const parsed =
      JSON.parse(saved);

    Object.assign(
      state,
      parsed
    );

  } catch (error) {

    localStorage.removeItem(
      "learnerHubState"
    );

  }

}


/* =========================
   OPEN MODAL
========================= */

function openModal(content) {

  modalContent.innerHTML =
    content;

  modal.classList.remove(
    "hidden"
  );

}


/* =========================
   CLOSE MODAL
========================= */

function closeModal() {

  modal.classList.add(
    "hidden"
  );

  modalContent.innerHTML = "";

}


/* =========================
   CLOSE MODAL BUTTON
========================= */

document
  .getElementById("modalClose")
  .addEventListener(
    "click",
    closeModal
  );


/* =========================
   CLOSE MODAL OUTSIDE
========================= */

modal.addEventListener(
  "click",
  function (event) {

    if (
      event.target === modal
    ) {

      closeModal();

    }

  }
);


/* =========================
   RENDER GOALS
========================= */

function renderGoals() {

  const list =
    document.getElementById(
      "goalsList"
    );

  list.innerHTML =
    state.goals
      .map(function (goal) {

        return `
          <div class="goal-row">

            <span class="goal-check">
              ✓
            </span>

            <span class="goal-text">
              ${escapeHtml(goal)}
            </span>

          </div>
        `;

      })
      .join("");

  document.getElementById(
    "goalCount"
  ).textContent =
    Math.max(
      12,
      state.goals.length
    );

}



  /* DELETE BUTTONS */

  document
    .querySelectorAll(".delete-task")
    .forEach(function (button) {

      button.addEventListener(
        "click",
        function () {

          const index =
            Number(
              button.dataset.delete
            );

          state.tasks.splice(
            index,
            1
          );

          saveState();

          renderTasks();

          updateDashboardProgress();

        }
      );

    });


  updateDashboardProgress();


/* =========================
   UPDATE PROGRESS
========================= */

function updateDashboardProgress() {

  const outstanding =
    state.tasks.filter(
      function (task) {
        return !task.completed;
      }
    ).length;

  const overdue =
    state.tasks.filter(
      function (task) {

        return (
          !task.completed &&
          task.overdue
        );

      }
    ).length;


  document.getElementById(
    "outstandingCount"
  ).textContent =
    outstanding;


  document.getElementById(
    "overdueCount"
  ).textContent =
    overdue;

}


/* =========================
   SECURITY / TEXT
========================= */

function escapeHtml(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


/* =========================
   ADD GOAL
========================= */

document
  .getElementById("addGoalBtn")
  .addEventListener(
    "click",
    function () {

      openModal(`

        <h2 class="modal-title">
          Add a new goal
        </h2>

        <p class="modal-subtitle">
          Add a focus area for your learning journey.
        </p>

        <form id="goalForm">

          <div class="form-group">

            <label for="goalInput">
              Goal
            </label>

            <input
              id="goalInput"
              required
              maxlength="80"
              placeholder="e.g. Complete my portfolio"
            >

          </div>

          <button
            class="primary-btn"
            type="submit">

            Add Goal

          </button>

        </form>

      `);


      document
        .getElementById("goalForm")
        .addEventListener(
          "submit",
          function (event) {

            event.preventDefault();

            const value =
              document
                .getElementById(
                  "goalInput"
                )
                .value
                .trim();

            if (!value) {
              return;
            }

            state.goals.push(
              value
            );

            saveState();

            renderGoals();

            closeModal();

          }
        );

    }
  );


/* =========================
   PREVIEW EMPTY STATES
========================= */

document
  .getElementById("previewBtn")
  .addEventListener(
    "click",
    function () {

      openModal(`

        <h2 class="modal-title">
          Empty State Preview
        </h2>

        <p class="modal-subtitle">
          This is how the dashboard responds when a section has no data.
        </p>

        <div class="empty-state">

          <div
            class="circle-icon blue"
            style="margin:0 auto 10px;">

            ○

          </div>

          Nothing to display yet.

        </div>

      `);

    }
  );


/* =========================
   START QUIZ
========================= */

function startQuiz(stage = "javascript") {

  const questions =
    quizBank[stage] ||
    quizBank.javascript;

  let current = 0;

  let score = 0;


  function renderQuestion() {

    const [
      question,
      answers
    ] = questions[current];


    modalContent.innerHTML = `

      <h2 class="modal-title">
        ${stageLabel(stage)}
      </h2>

      <p class="modal-subtitle">
        Question ${current + 1}
        of
        ${questions.length}
      </p>

      <div class="quiz-question">

        <h3>
          ${escapeHtml(
            question
          )}
        </h3>

        ${answers
          .map(function (
            answer,
            index
          ) {

            return `

              <label class="answer">

                <input
                  type="radio"
                  name="quizAnswer"
                  value="${index}"
                >

                ${escapeHtml(
                  answer
                )}

              </label>

            `;

          })
          .join("")}

        <div
          id="quizFeedback"
          class="quiz-feedback">
        </div>

      </div>

      <button
        class="primary-btn"
        id="nextQuizBtn">

        ${
          current ===
          questions.length - 1
            ? "Finish Quiz"
            : "Next question"
        }

      </button>

    `;


    document
      .getElementById(
        "nextQuizBtn"
      )
      .addEventListener(
        "click",
        function () {

          const selected =
            document.querySelector(
              "input[name='quizAnswer']:checked"
            );

          const feedback =
            document.getElementById(
              "quizFeedback"
            );


          if (!selected) {

            feedback.textContent =
              "Please select an answer first.";

            feedback.style.color =
              "#d54c4c";

            return;

          }


          if (
            Number(
              selected.value
            ) === questions[current][2]
          ) {

            score++;

            feedback.textContent =
              "Correct.";

            feedback.style.color =
              "#269576";

          } else {

            feedback.textContent =
              `Not quite. The correct answer is ${
                questions[current][1][
                  questions[current][2]
                ]
              }.`;

            feedback.style.color =
              "#d54c4c";

          }


          document.getElementById(
            "nextQuizBtn"
          ).disabled = true;


          setTimeout(
            function () {

              current++;


              if (
                current <
                questions.length
              ) {

                renderQuestion();

              } else {

                modalContent.innerHTML = `

                  <h2 class="modal-title">
                    Quiz Complete
                  </h2>

                  <p class="modal-subtitle">
                    You completed the
                    ${stageLabel(stage)}.
                  </p>

                  <div class="empty-state">

                    <h3>
                      ${score}
                      /
                      ${questions.length}
                    </h3>

                    <p>
                      Your score has been recorded for this session.
                    </p>

                  </div>

                  <button
                    class="primary-btn"
                    id="quizDoneBtn">

                    Done

                  </button>

                `;


                document
                  .getElementById(
                    "quizDoneBtn"
                  )
                  .addEventListener(
                    "click",
                    closeModal
                  );

              }

            },
            650
          );

        }
      );

  }


  modal.classList.remove(
    "hidden"
  );

  renderQuestion();

}


/* =========================
   STAGE LABEL
========================= */

function stageLabel(stage) {

  return {

    html: "HTML Quiz",

    css: "CSS Quiz",

    javascript:
      "JavaScript Quiz",

    rps:
      "Rock, Paper, Scissors",

    chess:
      "Chess"

  }[stage] || "Skills Assessment";

}


/* =========================
   START MAIN QUIZ
========================= */

document
  .getElementById("startQuizBtn")
  .addEventListener(
    "click",
    function () {

      startQuiz(
        "javascript"
      );

    }
  );


/* =========================
   PROGRAMME STAGES
========================= */

document
  .querySelectorAll(".stage-btn")
  .forEach(
    function (button) {

      button.addEventListener(
        "click",
        function () {

          const stage =
            button.dataset.stage;


          if (
            stage === "rps"
          ) {

            startRps();

          } else if (
            stage === "chess"
          ) {

            startChess();

          } else {

            startQuiz(stage);

          }

        }
      );

    }
  );


/* =========================
   ROCK PAPER SCISSORS
========================= */

function startRps() {

  let userScore = 0;

  let computerScore = 0;


  openModal(`

    <h2 class="modal-title">
      Rock, Paper, Scissors
    </h2>

    <p class="modal-subtitle">
      Choose your move.
    </p>

    <div class="rps-buttons">

      <button data-choice="Rock">
        Rock
      </button>

      <button data-choice="Paper">
        Paper
      </button>

      <button data-choice="Scissors">
        Scissors
      </button>

    </div>

    <div
      class="rps-result"
      id="rpsResult">

      Your score: 0 |
      Computer: 0

    </div>

  `);


  document
    .querySelectorAll(
      ".rps-buttons button"
    )
    .forEach(
      function (button) {

        button.addEventListener(
          "click",
          function () {

            const choices = [
              "Rock",
              "Paper",
              "Scissors"
            ];

            const computer =
              choices[
                Math.floor(
                  Math.random() *
                  choices.length
                )
              ];

            const user =
              button.dataset.choice;


            if (
              user !== computer
            ) {

              const wins =
                (
                  user === "Rock" &&
                  computer === "Scissors"
                ) ||
                (
                  user === "Paper" &&
                  computer === "Rock"
                ) ||
                (
                  user === "Scissors" &&
                  computer === "Paper"
                );


              if (wins) {

                userScore++;

              } else {

                computerScore++;

              }

            }


            const result =
              user === computer
                ? "It's a draw."
                : userScore >
                  computerScore
                    ? "You won this round."
                    : "The computer won this round.";


            document.getElementById(
              "rpsResult"
            ).innerHTML = `

              <strong>
                You:
              </strong>
              ${user}

              &nbsp;

              <strong>
                Computer:
              </strong>
              ${computer}

              <br>

              ${result}

              <br><br>

              Your score:
              ${userScore}

              |

              Computer:
              ${computerScore}

            `;

          }
        );

      }
    );

}


/* =========================
   CHESS
========================= */

function startChess() {

  const initial = [

    ["♜","♞","♝","♛","♚","♝","♞","♜"],

    ["♟","♟","♟","♟","♟","♟","♟","♟"],

    ["","","","","","","",""],

    ["","","","","","","",""],

    ["","","","","","","",""],

    ["","","","","","","",""],

    ["♙","♙","♙","♙","♙","♙","♙","♙"],

    ["♖","♘","♗","♕","♔","♗","♘","♖"]

  ];


  let board =
    initial.map(
      function (row) {

        return [...row];

      }
    );


  let selected = null;


  function renderBoard() {

    modalContent.innerHTML = `

      <h2 class="modal-title">
        Chess
      </h2>

      <p class="modal-subtitle">
        Select a piece, then select a square to move it.
        This is a basic interactive board.
      </p>

      <div class="chess-board">

        ${board
          .flatMap(
            function (row, r) {

              return row.map(
                function (piece, c) {

                  return `

                    <button
                      class="chess-square
                        ${
                          (r + c) % 2
                            ? "dark"
                            : "light"
                        }
                        ${
                          selected &&
                          selected[0] === r &&
                          selected[1] === c
                            ? "selected"
                            : ""
                        }"

                      data-r="${r}"
                      data-c="${c}">

                      ${piece}

                    </button>

                  `;

                }
              );

            }
          )
          .join("")}

      </div>

      <button
        class="secondary-btn"
        id="resetChess">

        Reset board

      </button>

    `;


    document
      .querySelectorAll(
        ".chess-square"
      )
      .forEach(
        function (square) {

          square.addEventListener(
            "click",
            function () {

              const r =
                Number(
                  square.dataset.r
                );

              const c =
                Number(
                  square.dataset.c
                );


              if (!selected) {

                if (
                  board[r][c]
                ) {

                  selected = [
                    r,
                    c
                  ];

                }

              } else {

                const [
                  fromR,
                  fromC
                ] = selected;


                board[r][c] =
                  board[fromR][fromC];

                board[fromR][fromC] =
                  "";

                selected = null;

              }


              renderBoard();

            }
          );

        }
      );


    document
      .getElementById(
        "resetChess"
      )
      .addEventListener(
        "click",
        function () {

          board =
            initial.map(
              function (row) {

                return [...row];

              }
            );

          selected = null;

          renderBoard();

        }
      );

  }


  openModal("");

  renderBoard();

}


/* =========================
   RESTART ALL
========================= */

document
  .getElementById("restartAllBtn")
  .addEventListener(
    "click",
    function () {

      const confirmed =
        confirm(
          "Restart all programme progress?"
        );


      if (!confirmed) {
        return;
      }


      state.quiz.current = 0;

      state.quiz.score = 0;


      state.tasks =
        state.tasks.map(
          function (task) {

            return {
              ...task,
              completed: false
            };

          }
        );


      saveState();

      renderTasks();

      alert(
        "Programme progress has been reset."
      );

    }
  );


/* =========================
   NAVIGATION
========================= */

document
  .querySelectorAll(".nav-link")
  .forEach(
    function (link) {

      link.addEventListener(
        "click",
        function () {

          document
            .querySelectorAll(
              ".nav-link"
            )
            .forEach(
              function (item) {

                item.classList.remove(
                  "active"
                );

              }
            );


          link.classList.add(
            "active"
          );


          const section =
            link.dataset.section;


          const targets = {

            home:
              "progressCard",

            goals:
              "goalsSection",

            tasks:
              "tasksSection",

            support:
              "supportSection",

            progress:
              "progressSection"

          };


          const target =
            document.getElementById(
              targets[section]
            );


          if (target) {

            target.scrollIntoView({
              behavior: "smooth",
              block: "start"
            });

          }

        }
      );

    }
  );


/* =========================
   LOGOUT
========================= */

document
  .getElementById("logoutBtn")
  .addEventListener(
    "click",
    function () {

      const confirmed =
        confirm(
          "Are you sure you want to log out?"
        );


      if (!confirmed) {
        return;
      }


      app.classList.add(
        "hidden"
      );

      loginScreen.classList.remove(
        "hidden"
      );

    }
  );


/* =========================
   SIGN IN
========================= */

document
  .getElementById("signInBtn")
  .addEventListener(
    "click",
    function () {

      loginScreen.classList.add(
        "hidden"
      );

      app.classList.remove(
        "hidden"
      );

    }
  );


/* =========================
   START APPLICATION
========================= */

loadState();

renderGoals();

renderBookings();

renderTasks();