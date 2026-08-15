import { db, auth, serverTimestamp } from './firebase.js';
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// ==========================================
// ⚠️ IMPORTANT CLOUDINARY CONFIGURATION ⚠️
// ==========================================
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "yoegaasc"; 
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "payment_screenshots"; // Must be an Unsigned preset!
// ==========================================

let cart = JSON.parse(localStorage.getItem('glamaura_cart')) || [];
let totalValue = 0;

function getItemTitle(item) {
    if (item.image && typeof window.getProductNameFromImage === 'function') {
        const derived = window.getProductNameFromImage(item.image);
        if (derived) return derived;
    }
    return item.name || '';
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. Validate Cart
    if (cart.length === 0) {
        alert("Your cart is empty! Redirecting to catalogue...");
        window.location.href = 'index.html';
        return;
    }

    // 2. Render Order Summary
    const checkoutItemsDiv = document.getElementById('checkoutItems');
    const checkoutSubtotal = document.getElementById('checkoutSubtotal');
    const checkoutTotal = document.getElementById('checkoutTotal');
    const paymentAmount = document.getElementById('paymentAmount');

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        totalValue += itemTotal;
        const displayName = getItemTitle(item);
        
        checkoutItemsDiv.innerHTML += `
            <div class="order-summary-item">
                <img src="${item.image}" alt="${displayName}">
                <div class="order-summary-details">
                    <h4>${displayName}</h4>
                    <p>Qty: ${item.quantity} x ₹${item.price}</p>
                </div>
                <div style="font-weight: bold; color: #ff1493;">₹${itemTotal}</div>
            </div>
        `;
    });

    checkoutSubtotal.textContent = `₹${totalValue}`;
    checkoutTotal.textContent = `₹${totalValue}`;
    paymentAmount.textContent = `₹${totalValue}`;

    // 3. Handle Form Submission
    const checkoutForm = document.getElementById('checkoutForm');
    checkoutForm.addEventListener('submit', handleOrderSubmission);
});

async function handleOrderSubmission(e) {
    e.preventDefault();

    const placeOrderBtn = document.getElementById('placeOrderBtn');
    const uploadStatus = document.getElementById('uploadStatus');
    const fileInput = document.getElementById('paymentScreenshot');
    
    // Get form data
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

    // Validate file
    const file = fileInput.files[0];
    if (!file) {
        alert("Please upload a payment screenshot.");
        return;
    }
    
    // File size validation (Max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert("File is too large. Please upload an image smaller than 5MB.");
        return;
    }

    // Valid formats
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        alert("Invalid file format. Only JPG, PNG, and WEBP are allowed.");
        return;
    }

    // Prevent double submission
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

        // STEP 2: Create Order in Firestore
        uploadStatus.textContent = "Securing your order... ✨";
        
        // Generate a human-readable order number
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

        const orderData = {
            orderNumber: orderNumber,
            customer: customer,
            items: cart.map(item => ({
                ...item,
                name: getItemTitle(item)
            })),
            subtotal: totalValue,
            total: totalValue,
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
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        // Attach user ID if logged in
        if (auth.currentUser) {
            orderData.userId = auth.currentUser.uid;
        }

        const docRef = await addDoc(collection(db, "orders"), orderData);

        // STEP 3: Success!
        // Clear the cart
        localStorage.removeItem('glamaura_cart');
        
        // Update UI
        document.getElementById('checkoutFlow').style.display = 'none';
        document.getElementById('successMessage').style.display = 'block';
        document.getElementById('orderNumberDisplay').textContent = orderNumber;

    } catch (error) {
        console.error("Order submission failed:", error);
        alert("Something went wrong while submitting your order. Your cart is saved. Please try again or contact us on Instagram.\n\nError: " + error.message);
        
        // Restore button state (DO NOT clear cart)
        placeOrderBtn.disabled = false;
        placeOrderBtn.style.display = 'block';
        uploadStatus.style.display = 'none';
    }
}

async function uploadToCloudinary(file) {
    // Cloudinary Unsigned Upload API
    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    
    // Add an explicit folder if configured in the preset, otherwise it uses preset default
    // formData.append("folder", "payments");

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
