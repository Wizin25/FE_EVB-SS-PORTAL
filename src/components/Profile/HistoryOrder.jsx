// src/components/HistoryOrder.jsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { authAPI } from '../services/authAPI';
import { packageAPI } from '../services/packageAPI';
import './ProfileStyle.css';

// Ưu tiên status: "pending" > "processing" > "success"/"completed" > "failed"/"cancelled" > others
const statusSortOrder = [
  'pending',
  'processing',
  'success',
  'completed',
  'failed',
  'cancelled'
];
function getStatusOrderIndex(status) {
  if (!status) return statusSortOrder.length;
  const lower = status.toLowerCase();
  const idx = statusSortOrder.indexOf(lower);
  return idx !== -1 ? idx : statusSortOrder.length;
}

function HistoryOrder({ user, theme = "light" }) {
  const [orders, setOrders] = useState([]);
  const [batteryDetails, setBatteryDetails] = useState({});
  const [packageDetails, setPackageDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 800);
  const [expandedOrders, setExpandedOrders] = useState({});
  const [loadingBatteries, setLoadingBatteries] = useState({});
  const [loadingPackages, setLoadingPackages] = useState({});
  const [processingPayments, setProcessingPayments] = useState({});
  // State cho việc lựa chọn sắp xếp
  const [sortBy, setSortBy] = useState('status'); // status | date

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

  // Fetch package details
  const fetchPackageDetails = useCallback(async (packageId) => {
    if (!packageId) return;

    setLoadingPackages(prev => ({ ...prev, [packageId]: true }));

    try {
      const response = await packageAPI.getPackageById(packageId);

      // Handle different response structures
      let packageData = null;
      if (response?.isSuccess && response?.data) {
        packageData = response.data;
      } else if (response?.data) {
        packageData = response.data;
      } else if (response) {
        packageData = response;
      }

      if (packageData) {
        setPackageDetails(prev => ({
          ...prev,
          [packageId]: packageData
        }));
      }
    } catch (err) {
      console.error(`Error fetching package details for ${packageId}:`, err);
      setPackageDetails(prev => ({
        ...prev,
        [packageId]: { error: 'Không thể tải thông tin gói dịch vụ' }
      }));
    } finally {
      setLoadingPackages(prev => ({ ...prev, [packageId]: false }));
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

  // Helper function to get package property (handles different field name variations)
  const getPackageProperty = useCallback((pkg, property) => {
    if (!pkg) return 'N/A';

    const possibleKeys = {
      id: ['packageId', 'id', 'packageID', 'PackageID', 'PackageId'],
      name: ['packageName', 'packName', 'name', 'PackageName', 'title'],
      price: ['price', 'cost', 'amount', 'Price'],
      description: ['description', 'desc', 'details', 'Description'],
      batteryType: ['batteryType', 'Battery_type', 'battery_type', 'BatteryType'],
      expiredDays: ['expiredDate', 'expiredDays', 'expired', 'expiry', 'expiration', 'ExpriedDays'],
      status: ['status', 'Status']
    };

    const keys = possibleKeys[property] || [property];
    for (let key of keys) {
      if (pkg[key] !== undefined && pkg[key] !== null && pkg[key] !== '') {
        return pkg[key];
      }
    }
    return property === 'price' ? 0 : 'N/A';
  }, []);

  // Toggle hiển thị chi tiết đơn hàng
  const toggleOrderDetails = (orderId, batteryId, serviceType, serviceId) => {
    const isExpanding = !expandedOrders[orderId];

    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));

    // Nếu mở chi tiết và có batteryId, fetch thông tin pin
    if (isExpanding && batteryId && !batteryDetails[batteryId]) {
      fetchBatteryDetails(batteryId);
    }

    // Nếu mở chi tiết và serviceType là 'package' hoặc 'usepackage', fetch thông tin package
    if (isExpanding && serviceId && (serviceType?.toLowerCase() === 'package' || serviceType?.toLowerCase() === 'usepackage')) {
      if (!packageDetails[serviceId]) {
        fetchPackageDetails(serviceId);
      }
    }
  };

  // Xử lý thanh toán lại cho đơn hàng Pending hoặc Failed
  const handleRetryPayment = useCallback(async (orderId) => {
    if (!orderId || !user?.name) {
      setError('Thiếu thông tin cần thiết để thanh toán');
      return;
    }

    setProcessingPayments(prev => ({ ...prev, [orderId]: true }));

    try {
      const description = `${user.name} CHUYEN TIEN`;
      const payRes = await authAPI.createPayOSPayment({
        orderId,
        description
      });

      console.log('PayOS Payment Response:', payRes);

      // Kiểm tra tất cả các trường hợp có thể có paymentUrl (giống các file khác)
      const redirectUrl =
        payRes?.data?.paymentUrl ||
        payRes?.data?.checkoutUrl ||
        payRes?.data?.payUrl ||
        payRes?.data?.shortLink ||
        payRes?.paymentUrl ||
        payRes?.checkoutUrl ||
        payRes?.payUrl ||
        payRes?.shortLink;

      if (!redirectUrl) {
        console.error('No payment URL found in response:', payRes);
        throw new Error('Không nhận được link thanh toán từ PayOS.');
      }

      console.log('Redirecting to payment URL:', redirectUrl);

      // Redirect đến trang thanh toán PayOS
      window.location.href = redirectUrl;
    } catch (err) {
      console.error('Error creating payment:', err);
      setError(err?.message || 'Lỗi khi tạo thanh toán. Vui lòng thử lại.');
      setProcessingPayments(prev => ({ ...prev, [orderId]: false }));
    }
  }, [user?.name]);

  // Sắp xếp đơn hàng theo tùy chọn sortBy
  const sortedOrders = useMemo(() => {
    if (!Array.isArray(orders)) return [];
    let result = [...orders];
    if (sortBy === 'status') {
      // Sắp xếp theo trạng thái ưu tiên, rồi tới ngày mới nhất
      result.sort((a, b) => {
        const statusA = getStatusOrderIndex(a.status);
        const statusB = getStatusOrderIndex(b.status);
        if (statusA !== statusB) return statusA - statusB;
        // Ưu tiên ngày mới trước (startDate, fallback sang date)
        const dateA = new Date(a.startDate || a.date || 0);
        const dateB = new Date(b.startDate || b.date || 0);
        return dateB - dateA;
      });
    } else if (sortBy === 'date') {
      // Sắp xếp chỉ theo ngày mới nhất
      result.sort((a, b) => {
        const dateA = new Date(a.startDate || a.date || 0);
        const dateB = new Date(b.startDate || b.date || 0);
        return dateB - dateA;
      });
    }
    return result;
  }, [orders, sortBy]);

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

      {/* --- Sort Buttons Start --- */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <button
          onClick={() => setSortBy('status')}
          className={`profile-btn-secondary${sortBy === 'status' ? ' profile-btn-active' : ''}`}
          style={{
            fontSize: 13,
            padding: '8px 16px',
            fontWeight: 600,
            background: sortBy === 'status' ? (theme === 'dark' ? '#1e293b' : '#f1f5f9') : undefined,
            border: sortBy === 'status' ? '1.5px solid #0ea5e9' : undefined,
            color: sortBy === 'status' ? '#0ea5e9' : undefined,
          }}
          type="button"
        >
          Sắp xếp theo trạng thái
        </button>
        <button
          onClick={() => setSortBy('date')}
          className={`profile-btn-secondary${sortBy === 'date' ? ' profile-btn-active' : ''}`}
          style={{
            fontSize: 13,
            padding: '8px 16px',
            fontWeight: 600,
            background: sortBy === 'date' ? (theme === 'dark' ? '#1e293b' : '#f1f5f9') : undefined,
            border: sortBy === 'date' ? '1.5px solid #0ea5e9' : undefined,
            color: sortBy === 'date' ? '#0ea5e9' : undefined,
          }}
          type="button"
        >
          Sắp xếp theo ngày tạo
        </button>
      </div>
      {/* --- Sort Buttons End --- */}

      {sortedOrders.length === 0 ? (
        <div className="profile-empty liquid-glass" style={{ margin: 20 }}>
          <p>📭 Bạn chưa có đơn hàng nào.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          <div className="liquid-glass" style={{ padding: '12px 20px' }}>
            <p style={{ fontSize: '14px', color: theme === 'dark' ? '#94a3b8' : '#64748b', margin: 0 }}>
              📊 Hiển thị {sortedOrders.length} đơn hàng của bạn
            </p>
          </div>
          {sortedOrders.map((order) => (
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
                        <strong>🧾 Loại dịch vụ:</strong> {getServiceTypeDisplay(order.serviceType)}
                      </div>

                      {/* Hiển thị chi tiết gói dịch vụ nếu serviceType là 'package' hoặc 'usepackage' */}
                      {(order.serviceType?.toLowerCase() === 'package' || order.serviceType?.toLowerCase() === 'usepackage') && order.serviceId && (
                        <div>
                          <strong>📦 Thông tin Gói dịch vụ:</strong>
                          {loadingPackages[order.serviceId] ? (
                            <div style={{ marginTop: '8px', padding: '12px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '8px' }}>
                              <p>⏳ Đang tải thông tin gói dịch vụ...</p>
                            </div>
                          ) : packageDetails[order.serviceId] ? (
                            packageDetails[order.serviceId].error ? (
                              <div style={{ marginTop: '8px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
                                <p>❌ {packageDetails[order.serviceId].error}</p>
                              </div>
                            ) : (
                              <div style={{ marginTop: '8px', padding: '12px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '8px' }}>
                                <div><strong>Tên gói:</strong> {getPackageProperty(packageDetails[order.serviceId], 'name')}</div>
                                <div><strong>Giá:</strong> {formatCurrency(getPackageProperty(packageDetails[order.serviceId], 'price'))}</div>
                                <div><strong>Loại pin:</strong> {getPackageProperty(packageDetails[order.serviceId], 'batteryType')}</div>
                                <div><strong>Thời hạn:</strong> {getPackageProperty(packageDetails[order.serviceId], 'expiredDays')} ngày</div>
                                <div><strong>Mô tả:</strong> {getPackageProperty(packageDetails[order.serviceId], 'description') || 'Không có mô tả'}</div>
                              </div>
                            )
                          ) : (
                            <div style={{ marginTop: '8px', padding: '12px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px' }}>
                              <p>ℹ️ Chưa có thông tin gói dịch vụ. Bấm vào nút chi tiết để tải.</p>
                            </div>
                          )}
                        </div>
                      )}

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

                  {/* Nút thanh toán lại cho Pending hoặc Failed */}
                  {(order.status?.toLowerCase() === 'pending' || order.status?.toLowerCase() === 'failed') && (
                    <button
                      onClick={() => handleRetryPayment(order.orderId)}
                      disabled={processingPayments[order.orderId]}
                      className="profile-btn-primary"
                      style={{
                        fontSize: '12px',
                        padding: '6px 12px',
                        opacity: processingPayments[order.orderId] ? 0.6 : 1,
                        cursor: processingPayments[order.orderId] ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {processingPayments[order.orderId] ? '⏳ Đang xử lý...' : '💳 Thanh toán lại'}
                    </button>
                  )}

                  {/* Nút chi tiết */}
                  <button
                    onClick={() => toggleOrderDetails(order.orderId, order.batteryId, order.serviceType, order.serviceId)}
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