// =================== LOGIN HANDLING ===================

function showMessage(message, isError = false) {
    const loginMessage = document.getElementById('loginMessage');
    if (loginMessage) {
        const messageClass = isError ? 'error' : (message.includes('...') ? 'loading' : 'success');
        loginMessage.innerHTML = `<div class="message ${messageClass}">${message}</div>`;
    }
}

function clearMessages() {
    const loginMessage = document.getElementById('loginMessage');
    if (loginMessage) loginMessage.innerHTML = '';
}

async function handleLogin(event) {
    event.preventDefault();
    clearMessages();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showMessage('Please complete all fields', true);
        return;
    }

    showMessage('Verifying credentials...');

    try {
        // Check if database-simulator.js is loaded
        if (typeof window.loginUser !== 'function') {
            showMessage('System not available. Please reload the page.', true);
            return;
        }

        // Use function from database-simulator.js
        const result = window.loginUser(email, password);

        if (result && result.success) {
            const user = result.user;
            showMessage(`Welcome ${user.name}!`);
            
            // Save complete user session
            sessionStorage.setItem('agrotec_user', JSON.stringify(user));
            sessionStorage.setItem('agrotec_login_time', new Date().toISOString());
            
            // MODIFIED REDIRECTION FOR CUSTOMERS
            setTimeout(() => {
                if (user.type === 'FARMER') {
                    // Redirect to farmer-specific dashboard
                    window.location.href = 'farmerindex.html';
                } else if (user.type === 'CUSTOMER') {
                    // MAIN CHANGE: Customers go to home with profile
                    window.location.href = 'index.html?logged=true';
                } else {
                    // By default, go to database (for administrators)
                    window.location.href = 'database-simulator.html';
                }
            }, 1500);
            
        } else {
            showMessage(result?.error || 'Incorrect credentials', true);
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage('Connection error. Please try again.', true);
    }
}

// =================== SESSION VERIFICATION ===================
function checkExistingSession() {
    const existingUser = sessionStorage.getItem('agrotec_user');
    const loginTime = sessionStorage.getItem('agrotec_login_time');
    
    if (existingUser && loginTime) {
        try {
            const user = JSON.parse(existingUser);
            const loginDate = new Date(loginTime);
            const now = new Date();
            const hoursDiff = (now - loginDate) / (1000 * 60 * 60);
            
            // Session valid for 24 hours
            if (hoursDiff < 24) {
                console.log('Active session found:', user.name);
                showMessage(`Active session: ${user.name}. Redirecting...`);
                
                // MODIFIED REDIRECTION HERE TOO
                setTimeout(() => {
                    if (user.type === 'FARMER') {
                        window.location.href = 'farmerindex.html';
                    } else if (user.type === 'CUSTOMER') {
                        // Customers go to home with profile
                        window.location.href = 'index.html?logged=true';
                    } else {
                        window.location.href = 'database-simulator.html';
                    }
                }, 2000);
                
                return true;
            } else {
                // Clean expired session
                sessionStorage.removeItem('agrotec_user');
                sessionStorage.removeItem('agrotec_login_time');
            }
        } catch (error) {
            console.error('Error verifying session:', error);
            sessionStorage.removeItem('agrotec_user');
            sessionStorage.removeItem('agrotec_login_time');
        }
    }
    
    return false;
}

// =================== PASSWORD TOGGLE FUNCTION ===================
function setupPasswordToggle() {
    // Find all password fields
    const passwordFields = document.querySelectorAll('input[type="password"]');
    
    passwordFields.forEach(passwordField => {
        // Create container for icon
        const fieldContainer = passwordField.parentElement;
        fieldContainer.style.position = 'relative';
        
        // Create show/hide icon
        const toggleIcon = document.createElement('span');
        toggleIcon.innerHTML = '<i class="fas fa-eye"></i>';
        toggleIcon.className = 'password-toggle-icon';
        toggleIcon.style.cssText = `
            position: absolute;
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
            cursor: pointer;
            color: #a0aec0;
            font-size: 18px;
            z-index: 10;
            user-select: none;
            transition: color 0.3s ease;
        `;
        
        // Add hover effect
        toggleIcon.addEventListener('mouseenter', () => {
            toggleIcon.style.color = '#4CAF50';
        });
        
        toggleIcon.addEventListener('mouseleave', () => {
            toggleIcon.style.color = '#a0aec0';
        });
        
        // Function to toggle visibility
        toggleIcon.addEventListener('click', () => {
            const isPassword = passwordField.type === 'password';
            
            if (isPassword) {
                passwordField.type = 'text';
                toggleIcon.innerHTML = '<i class="fas fa-eye-slash"></i>';
                toggleIcon.title = 'Hide password';
            } else {
                passwordField.type = 'password';
                toggleIcon.innerHTML = '<i class="fas fa-eye"></i>';
                toggleIcon.title = 'Show password';
            }
        });
        
        // Add icon to container
        fieldContainer.appendChild(toggleIcon);
        
        // Adjust input padding so it doesn't overlap with icon
        passwordField.style.paddingRight = '60px';
    });
    
    console.log('✅ Show/hide password icons configured');
}

// =================== LOGOUT FUNCTION ===================
function logout() {
    sessionStorage.removeItem('agrotec_user');
    sessionStorage.removeItem('agrotec_login_time');
    console.log('Session closed');
    window.location.href = 'login.html';
}

// Make available globally
window.logout = logout;

// =================== INITIALIZATION ===================
function initializeLogin() {
    console.log('Initializing login page...');
    
    // Check existing session first
    if (checkExistingSession()) {
        return; // Don't continue if there's an active session
    }
    
    // Check connection with database-simulator.js
    setTimeout(() => {
        if (typeof window.loginUser === 'function') {
            console.log('✅ Database connection established');
        } else {
            console.error('❌ Error: database-simulator.js not loaded');
            showMessage('System error. Please reload the page.', true);
        }
    }, 500);
    
    // Configure form
    const loginForm = document.getElementById('loginFormData');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
        console.log('✅ Login form configured');
    } else {
        console.error('❌ Login form not found');
    }
    
    // Configure show/hide password icons
    setTimeout(() => {
        setupPasswordToggle();
    }, 100); // Small delay to ensure DOM is ready
    
    // Check if parameters come from URL (from successful registration)
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    const message = urlParams.get('message');
    
    if (email) {
        const emailInput = document.getElementById('loginEmail');
        if (emailInput) emailInput.value = email;
    }
    
    if (message === 'registered') {
        showMessage('Account created successfully. You can now sign in.');
    }
    
    console.log('✅ Login page initialized');
}

// =================== DEBUG FUNCTIONS ===================
window.loginDebug = {
    testLogin: () => {
        const testCredentials = {
            email: 'test@customer.com',
            password: '123456'
        };
        
        console.log('Testing login with:', testCredentials);
        return window.loginUser(testCredentials.email, testCredentials.password);
    },
    
    checkConnection: () => {
        console.log('System status:');
        console.log('- loginUser available:', typeof window.loginUser === 'function');
        console.log('- Form found:', !!document.getElementById('loginFormData'));
        
        if (typeof window.databaseDebug === 'object') {
            const data = window.databaseDebug.showData();
            console.log('- Total users:', data.users.length);
            console.log('- Last user:', data.users[data.users.length - 1]);
        }
    },
    
    getCurrentSession: () => {
        const user = sessionStorage.getItem('agrotec_user');
        const loginTime = sessionStorage.getItem('agrotec_login_time');
        
        if (user && loginTime) {
            console.log('Current user:', JSON.parse(user));
            console.log('Login time:', new Date(loginTime));
        } else {
            console.log('No active session');
        }
    },
    
    clearSession: () => {
        logout();
        console.log('Session cleared');
    }
};

// =================== INITIALIZATION ON LOAD ===================
document.addEventListener('DOMContentLoaded', initializeLogin);

if (document.readyState === 'loading') {
    console.log('Waiting for DOM to load...');
} else {
    console.log('DOM already loaded, initializing...');
    initializeLogin();
}
