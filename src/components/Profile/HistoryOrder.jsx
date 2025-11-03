// src/components/HistoryOrder.jsx
import React, { useEffect, useState, useCallback } from "react";
import { authAPI } from '../services/authAPI';
import './ProfileStyle.css';

function HistoryOrder({ user, theme = "light" }) {
  const [orders, setOrders] = useState([]);
  const [batteryDetails, setBatteryDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 800);
  const [expandedOrders, setExpandedOrders] = useState({});
  const [loadingBatteries, setLoadingBatteries] = useState({});

  // Format currency (VND)
  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(amount);
  }, []);

  // Format date
  const formatDateTime = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  }, []);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    if (!user?.accountId) {
      setError('Không tìm thấy thông tin người dùng');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await authAPI.getOrdersByAccountId(user.accountId);
      
      if (response?.isSuccess) {
        setOrders(response.data || []);
      } else {
        throw new Error(response?.message || 'Không thể lấy danh sách đơn hàng');
      }
    } catch (err) {
      setError(err?.message || 'Lỗi khi tải lịch sử đơn hàng');
    } finally {
      setLoading(false);
    }
  }, [user?.accountId]);

  // Fetch battery details
  const fetchBatteryDetails = useCallback(async (batteryId) => {
    if (!batteryId) return;
    
    setLoadingBatteries(prev => ({ ...prev, [batteryId]: true }));
    
    try {
      const response = await authAPI.getBatteryById(batteryId);
      
      if (response) {
        setBatteryDetails(prev => ({
          ...prev,
          [batteryId]: response
        }));
      }
    } catch (err) {
      console.error(`Error fetching battery details for ${batteryId}:`, err);
      setBatteryDetails(prev => ({
        ...prev,
        [batteryId]: { error: 'Không thể tải thông tin pin' }
      }));
    } finally {
      setLoadingBatteries(prev => ({ ...prev, [batteryId]: false }));
    }
  }, []);

  // Responsive handling
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 800);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load orders on component mount
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'success':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'cancelled':
      case 'failed':
        return '#ef4444';
      case 'processing':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  // Get service type display name
  const getServiceTypeDisplay = (serviceType) => {
    const types = {
      'package': 'Mua gói dịch vụ',
      'prepaid': 'Thanh toán trước',
      'usepackage': 'Sử dụng gói',
      'paidatstation': 'Thanh toán tại trạm'
    };
    return types[serviceType?.toLowerCase()] || serviceType || 'Không xác định';
  };

  // Toggle hiển thị chi tiết đơn hàng
  const toggleOrderDetails = (orderId, batteryId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));

    // Nếu mở chi tiết và có batteryId, fetch thông tin pin
    if (!expandedOrders[orderId] && batteryId && !batteryDetails[batteryId]) {
      fetchBatteryDetails(batteryId);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: isMobile ? 16 : 24 }}>
        <div className="liquid-glass" style={{ padding: 20, marginBottom: 20 }}>
          <h3 style={{ fontWeight: 700, fontSize: 20, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            🛒 Lịch sử đơn hàng
          </h3>
        </div>
        <div className="profile-loading-state">
          <p>⏳ Đang tải lịch sử đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: isMobile ? 16 : 24 }}>
        <div className="liquid-glass" style={{ padding: 20, marginBottom: 20 }}>
          <h3 style={{ fontWeight: 700, fontSize: 20, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            🛒 Lịch sử đơn hàng
          </h3>
        </div>
        <div className="profile-error-state">
          <p>❌ {error}</p>
          <button 
            onClick={fetchOrders}
            className="profile-btn-primary"
            style={{ marginTop: '12px' }}
          >
            🔄 Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: isMobile ? 16 : 24 }}>
      <div className="liquid-glass" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <h3 style={{ fontWeight: 700, fontSize: 20, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            🛒 Lịch sử đơn hàng
          </h3>
          <button
            onClick={fetchOrders}
            className="profile-btn-primary"
            style={{ fontSize: 14, padding: '10px 20px' }}
          >
            🔄 Làm mới
          </button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="profile-empty liquid-glass" style={{ margin: 20 }}>
          <p>📭 Bạn chưa có đơn hàng nào.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          <div className="liquid-glass" style={{ padding: '12px 20px' }}>
            <p style={{ fontSize: '14px', color: theme === 'dark' ? '#94a3b8' : '#64748b', margin: 0 }}>
              📊 Hiển thị {orders.length} đơn hàng của bạn
            </p>
          </div>
          
          {orders.map((order) => (
            <div key={order.orderId} className="profile-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700 }}>
                    Đơn hàng: {order.orderId}
                  </h4>
                  
                  {/* Thông tin cơ bản luôn hiển thị */}
                  <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
                    <div>
                      <strong>📅 Ngày tạo:</strong> {formatDateTime(order.date)}
                    </div>
                    <div>
                      <strong>💰 Tổng tiền:</strong> {formatCurrency(order.total)}
                    </div>
                  </div>

                  {/* Thông tin chi tiết chỉ hiển thị khi bấm nút */}
                  {expandedOrders[order.orderId] && (
                    <div style={{ display: 'grid', gap: '12px', fontSize: '14px', marginTop: '12px', padding: '12px', backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)', borderRadius: '8px' }}>
                      <div>
                        <strong>📦 Loại dịch vụ:</strong> {getServiceTypeDisplay(order.serviceType)}
                      </div>
                      
                      {/* Hiển thị chi tiết pin nếu có */}
                      {order.batteryId && (
                        <div>
                          <strong>🔋 Thông tin Pin:</strong>
                          {loadingBatteries[order.batteryId] ? (
                            <div style={{ marginTop: '8px', padding: '12px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '8px' }}>
                              <p>⏳ Đang tải thông tin pin...</p>
                            </div>
                          ) : batteryDetails[order.batteryId] ? (
                            batteryDetails[order.batteryId].error ? (
                              <div style={{ marginTop: '8px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
                                <p>❌ {batteryDetails[order.batteryId].error}</p>
                              </div>
                            ) : (
                              <div style={{ marginTop: '8px', padding: '12px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '8px' }}>
                                <div><strong>Tên Pin:</strong> {batteryDetails[order.batteryId].batteryName || 'N/A'}</div>
                                <div><strong>Loại Pin:</strong> {batteryDetails[order.batteryId].batteryType || 'N/A'}</div>
                                <div><strong>Dung lượng:</strong> {batteryDetails[order.batteryId].capacity || 'N/A'}</div>
                                <div><strong>Thông số kỹ thuật:</strong> {batteryDetails[order.batteryId].specification || 'N/A'}</div>
                                <div><strong>Chất lượng Pin:</strong> {batteryDetails[order.batteryId].batteryQuality || 'N/A'}%</div>
                              </div>
                            )
                          ) : (
                            <div style={{ marginTop: '8px', padding: '12px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px' }}>
                              <p>ℹ️ Chưa có thông tin pin. Bấm vào nút chi tiết để tải.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
                  <div className="profile-badge" style={{ 
                    background: getStatusColor(order.status),
                    color: 'white'
                  }}>
                    {order.status || 'Chưa xác định'}
                  </div>
                  
                  {/* Nút chi tiết */}
                  <button
                    onClick={() => toggleOrderDetails(order.orderId, order.batteryId)}
                    className="profile-btn-secondary"
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    {expandedOrders[order.orderId] ? 'Ẩn chi tiết' : 'Chi tiết'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default HistoryOrder;