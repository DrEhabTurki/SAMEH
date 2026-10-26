// في بداية ملف app.js
if (!localStorage.getItem('sameh_script_url')) {
    localStorage.setItem('sameh_script_url', 'https://script.google.com/macros/s/AKfycbx71k4Gpo_Je1_cLtxPJiDMq7nEKk52nJ-L99AQeA5_4cymMEnwdGJjUXdIQF5swaoo/exec');
}

// ضع هنا رابط Web App الخاص بـ Google Apps Script بعد النشر

const API_URL = localStorage.getItem('sameh_script_url') ||
  'https://script.google.com/macros/s/AKfycbx71k4Gpo_Je1_cLtxPJiDMq7nEKk52nJ-L99AQeA5_4cymMEnwdGJjUXdIQF5swaoo/exec';

let allProducts = [];

document.addEventListener("DOMContentLoaded", () => {
  fetchProducts();

  document.getElementById("btnSearch").addEventListener("click", filterProducts);
  document.getElementById("btnReset").addEventListener("click", resetFilters);
  document.getElementById("btnOpenAddModal").addEventListener("click", () => openModal());
  document.querySelector(".close-btn").addEventListener("click", closeModal);
  document.getElementById("drugForm").addEventListener("submit", handleFormSubmit);

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
  }
});

async function fetchProducts() {
  try {
    const res = await fetch(API_URL);
    allProducts = await res.json();
    renderProducts(allProducts);
  } catch (err) {
    console.error("خطأ في جلب البيانات:", err);
  }
}

function renderProducts(list) {
  const container = document.getElementById("resultsList");
  document.getElementById("resultCount").innerText = list.length;
  container.innerHTML = "";

  list.forEach(p => {
    const card = document.createElement("div");
    card.className = "drug-card";
    card.innerHTML = `
      <h4>${p["Trade Name (اسم الدواء)"] || ''}</h4>
      <p style="font-size: 0.85rem; color: #64748b;">${p["Active Ingredient (المادة الفعالة)"] || ''}</p>
      <div><span class="badge">لون العلبة: ${p["Box Primary Color (لون العلبة الرئيسي)"] || ''} / ${p["Box Secondary Color (لون العلبة الثانوي)"] || ''}</span></div>
      <div style="margin-top: 5px;"><span class="badge">الوحدات: ${p["Inner Units Count (عدد الشريط/الأمبولات)"] || 0} شريط × ${p["Sub-unit Count (عدد الأقراص في الشريط)"] || 0} قرص</span></div>
      <p><strong>الوحدة الداخلية:</strong> ${p["Inner Unit Type (نوع الوحدة الداخلية)"] || ''} (${p["Inner Unit Color (لون الشريط/الأنبوب)"] || ''})</p>
      <p><small>${p["Notes & Visual Clues (ملاحظات وعلامات مميزة)"] || ''}</small></p>
      <button onclick="editProduct('${p["Product ID"]}')" class="btn btn-secondary" style="font-size:0.75rem; padding: 4px 8px;">تعديل البيانات</button>
    `;
    container.appendChild(card);
  });
}


function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ـ/g, "")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/\s+/g, " ");
}

function filterProducts() {
  const c1 = normalizeText(
    document.getElementById("filterColor1").value
  );
  const c2 = normalizeText(
    document.getElementById("filterColor2").value
  );
  const units = document.getElementById("filterUnits").value;
  const subUnits = document.getElementById("filterSubUnits").value;
  const type = normalizeText(
    document.getElementById("filterType").value
  );
  const innerColor = normalizeText(
    document.getElementById("filterInnerColor").value
  );

  const filtered = allProducts.filter(p => {
    const pC1 = normalizeText(
      p["Box Primary Color (لون العلبة الرئيسي)"]
    );
    const pC2 = normalizeText(
      p["Box Secondary Color (لون العلبة الثانوي)"]
    );
    const pType = normalizeText(
      p["Inner Unit Type (نوع الوحدة الداخلية)"]
    );
    const pInColor = normalizeText(
      p["Inner Unit Color (لون الشريط/الأنبوب)"]
    );

    return (!c1 || pC1.includes(c1)) &&
      (!c2 || pC2.includes(c2)) &&
      (!units ||
        String(p["Inner Units Count (عدد الشريط/الأمبولات)"]) === units) &&
      (!subUnits ||
        String(p["Sub-unit Count (عدد الأقراص في الشريط)"]) === subUnits) &&
      (!type || pType.includes(type)) &&
      (!innerColor || pInColor.includes(innerColor));
  });

  


  renderProducts(filtered);
}

function resetFilters() {
  document.querySelectorAll(".search-section input").forEach(i => i.value = "");
  renderProducts(allProducts);
}

function openModal(data = null) {
  document.getElementById("itemModal").style.display = "block";
  if (data) {
    document.getElementById("modalTitle").innerText = "تعديل دواء";
    document.getElementById("drugId").value = data["Product ID"];
    document.getElementById("tradeName").value = data["Trade Name (اسم الدواء)"];
    document.getElementById("activeIngredient").value = data["Active Ingredient (المادة الفعالة)"];
    document.getElementById("boxPrimaryColor").value = data["Box Primary Color (لون العلبة الرئيسي)"];
    document.getElementById("boxSecondaryColor").value = data["Box Secondary Color (لون العلبة الثانوي)"];
    document.getElementById("outerShape").value = data["Outer Shape (شكل العلبة / الحجم)"];
    document.getElementById("innerUnitsCount").value = data["Inner Units Count (عدد الشريط/الأمبولات)"];
    document.getElementById("subUnitCount").value = data["Sub-unit Count (عدد الأقراص في الشريط)"];
    document.getElementById("innerUnitType").value = data["Inner Unit Type (نوع الوحدة الداخلية)"];
    document.getElementById("innerUnitColor").value = data["Inner Unit Color (لون الشريط/الأنبوب)"];
    document.getElementById("notes").value = data["Notes & Visual Clues (ملاحظات وعلامات مميزة)"];
  } else {
    document.getElementById("modalTitle").innerText = "إضافة دواء جديد";
    document.getElementById("drugForm").reset();
    document.getElementById("drugId").value = "";
  }
}

function closeModal() { document.getElementById("itemModal").style.display = "none"; }

function editProduct(id) {
  const item = allProducts.find(p => p["Product ID"] == id);
  if (item) openModal(item);
}

async function handleFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById("drugId").value;
  const payload = {
    action: id ? "update" : "add",
    id: id || Date.now(),
    tradeName: document.getElementById("tradeName").value,
    activeIngredient: document.getElementById("activeIngredient").value,
    boxPrimaryColor: document.getElementById("boxPrimaryColor").value,
    boxSecondaryColor: document.getElementById("boxSecondaryColor").value,
    outerShape: document.getElementById("outerShape").value,
    innerUnitsCount: document.getElementById("innerUnitsCount").value,
    subUnitCount: document.getElementById("subUnitCount").value,
    innerUnitType: document.getElementById("innerUnitType").value,
    innerUnitColor: document.getElementById("innerUnitColor").value,
    notes: document.getElementById("notes").value
  };

  await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(payload)
  });

  closeModal();
  fetchProducts();
}
