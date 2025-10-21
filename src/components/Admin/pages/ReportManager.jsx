import React, { useState, useEffect } from 'react';
import { authAPI } from '../../services/authAPI';
import '../pages/ReportManager.css';

const ReportManager = () => {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchId, setSearchId] = useState('');

  // Lấy tất cả báo cáo
  const fetchAllReports = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await authAPI.getAllReports();
      
      // Xử lý response theo cấu trúc từ API
      if (response?.isSuccess && Array.isArray(response.data)) {
        setReports(response.data);
      } else if (Array.isArray(response?.data)) {
        setReports(response.data);
      } else {
        setReports([]);
      }
    } catch (err) {
      setError(err.message || 'Lỗi khi tải danh sách báo cáo');
      console.error('Fetch reports error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Lấy báo cáo theo ID
  const fetchReportById = async (reportId) => {
    if (!reportId) {
      setError('Vui lòng nhập Report ID');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await authAPI.getReportById(reportId);
      
      // Xử lý response theo cấu trúc từ API
      if (response?.isSuccess && response.data) {
        setSelectedReport(null);
        setReports([response.data]);
      } else if (response?.data) {
        setSelectedReport(null);
        setReports([response.data]);
      } else {
        setError('Không tìm thấy báo cáo');
        setReports([]);
      }
    } catch (err) {
      setError(err.message || 'Lỗi khi tải báo cáo');
      setReports([]);
      console.error('Fetch report by ID error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Lấy chi tiết báo cáo để hiển thị popup
  const fetchReportDetail = async (reportId) => {
    try {
      setLoading(true);
      setError('');
      const response = await authAPI.getReportById(reportId);
      
      if (response?.isSuccess && response.data) {
        setSelectedReport(response.data);
      } else if (response?.data) {
        setSelectedReport(response.data);
      } else {
        setError('Không thể tải chi tiết báo cáo');
      }
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

  // Reset và hiển thị tất cả báo cáo
  const handleShowAll = () => {
    setSelectedReport(null);
    setError('');
    setSuccess('');
    setSearchId('');
    fetchAllReports();
  };

  // Đóng popup chi tiết
  const handleCloseDetail = () => {
    setSelectedReport(null);
  };

  // Xử lý tìm kiếm
  const handleSearch = () => {
    if (searchId.trim()) {
      fetchReportById(searchId.trim());
    }
  };

  // Xử lý Enter key trong search input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  // Load initial reports
  useEffect(() => {
    fetchAllReports();
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

      {/* Tìm kiếm theo ID */}
      <div className="search-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Nhập Report ID để tìm kiếm..."
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            onKeyPress={handleKeyPress}
            className="search-input"
            disabled={loading}
          />
          <button 
            className="btn btn-secondary"
            onClick={handleSearch}
            disabled={loading || !searchId.trim()}
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
        {!loading && reports.length === 0 && (
          <div className="empty-state">
            <p>📭 Không có báo cáo nào</p>
          </div>
        )}

        {!loading && reports.length > 0 && (
          <div className="reports-list">
            <div className="reports-grid">
              {reports.map((report) => (
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
                      <div className="meta-item">
                        <strong>Report ID:</strong>
                        <span>{report.reportId}</span>
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
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteReport(report.reportId)}
                      disabled={loading}
                    >
                      🗑️ Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Popup chi tiết báo cáo */}
      {selectedReport && (
        <div className="report-detail-popup" onClick={handleCloseDetail}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
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

            <div className="popup-actions">
              <button 
                className="btn btn-danger"
                onClick={() => {
                  handleCloseDetail();
                  handleDeleteReport(selectedReport.reportId);
                }}
                disabled={loading}
              >
                🗑️ Xóa báo cáo
              </button>
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

export default ReportManager