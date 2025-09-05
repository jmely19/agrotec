// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos del DOM
    const customerBtn = document.getElementById('customerBtn');
    const farmerBtn = document.getElementById('farmerBtn');
    const customerForm = document.getElementById('customerForm');
    const farmerForm = document.getElementById('farmerForm');
    const enterHereLink = document.getElementById('enterHereLink');
    
    // Estado actual del formulario
    let currentFormType = 'customer';
    
    // Event listeners para los botones de toggle
    customerBtn.addEventListener('click', () => switchForm('customer'));
    farmerBtn.addEventListener('click', () => switchForm('farmer'));
    
    // Event listeners para los formularios
    customerForm.addEventListener('submit', handleCustomerRegistration);
    farmerForm.addEventListener('submit', handleFarmerRegistration);
    
    // Event listener para el enlace "Enter here"
    enterHereLink.addEventListener('click', function(e) {
        e.preventDefault();
        redirectToLogin();
    });
    
    // Validación en tiempo real para todos los inputs
    setupRealTimeValidation();
    
    // Efectos visuales para inputs
    setupInputEffects();
});

// Función para cambiar entre formularios Customer y Farmer
function switchForm(formType) {
    const customerBtn = document.getElementById('customerBtn');
    const farmerBtn = document.getElementById('farmerBtn');
    const customerForm = document.getElementById('customerForm');
    const farmerForm = document.getElementById('farmerForm');
    
    // Actualizar estado actual
    currentFormType = formType;
    
    if (formType === 'customer') {
        // Activar Customer
        customerBtn.classList.add('active');
        farmerBtn.classList.remove('active');
        customerForm.classList.add('active');
        farmerForm.classList.remove('active');
    } else {
        // Activar Farmer
        farmerBtn.classList.add('active');
        customerBtn.classList.remove('active');
        farmerForm.classList.add('active');
        customerForm.classList.remove('active');
    }
    
    // Limpiar formularios al cambiar
    clearFormData();
}

// Función para limpiar datos de formularios
function clearFormData() {
    const allInputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], input[type="tel"]');
    allInputs.forEach(input => {
        input.value = '';
        input.classList.remove('valid', 'invalid');
    });
}

// Manejar registro de Customer
function handleCustomerRegistration(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('customerName').value,
        lastName: document.getElementById('customerLastName').value,
        email: document.getElementById('customerEmail').value,
        password: document.getElementById('customerPassword').value,
        confirmPassword: document.getElementById('customerConfirmPassword').value,
        phone: document.getElementById('customerPhone').value
    };
    
    // Validar formulario
    if (!validateCustomerForm(formData)) {
        return;
    }
    
    // Procesar registro
    processRegistration('customer', formData);
}

// Manejar registro de Farmer
function handleFarmerRegistration(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('farmerName').value,
        lastName: document.getElementById('farmerLastName').value,
        businessEmail: document.getElementById('farmerEmail').value,
        password: document.getElementById('farmerPassword').value,
        location: document.getElementById('farmerLocation').value,
        phone: document.getElementById('farmerPhone').value,
        businessName: document.getElementById('farmerBusinessName').value
    };
    
    // Validar formulario
    if (!validateFarmerForm(formData)) {
        return;
    }
    
    // Procesar registro
    processRegistration('farmer', formData);
}

// Validar formulario de Customer
function validateCustomerForm(data) {
    let isValid = true;
    
    // Validar nombre
    if (!data.name.trim()) {
        showFieldError('customerName', 'El nombre es requerido');
        isValid = false;
    }
    
    // Validar apellido
    if (!data.lastName.trim()) {
        showFieldError('customerLastName', 'El apellido es requerido');
        isValid = false;
    }
    
    // Validar email
    if (!validateEmail(data.email)) {
        showFieldError('customerEmail', 'Email inválido');
        isValid = false;
    }
    
    // Validar contraseña
    if (!validatePassword(data.password)) {
        showFieldError('customerPassword', 'Contraseña debe tener al menos 8 caracteres');
        isValid = false;
    }
    
    // Validar confirmación de contraseña
    if (data.password !== data.confirmPassword) {
        showFieldError('customerConfirmPassword', 'Las contraseñas no coinciden');
        isValid = false;
    }
    
    // Validar teléfono
    if (!validatePhone(data.phone)) {
        showFieldError('customerPhone', 'Teléfono inválido');
        isValid = false;
    }
    
    return isValid;
}

// Validar formulario de Farmer
function validateFarmerForm(data) {
    let isValid = true;
    
    // Validar nombre
    if (!data.name.trim()) {
        showFieldError('farmerName', 'El nombre es requerido');
        isValid = false;
    }
    
    // Validar apellido
    if (!data.lastName.trim()) {
        showFieldError('farmerLastName', 'El apellido es requerido');
        isValid = false;
    }
    
    // Validar business email
    if (!validateEmail(data.businessEmail)) {
        showFieldError('farmerEmail', 'Email de negocio inválido');
        isValid = false;
    }
    
    // Validar contraseña
    if (!validatePassword(data.password)) {
        showFieldError('farmerPassword', 'Contraseña debe tener al menos 8 caracteres');
        isValid = false;
    }
    
    // Validar ubicación
    if (!data.location.trim()) {
        showFieldError('farmerLocation', 'La ubicación es requerida');
        isValid = false;
    }
    
    // Validar teléfono
    if (!validatePhone(data.phone)) {
        showFieldError('farmerPhone', 'Teléfono inválido');
        isValid = false;
    }
    
    // Validar nombre del negocio
    if (!data.businessName.trim()) {
        showFieldError('farmerBusinessName', 'El nombre del negocio es requerido');
        isValid = false;
    }
    
    return isValid;
}

// Procesar registro
function processRegistration(type, data) {
    showLoading(true);
    
    // Simular llamada a API
    setTimeout(() => {
        showLoading(false);
        
        // Simular registro exitoso
        const userType = type === 'customer' ? 'Cliente' : 'Agricultor';
        showMessage(`¡Registro de ${userType} exitoso! Redirigiendo al login...`, 'success');
        
        // Guardar tipo de usuario para el login
        sessionStorage.setItem('userType', type);
        sessionStorage.setItem('registrationSuccess', 'true');
        
        // Redirigir al login después de 2 segundos
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    }, 2500);
}

// Funciones de validación
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePassword(password) {
    return password.length >= 8;
}

function validatePhone(phone) {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/;
    return phoneRegex.test(phone);
}

// Mostrar error en campo específico
function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    field.classList.add('invalid');
    field.classList.remove('valid');
    
    // Remover clase de error después de 3 segundos
    setTimeout(() => {
        field.classList.remove('invalid');
    }, 3000);
    
    showMessage(message, 'error');
}

// Configurar validación en tiempo real
function setupRealTimeValidation() {
    const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], input[type="tel"]');
    
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateSingleField(this);
        });
        
        input.addEventListener('input', function() {
            // Remover clases de validación mientras el usuario escribe
            this.classList.remove('valid', 'invalid');
        });
    });
}

// Validar campo individual
function validateSingleField(field) {
    const value = field.value.trim();
    const fieldType = field.type;
    const fieldId = field.id;
    
    let isValid = false;
    
    switch(fieldType) {
        case 'email':
            isValid = validateEmail(value);
            break;
        case 'password':
            isValid = validatePassword(value);
            // Validación especial para confirmación de contraseña
            if (fieldId.includes('ConfirmPassword')) {
                const passwordField = fieldId === 'customerConfirmPassword' ? 
                    document.getElementById('customerPassword') : 
                    document.getElementById('farmerPassword');
                isValid = value === passwordField.value && validatePassword(value);
            }
            break;
        case 'tel':
            isValid = validatePhone(value);
            break;
        default:
            isValid = value.length > 0;
    }
    
    if (value.length > 0) {
        if (isValid) {
            field.classList.add('valid');
            field.classList.remove('invalid');
        } else {
            field.classList.add('invalid');
            field.classList.remove('valid');
        }
    } else {
        field.classList.remove('valid', 'invalid');
    }
}

// Configurar efectos visuales para inputs
function setupInputEffects() {
    const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], input[type="tel"]');
    
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
    });
}

// Redirigir al login
function redirectToLogin() {
    showMessage('Redirigiendo al login...', 'info');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

// Registro con Google
function registerWithGoogle() {
    const userType = currentFormType === 'customer' ? 'Cliente' : 'Agricultor';
    showMessage(`Registrando ${userType} con Google...`, 'info');
    
    setTimeout(() => {
        showMessage('Funcionalidad de Google en desarrollo', 'info');
    }, 1500);
}

// Registro con Facebook
function registerWithFacebook() {
    const userType = currentFormType === 'customer' ? 'Cliente' : 'Agricultor';
    showMessage(`Registrando ${userType} con Facebook...`, 'info');
    
    setTimeout(() => {
        showMessage('Funcionalidad de Facebook en desarrollo', 'info');
    }, 1500);
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
    const activeForm = currentFormType === 'customer' ? 
        document.getElementById('customerForm') : 
        document.getElementById('farmerForm');
    
    const button = activeForm.querySelector('.create-account-btn');
    
    if (show) {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
        button.style.opacity = '0.7';
        activeForm.classList.add('loading');
    } else {
        button.disabled = false;
        if (currentFormType === 'customer') {
            button.innerHTML = 'Create a personal account';
        } else {
            button.innerHTML = 'Create a farmer account';
        }
        button.style.opacity = '1';
        activeForm.classList.remove('loading');
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
    
    /* Efectos de hover para inputs */
    input[type="text"]:hover,
    input[type="email"]:hover,
    input[type="password"]:hover,
    input[type="tel"]:hover {
        border-color: #c5c5c5;
        transform: translateY(-1px);
    }
    
    /* Animación para cambio de formularios */
    .form-container {
        transition: all 0.3s ease;
    }
    
    /* Efectos para botones de toggle */
    .toggle-btn {
        position: relative;
        overflow: hidden;
    }
    
    .toggle-btn::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        transition: left 0.5s;
    }
    
    .toggle-btn:hover::before {
        left: 100%;
    }
`;
document.head.appendChild(style);

// Función para manejar el estado inicial basado en parámetros URL
function handleInitialState() {
    const urlParams = new URLSearchParams(window.location.search);
    const formType = urlParams.get('type');
    
    if (formType === 'farmer') {
        switchForm('farmer');
    }
    
    // Mostrar mensaje si viene del login
    if (sessionStorage.getItem('fromLogin') === 'true') {
        sessionStorage.removeItem('fromLogin');
        showMessage('Crear nueva cuenta', 'info');
    }
}

// Ejecutar función inicial cuando cargue la página
document.addEventListener('DOMContentLoaded', function() {
    handleInitialState();
});

// Función para validar fuerza de contraseña
function validatePasswordStrength(password) {
    let strength = 0;
    let feedback = [];
    
    // Longitud mínima
    if (password.length >= 8) {
        strength += 1;
    } else {
        feedback.push('Al menos 8 caracteres');
    }
    
    // Contiene mayúsculas
    if (/[A-Z]/.test(password)) {
        strength += 1;
    } else {
        feedback.push('Al menos una mayúscula');
    }
    
    // Contiene minúsculas
    if (/[a-z]/.test(password)) {
        strength += 1;
    } else {
        feedback.push('Al menos una minúscula');
    }
    
    // Contiene números
    if (/[0-9]/.test(password)) {
        strength += 1;
    } else {
        feedback.push('Al menos un número');
    }
    
    // Contiene caracteres especiales
    if (/[^A-Za-z0-9]/.test(password)) {
        strength += 1;
    } else {
        feedback.push('Al menos un carácter especial');
    }
    
    return {
        strength: strength,
        feedback: feedback,
        isStrong: strength >= 3
    };
}

// Función mejorada para mostrar indicador de fuerza de contraseña
function showPasswordStrength(inputId, password) {
    const input = document.getElementById(inputId);
    let indicator = input.parentElement.querySelector('.password-strength');
    
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.className = 'password-strength';
        indicator.style.cssText = `
            margin-top: 5px;
            height: 4px;
            border-radius: 2px;
            background: #e1e8ed;
            position: relative;
            overflow: hidden;
        `;
        input.parentElement.appendChild(indicator);
    }
    
    const result = validatePasswordStrength(password);
    const percentage = (result.strength / 5) * 100;
    
    let color = '#dc3545'; // Rojo
    if (result.strength >= 3) color = '#ffc107'; // Amarillo
    if (result.strength >= 4) color = '#28a745'; // Verde
    
    indicator.innerHTML = `<div style="width: ${percentage}%; height: 100%; background: ${color}; transition: all 0.3s ease;"></div>`;
}

// Mejorar la validación en tiempo real para incluir fuerza de contraseña
function enhancePasswordValidation() {
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    
    passwordInputs.forEach(input => {
        if (input.id.includes('Password') && !input.id.includes('Confirm')) {
            input.addEventListener('input', function() {
                if (this.value.length > 0) {
                    showPasswordStrength(this.id, this.value);
                }
            });
        }
    });
}

// Ejecutar mejoras cuando cargue el DOM
document.addEventListener('DOMContentLoaded', function() {
    enhancePasswordValidation();
});