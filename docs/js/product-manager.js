// js/product-manager.js - Sistema para agregar productos que se sincroniza con SharedCart

// ========================================
// PRODUCT MANAGER - SISTEMA PARA AGREGAR PRODUCTOS
// ========================================

window.ProductManager = {
    nextProductId: 1000, // Empezamos con IDs altos para evitar conflictos
    
    init() {
        console.log('ProductManager initializing...');
        this.loadNextId();
        this.bindFormEvents();
        this.updateProductsList();
        console.log('ProductManager initialized');
    },
    
    // ========================================
    // FORM HANDLING
    // ========================================
    
    bindFormEvents() {
        // Botón GUARDAR
        const saveBtn = document.getElementById('guardarProducto') || 
                       document.querySelector('[onclick*="guardar"]') ||
                       document.querySelector('.btn-guardar');
                       
        if (saveBtn) {
            // Remover eventos anteriores
            saveBtn.removeAttribute('onclick');
            saveBtn.addEventListener('click', (e) => this.handleSaveProduct(e));
            console.log('Save button connected');
        }
        
        // Botón CANCELAR
        const cancelBtn = document.getElementById('cancelarProducto') || 
                         document.querySelector('[onclick*="cancelar"]') ||
                         document.querySelector('.btn-cancelar');
                         
        if (cancelBtn) {
            cancelBtn.removeAttribute('onclick');
            cancelBtn.addEventListener('click', (e) => this.handleCancelForm(e));
        }
        
        // Subir imagen
        const uploadBtn = document.getElementById('subirImagen') ||
                         document.querySelector('.upload-btn');
                         
        if (uploadBtn) {
            uploadBtn.addEventListener('click', (e) => this.handleImageUpload(e));
        }
        
        // Validación en tiempo real
        this.bindValidationEvents();
        
        // Checkbox para ofertas/savings
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
        // Crear checkbox para ofertas si no existe
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
            
            // Event listener para el checkbox
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
    // SAVE PRODUCT FUNCTIONALITY
    // ========================================
    
    handleSaveProduct(e) {
        e.preventDefault();
        
        console.log('Saving product...');
        
        // Recopilar datos del formulario
        const productData = this.collectFormData();
        
        if (!productData) {
            console.error('Failed to collect form data');
            return;
        }
        
        // Validar datos
        const validation = this.validateProductData(productData);
        if (!validation.isValid) {
            this.showNotification(validation.message, 'error');
            return;
        }
        
        // Crear el producto
        const success = this.createProduct(productData);
        
        if (success) {
            this.showNotification('Producto guardado exitosamente!', 'success');
            this.clearForm();
            this.updateProductsList();
        } else {
            this.showNotification('Error al guardar el producto', 'error');
        }
    },
    
    collectFormData() {
        try {
            // Buscar inputs de diferentes maneras
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
    
    createProduct(productData) {
        try {
            // Agregar al sistema SharedCart
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
                             Math.round(((productData.originalPrice - productData.price) / productData.originalPrice) * 100) + '%' : null
                };
                
                console.log('Product added to SharedCart system');
            }
            
            // Guardar en localStorage
            this.saveToLocalStorage(productData);
            
            // Actualizar páginas si están abiertas
            this.notifyOtherPages(productData);
            
            return true;
            
        } catch (error) {
            console.error('Error creating product:', error);
            return false;
        }
    },
    
    saveToLocalStorage(productData) {
        try {
            // Obtener productos existentes
            let savedProducts = JSON.parse(localStorage.getItem('custom_products') || '[]');
            
            // Agregar nuevo producto
            savedProducts.push(productData);
            
            // Guardar
            localStorage.setItem('custom_products', JSON.stringify(savedProducts));
            
            console.log('Product saved to localStorage');
            
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    },
    
    notifyOtherPages(productData) {
        // Disparar evento para otras páginas abiertas
        const event = new CustomEvent('newProductAdded', {
            detail: productData
        });
        window.dispatchEvent(event);
        
        // También actualizar el storage event
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
        // Limpiar todos los inputs
        const inputs = document.querySelectorAll('input[type="text"], input[type="number"], textarea, input[type="file"]');
        inputs.forEach(input => {
            input.value = '';
        });
        
        // Limpiar checkboxes
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Resetear selects
        const selects = document.querySelectorAll('select');
        selects.forEach(select => {
            select.selectedIndex = 0;
        });
        
        // Ocultar precio original
        const originalPriceContainer = document.getElementById('originalPriceContainer');
        if (originalPriceContainer) {
            originalPriceContainer.style.display = 'none';
        }
        
        // Reset imagen
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
        // Buscar el área de preview
        let preview = document.querySelector('.image-preview') || 
                     document.querySelector('.product-image-preview');
                     
        if (!preview) {
            // Crear preview si no existe
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
        const feedback = input.nextElementSibling?.classList.contains('validation-feedback') ? 
                        input.nextElementSibling : null;
        
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
    // PRODUCTS LIST MANAGEMENT
    // ========================================
    
    updateProductsList() {
        const listContainer = document.getElementById('productsList') ||
                            document.querySelector('.products-list') ||
                            document.querySelector('.added-products');
                            
        if (!listContainer) return;
        
        try {
            const products = JSON.parse(localStorage.getItem('custom_products') || '[]');
            
            if (products.length === 0) {
                listContainer.innerHTML = '<p style="color: #999; text-align: center;">No hay productos agregados</p>';
                return;
            }
            
            listContainer.innerHTML = products.map(product => `
                <div class="product-item" data-id="${product.id}">
                    <div class="product-item-image">
                        <img src="${product.image}" alt="${product.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px;">
                    </div>
                    <div class="product-item-info">
                        <h4>${product.name}</h4>
                        <p>B/.${product.price.toFixed(2)} ${product.originalPrice ? `<small>(antes B/.${product.originalPrice.toFixed(2)})</small>` : ''}</p>
                        <span class="product-type ${product.type}">${product.type === 'savings' ? 'OFERTAS' : 'PRODUCTOS'}</span>
                    </div>
                    <div class="product-item-actions">
                        <button onclick="ProductManager.editProduct(${product.id})" class="btn-edit">Editar</button>
                        <button onclick="ProductManager.deleteProduct(${product.id})" class="btn-delete">Eliminar</button>
                    </div>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Error updating products list:', error);
        }
    },
    
    deleteProduct(productId) {
        if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) return;
        
        try {
            // Remover de custom products
            let products = JSON.parse(localStorage.getItem('custom_products') || '[]');
            products = products.filter(p => p.id !== productId);
            localStorage.setItem('custom_products', JSON.stringify(products));
            
            // Remover de SharedCart
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
        // Por ahora mostrar información, después se puede implementar edición completa
        try {
            const products = JSON.parse(localStorage.getItem('custom_products') || '[]');
            const product = products.find(p => p.id === productId);
            
            if (product) {
                alert(`Editando producto: ${product.name}\nPrecio: B/.${product.price}\nTipo: ${product.type}\n\n(Función de edición en desarrollo)`);
            }
            
        } catch (error) {
            console.error('Error editing product:', error);
        }
    },
    
    // ========================================
    // NOTIFICATIONS
    // ========================================
    
    showNotification(message, type = 'info') {
        // Usar SharedCart notification si está disponible
        if (window.SharedCart && window.SharedCart.showNotification) {
            window.SharedCart.showNotification(message, type);
            return;
        }
        
        // Fallback notification
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
    // SYNC WITH SHARED CART
    // ========================================
    
    syncWithSharedCart() {
        if (!window.SharedCart) return;
        
        try {
            const products = JSON.parse(localStorage.getItem('custom_products') || '[]');
            
            products.forEach(product => {
                if (!window.SharedCart.allProducts[product.id]) {
                    window.SharedCart.allProducts[product.id] = {
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        originalPrice: product.originalPrice,
                        image: product.image,
                        type: product.type,
                        savings: product.savings || null
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
        
        const products = JSON.parse(localStorage.getItem('custom_products') || '[]');
        console.log('Saved Products:', products.length);
        console.log('Products List:', products);
        
        if (window.SharedCart) {
            const customProducts = Object.keys(window.SharedCart.allProducts)
                .filter(id => parseInt(id) >= 1000)
                .length;
            console.log('Custom products in SharedCart:', customProducts);
        }
        
        console.groupEnd();
        
        return {
            nextId: this.nextProductId,
            savedProducts: products.length,
            sharedCartIntegration: !!window.SharedCart
        };
    }
};

// ========================================
// AUTO-INITIALIZATION AND EVENT LISTENERS
// ========================================

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit to ensure SharedCart is loaded
    setTimeout(() => {
        ProductManager.init();
        
        // Sync with SharedCart if available
        if (window.SharedCart) {
            ProductManager.syncWithSharedCart();
        }
        
        console.log('ProductManager ready! Use ProductManager.debug() for info');
    }, 200);
});

// Listen for SharedCart initialization
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
// STYLES FOR PRODUCT MANAGER
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
    }
    
    .product-type.regular {
        background: #e8f5e8;
        color: #2b632b;
    }
    
    .product-type.savings {
        background: #fff3cd;
        color: #856404;
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

console.log('🛠️ ProductManager system loaded and ready!');
console.log('Commands: ProductManager.debug(), ProductManager.syncWithSharedCart()');