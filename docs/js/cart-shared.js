// js/cart-shared.js - Shared cart system between pages

// ========================================
// SHARED CART - UNIFIED SYSTEM
// ========================================

// Global cart state
window.SharedCart = {
    items: [],
    appliedDiscount: 0,
    discountCode: '',
    
    // Unified product database
    allProducts: {
        // Regular products (from products.html)
        1: { id: 1, name: "Romaine lettuce National 1LB", price: 1.50, originalPrice: null, image: "img/products/Romaine_lettuce.jpg", type: "regular" },
        2: { id: 2, name: "Tomato cherry 1LB", price: 0.65, originalPrice: null, image: "img/products/tomate.png", type: "regular" },
        3: { id: 3, name: "Broccoli 1lb (Medium bouquet)", price: 1.98, originalPrice: null, image: "img/products/brocoli.jpg", type: "regular" },
        4: { id: 4, name: "Parsley 100 GR", price: 1.50, originalPrice: null, image: "img/products/parsley.jpg", type: "regular" },
        5: { id: 5, name: "Green Cabbage 1LB", price: 1.78, originalPrice: null, image: "img/products/cabbage.jpg", type: "regular" },
        6: { id: 6, name: "National onion", price: 1.98, originalPrice: null, image: "img/products/onion.png", type: "regular" },
        7: { id: 7, name: "National cucumber 1 LB", price: 0.75, originalPrice: null, image: "img/products/cucumber.jpg", type: "regular" },
        8: { id: 8, name: "National carrot", price: 0.48, originalPrice: null, image: "img/products/zanahoria.jpg", type: "regular" },
        9: { id: 9, name: "Purple cabbage", price: 0.98, originalPrice: null, image: "img/products/repollomorado.jpg", type: "regular" },
        10: { id: 10, name: "Garlic", price: 1.98, originalPrice: null, image: "img/products/ajo.jpg", type: "regular" },
        
        // Discounted products (from savings.html)
        // Using IDs 100+ to avoid conflicts
        101: { id: 101, name: "Tomato cherry 1LB", price: 0.47, originalPrice: 0.65, image: "img/savings/tomate.png", type: "savings", savings: "28%" },
        102: { id: 102, name: "Purple Cabbage", price: 0.85, originalPrice: 0.98, image: "img/savings/repollomorado.png", type: "savings", savings: "13%" },
        103: { id: 103, name: "Green Cabbage 1LB", price: 1.13, originalPrice: 1.78, image: "img/savings/green_cabbage.png", type: "savings", savings: "37%" },
        104: { id: 104, name: "Avocado", price: 0.60, originalPrice: 0.78, image: "img/savings/avocado.png", type: "savings", savings: "23%" },
        105: { id: 105, name: "Parsley 100 GR", price: 0.95, originalPrice: 1.50, image: "img/savings/parsley.png", type: "savings", savings: "37%" },
        106: { id: 106, name: "National Carrot", price: 0.38, originalPrice: 0.48, image: "img/savings/zanahoria.png", type: "savings", savings: "21%" },
        107: { id: 107, name: "National Onion", price: 0.95, originalPrice: 1.98, image: "img/savings/onion.png", type: "savings", savings: "52%" },
        108: { id: 108, name: "Pineapple", price: 0.76, originalPrice: 1.03, image: "img/savings/pineapple.png", type: "savings", savings: "26%" }
    },
    
    // Unified discount codes
    discountCodes: {
        // Codes for regular products
        "WELCOME10": 0.10,
        "FRESH15": 0.15,
        "HEALTHY20": 0.20,
        
        // Codes for discounted products (additional)
        "SAVE10": 0.10,
        "BIGSAVE": 0.15,
        "SUPER20": 0.20,
        "MEGA25": 0.25,
        "ULTRA30": 0.30
    },
    
    // ========================================
    // SHARED CART METHODS
    // ========================================
    
    init() {
        this.loadFromStorage();
        this.updateUI();
        this.bindEvents();
        console.log('Shared cart initialized');
    },
    
    addItem(productId) {
        const product = this.allProducts[productId];
        if (!product) {
            console.error('Product not found:', productId);
            return false;
        }
        
        // Check if item already exists in cart
        const existingItem = this.items.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.items.push({
                id: product.id,
                name: product.name,
                price: product.price,
                originalPrice: product.originalPrice,
                image: product.image,
                quantity: 1,
                type: product.type,
                savings: product.savings || null
            });
        }
        
        this.saveToStorage();
        this.updateUI();
        this.showNotification(`${product.name} added to cart!`, 'success');
        return true;
    },
    
    removeItem(productId) {
        const itemIndex = this.items.findIndex(item => item.id === productId);
        if (itemIndex > -1) {
            const removedItem = this.items[itemIndex];
            this.items.splice(itemIndex, 1);
            this.saveToStorage();
            this.updateUI();
            this.showNotification(`${removedItem.name} removed from cart`, 'info');
            return true;
        }
        return false;
    },
    
    changeQuantity(productId, delta) {
        const item = this.items.find(item => item.id === productId);
        if (!item) return false;
        
        item.quantity += delta;
        
        if (item.quantity <= 0) {
            return this.removeItem(productId);
        }
        
        this.saveToStorage();
        this.updateUI();
        return true;
    },
    
    applyDiscount(code) {
        const upperCode = code.toUpperCase().trim();
        
        if (!upperCode) {
            this.showNotification('Please enter a discount code', 'error');
            return false;
        }
        
        if (this.discountCodes[upperCode]) {
            this.appliedDiscount = this.discountCodes[upperCode];
            this.discountCode = upperCode;
            this.saveToStorage();
            this.updateUI();
            this.showNotification(`${(this.appliedDiscount * 100)}% discount applied!`, 'success');
            return true;
        } else {
            this.showNotification('Invalid discount code', 'error');
            return false;
        }
    },
    
    clearCart() {
        this.items = [];
        this.appliedDiscount = 0;
        this.discountCode = '';
        this.saveToStorage();
        this.updateUI();
        this.showNotification('Cart cleared', 'info');
    },
    
    getCartSummary() {
        const subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const originalSubtotal = this.items.reduce((sum, item) => {
            const originalPrice = item.originalPrice || item.price;
            return sum + (originalPrice * item.quantity);
        }, 0);
        
        const savingsFromProducts = originalSubtotal - subtotal;
        const discountAmount = subtotal * this.appliedDiscount;
        const shipping = subtotal > 15 ? 0 : 5.00;
        const total = subtotal - discountAmount + shipping;
        const totalItemCount = this.items.reduce((sum, item) => sum + item.quantity, 0);
        
        return {
            subtotal: subtotal.toFixed(2),
            originalSubtotal: originalSubtotal.toFixed(2),
            savingsFromProducts: savingsFromProducts.toFixed(2),
            discountAmount: discountAmount.toFixed(2),
            shipping: shipping.toFixed(2),
            total: total.toFixed(2),
            totalItemCount,
            hasDiscount: this.appliedDiscount > 0,
            hasSavings: savingsFromProducts > 0
        };
    },
    
    // ========================================
    // PERSISTENCE AND UI
    // ========================================
    
    saveToStorage() {
        try {
            const cartData = {
                items: this.items,
                appliedDiscount: this.appliedDiscount,
                discountCode: this.discountCode,
                timestamp: Date.now()
            };
            localStorage.setItem('agrotec_shared_cart', JSON.stringify(cartData));
        } catch (error) {
            console.warn('Could not save cart:', error);
        }
    },
    
    loadFromStorage() {
        try {
            const saved = localStorage.getItem('agrotec_shared_cart');
            if (saved) {
                const cartData = JSON.parse(saved);
                // Load only if not too old (24 hours)
                if (Date.now() - cartData.timestamp < 86400000) {
                    this.items = cartData.items || [];
                    this.appliedDiscount = cartData.appliedDiscount || 0;
                    this.discountCode = cartData.discountCode || '';
                }
            }
        } catch (error) {
            console.warn('Could not load cart:', error);
        }
    },
    
    updateUI() {
        this.updateCartBadge();
        this.updateCartItems();
        this.updateCartSummary();
    },
    
    updateCartBadge() {
        const cartBadge = document.getElementById('cartBadge');
        if (cartBadge) {
            const totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
            cartBadge.textContent = totalItems;
            cartBadge.style.display = totalItems > 0 ? 'flex' : 'none';
        }
    },
    
    updateCartItems() {
        const cartItemsContainer = document.getElementById('cartItems');
        if (!cartItemsContainer) return;
        
        if (this.items.length === 0) {
            cartItemsContainer.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
            return;
        }
        
        cartItemsContainer.innerHTML = this.items.map(item => {
            const priceDisplay = item.originalPrice && item.originalPrice !== item.price ? 
                `B/.${item.price.toFixed(2)} <small style="color: #dc3545; text-decoration: line-through;">B/.${item.originalPrice.toFixed(2)}</small>` :
                `B/.${item.price.toFixed(2)}`;
                
            const savingsBadge = item.savings ? `<span style="color: #28a745; font-size: 0.8em;">(${item.savings} off)</span>` : '';
                
            return `
                <div class="cart-item">
                    <div class="cart-item-image">
                        <img src="${item.image}" alt="${item.name}" onerror="this.src='img/placeholder.png'">
                    </div>
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name} ${savingsBadge}</div>
                        <div class="cart-item-price">${priceDisplay}</div>
                        <div class="cart-item-controls">
                            <button class="qty-btn" onclick="SharedCart.changeQuantity(${item.id}, -1)">-</button>
                            <span class="cart-item-quantity">${item.quantity}</span>
                            <button class="qty-btn" onclick="SharedCart.changeQuantity(${item.id}, 1)">+</button>
                            <button class="remove-btn" onclick="SharedCart.removeItem(${item.id})">Remove</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },
    
    updateCartSummary() {
        const summary = this.getCartSummary();
        
        const elements = {
            subtotal: document.getElementById('subtotal'),
            discountAmount: document.getElementById('discountAmount'),
            shipping: document.getElementById('shipping'),
            total: document.getElementById('total'),
            discountRow: document.getElementById('discountRow')
        };
        
        if (elements.subtotal) elements.subtotal.textContent = `B/.${summary.subtotal}`;
        if (elements.discountAmount) elements.discountAmount.textContent = `-B/.${summary.discountAmount}`;
        if (elements.shipping) elements.shipping.textContent = summary.shipping === '0.00' ? 'Free' : `B/.${summary.shipping}`;
        if (elements.total) elements.total.textContent = `B/.${summary.total}`;
        
        if (elements.discountRow) {
            elements.discountRow.style.display = summary.hasDiscount ? 'flex' : 'none';
        }
        
        // Show total savings if any
        if (summary.hasSavings) {
            let savingsRow = document.getElementById('savingsRow');
            if (!savingsRow && elements.discountRow) {
                savingsRow = document.createElement('div');
                savingsRow.id = 'savingsRow';
                savingsRow.className = 'summary-row';
                savingsRow.style.color = '#28a745';
                savingsRow.style.fontWeight = 'bold';
                elements.discountRow.parentNode.insertBefore(savingsRow, elements.discountRow.nextSibling);
            }
            if (savingsRow) {
                savingsRow.innerHTML = `<span>Total Savings:</span><span>B/.${summary.savingsFromProducts}</span>`;
            }
        }
        
        // Enable/disable checkout button
        const checkoutBtn = document.querySelector('.checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.disabled = this.items.length === 0;
        }
    },
    
    bindEvents() {
        // Event listeners for cart modal
        const cartToggle = document.getElementById('cartToggle');
        const cartModal = document.getElementById('cartModal');
        const cartClose = document.getElementById('cartClose');
        
        if (cartToggle) {
            cartToggle.addEventListener('click', () => this.toggleModal());
        }
        
        if (cartClose) {
            cartClose.addEventListener('click', () => this.closeModal());
        }
        
        if (cartModal) {
            cartModal.addEventListener('click', (e) => {
                if (e.target === cartModal) this.closeModal();
            });
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
        });
    },
    
    toggleModal() {
        const cartModal = document.getElementById('cartModal');
        if (cartModal) {
            if (cartModal.classList.contains('active')) {
                this.closeModal();
            } else {
                this.openModal();
            }
        }
    },
    
    openModal() {
        const cartModal = document.getElementById('cartModal');
        if (cartModal) {
            cartModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            this.updateUI(); // Refresh UI on open
        }
    },
    
    closeModal() {
        const cartModal = document.getElementById('cartModal');
        if (cartModal) {
            cartModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    },
    
    // UPDATED PROCEEDTOCHECKOUT FUNCTION
    proceedToCheckout() {
        if (this.items.length === 0) {
            this.showNotification('Your cart is empty', 'error');
            return;
        }
        
        // Prepare cart data for checkout
        const checkoutData = {
            items: this.items.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                originalPrice: item.originalPrice,
                quantity: item.quantity,
                type: item.type,
                savings: item.savings,
                image: item.image
            })),
            appliedDiscount: this.appliedDiscount,
            discountCode: this.discountCode,
            timestamp: Date.now()
        };
        
        try {
            // Save cart data for checkout
            localStorage.setItem('checkoutCart', JSON.stringify(checkoutData));
            
            console.log('Cart data saved for checkout:', checkoutData);
            
            // Show redirect notification
            this.showNotification('Redirecting to checkout...', 'success');
            
            // Close cart modal
            this.closeModal();
            
            // Redirect to checkout after brief delay
            setTimeout(() => {
                window.location.href = 'checkout.html';
            }, 500);
            
        } catch (error) {
            console.error('Error preparing checkout:', error);
            this.showNotification('Error processing checkout', 'error');
        }
    },
    
    // ========================================
    // ADDITIONAL UTILITIES
    // ========================================
    
    // Get product information by ID
    getProduct(productId) {
        return this.allProducts[productId] || null;
    },
    
    // Check if product is in cart
    hasProduct(productId) {
        return this.items.some(item => item.id === productId);
    },
    
    // Get quantity of specific product in cart
    getProductQuantity(productId) {
        const item = this.items.find(item => item.id === productId);
        return item ? item.quantity : 0;
    },
    
    // Get total unique products in cart
    getUniqueProductCount() {
        return this.items.length;
    },
    
    // Get total individual items in cart
    getTotalItemCount() {
        return this.items.reduce((sum, item) => sum + item.quantity, 0);
    },
    
    // Clear only products of specific type (regular or savings)
    clearProductType(type) {
        const originalLength = this.items.length;
        this.items = this.items.filter(item => item.type !== type);
        
        if (this.items.length !== originalLength) {
            this.saveToStorage();
            this.updateUI();
            this.showNotification(`${type} products removed from cart`, 'info');
        }
    },
    
    // Get cart statistics
    getCartStats() {
        const summary = this.getCartSummary();
        return {
            uniqueProducts: this.getUniqueProductCount(),
            totalItems: this.getTotalItemCount(),
            regularProducts: this.items.filter(item => item.type === 'regular').length,
            savingsProducts: this.items.filter(item => item.type === 'savings').length,
            subtotal: parseFloat(summary.subtotal),
            totalSavings: parseFloat(summary.savingsFromProducts),
            discount: parseFloat(summary.discountAmount),
            shipping: parseFloat(summary.shipping),
            finalTotal: parseFloat(summary.total),
            isEmpty: this.items.length === 0,
            hasDiscount: summary.hasDiscount,
            hasSavings: summary.hasSavings
        };
    },
    
    // Debug function for development
    debug() {
        console.group('SharedCart Debug Info');
        console.log('Items:', this.items);
        console.log('Applied Discount:', this.appliedDiscount);
        console.log('Discount Code:', this.discountCode);
        console.log('Cart Summary:', this.getCartSummary());
        console.log('Cart Stats:', this.getCartStats());
        console.groupEnd();
        return this.getCartStats();
    },
    
    // ========================================
    // NOTIFICATION SYSTEM
    // ========================================
    
    showNotification(message, type = 'info', duration = 3000) {
        // Remove existing notifications
        const existing = document.querySelectorAll('.shared-cart-notification');
        existing.forEach(notification => notification.remove());
        
        const notification = document.createElement('div');
        notification.className = `shared-cart-notification ${type}`;
        notification.textContent = message;
        
        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&times;';
        closeBtn.className = 'notification-close';
        closeBtn.onclick = () => notification.remove();
        notification.appendChild(closeBtn);
        
        document.body.appendChild(notification);
        
        // Show with animation
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Auto-remove after specified time
        const timeout = setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, duration);
        
        // Cancel timeout if closed manually
        closeBtn.onclick = () => {
            clearTimeout(timeout);
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        };
    }
};

// ========================================
// GLOBAL FUNCTIONS
// ========================================

// Functions to be called from HTML
window.addToSharedCart = function(productId) {
    return SharedCart.addItem(productId);
};

window.applySharedDiscount = function() {
    const discountInput = document.getElementById('discountCode');
    if (discountInput) {
        const success = SharedCart.applyDiscount(discountInput.value);
        if (success) discountInput.value = '';
    }
};

window.proceedToSharedCheckout = function() {
    SharedCart.proceedToCheckout();
};

// Additional utility functions
window.debugSharedCart = function() {
    return SharedCart.debug();
};

window.clearSharedCart = function() {
    SharedCart.clearCart();
};

// Auto-initialization
document.addEventListener('DOMContentLoaded', function() {
    SharedCart.init();
    console.log('SharedCart initialized. Use debugSharedCart() for debug information.');
});

// ========================================
// IMPROVED CSS STYLES
// ========================================

const style = document.createElement('style');
style.textContent = `
    .shared-cart-notification {
        position: fixed;
        top: 100px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        font-weight: bold;
        z-index: 3000;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        min-width: 300px;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
    }
    
    .shared-cart-notification.show {
        opacity: 1;
        transform: translateX(0);
    }
    
    .shared-cart-notification.error { 
        background: #dc3545; 
    }
    
    .shared-cart-notification.info { 
        background: #17a2b8; 
    }
    
    .shared-cart-notification.success { 
        background: #28a745; 
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        font-weight: bold;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.2s ease;
        flex-shrink: 0;
    }
    
    .notification-close:hover {
        background: rgba(255,255,255,0.2);
        transform: scale(1.1);
    }
    
    /* Additional animations for cart */
    .cart-item {
        animation: fadeInItem 0.3s ease;
    }
    
    @keyframes fadeInItem {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .cart-badge {
        animation: bounceIn 0.4s ease;
    }
    
    @keyframes bounceIn {
        0% { transform: scale(0); }
        50% { transform: scale(1.2); }
        100% { transform: scale(1); }
    }
    
    /* Improved styles for cart buttons */
    .qty-btn:hover {
        background: #2b632b;
        color: white;
        transform: scale(1.1);
    }
    
    .remove-btn:hover {
        background: #dc3545;
        color: white;
        transform: scale(1.05);
    }
    
    .checkout-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none !important;
    }
    
    .checkout-btn:disabled:hover {
        background: #6c757d !important;
    }
`;

document.head.appendChild(style);

// ========================================
// GLOBAL ERROR HANDLING
// ========================================

// Handle localStorage errors
window.addEventListener('storage', function(e) {
    if (e.key === 'agrotec_shared_cart') {
        SharedCart.loadFromStorage();
        SharedCart.updateUI();
    }
});

// Initialization log
console.log('%c🛒 SharedCart System Loaded', 'color: #28a745; font-weight: bold; font-size: 14px;');
console.log('Available commands:');
console.log('- debugSharedCart(): Show cart debug info');
console.log('- clearSharedCart(): Clear entire cart');
console.log('- SharedCart.getCartStats(): Get cart statistics');