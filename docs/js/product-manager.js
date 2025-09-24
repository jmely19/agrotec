// js/product-manager-firebase.js - Sistema para agregar productos con Firebase

// ========================================
// PRODUCT MANAGER - SISTEMA CON FIREBASE INTEGRATION
// ========================================

window.ProductManager = {
    nextProductId: 1000,
    
    init() {
        console.log('ProductManager initializing...');
        this.loadNextId();
        this.bindFormEvents();
        this.updateProductsList();
        this.setupFirebaseListeners();
        console.log('ProductManager initialized');
    },
    
    // ========================================
    // FIREBASE INTEGRATION
    // ========================================
    
    setupFirebaseListeners() {
        // Listen for Firebase product updates
        window.addEventListener('firebaseProductsUpdated', (e) => {
            console.log('Firebase products updated, refreshing local list');
            this.updateProductsList();
        });
        
        // Listen for Firebase save confirmations
        window.addEventListener('firebaseProductSaved', (e) => {
            console.log('Product saved to Firebase:', e.detail);
            this.showNotification('Product saved to cloud storage', 'success');
        });
    },
    
    // ========================================
    // FORM HANDLING
    // ========================================
    
    bindFormEvents() {
        const saveBtn = document.getElementById('guardarProducto') || 
                       document.querySelector('[onclick*="guardar"]') ||
                       document.querySelector('.btn-guardar');
                       
        if (saveBtn) {
            saveBtn.removeAttribute('onclick');
            saveBtn.addEventListener('click', (e) => this.handleSaveProduct(e));
            console.log('Save button connected');
        }
        
        const cancelBtn = document.getElementById('cancelarProducto') || 
                         document.querySelector('[onclick*="cancelar"]') ||
                         document.querySelector('.btn-cancelar');
                         
        if (cancelBtn) {
            cancelBtn.removeAttribute('onclick');
            cancelBtn.addEventListener('click', (e) => this.handleCancelForm(e));
        }
        
        const uploadBtn = document.getElementById('subirImagen') ||
                         document.querySelector('.upload-btn');
                         
        if (uploadBtn) {
            uploadBtn.addEventListener('click', (e) => this.handleImageUpload(e));
        }
        
        this.bindValidationEvents();
        this.bindSavingsCheckbox();
    },
    
    bindValidationEvents() {
        const titleInput = document.getElementById('productoTitulo') ||
                          document.querySelector('input[placeholder*="libra"]') ||
                          document.querySelector('input[name="titulo"]');
                          
        const priceInput = document.getElementById('productoPrecio') ||
                          document.querySelector('input[placeholder="0.00"]') ||
                          document.querySelector('input[name="precio"]');
                          
        if (titleInput) {
            titleInput.addEventListener('input', (e) => this.validateTitle(e.target));
        }
        
        if (priceInput) {
            priceInput.addEventListener('input', (e) => this.validatePrice(e.target));
        }
    },
    
    bindSavingsCheckbox() {
        this.createSavingsCheckbox();
    },
    
    createSavingsCheckbox() {
        const priceSection = document.querySelector('.price-section') ||
                           document.querySelector('[class*="precio"]') ||
                           document.querySelector('input[placeholder="0.00"]')?.closest('div');
                           
        if (priceSection && !document.getElementById('esOferta')) {
            const checkboxContainer = document.createElement('div');
            checkboxContainer.className = 'savings-checkbox-container';
            checkboxContainer.innerHTML = `
                <label class="checkbox-label">
                    <input type="checkbox" id="esOferta" name="esOferta">
                    <span>¿Es una oferta? (aparecerá en SAVINGS)</span>
                </label>
                <div class="original-price-container" id="originalPriceContainer" style="display: none;">
                    <label>Precio original:</label>
                    <input type="number" id="precioOriginal" step="0.01" min="0" placeholder="0.00">
                </div>
            `;
            
            priceSection.parentNode.insertBefore(checkboxContainer, priceSection.nextSibling);
            
            document.getElementById('esOferta').addEventListener('change', (e) => {
                const originalPriceContainer = document.getElementById('originalPriceContainer');
                if (e.target.checked) {
                    originalPriceContainer.style.display = 'block';
                } else {
                    originalPriceContainer.style.display = 'none';
                    document.getElementById('precioOriginal').value = '';
                }
            });
        }
    },
    
    // ========================================
    // SAVE PRODUCT WITH FIREBASE
    // ========================================
    
    async handleSaveProduct(e) {
        e.preventDefault();
        
        console.log('Saving product...');
        
        const productData = this.collectFormData();
        
        if (!productData) {
            console.error('Failed to collect form data');
            return;
        }
        
        const validation = this.validateProductData(productData);
        if (!validation.isValid) {
            this.showNotification(validation.message, 'error');
            return;
        }
        
        // Show loading state
        const saveBtn = e.target;
        const originalText = saveBtn.textContent;
        saveBtn.textContent = 'Saving...';
        saveBtn.disabled = true;
        
        try {
            const success = await this.createProduct(productData);
            
            if (success) {
                this.showNotification('Producto guardado exitosamente!', 'success');
                this.clearForm();
                this.updateProductsList();
                
                // Try to save to Firebase if available
                if (window.FarmerProductsFirebase && window.currentFarmer) {
                    await this.saveToFirebase(productData);
                }
            } else {
                this.showNotification('Error al guardar el producto', 'error');
            }
        } catch (error) {
            console.error('Error saving product:', error);
            this.showNotification('Error al guardar el producto', 'error');
        } finally {
            // Restore button state
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
        }
    },
    
    async saveToFirebase(productData) {
        try {
            const farmerData = window.currentFarmer || JSON.parse(sessionStorage.getItem('agrotec_user') || '{}');
            
            if (!farmerData.email) {
                console.warn('No farmer data available for Firebase sync');
                return false;
            }
            
            // Convert to farmer product format
            const farmerProductData = {
                id: productData.id,
                title: productData.name,
                description: productData.description,
                price: productData.price,
                originalPrice: productData.originalPrice,
                weight: { value: 1, unit: productData.weight || 'kg' },
                image: productData.image,
                type: productData.type,
                isOffer: productData.isOffer,
                status: 'active',
                onlineStore: true,
                category: 'vegetables',
                dateCreated: productData.dateAdded
            };
            
            const success = await window.FarmerProductsFirebase.saveProduct(farmerData, farmerProductData);
            
            if (success) {
                this.showNotification('Product synced to cloud', 'success');
            }
            
            return success;
            
        } catch (error) {
            console.error('Error saving to Firebase:', error);
            return false;
        }
    },
    
    collectFormData() {
        try {
            const titleInput = document.getElementById('productoTitulo') ||
                              document.querySelector('input[placeholder*="libra"]') ||
                              document.querySelector('input[name="titulo"]') ||
                              document.querySelector('input[type="text"]');
                              
            const descInput = document.getElementById('productoDescripcion') ||
                             document.querySelector('textarea[placeholder*="producto"]') ||
                             document.querySelector('textarea[name="descripcion"]') ||
                             document.querySelector('textarea');
                             
            const priceInput = document.getElementById('productoPrecio') ||
                              document.querySelector('input[placeholder="0.00"]') ||
                              document.querySelector('input[name="precio"]') ||
                              document.querySelector('input[type="number"]');
                              
            const weightInput = document.getElementById('productoWeight') ||
                               document.querySelector('select[name="peso"]') ||
                               document.querySelector('select');
            
            const imageInput = document.getElementById('productImage') ||
                              document.querySelector('input[type="file"]');
                              
            const isOfferCheckbox = document.getElementById('esOferta');
            const originalPriceInput = document.getElementById('precioOriginal');
            
            const data = {
                id: this.getNextProductId(),
                name: titleInput?.value?.trim() || '',
                description: descInput?.value?.trim() || '',
                price: parseFloat(priceInput?.value) || 0,
                weight: weightInput?.value || 'kg',
                image: this.selectedImage || 'img/products/placeholder.png',
                isOffer: isOfferCheckbox?.checked || false,
                originalPrice: originalPriceInput?.value ? parseFloat(originalPriceInput.value) : null,
                type: (isOfferCheckbox?.checked) ? 'savings' : 'regular',
                dateAdded: new Date().toISOString()
            };
            
            console.log('Collected product data:', data);
            return data;
            
        } catch (error) {
            console.error('Error collecting form data:', error);
            return null;
        }
    },
    
    validateProductData(data) {
        if (!data.name) {
            return { isValid: false, message: 'El título del producto es obligatorio' };
        }
        
        if (data.name.length < 3) {
            return { isValid: false, message: 'El título debe tener al menos 3 caracteres' };
        }
        
        if (data.price <= 0) {
            return { isValid: false, message: 'El precio debe ser mayor a 0' };
        }
        
        if (data.isOffer) {
            if (!data.originalPrice || data.originalPrice <= data.price) {
                return { isValid: false, message: 'El precio original debe ser mayor al precio de oferta' };
            }
        }
        
        return { isValid: true, message: 'Válido' };
    },
    
    async createProduct(productData) {
        try {
            // Add to SharedCart system
            if (window.SharedCart) {
                window.SharedCart.allProducts[productData.id] = {
                    id: productData.id,
                    name: productData.name,
                    price: productData.price,
                    originalPrice: productData.originalPrice,
                    image: productData.image,
                    type: productData.type,
                    description: productData.description,
                    weight: productData.weight,
                    dateAdded: productData.dateAdded,
                    savings: productData.isOffer && productData.originalPrice ? 
                             Math.round(((productData.originalPrice - productData.price) / productData.originalPrice) * 100) + '%' : null,
                    isCustomProduct: true
                };
                
                console.log('Product added to SharedCart system');
            }
            
            // Save to localStorage
            this.saveToLocalStorage(productData);
            
            // Notify other pages
            this.notifyOtherPages(productData);
            
            return true;
            
        } catch (error) {
            console.error('Error creating product:', error);
            return false;
        }
    },
    
    saveToLocalStorage(productData) {
        try {
            let savedProducts = JSON.parse(localStorage.getItem('custom_products') || '[]');
            savedProducts.push(productData);
            localStorage.setItem('custom_products', JSON.stringify(savedProducts));
            console.log('Product saved to localStorage');
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    },
    
    notifyOtherPages(productData) {
        const event = new CustomEvent('newProductAdded', {
            detail: productData
        });
        window.dispatchEvent(event);
        
        localStorage.setItem('product_update_trigger', Date.now().toString());
    },
    
    // ========================================
    // FORM UTILITIES
    // ========================================
    
    handleCancelForm(e) {
        e.preventDefault();
        this.clearForm();
        this.showNotification('Formulario cancelado', 'info');
    },
    
    clearForm() {
        const inputs = document.querySelectorAll('input[type="text"], input[type="number"], textarea, input[type="file"]');
        inputs.forEach(input => {
            input.value = '';
        });
        
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        
        const selects = document.querySelectorAll('select');
        selects.forEach(select => {
            select.selectedIndex = 0;
        });
        
        const originalPriceContainer = document.getElementById('originalPriceContainer');
        if (originalPriceContainer) {
            originalPriceContainer.style.display = 'none';
        }
        
        this.selectedImage = null;
        this.updateImagePreview(null);
        
        console.log('Form cleared');
    },
    
    handleImageUpload(e) {
        e.preventDefault();
        
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = (event) => {
            const file = event.target.files[0];
            if (file) {
                this.processImageFile(file);
            }
        };
        
        input.click();
    },
    
    processImageFile(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            this.selectedImage = e.target.result;
            this.updateImagePreview(this.selectedImage);
            this.showNotification('Imagen cargada exitosamente', 'success');
        };
        
        reader.onerror = () => {
            this.showNotification('Error al cargar la imagen', 'error');
        };
        
        reader.readAsDataURL(file);
    },
    
    updateImagePreview(imageSrc) {
        let preview = document.querySelector('.image-preview') || 
                     document.querySelector('.product-image-preview');
                     
        if (!preview) {
            const uploadSection = document.querySelector('.upload-section') ||
                                document.querySelector('[class*="multimedia"]') ||
                                document.querySelector('button[class*="subir"]')?.closest('div');
                                
            if (uploadSection) {
                preview = document.createElement('div');
                preview.className = 'image-preview';
                uploadSection.appendChild(preview);
            }
        }
        
        if (preview) {
            if (imageSrc) {
                preview.innerHTML = `
                    <img src="${imageSrc}" alt="Preview" style="max-width: 150px; max-height: 150px; border-radius: 8px; object-fit: cover;">
                    <button type="button" onclick="ProductManager.removeImage()" style="margin-top: 10px; padding: 5px 10px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Remover imagen
                    </button>
                `;
            } else {
                preview.innerHTML = '<p style="color: #999;">No hay imagen seleccionada</p>';
            }
        }
    },
    
    removeImage() {
        this.selectedImage = null;
        this.updateImagePreview(null);
        this.showNotification('Imagen removida', 'info');
    },
    
    // ========================================
    // VALIDATION UTILITIES
    // ========================================
    
    validateTitle(input) {
        const value = input.value.trim();
        
        if (value.length < 3) {
            this.showFieldError(input, 'El título debe tener al menos 3 caracteres');
        } else {
            this.showFieldSuccess(input, 'Título válido');
        }
    },
    
    validatePrice(input) {
        const value = parseFloat(input.value);
        
        if (isNaN(value) || value <= 0) {
            this.showFieldError(input, 'El precio debe ser mayor a 0');
        } else {
            this.showFieldSuccess(input, 'Precio válido');
        }
    },
    
    showFieldError(input, message) {
        input.style.borderColor = '#dc3545';
        this.updateFieldFeedback(input, message, 'error');
    },
    
    showFieldSuccess(input, message) {
        input.style.borderColor = '#28a745';
        this.updateFieldFeedback(input, message, 'success');
    },
    
    updateFieldFeedback(input, message, type) {
        let feedback = input.parentNode.querySelector('.validation-feedback');
        
        if (!feedback) {
            feedback = document.createElement('div');
            feedback.className = 'validation-feedback';
            input.parentNode.appendChild(feedback);
        }
        
        feedback.textContent = message;
        feedback.className = `validation-feedback ${type}`;
        feedback.style.fontSize = '0.8rem';
        feedback.style.marginTop = '5px';
        feedback.style.color = type === 'error' ? '#dc3545' : '#28a745';
    },
    
    // ========================================
    // ID MANAGEMENT
    // ========================================
    
    getNextProductId() {
        const id = this.nextProductId++;
        this.saveNextId();
        return id;
    },
    
    loadNextId() {
        const saved = localStorage.getItem('next_product_id');
        if (saved) {
            this.nextProductId = parseInt(saved);
        }
    },
    
    saveNextId() {
        localStorage.setItem('next_product_id', this.nextProductId.toString());
    },
    
    // ========================================
    // PRODUCTS LIST WITH FIREBASE DATA
    // ========================================
    
    updateProductsList() {
        const listContainer = document.getElementById('productsList') ||
                            document.querySelector('.products-list') ||
                            document.querySelector('.added-products');
                            
        if (!listContainer) return;
        
        try {
            // Get products from local storage and Firebase
            const customProducts = JSON.parse(localStorage.getItem('custom_products') || '[]');
            const firebaseProducts = this.getFirebaseProducts();
            
            const allProducts = [...customProducts, ...firebaseProducts];
            
            if (allProducts.length === 0) {
                listContainer.innerHTML = '<p style="color: #999; text-align: center;">No hay productos agregados</p>';
                return;
            }
            
            listContainer.innerHTML = allProducts.map(product => `
                <div class="product-item ${product.isFirebaseProduct ? 'firebase-product' : ''}" data-id="${product.id}">
                    <div class="product-item-image">
                        <img src="${product.image || product.img}" alt="${product.name || product.title}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px;">
                    </div>
                    <div class="product-item-info">
                        <h4>${product.name || product.title}</h4>
                        <p>B/.${(product.price || 0).toFixed(2)} ${product.originalPrice ? `<small>(antes B/.${product.originalPrice.toFixed(2)})</small>` : ''}</p>
                        <span class="product-type ${product.type}">${product.type === 'savings' ? 'OFERTAS' : 'PRODUCTOS'}</span>
                        ${product.isFirebaseProduct ? '<span class="firebase-badge">☁️ Cloud</span>' : '<span class="local-badge">💾 Local</span>'}
                    </div>
                    <div class="product-item-actions">
                        <button onclick="ProductManager.editProduct(${product.id})" class="btn-edit">Editar</button>
                        <button onclick="ProductManager.deleteProduct(${product.id}, ${product.isFirebaseProduct})" class="btn-delete">Eliminar</button>
                    </div>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Error updating products list:', error);
        }
    },
    
    getFirebaseProducts() {
        try {
            if (!window.FarmerProductsFirebase) return [];
            
            const farmerProducts = JSON.parse(localStorage.getItem('farmer_products') || '[]');
            return farmerProducts
                .filter(p => p.status === 'active')
                .map(p => ({
                    ...p,
                    name: p.title,
                    img: p.image,
                    isFirebaseProduct: true
                }));
        } catch (error) {
            console.error('Error getting Firebase products:', error);
            return [];
        }
    },
    
    async deleteProduct(productId, isFirebaseProduct = false) {
        if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) return;
        
        try {
            if (isFirebaseProduct && window.FarmerProductsFirebase) {
                // Delete from Firebase
                await window.FarmerProductsFirebase.deleteProduct(productId);
            } else {
                // Delete from local storage
                let products = JSON.parse(localStorage.getItem('custom_products') || '[]');
                products = products.filter(p => p.id !== productId);
                localStorage.setItem('custom_products', JSON.stringify(products));
            }
            
            // Remove from SharedCart
            if (window.SharedCart && window.SharedCart.allProducts[productId]) {
                delete window.SharedCart.allProducts[productId];
            }
            
            this.updateProductsList();
            this.showNotification('Producto eliminado', 'info');
            
        } catch (error) {
            console.error('Error deleting product:', error);
            this.showNotification('Error al eliminar el producto', 'error');
        }
    },
    
    editProduct(productId) {
        try {
            const customProducts = JSON.parse(localStorage.getItem('custom_products') || '[]');
            const firebaseProducts = this.getFirebaseProducts();
            const allProducts = [...customProducts, ...firebaseProducts];
            
            const product = allProducts.find(p => p.id === productId);
            
            if (product) {
                alert(`Editando producto: ${product.name || product.title}\nPrecio: B/.${product.price}\nTipo: ${product.type}\n\n(Función de edición en desarrollo)`);
            }
            
        } catch (error) {
            console.error('Error editing product:', error);
        }
    },
    
    // ========================================
    // NOTIFICATIONS
    // ========================================
    
    showNotification(message, type = 'info') {
        if (window.SharedCart && window.SharedCart.showNotification) {
            window.SharedCart.showNotification(message, type);
            return;
        }
        
        const notification = document.createElement('div');
        notification.className = `product-manager-notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    },
    
    // ========================================
    // SYNC WITH SHARED CART AND FIREBASE
    // ========================================
    
    syncWithSharedCart() {
        if (!window.SharedCart) return;
        
        try {
            // Sync custom products
            const customProducts = JSON.parse(localStorage.getItem('custom_products') || '[]');
            customProducts.forEach(product => {
                if (!window.SharedCart.allProducts[product.id]) {
                    window.SharedCart.allProducts[product.id] = {
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        originalPrice: product.originalPrice,
                        image: product.image,
                        type: product.type,
                        savings: product.savings || null,
                        isCustomProduct: true
                    };
                }
            });
            
            // Sync Firebase products
            const firebaseProducts = this.getFirebaseProducts();
            firebaseProducts.forEach(product => {
                if (!window.SharedCart.allProducts[product.id]) {
                    window.SharedCart.allProducts[product.id] = {
                        id: product.id,
                        name: product.name || product.title,
                        price: product.price,
                        originalPrice: product.originalPrice,
                        image: product.image || product.img,
                        type: product.type,
                        savings: product.savings || null,
                        isFirebaseProduct: true
                    };
                }
            });
            
            console.log('Products synced with SharedCart');
            
        } catch (error) {
            console.error('Error syncing with SharedCart:', error);
        }
    },
    
    // ========================================
    // DEBUG AND UTILITIES
    // ========================================
    
    debug() {
        console.group('ProductManager Debug');
        console.log('Next Product ID:', this.nextProductId);
        console.log('Selected Image:', this.selectedImage);
        
        const customProducts = JSON.parse(localStorage.getItem('custom_products') || '[]');
        const firebaseProducts = this.getFirebaseProducts();
        
        console.log('Custom Products:', customProducts.length);
        console.log('Firebase Products:', firebaseProducts.length);
        console.log('Total Products:', customProducts.length + firebaseProducts.length);
        
        if (window.SharedCart) {
            const customInCart = Object.keys(window.SharedCart.allProducts)
                .filter(id => window.SharedCart.allProducts[id].isCustomProduct)
                .length;
            const firebaseInCart = Object.keys(window.SharedCart.allProducts)
                .filter(id => window.SharedCart.allProducts[id].isFirebaseProduct)
                .length;
            console.log('Custom products in SharedCart:', customInCart);
            console.log('Firebase products in SharedCart:', firebaseInCart);
        }
        
        console.log('Firebase Integration:', !!window.FarmerProductsFirebase);
        console.groupEnd();
        
        return {
            nextId: this.nextProductId,
            customProducts: customProducts.length,
            firebaseProducts: firebaseProducts.length,
            sharedCartIntegration: !!window.SharedCart,
            firebaseIntegration: !!window.FarmerProductsFirebase
        };
    }
};

// ========================================
// AUTO-INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        ProductManager.init();
        
        if (window.SharedCart) {
            ProductManager.syncWithSharedCart();
        }
        
        console.log('ProductManager ready! Use ProductManager.debug() for info');
    }, 200);
});

window.addEventListener('load', function() {
    setTimeout(() => {
        if (window.SharedCart && ProductManager) {
            ProductManager.syncWithSharedCart();
        }
    }, 500);
});

// Export for global access
window.ProductManager = ProductManager;

// Global functions for HTML onclick handlers (backup)
window.guardarProducto = function() {
    ProductManager.handleSaveProduct({ preventDefault: () => {} });
};

window.cancelarProducto = function() {
    ProductManager.handleCancelForm({ preventDefault: () => {} });
};

// ========================================
// ENHANCED STYLES
// ========================================

const styles = document.createElement('style');
styles.textContent = `
    .savings-checkbox-container {
        margin: 15px 0;
        padding: 15px;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        background: #f8f9fa;
    }
    
    .checkbox-label {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        font-weight: 500;
    }
    
    .checkbox-label input[type="checkbox"] {
        transform: scale(1.2);
    }
    
    .original-price-container {
        margin-top: 10px;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 6px;
        background: white;
    }
    
    .original-price-container label {
        display: block;
        margin-bottom: 5px;
        font-weight: 500;
    }
    
    .original-price-container input {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #ccc;
        border-radius: 4px;
    }
    
    .validation-feedback {
        font-size: 0.8rem;
        margin-top: 5px;
    }
    
    .validation-feedback.error {
        color: #dc3545;
    }
    
    .validation-feedback.success {
        color: #28a745;
    }
    
    .image-preview {
        margin-top: 15px;
        text-align: center;
        padding: 15px;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        background: #f8f9fa;
    }
    
    .product-item {
        display: flex;
        align-items: center;
        gap: 15px;
        padding: 15px;
        margin-bottom: 10px;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        background: white;
    }
    
    .product-item.firebase-product {
        border-left: 4px solid #4285f4;
    }
    
    .product-item-info {
        flex: 1;
    }
    
    .product-item-info h4 {
        margin: 0 0 5px 0;
        font-size: 1rem;
    }
    
    .product-item-info p {
        margin: 0 0 5px 0;
        color: #666;
    }
    
    .product-type {
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.7rem;
        font-weight: bold;
        text-transform: uppercase;
        margin-right: 8px;
    }
    
    .product-type.regular {
        background: #e8f5e8;
        color: #2b632b;
    }
    
    .product-type.savings {
        background: #fff3cd;
        color: #856404;
    }
    
    .firebase-badge, .local-badge {
        padding: 2px 6px;
        border-radius: 10px;
        font-size: 0.6rem;
        font-weight: bold;
        margin-left: 8px;
    }
    
    .firebase-badge {
        background: #e3f2fd;
        color: #1976d2;
    }
    
    .local-badge {
        background: #f3e5f5;
        color: #7b1fa2;
    }
    
    .product-item-actions {
        display: flex;
        gap: 8px;
    }
    
    .btn-edit, .btn-delete {
        padding: 6px 12px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.8rem;
        font-weight: bold;
        transition: all 0.3s ease;
    }
    
    .btn-edit {
        background: #17a2b8;
        color: white;
    }
    
    .btn-edit:hover {
        background: #138496;
    }
    
    .btn-delete {
        background: #dc3545;
        color: white;
    }
    
    .btn-delete:hover {
        background: #c82333;
    }
    
    .product-manager-notification {
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
    
    .product-manager-notification.show {
        opacity: 1;
        transform: translateX(0);
    }
    
    .product-manager-notification.error {
        background: #dc3545;
    }
    
    .product-manager-notification.info {
        background: #17a2b8;
    }
`;

document.head.appendChild(styles);

console.log('ProductManager system with Firebase integration loaded and ready!');
