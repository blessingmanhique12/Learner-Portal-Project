// Firebase Authentication and Firestore
import {
    createUserWithEmailAndPassword,
    deleteUser,
    sendEmailVerification,
	sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

import { auth, db } from "../FirebaseAuth/firebase.js";

class RegistrationPage {
	constructor() {
		this.form = document.getElementById("registerPanel");
		this.message = document.getElementById("registerMessage");
		this.messageText = document.getElementById("registerMessageText");
		this.loader = document.getElementById("registerLoader");
		this.submitButton = document.getElementById("registerButton");
		this.programmeInput = document.getElementById("registerProgramme");
		this.registrationDraftKey = "learnerHubRegistrationDraft";
		this.user = null;
	}

	init() {
		this.bindPasswordToggle();
		this.bindProgrammeRequirement();
		this.bindUsernameSuggestion();
		this.restoreRegistrationDraft();
		this.form?.addEventListener("submit", (event) => this.handleSubmit(event));
	}
////////////////////////////
	restoreRegistrationDraft() {
		try {
			const savedDraft = localStorage.getItem(this.registrationDraftKey);
			if (!savedDraft) return;

			const { data, expiresAt } = JSON.parse(savedDraft);
			if (!data || expiresAt <= Date.now()) {
				localStorage.removeItem(this.registrationDraftKey);
				return;
			}

			document.getElementById("registerEmail").value = data.email || "";
			document.getElementById("registerUsername").value = data.username || "";
			document.getElementById("registerPhone").value = data.phone || "";
			document.getElementById("registerRole").value = data.role || "learner";
			this.programmeInput.value = data.programme || "";
			this.updateProgrammeRequirement();
			this.setMessage("Your registration details were restored. Enter your new password and submit to finish setting up your profile.", "success");
		} catch (error) {
			localStorage.removeItem(this.registrationDraftKey);
			console.warn("Could not restore the registration draft.", error);
		}
	}

	saveRegistrationDraft(data) {
		const { email, username, phone, role, programme } = data;
		localStorage.setItem(this.registrationDraftKey, JSON.stringify({
			data: { email, username, phone, role, programme },
			expiresAt: Date.now() + 30 * 60 * 1000
		}));
	}

	bindPasswordToggle() {
		const toggle = document.querySelector("[data-toggle-password]");
		const input = toggle && document.getElementById(toggle.dataset.togglePassword);
		if (!toggle || !input) return;

		toggle.addEventListener("click", () => {
			const visible = input.type === "text";
			input.type = visible ? "password" : "text";
			toggle.setAttribute("aria-pressed", String(!visible));
			toggle.setAttribute("aria-label", visible ? "Show password" : "Hide password");
		});
	}

	bindProgrammeRequirement() {
		const roleInput = document.getElementById("registerRole");
		roleInput?.addEventListener("change", () => this.updateProgrammeRequirement());
		this.updateProgrammeRequirement();
	}

	updateProgrammeRequirement() {
		this.programmeInput.required = document.getElementById("registerRole")?.value === "learner";
	}

	bindUsernameSuggestion() {
		const emailInput = document.getElementById("registerEmail");
		const usernameInput = document.getElementById("registerUsername");
		emailInput?.addEventListener("input", () => {
			const email = emailInput.value.trim();
			usernameInput.value = email.includes("@") ? email.split("@")[0] : "";
		});
	}

	setMessage(text, type = "") {
		this.messageText.textContent = text;
		this.message.className = type ? `message ${type}` : "message";
		this.message.setAttribute("aria-busy", String(type === "loading"));
		this.loader.hidden = type !== "loading";
	}

	getFormData() {
		return {
			email: document.getElementById("registerEmail").value.trim(),
			username: document.getElementById("registerUsername").value.trim(),
			phone: document.getElementById("registerPhone").value.trim(),
			role: document.getElementById("registerRole").value,
			programme: this.programmeInput.value.trim(),
			password: document.getElementById("registerPassword").value
		};
	}

	async handleSubmit(event) {
		event.preventDefault();
		const data = this.getFormData();

		if (!data.email || !data.password || !data.role) {
			this.setMessage("Complete all required fields.", "error");
			return;
		}
		if (data.password.length < 6) {
			this.setMessage("Password must contain at least 6 characters.", "error");
			return;
		}
		if (data.role === "learner" && !data.programme) {
			this.setMessage("Enter your programme to register as a learner.", "error");
			return;
		}

		this.submitButton.disabled = true;
		this.user = null;
		this.setMessage("Creating your account...", "loading");

		try {
			const credentials = await createUserWithEmailAndPassword(auth, data.email, data.password);
			this.user = credentials.user;
			const displayName = data.username || data.email.split("@")[0];
			await updateProfile(this.user, { displayName });
			await this.createProfile(this.user, data, displayName);

			this.setMessage("Sending verification email...", "loading");
			try {
				await sendEmailVerification(this.user);
			} catch (error) {
				await signOut(auth);
				this.setMessage("Account created, but the verification email could not be sent. Go to login and request another link.", "error");
				return;
			}

			await signOut(auth);
			this.finishSuccessfully(`Account created. We sent a verification link to ${data.email}. Verify your email before signing in.`);
		} catch (error) {
			if (error.code === "auth/email-already-in-use") {
				await this.recoverExistingAccount(data);
				return;
			}

			if (this.user && auth.currentUser) {
				try {
					await deleteUser(this.user);
				} catch (cleanupError) {
					console.warn("Could not remove the incomplete account.", cleanupError);
					await signOut(auth);
				}
			}

			console.error("Registration failed:", error);
			this.setMessage(this.errorMessage(error), "error");
		} finally {
			this.submitButton.disabled = false;
		}
	}

	async createProfile(user, data, displayName) {
		await setDoc(doc(db, "registrations", user.uid), {
			uid: user.uid,
			email: user.email,
			username: displayName,
			displayName,
			phone: data.phone,
			role: data.role,
			programme: data.programme,
			createdAt: serverTimestamp()
		});
	}

	async recoverExistingAccount(data) {
		try {
			this.setMessage("Checking existing account...", "loading");
			const credentials = await signInWithEmailAndPassword(auth, data.email, data.password);
			const user = credentials.user;
			const profileRef = doc(db, "registrations", user.uid);
			const profileSnapshot = await getDoc(profileRef);

			if (profileSnapshot.exists()) {
				await signOut(auth);
				this.setMessage("This account is already registered. Sign in or use Forgot password to recover access.", "error");
				return;
			}

			const displayName = data.username || data.email.split("@")[0];
			this.setMessage("Completing your account profile...", "loading");
			await updateProfile(user, { displayName });
			await setDoc(profileRef, {
				uid: user.uid,
				email: user.email,
				username: displayName,
				displayName,
				phone: data.phone,
				role: data.role,
				programme: data.programme,
				createdAt: serverTimestamp()
			});

			if (!user.emailVerified) {
				this.setMessage("Sending verification email...", "loading");
				await sendEmailVerification(user);
			}

			await signOut(auth);
			this.finishSuccessfully(user.emailVerified
				? "Your existing account profile is now complete. You can sign in."
				: "Your account profile is now complete. We sent a verification link; verify your email before signing in.");
		} catch (error) {
			if (["auth/invalid-credential", "auth/wrong-password"].includes(error.code)) {
				this.saveRegistrationDraft(data);
				try {
					await sendPasswordResetEmail(auth, data.email);
					this.setMessage(
						"Firebase Authentication in project studyflow-f62b2 reports that this email is already registered. This is separate from Firestore, so the registrations profile may still be missing. We sent a secure password-reset link. Reset your password, return here, enter the new password, and submit to complete your profile. Your non-password details are saved on this device for 30 minutes. If you believe this email is not listed under Authentication > Users in project studyflow-f62b2, verify that you are checking the same Firebase project and using the latest deployed registration page.",
						"success"
					);
				} catch (resetError) {
					console.error("Could not send the password reset email:", resetError);
					const resetMessage = resetError.code === "auth/too-many-requests"
						? "Too many password-reset requests. Wait a while, then use Forgot password to continue account recovery. Your registration details are saved on this device for 30 minutes."
						: "We could not send a password-reset email. Use Forgot password to reset your password, then return here to complete your profile. Your registration details are saved on this device for 30 minutes.";
					this.setMessage(resetMessage, "error");
				}
				return;
			}

			if (auth.currentUser) await signOut(auth);
			console.error("Could not recover the existing account profile:", error);
			const message = error.code === "permission-denied"
					? "Your account exists, but Firestore blocked profile creation. Check the registrations security rules."
					: "This email already has an account, but its profile could not be repaired. Sign in or contact support.";
			this.setMessage(message, "error");
		}
	}

	finishSuccessfully(message) {
		localStorage.removeItem(this.registrationDraftKey);
		this.form.reset();
		this.updateProgrammeRequirement();
		this.setMessage(message, "success");
		window.setTimeout(() => window.location.replace("login.html"), 2000);
	}

	errorMessage(error) {
		const messages = {
			"auth/invalid-email": "Please enter a valid email address.",
			"auth/weak-password": "Your password is too weak. Please use at least 6 characters.",
			"auth/network-request-failed": "Network error. Please check your internet connection.",
			"permission-denied": "Registration was created, but Firestore blocked the profile write."
		};
		return messages[error.code] || "Registration failed. Check your details and try again.";
	}
}

new RegistrationPage().init();