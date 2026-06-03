const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers'); // Import thư viện Web3
const app = express();


app.use(cors());
app.use(express.json());

const PORT = 5000;

const dataFilePath = path.join(__dirname, 'data.json');
const usersFilePath = path.join(__dirname, 'users.json');

// Helper functions for reading/writing JSON
function readData(filePath) {
    try {
        if (!fs.existsSync(filePath)) return [];
        const data = fs.readFileSync(filePath, 'utf8');
        return data ? JSON.parse(data) : [];
    } catch (err) {
        console.error("Lỗi đọc file:", err);
        return [];
    }
}

function writeData(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
        console.error("Lỗi ghi file:", err);
    }
}

// 1. API Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const users = readData(usersFilePath);

    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        res.json({ message: "Đăng nhập thành công", user: { username: user.username, role: user.role, fullName: user.fullName } });
    } else {
        res.status(401).json({ error: "Sai tên đăng nhập hoặc mật khẩu" });
    }
});

// 2. Get all records (History)
app.get('/api/attendance', (req, res) => {
    const records = readData(dataFilePath);
    res.json(records);
});

// Cấu hình ví Server (Backend Auto-Sign)
const RPC_URL = "https://ethereum-sepolia.publicnode.com"; // Cổng kết nối dự phòng ổn định hơn
// 🔴 BẠN HÃY THAY PRIVATE KEY CỦA VÍ BẠN VÀO ĐÂY (Ví phải có Sepolia ETH)
const SERVER_PRIVATE_KEY = "5e532a7d0161b2c03117712810661a515d3625b4ff71563e5e540014290631c1";
const CONTRACT_ADDRESS = "0x62f81b9Ffd09d4e2Eb7Ca06bc55Cd6772e48Fd0b";

async function autoSignTransaction(worker, location, status) {
    // Nếu chưa thay Private Key, dùng Mock
    // Nếu vẫn là key mặc định thì mới dùng MOCK
    if (SERVER_PRIVATE_KEY === "0x0000000000000000000000000000000000000000000000000000000000000000" || 
        SERVER_PRIVATE_KEY.length < 60) {
        console.log("[CẢNH BÁO] Chưa điền SERVER_PRIVATE_KEY hợp lệ. Đang dùng Hash giả (Mock).");
        return "0x" + Math.random().toString(16).substr(2, 60) + "MOCK";
    }

    try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const wallet = new ethers.Wallet(SERVER_PRIVATE_KEY, provider);

        const actionString = status ? 'Check-in' : 'Check-out';
        const dataString = `User: ${worker} | Loc: ${location} | Act: ${actionString}`;
        const hexData = "0x" + Buffer.from(dataString, 'utf8').toString('hex');

        // Lấy thông tin phí gas hiện tại
        const feeData = await provider.getFeeData();
        
        const tx = {
            to: CONTRACT_ADDRESS,
            data: hexData,
            gasPrice: feeData.gasPrice,
            gasLimit: 100000 // Tăng nhẹ gas limit để đảm bảo thành công
        };

        console.log(`[BLOCKCHAIN] Đang gửi giao dịch... (Gas: ${ethers.formatUnits(feeData.gasPrice, 'gwei')} gwei)`);
        
        const sentTx = await wallet.sendTransaction(tx);
        console.log(`[BLOCKCHAIN] GIAO DỊCH THÀNH CÔNG! Hash: ${sentTx.hash}`);
        return sentTx.hash;
    } catch (error) {
        console.error("[LỖI BLOCKCHAIN] Chi tiết lỗi:");
        console.error(" - Thông báo:", error.message);
        if (error.reason) console.error(" - Lý do:", error.reason);
        if (error.code) console.error(" - Mã lỗi:", error.code);
        
        return "0x" + Math.random().toString(16).substr(2, 60) + "FAIL";
    }
}

// 3. Mark Attendance (Backend Auto Sign)
app.post('/api/attendance', async (req, res) => {
    const { worker, location, status, txHash } = req.body;

    if (!worker || typeof status !== 'boolean') {
        return res.status(400).json({ error: "Thiếu thông tin hoặc sai định dạng!" });
    }

    const records = readData(dataFilePath);

    // Tìm bản ghi mới nhất của nhân viên này
    let lastRecordIndex = -1;
    for (let i = records.length - 1; i >= 0; i--) {
        if (records[i].worker === worker) {
            lastRecordIndex = i;
            break;
        }
    }

    // Xử lý tạo giao dịch thật trên Server nếu App không gửi lên Hash thật
    let finalTxHash = txHash;
    if (!finalTxHash || finalTxHash.includes('MOCK') || finalTxHash.length !== 66) {
        finalTxHash = await autoSignTransaction(worker, location, status);
    }

    // Nếu hành động là Check-out (status = false) VÀ bản ghi trước đó cũng là Check-out
    // -> Tiến hành CẬP NHẬT bản ghi Check-out thay vì tạo dòng mới (để tránh rác dữ liệu)
    if (status === false && lastRecordIndex !== -1 && records[lastRecordIndex].status === false) {
        records[lastRecordIndex].location = location || "Office";
        records[lastRecordIndex].timestamp = new Date().getTime();
        records[lastRecordIndex].txHash = finalTxHash;

        writeData(dataFilePath, records);
        console.log(`[DATABASE] CẬP NHẬT Check-out: ${worker} - Tx: ${records[lastRecordIndex].txHash}`);

        return res.status(200).json({
            message: "Cập nhật Check-out thành công",
            data: records[lastRecordIndex]
        });
    }

    // Nếu là Check-in, hoặc Check-out lần đầu tiên sau khi Check-in -> Tạo dòng mới
    const newRecord = {
        id: records.length > 0 ? records[records.length - 1].id + 1 : 1,
        worker: worker,
        location: location || "Office",
        timestamp: new Date().getTime(),
        status: status, // true: check-in, false: check-out
        txHash: finalTxHash
    };

    records.push(newRecord);
    writeData(dataFilePath, records);

    console.log(`[DATABASE] Ghi nhận: ${worker} - ${status ? "Check-in" : "Check-out"}`);

    res.status(201).json({
        message: "Chấm công thành công",
        data: newRecord
    });
});

// 4. Update Attendance Record (Admin only)
app.put('/api/attendance/:id', (req, res) => {
    const recordId = parseInt(req.params.id);
    const { location, status, timestamp } = req.body;

    const records = readData(dataFilePath);
    const index = records.findIndex(r => r.id === recordId);

    if (index === -1) {
        return res.status(404).json({ error: "Không tìm thấy bản ghi" });
    }

    // Update fields
    if (location !== undefined) records[index].location = location;
    if (status !== undefined) records[index].status = status;
    if (timestamp !== undefined) records[index].timestamp = timestamp;

    writeData(dataFilePath, records);

    res.json({ message: "Cập nhật thành công", data: records[index] });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
