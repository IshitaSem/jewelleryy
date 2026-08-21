import { auth, db, serverTimestamp } from './firebase.js';
import { onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { collection, getDocs, doc, updateDoc, setDoc, deleteDoc, getDoc, onSnapshot, runTransaction } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getProductId, renderStockBadge, normalizeCategory, deriveCategory, combineProducts } from './stock-utils.js';

let allOrders = [];
let currentOrder = null;
let allProducts = [];
let allCoupons = [];

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
        initCouponManagement();
        initOffersManagement();
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
const tabAnalyticsBtn = document.getElementById('tabAnalyticsBtn');
const tabStockBtn = document.getElementById('tabStockBtn');
const tabCouponsBtn = document.getElementById('tabCouponsBtn');
const tabOffersBtn = document.getElementById('tabOffersBtn');

const adminOrdersView = document.getElementById('adminOrdersView');
const adminAnalyticsView = document.getElementById('adminAnalyticsView');
const adminStockView = document.getElementById('adminStockView');
const adminCouponsView = document.getElementById('adminCouponsView');
const adminOffersView = document.getElementById('adminOffersView');

function setActiveTab(activeBtn, activeView) {
    const tabs = [
        { btn: tabOrdersBtn, view: adminOrdersView },
        { btn: tabAnalyticsBtn, view: adminAnalyticsView },
        { btn: tabStockBtn, view: adminStockView },
        { btn: tabCouponsBtn, view: adminCouponsView },
        { btn: tabOffersBtn, view: adminOffersView }
    ];

    tabs.forEach(t => {
        if (t.btn && t.view) {
            if (t.btn === activeBtn) {
                t.btn.style.background = '#ff1493';
                t.btn.style.color = 'white';
                t.view.style.display = (t.view === adminOrdersView) ? 'grid' : 'block';
            } else {
                t.btn.style.background = '#fff0f5';
                t.btn.style.color = '#ff1493';
                t.view.style.display = 'none';
            }
        }
    });
}

if (tabOrdersBtn) tabOrdersBtn.addEventListener('click', () => setActiveTab(tabOrdersBtn, adminOrdersView));
if (tabAnalyticsBtn) tabAnalyticsBtn.addEventListener('click', () => {
    setActiveTab(tabAnalyticsBtn, adminAnalyticsView);
    renderAnalytics();
});
if (tabStockBtn) tabStockBtn.addEventListener('click', () => setActiveTab(tabStockBtn, adminStockView));
if (tabCouponsBtn) tabCouponsBtn.addEventListener('click', () => setActiveTab(tabCouponsBtn, adminCouponsView));
if (tabOffersBtn) tabOffersBtn.addEventListener('click', () => setActiveTab(tabOffersBtn, adminOffersView));

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
        renderAnalytics();
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
    let calculatedOriginalSubtotal = 0;
    let calculatedWeight = 0;
    if(order.items) {
        order.items.forEach(item => {
            const displayName = (item.image && typeof window.getProductNameFromImage === 'function')
                ? window.getProductNameFromImage(item.image)
                : (item.name || '');
            const itemWeight = (typeof window.getItemWeight === 'function') ? window.getItemWeight(item) : (item.weight || 20);
            const origPrice = item.originalPrice || item.price;
            calculatedOriginalSubtotal += (origPrice * item.quantity);
            calculatedWeight += (itemWeight * item.quantity);

            const hasBundle = typeof item.appliedPrice === 'number' && item.appliedPrice < origPrice;

            itemsEl.innerHTML += `<div style="padding:0.5rem 0; border-bottom:1px solid #ddd;">
                ${item.quantity}x <strong>${displayName}</strong> (${itemWeight}g) - 
                ${hasBundle ? `<span style="text-decoration:line-through; color:#aaa;">₹${origPrice * item.quantity}</span> <strong style="color:#28a745;">₹${item.appliedPrice * item.quantity}</strong>` : `₹${origPrice * item.quantity}`}
            </div>`;
        });
    }

    const origSubtotal = (typeof order.originalSubtotal === 'number') ? order.originalSubtotal : calculatedOriginalSubtotal;
    const ringBundleDiscount = (typeof order.ringBundleDiscount === 'number') ? order.ringBundleDiscount : 0;
    const subtotal = (typeof order.subtotal === 'number') ? order.subtotal : (origSubtotal - ringBundleDiscount);
    const couponDiscount = (typeof order.couponDiscount === 'number') ? order.couponDiscount : 0;
    const couponCode = order.couponCode || null;
    const shipping = (typeof order.shipping === 'number') ? order.shipping : Math.max(0, (order.total || 0) - subtotal + couponDiscount);
    const totalWeight = (typeof order.totalWeight === 'number') ? order.totalWeight : (calculatedWeight + 20);
    const shippingService = order.shippingService || "India Post Parcel Retail";

    if (document.getElementById('admOriginalSubtotal')) document.getElementById('admOriginalSubtotal').textContent = `₹${origSubtotal}`;
    
    const ringBundleRow = document.getElementById('admRingBundleRow');
    const ringBundleDiscSpan = document.getElementById('admRingBundleDiscount');
    if (ringBundleDiscount > 0) {
        if (ringBundleRow) ringBundleRow.style.display = 'block';
        if (ringBundleDiscSpan) ringBundleDiscSpan.textContent = `-₹${ringBundleDiscount}`;
    } else {
        if (ringBundleRow) ringBundleRow.style.display = 'none';
    }

    if (document.getElementById('admSubtotal')) document.getElementById('admSubtotal').textContent = `₹${subtotal}`;
    
    const couponRow = document.getElementById('admCouponRow');
    const couponCodeSpan = document.getElementById('admCouponCode');
    const couponDiscSpan = document.getElementById('admCouponDiscount');
    if (couponDiscount > 0 && couponCode) {
        if (couponRow) couponRow.style.display = 'block';
        if (couponCodeSpan) couponCodeSpan.textContent = couponCode;
        if (couponDiscSpan) couponDiscSpan.textContent = `-₹${couponDiscount}`;
    } else {
        if (couponRow) couponRow.style.display = 'none';
    }

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
        renderAnalytics();

    } catch (e) {
        console.error("Error updating order:", e);
        alert("Failed to update order: " + e.message);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Save & Update Customer';
    }
});

// Permanent Order Deletion Handler
const btnDeleteOrder = document.getElementById('btnDeleteOrder');
if (btnDeleteOrder) {
    btnDeleteOrder.addEventListener('click', async () => {
        if (!currentOrder) {
            alert("No order selected to delete.");
            return;
        }

        const confirmText = `Are you sure you want to PERMANENTLY delete Order #${currentOrder.orderNumber}?\n\nCustomer: ${currentOrder.customer ? currentOrder.customer.name : 'N/A'}\nTotal: ₹${currentOrder.total}\n\nThis action cannot be undone!`;
        if (!confirm(confirmText)) return;

        btnDeleteOrder.disabled = true;
        btnDeleteOrder.textContent = 'Deleting...';

        try {
            await deleteDoc(doc(db, "orders", currentOrder.id));

            const deletedNo = currentOrder.orderNumber;
            allOrders = allOrders.filter(o => o.id !== currentOrder.id);

            const msg = document.getElementById('adminSaveMsg');
            if (msg) {
                msg.textContent = `Order #${deletedNo} Deleted! 🗑️`;
                msg.style.display = 'block';
                setTimeout(() => {
                    msg.style.display = 'none';
                    msg.textContent = 'Update Saved!';
                }, 3000);
            }

            renderSidebar();
            renderAnalytics();

            if (allOrders.length > 0) {
                openOrderDetails(allOrders[0]);
            } else {
                document.getElementById('adminDetailPanel').style.display = 'none';
                currentOrder = null;
            }
        } catch (e) {
            console.error("Error deleting order:", e);
            alert("Failed to delete order: " + (e.message || e));
        } finally {
            if (btnDeleteOrder) {
                btnDeleteOrder.disabled = false;
                btnDeleteOrder.innerHTML = '🗑️ Delete Order Permanently';
            }
        }
    });
}

// ==========================================
// 1.5 SALES & ITEMS SOLD ANALYTICS
// ==========================================

function initAnalyticsListeners() {
    const searchInput = document.getElementById('analyticsSearchInput');
    const categoryFilter = document.getElementById('analyticsCategoryFilter');
    const sortBy = document.getElementById('analyticsSortBy');
    const refreshBtn = document.getElementById('btnRefreshAnalytics');

    if (searchInput) searchInput.addEventListener('input', () => renderAnalyticsGrid());
    if (categoryFilter) categoryFilter.addEventListener('change', () => renderAnalyticsGrid());
    if (sortBy) sortBy.addEventListener('change', () => renderAnalyticsGrid());
    if (refreshBtn) refreshBtn.addEventListener('click', () => loadOrders());
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnalyticsListeners);
} else {
    initAnalyticsListeners();
}

function renderAnalytics() {
    if (!allOrders) return;

    let totalRev = 0;
    let totalItemsCount = 0;
    let verifiedCount = 0;

    const salesMap = {};

    allOrders.forEach(order => {
        const isCancelled = (order.orderStatus === 'Cancelled' || order.paymentStatus === 'Payment Rejected');

        if (!isCancelled) {
            totalRev += (order.total || 0);
            if (order.paymentStatus === 'Payment Verified' || order.orderStatus === 'Delivered' || order.orderStatus === 'Shipped') {
                verifiedCount++;
            }
        }

        if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
                if (isCancelled) return;

                const qty = item.quantity || 1;
                totalItemsCount += qty;

                const displayName = (item.image && typeof window.getProductNameFromImage === 'function')
                    ? window.getProductNameFromImage(item.image)
                    : (item.name || '');
                const pId = getProductId(displayName, item.image);
                const itemPrice = item.appliedPrice || item.price || 0;

                if (!salesMap[pId]) {
                    salesMap[pId] = {
                        pId: pId,
                        name: displayName,
                        image: item.image || '',
                        category: deriveCategory(item.image, displayName),
                        sold: 0,
                        revenue: 0
                    };
                }
                salesMap[pId].sold += qty;
                salesMap[pId].revenue += (itemPrice * qty);
            });
        }
    });

    const totalOrdersCount = allOrders.length;
    const avgOrderValue = totalOrdersCount > 0 ? Math.round(totalRev / totalOrdersCount) : 0;

    if (document.getElementById('statTotalRevenue')) document.getElementById('statTotalRevenue').textContent = `₹${totalRev.toLocaleString('en-IN')}`;
    if (document.getElementById('statRevenueSub')) document.getElementById('statRevenueSub').textContent = `${verifiedCount} verified / ${totalOrdersCount} total orders`;
    if (document.getElementById('statItemsSold')) document.getElementById('statItemsSold').textContent = totalItemsCount.toString();
    if (document.getElementById('statTotalOrders')) document.getElementById('statTotalOrders').textContent = totalOrdersCount.toString();
    if (document.getElementById('statOrdersSub')) document.getElementById('statOrdersSub').textContent = `${verifiedCount} verified / completed`;
    if (document.getElementById('statAvgOrderValue')) document.getElementById('statAvgOrderValue').textContent = `₹${avgOrderValue.toLocaleString('en-IN')}`;

    if (document.getElementById('quickTotalRev')) document.getElementById('quickTotalRev').textContent = `₹${totalRev.toLocaleString('en-IN')}`;
    if (document.getElementById('quickItemsSold')) document.getElementById('quickItemsSold').textContent = totalItemsCount.toString();
    if (document.getElementById('quickStatsBadge')) document.getElementById('quickStatsBadge').textContent = `${totalOrdersCount} orders`;

    const catalog = combineProducts(allProducts);
    const fullAnalyticsList = catalog.map(prod => {
        const pId = prod.id || prod.productId || getProductId(prod.name, prod.image);
        const s = salesMap[pId] || { sold: 0, revenue: 0 };
        return {
            ...prod,
            pId: pId,
            unitsSold: s.sold,
            totalRevenue: s.revenue
        };
    });

    window.lastAnalyticsList = fullAnalyticsList;

    renderTopSellers(fullAnalyticsList);
    renderAnalyticsGrid(fullAnalyticsList);
}

function renderTopSellers(list) {
    const container = document.getElementById('analyticsTopSellers');
    if (!container) return;

    const sorted = [...list].sort((a, b) => b.unitsSold - a.unitsSold);
    const top5 = sorted.filter(item => item.unitsSold > 0).slice(0, 5);

    if (top5.length === 0) {
        container.innerHTML = '<p style="color:#666; font-style:italic;">No items sold yet. Placed orders will reflect here automatically!</p>';
        return;
    }

    const rankBadges = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

    container.innerHTML = top5.map((item, idx) => `
        <div style="background:#fff; border:2px solid #ffb6c1; border-radius:12px; padding:1rem; display:flex; gap:0.75rem; align-items:center; box-shadow:0 2px 8px rgba(255,20,147,0.08);">
            <div style="font-size:1.6rem; min-width:32px; text-align:center;">${rankBadges[idx] || (idx + 1)}</div>
            <img src="${item.image}" alt="${item.name}" style="width:50px; height:50px; object-fit:cover; border-radius:8px; border:1px solid #eee;">
            <div style="flex:1; overflow:hidden;">
                <div style="font-weight:bold; font-size:0.9rem; color:#333; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.name}</div>
                <div style="font-size:0.8rem; color:#ff1493; font-weight:bold;">📦 ${item.unitsSold} sold</div>
                <div style="font-size:0.75rem; color:#28a745; font-weight:bold;">💰 ₹${item.totalRevenue.toLocaleString('en-IN')}</div>
            </div>
        </div>
    `).join('');
}

function renderAnalyticsGrid(listOverride) {
    const container = document.getElementById('analyticsGrid');
    if (!container) return;

    const list = listOverride || window.lastAnalyticsList || combineProducts(allProducts);
    const searchVal = (document.getElementById('analyticsSearchInput')?.value || '').toLowerCase().trim();
    const catVal = document.getElementById('analyticsCategoryFilter')?.value || 'ALL';
    const sortBy = document.getElementById('analyticsSortBy')?.value || 'sold-desc';

    let filtered = list.filter(item => {
        const matchesSearch = !searchVal || (item.name && item.name.toLowerCase().includes(searchVal)) || (item.category && item.category.toLowerCase().includes(searchVal));
        const itemCatNorm = normalizeCategory(item.category || deriveCategory(item.image, item.name));
        const filterCatNorm = normalizeCategory(catVal);
        const matchesCat = (catVal === 'ALL') || (itemCatNorm === filterCatNorm);
        return matchesSearch && matchesCat;
    });

    if (sortBy === 'sold-desc') {
        filtered.sort((a, b) => b.unitsSold - a.unitsSold);
    } else if (sortBy === 'revenue-desc') {
        filtered.sort((a, b) => b.totalRevenue - a.totalRevenue);
    } else if (sortBy === 'name-asc') {
        filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortBy === 'stock-asc') {
        filtered.sort((a, b) => (a.stock ?? 10) - (b.stock ?? 10));
    }

    if (filtered.length === 0) {
        container.innerHTML = '<p style="color:#666; padding:1rem;">No items found matching filter criteria.</p>';
        return;
    }

    container.innerHTML = filtered.map(item => {
        const stock = (item.stock !== undefined) ? item.stock : 10;
        const stockBadgeHtml = renderStockBadge(stock);
        return `
            <div style="background:#fff; border:1px solid #ffd1dc; border-radius:12px; padding:1rem; display:flex; flex-direction:column; gap:0.6rem; box-shadow:0 2px 6px rgba(0,0,0,0.04);">
                <div style="display:flex; gap:0.75rem; align-items:center;">
                    <img src="${item.image}" alt="${item.name}" style="width:60px; height:60px; object-fit:cover; border-radius:8px; border:1px solid #eee;">
                    <div>
                        <div style="font-weight:bold; font-size:0.95rem; color:#333;">${item.name}</div>
                        <div style="font-size:0.78rem; color:#888;">${item.category || deriveCategory(item.image, item.name)} · ₹${item.price}</div>
                    </div>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; background:#fafafa; padding:0.5rem 0.75rem; border-radius:8px; font-size:0.85rem;">
                    <div>
                        <span style="color:#ff1493; font-weight:bold;">📦 ${item.unitsSold || 0} sold</span>
                    </div>
                    <div>
                        <span style="color:#28a745; font-weight:bold;">💰 ₹${(item.totalRevenue || 0).toLocaleString('en-IN')}</span>
                    </div>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.8rem;">
                    <span>Stock:</span>
                    <div>${stockBadgeHtml}</div>
                </div>
            </div>
        `;
    }).join('');
}

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

// ==========================================
// 3. COUPONS MANAGEMENT
// ==========================================

function initCouponManagement() {
    const btnCreate = document.getElementById('btnCreateCoupon');
    const formContainer = document.getElementById('couponFormContainer');
    const formTitle = document.getElementById('couponFormTitle');
    const form = document.getElementById('couponForm');
    const btnCancel = document.getElementById('btnCancelCoupon');
    const discountTypeSelect = document.getElementById('inpDiscountType');
    const maxDiscountGroup = document.getElementById('maxDiscountGroup');

    if (btnCreate) {
        btnCreate.addEventListener('click', () => {
            resetCouponForm();
            formTitle.textContent = "Create New Coupon";
            formContainer.style.display = 'block';
        });
    }

    if (btnCancel) {
        btnCancel.addEventListener('click', () => {
            formContainer.style.display = 'none';
            resetCouponForm();
        });
    }

    if (discountTypeSelect) {
        discountTypeSelect.addEventListener('change', () => {
            if (discountTypeSelect.value === 'percentage') {
                maxDiscountGroup.style.display = 'block';
            } else {
                maxDiscountGroup.style.display = 'none';
            }
        });
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btnSave = document.getElementById('btnSaveCoupon');
            btnSave.disabled = true;
            btnSave.textContent = 'Saving...';

            const originalCode = document.getElementById('couponOriginalCode').value;
            const code = document.getElementById('inpCouponCode').value.trim().toUpperCase();
            const discountType = document.getElementById('inpDiscountType').value;
            const discountValue = Number(document.getElementById('inpDiscountValue').value) || 0;
            const minimumOrder = Number(document.getElementById('inpMinOrder').value) || 0;
            const maximumDiscount = Number(document.getElementById('inpMaxDiscount').value) || 0;
            const startDate = document.getElementById('inpStartDate').value || null;
            const expiryDate = document.getElementById('inpExpiryDate').value || null;
            const usageLimitVal = document.getElementById('inpUsageLimit').value;
            const usageLimit = usageLimitVal ? (Number(usageLimitVal) || 0) : null;
            const perCustomerLimit = Number(document.getElementById('inpPerCustomerLimit').value) || 1;
            const active = document.getElementById('inpCouponActive').checked;

            try {
                const couponRef = doc(db, "coupons", code);
                const existingSnap = await getDoc(couponRef);
                const isNew = !existingSnap.exists();

                const payload = {
                    code,
                    discountType,
                    discountValue,
                    minimumOrder,
                    maximumDiscount: discountType === 'percentage' ? maximumDiscount : 0,
                    startDate,
                    expiryDate,
                    usageLimit,
                    perCustomerLimit,
                    active,
                    updatedAt: serverTimestamp(),
                    ...(isNew ? { usageCount: 0, createdAt: serverTimestamp() } : {})
                };

                await setDoc(couponRef, payload, { merge: true });

                const msg = document.getElementById('adminSaveMsg');
                if (msg) {
                    msg.textContent = `Coupon ${code} saved successfully! 🎟️`;
                    msg.style.display = 'block';
                    setTimeout(() => msg.style.display = 'none', 2500);
                }

                formContainer.style.display = 'none';
                resetCouponForm();
            } catch (err) {
                console.error("Error saving coupon:", err);
                if (err.code === 'permission-denied' || (err.message && err.message.includes('permissions'))) {
                    alert("Failed to save coupon: Missing or insufficient permissions.\n\nTo fix this error:\n1. Open your Firebase Console (https://console.firebase.google.com)\n2. Go to Firestore Database -> Rules tab\n3. Copy the updated contents of 'firestore.rules' from your project and click Publish.");
                } else {
                    alert("Failed to save coupon: " + err.message);
                }
            } finally {
                btnSave.disabled = false;
                btnSave.textContent = 'Save Coupon';
            }
        });
    }

    // Real-time listener for coupons
    try {
        onSnapshot(collection(db, "coupons"), (snapshot) => {
            allCoupons = [];
            snapshot.forEach(doc => {
                allCoupons.push({ id: doc.id, ...doc.data() });
            });
            renderCouponsGrid();
        }, (err) => {
            console.error("Coupons snapshot error:", err);
            const grid = document.getElementById('couponsListGrid');
            if (grid) grid.innerHTML = `<p style="color:red;">Error loading coupons: ${err.message}</p>`;
        });
    } catch (err) {
        console.error("Failed to initialize coupons listener:", err);
    }
}

function resetCouponForm() {
    document.getElementById('couponOriginalCode').value = '';
    document.getElementById('inpCouponCode').value = '';
    document.getElementById('inpCouponCode').readOnly = false;
    document.getElementById('inpDiscountType').value = 'percentage';
    document.getElementById('inpDiscountValue').value = '';
    document.getElementById('inpMinOrder').value = '0';
    document.getElementById('inpMaxDiscount').value = '';
    document.getElementById('inpStartDate').value = '';
    document.getElementById('inpExpiryDate').value = '';
    document.getElementById('inpUsageLimit').value = '';
    document.getElementById('inpPerCustomerLimit').value = '1';
    document.getElementById('inpCouponActive').checked = true;
    document.getElementById('maxDiscountGroup').style.display = 'block';
}

function renderCouponsGrid() {
    const grid = document.getElementById('couponsListGrid');
    if (!grid) return;
    grid.innerHTML = '';

    if (allCoupons.length === 0) {
        grid.innerHTML = '<p style="grid-column:1/-1; text-align:center; color:#666; padding:2rem;">No coupons found. Click "+ Create New Coupon" above to create one!</p>';
        return;
    }

    allCoupons.forEach(coupon => {
        const card = document.createElement('div');
        card.style.background = '#f9f9f9';
        card.style.border = coupon.active ? '2px solid #ffb6c1' : '1px solid #ddd';
        card.style.borderRadius = '10px';
        card.style.padding = '1.2rem';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.gap = '0.6rem';
        card.style.opacity = coupon.active ? '1' : '0.7';

        const discountText = coupon.discountType === 'percentage'
            ? `${coupon.discountValue}% OFF${coupon.maximumDiscount ? ` (Max ₹${coupon.maximumDiscount})` : ''}`
            : `₹${coupon.discountValue} OFF`;

        const usageStr = (typeof coupon.usageLimit === 'number' && coupon.usageLimit > 0)
            ? `${coupon.usageCount || 0} / ${coupon.usageLimit}`
            : `${coupon.usageCount || 0} (Unlimited)`;

        const startStr = coupon.startDate ? new Date(coupon.startDate).toLocaleString() : 'Immediate';
        const expiryStr = coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleString() : 'No expiry';

        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h3 style="margin:0; font-size:1.3rem; color:#ff1493; letter-spacing:1px;">${coupon.code}</h3>
                <span style="padding:0.2rem 0.6rem; border-radius:12px; font-weight:bold; font-size:0.8rem; background:${coupon.active ? '#e6f7ff; color:#1890ff;' : '#fff1f0; color:#f5222d;'}">
                    ${coupon.active ? 'ACTIVE' : 'INACTIVE'}
                </span>
            </div>
            <div style="font-size:1rem; font-weight:bold; color:#333;">${discountText}</div>
            <div style="font-size:0.85rem; color:#666; line-height:1.5;">
                <p style="margin:0;">Minimum Order: <strong>₹${coupon.minimumOrder || 0}</strong></p>
                <p style="margin:0;">Usage Count: <strong>${usageStr}</strong></p>
                <p style="margin:0;">Per Customer Limit: <strong>${coupon.perCustomerLimit || 1}</strong></p>
                <p style="margin:0;">Starts: <small>${startStr}</small></p>
                <p style="margin:0;">Expires: <small>${expiryStr}</small></p>
            </div>
            <div style="display:flex; gap:0.5rem; margin-top:0.5rem; flex-wrap:wrap;">
                <button class="btn-edit-coupon" data-code="${coupon.code}" style="padding:0.4rem 0.8rem; background:#007bff; color:white; border:none; border-radius:5px; font-weight:bold; cursor:pointer; font-size:0.85rem;">Edit</button>
                <button class="btn-toggle-coupon" data-code="${coupon.code}" data-active="${coupon.active}" style="padding:0.4rem 0.8rem; background:${coupon.active ? '#ff9c6e' : '#28a745'}; color:white; border:none; border-radius:5px; font-weight:bold; cursor:pointer; font-size:0.85rem;">
                    ${coupon.active ? 'Deactivate' : 'Activate'}
                </button>
                <button class="btn-delete-coupon" data-code="${coupon.code}" style="padding:0.4rem 0.8rem; background:#dc3545; color:white; border:none; border-radius:5px; font-weight:bold; cursor:pointer; font-size:0.85rem;">Delete</button>
            </div>
        `;

        grid.appendChild(card);
    });

    document.querySelectorAll('.btn-edit-coupon').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const code = e.target.getAttribute('data-code');
            const coupon = allCoupons.find(c => c.code === code);
            if (!coupon) return;

            document.getElementById('couponOriginalCode').value = coupon.code;
            document.getElementById('inpCouponCode').value = coupon.code;
            document.getElementById('inpCouponCode').readOnly = true;
            document.getElementById('inpDiscountType').value = coupon.discountType || 'percentage';
            document.getElementById('inpDiscountValue').value = coupon.discountValue || '';
            document.getElementById('inpMinOrder').value = coupon.minimumOrder || 0;
            document.getElementById('inpMaxDiscount').value = coupon.maximumDiscount || '';
            document.getElementById('inpStartDate').value = coupon.startDate ? coupon.startDate.substring(0, 16) : '';
            document.getElementById('inpExpiryDate').value = coupon.expiryDate ? coupon.expiryDate.substring(0, 16) : '';
            document.getElementById('inpUsageLimit').value = coupon.usageLimit || '';
            document.getElementById('inpPerCustomerLimit').value = coupon.perCustomerLimit || 1;
            document.getElementById('inpCouponActive').checked = Boolean(coupon.active);

            document.getElementById('maxDiscountGroup').style.display = coupon.discountType === 'percentage' ? 'block' : 'none';
            document.getElementById('couponFormTitle').textContent = `Edit Coupon: ${coupon.code}`;
            document.getElementById('couponFormContainer').style.display = 'block';
        });
    });

    document.querySelectorAll('.btn-toggle-coupon').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const code = e.target.getAttribute('data-code');
            const currentActive = e.target.getAttribute('data-active') === 'true';
            try {
                await updateDoc(doc(db, "coupons", code), {
                    active: !currentActive,
                    updatedAt: serverTimestamp()
                });
            } catch (err) {
                console.error("Error toggling coupon status:", err);
                alert("Failed to update coupon status: " + err.message);
            }
        });
    });

    document.querySelectorAll('.btn-delete-coupon').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const code = e.target.getAttribute('data-code');
            if (confirm(`Are you sure you want to delete coupon "${code}"?`)) {
                try {
                    await deleteDoc(doc(db, "coupons", code));
                } catch (err) {
                    console.error("Error deleting coupon:", err);
                    alert("Failed to delete coupon: " + err.message);
                }
            }
        });
    });
}

// ==========================================
// 4. OFFERS & PRICING CONFIGURATION MANAGEMENT
// ==========================================

async function initOffersManagement() {
    const form = document.getElementById('ringPricingForm');

    // Load initial values from Firestore
    try {
        const snap = await getDoc(doc(db, "pricingRules", "ring150Bundle"));
        if (snap.exists()) {
            const data = snap.data();
            document.getElementById('inpRingRuleEnabled').checked = data.enabled !== false;
            document.getElementById('inpRingRuleName').value = data.name || "₹150 Ring Mix & Match";
            document.getElementById('inpRingBasePrice').value = data.basePrice || 150;
            
            if (Array.isArray(data.tiers)) {
                const t1 = data.tiers.find(t => t.minQuantity === 1);
                const t2 = data.tiers.find(t => t.minQuantity === 2);
                const t3 = data.tiers.find(t => t.minQuantity === 3);
                if (t1) document.getElementById('inpTier1Price').value = t1.pricePerItem;
                if (t2) document.getElementById('inpTier2Price').value = t2.pricePerItem;
                if (t3) document.getElementById('inpTier3Price').value = t3.pricePerItem;
            }
        }
    } catch (err) {
        console.warn("Could not load pricing rules:", err);
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btnSave = document.getElementById('btnSaveRingPricing');
            btnSave.disabled = true;
            btnSave.textContent = 'Saving...';

            const enabled = document.getElementById('inpRingRuleEnabled').checked;
            const name = document.getElementById('inpRingRuleName').value.trim() || "₹150 Ring Mix & Match";
            const basePrice = Number(document.getElementById('inpRingBasePrice').value) || 150;
            const tier1 = Number(document.getElementById('inpTier1Price').value) || 150;
            const tier2 = Number(document.getElementById('inpTier2Price').value) || 130;
            const tier3 = Number(document.getElementById('inpTier3Price').value) || 110;

            const payload = {
                name,
                enabled,
                productType: "ring",
                basePrice,
                tiers: [
                    { minQuantity: 1, pricePerItem: tier1 },
                    { minQuantity: 2, pricePerItem: tier2 },
                    { minQuantity: 3, pricePerItem: tier3 }
                ],
                updatedAt: serverTimestamp()
            };

            try {
                await setDoc(doc(db, "pricingRules", "ring150Bundle"), payload, { merge: true });
                const msg = document.getElementById('adminSaveMsg');
                if (msg) {
                    msg.textContent = `Ring Mix & Match pricing rule updated! ✨`;
                    msg.style.display = 'block';
                    setTimeout(() => msg.style.display = 'none', 2500);
                }
            } catch (err) {
                console.error("Error saving pricing rule:", err);
                if (err.code === 'permission-denied' || (err.message && err.message.includes('permissions'))) {
                    alert("Failed to save pricing rule: Missing or insufficient permissions.\n\nTo fix this error:\n1. Open your Firebase Console (https://console.firebase.google.com)\n2. Go to Firestore Database -> Rules tab\n3. Copy the updated contents of 'firestore.rules' from your project and click Publish.");
                } else {
                    alert("Failed to save pricing rule: " + err.message);
                }
            } finally {
                btnSave.disabled = false;
                btnSave.textContent = 'Save Pricing Rule';
            }
        });
    }
}


