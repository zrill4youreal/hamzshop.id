// script.js
import { database, ref, get } from './firebase-config.js';

let products = [];
let adminWhatsapp = "6281234567890"; // default

function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID').format(angka);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function renderProducts() {
    const grid = document.getElementById("productsGrid");
    if (!grid) return;

    if (!products || products.length === 0) {
        grid.innerHTML = '<div class="loading">Belum ada produk.</div>';
        return;
    }

    let html = '';
    for (const prod of products) {
        const priceFormatted = formatRupiah(prod.price);
        const soldOutClass = prod.soldOut ? 'btn-disabled' : 'btn-buy';
        const soldOutText = prod.soldOut ? 'SOLD OUT' : 'Beli Sekarang';
        const disabledAttr = prod.soldOut ? 'disabled' : '';
        
        html += `
            <div class="product-card">
                <div class="card-img" style="background-image: url('${prod.image || 'https://via.placeholder.com/300?text=Game+Account'}');">
                    ${prod.soldOut ? '<div class="soldout-tag">SOLD OUT</div>' : ''}
                </div>
                <div class="card-content">
                    <div class="game-category"><i class="fas fa-tag"></i> ${escapeHtml(prod.category)}</div>
                    <div class="product-name">${escapeHtml(prod.name)}</div>
                    <div class="product-detail">
                        <i class="fas fa-info-circle"></i> ${escapeHtml(prod.detail)}
                    </div>
                    <div class="price">Rp ${priceFormatted}</div>
                    <button class="${soldOutClass}" data-id="${prod.id}" data-name="${escapeHtml(prod.name)}" data-price="${prod.price}" ${disabledAttr}>
                        <i class="fab fa-whatsapp"></i> ${soldOutText}
                    </button>
                </div>
            </div>
        `;
    }
    grid.innerHTML = html;

    // Event listener tombol beli
    document.querySelectorAll('.btn-buy').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            const name = btn.dataset.name;
            const price = parseInt(btn.dataset.price);
            const waNumber = localStorage.getItem('AdminWaNumber') || adminWhatsapp;
            const message = `Halo Admin, saya ingin membeli akun: ${name} - Rp ${formatRupiah(price)}. Apakah masih tersedia?`;
            const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
            window.open(waUrl, '_blank');
        });
    });
}

// Load data dari Firebase dengan cache & fallback
async function loadProducts() {
    const grid = document.getElementById("productsGrid");
    // Tampilkan cache dulu jika ada
    const cached = localStorage.getItem("cachedProducts");
    if (cached) {
        try {
            products = JSON.parse(cached);
            renderProducts();
        } catch(e) {}
    }

    try {
        const snapshot = await get(ref(database, 'products'));
        if (snapshot.exists()) {
            const data = snapshot.val();
            // Konversi objek ke array
            products = Object.values(data);
            // Simpan cache
            localStorage.setItem("cachedProducts", JSON.stringify(products));
            renderProducts();
        } else {
            // Jika kosong, buat data default
            const defaultProducts = [
                { id: 101, name: "MLBB Diamond + Collector Skin", category: "Mobile Legends", detail: "Rank Mythical Glory, 74 skin + 8 Collector", price: 1250000, image: "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=500&auto=format", soldOut: false },
                { id: 102, name: "Free Fire Elite Bundle", category: "Free Fire", detail: "Heroic rank, 36 skin elite, bundle langka", price: 850000, image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&auto=format", soldOut: false },
                { id: 103, name: "Valorant Prime Vandal", category: "Valorant", detail: "Platinum 3, 5 skin premium", price: 2100000, image: "https://images.unsplash.com/photo-1614680376408-81e91ffe3db5?w=500&auto=format", soldOut: true },
                { id: 104, name: "Genshin Impact AR55", category: "Genshin Impact", detail: "Raiden, Hu Tao + senjata", price: 1750000, image: "https://images.unsplash.com/photo-1637607155173-6a1cfe6cb7cb?w=500&auto=format", soldOut: false }
            ];
            products = defaultProducts;
            localStorage.setItem("cachedProducts", JSON.stringify(products));
            renderProducts();
            // Simpan ke Firebase agar permanen
            await import('./firebase-config.js').then(async ({ database, ref, set }) => {
                for (const p of defaultProducts) {
                    await set(ref(database, `products/${p.id}`), p);
                }
            });
        }
    } catch (error) {
        console.error("Gagal load dari Firebase:", error);
        if (!cached) {
            grid.innerHTML = '<div class="loading">Gagal memuat data. Cek koneksi internet.</div>';
        }
    }
}

// Load nomor WA dari localStorage
function loadWaNumber() {
    const wa = localStorage.getItem('AdminWaNumber');
    if (wa) adminWhatsapp = wa;
    const waDisplay = document.getElementById("waNumberDisplay");
    if (waDisplay) waDisplay.innerText = `+${adminWhatsapp.slice(0,3)} ${adminWhatsapp.slice(3)}`;
    const floatLink = document.getElementById("floatWaLink");
    if (floatLink) {
        floatLink.href = `https://wa.me/${adminWhatsapp}?text=Halo%20Admin%20HamzShop%2C%20saya%20ingin%20tanya%20akun%20game`;
    }
}

// Inisialisasi
loadProducts();
loadWaNumber();

// Update jika ada perubahan storage dari admin
window.addEventListener('storage', (e) => {
    if (e.key === 'AdminWaNumber') {
        loadWaNumber();
        renderProducts(); // refresh tombol
    }
    if (e.key === 'cachedProducts') {
        // optional: reload from cache
        loadProducts();
    }
});