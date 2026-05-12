import { useState, useEffect } from 'react';

function App() {
  const [workerId, setWorkerId] = useState('');
  const [location, setLocation] = useState('Head Office');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const API_URL = 'http://localhost:5000/api/attendance';

  // Fetch history on load
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setHistory(data.reverse()); // Show newest first
    } catch (err) {
      console.error('Failed to fetch history', err);
    }
  };

  const handleAttendance = async (isCheckIn) => {
    if (!workerId.trim()) {
      showAlert('error', 'Vui lòng nhập Mã nhân viên!');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worker: workerId,
          location: location,
          status: isCheckIn
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        showAlert('success', `${isCheckIn ? 'Check-in' : 'Check-out'} thành công! Tx: ${result.data.txHash.substring(0, 15)}...`);
        fetchHistory(); // Refresh history
      } else {
        showAlert('error', result.error || 'Có lỗi xảy ra!');
      }
    } catch (err) {
      showAlert('error', 'Không thể kết nối đến Server!');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('vi-VN');
  };

  return (
    <div className="glass-container">
      <h1>Smart Attendance</h1>
      <p className="subtitle">Hệ thống chấm công Blockchain minh bạch</p>

      {alert && (
        <div className={`alert alert-${alert.type}`}>
          {alert.type === 'success' ? '✅' : '❌'} {alert.message}
        </div>
      )}

      <div className="app-grid">
        {/* Left Column: Form */}
        <div className="card">
          <h2>Thực hiện chấm công</h2>
          
          <div className="form-group">
            <label>Mã nhân viên (Wallet Address hoặc ID)</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="VD: NV001 hoặc 0x123..."
              value={workerId}
              onChange={(e) => setWorkerId(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Vị trí / Văn phòng</label>
            <select 
              className="form-control"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              <option value="Head Office">Head Office (Trụ sở chính)</option>
              <option value="Branch 1">Branch 1 (Chi nhánh 1)</option>
              <option value="Remote">Remote (Làm việc từ xa)</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button 
              className="btn btn-success" 
              onClick={() => handleAttendance(true)}
              disabled={loading}
            >
              {loading ? <div className="spinner"></div> : '✅ Check-in'}
            </button>
            <button 
              className="btn btn-danger" 
              onClick={() => handleAttendance(false)}
              disabled={loading}
            >
              {loading ? <div className="spinner"></div> : '👋 Check-out'}
            </button>
          </div>
        </div>

        {/* Right Column: History */}
        <div className="card">
          <h2>
            Lịch sử giao dịch 
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'normal', marginLeft: 'auto' }}>
              (On-chain Mock)
            </span>
          </h2>
          
          {history.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>
              Chưa có dữ liệu chấm công nào.
            </p>
          ) : (
            <ul className="history-list">
              {history.map((record) => (
                <li key={record.id} className="history-item">
                  <div className="history-info">
                    <span className="history-worker">{record.worker}</span>
                    <span className="history-time">{formatDate(record.timestamp)} • {record.location}</span>
                    <span className="history-tx">Tx: {record.txHash}</span>
                  </div>
                  <span className={`badge ${record.status ? 'badge-in' : 'badge-out'}`}>
                    {record.status ? 'Check-in' : 'Check-out'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
