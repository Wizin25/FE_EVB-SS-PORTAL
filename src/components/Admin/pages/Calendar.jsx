// Calendar.jsx
import React, { useState, useEffect } from "react";
import { authAPI } from '../../../components/services/authAPI';
import { formAPI } from '../../../components/services/formAPI';
import "../../../components/Staff/Staff.jsx";

const daysOfWeek = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const monthNames = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
];

// Helper functions
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year, month) {
  return new Date(year, month, 1).getDay();
}

function todayDateObj() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth(), date: now.getDate() };
}

// Calendar cell component
function CalendarCell({ day, isToday, isSelected, onDateSelect, year, month }) {
  const cellStyle = {
    padding: 12,
    borderRadius: 10,
    background: isSelected
      ? "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)"
      : isToday
        ? "linear-gradient(135deg, #60a5fa 0%, #38bdf8 100%)"
        : "#f8fafc",
    color: isSelected || isToday ? "#fff" : "#334155",
    fontWeight: isSelected || isToday ? 700 : 500,
    textAlign: "center",
    cursor: "pointer",
    transition: "all 0.2s",
    fontSize: 16,
    minHeight: 40,
    verticalAlign: "middle",
  };

  const handleMouseEnter = (e) => {
    if (!isSelected && !isToday) {
      e.target.style.background = "#e2e8f0";
    }
  };

  const handleMouseLeave = (e) => {
    if (!isSelected && !isToday) {
      e.target.style.background = "#f8fafc";
    }
  };

  return (
    <td
      onClick={() => onDateSelect({ year, month, date: day })}
      style={cellStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {day}
    </td>
  );
}

// Component for single month calendar
function MonthCalendar({ year, month, today, selectedDate, onDateSelect }) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);

  // Build calendar grid
  const calendarRows = [];
  let day = 1;

  // Create all weeks
  for (let week = 0; week < 6; week++) {
    const cells = [];

    // Fill each week with 7 days
    for (let i = 0; i < 7; i++) {
      const isFirstWeek = week === 0;
      const isEmptyCell = isFirstWeek && i < firstDay;
      const isDayInMonth = day <= daysInMonth;

      if (isEmptyCell || !isDayInMonth) {
        cells.push(<td key={`empty-${week}-${i}`} style={{ padding: 12 }}></td>);
      } else {
        const isToday = day === today.date && month === today.month && year === today.year;
        const isSelected = selectedDate &&
          day === selectedDate.date &&
          month === selectedDate.month &&
          year === selectedDate.year;

        cells.push(
          <CalendarCell
            key={day}
            day={day}
            isToday={isToday}
            isSelected={isSelected}
            onDateSelect={onDateSelect}
            year={year}
            month={month}
          />
        );
        day++;
      }
    }

    calendarRows.push(<tr key={`row-${week}`}>{cells}</tr>);

    // Stop if we've displayed all days
    if (day > daysInMonth) break;
  }

  return (
    <div style={{ flex: 1, margin: "0 10px" }}>
      <h3
        style={{
          fontSize: 20,
          fontWeight: 700,
          textAlign: "center",
          marginBottom: 16,
          color: "#334155",
          letterSpacing: 1,
        }}
      >
        {monthNames[month]} {year}
      </h3>
      <table
        style={{
          width: "100%",
          borderCollapse: "separate",
          borderSpacing: "4px",
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 2px 8px 0 #64748b11",
        }}
      >
        <thead>
          <tr>
            {daysOfWeek.map((d, idx) => (
              <th
                key={d}
                style={{
                  color: idx === 0 ? "#ef4444" : "#0ea5e9",
                  fontWeight: 700,
                  fontSize: 16,
                  padding: 8,
                  textAlign: "center",
                  letterSpacing: 1,
                  background: "#f1f5f9",
                  borderRadius: 8,
                }}
              >
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{calendarRows}</tbody>
      </table>
    </div>
  );
}

// Form Detail Modal Component
function FormDetailModal({ form, onClose }) {
  if (!form) return null;

  // Hàm format date giống Form.jsx
  const formatDate = (dateString) => {
    if (!dateString || dateString === 'N/A') return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';

      return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Ho_Chi_Minh'
      });
    } catch {
      return dateString;
    }
  };

  // Hàm xác định màu sắc cho status - GIỐNG FORM.JSX
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
      case 'chờ xử lý':
        return '#f59e0b'; // orange
      case 'approved':
      case 'đã duyệt':
        return '#10b981'; // green
      case 'rejected':
      case 'từ chối':
        return '#ef4444'; // red
      case 'completed':
      case 'hoàn thành':
        return '#3b82f6'; // blue
      default:
        return '#6b7280'; // gray
    }
  };

  // Hàm lấy Form ID từ nhiều trường có thể có - GIỐNG FORM.JSX
  const getFormId = (form) => {
    return form.id || form.formId || form.FormId || 'N/A';
  };

  // Hàm fetch customer details - MỚI THÊM (giống Staff.jsx)
  const fetchAccountByCustomerId = async (accountId) => {
    if (!accountId) return null;

    try {
      const acc = await authAPI.getCustomerByAccountId(accountId);
      if (acc) {
        // Chuẩn hóa thông tin customer giống Staff.jsx
        const customerInfo = {
          name: acc.name || acc.Name || '',
          phone: acc.phone || acc.Phone || '',
          address: acc.address || acc.Address || '',
          email: acc.email || acc.Email || '',
          username: acc.username || acc.Username || '',
          customerID: acc.customerID || acc.CustomerID || '',
          status: acc.status || acc.Status || ''
        };
        return customerInfo;
      }
    } catch (error) {
      console.error('Error fetching customer details:', error);
    }
    return null;
  };

  // Hàm fetch station details - MỚI THÊM (giống Staff.jsx)
  const fetchStationDetails = async (stationId) => {
    if (!stationId) return null;

    try {
      const station = await authAPI.getStationByIdForAdmin(stationId);
      if (station) {
        // Chuẩn hóa thông tin station
        const stationInfo = {
          stationName: station.stationName || station.name || station.StationName || '',
          address: station.address || station.Address || '',
          status: station.status || station.Status || ''
        };
        return stationInfo;
      }
    } catch (error) {
      console.error('Error fetching station details:', error);
    }
    return null;
  };

  // State cho customer details - MỚI THÊM
  const [customerInfo, setCustomerInfo] = useState(null);
  const [loadingCustomer, setLoadingCustomer] = useState(false);

  // State cho station details - MỚI THÊM
  const [stationInfo, setStationInfo] = useState(null);
  const [loadingStation, setLoadingStation] = useState(false);

  // Fetch customer info khi form có accountId - MỚI THÊM
  useEffect(() => {
    const loadCustomerInfo = async () => {
      if (form?.accountId) {
        setLoadingCustomer(true);
        try {
          const customerData = await fetchAccountByCustomerId(form.accountId);
          setCustomerInfo(customerData);
        } catch (error) {
          console.error('Error loading customer info:', error);
          setCustomerInfo(null);
        } finally {
          setLoadingCustomer(false);
        }
      }
    };

    loadCustomerInfo();
  }, [form?.accountId]);

  // Fetch station info khi form có stationId - MỚI THÊM
  useEffect(() => {
    const loadStationInfo = async () => {
      if (form?.stationId) {
        setLoadingStation(true);
        try {
          const stationData = await fetchStationDetails(form.stationId);
          setStationInfo(stationData);
        } catch (error) {
          console.error('Error loading station info:', error);
          setStationInfo(null);
        } finally {
          setLoadingStation(false);
        }
      }
    };

    loadStationInfo();
  }, [form?.stationId]);

  const formId = getFormId(form);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '20px',
          borderBottom: '2px solid #f1f5f9',
          paddingBottom: '16px'
        }}>
          <div style={{ flex: 1 }}>
            <h2 style={{
              margin: '0 0 8px 0',
              color: '#1e293b',
              fontSize: '24px',
              fontWeight: '700'
            }}>
              📋 Chi tiết Form
            </h2>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <span style={{
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '700',
                backgroundColor: getStatusColor(form.status),
                color: 'white'
              }}>
                {form.status || 'Unknown'}
              </span>
              <span style={{
                fontSize: '14px',
                color: '#64748b',
                background: '#f8fafc',
                padding: '4px 12px',
                borderRadius: '8px',
                fontWeight: '600'
              }}>
                ID: {formId}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#64748b',
              padding: '4px',
              borderRadius: '4px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#f1f5f9';
              e.target.style.color = '#475569';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'none';
              e.target.style.color = '#64748b';
            }}
          >
            ✕
          </button>
        </div>

        {/* Form Information - GIỐNG FORM.JSX */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{
            margin: '0 0 12px 0',
            color: '#334155',
            fontSize: '18px',
            fontWeight: '600'
          }}>
            📝 Thông tin Form
          </h3>
          <div style={{
            background: '#f8fafc',
            borderRadius: '12px',
            padding: '16px',
            display: 'grid',
            gap: '12px'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <strong>Tiêu đề:</strong>
                <div style={{ color: '#475569', marginTop: '4px' }}>{form.title || 'N/A'}</div>
              </div>
            </div>

            <div>
              <strong>Mô tả:</strong>
              <div style={{
                color: '#475569',
                marginTop: '4px',
                background: 'white',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                minHeight: '60px'
              }}>
                {form.description || 'Không có mô tả'}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <strong>Account ID:</strong>
                <div style={{ color: '#475569', marginTop: '4px' }}>{form.accountId || 'N/A'}</div>
              </div>
            </div>

            {(form.vin || form.batteryId) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {form.vin && (
                  <div>
                    <strong>VIN:</strong>
                    <div style={{ color: '#475569', marginTop: '4px' }}>{form.vin}</div>
                  </div>
                )}
                {form.batteryId && (
                  <div>
                    <strong>Battery ID:</strong>
                    <div style={{ color: '#475569', marginTop: '4px' }}>{form.batteryId}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Customer Information - ĐÃ CẬP NHẬT để giống Staff.jsx */}
        {form.accountId && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              margin: '0 0 12px 0',
              color: '#334155',
              fontSize: '18px',
              fontWeight: '600'
            }}>
              👤 Thông tin Customer
            </h3>
            <div style={{
              background: '#f8fafc',
              borderRadius: '12px',
              padding: '16px'
            }}>
              {loadingCustomer ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '20px'
                }}>
                  <div style={{
                    fontSize: '14px',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>⏳</span>
                    Đang tải thông tin khách hàng...
                  </div>
                </div>
              ) : customerInfo ? (
                <div className="customer-info" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '12px',
                  fontSize: '14px'
                }}>
                  <div className="customer-row" style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="customer-label" style={{ fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                      👤 Tên:
                    </span>
                    <span className="customer-value" style={{ color: '#0f172a' }}>
                      {customerInfo.name || 'Chưa có thông tin'}
                    </span>
                  </div>

                  <div className="customer-row" style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="customer-label" style={{ fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                      📞 Số điện thoại:
                    </span>
                    <span className="customer-value" style={{ color: '#0f172a' }}>
                      {customerInfo.phone || 'Chưa có thông tin'}
                    </span>
                  </div>

                  <div className="customer-row" style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="customer-label" style={{ fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                      📧 Email:
                    </span>
                    <span className="customer-value" style={{ color: '#0f172a' }}>
                      {customerInfo.email || 'Chưa có thông tin'}
                    </span>
                  </div>

                  <div className="customer-row" style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="customer-label" style={{ fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                      🏠 Địa chỉ:
                    </span>
                    <span className="customer-value" style={{ color: '#0f172a' }}>
                      {customerInfo.address || 'Chưa có thông tin'}
                    </span>
                  </div>

                  <div className="customer-row" style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="customer-label" style={{ fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                      🆔 Account ID:
                    </span>
                    <span className="customer-value" style={{ color: '#0f172a', fontFamily: 'monospace' }}>
                      {form.accountId}
                    </span>
                  </div>

                  {customerInfo.customerID && (
                    <div className="customer-row" style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className="customer-label" style={{ fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                        👥 Customer ID:
                      </span>
                      <span className="customer-value" style={{ color: '#0f172a' }}>
                        {customerInfo.customerID}
                      </span>
                    </div>
                  )}

                  {customerInfo.username && (
                    <div className="customer-row" style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className="customer-label" style={{ fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                        🔑 Username:
                      </span>
                      <span className="customer-value" style={{ color: '#0f172a' }}>
                        {customerInfo.username}
                      </span>
                    </div>
                  )}

                  {customerInfo.status && (
                    <div className="customer-row" style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className="customer-label" style={{ fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                        📊 Trạng thái:
                      </span>
                      <span className="customer-status" style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: customerInfo.status === 'Active' ? '#10b981' : '#ef4444',
                        color: 'white',
                        alignSelf: 'flex-start'
                      }}>
                        {customerInfo.status}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '20px',
                  color: '#64748b'
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>❌</div>
                  <p style={{ margin: 0, fontSize: '14px' }}>
                    Không tìm thấy thông tin khách hàng
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Close Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

// Schedule item component
function ScheduleItem({ schedule, onViewFormDetail }) {
  const [exchangeBatteries, setExchangeBatteries] = useState([]);
  const [loadingExchanges, setLoadingExchanges] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState({}); // Track which exchange is being updated
  const [paying, setPaying] = useState({});
  const [showPayModal, setShowPayModal] = useState(false);
  const [orderDraft, setOrderDraft] = useState(null); // { accountId, total, batteryId, serviceId, serviceType, exchangeBatteryId, customerName }
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [payError, setPayError] = useState('');
  const [savedOrders, setSavedOrders] = useState({}); // Lưu orderId theo exchangeBatteryId
  const [retryingPayment, setRetryingPayment] = useState({}); // Track retry payment status

  // Fetch exchange batteries cho schedule này
  useEffect(() => {
    const fetchExchangeBatteries = async () => {
      if (!schedule.stationScheduleId) return;

      try {
        setLoadingExchanges(true);
        console.log('Fetching exchanges for schedule ID:', schedule.stationScheduleId);

        const response = await authAPI.getExchangesBySchedule(schedule.stationScheduleId);
        console.log('Exchange batteries response:', response);

        if (response && Array.isArray(response)) {
          setExchangeBatteries(response);
        } else if (response?.data && Array.isArray(response.data)) {
          setExchangeBatteries(response.data);
        } else {
          setExchangeBatteries([]);
        }
      } catch (error) {
        console.error('Error fetching exchange batteries:', error);
        setExchangeBatteries([]);
      } finally {
        setLoadingExchanges(false);
      }
    };

    fetchExchangeBatteries();
  }, [schedule.stationScheduleId]);

  // Hàm cập nhật trạng thái exchange battery
  const handleUpdateExchangeStatus = async (exchangeBatteryId, newStatus) => {
    if (!exchangeBatteryId) {
      alert('Không có Exchange Battery ID');
      return;
    }

    // Get staff ID from localStorage
    const currentStaffId = localStorage.getItem('staffId') || localStorage.getItem('userId');
    if (!currentStaffId) {
      alert('Không tìm thấy thông tin staff. Vui lòng đăng nhập lại.');
      return;
    }

    // Confirm action
    const confirmMessage = newStatus === 'completed'
      ? 'Bạn có chắc chắn muốn đánh dấu trao đổi pin này là hoàn thành?'
      : 'Bạn có chắc chắn muốn hủy trao đổi pin này?';

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setUpdatingStatus(prev => ({ ...prev, [exchangeBatteryId]: true }));

      console.log('Updating exchange battery status:', {
        ExchangeBatteryId: exchangeBatteryId,
        Status: newStatus,
        StaffId: currentStaffId
      });

      const response = await authAPI.updateExchangeStatus({
        ExchangeBatteryId: exchangeBatteryId,
        Status: newStatus,
        StaffId: currentStaffId
      });

      console.log('Update exchange status response:', response);

      if (response?.isSuccess || response?.success) {
        // Update local state
        setExchangeBatteries(prev =>
          prev.map(exchange =>
            (exchange.exchangeBatteryId === exchangeBatteryId || exchange.id === exchangeBatteryId)
              ? { ...exchange, status: newStatus }
              : exchange
          )
        );

        alert(`Đã cập nhật trạng thái trao đổi pin thành: ${newStatus === 'completed' ? 'Hoàn thành' : 'Đã hủy'}`);
      } else {
        throw new Error(response?.message || 'Cập nhật thất bại');
      }
    } catch (error) {
      console.error('Error updating exchange status:', error);
      alert('Lỗi khi cập nhật trạng thái: ' + (error.message || 'Unknown error'));
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [exchangeBatteryId]: false }));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleString('vi-VN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh'
      });
    } catch { return dateString; }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Active':
        return {
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          emoji: '🟢'
        };
      case 'Pending':
        return {
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          emoji: '🟡'
        };
      default:
        return {
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          emoji: '🔴'
        };
    }
  };

  const getBatteryStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'available':
      case 'active':
        return '#10b981'; // green
      case 'charging':
        return '#f59e0b'; // orange
      case 'maintenance':
        return '#ef4444'; // red
      case 'inactive':
        return '#6b7280'; // gray
      default:
        return '#3b82f6'; // blue
    }
  };

  const statusStyle = getStatusStyle(schedule.status);

  // Open Pay Modal with prefilled order info for a specific exchange battery
  const handlePayForExchange = async (exchange) => {
    try {
      if (!schedule.formId) {
        alert('Thiếu Form ID cho lịch trình này');
        return;
      }

      const exchangeBatteryId = exchange?.exchangeBatteryId || exchange?.id;
      const newBatteryId = exchange?.newBatteryId || exchange?.newBatteryID || exchange?.newBattery || exchange?.newBatteryIdString;

      if (!exchangeBatteryId) {
        alert('Không tìm thấy ExchangeBatteryId');
        return;
      }

      // Lấy thông tin Form để lấy accountId và tên KH
      const formRes = await formAPI.getFormById(schedule.formId);
      const formData = formRes?.data || formRes;
      const accountId = formData?.accountId || formData?.AccountId || formData?.accountID;
      const customerName = formData?.customerName || formData?.name || 'Khach Hang';

      if (!accountId) {
        throw new Error('Không tìm thấy AccountId từ Form.');
      }
      // Total tạm thời 10000 theo yêu cầu
      const total = 10000;

      // Lưu draft và mở modal xác nhận/thanh toán
      setOrderDraft({
        accountId,
        total,
        batteryId: newBatteryId || '',
        serviceId: schedule.formId,
        serviceType: 'PaidAtStation',
        exchangeBatteryId,
        customerName,
      });
      setPayError('');
      setShowPayModal(true);
    } catch (err) {
      console.error('Error creating payment for exchange:', err);
      alert(err?.message || 'Không thể khởi tạo thanh toán.');
    }
  };

  const handleCreatePaymentNow = async () => {
    if (!orderDraft) return;
    setPayError('');
    setCreatingPayment(true);
    try {
      const payload = {
        serviceType: orderDraft.serviceType,
        total: orderDraft.total,
        accountId: orderDraft.accountId,
        serviceId: orderDraft.serviceId,
        batteryId: orderDraft.batteryId,
        exchangeBatteryId: orderDraft.exchangeBatteryId, // Truyền ExchangeBatteryId thay vì ExchangeId
      };

      console.log('Creating order with payload:', payload);
      const orderRes = await authAPI.createOrder(payload);
      console.log('Create order response:', orderRes);
      
      const orderId =
        orderRes?.data?.orderId ||
        orderRes?.data?.OrderId ||
        orderRes?.data?.id ||
        orderRes?.orderId ||
        orderRes?.OrderId ||
        orderRes?.id;

      if (!orderId) {
        throw new Error('Không nhận được OrderId sau khi tạo Order.');
      }

      // Lưu orderId vào state
      setSavedOrders(prev => ({
        ...prev,
        [orderDraft.exchangeBatteryId]: orderId
      }));

      console.log('Order created successfully with ID:', orderId);
      alert(`Đã tạo Order thành công với ID: ${orderId}`);

      const description = `${orderDraft.customerName || 'Khach Hang'} CHUYEN TIEN`;
      const payRes = await authAPI.createPayOSPayment({ orderId, description });
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
        throw new Error('Không nhận được link thanh toán từ PayOS.');
      }

      try {
        sessionStorage.setItem('paymentCtx', JSON.stringify({
          orderId,
          serviceType: orderDraft.serviceType,
          formId: orderDraft.serviceId,
          batteryId: orderDraft.batteryId,
          total: orderDraft.total,
          exchangeBatteryId: orderDraft.exchangeBatteryId,
        }));
      } catch {}

      setShowPayModal(false);
      window.location.href = redirectUrl;
    } catch (err) {
      console.error('Error creating PayOS payment:', err);
      setPayError(err?.message || 'Không thể tạo mã thanh toán.');
    } finally {
      setCreatingPayment(false);
    }
  };

  // Hàm thanh toán lại với orderId đã lưu
  const handleRetryPayment = async (exchangeBatteryId) => {
    const orderId = savedOrders[exchangeBatteryId];
    if (!orderId) {
      alert('Không tìm thấy OrderId để thanh toán lại');
      return;
    }

    try {
      setRetryingPayment(prev => ({ ...prev, [exchangeBatteryId]: true }));
      
      const description = `Thanh toan lai Order ${orderId}`;
      console.log('Retrying payment for orderId:', orderId);
      
      const payRes = await authAPI.createPayOSPayment({ orderId, description });
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
        throw new Error('Không nhận được link thanh toán từ PayOS.');
      }

      try {
        sessionStorage.setItem('paymentCtx', JSON.stringify({
          orderId,
          serviceType: 'PaidAtStation',
          formId: schedule.formId,
          total: 10000,
          exchangeBatteryId,
        }));
      } catch {}

      window.location.href = redirectUrl;
    } catch (err) {
      console.error('Error retrying PayOS payment:', err);
      alert('Lỗi khi thanh toán lại: ' + (err?.message || 'Unknown error'));
    } finally {
      setRetryingPayment(prev => ({ ...prev, [exchangeBatteryId]: false }));
    }
  };

  return (
    <div
      style={{
        padding: '16px',
        background: 'rgba(255,255,255,0.95)',
        borderRadius: '12px',
        border: '2px solid rgba(226, 232, 240, 0.8)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        transition: 'all 0.2s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '12px'
      }}>
        <div style={{ flex: 1 }}>
          <h4 style={{
            margin: '0 0 8px 0',
            color: '#0f172a',
            fontSize: '16px',
            fontWeight: '600'
          }}>
            🏢 {schedule.stationName || schedule.station?.stationName || `Trạm ${schedule.stationId}`}
          </h4>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            <span style={{
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '700',
              background: statusStyle.background,
              color: 'white'
            }}>
              {statusStyle.emoji} {schedule.status}
            </span>
            <span style={{
              fontSize: '12px',
              color: '#64748b',
              background: 'rgba(15,23,42,0.05)',
              padding: '4px 8px',
              borderRadius: '6px'
            }}>
              ID: {schedule.stationScheduleId}
            </span>
          </div>
        </div>
      </div>

      <div style={{
        color: '#475569',
        fontSize: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        {schedule.description && (
          <div>
            <strong>Mô tả:</strong> {schedule.description}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <strong>Form ID:</strong> {schedule.formId || 'N/A'}
          </div>
          <div>
            <strong>Trạm ID:</strong> {schedule.stationId}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <strong>Ngày đăng ký:</strong> {formatDate(schedule.date)}
          </div>
          <div>
            <strong>Ngày tạo:</strong> {formatDate(schedule.startDate)}
          </div>
        </div>

        {/* Nút Chi tiết Form - MỚI THÊM */}
        {schedule.formId && (
          <div style={{ marginTop: '12px' }}>
            <button
              onClick={() => onViewFormDetail(schedule.formId)}
              style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              📋 Chi tiết Form
            </button>
          </div>
        )}

        {/* Exchange Batteries Section - CẬP NHẬT */}
        <div style={{ marginTop: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px'
          }}>
            <strong>🔋 Pin trao đổi:</strong>
            {loadingExchanges && (
              <span style={{
                fontSize: '12px',
                color: '#64748b',
                fontStyle: 'italic'
              }}>
                ⏳ Đang tải...
              </span>
            )}
          </div>

          {!loadingExchanges && (
            <div style={{
              marginTop: '4px',
              padding: '12px',
              background: 'rgba(15,23,42,0.03)',
              borderRadius: '8px',
              border: '1px solid rgba(226, 232, 240, 0.6)'
            }}>
              {exchangeBatteries.length === 0 ? (
                <div style={{
                  fontSize: '12px',
                  color: '#64748b',
                  fontStyle: 'italic',
                  textAlign: 'center',
                  padding: '8px'
                }}>
                  📭 Không có pin trao đổi nào
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '6px' }}>
                  {exchangeBatteries.map((exchange, idx) => (
                    <div
                      key={exchange?.exchangeBatteryId || exchange?.id || idx}
                      style={{
                        fontSize: '12px',
                        padding: '8px',
                        background: 'white',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'stretch',
                        gap: '18px'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {exchange.vehicleName && (
                          <div style={{ fontSize: '11px', color: '#0369a1' }}>
                            🚗 Xe: {exchange.vehicleName}
                          </div>
                        )}
                        {/* old/new battery info */}
                        <div style={{ fontSize: '11px', marginTop: '2px', color: '#a16207' }}>
                          🪫 Old:
                          <span style={{ marginLeft: 4, fontWeight: 500 }}>
                            {exchange.oldBatteryId || 'N/A'}
                          </span>
                          {exchange.oldBatteryName && (
                            <span style={{ marginLeft: 8, fontStyle: 'italic', color: '#b91c1c' }}>
                              {exchange.oldBatteryName}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '11px', marginTop: '0', color: '#16a34a' }}>
                          🔋 New:
                          <span style={{ marginLeft: 4, fontWeight: 500 }}>
                            {exchange.newBatteryId || 'N/A'}
                          </span>
                          {exchange.newBatteryName && (
                            <span style={{ marginLeft: 8, fontStyle: 'italic', color: '#166534' }}>
                              {exchange.newBatteryName}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', minWidth: 160 }}>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '8px',
                          fontSize: '10px',
                          fontWeight: '600',
                          backgroundColor: getBatteryStatusColor(exchange.status),
                          color: 'white'
                        }}>
                          {exchange.status || 'Unknown'}
                        </span>
                        {exchange.exchangeId && (
                          <div style={{ fontSize: '10px', color: '#64748b' }}>
                            ExchangeBatteryId: {exchange.exchangeId}
                          </div>
                        )}
                        {/* also show exchangeBatteryId if not shown above */}
                        {exchange.exchangeBatteryId && (
                          <div style={{ fontSize: '10px', color: '#475569' }}>
                            ID: {exchange.exchangeBatteryId}
                          </div>
                        )}

                        {/* Action buttons - CẬP NHẬT để thêm nút thanh toán lại */}
                        {exchange.status && !['completed', 'cancelled'].includes(exchange.status.toLowerCase()) && (
                          <div style={{
                            display: 'flex',
                            gap: '6px',
                            marginTop: '4px',
                            flexWrap: 'wrap'
                          }}>
                            <button
                              onClick={() => handleUpdateExchangeStatus(
                                exchange.exchangeBatteryId || exchange.id,
                                'completed'
                              )}
                              disabled={updatingStatus[exchange.exchangeBatteryId || exchange.id]}
                              style={{
                                background: updatingStatus[exchange.exchangeBatteryId || exchange.id]
                                  ? '#9ca3af'
                                  : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '2px 6px',
                                fontSize: '9px',
                                fontWeight: '600',
                                cursor: updatingStatus[exchange.exchangeBatteryId || exchange.id] ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                                minWidth: '45px'
                              }}
                              onMouseEnter={(e) => {
                                if (!updatingStatus[exchange.exchangeBatteryId || exchange.id]) {
                                  e.target.style.transform = 'scale(1.05)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!updatingStatus[exchange.exchangeBatteryId || exchange.id]) {
                                  e.target.style.transform = 'scale(1)';
                                }
                              }}
                            >
                              {updatingStatus[exchange.exchangeBatteryId || exchange.id] ? '⏳' : '✅'}
                            </button>

                            <button
                              onClick={() => handleUpdateExchangeStatus(
                                exchange.exchangeBatteryId || exchange.id,
                                'cancelled'
                              )}
                              disabled={updatingStatus[exchange.exchangeBatteryId || exchange.id]}
                              style={{
                                background: updatingStatus[exchange.exchangeBatteryId || exchange.id]
                                  ? '#9ca3af'
                                  : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '2px 6px',
                                fontSize: '9px',
                                fontWeight: '600',
                                cursor: updatingStatus[exchange.exchangeBatteryId || exchange.id] ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                                minWidth: '45px'
                              }}
                              onMouseEnter={(e) => {
                                if (!updatingStatus[exchange.exchangeBatteryId || exchange.id]) {
                                  e.target.style.transform = 'scale(1.05)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!updatingStatus[exchange.exchangeBatteryId || exchange.id]) {
                                  e.target.style.transform = 'scale(1)';
                                }
                              }}
                            >
                              {updatingStatus[exchange.exchangeBatteryId || exchange.id] ? '⏳' : '❌'}
                            </button>

                            {/* Nút Thanh toán - chỉ hiện khi chưa có orderId */}
                            {!savedOrders[exchange.exchangeBatteryId || exchange.id] && (
                              <button
                                onClick={() => handlePayForExchange(exchange)}
                                disabled={paying[exchange.exchangeBatteryId || exchange.id]}
                                style={{
                                  background: paying[exchange.exchangeBatteryId || exchange.id]
                                    ? '#9ca3af'
                                    : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '2px 8px',
                                  fontSize: '10px',
                                  fontWeight: '700',
                                  cursor: paying[exchange.exchangeBatteryId || exchange.id] ? 'not-allowed' : 'pointer',
                                  transition: 'all 0.2s',
                                  minWidth: '78px'
                                }}
                                onMouseEnter={(e) => {
                                  if (!paying[exchange.exchangeBatteryId || exchange.id]) {
                                    e.target.style.transform = 'scale(1.05)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!paying[exchange.exchangeBatteryId || exchange.id]) {
                                    e.target.style.transform = 'scale(1)';
                                  }
                                }}
                              >
                                {paying[exchange.exchangeBatteryId || exchange.id] ? '⏳' : '💳 Thanh toán'}
                              </button>
                            )}

                            {/* Nút Thanh toán lại - Hiện khi đã có orderId trong savedOrders HOẶC trong sessionStorage*/}
                            {(savedOrders[exchange.exchangeBatteryId || exchange.id] ||
                              (() => {
                                try {
                                  const paymentCtxRaw = sessionStorage.getItem('paymentCtx');
                                  if (paymentCtxRaw) {
                                    const ctx = JSON.parse(paymentCtxRaw);
                                    const key = exchange.exchangeBatteryId || exchange.id;
                                    if (ctx && typeof ctx === 'object' && !Array.isArray(ctx)) {
                                      if (ctx.exchangeBatteryId === key && ctx.orderId) return true;
                                    } else if (Array.isArray(ctx)) {
                                      // Nếu là mảng, tìm correct exchangeBatteryId
                                      const found = ctx.find(c => c.exchangeBatteryId === key && c.orderId);
                                      if (found) return true;
                                    }
                                  }
                                } catch {}
                                return false;
                              })()
                            ) && (
                              <button
                                onClick={async () => {
                                  const key = exchange.exchangeBatteryId || exchange.id;
                                  setRetryingPayment(prev => ({ ...prev, [key]: true }));

                                  try {
                                    // Lấy orderId từ sessionStorage
                                    let orderId = null;
                                    try {
                                      const paymentCtxRaw = sessionStorage.getItem('paymentCtx');
                                      if (paymentCtxRaw) {
                                        const ctx = JSON.parse(paymentCtxRaw);
                                        if (ctx && typeof ctx === 'object' && !Array.isArray(ctx)) {
                                          if (ctx.exchangeBatteryId === key) {
                                            orderId = ctx.orderId;
                                          }
                                        } else if (Array.isArray(ctx)) {
                                          const found = ctx.find(c => c.exchangeBatteryId === key);
                                          if (found) orderId = found.orderId;
                                        }
                                      }
                                    } catch {}
                                    // Fallback: lấy orderId từ savedOrders, như cũ nếu ko tìm ra trong sessionStorage
                                    orderId = orderId || savedOrders[key];
                                    if (!orderId) {
                                      alert('Không tìm thấy OrderId trong sessionStorage hoặc savedOrders');
                                      return;
                                    }
                                    const description = 'Thanh toán lại';
                                    const payRes = await authAPI.createPayOSPayment({ orderId, description });
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
                                      throw new Error('Không nhận được link thanh toán từ PayOS.');
                                    }
                                    window.location.href = redirectUrl;
                                  } catch (err) {
                                    console.error('Error retry PayOS payment:', err);
                                    alert('Lỗi khi thanh toán lại: ' + (err?.message || 'Unknown error'));
                                  } finally {
                                    setRetryingPayment(prev => ({ ...prev, [key]: false }));
                                  }
                                }}
                                disabled={retryingPayment[exchange.exchangeBatteryId || exchange.id]}
                                style={{
                                  background: retryingPayment[exchange.exchangeBatteryId || exchange.id]
                                    ? '#9ca3af'
                                    : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '2px 8px',
                                  fontSize: '10px',
                                  fontWeight: '700',
                                  cursor: retryingPayment[exchange.exchangeBatteryId || exchange.id] ? 'not-allowed' : 'pointer',
                                  transition: 'all 0.2s',
                                  minWidth: '90px'
                                }}
                                onMouseEnter={(e) => {
                                  if (!retryingPayment[exchange.exchangeBatteryId || exchange.id]) {
                                    e.target.style.transform = 'scale(1.05)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!retryingPayment[exchange.exchangeBatteryId || exchange.id]) {
                                    e.target.style.transform = 'scale(1)';
                                  }
                                }}
                              >
                                {retryingPayment[exchange.exchangeBatteryId || exchange.id] ? '⏳' : '🔄 Thanh toán lại'}
                              </button>
                            )}
                          </div>
                        )}

                        {/* Hiển thị OrderId nếu có */}
                        {savedOrders[exchange.exchangeBatteryId || exchange.id] && (
                          <div style={{
                            fontSize: '9px',
                            color: '#059669',
                            fontWeight: '600',
                            marginTop: '2px',
                            fontFamily: 'monospace'
                          }}>
                            OrderId: {savedOrders[exchange.exchangeBatteryId || exchange.id]}
                          </div>
                        )}

                        {/* Show status message for completed/cancelled */}
                        {exchange.status && ['completed', 'cancelled'].includes(exchange.status.toLowerCase()) && (
                          <div style={{
                            fontSize: '9px',
                            color: exchange.status.toLowerCase() === 'completed' ? '#059669' : '#dc2626',
                            fontWeight: '600',
                            marginTop: '2px'
                          }}>
                            {exchange.status.toLowerCase() === 'completed' ? '✅ Hoàn thành' : '❌ Đã hủy'}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pay Modal */}
      {showPayModal && orderDraft && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: 20,
            width: '90%',
            maxWidth: 580,
            boxShadow: '0 10px 20px rgba(0,0,0,0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, color: '#0f172a' }}>🧾 Xác nhận Order</h3>
              <button
                onClick={() => setShowPayModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>
            <div style={{ fontSize: 13, color: '#334155', marginBottom: 10 }}>Vui lòng kiểm tra thông tin trước khi tạo mã thanh toán.</div>

            <table style={{ width: '100%', fontSize: 13, marginBottom: 12 }}>
              <tbody>
                <tr><td style={{ fontWeight: 600, padding: '6px 6px 6px 0' }}>AccountId</td><td>{orderDraft.accountId}</td></tr>
                <tr><td style={{ fontWeight: 600, padding: '6px 6px 6px 0' }}>ServiceType</td><td>{orderDraft.serviceType}</td></tr>
                <tr><td style={{ fontWeight: 600, padding: '6px 6px 6px 0' }}>ServiceId (FormId)</td><td>{orderDraft.serviceId}</td></tr>
                <tr><td style={{ fontWeight: 600, padding: '6px 6px 6px 0' }}>BatteryId (New)</td><td>{orderDraft.batteryId || 'N/A'}</td></tr>
                <tr><td style={{ fontWeight: 600, padding: '6px 6px 6px 0' }}>ExchangeBatteryId</td><td>{orderDraft.exchangeBatteryId}</td></tr>
                <tr><td style={{ fontWeight: 600, padding: '6px 6px 6px 0' }}>Total</td><td>{orderDraft.total}₫</td></tr>
              </tbody>
            </table>

            {payError && (
              <div style={{ color: '#dc2626', fontSize: 12, marginBottom: 8 }}>❌ {payError}</div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={() => setShowPayModal(false)}
                style={{
                  background: 'rgba(15,23,42,0.06)',
                  color: '#0f172a',
                  border: '1px solid rgba(15,23,42,0.12)',
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Đóng
              </button>
              <button
                onClick={handleCreatePaymentNow}
                disabled={creatingPayment}
                style={{
                  background: creatingPayment ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 14px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: creatingPayment ? 'not-allowed' : 'pointer'
                }}
              >
                {creatingPayment ? '⏳ Đang tạo...' : '💳 Tạo mã thanh toán'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Main Calendar component - ĐÃ CẬP NHẬT
export default function Calendar({ onDateSelect }) {
  const today = todayDateObj();
  const [currentMonth, setCurrentMonth] = useState(today.month);
  const [currentYear, setCurrentYear] = useState(today.year);
  const [selectedDate, setSelectedDate] = useState(null);
  const [allSchedules, setAllSchedules] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [loading, setLoading] = useState(false);

  // State mới cho Form Detail
  const [selectedForm, setSelectedForm] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Calculate next month
  const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
  const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;

  // Fetch ALL station schedules - ĐÃ SỬA
  useEffect(() => {
    const fetchAllSchedules = async () => {
      try {
        setLoading(true);
        console.log('Fetching ALL station schedules');
        
        // SỬA: Dùng getAllStationSchedules thay vì getStationSchedulesByStationId
        const response = await authAPI.getAllStationSchedules();
        console.log('ALL station schedules response:', response);
        
        // Xử lý response - có thể là array trực tiếp hoặc nested trong data
        const schedules = Array.isArray(response?.data) ? response.data : 
                         (Array.isArray(response) ? response : []);
        setAllSchedules(schedules);
      } catch (error) {
        console.error('Error fetching ALL station schedules:', error);
        setAllSchedules([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllSchedules();
  }, []);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const handleDateSelect = (date) => {
    console.log('Date selected:', date);
    setSelectedDate(date);

    // Format selected date to compare with schedule dates
    const selectedDateStr = `${date.year}-${String(date.month + 1).padStart(2, '0')}-${String(date.date).padStart(2, '0')}`;

    console.log('Looking for schedules on:', selectedDateStr);
    console.log('Total schedules available:', allSchedules.length);

    // Filter ALL schedules for the selected date - ĐÃ SỬA để xử lý tất cả lịch trình
    const filtered = allSchedules.filter(schedule => {
      if (!schedule.date) return false;

      const scheduleDate = new Date(schedule.date);
      // Use UTC methods to avoid timezone issues
      const scheduleDateStr = `${scheduleDate.getUTCFullYear()}-${String(scheduleDate.getUTCMonth() + 1).padStart(2, '0')}-${String(scheduleDate.getUTCDate()).padStart(2, '0')}`;

      console.log('Schedule date:', scheduleDateStr, 'for schedule:', schedule.stationScheduleId);

      return scheduleDateStr === selectedDateStr;
    });

    console.log('Found schedules:', filtered.length);
    setFilteredSchedules(filtered);

    // Call callback function from parent component
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  // Hàm xử lý xem chi tiết Form - ĐÃ CẬP NHẬT
  const handleViewFormDetail = async (formId) => {
    if (!formId) {
      alert('Không có Form ID');
      return;
    }

    try {
      setFormLoading(true);
      console.log('Fetching form details for ID:', formId);

      const response = await formAPI.getFormById(formId);
      console.log('Form API response:', response);

      if (response.isSuccess && response.data) {
        const formData = response.data;
        setSelectedForm(formData);
        setShowFormModal(true);
      } else {
        alert('Không thể lấy thông tin form: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error fetching form details:', error);
      alert('Lỗi khi lấy thông tin form: ' + (error.message || 'Unknown error'));
    } finally {
      setFormLoading(false);
    }
  };

  const handleYearChange = (e) => {
    setCurrentYear(parseInt(e.target.value));
  };

  const handleMonthChange = (e) => {
    setCurrentMonth(parseInt(e.target.value));
  };

  const buttonStyle = {
    background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    border: "none",
    borderRadius: 12,
    padding: "12px 20px",
    fontSize: 18,
    cursor: "pointer",
    color: "#fff",
    fontWeight: 600,
    transition: "all 0.2s",
    boxShadow: "0 2px 8px 0 #3b82f622",
  };

  return (
    <div
      style={{
        maxWidth: 1000,
        margin: "40px auto",
        background: "linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%)",
        borderRadius: 20,
        boxShadow: "0 8px 32px 0 #64748b22",
        padding: 40,
      }}
    >
      <h1
        style={{
          fontSize: 36,
          fontWeight: 800,
          textAlign: "center",
          marginBottom: 16,
          color: "#0ea5e9",
          letterSpacing: 1,
        }}
      >
        📅 Lịch Chọn Ngày
      </h1>

      {/* Date/Month/Year selectors */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <select
          value={currentMonth}
          onChange={handleMonthChange}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "2px solid #e2e8f0",
            fontSize: 16,
            fontWeight: 600,
            color: "#334155",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          {monthNames.map((name, index) => (
            <option key={index} value={index}>
              {name}
            </option>
          ))}
        </select>

        <input
          type="number"
          value={currentYear}
          onChange={handleYearChange}
          min="1900"
          max="2100"
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "2px solid #e2e8f0",
            fontSize: 16,
            fontWeight: 600,
            color: "#334155",
            background: "#fff",
            width: 100,
            textAlign: "center",
          }}
        />
      </div>

      {/* Navigation buttons */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
          gap: 20,
        }}
      >
        <button
          onClick={handlePrevMonth}
          style={buttonStyle}
          onMouseEnter={(e) => {
            e.target.style.transform = "translateY(-2px)";
            e.target.style.boxShadow = "0 4px 12px 0 #3b82f644";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 2px 8px 0 #3b82f622";
          }}
        >
          ← Tháng trước
        </button>

        <button
          onClick={handleNextMonth}
          style={buttonStyle}
          onMouseEnter={(e) => {
            e.target.style.transform = "translateY(-2px)";
            e.target.style.boxShadow = "0 4px 12px 0 #3b82f644";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 2px 8px 0 #3b82f622";
          }}
        >
          Tháng sau →
        </button>
      </div>

      {/* Selected date display */}
      {selectedDate && (
        <div
          style={{
            textAlign: "center",
            marginBottom: 20,
            padding: "12px 24px",
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            color: "#fff",
            borderRadius: 12,
            fontWeight: 600,
            fontSize: 18,
            boxShadow: "0 2px 8px 0 #10b98122",
          }}
        >
          Ngày đã chọn: {selectedDate.date}/{selectedDate.month + 1}/{selectedDate.year}
        </div>
      )}

      {/* Two month calendars */}
      <div
        style={{
          display: "flex",
          gap: 20,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <MonthCalendar
          year={currentYear}
          month={currentMonth}
          today={today}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
        />
        <MonthCalendar
          year={nextYear}
          month={nextMonth}
          today={today}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
        />
      </div>

      {/* Display filtered schedules - CẬP NHẬT để truyền prop onViewFormDetail */}
      {selectedDate && (
        <div style={{
          marginTop: 30,
          background: 'rgba(255,255,255,0.9)',
          borderRadius: 16,
          padding: 20
        }}>
          <h3 style={{
            margin: '0 0 20px 0',
            color: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📅 Lịch trình ngày {selectedDate.date}/{selectedDate.month + 1}/{selectedDate.year}
            {loading && <span style={{ fontSize: 14, color: '#64748b' }}>(Đang tải...)</span>}
          </h3>

          {filteredSchedules.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#64748b',
              fontStyle: 'italic'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📭</div>
              <h4 style={{ color: '#475569', marginBottom: '8px' }}>Không có lịch trình</h4>
              <p>Không có lịch trình nào cho ngày này.</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gap: '16px',
              maxHeight: '500px',
              overflowY: 'auto',
              padding: '10px'
            }}>
              {filteredSchedules.map((schedule, index) => (
                <ScheduleItem
                  key={`${schedule.stationScheduleId}-${index}`}
                  schedule={schedule}
                  onViewFormDetail={handleViewFormDetail}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Form Detail Modal - ĐÃ CẬP NHẬT */}
      {showFormModal && (
        <FormDetailModal
          form={selectedForm}
          onClose={() => {
            setShowFormModal(false);
            setSelectedForm(null);
          }}
        />
      )}

      {/* Loading indicator for form */}
      {formLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1001,
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⏳</div>
            <p style={{ margin: 0, color: '#334155', fontWeight: '600' }}>Đang tải thông tin Form...</p>
          </div>
        </div>
      )}
    </div>
  );
}