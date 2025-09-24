// =================== CONFIGURATION ===================
let currentUserType = 'farmer';

// =================== INTERFACE FUNCTIONS ===================
function setUserType(type) {
    console.log(`Changing user type to: ${type}`);
    currentUserType = type;
    
    const userTypeInput = document.getElementById('userType');
    if (userTypeInput) {
        userTypeInput.value = type;
    }

    const customerBtn = document.querySelector('.user-type-btn:first-child');
    const farmerBtn = document.querySelector('.user-type-btn:last-child');
    
    // Get images
    const farmerImg = document.querySelector('.farmer-bg');
    const customerImg = document.querySelector('.customer-bg');
    const imageSection = document.querySelector('.image-section');

    if (type === 'customer') {
        // Update buttons
        if (customerBtn) customerBtn.classList.add('active');
        if (farmerBtn) farmerBtn.classList.remove('active');
        
        // Update form fields
        const customerFields = document.getElementById('customerFields');
        const farmerFields = document.getElementById('farmerFields');
        const registerBtn = document.getElementById('registerBtn');
        const emailInput = document.getElementById('email');
        
        if (customerFields) customerFields.classList.remove('hidden');
        if (farmerFields) farmerFields.classList.add('hidden');
        if (registerBtn) registerBtn.textContent = 'Create personal account';
        if (emailInput) emailInput.placeholder = 'Personal E-mail';
        
        // Change image to customer
        if (farmerImg && customerImg && imageSection) {
            imageSection.classList.add('transitioning');
            imageSection.classList.add('customer-mode');
            
            // Change images
            farmerImg.classList.remove('active');
            customerImg.classList.add('active');
            
            // Remove transition class after animation
            setTimeout(() => {
                imageSection.classList.remove('transitioning');
            }, 800);
        }
        
    } else if (type === 'farmer') {
        // Update buttons
        if (customerBtn) customerBtn.classList.remove('active');
        if (farmerBtn) farmerBtn.classList.add('active');
        
        // Update form fields
        const customerFields = document.getElementById('customerFields');
        const farmerFields = document.getElementById('farmerFields');
        const registerBtn = document.getElementById('registerBtn');
        const emailInput = document.getElementById('email');
        
        if (customerFields) customerFields.classList.add('hidden');
        if (farmerFields) farmerFields.classList.remove('hidden');
        if (registerBtn) registerBtn.textContent = 'Create farmer account';
        if (emailInput) emailInput.placeholder = 'Business E-mail';
        
        // Change image to farmer (default image)
        if (farmerImg && customerImg && imageSection) {
            imageSection.classList.add('transitioning');
            imageSection.classList.remove('customer-mode');
            
            // Change images
            customerImg.classList.remove('active');
            farmerImg.classList.add('active');
            
            // Remove transition class after animation
            setTimeout(() => {
                imageSection.classList.remove('transitioning');
            }, 800);
        }
    }
    
    console.log(`Interface updated for type: ${type}`);
}

// =================== SETUP EVENT LISTENERS FOR BUTTONS ===================
function setupUserTypeButtons() {
    const customerBtn = document.querySelector('.user-type-btn:first-child');
    const farmerBtn = document.querySelector('.user-type-btn:last-child');
    
    if (customerBtn) {
        customerBtn.addEventListener('click', () => setUserType('customer'));
    }
    
    if (farmerBtn) {
        farmerBtn.addEventListener('click', () => setUserType('farmer'));
    }
    
    console.log('✅ Event listeners for user type buttons configured');
}

// =================== PASSWORD TOGGLE FUNCTION ===================
function setupPasswordToggle() {
    // Find all password fields
    const passwordFields = document.querySelectorAll('input[type="password"]');
    
    // IDs of fields that you DON'T want to have the eye icon (empty array means all fields get the icon)
    const excludedFields = []; // Removed 'password' and 'confirmPassword' to enable toggle on all fields
    
    passwordFields.forEach(passwordField => {
        // Skip if field is in excluded list
        if (excludedFields.includes(passwordField.id)) {
            console.log(`Skipping icon for field: ${passwordField.id}`);
            return;
        }
        
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

function clearMessages() {
    const registerMessage = document.getElementById('registerMessage');
    const successMessage = document.getElementById('successMessage');
    
    if (registerMessage) registerMessage.innerHTML = '';
    if (successMessage) {
        successMessage.innerHTML = '';
        successMessage.style.display = 'none';
    }
}

function showMessage(message, isError = false) {
    const registerMessage = document.getElementById('registerMessage');
    if (registerMessage) {
        const messageClass = isError ? 'error' : (message.includes('...') ? 'loading' : 'success');
        registerMessage.innerHTML = `<div class="message ${messageClass}">${message}</div>`;
    }
}

function showSuccessRedirect(message, email) {
    const successMessage = document.getElementById('successMessage');
    if (successMessage) {
        successMessage.innerHTML = `
            <div class="success-redirect">
                <i class="fas fa-check-circle" style="font-size: 48px; margin-bottom: 15px;"></i>
                <h3>${message}</h3>
                <p>We'll redirect you to login in <span id="countdown">5</span> seconds...</p>
                <p>Or you can <a href="login.html" style="color: #fff; text-decoration: underline;">click here</a> to go now</p>
            </div>
        `;
        successMessage.style.display = 'block';
        
        // Countdown and automatic redirection
        let countdown = 5;
        const countdownElement = document.getElementById('countdown');
        
        const interval = setInterval(() => {
            countdown--;
            if (countdownElement) countdownElement.textContent = countdown;
            
            if (countdown <= 0) {
                clearInterval(interval);
                window.location.href = `login.html?email=${encodeURIComponent(email)}&message=registered`;
            }
        }, 1000);
    }
}

// =================== FORM HANDLING (ACTUALIZADO PARA FIREBASE) ===================
async function handleRegistration(event) {
    event.preventDefault();
    clearMessages();
    
    console.log('Starting registration process...');
    
    // Check if database-simulator.js is loaded
    if (typeof window.registerUser !== 'function') {
        showMessage('Database system not available. Please reload the page.', true);
        return;
    }
    
    // Get form values
    const userType = document.getElementById('userType').value;
    const name = document.getElementById('name').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    console.log(`Registering ${userType}:`, { name, lastName, email });

    // Basic validations
    if (!name || !lastName || !email || !password) {
        showMessage('Please complete all required fields', true);
        return;
    }

    if (password.length < 6) {
        showMessage('Password must be at least 6 characters long', true);
        return;
    }

    // Prepare user data
    const userData = {
        name: name,
        lastName: lastName,
        email: email,
        password: password,
        userType: userType
    };

    // Add specific fields by user type
    if (userType === 'customer') {
        const confirmPassword = document.getElementById('confirmPassword').value;
        const phone = document.getElementById('phone').value.trim();

        if (password !== confirmPassword) {
            showMessage('Passwords do not match', true);
            return;
        }

        if (!phone) {
            showMessage('Phone number is required for customers', true);
            return;
        }

        userData.phone = phone;

    } else if (userType === 'farmer') {
        const location = document.getElementById('location').value.trim();
        const farmerPhone = document.getElementById('farmerPhone').value.trim();
        const businessName = document.getElementById('businessName').value.trim();

        // Save farmer's phone with correct name
        userData.location = location;
        userData.phone = farmerPhone; // Change from farmerPhone to phone to match DB
        userData.businessName = businessName;
        
        // Debug to verify farmer data
        console.log('Farmer specific data:', {
            location: location,
            phone: farmerPhone,
            businessName: businessName
        });
    }

    console.log('Final data to register:', userData);
    showMessage('Creating account...');

    try {
        // CAMBIO PRINCIPAL: Usar await para esperar la función async
        const result = await window.registerUser(userData);
        
        console.log('Registration result:', result);

        if (result && result.success) {
            console.log('Registration successful!');
            
            // Hide ONLY the form and show success
            const registerForm = document.getElementById('registerFormData');
            if (registerForm) registerForm.style.display = 'none';
            
            showSuccessRedirect(
                `${userType} account created successfully!`,
                email
            );
            
        } else {
            console.error('Registration error:', result?.error);
            showMessage(result?.error || 'Error creating account', true);
        }
        
    } catch (error) {
        console.error('Registration error:', error);
        showMessage('Internal error. Please try again: ' + error.message, true);
    }
}

// =================== VALIDATIONS ===================
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePhone(phone) {
    const phoneRegex = /^\d{4}-\d{4}$/;
    return phoneRegex.test(phone);
}

// =================== INITIALIZATION ===================
async function initializeRegistration() {
    console.log('Initializing registration page...');
    
    // Check connection with database-simulator.js with retry
    let retryCount = 0;
    const maxRetries = 10;
    
    const checkDatabaseConnection = () => {
        return new Promise((resolve, reject) => {
            const check = () => {
                if (typeof window.registerUser === 'function') {
                    console.log('✅ Database connection established');
                    resolve(true);
                } else if (retryCount < maxRetries) {
                    retryCount++;
                    console.log(`Checking database connection... attempt ${retryCount}/${maxRetries}`);
                    setTimeout(check, 500);
                } else {
                    console.error('❌ Error: database-simulator.js not loaded after retries');
                    reject(new Error('Database system not available'));
                }
            };
            check();
        });
    };
    
    try {
        await checkDatabaseConnection();
    } catch (error) {
        showMessage('System error. Please reload the page.', true);
        return;
    }
    
    // Configure form
    const registerForm = document.getElementById('registerFormData');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegistration);
        console.log('✅ Registration form configured');
    } else {
        console.error('❌ Registration form not found');
    }
    
    // Configure user type buttons
    setupUserTypeButtons();
    
    // Configure show/hide password icons
    setTimeout(() => {
        setupPasswordToggle();
    }, 100); // Small delay to ensure DOM is ready
    
    // Set default user type
    setUserType('farmer');
    
    console.log('✅ Registration page initialized');
}

// =================== DEBUG FUNCTIONS (ACTUALIZADAS) ===================
window.registerDebug = {
    testRegistration: async () => {
        const testData = {
            name: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            password: '123456',
            userType: 'farmer',
            location: 'Test Location',
            phone: '6000-1234',
            businessName: 'Test Business'
        };
        
        console.log('Testing registration with:', testData);
        try {
            const result = await window.registerUser(testData);
            console.log('Test registration result:', result);
            return result;
        } catch (error) {
            console.error('Test registration error:', error);
            return { success: false, error: error.message };
        }
    },
    
    checkConnection: () => {
        console.log('System status:');
        console.log('- registerUser available:', typeof window.registerUser === 'function');
        console.log('- currentUserType:', currentUserType);
        console.log('- Form found:', !!document.getElementById('registerFormData'));
        
        const farmerImg = document.querySelector('.farmer-bg');
        const customerImg = document.querySelector('.customer-bg');
        console.log('- Farmer image found:', !!farmerImg);
        console.log('- Customer image found:', !!customerImg);
        console.log('- Farmer image active:', farmerImg?.classList.contains('active'));
        console.log('- Customer image active:', customerImg?.classList.contains('active'));
        
        if (typeof window.databaseDebug === 'object') {
            console.log('- Current data:', window.databaseDebug.showData());
        }
        
        // Check Firebase status
        if (typeof firebase !== 'undefined') {
            console.log('- Firebase loaded:', true);
        } else {
            console.log('- Firebase loaded:', false, '(using localStorage fallback)');
        }
    },
    
    fillTestData: () => {
        document.getElementById('name').value = 'Test';
        document.getElementById('lastName').value = 'Farmer';
        document.getElementById('email').value = 'test@farmer.com';
        document.getElementById('password').value = '123456';
        document.getElementById('location').value = 'Test City';
        document.getElementById('farmerPhone').value = '6000-1234';
        document.getElementById('businessName').value = 'Test Farm';
        
        console.log('Test data filled');
    },
    
    testImageSwitch: () => {
        console.log('Testing image switching...');
        console.log('Switching to customer...');
        setUserType('customer');
        
        setTimeout(() => {
            console.log('Switching to farmer...');
            setUserType('farmer');
        }, 2000);
    }
};

// =================== INITIALIZATION ON LOAD ===================
document.addEventListener('DOMContentLoaded', initializeRegistration);

if (document.readyState === 'loading') {
    console.log('Waiting for DOM to load...');
} else {
    console.log('DOM already loaded, initializing...');
    initializeRegistration();
}
