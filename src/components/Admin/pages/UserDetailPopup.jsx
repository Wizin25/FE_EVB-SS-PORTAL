import React from 'react';
import './Controller.css';

export default function UserDetailPopup({ open, onClose, user, onEdit, onDelete }) {
  if (!open || !user) return null;

  return (
    <div className="popup-overlay">
      <div className="popup-content user-detail-popup">
        <h2>User Detail</h2>

        <div className="user-detail-info">
          <div className="detail-row">
            <span className="detail-label">Account ID:</span>
            <span className="detail-value">{user.accountId}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Role:</span>
            <span className="detail-value">{user.role}</span>
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
            <span className="detail-value">{user.status}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="popup-actions center-actions">
          <button type="button" className="edit-btn" onClick={() => onEdit(user)}>Edit</button>
          <button type="button" className="delete-btn" onClick={() => onDelete(user)}>Delete</button>
        </div>

        <div className="popup-actions end-actions">
          <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
