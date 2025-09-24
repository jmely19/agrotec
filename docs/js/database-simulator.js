// =================== CONFIGURACIÓN DE FIREBASE ===================
// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyB7Dor7f9khb5DE3iKHB-jiAcZlcLeXaKE",
    authDomain: "agrotec-2bc95.firebaseapp.com",
    databaseURL: "https://agrotec-2bc95-default-rtdb.firebaseio.com",
    projectId: "agrotec-2bc95",
    storageBucket: "agrotec-2bc95.firebasestorage.app",
    messagingSenderId: "153858986703",
    appId: "1:153858986703:web:60052305723fbf60399dba",
    measurementId: "G-6SHXS102JQ"
};

// Variables para Firebase
let db = null;
let isFirebaseEnabled = false;

// Intentar inicializar Firebase
function initializeFirebase() {
    try {
        if (typeof firebase !== 'undefined') {
            firebase.initializeApp(firebaseConfig);
            db = firebase.firestore();
            isFirebaseEnabled = true;
            console.log('Firebase inicializado correctamente');
            
            // Configurar persistencia offline
            db.enablePersistence()
                .catch((err) => {
                    if (err.code == 'failed-precondition') {
                        console.log('Persistencia offline no disponible - múltiples pestañas abiertas');
                    } else if (err.code == 'unimplemented') {
                        console.log('Persistencia offline no compatible con este navegador');
                    }
                });
        } else {
            console.warn('Firebase SDK no cargado - usando localStorage como respaldo');
            isFirebaseEnabled = false;
        }
    } catch (error) {
        console.error('Error inicializando Firebase:', error);
        isFirebaseEnabled = false;
    }
}

// =================== VARIABLES GLOBALES ===================
let users = [];
let farmers = [];
let customers = [];
let currentSheet = 'usuarios';

// =================== FUNCIONES DE BASE DE DATOS HÍBRIDA ===================

// Cargar datos desde Firebase o localStorage
async function loadDatabaseData() {
    console.log('Cargando datos de la base de datos...');
    
    try {
        if (isFirebaseEnabled) {
            await loadFromFirebase();
        } else {
            loadFromLocalStorage();
        }
        
        console.log('Datos cargados:', { 
            users: users.length, 
            farmers: farmers.length, 
            customers: customers.length 
        });
        
        // Solo renderizar si los elementos DOM existen
        if (document.getElementById('usersTableBody') || document.getElementById('farmersTableBody')) {
            renderCurrentSheet();
        }
        
        updateLastUpdate();
        
    } catch (error) {
        console.error('Error cargando datos:', error);
        // Fallback a localStorage si Firebase falla
        loadFromLocalStorage();
        showError('Error cargando datos en línea, usando datos locales: ' + error.message);
    }
}

// Cargar desde Firebase
async function loadFromFirebase() {
    if (!isFirebaseEnabled) {
        throw new Error('Firebase no está disponible');
    }
    
    try {
        console.log('Cargando desde Firebase...');
        
        // Cargar usuarios
        const usersSnapshot = await db.collection('users').get();
        users = usersSnapshot.docs.map(doc => ({
            id: doc.data().id,
            ...doc.data()
        }));
        
        // Cargar farmers
        const farmersSnapshot = await db.collection('farmers').get();
        farmers = farmersSnapshot.docs.map(doc => ({
            userId: doc.data().userId,
            ...doc.data()
        }));
        
        // Cargar customers
        const customersSnapshot = await db.collection('customers').get();
        customers = customersSnapshot.docs.map(doc => ({
            userId: doc.data().userId,
            ...doc.data()
        }));
        
        // Sincronizar con localStorage como backup
        localStorage.setItem('agrotec_users', JSON.stringify(users));
        localStorage.setItem('agrotec_farmers', JSON.stringify(farmers));
        localStorage.setItem('agrotec_customers', JSON.stringify(customers));
        
        console.log('Datos cargados desde Firebase exitosamente');
        
    } catch (error) {
        console.error('Error cargando desde Firebase:', error);
        throw error;
    }
}

// Cargar desde localStorage (fallback)
function loadFromLocalStorage() {
    console.log('Cargando desde localStorage...');
    
    users = JSON.parse(localStorage.getItem('agrotec_users')) || [];
    farmers = JSON.parse(localStorage.getItem('agrotec_farmers')) || [];
    customers = JSON.parse(localStorage.getItem('agrotec_customers')) || [];
}

// Guardar datos en Firebase y localStorage
async function saveToDatabase() {
    try {
        if (isFirebaseEnabled) {
            await saveToFirebase();
        }
        
        // Siempre guardar en localStorage como backup
        saveToLocalStorage();
        
    } catch (error) {
        console.error('Error guardando en Firebase, usando solo localStorage:', error);
        saveToLocalStorage();
        showError('Error guardando en línea, datos guardados localmente');
    }
}

// Guardar en Firebase
async function saveToFirebase() {
    if (!isFirebaseEnabled) {
        return;
    }
    
    const batch = db.batch();
    
    try {
        console.log('Guardando en Firebase...');
        
        // Guardar usuarios
        for (const user of users) {
            const userRef = db.collection('users').doc(user.id.toString());
            batch.set(userRef, user, { merge: true });
        }
        
        // Guardar farmers
        for (const farmer of farmers) {
            const farmerRef = db.collection('farmers').doc(farmer.userId.toString());
            batch.set(farmerRef, farmer, { merge: true });
        }
        
        // Guardar customers
        for (const customer of customers) {
            const customerRef = db.collection('customers').doc(customer.userId.toString());
            batch.set(customerRef, customer, { merge: true });
        }
        
        await batch.commit();
        console.log('Datos guardados en Firebase exitosamente');
        
    } catch (error) {
        console.error('Error guardando en Firebase:', error);
        throw error;
    }
}

// Guardar en localStorage
function saveToLocalStorage() {
    localStorage.setItem('agrotec_users', JSON.stringify(users));
    localStorage.setItem('agrotec_farmers', JSON.stringify(farmers));
    localStorage.setItem('agrotec_customers', JSON.stringify(customers));
}

// Eliminar de Firebase
async function deleteFromFirebase(userId) {
    if (!isFirebaseEnabled) {
        return;
    }
    
    try {
        const batch = db.batch();
        
        // Eliminar usuario
        const userRef = db.collection('users').doc(userId.toString());
        batch.delete(userRef);
        
        // Eliminar farmer si existe
        const farmerRef = db.collection('farmers').doc(userId.toString());
        batch.delete(farmerRef);
        
        // Eliminar customer si existe
        const customerRef = db.collection('customers').doc(userId.toString());
        batch.delete(customerRef);
        
        await batch.commit();
        console.log('Usuario eliminado de Firebase:', userId);
        
    } catch (error) {
        console.error('Error eliminando de Firebase:', error);
        throw error;
    }
}

// =================== FUNCIONES DE NAVEGACIÓN ===================
function updateLastUpdate() {
    try {
        const now = new Date().toLocaleString('es-ES');
        const status = isFirebaseEnabled ? 'En línea (Firebase)' : 'Local (localStorage)';
        
        const lastUpdateEl = document.getElementById('lastUpdate');
        const footerUpdateEl = document.getElementById('footerUpdate');
        const totalRecordsEl = document.getElementById('totalRecords');
        
        if (lastUpdateEl) lastUpdateEl.textContent = now;
        if (footerUpdateEl) footerUpdateEl.textContent = `Última actualización: ${now} - ${status}`;
        if (totalRecordsEl) totalRecordsEl.textContent = users.length + farmers.length + customers.length;
        
    } catch (error) {
        console.log('Elementos de actualización no encontrados (normal en página de login)');
    }
}

function showSheet(sheetName) {
    const sheets = document.querySelectorAll('.sheet');
    const tabs = document.querySelectorAll('.tab');
    
    if (sheets.length === 0 || tabs.length === 0) {
        console.log('Elementos de navegación no encontrados');
        return;
    }
    
    sheets.forEach(sheet => sheet.classList.remove('active'));
    tabs.forEach(tab => tab.classList.remove('active'));

    const targetSheet = document.getElementById(sheetName);
    if (targetSheet) {
        targetSheet.classList.add('active');
        if (event && event.target) {
            event.target.classList.add('active');
        }
    }
    
    currentSheet = sheetName;
    renderCurrentSheet();
}

function renderCurrentSheet() {
    if (!document.getElementById('usersTableBody')) {
        console.log('Tabla de usuarios no encontrada - probablemente en página de login');
        return;
    }
    
    switch(currentSheet) {
        case 'usuarios':
            renderUsers();
            break;
        case 'farmers':
            renderFarmers();
            break;
        case 'customers':
            renderCustomers();
            break;
        case 'dashboard':
            renderDashboard();
            break;
    }
}

// =================== FUNCIONES DE RENDERIZADO ===================
function renderUsers(filteredUsers = users) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) {
        console.log('Tabla de usuarios no encontrada');
        return;
    }
    
    if (filteredUsers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="empty-state">
                    <i class="fas fa-users"></i>
                    <p>No hay usuarios registrados</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filteredUsers.map(user => `
        <tr>
            <td>${user.id}</td>
            <td class="${user.type === 'FARMER' ? 'farmer-type' : 'customer-type'}">${user.type}</td>
            <td>${user.name}</td>
            <td>${user.lastName}</td>
            <td>${user.email}</td>
            <td>${user.phone || 'No especificado'}</td>
            <td>${user.date}</td>
            <td class="${user.status === 'ACTIVO' ? 'status-active' : 'status-inactive'}">${user.status}</td>
            <td>
                <button class="btn-delete" onclick="confirmDeleteUser(${user.id})" title="Eliminar usuario">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function renderFarmers(filteredFarmers = null) {
    const tbody = document.getElementById('farmersTableBody');
    if (!tbody) {
        console.log('Tabla de farmers no encontrada');
        return;
    }
    
    const farmerUsers = filteredFarmers || users.filter(user => user.type === 'FARMER');
    
    if (farmerUsers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <i class="fas fa-tractor"></i>
                    <p>No hay farmers registrados</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = farmerUsers.map(user => {
        const farmerData = farmers.find(f => f.userId === user.id) || {};
        
        const location = farmerData.location || user.location || 'No especificado';
        const businessName = farmerData.business || farmerData.businessName || user.businessName || 'No especificado';
        const businessPhone = farmerData.businessPhone || user.businessPhone || user.phone || 'No especificado';
        
        return `
            <tr>
                <td>${user.id}</td>
                <td>${user.name} ${user.lastName}</td>
                <td>${location}</td>
                <td>${businessName}</td>
                <td>${businessPhone}</td>
                <td>${user.date}</td>
                <td>
                    <button class="btn-delete" onclick="confirmDeleteUser(${user.id})" title="Eliminar farmer">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderCustomers(filteredCustomers = null) {
    const tbody = document.getElementById('customersTableBody');
    if (!tbody) {
        console.log('Tabla de customers no encontrada');
        return;
    }
    
    const customerUsers = filteredCustomers || users.filter(user => user.type === 'CUSTOMER');
    
    if (customerUsers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <i class="fas fa-shopping-cart"></i>
                    <p>No hay customers registrados</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = customerUsers.map(user => {
        const customerData = customers.find(c => c.userId === user.id) || {};
        return `
            <tr>
                <td>${user.id}</td>
                <td>${user.name} ${user.lastName}</td>
                <td>${user.email}</td>
                <td>${customerData.contactPhone || user.phone || 'No especificado'}</td>
                <td>${user.date}</td>
                <td class="${user.status === 'ACTIVO' ? 'status-active' : 'status-inactive'}">
                    ${user.status}
                </td>
                <td>
                    <button class="btn-delete" onclick="confirmDeleteUser(${user.id})" title="Eliminar customer">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderDashboard() {
    const totalUsers = users.length;
    const totalFarmers = users.filter(u => u.type === 'FARMER').length;
    const totalCustomers = users.filter(u => u.type === 'CUSTOMER').length;
    const activeUsers = users.filter(u => u.status === 'ACTIVO').length;
    
    const totalUsersEl = document.getElementById('totalUsers');
    const totalFarmersEl = document.getElementById('totalFarmers');
    const totalCustomersEl = document.getElementById('totalCustomers');
    const activeUsersEl = document.getElementById('activeUsers');
    
    if (totalUsersEl) totalUsersEl.textContent = totalUsers;
    if (totalFarmersEl) totalFarmersEl.textContent = totalFarmers;
    if (totalCustomersEl) totalCustomersEl.textContent = totalCustomers;
    if (activeUsersEl) activeUsersEl.textContent = activeUsers;
}

// =================== FUNCIONES PARA AGREGAR USUARIOS ===================

async function addUser(userData) {
    try {
        console.log('Agregando usuario base:', userData);
        
        const maxId = Math.max(0, ...users.map(u => u.id)) + 1;
        const currentDate = new Date().toLocaleDateString('es-ES');
        
        if (users.some(u => u.email === userData.email)) {
            throw new Error('El email ya está registrado');
        }
        
        const newUser = {
            id: maxId,
            type: userData.type || 'CUSTOMER',
            name: userData.name,
            lastName: userData.lastName,
            email: userData.email,
            password: userData.password,
            phone: userData.phone || '',
            location: userData.location || '',
            businessName: userData.businessName || userData.business || '',
            businessPhone: userData.businessPhone || '',
            date: currentDate,
            status: 'ACTIVO'
        };
        
        users.push(newUser);
        
        // Guardar en base de datos (Firebase + localStorage)
        await saveToDatabase();
        
        console.log('Usuario base agregado exitosamente:', newUser);
        return { success: true, user: newUser };
        
    } catch (error) {
        console.error('Error agregando usuario base:', error);
        return { success: false, error: error.message };
    }
}

async function addFarmer(userData, farmerData) {
    try {
        console.log('Iniciando registro de farmer...');
        
        const combinedData = {
            ...userData,
            type: 'FARMER',
            location: farmerData.location || userData.location || '',
            businessName: farmerData.business || farmerData.businessName || userData.businessName || '',
            business: farmerData.business || farmerData.businessName || userData.businessName || '',
            businessPhone: farmerData.businessPhone || userData.businessPhone || userData.phone || '',
            phone: userData.phone || farmerData.businessPhone || ''
        };
        
        const userResult = await addUser(combinedData);
        
        if (!userResult.success) {
            console.error('Error creando usuario base para farmer:', userResult.error);
            return userResult;
        }
        
        const currentDate = new Date().toLocaleDateString('es-ES');
        
        const newFarmer = {
            userId: userResult.user.id,
            location: combinedData.location,
            business: combinedData.business,
            businessName: combinedData.businessName,
            businessPhone: combinedData.businessPhone,
            date: currentDate
        };
        
        farmers.push(newFarmer);
        
        // Guardar en base de datos
        await saveToDatabase();
        
        console.log('Farmer agregado exitosamente');
        showSuccess(`Farmer ${userData.name} ${userData.lastName} registrado exitosamente`);
        
        if (document.getElementById('farmersTableBody')) {
            refreshCurrentView();
        }
        
        return { success: true, user: userResult.user, farmer: newFarmer };
        
    } catch (error) {
        console.error('Error agregando farmer:', error);
        showError('Error al registrar farmer: ' + error.message);
        return { success: false, error: error.message };
    }
}

async function addCustomer(userData, customerData) {
    try {
        console.log('Iniciando registro de customer...');
        
        const userResult = await addUser({ ...userData, type: 'CUSTOMER' });
        
        if (!userResult.success) {
            console.error('Error creando usuario base para customer:', userResult.error);
            return userResult;
        }
        
        const currentDate = new Date().toLocaleDateString('es-ES');
        
        const newCustomer = {
            userId: userResult.user.id,
            contactPhone: customerData.contactPhone || userData.phone || '',
            date: currentDate
        };
        
        customers.push(newCustomer);
        
        // Guardar en base de datos
        await saveToDatabase();
        
        console.log('Customer agregado exitosamente:', newCustomer);
        showSuccess(`Customer ${userData.name} ${userData.lastName} registrado exitosamente`);
        
        if (document.getElementById('customersTableBody')) {
            refreshCurrentView();
        }
        
        return { success: true, user: userResult.user, customer: newCustomer };
        
    } catch (error) {
        console.error('Error agregando customer:', error);
        showError('Error al registrar customer: ' + error.message);
        return { success: false, error: error.message };
    }
}

// Función principal para registro (ahora async)
async function registerUser(formData) {
    console.log('=== INICIANDO REGISTRO DE USUARIO ===');
    console.log('Datos recibidos del formulario:', formData);
    
    try {
        const validationErrors = validateUserData(formData);
        if (validationErrors.length > 0) {
            console.error('Errores de validación:', validationErrors);
            showError('Errores de validación: ' + validationErrors.join(', '));
            return { success: false, errors: validationErrors };
        }
        
        const userType = (formData.userType || 'customer').toLowerCase();
        console.log('Tipo de usuario normalizado:', userType);
        
        if (userType === 'farmer') {
            console.log('Registrando como FARMER...');
            
            const farmerUserData = {
                name: formData.name,
                lastName: formData.lastName,
                email: formData.email,
                password: formData.password,
                phone: formData.farmerPhone || formData.businessPhone || formData.phone || '',
                businessPhone: formData.farmerPhone || formData.businessPhone || formData.phone || ''
            };
            
            const farmerSpecificData = {
                location: formData.location || '',
                business: formData.businessName || formData.business || '',
                businessName: formData.businessName || formData.business || '',
                businessPhone: formData.farmerPhone || formData.businessPhone || formData.phone || ''
            };
            
            const result = await addFarmer(farmerUserData, farmerSpecificData);
            return result;
            
        } else {
            console.log('Registrando como CUSTOMER...');
            
            const result = await addCustomer(
                {
                    name: formData.name,
                    lastName: formData.lastName,
                    email: formData.email,
                    password: formData.password,
                    phone: formData.phone || ''
                },
                {
                    contactPhone: formData.phone || ''
                }
            );
            
            return result;
        }
        
    } catch (error) {
        console.error('Error general en registerUser:', error);
        showError('Error interno: ' + error.message);
        return { success: false, error: 'Error interno: ' + error.message };
    }
}

// =================== FUNCIONES DE ELIMINACIÓN - FIJAS ===================

// Función para confirmar eliminación con modal personalizado
function confirmDeleteUser(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) {
        showError('Usuario no encontrado');
        return;
    }
    
    // Crear modal de confirmación personalizado
    const modal = document.createElement('div');
    modal.className = 'delete-confirmation-modal';
    modal.innerHTML = `
        <div class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-exclamation-triangle"></i> Confirmar Eliminación</h3>
                </div>
                <div class="modal-body">
                    <p>¿Estás seguro de que deseas eliminar el usuario?</p>
                    <div class="user-info">
                        <strong>${user.name} ${user.lastName}</strong><br>
                        <span class="user-email">${user.email}</span><br>
                        <span class="user-type ${user.type === 'FARMER' ? 'farmer-type' : 'customer-type'}">${user.type}</span>
                    </div>
                    <p class="warning-text">
                        <i class="fas fa-warning"></i>
                        Esta acción no se puede deshacer
                    </p>
                </div>
                <div class="modal-footer">
                    <button class="btn-cancel" onclick="closeDeleteModal()">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                    <button class="btn-confirm-delete" onclick="executeDeleteUser(${userId})">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Agregar estilos del modal
    const modalStyles = document.createElement('style');
    modalStyles.textContent = `
        .delete-confirmation-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 10000;
        }
        
        .modal-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease-out;
        }
        
        .modal-content {
            background: white;
            border-radius: 12px;
            max-width: 450px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            animation: modalSlideIn 0.3s ease-out;
        }
        
        .modal-header {
            padding: 20px;
            border-bottom: 1px solid #eee;
            text-align: center;
        }
        
        .modal-header h3 {
            margin: 0;
            color: #dc3545;
            font-size: 1.3em;
        }
        
        .modal-header i {
            margin-right: 8px;
            color: #ffc107;
        }
        
        .modal-body {
            padding: 20px;
            text-align: center;
        }
        
        .user-info {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
            border-left: 4px solid #007bff;
        }
        
        .user-email {
            color: #6c757d;
            font-size: 0.9em;
        }
        
        .user-type {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            font-weight: bold;
            margin-top: 5px;
        }
        
        .farmer-type {
            background: #28a745;
            color: white;
        }
        
        .customer-type {
            background: #17a2b8;
            color: white;
        }
        
        .warning-text {
            color: #dc3545;
            font-size: 0.9em;
            margin-top: 15px;
        }
        
        .warning-text i {
            margin-right: 5px;
        }
        
        .modal-footer {
            padding: 20px;
            border-top: 1px solid #eee;
            display: flex;
            gap: 10px;
            justify-content: center;
        }
        
        .btn-cancel, .btn-confirm-delete {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s ease;
        }
        
        .btn-cancel {
            background: #6c757d;
            color: white;
        }
        
        .btn-cancel:hover {
            background: #5a6268;
            transform: translateY(-1px);
        }
        
        .btn-confirm-delete {
            background: #dc3545;
            color: white;
        }
        
        .btn-confirm-delete:hover {
            background: #c82333;
            transform: translateY(-1px);
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes modalSlideIn {
            from { 
                opacity: 0;
                transform: translateY(-50px) scale(0.9);
            }
            to { 
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }
    `;
    
    document.head.appendChild(modalStyles);
    document.body.appendChild(modal);
    
    // Enfocar el modal para accesibilidad
    modal.querySelector('.btn-cancel').focus();
    
    // Cerrar modal con ESC
    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            closeDeleteModal();
        }
    };
    document.addEventListener('keydown', handleKeyDown);
    modal.handleKeyDown = handleKeyDown;
}

// Cerrar modal de eliminación
function closeDeleteModal() {
    const modal = document.querySelector('.delete-confirmation-modal');
    if (modal) {
        // Eliminar listener de teclado
        if (modal.handleKeyDown) {
            document.removeEventListener('keydown', modal.handleKeyDown);
        }
        
        // Animación de salida
        modal.querySelector('.modal-overlay').style.animation = 'fadeOut 0.3s ease-in';
        modal.querySelector('.modal-content').style.animation = 'modalSlideOut 0.3s ease-in';
        
        setTimeout(() => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        }, 300);
    }
}

// Ejecutar eliminación del usuario
async function executeDeleteUser(userId) {
    try {
        console.log('Eliminando usuario ID:', userId);
        
        // Cerrar modal
        closeDeleteModal();
        
        // Mostrar indicador de carga
        showLoadingIndicator('Eliminando usuario...');
        
        const usersBefore = users.length;
        users = users.filter(user => user.id !== userId);
        const usersAfter = users.length;
        
        const farmersBefore = farmers.length;
        farmers = farmers.filter(farmer => farmer.userId !== userId);
        const farmersAfter = farmers.length;
        
        const customersBefore = customers.length;
        customers = customers.filter(customer => customer.userId !== userId);
        const customersAfter = customers.length;
        
        // Guardar cambios en base de datos
        await saveToDatabase();
        
        // También eliminar de Firebase específicamente
        if (isFirebaseEnabled) {
            await deleteFromFirebase(userId);
        }
        
        console.log(`Usuario eliminado. Users: ${usersBefore}->${usersAfter}, Farmers: ${farmersBefore}->${farmersAfter}, Customers: ${customersBefore}->${customersAfter}`);
        
        // Ocultar indicador de carga
        hideLoadingIndicator();
        
        // Actualizar vista
        renderCurrentSheet();
        updateLastUpdate();
        
        showSuccess(`Usuario con ID ${userId} eliminado exitosamente`);
        
    } catch (error) {
        console.error('Error eliminando usuario:', error);
        hideLoadingIndicator();
        showError('Error al eliminar el usuario: ' + error.message);
    }
}

// Función para mostrar indicador de carga
function showLoadingIndicator(message = 'Cargando...') {
    // Remover indicador existente si existe
    hideLoadingIndicator();
    
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loadingIndicator';
    loadingDiv.className = 'loading-indicator';
    loadingDiv.innerHTML = `
        <div class="loading-overlay">
            <div class="loading-content">
                <div class="spinner"></div>
                <p>${message}</p>
            </div>
        </div>
    `;
    
    // Agregar estilos del loading
    const loadingStyles = document.createElement('style');
    loadingStyles.id = 'loadingStyles';
    loadingStyles.textContent = `
        .loading-indicator {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 9999;
        }
        
        .loading-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .loading-content {
            background: white;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        
        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #007bff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 15px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        
        @keyframes modalSlideOut {
            from { 
                opacity: 1;
                transform: translateY(0) scale(1);
            }
            to { 
                opacity: 0;
                transform: translateY(-50px) scale(0.9);
            }
        }
    `;
    
    if (!document.getElementById('loadingStyles')) {
        document.head.appendChild(loadingStyles);
    }
    document.body.appendChild(loadingDiv);
}

// Función para ocultar indicador de carga
function hideLoadingIndicator() {
    const loadingDiv = document.getElementById('loadingIndicator');
    if (loadingDiv) {
        document.body.removeChild(loadingDiv);
    }
}

// Función para actualizar datos manualmente - NUEVA FUNCIÓN ARREGLADA
async function refreshData() {
    try {
        console.log('=== ACTUALIZANDO DATOS MANUALMENTE ===');
        
        showLoadingIndicator('Actualizando datos...');
        
        // Recargar datos desde la fuente
        await loadDatabaseData();
        
        // Sincronizar datos
        syncUserData();
        
        // Actualizar vista actual
        if (document.getElementById('usersTableBody') || document.getElementById('farmersTableBody') || document.getElementById('customersTableBody')) {
            renderCurrentSheet();
        }
        
        // Actualizar dashboard si existe
        if (document.getElementById('totalUsers')) {
            renderDashboard();
        }
        
        hideLoadingIndicator();
        
        const status = isFirebaseEnabled ? 'Firebase' : 'localStorage';
        showSuccess(`Datos actualizados exitosamente desde ${status}`);
        
        console.log('Datos actualizados manualmente exitosamente');
        
    } catch (error) {
        console.error('Error actualizando datos:', error);
        hideLoadingIndicator();
        showError('Error al actualizar los datos: ' + error.message);
    }
}

// =================== FUNCIONES DE BÚSQUEDA ===================
function searchUsers(query) {
    if (!query.trim()) {
        renderUsers();
        return;
    }
    
    const filtered = users.filter(user => 
        user.name.toLowerCase().includes(query.toLowerCase()) ||
        user.lastName.toLowerCase().includes(query.toLowerCase()) ||
        user.email.toLowerCase().includes(query.toLowerCase()) ||
        user.id.toString().includes(query) ||
        user.type.toLowerCase().includes(query.toLowerCase())
    );
    
    renderUsers(filtered);
}

function searchFarmers(query) {
    if (!query.trim()) {
        renderFarmers();
        return;
    }
    
    const farmerUsers = users.filter(user => user.type === 'FARMER');
    const filtered = farmerUsers.filter(user => {
        const farmerData = farmers.find(f => f.userId === user.id) || {};
        return user.name.toLowerCase().includes(query.toLowerCase()) ||
               user.lastName.toLowerCase().includes(query.toLowerCase()) ||
               user.email.toLowerCase().includes(query.toLowerCase()) ||
               (user.location && user.location.toLowerCase().includes(query.toLowerCase())) ||
               (user.businessName && user.businessName.toLowerCase().includes(query.toLowerCase())) ||
               (farmerData.location && farmerData.location.toLowerCase().includes(query.toLowerCase())) ||
               (farmerData.business && farmerData.business.toLowerCase().includes(query.toLowerCase())) ||
               (farmerData.businessPhone && farmerData.businessPhone.includes(query)) ||
               user.id.toString().includes(query);
    });
    
    renderFarmers(filtered);
}

function searchCustomers(query) {
    if (!query.trim()) {
        renderCustomers();
        return;
    }
    
    const customerUsers = users.filter(user => user.type === 'CUSTOMER');
    const filtered = customerUsers.filter(user => {
        const customerData = customers.find(c => c.userId === user.id) || {};
        return user.name.toLowerCase().includes(query.toLowerCase()) ||
               user.lastName.toLowerCase().includes(query.toLowerCase()) ||
               user.email.toLowerCase().includes(query.toLowerCase()) ||
               (customerData.contactPhone && customerData.contactPhone.includes(query)) ||
               user.id.toString().includes(query);
    });
    
    renderCustomers(filtered);
}

// =================== FUNCIONES DE UTILIDAD ===================
function refreshCurrentView() {
    try {
        switch(currentSheet) {
            case 'farmers':
                renderFarmers();
                break;
            case 'customers':
                renderCustomers();
                break;
            case 'dashboard':
                renderDashboard();
                break;
            case 'usuarios':
                renderUsers();
                break;
        }
    } catch (error) {
        console.error('Error actualizando vista:', error);
    }
}

function validateUserData(userData) {
    const errors = [];
    
    if (!userData.name || userData.name.trim().length < 2) {
        errors.push('El nombre debe tener al menos 2 caracteres');
    }
    
    if (!userData.lastName || userData.lastName.trim().length < 2) {
        errors.push('El apellido debe tener al menos 2 caracteres');
    }
    
    if (!userData.email || !isValidEmail(userData.email)) {
        errors.push('Debe proporcionar un email válido');
    }
    
    if (!userData.password || userData.password.length < 6) {
        errors.push('La contraseña debe tener al menos 6 caracteres');
    }
    
    return errors;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

async function loginUser(email, password) {
    console.log('=== INICIANDO LOGIN ===');
    console.log('Email:', email);
    
    try {
        // Cargar datos más recientes antes del login
        await loadDatabaseData();
        
        const user = users.find(u => u.email === email && u.password === password);
        
        if (!user) {
            console.log('Usuario no encontrado o contraseña incorrecta');
            return { success: false, error: 'Email o contraseña incorrectos' };
        }
        
        if (user.status !== 'ACTIVO') {
            console.log('Usuario inactivo:', user.status);
            return { success: false, error: 'Usuario inactivo' };
        }
        
        console.log('Login exitoso para usuario:', user.name, user.lastName);
        return { success: true, user: user };
        
    } catch (error) {
        console.error('Error en login:', error);
        return { success: false, error: 'Error interno del servidor' };
    }
}

async function recoverPassword(email) {
    console.log('=== INICIANDO RECUPERACIÓN DE CONTRASEÑA ===');
    console.log('Email para recuperación:', email);
    
    try {
        // Cargar datos más recientes
        await loadDatabaseData();
        
        const user = users.find(u => u.email === email);
        
        if (!user) {
            console.log('Usuario no encontrado para recuperación');
            return { success: false, error: 'Email no registrado' };
        }
        
        if (user.status !== 'ACTIVO') {
            console.log('Usuario inactivo para recuperación:', user.status);
            return { success: false, error: 'Usuario inactivo' };
        }
        
        console.log('Contraseña encontrada para usuario:', user.name, user.lastName);
        return { 
            success: true, 
            message: 'Contraseña encontrada',
            password: user.password,
            user: {
                name: user.name,
                lastName: user.lastName,
                email: user.email
            }
        };
        
    } catch (error) {
        console.error('Error en recuperación de contraseña:', error);
        return { success: false, error: 'Error interno del servidor' };
    }
}

// =================== FUNCIONES DE EXPORTACIÓN ===================
function exportData(type) {
    let data = [];
    let filename = '';
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    
    switch(type) {
        case 'users':
            data = [
                ['ID', 'Tipo', 'Nombre', 'Apellido', 'Email', 'Telefono', 'Fecha_Registro', 'Estado'],
                ...users.map(u => [u.id, u.type, u.name, u.lastName, u.email, u.phone || '', u.date, u.status])
            ];
            filename = `agrotec_usuarios_${timestamp}.csv`;
            break;
            
        case 'farmers':
            const farmerUsers = users.filter(u => u.type === 'FARMER');
            data = [
                ['ID_Usuario', 'Nombre_Completo', 'Email', 'Telefono', 'Ubicacion', 'Nombre_Negocio', 'Telefono_Negocio', 'Fecha_Registro'],
                ...farmerUsers.map(user => {
                    const farmerData = farmers.find(f => f.userId === user.id) || {};
                    return [
                        user.id, 
                        `${user.name} ${user.lastName}`,
                        user.email,
                        user.phone || '',
                        user.location || farmerData.location || '',
                        user.businessName || farmerData.business || '',
                        user.businessPhone || farmerData.businessPhone || '',
                        user.date
                    ];
                })
            ];
            filename = `agrotec_farmers_${timestamp}.csv`;
            break;
            
        case 'customers':
            const customerUsers = users.filter(u => u.type === 'CUSTOMER');
            data = [
                ['ID_Usuario', 'Nombre_Completo', 'Email', 'Telefono', 'Telefono_Contacto', 'Fecha_Registro', 'Estado'],
                ...customerUsers.map(user => {
                    const customerData = customers.find(c => c.userId === user.id) || {};
                    return [
                        user.id,
                        `${user.name} ${user.lastName}`,
                        user.email,
                        user.phone || '',
                        customerData.contactPhone || '',
                        user.date,
                        user.status
                    ];
                })
            ];
            filename = `agrotec_customers_${timestamp}.csv`;
            break;
            
        default:
            console.error('Tipo de exportación no válido:', type);
            return;
    }
    
    // Convertir a CSV
    const csvContent = data.map(row => 
        row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    // Crear y descargar archivo
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log(`Datos exportados: ${filename}`);
    showSuccess(`Archivo ${filename} descargado exitosamente`);
}

// =================== FUNCIONES DE UTILIDAD ===================
function showError(message) {
    console.error('ERROR:', message);
    if (document.body) {
        showNotification(message, 'error');
    }
}

function showSuccess(message) {
    console.log('SUCCESS:', message);
    if (document.body) {
        showNotification(message, 'success');
    }
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        ${message}
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : '#dc3545'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 9999;
        animation: slideIn 0.3s ease-out;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES');
    } catch (error) {
        return dateString;
    }
}

// =================== FUNCIÓN PARA SINCRONIZAR DATOS ===================
function syncUserData() {
    try {
        const validUserIds = users.map(u => u.id);
        
        const farmersBefore = farmers.length;
        farmers = farmers.filter(f => validUserIds.includes(f.userId));
        
        const customersBefore = customers.length;
        customers = customers.filter(c => validUserIds.includes(c.userId));
        
        if (farmersBefore !== farmers.length || customersBefore !== customers.length) {
            console.log(`Datos sincronizados - Farmers: ${farmersBefore}->${farmers.length}, Customers: ${customersBefore}->${customers.length}`);
            // Guardar cambios después de sincronizar
            saveToDatabase().catch(err => console.error('Error guardando después de sincronizar:', err));
        }
        
    } catch (error) {
        console.error('Error sincronizando datos:', error);
    }
}

// =================== AUTO-REFRESH MEJORADO ===================
function startAutoRefresh() {
    if (!document.getElementById('usersTableBody')) {
        console.log('Auto-refresh no iniciado - no estamos en página de base de datos');
        return;
    }
    
    console.log('Iniciando auto-refresh cada 10 segundos...');
    
    setInterval(async () => {
        try {
            const currentUsersLength = users.length;
            const currentFarmersLength = farmers.length;
            const currentCustomersLength = customers.length;
            
            await loadDatabaseData();
            
            if (users.length !== currentUsersLength || 
                farmers.length !== currentFarmersLength || 
                customers.length !== currentCustomersLength) {
                console.log('Cambios detectados, actualizando vista...');
                syncUserData();
                renderCurrentSheet();
            }
        } catch (error) {
            console.error('Error en auto-refresh:', error);
        }
    }, 10000);
}

// =================== GESTIÓN DE EVENTOS ===================
function setupEventListeners() {
    // Event listeners para detectar cambios en localStorage
    window.addEventListener('storage', function(e) {
        if (e.key && e.key.startsWith('agrotec_')) {
            console.log('Cambios detectados en localStorage, actualizando...');
            loadDatabaseData();
            syncUserData();
        }
    });
    
    // Event listener para detectar cuando el usuario vuelve a la pestaña
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            loadDatabaseData();
            syncUserData();
        }
    });
    
    // Detectar cambios en focus de la ventana
    window.addEventListener('focus', function() {
        loadDatabaseData();
        syncUserData();
    });
    
    // Listener para cambios en Firebase (tiempo real)
    if (isFirebaseEnabled) {
        setupFirebaseListeners();
    }
}

// Configurar listeners de Firebase para tiempo real
function setupFirebaseListeners() {
    try {
        // Listener para usuarios
        db.collection('users').onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added" || change.type === "modified") {
                    console.log("Usuario actualizado en tiempo real:", change.doc.data());
                    loadDatabaseData(); // Recargar todos los datos
                }
            });
        });
        
        // Listener para farmers
        db.collection('farmers').onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added" || change.type === "modified") {
                    console.log("Farmer actualizado en tiempo real:", change.doc.data());
                    loadDatabaseData(); // Recargar todos los datos
                }
            });
        });
        
        // Listener para customers
        db.collection('customers').onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added" || change.type === "modified") {
                    console.log("Customer actualizado en tiempo real:", change.doc.data());
                    loadDatabaseData(); // Recargar todos los datos
                }
            });
        });
        
        console.log('Listeners de Firebase configurados para actualizaciones en tiempo real');
    } catch (error) {
        console.error('Error configurando listeners de Firebase:', error);
    }
}

// =================== INICIALIZACIÓN ===================
async function initDatabase() {
    console.log('=== INICIALIZANDO BASE DE DATOS AGROTEC ===');
    
    // Inicializar Firebase primero
    initializeFirebase();
    
    // Esperar un momento para que Firebase se inicialice
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Cargar datos iniciales
    await loadDatabaseData();
    
    // Sincronizar datos
    syncUserData();
    
    // Configurar event listeners
    setupEventListeners();
    
    // Iniciar auto-refresh
    startAutoRefresh();
    
    // Renderizar vista inicial solo si los elementos existen
    if (document.getElementById('usersTableBody')) {
        renderCurrentSheet();
    }
    
    const status = isFirebaseEnabled ? 'Firebase (en línea)' : 'localStorage (local)';
    console.log(`Base de datos inicializada correctamente usando: ${status}`);
    console.log(`Estado inicial: ${users.length} usuarios, ${farmers.length} farmers, ${customers.length} customers`);
}

// =================== FUNCIONES GLOBALES PARA FORMULARIOS ===================

// Funciones globales para formularios (ahora async donde sea necesario)
window.registerUser = registerUser;
window.loginUser = loginUser;
window.recoverPassword = recoverPassword;

// NUEVA - Función global para refrescar datos
window.refreshData = refreshData;

// Funciones de debugging mejoradas
window.databaseDebug = {
    showData: () => {
        const data = { 
            users, 
            farmers, 
            customers,
            isFirebaseEnabled,
            status: isFirebaseEnabled ? 'Firebase (en línea)' : 'localStorage (local)'
        };
        console.log('=== DATOS ACTUALES EN BASE DE DATOS ===');
        console.log('Status:', data.status);
        console.log('Users:', users);
        console.log('Farmers:', farmers);
        console.log('Customers:', customers);
        console.log('Total registros:', users.length + farmers.length + customers.length);
        return data;
    },
    
    clearAll: async () => {
        if (!confirm('¿Estás seguro de eliminar TODOS los datos? Esta acción no se puede deshacer.')) {
            return;
        }
        
        try {
            // Limpiar Firebase si está disponible
            if (isFirebaseEnabled) {
                const batch = db.batch();
                
                // Eliminar todos los usuarios
                const usersSnapshot = await db.collection('users').get();
                usersSnapshot.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });
                
                // Eliminar todos los farmers
                const farmersSnapshot = await db.collection('farmers').get();
                farmersSnapshot.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });
                
                // Eliminar todos los customers
                const customersSnapshot = await db.collection('customers').get();
                customersSnapshot.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });
                
                await batch.commit();
                console.log('Datos eliminados de Firebase');
            }
            
            // Limpiar localStorage
            localStorage.removeItem('agrotec_users');
            localStorage.removeItem('agrotec_farmers');
            localStorage.removeItem('agrotec_customers');
            
            // Limpiar arrays locales
            users = [];
            farmers = [];
            customers = [];
            
            await loadDatabaseData();
            
            console.log('Todos los datos eliminados');
            showSuccess('Todos los datos eliminados');
            
        } catch (error) {
            console.error('Error eliminando datos:', error);
            showError('Error eliminando datos: ' + error.message);
        }
    },
    
    // Resto de funciones de debugging actualizadas para ser async
    addSampleFarmer: async () => {
        const maxId = Math.max(0, ...users.map(u => u.id)) + 1;
        const currentDate = new Date().toLocaleDateString('es-ES');
        
        const testFarmerData = {
            name: 'Test',
            lastName: 'Farmer',
            email: `testfarmer${maxId}@farm.com`,
            password: 'test123',
            farmerPhone: '6000-0000',
            userType: 'farmer',
            location: 'Ciudad de Panamá, Panamá',
            businessName: 'Finca Test Business',
            businessPhone: '6000-0001'
        };
        
        const result = await registerUser(testFarmerData);
        console.log('Farmer de prueba agregado:', result);
        return result;
    },
    
    addSampleCustomer: async () => {
        const maxId = Math.max(0, ...users.map(u => u.id)) + 1;
        
        const testCustomerData = {
            name: 'Test',
            lastName: 'Customer',
            email: `testcustomer${maxId}@customer.com`,
            password: 'test123',
            phone: '6000-2222',
            userType: 'customer'
        };
        
        const result = await registerUser(testCustomerData);
        console.log('Customer de prueba agregado:', result);
        return result;
    },
    
    refresh: refreshData, // Usando la nueva función
    
    // Funciones directas para agregar datos
    addUser: addUser,
    addFarmer: addFarmer,
    addCustomer: addCustomer,
    
    testRegister: async () => {
        console.log('=== EJECUTANDO TEST DE REGISTRO ===');
        
        const testFarmerData = {
            name: 'Juan',
            lastName: 'Pérez',
            email: 'juan.perez@testfarm.com',
            password: '123456',
            farmerPhone: '6000-0000',
            userType: 'farmer',
            location: 'Ciudad de Panamá',
            businessName: 'Finca Juan',
            businessPhone: '6000-0001'
        };
        
        const testCustomerData = {
            name: 'María',
            lastName: 'García',
            email: 'maria.garcia@testcustomer.com',
            password: '123456',
            phone: '6000-2222',
            userType: 'customer'
        };
        
        console.log('Probando registro de farmer...');
        const farmerResult = await registerUser(testFarmerData);
        console.log('Resultado farmer:', farmerResult);
        
        console.log('Probando registro de customer...');
        const customerResult = await registerUser(testCustomerData);
        console.log('Resultado customer:', customerResult);
        
        return { farmerResult, customerResult };
    },
    
    checkIntegrity: () => {
        console.log('=== VERIFICANDO INTEGRIDAD DE DATOS ===');
        
        let issues = [];
        
        farmers.forEach(farmer => {
            const user = users.find(u => u.id === farmer.userId);
            if (!user) {
                issues.push(`Farmer con userId ${farmer.userId} no tiene usuario correspondiente`);
            } else if (user.type !== 'FARMER') {
                issues.push(`Usuario ${user.id} no es de tipo FARMER pero tiene entrada en farmers`);
            }
        });
        
        customers.forEach(customer => {
            const user = users.find(u => u.id === customer.userId);
            if (!user) {
                issues.push(`Customer con userId ${customer.userId} no tiene usuario correspondiente`);
            } else if (user.type !== 'CUSTOMER') {
                issues.push(`Usuario ${user.id} no es de tipo CUSTOMER pero tiene entrada en customers`);
            }
        });
        
        const emails = users.map(u => u.email);
        const duplicateEmails = emails.filter((email, index) => emails.indexOf(email) !== index);
        if (duplicateEmails.length > 0) {
            issues.push(`Emails duplicados encontrados: ${duplicateEmails.join(', ')}`);
        }
        
        if (issues.length === 0) {
            console.log('✅ Integridad de datos OK');
            showSuccess('Integridad de datos verificada correctamente');
        } else {
            console.error('❌ Problemas de integridad encontrados:', issues);
            showError(`Problemas encontrados: ${issues.length}`);
            issues.forEach(issue => console.error('- ' + issue));
        }
        
        return { issues, isValid: issues.length === 0 };
    },
    
    getStats: () => {
        const stats = {
            totalUsers: users.length,
            totalFarmers: users.filter(u => u.type === 'FARMER').length,
            totalCustomers: users.filter(u => u.type === 'CUSTOMER').length,
            activeUsers: users.filter(u => u.status === 'ACTIVO').length,
            inactiveUsers: users.filter(u => u.status !== 'ACTIVO').length,
            farmersWithBusiness: farmers.filter(f => f.business && f.business.trim() !== '').length,
            farmersWithLocation: farmers.filter(f => f.location && f.location.trim() !== '').length,
            customersWithPhone: customers.filter(c => c.contactPhone && c.contactPhone.trim() !== '').length,
            databaseType: isFirebaseEnabled ? 'Firebase (en línea)' : 'localStorage (local)',
            recentUsers: users.filter(u => {
                try {
                    const userDate = new Date(u.date.split('/').reverse().join('-'));
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return userDate >= weekAgo;
                } catch {
                    return false;
                }
            }).length
        };
        
        console.log('=== ESTADÍSTICAS DE LA BASE DE DATOS ===');
        console.table(stats);
        return stats;
    },
    
    cleanData: async () => {
        console.log('=== LIMPIANDO DATOS CORRUPTOS ===');
        
        let cleaned = 0;
        
        const originalFarmers = farmers.length;
        farmers = farmers.filter(farmer => {
            const user = users.find(u => u.id === farmer.userId);
            return user && user.type === 'FARMER';
        });
        cleaned += originalFarmers - farmers.length;
        
        const originalCustomers = customers.length;
        customers = customers.filter(customer => {
            const user = users.find(u => u.id === customer.userId);
            return user && user.type === 'CUSTOMER';
        });
        cleaned += originalCustomers - customers.length;
        
        const originalUsers = users.length;
        users = users.filter(user => user.type === 'FARMER' || user.type === 'CUSTOMER');
        cleaned += originalUsers - users.length;
        
        // Guardar datos limpios
        await saveToDatabase();
        
        console.log(`Datos limpiados: ${cleaned} registros corruptos eliminados`);
        showSuccess(`${cleaned} registros corruptos eliminados`);
        
        await loadDatabaseData();
        return { cleaned };
    }
};

// Funciones adicionales para compatibilidad
window.loadDatabaseData = loadDatabaseData;
window.showSheet = showSheet;
window.searchUsers = searchUsers;
window.searchFarmers = searchFarmers;
window.searchCustomers = searchCustomers;
window.deleteUser = executeDeleteUser;  // Actualizado para usar la nueva función
window.confirmDeleteUser = confirmDeleteUser;  // Nueva función global
window.closeDeleteModal = closeDeleteModal;  // Nueva función global
window.exportData = exportData;

// =================== EJECUCIÓN AL CARGAR ===================
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado, inicializando base de datos...');
    
    // Agregar estilos mejorados para botones de eliminación y notificaciones
    const style = document.createElement('style');
    style.textContent = `
        .btn-delete {
            background: #dc3545;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 12px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 35px;
            height: 35px;
        }
        
        .btn-delete:hover {
            background: #c82333;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(220, 53, 69, 0.3);
        }
        
        .btn-delete:active {
            transform: translateY(0);
        }
        
        .btn-delete i {
            font-size: 14px;
        }
        
        /* Estilos para las filas de la tabla */
        tbody tr {
            transition: background-color 0.2s ease;
        }
        
        tbody tr:hover {
            background-color: rgba(0, 123, 255, 0.05);
        }
        
        /* Estilos para las notificaciones */
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
        
        .notification {
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 500;
            border-left: 4px solid rgba(255, 255, 255, 0.3);
        }
        
        .notification i {
            font-size: 18px;
            flex-shrink: 0;
        }
        
        /* Estilos para botones de acción mejorados */
        .action-buttons {
            display: flex;
            gap: 8px;
            justify-content: center;
            align-items: center;
        }
        
        /* Estilos responsivos para móvil */
        @media (max-width: 768px) {
            .btn-delete {
                padding: 6px 8px;
                font-size: 11px;
                min-width: 30px;
                height: 30px;
            }
            
            .notification {
                max-width: calc(100vw - 40px);
                right: 20px;
                left: 20px;
                font-size: 14px;
            }
        }
        
        /* Estilos para estados de carga */
        .table-loading {
            opacity: 0.6;
            pointer-events: none;
        }
        
        /* Animación de pulso para indicar carga */
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        
        .loading-pulse {
            animation: pulse 1.5s infinite;
        }
        
        /* Mejoras visuales para empty states */
        .empty-state {
            text-align: center;
            padding: 40px 20px;
            color: #6c757d;
        }
        
        .empty-state i {
            font-size: 48px;
            margin-bottom: 15px;
            opacity: 0.5;
        }
        
        .empty-state p {
            margin: 0;
            font-size: 16px;
            font-weight: 500;
        }
        
        /* Estilos para tipos de usuario */
        .farmer-type {
            background: #e8f5e8;
            color: #000000;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.85em;
            font-weight: bold;
            border: 1px solid #28a745;
        }
        
        .customer-type {
            background: #e6f3ff;
            color: #000000;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.85em;
            font-weight: bold;
            border: 1px solid #17a2b8;
        }
        
        /* Asegurar que el texto en las celdas sea negro */
        td .farmer-type,
        td .customer-type {
            color: #000000 !important;
        }
        
        /* Estilo general para celdas de tabla */
        tbody td {
            color: #000000;
        }
        
        /* Estilos para estados */
        .status-active {
            color: #28a745;
            font-weight: bold;
        }
        
        .status-inactive {
            color: #dc3545;
            font-weight: bold;
        }
    `;
    document.head.appendChild(style);
    
    initDatabase();
});

// Inicialización de respaldo
if (document.readyState === 'loading') {
    console.log('Esperando carga del DOM...');
} else {
    console.log('DOM ya cargado, inicializando inmediatamente...');
    initDatabase();
}
