import React, { useState } from 'react';
import { authAPI } from '../../services/authAPI';
import './Controller.css';
import autoprefixer from 'autoprefixer';

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
    <div
      className="popup-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.32)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        className="popup-content"
        style={{
          background: '#fff',
          borderRadius: 14,
          padding: '28px 30px 22px 30px',
          minWidth: 360,
          maxWidth: 500,
          maxHeight: 1000,
          width: '100%',
          boxShadow: '0 8px 32px rgba(27,32,50,.14), 0 2px 8px rgba(140,80,40,.09)',
          border: '1px solid #eee',
          position: 'relative'
        }}
      >
        <button
          onClick={handleClose}
          type="button"
          disabled={submitting}
          style={{
            position: 'absolute',
            top: 11,
            right: 16,
            background: 'none',
            border: 'none',
            fontSize: 22,
            color: '#8b8e99',
            cursor: 'pointer',
            outline: 'none',
            zIndex: 2,
            padding: 0,
            lineHeight: 1,
            transition: 'color .2s'
          }}
          aria-label="Đóng"
        >
          ×
        </button>
        <h2
          style={{
            marginBottom: 20,
            fontSize: '1.35rem',
            fontWeight: 700,
            color: '#ff9800',
            letterSpacing: 0.3,
            textAlign: 'center'
          }}
        >
          Tạo tài khoản nhân viên
        </h2>
        <form onSubmit={handleSubmit} autoComplete="on">
          <div className="form-group" style={{ marginBottom: 5 }}>
            <label style={{ marginBottom: 3 }}>Username</label>
            <input
              name="username"
              value={fields.username}
              onChange={handleChange}
              disabled={submitting}
              autoFocus
              autoComplete="off"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 7,
                border: '1.5px solid #e0e0e0',
                background: '#fafbfc',
                fontSize: '15px',
                transition: 'border 0.2s'
              }}
            />
            {errors.username && (
              <div className="error" style={{ color: '#d3331e', fontSize: 12.5, marginTop: 2 }}>
                {errors.username}
              </div>
            )}
          </div>
          <div className="form-group" style={{ marginBottom: 13 }}>
            <label style={{ marginBottom: 3 }}>Mật khẩu</label>
            <input
              name="password"
              type="password"
              value={fields.password}
              onChange={handleChange}
              disabled={submitting}
              autoComplete="new-password"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 7,
                border: '1.5px solid #e0e0e0',
                background: '#fafbfc',
                fontSize: '15px'
              }}
            />
            {errors.password && (
              <div className="error" style={{ color: '#d3331e', fontSize: 12.5, marginTop: 2 }}>
                {errors.password}
              </div>
            )}
          </div>
          <div className="form-group" style={{ marginBottom: 13 }}>
            <label style={{ marginBottom: 3 }}>Xác nhận mật khẩu</label>
            <input
              name="confirmedPassword"
              type="password"
              value={fields.confirmedPassword}
              onChange={handleChange}
              disabled={submitting}
              autoComplete="new-password"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 7,
                border: '1.5px solid #e0e0e0',
                background: '#fafbfc',
                fontSize: '15px'
              }}
            />
            {errors.confirmedPassword && (
              <div className="error" style={{ color: '#d3331e', fontSize: 12.5, marginTop: 2 }}>
                {errors.confirmedPassword}
              </div>
            )}
          </div>
          <div className="form-group" style={{ marginBottom: 13 }}>
            <label style={{ marginBottom: 3 }}>Tên nhân viên</label>
            <input
              name="name"
              value={fields.name}
              onChange={handleChange}
              disabled={submitting}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 7,
                border: '1.5px solid #e0e0e0',
                background: '#fafbfc',
                fontSize: '15px'
              }}
            />
            {errors.name && (
              <div className="error" style={{ color: '#d3331e', fontSize: 12.5, marginTop: 2 }}>
                {errors.name}
              </div>
            )}
          </div>
          <div className="form-group" style={{ marginBottom: 13 }}>
            <label style={{ marginBottom: 3 }}>Số điện thoại</label>
            <input
              name="phone"
              value={fields.phone}
              onChange={handleChange}
              disabled={submitting}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 7,
                border: '1.5px solid #e0e0e0',
                background: '#fafbfc',
                fontSize: '15px'
              }}
            />
            {errors.phone && (
              <div className="error" style={{ color: '#d3331e', fontSize: 12.5, marginTop: 2 }}>
                {errors.phone}
              </div>
            )}
          </div>
          <div className="form-group" style={{ marginBottom: 13 }}>
            <label style={{ marginBottom: 3 }}>Địa chỉ</label>
            <input
              name="address"
              value={fields.address}
              onChange={handleChange}
              disabled={submitting}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 7,
                border: '1.5px solid #e0e0e0',
                background: '#fafbfc',
                fontSize: '15px'
              }}
            />
            {errors.address && (
              <div className="error" style={{ color: '#d3331e', fontSize: 12.5, marginTop: 2 }}>
                {errors.address}
              </div>
            )}
          </div>
          <div className="form-group" style={{ marginBottom: 8 }}>
            <label style={{ marginBottom: 3 }}>Email</label>
            <input
              name="email"
              value={fields.email}
              onChange={handleChange}
              disabled={submitting}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 7,
                border: '1.5px solid #e0e0e0',
                background: '#fafbfc',
                fontSize: '15px'
              }}
            />
            {errors.email && (
              <div className="error" style={{ color: '#d3331e', fontSize: 12.5, marginTop: 2 }}>
                {errors.email}
              </div>
            )}
          </div>
          {apiError && (
            <div style={{ color: '#d3331e', background: '#fff9f2', padding: '6px 10px', borderRadius: 5, fontSize: 13, marginBottom: 10 }}>
              {apiError}
            </div>
          )}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10,
              marginTop: 24
            }}
          >
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              style={{
                padding: '9px 16px',
                borderRadius: 7,
                border: 'none',
                background: '#f2f2f4',
                color: '#5c6275',
                fontWeight: 500,
                fontSize: '15px',
                cursor: 'pointer',
                transition: 'background .15s'
              }}
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '9px 22px',
                borderRadius: 7,
                border: 'none',
                background: 'linear-gradient(90deg,#ff9800 0%,#ffa940 100%)',
                color: '#fff',
                fontWeight: 600,
                fontSize: '15px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                boxShadow: '0px 2px 8px rgba(255,184,80,0.22)',
                transition: 'background .2s, box-shadow .15s'
              }}
            >
              {submitting ? 'Đang tạo...' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
