/* ==========================================================
   FILE TYPE: JAVASCRIPT (learner-progress.js)
   Markers used in this file:
   // [NEW]     = code that was added
   // [CHANGED] = code that was updated
   // [REMOVED] = note where old code was deleted
   Everything else is your original code, unchanged.
   ========================================================== */

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import {
  addDoc, // [NEW] needed to save a new support booking
  doc,
  getDoc,
  collection,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { auth, db } from "../../FirebaseAuth/firebase.js";
import { Chess } from "https://cdn.jsdelivr.net/npm/chess.js@1.4.0/+esm";
import { ChessGame } from "../../game/classes/ChessGame.js";
import { ProgressManager } from "../../game/classes/ProgressManager.js";
import { QuizGame } from "../../game/classes/QuizGame.js";
import { RPSGame } from "../../game/classes/RPSGame.js";
import { chessLevels, chessPieces, chooseComputerMove } from "../../game/stage4-chess/stage4-chess.js";

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

const createInitialState = () => ({
  goals: [],
  tasks: [],
  bookings: [],
  quiz: { current: 0, score: 0 },
  assessment: null,
  games: {
    html: false,
    rps: false,
    css: false,
    chess: false,
    javascript: false
  }
});

let state = createInitialState();
let stateStorageKey = null;
let progressManager = new ProgressManager();
let progressRepository = null;
let unsubscribeBookings = null;
let unsubscribeAssignments = null;
let previewEmpty = false; // [NEW] true while "Preview empty states" is switched on

const stageKeys = ["html", "rps", "css", "chess", "javascript"];
const PASS_MARK = 60;

class LearnerProgressRepository {
  constructor(database, userId) {
    this.database = database;
    this.userId = userId;
  }

  async load() {
    const progressSnapshot = await getDoc(
      doc(this.database, "learnerProgress", this.userId)
    );
    return progressSnapshot.exists() ? progressSnapshot.data() : null;
  }

  async recordResult({ games, stage, score, maxScore, game, assessment, assessmentAssignmentId }) {
    if (!Number.isFinite(score) || !Number.isFinite(maxScore) || maxScore < 1) {
      throw new Error("A valid game score is required before saving progress.");
    }

    const percentage = Math.round((score / maxScore) * 100);
    const passed = stage ? percentage >= PASS_MARK : null;
    const nextGames = stage && passed ? { ...games, [stage]: true } : games;
    const latestAssessment = assessment
      ? { score, maxScore, percentage, game }
      : state.assessment;
    const batch = writeBatch(this.database);
    const scoreReference = doc(collection(this.database, "scores"));

    const scoreData = {
      userId: this.userId,
      stage: stage || "skills-assessment",
      game,
      score,
      maxScore,
      percentage,
      passMark: stage ? PASS_MARK : null,
      passed,
      assessment: Boolean(assessment),
      completedAt: serverTimestamp()
    };
    if (assessmentAssignmentId) {
      scoreData.assessmentAssignmentId = assessmentAssignmentId;
      batch.update(doc(this.database, "assessmentAssignments", assessmentAssignmentId), {
        status: "completed",
        completedAt: serverTimestamp(),
        scoreId: scoreReference.id
      });
    }
    batch.set(scoreReference, scoreData);
    batch.set(doc(this.database, "learnerProgress", this.userId), {
      userId: this.userId,
      games: nextGames,
      lastScoreId: scoreReference.id,
      latestAssessment,
      updatedAt: serverTimestamp()
    }, { merge: true });

    await batch.commit();
    return { games: nextGames, assessment: latestAssessment, percentage, passed };
  }

  async saveProgress(games, assessment) {
    await setDoc(doc(this.database, "learnerProgress", this.userId), {
      userId: this.userId,
      games,
      latestAssessment: assessment,
      updatedAt: serverTimestamp()
    }, { merge: true });
  }
}

function syncProgressManager(games) {
  progressManager.reset();

  for (const [index, stage] of stageKeys.entries()) {
    if (!games[stage]) {
      break;
    }
    progressManager.completeStage(index + 1);
  }

  state.games = Object.fromEntries(
    stageKeys.map((stage, index) => [stage, progressManager.isStageComplete(index + 1)])
  );
}


/* =========================
   SAVE DATA
========================= */

function saveState() {

  localStorage.setItem(
    stateStorageKey,
    JSON.stringify(state)
  );

}


/* =========================
   LOAD DATA
========================= */

function loadState() {

  const saved = stateStorageKey
    ? localStorage.getItem(stateStorageKey)
    : null;

  if (!saved) {
    return;
  }

  try {

    const parsed =
      JSON.parse(saved);

    const defaults = createInitialState();
    state = {
      ...defaults,
      ...parsed,
      quiz: { ...defaults.quiz, ...parsed.quiz },
      assessment: parsed.assessment || defaults.assessment,
      games: { ...defaults.games, ...parsed.games },
      goals: (parsed.goals || []).map((goal) =>
        typeof goal === "string"
          ? { title: goal, completed: false }
          : { ...goal, completed: Boolean(goal.completed) }
      ),
      tasks: (parsed.tasks || []).map((task) =>
        typeof task === "string"
          ? { title: task, completed: false }
          : { ...task, completed: Boolean(task.completed) }
      )
    };

  } catch (error) {

    if (stateStorageKey) {
      localStorage.removeItem(stateStorageKey);
    }

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

  // [NEW] reset the assessment bar if the quiz was closed part-way through
  renderAssessmentProgress();

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
   [NEW] HELPER FUNCTIONS
   (overdue check, upcoming bookings, empty-state preview)
========================= */

// Today's date as "YYYY-MM-DD" (same format as the date input)
function getTodayString() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

// Overdue = has a due date, is not completed, and the date has passed
function isTaskOverdue(task) {
  return Boolean(task.dueDate) && !task.completed && task.dueDate < getTodayString();
}

// Upcoming = not completed and not cancelled
function isBookingUpcoming(booking) {
  const status = String(booking.status || "pending").toLowerCase();
  return status !== "completed" && status !== "cancelled";
}

// In preview mode the dashboard pretends there is no data (real data is NOT touched)
function getVisibleData() {
  if (previewEmpty) {
    return { goals: [], tasks: [], bookings: [] };
  }
  return { goals: state.goals, tasks: state.tasks, bookings: state.bookings };
}

function refreshDashboard() {
  renderGoals();
  renderTasks();
  renderBookings();
}

function setEmptyPreview(isOn) {
  previewEmpty = isOn;
  document.getElementById("previewBtn").textContent =
    isOn ? "Exit preview" : "Preview empty states";
  refreshDashboard();
}


/* =========================
   RENDER GOALS
   [CHANGED] now shows an empty state and uses getVisibleData()
========================= */

function renderGoals() {

  const list =
    document.getElementById(
      "goalsList"
    );

  const goals = getVisibleData().goals;

  list.innerHTML = goals.length
    ? goals
      .map(function (goal, index) {

        return `
          <div class="goal-row ${goal.completed ? "completed" : ""}">
            <input
              class="goal-check"
              type="checkbox"
              data-goal-toggle="${index}"
              aria-label="Mark ${escapeHtml(goal.title)} complete"
              ${goal.completed ? "checked" : ""}
            >
            <span class="goal-text">${escapeHtml(goal.title)}</span>
            <button class="delete-task" type="button" data-goal-delete="${index}" aria-label="Delete ${escapeHtml(goal.title)}">×</button>
          </div>
        `;

      })
      .join("")
    : '<div class="empty-state">No goals yet.</div>';

  document.getElementById(
    "goalCount"
  ).textContent =
    goals.length;

  list.querySelectorAll("[data-goal-toggle]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      state.goals[Number(checkbox.dataset.goalToggle)].completed = checkbox.checked;
      saveState();
      renderGoals();
    });
  });

  list.querySelectorAll("[data-goal-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      state.goals.splice(Number(button.dataset.goalDelete), 1);
      saveState();
      renderGoals();
    });
  });

  updateDashboardProgress();
}

// [REMOVED] The old leftover "DELETE BUTTONS" block that used to sit here.
// It was left over from an old version of renderTasks and did nothing.


/* =========================
   UPDATE PROGRESS
   [CHANGED] overdue is now worked out from the due date
========================= */

function updateDashboardProgress() {

  const { goals, tasks } = getVisibleData();

  const outstanding =
    tasks.filter(
      function (task) {
        return !task.completed;
      }
    ).length;

  const overdue =
    tasks.filter(isTaskOverdue).length;


  document.getElementById(
    "outstandingCount"
  ).textContent =
    outstanding;


  document.getElementById(
    "overdueCount"
  ).textContent =
    overdue;

  const completedGames = Object.values(state.games).filter(Boolean).length;
  const completedGoals = goals.filter((goal) => goal.completed).length;
  const completedTasks = tasks.filter((task) => task.completed).length;
  const totalItems = 5 + goals.length + tasks.length;
  const percentage = totalItems
    ? Math.round(((completedGames + completedGoals + completedTasks) / totalItems) * 100)
    : 0;

  document.getElementById("overallProgressText").textContent = `${percentage}% complete`;
  document.getElementById("overallProgressFill").style.width = `${percentage}%`;
}

function renderStageButtons() {
  document.querySelectorAll(".stage-btn").forEach((button) => {
    const stageNumber = stageKeys.indexOf(button.dataset.stage) + 1;
    const available = progressManager.canStartStage(stageNumber);
    const currentStage = stageKeys.find((stage) => !state.games[stage]);
    button.disabled = false;
    button.setAttribute("aria-disabled", String(!available));
    button.classList.toggle("locked", !available);
    button.title = available
      ? "Open this stage"
      : `Pass ${stageLabel(currentStage)} with at least ${PASS_MARK}% to unlock this stage`;
  });
}

function showStageLockedMessage(stage) {
  const currentStage = stageKeys.find((stageKey) => !state.games[stageKey]);
  openModal(`
    <h2 class="modal-title">Complete the current stage first</h2>
    <p class="modal-subtitle">Pass ${stageLabel(currentStage)} with at least ${PASS_MARK}% before moving to ${stageLabel(stage)}.</p>
    <button class="primary-btn" id="lockedStageCloseBtn" type="button">OK</button>
  `);
  document.getElementById("lockedStageCloseBtn").addEventListener("click", closeModal);
}

function startStage(stage) {
  if (stage === "rps") {
    startRps();
  } else if (stage === "chess") {
    startChess();
  } else {
    startQuiz(stage);
  }
}

function continueToNextStage(stage) {
  const nextStage = stageKeys[stageKeys.indexOf(stage) + 1];
  closeModal();
  if (nextStage) {
    startStage(nextStage);
  }
}

function retryStage(stage) {
  closeModal();
  startStage(stage);
}

function renderAssessmentProgress(answered = null, total = 5) {
  const assessment = state.assessment;
  const label = document.getElementById("quizProgressLabel");
  const fill = document.getElementById("quizProgressFill");

  if (answered === null && assessment) {
    label.textContent = `Last score: ${assessment.score} of ${assessment.maxScore}`;
    fill.style.width = `${assessment.percentage}%`;
    return;
  }

  const completed = answered ?? 0;
  label.textContent = `${completed} of ${total} questions complete`;
  fill.style.width = `${Math.round((completed / total) * 100)}%`;
}

async function persistGameResult({
  stage,
  score,
  maxScore,
  game,
  assessment = false,
  assessmentAssignmentId = null
}) {
  const stageNumber = stage ? stageKeys.indexOf(stage) + 1 : null;
  if (stage && (!stageNumber || !progressManager.canStartStage(stageNumber))) {
    throw new Error("Complete the previous stage before starting this one.");
  }

  if (!progressRepository) {
    throw new Error("Your Firebase learner session is not ready. Please try again.");
  }

  const saved = await progressRepository.recordResult({
    games: state.games,
    stage,
    score,
    maxScore,
    game,
    assessment,
    assessmentAssignmentId
  });

  state.games = saved.games;
  state.assessment = saved.assessment;
  syncProgressManager(state.games);
  saveState();
  renderStageButtons();
  renderAssessmentProgress();
  updateDashboardProgress();
  return { percentage: saved.percentage, passed: saved.passed };
}

function showProgressSaveError() {
  modalContent.innerHTML = `
    <h2 class="modal-title">Progress could not be saved</h2>
    <p class="modal-subtitle">Your score was not recorded, so the next stage remains locked. Check your connection and try again.</p>
    <button class="primary-btn" id="retryCloseBtn" type="button">Close</button>
  `;
  document.getElementById("retryCloseBtn").addEventListener("click", closeModal);
}


/* =========================
   RENDER BOOKINGS
   [CHANGED] counter only counts upcoming bookings,
   empty state uses the existing .empty-state style,
   and respects preview mode
========================= */

function renderBookings() {
  const list = document.getElementById("bookingsList");
  const count = document.getElementById("bookingCount");
  const bookings = getVisibleData().bookings;

  if (!list) return;

  if (count) count.textContent = bookings.filter(isBookingUpcoming).length;
  list.replaceChildren();

  if (bookings.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No support sessions have been booked for you yet.";
    list.appendChild(empty);
    return;
  }

  [...bookings]
    .sort((first, second) => (first.preferredDate || "").localeCompare(second.preferredDate || ""))
    .forEach((booking) => {
      const item = document.createElement("div");
      item.className = "booking-item";

      const heading = document.createElement("div");
      heading.className = "booking-item-heading";
      const topic = document.createElement("strong");
      topic.textContent = booking.topic || "Support session";
      const status = document.createElement("span");
      status.className = `booking-status ${String(booking.status || "pending").toLowerCase()}`;
      status.textContent = booking.status || "pending";
      heading.append(topic, status);

      const date = document.createElement("p");
      date.textContent = `Preferred date: ${booking.preferredDate || "To be arranged"}`;
      const notes = document.createElement("p");
      notes.className = "booking-notes";
      notes.textContent = booking.notes || "No additional notes.";

      item.append(heading, date, notes);
      if (booking.status !== "completed") {
        const completeButton = document.createElement("button");
        completeButton.type = "button";
        completeButton.className = "booking-complete-button";
        completeButton.textContent = "Mark session complete";
        completeButton.addEventListener("click", () => completeLearnerBooking(booking, completeButton));
        item.appendChild(completeButton);
      }
      list.appendChild(item);
    });
}

async function completeLearnerBooking(booking, button) {
  button.disabled = true;
  try {
    await updateDoc(doc(db, "bookings", booking.id), {
      status: "completed",
      completedAt: serverTimestamp(),
      completedBy: auth.currentUser.uid
    });
  } catch (error) {
    console.error("Could not complete learner support session:", error);
    button.disabled = false;
    openModal(`
      <h2 class="modal-title">Session could not be completed</h2>
      <p class="modal-subtitle">Check your connection and try again. If this continues, contact your facilitator.</p>
      <button class="primary-btn" id="bookingErrorCloseBtn" type="button">Close</button>
    `);
    document.getElementById("bookingErrorCloseBtn").addEventListener("click", closeModal);
  }
}

function subscribeToBookings(userId) {
  if (unsubscribeBookings) unsubscribeBookings();

  const learnerBookingsQuery = query(
    collection(db, "bookings"),
    where("userId", "==", userId)
  );

  unsubscribeBookings = onSnapshot(learnerBookingsQuery, (snapshot) => {
    state.bookings = snapshot.docs.map((bookingDocument) => ({
      id: bookingDocument.id,
      ...bookingDocument.data()
    }));
    renderBookings();
  }, (error) => {
    console.error("Could not load learner support bookings:", error);
    const list = document.getElementById("bookingsList");
    if (list) list.textContent = "Support sessions could not be loaded. Please try again later.";
  });
}


/* =========================
   RENDER TASKS
   [CHANGED] uses getVisibleData() and the .empty-state style
========================= */

function subscribeToAssignedAssessments(userId) {
  if (unsubscribeAssignments) unsubscribeAssignments();

  const assignmentsQuery = query(
    collection(db, "assessmentAssignments"),
    where("userId", "==", userId)
  );

  unsubscribeAssignments = onSnapshot(assignmentsQuery, (snapshot) => {
    const list = document.getElementById("assignedAssessmentsList");
    const assignments = snapshot.docs
      .map((assignmentDocument) => ({
        id: assignmentDocument.id,
        ...assignmentDocument.data()
      }))
      .sort((first, second) => {
        const firstTime = first.assignedAt?.toMillis?.() || 0;
        const secondTime = second.assignedAt?.toMillis?.() || 0;
        return secondTime - firstTime;
      });

    list.replaceChildren();
    if (assignments.length === 0) {
      const empty = document.createElement("p");
      empty.className = "muted";
      empty.textContent = "You do not have any facilitator-assigned assessments yet.";
      list.appendChild(empty);
      return;
    }

    assignments.forEach((assignment) => {
      const item = document.createElement("div");
      item.className = "assigned-assessment-item";
      const heading = document.createElement("div");
      heading.className = "booking-item-heading";
      const title = document.createElement("strong");
      title.textContent = "Software Development Skills Assessment";
      const status = document.createElement("span");
      status.className = `booking-status ${assignment.status === "completed" ? "completed" : "pending"}`;
      status.textContent = assignment.status === "completed" ? "Completed" : "Assigned";
      heading.append(title, status);
      item.appendChild(heading);

      if (assignment.status === "completed") {
        const completed = document.createElement("p");
        const completedAt = assignment.completedAt?.toDate?.();
        completed.textContent = completedAt
          ? `Completed on ${completedAt.toLocaleDateString()}`
          : "Assessment completed";
        item.appendChild(completed);
      } else {
        const startButton = document.createElement("button");
        startButton.type = "button";
        startButton.className = "primary-btn small";
        startButton.textContent = "Start assessment";
        startButton.addEventListener("click", () => {
          startQuiz("javascript", {
            assessment: true,
            assessmentAssignmentId: assignment.id
          });
        });
        item.appendChild(startButton);
      }

      list.appendChild(item);
    });
  }, (error) => {
    console.error("Could not load facilitator-assigned assessments:", error);
    const list = document.getElementById("assignedAssessmentsList");
    if (list) {
      list.textContent = "Assigned assessments could not be loaded. Please try again later.";
    }
  });
}

function renderTasks() {
  const list = document.getElementById("tasksList");
  const tasks = getVisibleData().tasks; // [NEW]

  if (list) {
    list.innerHTML = tasks.length // [CHANGED]
      ? tasks.map((task, index) => `
          <div class="task-row ${task.completed ? "completed" : ""}">
            <input
              class="task-check"
              type="checkbox"
              data-task-toggle="${index}"
              aria-label="Mark ${escapeHtml(task.title)} complete"
              ${task.completed ? "checked" : ""}
            >
            <div class="task-main">
              <span class="task-name">${escapeHtml(task.title)}</span>
              ${task.dueDate ? `<span class="task-due">Due ${escapeHtml(task.dueDate)}</span>` : ""}
            </div>
            <span class="status ${task.completed ? "completed" : "outstanding"}">${task.completed ? "completed" : "outstanding"}</span>
            <button class="delete-task" type="button" data-task-delete="${index}" aria-label="Delete ${escapeHtml(task.title)}">×</button>
          </div>
        `).join("")
      : '<div class="empty-state">No tasks yet.</div>'; // [CHANGED]

    list.querySelectorAll("[data-task-toggle]").forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        state.tasks[Number(checkbox.dataset.taskToggle)].completed = checkbox.checked;
        saveState();
        renderTasks();
      });
    });

    list.querySelectorAll("[data-task-delete]").forEach((button) => {
      button.addEventListener("click", () => {
        state.tasks.splice(Number(button.dataset.taskDelete), 1);
        saveState();
        renderTasks();
      });
    });
  }

  updateDashboardProgress();
}

function showLearnerProfile(user, profile) {
  const displayName = profile.displayName || profile.username || user.email || "Learner";
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  document.querySelector(".hero h1").textContent = `Welcome back, ${displayName}`;
  document.querySelector(".programme").textContent = `Programme: ${profile.programme || "Not specified"}`;
  document.querySelector(".profile-badge").textContent = initials || "L";
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
              { title: value, completed: false }
            );

            saveState();

            // [CHANGED] switches preview off (if on) and re-draws everything
            setEmptyPreview(false);

            closeModal();

          }
        );

    }
  );


/* =========================
   ADD TASK
========================= */

document
  .getElementById("addTaskBtn")
  .addEventListener("click", function () {
    openModal(`
      <h2 class="modal-title">Add a task</h2>
      <form id="taskForm">
        <div class="form-group">
          <label for="taskInput">Task</label>
          <input id="taskInput" required maxlength="100" placeholder="e.g. Finish the HTML project">
        </div>
        <div class="form-group">
          <label for="taskDueDate">Due date</label>
          <input id="taskDueDate" type="date">
        </div>
        <button class="primary-btn" type="submit">Add task</button>
      </form>
    `);

    document.getElementById("taskForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const title = document.getElementById("taskInput").value.trim();
      if (!title) {
        return;
      }

      state.tasks.push({
        title,
        dueDate: document.getElementById("taskDueDate").value,
        completed: false
        // [REMOVED] "overdue: false" - overdue is now worked out from dueDate
      });
      saveState();
      setEmptyPreview(false); // [CHANGED] switches preview off (if on) and re-draws everything
      closeModal();
    });
  });


/* =========================
   [NEW] BOOK NEW SESSION
   (this button had no click handler before)
========================= */

document
  .getElementById("bookSessionBtn")
  .addEventListener("click", function () {
    openModal(`
      <h2 class="modal-title">Book a support session</h2>
      <p class="modal-subtitle">Tell your support team what you need help with.</p>
      <form id="bookingForm">
        <div class="form-group">
          <label for="bookingTopic">Topic</label>
          <input id="bookingTopic" required maxlength="80" placeholder="e.g. Help with JavaScript functions">
        </div>
        <div class="form-group">
          <label for="bookingDate">Preferred date</label>
          <input id="bookingDate" type="date" required>
        </div>
        <div class="form-group">
          <label for="bookingNotes">Notes (optional)</label>
          <input id="bookingNotes" maxlength="200" placeholder="Anything your facilitator should know">
        </div>
        <button class="primary-btn" type="submit">Book session</button>
        <div id="bookingFeedback" class="quiz-feedback"></div>
      </form>
    `);

    // Do not allow dates in the past
    document.getElementById("bookingDate").min = getTodayString();

    document.getElementById("bookingForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const submitButton = event.target.querySelector("button[type='submit']");
      const feedback = document.getElementById("bookingFeedback");
      const topic = document.getElementById("bookingTopic").value.trim();

      if (!topic) {
        return;
      }

      submitButton.disabled = true;

      try {
        // Saves to Firestore. subscribeToBookings() then shows it
        // on the page and updates the Support Bookings counter by itself.
        await addDoc(collection(db, "bookings"), {
          userId: auth.currentUser.uid,
          topic,
          preferredDate: document.getElementById("bookingDate").value,
          notes: document.getElementById("bookingNotes").value.trim(),
          status: "pending",
          createdAt: serverTimestamp()
        });
        setEmptyPreview(false);
        closeModal();
      } catch (error) {
        console.error("Could not book support session:", error);
        submitButton.disabled = false;
        feedback.textContent = "The session could not be booked. Check your connection and try again.";
        feedback.style.color = "#d54c4c";
      }
    });
  });


/* =========================
   PREVIEW EMPTY STATES
   [CHANGED] now really switches the dashboard to its empty
   states (and back) instead of showing a generic popup
========================= */

document
  .getElementById("previewBtn")
  .addEventListener(
    "click",
    function () {

      setEmptyPreview(!previewEmpty);

    }
  );


/* =========================
   START QUIZ
========================= */

function startQuiz(stage = "javascript", {
  assessment = false,
  assessmentAssignmentId = null
} = {}) {
  const stageNumber = stageKeys.indexOf(stage) + 1;
  if (!assessment && !progressManager.canStartStage(stageNumber)) {
    showStageLockedMessage(stage);
    return;
  }

  const questions = quizBank[stage] || quizBank.javascript;
  const game = new QuizGame(questions.map(([question, options, answer]) => ({
    question,
    options,
    answer
  })), PASS_MARK);
  const title = assessment ? "Software Development Skills Assessment" : stageLabel(stage);
  let current = 0;
  let score = 0;

  function renderQuestion() {
    const { question, options } = game.getCurrentQuestion();
    modalContent.innerHTML = `
      <h2 class="modal-title">${escapeHtml(title)}</h2>
      <p class="modal-subtitle">Question ${current + 1} of ${questions.length}</p>
      <div class="quiz-question">
        <h3>${escapeHtml(question)}</h3>
        ${options.map((answer, index) => `
          <label class="answer">
            <input type="radio" name="quizAnswer" value="${index}">
            ${escapeHtml(answer)}
          </label>
        `).join("")}
        <div id="quizFeedback" class="quiz-feedback"></div>
      </div>
      <button class="primary-btn" id="nextQuizBtn" type="button">
        ${current === questions.length - 1 ? "Finish Quiz" : "Next question"}
      </button>
    `;

    document.getElementById("nextQuizBtn").addEventListener("click", () => {
      const selected = document.querySelector("input[name='quizAnswer']:checked");
      const feedback = document.getElementById("quizFeedback");

      if (!selected) {
        feedback.textContent = "Please select an answer first.";
        feedback.style.color = "#d54c4c";
        return;
      }

      const selectedAnswer = Number(selected.value);
      game.answerQuestion(selectedAnswer);
      if (selectedAnswer === questions[current][2]) {
        score++;
        feedback.textContent = "Correct.";
        feedback.style.color = "#269576";
      } else {
        feedback.textContent = `Not quite. The correct answer is ${options[questions[current][2]]}.`;
        feedback.style.color = "#d54c4c";
      }

      if (assessment) {
        renderAssessmentProgress(current + 1, questions.length);
      }
      document.getElementById("nextQuizBtn").disabled = true;

      setTimeout(async () => {
        if (game.nextQuestion()) {
          current = game.currentQuestion;
          renderQuestion();
          return;
        }

        score = game.calculateScore();
        modalContent.innerHTML = `
          <h2 class="modal-title">Saving score...</h2>
          <p class="modal-subtitle">Your score and progress are being saved.</p>
        `;

        let result;
        try {
          result = await persistGameResult({
            stage: assessment ? null : stage,
            score,
            maxScore: questions.length,
            game: title,
            assessment,
            assessmentAssignmentId
          });
        } catch (error) {
          console.error("Could not save learner score:", error);
          showProgressSaveError();
          return;
        }

        modalContent.innerHTML = `
          <h2 class="modal-title">${assessment ? "Assessment complete" : result.passed ? "Passed" : "Failed"}</h2>
          <p class="modal-subtitle">${escapeHtml(title)} score saved to your learner record.</p>
          <div class="empty-state">
            <h3>${result.percentage}%</h3>
            <p>Score: ${score} / ${questions.length}</p>
            ${assessment ? "" : `<p>Pass mark: ${PASS_MARK}%</p>`}
          </div>
          ${assessment
            ? '<button class="primary-btn" id="quizDoneBtn" type="button">Done</button>'
            : result.passed
              ? `<button class="primary-btn" id="quizContinueBtn" type="button">${stage === "javascript" ? "Finish programme" : "Continue"}</button>`
              : '<p>Pass this stage to unlock the next one.</p><button class="primary-btn" id="quizRetryBtn" type="button">Retake the test</button>'}
        `;
        if (assessment) {
          document.getElementById("quizDoneBtn").addEventListener("click", closeModal);
        } else if (result.passed) {
          document.getElementById("quizContinueBtn").addEventListener("click", () => {
            if (stage === "javascript") {
              closeModal();
            } else {
              continueToNextStage(stage);
            }
          });
        } else {
          document.getElementById("quizRetryBtn").addEventListener("click", () => retryStage(stage));
        }
      }, 650);
    });
  }

  modal.classList.remove("hidden");
  if (assessment) {
    renderAssessmentProgress(0, questions.length);
  }
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
        "javascript",
        { assessment: true }
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
          startStage(stage);

        }
      );

    }
  );


/* =========================
   ROCK PAPER SCISSORS
========================= */

function startRps() {
  if (!progressManager.canStartStage(2)) {
    showStageLockedMessage("rps");
    return;
  }

  const game = new RPSGame(3, 5);
  const choices = ["Rock", "Paper", "Scissors"];
  const choiceImages = {
    rock: "../../game/stage2-rps/rock-emoji.png",
    paper: "../../game/stage2-rps/paper-emoji.png",
    scissors: "../../game/stage2-rps/scissors-emoji.png"
  };

  openModal(`
    <h2 class="modal-title">Rock, Paper, Scissors</h2>
    <p class="modal-subtitle">First to three wins, or finish five rounds.</p>
    <div class="rps-buttons">
      ${choices.map((choice) => `
        <button class="rps-choice-button" type="button" data-choice="${choice}" aria-label="Choose ${choice}">
          <img src="${choiceImages[choice.toLowerCase()]}" alt="">
          <span>${choice}</span>
        </button>
      `).join("")}
    </div>
    <div class="rps-result" id="rpsResult">
      <p>Choose your hand to play the first round.</p>
      <strong>Your score: 0 | Computer: 0</strong>
    </div>
  `);

  document.querySelectorAll(".rps-buttons button").forEach((button) => {
    button.addEventListener("click", async () => {
      const user = button.dataset.choice;
      const computer = choices[Math.floor(Math.random() * choices.length)];
      const roundResult = game.playRound(user.toLowerCase(), computer.toLowerCase());
      const result = roundResult === "draw"
        ? "It's a draw."
        : roundResult === "win"
          ? "You won this round."
          : "The computer won this round.";
      const gameFinished = game.hasWon() || game.hasLost() || game.isFinished();
      const resultElement = document.getElementById("rpsResult");

      resultElement.innerHTML = `
        <div class="rps-reveal">
          <div class="rps-hand-choice">
            <span>You</span>
            <img src="${choiceImages[user.toLowerCase()]}" alt="${user}">
            <strong>${user}</strong>
          </div>
          <strong class="rps-versus" aria-label="versus">VS</strong>
          <div class="rps-hand-choice">
            <span>Computer</span>
            <img src="${choiceImages[computer.toLowerCase()]}" alt="${computer}">
            <strong>${computer}</strong>
          </div>
        </div>
        <p>${result}</p>
        <strong>Your score: ${game.playerWins} | Computer: ${game.computerWins}</strong>
        ${gameFinished ? "<br><br><strong>Game complete.</strong><br>Saving score..." : ""}
      `;

      if (!gameFinished) {
        return;
      }

      document.querySelectorAll(".rps-buttons button").forEach((choiceButton) => {
        choiceButton.disabled = true;
      });

      try {
        const resultSaved = await persistGameResult({
          stage: "rps",
          score: game.playerWins,
          maxScore: game.roundsPlayed,
          game: "Rock, Paper, Scissors"
        });
        resultElement.innerHTML += `
          <br><strong>${resultSaved.passed ? "Passed" : "Failed"}: ${resultSaved.percentage}%</strong>
          <br>Pass mark: ${PASS_MARK}%
        `;
        if (resultSaved.passed) {
          resultElement.innerHTML += '<br><button class="primary-btn" id="rpsContinueBtn" type="button">Continue</button>';
          document.getElementById("rpsContinueBtn").addEventListener("click", () => continueToNextStage("rps"));
        } else {
          resultElement.innerHTML += '<br><strong>Pass this stage to unlock the next one.</strong><br><button class="primary-btn" id="rpsRetryBtn" type="button">Retake the test</button>';
          document.getElementById("rpsRetryBtn").addEventListener("click", () => retryStage("rps"));
        }
      } catch (error) {
        console.error("Could not save RPS score:", error);
        showProgressSaveError();
      }
    });
  });
}


/* =========================
   CHESS
========================= */

function startChess() {
  if (!progressManager.canStartStage(4)) {
    showStageLockedMessage("chess");
    return;
  }

  openModal(`
    <h2 class="modal-title">Chess</h2>
    <p class="modal-subtitle">Choose your difficulty. You play White against the computer.</p>
    <div class="chess-level-options">
      ${chessLevels.map(({ value, description }) => `
        <button class="chess-level-option" type="button" data-chess-level="${value}">
          <strong>${value === "mid" ? "Intermediate" : value[0].toUpperCase() + value.slice(1)}</strong>
          <span>${escapeHtml(description)}</span>
        </button>
      `).join("")}
    </div>
  `);

  modalContent.querySelectorAll("[data-chess-level]").forEach((button) => {
    button.addEventListener("click", () => startChessMatch(button.dataset.chessLevel));
  });
}

function startChessMatch(level) {
  const game = new ChessGame(level);
  const chess = new Chess();
  const levelName = chessLevels.find((item) => item.value === level)?.value || "beginner";
  let selectedSquare = "";
  let computerThinking = false;
  let resultSaved = false;

  function renderBoard(statusMessage = "") {
    const board = chess.board();
    const legalTargets = selectedSquare
      ? chess.moves({ square: selectedSquare, verbose: true }).map((move) => move.to)
      : [];
    const status = statusMessage || (computerThinking
      ? "Computer is thinking..."
      : chess.isCheck()
        ? "Check. Your move."
        : "Your move. Select a white piece.");

    modalContent.innerHTML = `
      <h2 class="modal-title">Chess: ${levelName === "mid" ? "Intermediate" : levelName[0].toUpperCase() + levelName.slice(1)}</h2>
      <p class="modal-subtitle">You are White. The computer is Black.</p>
      <p class="chess-status" id="chessStatus" aria-live="polite">${escapeHtml(status)}</p>
      <div class="chess-board" role="grid" aria-label="Chess board">
        ${board.flatMap((row, rowIndex) => row.map((piece, columnIndex) => {
          const squareName = `${"abcdefgh"[columnIndex]}${8 - rowIndex}`;
          const isSelected = selectedSquare === squareName;
          const isLegalTarget = legalTargets.includes(squareName);
          const pieceName = piece
            ? `${piece.color === "w" ? "White" : "Black"} ${piece.type}`
            : "empty";
          const classes = [
            "chess-square",
            (rowIndex + columnIndex) % 2 ? "dark" : "light",
            isSelected ? "selected" : "",
            isLegalTarget ? "legal-target" : "",
            piece ? "has-piece" : ""
          ].filter(Boolean).join(" ");

          return `
            <button class="${classes}" type="button" role="gridcell"
              data-square="${squareName}" aria-label="${squareName}, ${pieceName}"
              ${computerThinking || chess.isGameOver() ? "disabled" : ""}>
              ${piece ? chessPieces[piece.color][piece.type] : ""}
            </button>
          `;
        })).join("")}
      </div>
      <button class="secondary-btn" id="restartChessMatch" type="button">Restart match</button>
    `;

    modalContent.querySelectorAll("[data-square]").forEach((squareButton) => {
      squareButton.addEventListener("click", () => handlePlayerMove(squareButton.dataset.square));
    });
    document.getElementById("restartChessMatch").addEventListener("click", () => {
      chess.reset();
      game.reset();
      selectedSquare = "";
      computerThinking = false;
      resultSaved = false;
      renderBoard();
    });
  }

  async function finishGame() {
    if (resultSaved) {
      return;
    }
    resultSaved = true;

    const playerWon = chess.isCheckmate() && chess.turn() === "b";
    if (playerWon) {
      game.completeGame();
    }

    const score = playerWon ? 1 : 0;
    const outcome = chess.isCheckmate()
      ? playerWon ? "You checkmated the computer." : "The computer checkmated you."
      : "The game ended in a draw.";

    let result;
    try {
      result = await persistGameResult({
        stage: "chess",
        score,
        maxScore: 1,
        game: "Chess"
      });
    } catch (error) {
      resultSaved = false;
      console.error("Could not save chess score:", error);
      showProgressSaveError();
      return;
    }

    openModal(`
      <h2 class="modal-title">${result.passed ? "Passed" : "Failed"}</h2>
      <p class="modal-subtitle">${outcome} Your score was saved.</p>
      <div class="empty-state">
        <h3>${result.percentage}%</h3>
        <p>Score: ${score} / 1</p>
        <p>Pass mark: ${PASS_MARK}%</p>
      </div>
      ${result.passed
        ? '<button class="primary-btn" id="chessContinueBtn" type="button">Continue</button>'
        : '<p>Pass this stage to unlock the next one.</p><button class="primary-btn" id="chessRetryBtn" type="button">Retake the test</button>'}
    `);

    if (result.passed) {
      document.getElementById("chessContinueBtn").addEventListener("click", () => continueToNextStage("chess"));
    } else {
      document.getElementById("chessRetryBtn").addEventListener("click", () => retryStage("chess"));
    }
  }

  function makeComputerMove() {
    const moves = chess.moves({ verbose: true });
    const move = chooseComputerMove(moves, game.level);
    if (move) {
      chess.move({ from: move.from, to: move.to, promotion: move.promotion || "q" });
    }
    computerThinking = false;

    if (chess.isGameOver()) {
      finishGame();
    } else {
      renderBoard();
    }
  }

  function handlePlayerMove(square) {
    if (computerThinking || chess.turn() !== "w" || chess.isGameOver()) {
      return;
    }

    const piece = chess.get(square);
    if (!selectedSquare) {
      if (piece?.color === "w") {
        selectedSquare = square;
        game.selectSquare(square);
        renderBoard();
      } else {
        renderBoard("Select one of your white pieces.");
      }
      return;
    }

    if (piece?.color === "w") {
      selectedSquare = square;
      game.selectSquare(square);
      renderBoard();
      return;
    }

    try {
      chess.move({ from: selectedSquare, to: square, promotion: "q" });
      selectedSquare = "";
      game.clearSelection();

      if (chess.isGameOver()) {
        finishGame();
        return;
      }

      computerThinking = true;
      renderBoard();
      window.setTimeout(makeComputerMove, 450);
    } catch {
      renderBoard("That is not a legal move. Choose a highlighted square.");
    }
  }

  renderBoard();
}


/* =========================
   RESTART ALL
========================= */

document
  .getElementById("restartAllBtn")
  .addEventListener(
    "click",
    async function () {

      const confirmed =
        confirm(
          "Restart all programme progress?"
        );


      if (!confirmed) {
        return;
      }


      const resetGames = Object.fromEntries(stageKeys.map((stage) => [stage, false]));
      try {
        await progressRepository.saveProgress(resetGames, null);
      } catch (error) {
        console.error("Could not reset Firebase progress:", error);
        alert("Progress could not be reset because it could not be saved. Try again when connected.");
        return;
      }

      state.quiz.current = 0;

      state.quiz.score = 0;
      state.games = resetGames;
      state.assessment = null;
      syncProgressManager(state.games);

      state.goals = state.goals.map((goal) => ({ ...goal, completed: false }));


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

      renderGoals();

      renderTasks();
      renderStageButtons();
      renderAssessmentProgress();

      alert(
        "Programme progress has been reset."
      );

    }
  );


/* =========================
   NAVIGATION
========================= */

class NavigationController {
  constructor(navButtons) {
    this.navButtons = [...navButtons];

    this.sections = {
      home: [
        document.querySelector(".hero"),
        document.getElementById("progressCard"),
        document.querySelector(".stats-grid")
      ],
      goals: [document.getElementById("goalsSection")],
      tasks: [document.getElementById("tasksSection")],
      support: [document.getElementById("supportSection")],
      progress: [
        document.getElementById("progressSection"),
        document.querySelector(".assigned-assessments-card")
      ]
    };

    this.allSections = [
      document.querySelector(".hero"),
      document.getElementById("progressCard"),
      document.querySelector(".stats-grid"),
      document.getElementById("goalsSection"),
      document.getElementById("supportSection"),
      document.getElementById("tasksSection"),
      document.getElementById("progressSection"),
      document.querySelector(".assessment-card"),
      document.querySelector(".assigned-assessments-card")
    ].filter(Boolean);
    this.bindEvents();
    this.setCurrent("home");
  }

  bindEvents() {
    this.navButtons.forEach((button) => {
      button.addEventListener("click", () => {
        this.setCurrent(button.dataset.section || "home");
      });
    });
  }

  setCurrent(section) {
    const selectedSection = this.sections[section] ? section : "home";
    const contentGrid = document.querySelector(".content-grid");

    this.navButtons.forEach((button) => {
      const isActive = button.dataset.section === selectedSection;
      button.classList.toggle("active", isActive);
    });

    this.allSections.forEach((element) => {
      element.classList.add("hidden");
    });

    if (contentGrid) {
      contentGrid.classList.toggle("section-view-single", selectedSection !== "home");
    }

    if (selectedSection === "home") {
      this.sections.home.forEach((element) => element.classList.remove("hidden"));
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    this.sections[selectedSection].forEach((element) => {
      element.classList.remove("hidden");
    });
  }
}

new NavigationController(document.querySelectorAll(".nav-link"));


/* =========================
   LOGOUT
========================= */

document
  .getElementById("logoutBtn")
  .addEventListener(
    "click",
    async function () {
      await signOut(auth);
      window.location.href = "../../login-page/login.html";
    }
  );


/* =========================
   START APPLICATION
========================= */

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    if (unsubscribeBookings) {
      unsubscribeBookings();
      unsubscribeBookings = null;
    }
    if (unsubscribeAssignments) {
      unsubscribeAssignments();
      unsubscribeAssignments = null;
    }
    window.location.href = "../../login-page/login.html";
    return;
  }

  try {
    const profileSnapshot = await getDoc(doc(db, "registrations", user.uid));

    if (!profileSnapshot.exists()) {
      await signOut(auth);
      window.location.href = "../../login-page/login.html";
      return;
    }

    const profile = profileSnapshot.data();
    if (profile.role === "facilitator") {
      window.location.href = "../../facilitator-dashboard/facilitator-dashboard.html";
      return;
    }
    if (profile.role !== "learner") {
      await signOut(auth);
      window.location.href = "../../login-page/login.html";
      return;
    }

    stateStorageKey = `learnerHubState:${user.uid}`;
    state = createInitialState();
    showLearnerProfile(user, profile);
    loadState();
    progressRepository = new LearnerProgressRepository(db, user.uid);

    state.games = createInitialState().games;
    state.assessment = null;
    syncProgressManager(state.games);
    state.bookings = [];
    renderGoals();
    renderBookings();
    subscribeToBookings(user.uid);
    subscribeToAssignedAssessments(user.uid);
    renderTasks();
    renderStageButtons();
    renderAssessmentProgress();
    loginScreen.classList.add("hidden");
    app.classList.remove("hidden");

    let remoteProgress = null;
    try {
      remoteProgress = await progressRepository.load();
    } catch (error) {
      console.error("Could not load learner progress from Firebase:", error);
    }
    state.games = remoteProgress
      ? { ...createInitialState().games, ...(remoteProgress.games || {}) }
      : createInitialState().games;
    state.assessment = remoteProgress?.latestAssessment || null;
    syncProgressManager(state.games);
    renderStageButtons();
    renderAssessmentProgress();
  } catch (error) {
    console.error("Could not load learner profile:", error);
    await signOut(auth);
    window.location.href = "../../login-page/login.html";
  }
});