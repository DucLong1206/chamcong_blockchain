# Hướng Dẫn Sử Dụng & Kết Nối Blockchain (Hệ Thống Chấm Công)

Tài liệu này hướng dẫn bạn cách quản trị hệ thống chấm công (thêm nhân viên, sửa dữ liệu) và các bước chi tiết để kết nối Backend Node.js với Smart Contract thực tế trên mạng thử nghiệm Ethereum (Sepolia Testnet).

---

## Phần 1: Quản Trị Hệ Thống (Dành cho Admin)

### 1. Đăng nhập và Phân quyền
Hệ thống hiện tại có 2 vai trò: **Admin** và **Nhân viên (User)**.
- **Tài khoản Admin mặc định:** 
  - Tên đăng nhập: `admin`
  - Mật khẩu: `123`
- **Tài khoản Nhân viên mẫu:**
  - Tên đăng nhập: `NV001` (hoặc `NV002`)
  - Mật khẩu: `123`

Nhân viên khi đăng nhập sẽ **chỉ thấy lịch sử của chính mình**. Admin khi đăng nhập sẽ **thấy toàn bộ lịch sử của tất cả mọi người** và có quyền chỉnh sửa.

### 2. Cách thêm Nhân viên mới
Hiện tại, danh sách nhân viên được lưu cứng trong file JSON để đảm bảo tính ổn định khi Backend khởi động lại.
Để thêm nhân viên mới:
1. Mở file `backend/users.json`.
2. Copy một block của nhân viên cũ và dán xuống dưới, sửa lại thông tin. Ví dụ:
```json
  {
    "username": "NV003",
    "password": "123",
    "role": "user",
    "fullName": "Lê Văn C"
  }
```
3. Lưu file lại. Nhân viên mới ngay lập tức có thể đăng nhập bằng tài khoản `NV003`.

### 3. Cách sửa đổi dữ liệu chấm công (Admin)
1. Đăng nhập bằng tài khoản Admin (`admin` / `123`).
2. Ở cột bên phải (Lịch sử chấm công), bạn sẽ thấy nút **Sửa** nằm cạnh mỗi dòng lịch sử.
3. Bấm vào nút **Sửa**, một cửa sổ (Modal) sẽ hiện lên.
4. Tại đây, bạn có thể đổi **Vị trí** hoặc **Trạng thái** (Check-in / Check-out).
5. Bấm **Lưu** để hệ thống cập nhật. Dữ liệu này được lưu vĩnh viễn vào file `backend/data.json`.

---

## Phần 2: Hướng Dẫn Kết Nối Blockchain (Testnet Sepolia ETH)

Hiện tại, backend đang dùng **"Mock Blockchain"** (chỉ in ra TxHash giả). Để kết nối với mạng lưới Blockchain thật (ví dụ mạng thử nghiệm Sepolia của Ethereum), bạn cần làm theo các bước sau:

### Bước 1: Chuẩn bị Ví và ETH Thử Nghiệm (Testnet Faucet)
1. Cài đặt tiện ích **MetaMask** trên trình duyệt (Chrome/Edge).
2. Mở MetaMask, đi tới **Cài đặt > Mạng (Networks)**, và bật hiển thị mạng thử nghiệm (Show test networks).
3. Chuyển mạng sang **Sepolia Testnet**.
4. Lấy địa chỉ ví MetaMask của bạn (Bắt đầu bằng `0x...`).
5. Truy cập các trang web Faucet để xin ETH thử nghiệm miễn phí:
   - [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
   - Hoặc [Infura Faucet](https://www.infura.io/faucet/sepolia)
   *(Lưu ý: Có thể bạn cần tạo tài khoản Alchemy/Infura để nhận ETH).*

### Bước 2: Deploy Smart Contract bằng Remix IDE
1. Mở trình duyệt web truy cập vào [Remix IDE](https://remix.ethereum.org/).
2. Tạo file mới tên `Attendance.sol` và dán code Solidity của bạn vào.
3. Chuyển sang tab **Solidity Compiler** (biểu tượng chữ S bên trái) -> Chọn phiên bản Compiler (ví dụ `0.8.19`) -> Bấm **Compile Attendance.sol**.
4. (Quan trọng): Ở dưới cùng của tab Compile, bấm vào **ABI** để copy cấu trúc Contract. Hãy dán tạm ABI này ra một file text trên máy bạn.
5. Chuyển sang tab **Deploy & Run Transactions** (biểu tượng Ethereum).
   - Ở mục **Environment**, chọn `Injected Provider - MetaMask`.
   - MetaMask sẽ bật lên, yêu cầu bạn kết nối. Hãy đồng ý.
   - Bấm nút **Deploy**. Bạn sẽ phải trả một ít phí gas (bằng Sepolia ETH).
6. Sau khi Deploy thành công, Contract sẽ xuất hiện ở mục "Deployed Contracts". Copy **Contract Address** (Địa chỉ Contract) và lưu lại.

### Bước 3: Lấy RPC URL và Private Key
Để Backend Node.js có thể tự động gọi Contract mà không cần MetaMask, nó cần 2 thứ:
1. **RPC URL**: Truy cập [Alchemy](https://www.alchemy.com/) hoặc [Infura](https://www.infura.io/), tạo một App mới chọn mạng Ethereum Sepolia. Copy đường link API Key (RPC URL) của họ. (Ví dụ: `https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY`).
2. **Private Key**: Mở MetaMask > Account Details > Show Private Key. **TUYỆT ĐỐI KHÔNG CHIA SẺ PRIVATE KEY NÀY CHO AI**. Hãy copy nó.

### Bước 4: Tích hợp vào Backend Node.js
Mở Terminal, chạy lệnh cài đặt thư viện ethers.js trong thư mục backend:
```bash
cd backend
npm install ethers
```

Mở file `backend/index.js`, cập nhật lại phần chấm công (POST /api/attendance) như sau:

```javascript
const { ethers } = require('ethers');

// Thông tin kết nối Blockchain
const RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY";
const PRIVATE_KEY = "PRIVATE_KEY_CỦA_BẠN"; // Nên để trong file .env
const CONTRACT_ADDRESS = "ĐỊA_CHỈ_CONTRACT_BẠN_VỪA_DEPLOY";
const CONTRACT_ABI = [ /* Dán cái ABI bạn copy ở Remix vào đây */ ];

// Khởi tạo Provider và Contract
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

// Cập nhật lại API
app.post('/api/attendance', async (req, res) => {
    const { worker, location, status } = req.body;
    
    // ... code lưu json ...

    try {
        // GỌI SMART CONTRACT THẬT TẠI ĐÂY
        console.log("Đang gửi giao dịch lên Blockchain...");
        const tx = await contract.markAttendance(location, status); // Tùy thuộc vào hàm trong Solidity của bạn
        await tx.wait(); // Đợi giao dịch được xác nhận trên mạng
        
        const realTxHash = tx.hash;
        
        newRecord.txHash = realTxHash; // Lưu hash thật vào JSON
        records.push(newRecord);
        writeData(dataFilePath, records);

        res.status(201).json({
            message: "Chấm công trên Blockchain thành công!",
            data: newRecord
        });
    } catch (error) {
        console.error("Lỗi Blockchain:", error);
        res.status(500).json({ error: "Lỗi kết nối Blockchain" });
    }
});
```

### Bước 5: Cách Kiểm Tra Lịch Sử (Giao dịch) trên Blockchain
Sau khi quá trình Check-in/Check-out thông qua MetaMask thành công:
1. Bạn sẽ thấy một mã giao dịch (TxHash) thật được lưu vào hệ thống, ví dụ: `0xd8c0017075fe67d5b...`
2. Để xem chi tiết giao dịch này trên Blockchain, bạn có thể bấm trực tiếp vào liên kết mã Hash trên giao diện Lịch Sử Chấm Công. Hệ thống sẽ mở ra trang web **Sepolia Etherscan**.
3. (Hoặc làm thủ công): Bạn copy mã TxHash đó và truy cập trang web [https://sepolia.etherscan.io/](https://sepolia.etherscan.io/). Dán mã TxHash vào ô tìm kiếm (Search) rồi nhấn Enter.
4. Ở trang chi tiết giao dịch, bạn sẽ thấy trạng thái `Success`, người gửi (Ví MetaMask của bạn), và ở mục **Input Data** (nếu bạn gửi dữ liệu) sẽ chứa trạng thái mà bạn vừa Check-in/Check-out.

> **Lưu ý:** Giao dịch chỉ là 0 ETH nên mục Value sẽ bằng 0, nhưng Blockchain sẽ đóng vai trò ghi nhận vĩnh viễn thời điểm (Timestamp) mà giao dịch đó được xác nhận.

Chúc bạn thành công với việc đưa dự án lên mạng lưới Ethereum Testnet!
