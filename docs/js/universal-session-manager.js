// =================== UNIVERSAL SESSION SYSTEM ===================

let currentUser = null;
let sessionCheckInterval = null;

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
                clearUserSession();
                console.log('Session expired, cleared');
            }
        } catch (error) {
            console.error('Error checking session:', error);
            clearUserSession();
        }
    }
    
    return null;
}

function clearUserSession() {
    sessionStorage.removeItem('agrotec_user');
    sessionStorage.removeItem('agrotec_login_time');
    currentUser = null;
}

// =================== UNIVERSAL NAVBAR UPDATE ===================
function updateNavbarForLoggedUser(user) {
    console.log('Updating navbar for logged user:', user.name);
    
    // Update dropdown info
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
    
    // Update avatar if exists
    updateNavbarAvatar(user);
}

function updateDropdownLinks(user) {
    // Find Login and Register links
    const loginLink = document.querySelector('a[href="login.html"]');
    const registerLink = document.querySelector('a[href="register.html"]');
    
    if (loginLink) {
        loginLink.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
            </svg>
            My Profile
        `;
        loginLink.href = '#';
        loginLink.onclick = (e) => {
            e.preventDefault();
            showUserProfile(user);
        };
    }
    
    if (registerLink) {
        registerLink.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2"></path>
                <polyline points="6,9 12,9 12,15"></polyline>
            </svg>
            My Orders
        `;
        registerLink.href = '#';
        registerLink.onclick = (e) => {
            e.preventDefault();
            showUserOrders(user);
        };
    }
    
    // Update Logout link
    const logoutLink = document.querySelector('.navbar__dropdown-link--danger');
    if (logoutLink) {
        logoutLink.onclick = (e) => {
            e.preventDefault();
            handleLogout();
        };
    }
}

function updateNavbarAvatar(user) {
    const dropdownAvatar = document.querySelector('.navbar__dropdown-avatar');
    if (dropdownAvatar && user) {
        const userPhoto = getUserProfilePhoto ? getUserProfilePhoto(user.id) : null;
        if (userPhoto) {
            dropdownAvatar.innerHTML = `
                <img src="${userPhoto}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">
            `;
        }
    }
}

// =================== PAGE PERSONALIZATION ===================
function personalizeCurrentPage(user) {
    const currentPage = getCurrentPageName();
    console.log('Personalizing page:', currentPage, 'for user:', user.name);
    
    switch(currentPage) {
        case 'index':
            personalizeHomePage(user);
            break;
        case 'farmers':
            personalizeFarmersPage(user);
            break;
        case 'products':
            personalizeProductsPage(user);
            break;
        case 'savings':
            personalizeSavingsPage(user);
            break;
        case 'sellers':
            personalizeSellersPage(user);
            break;
        default:
            console.log('Unrecognized page for personalization');
    }
}

function getCurrentPageName() {
    const path = window.location.pathname;
    const fileName = path.split('/').pop() || 'index.html';
    return fileName.replace('.html', '');
}

function personalizeHomePage(user) {
    const heroTitle = document.querySelector('.hero__title');
    const heroBrand = document.querySelector('.hero__brand');
    const heroTagline = document.querySelector('.hero__tagline');
    
    if (heroBrand && heroTagline) {
        heroBrand.innerHTML = `Hello, ${user.name}!`;
        heroTagline.innerHTML = `Welcome back to AGROTEC<br><span style="font-size: 0.7em; opacity: 0.9;">Find the best agricultural products</span>`;
    }
}

function addWelcomeMessage(user, subtitle) {
    // Prevent duplicate messages
    if (document.querySelector('.user-welcome-message')) return;
    
    const welcomeDiv = document.createElement('div');
    welcomeDiv.className = 'user-welcome-message';
    welcomeDiv.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #28a745, #20c997);
            color: white;
            padding: 15px 20px;
            margin: 20px auto;
            border-radius: 10px;
            text-align: center;
            max-width: 600px;
            box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
            animation: slideInFromTop 0.6s ease-out;
        ">
            <h3 style="margin: 0 0 5px 0; font-size: 1.2em;">Welcome, ${user.name}!</h3>
            <p style="margin: 0; font-size: 0.9em; opacity: 0.9;">${subtitle}</p>
        </div>
    `;
    
    // Insert after header/navbar
    const navbar = document.querySelector('.navbar, header');
    const main = document.querySelector('main, .main-content, body > div');
    
    if (navbar && navbar.nextSibling) {
        navbar.parentNode.insertBefore(welcomeDiv, navbar.nextSibling);
    } else if (main) {
        main.insertBefore(welcomeDiv, main.firstChild);
    } else {
        document.body.insertBefore(welcomeDiv, document.body.firstChild);
    }
}

// =================== PROFILE AND ORDERS FUNCTIONS ===================
function showUserProfile(user) {
    // Use enhanced function with photo if available
    if (typeof showUserProfileWithPhoto === 'function') {
        showUserProfileWithPhoto(user);
    } else {
        showBasicUserProfile(user);
    }
}

function showBasicUserProfile(user) {
    const modal = document.createElement('div');
    modal.className = 'profile-modal';
    modal.innerHTML = `
        <div onclick="closeProfileModal()" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9998;"></div>
        <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;border-radius:15px;max-width:500px;width:90%;z-index:9999;box-shadow:0 15px 40px rgba(0,0,0,0.3);">
            <div style="background:linear-gradient(135deg,#28a745,#20c997);color:white;padding:25px;text-align:center;border-radius:15px 15px 0 0;position:relative;">
                <button onclick="closeProfileModal()" style="position:absolute;top:15px;right:20px;background:none;border:none;color:white;font-size:24px;cursor:pointer;">&times;</button>
                
                <div style="width:80px;height:80px;background:rgba(255,255,255,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 15px;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                </div>
                
                <h2>${user.name} ${user.lastName}</h2>
                <p style="background:rgba(255,255,255,0.2);padding:5px 15px;border-radius:15px;font-size:12px;display:inline-block;">
                    ${user.type === 'CUSTOMER' ? 'Customer' : user.type}
                </p>
            </div>
            
            <div style="padding:20px;">
                <h3 style="color:#28a745;margin-bottom:15px;">Personal Information</h3>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Phone:</strong> ${user.phone || 'Not specified'}</p>
                <p><strong>Registration Date:</strong> ${user.date}</p>
                <p><strong>Status:</strong> <span style="color:#28a745;">${user.status}</span></p>
                
                <div style="display:flex;gap:10px;margin-top:20px;">
                    <button onclick="closeProfileModal(); showUserOrders(currentUser)" style="flex:1;background:#28a745;color:white;border:none;padding:12px;border-radius:8px;cursor:pointer;">
                        View Orders
                    </button>
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
    const orders = generateSampleOrders(user);
    
    const modal = document.createElement('div');
    modal.className = 'orders-modal';
    modal.innerHTML = `
        <div onclick="closeOrdersModal()" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9998;"></div>
        <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;border-radius:15px;max-width:600px;width:90%;max-height:80vh;overflow-y:auto;z-index:9999;box-shadow:0 15px 40px rgba(0,0,0,0.3);">
            <div style="background:linear-gradient(135deg,#28a745,#20c997);color:white;padding:20px;border-radius:15px 15px 0 0;position:relative;">
                <button onclick="closeOrdersModal()" style="position:absolute;top:15px;right:20px;background:none;border:none;color:white;font-size:24px;cursor:pointer;">&times;</button>
                <h2>My Orders</h2>
            </div>
            
            <div style="padding:20px;">
                ${orders.length > 0 ? 
                    orders.map(order => `
                        <div style="background:#f8f9fa;border-radius:8px;padding:15px;margin-bottom:15px;">
                            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;">
                                <span style="font-weight:bold;color:#28a745;">#${order.id}</span>
                                <span style="color:#6c757d;font-size:14px;">${order.date}</span>
                                <span style="padding:3px 8px;border-radius:12px;font-size:12px;font-weight:bold;background:#d4edda;color:#155724;">${order.status}</span>
                            </div>
                            <p><strong>Products:</strong> ${order.products}</p>
                            <p><strong>Total:</strong> $${order.total}</p>
                            <p><strong>Seller:</strong> ${order.seller}</p>
                        </div>
                    `).join('') : 
                    `<div style="text-align:center;padding:40px;color:#6c757d;">
                        <p>You don’t have any orders yet</p>
                        <button onclick="window.location.href='products.html'" style="background:#28a745;color:white;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;">Browse Products</button>
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
            status: 'IN TRANSIT',
            products: 'Carrots (1kg), Onions (2kg)',
            total: '8.75',
            seller: 'Sunny Farm'
        }
    ];
}

// =================== LOGOUT HANDLING ===================
function handleLogout() {
    if (confirm('Are you sure you want to log out?')) {
        clearUserSession();
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

// =================== DYNAMIC STYLES ===================
function addUniversalStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInFromTop {
            from { transform: translateY(-100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        
        .user-welcome-message {
            animation: slideInFromTop 0.6s ease-out;
        }
        
        .profile-modal, .orders-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 9999;
        }
    `;
    document.head.appendChild(style);
}

// =================== UNIVERSAL INITIALIZATION ===================
function initUniversalSession() {
    console.log('Starting universal session system...');
    
    // Check if a user is logged in
    const user = checkUserSession();
    
    if (user) {
        console.log('User found, customizing interface...');
        
        // Add universal styles
        addUniversalStyles();
        
        // Update navbar on all pages
        updateNavbarForLoggedUser(user);
        
        // Personalize current page
        personalizeCurrentPage(user);
        
        console.log('✅ Page personalized for logged user');
    } else {
        console.log('No logged user, showing normal page');
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

// Make functions global for compatibility
window.showUserProfile = showUserProfile;
window.showUserOrders = showUserOrders;
window.closeProfileModal = closeProfileModal;
window.closeOrdersModal = closeOrdersModal;
window.handleLogout = handleLogout;

// =================== AUTO-INITIALIZATION ===================
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, starting universal session...');
    initUniversalSession();
});

// Backup initialization
if (document.readyState === 'loading') {
    console.log('Waiting for DOM to load for session...');
} else {
    console.log('DOM already loaded, starting session immediately...');
    initUniversalSession();
}

// Periodic session verification (optional)
setInterval(() => {
    if (currentUser) {
        checkUserSession();
    }
}, 5 * 60 * 1000); // Every 5 minutes
