// js/product-sync-system.js - Sistema de sincronización de productos INTEGRADO CON FIREBASE

window.ProductSyncSystem = {
    globalProductsKey: 'farmer_products',
    lastSyncTime: 0,
    syncInterval: null,
    isInitialized: false,
    debugMode: true,

    async init() {
        if (this.isInitialized) {
            console.log('🔄 ProductSyncSystem already initialized');
            return;
        }
        console.log('🔄 Initializing Product Sync System...');
        this.bindEvents();

        // Sincronización inicial: espera a que FirebaseManager esté listo
        setTimeout(async () => {
            await this.syncAllFarmerProducts();
            this.startPeriodicSync();
            this.isInitialized = true;
            console.log('✅ Product Sync System ready!');
        }, 300);
    },

    // ----------------------------------------
    // SINCRONIZACIÓN PRINCIPAL CON FIREBASE
    // ----------------------------------------
    async syncAllFarmerProducts() {
        if (this.debugMode) console.log('🔄 Starting full farmer products sync...');

        let allActiveProducts = [];
        let fromCloud = false;

        if (window.FirebaseManager && FirebaseManager.isConnected) {
            try {
                allActiveProducts = await window.FarmerProductsFirebase.getActiveProducts();
                fromCloud = true;
                if (this.debugMode) console.log(`✅ Synced ${allActiveProducts.length} products from Firebase`);
            } catch (e) {
                if (this.debugMode) console.warn('⚠️ Error syncing from Firebase, falling back to local:', e);
                allActiveProducts = this.getLocalActiveProducts();
            }
        } else {
            allActiveProducts = this.getLocalActiveProducts();
            if (this.debugMode) console.log(`✅ Synced ${allActiveProducts.length} products from LOCAL`);
        }

        // Guardar en storage global como backup
        try {
            const existingProducts = JSON.parse(localStorage.getItem(this.globalProductsKey) || '[]');
            const productsChanged = JSON.stringify(existingProducts) !== JSON.stringify(allActiveProducts);

            localStorage.setItem(this.globalProductsKey, JSON.stringify(allActiveProducts));
            this.lastSyncTime = Date.now();
            localStorage.setItem('product_sync_timestamp', this.lastSyncTime.toString());

            if (this.debugMode) {
                console.log(`✅ Synced ${allActiveProducts.length} active products to global storage [${fromCloud ? 'cloud' : 'local'}]`);
                console.log('Products changed:', productsChanged);
            }

            if (productsChanged) {
                this.notifyProductUpdate(allActiveProducts.length, fromCloud);
            }
        } catch (error) {
            console.error('❌ Error saving global products:', error);
        }
        return allActiveProducts.length;
    },

    getLocalActiveProducts() {
        // Igual a la lógica anterior: obtiene productos activos desde la capa local
        let allActiveProducts = [];
        const farmerKeys = this.getAllFarmerKeys();

        if (farmerKeys.length === 0) {
            const legacyProducts = this.checkLegacyProducts();
            if (legacyProducts.length > 0) {
                allActiveProducts = legacyProducts;
            }
        } else {
            farmerKeys.forEach(key => {
                try {
                    const farmerId = key.replace('farmer_products_', '');
                    const farmerProducts = JSON.parse(localStorage.getItem(key) || '[]');
                    const activeProducts = farmerProducts.filter(product =>
                        product.status === 'active' &&
                        product.onlineStore === true &&
                        product.title &&
                        product.price > 0
                    );
                    activeProducts.forEach(product => {
                        product.farmerId = product.farmerId || farmerId;
                        product.farmerEmail = product.farmerEmail || farmerId;
                        product.syncedAt = Date.now();
                        if (!product.businessName) {
                            product.businessName = product.farmerName || 'Local Farm';
                        }
                    });
                    allActiveProducts.push(...activeProducts);
                } catch (error) {
                    console.error(`Error processing farmer ${key}:`, error);
                }
            });
        }
        return allActiveProducts;
    },

    checkLegacyProducts() {
        try {
            const legacyProducts = JSON.parse(localStorage.getItem('farmer_products') || '[]');
            if (legacyProducts.length > 0) {
                return legacyProducts.filter(product =>
                    product.status === 'active' &&
                    product.onlineStore === true &&
                    product.title &&
                    product.price > 0
                );
            }
        } catch (error) {
            console.error('Error checking legacy products:', error);
        }
        return [];
    },

    // ----------------------------------------
    // OPERACIONES CRUD CENTRALIZADAS (FIREBASE + LOCAL)
    // ----------------------------------------
    async saveProduct(farmerData, productData) {
        if (window.FirebaseManager && FirebaseManager.isConnected) {
            const ok = await window.FarmerProductsFirebase.saveProduct(farmerData, productData);
            if (!ok) this.saveProductLocal(farmerData, productData);
            return ok;
        } else {
            return this.saveProductLocal(farmerData, productData);
        }
    },

    saveProductLocal(farmerData, productData) {
        // Guarda en localStorage en la clave farmer_products_{farmerId}
        try {
            const farmerId = farmerData.id || farmerData.email;
            const key = 'farmer_products_' + farmerId;
            const products = JSON.parse(localStorage.getItem(key) || '[]');
            const index = products.findIndex(p => p.id === productData.id);
            if (index > -1) {
                products[index] = productData;
            } else {
                products.push(productData);
            }
            localStorage.setItem(key, JSON.stringify(products));
            this.syncAllFarmerProducts();
            return true;
        } catch (error) {
            console.error('❌ Error saving product locally:', error);
            return false;
        }
    },

    async updateProduct(productId, updates) {
        if (window.FirebaseManager && FirebaseManager.isConnected) {
            const ok = await window.FarmerProductsFirebase.updateProduct(productId, updates);
            if (!ok) this.updateProductLocal(productId, updates);
            return ok;
        } else {
            return this.updateProductLocal(productId, updates);
        }
    },

    updateProductLocal(productId, updates) {
        // Busca el producto en todas las claves farmer_products_*
        try {
            const farmerKeys = this.getAllFarmerKeys();
            for (const key of farmerKeys) {
                let products = JSON.parse(localStorage.getItem(key) || '[]');
                const idx = products.findIndex(p => p.id === productId);
                if (idx > -1) {
                    products[idx] = { ...products[idx], ...updates, updatedAt: Date.now() };
                    localStorage.setItem(key, JSON.stringify(products));
                    this.syncAllFarmerProducts();
                    return true;
                }
            }
        } catch (error) {
            console.error('❌ Error updating product locally:', error);
        }
        return false;
    },

    async deleteProduct(productId) {
        if (window.FirebaseManager && FirebaseManager.isConnected) {
            const ok = await window.FarmerProductsFirebase.deleteProduct(productId);
            if (!ok) this.deleteProductLocal(productId);
            return ok;
        } else {
            return this.deleteProductLocal(productId);
        }
    },

    deleteProductLocal(productId) {
        try {
            const farmerKeys = this.getAllFarmerKeys();
            for (const key of farmerKeys) {
                let products = JSON.parse(localStorage.getItem(key) || '[]');
                const filtered = products.filter(p => p.id !== productId);
                if (filtered.length !== products.length) {
                    localStorage.setItem(key, JSON.stringify(filtered));
                    this.syncAllFarmerProducts();
                    return true;
                }
            }
        } catch (error) {
            console.error('❌ Error deleting product locally:', error);
        }
        return false;
    },

    // ----------------------------------------
    // EVENTOS Y NOTIFICACIONES MEJORADOS
    // ----------------------------------------
    bindEvents() {
        // Escuchar cambios en localStorage
        window.addEventListener('storage', (e) => {
            if (e.key && e.key.startsWith('farmer_products')) {
                if (this.debugMode) console.log(`🔄 Storage change detected: ${e.key}`);
                this.debouncedSync();
            }
        });

        // Escuchar evento de actualización global
        window.addEventListener('firebaseProductsUpdated', (e) => {
            if (this.debugMode) console.log('🔄 Firebase products updated event received', e.detail);
            this.debouncedSync();
        });

        // Escuchar eventos globales de sincronización
        window.addEventListener('requestProductSync', () => {
            if (this.debugMode) console.log('🔄 Sync request received');
            this.syncAllFarmerProducts();
        });

        // Override localStorage.setItem
        if (!window._originalSetItem) {
            window._originalSetItem = localStorage.setItem;
            localStorage.setItem = function(key, value) {
                const result = window._originalSetItem.apply(this, arguments);
                if (key.startsWith('farmer_products') && window.ProductSyncSystem) {
                    setTimeout(() => {
                        if (window.ProductSyncSystem.debouncedSync) {
                            window.ProductSyncSystem.debouncedSync();
                        }
                    }, 50);
                }
                return result;
            };
        }
    },

    debouncedSync() {
        clearTimeout(this.syncTimeout);
        this.syncTimeout = setTimeout(() => {
            this.syncAllFarmerProducts();
        }, 200);
    },

    notifyProductUpdate(count, fromCloud) {
        if (this.debugMode) console.log(`📢 Notifying product update: ${count} products [${fromCloud ? 'cloud' : 'local'}]`);
        const event = new CustomEvent('farmerProductsGlobalSync', {
            detail: {
                totalProducts: count,
                timestamp: Date.now(),
                source: fromCloud ? 'Firebase' : 'ProductSyncSystem'
            }
        });
        window.dispatchEvent(event);
        localStorage.setItem('products_last_update', Date.now().toString());

        // Notificar a SharedCart si existe con delay
        if (window.SharedCart) {
            setTimeout(() => {
                if (window.SharedCart.loadFarmerProducts) {
                    if (this.debugMode) console.log('📢 Triggering SharedCart update');
                    window.SharedCart.loadFarmerProducts();
                }
            }, 100);
        }
        if (window.ProductsManager) {
            setTimeout(() => {
                if (this.debugMode) console.log('📢 Triggering ProductsManager update');
                window.ProductsManager.refreshProducts();
            }, 150);
        }
        if (window.SavingsManager) {
            setTimeout(() => {
                if (this.debugMode) console.log('📢 Triggering SavingsManager update');
                window.SavingsManager.refreshOffers();
            }, 200);
        }
    },

    startPeriodicSync() {
        if (this.syncInterval) clearInterval(this.syncInterval);
        this.syncInterval = setInterval(() => {
            if (this.debugMode) console.log('⏰ Periodic sync triggered');
            this.syncAllFarmerProducts();
        }, 10000);
        if (this.debugMode) console.log('⏰ Periodic sync started (every 10 seconds)');
    },

    // ----------------------------------------
    // UTILIDADES MEJORADAS
    // ----------------------------------------
    getAllFarmerKeys() {
        const keys = Object.keys(localStorage).filter(key =>
            key.startsWith('farmer_products_') &&
            key !== 'farmer_products'
        );
        if (this.debugMode) console.log('🔍 Found farmer keys:', keys);
        return keys;
    },

    getGlobalProducts() {
        try {
            const products = JSON.parse(localStorage.getItem(this.globalProductsKey) || '[]');
            if (this.debugMode) console.log(`📦 Retrieved ${products.length} products from global storage`);
            return products;
        } catch (error) {
            console.error('Error reading global products:', error);
            return [];
        }
    },

    // ----------------------------------------
    // FUNCIONES PÚBLICAS MEJORADAS
    // ----------------------------------------
    async forceSync() {
        console.log('🔄 Force syncing all farmer products...');
        const count = await this.syncAllFarmerProducts();

        if (window.SharedCart && window.SharedCart.showNotification) {
            window.SharedCart.showNotification(`Synced ${count} farmer products`, 'success');
        }
        this.forceUpdateAllManagers();
        return count;
    },

    forceUpdateAllManagers() {
        const managers = [
            { name: 'SharedCart', method: 'loadFarmerProducts' },
            { name: 'ProductsManager', method: 'refreshProducts' },
            { name: 'SavingsManager', method: 'refreshOffers' }
        ];
        managers.forEach((manager, index) => {
            setTimeout(() => {
                if (window[manager.name] && window[manager.name][manager.method]) {
                    console.log(`🔄 Force updating ${manager.name}`);
                    window[manager.name][manager.method]();
                }
            }, index * 100);
        });
    },

    debug() {
        console.group('🔄 Product Sync System Debug');
        const farmerKeys = this.getAllFarmerKeys();
        let totalFarmerProducts = 0;
        let totalActiveProducts = 0;
        let farmerDetails = [];
        const legacyProducts = this.checkLegacyProducts();

        farmerKeys.forEach(key => {
            try {
                const products = JSON.parse(localStorage.getItem(key) || '[]');
                const active = products.filter(p =>
                    p.status === 'active' &&
                    p.onlineStore === true &&
                    p.title &&
                    p.price > 0
                );
                const detail = {
                    farmerId: key.replace('farmer_products_', ''),
                    total: products.length,
                    active: active.length,
                    products: products.map(p => ({
                        id: p.id,
                        title: p.title || 'NO TITLE',
                        status: p.status || 'NO STATUS',
                        onlineStore: p.onlineStore,
                        price: p.price || 0,
                        type: p.type,
                        isOffer: p.isOffer
                    }))
                };
                farmerDetails.push(detail);
                totalFarmerProducts += products.length;
                totalActiveProducts += active.length;
            } catch (error) {
                console.error(`Error reading ${key}:`, error);
            }
        });

        const globalProducts = this.getGlobalProducts();
        console.log('\n📊 FARMER DETAILS:');
        farmerDetails.forEach(detail => {
            console.log(`👨‍🌾 ${detail.farmerId}: ${detail.active}/${detail.total} active`);
            detail.products.forEach(p => {
                console.log(`  - ${p.title} (${p.status}, online: ${p.onlineStore}, price: ${p.price})`);
            });
        });

        console.log('\n📈 SUMMARY:');
        console.log(`- Total Farmers: ${farmerKeys.length}`);
        console.log(`- Total Farmer Products: ${totalFarmerProducts}`);
        console.log(`- Total Active Products: ${totalActiveProducts}`);
        console.log(`- Products in Global Storage: ${globalProducts.length}`);
        console.log(`- Legacy Products: ${legacyProducts.length}`);
        console.log(`- Last Sync: ${new Date(this.lastSyncTime).toLocaleTimeString()}`);
        console.log(`- Initialized: ${this.isInitialized}`);
        console.log(`- Sync Status: ${totalActiveProducts === globalProducts.length ? '✅ SYNCED' : '❌ OUT OF SYNC'}`);
        console.log('\n🔧 SYSTEM AVAILABILITY:');
        console.log(`- SharedCart: ${!!window.SharedCart}`);
        console.log(`- ProductsManager: ${!!window.ProductsManager}`);
        console.log(`- SavingsManager: ${!!window.SavingsManager}`);
        console.log(`- FarmerProductSystem: ${!!window.FarmerProductSystem}`);
        console.groupEnd();

        return {
            farmers: farmerKeys.length,
            totalProducts: totalFarmerProducts,
            activeProducts: totalActiveProducts,
            globalProducts: globalProducts.length,
            legacyProducts: legacyProducts.length,
            synced: totalActiveProducts === globalProducts.length,
            lastSync: this.lastSyncTime,
            initialized: this.isInitialized,
            systemAvailability: {
                SharedCart: !!window.SharedCart,
                ProductsManager: !!window.ProductsManager,
                SavingsManager: !!window.SavingsManager,
                FarmerProductSystem: !!window.FarmerProductSystem
            }
        };
    },

    cleanup() {
        const globalProducts = this.getGlobalProducts();
        const farmerKeys = this.getAllFarmerKeys();
        let validProductIds = new Set();
        farmerKeys.forEach(key => {
            try {
                const products = JSON.parse(localStorage.getItem(key) || '[]');
                products.forEach(p => validProductIds.add(p.id));
            } catch (error) {
                console.error(`Error reading ${key} for cleanup:`, error);
            }
        });
        const cleanedProducts = globalProducts.filter(product =>
            validProductIds.has(product.id)
        );
        const removedCount = globalProducts.length - cleanedProducts.length;
        if (removedCount > 0) {
            localStorage.setItem(this.globalProductsKey, JSON.stringify(cleanedProducts));
            console.log(`🧹 Cleaned up ${removedCount} orphaned products`);
            this.notifyProductUpdate(cleanedProducts.length);
        }
        return removedCount;
    },

    healthCheck() {
        console.group('🏥 Product Sync Health Check');
        const health = {
            initialized: this.isInitialized,
            lastSync: this.lastSyncTime,
            timeSinceLastSync: Date.now() - this.lastSyncTime,
            farmerKeys: this.getAllFarmerKeys().length,
            globalProducts: this.getGlobalProducts().length,
            periodicSyncActive: !!this.syncInterval,
            usingCloud: !!(window.FirebaseManager && FirebaseManager.isConnected),
            errors: []
        };

        if (health.timeSinceLastSync > 30000) {
            health.errors.push('Last sync was more than 30 seconds ago');
        }
        if (health.farmerKeys > 0 && health.globalProducts === 0) {
            health.errors.push('Farmers exist but no global products found');
        }
        const dependentSystems = ['SharedCart', 'ProductsManager', 'SavingsManager'];
        dependentSystems.forEach(system => {
            if (!window[system]) {
                health.errors.push(`${system} not available`);
            }
        });
        console.log('Health Status:', health.errors.length === 0 ? '✅ HEALTHY' : '⚠️ ISSUES FOUND');
        console.log('Details:', health);
        if (health.errors.length > 0) {
            console.log('Errors:', health.errors);
        }
        console.groupEnd();
        return health;
    }
};

// ----------------------------------------
// AUTO-INITIALIZATION MEJORADA
// ----------------------------------------
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM loaded, initializing ProductSyncSystem...');
    setTimeout(() => {
        if (!window.ProductSyncSystem.isInitialized) {
            ProductSyncSystem.init();
        }
        setTimeout(() => {
            console.log('🚀 Forcing initial sync...');
            ProductSyncSystem.forceSync();
        }, 2000);
    }, 500);
});

// ----------------------------------------
// GLOBAL FUNCTIONS MEJORADAS
// ----------------------------------------
window.syncFarmerProducts = function() {
    return window.ProductSyncSystem ? ProductSyncSystem.forceSync() : 0;
};
window.debugProductSync = function() {
    return window.ProductSyncSystem ? ProductSyncSystem.debug() : null;
};
window.healthCheckProductSync = function() {
    return window.ProductSyncSystem ? ProductSyncSystem.healthCheck() : null;
};
window.cleanupProducts = function() {
    return window.ProductSyncSystem ? ProductSyncSystem.cleanup() : 0;
};
window.ProductSyncSystem = ProductSyncSystem;
console.log('🔄 Product Sync System loaded! Commands:');
console.log('- debugProductSync(): Full debug info');
console.log('- syncFarmerProducts(): Force sync');
console.log('- healthCheckProductSync(): System health check');
console.log('- cleanupProducts(): Clean orphaned products');

// ----------------------------------------
// INTEGRATION PATCHES MEJORADOS
// ----------------------------------------
window.addEventListener('load', function() {
    setTimeout(() => {
        if (window.FarmerProductSystem && window.ProductSyncSystem) {
            console.log('🔧 Patching FarmerProductSystem for global sync...');
            if (!window.FarmerProductSystem._originalSaveProducts) {
                window.FarmerProductSystem._originalSaveProducts = window.FarmerProductSystem.saveProducts;
                window.FarmerProductSystem.saveProducts = async function() {
                    const farmerData = window.currentFarmer || JSON.parse(sessionStorage.getItem('agrotec_user') || '{}');
                    for (const product of this.currentProducts) {
                        await window.ProductSyncSystem.saveProduct(farmerData, product);
                    }
                    const result = window.FarmerProductSystem._originalSaveProducts.call(this);
                    if (result) {
                        console.log('🔧 FarmerProductSystem saved, triggering sync...');
                        setTimeout(() => {
                            window.ProductSyncSystem.syncAllFarmerProducts();
                        }, 100);
                    }
                    return result;
                };
            }
            window.ProductSyncSystem.syncAllFarmerProducts();
            console.log('✅ FarmerProductSystem patched successfully');
        } else {
            console.warn('⚠️ FarmerProductSystem or ProductSyncSystem not available for patching');
        }
    }, 3000);
});

// Monitor para health check
setInterval(() => {
    if (window.ProductSyncSystem && window.ProductSyncSystem.debugMode) {
        const health = window.ProductSyncSystem.healthCheck();
        if (health.errors.length > 0) {
            console.warn('⚠️ Product Sync System has issues:', health.errors);
        }
    }
}, 60000);
