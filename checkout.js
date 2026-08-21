import { db, auth, serverTimestamp } from './firebase.js';
import { collection, doc, getDoc, runTransaction } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getItemWeight, calculateShipping, PACKAGING_WEIGHT_GRAMS, SHIPPING_SERVICE_NAME } from './shipping-config.js';
import { getProductId } from './stock-utils.js';
import { calculateRingBundleDiscount, calculateCouponDiscount, isEligibleRing } from './product-utils.js';

// ==========================================
// ⚠️ IMPORTANT CLOUDINARY CONFIGURATION ⚠️
// ==========================================
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "yoegaasc"; 
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "payment_screenshots";
// ==========================================

let cart = JSON.parse(localStorage.getItem('glamaura_cart')) || [];
let activeCoupon = JSON.parse(localStorage.getItem('glamaura_coupon')) || null;
let ringPricingRule = null;

let originalSubtotal = 0;
let ringBundleDiscount = 0;
let subtotalAfterBundle = 0;
let couponDiscount = 0;
let totalProdWeight = 0;
let totalParcelWeight = 0;
let shippingCharge = 0;
let grandTotal = 0;

async function loadPricingRule() {
    try {
        const snap = await getDoc(doc(db, "pricingRules", "ring150Bundle"));
        if (snap.exists()) {
            ringPricingRule = snap.data();
        }
    } catch (e) {
        console.warn("Could not fetch pricing rules from Firestore:", e);
    }
}

function getItemTitle(item) {
    if (item && item.name && item.name.trim()) {
        return item.name.trim();
    }
    if (item && item.image && typeof window.getProductNameFromImage === 'function') {
        const derived = window.getProductNameFromImage(item.image);
        if (derived) return derived;
    }
    return (item && item.name) || '';
}

function recalculateTotals() {
    const customerState = document.getElementById('customerState') ? document.getElementById('customerState').value.trim() : '';
    const customerCity = document.getElementById('customerCity') ? document.getElementById('customerCity').value.trim() : '';

    originalSubtotal = 0;
    totalProdWeight = 0;

    cart.forEach(item => {
        const weight = getItemWeight(item);
        item.weight = weight;
        originalSubtotal += item.price * item.quantity;
        totalProdWeight += weight * item.quantity;
    });

    const bundleRes = calculateRingBundleDiscount(cart, ringPricingRule);
    ringBundleDiscount = bundleRes.bundleDiscount;
    subtotalAfterBundle = originalSubtotal - ringBundleDiscount;

    activeCoupon = JSON.parse(localStorage.getItem('glamaura_coupon')) || null;
    couponDiscount = 0;

    if (activeCoupon) {
        const evalRes = calculateCouponDiscount(activeCoupon, subtotalAfterBundle);
        if (evalRes.valid) {
            couponDiscount = evalRes.discount;
        } else {
            couponDiscount = 0;
        }
    }

    const packagingWeight = cart.length > 0 ? PACKAGING_WEIGHT_GRAMS : 0;
    totalParcelWeight = totalProdWeight + packagingWeight;
    shippingCharge = calculateShipping(totalParcelWeight, customerState, customerCity);
    grandTotal = Math.max(0, subtotalAfterBundle - couponDiscount) + shippingCharge;

    const checkoutOriginalSubtotal = document.getElementById('checkoutOriginalSubtotal');
    const checkoutBundleRow = document.getElementById('checkoutBundleRow');
    const checkoutBundleDiscount = document.getElementById('checkoutBundleDiscount');
    const checkoutSubtotal = document.getElementById('checkoutSubtotal');
    const checkoutCouponRow = document.getElementById('checkoutCouponRow');
    const checkoutAppliedCode = document.getElementById('checkoutAppliedCode');
    const checkoutCouponDiscount = document.getElementById('checkoutCouponDiscount');
    const checkoutWeight = document.getElementById('checkoutWeight');
    const checkoutShipping = document.getElementById('checkoutShipping');
    const checkoutTotal = document.getElementById('checkoutTotal');
    const paymentAmount = document.getElementById('paymentAmount');

    if (checkoutOriginalSubtotal) checkoutOriginalSubtotal.textContent = `₹${originalSubtotal}`;
    
    if (ringBundleDiscount > 0) {
        if (checkoutBundleRow) checkoutBundleRow.style.display = 'flex';
        if (checkoutBundleDiscount) checkoutBundleDiscount.textContent = `-₹${ringBundleDiscount}`;
    } else {
        if (checkoutBundleRow) checkoutBundleRow.style.display = 'none';
    }

    if (checkoutSubtotal) checkoutSubtotal.textContent = `₹${subtotalAfterBundle}`;

    if (couponDiscount > 0 && activeCoupon) {
        if (checkoutCouponRow) checkoutCouponRow.style.display = 'flex';
        if (checkoutAppliedCode) checkoutAppliedCode.textContent = activeCoupon.code;
        if (checkoutCouponDiscount) checkoutCouponDiscount.textContent = `-₹${couponDiscount}`;
    } else {
        if (checkoutCouponRow) checkoutCouponRow.style.display = 'none';
    }

    if (checkoutWeight) checkoutWeight.textContent = `${totalParcelWeight}g (${totalProdWeight}g items + ${packagingWeight}g pkg)`;
    if (checkoutShipping) checkoutShipping.textContent = `₹${shippingCharge}`;
    if (checkoutTotal) checkoutTotal.textContent = `₹${grandTotal}`;
    if (paymentAmount) paymentAmount.textContent = `₹${grandTotal}`;

    renderCheckoutCouponUI();
}

function renderCheckoutCouponUI() {
    const container = document.getElementById('checkoutCouponContainer');
    const msgDiv = document.getElementById('checkoutCouponMessage');
    if (!container) return;

    activeCoupon = JSON.parse(localStorage.getItem('glamaura_coupon')) || null;

    if (activeCoupon) {
        const evalRes = calculateCouponDiscount(activeCoupon, subtotalAfterBundle);
        if (evalRes.valid) {
            container.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; width:100%; background:#e6f7ff; border:1px solid #91d5ff; padding:0.5rem 0.8rem; border-radius:5px;">
                    <span style="font-weight:bold; color:#1890ff; font-size:0.9rem;">✓ ${activeCoupon.code} Applied (-₹${evalRes.discount})</span>
                    <button type="button" onclick="removeCheckoutCoupon()" style="background:none; border:none; color:#ff4d4f; font-weight:bold; cursor:pointer; font-size:0.9rem;">Remove ✕</button>
                </div>
            `;
            if (msgDiv) msgDiv.style.display = 'none';
        } else {
            container.innerHTML = `
                <input type="text" id="checkoutCouponInput" value="${activeCoupon.code}" placeholder="Enter coupon code" style="flex: 1; padding: 0.5rem 0.8rem; border: 1px solid #ccc; border-radius: 5px; text-transform: uppercase; font-size: 0.9rem;">
                <button id="checkoutApplyCouponBtn" type="button" onclick="applyCheckoutCoupon()" style="padding: 0.5rem 1rem; background: #ff1493; color: white; border: none; border-radius: 5px; font-weight: bold; cursor: pointer; font-size: 0.9rem;">APPLY</button>
            `;
            if (msgDiv) {
                msgDiv.style.display = 'block';
                msgDiv.style.color = '#ff4d4f';
                msgDiv.textContent = `✕ ${evalRes.reason}`;
            }
        }
    } else {
        container.innerHTML = `
            <input type="text" id="checkoutCouponInput" placeholder="Enter coupon code" style="flex: 1; padding: 0.5rem 0.8rem; border: 1px solid #ccc; border-radius: 5px; text-transform: uppercase; font-size: 0.9rem;">
            <button id="checkoutApplyCouponBtn" type="button" onclick="applyCheckoutCoupon()" style="padding: 0.5rem 1rem; background: #ff1493; color: white; border: none; border-radius: 5px; font-weight: bold; cursor: pointer; font-size: 0.9rem;">APPLY</button>
        `;
        if (msgDiv) msgDiv.style.display = 'none';
    }
}

async function applyCheckoutCoupon() {
    const input = document.getElementById('checkoutCouponInput');
    const msgDiv = document.getElementById('checkoutCouponMessage');
    const btn = document.getElementById('checkoutApplyCouponBtn');

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
        const evalRes = calculateCouponDiscount(couponData, subtotalAfterBundle);

        if (!evalRes.valid) {
            msgDiv.style.color = '#ff4d4f';
            msgDiv.textContent = `✕ ${evalRes.reason}`;
            return;
        }

        activeCoupon = couponData;
        localStorage.setItem('glamaura_coupon', JSON.stringify(activeCoupon));
        recalculateTotals();

    } catch (e) {
        console.error("Error applying coupon in checkout:", e);
        msgDiv.style.color = '#ff4d4f';
        msgDiv.textContent = '✕ Error applying coupon: ' + e.message;
    } finally {
        if (btn) btn.disabled = false;
    }
}

function removeCheckoutCoupon() {
    activeCoupon = null;
    localStorage.removeItem('glamaura_coupon');
    recalculateTotals();
}

window.applyCheckoutCoupon = applyCheckoutCoupon;
window.removeCheckoutCoupon = removeCheckoutCoupon;

async function initCheckout() {
    if (cart.length === 0) {
        alert("Your cart is empty! Redirecting to catalogue...");
        window.location.href = 'index.html';
        return;
    }

    await loadPricingRule();

    const checkoutItemsDiv = document.getElementById('checkoutItems');
    if (checkoutItemsDiv) {
        checkoutItemsDiv.innerHTML = '';
        const bundleRes = calculateRingBundleDiscount(cart, ringPricingRule);

        cart.forEach(item => {
            const weight = getItemWeight(item);
            item.weight = weight;
            
            const isEligible = isEligibleRing(item, ringPricingRule);
            const hasBundleDiscount = isEligible && bundleRes.bundleDiscount > 0;
            const appliedPrice = hasBundleDiscount ? bundleRes.appliedTierPrice : item.price;
            const itemTotal = appliedPrice * item.quantity;
            
            const displayName = getItemTitle(item);
            
            checkoutItemsDiv.innerHTML += `
                <div class="order-summary-item">
                    <img src="${item.image}" alt="${displayName}">
                    <div class="order-summary-details">
                        <h4>${displayName}</h4>
                        <p>Qty: ${item.quantity} x ${hasBundleDiscount ? `<span style="text-decoration:line-through;">₹${item.price}</span> ₹${appliedPrice}` : `₹${item.price}`} • ${weight}g</p>
                    </div>
                    <div style="font-weight: bold; color: #ff1493;">₹${itemTotal}</div>
                </div>
            `;
        });
    }

    recalculateTotals();

    const stateInput = document.getElementById('customerState');
    const cityInput = document.getElementById('customerCity');
    if (stateInput) stateInput.addEventListener('input', recalculateTotals);
    if (cityInput) cityInput.addEventListener('input', recalculateTotals);

    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleOrderSubmission);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCheckout);
} else {
    initCheckout();
}

async function handleOrderSubmission(e) {
    e.preventDefault();

    const placeOrderBtn = document.getElementById('placeOrderBtn');
    const uploadStatus = document.getElementById('uploadStatus');
    const fileInput = document.getElementById('paymentScreenshot');
    
    const customer = {
        name: document.getElementById('customerName').value.trim(),
        email: document.getElementById('customerEmail').value.trim(),
        phone: document.getElementById('customerPhone').value.trim(),
        recipientPhone: document.getElementById('recipientPhone').value.trim(),
        house: document.getElementById('customerHouse').value.trim(),
        street: document.getElementById('customerStreet').value.trim(),
        landmark: document.getElementById('customerLandmark').value.trim(),
        city: document.getElementById('customerCity').value.trim(),
        state: document.getElementById('customerState').value.trim(),
        pincode: document.getElementById('customerPincode').value.trim(),
        recipientName: document.getElementById('recipientName').value.trim(),
        instagram: document.getElementById('customerInsta').value.trim(),
        orderNote: document.getElementById('customerNote').value.trim(),
    };

    const file = fileInput ? fileInput.files[0] : null;
    if (!file) {
        alert("Please upload a payment screenshot.");
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        alert("File is too large. Please upload an image smaller than 5MB.");
        return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        alert("Invalid file format. Only JPG, PNG, and WEBP are allowed.");
        return;
    }

    recalculateTotals();

    placeOrderBtn.disabled = true;
    placeOrderBtn.style.display = 'none';
    uploadStatus.style.display = 'block';

    try {
        // STEP 1: Upload to Cloudinary
        uploadStatus.textContent = "Uploading payment screenshot... 🐾";
        const cloudinaryUrl = await uploadToCloudinary(file);
        
        if (!cloudinaryUrl) {
            throw new Error("Failed to get image URL from Cloudinary.");
        }

        // STEP 2: Atomic Firestore Transaction
        uploadStatus.textContent = "Validating inventory & securing your order... ✨";
        
        const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const getSecureRandom = (length) => {
            const arr = new Uint8Array(length);
            crypto.getRandomValues(arr);
            return Array.from(arr).map(b => b.toString(36).padStart(2, '0')).join('').toUpperCase().substring(0, length);
        };
        const randomStr = getSecureRandom(6);
        const orderNumber = `JEW-${dateStr}-${randomStr}`;

        const initialStatus = "Order Received";
        const initialPaymentStatus = "Payment Pending";

        const newOrderRef = doc(collection(db, "orders"));

        await runTransaction(db, async (transaction) => {
            const productReads = [];

            for (const item of cart) {
                const title = getItemTitle(item);
                const pId = getProductId(title, item.image);
                const pRef = doc(db, "products", pId);
                productReads.push({ item, title, pId, pRef });
            }

            // 1. Read latest stock for all items
            const stockSnapshots = [];
            for (const pr of productReads) {
                const snap = await transaction.get(pr.pRef);
                stockSnapshots.push({ ...pr, snap });
            }

            // 2. Validate stock
            for (const ss of stockSnapshots) {
                const currentStock = ss.snap.exists() ? (typeof ss.snap.data().stock === 'number' ? ss.snap.data().stock : 10) : 10;
                if (currentStock < ss.item.quantity) {
                    throw new Error(`Sorry, "${ss.title}" just went out of stock or does not have ${ss.item.quantity} unit(s) available.`);
                }
            }

            // 3. Re-validate coupon in transaction & increment usage count if coupon applied
            let finalCouponCode = null;
            let finalCouponDiscount = 0;

            if (activeCoupon && activeCoupon.code) {
                const couponRef = doc(db, "coupons", activeCoupon.code.toUpperCase());
                const couponSnap = await transaction.get(couponRef);

                if (!couponSnap.exists()) {
                    throw new Error(`Coupon "${activeCoupon.code}" is no longer valid.`);
                }

                const couponData = { id: couponSnap.id, ...couponSnap.data() };
                const evalRes = calculateCouponDiscount(couponData, subtotalAfterBundle);

                if (!evalRes.valid) {
                    throw new Error(`Coupon error: ${evalRes.reason}`);
                }

                finalCouponCode = couponData.code;
                finalCouponDiscount = evalRes.discount;

                // Atomically increment coupon usageCount
                const currentUsageCount = typeof couponData.usageCount === 'number' ? couponData.usageCount : 0;
                transaction.update(couponRef, {
                    usageCount: currentUsageCount + 1,
                    updatedAt: serverTimestamp()
                });
            }

            // 4. Atomically decrement product stock
            for (const ss of stockSnapshots) {
                const currentStock = ss.snap.exists() ? (typeof ss.snap.data().stock === 'number' ? ss.snap.data().stock : 10) : 10;
                const newStock = currentStock - ss.item.quantity;

                if (ss.snap.exists()) {
                    transaction.update(ss.pRef, {
                        stock: newStock,
                        updatedAt: serverTimestamp()
                    });
                } else {
                    transaction.set(ss.pRef, {
                        productId: ss.pId,
                        name: ss.title,
                        price: ss.item.price,
                        stock: newStock,
                        image: ss.item.image,
                        updatedAt: serverTimestamp()
                    });
                }
            }

            const bundleRes = calculateRingBundleDiscount(cart, ringPricingRule);

            // 5. Create Order document with detailed discount metadata
            const orderData = {
                orderNumber: orderNumber,
                customer: customer,
                items: cart.map(item => {
                    const isEligible = isEligibleRing(item, ringPricingRule);
                    const hasBundle = isEligible && bundleRes.bundleDiscount > 0;
                    const appliedPrice = hasBundle ? bundleRes.appliedTierPrice : item.price;
                    return {
                        ...item,
                        name: getItemTitle(item),
                        originalPrice: item.price,
                        appliedPrice: appliedPrice,
                        bundleDiscount: hasBundle ? (item.price - appliedPrice) * item.quantity : 0,
                        weight: getItemWeight(item)
                    };
                }),
                originalSubtotal: originalSubtotal,
                ringBundleDiscount: ringBundleDiscount,
                subtotal: subtotalAfterBundle,
                couponCode: finalCouponCode,
                couponDiscount: finalCouponDiscount,
                shipping: shippingCharge,
                total: Math.max(0, subtotalAfterBundle - finalCouponDiscount) + shippingCharge,
                totalWeight: totalParcelWeight,
                shippingService: SHIPPING_SERVICE_NAME,
                paymentMethod: "UPI",
                paymentScreenshot: cloudinaryUrl,
                orderStatus: initialStatus,
                paymentStatus: initialPaymentStatus,
                statusMessage: "We have received your order.",
                statusHistory: [{
                    status: initialStatus,
                    message: "Your order has been received.",
                    timestamp: new Date()
                }],
                stockDeducted: true,
                stockRestored: false,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            if (auth.currentUser) {
                orderData.userId = auth.currentUser.uid;
            }

            transaction.set(newOrderRef, orderData);
        });

        // STEP 3: Success!
        localStorage.removeItem('glamaura_cart');
        localStorage.removeItem('glamaura_coupon');
        
        document.getElementById('checkoutFlow').style.display = 'none';
        document.getElementById('successMessage').style.display = 'flex';
        document.getElementById('orderNumberDisplay').textContent = orderNumber;

    } catch (error) {
        console.error("Order submission failed:", error);
        alert("Transaction Failed: " + error.message);
        
        placeOrderBtn.disabled = false;
        placeOrderBtn.style.display = 'block';
        uploadStatus.style.display = 'none';
    }
}

async function uploadToCloudinary(file) {
    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(url, {
        method: "POST",
        body: formData
    });

    if (!response.ok) {
        const err = await response.json();
        console.error("Cloudinary Error:", err);
        throw new Error(err.error?.message || "Failed to upload image to Cloudinary.");
    }

    const data = await response.json();
    return data.secure_url;
}

