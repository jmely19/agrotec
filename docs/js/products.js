// js/products.js - Products with shared cart integration

document.addEventListener('DOMContentLoaded', function() {
    console.log('Products page loading with shared cart integration...');
    
    // Wait for SharedCart to be available, then initialize
    if (window.SharedCart) {
        initializeProductsPage();
        attachProductEvents();
    } else {
        // If SharedCart isn't loaded yet, wait a bit
        setTimeout(() => {
            if (window.SharedCart) {
                initializeProductsPage();
                attachProductEvents();
            } else {
                console.error('SharedCart not available, falling back to local cart');
                initializeLocalCart();
                initializeProductsPage();
            }
        }, 100);
    }
});

// ========================================
// PRODUCT EVENTS ATTACHMENT
// ========================================
function attachProductEvents() {
    // Connect all "Add to Cart" buttons
    const addButtons = document.querySelectorAll('.add-to-cart-btn');
    console.log('Found add-to-cart buttons:', addButtons.length);
    
    addButtons.forEach(button => {
        // Remove existing onclick handlers
        button.removeAttribute('onclick');
        
        // Get product ID from parent card
        const productCard = button.closest('.product-card');
        const productId = parseInt(productCard?.dataset.id);
        
        console.log('Attaching shared cart event to product:', productId);
        
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (window.SharedCart && window.SharedCart.addItem) {
                const success = window.SharedCart.addItem(productId);
                if (success) {
                    animateAddButton(button);
                }
            } else {
                console.warn('SharedCart not available, using fallback');
                fallbackAddToCart(productId, button);
            }
        });
    });

    // Connect favorite buttons
    const favoriteButtons = document.querySelectorAll('.favorite-btn');
    favoriteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            toggleFavorite(this);
        });
    });
}

// Fallback function if SharedCart is not available
function fallbackAddToCart(productId, buttonElement) {
    const product = products[productId];
    if (!product) return;
    
    // Use local storage as fallback
    let cart = JSON.parse(localStorage.getItem('fallback_cart') || '[]');
    
    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }
    
    localStorage.setItem('fallback_cart', JSON.stringify(cart));
    showNotification(`${product.name} added to cart!`, 'success');
    animateAddButton(buttonElement);
}

// ========================================
// PRODUCTS PAGE FUNCTIONALITY
// ========================================

function initializeProductsPage() {
    console.log('Initializing products page...');
    
    // Elements
    const searchInput = document.querySelector('.search-input');
    const searchBtn = document.querySelector('.search-btn');
    const gridBtn = document.querySelector('.grid-btn');
    const listBtn = document.querySelector('.list-btn');
    const productsGrid = document.getElementById('productsGrid');
    const favoriteButtons = document.querySelectorAll('.favorite-btn');

    // Search functionality
    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
        
        // Auto-complete search suggestions
        const searchSuggestions = [
            'lettuce', 'tomato', 'broccoli', 'parsley', 'cabbage',
            'onion', 'cucumber', 'carrot', 'garlic', 'local flavor',
            'market fresh', 'francisco\'s market', 'sofia market'
        ];

        searchInput.addEventListener('input', function() {
            const value = this.value.toLowerCase();
            if (value.length > 2) {
                const suggestions = searchSuggestions.filter(item => 
                    item.includes(value)
                );
                console.log('Search suggestions:', suggestions);
            }
        });
    }

    function performSearch() {
        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const productCards = document.querySelectorAll('.product-card');

        if (searchTerm === '') {
            productCards.forEach(card => {
                card.style.display = '';
            });
            return;
        }

        productCards.forEach(card => {
            const productName = card.querySelector('.product-name').textContent.toLowerCase();
            const productTag = card.querySelector('.product-tag').textContent.toLowerCase();
            
            if (productName.includes(searchTerm) || productTag.includes(searchTerm)) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // View toggle functionality
    if (gridBtn && listBtn) {
        gridBtn.addEventListener('click', switchToGridView);
        listBtn.addEventListener('click', switchToListView);
    }

    function switchToGridView() {
        gridBtn.classList.add('active');
        listBtn.classList.remove('active');
        if (productsGrid) {
            productsGrid.classList.remove('list-view');
        }
        if (window.SharedCart) {
            window.SharedCart.showNotification('Grid view activated', 'info');
        }
    }

    function switchToListView() {
        listBtn.classList.add('active');
        gridBtn.classList.remove('active');
        if (productsGrid) {
            productsGrid.classList.add('list-view');
        }
        if (window.SharedCart) {
            window.SharedCart.showNotification('List view activated', 'info');
        }
    }

    // Smooth scroll animation for product cards
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Initialize animation for product cards
    document.querySelectorAll('.product-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });

    // Product card hover effects
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px) scale(1.02)';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Handle discount input if SharedCart is available
    const discountInput = document.getElementById('discountCode');
    if (discountInput) {
        discountInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                if (window.applySharedDiscount) {
                    window.applySharedDiscount();
                } else {
                    console.warn('Shared discount function not available');
                }
            }
        });
    }

    // Add keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (searchInput) {
                searchInput.value = '';
                performSearch();
            }
        }
        
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            if (searchInput) {
                searchInput.focus();
            }
        }
    });

    // Loading animation
    showLoading();

    console.log('Products page with shared cart integration loaded successfully!');
}

function toggleFavorite(button) {
    const productCard = button.closest('.product-card');
    const productName = productCard ? productCard.querySelector('.product-name').textContent : 'Product';
    
    if (button.textContent === '♡') {
        button.textContent = '♥';
        button.style.color = '#ff4757';
        button.style.background = 'rgba(255, 255, 255, 0.95)';
        
        // Add animation
        button.style.transform = 'scale(1.3)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 200);
        
        if (window.SharedCart) {
            window.SharedCart.showNotification(`${productName} added to favorites`, 'success');
        } else {
            showNotification(`${productName} added to favorites`, 'success');
        }
    } else {
        button.textContent = '♡';
        button.style.color = '#ccc';
        button.style.background = 'rgba(255, 255, 255, 0.9)';
        
        if (window.SharedCart) {
            window.SharedCart.showNotification(`${productName} removed from favorites`, 'info');
        } else {
            showNotification(`${productName} removed from favorites`, 'info');
        }
    }
}

function animateAddButton(button) {
    if (!button) return;
    
    const originalText = button.textContent;
    button.style.transform = 'scale(0.95)';
    button.textContent = '✓ Added!';
    button.style.background = '#28a745';
    button.disabled = true;
    
    setTimeout(() => {
        button.style.transform = 'scale(1)';
        button.textContent = originalText;
        button.style.background = '#2b632b';
        button.disabled = false;
    }, 1500);
}

// ========================================
// FALLBACK CART FUNCTIONALITY
// ========================================

// Keep original products data for fallback
const products = {
    1: { id: 1, name: "Romaine lettuce National 1LB", price: 1.50, image: "img/products/Romaine_lettuce.jpg" },
    2: { id: 2, name: "Tomato cherry 1LB", price: 0.65, image: "img/products/tomate.png" },
    3: { id: 3, name: "Broccoli 1lb (Medium bouquet)", price: 1.98, image: "img/products/brocoli.jpg" },
    4: { id: 4, name: "Parsley 100 GR", price: 1.50, image: "img/products/parsley.jpg" },
    5: { id: 5, name: "Green Cabbage 1LB", price: 1.78, image: "img/products/cabbage.jpg" },
    6: { id: 6, name: "National onion", price: 1.98, image: "img/products/onion.png" },
    7: { id: 7, name: "National cucumber 1 LB", price: 0.75, image: "img/products/cucumber.jpg" },
    8: { id: 8, name: "National carrot", price: 0.48, image: "img/products/zanahoria.jpg" },
    9: { id: 9, name: "Purple cabbage", price: 0.98, image: "img/products/repollomorado.jpg" },
    10: { id: 10, name: "Garlic", price: 1.98, image: "img/products/ajo.jpg" }
};

function initializeLocalCart() {
    console.warn('Initializing fallback cart functionality');
    // This would initialize the original cart functionality as fallback
    // Only used if SharedCart is not available
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function showLoading() {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-overlay';
    loadingDiv.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Loading products...</p>
        </div>
    `;
    document.body.appendChild(loadingDiv);

    // Add loading styles
    const style = document.createElement('style');
    style.textContent = `
        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 3000;
        }
        .loading-spinner {
            text-align: center;
            color: white;
        }
        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #4CAF50;
            border-top: 4px solid transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);

    // Remove loading after 1.5 seconds
    setTimeout(() => {
        loadingDiv.remove();
        style.remove();
    }, 1500);
}

function showNotification(message, type = 'info') {
    // Only use fallback notification if SharedCart is not available
    if (window.SharedCart && window.SharedCart.showNotification) {
        window.SharedCart.showNotification(message, type);
        return;
    }
    
    // Fallback notification system
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

// Utility functions for filtering and sorting (keep existing functionality)
function filterByPrice(minPrice, maxPrice) {
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        const priceText = card.querySelector('.product-price').textContent;
        const price = parseFloat(priceText.replace('B/.', ''));
        
        if (price >= minPrice && price <= maxPrice) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

function sortProducts(criteria) {
    const productCards = Array.from(document.querySelectorAll('.product-card'));
    const container = document.getElementById('productsGrid');
    
    if (!container) return;
    
    productCards.sort((a, b) => {
        switch(criteria) {
            case 'price-low':
                const priceA = parseFloat(a.querySelector('.product-price').textContent.replace('B/.', ''));
                const priceB = parseFloat(b.querySelector('.product-price').textContent.replace('B/.', ''));
                return priceA - priceB;
            case 'price-high':
                const priceA2 = parseFloat(a.querySelector('.product-price').textContent.replace('B/.', ''));
                const priceB2 = parseFloat(b.querySelector('.product-price').textContent.replace('B/.', ''));
                return priceB2 - priceA2;
            case 'name':
                const nameA = a.querySelector('.product-name').textContent;
                const nameB = b.querySelector('.product-name').textContent;
                return nameA.localeCompare(nameB);
            default:
                return 0;
        }
    });
    
    // Re-append sorted cards
    productCards.forEach(card => container.appendChild(card));
}

// Export utility functions
window.ProductsUtils = {
    filterByPrice,
    sortProducts
};

// CSS for fallback notifications
const notificationStyle = document.createElement('style');
notificationStyle.textContent = `
    .notification {
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
    }
    
    .notification.show {
        opacity: 1;
        transform: translateX(0);
    }
    
    .notification.error { background: #dc3545; }
    .notification.info { background: #17a2b8; }
    .notification.success { background: #28a745; }
`;
document.head.appendChild(notificationStyle);

console.log('Products page script loaded with shared cart integration');
