// js/savings.js - Perfect integration with SharedCart

document.addEventListener('DOMContentLoaded', function() {
    console.log('Savings page loading with SharedCart integration...');
    
    // Wait for SharedCart to be available
    if (window.SharedCart) {
        initializeSavingsPage();
    } else {
        // Wait a bit if SharedCart is not ready
        setTimeout(() => {
            if (window.SharedCart) {
                initializeSavingsPage();
            } else {
                console.error('SharedCart is not available');
            }
        }, 100);
    }
});

// ========================================
// MAIN INITIALIZATION
// ========================================
function initializeSavingsPage() {
    console.log('Initializing savings page with SharedCart...');
    
    // Connect product buttons
    attachProductEvents();
    
    // Configure page functionality
    initializeSearch();
    initializeViewToggle();
    initializeSorting();
    initializeKeyboardShortcuts();
    
    // Animate cards on load
    animateCards();
    
    console.log('Savings page initialized successfully!');
}

// ========================================
// PRODUCT EVENTS
// ========================================
function attachProductEvents() {
    console.log('Attaching product events...');
    
    // Connect all "Add to cart" buttons
    const addButtons = document.querySelectorAll('.add-btn');
    console.log('Found add buttons:', addButtons.length);
    
    addButtons.forEach((button, index) => {
        // Get product ID from button data-id or container
        const productId = getProductId(button);
        
        if (productId) {
            // Convert regular ID to savings ID (100+)
            const savingsId = productId + 100;
            
            console.log(`Button ${index + 1}: Product ID ${productId} -> Savings ID ${savingsId}`);
            
            // Remove any previous event
            button.removeEventListener('click', handleAddToCart);
            
            // Add new event
            button.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                // Use SharedCart to add product
                const success = window.SharedCart.addItem(savingsId);
                
                if (success) {
                    animateAddButton(button);
                    console.log(`Added product ${savingsId} to SharedCart`);
                } else {
                    console.error(`Failed to add product ${savingsId} to cart`);
                    window.SharedCart.showNotification('Error adding product', 'error');
                }
            });
            
        } else {
            console.warn('No product ID found for button:', button);
        }
    });
    
    // Connect favorite buttons
    const favoriteButtons = document.querySelectorAll('.favorite-btn');
    favoriteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(this);
        });
    });
    
    console.log('Product events attached successfully');
}

function getProductId(button) {
    // Try to get ID from button
    let productId = button.dataset.id;
    
    // If not on button, look in parent container
    if (!productId) {
        const productCard = button.closest('.product-card');
        if (productCard) {
            productId = productCard.dataset.id;
        }
    }
    
    return productId ? parseInt(productId) : null;
}

function handleAddToCart(e) {
    // This function is used as reference to remove events
    e.preventDefault();
}

// ========================================
// SEARCH FUNCTIONALITY
// ========================================
function initializeSearch() {
    const searchInput = document.querySelector('.search-input');
    const searchBtn = document.querySelector('.search-btn');
    
    if (searchInput) {
        // Real-time search
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.trim().toLowerCase();
            filterProducts(searchTerm);
        });
        
        // Search on Enter key
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const searchTerm = e.target.value.trim().toLowerCase();
                filterProducts(searchTerm);
            }
        });
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (searchInput) {
                const searchTerm = searchInput.value.trim().toLowerCase();
                filterProducts(searchTerm);
            }
        });
    }
}

function filterProducts(searchTerm) {
    const productCards = document.querySelectorAll('.product-card');
    let visibleCount = 0;
    
    productCards.forEach(card => {
        const productName = card.querySelector('.product-name');
        const nameText = productName ? productName.textContent.toLowerCase() : '';
        
        if (!searchTerm || nameText.includes(searchTerm)) {
            card.style.display = 'block';
            card.style.opacity = '1';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });
    
    // Show "no results" message if needed
    toggleNoResultsMessage(visibleCount === 0 && searchTerm);
    
    if (searchTerm && window.SharedCart) {
        window.SharedCart.showNotification(`Found ${visibleCount} products`, 'info');
    }
}

function toggleNoResultsMessage(show) {
    let noResultsMsg = document.querySelector('.no-results-message');
    const productsGrid = document.querySelector('.products-grid');
    
    if (show && !noResultsMsg && productsGrid) {
        noResultsMsg = document.createElement('div');
        noResultsMsg.className = 'no-results-message';
        noResultsMsg.style.gridColumn = '1 / -1';
        noResultsMsg.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #6c757d;">
                <h3>No products found</h3>
                <p>Try different search terms</p>
                <button onclick="clearSearch()" style="margin-top: 15px; padding: 8px 16px; background: #2b632b; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Show All
                </button>
            </div>
        `;
        productsGrid.appendChild(noResultsMsg);
    } else if (!show && noResultsMsg) {
        noResultsMsg.remove();
    }
}

// ========================================
// VIEW FUNCTIONALITY
// ========================================
function initializeViewToggle() {
    const gridBtn = document.querySelector('.grid-btn');
    const listBtn = document.querySelector('.list-btn');
    const productsGrid = document.querySelector('.products-grid');
    
    if (gridBtn && productsGrid) {
        gridBtn.addEventListener('click', function() {
            switchToGridView(gridBtn, listBtn, productsGrid);
        });
    }
    
    if (listBtn && productsGrid) {
        listBtn.addEventListener('click', function() {
            switchToListView(gridBtn, listBtn, productsGrid);
        });
    }
}

function switchToGridView(gridBtn, listBtn, productsGrid) {
    gridBtn.classList.add('active');
    if (listBtn) listBtn.classList.remove('active');
    productsGrid.classList.remove('list-view');
    
    if (window.SharedCart) {
        window.SharedCart.showNotification('Grid view activated', 'info');
    }
}

function switchToListView(gridBtn, listBtn, productsGrid) {
    if (listBtn) listBtn.classList.add('active');
    if (gridBtn) gridBtn.classList.remove('active');
    productsGrid.classList.add('list-view');
    
    if (window.SharedCart) {
        window.SharedCart.showNotification('List view activated', 'info');
    }
}

// ========================================
// SORTING FUNCTIONALITY
// ========================================
function initializeSorting() {
    // Add sorting controls if they don't exist
    const navSection = document.querySelector('.nav-section .container .nav-controls');
    if (navSection && !document.querySelector('.sort-controls')) {
        const sortControls = document.createElement('div');
        sortControls.className = 'sort-controls';
        sortControls.innerHTML = `
            <select class="sort-select" onchange="applySorting(this.value)">
                <option value="default">Sort by...</option>
                <option value="name">Name A-Z</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="savings-high">Highest Savings</option>
            </select>
        `;
        navSection.appendChild(sortControls);
    }
}

function applySorting(sortType) {
    const productCards = Array.from(document.querySelectorAll('.product-card'));
    const container = document.querySelector('.products-grid');
    
    if (!container || productCards.length === 0) return;
    
    productCards.sort((a, b) => {
        const getCardData = (card) => {
            const name = card.querySelector('.product-name')?.textContent.trim() || '';
            const currentPriceElement = card.querySelector('.current-price');
            const currentPriceText = currentPriceElement ? currentPriceElement.textContent.replace(/[^0-9.]/g, '') : '0';
            const price = parseFloat(currentPriceText) || 0;
            
            const oldPriceElement = card.querySelector('.old-price');
            const oldPriceText = oldPriceElement ? oldPriceElement.textContent.replace(/[^0-9.]/g, '') : '0';
            const oldPrice = parseFloat(oldPriceText) || price;
            
            const savingsPercent = oldPrice > price ? ((oldPrice - price) / oldPrice) * 100 : 0;
            
            return { name, price, oldPrice, savingsPercent };
        };
        
        const dataA = getCardData(a);
        const dataB = getCardData(b);
        
        switch (sortType) {
            case 'name':
                return dataA.name.localeCompare(dataB.name);
            case 'price-low':
                return dataA.price - dataB.price;
            case 'price-high':
                return dataB.price - dataA.price;
            case 'savings-high':
                return dataB.savingsPercent - dataA.savingsPercent;
            default:
                return 0;
        }
    });
    
    // Remove and re-add cards with animation
    productCards.forEach((card, index) => {
        card.style.opacity = '0';
        setTimeout(() => {
            container.appendChild(card);
            card.style.transition = 'opacity 0.3s ease';
            card.style.opacity = '1';
        }, index * 50);
    });
    
    if (window.SharedCart) {
        const sortNames = {
            'name': 'name',
            'price-low': 'price ascending',
            'price-high': 'price descending',
            'savings-high': 'highest savings'
        };
        window.SharedCart.showNotification(`Products sorted by ${sortNames[sortType]}`, 'info');
    }
}

// ========================================
// FAVORITES FUNCTIONALITY
// ========================================
function toggleFavorite(button) {
    const productCard = button.closest('.product-card');
    const productName = productCard ? productCard.querySelector('.product-name')?.textContent : 'Product';
    
    const isFavorited = button.textContent.trim() === '❤' || button.classList.contains('favorited');
    
    if (!isFavorited) {
        button.textContent = '❤';
        button.style.color = '#dc3545';
        button.classList.add('favorited');
        
        if (window.SharedCart) {
            window.SharedCart.showNotification(`${productName} added to favorites`, 'success');
        }
    } else {
        button.textContent = '♡';
        button.style.color = '#999';
        button.classList.remove('favorited');
        
        if (window.SharedCart) {
            window.SharedCart.showNotification(`${productName} removed from favorites`, 'info');
        }
    }
    
    // Button animation
    button.style.transform = 'scale(1.2)';
    button.style.transition = 'all 0.2s ease';
    setTimeout(() => {
        button.style.transform = 'scale(1)';
    }, 200);
}

// ========================================
// ANIMATIONS AND VISUAL EFFECTS
// ========================================
function animateCards() {
    const cards = document.querySelectorAll('.product-card');
    
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'none';
        
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

function animateAddButton(button) {
    if (!button) return;
    
    const originalText = button.textContent;
    const originalBg = button.style.backgroundColor || '';
    
    // Click animation
    button.style.transform = 'scale(0.95)';
    button.style.transition = 'all 0.1s ease';
    
    setTimeout(() => {
        button.style.transform = 'scale(1)';
        button.textContent = '✓ Added!';
        button.style.backgroundColor = '#28a745';
        button.style.color = 'white';
        button.disabled = true;
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.backgroundColor = originalBg;
            button.style.color = '';
            button.disabled = false;
        }, 1500);
    }, 100);
}

// ========================================
// KEYBOARD SHORTCUTS
// ========================================
function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // ESC to clear search
        if (e.key === 'Escape') {
            clearSearch();
        }
        
        // Ctrl+F to focus search
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            const searchInput = document.querySelector('.search-input');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }
        
        // G for grid view
        if (e.key === 'g' || e.key === 'G') {
            if (!e.ctrlKey && !e.altKey) {
                const gridBtn = document.querySelector('.grid-btn');
                if (gridBtn) gridBtn.click();
            }
        }
        
        // L for list view
        if (e.key === 'l' || e.key === 'L') {
            if (!e.ctrlKey && !e.altKey) {
                const listBtn = document.querySelector('.list-btn');
                if (listBtn) listBtn.click();
            }
        }
    });
}

// ========================================
// GLOBAL FUNCTIONS
// ========================================
window.clearSearch = function() {
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.value = '';
    }
    filterProducts('');
};

window.applySorting = applySorting;

// Debug function to verify integration
window.debugSavings = function() {
    console.log('=== DEBUG SAVINGS PAGE ===');
    console.log('SharedCart available:', !!window.SharedCart);
    console.log('Add buttons found:', document.querySelectorAll('.add-btn').length);
    console.log('Product cards found:', document.querySelectorAll('.product-card').length);
    
    if (window.SharedCart) {
        console.log('Cart items:', window.SharedCart.items.length);
        console.log('Cart summary:', window.SharedCart.getCartSummary());
    }
    
    return {
        sharedCartAvailable: !!window.SharedCart,
        addButtons: document.querySelectorAll('.add-btn').length,
        productCards: document.querySelectorAll('.product-card').length,
        cartItems: window.SharedCart ? window.SharedCart.items.length : 0
    };
};

// ========================================
// ADDITIONAL STYLES
// ========================================
const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
    .sort-controls {
        display: flex;
        align-items: center;
        margin-left: auto;
    }
    
    .sort-select {
        padding: 8px 12px;
        border: 2px solid #2b632b;
        border-radius: 4px;
        background: white;
        color: #2b632b;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
        min-width: 180px;
    }
    
    .sort-select:hover,
    .sort-select:focus {
        background: #2b632b;
        color: white;
        outline: none;
    }
    
    .products-grid.list-view .product-card {
        display: flex;
        flex-direction: row;
        text-align: left;
        max-width: none;
        align-items: center;
    }
    
    .products-grid.list-view .product-image {
        width: 150px;
        height: 150px;
        flex-shrink: 0;
        margin-right: 20px;
        margin-bottom: 0;
    }
    
    .products-grid.list-view .product-info {
        flex: 1;
        text-align: left;
    }
    
    .products-grid.list-view .add-btn {
        width: auto;
        margin-left: auto;
        margin-top: 0;
    }
    
    .add-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    
    .favorite-btn:hover {
        transform: scale(1.1);
    }
    
    .product-card {
        transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    
    .product-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 25px rgba(0,0,0,0.1);
    }
    
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .no-results-message {
        animation: fadeIn 0.5s ease-in;
    }
`;
document.head.appendChild(additionalStyles);

console.log('Savings.js loaded and ready to integrate with SharedCart!');
console.log('Use debugSavings() in console to check integration status');
