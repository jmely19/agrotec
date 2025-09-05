// Variables globales
let cart = [];
let total = 0;

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    animateCards();
});

// Función para inicializar todos los event listeners
function initializeEventListeners() {
    // Event listener para el botón de búsqueda
    const searchBtn = document.querySelector('.search-btn');
    const searchInput = document.querySelector('.search-input');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
        
        // Búsqueda en tiempo real
        searchInput.addEventListener('input', function(e) {
            filterProducts(e.target.value);
        });
    }
    
    // Event listeners para todos los botones "Add"
    const addButtons = document.querySelectorAll('.add-btn');
    addButtons.forEach((button, index) => {
        button.addEventListener('click', function() {
            addToCart(index);
        });
    });
}

// Función de búsqueda
function handleSearch() {
    const searchInput = document.querySelector('.search-input');
    const searchTerm = searchInput.value.trim().toLowerCase();
    
    if (searchTerm === '') {
        showAllProducts();
        return;
    }
    
    filterProducts(searchTerm);
}

// Función para filtrar productos
function filterProducts(searchTerm) {
    const productCards = document.querySelectorAll('.product-card');
    let hasVisibleProducts = false;
    
    productCards.forEach(card => {
        const productName = card.querySelector('h3').textContent.toLowerCase();
        
        if (productName.includes(searchTerm.toLowerCase())) {
            card.style.display = 'block';
            card.style.animation = 'fadeIn 0.3s ease-in';
            hasVisibleProducts = true;
        } else {
            card.style.display = 'none';
        }
    });
    
    // Mostrar mensaje si no hay productos
    toggleNoResultsMessage(!hasVisibleProducts);
}

// Función para mostrar todos los productos
function showAllProducts() {
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
        card.style.display = 'block';
        card.style.animation = 'fadeIn 0.3s ease-in';
    });
    
    toggleNoResultsMessage(false);
}

// Función para mostrar/ocultar mensaje de "no hay resultados"
function toggleNoResultsMessage(show) {
    let noResultsMsg = document.querySelector('.no-results-message');
    
    if (show && !noResultsMsg) {
        const productsGrid = document.querySelector('.products-grid');
        noResultsMsg = document.createElement('div');
        noResultsMsg.className = 'no-results-message';
        noResultsMsg.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #6c757d; grid-column: 1/-1;">
                <h3>No se encontraron productos</h3>
                <p>Intenta con otros términos de búsqueda</p>
            </div>
        `;
        productsGrid.appendChild(noResultsMsg);
    } else if (!show && noResultsMsg) {
        noResultsMsg.remove();
    }
}

// Función para agregar productos al carrito
function addToCart(productIndex) {
    const products = [
        { name: 'Clamshell tomato cherry 1LB', price: 0.47, originalPrice: 0.65 },
        { name: 'Purple Cabbage', price: 0.85, originalPrice: 0.98 },
        { name: 'Green Cabbage 1LB', price: 1.13, originalPrice: 1.78 },
        { name: 'Parsley', price: 1.50, originalPrice: 1.78 },
        { name: 'Parsley 100 GR', price: 0.95, originalPrice: 1.50 },
        { name: 'National Carrot', price: 0.38, originalPrice: 0.48 },
        { name: 'National onion', price: 0.95, originalPrice: 1.98 },
        { name: 'National onion', price: 0.56, originalPrice: 1.98 }
    ];
    
    const product = products[productIndex];
    if (product) {
        // Agregar al carrito
        const existingItem = cart.find(item => item.name === product.name && item.price === product.price);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                ...product,
                quantity: 1
            });
        }
        
        // Actualizar total
        total += product.price;
        
        // Mostrar animación de confirmación
        showAddToCartAnimation(productIndex);
        
        // Log para debugging (puedes remover en producción)
        console.log('Producto agregado:', product);
        console.log('Carrito actual:', cart);
        console.log('Total actual:', total.toFixed(2));
        
        // Actualizar contador del carrito si existe
        updateCartCounter();
    }
}

// Función para mostrar animación al agregar al carrito
function showAddToCartAnimation(productIndex) {
    const buttons = document.querySelectorAll('.add-btn');
    const button = buttons[productIndex];
    
    if (button) {
        const originalText = button.textContent;
        button.textContent = '✓ Added!';
        button.style.background = '#28a745';
        button.disabled = true;
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '#198754';
            button.disabled = false;
        }, 1500);
    }
}

// Función para actualizar contador del carrito
function updateCartCounter() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    // Buscar si existe un contador de carrito, si no, crearlo
    let cartCounter = document.querySelector('.cart-counter');
    if (!cartCounter && totalItems > 0) {
        cartCounter = document.createElement('div');
        cartCounter.className = 'cart-counter';
        cartCounter.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc3545;
            color: white;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            z-index: 1000;
            animation: bounce 0.3s ease;
        `;
        document.body.appendChild(cartCounter);
    }
    
    if (cartCounter) {
        cartCounter.textContent = totalItems;
        
        if (totalItems === 0) {
            cartCounter.remove();
        }
    }
}

// Función para animar las tarjetas al cargar
function animateCards() {
    const cards = document.querySelectorAll('.product-card');
    
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// Función para obtener información del carrito (útil para integraciones futuras)
function getCartInfo() {
    return {
        items: cart,
        total: total.toFixed(2),
        itemCount: cart.reduce((sum, item) => sum + item.quantity, 0)
    };
}

// Función para limpiar el carrito
function clearCart() {
    cart = [];
    total = 0;
    updateCartCounter();
    console.log('Carrito limpiado');
}

// Agregar estilos CSS para animaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes bounce {
        0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
        40% { transform: translateY(-10px); }
        60% { transform: translateY(-5px); }
    }
    
    .no-results-message {
        animation: fadeIn 0.5s ease-in;
    }
`;
document.head.appendChild(style);

// Exportar funciones para uso externo (si es necesario)
window.VegetableStore = {
    getCartInfo,
    clearCart,
    addToCart
};