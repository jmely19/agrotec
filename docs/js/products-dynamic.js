// js/products-dynamic.js - Dynamic loading for Products page with business name support

// ========================================
// DYNAMIC PRODUCTS SYSTEM WITH BUSINESS NAME
// ========================================

window.ProductsManager = {
    originalProducts: {
        1: { id: 1, name: "Romaine lettuce National 1LB", price: 1.50, originalPrice: null, image: "img/products/Romaine_lettuce.jpg", type: "regular", tag: "Local Flavor" },
        2: { id: 2, name: "Tomato cherry 1LB", price: 0.65, originalPrice: null, image: "img/products/tomate.png", type: "regular", tag: "Market Fresh" },
        3: { id: 3, name: "Broccoli 1lb (Medium bouquet)", price: 1.98, originalPrice: null, image: "img/products/brocoli.jpg", type: "regular", tag: "Local Flavor" },
        4: { id: 4, name: "Parsley 100 GR", price: 1.50, originalPrice: null, image: "img/products/parsley.jpg", type: "regular", tag: "Local Flavor" },
        5: { id: 5, name: "Green Cabbage 1LB", price: 1.78, originalPrice: null, image: "img/products/cabbage.jpg", type: "regular", tag: "Local Flavor" },
        6: { id: 6, name: "National onion", price: 1.98, originalPrice: null, image: "img/products/onion.png", type: "regular", tag: "Market Fresh" },
        7: { id: 7, name: "National cucumber 1 LB", price: 0.75, originalPrice: null, image: "img/products/cucumber.jpg", type: "regular", tag: "Market Fresh" },
        8: { id: 8, name: "National carrot", price: 0.48, originalPrice: null, image: "img/products/zanahoria.jpg", type: "regular", tag: "Sofia market" },
        9: { id: 9, name: "Purple cabbage", price: 0.98, originalPrice: null, image: "img/products/repollomorado.jpg", type: "regular", tag: "Francisco's Market" },
        10: { id: 10, name: "Garlic", price: 1.98, originalPrice: null, image: "img/products/ajo.jpg", type: "regular", tag: "Francisco's Market" }
    },
    
    allProducts: {},
    filteredProducts: {},
    currentSort: 'default',
    currentSearch: '',
    currentCategory: 'all',
    isLoading: false,
    
    init() {
        console.log('🛒 Initializing Products Manager...');
        this.loadAllProducts();
        this.bindEvents();
        this.loadProducts();
        console.log('✅ Products Manager ready!');
    },
    
    // ========================================
    // PRODUCT LOADING WITH BUSINESS NAME SUPPORT
    // ========================================
    
    loadAllProducts() {
        // Combine original products with farmer products
        this.allProducts = { ...this.originalProducts };
        
        // Load farmer products if available
        try {
            const farmerProducts = JSON.parse(localStorage.getItem('farmer_products') || '[]');
            farmerProducts.forEach(product => {
                if (product.type === 'regular' && product.status === 'active' && product.onlineStore) {
                    this.allProducts[product.id] = {
                        id: product.id,
                        name: product.title,
                        price: product.price,
                        originalPrice: product.originalPrice,
                        image: product.image,
                        type: 'regular',
                        // CRITICAL UPDATE: Use businessName without "BY" prefix
                        tag: `${(product.businessName || product.farmerName || 'LOCAL FARM').toUpperCase()}`,
                        farmer: product.farmerName,
                        businessName: product.businessName,
                        weight: product.weight ? `${product.weight.value} ${product.weight.unit}` : '',
                        description: product.description,
                        dateAdded: product.dateCreated,
                        isFarmerProduct: true
                    };
                }
            });
            
            console.log(`📦 Loaded ${farmerProducts.length} farmer products`);
        } catch (error) {
            console.error('Error loading farmer products:', error);
        }
        
        // Sync with SharedCart if available
        if (window.SharedCart) {
            Object.keys(this.allProducts).forEach(id => {
                if (!window.SharedCart.allProducts[id]) {
                    window.SharedCart.allProducts[id] = this.allProducts[id];
                }
            });
        }
    },
    
    loadProducts() {
        this.showLoading(true);
        
        // Simulate loading delay for better UX
        setTimeout(() => {
            this.applyFilters();
            this.renderProducts();
            this.updateStats();
            this.showLoading(false);
        }, 800);
    },
    
    applyFilters() {
        let products = { ...this.allProducts };
        
        // Apply search filter
        if (this.currentSearch) {
            const searchLower = this.currentSearch.toLowerCase();
            products = Object.fromEntries(
                Object.entries(products).filter(([id, product]) =>
                    product.name.toLowerCase().includes(searchLower) ||
                    product.tag.toLowerCase().includes(searchLower) ||
                    (product.farmer && product.farmer.toLowerCase().includes(searchLower)) ||
                    (product.businessName && product.businessName.toLowerCase().includes(searchLower))
                )
            );
        }
        
        // Apply category filter
        if (this.currentCategory !== 'all') {
            products = Object.fromEntries(
                Object.entries(products).filter(([id, product]) => {
                    switch (this.currentCategory) {
                        case 'regular':
                            return !product.isFarmerProduct;
                        case 'farmer-added':
                            return product.isFarmerProduct;
                        default:
                            return true;
                    }
                })
            );
        }
        
        // Apply sorting
        const productArray = Object.values(products);
        productArray.sort((a, b) => {
            switch (this.currentSort) {
                case 'name-asc':
                    return a.name.localeCompare(b.name);
                case 'name-desc':
                    return b.name.localeCompare(a.name);
                case 'price-asc':
                    return a.price - b.price;
                case 'price-desc':
                    return b.price - a.price;
                case 'farmer':
                    return (a.businessName || a.farmer || 'AGROTEC').localeCompare(b.businessName || b.farmer || 'AGROTEC');
                default:
                    return 0;
            }
        });
        
        this.filteredProducts = productArray.reduce((acc, product) => {
            acc[product.id] = product;
            return acc;
        }, {});
    },
    
    // ========================================
    // RENDERING WITH BUSINESS NAME
    // ========================================
    
    renderProducts() {
        const grid = document.getElementById('productsGrid');
        const noResults = document.getElementById('noResultsMessage');
        
        if (!grid) return;
        
        const products = Object.values(this.filteredProducts);
        
        if (products.length === 0) {
            grid.innerHTML = '';
            if (noResults) noResults.style.display = 'block';
            return;
        }
        
        if (noResults) noResults.style.display = 'none';
        
        grid.innerHTML = products.map(product => this.renderProductCard(product)).join('');
        
        // Attach event listeners
        this.attachProductEvents();
    },
    
    renderProductCard(product) {
        // Show "NEW" badge for recent farmer products
        const isNew = product.isFarmerProduct && this.isRecentProduct(product.dateAdded);
        const newBadge = isNew ? '<span class="new-badge">NEW</span>' : '';
        
        return `
            <div class="product-card ${product.isFarmerProduct ? 'farmer-product' : ''}" data-id="${product.id}" data-name="${product.name}" data-price="${product.price}">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}" onerror="this.src='img/products/placeholder.png'">
                    <button class="favorite-btn" onclick="toggleFavorite(this)">♡</button>
                    ${newBadge}
                </div>
                <div class="product-info">
                    <span class="product-tag ${product.isFarmerProduct ? 'farmer-tag' : ''}">${product.tag}</span>
                    <h3 class="product-name">${product.name}</h3>
                    <span class="product-price">B/.${product.price.toFixed(2)}</span>
                    <button class="add-to-cart-btn" onclick="ProductsManager.addToCart(${product.id})">
                        Add to Cart 🛒
                    </button>
                </div>
            </div>
        `;
    },
    
    attachProductEvents() {
        // Product card hover effects
        document.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-8px) scale(1.02)';
                this.style.transition = 'all 0.3s ease';
            });

            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1)';
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
                    this.loadProducts();
                }
            });
        }
        
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.loadProducts());
        }
        
        // View toggle
        const gridBtn = document.getElementById('gridViewBtn');
        const listBtn = document.getElementById('listViewBtn');
        const productsGrid = document.getElementById('productsGrid');
        
        if (gridBtn) {
            gridBtn.addEventListener('click', () => {
                gridBtn.classList.add('active');
                if (listBtn) listBtn.classList.remove('active');
                if (productsGrid) productsGrid.classList.remove('list-view');
                this.showNotification('Grid view activated', 'info');
            });
        }
        
        if (listBtn) {
            listBtn.addEventListener('click', () => {
                listBtn.classList.add('active');
                if (gridBtn) gridBtn.classList.remove('active');
                if (productsGrid) productsGrid.classList.add('list-view');
                this.showNotification('List view activated', 'info');
            });
        }
        
        // Sorting
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.loadProducts();
            });
        }
        
        // Category filtering
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.currentCategory = e.target.value;
                this.loadProducts();
            });
        }
        
        // Storage event listener for farmer products
        window.addEventListener('storage', (e) => {
            if (e.key === 'farmer_products') {
                console.log('Farmer products updated, reloading...');
                this.loadAllProducts();
                this.loadProducts();
            }
        });
        
        // Listen for new products from farmer dashboard
        window.addEventListener('newProductAdded', (e) => {
            console.log('New product added:', e.detail);
            this.loadAllProducts();
            this.loadProducts();
            this.showNotification(`New product added: ${e.detail.title}`, 'success');
        });
        
        // Listen for farmer products specifically
        window.addEventListener('farmerProductAdded', (e) => {
            console.log('Farmer product added:', e.detail);
            this.loadAllProducts();
            this.loadProducts();
            this.showNotification(`New farmer product: ${e.detail.title}`, 'success');
        });
        
        // Listen for products update trigger
        window.addEventListener('storage', (e) => {
            if (e.key === 'products_update_trigger') {
                setTimeout(() => {
                    this.loadAllProducts();
                    this.loadProducts();
                }, 200);
            }
        });
        
        // Listen for business name updates
        window.addEventListener('farmerProductsUpdated', (e) => {
            console.log('Farmer products updated with business names');
            this.loadAllProducts();
            this.loadProducts();
            this.showNotification(`${e.detail.updatedCount} products updated with business names`, 'success');
        });
    },
    
    debounceSearch() {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.loadProducts();
        }, 500);
    },
    
    // ========================================
    // CART INTEGRATION
    // ========================================
    
    addToCart(productId) {
        if (window.SharedCart) {
            const success = window.SharedCart.addItem(productId);
            if (success) {
                this.animateAddButton(productId);
            }
        } else {
            this.showNotification('Cart system not available', 'error');
        }
    },
    
    animateAddButton(productId) {
        const card = document.querySelector(`[data-id="${productId}"]`);
        const button = card?.querySelector('.add-to-cart-btn');
        
        if (button) {
            const originalText = button.textContent;
            button.style.transform = 'scale(0.95)';
            button.textContent = '✓ Added!';
            button.style.background = '#28a745';
            button.disabled = true;
            
            setTimeout(() => {
                button.style.transform = 'scale(1)';
                button.textContent = originalText;
                button.style.background = '';
                button.disabled = false;
            }, 1500);
        }
    },
    
    // ========================================
    // STATISTICS WITH BUSINESS NAME SUPPORT
    // ========================================
    
    updateStats() {
        const products = Object.values(this.filteredProducts);
        const farmerProducts = products.filter(p => p.isFarmerProduct);
        const totalPrice = products.reduce((sum, p) => sum + p.price, 0);
        const averagePrice = products.length > 0 ? totalPrice / products.length : 0;
        
        // Count unique businesses
        const uniqueBusinesses = new Set();
        farmerProducts.forEach(p => {
            if (p.businessName) {
                uniqueBusinesses.add(p.businessName);
            }
        });
        
        // Update stat elements
        const totalCount = document.getElementById('totalProductsCount');
        const farmerCount = document.getElementById('farmerProductsCount');
        const avgPrice = document.getElementById('averagePrice');
        const businessCount = document.getElementById('uniqueBusinessesCount');
        
        if (totalCount) totalCount.textContent = products.length;
        if (farmerCount) farmerCount.textContent = farmerProducts.length;
        if (avgPrice) avgPrice.textContent = `B/.${averagePrice.toFixed(2)}`;
        if (businessCount) businessCount.textContent = uniqueBusinesses.size;
        
        console.log(`📊 Stats: ${products.length} total, ${farmerProducts.length} from farmers, ${uniqueBusinesses.size} businesses`);
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
    
    isRecentProduct(dateString) {
        const productDate = new Date(dateString);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return productDate > weekAgo;
    },
    
    // ========================================
    // PUBLIC API
    // ========================================
    
    refreshProducts() {
        this.loadAllProducts();
        this.loadProducts();
        this.showNotification('Products refreshed', 'success');
    },
    
    searchProducts(term) {
        this.currentSearch = term;
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = term;
        this.loadProducts();
    },
    
    filterByCategory(category) {
        this.currentCategory = category;
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) categoryFilter.value = category;
        this.loadProducts();
    },
    
    sortBy(sortType) {
        this.currentSort = sortType;
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) sortSelect.value = sortType;
        this.loadProducts();
    },
    
    debug() {
        console.group('🛒 Products Manager Debug');
        console.log('All Products:', Object.keys(this.allProducts).length);
        console.log('Filtered Products:', Object.keys(this.filteredProducts).length);
        console.log('Current Search:', this.currentSearch);
        console.log('Current Sort:', this.currentSort);
        console.log('Current Category:', this.currentCategory);
        console.log('Is Loading:', this.isLoading);
        
        const farmerProducts = Object.values(this.allProducts).filter(p => p.isFarmerProduct);
        const withBusinessName = farmerProducts.filter(p => p.businessName);
        
        console.log('Farmer Products:', farmerProducts.length);
        console.log('With Business Names:', withBusinessName.length);
        console.log('Business Names:', withBusinessName.map(p => p.businessName));
        
        console.groupEnd();
        
        return {
            totalProducts: Object.keys(this.allProducts).length,
            filteredProducts: Object.keys(this.filteredProducts).length,
            farmerProducts: farmerProducts.length,
            withBusinessName: withBusinessName.length,
            currentFilters: {
                search: this.currentSearch,
                sort: this.currentSort,
                category: this.currentCategory
            }
        };
    }
};

// ========================================
// GLOBAL FUNCTIONS
// ========================================

window.clearAllFilters = function() {
    ProductsManager.currentSearch = '';
    ProductsManager.currentSort = 'default';
    ProductsManager.currentCategory = 'all';
    
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect');
    const categoryFilter = document.getElementById('categoryFilter');
    
    if (searchInput) searchInput.value = '';
    if (sortSelect) sortSelect.value = 'default';
    if (categoryFilter) categoryFilter.value = 'all';
    
    ProductsManager.loadProducts();
    ProductsManager.showNotification('All filters cleared', 'info');
};

window.toggleFavorite = function(button) {
    const card = button.closest('.product-card');
    const productName = card?.querySelector('.product-name')?.textContent || 'Product';
    
    if (button.textContent === '♡') {
        button.textContent = '♥';
        button.style.color = '#ff4757';
        button.style.transform = 'scale(1.2)';
        ProductsManager.showNotification(`${productName} added to favorites`, 'success');
    } else {
        button.textContent = '♡';
        button.style.color = '';
        button.style.transform = 'scale(1)';
        ProductsManager.showNotification(`${productName} removed from favorites`, 'info');
    }
    
    setTimeout(() => {
        button.style.transform = 'scale(1)';
    }, 200);
};

// Export for external access
window.ProductsManager = ProductsManager;

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    // Wait for SharedCart to be available
    setTimeout(() => {
        ProductsManager.init();
    }, 300);
});

// Additional CSS for new features
const additionalCSS = document.createElement('style');
additionalCSS.textContent = `
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
        border-top: 4px solid #2b632b;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 20px;
    }
    
    .product-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        margin-bottom: 40px;
        padding: 20px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    .stats-item {
        text-align: center;
        padding: 20px;
        border-right: 1px solid #eee;
    }
    
    .stats-item:last-child {
        border-right: none;
    }
    
    .stats-number {
        display: block;
        font-size: 2rem;
        font-weight: bold;
        color: #2b632b;
        margin-bottom: 5px;
    }
    
    .stats-label {
        font-size: 0.9rem;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .filter-controls {
        display: flex;
        gap: 10px;
        margin-left: auto;
    }
    
    .sort-select, .category-filter {
        padding: 8px 12px;
        border: 2px solid #2b632b;
        border-radius: 4px;
        background: white;
        color: #2b632b;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
        min-width: 150px;
    }
    
    .sort-select:hover, .sort-select:focus,
    .category-filter:hover, .category-filter:focus {
        background: #2b632b;
        color: white;
        outline: none;
    }
    
    .no-results {
        text-align: center;
        padding: 60px 20px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        margin-top: 40px;
    }
    
    .no-results-content h3 {
        color: #666;
        margin-bottom: 10px;
        font-size: 1.5rem;
    }
    
    .no-results-content p {
        color: #999;
        margin-bottom: 20px;
    }
    
    .btn-clear-filters {
        background: #2b632b;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.3s ease;
    }
    
    .btn-clear-filters:hover {
        background: #1f4c1f;
        transform: translateY(-2px);
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    @media (max-width: 768px) {
        .filter-controls {
            flex-direction: column;
            margin-left: 0;
            margin-top: 10px;
            width: 100%;
        }
        
        .sort-select, .category-filter {
            width: 100%;
        }
        
        .product-stats {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            padding: 15px;
        }
        
        .stats-item {
            padding: 15px 10px;
        }
        
        .stats-number {
            font-size: 1.5rem;
        }
    }
`;

document.head.appendChild(additionalCSS);

console.log('🛒 Products Dynamic System loaded with Business Name support!');