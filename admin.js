import { auth, db, serverTimestamp } from './firebase.js';
import { onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { collection, getDocs, doc, updateDoc, setDoc, onSnapshot, runTransaction } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getProductId, renderStockBadge, normalizeCategory, deriveCategory, combineProducts } from './stock-utils.js';

let allOrders = [];
let currentOrder = null;
let allProducts = [];

const googleProvider = new GoogleAuthProvider();
const googleLoginBtn = document.getElementById('googleLoginBtn');
const emailLoginForm = document.getElementById('emailLoginForm');
const loginErrorMsg = document.getElementById('loginErrorMsg');
const adminLoginOverlay = document.getElementById('adminLoginOverlay');

if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', async () => {
        try {
            if (loginErrorMsg) loginErrorMsg.style.display = 'none';
            await signInWithPopup(auth, googleProvider);
        } catch (e) {
            console.error("Google Login failed:", e);
            if (loginErrorMsg) {
                loginErrorMsg.textContent = "Google Sign In failed: " + e.message;
                loginErrorMsg.style.display = 'block';
            }
        }
    });
}

if (emailLoginForm) {
    emailLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmailInput').value.trim();
        const pass = document.getElementById('loginPassInput').value;
        try {
            if (loginErrorMsg) loginErrorMsg.style.display = 'none';
            await signInWithEmailAndPassword(auth, email, pass);
        } catch (e) {
            console.error("Email Login failed:", e);
            if (loginErrorMsg) {
                let msg = e.message;
                if (e.code === 'auth/invalid-credential' || e.code === 'auth/wrong-password' || e.code === 'auth/user-not-found') {
                    msg = "Invalid credentials. If this account was not created with a password, please click 'Sign in with Google' above!";
                }
                loginErrorMsg.textContent = msg;
                loginErrorMsg.style.display = 'block';
            }
        }
    });
}

const ADMIN_EMAIL = 'ishitasemwal84@gmail.com';

// Admin Authentication State Listener
onAuthStateChanged(auth, async (user) => {
    const userEmail = user && user.email ? user.email.toLowerCase().trim() : '';
    if (user && userEmail === ADMIN_EMAIL) {
        if (adminLoginOverlay) adminLoginOverlay.style.display = 'none';
        document.getElementById('adminEmail').textContent = user.email;
        loadOrders();
        initStockManagement();
    } else {
        if (user && userEmail !== ADMIN_EMAIL) {
            if (loginErrorMsg) {
                loginErrorMsg.textContent = `Access denied (${user.email}). Only ${ADMIN_EMAIL} is authorized.`;
                loginErrorMsg.style.display = 'block';
            }
            await signOut(auth);
        }
        if (adminLoginOverlay) adminLoginOverlay.style.display = 'flex';
    }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
    await signOut(auth);
    if (adminLoginOverlay) adminLoginOverlay.style.display = 'flex';
});

// Tab Switcher
const tabOrdersBtn = document.getElementById('tabOrdersBtn');
const tabStockBtn = document.getElementById('tabStockBtn');
const adminOrdersView = document.getElementById('adminOrdersView');
const adminStockView = document.getElementById('adminStockView');

if (tabOrdersBtn && tabStockBtn) {
    tabOrdersBtn.addEventListener('click', () => {
        tabOrdersBtn.style.background = '#ff1493';
        tabOrdersBtn.style.color = 'white';
        tabStockBtn.style.background = '#fff0f5';
        tabStockBtn.style.color = '#ff1493';
        adminOrdersView.style.display = 'grid';
        adminStockView.style.display = 'none';
    });

    tabStockBtn.addEventListener('click', () => {
        tabStockBtn.style.background = '#ff1493';
        tabStockBtn.style.color = 'white';
        tabOrdersBtn.style.background = '#fff0f5';
        tabOrdersBtn.style.color = '#ff1493';
        adminOrdersView.style.display = 'none';
        adminStockView.style.display = 'block';
    });
}

// ==========================================
// 1. ORDERS MANAGEMENT
// ==========================================

async function loadOrders() {
    const listEl = document.getElementById('adminOrderList');
    if (!listEl) return;
    listEl.innerHTML = '<p style="padding:1rem; color:#666;">Loading orders...</p>';
    
    try {
        const querySnapshot = await getDocs(collection(db, "orders"));
        allOrders = [];
        querySnapshot.forEach(doc => {
            allOrders.push({ id: doc.id, ...doc.data() });
        });

        allOrders.sort((a, b) => {
            const timeA = a.createdAt ? (typeof a.createdAt.toMillis === 'function' ? a.createdAt.toMillis() : (a.createdAt.seconds ? a.createdAt.seconds * 1000 : 0)) : 0;
            const timeB = b.createdAt ? (typeof b.createdAt.toMillis === 'function' ? b.createdAt.toMillis() : (b.createdAt.seconds ? b.createdAt.seconds * 1000 : 0)) : 0;
            return timeB - timeA;
        });

        renderSidebar();
    } catch (e) {
        console.error("Error loading orders:", e);
        const currentUserEmail = auth.currentUser ? auth.currentUser.email : 'Not logged in';
        const currentUid = auth.currentUser ? auth.currentUser.uid : 'N/A';
        if (e.code === 'permission-denied' || (e.message && e.message.includes('permissions'))) {
            listEl.innerHTML = `
                <div style="padding:1rem; background:#fff2f0; border:1px solid #ffccc7; border-radius:8px; color:#ff4d4f; font-size:0.85rem; margin:0.5rem;">
                    <strong>Permission Denied</strong><br>
                    Missing permissions to read orders.<br><br>
                    <small>Logged in as: ${currentUserEmail} (UID: ${currentUid})</small><br><br>
                    <em>Action required: Copy and publish the latest <code>firestore.rules</code> in your Firebase Console (Firestore Database -> Rules tab).</em>
                </div>
            `;
        } else {
            listEl.innerHTML = `<p style="color:red; padding:1rem;">Error loading orders: ${e.message || e}</p>`;
        }
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
                ${order.stockRestored ? '<span style="display:inline-block; margin-top:0.3rem; padding:0.2rem 0.5rem; background:#17a2b8; color:white; border-radius:10px;">Stock Restored 🔄</span>' : ''}
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
    
    const c = order.customer || {};
    document.getElementById('admCustName').textContent = c.name || 'N/A';
    document.getElementById('admCustEmail').textContent = c.email || 'N/A';
    document.getElementById('admCustPhone').textContent = c.phone || 'N/A';
    document.getElementById('admCustInsta').textContent = c.instagram || 'N/A';
    
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
    
    const itemsEl = document.getElementById('admItems');
    itemsEl.innerHTML = '';
    let calculatedSubtotal = 0;
    let calculatedWeight = 0;
    if(order.items) {
        order.items.forEach(item => {
            const displayName = (item.image && typeof window.getProductNameFromImage === 'function')
                ? window.getProductNameFromImage(item.image)
                : (item.name || '');
            const itemWeight = (typeof window.getItemWeight === 'function') ? window.getItemWeight(item) : (item.weight || 20);
            calculatedSubtotal += (item.price * item.quantity);
            calculatedWeight += (itemWeight * item.quantity);

            itemsEl.innerHTML += `<div style="padding:0.5rem 0; border-bottom:1px solid #ddd;">
                ${item.quantity}x <strong>${displayName}</strong> (${itemWeight}g) - ₹${item.price * item.quantity}
            </div>`;
        });
    }

    const subtotal = (typeof order.subtotal === 'number') ? order.subtotal : calculatedSubtotal;
    const shipping = (typeof order.shipping === 'number') ? order.shipping : Math.max(0, (order.total || 0) - subtotal);
    const totalWeight = (typeof order.totalWeight === 'number') ? order.totalWeight : (calculatedWeight + 20);
    const shippingService = order.shippingService || "India Post Parcel Retail";

    if (document.getElementById('admSubtotal')) document.getElementById('admSubtotal').textContent = `₹${subtotal}`;
    if (document.getElementById('admShipping')) document.getElementById('admShipping').textContent = `₹${shipping}`;
    if (document.getElementById('admShippingService')) document.getElementById('admShippingService').textContent = shippingService;
    if (document.getElementById('admTotalWeight')) document.getElementById('admTotalWeight').textContent = `${totalWeight}g`;
    if (document.getElementById('admTotal')) document.getElementById('admTotal').textContent = `₹${order.total}`;
    
    const payImg = document.getElementById('admPaymentImg');
    const payLink = document.getElementById('admPaymentLink');
    if (order.paymentScreenshot) {
        payImg.src = order.paymentScreenshot;
        payLink.href = order.paymentScreenshot;
    } else {
        payImg.src = '';
        payLink.href = '#';
    }
    
    document.getElementById('inpPaymentStatus').value = order.paymentStatus || "Payment Pending";
    document.getElementById('inpOrderStatus').value = order.orderStatus || "Order Received";
    document.getElementById('inpMessage').value = order.statusMessage || "";
    document.getElementById('inpCourier').value = order.courier || "";
    document.getElementById('inpTracking').value = order.trackingNumber || "";
}

// Handle Order Update & Idempotent Stock Restoration on Cancellation/Rejection
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
    historyArray.push({
        status: newOrderStatus,
        message: newMessage,
        timestamp: new Date()
    });

    const isCancellationOrRejection = (newOrderStatus === 'Cancelled' || newPaymentStatus === 'Payment Rejected');
    const shouldRestoreStock = isCancellationOrRejection && currentOrder.stockDeducted && !currentOrder.stockRestored;

    try {
        if (shouldRestoreStock) {
            // Run atomic transaction to restore stock idempotently
            await runTransaction(db, async (transaction) => {
                const orderRef = doc(db, "orders", currentOrder.id);
                const orderSnap = await transaction.get(orderRef);
                if (!orderSnap.exists()) throw new Error("Order document missing");

                const orderData = orderSnap.data();
                if (orderData.stockRestored === true) {
                    // Already restored, skip
                    return;
                }

                if (orderData.items && Array.isArray(orderData.items)) {
                    for (const item of orderData.items) {
                        const displayName = (item.image && typeof window.getProductNameFromImage === 'function')
                            ? window.getProductNameFromImage(item.image)
                            : (item.name || '');
                        const pId = getProductId(displayName, item.image);
                        const pRef = doc(db, "products", pId);
                        const pSnap = await transaction.get(pRef);

                        const currentStock = pSnap.exists() ? (typeof pSnap.data().stock === 'number' ? pSnap.data().stock : 10) : 10;
                        const restoredStock = currentStock + (item.quantity || 1);

                        if (pSnap.exists()) {
                            transaction.update(pRef, {
                                stock: restoredStock,
                                updatedAt: serverTimestamp()
                            });
                        } else {
                            transaction.set(pRef, {
                                productId: pId,
                                name: displayName,
                                price: item.price || 0,
                                stock: restoredStock,
                                image: item.image || '',
                                updatedAt: serverTimestamp()
                            });
                        }
                    }
                }

                transaction.update(orderRef, {
                    paymentStatus: newPaymentStatus,
                    orderStatus: newOrderStatus,
                    statusMessage: newMessage,
                    courier: newCourier,
                    trackingNumber: newTracking,
                    statusHistory: historyArray,
                    stockRestored: true,
                    updatedAt: serverTimestamp()
                });
            });

            currentOrder.stockRestored = true;
            alert("Order updated & item quantities successfully restored to product stock! 🔄");
        } else {
            await updateDoc(doc(db, "orders", currentOrder.id), {
                paymentStatus: newPaymentStatus,
                orderStatus: newOrderStatus,
                statusMessage: newMessage,
                courier: newCourier,
                trackingNumber: newTracking,
                statusHistory: historyArray,
                updatedAt: serverTimestamp()
            });
        }

        const msg = document.getElementById('adminSaveMsg');
        msg.style.display = 'block';
        setTimeout(() => msg.style.display = 'none', 3000);
        
        currentOrder.paymentStatus = newPaymentStatus;
        currentOrder.orderStatus = newOrderStatus;
        currentOrder.statusMessage = newMessage;
        currentOrder.courier = newCourier;
        currentOrder.trackingNumber = newTracking;
        currentOrder.statusHistory = historyArray;
        renderSidebar();

    } catch (e) {
        console.error("Error updating order:", e);
        alert("Failed to update order: " + e.message);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Save & Update Customer';
    }
});

// ==========================================
// 2. STOCK MANAGEMENT
// ==========================================

function initStockManagement() {
    const searchInput = document.getElementById('stockSearchInput');
    const categoryFilter = document.getElementById('stockCategoryFilter');

    if (searchInput) searchInput.addEventListener('input', renderStockGrid);
    if (categoryFilter) categoryFilter.addEventListener('change', renderStockGrid);

    // Initial load: render master catalog immediately so page is never stuck on "Loading inventory..."
    allProducts = combineProducts([]);
    renderStockGrid();

    // Real-time listener for products stock collection in Firestore
    try {
        onSnapshot(collection(db, "products"), (snapshot) => {
            console.log("Firestore stock snapshot received. Document count:", snapshot.size);
            const docs = [];
            snapshot.forEach((doc) => {
                docs.push({ id: doc.id, ...doc.data() });
            });
            allProducts = combineProducts(docs);
            renderStockGrid();
        }, (error) => {
            console.error("Firestore onSnapshot error in Stock Management:", error);
            // On error, gracefully render catalog so page never freezes
            allProducts = combineProducts([]);
            renderStockGrid();
            const stockGrid = document.getElementById('stockGrid');
            if (stockGrid) {
                const notice = document.createElement('div');
                notice.style.cssText = 'grid-column: 1/-1; background:#fff2f0; border:1px solid #ffccc7; color:#ff4d4f; padding:0.8rem 1rem; border-radius:8px; margin-bottom:1rem; font-size:0.9rem;';
                notice.textContent = `Notice: Operating in local catalog mode (${error.message}). Stock updates will sync when online.`;
                stockGrid.prepend(notice);
            }
        });
    } catch (err) {
        console.error("Exception initializing stock management snapshot:", err);
        allProducts = combineProducts([]);
        renderStockGrid();
    }
}

function renderStockGrid() {
    const stockGrid = document.getElementById('stockGrid');
    const searchQuery = document.getElementById('stockSearchInput') ? document.getElementById('stockSearchInput').value.trim().toLowerCase() : '';
    const selectedCategory = document.getElementById('stockCategoryFilter') ? document.getElementById('stockCategoryFilter').value : 'ALL';
    const normSelectedCategory = normalizeCategory(selectedCategory);

    if (!stockGrid) return;
    stockGrid.innerHTML = '';

    // Filter products using normalized category matching & multi-field search
    const filtered = allProducts.filter(p => {
        const pCategory = p.category || deriveCategory(p.image, p.name);
        const pNormCategory = normalizeCategory(pCategory);
        const matchesCategory = selectedCategory === 'ALL' || pNormCategory === normSelectedCategory;
        const matchesSearch = !searchQuery ||
            (p.name && p.name.toLowerCase().includes(searchQuery)) ||
            (p.id && p.id.toLowerCase().includes(searchQuery));
        return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
        stockGrid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; padding:2rem; color:#666;">No products found matching filters.</p>';
        return;
    }

    filtered.forEach(product => {
        const stock = typeof product.stock === 'number' ? product.stock : 0;
        const pId = product.id;

        const card = document.createElement('div');
        card.style.background = '#f9f9f9';
        card.style.border = stock === 0 ? '2px solid #ff4d4f' : (stock <= 5 ? '2px solid #ff9c6e' : '1px solid #ddd');
        card.style.borderRadius = '10px';
        card.style.padding = '1.2rem';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.gap = '0.8rem';

        card.innerHTML = `
            <div style="display:flex; gap:1rem; align-items:center;">
                <img src="${product.image}" alt="${product.name}" style="width:70px; height:70px; object-fit:cover; border-radius:8px; border:1px solid #ccc;" onerror="this.src='https://via.placeholder.com/70?text=Jewellery';">
                <div>
                    <h4 style="margin:0; font-size:1.1rem; color:#333;">${product.name}</h4>
                    <p style="margin:0.2rem 0; font-size:0.85rem; color:#666;">ID: <code>${pId}</code></p>
                    <p style="margin:0; font-size:0.9rem; font-weight:bold; color:#ff1493;">₹${product.price} • ${product.category || 'Jewellery'}</p>
                </div>
            </div>
            <div>
                ${renderStockBadge(stock)}
            </div>
            <div style="display:flex; gap:0.5rem; align-items:center; margin-top:0.3rem;">
                <label style="font-weight:bold; font-size:0.9rem;">Stock:</label>
                <input type="number" id="inpStock_${pId}" value="${stock}" min="0" style="width:70px; padding:0.4rem; border:1px solid #ccc; border-radius:5px; font-size:1rem; text-align:center;">
                <button class="btn-stock-save" data-pid="${pId}" style="padding:0.4rem 0.8rem; background:#ff1493; color:white; border:none; border-radius:5px; font-weight:bold; cursor:pointer;">Set Stock</button>
            </div>
            <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
                <button class="btn-stock-quick" data-pid="${pId}" data-add="5" style="padding:0.3rem 0.6rem; background:#e6f7ff; color:#1890ff; border:1px solid #91d5ff; border-radius:4px; font-size:0.8rem; font-weight:bold; cursor:pointer;">+5 Restock</button>
                <button class="btn-stock-quick" data-pid="${pId}" data-add="10" style="padding:0.3rem 0.6rem; background:#f6ffed; color:#52c41a; border:1px solid #b7eb8f; border-radius:4px; font-size:0.8rem; font-weight:bold; cursor:pointer;">+10 Restock</button>
                <button class="btn-stock-quick" data-pid="${pId}" data-set="0" style="padding:0.3rem 0.6rem; background:#fff1f0; color:#f5222d; border:1px solid #ffa39e; border-radius:4px; font-size:0.8rem; font-weight:bold; cursor:pointer;">Set Out of Stock ❌</button>
            </div>
        `;

        stockGrid.appendChild(card);
    });

    // Attach Event Listeners
    document.querySelectorAll('.btn-stock-save').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const pId = e.target.getAttribute('data-pid');
            const inp = document.getElementById(`inpStock_${pId}`);
            const val = parseInt(inp ? inp.value : '0') || 0;
            await updateStock(pId, Math.max(0, val));
        });
    });

    document.querySelectorAll('.btn-stock-quick').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const pId = e.target.getAttribute('data-pid');
            const addVal = e.target.getAttribute('data-add');
            const setVal = e.target.getAttribute('data-set');
            
            const product = allProducts.find(p => p.id === pId);
            const currentStock = product ? (typeof product.stock === 'number' ? product.stock : 0) : 0;

            let newStock = 0;
            if (setVal !== null && setVal !== undefined) {
                newStock = parseInt(setVal);
            } else if (addVal) {
                newStock = currentStock + parseInt(addVal);
            }

            await updateStock(pId, Math.max(0, newStock));
        });
    });
}

async function updateStock(productId, newStock) {
    const product = allProducts.find(p => p.id === productId);
    try {
        if (!auth.currentUser) {
            alert("Error: You are not currently authenticated as Admin. Please log in with ishitasemwal84@gmail.com first.");
            if (adminLoginOverlay) adminLoginOverlay.style.display = 'flex';
            return;
        }
        const pRef = doc(db, "products", productId);
        await setDoc(pRef, {
            productId: productId,
            name: product ? product.name : productId,
            price: product ? product.price : 0,
            category: product ? product.category : deriveCategory(product ? product.image : '', product ? product.name : ''),
            stock: newStock,
            image: product ? product.image : '',
            updatedAt: serverTimestamp()
        }, { merge: true });

        const msg = document.getElementById('adminSaveMsg');
        if (msg) {
            msg.textContent = `Stock for "${product ? product.name : productId}" updated to ${newStock}! ✨`;
            msg.style.display = 'block';
            setTimeout(() => msg.style.display = 'none', 2500);
        }
    } catch (e) {
        console.error("Error updating product stock in Firestore:", e);
        if (e.code === 'permission-denied' || (e.message && e.message.includes('permissions'))) {
            alert("Failed to update stock: Missing or insufficient permissions.\n\nTo fix this:\n1. Verify you are logged into Firebase with email: ishitasemwal84@gmail.com\n2. Publish/Deploy the updated firestore.rules in your Firebase Console (Firestore Database -> Rules).");
        } else {
            alert("Failed to update stock: " + e.message);
        }
    }
}
