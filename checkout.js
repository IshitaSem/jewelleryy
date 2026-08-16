import { db, auth, serverTimestamp } from './firebase.js';
import { collection, doc, runTransaction } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getItemWeight, calculateShipping, PACKAGING_WEIGHT_GRAMS, SHIPPING_SERVICE_NAME } from './shipping-config.js';
import { getProductId } from './stock-utils.js';

// ==========================================
// ⚠️ IMPORTANT CLOUDINARY CONFIGURATION ⚠️
// ==========================================
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "yoegaasc"; 
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "payment_screenshots";
// ==========================================

let cart = JSON.parse(localStorage.getItem('glamaura_cart')) || [];
let totalSubtotal = 0;
let totalProdWeight = 0;
let totalParcelWeight = 0;
let shippingCharge = 0;
let grandTotal = 0;

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

    const packagingWeight = cart.length > 0 ? PACKAGING_WEIGHT_GRAMS : 0;
    totalParcelWeight = totalProdWeight + packagingWeight;
    shippingCharge = calculateShipping(totalParcelWeight, customerState, customerCity);
    grandTotal = totalSubtotal + shippingCharge;

    const checkoutSubtotal = document.getElementById('checkoutSubtotal');
    const checkoutWeight = document.getElementById('checkoutWeight');
    const checkoutShipping = document.getElementById('checkoutShipping');
    const checkoutTotal = document.getElementById('checkoutTotal');
    const paymentAmount = document.getElementById('paymentAmount');

    if (checkoutSubtotal) checkoutSubtotal.textContent = `₹${totalSubtotal}`;
    if (checkoutWeight) checkoutWeight.textContent = `${totalParcelWeight}g (${totalProdWeight}g items + ${packagingWeight}g pkg)`;
    if (checkoutShipping) checkoutShipping.textContent = `₹${shippingCharge}`;
    if (checkoutTotal) checkoutTotal.textContent = `₹${grandTotal}`;
    if (paymentAmount) paymentAmount.textContent = `₹${grandTotal}`;
}

document.addEventListener('DOMContentLoaded', () => {
    if (cart.length === 0) {
        alert("Your cart is empty! Redirecting to catalogue...");
        window.location.href = 'index.html';
        return;
    }

    const checkoutItemsDiv = document.getElementById('checkoutItems');
    totalSubtotal = 0;
    totalProdWeight = 0;

    cart.forEach(item => {
        const weight = getItemWeight(item);
        item.weight = weight;
        
        const itemTotal = item.price * item.quantity;
        totalSubtotal += itemTotal;
        totalProdWeight += weight * item.quantity;
        
        const displayName = getItemTitle(item);
        
        if (checkoutItemsDiv) {
            checkoutItemsDiv.innerHTML += `
                <div class="order-summary-item">
                    <img src="${item.image}" alt="${displayName}">
                    <div class="order-summary-details">
                        <h4>${displayName}</h4>
                        <p>Qty: ${item.quantity} x ₹${item.price} • ${weight}g</p>
                    </div>
                    <div style="font-weight: bold; color: #ff1493;">₹${itemTotal}</div>
                </div>
            `;
        }
    });

    recalculateTotals();

    const stateInput = document.getElementById('customerState');
    const cityInput = document.getElementById('customerCity');
    if (stateInput) stateInput.addEventListener('input', recalculateTotals);
    if (cityInput) cityInput.addEventListener('input', recalculateTotals);

    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleOrderSubmission);
    }
});

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

        // STEP 2: Atomic Firestore Transaction (Validate stock + Decrement stock + Create Order)
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

            // 2. Validate sufficient stock for every product
            for (const ss of stockSnapshots) {
                const currentStock = ss.snap.exists() ? (typeof ss.snap.data().stock === 'number' ? ss.snap.data().stock : 10) : 10;
                if (currentStock < ss.item.quantity) {
                    throw new Error(`Sorry, "${ss.title}" just went out of stock or does not have ${ss.item.quantity} unit(s) available.`);
                }
            }

            // 3. Atomically decrement stock
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

            // 4. Create Order document
            const orderData = {
                orderNumber: orderNumber,
                customer: customer,
                items: cart.map(item => ({
                    ...item,
                    name: getItemTitle(item),
                    weight: getItemWeight(item)
                })),
                subtotal: totalSubtotal,
                shipping: shippingCharge,
                total: grandTotal,
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
        
        document.getElementById('checkoutFlow').style.display = 'none';
        document.getElementById('successMessage').style.display = 'block';
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
