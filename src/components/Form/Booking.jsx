import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { authAPI } from '../services/authAPI';
import { formAPI } from '../services/formAPI';
import './form.css';

const Form = () => {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'light';
    }
    return 'light';
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    stationId: ''
  });

  const [stations, setStations] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const navigate = useNavigate();

  // Lấy thông tin user hiện tại và danh sách trạm
  useEffect(() => {
    // Initialize theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);

    const fetchData = async () => {
      try {
        const user = await authAPI.getCurrent();
        setCurrentUser(user);
        
        // Tạm thời hardcode danh sách trạm
        setStations([
          { stationId: 'S001', stationName: 'Trạm Hà Nội' },
          { stationId: 'S002', stationName: 'Trạm Hồ Chí Minh' },
          { stationId: 'S003', stationName: 'Trạm Đà Nẵng' },
        ]);
      } catch (error) {
        console.error('Lỗi khi lấy dữ liệu:', error);
        // Fallback data for demo
        setCurrentUser({
          accountId: 'DEMO001',
          name: 'Demo User',
          email: 'demo@swapx.vn'
        });
        setStations([
          { stationId: 'S001', stationName: 'Trạm Hà Nội' },
          { stationId: 'S002', stationName: 'Trạm Hồ Chí Minh' },
          { stationId: 'S003', stationName: 'Trạm Đà Nẵng' },
        ]);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!currentUser) {
    setMessage({ type: 'error', text: 'Bạn cần đăng nhập để gửi form' });
    return;
  }

  const errors = validateForm();
  if (errors.length > 0) {
    setMessage({ type: 'error', text: errors[0] });
    return;
  }
  
  // Validate form
  if (!formData.title || !formData.description || !formData.date || !formData.stationId) {
    setMessage({ type: 'error', text: 'Vui lòng điền đầy đủ thông tin' });
    return;
  }

  setLoading(true);
  setMessage({ type: '', text: '' });

  try {
    // Format date properly for backend
    const submitData = new FormData();
    submitData.append('AccountId', currentUser.accountId);
    submitData.append('Title', formData.title);
    submitData.append('Description', formData.description);
    submitData.append('Date', formData.date);
    submitData.append('StationId', formData.stationId);

    const response = await formAPI.createForm(submitData);
    
    if (response.isSuccess) {
      setMessage({ 
        type: 'success', 
        text: 'Gửi form thành công!' 
      });
      // Reset form
      setFormData({
        title: '',
        description: '',
        date: '',
        stationId: ''
      });
      
      // Optional: Redirect after success
      setTimeout(() => {
        navigate('/forms'); // or wherever you want to redirect
      }, 2000);
    } else {
      setMessage({ 
        type: 'error', 
        text: response.message || 'Gửi form thất bại' 
      });
    }
  } catch (error) {
    console.error('Form submission error:', error);
    setMessage({ 
      type: 'error', 
      text: error.message || 'Có lỗi xảy ra khi gửi form' 
    });
  } finally {
    setLoading(false);
  }
};

const validateForm = () => {
  const errors = [];
  
  if (!formData.title.trim()) {
    errors.push('Tiêu đề không được để trống');
  }
  
  if (!formData.description.trim()) {
    errors.push('Mô tả không được để trống');
  }
  
  if (!formData.date) {
    errors.push('Vui lòng chọn ngày');
  } else {
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      errors.push('Không thể chọn ngày trong quá khứ');
    }
  }
  
  if (!formData.stationId) {
    errors.push('Vui lòng chọn trạm hỗ trợ');
  }
  
  return errors;
};

  return (
    <div className={`form-page ${theme}`}>
      <div className="form-wrapper">
        {/* Nút trở về trang chủ */}
        <button
          onClick={() => navigate('/home')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            marginBottom: '16px',
            background: 'linear-gradient(to right, #10b981, #059669)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
            transition: 'all 0.3s',
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'linear-gradient(to right, #059669, #047857)';
            e.target.style.transform = 'translateY(-2px) scale(1.05)';
            e.target.style.boxShadow = '0 6px 20px rgba(5, 150, 105, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'linear-gradient(to right, #10b981, #059669)';
            e.target.style.transform = 'translateY(0) scale(1)';
            e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
          }}
        >
          <span>🏠</span>
          Trở về trang chủ
        </button>

        {/* Header Section */}
        <div className={`form-header-card ${theme}`}>
          <h1>Tạo Form Yêu Cầu Hỗ Trợ</h1>
          <p>Điền thông tin để gửi yêu cầu hỗ trợ về pin xe điện</p>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div className={`form-message ${message.type} ${theme}`}>
            {message.text}
          </div>
        )}

        {/* Form Card */}
        <div className={`form-card ${theme}`}>
          <form onSubmit={handleSubmit}>
            {/* Title Field */}
            <div className="form-group">
              <label htmlFor="title" className={theme}>
                Tiêu đề *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Nhập tiêu đề yêu cầu..."
                required
                className={`form-input ${theme}`}
              />
            </div>

            {/* Description Field */}
            <div className="form-group">
              <label htmlFor="description" className={theme}>
                Mô tả chi tiết *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
                required
                className={`form-textarea ${theme}`}
              />
            </div>

            {/* Date Field */}
            <div className="form-group">
              <label htmlFor="date" className={theme}>
                Ngày yêu cầu *
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className={`form-input ${theme}`}
              />
            </div>

            {/* Station Select */}
            <div className="form-group">
              <label htmlFor="stationId" className={theme}>
                Trạm hỗ trợ *
              </label>
              <select
                id="stationId"
                name="stationId"
                value={formData.stationId}
                onChange={handleChange}
                required
                className={`form-select ${theme}`}
              >
                <option value="">Chọn trạm hỗ trợ</option>
                {stations.map(station => (
                  <option key={station.stationId} value={station.stationId}>
                    {station.stationName}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className={`form-submit ${theme}`}
              disabled={loading}
            >
              {loading ? 'Đang gửi...' : 'Gửi Yêu Cầu'}
            </button>
          </form>
        </div>

        {/* User Info Card */}
        {currentUser && (
          <div className={`user-info-card ${theme}`}>
            <h3 className={theme}>Thông tin người gửi</h3>
            <p className={theme}>
              <span>Tên:</span> {currentUser.name}
            </p>
            <p className={theme}>
              <span>Email:</span> {currentUser.email}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Form;