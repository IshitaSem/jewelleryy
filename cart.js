import { getItemWeight, calculateShipping, PACKAGING_WEIGHT_GRAMS } from './shipping-config.js';
import { getProductId, renderStockBadge } from './stock-utils.js';
import { calculateRingBundleDiscount, calculateCouponDiscount, isEligibleRing } from './product-utils.js';
import { db } from './firebase.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

let cart = JSON.parse(localStorage.getItem('glamaura_cart')) || [];
let activeCoupon = JSON.parse(localStorage.getItem('glamaura_coupon')) || null;
let ringPricingRule = null;

// Load pricing rule asynchronously from Firestore if available
async function loadPricingRule() {
    try {
        const snap = await getDoc(doc(db, "pricingRules", "ring150Bundle"));
        if (snap.exists()) {
            ringPricingRule = snap.data();
            window.ring150PricingRule = ringPricingRule;
        }
    } catch (e) {
        console.warn("Could not fetch pricing rules from Firestore, using default:", e);
    }
}
loadPricingRule();

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

async function applyCartCoupon() {
    const input = document.getElementById('cartCouponInput');
    const msgDiv = document.getElementById('cartCouponMessage');
    const btn = document.getElementById('cartApplyCouponBtn');
    
    if (!input || !msgDiv) return;
    const code = input.value.trim().toUpperCase();

    if (!code) {
        msgDiv.style.display = 'block';
        msgDiv.style.color = '#ff4d4f';
        msgDiv.textContent = '✕ Please enter a coupon code.';
        return;
    }

    if (btn) btn.disabled = true;
    msgDiv.style.display = 'block';
    msgDiv.style.color = '#666';
    msgDiv.textContent = 'Checking coupon... ⏳';

    try {
        const couponRef = doc(db, "coupons", code);
        const snap = await getDoc(couponRef);

        if (!snap.exists()) {
            msgDiv.style.color = '#ff4d4f';
            msgDiv.textContent = '✕ Invalid or expired coupon code.';
            return;
        }

        const couponData = { id: snap.id, ...snap.data() };
        
        // Calculate current subtotal after ring bundle discount
        let originalSubtotal = 0;
        cart.forEach(item => { originalSubtotal += item.price * item.quantity; });
        const bundleRes = calculateRingBundleDiscount(cart, ringPricingRule || window.ring150PricingRule);
        const subtotalAfterBundle = originalSubtotal - bundleRes.bundleDiscount;

        const evalRes = calculateCouponDiscount(couponData, subtotalAfterBundle);
        if (!evalRes.valid) {
            msgDiv.style.color = '#ff4d4f';
            msgDiv.textContent = `✕ ${evalRes.reason}`;
            return;
        }

        // Save active coupon to localStorage
        activeCoupon = couponData;
        localStorage.setItem('glamaura_coupon', JSON.stringify(activeCoupon));
        
        msgDiv.style.color = '#28a745';
        msgDiv.textContent = `✓ ${activeCoupon.code} applied! (-₹${evalRes.discount})`;
        updateCartUI();

    } catch (e) {
        console.error("Error applying coupon:", e);
        msgDiv.style.color = '#ff4d4f';
        msgDiv.textContent = '✕ Error applying coupon: ' + e.message;
    } finally {
        if (btn) btn.disabled = false;
    }
}

function removeCartCoupon() {
    activeCoupon = null;
    localStorage.removeItem('glamaura_coupon');
    const input = document.getElementById('cartCouponInput');
    const msgDiv = document.getElementById('cartCouponMessage');
    if (input) input.value = '';
    if (msgDiv) {
        msgDiv.style.display = 'none';
        msgDiv.textContent = '';
    }
    updateCartUI();
}

function updateCartUI() {
    const cartItemsDiv = document.getElementById('cartItems');
    const cartCountSpan = document.getElementById('cartCount');
    const cartSubtotalValue = document.getElementById('cartSubtotalValue');
    const cartBundleRow = document.getElementById('cartBundleRow');
    const cartBundleDiscountValue = document.getElementById('cartBundleDiscountValue');
    const cartPostBundleRow = document.getElementById('cartPostBundleRow');
    const cartPostBundleValue = document.getElementById('cartPostBundleValue');
    const cartCouponRow = document.getElementById('cartCouponRow');
    const cartAppliedCouponCode = document.getElementById('cartAppliedCouponCode');
    const cartCouponDiscountValue = document.getElementById('cartCouponDiscountValue');
    const cartProdWeightValue = document.getElementById('cartProdWeightValue');
    const cartPkgWeightValue = document.getElementById('cartPkgWeightValue');
    const cartWeightValue = document.getElementById('cartWeightValue');
    const cartShippingValue = document.getElementById('cartShippingValue');
    const cartTotalValue = document.getElementById('cartTotalValue');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    if (!cartItemsDiv) return;

    // Deduplicate cart array
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
    let totalOriginalSubtotal = 0;
    let totalProdWeight = 0;
    let hasStockIssue = false;

    // Ring bundle calculation
    const bundleRes = calculateRingBundleDiscount(cart, ringPricingRule || window.ring150PricingRule);
    
    cartItemsDiv.innerHTML = '';
    
    if (cart.length === 0) {
        cartItemsDiv.innerHTML = '<p style="text-align:center; padding: 2rem 1rem; color: #ff69b4; font-weight: bold;">Your cart is empty 🐾</p>';
        if (checkoutBtn) checkoutBtn.disabled = true;
    } else {
        cart.forEach((item, index) => {
            const weight = getItemWeight(item);
            item.weight = weight;
            
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

            if (availableStock <= 0) {
                hasStockIssue = true;
            } else if (item.quantity > availableStock) {
                item.quantity = availableStock;
                saveCart();
            }

            totalCount += item.quantity;
            totalOriginalSubtotal += item.price * item.quantity;
            totalProdWeight += weight * item.quantity;
            
            const isOutOfStock = availableStock <= 0;
            const isEligible = isEligibleRing(item, ringPricingRule || window.ring150PricingRule);
            const hasBundleDiscount = isEligible && bundleRes.bundleDiscount > 0;

            const priceDisplay = hasBundleDiscount 
                ? `<span style="text-decoration:line-through; color:#aaa; margin-right:0.3rem;">₹${item.price}</span><strong style="color:#28a745;">₹${bundleRes.appliedTierPrice}</strong>`
                : `₹${item.price}`;

            cartItemsDiv.innerHTML += `
                <div class="cart-item" style="${isOutOfStock ? 'opacity:0.65; border:1px solid #ff4d4f; background:#fff2f0;' : ''}">
                    <img src="${item.image}" alt="${displayName}">
                    <div class="cart-item-details">
                        <h4>${displayName}</h4>
                        <p>${priceDisplay} • ${weight}g</p>
                        ${hasBundleDiscount ? `<div style="font-size:0.75rem; color:#28a745; font-weight:bold;">💍 Ring Offer (-₹${(item.price - bundleRes.appliedTierPrice)}/item)</div>` : ''}
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

    const subtotalAfterBundle = totalOriginalSubtotal - bundleRes.bundleDiscount;

    // Handle Coupon Calculation & UI
    let couponDiscount = 0;
    const couponInputContainer = document.getElementById('couponInputContainer');
    const cartCouponInput = document.getElementById('cartCouponInput');
    const cartCouponMessage = document.getElementById('cartCouponMessage');

    activeCoupon = JSON.parse(localStorage.getItem('glamaura_coupon')) || null;

    if (activeCoupon && totalCount > 0) {
        const evalRes = calculateCouponDiscount(activeCoupon, subtotalAfterBundle);
        if (evalRes.valid) {
            couponDiscount = evalRes.discount;
            if (cartCouponRow) {
                cartCouponRow.style.display = 'flex';
                if (cartAppliedCouponCode) cartAppliedCouponCode.textContent = activeCoupon.code;
                if (cartCouponDiscountValue) cartCouponDiscountValue.textContent = `-₹${couponDiscount}`;
            }
            if (couponInputContainer) {
                couponInputContainer.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center; width:100%; background:#e6f7ff; border:1px solid #91d5ff; padding:0.4rem 0.6rem; border-radius:5px;">
                        <span style="font-weight:bold; color:#1890ff; font-size:0.85rem;">✓ ${activeCoupon.code} Applied (-₹${couponDiscount})</span>
                        <button type="button" onclick="removeCartCoupon()" style="background:none; border:none; color:#ff4d4f; font-weight:bold; cursor:pointer; font-size:0.85rem;">Remove ✕</button>
                    </div>
                `;
            }
            if (cartCouponMessage) {
                cartCouponMessage.style.display = 'none';
            }
        } else {
            // Coupon invalid due to cart changes
            if (cartCouponRow) cartCouponRow.style.display = 'none';
            if (couponInputContainer) {
                couponInputContainer.innerHTML = `
                    <input type="text" id="cartCouponInput" value="${activeCoupon.code}" placeholder="Enter coupon code" style="flex: 1; padding: 0.45rem 0.6rem; border: 1px solid #ccc; border-radius: 5px; text-transform: uppercase; font-size: 0.85rem;">
                    <button id="cartApplyCouponBtn" type="button" onclick="applyCartCoupon()" style="padding: 0.45rem 0.8rem; background: #ff1493; color: white; border: none; border-radius: 5px; font-weight: bold; cursor: pointer; font-size: 0.85rem;">APPLY</button>
                `;
            }
            if (cartCouponMessage) {
                cartCouponMessage.style.display = 'block';
                cartCouponMessage.style.color = '#ff4d4f';
                cartCouponMessage.textContent = `✕ ${evalRes.reason}`;
            }
        }
    } else {
        if (cartCouponRow) cartCouponRow.style.display = 'none';
        if (couponInputContainer && !document.getElementById('cartCouponInput')) {
            couponInputContainer.innerHTML = `
                <input type="text" id="cartCouponInput" placeholder="Enter coupon code" style="flex: 1; padding: 0.45rem 0.6rem; border: 1px solid #ccc; border-radius: 5px; text-transform: uppercase; font-size: 0.85rem;">
                <button id="cartApplyCouponBtn" type="button" onclick="applyCartCoupon()" style="padding: 0.45rem 0.8rem; background: #ff1493; color: white; border: none; border-radius: 5px; font-weight: bold; cursor: pointer; font-size: 0.85rem;">APPLY</button>
            `;
        }
    }
    
    const packagingWeight = cart.length > 0 ? PACKAGING_WEIGHT_GRAMS : 0;
    const totalParcelWeight = totalProdWeight + packagingWeight;
    const shippingCharge = calculateShipping(totalParcelWeight);
    const grandTotal = Math.max(0, subtotalAfterBundle - couponDiscount) + shippingCharge;
    
    if (cartCountSpan) cartCountSpan.textContent = totalCount;
    if (cartSubtotalValue) cartSubtotalValue.textContent = `₹${totalOriginalSubtotal}`;
    
    if (bundleRes.bundleDiscount > 0) {
        if (cartBundleRow) cartBundleRow.style.display = 'flex';
        if (cartBundleDiscountValue) cartBundleDiscountValue.textContent = `-₹${bundleRes.bundleDiscount}`;
        if (cartPostBundleRow) cartPostBundleRow.style.display = 'flex';
        if (cartPostBundleValue) cartPostBundleValue.textContent = `₹${subtotalAfterBundle}`;
    } else {
        if (cartBundleRow) cartBundleRow.style.display = 'none';
        if (cartPostBundleRow) cartPostBundleRow.style.display = 'none';
    }

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
window.applyCartCoupon = applyCartCoupon;
window.removeCartCoupon = removeCartCoupon;

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
