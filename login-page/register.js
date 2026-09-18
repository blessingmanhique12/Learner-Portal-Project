import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js';
import {
	createUserWithEmailAndPassword,
	getAuth,
	sendEmailVerification,
	updateProfile
} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';
import {
	doc,
	getFirestore,
	serverTimestamp,
	setDoc
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

const registerForm = document.getElementById('registerPanel');
const emailInput = document.getElementById('registerEmail');
const usernameInput = document.getElementById('registerUsername');
const phoneInput = document.getElementById('registerPhone');
const roleInput = document.getElementById('registerRole');
const programmeInput = document.getElementById('registerProgramme');
const passwordInput = document.getElementById('registerPassword');
const otpInput = document.getElementById('registerOtp');
const sendOtpButton = document.getElementById('sendRegisterOtp');
const registerButton = document.getElementById('registerButton');
const message = document.getElementById('registerMessage');
const passwordToggle = document.querySelector('[data-toggle-password]');

let currentOtp = '';
const redirectDelay = 800;
const createAccountTimeout = 6500;
const firebaseStepTimeout = 1800;

const setMessage = (text, type = '') => {
	if (!message) {
		return;
	}

	message.textContent = text;
	message.className = type ? `message ${type}` : 'message';
};

const getSelectedVerificationMethod = () => {
	const selectedMethod = document.querySelector('input[name="verificationMethod"]:checked');
	return selectedMethod ? selectedMethod.value : 'email';
};

const buildUsername = (email) => {
	const [name] = email.trim().toLowerCase().split('@');
	return name.replace(/[^a-z0-9._-]/g, '') || 'learner';
};

const updateUsername = () => {
	if (!emailInput || !usernameInput) {
		return;
	}

	usernameInput.value = emailInput.validity.valid ? buildUsername(emailInput.value) : '';
};

const updateProgrammeRequirement = () => {
	if (!roleInput || !programmeInput) {
		return;
	}

	const isLearner = roleInput.value === 'learner';
	programmeInput.required = isLearner;
	programmeInput.placeholder = isLearner ? 'Required for learners' : 'Optional for facilitators';
};

const toggleLoading = (isLoading) => {
	if (registerButton) {
		registerButton.disabled = isLoading;
		registerButton.textContent = isLoading ? 'Creating account...' : 'Create account';
	}

	if (sendOtpButton) {
		sendOtpButton.disabled = isLoading;
	}
};

const withTimeout = (promise, label, milliseconds = firebaseStepTimeout) => Promise.race([
	promise,
	new Promise((_, reject) => {
		window.setTimeout(() => {
			reject(new Error(`${label} timed out.`));
		}, milliseconds);
	})
]);

const runOptionalFirebaseStep = async (promise, label) => {
	try {
		await withTimeout(promise, label);
	} catch (error) {
		console.warn(`${label} could not finish before redirect.`, error);
	}
};

const saveRegisteredRole = (email, role) => {
	try {
		const roles = JSON.parse(localStorage.getItem('learnerHubRegisteredRoles')) || {};
		roles[email.toLowerCase()] = role;
		localStorage.setItem('learnerHubRegisteredRoles', JSON.stringify(roles));
	} catch (error) {
		console.warn('Could not save registered role locally.', error);
	}
};

const getFriendlyFirebaseError = (error) => {
	switch (error.code) {
		case 'auth/email-already-in-use':
			return 'This email is already registered. Try signing in instead.';
		case 'auth/invalid-email':
			return 'Enter a valid email address.';
		case 'auth/weak-password':
			return 'Use a password with at least 6 characters.';
		case 'permission-denied':
			return 'Firebase saved the account, but Firestore rules blocked the profile. Check your database rules.';
		default:
			return error.message || 'Registration failed. Please try again.';
	}
};

if (passwordToggle) {
	const controlledPassword = document.getElementById(passwordToggle.dataset.togglePassword);

	if (controlledPassword) {
		passwordToggle.addEventListener('click', () => {
			const isVisible = controlledPassword.type === 'text';

			controlledPassword.type = isVisible ? 'password' : 'text';
			passwordToggle.setAttribute('aria-pressed', String(!isVisible));
			passwordToggle.setAttribute('aria-label', isVisible ? 'Show password' : 'Hide password');
		});
	}
}

if (emailInput) {
	emailInput.addEventListener('input', updateUsername);
}

if (roleInput) {
	roleInput.addEventListener('change', updateProgrammeRequirement);
	updateProgrammeRequirement();
}

if (sendOtpButton) {
	sendOtpButton.addEventListener('click', () => {
		const method = getSelectedVerificationMethod();
		const destination = method === 'phone' ? phoneInput?.value.trim() : emailInput?.value.trim();

		if (!destination) {
			setMessage(`Enter your ${method === 'phone' ? 'phone number' : 'email address'} before sending an OTP.`, 'error');
			return;
		}

		currentOtp = String(Math.floor(100000 + Math.random() * 900000));
		otpInput.value = currentOtp;
		otpInput.focus();
		setMessage(`Demo OTP sent by ${method}. Use ${currentOtp} to finish registration.`, 'success');
	});
}

if (registerForm) {
	registerForm.addEventListener('submit', async (event) => {
		event.preventDefault();
		updateUsername();
		updateProgrammeRequirement();

		if (!registerForm.checkValidity()) {
			setMessage('Complete the required fields before creating your account.', 'error');
			registerForm.reportValidity();
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

		const email = emailInput.value.trim();
		const username = usernameInput.value.trim() || buildUsername(email);
		const role = roleInput.value;
		const programme = programmeInput.value.trim();
		const phone = phoneInput.value.trim();
		const verificationMethod = getSelectedVerificationMethod();

		toggleLoading(true);
		setMessage('Creating your account...', '');

		try {
			const credential = await withTimeout(
				createUserWithEmailAndPassword(auth, email, passwordInput.value),
				'Account creation',
				createAccountTimeout
			);

			await Promise.all([
				runOptionalFirebaseStep(updateProfile(credential.user, { displayName: username }), 'Profile update'),
				runOptionalFirebaseStep(setDoc(doc(db, 'registrations', credential.user.uid), {
					uid: credential.user.uid,
					email,
					username,
					phone,
					role,
					programme,
					verificationMethod,
					otpConfirmed: true,
					createdAt: serverTimestamp()
				}), 'Registration profile save'),
				runOptionalFirebaseStep(sendEmailVerification(credential.user), 'Email verification')
			]);

			saveRegisteredRole(email, role);
			registerForm.reset();
			currentOtp = '';
			updateProgrammeRequirement();
			if (registerButton) {
				registerButton.textContent = 'Registered';
			}
			setMessage('You are registered successfully. Redirecting to login...', 'success');
			window.setTimeout(() => {
				window.location.href = 'login.html';
			}, redirectDelay);
		} catch (error) {
			setMessage(getFriendlyFirebaseError(error), 'error');
			toggleLoading(false);
		} finally {
			if (!message?.classList.contains('success')) {
				toggleLoading(false);
			}
		}
	});
}
