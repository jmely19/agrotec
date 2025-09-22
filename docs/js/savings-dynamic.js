// js/savings-dynamic.js - Dynamic loading for Savings page

// ========================================
// DYNAMIC SAVINGS SYSTEM
// ========================================

window.SavingsManager = {
    originalOffers: {
        101: { id: 101, name: "Tomato cherry 1LB", price: 0.47, originalPrice: 0.65, image: "img/savings/tomate.png", type: "savings", savings: "28%" },
        102: { id: 102, name: "Purple Cabbage", price: 0.85, originalPrice: 0.98, image: "img/savings/repollomorado.png", type: "savings", savings: "13%" },
        103: { id: 103, name: "Green Cabbage 1LB", price: 1.13, originalPrice: 1.78, image: "img/savings/green_cabbage.png", type: "savings", savings: "37%" },
        104: { id: 104, name: "Avocado", price: 0.60, originalPrice: 0.78, image: "img/savings/avocado.png", type: "savings", savings: "23%" },
        105: { id: 105, name: "Parsley 100 GR", price: 0.95, originalPrice: 1.50, image: "img/savings/parsley.png", type: "savings", savings: "37%" },
        106: { id: 106, name: "National Carrot", price: 0.38, originalPrice: 0.48, image: "img/savings/zanahoria.png", type: "savings", savings: "21%" },
        107: { id: 107, name: "National Onion", price: 0.95, originalPrice: 1.98, image: "img/savings/onion.png", type: "savings", savings: "52%" },
        108: { id: 108, name: "Pineapple", price: 0.76, originalPrice: 1.03, image: "img/savings/pineapple.png", type: "savings", savings: "26%" }
    },
    
    allOffers: {},
    filteredOffers: {},
    currentSort: 'default',
    currentSearch: '',
    currentDiscountFilter: 'all',
    isLoading: false,
    
    init() {
        console.log('🏷️ Initializing Savings Manager...');
        this.loadAllOffers();
        this.bindEvents();
        this.loadOffers();
        console.log('✅ Savings Manager ready!');
    },
    
    // ========================================
    // OFFERS LOADING
    // ========================================
    
    loadAllOffers() {
        // Combine original offers with farmer offers
        this.allOffers = { ...this.originalOffers };
        
        // Load farmer products that are offers
        try {
            const farmerProducts = JSON.parse(localStorage.getItem('farmer_products') || '[]');
            console.log('Checking farmer products for offers:', farmerProducts.length);
            
            farmerProducts.forEach(product => {
                // Check if it's an active offer that should appear in savings
                if (product.status === 'active' && 
                    product.onlineStore && 
                    product.isOffer && 
                    product.type === 'savings' &&
                    product.originalPrice && 
                    product.originalPrice > product.price) {
                    
                    const discountPercent = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
                    
                    console.log('Adding farmer offer to savings:', {
                        id: product.id,
                        title: product.title,
                        price: product.price,
                        originalPrice: product.originalPrice,
                        discount: discountPercent + '%'
                    });
                    
                    this.allOffers[product.id] = {
                        id: product.id,
                        name: product.title,
                        price: product.price,
                        originalPrice: product.originalPrice,
                        image: product.image,
                        type: 'savings',
                        savings: `${discountPercent}%`,
                        farmer: product.farmerName,
                        weight: product.weight ? `${product.weight.value} ${product.weight.unit}` : '',
                        description: product.description,
                        dateAdded: product.dateCreated,
                        isFarmerOffer: true,
                        discountPercent: discountPercent
                    };
                } else {
                    // Debug why it's not being added
                    if (product.isOffer) {
                        console.log('Farmer offer not added because:', {
                            id: product.id,
                            title: product.title,
                            status: product.status,
                            onlineStore: product.onlineStore,
                            isOffer: product.isOffer,
                            type: product.type,
                            hasOriginalPrice: !!product.originalPrice,
                            priceComparison: product.originalPrice > product.price
                        });
                    }
                }
            });
            
            const farmerOffersCount = Object.values(this.allOffers).filter(o => o.isFarmerOffer).length;
            console.log(`Loaded ${farmerOffersCount} farmer offers out of ${farmerProducts.filter(p => p.isOffer).length} farmer offers total`);
            
        } catch (error) {
            console.error('Error loading farmer offers:', error);
        }
        
        // Calculate discount percentages for original offers
        Object.keys(this.allOffers).forEach(id => {
            const offer = this.allOffers[id];
            if (!offer.discountPercent && offer.originalPrice && offer.price) {
                offer.discountPercent = Math.round(((offer.originalPrice - offer.price) / offer.originalPrice) * 100);
            }
        });
        
        // Sync with SharedCart if available
        if (window.SharedCart) {
            Object.keys(this.allOffers).forEach(id => {
                if (!window.SharedCart.allProducts[id]) {
                    window.SharedCart.allProducts[id] = this.allOffers[id];
                }
            });
            console.log('Synced offers with SharedCart');
        }
        
        console.log('Total offers available:', Object.keys(this.allOffers).length);
    },
    
    loadOffers() {
        this.showLoading(true);
        
        // Simulate loading delay
        setTimeout(() => {
            this.applyFilters();
            this.renderOffers();
            this.updateSavingsStats();
            this.showLoading(false);
        }, 600);
    },
    
    applyFilters() {
        let offers = { ...this.allOffers };
        
        // Apply search filter
        if (this.currentSearch) {
            const searchLower = this.currentSearch.toLowerCase();
            offers = Object.fromEntries(
                Object.entries(offers).filter(([id, offer]) =>
                    offer.name.toLowerCase().includes(searchLower) ||
                    (offer.farmer && offer.farmer.toLowerCase().includes(searchLower))
                )
            );
        }
        
        // Apply discount filter
        if (this.currentDiscountFilter !== 'all') {
            offers = Object.fromEntries(
                Object.entries(offers).filter(([id, offer]) => {
                    const discount = offer.discountPercent || 0;
                    switch (this.currentDiscountFilter) {
                        case '10-25':
                            return discount >= 10 && discount <= 25;
                        case '25-50':
                            return discount >= 25 && discount <= 50;
                        case '50+':
                            return discount > 50;
                        default:
                            return true;
                    }
                })
            );
        }
        
        // Apply sorting
        const offerArray = Object.values(offers);
        offerArray.sort((a, b) => {
            switch (this.currentSort) {
                case 'discount-high':
                    return (b.discountPercent || 0) - (a.discountPercent || 0);
                case 'discount-low':
                    return (a.discountPercent || 0) - (b.discountPercent || 0);
                case 'price-asc':
                    return a.price - b.price;
                case 'price-desc':
                    return b.price - a.price;
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'farmer':
                    return (a.farmer || 'AGROTEC').localeCompare(b.farmer || 'AGROTEC');
                case 'newest':
                    const dateA = new Date(a.dateAdded || '2024-01-01');
                    const dateB = new Date(b.dateAdded || '2024-01-01');
                    return dateB - dateA;
                default:
                    return (b.discountPercent || 0) - (a.discountPercent || 0); // Default to highest discount
            }
        });
        
        this.filteredOffers = offerArray.reduce((acc, offer) => {
            acc[offer.id] = offer;
            return acc;
        }, {});
    },
    
    // ========================================
    // RENDERING
    // ========================================
    
    renderOffers() {
        const grid = document.getElementById('savingsGrid');
        const noResults = document.getElementById('noOffersMessage');
        
        if (!grid) return;
        
        const offers = Object.values(this.filteredOffers);
        
        if (offers.length === 0) {
            grid.innerHTML = '';
            if (noResults) noResults.style.display = 'block';
            return;
        }
        
        if (noResults) noResults.style.display = 'none';
        
        grid.innerHTML = offers.map(offer => this.renderOfferCard(offer)).join('');
        
        // Attach event listeners
        this.attachOfferEvents();
    },
    
    renderOfferCard(offer) {
        const savings = offer.originalPrice ? 
            ((offer.originalPrice - offer.price) / offer.originalPrice * 100).toFixed(0) : 0;
        
        return `
            <div class="product-card savings-card" data-id="${offer.id}">
                <div class="product-image">
                    <img src="${offer.image}" alt="${offer.name}" onerror="this.src='img/savings/placeholder.png'">
                    <button class="favorite-btn" onclick="toggleSavingsFavorite(this)">♡</button>
                    <div class="discount-badge">${savings}% OFF</div>
                </div>
                <div class="product-info">
                    <span class="product-tag">Discount</span>
                    <h3 class="product-name">${offer.name}</h3>
                    <div class="price-container">
                        <span class="old-price">B/.${offer.originalPrice.toFixed(2)}</span>
                        <span class="current-price">B/.${offer.price.toFixed(2)}</span>
                    </div>
                    <div class="savings-amount">You save B/.${(offer.originalPrice - offer.price).toFixed(2)}</div>
                    <button class="add-btn" onclick="SavingsManager.addToCart(${offer.id})">
                        Add to Cart 🛒
                    </button>
                </div>
            </div>
        `;
    },
    
    attachOfferEvents() {
        // Offer card hover effects with savings animation
        document.querySelectorAll('.savings-card').forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-10px) scale(1.03)';
                this.style.transition = 'all 0.3s ease';
                this.style.boxShadow = '0 15px 40px rgba(220, 53, 69, 0.2)';
                
                // Animate discount badge
                const badge = this.querySelector('.discount-badge');
                if (badge) {
                    badge.style.transform = 'scale(1.1)';
                    badge.style.animation = 'pulse 1s infinite';
                }
            });

            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1)';
                this.style.boxShadow = '';
                
                const badge = this.querySelector('.discount-badge');
                if (badge) {
                    badge.style.transform = 'scale(1)';
                    badge.style.animation = '';
                }
            });
        });
    },
    
    // ========================================
    // EVENT HANDLING
    // ========================================
    
    bindEvents() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.currentSearch = e.target.value.trim();
                this.debounceSearch();
            });
            
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.loadOffers();
                }
            });
        }
        
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.loadOffers());
        }
        
        // View toggle
        const gridBtn = document.getElementById('gridViewBtn');
        const listBtn = document.getElementById('listViewBtn');
        const savingsGrid = document.getElementById('savingsGrid');
        
        if (gridBtn) {
            gridBtn.addEventListener('click', () => {
                gridBtn.classList.add('active');
                if (listBtn) listBtn.classList.remove('active');
                if (savingsGrid) savingsGrid.classList.remove('list-view');
                this.showNotification('Grid view activated', 'info');
            });
        }
        
        if (listBtn) {
            listBtn.addEventListener('click', () => {
                listBtn.classList.add('active');
                if (gridBtn) gridBtn.classList.remove('active');
                if (savingsGrid) savingsGrid.classList.add('list-view');
                this.showNotification('List view activated', 'info');
            });
        }
        
        // Sorting
        const sortSelect = document.getElementById('savingsSort');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.loadOffers();
            });
        }
        
        // Discount filtering
        const discountFilter = document.getElementById('discountFilter');
        if (discountFilter) {
            discountFilter.addEventListener('change', (e) => {
                this.currentDiscountFilter = e.target.value;
                this.loadOffers();
            });
        }
        
        // Storage event listener for farmer products
        window.addEventListener('storage', (e) => {
            if (e.key === 'farmer_products') {
                console.log('Farmer offers updated, reloading...');
                this.loadAllOffers();
                this.loadOffers();
            }
        });
        
        // Listen for new offers from farmer dashboard
        window.addEventListener('newProductAdded', (e) => {
            if (e.detail && e.detail.isOffer) {
                console.log('New offer added:', e.detail);
                this.loadAllOffers();
                this.loadOffers();
                this.showNotification(`New offer added: ${e.detail.title}`, 'success');
            }
        });
        
        // Listen for farmer products specifically
        window.addEventListener('farmerProductAdded', (e) => {
            if (e.detail && e.detail.type === 'savings') {
                console.log('Farmer offer added:', e.detail);
                this.loadAllOffers();
                this.loadOffers();
                this.showNotification(`New farmer offer: ${e.detail.title}`, 'success');
            }
        });
        
        // Listen for products update trigger
        window.addEventListener('storage', (e) => {
            if (e.key === 'products_update_trigger') {
                setTimeout(() => {
                    this.loadAllOffers();
                    this.loadOffers();
                }, 200);
            }
        });
    },
    
    debounceSearch() {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.loadOffers();
        }, 500);
    },
    
    // ========================================
    // CART INTEGRATION
    // ========================================
    
    addToCart(offerId) {
        if (window.SharedCart) {
            const success = window.SharedCart.addItem(offerId);
            if (success) {
                this.animateAddButton(offerId);
                
                // Show savings notification
                const offer = this.allOffers[offerId];
                if (offer) {
                    const savings = (offer.originalPrice - offer.price).toFixed(2);
                    this.showNotification(`Added ${offer.name}! You saved B/.${savings}`, 'success');
                }
            }
        } else {
            this.showNotification('Cart system not available', 'error');
        }
    },
    
    animateAddButton(offerId) {
        const card = document.querySelector(`[data-id="${offerId}"]`);
        const button = card?.querySelector('.add-btn');
        
        if (button) {
            const originalText = button.textContent;
            button.style.transform = 'scale(0.95)';
            button.textContent = '✓ Deal Added!';
            button.style.background = '#28a745';
            button.disabled = true;
            
            // Add sparkle effect
            button.style.boxShadow = '0 0 20px rgba(40, 167, 69, 0.5)';
            
            setTimeout(() => {
                button.style.transform = 'scale(1)';
                button.textContent = originalText;
                button.style.background = '';
                button.style.boxShadow = '';
                button.disabled = false;
            }, 2000);
        }
    },
    
    // ========================================
    // STATISTICS
    // ========================================
    
    updateSavingsStats() {
        const offers = Object.values(this.filteredOffers);
        const farmerOffers = offers.filter(o => o.isFarmerOffer);
        
        // Calculate statistics
        const totalOffers = offers.length;
        const totalDiscounts = offers.map(o => o.discountPercent || 0);
        const averageDiscount = totalDiscounts.length > 0 ? 
            Math.round(totalDiscounts.reduce((a, b) => a + b, 0) / totalDiscounts.length) : 0;
        const maxDiscount = Math.max(...totalDiscounts, 0);
        
        // Count new offers (within last week)
        const newOffers = offers.filter(o => o.dateAdded && this.isRecentOffer(o.dateAdded));
        
        // Update stat elements (these elements were removed from HTML, so this won't error but won't do anything)
        const totalCount = document.getElementById('totalOffersCount');
        const avgDiscount = document.getElementById('averageDiscount');
        const newCount = document.getElementById('newOffersCount');
        const maxDiscountEl = document.getElementById('maxDiscount');
        
        if (totalCount) totalCount.textContent = totalOffers;
        if (avgDiscount) avgDiscount.textContent = `${averageDiscount}%`;
        if (newCount) newCount.textContent = newOffers.length;
        if (maxDiscountEl) maxDiscountEl.textContent = `${maxDiscount}%`;
        
        console.log(`📊 Savings Stats: ${totalOffers} offers, ${averageDiscount}% avg discount, ${maxDiscount}% max`);
    },
    
    // ========================================
    // UTILITIES
    // ========================================
    
    showLoading(show) {
        const loadingSection = document.getElementById('loadingSection');
        const productsSection = document.querySelector('.products-section');
        
        if (loadingSection) {
            loadingSection.style.display = show ? 'block' : 'none';
        }
        
        if (productsSection) {
            productsSection.style.opacity = show ? '0.5' : '1';
        }
        
        this.isLoading = show;
    },
    
    showNotification(message, type = 'info') {
        if (window.SharedCart && window.SharedCart.showNotification) {
            window.SharedCart.showNotification(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    },
    
    isRecentOffer(dateString) {
        const offerDate = new Date(dateString);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return offerDate > weekAgo;
    },
    
    // ========================================
    // PUBLIC API
    // ========================================
    
    refreshOffers() {
        this.loadAllOffers();
        this.loadOffers();
        this.showNotification('Offers refreshed', 'success');
    },
    
    searchOffers(term) {
        this.currentSearch = term;
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = term;
        this.loadOffers();
    },
    
    filterByDiscount(range) {
        this.currentDiscountFilter = range;
        const discountFilter = document.getElementById('discountFilter');
        if (discountFilter) discountFilter.value = range;
        this.loadOffers();
    },
    
    sortBy(sortType) {
        this.currentSort = sortType;
        const sortSelect = document.getElementById('savingsSort');
        if (sortSelect) sortSelect.value = sortType;
        this.loadOffers();
    },
    
    debug() {
        console.group('🏷️ Savings Manager Debug');
        console.log('All Offers:', Object.keys(this.allOffers).length);
        console.log('Filtered Offers:', Object.keys(this.filteredOffers).length);
        console.log('Current Search:', this.currentSearch);
        console.log('Current Sort:', this.currentSort);
        console.log('Current Discount Filter:', this.currentDiscountFilter);
        console.log('Is Loading:', this.isLoading);
        
        const farmerOffers = Object.values(this.allOffers).filter(o => o.isFarmerOffer);
        console.log('Farmer Offers:', farmerOffers.length);
        console.log('Farmer Offers Detail:', farmerOffers);
        
        // Debug farmer products from localStorage
        try {
            const farmerProducts = JSON.parse(localStorage.getItem('farmer_products') || '[]');
            const offerProducts = farmerProducts.filter(p => p.isOffer);
            console.log('Raw farmer products with offers:', offerProducts.length);
            console.log('Farmer offer products:', offerProducts.map(p => ({
                id: p.id,
                title: p.title,
                type: p.type,
                isOffer: p.isOffer,
                status: p.status,
                onlineStore: p.onlineStore,
                price: p.price,
                originalPrice: p.originalPrice
            })));
        } catch (error) {
            console.error('Error reading farmer products:', error);
        }
        
        const discounts = Object.values(this.allOffers).map(o => o.discountPercent || 0);
        const avgDiscount = discounts.length > 0 ? discounts.reduce((a, b) => a + b, 0) / discounts.length : 0;
        console.log('Average Discount:', avgDiscount.toFixed(1) + '%');
        
        console.groupEnd();
        
        return {
            totalOffers: Object.keys(this.allOffers).length,
            filteredOffers: Object.keys(this.filteredOffers).length,
            farmerOffers: farmerOffers.length,
            averageDiscount: avgDiscount.toFixed(1) + '%',
            currentFilters: {
                search: this.currentSearch,
                sort: this.currentSort,
                discount: this.currentDiscountFilter
            }
        };
    },

    // New debug function specifically for troubleshooting
    debugFarmerOffers() {
        console.group('🌱 Farmer Offers Debug');
        
        try {
            const farmerProducts = JSON.parse(localStorage.getItem('farmer_products') || '[]');
            console.log('Total farmer products:', farmerProducts.length);
            
            const offerProducts = farmerProducts.filter(p => p.isOffer);
            console.log('Products marked as offers:', offerProducts.length);
            
            offerProducts.forEach(product => {
                console.log(`Product ${product.id}: ${product.title}`);
                console.log('- Type:', product.type);
                console.log('- Is Offer:', product.isOffer);
                console.log('- Status:', product.status);
                console.log('- Online Store:', product.onlineStore);
                console.log('- Price:', product.price);
                console.log('- Original Price:', product.originalPrice);
                console.log('- Valid for savings?', 
                    product.status === 'active' && 
                    product.onlineStore && 
                    product.isOffer && 
                    product.type === 'savings' &&
                    product.originalPrice && 
                    product.originalPrice > product.price
                );
                console.log('---');
            });
            
        } catch (error) {
            console.error('Error in debugFarmerOffers:', error);
        }
        
        console.groupEnd();
    }
};

// ========================================
// GLOBAL FUNCTIONS
// ========================================

window.clearSavingsFilters = function() {
    SavingsManager.currentSearch = '';
    SavingsManager.currentSort = 'default';
    SavingsManager.currentDiscountFilter = 'all';
    
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('savingsSort');
    const discountFilter = document.getElementById('discountFilter');
    
    if (searchInput) searchInput.value = '';
    if (sortSelect) sortSelect.value = 'default';
    if (discountFilter) discountFilter.value = 'all';
    
    SavingsManager.loadOffers();
    SavingsManager.showNotification('All filters cleared', 'info');
};

window.toggleSavingsFavorite = function(button) {
    const card = button.closest('.product-card');
    const productName = card?.querySelector('.product-name')?.textContent || 'Deal';
    
    if (button.textContent === '♡') {
        button.textContent = '♥';
        button.style.color = '#dc3545';
        button.style.transform = 'scale(1.2)';
        SavingsManager.showNotification(`${productName} added to favorites`, 'success');
    } else {
        button.textContent = '♡';
        button.style.color = '';
        button.style.transform = 'scale(1)';
        SavingsManager.showNotification(`${productName} removed from favorites`, 'info');
    }
    
    setTimeout(() => {
        button.style.transform = 'scale(1)';
    }, 200);
};

// Export for external access
window.SavingsManager = SavingsManager;

// Global debug function
window.debugSavingsFarmerOffers = function() {
    return SavingsManager.debugFarmerOffers();
};

window.debugSavings = function() {
    return SavingsManager.debug();
};

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    // Wait for SharedCart to be available
    setTimeout(() => {
        SavingsManager.init();
    }, 300);
});

// Additional CSS for savings-specific features
const savingsCSS = document.createElement('style');
savingsCSS.textContent = `
    .savings-controls {
        display: flex;
        gap: 10px;
        margin-left: auto;
    }
    
    .savings-sort, .discount-filter {
        padding: 8px 12px;
        border: 2px solid #2b632b;
        border-radius: 4px;
        background: white;
        color: #000000ff;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
        min-width: 150px;
    }
    
    .savings-sort:hover, .savings-sort:focus,
    .discount-filter:hover, .discount-filter:focus {
        background: #2b632b;
        color: white;
        outline: none;
    }
    
    .savings-banner {
        background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
        color: white;
        padding: 30px 0;
        margin-bottom: 40px;
    }
    
    .savings-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 30px;
    }
    
    .stat-item {
        display: flex;
        align-items: center;
        gap: 15px;
        background: rgba(255, 255, 255, 0.1);
        padding: 20px;
        border-radius: 12px;
        backdrop-filter: blur(10px);
    }
    
    .stat-icon {
        font-size: 2rem;
    }
    
    .stat-info {
        flex: 1;
    }
    
    .stat-number {
        display: block;
        font-size: 1.8rem;
        font-weight: bold;
        margin-bottom: 2px;
    }
    
    .stat-label {
        font-size: 0.9rem;
        opacity: 0.9;
    }
    
    .savings-card {
        position: relative;
        overflow: hidden;
    }
    
    .discount-badge {
        position: absolute;
        top: 12px;
        right: 12px;
        background: #dc3545;
        color: white;
        padding: 6px 10px;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: bold;
        box-shadow: 0 2px 8px rgba(220, 53, 69, 0.3);
        z-index: 2;
    }
    
    .new-offer-badge {
        position: absolute;
        top: 12px;
        left: 12px;
        background: #28a745;
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.7rem;
        font-weight: bold;
        text-transform: uppercase;
        animation: pulse 2s infinite;
    }
    
    .farmer-offer-badge {
        position: absolute;
        top: 50px;
        right: 12px;
        background: #6f4f28;
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.7rem;
        font-weight: bold;
    }
    
    .price-container {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 8px 0;
    }
    
    .old-price {
        text-decoration: line-through;
        color: #999;
        font-size: 0.9rem;
    }
    
    .current-price {
        font-size: 1.3rem;
        font-weight: bold;
        color: #dc3545;
    }
    
    .savings-amount {
        background: #d4edda;
        color: #155724;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: bold;
        text-align: center;
        margin: 8px 0;
        border: 1px solid #c3e6cb;
    }
    
    .offer-farmer {
        font-size: 0.8rem;
        color: #6f4f28;
        font-weight: 600;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 4px;
    }
    
    .offer-farmer::before {
        content: "🌱";
        font-size: 0.7rem;
    }
    
    .add-btn {
        background: #1f4c1f;
        color: white;
        border: none;
        padding: 10px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.9rem;
        font-weight: bold;
        transition: all 0.3s ease;
        width: 100%;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .add-btn:hover {
        background: #28a745;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
    }
    
    .add-btn:active {
        transform: scale(0.98);
    }
    
    .no-offers-actions {
        margin-top: 20px;
        display: flex;
        gap: 15px;
        justify-content: center;
        flex-wrap: wrap;
    }
    
    .btn-browse-products, .btn-become-farmer {
        padding: 12px 20px;
        border-radius: 6px;
        text-decoration: none;
        font-weight: bold;
        transition: all 0.3s ease;
    }
    
    .btn-browse-products {
        background: #2b632b;
        color: white;
    }
    
    .btn-browse-products:hover {
        background: #1f4c1f;
        transform: translateY(-2px);
    }
    
    .btn-become-farmer {
        background: transparent;
        color: #6f4f28;
        border: 2px solid #6f4f28;
    }
    
    .btn-become-farmer:hover {
        background: #6f4f28;
        color: white;
        transform: translateY(-2px);
    }
    
    @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.05); opacity: 0.8; }
    }
    
    .loading-section {
        padding: 60px 0;
        background: #f8f9fa;
    }
    
    .loading-content {
        text-align: center;
        color: #666;
    }
    
    .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #dc3545;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 20px;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    /* List view specific styles for savings */
    .products-grid.list-view .savings-card {
        display: flex;
        flex-direction: row;
        text-align: left;
        align-items: center;
        padding: 20px;
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
        min-width: 140px;
    }
    
    .products-grid.list-view .price-container {
        margin: 12px 0;
    }
    
    .products-grid.list-view .current-price {
        font-size: 1.5rem;
    }
    
    @media (max-width: 768px) {
        .savings-controls {
            flex-direction: column;
            margin-left: 0;
            margin-top: 10px;
            width: 100%;
        }
        
        .savings-sort, .discount-filter {
            width: 100%;
        }
        
        .savings-stats {
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
        }
        
        .stat-item {
            padding: 15px;
        }
        
        .stat-number {
            font-size: 1.5rem;
        }
        
        .no-offers-actions {
            flex-direction: column;
            align-items: center;
        }
        
        .btn-browse-products, .btn-become-farmer {
            width: 200px;
            text-align: center;
        }
    }
`;

document.head.appendChild(savingsCSS);

console.log('🏷️ Savings Dynamic System loaded!');