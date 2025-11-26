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

function StaffReportManager({ onShowReportDetail, onUpdateReportStatus }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'startDate', direction: 'desc' });
  const [currentUser, setCurrentUser] = useState(null);
  const [stationAssignments, setStationAssignments] = useState([]);
  const [selectedStationId, setSelectedStationId] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

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

  // Lấy chi tiết báo cáo để hiển thị popup
  const fetchReportDetail = async (report) => {
    try {
      setLoading(true);
      
      // Gọi function từ props để hiển thị popup
      onShowReportDetail(report);
    } catch (err) {
      console.error('Error fetching report detail:', err);
      message.error('Lỗi khi tải chi tiết báo cáo');
      
      // Vẫn gọi function từ props với thông tin cơ bản
      onShowReportDetail({
        ...report,
        accountName: 'Lỗi khi tải thông tin',
        phoneNumber: 'Lỗi khi tải thông tin',
        email: 'Lỗi khi tải thông tin',
        stationName: selectedStationId || 'N/A',
      });
    } finally {
      setLoading(false);
    }
  };

  // Hàm cập nhật trạng thái report với xác nhận
  const handleUpdateReportStatus = async (reportId, newStatus, reportName = '') => {
    if (onUpdateReportStatus) {
      await onUpdateReportStatus(reportId, newStatus, reportName);
      // Refresh danh sách sau khi cập nhật
      handleRefresh();
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
                      
                      {/* Nút cập nhật trạng thái bên ngoài */}
                      {report.status === 'Pending' && (
                        <button
                          onClick={() => handleUpdateReportStatus(
                            report.reportId || report.id, 
                            'Completed',
                            report.name || 'báo cáo'
                          )}
                          disabled={loading}
                          style={{
                            padding: '8px 16px',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            opacity: loading ? 0.6 : 1
                          }}
                        >
                          ✅ Hoàn thành
                        </button>
                      )}
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
    </>
  );
}

export default StaffReportManager;