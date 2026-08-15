import { auth, db } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { collection, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

let allOrders = [];
let currentOrder = null;

// Ensure admin only
onAuthStateChanged(auth, async (user) => {
    if (!user || user.email !== 'ishitasemwal84@gmail.com') {
        alert("Unauthorized access. Redirecting...");
        window.location.href = 'index.html';
        return;
    }
    document.getElementById('adminEmail').textContent = user.email;
    loadOrders();
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
    await signOut(auth);
    window.location.href = 'index.html';
});

async function loadOrders() {
    const listEl = document.getElementById('adminOrderList');
    listEl.innerHTML = '<p>Loading...</p>';
    
    try {
        const querySnapshot = await getDocs(collection(db, "orders"));
        allOrders = [];
        querySnapshot.forEach(doc => {
            allOrders.push({ id: doc.id, ...doc.data() });
        });

        // Sort by newest first
        allOrders.sort((a, b) => {
            const timeA = a.createdAt ? a.createdAt.toMillis() : 0;
            const timeB = b.createdAt ? b.createdAt.toMillis() : 0;
            return timeB - timeA;
        });

        renderSidebar();
    } catch (e) {
        console.error("Error loading orders:", e);
        listEl.innerHTML = '<p style="color:red;">Error loading orders.</p>';
    }
}

function renderSidebar() {
    const listEl = document.getElementById('adminOrderList');
    listEl.innerHTML = '';
    
    if (allOrders.length === 0) {
        listEl.innerHTML = '<p>No orders found.</p>';
        return;
    }

    allOrders.forEach(order => {
        const dateStr = order.createdAt ? new Date(order.createdAt.toMillis()).toLocaleDateString() : 'Unknown';
        
        const card = document.createElement('div');
        card.className = 'admin-order-card';
        card.innerHTML = `
            <h4>#${order.orderNumber}</h4>
            <div style="font-size:0.85rem; color:#666;">
                ${dateStr} | ₹${order.total}<br>
                <span style="display:inline-block; margin-top:0.3rem; padding:0.2rem 0.5rem; background:#eee; border-radius:10px;">${order.paymentStatus || 'Pending'}</span>
                <span style="display:inline-block; margin-top:0.3rem; padding:0.2rem 0.5rem; background:#ffc107; color:black; border-radius:10px;">${order.orderStatus || 'Received'}</span>
            </div>
        `;
        
        card.addEventListener('click', () => {
            document.querySelectorAll('.admin-order-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            openOrderDetails(order);
        });
        
        listEl.appendChild(card);
    });
}

function openOrderDetails(order) {
    currentOrder = order;
    document.getElementById('adminDetailPanel').style.display = 'block';
    
    document.getElementById('admOrderNo').textContent = `Order #${order.orderNumber}`;
    document.getElementById('admDate').textContent = order.createdAt ? new Date(order.createdAt.toMillis()).toLocaleString() : '';
    
    // Customer
    const c = order.customer || {};
    document.getElementById('admCustName').textContent = c.name || 'N/A';
    document.getElementById('admCustEmail').textContent = c.email || 'N/A';
    document.getElementById('admCustPhone').textContent = c.phone || 'N/A';
    document.getElementById('admCustInsta').textContent = c.instagram || 'N/A';
    
    // Fallback for old orders that just had "address"
    const fullAddress = c.house ? 
        `${c.house}, ${c.street}${c.landmark ? ', ' + c.landmark : ''}\n${c.city}, ${c.state} - ${c.pincode}` 
        : (c.address || 'N/A');
    document.getElementById('admCustAddress').innerText = fullAddress;
    
    document.getElementById('admRecipientName').textContent = c.recipientName || 'Self';
    document.getElementById('admRecipientPhone').textContent = c.recipientPhone || 'N/A';
    
    const orderNoteEl = document.getElementById('admOrderNote');
    if (c.orderNote) {
        orderNoteEl.textContent = c.orderNote;
        orderNoteEl.style.display = 'inline-block';
    } else {
        orderNoteEl.style.display = 'none';
    }
    
    // Items
    const itemsEl = document.getElementById('admItems');
    itemsEl.innerHTML = '';
    if(order.items) {
        order.items.forEach(item => {
            const displayName = (item.image && typeof window.getProductNameFromImage === 'function')
                ? window.getProductNameFromImage(item.image)
                : (item.name || '');
            itemsEl.innerHTML += `<div style="padding:0.5rem 0; border-bottom:1px solid #ddd;">
                ${item.quantity}x <strong>${displayName}</strong> - ₹${item.price * item.quantity}
            </div>`;
        });
    }
    document.getElementById('admTotal').textContent = `₹${order.total}`;
    
    // Payment screenshot
    const payImg = document.getElementById('admPaymentImg');
    const payLink = document.getElementById('admPaymentLink');
    if (order.paymentScreenshot) {
        payImg.src = order.paymentScreenshot;
        payLink.href = order.paymentScreenshot;
    } else {
        payImg.src = '';
        payLink.href = '#';
    }
    
    // Form Inputs
    document.getElementById('inpPaymentStatus').value = order.paymentStatus || "Payment Pending";
    document.getElementById('inpOrderStatus').value = order.orderStatus || "Order Received";
    document.getElementById('inpMessage').value = order.statusMessage || "";
    document.getElementById('inpCourier').value = order.courier || "";
    document.getElementById('inpTracking').value = order.trackingNumber || "";
}

// Handle Save
document.getElementById('btnSaveUpdate').addEventListener('click', async () => {
    if (!currentOrder) return;
    const btn = document.getElementById('btnSaveUpdate');
    
    btn.disabled = true;
    btn.textContent = 'Saving...';
    
    const newPaymentStatus = document.getElementById('inpPaymentStatus').value;
    const newOrderStatus = document.getElementById('inpOrderStatus').value;
    const newMessage = document.getElementById('inpMessage').value;
    const newCourier = document.getElementById('inpCourier').value;
    const newTracking = document.getElementById('inpTracking').value;

    const historyArray = currentOrder.statusHistory || [];
    
    // Only push to history if orderStatus or statusMessage changed, or if it's a new update
    historyArray.push({
        status: newOrderStatus,
        message: newMessage,
        timestamp: new Date() // Firestore translates this correctly inside updateDoc or we can leave it as JS Date which works via Client SDK
    });

    try {
        await updateDoc(doc(db, "orders", currentOrder.id), {
            paymentStatus: newPaymentStatus,
            orderStatus: newOrderStatus,
            statusMessage: newMessage,
            courier: newCourier,
            trackingNumber: newTracking,
            statusHistory: historyArray,
            updatedAt: new Date()
        });
        
        // Show success msg
        const msg = document.getElementById('adminSaveMsg');
        msg.style.display = 'block';
        setTimeout(() => msg.style.display = 'none', 3000);
        
        // Refresh local memory to reflect immediately without full reload
        currentOrder.paymentStatus = newPaymentStatus;
        currentOrder.orderStatus = newOrderStatus;
        currentOrder.statusMessage = newMessage;
        currentOrder.courier = newCourier;
        currentOrder.trackingNumber = newTracking;
        currentOrder.statusHistory = historyArray;
        renderSidebar(); // re-render sidebar tags
        
    } catch (e) {
        console.error("Error updating order:", e);
        alert("Failed to update order.");
    } finally {
        btn.disabled = false;
        btn.textContent = 'Save & Update Customer';
    }
});
