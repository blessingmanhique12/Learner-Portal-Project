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
