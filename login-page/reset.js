import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js';
import {
	getAuth,
	sendPasswordResetEmail
} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';

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

const resetForm = document.getElementById('resetPanel');
const resetButton = document.getElementById('resetButton');
const resetMessage = document.getElementById('resetMessage');
const sendResetOtp = document.getElementById('sendResetOtp');
const emailInput = document.getElementById('resetEmail');
const phoneInput = document.getElementById('resetPhone');
const otpInput = document.getElementById('resetOtp');
const passwordToggle = document.querySelector('[data-toggle-password]');

let currentOtp = '';
const resetTimeout = 6500;
const redirectDelay = 900;

const withTimeout = (promise, label) => Promise.race([
	promise,
	new Promise((_, reject) => {
		window.setTimeout(() => {
			reject(new Error(`${label} timed out.`));
		}, resetTimeout);
	})
]);

const setMessage = (text, type = '') => {
	if (!resetMessage) {
		return;
	}

	resetMessage.textContent = text;
	resetMessage.className = type ? `message ${type}` : 'message';
};

const getSelectedResetFactor = () => {
	const selectedFactor = document.querySelector('input[name="resetFactor"]:checked');
	return selectedFactor ? selectedFactor.value : 'email';
};

const toggleLoading = (isLoading) => {
	if (resetButton) {
		resetButton.disabled = isLoading;
		resetButton.textContent = isLoading ? 'Sending reset link...' : 'Send reset link';
	}

	if (sendResetOtp) {
		sendResetOtp.disabled = isLoading;
	}
};

const getFriendlyFirebaseError = (error) => {
	switch (error.code) {
		case 'auth/invalid-email':
			return 'Enter a valid email address.';
		case 'auth/user-not-found':
			return 'No Firebase account was found for this email.';
		case 'auth/too-many-requests':
			return 'Too many reset attempts. Please wait a moment and try again.';
		default:
			return error.message || 'Password reset failed. Please try again.';
	}
};

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

if (sendResetOtp) {
	sendResetOtp.addEventListener('click', () => {
		const factor = getSelectedResetFactor();
		const destination = factor === 'phone' ? phoneInput.value.trim() : emailInput.value.trim();

		if (!destination) {
			setMessage(`Enter your ${factor === 'phone' ? 'phone number' : 'email address'} before sending an OTP.`, 'error');
			return;
		}

		currentOtp = String(Math.floor(100000 + Math.random() * 900000));
		otpInput.value = currentOtp;
		otpInput.focus();
		setMessage(`Demo OTP sent by ${factor}. Use ${currentOtp} to continue.`, 'success');
	});
}

if (resetForm) {
	resetForm.addEventListener('submit', async (event) => {
		event.preventDefault();

		if (!emailInput.value.trim()) {
			setMessage('Enter the email address for the account you want to reset.', 'error');
			emailInput.focus();
			return;
		}

		if (!currentOtp) {
			setMessage('Send the OTP first, then confirm it to continue.', 'error');
			return;
		}

		if (otpInput.value.trim() !== currentOtp) {
			setMessage('The OTP does not match. Send a new code or check the number entered.', 'error');
			return;
		}

		toggleLoading(true);
		setMessage('Sending Firebase password reset email...', '');

		try {
			await withTimeout(sendPasswordResetEmail(auth, emailInput.value.trim()), 'Password reset');
			resetForm.reset();
			currentOtp = '';
			setMessage('Password reset email sent. Returning to login...', 'success');
			window.setTimeout(() => {
				window.location.href = 'login.html';
			}, redirectDelay);
		} catch (error) {
			setMessage(getFriendlyFirebaseError(error), 'error');
		} finally {
			toggleLoading(false);
		}
	});
}
