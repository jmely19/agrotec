// js/product-sync-system-fixed.js - Sistema completo de sincronización de productos ARREGLADO

// ========================================
// PRODUCT SYNC SYSTEM - SISTEMA COMPLETO DE SINCRONIZACIÓN ARREGLADO
// ========================================

window.ProductSyncSystem = {
    globalProductsKey: 'farmer_products',
    lastSyncTime: 0,
    syncInterval: null,
    isInitialized: false,
    debugMode: true,
    
    init() {
        if (this.isInitialized) {
            console.log('🔄 ProductSyncSystem already initialized');
            return;
        }
        
        console.log('🔄 Initializing Product Sync System...');
        this.bindEvents();
        
        // Sincronización inicial inmediata
        setTimeout(() => {
            this.syncAllFarmerProducts();
            this.startPeriodicSync();
            this.isInitialized = true;
            console.log('✅ Product Sync System ready!');
        }, 100);
    },
    
    // ========================================
    // SINCRONIZACIÓN PRINCIPAL MEJORADA
    // ========================================
    
    syncAllFarmerProducts() {
        if (this.debugMode) console.log('🔄 Starting full farmer products sync...');
        
        let allActiveProducts = [];
        const farmerKeys = this.getAllFarmerKeys();
        
        if (this.debugMode) console.log(`Found ${farmerKeys.length} farmer storages:`, farmerKeys);
        
        // Si no hay claves de farmers, verificar si hay productos en el almacenamiento legacy
        if (farmerKeys.length === 0) {
            const legacyProducts = this.checkLegacyProducts();
            if (legacyProducts.length > 0) {
                if (this.debugMode) console.log(`Found ${legacyProducts.length} legacy products, using those`);
                allActiveProducts = legacyProducts;
            }
        } else {
            farmerKeys.forEach(key => {
                try {
                    const farmerId = key.replace('farmer_products_', '');
                    const farmerProducts = JSON.parse(localStorage.getItem(key) || '[]');
                    
                    if (this.debugMode) console.log(`Processing farmer ${farmerId}: ${farmerProducts.length} total products`);
                    
                    // Filtrar productos activos para online store
                    const activeProducts = farmerProducts.filter(product => {
                        const isActive = product.status === 'active';
                        const hasOnlineStore = product.onlineStore === true;
                        const isValid = product.title && product.price > 0;
                        
                        if (this.debugMode && product.title) {
                            console.log(`  - ${product.title}: active=${isActive}, online=${hasOnlineStore}, valid=${isValid}`);
                        }
                        
                        return isActive && hasOnlineStore && isValid;
                    });
                    
                    if (this.debugMode) console.log(`Farmer ${farmerId}: ${activeProducts.length}/${farmerProducts.length} active products`);
                    
                    // Agregar información de farmer a cada producto
                    activeProducts.forEach(product => {
                        product.farmerId = product.farmerId || farmerId;
                        product.farmerEmail = product.farmerEmail || farmerId;
                        product.syncedAt = Date.now();
                        
                        // Asegurar que tenga businessName
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
        
        // Guardar en storage global
        try {
            const existingProducts = JSON.parse(localStorage.getItem(this.globalProductsKey) || '[]');
            const productsChanged = JSON.stringify(existingProducts) !== JSON.stringify(allActiveProducts);
            
            localStorage.setItem(this.globalProductsKey, JSON.stringify(allActiveProducts));
            this.lastSyncTime = Date.now();
            localStorage.setItem('product_sync_timestamp', this.lastSyncTime.toString());
            
            if (this.debugMode) {
                console.log(`✅ Synced ${allActiveProducts.length} active products to global storage`);
                console.log('Products changed:', productsChanged);
            }
            
            // Solo notificar si hubo cambios
            if (productsChanged) {
                this.notifyProductUpdate(allActiveProducts.length);
            }
            
        } catch (error) {
            console.error('❌ Error saving global products:', error);
        }
        
        return allActiveProducts.length;
    },
    
    checkLegacyProducts() {
        try {
            // Verificar si hay productos en el almacenamiento legacy
            const legacyProducts = JSON.parse(localStorage.getItem('farmer_products') || '[]');
            if (legacyProducts.length > 0) {
                console.log('🔍 Found legacy products, filtering active ones...');
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
    
    // ========================================
    // EVENTOS Y NOTIFICACIONES MEJORADOS
    // ========================================
    
    bindEvents() {
        // Escuchar cambios en localStorage de forma más específica
        window.addEventListener('storage', (e) => {
            if (e.key && e.key.startsWith('farmer_products')) {
                if (this.debugMode) console.log(`🔄 Storage change detected: ${e.key}`);
                this.debouncedSync();
            }
        });
        
        // Escuchar eventos del sistema de farmers
        window.addEventListener('farmerProductsUpdated', (e) => {
            if (this.debugMode) console.log('🔄 Farmer products updated event received', e.detail);
            this.debouncedSync();
        });
        
        // Escuchar eventos globales de sincronización
        window.addEventListener('requestProductSync', (e) => {
            if (this.debugMode) console.log('🔄 Sync request received');
            this.syncAllFarmerProducts();
        });
        
        // Override más seguro de localStorage.setItem
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
    
    notifyProductUpdate(count) {
        if (this.debugMode) console.log(`📢 Notifying product update: ${count} products`);
        
        // Disparar evento global
        const event = new CustomEvent('farmerProductsGlobalSync', {
            detail: { 
                totalProducts: count,
                timestamp: Date.now(),
                source: 'ProductSyncSystem'
            }
        });
        window.dispatchEvent(event);
        
        // Actualizar timestamp
        localStorage.setItem('products_last_update', Date.now().toString());
        
        // Notificar a SharedCart si existe con delay
        if (window.SharedCart) {
            setTimeout(() => {
                if (window.SharedCart.loadFarmerProducts) {
                    if (this.debugMode) console.log('📢 Triggering SharedCart update');
                    window.SharedCart.loadFarmerProducts();
                } else {
                    console.warn('SharedCart.loadFarmerProducts not available');
                }
            }, 100);
        }
        
        // Notificar a ProductsManager
        if (window.ProductsManager) {
            setTimeout(() => {
                if (this.debugMode) console.log('📢 Triggering ProductsManager update');
                window.ProductsManager.refreshProducts();
            }, 150);
        }
        
        // Notificar a SavingsManager
        if (window.SavingsManager) {
            setTimeout(() => {
                if (this.debugMode) console.log('📢 Triggering SavingsManager update');
                window.SavingsManager.refreshOffers();
            }, 200);
        }
    },
    
    startPeriodicSync() {
        // Limpiar intervalo existente
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        
        // Sync cada 10 segundos (más conservador)
        this.syncInterval = setInterval(() => {
            if (this.debugMode) console.log('⏰ Periodic sync triggered');
            this.syncAllFarmerProducts();
        }, 10000);
        
        if (this.debugMode) console.log('⏰ Periodic sync started (every 10 seconds)');
    },
    
    // ========================================
    // UTILIDADES MEJORADAS
    // ========================================
    
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
    
    // ========================================
    // FUNCIONES PÚBLICAS MEJORADAS
    // ========================================
    
    forceSync() {
        console.log('🔄 Force syncing all farmer products...');
        const count = this.syncAllFarmerProducts();
        
        // Mostrar notificación
        if (window.SharedCart && window.SharedCart.showNotification) {
            window.SharedCart.showNotification(`Synced ${count} farmer products`, 'success');
        }
        
        // Forzar actualización de todos los managers
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
                } else {
                    console.warn(`${manager.name}.${manager.method} not available`);
                }
            }, index * 100);
        });
    },
    
    debug() {
        console.group('🔄 Product Sync System Debug');
        
        const farmerKeys = this.getAllFarmerKeys();
        console.log('Farmer Storage Keys:', farmerKeys);
        
        let totalFarmerProducts = 0;
        let totalActiveProducts = 0;
        let farmerDetails = [];
        
        // Legacy check
        const legacyProducts = this.checkLegacyProducts();
        if (legacyProducts.length > 0) {
            console.log(`Legacy products found: ${legacyProducts.length}`);
        }
        
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
        
        // Check if managers are available
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
    
    // Nueva función para verificar el estado del sistema
    healthCheck() {
        console.group('🏥 Product Sync Health Check');
        
        const health = {
            initialized: this.isInitialized,
            lastSync: this.lastSyncTime,
            timeSinceLastSync: Date.now() - this.lastSyncTime,
            farmerKeys: this.getAllFarmerKeys().length,
            globalProducts: this.getGlobalProducts().length,
            periodicSyncActive: !!this.syncInterval,
            errors: []
        };
        
        // Verificar si el último sync fue hace más de 30 segundos
        if (health.timeSinceLastSync > 30000) {
            health.errors.push('Last sync was more than 30 seconds ago');
        }
        
        // Verificar si hay farmers pero no productos globales
        if (health.farmerKeys > 0 && health.globalProducts === 0) {
            health.errors.push('Farmers exist but no global products found');
        }
        
        // Verificar sistemas dependientes
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

// ========================================
// AUTO-INITIALIZATION MEJORADA
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM loaded, initializing ProductSyncSystem...');
    
    setTimeout(() => {
        if (!window.ProductSyncSystem.isInitialized) {
            ProductSyncSystem.init();
        }
        
        // Force initial sync after other systems load
        setTimeout(() => {
            console.log('🚀 Forcing initial sync...');
            ProductSyncSystem.forceSync();
        }, 2000);
        
    }, 500);
});

// ========================================
// GLOBAL FUNCTIONS MEJORADAS
// ========================================

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

// Export
window.ProductSyncSystem = ProductSyncSystem;

console.log('🔄 Product Sync System loaded! Commands:');
console.log('- debugProductSync(): Full debug info');
console.log('- syncFarmerProducts(): Force sync');
console.log('- healthCheckProductSync(): System health check');
console.log('- cleanupProducts(): Clean orphaned products');

// ========================================
// INTEGRATION PATCHES MEJORADOS
// ========================================

// Patch para FarmerProductSystem cuando se carga
window.addEventListener('load', function() {
    setTimeout(() => {
        if (window.FarmerProductSystem && window.ProductSyncSystem) {
            console.log('🔧 Patching FarmerProductSystem for global sync...');
            
            // Patch más seguro
            if (!window.FarmerProductSystem._originalSaveProducts) {
                window.FarmerProductSystem._originalSaveProducts = window.FarmerProductSystem.saveProducts;
                
                window.FarmerProductSystem.saveProducts = function() {
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
            
            // Force initial sync
            window.ProductSyncSystem.syncAllFarmerProducts();
            console.log('✅ FarmerProductSystem patched successfully');
        } else {
            console.warn('⚠️ FarmerProductSystem or ProductSyncSystem not available for patching');
        }
    }, 3000);
});

// Monitor para verificar que el sistema funciona
setInterval(() => {
    if (window.ProductSyncSystem && window.ProductSyncSystem.debugMode) {
        const health = window.ProductSyncSystem.healthCheck();
        if (health.errors.length > 0) {
            console.warn('⚠️ Product Sync System has issues:', health.errors);
        }
    }
}, 60000); // Cada minuto