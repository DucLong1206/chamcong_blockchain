# Hướng Dẫn Chạy Dự Án (Run Guide)

Dự án được chia làm 2 phần: Backend (Cung cấp API và xử lý logic kết nối Blockchain/Fake Data) và Frontend (Giao diện người dùng Web).

## 📌 Yêu Cầu Cài Đặt Ban Đầu
- Máy tính của bạn cần cài đặt sẵn **Node.js** (Khuyên dùng bản LTS từ 18.x trở lên). Tải tại: [nodejs.org](https://nodejs.org/)

---

## 🖥 1. Khởi Chạy Backend (API Server)

Backend được xây dựng bằng `Node.js` + `Express`. Hiện tại nó sử dụng dữ liệu Mock (giả lập) lưu trong RAM.

1. Mở Terminal (Command Prompt hoặc PowerShell).
2. Di chuyển vào thư mục backend:
   ```bash
   cd d:\dnuer\conngheblockchain\chamcong_blockchain\backend
   ```
3. Cài đặt các thư viện cần thiết:
   ```bash
   npm install
   ```
4. Chạy server:
   ```bash
   npm run dev
   ```
5. Nếu thấy thông báo `Server is running on http://localhost:5000`, tức là Backend đã chạy thành công!

---

## 🎨 2. Khởi Chạy Frontend (Web UI)

Frontend được xây dựng bằng `React.js` (Vite) với thiết kế hiện đại, responsive.

1. Mở một cửa sổ Terminal **mới** (Hãy giữ Terminal của Backend chạy nền).
2. Di chuyển vào thư mục frontend:
   ```bash
   cd d:\dnuer\conngheblockchain\chamcong_blockchain\frontend
   ```
3. Cài đặt các thư viện cần thiết:
   ```bash
   npm install
   ```
4. Chạy server phát triển (Dev server):
   ```bash
   npm run dev
   ```
5. Terminal sẽ hiển thị đường link của web (thường là `http://localhost:5173`). Hãy `Ctrl + Click` hoặc copy link đó dán vào trình duyệt để xem giao diện.

---

## 🌟 Chức năng hiện có (Với Mock Data)

1. **Dashboard**: Giao diện tổng quan thống kê số ngày đi làm, đi trễ, và biểu đồ chấm công.
2. **Check-in/Check-out**: Nút bấm giả lập việc gọi API lên Backend. Backend sẽ xử lý và trả về phản hồi thành công cùng dữ liệu lưu trong mảng ảo (Mô phỏng Transaction của Blockchain).
3. **Lịch sử**: Xem danh sách các lần check-in/check-out được lấy từ API.

*Khi bạn hoàn thiện phần Smart Contract theo hướng dẫn trong `blockchain_guide.md`, chúng ta sẽ chỉnh sửa file xử lý API của Backend để thực sự bắn dữ liệu lên mạng lưới!*
