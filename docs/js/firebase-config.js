// js/firebase-config.js - Configuración completa de Firebase para AGROTEC

// Import Firebase SDKs (agregar en tu HTML)
// <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
// <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"></script>
// <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"></script>
// <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-storage-compat.js"></script>

// ========================================
// FIREBASE CONFIGURATION
// ========================================

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDc5RPB0MeY1mi8F-LNEv8Q4xzsEeMxeUQ",
  authDomain: "agrotec-6315d.firebaseapp.com",
  projectId: "agrotec-6315d",
  storageBucket: "agrotec-6315d.firebasestorage.app",
  messagingSenderId: "1037601777097",
  appId: "1:1037601777097:web:cd29d83b096f6d7d6cf418",
  measurementId: "G-CTB5438P35"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Obtener referencias a los servicios
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();

// ========================================
// FIREBASE MANAGER - SISTEMA PRINCIPAL
// ========================================

window.FirebaseManager = {
    isConnected: false,
    currentUser: null,
    
    // Inicialización
    async init() {
        console.log('🔥 Initializing Firebase Manager...');
        
        try {
            // Verificar conexión a Firebase
            await this.checkConnection();
            
            // Configurar autenticación anónima para invitados
            await this.setupAuth();
            
            console.log('✅ Firebase Manager initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Error initializing Firebase:', error);
            return false;
        }
    },
    
    async checkConnection() {
        try {
            // Intentar leer un documento de prueba
            await db.collection('_test').limit(1).get();
            this.isConnected = true;
            console.log('✅ Firebase connection established');
        } catch (error) {
            console.error('❌ Firebase connection failed:', error);
            throw error;
        }
    },
    
    async setupAuth() {
        return new Promise((resolve) => {
            auth.onAuthStateChanged(async (user) => {
                if (user) {
                    this.currentUser = user;
                    console.log('👤 User authenticated:', user.uid);
                } else {
                    // Autenticación anónima para invitados
                    try {
                        const result = await auth.signInAnonymously();
                        this.currentUser = result.user;
                        console.log('👤 Anonymous user created:', result.user.uid);
                    } catch (error) {
                        console.error('❌ Anonymous auth failed:', error);
                    }
                }
                resolve();
            });
        });
    }
};

// ========================================
// FARMER PRODUCTS FIREBASE SERVICE
// ========================================

window.FarmerProductsFirebase = {
    // Guardar producto de farmer
    async saveProduct(farmerData, productData) {
        try {
            console.log('💾 Saving farmer product to Firebase...');
            
            // Preparar datos del producto
            const productToSave = {
                ...productData,
                farmerId: farmerData.id || farmerData.email,
                farmerName: farmerData.name,
                businessName: farmerData.businessName || farmerData.business || `${farmerData.name}'s Farm`,
                farmerEmail: farmerData.email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                syncedFromDevice: navigator.userAgent,
                status: productData.status || 'active'
            };
            
            // Guardar en Firestore
            await db.collection('farmer_products').doc(productData.id.toString()).set(productToSave);
            
            console.log('✅ Product saved successfully to Firebase');
            
            // También mantener una copia en localStorage como backup
            this.saveToLocalBackup(productToSave);
            
            // Disparar evento de sincronización
            window.dispatchEvent(new CustomEvent('firebaseProductSaved', {
                detail: productToSave
            }));
            
            return true;
            
        } catch (error) {
            console.error('❌ Error saving product to Firebase:', error);
            // Fallback a localStorage si Firebase falla
            this.saveToLocalBackup(productData);
            return false;
        }
    },
    
    // Obtener todos los productos activos
    async getActiveProducts() {
        try {
            console.log('📥 Getting active products from Firebase...');
            
            const snapshot = await db.collection('farmer_products')
                .where('status', '==', 'active')
                .where('onlineStore', '==', true)
                .orderBy('createdAt', 'desc')
                .get();
            
            const products = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                products.push({
                    id: doc.id,
                    ...data,
                    // Convertir timestamps de Firestore a fechas
                    dateCreated: data.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
                    dateUpdated: data.updatedAt?.toDate()?.toISOString() || new Date().toISOString()
                });
            });
            
            console.log(`✅ Retrieved ${products.length} active products from Firebase`);
            
            // Actualizar localStorage como backup
            localStorage.setItem('farmer_products_firebase_backup', JSON.stringify(products));
            
            return products;
            
        } catch (error) {
            console.error('❌ Error getting products from Firebase:', error);
            // Fallback a localStorage backup
            return this.getFromLocalBackup();
        }
    },
    
    // Obtener productos de un farmer específico
    async getFarmerProducts(farmerId) {
        try {
            const snapshot = await db.collection('farmer_products')
                .where('farmerId', '==', farmerId)
                .orderBy('createdAt', 'desc')
                .get();
            
            const products = [];
            snapshot.forEach(doc => {
                products.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return products;
            
        } catch (error) {
            console.error('❌ Error getting farmer products:', error);
            return [];
        }
    },
    
    // Actualizar producto
    async updateProduct(productId, updates) {
        try {
            await db.collection('farmer_products').doc(productId.toString()).update({
                ...updates,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('✅ Product updated in Firebase');
            
            // Disparar evento de actualización
            window.dispatchEvent(new CustomEvent('firebaseProductUpdated', {
                detail: { productId, updates }
            }));
            
            return true;
            
        } catch (error) {
            console.error('❌ Error updating product:', error);
            return false;
        }
    },
    
    // Eliminar producto
    async deleteProduct(productId) {
        try {
            await db.collection('farmer_products').doc(productId.toString()).delete();
            console.log('✅ Product deleted from Firebase');
            
            // Disparar evento de eliminación
            window.dispatchEvent(new CustomEvent('firebaseProductDeleted', {
                detail: { productId }
            }));
            
            return true;
            
        } catch (error) {
            console.error('❌ Error deleting product:', error);
            return false;
        }
    },
    
    // Escuchar cambios en tiempo real
    setupRealtimeListener() {
        console.log('👂 Setting up real-time listener for farmer products...');
        
        return db.collection('farmer_products')
            .where('status', '==', 'active')
            .where('onlineStore', '==', true)
            .onSnapshot((snapshot) => {
                const products = [];
                
                snapshot.forEach(doc => {
                    const data = doc.data();
                    products.push({
                        id: doc.id,
                        ...data,
                        dateCreated: data.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
                        dateUpdated: data.updatedAt?.toDate()?.toISOString() || new Date().toISOString()
                    });
                });
                
                console.log(`🔄 Real-time update: ${products.length} products`);
                
                // Actualizar SharedCart y otros sistemas
                if (window.SharedCart) {
                    this.updateSharedCartFromFirebase(products);
                }
                
                // Disparar evento global
                window.dispatchEvent(new CustomEvent('firebaseProductsUpdated', {
                    detail: { products, count: products.length }
                }));
                
                // Backup local
                localStorage.setItem('farmer_products_firebase_backup', JSON.stringify(products));
                
            }, (error) => {
                console.error('❌ Real-time listener error:', error);
            });
    },
    
    // Actualizar SharedCart con datos de Firebase
    updateSharedCartFromFirebase(products) {
        if (!window.SharedCart) return;
        
        // Limpiar productos de farmer existentes en SharedCart
        Object.keys(window.SharedCart.allProducts).forEach(id => {
            const product = window.SharedCart.allProducts[id];
            if (product.isFarmerProduct) {
                delete window.SharedCart.allProducts[id];
            }
        });
        
        // Agregar productos actualizados de Firebase
        products.forEach(product => {
            window.SharedCart.allProducts[product.id] = {
                id: product.id,
                name: product.title,
                price: product.price,
                originalPrice: product.originalPrice,
                image: product.image,
                type: product.type,
                savings: product.isOffer && product.originalPrice ? 
                    `${Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%` : null,
                description: product.description,
                farmer: product.farmerName,
                businessName: product.businessName,
                weight: product.weight ? `${product.weight.value} ${product.weight.unit}` : '',
                isFarmerProduct: true,
                dateAdded: product.dateCreated
            };
        });
        
        // Actualizar interfaz
        window.SharedCart.updateUI();
        
        console.log('🔄 SharedCart updated with Firebase data');
    },
    
    // Sistema de backup local
    saveToLocalBackup(productData) {
        try {
            const backup = JSON.parse(localStorage.getItem('farmer_products_backup') || '[]');
            const existingIndex = backup.findIndex(p => p.id === productData.id);
            
            if (existingIndex > -1) {
                backup[existingIndex] = productData;
            } else {
                backup.push(productData);
            }
            
            localStorage.setItem('farmer_products_backup', JSON.stringify(backup));
            console.log('💾 Product saved to local backup');
        } catch (error) {
            console.error('❌ Error saving local backup:', error);
        }
    },
    
    getFromLocalBackup() {
        try {
            const backup = JSON.parse(localStorage.getItem('farmer_products_firebase_backup') || '[]');
            console.log(`📁 Retrieved ${backup.length} products from local backup`);
            return backup;
        } catch (error) {
            console.error('❌ Error reading local backup:', error);
            return [];
        }
    }
};

// ========================================
// INTEGRACIÓN CON SISTEMA EXISTENTE
// ========================================

// Reemplazar FarmerProductSystem.saveProducts
if (typeof window.FarmerProductSystem !== 'undefined') {
    window.FarmerProductSystem._originalSaveProducts = window.FarmerProductSystem.saveProducts;
    
    window.FarmerProductSystem.saveProducts = async function() {
        try {
            // Obtener datos del farmer actual
            const farmerData = window.currentFarmer || JSON.parse(sessionStorage.getItem('agrotec_user') || '{}');
            
            if (!farmerData.id && !farmerData.email) {
                console.error('❌ No farmer data available');
                return false;
            }
            
            // Guardar cada producto en Firebase
            for (const product of this.currentProducts) {
                await window.FarmerProductsFirebase.saveProduct(farmerData, product);
            }
            
            // También mantener funcionamiento local como backup
            this._originalSaveProducts.call(this);
            
            return true;
            
        } catch (error) {
            console.error('❌ Error in Firebase saveProducts:', error);
            // Fallback al método original
            return this._originalSaveProducts.call(this);
        }
    };
}

// Función para migrar datos existentes de localStorage a Firebase
window.migrateToFirebase = async function() {
    try {
        console.log('🔄 Starting migration to Firebase...');
        
        const farmerData = window.currentFarmer || JSON.parse(sessionStorage.getItem('agrotec_user') || '{}');
        const localProducts = JSON.parse(localStorage.getItem('farmer_products') || '[]');
        
        if (!farmerData.email) {
            console.error('❌ No farmer data for migration');
            return false;
        }
        
        if (localProducts.length === 0) {
            console.log('ℹ️ No local products to migrate');
            return true;
        }
        
        let migrated = 0;
        for (const product of localProducts) {
            const success = await window.FarmerProductsFirebase.saveProduct(farmerData, product);
            if (success) migrated++;
        }
        
        console.log(`✅ Migrated ${migrated}/${localProducts.length} products to Firebase`);
        
        if (window.SharedCart && window.SharedCart.showNotification) {
            window.SharedCart.showNotification(`Migrated ${migrated} products to cloud storage`, 'success');
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Migration error:', error);
        return false;
    }
};

// ========================================
// AUTO-INICIALIZACIÓN
// ========================================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Starting Firebase initialization...');
    
    // Inicializar Firebase
    const firebaseReady = await FirebaseManager.init();
    
    if (firebaseReady) {
        // Configurar listener en tiempo real
        const unsubscribe = FarmerProductsFirebase.setupRealtimeListener();
        
        // Guardar referencia para poder desuscribirse después
        window.firebaseUnsubscribe = unsubscribe;
        
        // Cargar productos iniciales
        setTimeout(async () => {
            const products = await FarmerProductsFirebase.getActiveProducts();
            
            if (window.SharedCart) {
                FarmerProductsFirebase.updateSharedCartFromFirebase(products);
            }
            
            console.log('🔥 Firebase system fully operational!');
            
            // Mostrar notificación de conexión
            if (window.SharedCart && window.SharedCart.showNotification) {
                window.SharedCart.showNotification('Connected to cloud storage ☁️', 'success');
            }
        }, 2000);
        
        // Migrar datos existentes si es necesario
        setTimeout(() => {
            if (localStorage.getItem('farmer_products')) {
                migrateToFirebase();
            }
        }, 5000);
    } else {
        console.warn('⚠️ Firebase initialization failed, using local storage as fallback');
        
        if (window.SharedCart && window.SharedCart.showNotification) {
            window.SharedCart.showNotification('Using local storage (offline mode)', 'info');
        }
    }
});

// Cleanup al cerrar la página
window.addEventListener('beforeunload', () => {
    if (window.firebaseUnsubscribe) {
        window.firebaseUnsubscribe();
        console.log('🔥 Firebase listeners cleaned up');
    }
});

// ========================================
// FUNCIONES GLOBALES DE DEBUG
// ========================================

window.debugFirebase = async function() {
    console.group('🔥 Firebase Debug Info');
    console.log('Firebase Connected:', FirebaseManager.isConnected);
    console.log('Current User:', FirebaseManager.currentUser?.uid);
    
    try {
        const products = await FarmerProductsFirebase.getActiveProducts();
        console.log('Products in Firebase:', products.length);
        console.log('Products:', products);
    } catch (error) {
        console.error('Error fetching products:', error);
    }
    
    console.groupEnd();
};

window.testFirebaseConnection = async function() {
    try {
        await db.collection('_test').add({
            message: 'Test connection',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log('✅ Firebase connection test successful');
        return true;
    } catch (error) {
        console.error('❌ Firebase connection test failed:', error);
        return false;
    }
};

console.log('🔥 Firebase Configuration loaded!');
console.log('Commands:');
console.log('- debugFirebase(): Debug Firebase status');
console.log('- testFirebaseConnection(): Test connection');
console.log('- migrateToFirebase(): Migrate local data to Firebase');