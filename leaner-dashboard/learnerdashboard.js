import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js';
import {
	getAuth,
	onAuthStateChanged,
	signOut
} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';
import {
	doc,
	getDoc,
	getFirestore
} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js';

const firebaseConfig = {
	apiKey: 'AIzaSyAmmMxhDa9LLme7uP1y-X2kMJHr3t6tT5E',
	authDomain: 'ron-learn.firebaseapp.com',
	projectId: 'ron-learn',
	storageBucket: 'ron-learn.firebasestorage.app',
	messagingSenderId: '63585372704',
	appId: '1:63585372704:web:b75d9cc803c9b15e0c8a45',
	measurementId: 'G-M7RYTEEEVS'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const loginPath = '../login-page/login.html';
const welcome = document.getElementById('learnerWelcome');
const programmeValue = document.getElementById('programmeValue');
const message = document.getElementById('dashboardMessage');
const logoutButton = document.getElementById('logoutButton');

const setMessage = (text, type = '') => {
	if (!message) {
		return;
	}

	message.textContent = text;
	message.className = type ? `message ${type}` : 'message';
};

const redirectToLogin = () => {
	localStorage.removeItem('learnerHubUser');
	window.location.href = loginPath;
};

const readStoredUser = () => {
	try {
		return JSON.parse(localStorage.getItem('learnerHubUser')) || null;
	} catch {
		return null;
	}
};

onAuthStateChanged(auth, async (user) => {
	if (!user) {
		redirectToLogin();
		return;
	}

	try {
		let profile = readStoredUser();

		try {
			const profileSnapshot = await getDoc(doc(db, 'registrations', user.uid));
			profile = profileSnapshot.exists() ? profileSnapshot.data() : profile;
		} catch (error) {
			console.warn('Could not read Firestore profile. Using stored learner session.', error);
		}

		if (profile?.role && profile.role !== 'learner') {
			await signOut(auth);
			redirectToLogin();
			return;
		}

		const displayName = user.displayName || profile?.username || user.email;
		welcome.textContent = `Welcome, ${displayName}.`;
		programmeValue.textContent = profile?.programme || 'No programme saved yet.';
		localStorage.setItem('learnerHubUser', JSON.stringify({
			uid: user.uid,
			email: user.email,
			displayName,
			role: 'learner',
			programme: profile?.programme || ''
		}));
		setMessage('Firebase session connected.');
	} catch (error) {
		setMessage(error.message || 'Could not load your learner profile.', 'error');
	}
});

if (logoutButton) {
	logoutButton.addEventListener('click', async () => {
		await signOut(auth);
		redirectToLogin();
	});
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
