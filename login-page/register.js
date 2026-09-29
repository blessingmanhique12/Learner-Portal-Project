// Firebase Authentication and Firestore
import {
    createUserWithEmailAndPassword,
    sendEmailVerification,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

import { auth, db } from "../FirebaseAuth/firebase.js";

// ------------------------------
// Password visibility
// ------------------------------

const passwordToggle = document.querySelector("[data-toggle-password]");

if (passwordToggle) {
    const passwordInput = document.getElementById(
        passwordToggle.dataset.togglePassword
    );

    if (passwordInput) {
        passwordToggle.addEventListener("click", () => {
            const isVisible = passwordInput.type === "text";

            passwordInput.type = isVisible ? "password" : "text";

            passwordToggle.setAttribute(
                "aria-pressed",
                String(!isVisible)
            );

            passwordToggle.setAttribute(
                "aria-label",
                isVisible ? "Show password" : "Hide password"
            );
        });
    }
}

// ------------------------------
// Registration form
// ------------------------------

const registerForm = document.getElementById("registerPanel");

if (registerForm) {
    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = document
            .getElementById("registerEmail")
            .value
            .trim();

        const username = document
            .getElementById("registerUsername")
            .value
            .trim();

        const phone = document
            .getElementById("registerPhone")
            .value
            .trim();

        const role = document
            .getElementById("registerRole")
            .value;

        const programme = document
            .getElementById("registerProgramme")
            .value
            .trim();

        const password = document
            .getElementById("registerPassword")
            .value;

        // ------------------------------
        // Basic validation
        // ------------------------------

        if (!email || !password || !role) {
            alert("Please complete all required fields.");
            return;
        }

        if (password.length < 6) {
            alert("Password must contain at least 6 characters.");
            return;
        }

        if (role === "learner" && !programme) {
            alert("Please enter your programme.");
            return;
        }

        try {
            // ------------------------------
            // Create Firebase Auth account
            // ------------------------------

            const userCredential =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            const user = userCredential.user;

            // ------------------------------
            // Set Firebase display name
            // ------------------------------

            await updateProfile(user, {
                displayName: username || email.split("@")[0]
            });

            // ------------------------------
            // Save profile in Firestore
            // ------------------------------

            await setDoc(doc(db, "registrations", user.uid), {
                uid: user.uid,
                email: user.email,
                username: username || email.split("@")[0],
                displayName: username || email.split("@")[0],
                phone: phone,
                role: role,
                programme: programme,
                createdAt: serverTimestamp()
            });

            // ------------------------------
            // Send Firebase email verification
            // ------------------------------

            await sendEmailVerification(user);

            alert(
                "Account created successfully. " +
                "A verification email has been sent to " +
                email +
                ". Please verify your email before logging in."
            );

            // Go back to login
            window.location.href = "login.html";

        } catch (error) {
            console.error("Registration failed:", error);

            const messageMap = {
                "auth/email-already-in-use":
                    "An account already exists with this email address.",

                "auth/invalid-email":
                    "Please enter a valid email address.",

                "auth/weak-password":
                    "Your password is too weak. Please use at least 6 characters.",

                "auth/network-request-failed":
                    "Network error. Please check your internet connection.",

                "permission-denied":
                    "Registration was created, but the profile could not be saved because Firestore permissions are blocking it."
            };

            alert(
                messageMap[error.code] ||
                `Registration failed: ${error.message}`
            );
        }
    });
}

// ------------------------------
// Automatically create username
// ------------------------------

const emailInput = document.getElementById("registerEmail");
const usernameInput = document.getElementById("registerUsername");

if (emailInput && usernameInput) {
    emailInput.addEventListener("input", () => {
        const email = emailInput.value.trim();

        if (email.includes("@")) {
            usernameInput.value = email.split("@")[0];
        } else {
            usernameInput.value = "";
        }
    });
}