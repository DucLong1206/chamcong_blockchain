const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const PORT = 5000;

// Mock database (in-memory)
let attendanceRecords = [];

// Get all records (History)
app.get('/api/attendance', (req, res) => {
    res.json(attendanceRecords);
});

// Mark Attendance (Mocking Blockchain Transaction)
app.post('/api/attendance', (req, res) => {
    const { worker, location, status } = req.body;
    
    if (!worker || typeof status !== 'boolean') {
        return res.status(400).json({ error: "Thiếu thông tin hoặc sai định dạng!" });
    }

    const newRecord = {
        id: attendanceRecords.length + 1,
        worker: worker,
        location: location || "Office",
        timestamp: new Date().getTime(),
        status: status, // true: check-in, false: check-out
        txHash: "0x" + Math.random().toString(16).substr(2, 40) + " (MOCK)"
    };

    attendanceRecords.push(newRecord);

    console.log(`[MOCK BLOCKCHAIN] Ghi nhận: ${worker} - ${status ? "Check-in" : "Check-out"}`);

    // Return the created record with a mock tx hash
    res.status(201).json({
        message: "Chấm công thành công (Mock Blockchain)",
        data: newRecord
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
