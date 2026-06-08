import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Cấu hình API URL - Thay bằng IP máy tính của bạn
const API_BASE_URL = 'http://172.16.68.41:5000/api';

const App = () => {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [location, setLocation] = useState('Head Office');

  useEffect(() => {
    loadSession();
  }, []);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const loadSession = async () => {
    try {
      const savedUser = await AsyncStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error('Failed to load session');
    }
  };

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập đủ thông tin');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/login`, { username, password });
      const userData = response.data.user;
      setUser(userData);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
    } catch (err) {
      Alert.alert('Lỗi', err.response?.data?.error || 'Không thể kết nối Server');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('user');
    setHistory([]);
  };

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/attendance`);
      setHistory(response.data.reverse());
    } catch (err) {
      console.error('Failed to fetch history');
    }
  };

  const handleAttendance = async (isCheckIn) => {
    setLoading(true);
    try {
      // Chỉ gửi dữ liệu về Backend, Backend sẽ tự động ký lên Blockchain (Auto-Sign)
      const response = await axios.post(`${API_BASE_URL}/attendance`, {
        worker: user.username,
        location: location,
        status: isCheckIn,
        txHash: null // Backend tự xử lý phần này
      });

      if (response.status === 201 || response.status === 200) {
        Alert.alert('Thành công', `${isCheckIn ? 'Check-in' : 'Check-out'} thành công! Dữ liệu đã được ghi lên Blockchain.`);
        fetchHistory();
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể kết nối đến hệ thống');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.loginContainer}>
        <View style={styles.glassCard}>
          <Text style={styles.title}>Đăng Nhập</Text>
          <Text style={styles.subtitle}>Mobile Attendance (Stable v3)</Text>

          <TextInput
            style={styles.input}
            placeholder="Tài khoản (Mã NV)"
            placeholderTextColor="#aaa"
            value={username}
            onChangeText={setUsername}
          />
          <TextInput
            style={styles.input}
            placeholder="Mật khẩu"
            placeholderTextColor="#aaa"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Đăng Nhập</Text>}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isToday = (timestamp) => {
    const d = new Date(timestamp);
    const today = new Date();
    return d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
  };

  const myRecordsToday = history.filter(r => r.worker === user.username && isToday(r.timestamp));
  const lastRecordToday = myRecordsToday.length > 0 ? myRecordsToday[0] : null;
  const canCheckIn = !lastRecordToday || lastRecordToday.status === false;
  const canCheckOut = lastRecordToday !== null && lastRecordToday.status === true;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Smart Attendance</Text>
          <Text style={styles.headerSubtitle}>Xin chào, {user.fullName}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thực hiện chấm công</Text>

          <View style={styles.locationContainer}>
            <Text style={styles.label}>Vị trí:</Text>
            <View style={styles.pickerContainer}>
              {['Head Office', 'Branch 1', 'Remote'].map((loc) => (
                <TouchableOpacity
                  key={loc}
                  style={[styles.chip, location === loc && styles.chipActive]}
                  onPress={() => setLocation(loc)}
                >
                  <Text style={[styles.chipText, location === loc && styles.chipTextActive]}>{loc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.actionButtons}>
            {canCheckIn && (
              <TouchableOpacity
                style={[styles.actionButton, styles.checkInBtn]}
                onPress={() => handleAttendance(true)}
                disabled={loading}
              >
                <Text style={styles.actionButtonText}>✅ Check-in</Text>
              </TouchableOpacity>
            )}
            {canCheckOut && (
              <TouchableOpacity
                style={[styles.actionButton, styles.checkOutBtn]}
                onPress={() => handleAttendance(false)}
                disabled={loading}
              >
                <Text style={styles.actionButtonText}>👋 Check-out</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.walletInfo}>
            <Text style={styles.walletText}>Chế độ: Blockchain Auto-Sync</Text>
            <Text style={styles.walletTextDetail}>Dữ liệu được xác thực minh bạch qua hệ thống Backend Blockchain.</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Lịch sử cá nhân</Text>
        {history.filter(r => r.worker === user.username).map((record) => (
          <View key={record.id} style={styles.historyItem}>
            <View>
              <Text style={styles.historyTime}>{new Date(record.timestamp).toLocaleString('vi-VN')}</Text>
              <Text style={styles.historyLoc}>{record.location}</Text>
              {record.txHash && <Text style={styles.historyTx}>Tx: {record.txHash.substring(0, 15)}...</Text>}
            </View>
            <View style={[styles.badge, record.status ? styles.badgeIn : styles.badgeOut]}>
              <Text style={styles.badgeText}>{record.status ? 'In' : 'Out'}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    padding: 20,
  },
  loginContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  glassCard: {
    width: '100%',
    padding: 30,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 15,
    color: '#fff',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
  },
  logoutText: {
    color: '#f87171',
    fontWeight: '600',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 15,
  },
  label: {
    color: '#94a3b8',
    marginBottom: 10,
  },
  pickerContainer: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  chip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  chipActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  chipText: {
    color: '#94a3b8',
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  actionButton: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkInBtn: {
    backgroundColor: '#10b981',
  },
  checkOutBtn: {
    backgroundColor: '#f43f5e',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  walletInfo: {
    marginTop: 20,
    padding: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 10,
    alignItems: 'center',
  },
  walletText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: 'bold',
  },
  walletTextDetail: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 5,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 15,
    marginTop: 10,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  historyTime: {
    color: '#fff',
    fontSize: 14,
  },
  historyLoc: {
    color: '#94a3b8',
    fontSize: 12,
  },
  historyTx: {
    color: '#3b82f6',
    fontSize: 10,
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeIn: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  badgeOut: {
    backgroundColor: 'rgba(244, 63, 94, 0.2)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});
