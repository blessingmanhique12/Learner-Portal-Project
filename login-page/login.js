import {
    sendEmailVerification,
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

import { auth, db } from "../FirebaseAuth/firebase.js";

class LoginPage {
    constructor() {
        this.form = document.getElementById("loginPanel");
        this.message = document.getElementById("message");
        this.resendButton = document.getElementById("resendVerification");
        this.submitButton = document.getElementById("loginButton");
        this.emailInput = document.getElementById("loginEmail");
        this.passwordInput = document.getElementById("loginPassword");
    }

    init() {
        this.bindPasswordToggle();

        this.form?.addEventListener("submit", (event) =>
            this.handleSubmit(event)
        );

        this.resendButton?.addEventListener("click", () =>
            this.resendVerification()
        );
    }

    getCredentials() {
        return {
            email: this.emailInput.value.trim(),
            password: this.passwordInput.value
        };
    }

    setMessage(text, type = "") {
        this.message.textContent = text;
        this.message.className = type
            ? `message ${type}`
            : "message";
    }

    bindPasswordToggle() {
        const toggle = document.querySelector("[data-toggle-password]");
        const input =
            toggle &&
            document.getElementById(toggle.dataset.togglePassword);

        if (!toggle || !input) return;

        toggle.addEventListener("click", () => {
            const visible = input.type === "text";

            input.type = visible ? "password" : "text";

            toggle.setAttribute(
                "aria-pressed",
                String(!visible)
            );

            toggle.setAttribute(
                "aria-label",
                visible ? "Show password" : "Hide password"
            );
        });
    }

    async handleSubmit(event) {
        event.preventDefault();

        if (!this.form.checkValidity()) {
            this.form.reportValidity();
            return;
        }

        const { email, password } = this.getCredentials();

        this.setMessage(
            "Verifying your login details...",
            "success"
        );

        this.resendButton.hidden = true;
        this.submitButton.disabled = true;

        try {
            const { user } =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            if (!user.emailVerified) {
                await signOut(auth);

                this.setMessage(
                    "Verify your email before signing in. You can request another verification link below.",
                    "error"
                );

                this.resendButton.hidden = false;
                return;
            }

            const profileSnapshot = await getDoc(
                doc(db, "registrations", user.uid)
            );

            if (!profileSnapshot.exists()) {
                await signOut(auth);

                this.setMessage(
                    "No learner portal profile is associated with this account.",
                    "error"
                );

                return;
            }

            const profile = profileSnapshot.data();

            if (
                profile.role !== "learner" &&
                profile.role !== "facilitator"
            ) {
                await signOut(auth);

                this.setMessage(
                    "This account does not have a valid portal role. Please contact your administrator.",
                    "error"
                );

                return;
            }

            localStorage.setItem(
                "learnerHubUser",
                JSON.stringify({
                    uid: user.uid,
                    email: user.email,
                    displayName:
                        user.displayName ||
                        profile.username ||
                        user.email,
                    role: profile.role,
                    programme: profile.programme || ""
                })
            );

            this.setMessage(
                "Login successful. Redirecting...",
                "success"
            );

            const target =
                profile.role === "facilitator"
                    ? "../facilitator-dashboard/facilitator-dashboard.html"
                    : "../leaner-dashboard/learner-progress/learner-progress.html";

            window.location.href = target;

        } catch (error) {
            if (auth.currentUser) {
                await signOut(auth);
            }

            console.error("Login failed:", error);

            const messages = {
                "auth/invalid-email":
                    "Enter a valid email address.",

                "auth/too-many-requests":
                    "Too many attempts. Please wait a moment and try again.",

                "auth/invalid-credential":
                    "Your email or password is incorrect.",

                "permission-denied":
                    "Could not verify your account role. Please try again or contact an administrator."
            };

            this.setMessage(
                messages[error.code] ||
                    "Login failed. Please check your credentials and try again.",
                "error"
            );

        } finally {
            this.submitButton.disabled = false;
        }
    }

    async resendVerification() {
        const { email, password } =
            this.getCredentials();

        if (!email || !password) {
            this.setMessage(
                "Enter your email and password to request a new verification link.",
                "error"
            );

            return;
        }

        this.resendButton.disabled = true;

        this.setMessage(
            "Sending verification email...",
            "success"
        );

        try {
            const { user } =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            if (user.emailVerified) {
                this.setMessage(
                    "This email is already verified. Sign in to continue.",
                    "success"
                );

                this.resendButton.hidden = true;
                return;
            }

            await sendEmailVerification(user);

            this.setMessage(
                "A new verification link has been sent. Check your inbox and spam folder.",
                "success"
            );

        } catch (error) {
            this.setMessage(
                error.code === "auth/too-many-requests"
                    ? "Too many requests. Wait a moment before trying again."
                    : "Could not send a verification link. Check your details and try again.",
                "error"
            );

        } finally {
            if (auth.currentUser) {
                await signOut(auth);
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
		if (!this.form.checkValidity()) {
			this.form.reportValidity();
			return;
		}

		const { email, password } = this.getCredentials();
		this.setMessage('Verifying your login details...', 'success');
		this.resendButton.hidden = true;
		this.submitButton.disabled = true;

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
				displayName: user.displayName || profile.username || user.email,
				role: profile.role,
				programme: profile.programme || ''
			}));

			this.setMessage('Login successful. Redirecting...', 'success');
			const target = profile.role === 'facilitator'
				? '../facilitator-dashboard/facilitator-dashboard.html'
				: '../leaner-dashboard/learner-progress/learner-progress.html';
			window.location.href = target;
		} catch (error) {
			if (auth.currentUser) {
				await signOut(auth);
			}

			console.error('Login failed:', error);
			const messages = {
				'auth/invalid-email': 'Enter a valid email address.',
				'auth/user-not-found': 'No account matches that email.',
				'auth/wrong-password': 'Incorrect password. Please try again.',
				'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
				'auth/invalid-credential': 'Your email or password is incorrect.',
				'permission-denied': 'Could not verify your account role. Please try again or contact your administrator.'
			};
			this.setMessage(messages[error.code] || 'Login failed. Please check your credentials and try again.', 'error');
		} finally {
			this.submitButton.disabled = false;
		}
	}

	async resendVerification() {
		const { email, password } = this.getCredentials();
		if (!email || !password) {
			this.setMessage('Enter your email and password to request a new verification link.', 'error');
			return;
		}

		this.resendButton.disabled = true;
		this.setMessage('Sending verification email...', 'success');
		try {
			const { user } = await signInWithEmailAndPassword(auth, email, password);
			if (user.emailVerified) {
				this.setMessage('This email is already verified. Sign in to continue.', 'success');
				this.resendButton.hidden = true;
				return;
			}

			await sendEmailVerification(user);
			this.setMessage('A new verification link has been sent. Check your inbox and spam folder.', 'success');
		} catch (error) {
			this.setMessage(error.code === 'auth/too-many-requests'
				? 'Too many requests. Wait a moment before trying again.'
				: 'Could not send a verification link. Check your details and try again.', 'error');
		} finally {
			if (auth.currentUser) {
				await signOut(auth);
			}
			this.resendButton.disabled = false;
		}
	}
}

new LoginPage().init();