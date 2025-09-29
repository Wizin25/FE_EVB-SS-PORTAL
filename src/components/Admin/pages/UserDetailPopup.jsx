import React, { useState } from 'react';
import './Controller.css';

export default function UserDetailPopup({ 
  open, 
  onClose, 
  user, 
  customerDetails, 
  detailLoading, 
  onEdit, 
  onDelete 
}) {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [activeHistoryTab, setActiveHistoryTab] = useState('exchangeBatteries');

  if (!open || !user) return null;

  const toggleDropdown = (dropdown) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  // Format date for history items
  const formatHistoryDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  // Get history data from customerDetails
  const historyData = customerDetails || {};
  const exchangeBatteries = historyData.exchangeBatteries || [];
  const forms = historyData.forms || [];
  const orders = historyData.orders || [];
  const ratings = historyData.ratings || [];
  const reports = historyData.reports || [];

  // Check if there's any history data
  const hasHistoryData = exchangeBatteries.length > 0 || forms.length > 0 || 
                        orders.length > 0 || ratings.length > 0 || reports.length > 0;

  return (
    <div className="popup-overlay">
      <div className="popup-content user-detail-popup">
        <h2>User Detail</h2>

        {detailLoading ? (
          <div className="loading">Loading customer details...</div>
        ) : (
          <div className="user-detail-info">
            {/* Basic User Info - giữ nguyên */}
            <div className="detail-row">
              <span className="detail-label">Account ID:</span>
              <span className="detail-value">{user.accountId}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Role:</span>
              <span className="detail-value">
                <span className={`role-badge role-${user.role?.toLowerCase()}`}>
                  {user.role}
                </span>
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Username:</span>
              <span className="detail-value">{user.username}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Name:</span>
              <span className="detail-value">{user.name}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Phone:</span>
              <span className="detail-value">{user.phone}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Address:</span>
              <span className="detail-value">{user.address}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Email:</span>
              <span className="detail-value">{user.email}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Status:</span>
              <span className="detail-value">
                <span className={`status-badge status-${user.status ? user.status.toLowerCase() : 'null'}`}>
                  {user.status}
                </span>
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Start Date:</span>
              <span className="detail-value">
                {user.startDate && user.startDate !== 'N/A' 
                  ? new Date(user.startDate).toLocaleDateString('vi-VN') 
                  : 'N/A'
                }
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Update Date:</span>
              <span className="detail-value">
                {user.updateDate && user.updateDate !== 'N/A' 
                  ? new Date(user.updateDate).toLocaleDateString('vi-VN') 
                  : 'N/A'
                }
              </span>
            </div>

            {/* Dropdown cho Vehicle Information */}
            {user.role === 'EvDriver' && customerDetails && (
              <div className="dropdown-section">
                <div 
                  className={`dropdown-header ${activeDropdown === 'vehicle' ? 'active' : ''}`}
                  onClick={() => toggleDropdown('vehicle')}
                >
                  <span className="dropdown-title">Vehicle Information</span>
                  <span className="dropdown-arrow">
                    {activeDropdown === 'vehicle' ? '▲' : '▼'}
                  </span>
                </div>
                {activeDropdown === 'vehicle' && (
                  <div className="dropdown-content">
                    <div className="detail-row">
                      <span className="detail-label">Customer ID:</span>
                      <span className="detail-value">{customerDetails.customerID || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">VIN:</span>
                      <span className="detail-value">{customerDetails.vin || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Vehicle Name:</span>
                      <span className="detail-value">{customerDetails.vehicleName || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Vehicle Type:</span>
                      <span className="detail-value">{customerDetails.vehicleType || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Battery ID:</span>
                      <span className="detail-value">{customerDetails.batteryID || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Package ID:</span>
                      <span className="detail-value">{customerDetails.packageID || 'N/A'}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Dropdown cho History với tabs */}
            {user.role === 'EvDriver' && customerDetails && (
              <div className="dropdown-section">
                <div 
                  className={`dropdown-header ${activeDropdown === 'history' ? 'active' : ''}`}
                  onClick={() => toggleDropdown('history')}
                >
                  <span className="dropdown-title">History</span>
                  <span className="dropdown-arrow">
                    {activeDropdown === 'history' ? '▲' : '▼'}
                  </span>
                </div>
                {activeDropdown === 'history' && (
                  <div className="dropdown-content">
                    {hasHistoryData ? (
                      <div className="history-container">
                        {/* History Tabs */}
                        <div className="history-tabs">
                          {exchangeBatteries.length > 0 && (
                            <button 
                              className={`history-tab ${activeHistoryTab === 'exchangeBatteries' ? 'active' : ''}`}
                              onClick={() => setActiveHistoryTab('exchangeBatteries')}
                            >
                              Battery Exchange ({exchangeBatteries.length})
                            </button>
                          )}
                          {forms.length > 0 && (
                            <button 
                              className={`history-tab ${activeHistoryTab === 'forms' ? 'active' : ''}`}
                              onClick={() => setActiveHistoryTab('forms')}
                            >
                              Forms ({forms.length})
                            </button>
                          )}
                          {orders.length > 0 && (
                            <button 
                              className={`history-tab ${activeHistoryTab === 'orders' ? 'active' : ''}`}
                              onClick={() => setActiveHistoryTab('orders')}
                            >
                              Orders ({orders.length})
                            </button>
                          )}
                          {ratings.length > 0 && (
                            <button 
                              className={`history-tab ${activeHistoryTab === 'ratings' ? 'active' : ''}`}
                              onClick={() => setActiveHistoryTab('ratings')}
                            >
                              Ratings ({ratings.length})
                            </button>
                          )}
                          {reports.length > 0 && (
                            <button 
                              className={`history-tab ${activeHistoryTab === 'reports' ? 'active' : ''}`}
                              onClick={() => setActiveHistoryTab('reports')}
                            >
                              Reports ({reports.length})
                            </button>
                          )}
                        </div>

                        {/* History Content */}
                        <div className="history-content">
                          {/* Exchange Batteries */}
                          {activeHistoryTab === 'exchangeBatteries' && exchangeBatteries.length > 0 && (
                            <div className="history-list">
                              {exchangeBatteries.map((exchange, index) => (
                                <div key={exchange.exchangeBatteryID || index} className="history-item">
                                  <div className="history-row">
                                    <span className="history-label">Exchange ID:</span>
                                    <span className="history-value">{exchange.exchangeBatteryID}</span>
                                  </div>
                                  <div className="history-row">
                                    <span className="history-label">Date:</span>
                                    <span className="history-value">{formatHistoryDate(exchange.actionDate)}</span>
                                  </div>
                                  <div className="history-row">
                                    <span className="history-label">Old Battery:</span>
                                    <span className="history-value">{exchange.oldBatteryID}</span>
                                  </div>
                                  <div className="history-row">
                                    <span className="history-label">New Battery:</span>
                                    <span className="history-value">{exchange.newBatteryID}</span>
                                  </div>
                                  <div className="history-row">
                                    <span className="history-label">Station:</span>
                                    <span className="history-value">{exchange.stationID}</span>
                                  </div>
                                  <div className="history-row">
                                    <span className="history-label">Status:</span>
                                    <span className="history-value">
                                      <span className={`status-badge status-${exchange.status ? exchange.status.toLowerCase() : 'unknown'}`}>
                                        {exchange.status}
                                      </span>
                                    </span>
                                  </div>
                                  {exchange.notes && (
                                    <div className="history-row">
                                      <span className="history-label">Notes:</span>
                                      <span className="history-value">{exchange.notes}</span>
                                    </div>
                                  )}
                                  {index < exchangeBatteries.length - 1 && <hr className="history-divider" />}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Forms */}
                          {activeHistoryTab === 'forms' && forms.length > 0 && (
                            <div className="history-list">
                              {forms.map((form, index) => (
                                <div key={form.formID || index} className="history-item">
                                  <div className="history-row">
                                    <span className="history-label">Form ID:</span>
                                    <span className="history-value">{form.formID}</span>
                                  </div>
                                  <div className="history-row">
                                    <span className="history-label">Title:</span>
                                    <span className="history-value">{form.title}</span>
                                  </div>
                                  <div className="history-row">
                                    <span className="history-label">Description:</span>
                                    <span className="history-value">{form.description}</span>
                                  </div>
                                  <div className="history-row">
                                    <span className="history-label">Date:</span>
                                    <span className="history-value">{formatHistoryDate(form.date)}</span>
                                  </div>
                                  <div className="history-row">
                                    <span className="history-label">Status:</span>
                                    <span className="history-value">
                                      <span className={`status-badge status-${form.status ? form.status.toLowerCase() : 'unknown'}`}>
                                        {form.status}
                                      </span>
                                    </span>
                                  </div>
                                  {index < forms.length - 1 && <hr className="history-divider" />}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Orders */}
                          {activeHistoryTab === 'orders' && orders.length > 0 && (
                            <div className="history-list">
                              {orders.map((order, index) => (
                                <div key={order.orderID || index} className="history-item">
                                  <div className="history-row">
                                    <span className="history-label">Order ID:</span>
                                    <span className="history-value">{order.orderID}</span>
                                  </div>
                                  <div className="history-row">
                                    <span className="history-label">Total:</span>
                                    <span className="history-value">${order.total?.toFixed(2)}</span>
                                  </div>
                                  <div className="history-row">
                                    <span className="history-label">Date:</span>
                                    <span className="history-value">{formatHistoryDate(order.date)}</span>
                                  </div>
                                  <div className="history-row">
                                    <span className="history-label">Battery ID:</span>
                                    <span className="history-value">{order.batteryID}</span>
                                  </div>
                                  <div className="history-row">
                                    <span className="history-label">Status:</span>
                                    <span className="history-value">
                                      <span className={`status-badge status-${order.status ? order.status.toLowerCase() : 'unknown'}`}>
                                        {order.status}
                                      </span>
                                    </span>
                                  </div>
                                  {index < orders.length - 1 && <hr className="history-divider" />}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Ratings */}
                          {activeHistoryTab === 'ratings' && ratings.length > 0 && (
                            <div className="history-list">
                              {ratings.map((rating, index) => (
                                <div key={rating.ratingID || index} className="history-item">
                                  <div className="history-row">
                                    <span className="history-label">Rating ID:</span>
                                    <span className="history-value">{rating.ratingID}</span>
                                  </div>
                                  <div className="history-row">
                                    <span className="history-label">Rating:</span>
                                    <span className="history-value">
                                      <span className="rating-stars">
                                        {'★'.repeat(rating.rating || 0)}{'☆'.repeat(5 - (rating.rating || 0))}
                                      </span>
                                      ({rating.rating}/5)
                                    </span>
                                  </div>
                                  <div className="history-row">
                                    <span className="history-label">Description:</span>
                                    <span className="history-value">{rating.description}</span>
                                  </div>
                                  <div className="history-row">
                                    <span className="history-label">Station:</span>
                                    <span className="history-value">{rating.stationID}</span>
                                  </div>
                                  <div className="history-row">
                                    <span className="history-label">Status:</span>
                                    <span className="history-value">
                                      <span className={`status-badge status-${rating.status ? rating.status.toLowerCase() : 'unknown'}`}>
                                        {rating.status}
                                      </span>
                                    </span>
                                  </div>
                                  {index < ratings.length - 1 && <hr className="history-divider" />}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Reports */}
                          {activeHistoryTab === 'reports' && reports.length > 0 && (
                            <div className="history-list">
                              {reports.map((report, index) => (
                                <div key={report.reportID || index} className="history-item">
                                  <div className="history-row">
                                    <span className="history-label">Report ID:</span>
                                    <span className="history-value">{report.reportID}</span>
                                  </div>
                                  <div className="history-row">
                                    <span className="history-label">Name:</span>
                                    <span className="history-value">{report.name}</span>
                                  </div>
                                  <div className="history-row">
                                    <span className="history-label">Description:</span>
                                    <span className="history-value">{report.description}</span>
                                  </div>
                                  <div className="history-row">
                                    <span className="history-label">Station:</span>
                                    <span className="history-value">{report.stationID}</span>
                                  </div>
                                  <div className="history-row">
                                    <span className="history-label">Status:</span>
                                    <span className="history-value">
                                      <span className={`status-badge status-${report.status ? report.status.toLowerCase() : 'unknown'}`}>
                                        {report.status}
                                      </span>
                                    </span>
                                  </div>
                                  {index < reports.length - 1 && <hr className="history-divider" />}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="history-placeholder">
                        <p>No history data available</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Hiển thị thông báo nếu là EvDriver nhưng không có customer details */}
            {user.role === 'EvDriver' && !customerDetails && !detailLoading && (
              <div className="detail-row">
                <span className="detail-label">Vehicle Info:</span>
                <span className="detail-value" style={{ color: '#ff6b6b' }}>
                  No vehicle information found
                </span>
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="popup-actions center-actions">
          <button type="button" className="edit-btn" onClick={() => onEdit(user)}>
            Edit
          </button>
          <button type="button" className="delete-btn" onClick={() => onDelete(user)}>
            Delete
          </button>
        </div>

        <div className="popup-actions end-actions">
          <button type="button" className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}