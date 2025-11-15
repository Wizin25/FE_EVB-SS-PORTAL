import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/authAPI';
import { formAPI } from '../services/formAPI';
import Header from '../Home/header';
import Footer from '../Home/footer';
import './StationScheH.css';

export default function StationScheduleHistory() {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [stations, setStations] = useState([]); // Thêm state để lưu danh sách trạm
  const [sortBy, setSortBy] = useState('date'); // 'station' | 'date'
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
              schedule.AccountId === accountId ||
              schedule.batteryId === batteryId ||
              schedule.BatteryId === batteryId
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

  // Sắp xếp schedules theo station hoặc date
  const sortedSchedules = React.useMemo(() => {
    if (!Array.isArray(schedules)) return [];
    let result = [...schedules];
    
    if (sortBy === 'station') {
      // Sắp xếp theo tên trạm
      result.sort((a, b) => {
        const stationA = getStationInfo(a).toLowerCase();
        const stationB = getStationInfo(b).toLowerCase();
        return stationA.localeCompare(stationB);
      });
    } else if (sortBy === 'date') {
      // Sắp xếp theo ngày mới nhất
      result.sort((a, b) => {
        const dateA = new Date(getDateTime(a) || 0);
        const dateB = new Date(getDateTime(b) || 0);
        return dateB - dateA;
      });
    }
    
    return result;
  }, [schedules, sortBy]);
  
  // Scroll styles
  const scrollStyles = {
    height: "100vh",
    overflowY: "auto",
    overflowX: "hidden",
    WebkitOverflowScrolling: "touch",
    scrollBehavior: "smooth"
  };

  return (
    <div style={{ 
      ...scrollStyles,
      backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb'
    }}>
      {/* Sticky Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 1000 }}>
        <Header
          onToggleTheme={handleToggleTheme}
          theme={theme}
          user={currentUser}
          unreadCount={0}
          nextBooking={null}
          onOpenBooking={handleOpenBooking}
        />
      </div>
      
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
  <>
    {/* Sort Buttons */}
    <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
      <button
        onClick={() => setSortBy('station')}
        style={{
          fontSize: 13,
          padding: '8px 16px',
          fontWeight: 600,
          borderRadius: '8px',
          border: sortBy === 'station' ? '1.5px solid #0ea5e9' : '1px solid #d1d5db',
          background: sortBy === 'station' ? (theme === 'dark' ? '#1e293b' : '#f1f5f9') : 'transparent',
          color: sortBy === 'station' ? '#0ea5e9' : (theme === 'dark' ? '#e5e7eb' : '#374151'),
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
        type="button"
      >
        Sắp xếp theo trạm
      </button>
      <button
        onClick={() => setSortBy('date')}
        style={{
          fontSize: 13,
          padding: '8px 16px',
          fontWeight: 600,
          borderRadius: '8px',
          border: sortBy === 'date' ? '1.5px solid #0ea5e9' : '1px solid #d1d5db',
          background: sortBy === 'date' ? (theme === 'dark' ? '#1e293b' : '#f1f5f9') : 'transparent',
          color: sortBy === 'date' ? '#0ea5e9' : (theme === 'dark' ? '#e5e7eb' : '#374151'),
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
        type="button"
      >
        Sắp xếp theo ngày
      </button>
    </div>

    <div className="schedule-count">
      Hiển thị {sortedSchedules.length} lịch đặt đã hoàn thành
    </div>

    <div className="schedules-list">
      {sortedSchedules.map((schedule, index) => (
        <div key={getScheduleId(schedule) || `schedule-${index}`} className="schedule-card">
          <div className="schedule-card-inner">
            {/* Ticket Top Section - Header */}
            <div className="schedule-header" style={{
              padding: '20px 24px',
              background: '#e0f2fe',
              borderBottom: '1px dashed #000000'
            }}>
              <div className="schedule-header-left" style={{
                gap: '16px',
                flex: 1
              }}>
                <div className="schedule-title" style={{ flex: 1 }}>
                  <div className="schedule-id" style={{
                    fontSize: '11px',
                    color: '#0ea5e9',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginBottom: '6px'
                  }}>
                    Mã đặt lịch: {getScheduleId(schedule)}
                  </div>
                  <div className="schedule-station-name" style={{
                    fontSize: '20px',
                    fontWeight: '800',
                    background: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
                    WebkitBackgroundClip: 'text',
                    color: '#DAA520',
                    backgroundClip: 'text',
                    lineHeight: '1.3'
                  }}>
                    {getStationInfo(schedule)}
                  </div>
                </div>
              </div>
            </div>

            {/* Ticket Main Content - Horizontal Layout */}
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              minHeight: '160px',
              position: 'relative'
            }}>
              {/* Left Side - Details */}
              <div style={{
                flex: 1,
                background: '#e0f2fe',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}>
                {/* Info Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '20px'
                }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <div style={{
                      fontSize: '10px',
                      fontWeight: '700',
                      color: '#0ea5e9',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      📅 Thời gian đặt lịch
                    </div>
                    <div style={{
                      fontSize: '15px',
                      fontWeight: '700',
                      color: '#000000',
                      lineHeight: '1.4'
                    }}>
                      {formatDate(getDateTime(schedule))}
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <div style={{
                      fontSize: '10px',
                      fontWeight: '700',
                      color: '#0ea5e9',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      🏢 Trạm sạc
                    </div>
                    <div style={{
                      fontSize: '15px',
                      fontWeight: '700',
                      color: '#000000',
                      lineHeight: '1.4'
                    }}>
                      {getStationInfo(schedule)}
                    </div>
                  </div>
                </div>

                {/* Description Section */}
                {getDescription(schedule) && getDescription(schedule) !== 'Không có mô tả' && (
                  <div style={{
                    paddingTop: '16px',
                    borderTop: '1px solid #000000'
                  }}>
                    <div style={{
                      fontSize: '10px',
                      fontWeight: '700',
                      color: '#0ea5e9',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '8px'
                    }}>
                      📝 Mô tả
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: '#000000',
                      lineHeight: '1.6',
                      fontWeight: '600'
                    }}>
                      {getDescription(schedule)}
                    </div>
                  </div>
                )}
              </div>

              {/* Vertical Divider with Perforated Style */}
              <div style={{
                position: 'relative',
                width: '1px',
                background: 'transparent',
                margin: '20px 0',
                flexShrink: 0
              }}>
                <div style={{
                  position: 'absolute',
                  top: '0',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '1px',
                  height: '100%',
                  background: 'repeating-linear-gradient(to bottom, transparent, transparent 8px, #000000 8px, #000000 16px)'
                }}></div>
              </div>

              {/* Right Side - Status */}
              <div style={{
                width: '160px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                flexShrink: 0,
                background: '#e0f2fe'
              }}>
                <div style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  color: '#0ea5e9',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '4px'
                }}>
                  Trạng thái
                </div>
                {getStatusBadge(schedule.status)}
              </div>
            </div>
          </div>
        </div>
      ))}
          </div>
        </>)}
      </div>
      
      <Footer />
    </div>
  );
}