// Finds the password eye button used for the new password field.
const passwordToggle = document.querySelector('[data-toggle-password]');

if (passwordToggle) {
	// Locates the input connected to the button through its data attribute.
	const passwordInput = document.getElementById(passwordToggle.dataset.togglePassword);

	if (passwordInput) {
		// Toggles password masking without changing the entered value.
		passwordToggle.addEventListener('click', () => {
			// Checks whether the password is currently displayed as plain text.
			const isVisible = passwordInput.type === 'text';

			// Switches between masked and visible password input types.
			passwordInput.type = isVisible ? 'password' : 'text';
			// Keeps the button state available to assistive technology.
			passwordToggle.setAttribute('aria-pressed', String(!isVisible));
			// Announces the next action through the button label.
			passwordToggle.setAttribute('aria-label', isVisible ? 'Show password' : 'Hide password');
		});
	}
}

// Provides local validation feedback before a password service is connected.
const resetForm = document.getElementById('resetPanel');
const resetMessage = document.getElementById('resetMessage');
const sendResetOtp = document.getElementById('sendResetOtp');

if (sendResetOtp && resetMessage) {
	// Confirms that an email or phone contact is available for the OTP request.
	sendResetOtp.addEventListener('click', () => {
		// Reads both possible recovery contacts before requesting an OTP.
		const email = document.getElementById('resetEmail');
		const phone = document.getElementById('resetPhone');

		if (!email.value.trim() && !phone.value.trim()) {
			// Stops the request when no delivery contact has been entered.
			resetMessage.textContent = 'Enter an email or phone number first.';
			resetMessage.className = 'message error';
			return;
		}

		resetMessage.textContent = 'OTP request is ready to be sent.';
		// Confirms that the contact check passed locally.
		resetMessage.className = 'message success';
	});
}

if (resetForm && resetMessage) {
	resetForm.addEventListener('submit', (event) => {
		// Prevents a reload until a real password reset service is connected.
		event.preventDefault();

		if (!resetForm.checkValidity()) {
			// Reports missing or invalid required fields to the user.
			resetMessage.textContent = 'Complete the required fields before resetting your password.';
			resetMessage.className = 'message error';
			resetForm.reportValidity();
			return;
		}

		resetMessage.textContent = 'Password reset details are ready to be verified.';
		// Confirms that the local form checks passed.
		resetMessage.className = 'message success';
	});
}
