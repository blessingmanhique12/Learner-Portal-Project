import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';
import { doc, getDoc, getFirestore } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js';
import { chessPieces, chooseComputerMove, cssQuestions, determineWinner, getComputerChoice, htmlQuestions, javascriptQuestions, rpsChoices, stageNames } from '../game/game-content.js';

const firebaseConfig = { apiKey: 'AIzaSyAmmMxhDa9LLme7uP1y-X2kMJHr3t6tT5E', authDomain: 'ron-learn.firebaseapp.com', projectId: 'ron-learn', storageBucket: 'ron-learn.firebasestorage.app', messagingSenderId: '63585372704', appId: '1:63585372704:web:b75d9cc803c9b15e0c8a45', measurementId: 'G-M7RYTEEEVS' };
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const loginPath = '../login-page/login.html';
const welcome = document.getElementById('learnerWelcome');
const programmeValue = document.getElementById('programmeValue');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const progressBadge = document.getElementById('progressBadge');
const message = document.getElementById('dashboardMessage');
const logoutButton = document.getElementById('logoutButton');
const progressStorageKey = 'learnerHubProgress';
const defaults = { totalProgress: 0, stage1Complete: false, stage2Complete: false, stage3Complete: false, stage4Complete: false, stage5Complete: false, quizScore: 0, quizAttempted: false, cssQuizScore: 0, cssQuizAttempted: false, javascriptQuizScore: 0, javascriptQuizAttempted: false, rpsWins: 0, rpsRounds: 0, chessLevel: '', chessComplete: false };
const quizState = { html: { index: 0, answers: [] }, css: { index: 0, answers: [] }, javascript: { index: 0, answers: [] } };
let chess;
let chessModule;
let selectedSquare = '';

const messageFor = (text, type = '') => { if (message) { message.textContent = text; message.className = type ? `message ${type}` : 'message'; } };
const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
const readUser = () => { try { return JSON.parse(localStorage.getItem('learnerHubUser')) || null; } catch { return null; } };
const readState = () => { try { return { ...defaults, ...(JSON.parse(localStorage.getItem(progressStorageKey)) || {}) }; } catch { return { ...defaults }; } };
const saveState = (state) => localStorage.setItem(progressStorageKey, JSON.stringify(state));
const completedCount = (state) => [state.stage1Complete, state.stage2Complete, state.stage3Complete, state.stage4Complete, state.stage5Complete].filter(Boolean).length;
const updateProgress = () => {
	const state = readState();
	const percentage = completedCount(state) * 20;
	if (progressFill) progressFill.style.width = `${percentage}%`;
	if (progressText) progressText.textContent = `${percentage}%`;
	if (progressBadge) { progressBadge.textContent = percentage ? `Stage ${completedCount(state)} complete` : 'Stage 0'; progressBadge.className = percentage ? 'badge success' : 'badge neutral'; }
};
const attach = (id, event, callback) => document.getElementById(id)?.addEventListener(event, callback);
const panel = (html) => { const element = document.createElement('div'); element.className = 'programme-stage'; element.innerHTML = html; return element; };
const renderProgramme = (content) => {
	programmeValue.innerHTML = '';
	const navigation = document.createElement('div');
	navigation.className = 'stage-nav';
	const state = readState();
	navigation.innerHTML = `<span class="stage-nav-label">Programme stages</span>${stageNames.map((name, index) => { const stage = index + 1; const unlocked = stage === 1 || state[`stage${stage - 1}Complete`]; return `<button type="button" class="stage-link ${state[`stage${stage}Complete`] ? 'complete' : ''}" data-stage="${stage}" ${unlocked ? '' : 'disabled'}>${state[`stage${stage}Complete`] ? `Replay ${name}` : `Stage ${stage}: ${name}`}</button>`; }).join('')}<button id="restartProgrammeButton" type="button" class="secondary">Restart all</button>`;
	navigation.querySelectorAll('[data-stage]').forEach((button) => button.addEventListener('click', () => openStage(Number(button.dataset.stage))));
	navigation.querySelector('#restartProgrammeButton').addEventListener('click', restartAll);
	programmeValue.append(navigation, content);
};
const restartAll = () => { quizState.html = { index: 0, answers: [] }; quizState.css = { index: 0, answers: [] }; quizState.javascript = { index: 0, answers: [] }; localStorage.removeItem(progressStorageKey); updateProgress(); showStageMenu(); messageFor('Programme restarted. All five stages are ready to play.', 'success'); };
const replayStage = (stage) => {
	const state = readState();
	if (stage === 1) { state.stage1Complete = false; quizState.html = { index: 0, answers: [] }; }
	if (stage === 2) Object.assign(state, { stage2Complete: false, rpsWins: 0, rpsRounds: 0 });
	if (stage === 3) { state.stage3Complete = false; quizState.css = { index: 0, answers: [] }; }
	if (stage === 4) Object.assign(state, { stage4Complete: false, chessComplete: false, chessLevel: '' });
	if (stage === 5) { state.stage5Complete = false; quizState.javascript = { index: 0, answers: [] }; }
	saveState(state); updateProgress(); openStage(stage);
};
const showStageMenu = () => {
	const state = readState();
	renderProgramme(panel('<h3>Choose a stage</h3><p>Complete each stage to unlock the next one. Completed stages can be replayed from the programme stages above.</p>'));
	if (!state.stage1Complete) openStage(1); else if (!state.stage2Complete) openStage(2); else if (!state.stage3Complete) openStage(3); else if (!state.stage4Complete) openStage(4); else if (!state.stage5Complete) openStage(5);
};

const renderQuiz = (kind) => {
	const questions = kind === 'html' ? htmlQuestions : kind === 'css' ? cssQuestions : javascriptQuestions;
	const current = quizState[kind];
	const question = questions[current.index];
	const content = panel(`<p class="round-display">Question ${current.index + 1} of ${questions.length}</p><div class="quiz-wrap"><div class="quiz-question"><h3>${escapeHtml(question.question)}</h3><div class="answer-list">${question.options.map((option, index) => `<label class="answer-option"><input type="radio" name="${kind}Option" value="${String.fromCharCode(65 + index)}"><span>${escapeHtml(option)}</span></label>`).join('')}</div></div><div class="quiz-actions"><button id="nextQuestionButton" type="button" class="secondary">${current.index === questions.length - 1 ? 'Finish quiz' : 'Next question'}</button><button id="replayCurrentStage" type="button" class="secondary">Restart this stage</button></div></div>`);
	renderProgramme(content);
	attach('nextQuestionButton', 'click', () => { const selected = document.querySelector(`input[name="${kind}Option"]:checked`); if (!selected) { messageFor('Please choose an answer before continuing.', 'error'); return; } current.answers[current.index] = selected.value; if (current.index < questions.length - 1) { current.index += 1; renderQuiz(kind); } else finishQuiz(kind, questions); });
	attach('replayCurrentStage', 'click', () => replayStage(kind === 'html' ? 1 : kind === 'css' ? 3 : 5));
};
const finishQuiz = (kind, questions) => {
	const current = quizState[kind];
	const score = questions.reduce((total, question, index) => total + (current.answers[index] === question.answer ? 1 : 0), 0);
	const percentage = Math.round(score / questions.length * 100);
	const stage = kind === 'html' ? 1 : kind === 'css' ? 3 : 5;
	const state = readState();
	const scoreKey = kind === 'html' ? 'quizScore' : kind === 'css' ? 'cssQuizScore' : 'javascriptQuizScore';
	const attemptedKey = kind === 'html' ? 'quizAttempted' : kind === 'css' ? 'cssQuizAttempted' : 'javascriptQuizAttempted';
	state[scoreKey] = score;
	state[attemptedKey] = true;
	if (percentage >= 70) {
		state[`stage${stage}Complete`] = true; saveState(state); updateProgress(); messageFor(`Stage ${stage} complete. You scored ${percentage}%.`, 'success');
		const quizTitle = kind === 'html' ? 'HTML' : kind === 'css' ? 'CSS' : 'JavaScript';
		const content = panel(`<h3>${quizTitle} quiz complete</h3><p>You scored ${score} out of ${questions.length} (${percentage}%).</p><p class="result-message success">The next stage is unlocked.</p>${stage < 5 ? `<div class="quiz-actions"><button id="nextStageButton" type="button" class="primary-button">Continue to Stage ${stage + 1}</button><button id="replayCurrentStage" type="button" class="secondary">Replay this stage</button></div>` : '<button id="replayCurrentStage" type="button" class="secondary">Replay this stage</button>'}`);
		renderProgramme(content); attach('nextStageButton', 'click', () => openStage(stage + 1)); attach('replayCurrentStage', 'click', () => replayStage(stage));
	} else {
		messageFor(`You scored ${percentage}%. You need at least 70% to continue.`, 'error');
		const content = panel(`<h3>Try the ${kind === 'javascript' ? 'JavaScript' : kind.toUpperCase()} quiz again</h3><p>You scored ${score} out of ${questions.length} (${percentage}%).</p><p class="result-message error">Reach 70% to unlock the next stage.</p><button id="retryQuiz" type="button" class="primary-button">Retry quiz</button>`);
		renderProgramme(content); attach('retryQuiz', 'click', () => replayStage(stage));
	}
};

const renderRps = () => {
	const state = readState();
	if (state.stage2Complete) { const content = panel(`<h3>Stage 2 complete</h3><p class="score-text">Final score: ${state.rpsWins} / 5</p><p class="result-message success">You won 3 out of 5 rounds. Stage 3 is now unlocked.</p><div class="quiz-actions"><button id="nextStageButton" type="button" class="primary-button">Continue to Stage 3</button><button id="replayCurrentStage" type="button" class="secondary">Replay this stage</button></div>`); renderProgramme(content); attach('nextStageButton', 'click', () => openStage(3)); attach('replayCurrentStage', 'click', () => replayStage(2)); return; }
	if (state.rpsRounds >= 5) { const content = panel(`<h3>Rock, Paper, Scissors</h3><p class="score-text">Score: ${state.rpsWins} / 5</p><p class="result-message error">You need 3 wins out of 5.</p><button id="retryRps" type="button" class="primary-button">Play this stage again</button>`); renderProgramme(content); attach('retryRps', 'click', () => replayStage(2)); return; }
	const choiceButtons = rpsChoices.map(({ value, label, hand }) => `<button type="button" class="rps-choice" data-choice="${value}" aria-label="Choose ${label.toLowerCase()}"><span class="hand-sign" aria-hidden="true">${hand}</span><span>${label}</span></button>`).join('');
	const content = panel(`<h3>Stage 2: Rock, Paper, Scissors</h3><p class="round-display">Round ${state.rpsRounds + 1} of 5</p><p class="score-text">Score: ${state.rpsWins} / 5</p><div class="rps-buttons">${choiceButtons}</div><button id="replayCurrentStage" type="button" class="secondary">Restart this stage</button>`);
	renderProgramme(content); attach('replayCurrentStage', 'click', () => replayStage(2));
	content.querySelectorAll('.rps-choice').forEach((button) => button.addEventListener('click', () => { const next = readState(); const result = determineWinner(button.dataset.choice, getComputerChoice()); next.rpsRounds += 1; if (result === 'win') next.rpsWins += 1; if (next.rpsRounds >= 5 && next.rpsWins >= 3) { next.stage2Complete = true; messageFor('Stage 2 complete! Stage 3 is unlocked.', 'success'); } saveState(next); updateProgress(); renderRps(); }));
};

const renderChessPicker = () => { const content = panel('<h3>Stage 4: Chess</h3><p>Choose a level, then play as White against the computer.</p><div class="chess-levels"><button type="button" class="chess-level" data-level="beginner"><strong>Beginner</strong><span>Random computer moves</span></button><button type="button" class="chess-level" data-level="mid"><strong>Mid level</strong><span>Computer prefers captures</span></button><button type="button" class="chess-level" data-level="hard"><strong>Hard</strong><span>Computer looks for strong moves</span></button></div><button id="replayCurrentStage" type="button" class="secondary">Restart this stage</button>'); renderProgramme(content); attach('replayCurrentStage', 'click', () => replayStage(4)); content.querySelectorAll('.chess-level').forEach((button) => button.addEventListener('click', () => startChess(button.dataset.level))); };
const startChess = async (level) => { if (!chessModule) chessModule = await import('https://cdn.jsdelivr.net/npm/chess.js@1.4.0/+esm'); chess = new chessModule.Chess(); selectedSquare = ''; const state = readState(); state.chessLevel = level; state.chessComplete = false; saveState(state); renderChess(level); };
const renderChess = (level, status = 'Your turn. Choose a white piece.') => { const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']; const squares = chess.board().map((row, rowIndex) => row.map((piece, columnIndex) => { const square = `${files[columnIndex]}${8 - rowIndex}`; const pieceClass = piece ? ` ${piece.color === 'w' ? 'white-piece' : 'black-piece'}` : ''; return `<button type="button" class="chess-square ${(rowIndex + columnIndex) % 2 ? 'dark' : 'light'}${pieceClass}${square === selectedSquare ? ' selected' : ''}" data-square="${square}">${piece ? chessPieces[piece.color][piece.type] : ''}</button>`; }).join('')).join(''); const content = panel(`<h3>Stage 4: Chess <span class="chess-level-label">${level}</span></h3><p class="round-display">You are White. Win the game to complete this stage.</p><div class="chess-board">${squares}</div><p class="result-message" aria-live="polite">${escapeHtml(status)}</p><button id="replayCurrentStage" type="button" class="secondary">Restart this stage</button>`); renderProgramme(content); attach('replayCurrentStage', 'click', () => replayStage(4)); content.querySelectorAll('.chess-square').forEach((button) => button.addEventListener('click', () => selectSquare(button.dataset.square, level))); };
const computerMove = (level) => { const move = chooseComputerMove(chess.moves({ verbose: true }), level); if (move) chess.move({ from: move.from, to: move.to, promotion: 'q' }); };
const completeChess = (level) => { const state = readState(); state.stage4Complete = true; state.chessComplete = true; saveState(state); updateProgress(); messageFor('Stage 4 complete! Stage 5 is unlocked.', 'success'); const content = panel(`<h3>Stage 4 complete</h3><p>You won the ${level} chess game.</p><p class="result-message success">Stage 5 JavaScript quiz is now unlocked.</p><div class="quiz-actions"><button id="nextStageButton" type="button" class="primary-button">Continue to Stage 5</button><button id="replayCurrentStage" type="button" class="secondary">Replay this stage</button></div>`); renderProgramme(content); attach('nextStageButton', 'click', () => openStage(5)); attach('replayCurrentStage', 'click', () => replayStage(4)); };
const selectSquare = (square, level) => {
	const piece = chess.get(square);
	if (!selectedSquare) { if (piece?.color === 'w') { selectedSquare = square; renderChess(level, 'Choose a destination square.'); } return; }
	try { chess.move({ from: selectedSquare, to: square, promotion: 'q' }); selectedSquare = ''; if (chess.isGameOver()) { completeChess(level); return; } computerMove(level); if (chess.isGameOver()) { renderChess(level, 'The computer won this game. Restart the stage to try again.'); return; } renderChess(level); }
	catch { selectedSquare = piece?.color === 'w' ? square : ''; renderChess(level, selectedSquare ? 'Choose a destination square.' : 'That move is not legal.'); }
};
const openStage = (stage) => { const state = readState(); if (stage > 1 && !state[`stage${stage - 1}Complete`]) { messageFor(`Complete Stage ${stage - 1} first to unlock this stage.`, 'error'); return; } if (stage === 1) { quizState.html = { index: 0, answers: [] }; renderQuiz('html'); } if (stage === 2) renderRps(); if (stage === 3) { quizState.css = { index: 0, answers: [] }; renderQuiz('css'); } if (stage === 4) state.chessLevel ? startChess(state.chessLevel) : renderChessPicker(); if (stage === 5) { quizState.javascript = { index: 0, answers: [] }; renderQuiz('javascript'); } };
onAuthStateChanged(auth, async (user) => { if (!user) { localStorage.removeItem('learnerHubUser'); window.location.href = loginPath; return; } try { let profile = readUser(); try { const snapshot = await getDoc(doc(db, 'registrations', user.uid)); profile = snapshot.exists() ? snapshot.data() : profile; } catch (error) { console.warn('Could not read Firestore profile.', error); } if (profile?.role && profile.role !== 'learner') { await signOut(auth); window.location.href = loginPath; return; } welcome.textContent = `Welcome, ${user.displayName || profile?.username || user.email}.`; messageFor('Firebase session connected.'); updateProgress(); showStageMenu(); } catch (error) { messageFor(error.message || 'Could not load your learner profile.', 'error'); } });
if (logoutButton) logoutButton.addEventListener('click', async () => { await signOut(auth); localStorage.removeItem('learnerHubUser'); window.location.href = loginPath; });
updateProgress();

const gameSessionInit = () => {
	const questionNumber = document.getElementById('questionNumber');
	if (!questionNumber) return;

	const stages = [{ name: 'HTML Quiz', questions: [{ question: 'Which tag is used for the largest heading?', options: ['h1', 'p', 'div'], answer: 'h1' }, { question: 'Which tag is used to create a paragraph?', options: ['p', 'h1', 'section'], answer: 'p' }, { question: 'Which tag creates a link?', options: ['a', 'link', 'href'], answer: 'a' }, { question: 'Which tag is used to insert an image?', options: ['img', 'image', 'src'], answer: 'img' }, { question: 'Which element contains the visible webpage content?', options: ['body', 'head', 'title'], answer: 'body' }] }, { name: 'Rock, Paper, Scissors', questions: [{ question: 'Which choice beats Rock?', options: ['Paper', 'Scissors', 'Rock'], answer: 'Paper' }, { question: 'Which choice beats Paper?', options: ['Rock', 'Scissors', 'Paper'], answer: 'Scissors' }, { question: 'Which choice beats Scissors?', options: ['Rock', 'Paper', 'Scissors'], answer: 'Rock' }, { question: 'What happens when both players choose Rock?', options: ['Draw', 'Player 1 wins', 'Player 2 wins'], answer: 'Draw' }, { question: 'What beats Scissors?', options: ['Rock', 'Paper', 'Scissors'], answer: 'Rock' }] }, { name: 'CSS Quiz', questions: [{ question: 'What does CSS control?', options: ['Page styling', 'Database storage', 'Server security'], answer: 'Page styling' }, { question: 'Which property changes text colour?', options: ['color', 'font', 'text-style'], answer: 'color' }, { question: 'Which property changes the background?', options: ['background-color', 'back-color', 'bg'], answer: 'background-color' }, { question: 'Which property controls spacing inside an element?', options: ['padding', 'margin', 'spacing'], answer: 'padding' }, { question: 'Which symbol selects a class in CSS?', options: ['.', '#', '*'], answer: '.' }] }, { name: 'Chess', questions: [{ question: 'Which piece can move in an L-shape?', options: ['Knight', 'Bishop', 'Rook'], answer: 'Knight' }, { question: 'Which piece can move diagonally?', options: ['Bishop', 'Rook', 'King'], answer: 'Bishop' }, { question: 'Which piece is the most important?', options: ['King', 'Queen', 'Knight'], answer: 'King' }, { question: 'How many squares are on a chess board?', options: ['64', '48', '32'], answer: '64' }, { question: 'Which piece moves horizontally and vertically?', options: ['Rook', 'Bishop', 'Knight'], answer: 'Rook' }] }, { name: 'JavaScript Quiz', questions: [{ question: 'Which keyword declares a variable that can be reassigned?', options: ['let', 'const', 'fixed'], answer: 'let' }, { question: 'Which keyword creates a constant?', options: ['const', 'constant', 'fixed'], answer: 'const' }, { question: 'Which symbol is used for strict equality?', options: ['===', '=', '=='], answer: '===' }, { question: 'Which method adds an item to the end of an array?', options: ['push()', 'add()', 'append()'], answer: 'push()' }, { question: 'Which function prints something to the console?', options: ['console.log()', 'print()', 'write()'], answer: 'console.log()' }] }];

	let currentStage = 0;
	let currentQuestion = 0;
	let score = 0;
	let selectedAnswer = null;

	const questionText = document.getElementById('questionText');
	const answersContainer = document.getElementById('answers');
	const progressFill = document.getElementById('progressFill');
	const progressPercentage = document.getElementById('progressPercentage');
	const overallBar = document.getElementById('overallBar');
	const overallPercentage = document.getElementById('overallPercentage');
	const stageBadge = document.getElementById('stageBadge');
	const progressStage = document.getElementById('progressStage');
	const completedQuestions = document.getElementById('completedQuestions');
	const remainingQuestions = document.getElementById('remainingQuestions');
	const currentStageElement = document.getElementById('currentStage');
	const scoreElement = document.getElementById('score');
	const sessionStage = document.getElementById('sessionStage');
	const feedback = document.getElementById('feedback');
	const sessionStatus = document.getElementById('sessionStatus');

	const updateProgress = () => {
		const stage = stages[currentStage];
		const total = stage.questions.length;
		const progress = (currentQuestion / total) * 100;
		if (progressFill) progressFill.style.width = `${progress}%`;
		if (progressPercentage) progressPercentage.textContent = `${Math.round(progress)}%`;
		if (stageBadge) stageBadge.textContent = `STAGE ${currentStage}`;
		if (progressStage) progressStage.textContent = `STAGE ${currentStage}`;

		const totalQuestions = stages.reduce((sum, stageItem) => sum + stageItem.questions.length, 0);
		const completedBefore = stages.slice(0, currentStage).reduce((sum, stageItem) => sum + stageItem.questions.length, 0);
		const overallCompleted = completedBefore + currentQuestion;
		const overallProgress = (overallCompleted / totalQuestions) * 100;
		if (overallBar) overallBar.style.width = `${overallProgress}%`;
		if (overallPercentage) overallPercentage.textContent = `${Math.round(overallProgress)}%`;
		if (completedQuestions) completedQuestions.textContent = overallCompleted;
		if (remainingQuestions) remainingQuestions.textContent = totalQuestions - overallCompleted;
		if (scoreElement) scoreElement.textContent = score;
	};

	const updateStageButtons = () => {
		document.querySelectorAll('.stage-btn').forEach((button, index) => {
			button.classList.toggle('active', index === currentStage);
		});
	};

	const loadQuestion = () => {
		const stage = stages[currentStage];
		const question = stage.questions[currentQuestion];
		if (questionNumber) questionNumber.textContent = `Question ${currentQuestion + 1} of ${stage.questions.length}`;
		if (questionText) questionText.textContent = question.question;
		if (answersContainer) answersContainer.innerHTML = '';
		if (sessionStage) sessionStage.textContent = stage.name;
		if (currentStageElement) currentStageElement.textContent = currentStage + 1;
		selectedAnswer = null;
		if (feedback) {
			feedback.textContent = '';
			feedback.className = 'feedback';
		}

		question.options.forEach((option) => {
			const label = document.createElement('label');
			label.className = 'answer';
			label.innerHTML = `<input type="radio" name="answer" value="${option}"><span>${option}</span>`;
			const radio = label.querySelector('input');
			radio.addEventListener('change', () => {
				selectedAnswer = option;
				document.querySelectorAll('.answer').forEach((item) => item.classList.remove('selected'));
				label.classList.add('selected');
			});
			answersContainer?.appendChild(label);
		});

		updateProgress();
		updateStageButtons();
	};

	document.getElementById('nextQuestionBtn')?.addEventListener('click', () => {
		if (!selectedAnswer) {
			if (feedback) {
				feedback.textContent = 'Please select an answer first.';
				feedback.className = 'feedback incorrect';
			}
			return;
		}

		const correctAnswer = stages[currentStage].questions[currentQuestion].answer;
		if (selectedAnswer === correctAnswer) {
			score++;
			if (feedback) {
				feedback.textContent = 'Correct! Well done.';
				feedback.className = 'feedback correct';
			}
		} else if (feedback) {
			feedback.textContent = `Incorrect. The correct answer is ${correctAnswer}.`;
			feedback.className = 'feedback incorrect';
		}

		setTimeout(() => {
			currentQuestion++;
			if (currentQuestion >= stages[currentStage].questions.length) {
				currentQuestion = 0;
				if (currentStage < stages.length - 1) {
					currentStage++;
					if (sessionStatus) sessionStatus.textContent = 'Stage completed';
				} else {
					currentStage = stages.length - 1;
					if (sessionStatus) sessionStatus.textContent = 'Programme completed';
				}
			}
			loadQuestion();
		}, 700);
	});
<<<<<<< HEAD
}


// CHECKLIST //
// Task class
class Task {

    constructor(title) {

        this.title = title;

        this.completed = false;
    }


    complete() {

        this.completed = !this.completed;

    }

}


// Storing all tasks
let tasks = [];


// Get HTML elements
const taskInput =
    document.getElementById("taskInput");

const addTaskBtn =
    document.getElementById("addTaskBtn");

const taskList =
    document.getElementById("taskList");

const checklistProgress =
    document.getElementById("checklistProgress");

const checklistProgressText =
    document.getElementById("checklistProgressText");


// For adding tasks
addTaskBtn.addEventListener("click", function () {

    const taskName =
        taskInput.value.trim();


    // Checking if the input is empty
    if (taskName === "") {

        alert("Please enter a task.");

        return;
    }


    // Create a Task object
    const task =
        new Task(taskName);


    // For adding tasks to array
    tasks.push(task);


    // Clear input
    taskInput.value = "";


    // Display tasks
    displayTasks();

});


// Display tasks
function displayTasks() {

    taskList.innerHTML = "";


    tasks.forEach(function (task, index) {

        const listItem =
            document.createElement("li");


        listItem.className =
            "task-item";


        if (task.completed) {

            listItem.classList.add("completed");

        }


        listItem.innerHTML = `

            <span>
                ${task.title}
            </span>

            <div>

                <button
                    type="button"
                    onclick="completeTask(${index})">

                    ${task.completed
                        ? "Undo"
                        : "Complete"}

                </button>


                <button
                    type="button"
                    onclick="deleteTask(${index})">

                    Delete

                </button>

            </div>
        `;


        taskList.appendChild(listItem);

    });


    updateChecklistProgress();

}


// Complete task
function completeTask(index) {

    tasks[index].complete();

    displayTasks();

}


// Delete task
function deleteTask(index) {

    tasks.splice(index, 1);

    displayTasks();

}

// SUPPORT SESSIONS // 
// Support Session class
class SupportSession {

    constructor(topic, date, notes) {

        this.topic = topic;

        this.date = date;

        this.notes = notes;

        this.status = "Pending";

    }

}


// Store support sessions
let supportSessions = [];


// Get HTML elements
const supportForm =
    document.getElementById("supportForm");

const supportTopic =
    document.getElementById("supportTopic");

const supportDate =
    document.getElementById("supportDate");

const supportNotes =
    document.getElementById("supportNotes");

const sessionList =
    document.getElementById("sessionList");


// Submit support request
supportForm.addEventListener("submit", function (event) {

    event.preventDefault();


    // Get values from form
    const topic =
        supportTopic.value;

    const date =
        supportDate.value;

    const notes =
        supportNotes.value.trim();


    // Create SupportSession object
    const session =
        new SupportSession(
            topic,
            date,
            notes
        );


    // Add session to array
    supportSessions.push(session);


    // Clear form
    supportForm.reset();


    // Display sessions
    displaySessions();

});


// Display support sessions
function displaySessions() {

    sessionList.innerHTML = "";


    supportSessions.forEach(function (session, index) {

        const sessionCard =
            document.createElement("div");


        sessionCard.className =
            "session-card";


        sessionCard.innerHTML = `

            <h3>
                ${session.topic}
            </h3>

            <p>
                <strong>Date:</strong>
                ${session.date}
            </p>

            <p>
                <strong>Notes:</strong>
                ${session.notes}
            </p>

            <p>
                <strong>Status:</strong>
                ${session.status}
            </p>

            <button
                type="button"
                onclick="cancelSession(${index})">

                Cancel Request

            </button>

        `;


        sessionList.appendChild(sessionCard);

    });

}


// Cancel support session
function cancelSession(index) {

    supportSessions.splice(index, 1);

    displaySessions();

}
=======

	document.getElementById('restartStageBtn')?.addEventListener('click', () => {
		currentQuestion = 0;
		selectedAnswer = null;
		if (sessionStatus) sessionStatus.textContent = 'In progress';
		loadQuestion();
	});

	document.getElementById('restartAllBtn')?.addEventListener('click', () => {
		currentStage = 0;
		currentQuestion = 0;
		score = 0;
		selectedAnswer = null;
		if (sessionStatus) sessionStatus.textContent = 'In progress';
		loadQuestion();
	});

	document.querySelectorAll('.stage-btn').forEach((button, index) => {
		button.addEventListener('click', () => {
			currentStage = index;
			currentQuestion = 0;
			selectedAnswer = null;
			if (sessionStatus) sessionStatus.textContent = 'In progress';
			loadQuestion();
		});
	});

	document.getElementById('signOutBtn')?.addEventListener('click', () => {
		alert('You have signed out.');
	});

	document.getElementById('supportBtn')?.addEventListener('click', () => {
		alert('Support booking section coming soon.');
	});

	loadQuestion();
};

gameSessionInit();
>>>>>>> c2f8658cb21f4e35faaa45a0710f9cb86f486da0
