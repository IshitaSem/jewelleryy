import { auth, db } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Global auth observer
onAuthStateChanged(auth, async (user) => {
    const navAuthLink = document.getElementById('navAuthLink');
    if (navAuthLink) {
        if (user) {
            navAuthLink.innerHTML = 'My Account ✨';
            navAuthLink.href = 'account.html';
        } else {
            navAuthLink.innerHTML = 'Login / Sign Up ✨';
            navAuthLink.href = 'login.html';
        }
    }

    // Handle logout button if it exists on the page
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await signOut(auth);
                window.location.href = 'index.html';
            } catch (error) {
                console.error("Logout failed", error);
            }
        });
    }

    // Populate Account Page Profile
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const profilePhone = document.getElementById('profilePhone');
    const profileInsta = document.getElementById('profileInsta');

    if (user && profileName) { // Meaning we are on account.html
        try {
            const userDoc = await getDoc(doc(db, "customers", user.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                profileName.textContent = data.fullName || "Glam Aura Customer";
                profileEmail.textContent = data.email || user.email;
                profilePhone.textContent = data.phone || "Not provided";
                profileInsta.textContent = data.instagramUsername ? `@${data.instagramUsername}` : "Not provided";
            }
        } catch(e) {
            console.error("Error fetching profile", e);
        }
    } else if (!user && profileName) {
        // If on account page but not logged in, redirect
        window.location.href = 'login.html';
    }
});
