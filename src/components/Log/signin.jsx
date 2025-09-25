import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/authAPI';
import { decodeJwt, extractRolesFromPayload } from '../services/jwt';
import './sign.css';

function SignIn() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Không cho phép khoảng trắng ở đầu
    let processedValue = value;
    if (name === 'username') {
      processedValue = value.replace(/^\s+/, ''); // Remove leading spaces
    }
    
    setFormData({
      ...formData,
      [name]: processedValue
    });
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setFormError('');
  };

  const validate = () => {
    const newErrors = {};
    const trimmedUsername = formData.username.trim();
    if (!trimmedUsername) newErrors.username = 'Username is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password && formData.password.length < 3) newErrors.password = 'Mật khẩu phải có ít nhất 3 ký tự';
    return newErrors;
  };

  const mapBackendErrorsToFields = (errObj) => {
    const fieldMap = {
      Username: 'username',
      Password: 'password',
    };
    const mapped = {};
    if (errObj && typeof errObj === 'object') {
      const keys = Object.keys(errObj);
      keys.forEach((key) => {
        const field = fieldMap[key] || null;
        const messages = Array.isArray(errObj[key]) ? errObj[key] : [];
        if (field && messages.length > 0) {
          mapped[field] = messages[0];
        }
      });
    }
    return mapped;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setFormError('');
    
    // Trim dữ liệu trước khi validate
    const trimmedData = {
      username: formData.username.trim(),
      password: formData.password
    };
    
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setLoading(true);
    try {
      const result = await authAPI.signIn(trimmedData);
      const token = result?.token || result?.accessToken || result?.data?.token;
      if (token) {
        localStorage.setItem('authToken', token);
      }
      // Decode roles
      const payload = token ? decodeJwt(token) : null;
      const roles = extractRolesFromPayload(payload);
      // Role priority: Admin > BSS Staff > EV Driver; redirect accordingly
      if (roles.includes('Admin')) {
        navigate('/admin');
      } else if (roles.includes('Bsstaff')) {
        navigate('/staff');
      } else if (roles.includes('EvDriver')) {
        navigate('/home');
      } else {
        // Default fallback
        navigate('/home');
      }
    } catch (error) {
      // ưu tiên hiển thị lỗi theo field từ backend trước
      if (error?.errors && typeof error.errors === 'object') {
        const mapped = mapBackendErrorsToFields(error.errors);
        if (Object.keys(mapped).length > 0) {
          setErrors(mapped);
        } else {
          // không map được trường nào (key lạ) -> gom message hiển thị ở formError
          const aggregated = Object.values(error.errors)
            .flat()
            .filter(Boolean)
            .join(' - ');
          if (aggregated) setFormError(aggregated);
        }
      } else if (error?.title) {
        // chỉ dùng title nếu không có errors chi tiết
        setFormError(error.title);
      } else {
        // get message lỗi ở đây
        const msg = error?.message || error?.detail || error?.toString() || 'Đăng nhập thất bại';
        setFormError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sign-page">
      <div className="sign-main-container">
        <div className="brand-panel">
          <div className="brand-content">
            <div className="brand-title">Welcome to</div>
            <div className="brand-subtitle">SWAP X</div>
            <div className="brand-title">Join Us</div>
            <div className="brand-logo">🔋</div>
          </div>
        </div>

        <div className="sign-container">
          <div style={{ position: 'absolute', top: -40, right: 0, padding: '0px' }}>
            <img 
              src="https://res.cloudinary.com/dzht29nkq/image/upload/v1758274139/SwapX_1_-Photoroom_wvmglm.png" 
              alt="Brand Logo" 
              style={{ maxWidth: '150px', height: 'auto', display: 'block' }}
            />
          </div>
          <h1>Sign In</h1>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <input 
                type="text" 
                name="username"
                placeholder="Username" 
                value={formData.username}
                onChange={handleChange}
                required 
                disabled={loading}
                autoComplete='username'
              />
              {errors.username && <div className="input-error">{errors.username}</div>}
            </div>
            <div className="input-group">
              <input 
                type="password" 
                name="password"
                placeholder="Password" 
                value={formData.password}
                onChange={handleChange}
                required 
                disabled={loading}
              />
              {errors.password && <div className="input-error">{errors.password}</div>}
            </div>
            {formError && <div className="input-error" style={{ marginBottom: 12 }}>{formError}</div>}
            <Link to="/forgot" className="forgot-link">Forgot Password?</Link>
            <button type="submit" className="sign-button" disabled={loading}>{loading ? 'Signing In...' : 'Sign In'}</button>
          </form>
          <p className="sign-link">
            Don't have an account? <Link to="/signup">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignIn;