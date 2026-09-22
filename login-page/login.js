import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js';
import {
	getAuth,
	signInWithEmailAndPassword,
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

const passwordToggle = document.querySelector('[data-toggle-password]');

if (passwordToggle) {
	const passwordInput = document.getElementById(passwordToggle.dataset.togglePassword);

	if (passwordInput) {
		passwordToggle.addEventListener('click', () => {
			const isVisible = passwordInput.type === 'text';

			passwordInput.type = isVisible ? 'password' : 'text';
			passwordToggle.setAttribute('aria-pressed', String(!isVisible));
			passwordToggle.setAttribute('aria-label', isVisible ? 'Show password' : 'Hide password');
		});
	}
}

const loginForm = document.getElementById('loginPanel');
const message = document.getElementById('message');

const setMessage = (text, type = '') => {
	if (!message) {
		return;
	}

	message.textContent = text;
	message.className = type ? `message ${type}` : 'message';
};

const redirectAfterLogin = (role) => {
	const target = role === 'facilitator'
		? '../facilitator-dashboard/facilitator-dashboard.html'
		: '../leaner-dashboard/learner-dashboard.html';

	window.location.href = target;
};

if (loginForm && message) {
	loginForm.addEventListener('submit', async (event) => {
		event.preventDefault();

		if (!loginForm.checkValidity()) {
			setMessage('Enter a valid email address and password.', 'error');
			loginForm.reportValidity();
			return;
		}

		const email = document.getElementById('loginEmail')?.value.trim();
		const password = document.getElementById('loginPassword')?.value;
		const selectedRole = document.getElementById('loginRole')?.value || 'learner';

		setMessage('Verifying your login details...', 'success');

		try {
			const credentials = await signInWithEmailAndPassword(auth, email, password);
			const user = credentials.user;
			let profile = null;

			try {
				const profileSnapshot = await getDoc(doc(db, 'registrations', user.uid));
				if (profileSnapshot.exists()) {
					profile = profileSnapshot.data();
				}
			} catch (error) {
				console.warn('Could not read Firestore profile during login.', error);
			}

			const resolvedRole = profile?.role || selectedRole;

			if (profile?.role && profile.role !== selectedRole) {
				await signOut(auth);
				setMessage(`This account is registered as a ${profile.role}. Please choose the correct role.`, 'error');
				return;
			}

			localStorage.setItem('learnerHubUser', JSON.stringify({
				uid: user.uid,
				email: user.email,
				displayName: user.displayName || profile?.username || user.email,
				role: resolvedRole,
				programme: profile?.programme || ''
			}));

			setMessage('Login successful. Redirecting...', 'success');
			redirectAfterLogin(resolvedRole);
		} catch (error) {
			console.error('Login failed:', error);
			const messageMap = {
				'auth/invalid-email': 'Enter a valid email address.',
				'auth/user-not-found': 'No account matches that email.',
				'auth/wrong-password': 'Incorrect password. Please try again.',
				'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
				'auth/invalid-credential': 'Your email or password is incorrect.'
			};

			setMessage(messageMap[error.code] || 'Login failed. Please check your credentials and try again.', 'error');
		}
	});
}
