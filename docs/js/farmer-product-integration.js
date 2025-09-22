// js/farmer-product-integration.js - Complete product system for farmers with business name

// ========================================
// FARMER PRODUCT SYSTEM - COMPLETE INTEGRATION WITH BUSINESS NAME
// ========================================

window.FarmerProductSystem = {
    currentProducts: [],
    nextId: 2000, // IDs for farmers start at 2000
    previewImage: null,
    
    init() {
        console.log('🚀 Initializing Farmer Product System...');
        this.loadExistingProducts();
        this.bindFormEvents();
        this.bindImageUpload();
        this.createOfferCheckbox();
        this.renderProductsTable();
        
        // NEW: Update existing products with business names
        setTimeout(() => {
            this.updateExistingProductsWithBusinessName();
        }, 1000);
        
        console.log('✅ Farmer Product System ready!');
    },
    
    // ========================================
    // FORM EVENT BINDING
    // ========================================
    
    bindFormEvents() {
        const form = document.getElementById('productForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
            console.log('Form events bound');
        }
        
        // Bind weight conversion
        const weightValue = document.getElementById('weightValue');
        const weightUnit = document.getElementById('weightUnit');
        const weightHint = document.getElementById('weightHint');
        
        if (weightValue && weightUnit && weightHint) {
            const updateHint = () => {
                const value = parseFloat(weightValue.value) || 0;
                const unit = weightUnit.value;
                
                if (value > 0) {
                    if (unit === 'kg') {
                        const lbs = (value * 2.20462).toFixed(2);
                        weightHint.textContent = `≈ ${lbs} lb`;
                    } else {
                        const kgs = (value / 2.20462).toFixed(2);
                        weightHint.textContent = `≈ ${kgs} kg`;
                    }
                } else {
                    weightHint.textContent = '';
                }
            };
            
            weightValue.addEventListener('input', updateHint);
            weightUnit.addEventListener('change', updateHint);
        }
        
        // Real-time validation
        const titleInput = form.querySelector('input[name="title"]');
        const priceInput = form.querySelector('input[name="price"]');
        
        if (titleInput) {
            titleInput.addEventListener('input', () => this.validateField(titleInput, 'title'));
        }
        
        if (priceInput) {
            priceInput.addEventListener('input', () => this.validateField(priceInput, 'price'));
        }
    },
    
    bindImageUpload() {
        const imageInput = document.getElementById('imageInput');
        const removeImageBtn = document.getElementById('removeImageBtn');
        const preview = document.getElementById('preview');
        const previewImg = document.getElementById('previewImg');
        const previewName = document.getElementById('previewName');
        
        if (imageInput) {
            imageInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.processImageFile(file, preview, previewImg, previewName, removeImageBtn);
                }
            });
        }
        
        if (removeImageBtn) {
            removeImageBtn.addEventListener('click', () => {
                this.removeImage(imageInput, preview, removeImageBtn);
            });
        }
    },
    
    createOfferCheckbox() {
        const priceField = document.querySelector('input[name="price"]')?.closest('.field');
        if (!priceField || document.getElementById('offerCheckbox')) return;
        
        const offerSection = document.createElement('div');
        offerSection.className = 'field offer-section';
        offerSection.innerHTML = `
            <div class="offer-controls">
                <label class="offer-checkbox">
                    <input type="checkbox" id="offerCheckbox">
                    <span>🏷️ Is this an offer? (will appear in SAVINGS)</span>
                </label>
                <div id="originalPriceField" class="original-price-field" style="display: none;">
                    <span class="label">💰 Original price</span>
                    <input type="number" id="originalPrice" step="0.01" min="0" placeholder="0.00">
                    <small>Original price must be higher than offer price</small>
                </div>
            </div>
        `;
        
        priceField.parentNode.insertBefore(offerSection, priceField.nextSibling);
        
        // Event listener for checkbox
        document.getElementById('offerCheckbox').addEventListener('change', (e) => {
            const originalPriceField = document.getElementById('originalPriceField');
            if (e.target.checked) {
                originalPriceField.style.display = 'block';
            } else {
                originalPriceField.style.display = 'none';
                document.getElementById('originalPrice').value = '';
            }
        });
        
        // Add styles
        this.addOfferStyles();
    },
    
    addOfferStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .offer-section {
                background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
                border: 2px solid #ffc107;
                border-radius: 12px;
                padding: 1.5rem;
                margin: 1rem 0;
            }
            
            .offer-checkbox {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                cursor: pointer;
                font-weight: 600;
                color: #856404;
                margin-bottom: 1rem;
            }
            
            .offer-checkbox input[type="checkbox"] {
                width: 18px;
                height: 18px;
                cursor: pointer;
            }
            
            .original-price-field {
                background: white;
                padding: 1rem;
                border-radius: 8px;
                border: 2px solid #ffc107;
            }
            
            .original-price-field .label {
                color: #856404;
                font-weight: 600;
                margin-bottom: 0.5rem;
            }
            
            .original-price-field input {
                width: 100%;
                margin-bottom: 0.5rem;
            }
            
            .original-price-field small {
                color: #6c757d;
                font-style: italic;
            }
        `;
        document.head.appendChild(style);
    },
    
    // ========================================
    // IMAGE HANDLING
    // ========================================
    
    processImageFile(file, preview, previewImg, previewName, removeBtn) {
        // Validate file
        if (!file.type.startsWith('image/')) {
            this.showNotification('Please select a valid image file', 'error');
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) {
            this.showNotification('Image must be smaller than 5MB', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            this.previewImage = e.target.result;
            previewImg.src = this.previewImage;
            previewName.textContent = file.name;
            preview.style.display = 'block';
            removeBtn.disabled = false;
            this.showNotification('Image loaded successfully', 'success');
        };
        
        reader.onerror = () => {
            this.showNotification('Error loading image', 'error');
        };
        
        reader.readAsDataURL(file);
    },
    
    removeImage(imageInput, preview, removeBtn) {
        this.previewImage = null;
        imageInput.value = '';
        preview.style.display = 'none';
        removeBtn.disabled = true;
        this.showNotification('Image removed', 'info');
    },
    
    // ========================================
    // FORM VALIDATION
    // ========================================
    
    validateField(input, type) {
        this.removeFieldValidation(input);
        
        let isValid = true;
        let message = '';
        
        switch (type) {
            case 'title':
                const title = input.value.trim();
                if (title.length < 3) {
                    isValid = false;
                    message = 'Title must be at least 3 characters long';
                } else if (title.length > 100) {
                    isValid = false;
                    message = 'Title cannot exceed 100 characters';
                }
                break;
                
            case 'price':
                const price = parseFloat(input.value);
                if (isNaN(price) || price <= 0) {
                    isValid = false;
                    message = 'Price must be greater than 0';
                } else if (price > 1000) {
                    isValid = false;
                    message = 'Price cannot exceed $1000';
                }
                
                // Validate original price if it's an offer
                const offerCheckbox = document.getElementById('offerCheckbox');
                const originalPrice = parseFloat(document.getElementById('originalPrice')?.value || 0);
                
                if (offerCheckbox?.checked && originalPrice > 0 && price >= originalPrice) {
                    isValid = false;
                    message = 'Offer price must be lower than original price';
                }
                break;
        }
        
        if (isValid) {
            this.showFieldSuccess(input);
        } else {
            this.showFieldError(input, message);
        }
        
        return isValid;
    },
    
    showFieldError(input, message) {
        input.style.borderColor = '#dc3545';
        const feedback = document.createElement('div');
        feedback.className = 'field-feedback error';
        feedback.textContent = message;
        input.parentNode.appendChild(feedback);
    },
    
    showFieldSuccess(input) {
        input.style.borderColor = '#28a745';
        const feedback = document.createElement('div');
        feedback.className = 'field-feedback success';
        feedback.innerHTML = '✓ Valid';
        input.parentNode.appendChild(feedback);
    },
    
    removeFieldValidation(input) {
        input.style.borderColor = '';
        const existingFeedback = input.parentNode.querySelector('.field-feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }
    },
    
    // ========================================
    // FORM SUBMISSION
    // ========================================
    
    handleFormSubmit(e) {
        e.preventDefault();
        
        console.log('📝 Processing form submission...');
        
        const formData = this.collectFormData();
        if (!formData) return;
        
        const validation = this.validateProduct(formData);
        if (!validation.isValid) {
            this.showNotification(validation.message, 'error');
            return;
        }
        
        const success = this.saveProduct(formData);
        if (success) {
            this.showNotification('Product saved successfully!', 'success');
            this.clearForm();
            this.renderProductsTable();
            this.showProductsList();
            
            // Sync with SharedCart if available
            if (window.SharedCart) {
                this.syncWithSharedCart(formData);
            }
        }
    },
    
    collectFormData() {
        const form = document.getElementById('productForm');
        const formData = new FormData(form);
        
        const weightValue = document.getElementById('weightValue').value;
        const weightUnit = document.getElementById('weightUnit').value;
        const offerCheckbox = document.getElementById('offerCheckbox');
        const originalPrice = document.getElementById('originalPrice');
        
        const product = {
            id: this.getNextId(),
            title: formData.get('title').trim(),
            description: formData.get('description').trim(),
            price: parseFloat(formData.get('price')),
            weight: {
                value: parseFloat(weightValue) || 0,
                unit: weightUnit
            },
            image: this.previewImage || 'img/products/default.png',
            isOffer: offerCheckbox?.checked || false,
            originalPrice: offerCheckbox?.checked ? parseFloat(originalPrice?.value) || null : null,
            type: (offerCheckbox?.checked) ? 'savings' : 'regular',
            farmerId: currentFarmer?.id || 'unknown',
            farmerName: currentFarmer?.name || 'Unknown Farmer',
            // CRITICAL UPDATE: Add business name
            businessName: currentFarmer?.businessName || 
                         currentFarmer?.business || 
                         (currentFarmer?.name ? `${currentFarmer.name}'s Farm` : null) || 
                         'Local Farm',
            status: 'active',
            dateCreated: new Date().toISOString(),
            onlineStore: document.getElementById('statusOnline')?.checked || false,
            pointOfSale: document.getElementById('statusPOS')?.checked || false
        };
        
        // Calculate savings percentage if it's an offer
        if (product.isOffer && product.originalPrice && product.originalPrice > product.price) {
            product.savingsPercent = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
            product.savings = `${product.savingsPercent}%`;
        }
        
        console.log('Collected product data with business name:', product);
        return product;
    },
    
    validateProduct(product) {
        if (!product.title || product.title.length < 3) {
            return { isValid: false, message: 'Title is required and must be at least 3 characters long' };
        }
        
        if (!product.price || product.price <= 0) {
            return { isValid: false, message: 'Price must be greater than 0' };
        }
        
        if (product.isOffer) {
            if (!product.originalPrice || product.originalPrice <= product.price) {
                return { isValid: false, message: 'For offers, original price must be higher than offer price' };
            }
        }
        
        if (!product.onlineStore && !product.pointOfSale) {
            return { isValid: false, message: 'You must select at least one option: Online Store or Point of Sale' };
        }
        
        return { isValid: true, message: 'Valid' };
    },
    
    saveProduct(product) {
        try {
            // Check if editing existing product
            if (this.editingProductId) {
                const index = this.currentProducts.findIndex(p => p.id === this.editingProductId);
                if (index > -1) {
                    // Update existing product but keep original ID and creation date
                    product.id = this.editingProductId;
                    product.dateCreated = this.currentProducts[index].dateCreated;
                    this.currentProducts[index] = product;
                    this.editingProductId = null;
                    console.log('✅ Product updated successfully:', product);
                } else {
                    this.currentProducts.push(product);
                    console.log('✅ New product added successfully:', product);
                }
            } else {
                // Add new product
                this.currentProducts.push(product);
                console.log('✅ New product added successfully:', product);
            }
            
            // CRITICAL: Update localStorage and trigger sync
            localStorage.setItem('farmer_products', JSON.stringify(this.currentProducts));
            
            // Force SharedCart to update immediately
            if (window.SharedCart) {
                setTimeout(() => {
                    window.SharedCart.loadFarmerProducts();
                }, 100);
            }
            
            // Dispatch event for immediate page updates
            window.dispatchEvent(new CustomEvent('farmerProductAdded', {
                detail: product
            }));
            
            // Trigger storage event manually for same-tab updates
            localStorage.setItem('products_update_trigger', Date.now().toString());
            
            // Save ID
            localStorage.setItem('farmer_next_id', this.nextId.toString());
            
            return true;
            
        } catch (error) {
            console.error('❌ Error saving product:', error);
            this.showNotification('Error saving product', 'error');
            return false;
        }
    },
    
    syncWithSharedCart(product) {
        try {
            if (!window.SharedCart) return;
            
            // Add to SharedCart system
            window.SharedCart.allProducts[product.id] = {
                id: product.id,
                name: product.title,
                price: product.price,
                originalPrice: product.originalPrice,
                image: product.image,
                type: product.type,
                savings: product.savings || null,
                description: product.description,
                farmer: product.farmerName,
                businessName: product.businessName,
                weight: `${product.weight.value} ${product.weight.unit}`,
                isFarmerProduct: true
            };
            
            console.log('🔄 Product synced with SharedCart');
            this.showNotification('Product synced with main catalog', 'success');
            
        } catch (error) {
            console.error('Error syncing with SharedCart:', error);
        }
    },
    
    // ========================================
    // BUSINESS NAME UPDATE FUNCTIONALITY
    // ========================================
    
    updateExistingProductsWithBusinessName() {
        try {
            const products = JSON.parse(localStorage.getItem('farmer_products') || '[]');
            let updated = false;
            
            products.forEach(product => {
                if (!product.businessName && currentFarmer) {
                    product.businessName = currentFarmer.businessName || 
                                         currentFarmer.business || 
                                         (currentFarmer.name ? `${currentFarmer.name}'s Farm` : null) || 
                                         'Local Farm';
                    updated = true;
                    console.log(`Updated business name for product: ${product.title}`);
                }
            });
            
            if (updated) {
                localStorage.setItem('farmer_products', JSON.stringify(products));
                this.currentProducts = products;
                
                // Force refresh of all systems
                if (window.SharedCart) {
                    window.SharedCart.loadFarmerProducts();
                }
                
                // Dispatch update event
                window.dispatchEvent(new CustomEvent('farmerProductsUpdated', {
                    detail: { updatedCount: products.filter(p => p.businessName).length }
                }));
                
                console.log('✅ All existing products updated with business names');
                this.showNotification('Products updated with business information', 'success');
            }
            
        } catch (error) {
            console.error('Error updating existing products:', error);
        }
    },
    
    // ========================================
    // FORM MANAGEMENT
    // ========================================
    
    clearForm() {
        const form = document.getElementById('productForm');
        if (form) {
            form.reset();
        }
        
        // Clear editing state
        this.editingProductId = null;
        
        // Clear image
        const imageInput = document.getElementById('imageInput');
        const preview = document.getElementById('preview');
        const removeBtn = document.getElementById('removeImageBtn');
        
        if (imageInput) imageInput.value = '';
        if (preview) preview.style.display = 'none';
        if (removeBtn) removeBtn.disabled = true;
        
        this.previewImage = null;
        
        // Clear validations
        const inputs = form.querySelectorAll('input, textarea');
        inputs.forEach(input => this.removeFieldValidation(input));
        
        // Reset offer section
        const offerCheckbox = document.getElementById('offerCheckbox');
        const originalPriceField = document.getElementById('originalPriceField');
        
        if (offerCheckbox) offerCheckbox.checked = false;
        if (originalPriceField) originalPriceField.style.display = 'none';
        
        // Reset weight hint
        const weightHint = document.getElementById('weightHint');
        if (weightHint) weightHint.textContent = '';
        
        console.log('🧹 Form cleared');
    },
    
    // ========================================
    // PRODUCTS MANAGEMENT
    // ========================================
    
    loadExistingProducts() {
        try {
            const saved = localStorage.getItem('farmer_products');
            this.currentProducts = saved ? JSON.parse(saved) : [];
            
            const savedId = localStorage.getItem('farmer_next_id');
            if (savedId) {
                this.nextId = parseInt(savedId);
            }
            
            console.log(`📦 Loaded ${this.currentProducts.length} existing products`);
            
        } catch (error) {
            console.error('Error loading products:', error);
            this.currentProducts = [];
        }
    },
    
    getNextId() {
        return this.nextId++;
    },
    
    renderProductsTable() {
        const tbody = document.getElementById('productTableBody');
        if (!tbody) return;
        
        if (this.currentProducts.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="3" style="text-align: center; padding: 40px; color: #666;">
                        <i class="fas fa-box-open" style="font-size: 48px; margin-bottom: 10px; opacity: 0.5; display: block;"></i>
                        No products added yet.<br>
                        <button onclick="showForm()" style="margin-top: 15px; padding: 8px 16px; background: #2b632b; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            Add first product
                        </button>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Filter products based on search
        const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
        const filteredProducts = this.currentProducts.filter(product =>
            product.title.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) ||
            (product.businessName && product.businessName.toLowerCase().includes(searchTerm))
        );
        
        tbody.innerHTML = filteredProducts.map(product => `
            <tr class="product-row" data-id="${product.id}">
                <td>
                    <div class="product-cell">
                        <img src="${product.image}" alt="${product.title}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px; margin-right: 15px;">
                        <div>
                            <div class="product-title">${product.title}</div>
                            <div class="product-price">
                                ${product.isOffer ? 
                                    `<span class="offer-price">B/.${product.price.toFixed(2)}</span> 
                                     <span class="original-price">B/.${product.originalPrice.toFixed(2)}</span>
                                     <span class="savings-badge">${product.savings} OFF</span>` :
                                    `B/.${product.price.toFixed(2)}`
                                }
                            </div>
                            ${product.weight.value > 0 ? `<div class="product-weight">${product.weight.value} ${product.weight.unit}</div>` : ''}
                            ${product.businessName ? `<div class="product-business">BY ${product.businessName.toUpperCase()}</div>` : ''}
                        </div>
                    </div>
                </td>
                <td>
                    <span class="status-badge ${product.status}">
                        ${product.status === 'active' ? '🟢 Active' : '🔴 Inactive'}
                    </span>
                    <div class="channels">
                        ${product.onlineStore ? '<span class="channel-badge">🌐 Online</span>' : ''}
                        ${product.pointOfSale ? '<span class="channel-badge">🏪 POS</span>' : ''}
                    </div>
                </td>
                <td>
                    <span class="category-badge ${product.type}">
                        ${product.type === 'savings' ? '🏷️ OFFERS' : '📦 PRODUCTS'}
                    </span>
                    <div class="product-actions">
                        <button onclick="FarmerProductSystem.editProduct(${product.id})" class="btn-edit" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="FarmerProductSystem.toggleProductStatus(${product.id})" class="btn-toggle" title="Activate/Deactivate">
                            <i class="fas fa-toggle-${product.status === 'active' ? 'on' : 'off'}"></i>
                        </button>
                        <button onclick="FarmerProductSystem.deleteProduct(${product.id})" class="btn-delete" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        // Update products count in dashboard
        this.updateDashboardStats();
    },
    
    showProductsList() {
        document.getElementById('screen1').style.display = 'none';
        document.getElementById('screen2').style.display = 'none';
        document.getElementById('screen3').style.display = 'block';
        this.renderProductsTable();
    },
    
    // ========================================
    // PRODUCT ACTIONS
    // ========================================
    
    editProduct(productId) {
        const product = this.currentProducts.find(p => p.id === productId);
        if (!product) return;
        
        // Switch to form view
        showForm();
        
        // Populate form with product data
        setTimeout(() => {
            document.querySelector('input[name="title"]').value = product.title;
            document.querySelector('textarea[name="description"]').value = product.description;
            document.querySelector('input[name="price"]').value = product.price;
            document.getElementById('weightValue').value = product.weight.value;
            document.getElementById('weightUnit').value = product.weight.unit;
            document.getElementById('statusOnline').checked = product.onlineStore;
            document.getElementById('statusPOS').checked = product.pointOfSale;
            
            if (product.isOffer) {
                document.getElementById('offerCheckbox').checked = true;
                document.getElementById('originalPriceField').style.display = 'block';
                document.getElementById('originalPrice').value = product.originalPrice;
            }
            
            // Set image if available
            if (product.image && product.image !== 'img/products/default.png') {
                this.previewImage = product.image;
                const preview = document.getElementById('preview');
                const previewImg = document.getElementById('previewImg');
                previewImg.src = product.image;
                preview.style.display = 'block';
                document.getElementById('removeImageBtn').disabled = false;
            }
            
            // Store edit mode
            this.editingProductId = productId;
            
            this.showNotification(`Editing: ${product.title}`, 'info');
        }, 100);
    },
    
    toggleProductStatus(productId) {
        const product = this.currentProducts.find(p => p.id === productId);
        if (!product) return;
        
        product.status = product.status === 'active' ? 'inactive' : 'active';
        
        this.saveProducts();
        this.renderProductsTable();
        
        const statusText = product.status === 'active' ? 'activated' : 'deactivated';
        this.showNotification(`Product ${statusText}`, 'success');
    },
    
    deleteProduct(productId) {
        const product = this.currentProducts.find(p => p.id === productId);
        if (!product) return;
        
        if (!confirm(`Are you sure you want to delete "${product.title}"?`)) return;
        
        this.currentProducts = this.currentProducts.filter(p => p.id !== productId);
        
        // Remove from SharedCart if exists
        if (window.SharedCart && window.SharedCart.allProducts[productId]) {
            delete window.SharedCart.allProducts[productId];
        }
        
        this.saveProducts();
        this.renderProductsTable();
        this.showNotification(`Product "${product.title}" deleted`, 'info');
    },
    
    saveProducts() {
        try {
            localStorage.setItem('farmer_products', JSON.stringify(this.currentProducts));
            
            // Force SharedCart sync
            if (window.SharedCart) {
                setTimeout(() => {
                    window.SharedCart.loadFarmerProducts();
                }, 100);
            }
        } catch (error) {
            console.error('Error saving products:', error);
        }
    },
    
    // ========================================
    // DASHBOARD INTEGRATION
    // ========================================
    
    updateDashboardStats() {
        const totalProducts = this.currentProducts.length;
        const activeProducts = this.currentProducts.filter(p => p.status === 'active').length;
        
        const totalProductsElement = document.getElementById('totalProducts');
        if (totalProductsElement) {
            totalProductsElement.textContent = totalProducts;
        }
        
        // Update other stats if needed
        console.log(`📊 Stats updated: ${totalProducts} total, ${activeProducts} active`);
    },
    
    // ========================================
    // UTILITIES
    // ========================================
    
    showNotification(message, type = 'info') {
        // Use farmer dashboard notification if available
        if (window.showNotification) {
            window.showNotification(message, type);
            return;
        }
        
        // Fallback notification
        const notification = document.createElement('div');
        notification.className = `farmer-notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            font-weight: bold;
            z-index: 9999;
            animation: slideIn 0.3s ease-out;
            max-width: 350px;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 4000);
    },
    
    exportCSV() {
        if (this.currentProducts.length === 0) {
            this.showNotification('No products to export', 'error');
            return;
        }
        
        const headers = ['Title', 'Description', 'Price', 'Original Price', 'Type', 'Status', 'Weight', 'Business Name', 'Date Created'];
        
        const csvContent = [
            headers.join(','),
            ...this.currentProducts.map(product => [
                `"${product.title}"`,
                `"${product.description}"`,
                product.price,
                product.originalPrice || '',
                product.type,
                product.status,
                `${product.weight.value} ${product.weight.unit}`,
                `"${product.businessName || ''}"`,
                new Date(product.dateCreated).toLocaleDateString()
            ].join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `products_${currentFarmer?.businessName || currentFarmer?.name || 'farmer'}_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.showNotification('CSV exported successfully', 'success');
        }
    },
    
    // ========================================
    // DEBUG AND UTILITIES
    // ========================================
    
    debug() {
        console.group('🔍 Farmer Product System Debug');
        console.log('Current Products:', this.currentProducts);
        console.log('Next ID:', this.nextId);
        console.log('Preview Image:', this.previewImage ? 'Set' : 'None');
        console.log('SharedCart Integration:', !!window.SharedCart);
        console.log('Current Farmer:', currentFarmer);
        
        if (window.SharedCart) {
            const farmerProducts = Object.keys(window.SharedCart.allProducts)
                .filter(id => parseInt(id) >= 2000)
                .length;
            console.log('Products in SharedCart:', farmerProducts);
        }
        
        // Check business name coverage
        const withBusinessName = this.currentProducts.filter(p => p.businessName).length;
        console.log(`Business Names: ${withBusinessName}/${this.currentProducts.length} products have business names`);
        
        console.groupEnd();
        
        return {
            totalProducts: this.currentProducts.length,
            activeProducts: this.currentProducts.filter(p => p.status === 'active').length,
            withBusinessName: withBusinessName,
            nextId: this.nextId,
            hasPreviewImage: !!this.previewImage,
            sharedCartIntegration: !!window.SharedCart,
            currentFarmer: currentFarmer ? {
                name: currentFarmer.name,
                businessName: currentFarmer.businessName || currentFarmer.business
            } : null
        };
    }
};

// ========================================
// GLOBAL UTILITY FUNCTION FOR IMMEDIATE UPDATE
// ========================================

window.updateAllProductsWithBusinessName = function() {
    const userSession = sessionStorage.getItem('agrotec_user');
    if (!userSession) {
        console.error('No user session found');
        alert('No user session found. Please login first.');
        return;
    }
    
    try {
        const farmer = JSON.parse(userSession);
        const products = JSON.parse(localStorage.getItem('farmer_products') || '[]');
        let updated = 0;
        
        products.forEach(product => {
            if (!product.businessName) {
                product.businessName = farmer.businessName || 
                                     farmer.business || 
                                     (farmer.name ? `${farmer.name}'s Farm` : null) || 
                                     'Local Farm';
                updated++;
            }
        });
        
        if (updated > 0) {
            localStorage.setItem('farmer_products', JSON.stringify(products));
            console.log(`✅ Updated ${updated} products with business names`);
            
            // Update current system
            if (window.FarmerProductSystem) {
                window.FarmerProductSystem.currentProducts = products;
                window.FarmerProductSystem.renderProductsTable();
            }
            
            // Trigger refresh
            if (window.SharedCart) {
                window.SharedCart.loadFarmerProducts();
            }
            if (window.ProductsManager) {
                window.ProductsManager.refreshProducts();
            }
            
            alert(`Successfully updated ${updated} products with business names!\n\nBusiness Name: "${products[0]?.businessName}"`);
        } else {
            console.log('All products already have business names');
            alert('All products already have business names');
        }
    } catch (error) {
        console.error('Error updating products:', error);
        alert('Error updating products: ' + error.message);
    }
};

// ========================================
// INITIALIZATION AND GLOBAL FUNCTIONS
// ========================================

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Wait for farmer dashboard to be ready
    setTimeout(() => {
        if (typeof currentFarmer !== 'undefined' && currentFarmer) {
            FarmerProductSystem.init();
        }
    }, 1000);
});

// Global functions for existing HTML
window.exportCSV = function() {
    FarmerProductSystem.exportCSV();
};

window.renderTable = function() {
    FarmerProductSystem.renderProductsTable();
};

// Override existing form functions
const originalShowForm = window.showForm;
window.showForm = function() {
    if (originalShowForm) originalShowForm();
    // Ensure our system is initialized
    setTimeout(() => {
        if (!document.getElementById('offerCheckbox')) {
            FarmerProductSystem.createOfferCheckbox();
        }
    }, 100);
};

// Export for debugging
window.FarmerProductSystem = FarmerProductSystem;

console.log('🚀 Farmer Product Integration System loaded with Business Name support!');
console.log('Commands: FarmerProductSystem.debug(), exportCSV(), updateAllProductsWithBusinessName()');

// ========================================
// ADDITIONAL STYLES FOR PRODUCT SYSTEM
// ========================================

const productStyles = document.createElement('style');
productStyles.textContent = `
    /* Field feedback styles */
    .field-feedback {
        font-size: 0.8rem;
        margin-top: 5px;
        padding: 4px 8px;
        border-radius: 4px;
        display: inline-block;
    }
    
    .field-feedback.error {
        background: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
    }
    
    .field-feedback.success {
        background: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
    }
    
    /* Product table styles */
    .product-cell {
        display: flex;
        align-items: center;
    }
    
    .product-title {
        font-weight: 600;
        color: #2b632b;
        margin-bottom: 4px;
    }
    
    .product-price {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 2px;
    }
    
    .offer-price {
        font-weight: bold;
        color: #dc3545;
        font-size: 1.1em;
    }
    
    .original-price {
        text-decoration: line-through;
        color: #6c757d;
        font-size: 0.9em;
    }
    
    .savings-badge {
        background: #dc3545;
        color: white;
        padding: 2px 6px;
        border-radius: 10px;
        font-size: 0.7rem;
        font-weight: bold;
    }
    
    .product-weight {
        font-size: 0.8rem;
        color: #6c757d;
    }
    
    .product-business {
        font-size: 0.75rem;
        color: #6f4f28;
        font-weight: bold;
        background: rgba(111, 79, 40, 0.1);
        padding: 2px 6px;
        border-radius: 8px;
        display: inline-block;
        margin-top: 4px;
    }
    
    .status-badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: bold;
        display: inline-block;
        margin-bottom: 8px;
    }
    
    .status-badge.active {
        background: #d4edda;
        color: #155724;
    }
    
    .status-badge.inactive {
        background: #f8d7da;
        color: #721c24;
    }
    
    .channels {
        display: flex;
        gap: 4px;
        flex-wrap: wrap;
    }
    
    .channel-badge {
        background: #e9ecef;
        color: #495057;
        padding: 2px 6px;
        border-radius: 8px;
        font-size: 0.7rem;
    }
    
    .category-badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: bold;
        display: inline-block;
        margin-bottom: 8px;
    }
    
    .category-badge.regular {
        background: #d1ecf1;
        color: #0c5460;
    }
    
    .category-badge.savings {
        background: #fff3cd;
        color: #856404;
    }
    
    .product-actions {
        display: flex;
        gap: 4px;
        margin-top: 8px;
    }
    
    .btn-edit, .btn-toggle, .btn-delete {
        width: 32px;
        height: 32px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        font-size: 0.8rem;
    }
    
    .btn-edit {
        background: #17a2b8;
        color: white;
    }
    
    .btn-edit:hover {
        background: #138496;
        transform: scale(1.1);
    }
    
    .btn-toggle {
        background: #6c757d;
        color: white;
    }
    
    .btn-toggle:hover {
        background: #545b62;
        transform: scale(1.1);
    }
    
    .btn-delete {
        background: #dc3545;
        color: white;
    }
    
    .btn-delete:hover {
        background: #c82333;
        transform: scale(1.1);
    }
    
    /* Animation for form submission */
    .form-submitting {
        opacity: 0.7;
        pointer-events: none;
        position: relative;
    }
    
    .form-submitting::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #2b632b;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        z-index: 1000;
    }
    
    @keyframes spin {
        0% { transform: translate(-50%, -50%) rotate(0deg); }
        100% { transform: translate(-50%, -50%) rotate(360deg); }
    }
    
    /* Responsive improvements */
    @media (max-width: 768px) {
        .product-cell {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
        }
        
        .product-cell img {
            margin-right: 0;
            width: 40px;
            height: 40px;
        }
        
        .product-actions {
            justify-content: center;
            margin-top: 12px;
        }
        
        .channels {
            justify-content: center;
        }
    }
    
    /* Preview improvements */
    #preview {
        margin-top: 1rem;
        padding: 1rem;
        border: 2px dashed #dee2e6;
        border-radius: 8px;
        text-align: center;
        background: #f8f9fa;
    }
    
    #preview img {
        max-width: 200px;
        max-height: 200px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        margin-bottom: 8px;
    }
    
    .preview-meta {
        font-size: 0.9rem;
        color: #6c757d;
        font-weight: 500;
    }
    
    /* Weight hint styling */
    #weightHint {
        font-size: 0.8rem;
        color: #6c757d;
        margin-top: 4px;
        font-style: italic;
    }
    
    /* Enhanced form styling */
    .field input:focus,
    .field textarea:focus,
    .field select:focus {
        border-color: #2b632b;
        box-shadow: 0 0 0 0.2rem rgba(43, 99, 43, 0.25);
        outline: 0;
    }
    
    .field input.error,
    .field textarea.error {
        border-color: #dc3545;
        box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
    }
    
    .field input.success,
    .field textarea.success {
        border-color: #28a745;
        box-shadow: 0 0 0 0.2rem rgba(40, 167, 69, 0.25);
    }
`;

document.head.appendChild(productStyles);