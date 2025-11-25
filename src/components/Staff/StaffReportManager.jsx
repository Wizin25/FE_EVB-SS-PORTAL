import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { message } from 'antd';
import { authAPI } from '../services/authAPI';

// Helper function for date formatting
const formatDate = (dateString) => {
  if (!dateString || dateString === 'N/A') return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleString('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh'
    });
  } catch { return dateString; }
};

function StaffReportManager() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'startDate', direction: 'desc' });
  const [currentUser, setCurrentUser] = useState(null);
  const [stationAssignments, setStationAssignments] = useState([]);
  const [selectedStationId, setSelectedStationId] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [accountDetails, setAccountDetails] = useState({});
  // Thêm state cho bộ lọc trạng thái
  const [statusFilter, setStatusFilter] = useState('All');
  // State cho cập nhật trạng thái
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Fetch current user on component mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = await authAPI.getCurrent();
        setCurrentUser(user);

        // Extract station assignments from user data
        const assignments = [];
        if (Array.isArray(user?.bssStaffs) && user.bssStaffs.length > 0) {
          user.bssStaffs.forEach((staff, index) => {
            const staffId = staff?.staffId;
            const stationId = staff?.stationId || staff?.StationId;
            
            assignments.push({
              id: `${staffId || index}-${stationId || index}`,
              staffId,
              stationId,
              stationName: stationId || 'Unknown station',
              role: staff?.role || staff?.Role || 'Staff',
            });
          });
        } else {
          const fallbackStationId = user?.stationId || user?.StationId || user?.stationID;
          if (fallbackStationId) {
            assignments.push({
              id: `primary-${fallbackStationId}`,
              staffId: user?.staffId,
              stationId: fallbackStationId,
              stationName: fallbackStationId,
              role: Array.isArray(user?.roles)
                ? user.roles.join(', ')
                : (user?.role || user?.Role || 'Staff'),
            });
          }
        }

        setStationAssignments(assignments);
        
        // Auto-select first station if available
        if (assignments.length > 0) {
          setSelectedStationId(assignments[0].stationId);
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
        message.error('Lỗi khi tải thông tin người dùng');
      }
    };
    
    fetchCurrentUser();
  }, []);

  // Fetch reports when selected station changes
  const fetchReportsByStation = useCallback(async (stationId) => {
    if (!stationId) return;
    
    setLoading(true);
    try {
      const response = await authAPI.getReportsByStationId(stationId);
      
      // Xử lý response theo cấu trúc API
      let reportsList = [];
      if (response?.data?.isSuccess && Array.isArray(response.data.data)) {
        reportsList = response.data.data;
      } else if (Array.isArray(response?.data)) {
        reportsList = response.data;
      } else if (Array.isArray(response)) {
        reportsList = response;
      }
      
      setReports(reportsList);
    } catch (error) {
      console.error('Error fetching reports:', error);
      message.error('Lỗi khi tải báo cáo: ' + (error?.message || 'Lỗi không xác định'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedStationId) {
      fetchReportsByStation(selectedStationId);
    }
  }, [selectedStationId, fetchReportsByStation]);

  // Filter and sort reports
  const filteredSortedReports = useMemo(() => {
    let list = Array.isArray(reports) ? [...reports] : [];
    const term = searchTerm?.trim()?.toLowerCase();
    
    // Filter by search term
    if (term) {
      list = list.filter((r) => {
        const rid = String(r?.reportId || r?.id || '').toLowerCase();
        const name = String(r?.name || '').toLowerCase();
        const desc = String(r?.description || '').toLowerCase();
        const acc = String(r?.accountId || '').toLowerCase();
        const station = String(r?.stationId || '').toLowerCase();
        const status = String(r?.status || '').toLowerCase();
        
        return rid.includes(term) || 
               name.includes(term) || 
               desc.includes(term) || 
               acc.includes(term) || 
               station.includes(term) ||
               status.includes(term);
      });
    }
    
    // Filter by status
    if (statusFilter !== 'All') {
      list = list.filter((r) => {
        const status = (r?.status || '').toLowerCase();
        return status === statusFilter.toLowerCase();
      });
    }
    
    // Sort
    list.sort((a, b) => {
      let aValue, bValue;
      
      if (sortConfig.key === 'startDate') {
        aValue = a?.startDate ? new Date(a.startDate).getTime() : 0;
        bValue = b?.startDate ? new Date(b.startDate).getTime() : 0;
      } else if (sortConfig.key === 'status') {
        aValue = (a?.status || '').toLowerCase();
        bValue = (b?.status || '').toLowerCase();
      }
      
      if (aValue === bValue) return 0;
      
      if (sortConfig.direction === 'asc') {
        return aValue < bValue ? -1 : 1;
      } else {
        return aValue > bValue ? -1 : 1;
      }
    });
    
    return list;
  }, [reports, searchTerm, sortConfig, statusFilter]);

  const handleRefresh = () => {
    if (selectedStationId) {
      fetchReportsByStation(selectedStationId);
    }
  };

  // Lấy thông tin account chi tiết
  const fetchAccountDetails = async (accountId) => {
    if (!accountId) return null;
    
    try {
      // Kiểm tra xem đã có trong cache chưa
      if (accountDetails[accountId]) {
        return accountDetails[accountId];
      }

      const response = await authAPI.getCustomerByAccountId(accountId);
      if (response) {
        const accountInfo = {
          accountName: response.name || 'N/A',
          phoneNumber: response.phone || 'N/A'
        };
        
        // Cache lại thông tin
        setAccountDetails(prev => ({
          ...prev,
          [accountId]: accountInfo
        }));
        
        return accountInfo;
      }
      return null;
    } catch (err) {
      console.error('Error fetching account details:', err);
      return null;
    }
  };

  // Lấy chi tiết báo cáo để hiển thị popup
  const fetchReportDetail = async (report) => {
    try {
      setLoading(true);
      
      // Lấy thông tin account chi tiết
      const accountInfo = await fetchAccountDetails(report.accountId);

      // Kết hợp thông tin vào report data
      const enhancedReportData = {
        ...report,
        accountName: accountInfo?.accountName || 'N/A',
        phoneNumber: accountInfo?.phoneNumber || 'N/A',
        stationName: selectedStationId || 'N/A',
      };

      setSelectedReport(enhancedReportData);
    } catch (err) {
      console.error('Error fetching report detail:', err);
      message.error('Lỗi khi tải chi tiết báo cáo');
    } finally {
      setLoading(false);
    }
  };

  // Đóng popup chi tiết
  const handleCloseDetail = () => {
    setSelectedReport(null);
  };

  // Hàm cập nhật trạng thái report
  const handleUpdateReportStatus = async (reportId, newStatus) => {
    if (!reportId) {
      message.error('Không tìm thấy ID báo cáo');
      return;
    }

    try {
      setUpdatingStatus(true);
      
      // Gọi API cập nhật trạng thái mới
      await authAPI.updateReportStatus(reportId, newStatus);
      
      message.success(`Cập nhật trạng thái thành ${newStatus}`);
      
      // Refresh danh sách
      handleRefresh();
      
      // Cập nhật selectedReport nếu đang mở
      if (selectedReport && (selectedReport.reportId === reportId || selectedReport.id === reportId)) {
        setSelectedReport(prev => ({
          ...prev,
          status: newStatus
        }));
      }
    } catch (error) {
      console.error('Error updating report status:', error);
      message.error('Lỗi khi cập nhật trạng thái: ' + (error?.message || 'Lỗi không xác định'));
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Xử lý thay đổi sort
  const handleSortChange = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  // Xử lý thay đổi bộ lọc trạng thái
  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
  };

  const getStatusClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed') return 'status-chip status-completed';
    if (s === 'pending') return 'status-chip status-pending';
    return 'status-chip status-unknown';
  };

  // Prevent body scroll when popup is open
  useEffect(() => {
    if (selectedReport) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedReport]);

  return (
    <>
      {/* Station Selection and Filters - Enhanced Design */}
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)',
        borderRadius: '20px',
        padding: '24px',
        marginBottom: 24,
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          gap: 20, 
          flexWrap: 'wrap' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', flex: 1 }}>
            {/* Status Filter Buttons */}
            <div style={{ flex: '1 1 auto', minWidth: 200 }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: 8,
                fontSize: 15, 
                fontWeight: 600, 
                marginBottom: 10, 
                color: 'white',
                textShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}>
                <span style={{ fontSize: 18 }}>🎯</span>
                Lọc trạng thái
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { key: 'All', label: 'Tất cả', icon: '📋' },
                  { key: 'Pending', label: 'Chờ xử lý', icon: '⏳' },
                  { key: 'Completed', label: 'Hoàn thành', icon: '✅' }
                ].map(({ key, label, icon }) => (
                  <button
                    key={key}
                    onClick={() => handleStatusFilterChange(key)}
                    style={{ 
                      padding: '10px 18px',
                      borderRadius: '12px',
                      border: 'none',
                      background: statusFilter === key 
                        ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' 
                        : 'rgba(255, 255, 255, 0.15)',
                      color: 'white',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: statusFilter === key 
                        ? '0 4px 15px rgba(59, 130, 246, 0.4)' 
                        : '0 2px 8px rgba(0, 0, 0, 0.1)',
                      transform: statusFilter === key ? 'translateY(-2px)' : 'translateY(0)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                    onMouseEnter={(e) => {
                      if (statusFilter !== key) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (statusFilter !== key) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    <span>{icon}</span>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Buttons */}
            <div style={{ flex: '1 1 auto', minWidth: 200 }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: 8,
                fontSize: 15, 
                fontWeight: 600, 
                marginBottom: 10, 
                color: 'white',
                textShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}>
                <span style={{ fontSize: 18 }}>🔄</span>
                Sắp xếp
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { key: 'startDate', label: 'Ngày', icon: '📅' },
                  { key: 'status', label: 'Trạng thái', icon: '🏷️' }
                ].map(({ key, label, icon }) => (
                  <button
                    key={key}
                    onClick={() => handleSortChange(key)}
                    style={{ 
                      padding: '10px 18px',
                      borderRadius: '12px',
                      border: 'none',
                      background: sortConfig.key === key 
                        ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' 
                        : 'rgba(255, 255, 255, 0.15)',
                      color: 'white',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: sortConfig.key === key 
                        ? '0 4px 15px rgba(139, 92, 246, 0.4)' 
                        : '0 2px 8px rgba(0, 0, 0, 0.1)',
                      transform: sortConfig.key === key ? 'translateY(-2px)' : 'translateY(0)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                    onMouseEnter={(e) => {
                      if (sortConfig.key !== key) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (sortConfig.key !== key) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    <span>{icon}</span>
                    {sortConfig.key === key && sortConfig.direction === 'asc' ? '↑ ' : 
                     sortConfig.key === key && sortConfig.direction === 'desc' ? '↓ ' : ''}
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={loading}
            style={{ 
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              background: loading 
                ? 'rgba(100, 116, 139, 0.5)' 
                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: loading 
                ? 'none' 
                : '0 4px 15px rgba(16, 185, 129, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              alignSelf: 'flex-end'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.4)';
              }
            }}
          >
            <span style={{ fontSize: 18 }}>{loading ? '⏳' : '🔄'}</span>
            {loading ? 'Đang tải...' : 'Làm mới'}
          </button>
        </div>
      </div>
      {/* Results Count */}
      <div style={{ 
        color: 'white', 
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}>
        <span>Hiển thị:</span>
        <strong>{filteredSortedReports.length}</strong>
        <span>báo cáo</span>
        {statusFilter !== 'All' && (
          <span style={{ marginLeft: 8, fontSize: '0.9em', opacity: 0.8 }}>
            (Đang lọc: {statusFilter})
          </span>
        )}
      </div>

      {/* Reports Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'white' }}>
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⏳</div>
          <p>Đang tải báo cáo...</p>
        </div>
      ) : filteredSortedReports.length > 0 ? (
        <div style={{ 
          background: 'rgba(255,255,255,0.95)', 
          borderRadius: '12px',
          overflow: 'hidden'
        }}>
          <div style={{ 
            display: 'grid',
            gap: '16px',
            padding: '20px',
            maxHeight: '600px',
            overflowY: 'auto'
          }}>
            {filteredSortedReports.map((report) => (
              <div
                key={report.reportId || report.id}
                style={{
                  padding: '16px',
                  background: 'rgba(255,255,255,0.95)',
                  borderRadius: '12px',
                  border: '1px solid rgba(15,23,42,0.1)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}
              >
                <div style={{ display: 'flex', gap: '16px' }}>
                  {/* Report Image */}
                  {report.image && (
                    <img
                      src={report.image}
                      alt={report.name || 'report'}
                      style={{
                        width: 120,
                        height: 120,
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '1px solid rgba(15,23,42,0.08)'
                      }}
                    />
                  )}
                  
                  {/* Report Details */}
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      justifyContent: 'space-between',
                      marginBottom: '12px'
                    }}>
                      <div>
                        <h3 style={{ 
                          margin: 0, 
                          marginBottom: '8px', 
                          color: '#0f172a',
                          fontSize: '18px',
                          fontWeight: '600'
                        }}>
                          📋 {report.name || 'Report'}
                        </h3>
                        {report.description && (
                          <p style={{ 
                            margin: 0, 
                            color: '#475569',
                            lineHeight: 1.5
                          }}>
                            {report.description.length > 100 
                              ? `${report.description.substring(0, 100)}...` 
                              : report.description}
                          </p>
                        )}
                      </div>
                      
                      <span className={getStatusClass(report.status)}>
                        {report.status || 'N/A'}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px', justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-info btn-sm"
                        onClick={() => fetchReportDetail(report)}
                        disabled={loading}
                        style={{
                          padding: '8px 16px',
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        📋 Chi tiết
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#64748b',
          fontStyle: 'italic'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>📭</div>
          <h3 style={{ color: '#475569', marginBottom: '8px' }}>
            {selectedStationId ? 'Không có báo cáo nào' : 'Vui lòng chọn trạm'}
          </h3>
          <p>
            {selectedStationId 
              ? statusFilter !== 'All' 
                ? `Không có báo cáo nào với trạng thái "${statusFilter}".` 
                : 'Chưa có báo cáo nào cho trạm này.'
              : 'Hãy chọn một trạm để xem báo cáo.'
            }
          </p>
        </div>
      )}

      {/* Popup chi tiết báo cáo */}
      {selectedReport && (
        <div 
          className="report-detail-popup" 
          onClick={handleCloseDetail}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div 
            className="popup-content-report" 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
            }}
          >
            <div className="popup-header" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: '16px'
            }}>
              <h2 style={{ margin: 0, color: '#0f172a' }}>
                📋 Chi tiết báo cáo
              </h2>
            </div>
            
            <div className="report-detail-content">
              {/* Thông tin chi tiết */}
              <>
                {/* Thông tin cơ bản */}
                <div className="detail-section" style={{ marginBottom: '24px' }}>
                  <h3 style={{ marginBottom: '16px', color: '#334155' }}>Thông tin cơ bản</h3>
                  <div className="detail-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '12px'
                  }}>
                    <div className="detail-item" style={{
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '12px',
                      background: '#f8fafc',
                      borderRadius: '8px'
                    }}>
                      <strong style={{ color: '#475569', fontSize: '14px' }}>Report ID</strong>
                      <span style={{ color: '#0f172a', fontWeight: '500' }}>{selectedReport.reportId || selectedReport.id}</span>
                    </div>
                    <div className="detail-item" style={{
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '12px',
                      background: '#f8fafc',
                      borderRadius: '8px'
                    }}>
                      <strong style={{ color: '#475569', fontSize: '14px' }}>Tên báo cáo</strong>
                      <span style={{ color: '#0f172a', fontWeight: '500' }}>{selectedReport.name}</span>
                    </div>
                    <div className="detail-item" style={{
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '12px',
                      background: '#f8fafc',
                      borderRadius: '8px'
                    }}>
                      <strong style={{ color: '#475569', fontSize: '14px' }}>Account ID</strong>
                      <span style={{ color: '#0f172a', fontWeight: '500' }}>{selectedReport.accountId || 'N/A'}</span>
                    </div>
                    <div className="detail-item" style={{
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '12px',
                      background: '#f8fafc',
                      borderRadius: '8px'
                    }}>
                      <strong style={{ color: '#475569', fontSize: '14px' }}>Trạng thái</strong>
                      <span style={{ color: '#0f172a', fontWeight: '500' }}>{selectedReport.status || 'N/A'}</span>
                    </div>
                    <div className="detail-item" style={{
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '12px',
                      background: '#f8fafc',
                      borderRadius: '8px'
                    }}>
                      <strong style={{ color: '#475569', fontSize: '14px' }}>Ngày tạo</strong>
                      <span style={{ color: '#0f172a', fontWeight: '500' }}>{formatDate(selectedReport.startDate)}</span>
                    </div>
                    <div className="detail-item" style={{
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '12px',
                      background: '#f8fafc',
                      borderRadius: '8px'
                    }}>
                      <strong style={{ color: '#475569', fontSize: '14px' }}>Ngày cập nhật</strong>
                      <span style={{ color: '#0f172a', fontWeight: '500' }}>{formatDate(selectedReport.updateDate)}</span>
                    </div>
                  </div>
                </div>

                {/* Mô tả */}
                <div className="detail-section" style={{ marginBottom: '24px' }}>
                  <h3 style={{ marginBottom: '16px', color: '#334155' }}>Mô tả</h3>
                  <div className="description-box" style={{
                    padding: '16px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    color: '#475569',
                    lineHeight: 1.5
                  }}>
                    {selectedReport.description || 'Không có mô tả'}
                  </div>
                </div>

                {/* Cập nhật trạng thái */}
                <div className="detail-section" style={{ marginBottom: '24px' }}>
                  <h3 style={{ marginBottom: '16px', color: '#334155' }}>Cập nhật trạng thái</h3>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {['Completed'].map(status => (
                      <button
                        key={status}
                        onClick={() => handleUpdateReportStatus(selectedReport.reportId || selectedReport.id, status)}
                        disabled={updatingStatus || selectedReport.status === status}
                        style={{
                          padding: '8px 16px',
                          background: selectedReport.status === status ? '#22c55e' : '#64748b',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: updatingStatus || selectedReport.status === status ? 'not-allowed' : 'pointer',
                          fontSize: '14px',
                          opacity: updatingStatus || selectedReport.status === status ? 0.6 : 1
                        }}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hình ảnh */}
                {selectedReport.image && (
                  <div className="detail-section" style={{ marginBottom: '24px' }}>
                    <h3 style={{ marginBottom: '16px', color: '#334155' }}>Hình ảnh</h3>
                    <div className="image-container" style={{
                      display: 'flex',
                      justifyContent: 'center'
                    }}>
                      <img 
                        src={selectedReport.image} 
                        alt={selectedReport.name}
                        className="detail-image"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '400px',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = '<p style="color: #6b7280; text-align: center;">Không thể tải hình ảnh</p>';
                        }}
                      />
                    </div>
                  </div>
                )}
              </>
            </div>

            <div className="popup-actions-report" style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              marginTop: '24px',
              borderTop: '1px solid #e2e8f0',
              paddingTop: '20px'
            }}>
              <button 
                className="btn btn-secondary"
                onClick={handleCloseDetail}
                style={{
                  padding: '10px 20px',
                  background: '#64748b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ✖️ Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default StaffReportManager;