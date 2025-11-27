// DOM Elements
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const logoutBtn = document.getElementById('logout-btn');
const loginModal = document.getElementById('login-modal');
const registerModal = document.getElementById('register-modal');
const forgotPasswordModal = document.getElementById('forgot-password-modal');
const closeButtons = document.querySelectorAll('.close-modal');

// Form Elements
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const forgotPasswordForm = document.getElementById('forgot-password-form');

// Toggle Password Visibility
document.querySelectorAll('.toggle-password').forEach(icon => {
    icon.addEventListener('click', function() {
        const input = this.previousElementSibling;
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });
});

// Password Strength Indicator
const passwordInput = document.getElementById('register-password');
const strengthBar = document.querySelector('.strength-bar');
const strengthText = document.querySelector('.strength-text');

passwordInput.addEventListener('input', function() {
    const password = this.value;
    let strength = 0;
    let color = '#ef4444';

    // Check password strength
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]+/)) strength++;
    if (password.match(/[A-Z]+/)) strength++;
    if (password.match(/[0-9]+/)) strength++;
    if (password.match(/[^a-zA-Z0-9]+/)) strength++;

    // Update strength bar
    const width = (strength / 5) * 100;
    strengthBar.style.width = `${width}%`;

    // Update color and text
    if (strength <= 2) {
        color = '#ef4444';
        strengthText.textContent = 'Weak';
    } else if (strength <= 4) {
        color = '#f59e0b';
        strengthText.textContent = 'Medium';
    } else {
        color = '#10b981';
        strengthText.textContent = 'Strong';
    }

    strengthBar.style.backgroundColor = color;
});

// Show/Hide Modals
function showModal(modal) {
    modal.style.display = 'block';
    setTimeout(() => modal.classList.add('show'), 10);
}

function hideModal(modal) {
    console.log('Hiding modal');
    try {
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
    } catch (error) {
        console.error('Error hiding modal:', error);
    }
}

loginBtn.onclick = () => showModal(loginModal);
registerBtn.onclick = () => showModal(registerModal);

closeButtons.forEach(button => {
    button.onclick = () => {
        const modal = button.closest('.modal');
        hideModal(modal);
    }
});

// Switch between modals
document.querySelectorAll('.switch-to-register').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        hideModal(loginModal);
        showModal(registerModal);
    });
});

document.querySelectorAll('.switch-to-login').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        hideModal(registerModal);
        hideModal(forgotPasswordModal);
        showModal(loginModal);
    });
});

document.querySelectorAll('.forgot-password').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        hideModal(loginModal);
        showModal(forgotPasswordModal);
    });
});

// Handle Login
loginForm.onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const rememberMe = document.getElementById('remember-me').checked;

    try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            if (rememberMe) {
                localStorage.setItem('rememberedUser', JSON.stringify({ email }));
            }
            
            localStorage.setItem('currentUser', JSON.stringify(user));
            hideModal(loginModal);
            loginBtn.style.display = 'none';
            registerBtn.style.display = 'none';
            logoutBtn.style.display = 'block';
            
            showNotification('Login successful!', 'success');
        } else {
            showNotification('Invalid credentials!', 'error');
        }
    } catch (error) {
        showNotification('An error occurred. Please try again.', 'error');
    }
};

// Handle Register
registerForm.onsubmit = async (e) => {
    e.preventDefault();
    console.log('Registration form submitted');
    
    try {
        // Get form values
        const name = document.getElementById('register-name').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        const termsAgreement = document.getElementById('terms-agreement').checked;

        console.log('Form values:', { name, email, password, confirmPassword, termsAgreement });

        // Validation checks
        if (!name || !email || !password || !confirmPassword) {
            console.log('Validation failed: Empty fields');
            showNotification('Please fill in all fields', 'error');
            return;
        }

        if (!termsAgreement) {
            console.log('Validation failed: Terms not agreed');
            showNotification('Please agree to the Terms of Service and Privacy Policy', 'error');
            return;
        }

        if (password !== confirmPassword) {
            console.log('Validation failed: Passwords do not match');
            showNotification('Passwords do not match!', 'error');
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.log('Validation failed: Invalid email format');
            showNotification('Please enter a valid email address', 'error');
            return;
        }

        // Get existing users
        let users = [];
        try {
            const existingUsers = localStorage.getItem('users');
            console.log('Existing users from localStorage:', existingUsers);
            
            // Ensure users is always an array
            if (existingUsers) {
                try {
                    users = JSON.parse(existingUsers);
                    if (!Array.isArray(users)) {
                        console.log('Users data was not an array, initializing new array');
                        users = [];
                    }
                } catch (parseError) {
                    console.error('Error parsing users data:', parseError);
                    users = [];
                }
            }
        } catch (error) {
            console.error('Error reading users from localStorage:', error);
            users = [];
        }

        // Check for existing email
        if (users.some(u => u.email === email)) {
            console.log('Validation failed: Email already exists');
            showNotification('Email already registered!', 'error');
            return;
        }

        // Create new user
        const newUser = {
            id: Date.now(),
            name,
            email,
            password,
            createdAt: new Date().toISOString()
        };

        console.log('Creating new user:', newUser);

        // Add to users array
        users.push(newUser);
        
        // Save to localStorage
        try {
            localStorage.setItem('users', JSON.stringify(users));
            localStorage.setItem('currentUser', JSON.stringify(newUser));
            console.log('User data saved to localStorage');
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            showNotification('Error saving user data. Please try again.', 'error');
            return;
        }

        // Update UI
        const loginBtn = document.getElementById('login-btn');
        const registerBtn = document.getElementById('register-btn');
        const logoutBtn = document.getElementById('logout-btn');

        if (loginBtn && registerBtn && logoutBtn) {
            loginBtn.style.display = 'none';
            registerBtn.style.display = 'none';
            logoutBtn.style.display = 'block';
            console.log('UI updated successfully');
        } else {
            console.error('Could not find all required buttons');
        }

        // Show success message and close modal
        showNotification('Registration successful!', 'success');
        hideModal(registerModal);
        
        // Show welcome modal
        showWelcomeModal(email);

        // Clear form
        registerForm.reset();
        console.log('Registration completed successfully');

    } catch (error) {
        console.error('Registration error:', error);
        showNotification('An error occurred during registration. Please try again.', 'error');
    }
};

// Handle Forgot Password
forgotPasswordForm.onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('reset-email').value;

    try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.email === email);

        if (user) {
            // In a real application, you would send a password reset email here
            showNotification('Password reset instructions sent to your email', 'success');
            hideModal(forgotPasswordModal);
        } else {
            showNotification('Email not found!', 'error');
        }
    } catch (error) {
        showNotification('An error occurred. Please try again.', 'error');
    }
};

// Update the logout functionality
function handleLogout() {
    try {
        // Remove current user from localStorage
        localStorage.removeItem('currentUser');
        
        // Update UI for both navbar and sidebar buttons
        const navbarLoginBtn = document.getElementById('login-btn');
        const navbarRegisterBtn = document.getElementById('register-btn');
        const navbarLogoutBtn = document.getElementById('logout-btn');
        const sidebarLogoutBtn = document.querySelector('.logout-btn');
        
        if (navbarLoginBtn && navbarRegisterBtn && navbarLogoutBtn) {
            navbarLoginBtn.style.display = 'block';
            navbarRegisterBtn.style.display = 'block';
            navbarLogoutBtn.style.display = 'none';
        }
        
        if (sidebarLogoutBtn) {
            sidebarLogoutBtn.style.display = 'none';
        }
        
        // Show success message
        showNotification('Logged out successfully!', 'success');
        
        // Redirect to home or refresh the page
        window.location.reload();
        
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('Error during logout. Please try again.', 'error');
    }
}

// Add event listeners for both logout buttons
document.addEventListener('DOMContentLoaded', function() {
    // Navbar logout button
    const navbarLogoutBtn = document.getElementById('logout-btn');
    if (navbarLogoutBtn) {
        navbarLogoutBtn.addEventListener('click', handleLogout);
    }
    
    // Sidebar logout button
    const sidebarLogoutBtn = document.querySelector('.logout-btn');
    if (sidebarLogoutBtn) {
        sidebarLogoutBtn.addEventListener('click', handleLogout);
    }
    
    // Check initial auth state
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        // Hide login/register buttons and show logout buttons
        const navbarLoginBtn = document.getElementById('login-btn');
        const navbarRegisterBtn = document.getElementById('register-btn');
        const navbarLogoutBtn = document.getElementById('logout-btn');
        const sidebarLogoutBtn = document.querySelector('.logout-btn');
        
        if (navbarLoginBtn && navbarRegisterBtn && navbarLogoutBtn) {
            navbarLoginBtn.style.display = 'none';
            navbarRegisterBtn.style.display = 'none';
            navbarLogoutBtn.style.display = 'block';
        }
        
        if (sidebarLogoutBtn) {
            sidebarLogoutBtn.style.display = 'block';
        }
    } else {
        // Show login/register buttons and hide logout buttons
        const navbarLoginBtn = document.getElementById('login-btn');
        const navbarRegisterBtn = document.getElementById('register-btn');
        const navbarLogoutBtn = document.getElementById('logout-btn');
        const sidebarLogoutBtn = document.querySelector('.logout-btn');
        
        if (navbarLoginBtn && navbarRegisterBtn && navbarLogoutBtn) {
            navbarLoginBtn.style.display = 'block';
            navbarRegisterBtn.style.display = 'block';
            navbarLogoutBtn.style.display = 'none';
        }
        
        if (sidebarLogoutBtn) {
            sidebarLogoutBtn.style.display = 'none';
        }
    }
});

// Check remembered user
const rememberedUser = localStorage.getItem('rememberedUser');
if (rememberedUser) {
    const { email } = JSON.parse(rememberedUser);
    document.getElementById('login-email').value = email;
    document.getElementById('remember-me').checked = true;
}

// Notification System
function showNotification(message, type = 'info') {
    console.log('Showing notification:', { message, type });
    
    try {
        // Remove any existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        // Create new notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        let icon = 'fa-info-circle';
        if (type === 'success') icon = 'fa-check-circle';
        if (type === 'error') icon = 'fa-exclamation-circle';

        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${icon}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Show notification
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });
        
        // Hide and remove notification
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    } catch (error) {
        console.error('Error showing notification:', error);
    }
}

// Social Login Handlers
document.querySelectorAll('.social-btn.google').forEach(btn => {
    btn.addEventListener('click', () => {
        showNotification('Google login coming soon!', 'info');
    });
});

document.querySelectorAll('.social-btn.facebook').forEach(btn => {
    btn.addEventListener('click', () => {
        showNotification('Facebook login coming soon!', 'info');
    });
});

// Add this function to show the welcome modal
function showWelcomeModal(email) {
    const welcomeModal = document.getElementById('welcome-modal');
    const userEmailElement = welcomeModal.querySelector('.user-email');
    
    // Set the user's email
    userEmailElement.textContent = email;
    
    // Show the modal
    welcomeModal.style.display = 'block';
    setTimeout(() => {
        welcomeModal.classList.add('show');
    }, 10);

    // Add click handler for the start shopping button
    const startShoppingBtn = welcomeModal.querySelector('.start-shopping-btn');
    startShoppingBtn.onclick = () => {
        hideModal(welcomeModal);
    };
} 