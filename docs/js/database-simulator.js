// =================== VARIABLES GLOBALES ===================
let users = [];
let farmers = [];
let customers = [];
let currentSheet = 'usuarios';

// =================== FUNCIONES DE CARGA DE DATOS ===================
function loadDatabaseData() {
    console.log('Cargando datos de la base de datos...');
    
    try {
        users = JSON.parse(localStorage.getItem('agrotec_users')) || [];
        farmers = JSON.parse(localStorage.getItem('agrotec_farmers')) || [];
        customers = JSON.parse(localStorage.getItem('agrotec_customers')) || [];
        
        console.log('Datos cargados:', { 
            users: users.length, 
            farmers: farmers.length, 
            customers: customers.length 
        });
        
        // Solo renderizar si los elementos DOM existen
        if (document.getElementById('usersTableBody') || document.getElementById('farmersTableBody')) {
            renderCurrentSheet();
        }
        
        // Solo actualizar si los elementos existen
        updateLastUpdate();
        
    } catch (error) {
        console.error('Error cargando datos:', error);
        showError('Error cargando datos de la base de datos: ' + error.message);
    }
}

function updateLastUpdate() {
    try {
        const now = new Date().toLocaleString('es-ES');
        
        const lastUpdateEl = document.getElementById('lastUpdate');
        const footerUpdateEl = document.getElementById('footerUpdate');
        const totalRecordsEl = document.getElementById('totalRecords');
        
        if (lastUpdateEl) lastUpdateEl.textContent = now;
        if (footerUpdateEl) footerUpdateEl.textContent = `Ultima actualizacion: ${now}`;
        if (totalRecordsEl) totalRecordsEl.textContent = users.length + farmers.length + customers.length;
        
    } catch (error) {
        console.log('Elementos de actualizacion no encontrados (normal en pagina de login)');
    }
}

// =================== FUNCIONES DE NAVEGACION ===================
function showSheet(sheetName) {
    // Verificar que los elementos existan antes de manipularlos
    const sheets = document.querySelectorAll('.sheet');
    const tabs = document.querySelectorAll('.tab');
    
    if (sheets.length === 0 || tabs.length === 0) {
        console.log('Elementos de navegacion no encontrados');
        return;
    }
    
    // Ocultar todas las hojas
    sheets.forEach(sheet => sheet.classList.remove('active'));
    tabs.forEach(tab => tab.classList.remove('active'));

    // Mostrar la hoja seleccionada
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
    // Solo renderizar si estamos en la pagina de base de datos
    if (!document.getElementById('usersTableBody')) {
        console.log('Tabla de usuarios no encontrada - probablemente en pagina de login');
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
                <button class="btn-delete" onclick="deleteUser(${user.id})" title="Eliminar usuario">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// =================== FUNCIONES CORREGIDAS PARA FARMERS ===================
function renderFarmers(filteredFarmers = null) {
    const tbody = document.getElementById('farmersTableBody');
    if (!tbody) {
        console.log('Tabla de farmers no encontrada');
        return;
    }
    
    // CORRECCION: Filtrar solo usuarios de tipo FARMER
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
        // CORRECCION PRINCIPAL: Buscar datos de farmer correctamente
        const farmerData = farmers.find(f => f.userId === user.id) || {};
        
        // CORRECCION: Usar los campos correctos del farmer
        const location = farmerData.location || user.location || 'No especificado';
        const businessName = farmerData.business || farmerData.businessName || user.businessName || 'No especificado';
        const businessPhone = farmerData.businessPhone || user.businessPhone || user.phone || 'No especificado';
        
        console.log(`Farmer ID ${user.id}:`, { location, businessName, businessPhone, farmerData });
        
        return `
            <tr>
                <td>${user.id}</td>
                <td>${user.name} ${user.lastName}</td>
                <td>${location}</td>
                <td>${businessName}</td>
                <td>${businessPhone}</td>
                <td>${user.date}</td>
                <td>
                    <button class="btn-delete" onclick="deleteUser(${user.id})" title="Eliminar farmer">
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
    
    // Filtrar solo usuarios de tipo CUSTOMER
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
        // Buscar datos adicionales del customer si existen
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
                    <button class="btn-delete" onclick="deleteUser(${user.id})" title="Eliminar customer">
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

// Funcion principal para agregar un nuevo usuario - CORREGIDA
function addUser(userData) {
    try {
        console.log('Agregando usuario base:', userData);
        
        // Generar nuevo ID
        const maxId = Math.max(0, ...users.map(u => u.id)) + 1;
        const currentDate = new Date().toLocaleDateString('es-ES');
        
        // Verificar si el email ya existe
        if (users.some(u => u.email === userData.email)) {
            throw new Error('El email ya esta registrado');
        }
        
        // CORRECCION: Crear objeto usuario incluyendo TODOS los campos del farmer
        const newUser = {
            id: maxId,
            type: userData.type || 'CUSTOMER',
            name: userData.name,
            lastName: userData.lastName,
            email: userData.email,
            password: userData.password,
            phone: userData.phone || '',
            // CORRECCION PRINCIPAL: Agregar campos específicos de farmer al usuario base
            location: userData.location || '',
            businessName: userData.businessName || userData.business || '',
            businessPhone: userData.businessPhone || '',
            date: currentDate,
            status: 'ACTIVO'
        };
        
        // Agregar a la array de usuarios
        users.push(newUser);
        
        // Guardar en localStorage
        localStorage.setItem('agrotec_users', JSON.stringify(users));
        
        console.log('Usuario base agregado exitosamente:', newUser);
        return { success: true, user: newUser };
        
    } catch (error) {
        console.error('Error agregando usuario base:', error);
        return { success: false, error: error.message };
    }
}

// CORRECCION PRINCIPAL: Función mejorada para agregar farmer
function addFarmer(userData, farmerData) {
    try {
        console.log('Iniciando registro de farmer...');
        console.log('Datos de usuario recibidos:', userData);
        console.log('Datos de farmer recibidos:', farmerData);
        
        // CORRECCION: Combinar todos los datos correctamente
        const combinedData = {
            ...userData,
            type: 'FARMER',
            location: farmerData.location || userData.location || '',
            businessName: farmerData.business || farmerData.businessName || userData.businessName || '',
            business: farmerData.business || farmerData.businessName || userData.businessName || '',
            businessPhone: farmerData.businessPhone || userData.businessPhone || userData.phone || '',
            phone: userData.phone || farmerData.businessPhone || ''
        };
        
        console.log('Datos combinados para farmer:', combinedData);
        
        // Agregar usuario base con todos los datos
        const userResult = addUser(combinedData);
        
        if (!userResult.success) {
            console.error('Error creando usuario base para farmer:', userResult.error);
            return userResult;
        }
        
        const currentDate = new Date().toLocaleDateString('es-ES');
        
        // CORRECCION: Crear objeto farmer con los datos correctos
        const newFarmer = {
            userId: userResult.user.id,
            location: combinedData.location,
            business: combinedData.business,
            businessName: combinedData.businessName, // Campo adicional por si acaso
            businessPhone: combinedData.businessPhone,
            date: currentDate
        };
        
        // Agregar a la array de farmers
        farmers.push(newFarmer);
        
        // Guardar en localStorage
        localStorage.setItem('agrotec_farmers', JSON.stringify(farmers));
        
        console.log('Farmer agregado exitosamente:');
        console.log('- Usuario:', userResult.user);
        console.log('- Farmer:', newFarmer);
        
        showSuccess(`Farmer ${userData.name} ${userData.lastName} registrado exitosamente`);
        
        // Actualizar vista si estamos en la página de base de datos
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

// Funcion especifica para agregar customer
function addCustomer(userData, customerData) {
    try {
        console.log('Iniciando registro de customer...');
        console.log('Datos de usuario:', userData);
        console.log('Datos de customer:', customerData);
        
        // Primero agregar el usuario base
        const userResult = addUser({ ...userData, type: 'CUSTOMER' });
        
        if (!userResult.success) {
            console.error('Error creando usuario base para customer:', userResult.error);
            return userResult;
        }
        
        const currentDate = new Date().toLocaleDateString('es-ES');
        
        // Crear objeto customer
        const newCustomer = {
            userId: userResult.user.id,
            contactPhone: customerData.contactPhone || userData.phone || '',
            date: currentDate
        };
        
        // Agregar a la array de customers
        customers.push(newCustomer);
        
        // Guardar en localStorage
        localStorage.setItem('agrotec_customers', JSON.stringify(customers));
        
        console.log('Customer agregado exitosamente:', newCustomer);
        showSuccess(`Customer ${userData.name} ${userData.lastName} registrado exitosamente`);
        
        // Actualizar vista solo si estamos en la pagina de base de datos
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

// Funcion para actualizar vistas
function refreshCurrentView() {
    try {
        if (currentSheet === 'farmers') {
            renderFarmers();
        } else if (currentSheet === 'customers') {
            renderCustomers();
        } else if (currentSheet === 'dashboard') {
            renderDashboard();
        } else if (currentSheet === 'usuarios') {
            renderUsers();
        }
    } catch (error) {
        console.error('Error actualizando vista:', error);
    }
}

// Funcion para validar datos de usuario
function validateUserData(userData) {
    const errors = [];
    
    if (!userData.name || userData.name.trim().length < 2) {
        errors.push('El nombre debe tener al menos 2 caracteres');
    }
    
    if (!userData.lastName || userData.lastName.trim().length < 2) {
        errors.push('El apellido debe tener al menos 2 caracteres');
    }
    
    if (!userData.email || !isValidEmail(userData.email)) {
        errors.push('Debe proporcionar un email valido');
    }
    
    if (!userData.password || userData.password.length < 6) {
        errors.push('La contrasena debe tener al menos 6 caracteres');
    }
    
    return errors;
}

// Funcion para validar email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// =================== FUNCION PRINCIPAL CORREGIDA ===================

// CORRECCION PRINCIPAL: Función registerUser mejorada
function registerUser(formData) {
    console.log('=== INICIANDO REGISTRO DE USUARIO ===');
    console.log('Datos recibidos del formulario:', formData);
    
    try {
        // Validar datos
        const validationErrors = validateUserData(formData);
        if (validationErrors.length > 0) {
            console.error('Errores de validacion:', validationErrors);
            showError('Errores de validacion: ' + validationErrors.join(', '));
            return { success: false, errors: validationErrors };
        }
        
        // Normalizar tipo de usuario
        const userType = (formData.userType || 'customer').toLowerCase();
        console.log('Tipo de usuario normalizado:', userType);
        
        // Registrar segun el tipo
        if (userType === 'farmer') {
            console.log('Registrando como FARMER...');
            
            // CORRECCION PRINCIPAL: Mapear correctamente todos los campos
            const farmerUserData = {
                name: formData.name,
                lastName: formData.lastName,
                email: formData.email,
                password: formData.password,
                phone: formData.farmerPhone || formData.businessPhone || formData.phone || '', // Teléfono del negocio
                businessPhone: formData.farmerPhone || formData.businessPhone || formData.phone || ''
            };
            
            const farmerSpecificData = {
                location: formData.location || '',
                business: formData.businessName || formData.business || '',
                businessName: formData.businessName || formData.business || '',
                businessPhone: formData.farmerPhone || formData.businessPhone || formData.phone || ''
            };
            
            console.log('Datos de farmer procesados:');
            console.log('- Usuario:', farmerUserData);
            console.log('- Farmer específico:', farmerSpecificData);
            
            const result = addFarmer(farmerUserData, farmerSpecificData);
            
            console.log('Resultado registro farmer:', result);
            return result;
            
        } else {
            console.log('Registrando como CUSTOMER...');
            
            const result = addCustomer(
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
            
            console.log('Resultado registro customer:', result);
            return result;
        }
        
    } catch (error) {
        console.error('Error general en registerUser:', error);
        showError('Error interno: ' + error.message);
        return { success: false, error: 'Error interno: ' + error.message };
    }
}

// Funcion para login (validar usuario existente)
function loginUser(email, password) {
    console.log('=== INICIANDO LOGIN ===');
    console.log('Email:', email);
    
    try {
        // Buscar usuario
        const user = users.find(u => u.email === email && u.password === password);
        
        if (!user) {
            console.log('Usuario no encontrado o contrasena incorrecta');
            return { success: false, error: 'Email o contrasena incorrectos' };
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

// Funcion para recuperacion de contraseña
function recoverPassword(email) {
    console.log('=== INICIANDO RECUPERACION DE CONTRASEÑA ===');
    console.log('Email para recuperacion:', email);
    
    try {
        // Buscar usuario por email
        const user = users.find(u => u.email === email);
        
        if (!user) {
            console.log('Usuario no encontrado para recuperacion');
            return { success: false, error: 'Email no registrado' };
        }
        
        if (user.status !== 'ACTIVO') {
            console.log('Usuario inactivo para recuperacion:', user.status);
            return { success: false, error: 'Usuario inactivo' };
        }
        
        // En un sistema real, aqui enviarías un email
        // Por ahora, devolvemos la contraseña directamente
        console.log('Contraseña encontrada para usuario:', user.name, user.lastName);
        return { 
            success: true, 
            message: 'Contraseña encontrada',
            password: user.password, // En producción, enviarías un email en lugar de esto
            user: {
                name: user.name,
                lastName: user.lastName,
                email: user.email
            }
        };
        
    } catch (error) {
        console.error('Error en recuperacion de contraseña:', error);
        return { success: false, error: 'Error interno del servidor' };
    }
}

// =================== FUNCIONES DE ELIMINACION ===================
function deleteUser(userId) {
    if (!confirm(`Estas seguro de que deseas eliminar el usuario con ID ${userId}? Esta accion no se puede deshacer.`)) {
        return;
    }
    
    try {
        console.log('Eliminando usuario ID:', userId);
        
        // Eliminar de la tabla usuarios
        const usersBefore = users.length;
        users = users.filter(user => user.id !== userId);
        const usersAfter = users.length;
        
        // Eliminar de farmers si existe
        const farmersBefore = farmers.length;
        farmers = farmers.filter(farmer => farmer.userId !== userId);
        const farmersAfter = farmers.length;
        
        // Eliminar de customers si existe
        const customersBefore = customers.length;
        customers = customers.filter(customer => customer.userId !== userId);
        const customersAfter = customers.length;
        
        // Guardar cambios en localStorage
        localStorage.setItem('agrotec_users', JSON.stringify(users));
        localStorage.setItem('agrotec_farmers', JSON.stringify(farmers));
        localStorage.setItem('agrotec_customers', JSON.stringify(customers));
        
        console.log(`Usuario eliminado. Users: ${usersBefore}->${usersAfter}, Farmers: ${farmersBefore}->${farmersAfter}, Customers: ${customersBefore}->${customersAfter}`);
        
        // Refrescar vista
        renderCurrentSheet();
        updateLastUpdate();
        
        showSuccess(`Usuario con ID ${userId} eliminado exitosamente`);
        
    } catch (error) {
        console.error('Error eliminando usuario:', error);
        showError('Error al eliminar el usuario');
    }
}

// =================== FUNCIONES DE BUSQUEDA CORREGIDAS ===================
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
    
    // Buscar dentro de usuarios de tipo FARMER
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
    
    // Buscar dentro de usuarios de tipo CUSTOMER
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

// =================== FUNCIONES DE EXPORTACION ===================
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
            // Exportar solo usuarios de tipo FARMER
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
            // Exportar solo usuarios de tipo CUSTOMER
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
            console.error('Tipo de exportacion no valido:', type);
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
    // Solo mostrar notificacion si estamos en una pagina con interfaz
    if (document.body) {
        showNotification(message, 'error');
    }
}

function showSuccess(message) {
    console.log('SUCCESS:', message);
    // Solo mostrar notificacion si estamos en una pagina con interfaz
    if (document.body) {
        showNotification(message, 'success');
    }
}

function showNotification(message, type) {
    // Crear elemento de notificacion
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        ${message}
    `;
    
    // Estilos inline
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
    
    // Remover despues de 4 segundos
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

// =================== FUNCION PARA SINCRONIZAR DATOS ===================
function syncUserData() {
    try {
        const validUserIds = users.map(u => u.id);
        
        // Limpiar farmers huerfanos
        const farmersBefore = farmers.length;
        farmers = farmers.filter(f => validUserIds.includes(f.userId));
        
        // Limpiar customers huerfanos
        const customersBefore = customers.length;
        customers = customers.filter(c => validUserIds.includes(c.userId));
        
        // Guardar datos limpios
        localStorage.setItem('agrotec_farmers', JSON.stringify(farmers));
        localStorage.setItem('agrotec_customers', JSON.stringify(customers));
        
        if (farmersBefore !== farmers.length || customersBefore !== customers.length) {
            console.log(`Datos sincronizados - Farmers: ${farmersBefore}->${farmers.length}, Customers: ${customersBefore}->${customers.length}`);
        }
        
    } catch (error) {
        console.error('Error sincronizando datos:', error);
    }
}

// =================== AUTO-REFRESH ===================
function startAutoRefresh() {
    // Solo iniciar auto-refresh si estamos en la pagina de base de datos
    if (!document.getElementById('usersTableBody')) {
        console.log('Auto-refresh no iniciado - no estamos en pagina de base de datos');
        return;
    }
    
    console.log('Iniciando auto-refresh cada 3 segundos...');
    
    setInterval(() => {
        const currentUsersLength = users.length;
        const currentFarmersLength = farmers.length;
        const currentCustomersLength = customers.length;
        
        loadDatabaseData();
        
        if (users.length !== currentUsersLength || 
            farmers.length !== currentFarmersLength || 
            customers.length !== currentCustomersLength) {
            console.log('Cambios detectados, actualizando vista...');
            syncUserData();
        }
    }, 3000);
}

// =================== GESTION DE EVENTOS ===================
function setupEventListeners() {
    // Event listeners para detectar cambios en localStorage
    window.addEventListener('storage', function(e) {
        if (e.key && e.key.startsWith('agrotec_')) {
            console.log('Cambios detectados en localStorage, actualizando...');
            loadDatabaseData();
            syncUserData();
        }
    });
    
    // Event listener para detectar cuando el usuario vuelve a la pestana
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
}

// =================== INICIALIZACION ===================
function initDatabase() {
    console.log('=== INICIALIZANDO BASE DE DATOS AGROTEC ===');
    
    // Cargar datos iniciales
    loadDatabaseData();
    
    // Sincronizar datos
    syncUserData();
    
    // Configurar event listeners
    setupEventListeners();
    
    // Iniciar auto-refresh solo si estamos en la pagina correcta
    startAutoRefresh();
    
    // Renderizar vista inicial solo si los elementos existen
    if (document.getElementById('usersTableBody')) {
        renderCurrentSheet();
    }
    
    console.log('Base de datos inicializada correctamente');
    console.log(`Estado inicial: ${users.length} usuarios, ${farmers.length} farmers, ${customers.length} customers`);
}

// =================== FUNCIONES GLOBALES PARA FORMULARIOS ===================

// Funcion global para que tu formulario pueda llamarla
window.registerUser = registerUser;
window.loginUser = loginUser;
window.recoverPassword = recoverPassword;

// Tambien exponer las otras funciones para debugging y uso externo
window.databaseDebug = {
    showData: () => {
        const data = { users, farmers, customers };
        console.log('=== DATOS ACTUALES EN BASE DE DATOS ===');
        console.log('Users:', users);
        console.log('Farmers:', farmers);
        console.log('Customers:', customers);
        console.log('Total registros:', users.length + farmers.length + customers.length);
        return data;
    },
    
    clearAll: () => {
        if (!confirm('Estas seguro de eliminar TODOS los datos? Esta accion no se puede deshacer.')) {
            return;
        }
        
        localStorage.removeItem('agrotec_users');
        localStorage.removeItem('agrotec_farmers');
        localStorage.removeItem('agrotec_customers');
        
        users = [];
        farmers = [];
        customers = [];
        
        loadDatabaseData();
        console.log('Todos los datos eliminados');
        showSuccess('Todos los datos eliminados');
    },
    
    addSampleFarmer: () => {
        const maxId = Math.max(0, ...users.map(u => u.id)) + 1;
        const currentDate = new Date().toLocaleDateString('es-ES');
        
        const sampleUser = {
            id: maxId,
            type: 'FARMER',
            name: 'Test',
            lastName: 'Farmer',
            email: `testfarmer${maxId}@farm.com`,
            password: 'test123',
            phone: '6000-0000',
            location: 'Ciudad de Panama, Panama',
            businessName: 'Finca Test Business',
            businessPhone: '6000-0001',
            date: currentDate,
            status: 'ACTIVO'
        };
        
        const sampleFarmer = {
            userId: maxId,
            location: 'Ciudad de Panama, Panama',
            business: 'Finca Test Business',
            businessName: 'Finca Test Business',
            businessPhone: '6000-0001',
            date: currentDate
        };
        
        users.push(sampleUser);
        farmers.push(sampleFarmer);
        
        localStorage.setItem('agrotec_users', JSON.stringify(users));
        localStorage.setItem('agrotec_farmers', JSON.stringify(farmers));
        
        loadDatabaseData();
        console.log('Farmer de prueba agregado:', sampleUser);
        showSuccess('Farmer de prueba agregado');
        return { user: sampleUser, farmer: sampleFarmer };
    },
    
    addSampleCustomer: () => {
        const maxId = Math.max(0, ...users.map(u => u.id)) + 1;
        const currentDate = new Date().toLocaleDateString('es-ES');
        
        const sampleUser = {
            id: maxId,
            type: 'CUSTOMER',
            name: 'Test',
            lastName: 'Customer',
            email: `testcustomer${maxId}@customer.com`,
            password: 'test123',
            phone: '6000-2222',
            date: currentDate,
            status: 'ACTIVO'
        };
        
        const sampleCustomer = {
            userId: maxId,
            contactPhone: '6000-2222',
            date: currentDate
        };
        
        users.push(sampleUser);
        customers.push(sampleCustomer);
        
        localStorage.setItem('agrotec_users', JSON.stringify(users));
        localStorage.setItem('agrotec_customers', JSON.stringify(customers));
        
        loadDatabaseData();
        console.log('Customer de prueba agregado:', sampleUser);
        showSuccess('Customer de prueba agregado');
        return { user: sampleUser, customer: sampleCustomer };
    },
    
    refresh: () => {
        console.log('Actualizando datos manualmente...');
        loadDatabaseData();
        syncUserData();
        if (document.getElementById('usersTableBody')) {
            renderCurrentSheet();
        }
        console.log('Datos actualizados manualmente');
        showSuccess('Datos actualizados');
    },
    
    // Funciones directas para agregar datos
    addUser: addUser,
    addFarmer: addFarmer,
    addCustomer: addCustomer,
    
    // Funcion de test completa
    testRegister: () => {
        console.log('=== EJECUTANDO TEST DE REGISTRO ===');
        
        const testFarmerData = {
            name: 'Juan',
            lastName: 'Perez',
            email: 'juan.perez@testfarm.com',
            password: '123456',
            farmerPhone: '6000-0000',
            userType: 'farmer',
            location: 'Ciudad de Panama',
            businessName: 'Finca Juan',
            businessPhone: '6000-0001'
        };
        
        const testCustomerData = {
            name: 'Maria',
            lastName: 'Garcia',
            email: 'maria.garcia@testcustomer.com',
            password: '123456',
            phone: '6000-2222',
            userType: 'customer'
        };
        
        console.log('Probando registro de farmer...');
        const farmerResult = registerUser(testFarmerData);
        console.log('Resultado farmer:', farmerResult);
        
        console.log('Probando registro de customer...');
        const customerResult = registerUser(testCustomerData);
        console.log('Resultado customer:', customerResult);
        
        return { farmerResult, customerResult };
    },
    
    // Funcion para verificar integridad de datos
    checkIntegrity: () => {
        console.log('=== VERIFICANDO INTEGRIDAD DE DATOS ===');
        
        let issues = [];
        
        // Verificar que todos los farmers tengan un usuario correspondiente
        farmers.forEach(farmer => {
            const user = users.find(u => u.id === farmer.userId);
            if (!user) {
                issues.push(`Farmer con userId ${farmer.userId} no tiene usuario correspondiente`);
            } else if (user.type !== 'FARMER') {
                issues.push(`Usuario ${user.id} no es de tipo FARMER pero tiene entrada en farmers`);
            }
        });
        
        // Verificar que todos los customers tengan un usuario correspondiente
        customers.forEach(customer => {
            const user = users.find(u => u.id === customer.userId);
            if (!user) {
                issues.push(`Customer con userId ${customer.userId} no tiene usuario correspondiente`);
            } else if (user.type !== 'CUSTOMER') {
                issues.push(`Usuario ${user.id} no es de tipo CUSTOMER pero tiene entrada en customers`);
            }
        });
        
        // Verificar emails duplicados
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
    
    // Funcion para obtener estadisticas
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
            recentUsers: users.filter(u => {
                const userDate = new Date(u.date.split('/').reverse().join('-'));
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return userDate >= weekAgo;
            }).length
        };
        
        console.log('=== ESTADISTICAS DE LA BASE DE DATOS ===');
        console.table(stats);
        return stats;
    },
    
    // Funcion para limpiar datos corruptos
    cleanData: () => {
        console.log('=== LIMPIANDO DATOS CORRUPTOS ===');
        
        let cleaned = 0;
        
        // Limpiar farmers huerfanos
        const originalFarmers = farmers.length;
        farmers = farmers.filter(farmer => {
            const user = users.find(u => u.id === farmer.userId);
            return user && user.type === 'FARMER';
        });
        cleaned += originalFarmers - farmers.length;
        
        // Limpiar customers huerfanos
        const originalCustomers = customers.length;
        customers = customers.filter(customer => {
            const user = users.find(u => u.id === customer.userId);
            return user && user.type === 'CUSTOMER';
        });
        cleaned += originalCustomers - customers.length;
        
        // Eliminar usuarios sin tipo valido
        const originalUsers = users.length;
        users = users.filter(user => user.type === 'FARMER' || user.type === 'CUSTOMER');
        cleaned += originalUsers - users.length;
        
        // Guardar datos limpios
        localStorage.setItem('agrotec_users', JSON.stringify(users));
        localStorage.setItem('agrotec_farmers', JSON.stringify(farmers));
        localStorage.setItem('agrotec_customers', JSON.stringify(customers));
        
        console.log(`Datos limpiados: ${cleaned} registros corruptos eliminados`);
        showSuccess(`${cleaned} registros corruptos eliminados`);
        
        loadDatabaseData();
        return { cleaned };
    }
};

// Funciones adicionales para compatibilidad
window.loadDatabaseData = loadDatabaseData;
window.showSheet = showSheet;
window.searchUsers = searchUsers;
window.searchFarmers = searchFarmers;
window.searchCustomers = searchCustomers;
window.deleteUser = deleteUser;
window.exportData = exportData;

// =================== EJECUCION AL CARGAR ===================
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado, inicializando base de datos...');
    
    // Agregar estilos para botones de eliminacion y notificaciones
    const style = document.createElement('style');
    style.textContent = `
        .btn-delete {
            background: #dc3545;
            color: white;
            border: none;
            padding: 5px 8px;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 12px;
        }
        
        .btn-delete:hover {
            background: #c82333;
            transform: scale(1.05);
        }
        
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    initDatabase();
});

// Inicializacion de respaldo
if (document.readyState === 'loading') {
    console.log('Esperando carga del DOM...');
} else {
    console.log('DOM ya cargado, inicializando inmediatamente...');
    initDatabase();
}