/* ============================================================
   Kho Sỉ Bao Bì — admin.js
   Trang quản trị: đăng nhập bằng mã, gắn bot Telegram,
   chọn chat nhận đơn, sửa thông tin kho, xem đơn gần đây.
   ============================================================ */
(function () {
  "use strict";

  const $ = (sel) => document.querySelector(sel);
  const loginCard = $("#login-card");
  const dash = $("#dash");
  const adminMsg = $("#admin-msg");

  const esc = (value) =>
    String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  function showMsg(text, ok) {
    adminMsg.hidden = false;
    adminMsg.className = "msg " + (ok ? "ok" : "err");
    adminMsg.textContent = text;
  }

  async function api(url, options) {
    const res = await fetch(
      url,
      Object.assign(
        { headers: { "Content-Type": "application/json" } },
        options || {},
      ),
    );
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      loginCard.hidden = false;
      dash.hidden = true;
    }
    if (!res.ok || data.ok === false) {
      const err = new Error(data.error || "Không thực hiện được.");
      err.status = res.status;
      throw err;
    }
    return data;
  }

  function currentToken() {
    return $("#token").value.trim();
  }

  function fillBrand(brand) {
    $("#brand-name").value = brand.name || "";
    $("#brand-phone").value = (brand.phone || "").replace(/\s/g, "");
    $("#brand-address").value = brand.address || "";
    $("#brand-hours").value = brand.hours || "";
    $("#brand-area").value = brand.area || "";
  }

  function paintStatus(data) {
    const banner = $("#status-banner");
    if (data.configured) {
      banner.className = "banner ok";
      banner.textContent =
        "Đã kết nối. Bot @" +
        (data.botUsername || "bot") +
        " sẽ gửi đơn vào chat " +
        data.chatId +
        ".";
    } else if (data.hasToken) {
      banner.className = "banner";
      banner.textContent =
        "Đã có token" +
        (data.botUsername ? " (@" + data.botUsername + ")" : "") +
        " nhưng chưa chọn chat ID. Làm bước 3.";
    } else {
      banner.className = "banner";
      banner.textContent =
        "Chưa gắn bot. Làm lần lượt bước 2 và 3, rồi bấm Gửi tin thử.";
    }
    $("#bot-line").textContent = data.maskedToken
      ? "Token đang lưu: " + data.maskedToken
      : "Chưa lưu token.";
    if (data.chatId) $("#chat-id").value = data.chatId;
    if (data.brand) fillBrand(data.brand);
  }

  async function loadStatus() {
    const data = await api("/api/admin/status");
    loginCard.hidden = true;
    dash.hidden = false;
    paintStatus(data);
    return data;
  }

  async function loadOrders() {
    const data = await api("/api/admin/orders");
    const box = $("#orders");
    if (!data.orders.length) {
      box.innerHTML = "<p class='hint'>Chưa có đơn nào.</p>";
      return;
    }
    box.innerHTML = data.orders
      .map((order) => {
        const items = (order.items || [])
          .map((item) => {
            const bits = [item.size, item.color, item.spec, item.extra].filter(
              (x) => x && x !== "Theo kho tư vấn",
            );
            return (
              "<li><strong>" +
              esc(item.qty) +
              " " +
              esc(item.unit) +
              "</strong> " +
              esc(item.name) +
              (bits.length ? " · " + bits.map(esc).join(", ") : "") +
              "</li>"
            );
          })
          .join("");
        return (
          '<article class="order-card">' +
          "<header><div><strong>" +
          esc(order.name) +
          "</strong><div class='hint'>" +
          esc(order.timeLabel || "") +
          " · " +
          esc(order.phone) +
          "</div></div>" +
          '<span class="badge ' +
          (order.delivered ? "ok" : "no") +
          '">' +
          (order.delivered ? "Đã gửi Telegram" : "Chưa gửi Telegram") +
          "</span></header>" +
          (order.note ? "<p>Ghi chú: " + esc(order.note) + "</p>" : "") +
          (order.logo ? "<p>Cần in logo</p>" : "") +
          "<ul>" +
          items +
          "</ul>" +
          (order.telegramError && !order.delivered
            ? "<p class='hint'>" + esc(order.telegramError) + "</p>"
            : "") +
          "</article>"
        );
      })
      .join("");
  }

  /* ---------- Sự kiện ---------- */
  $("#login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    $("#login-error").hidden = true;
    try {
      await api("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ pin: event.target.pin.value }),
      });
      await loadStatus();
      await loadOrders();
    } catch (err) {
      $("#login-error").hidden = false;
      $("#login-error").textContent = err.message;
    }
  });

  $("#show-token").addEventListener("change", (event) => {
    $("#token").type = event.target.checked ? "text" : "password";
  });

  $("#check-btn").addEventListener("click", async () => {
    try {
      const data = await api("/api/admin/check", {
        method: "POST",
        body: JSON.stringify({ token: currentToken() }),
      });
      $("#bot-line").textContent =
        "Bot dùng được: @" +
        data.username +
        (data.name ? " · " + data.name : "") +
        ". Sang bước 3, nhắn tin cho bot này.";
      showMsg("Token đúng. Nhớ bấm Lưu cấu hình sau khi chọn chat ID.", true);
    } catch (err) {
      showMsg(err.message, false);
    }
  });

  $("#find-chats").addEventListener("click", async () => {
    const list = $("#chat-list");
    list.innerHTML = "<p class='hint'>Đang tìm hội thoại...</p>";
    try {
      const data = await api("/api/admin/chats", {
        method: "POST",
        body: JSON.stringify({ token: currentToken() }),
      });
      if (!data.chats.length) {
        list.innerHTML =
          "<p class='hint'>Chưa thấy hội thoại. Hãy nhắn “Xin chào” cho bot, đợi vài giây, bấm tìm lại. Nếu bot đang gắn webhook, bấm tạm tắt webhook rồi nhắn lại.</p>";
        return;
      }
      list.innerHTML = data.chats
        .map((chat) => {
          const who = chat.username ? "@" + chat.username : chat.type;
          return (
            '<button type="button" data-chat="' +
            esc(chat.id) +
            '"><strong>' +
            esc(chat.title) +
            "</strong><small>Chat ID: " +
            esc(chat.id) +
            " · " +
            esc(who) +
            "</small></button>"
          );
        })
        .join("");
    } catch (err) {
      list.innerHTML = "";
      showMsg(err.message, false);
    }
  });

  $("#chat-list").addEventListener("click", (event) => {
    const btn = event.target.closest("[data-chat]");
    if (!btn) return;
    $("#chat-id").value = btn.dataset.chat;
    $("#chat-list")
      .querySelectorAll("button")
      .forEach((el) => el.classList.toggle("on", el === btn));
    showMsg("Đã chọn chat " + btn.dataset.chat + ". Bấm Lưu cấu hình.", true);
  });

  $("#drop-webhook").addEventListener("click", async () => {
    if (
      !confirm(
        "Tắt webhook sẽ ngắt bot khỏi hệ thống khác đang dùng nó. Tiếp tục?",
      )
    )
      return;
    try {
      await api("/api/admin/delete-webhook", {
        method: "POST",
        body: JSON.stringify({ token: currentToken() }),
      });
      showMsg("Đã tắt webhook. Nhắn lại cho bot, rồi bấm Tìm chat ID.", true);
    } catch (err) {
      showMsg(err.message, false);
    }
  });

  $("#save-btn").addEventListener("click", async () => {
    try {
      const name = $("#brand-name").value;
      const data = await api("/api/admin/save", {
        method: "POST",
        body: JSON.stringify({
          token: currentToken(),
          chatId: $("#chat-id").value.trim(),
          newPin: $("#new-pin").value,
          brand: {
            name: name,
            shortName: name,
            phone: $("#brand-phone").value,
            address: $("#brand-address").value,
            hours: $("#brand-hours").value,
            area: $("#brand-area").value,
            tagline: "Túi, thùng, bìa — đủ size, đủ màu",
          },
        }),
      });
      $("#token").value = "";
      $("#new-pin").value = "";
      paintStatus(data);
      showMsg("Đã lưu. Bấm Gửi tin thử để chắc Telegram nhận được.", true);
    } catch (err) {
      showMsg(err.message, false);
    }
  });

  $("#test-btn").addEventListener("click", async () => {
    try {
      await api("/api/admin/test", { method: "POST", body: "{}" });
      showMsg("Đã gửi tin thử. Mở Telegram kiểm tra.", true);
    } catch (err) {
      showMsg(err.message, false);
    }
  });

  $("#logout-btn").addEventListener("click", async () => {
    await api("/api/admin/logout", { method: "POST", body: "{}" }).catch(
      () => {},
    );
    dash.hidden = true;
    loginCard.hidden = false;
  });

  $("#reload-orders").addEventListener("click", () => {
    loadOrders().catch((err) => showMsg(err.message, false));
  });

  /* ---------- Khởi tạo ---------- */
  loadStatus()
    .then(() => loadOrders())
    .catch((err) => {
      if (!loginCard.hidden) return;
      showMsg(err.message || "Không tải được dữ liệu.", false);
    });
})();
