# Hướng Dẫn Tích Hợp và Triển Khai Blockchain Chấm Công

Tài liệu này sẽ giải thích chi tiết luồng hoạt động của hệ thống, cách kết nối Frontend/Backend với Blockchain và hướng dẫn bạn từng bước để thiết lập Smart Contract từ con số 0.

## 1. Luồng Hoạt Động (Project Flow)

Hệ thống hoạt động theo mô hình Hybrid (Kết hợp giữa Off-chain Database và On-chain Smart Contract):

1. **User (FE)**: Nhân viên mở ứng dụng web và nhấn nút "Check-in" hoặc "Check-out".
2. **Backend (API)**: 
   - Nhận yêu cầu từ FE.
   - Xác thực người dùng (vd: kiểm tra token đăng nhập).
   - Kiểm tra xem người này đã được gán ví (Wallet Address) hợp lệ chưa.
3. **Blockchain Interaction (BE -> Blockchain)**:
   - Backend sử dụng Private Key của một ví Admin (hoặc ví hệ thống) thông qua thư viện `Ethers.js`.
   - Backend gọi hàm `markAttendance` trên Smart Contract đã triển khai.
   - Trả về mã hash giao dịch (TxHash) cho FE để người dùng biết giao dịch đang được xử lý.
4. **Xác nhận**: Giao dịch được thợ đào (Miners) trên mạng lưới xác nhận. Dữ liệu ghi trên Blockchain (bất biến).

> **Lưu ý**: Trong phiên bản rút gọn này, chúng ta để Backend chịu phí Gas để ghi dữ liệu thay vì bắt mỗi nhân viên phải dùng ví Metamask để chấm công (giúp trải nghiệm người dùng mượt mà như app bình thường).

---

## 2. Cách Kết Nối Với Blockchain

Để kết nối Node.js Backend (hoặc React Frontend) với Blockchain, ta dùng thư viện **Ethers.js** (hoặc Web3.js).

### Các thành phần cần thiết để kết nối:
1. **RPC Provider (URL)**: Một đường link từ dịch vụ như *Alchemy*, *Infura*, hoặc *QuickNode* giúp ứng dụng của bạn giao tiếp với mạng lưới Blockchain (vd: mạng Polygon Amoy Testnet).
2. **Private Key**: Khóa bảo mật của ví dùng để ký và trả phí Gas cho các giao dịch ghi dữ liệu.
3. **Contract Address**: Địa chỉ của Smart Contract sau khi bạn deploy lên mạng.
4. **ABI (Application Binary Interface)**: Một mảng JSON định nghĩa cấu trúc các hàm của Smart Contract để code Javascript biết cách gọi.

**Đoạn code kết nối mẫu trong Node.js:**
```javascript
const { ethers } = require("ethers");
const contractABI = [...]; // Copy từ quá trình compile
const provider = new ethers.JsonRpcProvider("RPC_URL_CỦA_BẠN");
const wallet = new ethers.Wallet("PRIVATE_KEY_CỦA_BẠN", provider);
const contract = new ethers.Contract("ĐỊA_CHỈ_CONTRACT", contractABI, wallet);

// Gọi hàm ghi dữ liệu
const tx = await contract.markAttendance("Văn phòng A", true);
await tx.wait(); // Đợi giao dịch hoàn thành
```

---

## 3. Hướng Dẫn Làm Từ Đầu (Dành Cho Blockchain)

Hãy làm theo các bước sau để tự tay đưa Smart Contract của bạn lên mạng thử nghiệm (Testnet).

### Bước 3.1: Cài đặt Ví MetaMask và lấy Testnet Token
1. Tải tiện ích mở rộng [MetaMask](https://metamask.io/) và tạo một ví mới (Lưu kỹ 12 từ khóa bảo mật).
2. Mở ví MetaMask, vào mục Cài đặt (Settings) -> Mạng (Networks) -> Thêm mạng (Add Network).
3. Thêm mạng **Polygon Amoy Testnet**:
   - Network Name: Polygon Amoy Testnet
   - New RPC URL: `https://rpc-amoy.polygon.technology`
   - Chain ID: `80002`
   - Currency Symbol: `MATIC`
   - Block Explorer URL: `https://amoy.polygonscan.com/`
4. Copy địa chỉ ví của bạn, vào trang **Polygon Faucet** (ví dụ: `faucet.polygon.technology`), dán ví vào để xin một ít đồng MATIC thử nghiệm (dùng làm phí Gas).

### Bước 3.2: Viết và Biên Dịch Smart Contract trên Remix
1. Mở trình duyệt và truy cập: [Remix IDE](https://remix.ethereum.org/).
2. Trong thư mục `contracts`, tạo file mới tên `TimeAttendance.sol` và dán code Solidity vào (đoạn code ở mục 5 trong yêu cầu ban đầu của bạn).
3. Chuyển sang tab **Solidity Compiler** (biểu tượng chữ S bên trái). Chọn Compiler phiên bản `0.8.0` trở lên và nhấn **Compile TimeAttendance.sol**.
4. Lúc này, ở dưới cùng của tab Compile, bạn sẽ thấy mục **ABI**. Hãy nhấn vào biểu tượng copy để sao chép chuỗi JSON ABI và lưu ra file text trên máy (chúng ta sẽ cần nó cho Backend).

### Bước 3.3: Triển khai (Deploy) Smart Contract
1. Trong Remix, chuyển sang tab **Deploy & Run Transactions** (biểu tượng Ethereum).
2. Ở mục **Environment**, chọn `Injected Provider - MetaMask`. MetaMask sẽ hiện cửa sổ hỏi bạn cho phép kết nối, hãy chọn ví có MATIC testnet và xác nhận.
3. Đảm bảo mạng đang kết nối là **Polygon Amoy (Chain ID 80002)**.
4. Chọn đúng contract `TimeAttendance` ở mục Contract.
5. Nhấn nút **Deploy**. MetaMask sẽ hiện lên yêu cầu bạn trả một khoản phí Gas nhỏ bằng MATIC. Hãy nhấn **Xác nhận (Confirm)**.
6. Đợi khoảng 10-15 giây, khi giao dịch thành công, contract của bạn sẽ xuất hiện ở mục **Deployed Contracts** phía dưới cùng.
7. Click vào biểu tượng copy kế bên tên contract để sao chép **Contract Address**. Lưu địa chỉ này lại.

### Bước 3.4: Kết nối với Backend
Sau khi hoàn thành, bạn sẽ có 3 thứ quan trọng:
- **Private Key** của ví MetaMask (Lấy trong Cài đặt -> Bảo mật của ví MetaMask).
- **ABI** (Lấy từ Remix).
- **Contract Address** (Lấy từ Remix).

Trong dự án BE mà mình chuẩn bị tạo, chúng ta sẽ để các biến này vào file `.env`. Khi bạn đã sẵn sàng làm Blockchain thật, chỉ việc thay các giá trị giả bằng 3 giá trị trên là hệ thống sẽ chạy thật trên mạng lưới!
