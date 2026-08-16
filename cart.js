import { getItemWeight, calculateShipping, PACKAGING_WEIGHT_GRAMS } from './shipping-config.js';
import { getProductId, renderStockBadge } from './stock-utils.js';

let cart = JSON.parse(localStorage.getItem('glamaura_cart')) || [];

function saveCart() {
    localStorage.setItem('glamaura_cart', JSON.stringify(cart));
}

function getItemTitle(image, fallbackTitle) {
    if (fallbackTitle && fallbackTitle.trim()) {
        return fallbackTitle.trim();
    }
    if (image && typeof window.getProductNameFromImage === 'function') {
        const derived = window.getProductNameFromImage(image);
        if (derived) return derived;
    }
    return fallbackTitle || '';
}

function getAvailableStock(title, image) {
    const pId = getProductId(title, image);
    if (window.liveStockMap && typeof window.liveStockMap[pId] === 'number') {
        return window.liveStockMap[pId];
    }
    return 10; // Default fallback stock
}

function addToCartFromModal() {
    const activeImg = document.querySelector('#modalImageContainer img.active');
    const image = activeImg ? activeImg.src : '';
    const modalTitleText = document.getElementById('modalTitle') ? document.getElementById('modalTitle').textContent : '';
    const title = getItemTitle(image, modalTitleText);
    
    const priceText = document.getElementById('modalPrice').textContent;
    const price = parseInt(priceText.replace(/[^0-9]/g, '')) || 0;
    const itemWeight = getItemWeight({ name: title, image: image });

    const availableStock = getAvailableStock(title, image);
    const existingItem = cart.find(item => item.name === title || (image && item.image && getItemTitle(item.image, item.name) === title));
    const currentQty = existingItem ? existingItem.quantity : 0;

    if (availableStock <= 0) {
        alert("Sorry, this item is out of stock!");
        return;
    }

    if (currentQty + 1 > availableStock) {
        alert(`Sorry, only ${availableStock} unit(s) available in stock!`);
        return;
    }

    if (existingItem) {
        existingItem.quantity += 1;
        existingItem.name = title;
        existingItem.weight = itemWeight;
    } else {
        cart.push({
            name: title,
            price: price,
            weight: itemWeight,
            quantity: 1,
            image: image
        });
    }
    
    saveCart();
    updateCartUI();
    
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
        const item = cart[index];
        const displayName = getItemTitle(item.image, item.name);
        const availableStock = getAvailableStock(displayName, item.image);

        if (delta > 0 && item.quantity + delta > availableStock) {
            alert(`Sorry, maximum available stock for "${displayName}" is ${availableStock} unit(s).`);
            item.quantity = availableStock;
            saveCart();
            updateCartUI();
            return;
        }

        item.quantity += delta;
        if (item.quantity <= 0) {
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
    const cartSubtotalValue = document.getElementById('cartSubtotalValue');
    const cartProdWeightValue = document.getElementById('cartProdWeightValue');
    const cartPkgWeightValue = document.getElementById('cartPkgWeightValue');
    const cartWeightValue = document.getElementById('cartWeightValue');
    const cartShippingValue = document.getElementById('cartShippingValue');
    const cartTotalValue = document.getElementById('cartTotalValue');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    if (!cartItemsDiv) return;
    
    let totalCount = 0;
    let totalSubtotal = 0;
    let totalProdWeight = 0;
    let hasStockIssue = false;
    
    cartItemsDiv.innerHTML = '';
    
    if (cart.length === 0) {
        cartItemsDiv.innerHTML = '<p style="text-align:center; padding: 2rem 1rem; color: #ff69b4; font-weight: bold;">Your cart is empty 🐾</p>';
        if (checkoutBtn) checkoutBtn.disabled = true;
    } else {
        cart.forEach((item, index) => {
            const weight = getItemWeight(item);
            item.weight = weight;
            
            const displayName = getItemTitle(item.image, item.name);
            const availableStock = getAvailableStock(displayName, item.image);

            // Re-validate against latest available stock
            if (item.quantity > availableStock) {
                if (availableStock <= 0) {
                    hasStockIssue = true;
                } else {
                    item.quantity = availableStock;
                }
            }

            totalCount += item.quantity;
            totalSubtotal += item.price * item.quantity;
            totalProdWeight += weight * item.quantity;
            
            const isOutOfStock = availableStock <= 0;

            cartItemsDiv.innerHTML += `
                <div class="cart-item" style="${isOutOfStock ? 'opacity:0.6; border:1px solid #ff4d4f;' : ''}">
                    <img src="${item.image}" alt="${displayName}">
                    <div class="cart-item-details">
                        <h4>${displayName}</h4>
                        <p>₹${item.price} • ${weight}g</p>
                        <div style="font-size:0.75rem; color:${availableStock <= 2 ? '#d46b08' : '#666'};">
                            ${isOutOfStock ? '<strong style="color:#ff4d4f;">Out of Stock ❌</strong>' : `Stock: ${availableStock}`}
                        </div>
                        <div class="cart-quantity">
                            <button onclick="updateQuantity(${index}, -1)">-</button>
                            <span>${item.quantity}</span>
                            <button onclick="updateQuantity(${index}, 1)" ${item.quantity >= availableStock ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>+</button>
                        </div>
                    </div>
                </div>
            `;
        });

        if (checkoutBtn) checkoutBtn.disabled = hasStockIssue || totalCount <= 0;
    }
    
    const packagingWeight = cart.length > 0 ? PACKAGING_WEIGHT_GRAMS : 0;
    const totalParcelWeight = totalProdWeight + packagingWeight;
    const shippingCharge = calculateShipping(totalParcelWeight);
    const grandTotal = totalSubtotal + shippingCharge;
    
    if (cartCountSpan) cartCountSpan.textContent = totalCount;
    if (cartSubtotalValue) cartSubtotalValue.textContent = `₹${totalSubtotal}`;
    if (cartProdWeightValue) cartProdWeightValue.textContent = `${totalProdWeight}g`;
    if (cartPkgWeightValue) cartPkgWeightValue.textContent = `${packagingWeight}g`;
    if (cartWeightValue) cartWeightValue.textContent = `${totalParcelWeight}g`;
    if (cartShippingValue) cartShippingValue.textContent = `₹${shippingCharge}`;
    if (cartTotalValue) cartTotalValue.textContent = `₹${grandTotal}`;
}

window.addToCartFromModal = addToCartFromModal;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.toggleCart = toggleCart;
window.updateCartUI = updateCartUI;

document.addEventListener('DOMContentLoaded', () => {
    updateCartUI();
});

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('add-to-cart-quick')) {
        e.stopPropagation();
        const productDiv = e.target.closest('.product');
        if (productDiv) {
            const imageEl = productDiv.querySelector('img');
            const image = imageEl ? imageEl.src : '';
            const h3Text = productDiv.querySelector('h3') ? productDiv.querySelector('h3').textContent : '';
            const title = getItemTitle(image, h3Text);
            
            const priceText = productDiv.querySelector('p').textContent;
            const price = parseInt(priceText.replace(/[^0-9]/g, '')) || 0;
            const itemWeight = getItemWeight({ name: title, image: image });
            
            const availableStock = getAvailableStock(title, image);
            const existingItem = cart.find(item => item.name === title || (image && item.image && getItemTitle(item.image, item.name) === title));
            const currentQty = existingItem ? existingItem.quantity : 0;

            if (availableStock <= 0) {
                alert("Sorry, this item is out of stock!");
                return;
            }

            if (currentQty + 1 > availableStock) {
                alert(`Sorry, only ${availableStock} unit(s) available in stock!`);
                return;
            }

            if (existingItem) {
                existingItem.quantity += 1;
                existingItem.name = title;
                existingItem.weight = itemWeight;
            } else {
                cart.push({
                    name: title,
                    price: price,
                    weight: itemWeight,
                    quantity: 1,
                    image: image
                });
            }
            saveCart();
            updateCartUI();
            
            const originalText = e.target.innerHTML;
            e.target.innerHTML = 'Added! 💖';
            e.target.style.background = '#ff1493';
            setTimeout(() => {
                e.target.innerHTML = originalText;
                e.target.style.background = '';
            }, 1500);
            
            const sidebar = document.getElementById('cartSidebar');
            if (sidebar) sidebar.classList.add('active');
        }
    }
});
