import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js';
import {
	getAuth,
	signOut,
	signInWithEmailAndPassword
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
const loginForm = document.getElementById('loginPanel');
const loginButton = document.getElementById('loginButton');
const message = document.getElementById('message');
const emailInput = document.getElementById('loginEmail');
const passwordInput = document.getElementById('loginPassword');
const roleInput = document.getElementById('loginRole');

const dashboardPaths = {
	learner: '../leaner-dashboard/learner-dashboard.html',
	facilitator: '../facilitator-dashboard/facilitator-dashboard.html'
};

const loginTimeout = 6500;
const profileTimeout = 3500;

const withTimeout = (promise, milliseconds, label) => Promise.race([
	promise,
	new Promise((_, reject) => {
		window.setTimeout(() => {
			reject(new Error(`${label} timed out.`));
		}, milliseconds);
	})
]);

const setMessage = (text, type = '') => {
	if (!message) {
		return;
	}

	message.textContent = text;
	message.className = type ? `message ${type}` : 'message';
};

const toggleLoading = (isLoading) => {
	if (!loginButton) {
		return;
	}

	loginButton.disabled = isLoading;
	loginButton.textContent = isLoading ? 'Signing in...' : 'Sign in';
};

const getFriendlyFirebaseError = (error) => {
	switch (error.code) {
		case 'auth/invalid-email':
			return 'Enter a valid email address.';
		case 'auth/invalid-credential':
		case 'auth/user-not-found':
		case 'auth/wrong-password':
			return 'The email or password is incorrect.';
		case 'auth/too-many-requests':
			return 'Too many sign-in attempts. Please wait a moment and try again.';
		case 'permission-denied':
			return 'Signed in, but Firebase blocked the profile lookup. Check your Firestore rules.';
		default:
			return error.message || 'Login failed. Please try again.';
	}
};

const readRegistrationProfile = async (uid) => {
	try {
		const profileSnapshot = await withTimeout(
			getDoc(doc(db, 'registrations', uid)),
			profileTimeout,
			'Profile lookup'
		);
		return profileSnapshot.exists() ? profileSnapshot.data() : null;
	} catch (error) {
		console.warn('Could not read Firestore profile. Continuing with selected login role.', error);
		return null;
	}
};

const getSavedRegisteredRole = (email) => {
	try {
		const roles = JSON.parse(localStorage.getItem('learnerHubRegisteredRoles')) || {};
		return roles[email.toLowerCase()] || '';
	} catch {
		return '';
	}
};

if (passwordToggle) {
	const passwordInputForToggle = document.getElementById(passwordToggle.dataset.togglePassword);

	if (passwordInputForToggle) {
		passwordToggle.addEventListener('click', () => {
			const isVisible = passwordInputForToggle.type === 'text';

			passwordInputForToggle.type = isVisible ? 'password' : 'text';
			passwordToggle.setAttribute('aria-pressed', String(!isVisible));
			passwordToggle.setAttribute('aria-label', isVisible ? 'Show password' : 'Hide password');
		});
	}
}

if (loginForm) {
	loginForm.addEventListener('submit', async (event) => {
		event.preventDefault();

		if (!loginForm.checkValidity()) {
			setMessage('Enter a valid email address and password.', 'error');
			loginForm.reportValidity();
			return;
		}

		toggleLoading(true);
		setMessage('Checking your account...', '');

		try {
			const credential = await withTimeout(
				signInWithEmailAndPassword(
					auth,
					emailInput.value.trim(),
					passwordInput.value
				),
				loginTimeout,
				'Login'
			);
			const profile = await readRegistrationProfile(credential.user.uid);
			const selectedRole = roleInput.value;
			const registeredRole = profile?.role || getSavedRegisteredRole(emailInput.value.trim());

			if (!registeredRole) {
				await signOut(auth);
				localStorage.removeItem('learnerHubUser');
				setMessage('Could not verify your registered role. Please register first or try again.', 'error');
				return;
			}

			if (registeredRole && registeredRole !== selectedRole) {
				await signOut(auth);
				localStorage.removeItem('learnerHubUser');
				setMessage('Choose the right option.', 'error');
				return;
			}

			localStorage.setItem('learnerHubUser', JSON.stringify({
				uid: credential.user.uid,
				email: credential.user.email,
				displayName: credential.user.displayName || profile?.username || '',
				role: selectedRole,
				programme: profile?.programme || ''
			}));

			setMessage('Login successful. Opening your dashboard...', 'success');
			window.location.href = dashboardPaths[selectedRole];
		} catch (error) {
			setMessage(getFriendlyFirebaseError(error), 'error');
		} finally {
			toggleLoading(false);
		}
	});
}
