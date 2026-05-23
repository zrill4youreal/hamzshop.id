// form.js
import { database, ref, get, set } from './firebase-config.js';

const urlParams = new URLSearchParams(window.location.search);
const editId = urlParams.get('edit');
let currentProductId = null;

document.addEventListener("DOMContentLoaded", () => {
    const formTitle = document.getElementById("formTitle");
    if (editId) {
        formTitle.innerHTML = '<i class="fas fa-edit"></i> Edit Produk';
        loadProductForEdit(parseInt(editId));
    } else {
        formTitle.innerHTML = '<i class="fas fa-plus-circle"></i> Tambah Produk Baru';
    }

    document.getElementById("productForm").addEventListener("submit", saveProduct);
    document.getElementById("cancelBtn").addEventListener("click", () => {
        window.location.href = "admin.html";
    });
});

async function loadProductForEdit(id) {
    const productRef = ref(database, `products/${id}`);
    const snapshot = await get(productRef);
    if (snapshot.exists()) {
        const product = snapshot.val();
        currentProductId = id;
        document.getElementById("name").value = product.name || '';
        document.getElementById("category").value = product.category || '';
        document.getElementById("detail").value = product.detail || '';
        document.getElementById("price").value = product.price || '';
        document.getElementById("image").value = product.image || '';
        document.getElementById("soldOut").checked = product.soldOut || false;
    } else {
        alert("Produk tidak ditemukan!");
        window.location.href = "admin.html";
    }
}

async function saveProduct(e) {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const category = document.getElementById("category").value.trim();
    const detail = document.getElementById("detail").value.trim();
    const price = parseInt(document.getElementById("price").value);
    const image = document.getElementById("image").value.trim() || "https://via.placeholder.com/300?text=Game+Account";
    const soldOut = document.getElementById("soldOut").checked;

    if (!name || !category || !detail || isNaN(price) || price <= 0) {
        alert("Harap isi semua field wajib.");
        return;
    }

    const productData = { name, category, detail, price, image, soldOut };

    if (editId && currentProductId) {
        // Update
        await set(ref(database, `products/${currentProductId}`), { ...productData, id: currentProductId });
    } else {
        // Tambah baru
        const newId = Date.now();
        await set(ref(database, `products/${newId}`), { ...productData, id: newId });
    }

    // Hapus cache agar index.html refresh data
    localStorage.removeItem("cachedProducts");
    window.dispatchEvent(new Event('storage'));
    alert("Produk berhasil disimpan!");
    window.location.href = "admin.html";
}