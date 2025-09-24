// =================== LOGIN HANDLING WITH FIREBASE ===================

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

// Check Firebase connection status
function checkFirebaseConnection() {
    return new Promise((resolve) => {
        // Wait for database-simulator.js to initialize Firebase
        const checkInterval = setInterval(() => {
            if (typeof window.loginUser === 'function' && typeof isFirebaseEnabled !== 'undefined') {
                clearInterval(checkInterval);
                resolve({
                    available: true,
                    firebaseEnabled: isFirebaseEnabled,
                    status: isFirebaseEnabled ? 'Firebase conectado' : 'Modo local (localStorage)'
                });
            }
        }, 100);

        // Timeout after 5 seconds
        setTimeout(() => {
            clearInterval(checkInterval);
            resolve({
                available: false,
                firebaseEnabled: false,
                status: 'Error de conexión'
            });
        }, 5000);
    });
}

async function handleLogin(event) {
    event.preventDefault();
    clearMessages();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showMessage('Por favor completa todos los campos', true);
        return;
    }

    if (!isValidEmail(email)) {
        showMessage('Por favor ingresa un email válido', true);
        return;
    }

    showMessage('Verificando conexión con la base de datos...');

    try {
        // Check Firebase connection first
        const connectionStatus = await checkFirebaseConnection();
        
        if (!connectionStatus.available) {
            showMessage('Error: Sistema no disponible. Por favor recarga la página.', true);
            return;
        }

        showMessage(`Conectado a: ${connectionStatus.status}. Verificando credenciales...`);

        // Wait a moment for user to see the connection status
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Use function from database-simulator.js
        const result = await window.loginUser(email, password);

        if (result && result.success) {
            const user = result.user;
            showMessage(`¡Bienvenido ${user.name}! Iniciando sesión...`);
            
            // Save complete user session with additional metadata
            const sessionData = {
                ...user,
                loginTime: new Date().toISOString(),
                loginMethod: connectionStatus.firebaseEnabled ? 'firebase' : 'localStorage',
                sessionId: generateSessionId()
            };
            
            sessionStorage.setItem('agrotec_user', JSON.stringify(sessionData));
            sessionStorage.setItem('agrotec_login_time', new Date().toISOString());
            sessionStorage.setItem('agrotec_session_id', sessionData.sessionId);
            
            // Log successful login for debugging
            console.log('Login exitoso:', {
                user: user.name + ' ' + user.lastName,
                type: user.type,
                method: sessionData.loginMethod,
                timestamp: sessionData.loginTime
            });
            
            // REDIRECTION BASED ON USER TYPE
            setTimeout(() => {
                if (user.type === 'FARMER') {
                    // Redirect to farmer-specific dashboard
                    window.location.href = 'farmerindex.html';
                } else if (user.type === 'CUSTOMER') {
                    // Customers go to home with profile
                    window.location.href = 'index.html?logged=true';
                } else {
                    // By default, go to database (for administrators)
                    window.location.href = 'database-simulator.html';
                }
            }, 1500);
            
        } else {
            const errorMessage = result?.error || 'Credenciales incorrectas';
            showMessage(errorMessage, true);
            
            // Log failed login attempt for debugging
            console.log('Login fallido:', {
                email: email,
                error: errorMessage,
                timestamp: new Date().toISOString()
            });
        }
    } catch (error) {
        console.error('Error en login:', error);
        showMessage('Error de conexión. Por favor intenta nuevamente.', true);
    }
}

// Generate unique session ID
function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Enhanced email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// =================== SESSION VERIFICATION WITH FIREBASE ===================
async function checkExistingSession() {
    const existingUser = sessionStorage.getItem('agrotec_user');
    const loginTime = sessionStorage.getItem('agrotec_login_time');
    const sessionId = sessionStorage.getItem('agrotec_session_id');
    
    if (existingUser && loginTime) {
        try {
            const user = JSON.parse(existingUser);
            const loginDate = new Date(loginTime);
            const now = new Date();
            const hoursDiff = (now - loginDate) / (1000 * 60 * 60);
            
            // Session valid for 24 hours
            if (hoursDiff < 24) {
                console.log('Sesión activa encontrada:', {
                    user: user.name,
                    type: user.type,
                    loginMethod: user.loginMethod || 'unknown',
                    sessionId: sessionId,
                    hoursActive: Math.round(hoursDiff * 100) / 100
                });
                
                // Verify user still exists in database
                showMessage(`Verificando sesión activa de ${user.name}...`);
                
                try {
                    // Check if database is available
                    const connectionStatus = await checkFirebaseConnection();
                    
                    if (connectionStatus.available) {
                        // Verify user still exists and is active
                        const verificationResult = await window.loginUser(user.email, user.password);
                        
                        if (verificationResult && verificationResult.success) {
                            showMessage(`Sesión válida: ${user.name}. Redirigiendo...`);
                            
                            // Update session timestamp
                            sessionStorage.setItem('agrotec_login_time', new Date().toISOString());
                            
                            setTimeout(() => {
                                redirectUserByType(user);
                            }, 2000);
                            
                            return true;
                        } else {
                            // User no longer exists or credentials changed
                            console.log('Sesión inválida - usuario no encontrado o credenciales cambiadas');
                            clearSession();
                            showMessage('Tu sesión ha expirado. Por favor inicia sesión nuevamente.', true);
                            return false;
                        }
                    } else {
                        // Database not available, use cached session
                        showMessage(`Sesión activa: ${user.name}. Redirigiendo (modo offline)...`);
                        
                        setTimeout(() => {
                            redirectUserByType(user);
                        }, 2000);
                        
                        return true;
                    }
                } catch (error) {
                    console.error('Error verificando sesión:', error);
                    // On error, allow cached session to continue
                    showMessage(`Sesión activa: ${user.name}. Redirigiendo...`);
                    
                    setTimeout(() => {
                        redirectUserByType(user);
                    }, 2000);
                    
                    return true;
                }
            } else {
                // Session expired
                console.log('Sesión expirada (más de 24 horas)');
                clearSession();
                showMessage('Tu sesión ha expirado. Por favor inicia sesión nuevamente.', true);
            }
        } catch (error) {
            console.error('Error verificando sesión:', error);
            clearSession();
        }
    }
    
    return false;
}

// Helper function to redirect user based on type
function redirectUserByType(user) {
    if (user.type === 'FARMER') {
        window.location.href = 'farmerindex.html';
    } else if (user.type === 'CUSTOMER') {
        window.location.href = 'index.html?logged=true';
    } else {
        window.location.href = 'database-simulator.html';
    }
}

// Enhanced session clearing
function clearSession() {
    sessionStorage.removeItem('agrotec_user');
    sessionStorage.removeItem('agrotec_login_time');
    sessionStorage.removeItem('agrotec_session_id');
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
                toggleIcon.title = 'Ocultar contraseña';
            } else {
                passwordField.type = 'password';
                toggleIcon.innerHTML = '<i class="fas fa-eye"></i>';
                toggleIcon.title = 'Mostrar contraseña';
            }
        });
        
        // Add icon to container
        fieldContainer.appendChild(toggleIcon);
        
        // Adjust input padding so it doesn't overlap with icon
        passwordField.style.paddingRight = '60px';
    });
    
    console.log('✅ Iconos de mostrar/ocultar contraseña configurados');
}

// =================== LOGOUT FUNCTION WITH FIREBASE CLEANUP ===================
function logout() {
    const user = getCurrentUser();
    
    if (user) {
        console.log('Cerrando sesión de usuario:', {
            name: user.name,
            type: user.type,
            sessionId: user.sessionId || 'unknown'
        });
    }
    
    clearSession();
    console.log('Sesión cerrada');
    showMessage('Sesión cerrada correctamente');
    
    // Redirect to login after a brief delay
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1000);
}

// Get current user from session
function getCurrentUser() {
    try {
        const userString = sessionStorage.getItem('agrotec_user');
        return userString ? JSON.parse(userString) : null;
    } catch (error) {
        console.error('Error obteniendo usuario actual:', error);
        return null;
    }
}

// Make functions available globally
window.logout = logout;
window.getCurrentUser = getCurrentUser;

// =================== ENHANCED INITIALIZATION ===================
async function initializeLogin() {
    console.log('Inicializando página de login...');
    
    // Show initial loading message
    showMessage('Iniciando sistema...');
    
    try {
        // Check existing session first
        const hasActiveSession = await checkExistingSession();
        if (hasActiveSession) {
            return; // Don't continue if there's an active session
        }
        
        clearMessages();
        
        // Check Firebase connection
        showMessage('Verificando conexión con la base de datos...');
        const connectionStatus = await checkFirebaseConnection();
        
        if (connectionStatus.available) {
            console.log('✅ Conexión establecida:', connectionStatus.status);
            showMessage(`✅ ${connectionStatus.status}`, false);
            
            // Clear success message after 3 seconds
            setTimeout(() => {
                clearMessages();
            }, 3000);
        } else {
            console.error('❌ Error: database-simulator.js no cargado');
            showMessage('❌ Error del sistema. Por favor recarga la página.', true);
            return;
        }
        
        // Configure form
        const loginForm = document.getElementById('loginFormData');
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
            console.log('✅ Formulario de login configurado');
        } else {
            console.error('❌ Formulario de login no encontrado');
        }
        
        // Configure show/hide password icons
        setTimeout(() => {
            setupPasswordToggle();
        }, 100);
        
        // Check URL parameters (from successful registration)
        const urlParams = new URLSearchParams(window.location.search);
        const email = urlParams.get('email');
        const message = urlParams.get('message');
        
        if (email) {
            const emailInput = document.getElementById('loginEmail');
            if (emailInput) {
                emailInput.value = email;
                emailInput.focus();
            }
        }
        
        if (message === 'registered') {
            showMessage('✅ Cuenta creada exitosamente. Ya puedes iniciar sesión.');
        }
        
        console.log('✅ Página de login inicializada correctamente');
        
    } catch (error) {
        console.error('Error inicializando login:', error);
        showMessage('Error inicializando el sistema. Por favor recarga la página.', true);
    }
}

// =================== ENHANCED DEBUG FUNCTIONS ===================
window.loginDebug = {
    testLogin: async (email = 'test@customer.com', password = '123456') => {
        console.log('Probando login con:', { email, password });
        
        try {
            const result = await window.loginUser(email, password);
            console.log('Resultado del test:', result);
            return result;
        } catch (error) {
            console.error('Error en test de login:', error);
            return { success: false, error: error.message };
        }
    },
    
    checkConnection: async () => {
        console.log('=== ESTADO DEL SISTEMA ===');
        
        const connectionStatus = await checkFirebaseConnection();
        console.log('- Conexión disponible:', connectionStatus.available);
        console.log('- Firebase habilitado:', connectionStatus.firebaseEnabled);
        console.log('- Estado:', connectionStatus.status);
        console.log('- loginUser disponible:', typeof window.loginUser === 'function');
        console.log('- Formulario encontrado:', !!document.getElementById('loginFormData'));
        
        if (typeof window.databaseDebug === 'object') {
            const data = window.databaseDebug.showData();
            console.log('- Total usuarios:', data.users.length);
            if (data.users.length > 0) {
                console.log('- Último usuario:', data.users[data.users.length - 1]);
            }
        }
        
        return connectionStatus;
    },
    
    getCurrentSession: () => {
        const user = getCurrentUser();
        const loginTime = sessionStorage.getItem('agrotec_login_time');
        const sessionId = sessionStorage.getItem('agrotec_session_id');
        
        if (user && loginTime) {
            const sessionInfo = {
                user: user,
                loginTime: new Date(loginTime),
                sessionId: sessionId,
                hoursActive: (new Date() - new Date(loginTime)) / (1000 * 60 * 60)
            };
            
            console.log('=== SESIÓN ACTUAL ===');
            console.log(sessionInfo);
            return sessionInfo;
        } else {
            console.log('No hay sesión activa');
            return null;
        }
    },
    
    clearSession: () => {
        clearSession();
        console.log('Sesión limpiada');
        showMessage('Sesión limpiada');
    },
    
    forceLogin: async (email, password) => {
        console.log('Forzando login con:', email);
        
        // Clear any existing session
        clearSession();
        
        // Perform login
        const loginInput = document.getElementById('loginEmail');
        const passwordInput = document.getElementById('loginPassword');
        
        if (loginInput && passwordInput) {
            loginInput.value = email;
            passwordInput.value = password;
            
            const form = document.getElementById('loginFormData');
            if (form) {
                const event = new Event('submit', { bubbles: true, cancelable: true });
                form.dispatchEvent(event);
            }
        } else {
            console.error('Campos de login no encontrados');
        }
    },
    
    // Test Firebase connection specifically
    testFirebaseConnection: async () => {
        console.log('=== PROBANDO CONEXIÓN FIREBASE ===');
        
        if (typeof firebase !== 'undefined' && typeof db !== 'undefined') {
            try {
                // Try to read from Firebase
                const snapshot = await db.collection('users').limit(1).get();
                console.log('✅ Firebase conectado - documentos encontrados:', snapshot.size);
                return { success: true, connected: true, documents: snapshot.size };
            } catch (error) {
                console.error('❌ Error conectando a Firebase:', error);
                return { success: false, connected: false, error: error.message };
            }
        } else {
            console.error('❌ Firebase SDK no disponible');
            return { success: false, connected: false, error: 'Firebase SDK no disponible' };
        }
    }
};

// =================== AUTO-RETRY CONNECTION ===================
function setupConnectionRetry() {
    let retryCount = 0;
    const maxRetries = 3;
    
    const retryConnection = async () => {
        if (retryCount >= maxRetries) {
            showMessage('No se pudo establecer conexión. Usando modo offline.', true);
            return;
        }
        
        retryCount++;
        console.log(`Intento de reconexión ${retryCount}/${maxRetries}`);
        
        const connectionStatus = await checkFirebaseConnection();
        if (!connectionStatus.available) {
            setTimeout(retryConnection, 2000 * retryCount); // Increase delay with each retry
        } else {
            console.log('Conexión restaurada');
            showMessage('Conexión restaurada', false);
            setTimeout(clearMessages, 2000);
        }
    };
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
        console.log('Conectividad restaurada');
        retryCount = 0; // Reset retry count
        retryConnection();
    });
    
    window.addEventListener('offline', () => {
        console.log('Conectividad perdida');
        showMessage('Sin conexión a internet. Algunos datos pueden no estar actualizados.', true);
    });
}

// =================== INITIALIZATION ON LOAD ===================
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado, inicializando login...');
    initializeLogin();
    setupConnectionRetry();
});

if (document.readyState === 'loading') {
    console.log('Esperando carga del DOM...');
} else {
    console.log('DOM ya cargado, inicializando inmediatamente...');
    initializeLogin();
    setupConnectionRetry();
}
