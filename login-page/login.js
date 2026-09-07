// Finds the login password eye button.
const passwordToggle = document.querySelector('[data-toggle-password]');

if (passwordToggle) {
	// Uses the button data attribute to locate its password input.
	const passwordInput = document.getElementById(passwordToggle.dataset.togglePassword);

	if (passwordInput) {
		// Shows or hides the password while keeping the entered value unchanged.
		passwordToggle.addEventListener('click', () => {
			const isVisible = passwordInput.type === 'text';

			passwordInput.type = isVisible ? 'password' : 'text';
			passwordToggle.setAttribute('aria-pressed', String(!isVisible));
			passwordToggle.setAttribute('aria-label', isVisible ? 'Show password' : 'Hide password');
		});
	}
}

// Validates the login controls before a future authentication service is called.
const loginForm = document.getElementById('loginPanel');
const message = document.getElementById('message');

if (loginForm && message) {
	loginForm.addEventListener('submit', (event) => {
		event.preventDefault();

		if (!loginForm.checkValidity()) {
			message.textContent = 'Enter a valid email address and password.';
			message.className = 'message error';
			loginForm.reportValidity();
			return;
		}

		message.textContent = 'Login details are ready to be verified.';
		message.className = 'message success';
	});
}
