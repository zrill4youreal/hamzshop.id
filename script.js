import { database, ref, get } from './firebase-config.js';

let products = [];
let adminWhatsapp = "6281234567890";

let currentFilter = {
    search: "",
    category: "all",
    priceRange: "all"
};

function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID').format(angka);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
}

function showToast(message) {
    const existingToast = document.querySelector('.toast-notify');
    if (existingToast) existingToast.remove();
    const toast = document.createElement('div');
    toast.className = 'toast-notify';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

function getFilteredProducts() {
    return products.filter(prod => {
        const matchSearch = prod.name.toLowerCase().includes(currentFilter.search) ||
                            prod.detail.toLowerCase().includes(currentFilter.search);
        const matchCategory = currentFilter.category === "all" || prod.category === currentFilter.category;
        let matchPrice = true;
        if (currentFilter.priceRange !== "all") {
            const [min, max] = currentFilter.priceRange.split('-').map(Number);
            matchPrice = prod.price >= min && prod.price <= max;
        }
        return matchSearch && matchCategory && matchPrice;
    });
}

function renderProducts() {
    const grid = document.getElementById("productsGrid");
    if (!grid) return;
    const filtered = getFilteredProducts();
    if (filtered.length === 0) {
        grid.innerHTML = '<div class="loading">Tidak ada produk yang cocok.</div>';
        return;
    }
    let html = '';
    for (const prod of filtered) {
        const priceFormatted = formatRupiah(prod.price);
        const soldOutClass = prod.soldOut ? 'btn-disabled' : 'btn-buy';
        const soldOutText = prod.soldOut ? 'SOLD OUT' : 'Beli Sekarang';
        html += `
            <div class="product-card" data-id="${prod.id}">
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
                    <button class="${soldOutClass}" data-id="${prod.id}" data-name="${escapeHtml(prod.name)}" data-price="${prod.price}" ${prod.soldOut ? 'disabled' : ''}>
                        <i class="fab fa-whatsapp"></i> ${soldOutText}
                    </button>
                    <button class="btn-share" data-name="${escapeHtml(prod.name)}" data-price="${priceFormatted}">
                        <i class="fas fa-share-alt"></i> Bagikan Produk
                    </button>
                </div>
            </div>
        `;
    }
    grid.innerHTML = html;

    // Event tombol beli
    document.querySelectorAll('.btn-buy').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const name = btn.dataset.name;
            const price = parseInt(btn.dataset.price);
            const waNumber = localStorage.getItem('AdminWaNumber') || adminWhatsapp;
            const message = `Halo Admin, saya ingin membeli akun: ${name} - Rp ${formatRupiah(price)}. Apakah masih tersedia?`;
            window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, '_blank');
        });
    });

    // Event tombol bagikan
    document.querySelectorAll('.btn-share').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const productName = btn.dataset.name;
            const productPrice = btn.dataset.price;
            const storeUrl = window.location.href;
            const shareText = `🚀 *${productName}* - Harga *Rp ${productPrice}* 🔥\n\nBeli langsung di HamzShop:\n${storeUrl}`;
            try {
                await navigator.clipboard.writeText(shareText);
                showToast(`✅ Info produk "${productName}" disalin!`);
            } catch (err) {
                showToast(`⚠️ Gagal menyalin, silakan manual.`);
            }
        });
    });
}

function initFilters() {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const priceFilter = document.getElementById('priceFilter');
    const resetBtn = document.getElementById('resetFilterBtn');
    if (!searchInput) return;

    function updateFilter() {
        currentFilter.search = searchInput.value.toLowerCase();
        currentFilter.category = categoryFilter.value;
        currentFilter.priceRange = priceFilter.value;
        renderProducts();
    }
    searchInput.addEventListener('input', updateFilter);
    categoryFilter.addEventListener('change', updateFilter);
    priceFilter.addEventListener('change', updateFilter);
    resetBtn.addEventListener('click', () => {
        searchInput.value = '';
        categoryFilter.value = 'all';
        priceFilter.value = 'all';
        updateFilter();
    });
}

async function loadProducts() {
    const grid = document.getElementById("productsGrid");
    grid.innerHTML = '<div class="loading">⏳ Memuat produk...</div>';
    try {
        const snapshot = await get(ref(database, 'products'));
        if (snapshot.exists()) {
            const data = snapshot.val();
            products = Object.values(data);
        } else {
            // Data default jika kosong
            products = [
                { id: 101, name: "MLBB Diamond + Collector Skin", category: "Mobile Legends", detail: "Rank Mythical Glory, 74 skin + 8 Collector", price: 1250000, image: "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=500", soldOut: false },
                { id: 102, name: "Free Fire Elite Bundle", category: "Free Fire", detail: "Heroic rank, 36 skin elite", price: 850000, image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500", soldOut: false },
                { id: 103, name: "Valorant Prime Vandal", category: "Valorant", detail: "Platinum 3, 5 skin premium", price: 2100000, image: "https://images.unsplash.com/photo-1614680376408-81e91ffe3db5?w=500", soldOut: true },
                { id: 104, name: "Genshin Impact AR55", category: "Genshin Impact", detail: "Raiden, Hu Tao + senjata", price: 1750000, image: "https://images.unsplash.com/photo-1637607155173-6a1cfe6cb7cb?w=500", soldOut: false }
            ];
            const { set } = await import('./firebase-config.js');
            for (const p of products) {
                await set(ref(database, `products/${p.id}`), p);
            }
        }
        renderProducts();
        initFilters();
    } catch (err) {
        console.error(err);
        grid.innerHTML = '<div class="loading">Gagal memuat data. Cek koneksi internet dan Firebase.</div>';
    }
}

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

function initSlider() {
    const wrapper = document.getElementById('sliderWrapper');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const dotsContainer = document.getElementById('sliderDots');
    if (!wrapper) return;
    let slides = document.querySelectorAll('.slide');
    if (slides.length === 0) return;
    let currentIndex = 0;
    let autoSlideInterval;

    function createDots() {
        dotsContainer.innerHTML = '';
        slides.forEach((_, i) => {
            const dot = document.createElement('span');
            dot.classList.add('dot');
            if (i === currentIndex) dot.classList.add('active');
            dot.addEventListener('click', () => goToSlide(i));
            dotsContainer.appendChild(dot);
        });
    }

    function updateDots() {
        document.querySelectorAll('.dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === currentIndex);
        });
    }

    function goToSlide(index) {
        if (index < 0) index = slides.length - 1;
        if (index >= slides.length) index = 0;
        currentIndex = index;
        wrapper.style.transform = `translateX(-${currentIndex * 100}%)`;
        updateDots();
        resetAutoSlide();
    }

    function nextSlide() { goToSlide(currentIndex + 1); }
    function prevSlide() { goToSlide(currentIndex - 1); }
    function resetAutoSlide() {
        if (autoSlideInterval) clearInterval(autoSlideInterval);
        autoSlideInterval = setInterval(nextSlide, 4000);
    }

    prevBtn.addEventListener('click', prevSlide);
    nextBtn.addEventListener('click', nextSlide);
    createDots();
    resetAutoSlide();

    const sliderContainer = document.querySelector('.slider-container');
    sliderContainer.addEventListener('mouseenter', () => clearInterval(autoSlideInterval));
    sliderContainer.addEventListener('mouseleave', resetAutoSlide);
}

function showJoinWaModal() {
    if (sessionStorage.getItem('waModalShown')) return;
    const modal = document.getElementById('joinWaModal');
    if (!modal) return;
    modal.classList.add('show');
    sessionStorage.setItem('waModalShown', 'true');

    const closeBtn = modal.querySelector('.modal-close');
    const dismissBtn = modal.querySelector('.modal-dismiss');
    const closeModal = () => modal.classList.remove('show');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (dismissBtn) dismissBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

// Mulai semua fungsi
loadProducts();
loadWaNumber();
initSlider();
showJoinWaModal();

window.addEventListener('storage', (e) => {
    if (e.key === 'AdminWaNumber') loadWaNumber();
    if (e.key === 'cachedProducts') loadProducts();
});
