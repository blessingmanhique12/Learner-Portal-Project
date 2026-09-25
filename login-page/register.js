// Finds the eye button that controls password visibility.
const passwordToggle = document.querySelector('[data-toggle-password]');

if (passwordToggle) {
	// Reads the target input ID from the button's data attribute.
	const passwordId = passwordToggle.dataset.togglePassword;
	const passwordInput = document.getElementById(passwordId);

	if (passwordInput) {
		// Changes the input type and accessible button state when clicked.
		passwordToggle.addEventListener('click', () => {
			// The text type means the password is currently visible.
			const isVisible = passwordInput.type === 'text';

			// Toggle masking while preserving the existing password value.
			passwordInput.type = isVisible ? 'password' : 'text';
			// Tell assistive technology which state the button is in.
			passwordToggle.setAttribute('aria-pressed', String(!isVisible));
			// Update the action name announced to screen-reader users.
			passwordToggle.setAttribute('aria-label', isVisible ? 'Show password' : 'Hide password');
		});
	}
}
