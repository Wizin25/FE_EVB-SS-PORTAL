import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/authAPI';
import { formAPI } from '../services/formAPI';
import Header from './header';
import Footer from './footer';
import './StationScheH.css';

export default function StationScheduleHistory() {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [stations, setStations] = useState([]); // Thêm state để lưu danh sách trạm
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") || "light";
    }
    return "light";
  });

  useEffect(() => {
    getCurrentUser();
    // Áp dụng theme khi component mount
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const handleToggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleOpenBooking = () => {
    navigate('/booking');
  };

  const getCurrentUser = async () => {
    try {
      setLoading(true);
      const userData = await authAPI.getCurrent();
      
      if (userData) {
        setCurrentUser(userData);
        await Promise.all([
          fetchStations(), // Lấy danh sách trạm
          fetchUserSchedules(userData.accountId || userData.id)
        ]);
      } else {
        throw new Error('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
      }
    } catch (err) {
      console.error('Error getting current user:', err);
      setError(err.message || 'Có lỗi xảy ra khi tải thông tin người dùng');
      setLoading(false);
    }
  };

  // Thêm hàm để lấy danh sách trạm
  const fetchStations = async () => {
    try {
      const stationsData = await authAPI.getAllStations();
      setStations(stationsData);
    } catch (err) {
      console.error('Error fetching stations:', err);
    }
  };

  const fetchUserSchedules = async (accountId) => {
    try {
      if (!accountId) {
        throw new Error('Không tìm thấy thông tin tài khoản');
      }

      let schedulesData = [];

      // Ưu tiên sử dụng API getStationSchedulesByAccountId
      try {
        console.log('Trying to get station schedules by account ID:', accountId);
        const schedulesResponse = await authAPI.getStationSchedulesByAccountId(accountId);
        
        if (schedulesResponse?.isSuccess) {
          schedulesData = schedulesResponse.data || [];
          console.log('Found station schedules:', schedulesData);
        }
      } catch (schedulesError) {
        console.log('Station schedules API failed, trying alternative methods...', schedulesError);
      }

      // Fallback: thử các API khác nếu cần
      if (schedulesData.length === 0) {
        try {
          console.log('Trying to get forms by account ID:', accountId);
          const formsResponse = await formAPI.getFormsByAccountId(accountId);
          
          if (formsResponse?.isSuccess) {
            schedulesData = formsResponse.data || [];
            console.log('Found forms data:', schedulesData);
          }
        } catch (formsError) {
          console.log('Forms API failed:', formsError);
        }
      }

      // Fallback cuối cùng
      if (schedulesData.length === 0) {
        try {
          console.log('Trying to get all station schedules...');
          const allSchedulesResponse = await authAPI.getAllStationSchedules();
          
          if (allSchedulesResponse?.isSuccess) {
            const allSchedules = allSchedulesResponse.data || [];
            schedulesData = allSchedules.filter(schedule => 
              schedule.accountId === accountId || 
              schedule.AccountId === accountId
            );
            console.log('Filtered schedules:', schedulesData);
          }
        } catch (schedulesError) {
          console.log('All station schedules API failed:', schedulesError);
        }
      }

      // Lọc chỉ lấy các lịch có status "Completed"
      const completedSchedules = schedulesData.filter(schedule => 
        schedule.status?.toLowerCase() === 'completed'
      );

      setSchedules(completedSchedules);

      if (completedSchedules.length === 0) {
        setError('Không tìm thấy lịch sử đặt lịch đã hoàn thành. Có thể bạn chưa có lịch đặt nào hoặc chưa có lịch nào hoàn thành.');
      }

    } catch (err) {
      console.error('Error fetching schedules:', err);
      setError(err.message || 'Có lỗi xảy ra khi tải dữ liệu lịch sử');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
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
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Pending': { class: 'status-pending', text: 'Đang chờ' },
      'Confirmed': { class: 'status-confirmed', text: 'Đã xác nhận' },
      'Completed': { class: 'status-completed', text: 'Hoàn thành' },
      'Cancelled': { class: 'status-cancelled', text: 'Đã hủy' },
      'Approved': { class: 'status-confirmed', text: 'Đã xác nhận' },
      'Rejected': { class: 'status-cancelled', text: 'Đã từ chối' },
      'Active': { class: 'status-confirmed', text: 'Đang hoạt động' },
      'Inactive': { class: 'status-cancelled', text: 'Không hoạt động' }
    };
    
    const config = statusConfig[status] || { class: 'status-default', text: status || 'Unknown' };
    return <span className={`status-badge ${config.class}`}>{config.text}</span>;
  };

  // Các hàm helper để lấy thông tin từ schedule - ĐÃ SỬA ĐỔI
  const getScheduleId = (schedule) => {
    return schedule.stationScheduleId || schedule.formId || schedule.id;
  };

  const getStationInfo = (schedule) => {
    // Ưu tiên các trường có thể chứa tên trạm
    if (schedule.stationName) return schedule.stationName;
    if (schedule.station?.name) return schedule.station.name;
    
    // Nếu có stationId, tìm tên trạm từ danh sách stations
    const stationId = schedule.stationId || schedule.stationID;
    if (stationId && stations.length > 0) {
      const foundStation = stations.find(station => 
        station.stationId === stationId || station.id === stationId
      );
      if (foundStation) {
        return foundStation.name || foundStation.stationName || `Trạm ${stationId}`;
      }
    }
    
    // Fallback: hiển thị ID trạm nếu có
    if (stationId) return `Trạm ${stationId}`;
    
    return 'Đang cập nhật';
  };

  const getDescription = (schedule) => {
    return schedule.description || schedule.note || schedule.title || 'Không có mô tả';
  };

  const getDateTime = (schedule) => {
    return schedule.date || schedule.dateTime || schedule.createdDate;
  };

  // ... (phần còn lại của component giữ nguyên)
  
  return (
    <div style={{ 
      maxHeight: '100vh',
      minHeight: '100vh',
      backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb'
    }}>
      <Header
        onToggleTheme={handleToggleTheme}
        theme={theme}
        user={currentUser}
        unreadCount={0}
        nextBooking={null}
        onOpenBooking={handleOpenBooking}
      />
      
      <div className="container">
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              onClick={() => navigate(-1)} 
              className="btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <span>←</span> Quay lại
            </button>
          </div>
        </div>

        {error && (
          <div className="warning-message">
            ⚠️ {error}
          </div>
        )}

        {schedules.length === 0 ? (
          <div className="empty-state">
            <h3>✅ Chưa có lịch đặt nào đã hoàn thành</h3>
            <p>Các lịch đặt đã hoàn thành sẽ được hiển thị tại đây</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '16px' }}>
              <button 
                onClick={() => navigate(-1)} 
                className="btn-outline"
              >
                ↩️ Quay lại
              </button>
              <button 
                onClick={() => navigate('/booking')} 
                className="btn-primary"
              >
                📝 Đặt Lịch Ngay
              </button>
            </div>
          </div>
        ) : (
          <div className="schedules-list">
            <div className="schedule-count">
              Hiển thị {schedules.length} lịch đặt đã hoàn thành
            </div>
            {schedules.map((schedule, index) => (
              <div key={getScheduleId(schedule) || `schedule-${index}`} className="schedule-card">
                <div className="schedule-header">
                  {getStatusBadge(schedule.status)}
                </div>
                
                <div className="schedule-details">
                  <div className="detail-row">
                    <span className="label">📅 Thời gian:</span>
                    <span className="value">
                      {formatDate(getDateTime(schedule))}
                    </span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="label">🏢 Trạm:</span>
                    <span className="value">{getStationInfo(schedule)}</span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="label">📝 Mô tả:</span>
                    <span className="value">{getDescription(schedule)}</span>
                  </div>
                  
                  {schedule.exchangeBatteries && schedule.exchangeBatteries.length > 0 && (
                    <div className="detail-row">
                      <span className="label">🔋 Số lần đổi pin:</span>
                      <span className="value">{schedule.exchangeBatteries.length}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
}