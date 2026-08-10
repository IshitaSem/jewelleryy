let cart = JSON.parse(localStorage.getItem('glamaura_cart')) || [];

function saveCart() {
    localStorage.setItem('glamaura_cart', JSON.stringify(cart));
}

function addToCartFromModal() {
    const title = document.getElementById('modalTitle').textContent;
    const priceText = document.getElementById('modalPrice').textContent;
    // Extract number from "₹79"
    const price = parseInt(priceText.replace(/[^0-9]/g, ''));
    
    // The active image in the modal
    const activeImg = document.querySelector('#modalImageContainer img.active');
    const image = activeImg ? activeImg.src : '';

    const existingItem = cart.find(item => item.name === title);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            name: title,
            price: price,
            quantity: 1,
            image: image
        });
    }
    
    saveCart();
    updateCartUI();
    
    // Visual feedback
    const btn = document.querySelector('.modal-add-cart-btn');
    if(btn) {
        const originalText = btn.innerHTML;
        btn.innerHTML = 'Added! 💖';
        btn.style.background = '#ff1493';
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '#ff69b4';
        }, 1500);
    }
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    updateCartUI();
}

function updateQuantity(index, delta) {
    if (cart[index]) {
        cart[index].quantity += delta;
        if (cart[index].quantity <= 0) {
            removeFromCart(index);
        } else {
            saveCart();
            updateCartUI();
        }
    }
}

function toggleCart() {
    const sidebar = document.getElementById('cartSidebar');
    if(sidebar) sidebar.classList.toggle('active');
}

function updateCartUI() {
    const cartItemsDiv = document.getElementById('cartItems');
    const cartCountSpan = document.getElementById('cartCount');
    const cartTotalValue = document.getElementById('cartTotalValue');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    if (!cartItemsDiv) return; // Prevent errors if UI is missing
    
    let totalCount = 0;
    let totalValue = 0;
    
    cartItemsDiv.innerHTML = '';
    
    if (cart.length === 0) {
        cartItemsDiv.innerHTML = '<p style="text-align:center; padding: 2rem 1rem; color: #ff69b4; font-weight: bold;">Your cart is empty 🐾</p>';
        if(checkoutBtn) checkoutBtn.disabled = true;
    } else {
        if(checkoutBtn) checkoutBtn.disabled = false;
        cart.forEach((item, index) => {
            totalCount += item.quantity;
            totalValue += item.price * item.quantity;
            
            cartItemsDiv.innerHTML += `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}">
                    <div class="cart-item-details">
                        <h4>${item.name}</h4>
                        <p>₹${item.price}</p>
                        <div class="cart-quantity">
                            <button onclick="updateQuantity(${index}, -1)">-</button>
                            <span>${item.quantity}</span>
                            <button onclick="updateQuantity(${index}, 1)">+</button>
                        </div>
                    </div>
                </div>
            `;
        });
    }
    
    if(cartCountSpan) cartCountSpan.textContent = totalCount;
    if(cartTotalValue) cartTotalValue.textContent = `₹${totalValue}`;
}

// Make functions globally available for inline event handlers
window.addToCartFromModal = addToCartFromModal;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.toggleCart = toggleCart;

// Initialize UI on load
document.addEventListener('DOMContentLoaded', () => {
    updateCartUI();
});
