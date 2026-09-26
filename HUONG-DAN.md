# Web Sỉ Bao Bì — hướng dẫn chạy

Web bán hàng + nhận đơn tư vấn qua Telegram. Khách chọn hàng, bỏ giỏ, bấm **Tư vấn đơn này**, điền tên + số Zalo → đơn gửi về Telegram của bạn.

## Chạy nhanh

Cần **Node.js 20** trở lên.

```bash
node server.js
```

Web chạy tại cổng `3000` (đổi bằng `PORT=8080 node server.js`).

Cấu hình đã sẵn trong `config.json`: mã quản trị, token bot và chat ID. Nếu muốn dùng biến môi trường thay vì file:

```bash
export TELEGRAM_BOT_TOKEN="token-cua-ban"
export TELEGRAM_CHAT_ID="123456789"
export ADMIN_PIN="ma-quan-tri"
node server.js
```

## Cấu trúc thư mục

```
baobiweb/
├── server.js          # server Node (không cần cài thêm package)
├── config.json        # mã quản trị, token bot, chat ID, thông tin kho
├── HUONG-DAN.md       # file này
├── data/
│   └── orders.jsonl   # đơn hàng (tự tạo khi có đơn)
└── public/            # toàn bộ file web — server chỉ đọc thư mục này
    ├── index.html     # trang bán hàng
    ├── quan-tri.html  # trang quản trị (đường dẫn /quan-tri)
    ├── app.js         # logic trang bán hàng
    ├── admin.js       # logic trang quản trị
    ├── data.js        # danh sách sản phẩm (sửa file này để thêm hàng)
    ├── styles.css     # giao diện
    ├── favicon.svg
    ├── robots.txt
    └── images/        # ảnh sản phẩm
```

> **Lưu ý quan trọng:** server chỉ đọc file trong `public/`. Nếu mở web bị trắng/404 thì kiểm tra xem các file có nằm đúng trong `public/` không.

## ⚠️ Bảo mật (đọc trước tiên)

1. **Token bot đã bị lộ** trong cuộc trò chuyện trao đổi với AI khi làm web này. Hãy vào Telegram → `@BotFather` → `/mybots` → chọn bot → **API Token** → **Revoke current token**, lấy token mới rồi dán trong `/quan-tri`. Ai có token cũ đều điều khiển được bot.
2. **Đổi mã quản trị** ngay sau khi vào được `/quan-tri` (ô "Đổi mã quản trị", tối thiểu 6 ký tự). Mã mặc định: `sibaobi2026`.
3. Token nằm trên server (file `config.json` hoặc biến môi trường), trình duyệt khách không thấy token. Không gửi token cho ai.

## Gắn bot Telegram (lần đầu)

1. Mở trang bán hàng, thêm `/quan-tri` vào cuối địa chỉ.
2. Nhập mã quản trị, bấm **Vào**.
3. Dán token, bấm **Kiểm tra bot**. Phải hiện `@tên_bot`.
4. Mở Telegram, nhắn `Xin chào` cho đúng bot đó (bấm Start trước nếu có).
5. Quay lại `/quan-tri`, bấm **Tìm chat ID**, chọn hội thoại của bạn.
6. Điền tên kho, số Zalo muốn hiện trên web, bấm **Lưu cấu hình**.
7. Bấm **Gửi tin thử**. Telegram phải nhận tin "Tin thử từ web Kho Sỉ Bao Bì".

Xong bước này form trên web mới gửi đơn sang Telegram được.

## Nhận đơn trong nhóm thay vì chat riêng

1. Tạo nhóm, thêm bot vào nhóm, gửi một tin trong nhóm.
2. Vào `/quan-tri`, bấm **Tìm chat ID**, chọn nhóm (số âm), lưu lại.
3. Nếu không thấy nhóm: BotFather → `/setprivacy` → chọn bot → **Disable**. Xoá bot khỏi nhóm, thêm lại, nhắn tin mới, tìm chat ID lại.

Chỉ bấm **Tạm tắt webhook** nếu bot đang gắn hệ thống khác và tìm chat không ra.

## Lỗi hay gặp

| Telegram / web báo | Cách xử lý |
| --- | --- |
| Token bot không dùng được | Copy lại token mới từ BotFather, không thừa dấu cách. |
| Không thấy chat ID / chat not found | Nhắn "Xin chào" cho bot trước, đợi vài giây, tìm lại. |
| Bot đang gắn webhook | Bấm tạm tắt webhook, nhắn lại bot, tìm chat ID. |
| Bot đã bị chặn | Mở bot, bấm Restart / bỏ chặn. |
| Kho chưa kết nối Telegram | Chưa lưu token hoặc chưa có chat ID. Làm lại phần trên. |
| Vào quản trị xong bị đá ra | Trang phải chạy bằng HTTPS khi đưa cho khách. |

Đơn vẫn được ghi trong trang quản trị, mục **Đơn gần đây**, kể cả khi Telegram lỗi — không mất khách.

## Sửa sản phẩm, ảnh, tên kho

- **Tên kho, số Zalo, địa chỉ, giờ làm:** sửa trong `/quan-tri`, bấm Lưu.
- **Size, màu, tên hàng:** sửa file `public/data.js` rồi tải lại trang.
- **Ảnh:** thay file trong `public/images/` (giữ tên file cũ hoặc sửa đường dẫn trong `data.js`). Ảnh vuông hoặc ngang đều được, web tự cắt vừa khung.

## Đưa lên máy chủ thật (24/7)

Thư mục `baobiweb/` cần Node.js 20. Bản chạy ở trình duyệt xem trước sẽ tắt theo phiên; muốn khách dùng 24/7 thì đưa lên VPS:

```bash
node server.js
```

Cần tên miền + HTTPS (Let's Encrypt). Nginx ví dụ:

```nginx
server {
    listen 443 ssl;
    server_name tenmien-cua-ban.vn;
    # ssl_certificate ...;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Chạy nền với systemd:

```ini
# /etc/systemd/system/baobi.service
[Unit]
Description=Web Si Bao Bi
After=network.target

[Service]
WorkingDirectory=/var/www/baobiweb
ExecStart=/usr/bin/node server.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now baobi
```

## Tối ưu SEO và Mobile đã hoàn thiện

- `lang="vi"`, title + description tối ưu từ khóa ngành sỉ bao bì TP.HCM, Open Graph + Twitter Card đầy đủ.
- JSON-LD chuẩn Schema.org: `LocalBusiness` / `WholesaleStore`, `WebSite` (SearchAction), `ItemList` (7 sản phẩm), `FAQPage` (Rich Snippets câu hỏi cho Google), `BreadcrumbList`.
- File `public/sitemap.xml` đã được tạo sẵn và liên kết trực tiếp trong `public/robots.txt`.
- Giao diện đạt chuẩn mobile-first:
  - **Không tràn viền (Zero overflow)**: cấu trúc `overflow-x: clip`, table có thanh cuộn riêng kèm chỉ dẫn.
  - **Vùng chạm tối thiểu 44px (Apple HIG & WCAG)**: Mọi nút bấm, tab lọc, phím chọn quy cách, stepper `+`/`-`, ô nhập liệu và nút đóng.
  - **Phím chọn nhanh số lượng sỉ (+10kg, +50kg, +100kg, +500 cái)** giúp khách sỉ đặt số lượng lớn cực nhanh.
  - **Thanh Dock cố định dưới di động**: Gọi Hotline + Chat Zalo + Mở Giỏ hàng nhanh chóng.

