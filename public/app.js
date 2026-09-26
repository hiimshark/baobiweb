/* ============================================================
   Kho Sỉ Bao Bì TP.HCM — app.js
   Trang bán hàng & catalogue sỉ: giỏ hàng, bảng quy cách, phiếu tư vấn.
   ============================================================ */
(function () {
  "use strict";

  const CART_KEY = "kho-si-baobi-cart-v2";
  const LEAD_KEY = "kho-si-baobi-lead-v2";
  const products = window.PRODUCTS || [];
  const uses = window.USES || [];

  /* ---------- 1. Tiện ích ---------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) =>
    Array.from((root || document).querySelectorAll(sel));

  const esc = (value) =>
    String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const fold = (value) =>
    String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d");

  const formatQty = (n) => {
    const num = Number(n);
    if (!Number.isFinite(num)) return "";
    return num.toLocaleString("vi-VN", { maximumFractionDigits: 2 });
  };

  const validPhone = (raw) => {
    let digits = String(raw || "").replace(/[^\d+]/g, "");
    if (digits.startsWith("+84")) digits = "0" + digits.slice(3);
    else if (digits.startsWith("84") && digits.length >= 11)
      digits = "0" + digits.slice(2);
    return /^0(3|5|7|8|9)\d{8}$/.test(digits);
  };

  const swatchHtml = (color) => {
    if (!color) return "";
    if (!color.hex) return '<i class="swatch clear" title="Trong suốt"></i>';
    const hex = /^#[0-9a-fA-F]{3,8}$/.test(color.hex) ? color.hex : "#ccc";
    return (
      '<i class="swatch" style="background:' +
      hex +
      '" title="' +
      esc(color.name) +
      '"></i>'
    );
  };

  const variantText = (item) => {
    const parts = [item.size, item.color, item.spec];
    if (item.extra && item.extra !== "Theo kho tư vấn") parts.push(item.extra);
    return parts.filter(Boolean).join(" · ");
  };

  const findProduct = (id) => products.find((p) => p.id === id);

  /* ---------- 2. Trạng thái ứng dụng ---------- */
  const overlays = {
    product: $("#product-overlay"),
    cart: $("#cart-overlay"),
    consult: $("#consult-overlay"),
    sample: $("#sample-overlay"),
  };
  let cart = loadCart();
  let filter = "Tất cả";
  let query = "";
  let lastFocus = null;
  let toastTimer = 0;
  let sending = false;
  let draft = null;

  /* ---------- 3. Quản lý Giỏ hàng ---------- */
  function loadCart() {
    try {
      const raw = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      if (!Array.isArray(raw)) return [];
      return raw.filter(
        (item) => item && item.lineId && item.name && Number(item.qty) > 0,
      );
    } catch {
      return [];
    }
  }

  function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartUi();
  }

  function setQty(lineId, qty) {
    const item = cart.find((row) => row.lineId === lineId);
    if (!item) return;
    const min = Number(item.step) > 0 ? Number(item.step) : 1;
    const n = Math.round(Number(qty) * 100) / 100;
    if (!Number.isFinite(n) || n < min) {
      item.qty = min;
    } else {
      item.qty = Math.min(n, 1000000);
    }
    saveCart();
  }

  function addCurrent(product) {
    const qtyInput = $("#p-qty");
    const qty = Number(qtyInput ? qtyInput.value : draft.qty);
    if (!draft.size || !draft.color) return;
    if (!Number.isFinite(qty) || qty <= 0) {
      showToast("Vui lòng nhập số lượng hợp lệ.");
      return;
    }
    const item = {
      lineId: Math.random().toString(36).slice(2, 10),
      id: product.id,
      name: product.name,
      image: product.image,
      alt: product.alt,
      size: draft.size,
      color: draft.color,
      spec: draft.spec,
      specLabel: product.specLabel,
      extra: draft.extra,
      extraLabel: product.extraLabel,
      qty,
      unit: product.unit,
      step: product.step,
    };
    const key = [item.id, item.size, item.color, item.spec, item.extra].join(
      "|",
    );
    const existing = cart.find(
      (row) =>
        [row.id, row.size, row.color, row.spec, row.extra].join("|") === key,
    );
    if (existing) {
      existing.qty = Math.round((Number(existing.qty) + qty) * 100) / 100;
    } else {
      cart.push(item);
    }
    saveCart();
    showToast(
      "Đã thêm " +
        formatQty(qty) +
        " " +
        product.unit +
        " " +
        product.name +
        " vào giỏ!",
    );
    const btn = $("#add-btn");
    if (btn) {
      btn.textContent = "Đã thêm vào giỏ ✓";
      setTimeout(() => {
        if (btn) refreshAddButton(product);
      }, 1800);
    }
  }

  function updateCartUi() {
    const count = cart.length;
    const badge = $("#cart-count");
    if (badge) {
      badge.textContent = String(count);
      if (count > 0) {
        badge.classList.remove("pop");
        void badge.offsetWidth;
        badge.classList.add("pop");
      }
    }
    const dockCount = $("#dock-count");
    if (dockCount) dockCount.textContent = String(count);

    const cartTitle = $("#cart-title");
    if (cartTitle)
      cartTitle.textContent = count
        ? "Giỏ hàng (" + count + " món)"
        : "Giỏ hàng";

    const toConsultBtn = $("#to-consult");
    if (toConsultBtn) toConsultBtn.disabled = count === 0;

    const cartHint = $("#cart-hint");
    if (cartHint) {
      cartHint.textContent = count
        ? "Bấm nút trên để gửi yêu cầu. Kho sẽ liên hệ quý khách trước khi giao hàng."
        : "Thêm ít nhất 1 sản phẩm để gửi tư vấn báo giá.";
    }

    if (!overlays.cart.hidden) renderCart();
    if (!overlays.consult.hidden && $("#consult-success").hidden)
      renderSummary();
  }

  /* ---------- 4. Render Trang ---------- */
  let isProductsExpanded = false;
  const PRODUCT_LIMIT = 9;

  let isFiltersExpanded = false;
  const FILTER_LIMIT = 9;

  function renderFilters() {
    const filtersBox = $("#filters");
    if (!filtersBox) return;
    const categories = ["Tất cả"].concat(products.map((p) => p.filter));
    // Unique list
    const uniqueCategories = Array.from(new Set(categories));
    const displayCats =
      isFiltersExpanded || uniqueCategories.length <= FILTER_LIMIT
        ? uniqueCategories
        : uniqueCategories.slice(0, FILTER_LIMIT);

    let html = displayCats
      .map((name) => {
        const isSelected = name === filter;
        return (
          '<button type="button" class="filter-btn' +
          (isSelected ? " on" : "") +
          '" data-filter="' +
          esc(name) +
          '" role="tab" aria-selected="' +
          isSelected +
          '">' +
          esc(name) +
          "</button>"
        );
      })
      .join("");

    if (uniqueCategories.length > FILTER_LIMIT) {
      const remainingTags = uniqueCategories.length - FILTER_LIMIT;
      html += isFiltersExpanded
        ? '<button type="button" class="filter-btn filter-toggle-btn" id="filter-toggle-btn">Ẩn bớt ▴</button>'
        : '<button type="button" class="filter-btn filter-toggle-btn" id="filter-toggle-btn">+ Xem thêm (' +
          remainingTags +
          ") ▾</button>";
    }

    filtersBox.innerHTML = html;

    const toggleBtn = filtersBox.querySelector("#filter-toggle-btn");
    if (toggleBtn) {
      toggleBtn.onclick = (e) => {
        e.stopPropagation();
        isFiltersExpanded = !isFiltersExpanded;
        renderFilters();
      };
    }
  }

  function visibleProducts() {
    const q = fold(query.trim());
    return products.filter((p) => {
      if (filter !== "Tất cả" && p.filter !== filter) return false;
      if (!q) return true;
      const hay = fold(
        [p.name, p.aka, p.blurb, p.detail, p.uses, p.filter, p.sku].join(" "),
      );
      return hay.includes(q);
    });
  }

  function renderGrid() {
    const grid = $("#grid");
    if (!grid) return;
    const list = visibleProducts();
    const resultCountEl = $("#result-count");
    if (resultCountEl) {
      resultCountEl.textContent =
        "Hiển thị " + list.length + " dòng sản phẩm sỉ";
    }
    const emptyEl = $("#empty");
    if (emptyEl) emptyEl.hidden = list.length !== 0;

    const displayList =
      isProductsExpanded || list.length <= PRODUCT_LIMIT
        ? list
        : list.slice(0, PRODUCT_LIMIT);

    grid.innerHTML = displayList
      .map((p) => {
        const dots = p.colors.slice(0, 8).map(swatchHtml).join("");
        const isHot = p.badge && /bán chạy/i.test(p.badge);
        let badgeHtml = "";
        if (p.badge) {
          if (isHot) {
            const cleanText = p.badge.replace(/^🔥\s*/, "");
            badgeHtml =
              '<span class="card-badge card-badge-hot"><span class="badge-fire">🔥</span> ' +
              esc(cleanText) +
              "</span>";
          } else {
            badgeHtml = '<span class="card-badge">' + esc(p.badge) + "</span>";
          }
        }
        return (
          '<article class="card" id="card-' +
          esc(p.id) +
          '">' +
          '<div class="card-media">' +
          '<img src="' +
          esc(p.image) +
          '" alt="' +
          esc(p.alt) +
          '" loading="lazy" decoding="async" width="1200" height="655">' +
          badgeHtml +
          "</div>" +
          '<div class="card-body">' +
          '<div class="card-meta">' +
          '<span class="sku">' +
          esc(p.sku) +
          " · " +
          esc(p.filter) +
          "</span>" +
          '<span class="moq">' +
          esc(p.moq) +
          "</span>" +
          "</div>" +
          "<h3>" +
          esc(p.name) +
          "</h3>" +
          '<p class="clamp">' +
          esc(p.blurb) +
          "</p>" +
          '<div class="dots" aria-label="Bảng màu sẵn có">' +
          dots +
          "</div>" +
          '<div class="card-foot">' +
          '<button class="btn btn-primary" type="button" data-open="' +
          esc(p.id) +
          '" aria-label="Chọn size và màu cho ' +
          esc(p.name) +
          '">' +
          "<span>Chọn size & màu</span>" +
          '<svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/></svg>' +
          "</button>" +
          "</div>" +
          "</div>" +
          "</article>"
        );
      })
      .join("");

    let actionsBox = $("#grid-actions");
    if (!actionsBox) {
      actionsBox = document.createElement("div");
      actionsBox.id = "grid-actions";
      actionsBox.className = "grid-actions";
      grid.parentNode.insertBefore(actionsBox, grid.nextSibling);
    }

    if (list.length > PRODUCT_LIMIT) {
      actionsBox.hidden = false;
      const remaining = list.length - PRODUCT_LIMIT;
      actionsBox.innerHTML = isProductsExpanded
        ? '<button type="button" class="btn btn-outline-primary" id="toggle-products-btn">' +
          "<span>Ẩn bớt</span>" +
          '<svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clip-rule="evenodd"/></svg>' +
          "</button>"
        : '<button type="button" class="btn btn-outline-primary" id="toggle-products-btn">' +
          "<span>Xem thêm (" +
          remaining +
          " sản phẩm)</span>" +
          '<svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>' +
          "</button>";

      const btn = actionsBox.querySelector("#toggle-products-btn");
      if (btn) {
        btn.onclick = () => {
          if (isProductsExpanded) {
            isProductsExpanded = false;
            renderGrid();
            const anchor = $("#san-pham");
            if (anchor) anchor.scrollIntoView({ behavior: "smooth", block: "start" });
          } else {
            isProductsExpanded = true;
            renderGrid();
          }
        };
      }
    } else {
      actionsBox.hidden = true;
    }
  }

  function renderUses() {
    const useGrid = $("#use-grid");
    if (!useGrid) return;
    useGrid.innerHTML = uses
      .map((item) => {
        const product = findProduct(item.productId);
        const label = product ? product.name : "Xem dòng hàng";
        const icon = item.icon || "📦";
        return (
          '<button class="use-card" type="button" data-open="' +
          esc(item.productId) +
          '" aria-label="' +
          esc(item.title) +
          '">' +
          '<div class="use-header">' +
          '<span class="use-icon" aria-hidden="true">' +
          icon +
          "</span>" +
          "<strong>" +
          esc(item.title) +
          "</strong>" +
          "</div>" +
          "<span>" +
          esc(item.text) +
          "</span>" +
          "<em>" +
          esc(label) +
          " →</em>" +
          "</button>"
        );
      })
      .join("");
  }

  function renderSlip() {
    const slipList = $("#slip-list");
    if (!slipList) return;
    slipList.innerHTML = products
      .map((p, i) => {
        const n = String(i + 1).padStart(2, "0");
        return (
          '<li><button type="button" data-open="' +
          esc(p.id) +
          '" aria-label="Xem sản phẩm ' +
          esc(p.name) +
          '">' +
          "<span>" +
          n +
          "</span>" +
          "<strong>" +
          esc(p.name) +
          "</strong>" +
          '<em style="margin-left:auto;font-size:0.8rem;color:var(--muted);font-style:normal;">' +
          esc(p.moq) +
          "</em>" +
          "</button></li>"
        );
      })
      .join("");
  }

  function renderSizeTable() {
    const tbody = $("#size-table tbody");
    if (!tbody) return;
    tbody.innerHTML = products
      .map((p) => {
        const sizes = p.sizes
          .map((s) => "<span>" + esc(s) + "</span>")
          .join("");
        const colors = p.colors.map((c) => esc(c.name)).join(", ");
        return (
          "<tr>" +
          '<td><div class="col-prod-cell">' +
          '<button class="text-btn" type="button" data-open="' +
          esc(p.id) +
          '">' +
          esc(p.name) +
          '</button><div class="sku">' +
          esc(p.sku) +
          '</div><button class="btn btn-primary btn-mini-order" type="button" data-open="' +
          esc(p.id) +
          '">Đặt sỉ</button></div></td>' +
          '<td><div class="pills">' +
          sizes +
          "</div></td>" +
          "<td>" +
          colors +
          "</td>" +
          "<td><strong>" +
          esc(p.unit) +
          '</strong><div class="hint-small">' +
          esc(p.moq) +
          "</div></td>" +
          '<td><div class="col-action-cell">' +
          '<div class="action-prod-name">' +
          esc(p.name) +
          '</div><button class="btn btn-primary btn-small" type="button" data-open="' +
          esc(p.id) +
          '">Đặt sỉ</button></div></td>' +
          "</tr>"
        );
      })
      .join("");
  }

  function renderFooterLinks() {
    const footerLinks = $("#footer-links");
    if (!footerLinks) return;
    footerLinks.innerHTML = products
      .map(
        (p) =>
          '<li><button type="button" data-open="' +
          esc(p.id) +
          '">' +
          esc(p.name) +
          " (" +
          esc(p.unit) +
          ")</button></li>",
      )
      .join("");
  }

  function renderLine(item, mode) {
    return (
      '<article class="line" data-line="' +
      esc(item.lineId) +
      '">' +
      '<img src="' +
      esc(item.image) +
      '" alt="' +
      esc(item.name) +
      '" loading="lazy" decoding="async" width="68" height="68">' +
      "<div>" +
      "<strong>" +
      esc(item.name) +
      "</strong>" +
      '<p class="variant">' +
      esc(variantText(item)) +
      "</p>" +
      (mode === "stepper"
        ? '<div class="line-foot">' +
          '<div class="stepper">' +
          '<button type="button" data-dec="' +
          esc(item.lineId) +
          '" aria-label="Giảm số lượng">−</button>' +
          '<input type="number" min="' +
          (item.step || 1) +
          '" step="' +
          (item.step || 1) +
          '" value="' +
          item.qty +
          '" data-qty="' +
          esc(item.lineId) +
          '" aria-label="Số lượng">' +
          '<button type="button" data-inc="' +
          esc(item.lineId) +
          '" aria-label="Tăng số lượng">+</button>' +
          "</div>" +
          '<span class="unit-tag">' +
          esc(item.unit) +
          "</span>" +
          '<button class="remove" type="button" data-remove="' +
          esc(item.lineId) +
          '" aria-label="Xóa ' +
          esc(item.name) +
          '">Xoá</button>' +
          "</div>"
        : '<label class="field"><span>Số lượng muốn mua (' +
          esc(item.unit) +
          ")</span>" +
          '<div class="stepper" style="margin-top:4px;">' +
          '<button type="button" data-dec="' +
          esc(item.lineId) +
          '" aria-label="Giảm số lượng">−</button>' +
          '<input type="number" min="' +
          (item.step || 1) +
          '" step="' +
          (item.step || 1) +
          '" value="' +
          item.qty +
          '" data-cqty="' +
          esc(item.lineId) +
          '">' +
          '<button type="button" data-inc="' +
          esc(item.lineId) +
          '" aria-label="Tăng số lượng">+</button>' +
          '<span class="unit-tag" style="margin-left:8px;">' +
          esc(item.unit) +
          "</span>" +
          "</div>" +
          "</label>") +
      "</div>" +
      "</article>"
    );
  }

  function renderCart() {
    const body = $("#cart-body");
    if (!body) return;
    if (!cart.length) {
      body.innerHTML =
        '<div class="cart-empty">' +
        "<strong>Giỏ hàng đang trống</strong>" +
        "<p>Chưa có sản phẩm nào được chọn. Hãy chọn kích thước và màu sắc bạn cần rồi thêm vào giỏ.</p>" +
        '<button class="btn btn-primary" type="button" id="cart-shop">Khám phá catalogue hàng sẵn</button>' +
        "</div>";
      const shopBtn = $("#cart-shop");
      if (shopBtn) {
        shopBtn.addEventListener("click", () => {
          closeOverlay("cart");
          const target = $("#san-pham");
          if (target) target.scrollIntoView({ behavior: "smooth" });
        });
      }
      return;
    }
    body.innerHTML = cart.map((item) => renderLine(item, "stepper")).join("");
  }

  /* ---------- 5. Sheet Chọn Sản Phẩm & Quy cách ---------- */
  function choiceButtons(kind, values, selected) {
    return values
      .map((value) => {
        const label = typeof value === "string" ? value : value.name;
        const on = selected === label;
        const swatch = typeof value === "string" ? "" : swatchHtml(value);
        return (
          '<button type="button" class="choice' +
          (on ? " on" : "") +
          '" data-pick="' +
          kind +
          '" data-value="' +
          esc(label) +
          '" aria-pressed="' +
          on +
          '">' +
          swatch +
          "<span>" +
          esc(label) +
          "</span>" +
          "</button>"
        );
      })
      .join("");
  }

  function refreshAddButton(product) {
    const btn = $("#add-btn");
    if (!btn) return;
    const ready =
      draft.size && draft.color && (!product.specs.length || draft.spec);
    btn.disabled = !ready;
    if (ready) {
      btn.textContent =
        "Thêm " + formatQty(draft.qty) + " " + product.unit + " vào giỏ tư vấn";
    } else if (!draft.size) {
      btn.textContent = "Vui lòng chọn Kích thước";
    } else if (!draft.color) {
      btn.textContent = "Vui lòng chọn Màu sắc";
    } else {
      btn.textContent =
        "Vui lòng chọn " + (product.specLabel || "quy cách").toLowerCase();
    }
  }

  function openProduct(id) {
    const product = findProduct(id);
    if (!product) return;

    draft = {
      id: product.id,
      size: product.sizes.length === 1 ? product.sizes[0] : "",
      color: product.colors.length === 1 ? product.colors[0].name : "",
      spec:
        product.specs.length === 1 ? product.specs[0] : product.specs[0] || "",
      extra: product.extras[0] || "",
      qty: product.defaultQty || 10,
    };

    const specBlock = product.specs.length
      ? '<span class="pick-label">' +
        esc(product.specLabel) +
        '</span><div class="choices">' +
        choiceButtons("spec", product.specs, draft.spec) +
        "</div>"
      : "";

    const extraBlock = product.extras.length
      ? '<span class="pick-label">' +
        esc(product.extraLabel) +
        '</span><div class="choices">' +
        choiceButtons("extra", product.extras, draft.extra) +
        "</div>"
      : "";

    const presets = product.presets || [10, 20, 50, 100];
    const presetsHtml =
      '<div class="presets-wrap">' +
      '<p class="presets-title">⚡ Chọn nhanh số lượng sỉ:</p>' +
      '<div class="preset-btns">' +
      presets
        .map(
          (p) =>
            '<button type="button" class="preset-btn" data-preset="' +
            p +
            '">+' +
            formatQty(p) +
            " " +
            esc(product.unit) +
            "</button>",
        )
        .join("") +
      "</div>" +
      "</div>";

    const body = $("#product-body");
    if (!body) return;

    body.innerHTML =
      '<div class="product-layout">' +
      '<img src="' +
      esc(product.image) +
      '" alt="' +
      esc(product.alt) +
      '" loading="lazy" decoding="async" width="1200" height="655">' +
      '<div class="product-copy">' +
      '<div class="card-meta">' +
      '<span class="sku">' +
      esc(product.sku) +
      "</span>" +
      '<span class="moq">' +
      esc(product.moq) +
      "</span>" +
      "</div>" +
      '<h2 id="p-title">' +
      esc(product.name) +
      "</h2>" +
      "<p>" +
      esc(product.detail) +
      "</p>" +
      '<p class="hint-small"><strong>Phù hợp cho:</strong> ' +
      esc(product.uses) +
      "</p>" +
      '<span class="pick-label">1. Kích thước có sẵn (Size)</span>' +
      '<div class="choices">' +
      choiceButtons("size", product.sizes, draft.size) +
      "</div>" +
      '<span class="pick-label">2. Màu sắc</span>' +
      '<div class="choices">' +
      choiceButtons("color", product.colors, draft.color) +
      "</div>" +
      specBlock +
      extraBlock +
      '<div class="qty-row">' +
      '<label class="field"><span>3. Số lượng muốn mua (' +
      esc(product.unit) +
      ")</span>" +
      '<input id="p-qty" type="number" inputmode="decimal" min="' +
      (product.step || 1) +
      '" step="' +
      (product.step || 1) +
      '" value="' +
      draft.qty +
      '">' +
      "</label>" +
      presetsHtml +
      "</div>" +
      '<p class="hint-small">' +
      esc(product.unitNote) +
      "</p>" +
      '<button class="btn btn-primary add-btn" type="button" id="add-btn" disabled>Vui lòng chọn size và màu</button>' +
      '<p class="hint-small" style="text-align:center;margin-top:8px;">💡 Nếu bạn muốn lấy nhiều màu/size, hãy thêm từng loại vào giỏ.</p>' +
      "</div>" +
      "</div>";

    // Handle variant selection
    body.querySelectorAll("[data-pick]").forEach((btn) => {
      btn.addEventListener("click", () => {
        draft[btn.dataset.pick] = btn.dataset.value;
        body
          .querySelectorAll('[data-pick="' + btn.dataset.pick + '"]')
          .forEach((el) => {
            const on = el === btn;
            el.classList.toggle("on", on);
            el.setAttribute("aria-pressed", on ? "true" : "false");
          });
        refreshAddButton(product);
      });
    });

    // Handle wholesale preset quantity buttons
    body.querySelectorAll("[data-preset]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const qtyInput = $("#p-qty");
        const presetVal = Number(btn.dataset.preset);
        if (qtyInput && Number.isFinite(presetVal)) {
          qtyInput.value = String(presetVal);
          draft.qty = presetVal;
          refreshAddButton(product);
        }
      });
    });

    // Handle input quantity
    const qtyInput = $("#p-qty");
    if (qtyInput) {
      qtyInput.addEventListener("input", () => {
        draft.qty = Number(qtyInput.value) || product.defaultQty || 1;
        refreshAddButton(product);
      });
    }

    const addBtn = $("#add-btn");
    if (addBtn) addBtn.addEventListener("click", () => addCurrent(product));

    refreshAddButton(product);
    if (!overlays.cart.hidden) closeOverlay("cart");
    openOverlay("product");
  }

  /* ---------- 6. Drawer Giỏ Hàng ---------- */
  function openCart() {
    const toast = $("#toast");
    if (toast) toast.hidden = true;
    closeOverlay("product");
    renderCart();
    openOverlay("cart");
    if (cart.length) {
      const toConsult = $("#to-consult");
      if (toConsult) toConsult.focus();
    }
  }

  /* ---------- 7. Form Tư Vấn & Báo Giá ---------- */
  function renderConsultLines() {
    const box = $("#consult-lines");
    if (!box) return;
    box.innerHTML = cart.map((item) => renderLine(item, "consult")).join("");
    box.querySelectorAll("[data-cqty]").forEach((input) => {
      input.addEventListener("input", () => {
        const item = cart.find((row) => row.lineId === input.dataset.cqty);
        const n = Number(input.value);
        if (item && Number.isFinite(n) && n > 0) item.qty = n;
        renderSummary();
      });
      input.addEventListener("change", () => saveCart());
    });
    renderSummary();
  }

  function renderSummary() {
    const box = $("#consult-summary");
    if (!box) return;
    if (!cart.length) {
      box.textContent = "";
      return;
    }
    box.innerHTML =
      "<strong>Đơn hàng gồm:</strong> " +
      cart
        .map(
          (item) =>
            formatQty(item.qty) +
            " " +
            item.unit +
            " " +
            item.name +
            " (" +
            item.size +
            ")",
        )
        .join(" · ");
  }

  function openConsult() {
    if (!cart.length) return;
    const formErr = $("#form-error");
    if (formErr) formErr.hidden = true;
    const form = $("#consult-form");
    if (form) form.hidden = false;
    const successBox = $("#consult-success");
    if (successBox) successBox.hidden = true;

    try {
      const lead = JSON.parse(sessionStorage.getItem(LEAD_KEY) || "{}");
      if (lead.name && form.name) form.name.value = lead.name;
      if (lead.phone && form.phone) form.phone.value = lead.phone;
    } catch {}

    renderConsultLines();
    openOverlay("consult");
    if (form && form.name) form.name.focus();
  }

  function showFormError(text) {
    const box = $("#form-error");
    if (!box) return;
    box.hidden = false;
    box.textContent = text;
    box.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  async function submitConsult(event) {
    event.preventDefault();
    if (sending) return;
    const form = $("#consult-form");
    if (!form) return;
    const formErr = $("#form-error");
    if (formErr) formErr.hidden = true;

    const name = (form.name ? form.name.value : "").trim();
    const phone = (form.phone ? form.phone.value : "").trim();
    const note = (form.note ? form.note.value : "").trim();
    const logo = form.logo ? form.logo.checked : false;

    if (name.length < 2)
      return showFormError("Vui lòng nhập tên của bạn hoặc tên shop.");
    if (!validPhone(phone))
      return showFormError(
        "Số điện thoại Zalo chưa đúng. Vui lòng nhập 10 chữ số (ví dụ 0901234567).",
      );
    if (!cart.length)
      return showFormError(
        "Giỏ hàng đang trống. Bạn vui lòng chọn sản phẩm trước khi gửi.",
      );
    if (cart.some((item) => !(Number(item.qty) > 0)))
      return showFormError("Số lượng sản phẩm muốn mua chưa hợp lệ.");

    sessionStorage.setItem(LEAD_KEY, JSON.stringify({ name, phone }));

    const payload = {
      name,
      phone,
      note,
      logo,
      hp_field: form.hp_field ? form.hp_field.value : "",
      items: cart.map((item) => ({
        id: item.id,
        name: item.name,
        size: item.size,
        color: item.color,
        spec: item.spec,
        specLabel: item.specLabel,
        extra: item.extra,
        extraLabel: item.extraLabel,
        qty: Number(item.qty),
        unit: item.unit,
      })),
      turnstileToken: form.querySelector('[name="cf-turnstile-response"]')?.value || "",
    };

    const submitBtn = $("#submit-btn");
    sending = true;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Đang gửi đơn tới kho...";
    }

    try {
      const res = await fetch("/api/tu-van", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!data.ok && !data.saved)
        throw new Error(
          data.error ||
            "Không thể gửi đơn lúc này. Vui lòng thử lại hoặc gọi Hotline.",
        );

      const successName = $("#success-name");
      if (successName) successName.textContent = name;
      const successPhone = $("#success-phone");
      if (successPhone) successPhone.textContent = phone;

      cart = [];
      saveCart();
      form.hidden = true;
      const successBox = $("#consult-success");
      if (successBox) successBox.hidden = false;
      closeOverlay("cart");
      if (window.turnstile) {
        try {
          window.turnstile.reset("#turnstile-consult");
        } catch {}
      }
    } catch (err) {
      showFormError(
        err.message ||
          "Không thể gửi đơn. Vui lòng liên hệ trực tiếp qua Zalo/Hotline.",
      );
      if (window.turnstile) {
        try {
          window.turnstile.reset("#turnstile-consult");
        } catch {}
      }
    } finally {
      sending = false;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Gửi yêu cầu báo giá ngay";
      }
    }
  }

  /* ---------- 7.2 Đăng Ký Nhận Mẫu Thử (Tách biệt giỏ hàng) ---------- */
  const DEFAULT_SAMPLE_PRODUCTS = [
    {
      productId: "tui-xoai",
      selected: true,
      qty: 1,
      size: "20×30 cm",
      note: "Shop quần áo, mỹ phẩm",
    },
    {
      productId: "thung-carton",
      selected: true,
      qty: 1,
      size: "30×30×20 cm",
      note: "Đóng gói bưu cục, TMĐT",
    },
    {
      productId: "tui-dan-mieng",
      selected: true,
      qty: 1,
      size: "15×22 cm",
      note: "Phụ kiện, linh kiện",
    },
  ];

  let sampleState = JSON.parse(JSON.stringify(DEFAULT_SAMPLE_PRODUCTS));

  function openSampleModal() {
    const successBox = $("#sample-success");
    if (successBox) successBox.hidden = true;
    const contentBox = $("#sample-content");
    if (contentBox) contentBox.hidden = false;
    const formErr = $("#sample-form-error");
    if (formErr) formErr.hidden = true;

    const form = $("#sample-form");
    if (form) {
      try {
        const lead = JSON.parse(sessionStorage.getItem(LEAD_KEY) || "{}");
        if (lead.name && form.name) form.name.value = lead.name;
        if (lead.phone && form.phone) form.phone.value = lead.phone;
      } catch {}
    }

    renderSampleProducts();
    openOverlay("sample");
  }

  function renderSampleProducts() {
    const list = $("#sample-products-list");
    if (!list) return;

    list.innerHTML = sampleState
      .map((item, idx) => {
        const product = findProduct(item.productId);
        if (!product) return "";
        const isSel = item.selected;
        const isHot = product.badge && /bán chạy/i.test(product.badge);
        return (
          '<div class="sample-item' +
          (isSel ? " selected" : "") +
          '" data-sample-idx="' +
          idx +
          '">' +
          '<input type="checkbox" class="sample-check" data-check-idx="' +
          idx +
          '"' +
          (isSel ? " checked" : "") +
          ' aria-label="Chọn mẫu ' +
          esc(product.name) +
          '">' +
          '<img class="sample-thumb" src="' +
          esc(product.image) +
          '" alt="' +
          esc(product.name) +
          '">' +
          '<div class="sample-info">' +
          '<div class="sample-name">' +
          esc(product.name) +
          "</div>" +
          '<div class="sample-tagline">' +
          esc(item.note) +
          " · Size mẫu: " +
          esc(item.size) +
          "</div>" +
          (isHot
            ? '<span class="sample-badge-tag sample-badge-hot">🔥 Bán chạy nhất</span>'
            : '<span class="sample-badge-tag">Hàng mẫu có sẵn</span>') +
          "</div>" +
          '<div class="sample-stepper">' +
          '<button type="button" class="sample-step-btn" data-dec-idx="' +
          idx +
          '"' +
          (!isSel || item.qty <= 1 ? " disabled" : "") +
          ' aria-label="Giảm mẫu">−</button>' +
          '<span class="sample-qty-val">' +
          item.qty +
          "</span>" +
          '<button type="button" class="sample-step-btn" data-inc-idx="' +
          idx +
          '"' +
          (!isSel || item.qty >= 5 ? " disabled" : "") +
          ' aria-label="Tăng mẫu">+</button>' +
          '<span class="sample-unit-lbl">mẫu</span>' +
          "</div>" +
          "</div>"
        );
      })
      .join("");

    list.querySelectorAll("[data-check-idx]").forEach((chk) => {
      chk.addEventListener("change", () => {
        const i = Number(chk.getAttribute("data-check-idx"));
        sampleState[i].selected = chk.checked;
        renderSampleProducts();
      });
    });

    list.querySelectorAll("[data-dec-idx]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const i = Number(btn.getAttribute("data-dec-idx"));
        if (sampleState[i].qty > 1) {
          sampleState[i].qty -= 1;
          renderSampleProducts();
        }
      });
    });

    list.querySelectorAll("[data-inc-idx]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const i = Number(btn.getAttribute("data-inc-idx"));
        if (sampleState[i].qty < 5) {
          sampleState[i].qty += 1;
          renderSampleProducts();
        }
      });
    });
  }

  async function submitSampleForm(event) {
    event.preventDefault();
    if (sending) return;
    const form = $("#sample-form");
    if (!form) return;
    const formErr = $("#sample-form-error");
    if (formErr) formErr.hidden = true;

    const name = (form.name ? form.name.value : "").trim();
    const phone = (form.phone ? form.phone.value : "").trim();
    const address = (form.address ? form.address.value : "").trim();
    const note = (form.note ? form.note.value : "").trim();

    if (name.length < 2) {
      if (formErr) {
        formErr.hidden = false;
        formErr.textContent = "Vui lòng nhập tên của bạn hoặc tên shop.";
      }
      return;
    }
    if (!validPhone(phone)) {
      if (formErr) {
        formErr.hidden = false;
        formErr.textContent = "Số điện thoại Zalo chưa đúng (vui lòng nhập 10 số).";
      }
      return;
    }
    if (address.length < 5) {
      if (formErr) {
        formErr.hidden = false;
        formErr.textContent = "Vui lòng nhập địa chỉ nhận mẫu để kho gửi bưu tá giao tận nơi.";
      }
      return;
    }

    const selectedSamples = sampleState.filter((s) => s.selected && s.qty > 0);
    if (!selectedSamples.length) {
      if (formErr) {
        formErr.hidden = false;
        formErr.textContent = "Vui lòng chọn ít nhất 1 sản phẩm bạn muốn nhận mẫu.";
      }
      return;
    }

    sessionStorage.setItem(LEAD_KEY, JSON.stringify({ name, phone }));

    const items = selectedSamples.map((s) => {
      const p = findProduct(s.productId);
      return {
        id: s.productId,
        name: (p ? p.name : s.productId) + " (Mẫu thử)",
        size: s.size,
        color: "Mẫu chuẩn kho",
        spec: "Mẫu dùng thử",
        qty: Number(s.qty),
        unit: "mẫu",
      };
    });

    const payload = {
      name,
      phone,
      address,
      note: "ĐỊA CHỈ NHẬN MẪU: " + address + (note ? "\nGhi chú: " + note : ""),
      isSample: true,
      logo: false,
      items,
      turnstileToken: form.querySelector('[name="cf-turnstile-response"]')?.value || "",
    };

    const submitBtn = $("#sample-submit-btn");
    sending = true;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Đang gửi yêu cầu nhận mẫu...";
    }

    try {
      const res = await fetch("/api/tu-van", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!data.ok && !data.saved)
        throw new Error(
          data.error || "Không thể gửi yêu cầu lúc này. Vui lòng thử lại sau.",
        );

      const successName = $("#sample-success-name");
      if (successName) successName.textContent = name;
      const successPhone = $("#sample-success-phone");
      if (successPhone) successPhone.textContent = phone;

      // Không chạm vào giỏ hàng thông thường!
      const contentBox = $("#sample-content");
      if (contentBox) contentBox.hidden = true;
      const successBox = $("#sample-success");
      if (successBox) successBox.hidden = false;
      if (window.turnstile) {
        try {
          window.turnstile.reset("#turnstile-sample");
        } catch {}
      }
    } catch (err) {
      if (formErr) {
        formErr.hidden = false;
        formErr.textContent = err.message || "Có lỗi xảy ra khi gửi yêu cầu.";
      }
      if (window.turnstile) {
        try {
          window.turnstile.reset("#turnstile-sample");
        } catch {}
      }
    } finally {
      sending = false;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML =
          '<span>Gửi yêu cầu nhận mẫu miễn phí</span><svg viewBox="0 0 20 20" width="18" height="18" fill="currentColor"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>';
      }
    }
  }

  /* ---------- 8. Thương Hiệu & Site Config ---------- */
  function applyBrand(brand) {
    if (!brand) return;
    $$("[data-brand]").forEach((el) => {
      const key = el.dataset.brand;
      if (brand[key]) el.textContent = brand[key];
    });

    const phone = (brand.phone || "").trim();
    $$("[data-needs-phone]").forEach((el) => {
      el.hidden = !phone;
      if (phone && el.tagName === "A" && !el.hasAttribute("data-zalo")) {
        el.href = "tel:" + phone.replace(/\s/g, "");
      }
    });

    $$("[data-zalo]").forEach((el) => {
      if (!phone) return;
      el.href = "https://zalo.me/" + phone.replace(/\D/g, "");
      el.target = "_blank";
      el.rel = "noopener";
    });

    if (brand.name) {
      document.title =
        brand.name +
        " — Tổng Kho Sỉ Bao Bì TP.HCM (Túi Xoài, Thùng Carton, Túi PE/OPP)";
    }
  }

  async function loadSite() {
    try {
      const res = await fetch("/api/site");
      const data = await res.json();
      applyBrand(data.brand);
    } catch {
      /* Giữ mặc định */
    }
  }

  /* ---------- 9. Toast Notification ---------- */
  function showToast(text) {
    const toast = $("#toast");
    if (!toast) return;
    toast.hidden = false;
    toast.innerHTML =
      "<span>" +
      esc(text) +
      "</span>" +
      '<button type="button" id="toast-cart" aria-label="Xem giỏ hàng">Xem giỏ</button>';
    const toastCart = $("#toast-cart");
    if (toastCart) toastCart.addEventListener("click", openCart);

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.hidden = true;
    }, 3800);
  }

  /* ---------- 10. Overlay Manager (Không tràn viền, Lock scroll) ---------- */
  function anyOpen() {
    return Object.values(overlays).some((el) => el && !el.hidden);
  }

  function lockScroll() {
    document.body.classList.toggle("lock", anyOpen());
  }

  function openOverlay(name) {
    if (!overlays[name]) return;
    lastFocus = document.activeElement;
    overlays[name].hidden = false;
    lockScroll();
    const focusable = overlays[name].querySelector(
      "input, textarea, button:not(.sheet-close)",
    );
    if (focusable) focusable.focus({ preventScroll: true });
  }

  function closeOverlay(name) {
    if (!overlays[name]) return;
    overlays[name].hidden = true;
    lockScroll();
    if (lastFocus && typeof lastFocus.focus === "function") {
      lastFocus.focus({ preventScroll: true });
    }
  }

  // Accessibility: Tab trap trong modal mở
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    const openName = Object.keys(overlays).find(
      (n) => overlays[n] && !overlays[n].hidden,
    );
    if (!openName) return;
    const sheet = overlays[openName].querySelector(".sheet, .drawer");
    if (!sheet) return;
    const focusables = Array.from(
      sheet.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => el.offsetParent !== null);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  /* ---------- 11. Sự Kiện Toàn Cục ---------- */
  document.addEventListener("click", (event) => {
    // Open product
    const openBtn = event.target.closest("[data-open]");
    if (openBtn) {
      openProduct(openBtn.dataset.open);
      const nav = $("#nav");
      if (nav) nav.classList.remove("open");
      return;
    }

    // Close overlay
    const closer = event.target.closest("[data-close]");
    if (closer) {
      const name = closer.dataset.close;
      closeOverlay(name);
      if (name === "consult" && !$("#consult-success").hidden) {
        const form = $("#consult-form");
        if (form) {
          form.reset();
          form.hidden = false;
        }
        const successBox = $("#consult-success");
        if (successBox) successBox.hidden = true;
      }
      return;
    }

    // Stepper decrement
    const dec = event.target.closest("[data-dec]");
    if (dec) {
      const item = cart.find((row) => row.lineId === dec.dataset.dec);
      if (item) setQty(item.lineId, Number(item.qty) - Number(item.step || 1));
      return;
    }

    // Stepper increment
    const inc = event.target.closest("[data-inc]");
    if (inc) {
      const item = cart.find((row) => row.lineId === inc.dataset.inc);
      if (item) setQty(item.lineId, Number(item.qty) + Number(item.step || 1));
      return;
    }

    // Remove item
    const remove = event.target.closest("[data-remove]");
    if (remove) {
      cart = cart.filter((row) => row.lineId !== remove.dataset.remove);
      saveCart();
      return;
    }

    // Note suggestion chip clicked
    const chipBtn = event.target.closest(".chip-btn");
    if (chipBtn) {
      const form = $("#consult-form");
      if (form && form.note) {
        const text = chipBtn.dataset.chip || chipBtn.textContent.trim();
        const currentVal = form.note.value.trim();
        if (currentVal) {
          if (!currentVal.includes(text))
            form.note.value = currentVal + ", " + text;
        } else {
          form.note.value = text;
        }
        form.note.focus();
      }
      return;
    }
  });

  // Cart quantity input change
  const cartBody = $("#cart-body");
  if (cartBody) {
    cartBody.addEventListener("change", (event) => {
      const input = event.target.closest("[data-qty]");
      if (input) setQty(input.dataset.qty, input.value);
    });
  }

  // Filter tabs click
  const filtersBox = $("#filters");
  if (filtersBox) {
    filtersBox.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-filter]");
      if (!btn) return;
      filter = btn.dataset.filter;
      renderFilters();
      renderGrid();
    });
  }

  // Search input & clear button
  const searchInput = $("#search");
  const searchClear = $("#search-clear");
  if (searchInput) {
    searchInput.addEventListener("input", (event) => {
      query = event.target.value;
      if (searchClear) searchClear.hidden = !query;
      renderGrid();
    });
  }
  if (searchClear) {
    searchClear.addEventListener("click", () => {
      if (searchInput) {
        searchInput.value = "";
        query = "";
        searchClear.hidden = true;
        searchInput.focus();
        renderGrid();
      }
    });
  }

  // Reset filter button in empty state
  const resetFilterBtn = $("#reset-filter");
  if (resetFilterBtn) {
    resetFilterBtn.addEventListener("click", () => {
      filter = "Tất cả";
      query = "";
      if (searchInput) searchInput.value = "";
      if (searchClear) searchClear.hidden = true;
      renderFilters();
      renderGrid();
    });
  }

  // Open cart buttons
  [
    "#open-cart",
    "#hero-cart",
    "#use-closer-cart",
    "#footer-cart",
    "#dock-cart",
  ].forEach((sel) => {
    const el = $(sel);
    if (el) el.addEventListener("click", openCart);
  });

  // Open sample modal (ở cuối trang, tách biệt giỏ hàng)
  ["#closer-sample", "#closer-cart"].forEach((sel) => {
    const el = $(sel);
    if (el) el.addEventListener("click", openSampleModal);
  });

  const sampleForm = $("#sample-form");
  if (sampleForm) {
    sampleForm.addEventListener("submit", submitSampleForm);
  }

  const toConsultBtn = $("#to-consult");
  if (toConsultBtn) toConsultBtn.addEventListener("click", openConsult);

  const backCartBtn = $("#back-cart");
  if (backCartBtn) {
    backCartBtn.addEventListener("click", () => {
      closeOverlay("consult");
      openCart();
    });
  }

  const consultForm = $("#consult-form");
  if (consultForm) {
    consultForm.addEventListener("submit", submitConsult);
    consultForm.addEventListener("input", () => {
      if (consultForm.name.value || consultForm.phone.value) {
        sessionStorage.setItem(
          LEAD_KEY,
          JSON.stringify({
            name: consultForm.name.value,
            phone: consultForm.phone.value,
          }),
        );
      }
    });
  }

  // Click outside to close overlay
  Object.entries(overlays).forEach(([name, el]) => {
    if (el) {
      el.addEventListener("click", (event) => {
        if (event.target === el) closeOverlay(name);
      });
    }
  });

  // ESC key to close overlay
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (overlays.sample && !overlays.sample.hidden)
      return closeOverlay("sample");
    if (overlays.consult && !overlays.consult.hidden)
      return closeOverlay("consult");
    if (overlays.product && !overlays.product.hidden)
      return closeOverlay("product");
    if (overlays.cart && !overlays.cart.hidden) return closeOverlay("cart");
  });

  // Menu burger toggle
  const menuBtn = $("#menu-btn");
  const nav = $("#nav");
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) nav.classList.remove("open");
    });
  }

  // Header scroll shadow
  window.addEventListener(
    "scroll",
    () => {
      const header = $("#header");
      if (header) header.classList.toggle("scrolled", window.scrollY > 8);
    },
    { passive: true },
  );

  // Scroll Reveal Animations
  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  if (!prefersReduced && "IntersectionObserver" in window) {
    document.documentElement.classList.add("js");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.05 },
    );
    $$("[data-reveal]").forEach((el) => io.observe(el));
  }

  /* ---------- Nút quay lại đầu trang ---------- */
  const backToTopBtn = $("#back-to-top");
  if (backToTopBtn) {
    let scrollTicking = false;
    window.addEventListener(
      "scroll",
      () => {
        if (!scrollTicking) {
          window.requestAnimationFrame(() => {
            if (window.scrollY > 300) {
              backToTopBtn.classList.add("show");
            } else {
              backToTopBtn.classList.remove("show");
            }
            scrollTicking = false;
          });
          scrollTicking = true;
        }
      },
      { passive: true },
    );

    backToTopBtn.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  }

  /* ---------- 12. Khởi tạo ---------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  renderFilters();
  renderGrid();
  renderUses();
  renderSlip();
  renderSizeTable();
  renderFooterLinks();
  updateCartUi();
  loadSite();
})();
