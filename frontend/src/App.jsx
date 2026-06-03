import { useState, useEffect } from 'react';

function App() {
  const [user, setUser] = useState(null);

  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // App State
  const [workerId, setWorkerId] = useState('');
  const [location, setLocation] = useState('Head Office');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  // Edit State
  const [editingRecord, setEditingRecord] = useState(null);
  const [editLocation, setEditLocation] = useState('');
  const [editStatus, setEditStatus] = useState(true);

  const API_URL = 'http://localhost:5000/api';
  const CONTRACT_ADDRESS = '0x62f81b9Ffd09d4e2Eb7Ca06bc55Cd6772e48Fd0b'; // <--- THAY ĐỊA CHỈ CONTRACT CỦA BẠN TẠI ĐÂY

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (user) {
      setWorkerId(user.username);
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/attendance`);
      const data = await response.json();
      setHistory(data.reverse()); // Show newest first
    } catch (err) {
      console.error('Failed to fetch history', err);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (response.ok) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        showAlert('success', `Xin chào, ${data.user.fullName}!`);
      } else {
        showAlert('error', data.error);
      }
    } catch (err) {
      showAlert('error', 'Không thể kết nối Server');
    } finally {
      setLoading(false);
    }
  };

  // Hàm chuyển đổi chuỗi chữ sang mã Hex để ghi lên Blockchain
  const stringToHex = (str) => {
    let hex = '';
    for (let i = 0; i < str.length; i++) {
      hex += '' + str.charCodeAt(i).toString(16);
    }
    return '0x' + hex;
  };

  const handleAttendance = async (isCheckIn) => {
    if (!workerId.trim()) {
      showAlert('error', 'Vui lòng nhập Mã nhân viên!');
      return;
    }

    setLoading(true);
    let realTxHash = null;

    try {
      // 1. Giao tiếp với MetaMask nếu bấm Check-out (hoặc Check-in)
      if (window.ethereum) {
        // Yêu cầu kết nối
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const account = accounts[0];

        // Đóng gói dữ liệu chấm công để ghi vĩnh viễn lên Blockchain
        const actionString = isCheckIn ? 'Check-in' : 'Check-out';
        const dataString = `User: ${workerId} | Loc: ${location} | Act: ${actionString}`;

        // Gửi giao dịch 0 ETH vào Địa chỉ Smart Contract kèm theo DỮ LIỆU
        const txParams = {
          to: CONTRACT_ADDRESS,
          from: account,
          value: '0x0',
          data: stringToHex(dataString)
        };

        realTxHash = await window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [txParams],
        });

        showAlert('success', 'Giao dịch trên MetaMask đã gửi!');
      } else {
        showAlert('error', 'Chưa cài đặt MetaMask! Sẽ dùng Mock TxHash.');
      }
    } catch (err) {
      console.error(err);
      showAlert('error', 'Lỗi MetaMask: ' + (err.message || 'Giao dịch bị từ chối'));
      setLoading(false);
      return; // Dừng nếu người dùng hủy MetaMask
    }

    // 2. Gửi dữ liệu lên Backend
    try {
      const response = await fetch(`${API_URL}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worker: workerId,
          location: location,
          status: isCheckIn,
          txHash: realTxHash // Gửi hash thật
        })
      });

      const result = await response.json();

      if (response.ok) {
        showAlert('success', `${isCheckIn ? 'Check-in' : 'Check-out'} thành công!`);
        fetchHistory();
      } else {
        showAlert('error', result.error || 'Có lỗi xảy ra!');
      }
    } catch (err) {
      showAlert('error', 'Không thể kết nối đến Server!');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSave = async () => {
    if (!editingRecord) return;
    try {
      const response = await fetch(`${API_URL}/attendance/${editingRecord.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: editLocation,
          status: editStatus === 'true' || editStatus === true
        })
      });
      if (response.ok) {
        showAlert('success', 'Cập nhật thành công!');
        setEditingRecord(null);
        fetchHistory();
      } else {
        showAlert('error', 'Cập nhật thất bại');
      }
    } catch (err) {
      showAlert('error', 'Lỗi kết nối');
    }
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('vi-VN');
  };

  // Filter history for current user unless admin
  const displayHistory = user?.role === 'admin'
    ? history
    : history.filter(r => r.worker === user?.username);

  // Xác định trạng thái của nút theo ngày hiện tại
  const isToday = (timestamp) => {
    const d = new Date(timestamp);
    const today = new Date();
    return d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
  };

  const myRecordsToday = history.filter(r => r.worker === workerId && isToday(r.timestamp));
  const lastRecordToday = myRecordsToday.length > 0 ? myRecordsToday[0] : null;

  // Nếu hôm nay chưa có bản ghi nào hoặc bản ghi cuối cùng là Check-out -> Cho phép Check-in
  // (Tuy nhiên theo yêu cầu: "hôm nay chưa check in hiện nút check in")
  const canCheckIn = !lastRecordToday || lastRecordToday.status === false;

  // Nếu bản ghi cuối cùng hôm nay là Check-in -> Cho phép Check-out
  const canCheckOut = lastRecordToday !== null && lastRecordToday.status === true;

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setUsername('');
    setPassword('');
    setHistory([]);
  };

  if (!user) {
    return (
      <div className="glass-container login-container" style={{ maxWidth: '400px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem' }}>Đăng Nhập</h1>
        <p className="subtitle">Hệ thống chấm công Blockchain</p>
        {alert && <div className={`alert alert-${alert.type}`}>{alert.message}</div>}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Tài khoản (Mã NV)</label>
            <input type="text" className="form-control" value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Mật khẩu</label>
            <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '1rem' }}>
            {loading ? <div className="spinner"></div> : 'Đăng Nhập'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="glass-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0, fontSize: '2rem' }}>Smart Attendance</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>Xin chào, <b>{user.fullName}</b> ({user.role})</span>
          <button className="btn btn-danger" onClick={handleLogout} style={{ padding: '0.5rem 1rem', width: 'auto', fontSize: '0.9rem' }}>Đăng xuất</button>
        </div>
      </div>
      <p className="subtitle" style={{ textAlign: 'left', marginBottom: '2rem' }}>Hệ thống chấm công minh bạch</p>

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
            <label>Mã nhân viên</label>
            <input
              type="text"
              className="form-control"
              value={workerId}
              onChange={(e) => setWorkerId(e.target.value)}
              disabled={user.role !== 'admin'}
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
            {canCheckIn && (
              <button
                className="btn btn-success"
                onClick={() => handleAttendance(true)}
                disabled={loading}
              >
                {loading ? <div className="spinner"></div> : '✅ Check-in'}
              </button>
            )}

            {canCheckOut && (
              <button
                className="btn btn-danger"
                onClick={() => handleAttendance(false)}
                disabled={loading}
              >
                {loading ? <div className="spinner"></div> : '👋 Check-out (Qua MetaMask)'}
              </button>
            )}
          </div>
        </div>

        {/* Right Column: History */}
        <div className="card">
          <h2>Lịch sử chấm công</h2>

          {displayHistory.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>
              Chưa có dữ liệu chấm công nào.
            </p>
          ) : (
            <ul className="history-list">
              {displayHistory.map((record) => (
                <li key={record.id} className="history-item" style={{ flexWrap: 'wrap' }}>
                  <div className="history-info">
                    <span className="history-worker">{record.worker}</span>
                    <span className="history-time">{formatDate(record.timestamp)} • {record.location}</span>
                    {record.txHash && (
                      <span className="history-tx" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                        Tx: {record.txHash.includes('MOCK') ? (
                          <span style={{ color: 'var(--text-muted)' }}>{record.txHash.substring(0, 15)}...</span>
                        ) : (
                          <a href={`https://sepolia.etherscan.io/tx/${record.txHash}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                            {record.txHash.substring(0, 15)}... ↗
                          </a>
                        )}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span className={`badge ${record.status ? 'badge-in' : 'badge-out'}`}>
                      {record.status ? 'Check-in' : 'Check-out'}
                    </span>
                    {user.role === 'admin' && (
                      <button
                        onClick={() => {
                          setEditingRecord(record);
                          setEditLocation(record.location);
                          setEditStatus(record.status);
                        }}
                        style={{
                          background: 'rgba(255,255,255,0.1)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          color: 'white',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        Sửa
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingRecord && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ maxWidth: '400px', width: '100%', margin: '0 auto' }}>
            <h3 style={{ marginBottom: '1rem' }}>Sửa bản ghi #{editingRecord.id} ({editingRecord.worker})</h3>
            <div className="form-group">
              <label>Vị trí</label>
              <input type="text" className="form-control" value={editLocation} onChange={e => setEditLocation(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Trạng thái</label>
              <select className="form-control" value={editStatus} onChange={e => setEditStatus(e.target.value === 'true')}>
                <option value={true}>Check-in</option>
                <option value={false}>Check-out</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button className="btn btn-success" onClick={handleEditSave} style={{ padding: '0.75rem' }}>Lưu</button>
              <button className="btn btn-danger" onClick={() => setEditingRecord(null)} style={{ padding: '0.75rem' }}>Hủy</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
