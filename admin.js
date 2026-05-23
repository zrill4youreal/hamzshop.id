// admin.js
import { database, ref, get, set, remove, update } from './firebase-config.js';

const ADMIN_PASS_KEY = "GameStoreAdminPass";
const DEFAULT_PASS = "HAMZ";

let isLoggedIn = false;
let products = [];

// Helper escape
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
}

// Login logic
function checkLogin() {
    if (sessionStorage.getItem("adminLoggedIn") === "true") {
        isLoggedIn = true;
        document.getElementById("loginBox").style.display = "none";
        document.getElementById("dashboard").style.display = "block";
        loadAdminProducts();
    } else {
        document.getElementById("loginBox").style.display = "block";
        document.getElementById("dashboard").style.display = "none";
    }
}

function login(password) {
    let storedPass = localStorage.getItem(ADMIN_PASS_KEY);
    if (!storedPass) {
        localStorage.setItem(ADMIN_PASS_KEY, DEFAULT_PASS);
        storedPass = DEFAULT_PASS;
    }
    if (password === storedPass) {
        sessionStorage.setItem("adminLoggedIn", "true");
        checkLogin();
    } else {
        document.getElementById("loginError").innerText = "Password salah!";
    }
}

function logout() {
    sessionStorage.removeItem("adminLoggedIn");
    checkLogin();
}

// Load produk dari Firebase
async function loadAdminProducts() {
    const container = document.getElementById("adminProductsGrid");
    container.innerHTML = '<div class="loading">Memuat...</div>';
    try {
        const snapshot = await get(ref(database, 'products'));
        if (snapshot.exists()) {
            const data = snapshot.val();
            products = Object.values(data);
        } else {
            products = [];
        }
        renderAdminProducts();
    } catch (error) {
        console.error(error);
        container.innerHTML = '<div class="loading">Gagal memuat data. Cek koneksi.</div>';
    }
}

function renderAdminProducts() {
    const container = document.getElementById("adminProductsGrid");
    if (!container) return;
    if (products.length === 0) {
        container.innerHTML = "<p>Belum ada produk. Klik 'Tambah Produk Baru'.</p>";
        return;
    }
    let html = "";
    for (const prod of products) {
        const priceFormatted = new Intl.NumberFormat('id-ID').format(prod.price);
        html += `
            <div class="admin-card" data-id="${prod.id}">
                <img src="${prod.image || 'https://via.placeholder.com/300?text=No+Image'}" alt="${escapeHtml(prod.name)}" onerror="this.src='https://via.placeholder.com/300?text=No+Image'">
                <h4>${escapeHtml(prod.name)}</h4>
                <p><strong>Kategori:</strong> ${escapeHtml(prod.category)}</p>
                <p><strong>Detail:</strong> ${escapeHtml(prod.detail)}</p>
                <p><strong>Harga:</strong> Rp ${priceFormatted}</p>
                <p><strong>Status:</strong> ${prod.soldOut ? 'SOLD OUT' : 'Tersedia'}</p>
                <div class="admin-card-actions">
                    <button class="btn-edit" data-id="${prod.id}"><i class="fas fa-edit"></i> Edit</button>
                    <button class="btn-toggle" data-id="${prod.id}"><i class="fas fa-exchange-alt"></i> Toggle Sold Out</button>
                    <button class="btn-delete" data-id="${prod.id}"><i class="fas fa-trash"></i> Hapus</button>
                </div>
            </div>
        `;
    }
    container.innerHTML = html;
    // Event listeners
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => {
            window.location.href = `form.html?edit=${btn.dataset.id}`;
        });
    });
    document.querySelectorAll('.btn-toggle').forEach(btn => {
        btn.addEventListener('click', () => toggleSoldOut(parseInt(btn.dataset.id)));
    });
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            if (confirm("Yakin hapus produk ini?")) deleteProduct(parseInt(btn.dataset.id));
        });
    });
}

async function toggleSoldOut(id) {
    const productRef = ref(database, `products/${id}`);
    const snapshot = await get(productRef);
    if (snapshot.exists()) {
        const product = snapshot.val();
        product.soldOut = !product.soldOut;
        await set(productRef, product);
        await loadAdminProducts();
        // Invalidate cache di localStorage agar index.html update
        localStorage.removeItem("cachedProducts");
        // Trigger storage event
        window.dispatchEvent(new Event('storage'));
    }
}

async function deleteProduct(id) {
    await remove(ref(database, `products/${id}`));
    await loadAdminProducts();
    localStorage.removeItem("cachedProducts");
    window.dispatchEvent(new Event('storage'));
}

function changeWaNumber() {
    const newWa = prompt("Masukkan nomor WhatsApp admin (contoh: 6281234567890):", localStorage.getItem("AdminWaNumber") || "6281234567890");
    if (newWa && /^\d{10,15}$/.test(newWa)) {
        localStorage.setItem("AdminWaNumber", newWa);
        alert("Nomor WA berhasil diubah!");
        window.dispatchEvent(new Event('storage'));
    } else if (newWa) {
        alert("Format nomor salah! Hanya angka 10-15 digit.");
    }
}

function changeAdminPassword() {
    const oldPass = prompt("Masukkan password lama:");
    let storedPass = localStorage.getItem(ADMIN_PASS_KEY) || DEFAULT_PASS;
    if (oldPass !== storedPass) {
        alert("Password lama salah!");
        return;
    }
    const newPass = prompt("Password baru (minimal 4 karakter):");
    if (newPass && newPass.length >= 4) {
        localStorage.setItem(ADMIN_PASS_KEY, newPass);
        alert("Password berhasil diubah! Silakan login ulang.");
        logout();
    } else {
        alert("Password baru minimal 4 karakter.");
    }
}

// Event listener
document.addEventListener("DOMContentLoaded", () => {
    checkLogin();
    document.getElementById("loginBtn")?.addEventListener("click", () => {
        login(document.getElementById("adminPassword").value);
    });
    document.getElementById("logoutBtn")?.addEventListener("click", logout);
    document.getElementById("addProductBtn")?.addEventListener("click", () => {
        window.location.href = "form.html?add=new";
    });
    document.getElementById("changeWaBtn")?.addEventListener("click", changeWaNumber);
    document.getElementById("changePasswordBtn")?.addEventListener("click", changeAdminPassword);
});