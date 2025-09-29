import React, { useState, useEffect } from 'react';
import './Controller.css';

export default function UserDetailPopup({ 
  open, 
  onClose, 
  user, 
  customerDetails, 
  detailLoading, 
  exchangeHistory,
  historyLoading,
  onSave,
  onDelete 
}) {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [activeHistoryTab, setActiveHistoryTab] = useState('exchangeBatteries');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    email: '',
    status: ''
  });
  const [loading, setLoading] = useState(false);
  
  // THÊM: Lưu trữ dữ liệu gốc để so sánh
  const [originalData, setOriginalData] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (user) {
      const userData = {
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
        email: user.email || '',
        status: user.status || 'Active'
      };
      
      setFormData(userData);
      // LƯU dữ liệu gốc
      if (!originalData) {
        setOriginalData(userData);
      }
    }
  }, [user]);

  // THÊM: Kiểm tra thay đổi
  useEffect(() => {
    if (originalData) {
      const changed = JSON.stringify(formData) !== JSON.stringify(originalData);
      setHasChanges(changed);
    }
  }, [formData, originalData]);

  // THÊM: Kiểm tra nếu user là Admin
  const isAdminUser = user?.role === 'Admin';

  if (!open || !user) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    
    // THÊM: Kiểm tra nếu không có thay đổi
    if (!hasChanges) {
      alert('No changes detected.');
      setIsEditing(false);
      return;
    }

    setLoading(true);
    
    try {
      await onSave(user.accountId, formData);
      setIsEditing(false);
      // CẬP NHẬT: Reset original data sau khi save thành công
      setOriginalData({...formData});
    } catch (error) {
      console.error('Failed to save user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // THÊM: Reset form data về dữ liệu gốc
    if (originalData) {
      setFormData({...originalData});
    } else {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
        email: user.email || '',
        status: user.status || 'Active'
      });
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleEditClick = () => {
    // THÊM: Reset original data khi bắt đầu edit
    setOriginalData({...formData});
    setIsEditing(true);
  };

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
        <h2>{isEditing ? 'Edit User' : 'User Detail'}</h2>

        {detailLoading ? (
          <div className="loading">Loading customer details...</div>
        ) : (
          <form onSubmit={handleSave}>
            <div className="user-detail-info">
              {/* Basic User Info */}
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
              
              {/* Editable Fields */}
              <div className="detail-row">
                <span className="detail-label">Name:</span>
                <span className="detail-value">
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="edit-field"
                      required
                    />
                  ) : (
                    user.name
                  )}
                </span>
              </div>
              
              <div className="detail-row">
                <span className="detail-label">Phone:</span>
                <span className="detail-value">
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="edit-field"
                      required
                    />
                  ) : (
                    user.phone
                  )}
                </span>
              </div>
              
              <div className="detail-row">
                <span className="detail-label">Email:</span>
                <span className="detail-value">
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="edit-field"
                      required
                    />
                  ) : (
                    user.email
                  )}
                </span>
              </div>
              
              <div className="detail-row">
                <span className="detail-label">Address:</span>
                <span className="detail-value">
                  {isEditing ? (
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="edit-field"
                    />
                  ) : (
                    user.address
                  )}
                </span>
              </div>

            </div>

            {/* Action buttons */}
            <div className="popup-actions center-actions">
              {isEditing ? (
                <>
                  <button type="button" className="cancel-btn" onClick={handleCancel} disabled={loading}>
                    Cancel
                  </button>
                  <button type="submit" className="edit-btn" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <>
                  {/* Ẩn nút Edit và Delete nếu user là Admin */}
                  {!isAdminUser && (
                    <>
                      <button type="button" className="edit-btn" onClick={handleEditClick}>
                        Edit
                      </button>
                      <button type="button" className="delete-btn" onClick={() => onDelete(user)}>
                        Delete
                      </button>
                    </>
                  )}
                  {/* Hiển thị thông báo nếu là Admin */}
                  {isAdminUser && (
                    <div className="admin-notice">
                      Admin users cannot be edited or deleted
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Nút Close - chỉ hiển thị khi KHÔNG ở chế độ edit */}
            {!isEditing && (
              <div className="popup-actions end-actions">
                <button type="button" className="cancel-btn" onClick={onClose} disabled={loading}>
                  Close
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}