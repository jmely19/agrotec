// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos del DOM
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const createAccountLink = document.querySelector('.create-account');
    const recoverPasswordLink = document.querySelector('.recover-password');
    
    // Manejar el envío del formulario
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        handleLogin();
    });
    
    // Validación en tiempo real para email
    emailInput.addEventListener('blur', function() {
        validateEmail(this.value);
    });
    
    // Validación en tiempo real para password
    passwordInput.addEventListener('blur', function() {
        validatePassword(this.value);
    });
    
    // Efecto de focus para inputs
    const inputs = document.querySelectorAll('input[type="email"], input[type="password"]');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
    });
    
    // Enlaces de navegación
    createAccountLink.addEventListener('click', function(e) {
        e.preventDefault();
        handleCreateAccount();
    });
    
    recoverPasswordLink.addEventListener('click', function(e) {
        e.preventDefault();
        handleRecoverPassword();
    });
});

// Función principal de login
function handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Validar campos
    if (!validateEmail(email)) {
        showMessage('Por favor ingresa un email válido', 'error');
        return;
    }
    
    if (!validatePassword(password)) {
        showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    // Simular proceso de login
    showLoading(true);
    
    // Simular llamada a API
    setTimeout(() => {
        showLoading(false);
        
        // Aquí normalmente harías una llamada real a tu API
        if (email === 'demo@example.com' && password === 'demo123') {
            showMessage('¡Login exitoso! Redirigiendo...', 'success');
            setTimeout(() => {
                // Redirigir a dashboard o página principal
                window.location.href = 'dashboard.html';
            }, 1500);
        } else {
            showMessage('Email o contraseña incorrectos', 'error');
        }
    }, 2000);
}

// Función para login con Google
function loginWithGoogle() {
    showMessage('Conectando con Google...', 'info');
    
    // Aquí integrarías la API de Google Sign-In
    // Por ahora solo mostramos un mensaje
    setTimeout(() => {
        showMessage('Funcionalidad de Google en desarrollo', 'info');
    }, 1000);
}

// Función para login con Facebook
function loginWithFacebook() {
    showMessage('Conectando con Facebook...', 'info');
    
    // Aquí integrarías la API de Facebook Login
    // Por ahora solo mostramos un mensaje
    setTimeout(() => {
        showMessage('Funcionalidad de Facebook en desarrollo', 'info');
    }, 1000);
}

// Función para crear cuenta
function handleCreateAccount() {
    showMessage('Redirigiendo a crear cuenta...', 'info');
    setTimeout(() => {
        // Redirigir a página de registro
        window.location.href = 'register.html';
    }, 1000);
}

// Función para recuperar contraseña
function handleRecoverPassword() {
    const email = document.getElementById('email').value;
    
    if (!email) {
        showMessage('Por favor ingresa tu email primero', 'warning');
        document.getElementById('email').focus();
        return;
    }
    
    if (!validateEmail(email)) {
        showMessage('Por favor ingresa un email válido', 'error');
        return;
    }
    
    showMessage('Enviando instrucciones de recuperación...', 'info');
    
    // Simular envío de email de recuperación
    setTimeout(() => {
        showMessage('Instrucciones enviadas a tu email', 'success');
    }, 2000);
}

// Función de validación de email
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Función de validación de contraseña
function validatePassword(password) {
    return password.length >= 6;
}

// Función para mostrar mensajes
function showMessage(message, type) {
    // Remover mensaje anterior si existe
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Crear nuevo mensaje
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    // Estilos para el mensaje
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 25px;
        font-weight: 500;
        font-size: 0.9rem;
        z-index: 1000;
        animation: slideIn 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    // Colores según el tipo
    switch(type) {
        case 'success':
            messageDiv.style.background = '#4CAF50';
            messageDiv.style.color = 'white';
            break;
        case 'error':
            messageDiv.style.background = '#f44336';
            messageDiv.style.color = 'white';
            break;
        case 'warning':
            messageDiv.style.background = '#ff9800';
            messageDiv.style.color = 'white';
            break;
        case 'info':
            messageDiv.style.background = '#2196F3';
            messageDiv.style.color = 'white';
            break;
    }
    
    // Agregar al DOM
    document.body.appendChild(messageDiv);
    
    // Auto-remover después de 4 segundos
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                messageDiv.remove();
            }, 300);
        }
    }, 4000);
}

// Función para mostrar/ocultar loading
function showLoading(show) {
    const button = document.querySelector('.get-in-btn');
    
    if (show) {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
        button.style.opacity = '0.7';
    } else {
        button.disabled = false;
        button.innerHTML = 'GET IN';
        button.style.opacity = '1';
    }
}

// Agregar estilos para las animaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .input-group.focused {
        transform: scale(1.02);
        transition: transform 0.2s ease;
    }
    
    .fa-spinner {
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);