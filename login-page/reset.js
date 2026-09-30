import {
    confirmPasswordReset,
    sendPasswordResetEmail,
    verifyPasswordResetCode
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { auth } from "../FirebaseAuth/firebase.js";

class PasswordResetPage {
    constructor() {
        this.form = document.getElementById("resetPanel");
        this.emailInput = document.getElementById("resetEmail");
        this.newPasswordInput = document.getElementById("newPassword");
        this.newPasswordField = document.getElementById("newPasswordField");
        this.newPasswordLabel = document.getElementById("newPasswordLabel");
        this.message = document.getElementById("resetMessage");
        this.messageText = document.getElementById("resetMessageText");
        this.loader = document.getElementById("resetLoader");
        this.submitButton = document.getElementById("resetButton");
        this.resetCode = null;
    }

    init() {
        this.form?.addEventListener("submit", (event) => this.handleSubmit(event));
        this.bindPasswordToggle();
        this.loadResetAction();
    }

    bindPasswordToggle() {
        const toggle = document.querySelector('[data-toggle-password="newPassword"]');
        if (!toggle) return;

        toggle.addEventListener("click", () => {
            const visible = this.newPasswordInput.type === "text";
            this.newPasswordInput.type = visible ? "password" : "text";
            toggle.setAttribute("aria-pressed", String(!visible));
            toggle.setAttribute("aria-label", visible ? "Show password" : "Hide password");
        });
    }

    async loadResetAction() {
        const params = new URLSearchParams(window.location.search);
        if (params.get("mode") !== "resetPassword" || !params.has("oobCode")) return;

        this.setMessage("Checking password reset link...", "loading");
        try {
            this.resetCode = params.get("oobCode");
            const email = await verifyPasswordResetCode(auth, this.resetCode);
            this.emailInput.value = email;
            this.emailInput.readOnly = true;
            this.newPasswordLabel.hidden = false;
            this.newPasswordField.hidden = false;
            this.newPasswordInput.required = true;
            this.submitButton.textContent = "Update password";
            this.setMessage("Choose a new password for your account.", "success");
        } catch (error) {
            console.error("Password reset link validation failed:", error);
            this.resetCode = null;
            this.emailInput.readOnly = false;
            this.newPasswordInput.required = false;
            this.setMessage("This password reset link is invalid or expired. Request a new link.", "error");
        }
    }

    setMessage(text, type = "") {
        this.messageText.textContent = text;
        this.message.className = type ? `message ${type}` : "message";
        this.message.setAttribute("aria-busy", String(type === "loading"));
        this.loader.hidden = type !== "loading";
    }

    async handleSubmit(event) {
        event.preventDefault();
        if (!this.form.reportValidity()) return;

        this.submitButton.disabled = true;
        this.setMessage(this.resetCode ? "Updating your password..." : "Sending password reset link...", "loading");
        try {
            if (this.resetCode) {
                await confirmPasswordReset(auth, this.resetCode, this.newPasswordInput.value);
                this.setMessage("Your password has been updated. Returning to login...", "success");
                window.setTimeout(() => window.location.replace("login.html"), 1800);
                return;
            }

            await sendPasswordResetEmail(auth, this.emailInput.value.trim());
            this.form.reset();
            this.setMessage(
                "If an account exists for that email, a password reset link has been sent. Check your inbox and spam folder.",
                "success"
            );
        } catch (error) {
            console.error("Password reset request failed:", error);
            const message = this.resetCode
                ? error.code === "auth/weak-password"
                    ? "Choose a password with at least 6 characters."
                    : "Could not update your password. The reset link may have expired; request a new one."
                : error.code === "auth/invalid-email"
                    ? "Enter a valid email address."
                    : error.code === "auth/too-many-requests"
                        ? "Too many requests. Wait a moment and try again."
                        : "Could not send the reset email. Check your connection and try again.";
            this.setMessage(message, "error");
        } finally {
            this.submitButton.disabled = false;
        }
    }
}

new PasswordResetPage().init();
