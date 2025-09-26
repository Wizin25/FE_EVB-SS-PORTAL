import React, { useState } from 'react';
import { authAPI } from '../../services/authAPI';
import './Controller.css';

const initialState = {
  username: '',
  password: '',
  confirmedPassword: '',
  name: '',
  phone: '',
  address: '',
  email: '',
};


const initialErrors = {
  username: '',
  password: '',
  confirmedPassword: '',
  name: '',
  phone: '',
  address: '',
  email: '',
};

function validateField(name, value, allValues) {
  // Loại bỏ khoảng trắng đầu/cuối cho tất cả trường trừ address và name
  if (name !== 'address' && name !== 'name') {
    if (value.trim() !== value) {
      return 'Không được có khoảng trắng ở đầu hoặc cuối';
    }
    if (/\s/.test(value)) {
      return 'Không được chứa khoảng trắng';
    }
    if (!value) {
      return 'Trường này là bắt buộc';
    }
  } else {
    // Với name và address: không cho phép khoảng trắng ở đầu, cho phép ở giữa
    if (value.length > 0 && value[0] === ' ') {
      return 'Không được có khoảng trắng ở đầu';
    }
    if (!value.trim()) {
      return 'Trường này là bắt buộc';
    }
  }

  // Kiểm tra riêng cho từng trường
  if (name === 'email') {
    // Regex kiểm tra email đơn giản
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Email không hợp lệ';
    }
  }
  if (name === 'phone') {
    // Chỉ cho phép số, từ 10 đến 11 ký tự
    if (!/^\d{10,11}$/.test(value)) {
      return 'Số điện thoại phải từ 10-11 chữ số';
    }
  }
  if (name === 'confirmedPassword') {
    if (value !== allValues.password) {
      return 'Mật khẩu xác nhận không khớp';
    }
  }
  if (name === 'password') {
    if (value.length < 3) {
      return 'Mật khẩu phải có ít nhất 3 ký tự';
    }
    if (allValues.confirmedPassword && value !== allValues.confirmedPassword) {
      return 'Mật khẩu xác nhận không khớp';
    }
  }
  return '';
}

export default function NewStaffPopup({ open = false, onClose, onSuccess }) {
  const [fields, setFields] = useState(initialState);
  const [errors, setErrors] = useState(initialErrors);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFields((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value, { ...fields, [name]: value }),
    }));
  };

  const validateAll = () => {
    const newErrors = {};
    let valid = true;
    for (const key in fields) {
      const err = validateField(key, fields[key], fields);
      newErrors[key] = err;
      if (err) valid = false;
    }
    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validateAll()) return;

    setSubmitting(true);
    try {
      await authAPI.createStaff({
        ...fields,
      });
      setFields(initialState);
      setErrors(initialErrors);
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      let msg = err?.message || 'Không thể tạo tài khoản nhân viên';
      // If BE returns error object with message
      if (err?.response?.data?.message) msg = err.response.data.message;
      setApiError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setFields(initialState);
    setErrors(initialErrors);
    setApiError('');
    if (onClose) onClose();
  };

  return (
    <div className="popup-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.3)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="popup-content" style={{
        background: '#fff', borderRadius: 12, padding: 50, minWidth: 1000, maxWidth: 500, boxShadow: '0 8px 32px rgb(0, 0, 0)'
      }}>
        <h2 style={{ marginBottom: 16 }}>Create New Staff</h2>
        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label>Username</label>
            <input
              name="username"
              value={fields.username}
              onChange={handleChange}
              disabled={submitting}
              autoFocus
              autoComplete="off"
              style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc' }}
            />
            {errors.username && <div className="error" style={{ color: 'red', fontSize: 13 }}>{errors.username}</div>}
          </div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label>Password</label>
            <input
              name="password"
              type="password"
              value={fields.password}
              onChange={handleChange}
              disabled={submitting}
              autoComplete="new-password"
              style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc' }}
            />
            {errors.password && <div className="error" style={{ color: 'red', fontSize: 13 }}>{errors.password}</div>}
          </div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label>Confirm Password</label>
            <input
              name="confirmedPassword"
              type="password"
              value={fields.confirmedPassword}
              onChange={handleChange}
              disabled={submitting}
              autoComplete="new-password"
              style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc' }}
            />
            {errors.confirmedPassword && <div className="error" style={{ color: 'red', fontSize: 13 }}>{errors.confirmedPassword}</div>}
          </div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label>Name</label>
            <input
              name="name"
              value={fields.name}
              onChange={handleChange}
              disabled={submitting}
              style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc' }}
            />
            {errors.name && <div className="error" style={{ color: 'red', fontSize: 13 }}>{errors.name}</div>}
          </div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label>Phone</label>
            <input
              name="phone"
              value={fields.phone}
              onChange={handleChange}
              disabled={submitting}
              style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc' }}
            />
            {errors.phone && <div className="error" style={{ color: 'red', fontSize: 13 }}>{errors.phone}</div>}
          </div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label>Address</label>
            <input
              name="address"
              value={fields.address}
              onChange={handleChange}
              disabled={submitting}
              style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc' }}
            />
            {errors.address && <div className="error" style={{ color: 'red', fontSize: 13 }}>{errors.address}</div>}
          </div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label>Email</label>
            <input
              name="email"
              value={fields.email}
              onChange={handleChange}
              disabled={submitting}
              style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc' }}
            />
            {errors.email && <div className="error" style={{ color: 'red', fontSize: 13 }}>{errors.email}</div>}
          </div>
          {apiError && <div style={{ color: 'red', marginBottom: 10 }}>{apiError}</div>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              style={{
                padding: '8px 18px',
                borderRadius: 6,
                border: 'none',
                background: '#eee',
                color: '#333',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '8px 18px',
                borderRadius: 6,
                border: 'none',
                background: '#ff9800',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {submitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
