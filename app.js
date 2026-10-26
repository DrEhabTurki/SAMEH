
/* =========================================
   SAMEH - Pharmacy Medicine Search
   ========================================= */

// رابط Google Apps Script
const DEFAULT_API_URL =
  "https://script.google.com/macros/s/AKfycbx71k4Gpo_Je1_cLtxPJiDMq7nEKk52nJ-L99AQeA5_4cymMEnwdGJjUXdIQF5swaoo/exec";

if (!localStorage.getItem("sameh_script_url")) {
  localStorage.setItem("sameh_script_url", DEFAULT_API_URL);
}

const API_URL =
  localStorage.getItem("sameh_script_url") || DEFAULT_API_URL;

let allProducts = [];

// أسماء الأعمدة في Google Sheets
const FIELDS = {
  id: "Product ID",
  name: "Trade Name (اسم الدواء)",
  ingredient: "Active Ingredient (المادة الفعالة)",
  primaryColor: "Box Primary Color (لون العلبة الرئيسي)",
  secondaryColor: "Box Secondary Color (لون العلبة الثانوي)",
  shape: "Outer Shape (شكل العلبة / الحجم)",
  units: "Inner Units Count (عدد الشريط/الأمبولات)",
  subUnits: "Sub-unit Count (عدد الأقراص في الشريط)",
  type: "Inner Unit Type (نوع الوحدة الداخلية)",
  innerColor: "Inner Unit Color (لون الشريط/الأنبوب)",
  notes: "Notes & Visual Clues (ملاحظات وعلامات مميزة)"
};

// =========================================
// بدء البرنامج
// =========================================

document.addEventListener("DOMContentLoaded", () => {
  const searchButton = document.getElementById("btnSearch");
  const resetButton = document.getElementById("btnReset");
  const addButton = document.getElementById("btnOpenAddModal");
  const closeButton = document.querySelector(".close-btn");
  const drugForm = document.getElementById("drugForm");

  if (searchButton) {
    searchButton.addEventListener("click", filterProducts);
  }

  if (resetButton) {
    resetButton.addEventListener("click", resetFilters);
  }

  if (addButton) {
    addButton.addEventListener("click", () => openModal());
  }

  if (closeButton) {
    closeButton.addEventListener("click", closeModal);
  }

  if (drugForm) {
    drugForm.addEventListener("submit", handleFormSubmit);
  }

  // البحث عند الضغط على Enter داخل حقول البحث
  document.querySelectorAll(".search-section input").forEach(input => {
    input.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        filterProducts();
      }
    });
  });

  // إغلاق النافذة عند الضغط خارجها
  const modal = document.getElementById("itemModal");

  if (modal) {
    modal.addEventListener("click", event => {
      if (event.target === modal) {
        closeModal();
      }
    });
  }

  // تحديث البرنامج عند تفعيل Service Worker
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(error => {
      console.error("Service Worker error:", error);
    });
  }

  fetchProducts();
});

// =========================================
// جلب الأدوية من Google Sheets
// =========================================

async function fetchProducts() {
  const container = document.getElementById("resultsList");

  if (container) {
    container.innerHTML = "<p>جاري تحميل بيانات الأدوية...</p>";
  }

  try {
    const response = await fetch(API_URL, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("فشل الاتصال بمصدر البيانات.");
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("البيانات المستلمة ليست قائمة أدوية.");
    }

    allProducts = data;

    console.log("SAMEH: عدد الأدوية المحمّلة:", allProducts.length);
    console.log("SAMEH: مثال على بيانات دواء:", allProducts[0]);

    renderProducts(allProducts);
  } catch (error) {
    console.error("خطأ في جلب البيانات:", error);

    if (container) {
      container.innerHTML =
        '<p>تعذر تحميل الأدوية. تأكد من الاتصال بالإنترنت وحاول مرة أخرى.</p>';
    }

    const count = document.getElementById("resultCount");
    if (count) count.innerText = "0";
  }
}

// =========================================
// تطبيع النصوص العربية لتسهيل البحث
// =========================================

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ـ/g, "")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/\s+/g, " ");
}

// =========================================
// عرض الأدوية
// =========================================

function renderProducts(list) {
  const container = document.getElementById("resultsList");
  const count = document.getElementById("resultCount");

  if (!container) {
    console.error("لم يتم العثور على resultsList في index.html");
    return;
  }

  if (count) {
    count.innerText = list.length;
  }

  container.innerHTML = "";

  if (list.length === 0) {
    container.innerHTML = "<p>لا توجد أدوية مطابقة لخيارات البحث.</p>";
    return;
  }

  list.forEach(product => {
    const card = document.createElement("div");
    card.className = "drug-card";

    const title = document.createElement("h4");
    title.textContent = product[FIELDS.name] || "دواء بدون اسم";
    card.appendChild(title);

    const ingredient = document.createElement("p");
    ingredient.style.fontSize = "0.85rem";
    ingredient.style.color = "#64748b";
    ingredient.textContent = product[FIELDS.ingredient] || "";
    card.appendChild(ingredient);

    const colors = document.createElement("div");
    const colorsBadge = document.createElement("span");
    colorsBadge.className = "badge";
    colorsBadge.textContent =
      "لون العلبة: " +
      (product[FIELDS.primaryColor] || "") +
      " / " +
      (product[FIELDS.secondaryColor] || "");
    colors.appendChild(colorsBadge);
    card.appendChild(colors);

    const units = document.createElement("div");
    units.style.marginTop = "5px";

    const unitsBadge = document.createElement("span");
    unitsBadge.className = "badge";
    unitsBadge.textContent =
      "الوحدات: " +
      (product[FIELDS.units] ?? 0) +
      " وحدة × " +
      (product[FIELDS.subUnits] ?? 0) +
      " قرص";
    units.appendChild(unitsBadge);
    card.appendChild(units);

    const inner = document.createElement("p");
    const innerLabel = document.createElement("strong");
    innerLabel.textContent = "الوحدة الداخلية: ";
    inner.appendChild(innerLabel);
    inner.appendChild(
      document.createTextNode(
        (product[FIELDS.type] || "") +
        " (" +
        (product[FIELDS.innerColor] || "") +
        ")"
      )
    );
    card.appendChild(inner);

    const notes = document.createElement("p");
    const notesSmall = document.createElement("small");
    notesSmall.textContent = product[FIELDS.notes] || "";
    notes.appendChild(notesSmall);
    card.appendChild(notes);

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "btn btn-secondary";
    editButton.style.fontSize = "0.75rem";
    editButton.style.padding = "4px 8px";
    editButton.textContent = "تعديل البيانات";

    editButton.addEventListener("click", () => {
      editProduct(product[FIELDS.id]);
    });

    card.appendChild(editButton);
    container.appendChild(card);
  });
}

// =========================================
// البحث في الأدوية
// =========================================

function filterProducts() {
  const c1 = normalizeText(
    document.getElementById("filterColor1")?.value
  );

  const c2 = normalizeText(
    document.getElementById("filterColor2")?.value
  );

  const units = String(
    document.getElementById("filterUnits")?.value ?? ""
  ).trim();

  const subUnits = String(
    document.getElementById("filterSubUnits")?.value ?? ""
  ).trim();

  const type = normalizeText(
    document.getElementById("filterType")?.value
  );

  const innerColor = normalizeText(
    document.getElementById("filterInnerColor")?.value
  );

  console.log("SAMEH: البحث عن لون العلبة الرئيسي:", c1);
  console.log("SAMEH: عدد الأدوية المتاحة:", allProducts.length);

  const filtered = allProducts.filter(product => {
    const primaryColor = normalizeText(product[FIELDS.primaryColor]);
    const secondaryColor = normalizeText(product[FIELDS.secondaryColor]);
    const innerType = normalizeText(product[FIELDS.type]);
    const productInnerColor = normalizeText(product[FIELDS.innerColor]);

    const matchesPrimary = !c1 || primaryColor.includes(c1);
    const matchesSecondary = !c2 || secondaryColor.includes(c2);

    const matchesUnits =
      !units ||
      String(product[FIELDS.units] ?? "").trim() === units;

    const matchesSubUnits =
      !subUnits ||
      String(product[FIELDS.subUnits] ?? "").trim() === subUnits;

    const matchesType = !type || innerType.includes(type);
    const matchesInnerColor =
      !innerColor || productInnerColor.includes(innerColor);

    return (
      matchesPrimary &&
      matchesSecondary &&
      matchesUnits &&
      matchesSubUnits &&
      matchesType &&
      matchesInnerColor
    );
  });

  console.log("SAMEH: عدد نتائج البحث:", filtered.length);

  renderProducts(filtered);
}

// =========================================
// إعادة ضبط البحث
// =========================================

function resetFilters() {
  document.querySelectorAll(".search-section input").forEach(input => {
    input.value = "";
  });

  renderProducts(allProducts);
}

// =========================================
// فتح نافذة إضافة أو تعديل دواء
// =========================================

function openModal(data = null) {
  const modal = document.getElementById("itemModal");
  const title = document.getElementById("modalTitle");
  const form = document.getElementById("drugForm");

  if (!modal || !form) {
    console.error("تعذر العثور على نافذة الدواء أو النموذج.");
    return;
  }

  modal.style.display = "block";

  if (data) {
    title.innerText = "تعديل دواء";

    document.getElementById("drugId").value =
      data[FIELDS.id] ?? "";

    document.getElementById("tradeName").value =
      data[FIELDS.name] ?? "";

    document.getElementById("activeIngredient").value =
      data[FIELDS.ingredient] ?? "";

    document.getElementById("boxPrimaryColor").value =
      data[FIELDS.primaryColor] ?? "";

    document.getElementById("boxSecondaryColor").value =
      data[FIELDS.secondaryColor] ?? "";

    document.getElementById("outerShape").value =
      data[FIELDS.shape] ?? "";

    document.getElementById("innerUnitsCount").value =
      data[FIELDS.units] ?? "";

    document.getElementById("subUnitCount").value =
      data[FIELDS.subUnits] ?? "";

    document.getElementById("innerUnitType").value =
      data[FIELDS.type] ?? "";

    document.getElementById("innerUnitColor").value =
      data[FIELDS.innerColor] ?? "";

    document.getElementById("notes").value =
      data[FIELDS.notes] ?? "";
  } else {
    title.innerText = "إضافة دواء جديد";
    form.reset();
    document.getElementById("drugId").value = "";
  }
}

// =========================================
// إغلاق النافذة
// =========================================

function closeModal() {
  const modal = document.getElementById("itemModal");

  if (modal) {
    modal.style.display = "none";
  }
}

// =========================================
// اختيار دواء للتعديل
// =========================================

function editProduct(id) {
  const product = allProducts.find(
    item => String(item[FIELDS.id]) === String(id)
  );

  if (product) {
    openModal(product);
  } else {
    alert("لم يتم العثور على الدواء المطلوب.");
  }
}

// =========================================
// حفظ دواء جديد أو تعديل دواء موجود
// =========================================

async function handleFormSubmit(event) {
  event.preventDefault();

  const submitButton = document.querySelector(
    '#drugForm button[type="submit"]'
  );

  const id = document.getElementById("drugId").value.trim();

  const payload = {
    action: id ? "update" : "add",
    id: id || Date.now(),
    tradeName: document.getElementById("tradeName").value.trim(),
    activeIngredient: document.getElementById("activeIngredient").value.trim(),
    boxPrimaryColor: document.getElementById("boxPrimaryColor").value.trim(),
    boxSecondaryColor: document.getElementById("boxSecondaryColor").value.trim(),
    outerShape: document.getElementById("outerShape").value.trim(),
    innerUnitsCount: document.getElementById("innerUnitsCount").value,
    subUnitCount: document.getElementById("subUnitCount").value,
    innerUnitType: document.getElementById("innerUnitType").value.trim(),
    innerUnitColor: document.getElementById("innerUnitColor").value.trim(),
    notes: document.getElementById("notes").value.trim()
  };

  try {
    if (submitButton) {
      submitButton.disabled = true;
    }

    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error("فشل إرسال البيانات إلى Google Sheets.");
    }

    closeModal();
    await fetchProducts();

    alert("تم إرسال طلب الحفظ. تأكد من ظهور التعديل في البيانات.");
  } catch (error) {
    console.error("خطأ أثناء حفظ الدواء:", error);
    alert(
      "تعذر تأكيد الحفظ. راجع اتصال الإنترنت وتأكد من إعدادات Google Apps Script."
    );
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
    }
  }
}
