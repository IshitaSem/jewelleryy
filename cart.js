import { getItemWeight, calculateShipping, PACKAGING_WEIGHT_GRAMS } from './shipping-config.js';
import { getProductId, renderStockBadge } from './stock-utils.js';

let cart = JSON.parse(localStorage.getItem('glamaura_cart')) || [];

function saveCart() {
    localStorage.setItem('glamaura_cart', JSON.stringify(cart));
}

function getItemTitle(image, fallbackTitle) {
    if (fallbackTitle && typeof fallbackTitle === 'string' && fallbackTitle.trim() && fallbackTitle.trim() !== 'Product') {
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
    let title = getItemTitle(image, modalTitleText);
    
    // Append selected variant option (e.g., "BMW", "Volkswagen", "Porsche") if available
    const selectedOption = window.selectedModalOption || '';
    if (selectedOption && !title.includes(`(${selectedOption})`)) {
        title = `${title} (${selectedOption})`;
    }
    
    const priceText = document.getElementById('modalPrice').textContent;
    const price = parseInt(priceText.replace(/[^0-9]/g, '')) || 0;
    const itemWeight = getItemWeight({ name: title, image: image });

    const availableStock = getAvailableStock(title, image);
    const targetPid = getProductId(title, image);
    const existingItem = cart.find(item => item.name === title || (getProductId(item.name, item.image) === targetPid && (!selectedOption || item.name.includes(selectedOption))));
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

    // Deduplicate cart array by getProductId so duplicate entries (e.g. title with vs without emoji) merge cleanly
    if (cart.length > 1) {
        const mergedCart = [];
        const seenMap = {};
        cart.forEach(item => {
            const pid = getProductId(item.name, item.image);
            if (seenMap[pid]) {
                seenMap[pid].quantity += (item.quantity || 1);
            } else {
                seenMap[pid] = { ...item };
                mergedCart.push(seenMap[pid]);
            }
        });
        if (mergedCart.length !== cart.length) {
            cart = mergedCart;
            saveCart();
        }
    }
    
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
            
            // Auto-repair stale item names saved as "Gallery" for non-gallery items
            if (item.name === 'Gallery' && item.image && !item.image.includes('gallery (')) {
                if (typeof window.getProductNameFromImage === 'function') {
                    const repairedName = window.getProductNameFromImage(item.image);
                    if (repairedName) {
                        item.name = repairedName;
                        saveCart();
                    }
                }
            }

            const displayName = getItemTitle(item.image, item.name);
            const availableStock = getAvailableStock(displayName, item.image);

            // Re-validate against latest available stock
            if (availableStock <= 0) {
                hasStockIssue = true;
            } else if (item.quantity > availableStock) {
                item.quantity = availableStock;
                saveCart();
            }

            totalCount += item.quantity;
            totalSubtotal += item.price * item.quantity;
            totalProdWeight += weight * item.quantity;
            
            const isOutOfStock = availableStock <= 0;

            cartItemsDiv.innerHTML += `
                <div class="cart-item" style="${isOutOfStock ? 'opacity:0.65; border:1px solid #ff4d4f; background:#fff2f0;' : ''}">
                    <img src="${item.image}" alt="${displayName}">
                    <div class="cart-item-details">
                        <h4>${displayName}</h4>
                        <p>₹${item.price} • ${weight}g</p>
                        <div style="font-size:0.75rem; margin-top:0.2rem; color:${isOutOfStock ? '#ff4d4f' : (availableStock <= 2 ? '#d46b08' : '#666')}; font-weight:${isOutOfStock ? 'bold' : 'normal'};">
                            ${isOutOfStock ? 'Out of Stock ❌' : `Stock: ${availableStock}`}
                        </div>
                        <div class="cart-quantity">
                            <button onclick="updateQuantity(${index}, -1)">-</button>
                            <span>${item.quantity}</span>
                            <button onclick="updateQuantity(${index}, 1)" ${item.quantity >= availableStock || isOutOfStock ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>+</button>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    let warningNotice = document.getElementById('cartStockNotice');
    if (hasStockIssue) {
        if (!warningNotice) {
            warningNotice = document.createElement('div');
            warningNotice.id = 'cartStockNotice';
            warningNotice.style.cssText = 'color:#ff4d4f; font-weight:bold; font-size:0.8rem; text-align:center; margin-bottom:0.6rem; background:#fff2f0; padding:0.5rem; border-radius:6px; border:1px solid #ffccc7;';
            const cartFooter = document.querySelector('.cart-footer');
            if (cartFooter) cartFooter.insertBefore(warningNotice, cartFooter.firstChild);
        }
        warningNotice.innerHTML = '⚠️ Some items in your cart are out of stock. Please remove them to proceed.';
        warningNotice.style.display = 'block';
        if (checkoutBtn) checkoutBtn.disabled = true;
    } else {
        if (warningNotice) warningNotice.style.display = 'none';
        if (checkoutBtn) checkoutBtn.disabled = totalCount <= 0;
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

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => updateCartUI());
} else {
    updateCartUI();
}

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('add-to-cart-quick')) {
        e.stopPropagation();
        const productDiv = e.target.closest('.product');
        if (productDiv) {
            const imageEl = productDiv.querySelector('img');
            const image = imageEl ? imageEl.src : '';
            const h3Text = productDiv.querySelector('h3') ? productDiv.querySelector('h3').textContent : '';
            let title = getItemTitle(image, h3Text);
            
            // Check for card-level option selection
            const activeCardPill = productDiv.querySelector('.card-option-pill.active');
            const cardOption = productDiv.dataset.selectedOption || (activeCardPill ? activeCardPill.textContent.trim() : '');
            if (cardOption && !title.includes(`(${cardOption})`)) {
                title = `${title} (${cardOption})`;
            }

            const priceText = productDiv.querySelector('p').textContent;
            const price = parseInt(priceText.replace(/[^0-9]/g, '')) || 0;
            const itemWeight = getItemWeight({ name: title, image: image });
            
            const availableStock = getAvailableStock(title, image);
            const targetPid = getProductId(title, image);
            const existingItem = cart.find(item => item.name === title || (getProductId(item.name, item.image) === targetPid && (!cardOption || item.name.includes(cardOption))));
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
