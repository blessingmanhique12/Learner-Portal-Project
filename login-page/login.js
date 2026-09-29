import {
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

import { auth, db } from "../FirebaseAuth/firebase.js";

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
		: '../leaner-dashboard/learner-progress/learner-progress.html';

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
			const profileSnapshot = await getDoc(doc(db, 'registrations', user.uid));
			if (!profileSnapshot.exists()) {
				await signOut(auth);
				setMessage('No learner portal profile is associated with this account.', 'error');
				return;
			}

			const profile = profileSnapshot.data();
			const resolvedRole = profile.role;

			if (resolvedRole !== 'learner' && resolvedRole !== 'facilitator') {
				await signOut(auth);
				setMessage('This account does not have a valid portal role. Please contact your administrator.', 'error');
				return;
			}

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
			if (auth.currentUser) {
				await signOut(auth);
			}

			console.error('Login failed:', error);
			const messageMap = {
				'auth/invalid-email': 'Enter a valid email address.',
				'auth/user-not-found': 'No account matches that email.',
				'auth/wrong-password': 'Incorrect password. Please try again.',
				'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
				'auth/invalid-credential': 'Your email or password is incorrect.',
				'permission-denied': 'Could not verify your account role. Please try again or contact your administrator.'
			};

			setMessage(messageMap[error.code] || 'Login failed. Please check your credentials and try again.', 'error');
		}
	});
}
