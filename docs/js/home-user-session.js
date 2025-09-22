// =================== HOME SESSION MANAGEMENT ===================

let currentUser = null;

// =================== SESSION VERIFICATION ===================
function checkUserSession() {
    console.log('Checking user session...');
    
    const userData = sessionStorage.getItem('agrotec_user');
    const loginTime = sessionStorage.getItem('agrotec_login_time');
    
    if (userData && loginTime) {
        try {
            const user = JSON.parse(userData);
            const loginDate = new Date(loginTime);
            const now = new Date();
            const hoursDiff = (now - loginDate) / (1000 * 60 * 60);
            
            // Session valid for 24 hours
            if (hoursDiff < 24) {
                currentUser = user;
                console.log('Authenticated user:', user.name, user.lastName);
                return user;
            } else {
                // Clear expired session
                sessionStorage.removeItem('agrotec_user');
                sessionStorage.removeItem('agrotec_login_time');
                console.log('Expired session, cleared');
            }
        } catch (error) {
            console.error('Error verifying session:', error);
            sessionStorage.removeItem('agrotec_user');
            sessionStorage.removeItem('agrotec_login_time');
        }
    }
    
    return null;
}

// =================== NAVBAR UPDATE ===================
function updateNavbarForLoggedUser(user) {
    console.log('Updating navbar for logged user:', user.name);
    
    // Update dropdown information
    const dropdownName = document.querySelector('.navbar__dropdown-name');
    const dropdownEmail = document.querySelector('.navbar__dropdown-email');
    
    if (dropdownName) {
        dropdownName.textContent = `${user.name} ${user.lastName}`;
    }
    
    if (dropdownEmail) {
        dropdownEmail.textContent = user.email;
    }
    
    // Update dropdown links
    updateDropdownLinks(user);
    
    // Show active session information (optional)
    addSessionIndicator(user);
}

function updateDropdownLinks(user) {
    // Find Login and Register links
    const loginLink = document.querySelector('a[href="login.html"]');
    const registerLink = document.querySelector('a[href="register.html"]');
    
    if (loginLink) {
        loginLink.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2"></path>
                <polyline points="6,9 12,9 12,15"></polyline>
                <path d="M6 9l6 6 6-6"></path>
            </svg>
            My Profile
        `;
        loginLink.href = '#';
        loginLink.onclick = () => showUserProfile(user);
    }
    
    if (registerLink) {
        registerLink.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2"></path>
                <polyline points="6,9 12,9 12,15"></polyline>
                <path d="M6 9l6 6 6-6"></path>
            </svg>
            My Orders
        `;
        registerLink.href = '#';
        registerLink.onclick = () => showUserOrders(user);
    }
    
    // Update "Logout" link
    const logoutLink = document.querySelector('.navbar__dropdown-link--danger');
    if (logoutLink) {
        logoutLink.onclick = (e) => {
            e.preventDefault();
            handleLogout();
        };
    }
}

function addSessionIndicator(user) {
    // Add visual session active indicator
    const navbar = document.querySelector('.navbar');
    if (navbar && !document.querySelector('.session-indicator')) {
        const indicator = document.createElement('div');
        indicator.className = 'session-indicator';
        indicator.innerHTML = `
            <div style="
                position: fixed;
                top: 10px;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(135deg, #28a745, #20c997);
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                z-index: 9999;
                box-shadow: 0 2px 10px rgba(40, 167, 69, 0.3);
                animation: slideDown 0.5s ease-out;
            ">
                🌱 Active session: ${user.name} ${user.lastName}
            </div>
        `;
        
        document.body.appendChild(indicator);
        
        // Hide after 5 seconds
        setTimeout(() => {
            const sessionIndicator = document.querySelector('.session-indicator');
            if (sessionIndicator) {
                sessionIndicator.style.animation = 'slideUp 0.5s ease-in';
                setTimeout(() => {
                    if (document.body.contains(sessionIndicator)) {
                        document.body.removeChild(sessionIndicator);
                    }
                }, 500);
            }
        }, 5000);
    }
}

// =================== USER PROFILE FUNCTIONS ===================
function showUserProfile(user) {
    // Create user profile modal
    const modal = document.createElement('div');
    modal.className = 'profile-modal';
    modal.innerHTML = `
        <div class="profile-modal-overlay" onclick="closeProfileModal()"></div>
        <div class="profile-modal-content">
            <div class="profile-header">
                <div class="profile-avatar">
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                </div>
                <h2>${user.name} ${user.lastName}</h2>
                <p class="profile-type">${user.type === 'CUSTOMER' ? 'Customer' : user.type}</p>
                <button class="profile-close" onclick="closeProfileModal()">&times;</button>
            </div>
            
            <div class="profile-body">
                <div class="profile-section">
                    <h3>Personal Information</h3>
                    <div class="profile-field">
                        <label>Email:</label>
                        <span>${user.email}</span>
                    </div>
                    <div class="profile-field">
                        <label>Phone:</label>
                        <span>${user.phone || 'Not specified'}</span>
                    </div>
                    <div class="profile-field">
                        <label>Registration date:</label>
                        <span>${user.date}</span>
                    </div>
                    <div class="profile-field">
                        <label>Status:</label>
                        <span class="status-${user.status.toLowerCase()}">${user.status}</span>
                    </div>
                </div>
                
                <div class="profile-actions">
                    <button class="btn btn-primary" onclick="editProfile()">Edit Profile</button>
                    <button class="btn btn-success" onclick="viewPurchaseHistory()">Purchase History</button>
                    <button class="btn btn-warning" onclick="changePassword()">Change Password</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
}

function closeProfileModal() {
    const modal = document.querySelector('.profile-modal');
    if (modal) {
        document.body.removeChild(modal);
        document.body.style.overflow = 'auto';
    }
}

function showUserOrders(user) {
    // Simulate user orders
    const orders = generateSampleOrders(user);
    
    const modal = document.createElement('div');
    modal.className = 'orders-modal';
    modal.innerHTML = `
        <div class="orders-modal-overlay" onclick="closeOrdersModal()"></div>
        <div class="orders-modal-content">
            <div class="orders-header">
                <h2>My Orders</h2>
                <button class="orders-close" onclick="closeOrdersModal()">&times;</button>
            </div>
            
            <div class="orders-body">
                ${orders.length > 0 ? 
                    orders.map(order => `
                        <div class="order-item">
                            <div class="order-header">
                                <span class="order-id">#${order.id}</span>
                                <span class="order-date">${order.date}</span>
                                <span class="order-status status-${order.status.toLowerCase()}">${order.status}</span>
                            </div>
                            <div class="order-details">
                                <p><strong>Products:</strong> ${order.products}</p>
                                <p><strong>Total:</strong> $${order.total}</p>
                                <p><strong>Seller:</strong> ${order.seller}</p>
                            </div>
                        </div>
                    `).join('') : 
                    `<div class="no-orders">
                        <p>You don't have any orders yet</p>
                        <button class="btn btn-primary" onclick="window.location.href='products.html'">View Products</button>
                    </div>`
                }
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
}

function closeOrdersModal() {
    const modal = document.querySelector('.orders-modal');
    if (modal) {
        document.body.removeChild(modal);
        document.body.style.overflow = 'auto';
    }
}

function generateSampleOrders(user) {
    // Generate sample orders for the user
    return [
        {
            id: '001',
            date: '2024-12-15',
            status: 'DELIVERED',
            products: 'Organic tomatoes (2kg), Lettuce (3 units)',
            total: '15.50',
            seller: 'Green Farm'
        },
        {
            id: '002',
            date: '2024-12-10',
            status: 'IN_TRANSIT',
            products: 'Carrots (1kg), Onions (2kg)',
            total: '8.75',
            seller: 'Sun Farm'
        },
        {
            id: '003',
            date: '2024-12-05',
            status: 'PENDING',
            products: 'Avocados (6 units)',
            total: '12.00',
            seller: 'Pine Farm'
        }
    ];
}

// =================== PROFILE ACTION FUNCTIONS ===================
function editProfile() {
    alert('Edit profile functionality in development');
    closeProfileModal();
}

function viewPurchaseHistory() {
    closeProfileModal();
    showUserOrders(currentUser);
}

function changePassword() {
    alert('Change password functionality in development');
    closeProfileModal();
}

// =================== LOGOUT HANDLING ===================
function handleLogout() {
    if (confirm('Are you sure you want to log out?')) {
        // Clear session
        sessionStorage.removeItem('agrotec_user');
        sessionStorage.removeItem('agrotec_login_time');
        
        // Show message and redirect
        showLogoutMessage();
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
    }
}

function showLogoutMessage() {
    const message = document.createElement('div');
    message.innerHTML = `
        <div style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            text-align: center;
            z-index: 10000;
        ">
            <h3 style="color: #28a745; margin-bottom: 15px;">Session Closed</h3>
            <p>Thank you for using AGROTEC</p>
            <p>Redirecting to login...</p>
        </div>
        <div style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 9999;
        "></div>
    `;
    
    document.body.appendChild(message);
}

// =================== HERO SECTION PERSONALIZATION ===================
function personalizeHeroSection(user) {
    const heroTitle = document.querySelector('.hero__title');
    const heroBrand = document.querySelector('.hero__brand');
    const heroTagline = document.querySelector('.hero__tagline');
    
    if (heroBrand && heroTagline) {
        // Personalize welcome message
        heroBrand.innerHTML = `Hello, ${user.name}!`;
        heroTagline.innerHTML = `Welcome back to AGROTEC<br><span style="font-size: 0.7em; opacity: 0.9;">Find the best agricultural products</span>`;
    }
}

// =================== ADD DYNAMIC STYLES ===================
function addUserSessionStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideDown {
            from { transform: translate(-50%, -100%); opacity: 0; }
            to { transform: translate(-50%, 0); opacity: 1; }
        }
        
        @keyframes slideUp {
            from { transform: translate(-50%, 0); opacity: 1; }
            to { transform: translate(-50%, -100%); opacity: 0; }
        }
        
        .profile-modal, .orders-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 9999;
        }
        
        .profile-modal-overlay, .orders-modal-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
        }
        
        .profile-modal-content, .orders-modal-content {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border-radius: 15px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 15px 40px rgba(0,0,0,0.3);
        }
        
        .profile-header, .orders-header {
            background: linear-gradient(135deg, #28a745, #20c997);
            color: white;
            padding: 20px;
            text-align: center;
            position: relative;
            border-radius: 15px 15px 0 0;
        }
        
        .profile-avatar {
            width: 80px;
            height: 80px;
            background: rgba(255,255,255,0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 15px;
        }
        
        .profile-close, .orders-close {
            position: absolute;
            top: 15px;
            right: 20px;
            background: none;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .profile-close:hover, .orders-close:hover {
            background: rgba(255,255,255,0.2);
        }
        
        .profile-type {
            background: rgba(255,255,255,0.2);
            padding: 5px 15px;
            border-radius: 15px;
            font-size: 12px;
            display: inline-block;
        }
        
        .profile-body, .orders-body {
            padding: 20px;
        }
        
        .profile-section {
            margin-bottom: 25px;
        }
        
        .profile-section h3 {
            color: #28a745;
            margin-bottom: 15px;
            border-bottom: 2px solid #e9ecef;
            padding-bottom: 5px;
        }
        
        .profile-field {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #f8f9fa;
        }
        
        .profile-field label {
            font-weight: 600;
            color: #6c757d;
        }
        
        .profile-actions {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        
        .profile-actions .btn {
            flex: 1;
            min-width: 140px;
            padding: 10px 15px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s ease;
        }
        
        .status-active {
            color: #28a745;
            font-weight: bold;
        }
        
        .order-item {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
        }
        
        .order-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            flex-wrap: wrap;
        }
        
        .order-id {
            font-weight: bold;
            color: #28a745;
        }
        
        .order-date {
            color: #6c757d;
            font-size: 14px;
        }
        
        .order-status {
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
        }
        
        .status-delivered {
            background: #d4edda;
            color: #155724;
        }
        
        .status-in_transit {
            background: #d1ecf1;
            color: #0c5460;
        }
        
        .status-pending {
            background: #fff3cd;
            color: #856404;
        }
        
        .order-details p {
            margin: 5px 0;
            font-size: 14px;
        }
        
        .no-orders {
            text-align: center;
            padding: 40px;
            color: #6c757d;
        }
        
        @media (max-width: 768px) {
            .profile-actions {
                flex-direction: column;
            }
            
            .order-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 5px;
            }
        }
    `;
    document.head.appendChild(style);
}

// =================== INITIALIZATION ===================
function initUserSession() {
    console.log('Initializing session management in home...');
    
    // Check if there's a logged user
    const user = checkUserSession();
    
    if (user) {
        console.log('User found, personalizing interface...');
        
        // Add dynamic styles
        addUserSessionStyles();
        
        // Update navbar
        updateNavbarForLoggedUser(user);
        
        // Personalize hero section
        personalizeHeroSection(user);
        
        console.log('✅ Home personalized for logged user');
    } else {
        console.log('No logged user, showing normal home');
    }
}

// Global functions for external access
window.userSession = {
    getCurrentUser: () => currentUser,
    checkSession: checkUserSession,
    logout: handleLogout,
    showProfile: () => showUserProfile(currentUser),
    showOrders: () => showUserOrders(currentUser)
};

// =================== AUTO-INITIALIZATION ===================
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, starting user session...');
    
    // Check if we're on the home page
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        initUserSession();
    }
});

// Backup initialization
if (document.readyState === 'loading') {
    console.log('Waiting for DOM load for session...');
} else if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
    console.log('DOM already loaded, starting session immediately...');
    initUserSession();
}