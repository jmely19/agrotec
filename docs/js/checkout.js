// Checkout state
let currentStep = 1;
let cartData = null;

// Initialize checkout
function initializeCheckout() {
    console.log('Initializing checkout...');
    
    // Try to load cart data from SharedCart system first
    const storedCart = localStorage.getItem('checkoutCart');
    
    if (storedCart) {
        try {
            cartData = JSON.parse(storedCart);
            console.log('Loaded cart from SharedCart:', cartData);
            
            // Check if data is recent (within 1 hour)
            if (Date.now() - cartData.timestamp > 3600000) {
                console.log('Cart data is old, creating demo data');
                cartData = createDemoCart();
            }
        } catch (error) {
            console.error('Error parsing cart data:', error);
            cartData = createDemoCart();
        }
    } else {
        console.log('No cart data found, creating demo data');
        cartData = createDemoCart();
    }
    
    updateOrderSummary();
    setMinDeliveryDate();
}

// Create demo cart data (fallback)
function createDemoCart() {
    return {
        items: [
            { id: 101, name: 'Tomato cherry 1LB', price: 0.47, originalPrice: 0.65, quantity: 2, savings: '28%' },
            { id: 105, name: 'Parsley 100 GR', price: 0.95, originalPrice: 1.50, quantity: 1, savings: '37%' }
        ],
        appliedDiscount: 0,
        discountCode: '',
        timestamp: Date.now()
    };
}

// Update order summary
function updateOrderSummary() {
    if (!cartData || !cartData.items.length) {
        document.getElementById('order-summary').innerHTML = '<p>No items in cart</p>';
        return;
    }

    const cartItemsContainer = document.getElementById('cart-items-checkout');
    
    // Display cart items with savings information
    cartItemsContainer.innerHTML = cartData.items.map(item => {
        const originalPriceDisplay = item.originalPrice && item.originalPrice !== item.price ? 
            ` <small style="color: #dc3545; text-decoration: line-through;">B/.${item.originalPrice.toFixed(2)}</small>` : '';
        
        const savingsDisplay = item.savings ? ` <span style="color: #28a745; font-size: 0.8em;">(${item.savings} off)</span>` : '';
        
        return `
            <div class="cart-item">
                <div>
                    <div class="item-name">${item.name}${savingsDisplay}</div>
                    <div class="item-details">Quantity: ${item.quantity} × B/.${item.price.toFixed(2)}${originalPriceDisplay}</div>
                </div>
                <div class="item-total">B/.${(item.price * item.quantity).toFixed(2)}</div>
            </div>
        `;
    }).join('');

    // Calculate totals
    const subtotal = cartData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const originalSubtotal = cartData.items.reduce((sum, item) => {
        const originalPrice = item.originalPrice || item.price;
        return sum + (originalPrice * item.quantity);
    }, 0);
    
    const productSavings = originalSubtotal - subtotal; // Savings from product discounts
    const discountAmount = subtotal * (cartData.appliedDiscount || 0); // Additional discount from codes
    const shipping = subtotal > 15 ? 0 : 5.00; // Free shipping over B/.15
    const total = subtotal - discountAmount + shipping;

    // Update summary display
    document.getElementById('checkout-subtotal').textContent = `B/.${subtotal.toFixed(2)}`;
    document.getElementById('checkout-discount').textContent = `-B/.${discountAmount.toFixed(2)}`;
    document.getElementById('checkout-shipping').textContent = shipping === 0 ? 'Free' : `B/.${shipping.toFixed(2)}`;
    document.getElementById('checkout-total').textContent = `B/.${total.toFixed(2)}`;

    // Show/hide discount row
    const discountRow = document.getElementById('checkout-discount-row');
    if (discountRow) {
        discountRow.style.display = (cartData.appliedDiscount && cartData.appliedDiscount > 0) ? 'flex' : 'none';
    }

    // Show total product savings if any
    if (productSavings > 0) {
        let savingsInfo = document.getElementById('product-savings-info');
        if (!savingsInfo) {
            savingsInfo = document.createElement('div');
            savingsInfo.id = 'product-savings-info';
            savingsInfo.className = 'summary-row';
            savingsInfo.style.color = '#28a745';
            savingsInfo.style.fontWeight = 'bold';
            
            // Insert before shipping row
            const shippingRow = document.querySelector('.summary-row:nth-child(3)');
            if (shippingRow && shippingRow.parentNode) {
                shippingRow.parentNode.insertBefore(savingsInfo, shippingRow);
            }
        }
        savingsInfo.innerHTML = `<span>Total Savings:</span><span>B/.${productSavings.toFixed(2)}</span>`;
    }

    console.log('Order summary updated:', {
        subtotal: subtotal.toFixed(2),
        productSavings: productSavings.toFixed(2),
        discountAmount: discountAmount.toFixed(2),
        shipping: shipping.toFixed(2),
        total: total.toFixed(2)
    });
}

// Navigate between steps
function nextStep() {
    if (validateCurrentStep()) {
        // Update progress
        document.getElementById(`progress-${currentStep}`).classList.add('completed');
        document.getElementById(`progress-${currentStep}`).classList.remove('active');
        document.getElementById(`step-${currentStep}`).classList.remove('active');
        
        currentStep++;
        
        document.getElementById(`progress-${currentStep}`).classList.add('active');
        document.getElementById(`step-${currentStep}`).classList.add('active');
        
        // Scroll to top of form
        document.querySelector('.checkout-section').scrollIntoView({ behavior: 'smooth' });
    }
}

function prevStep() {
    document.getElementById(`progress-${currentStep}`).classList.remove('active');
    document.getElementById(`step-${currentStep}`).classList.remove('active');
    
    currentStep--;
    
    document.getElementById(`progress-${currentStep}`).classList.remove('completed');
    document.getElementById(`progress-${currentStep}`).classList.add('active');
    document.getElementById(`step-${currentStep}`).classList.add('active');
    
    // Scroll to top of form
    document.querySelector('.checkout-section').scrollIntoView({ behavior: 'smooth' });
}

// Validate current step
function validateCurrentStep() {
    const currentStepElement = document.getElementById(`step-${currentStep}`);
    const inputs = currentStepElement.querySelectorAll('input[required], select[required]');
    
    for (let input of inputs) {
        if (!input.value.trim()) {
            showNotification('Please complete all required fields (marked with *)', 'error');
            input.focus();
            return false;
        }
        
        // Specific validations
        if (input.type === 'email' && !input.checkValidity()) {
            showNotification('Please enter a valid email address', 'error');
            input.focus();
            return false;
        }
        
        if (input.id === 'cardNumber') {
            const cardNumber = input.value.replace(/\s/g, '');
            if (cardNumber.length < 13 || cardNumber.length > 19) {
                showNotification('Card number must be between 13 and 19 digits', 'error');
                input.focus();
                return false;
            }
        }
        
        if (input.id === 'cvv') {
            if (input.value.length < 3 || input.value.length > 4) {
                showNotification('CVV must be 3 or 4 digits', 'error');
                input.focus();
                return false;
            }
        }
        
        if (input.id === 'phone') {
            const phoneNumber = input.value.replace(/\D/g, '');
            if (phoneNumber.length < 7) {
                showNotification('Please enter a valid phone number', 'error');
                input.focus();
                return false;
            }
        }

        if (input.id === 'expiryDate') {
            const expiryRegex = /^(0[1-9]|1[0-2])\/\d{4}$/;
            if (!expiryRegex.test(input.value)) {
                showNotification('Please enter expiration date in MM/YYYY format', 'error');
                input.focus();
                return false;
            }
            
            // Validate future date
            const [month, year] = input.value.split('/');
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth() + 1;
            const currentYear = currentDate.getFullYear();
            
            const selectedDate = new Date(year, month - 1);
            const currentDateForComparison = new Date(currentYear, currentMonth - 1);
            
            if (selectedDate < currentDateForComparison) {
                showNotification('Expiration date must be in the future', 'error');
                input.focus();
                return false;
            }
        }
        
        if (input.id === 'deliveryDate') {
            const selectedDate = new Date(input.value);
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            
            if (selectedDate < tomorrow) {
                showNotification('Delivery date must be at least tomorrow', 'error');
                input.focus();
                return false;
            }
        }
    }
    
    return true;
}

// Select payment method
function selectPaymentMethod(method) {
    const cards = document.querySelectorAll('.payment-card');
    cards.forEach(card => card.classList.remove('selected'));
    
    const selectedCard = document.querySelector(`input[value="${method}"]`).parentNode.querySelector('.payment-card');
    selectedCard.classList.add('selected');
    
    const paymentInfo = document.getElementById('payment-info');
    
    if (method === 'yappy') {
        paymentInfo.classList.add('hidden');
        showNotification('Yappy payment selected. You will be redirected after completing the order.', 'info');
    } else if (method === 'card') {
        paymentInfo.classList.remove('hidden');
    }
}

// Complete order
function completeOrder() {
    if (validateCurrentStep()) {
        showNotification('Processing your order...', 'info');
        
        // Calculate final totals
        const subtotal = cartData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const discountAmount = subtotal * (cartData.appliedDiscount || 0);
        const shipping = subtotal > 15 ? 0 : 5.00;
        const total = subtotal - discountAmount + shipping;
        
        // Prepare complete order data
        const orderData = {
            // Cart information
            cart: cartData.items,
            cartSummary: {
                subtotal: subtotal.toFixed(2),
                discount: discountAmount.toFixed(2),
                discountCode: cartData.discountCode || '',
                shipping: shipping.toFixed(2),
                total: total.toFixed(2)
            },
            
            // Customer information
            customer: {
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('countryCode').value + ' ' + document.getElementById('phone').value
            },
            
            // Payment information
            payment: {
                method: document.querySelector('input[name="payment"]:checked').value,
                // Note: In a real application, never store full card details
                cardLast4: document.getElementById('cardNumber') ? document.getElementById('cardNumber').value.slice(-4) : '',
                cardName: document.getElementById('cardName') ? document.getElementById('cardName').value : ''
            },
            
            // Delivery information
            delivery: {
                address: document.getElementById('address').value,
                city: document.getElementById('city').value,
                date: document.getElementById('deliveryDate').value,
                time: document.getElementById('deliveryTime').value,
                notes: document.getElementById('deliveryNotes').value || 'None'
            },
            
            // Order metadata
            orderNumber: 'AGRO-' + Date.now().toString().substr(-8),
            orderDate: new Date().toLocaleDateString('en-US'),
            orderTime: new Date().toLocaleTimeString('en-US'),
            timestamp: Date.now()
        };

        // Simulate backend processing
        setTimeout(() => {
            showOrderSuccess(orderData);
            console.log('Order processed successfully:', orderData);
            
            // Clear cart data from localStorage
            localStorage.removeItem('checkoutCart');
            
            // Also clear the SharedCart if available
            if (window.SharedCart && typeof window.SharedCart.clearCart === 'function') {
                window.SharedCart.clearCart();
            }
            
        }, 2000);
    }
}

// Función para redirigir al home
function goToHome() {
    try {
        console.log('Redirecting to home page...');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error redirecting to home:', error);
        // Fallback: intentar con location.assign
        try {
            window.location.assign('index.html');
        } catch (fallbackError) {
            console.error('Fallback redirect also failed:', fallbackError);
            alert('Error al redirigir. Por favor navega manualmente a la página principal.');
        }
    }
}

// Función para redirigir a la página de ofertas
function goToSavings() {
    try {
        console.log('Clearing cart and redirecting to savings page...');
        
        // Limpiar el carrito usando el sistema SharedCart
        if (window.SharedCart && typeof window.SharedCart.clearCart === 'function') {
            window.SharedCart.clearCart();
            console.log('SharedCart cleared successfully');
        }
        
        // También limpiar localStorage por si acaso
        localStorage.removeItem('checkoutCart');
        localStorage.removeItem('agrotec_shared_cart');
        console.log('LocalStorage cart data cleared');
        
        // Mostrar notificación
        showNotification('Cart cleared! Redirecting to continue shopping...', 'success');
        
        // Redirigir después de un breve delay para mostrar la notificación
        setTimeout(() => {
            window.location.href = 'savings.html';
        }, 1000);
        
    } catch (error) {
        console.error('Error clearing cart or redirecting to savings:', error);
        try {
            // Fallback: solo redirigir sin limpiar
            window.location.assign('savings.html');
        } catch (fallbackError) {
            console.error('Fallback redirect also failed:', fallbackError);
            alert('Error al redirigir. Por favor navega manualmente a la página de ofertas.');
        }
    }
}

// Show order success - FUNCIÓN ACTUALIZADA
function showOrderSuccess(orderData) {
    const checkoutSection = document.querySelector('.checkout-section');
    checkoutSection.innerHTML = `
        <div class="success-message">
            <h2>🎉 Order Completed Successfully!</h2>
            
            <div style="background: white; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: left;">
                <h3 style="color: #28a745; margin-bottom: 15px;">Order Details</h3>
                <p><strong>Order Number:</strong> ${orderData.orderNumber}</p>
                <p><strong>Date:</strong> ${orderData.orderDate} at ${orderData.orderTime}</p>
                <p><strong>Total:</strong> B/.${orderData.cartSummary.total}</p>
                <p><strong>Payment Method:</strong> ${orderData.payment.method === 'yappy' ? 'Yappy' : 'Credit/Debit Card'}</p>
                
                <h4 style="color: #333; margin: 15px 0 10px 0;">Delivery Information</h4>
                <p><strong>Address:</strong> ${orderData.delivery.address}, ${orderData.delivery.city}</p>
                <p><strong>Delivery Date:</strong> ${orderData.delivery.date} at ${orderData.delivery.time}</p>
                ${orderData.delivery.notes !== 'None' ? `<p><strong>Notes:</strong> ${orderData.delivery.notes}</p>` : ''}
            </div>
            
            <p style="font-size: 1.1rem; margin: 20px 0;">
                Thank you for your purchase! A confirmation has been sent to <strong>${orderData.customer.email}</strong>
            </p>
            
            <div style="margin-top: 30px;">
                <button class="step-btn btn-primary" onclick="goToSavings()">Continue Shopping</button>
                <button class="step-btn btn-secondary" onclick="goToHome()" style="margin-left: 15px;">Go to Home</button>
            </div>
        </div>
    `;
    
    // Update progress to show completion
    document.querySelectorAll('.progress-step').forEach(step => {
        step.classList.add('completed');
        step.classList.remove('active');
    });
    
    // Scroll to top
    document.querySelector('.checkout-section').scrollIntoView({ behavior: 'smooth' });
}

// Set minimum delivery date (tomorrow)
function setMinDeliveryDate() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dateString = tomorrow.toISOString().split('T')[0];
    const deliveryDateInput = document.getElementById('deliveryDate');
    if (deliveryDateInput) {
        deliveryDateInput.min = dateString;
        
        // Set default to tomorrow
        if (!deliveryDateInput.value) {
            deliveryDateInput.value = dateString;
        }
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notifications
    document.querySelectorAll('.notification').forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Utility functions for external access
function getOrderTotal() {
    if (!cartData || !cartData.items.length) return 0;
    
    const subtotal = cartData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = subtotal * (cartData.appliedDiscount || 0);
    const shipping = subtotal > 15 ? 0 : 5.00;
    
    return subtotal - discountAmount + shipping;
}

function getOrderData() {
    return {
        cart: cartData,
        total: getOrderTotal(),
        currentStep: currentStep
    };
}

function resetCheckout() {
    currentStep = 1;
    
    // Reset progress bar
    document.querySelectorAll('.progress-step').forEach((step, index) => {
        step.classList.remove('active', 'completed');
        if (index === 0) step.classList.add('active');
    });
    
    // Reset steps
    document.querySelectorAll('.checkout-step').forEach((step, index) => {
        step.classList.remove('active');
        if (index === 0) step.classList.add('active');
    });
    
    // Clear form fields
    document.querySelectorAll('input, select, textarea').forEach(input => {
        if (input.id !== 'countryCode') {
            input.value = '';
        }
    });
    
    // Reset payment method
    const cardRadio = document.querySelector('input[name="payment"][value="card"]');
    if (cardRadio) {
        cardRadio.checked = true;
        selectPaymentMethod('card');
    }
    
    setMinDeliveryDate();
    showNotification('Checkout reset', 'info');
}

// Field formatting and validation
document.addEventListener('DOMContentLoaded', function() {
    console.log('Checkout page loaded');
    initializeCheckout();
    
    // Format card number
    const cardNumberInput = document.getElementById('cardNumber');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
            let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
            if (formattedValue.length > 19) {
                formattedValue = formattedValue.substring(0, 19);
            }
            e.target.value = formattedValue;
        });
    }

    // CVV numbers only
    const cvvInput = document.getElementById('cvv');
    if (cvvInput) {
        cvvInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/\D/g, '').substring(0,4);
        });
    }

    // Phone formatting
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 0) {
                if (value.length <= 4) {
                    value = value;
                } else if (value.length <= 8) {
                    value = value.substring(0, 4) + '-' + value.substring(4);
                } else {
                    value = value.substring(0, 4) + '-' + value.substring(4, 8);
                }
            }
            e.target.value = value;
        });
    }

    // Expiry date formatting MM/YYYY
    const expiryInput = document.getElementById('expiryDate');
    if (expiryInput) {
        expiryInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 6);
            }
            e.target.value = value;
        });
    }

    // Only letters in name fields
    const nameFields = ['firstName', 'lastName', 'cardName', 'city'];
    nameFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', function(e) {
                e.target.value = e.target.value.replace(/[^A-Za-z\s]/g, '');
            });
        }
    });

    // Email lowercase
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.toLowerCase();
        });
    }
    
    // Handle form submission with Enter key
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            
            if (currentStep < 3) {
                nextStep();
            } else {
                completeOrder();
            }
        }
    });
});

// Export functions for external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeCheckout,
        nextStep,
        prevStep,
        completeOrder,
        getOrderData,
        getOrderTotal,
        resetCheckout,
        goToHome,
        goToSavings
    };
}