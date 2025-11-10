import React, { useState, useEffect } from 'react';
import { authAPI } from '../../services/authAPI';
import '../pages/ReportManager.css';

const ReportManager = () => {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]); // Thêm state cho reports đã lọc
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchStationName, setSearchStationName] = useState(''); // Đổi từ searchId
  const [accountDetails, setAccountDetails] = useState({});
  const [stationDetails, setStationDetails] = useState({});

  // Pre-load danh sách trạm để cache
  const [stationsCache, setStationsCache] = useState({});

  // Hàm pre-load danh sách trạm
  const loadAllStations = async () => {
    try {
      const stations = await authAPI.getAllStations();
      if (Array.isArray(stations)) {
        const cache = {};
        stations.forEach(station => {
          const stationId = station.stationId || station.StationId || station.id;
          if (stationId) {
            cache[stationId] = {
              stationName: station.stationName || station.Name || 'N/A',
              location: station.location || 'N/A'
            };
          }
        });
        setStationsCache(cache);
      }
    } catch (error) {
      console.error('Error pre-loading stations:', error);
    }
  };

  // Lấy tất cả báo cáo
  const fetchAllReports = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await authAPI.getAllReports();
      
      // Xử lý response theo cấu trúc từ API
      let reportsData = [];
      if (response?.isSuccess && Array.isArray(response.data)) {
        reportsData = response.data;
      } else if (Array.isArray(response?.data)) {
        reportsData = response.data;
      }

      setReports(reportsData);
      setFilteredReports(reportsData); // Khởi tạo filteredReports
    } catch (err) {
      setError(err.message || 'Lỗi khi tải danh sách báo cáo');
      console.error('Fetch reports error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Hàm tìm kiếm theo stationName
  const handleSearch = () => {
    if (searchStationName.trim()) {
      const searchTerm = searchStationName.trim().toLowerCase();
      const filtered = reports.filter(report => {
        const stationInfo = getStationInfo(report.stationId);
        return stationInfo.stationName.toLowerCase().includes(searchTerm);
      });
      setFilteredReports(filtered);
    } else {
      setFilteredReports(reports);
    }
  };

  // Reset và hiển thị tất cả báo cáo
  const handleShowAll = () => {
    setSelectedReport(null);
    setError('');
    setSuccess('');
    setSearchStationName('');
    setFilteredReports(reports); // Reset về tất cả reports
  };

  // Xử lý Enter key trong search input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Lấy thông tin station chi tiết - sử dụng cache
  const getStationInfo = (stationId) => {
    if (!stationId) return { stationName: 'N/A', location: 'N/A' };
    
    // Nếu đã có trong cache, trả về
    if (stationsCache[stationId]) {
      return stationsCache[stationId];
    }
    
    // Nếu chưa có, trả về mặc định
    return { stationName: 'N/A', location: 'N/A' };
  };

  // Các hàm khác giữ nguyên (fetchAccountDetails, fetchReportDetail, handleDeleteReport, etc.)
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
  const fetchReportDetail = async (reportId) => {
    try {
      setLoading(true);
      setError('');
      const response = await authAPI.getReportById(reportId);
      
      let reportData = null;
      if (response?.isSuccess && response.data) {
        reportData = response.data;
      } else if (response?.data) {
        reportData = response.data;
      } else {
        setError('Không thể tải chi tiết báo cáo');
        return;
      }

      // Lấy thông tin account và station chi tiết
      const [accountInfo] = await Promise.all([
        fetchAccountDetails(reportData.accountId)
      ]);

      const stationInfo = getStationInfo(reportData.stationId);

      // Kết hợp thông tin vào report data
      const enhancedReportData = {
        ...reportData,
        accountName: accountInfo?.accountName || 'N/A',
        phoneNumber: accountInfo?.phoneNumber || 'N/A',
        stationName: stationInfo.stationName,
        stationLocation: stationInfo.location
      };

      setSelectedReport(enhancedReportData);
    } catch (err) {
      setError(err.message || 'Lỗi khi tải chi tiết báo cáo');
      console.error('Fetch report detail error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Xóa báo cáo
  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa báo cáo này?')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await authAPI.deleteReport(reportId);
      
      if (response?.isSuccess) {
        setSuccess('Xóa báo cáo thành công');
        setSelectedReport(null);
        
        // Auto hide success message
        setTimeout(() => setSuccess(''), 3000);
        
        // Reload reports
        fetchAllReports();
      } else {
        setError(response?.message || 'Xóa báo cáo thất bại');
      }
    } catch (err) {
      setError(err.message || 'Lỗi khi xóa báo cáo');
      console.error('Delete report error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Đóng popup chi tiết
  const handleCloseDetail = () => {
    setSelectedReport(null);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  // Load initial reports và cache stations
  useEffect(() => {
    fetchAllReports();
    loadAllStations();
  }, []);

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
    <div className="report-manager">
      {/* Header */}
      <div className="report-header">
        <h1>📊 Quản lý Báo cáo</h1>
        <div className="report-actions">
          <button 
            className="btn btn-primary"
            onClick={handleShowAll}
            disabled={loading}
          >
            🔄 Hiển thị tất cả
          </button>
        </div>
      </div>

      {/* Tìm kiếm theo stationName */}
      <div className="search-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Nhập tên trạm để tìm kiếm..."
            value={searchStationName}
            onChange={(e) => setSearchStationName(e.target.value)}
            onKeyPress={handleKeyPress}
            className="search-input"
            disabled={loading}
          />
          <button 
            className="btn btn-secondary"
            onClick={handleSearch}
            disabled={loading || !searchStationName.trim()}
          >
            🔍 Tìm kiếm
          </button>
        </div>
      </div>

      {/* Thông báo */}
      {error && (
        <div className="alert alert-error">
          <span>❌ {error}</span>
          <button onClick={() => setError('')} className="alert-close">×</button>
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          <span>✅ {success}</span>
          <button onClick={() => setSuccess('')} className="alert-close">×</button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <span>Đang tải...</span>
        </div>
      )}

      {/* Danh sách báo cáo */}
      <div className="reports-container">
        {!loading && filteredReports.length === 0 && (
          <div className="empty-state">
            <p>📭 Không có báo cáo nào</p>
          </div>
        )}

        {!loading && filteredReports.length > 0 && (
          <div className="reports-list">
            <div className="reports-grid">
              {filteredReports.map((report) => {
                const isDeleteDisabled = report.status?.toLowerCase() === 'inactive';
                const stationInfo = getStationInfo(report.stationId);
                return (
                  <div key={report.reportId} className="report-card">
                    <div className="report-header">
                      <h3>{report.name || 'Không có tiêu đề'}</h3>
                      <span className={`report-status status-${report.status?.toLowerCase() || 'pending'}`}>
                        {report.status || 'Pending'}
                      </span>
                    </div>
                    
                    <div className="report-content">
                      {report.image && (
                        <div className="report-image">
                          <img 
                            src={report.image} 
                            alt={report.name}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}

                      <div className="report-meta">
                        {/* Thêm tên trạm vào meta */}
                        <div className="meta-item">
                          <strong>Trạm:</strong>
                          <span>{stationInfo.stationName}</span>
                        </div>
                        {report.startDate && (
                          <div className="meta-item">
                            <strong>Ngày tạo:</strong>
                            <span>{formatDate(report.startDate)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="report-actions">
                      <button
                        className="btn btn-info btn-sm"
                        onClick={() => fetchReportDetail(report.reportId)}
                        disabled={loading}
                      >
                        📋 Chi tiết
                      </button>
                      <button
                        onClick={() => handleDeleteReport(report.reportId)}
                        disabled={loading || isDeleteDisabled}
                        className={`flex-1 px-4 py-3 text-sm font-semibold text-white transition-all transform rounded-lg shadow-lg lg:flex-none ${
                          isDeleteDisabled 
                            ? 'bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 hover:scale-105'
                        } disabled:opacity-50`}
                      >
                        {isDeleteDisabled ? '❌ Đã xóa' : '🗑️ Xóa'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Popup chi tiết báo cáo - giữ nguyên */}
      {selectedReport && (
        <div className="report-detail-popup" onClick={handleCloseDetail}>
          <div className="popup-content-report" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h2>📋 Chi tiết báo cáo</h2>
              <button className="close-btn" onClick={handleCloseDetail}>×</button>
            </div>
            
            <div className="report-detail-content">
              {/* Thông tin cơ bản */}
              <div className="detail-section">
                <h3>Thông tin cơ bản</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <strong>Report ID</strong>
                    <span>{selectedReport.reportId}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Tên báo cáo</strong>
                    <span>{selectedReport.name}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Trạng thái</strong>
                    <span className={`status-badge status-${selectedReport.status?.toLowerCase() || 'pending'}`}>
                      {selectedReport.status || 'Pending'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <strong>Số điện thoại</strong>
                    <span>{selectedReport.phoneNumber || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Account Name</strong>
                    <span>{selectedReport.accountName || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Tên trạm</strong>
                    <span>{selectedReport.stationName}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Địa chỉ trạm</strong>
                    <span>{selectedReport.stationLocation}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Ngày tạo</strong>
                    <span>{formatDate(selectedReport.startDate)}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Ngày cập nhật</strong>
                    <span>{formatDate(selectedReport.updateDate)}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Account ID</strong>
                    <span>{selectedReport.accountId || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Station ID</strong>
                    <span>{selectedReport.stationId || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Mô tả */}
              <div className="detail-section">
                <h3>Mô tả</h3>
                <div className="description-box">
                  {selectedReport.description || 'Không có mô tả'}
                </div>
              </div>

              {/* Hình ảnh */}
              {selectedReport.image && (
                <div className="detail-section">
                  <h3>Hình ảnh</h3>
                  <div className="image-container">
                    <img 
                      src={selectedReport.image} 
                      alt={selectedReport.name}
                      className="detail-image"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = '<p style="color: #6b7280;">Không thể tải hình ảnh</p>';
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="popup-actions-report">
              <button 
                className="btn btn-secondary"
                onClick={handleCloseDetail}
              >
                ✖️ Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportManager;