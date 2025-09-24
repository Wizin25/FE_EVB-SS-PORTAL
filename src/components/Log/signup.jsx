import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/authAPI';
import './sign.css';

function SignUp() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmedPassword: '',
    name: '',
    phone: '',
    address: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
    setFormError('');
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password && formData.password.length < 3) newErrors.password = 'Mật khẩu phải có ít nhất 3 ký tự';
    if (!formData.confirmedPassword) newErrors.confirmedPassword = 'Confirmed password is required';
    if (formData.confirmedPassword && formData.confirmedPassword.length < 3) newErrors.confirmedPassword = 'Mật khẩu phải có ít nhất 3 ký tự';
    if (formData.password && formData.confirmedPassword && formData.password !== formData.confirmedPassword) {
      newErrors.confirmedPassword = 'Passwords do not match';
    }
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    return newErrors;
  };

  const mapBackendErrorsToFields = (errObj) => {
    const fieldMap = {
      Username: 'username',
      Password: 'password',
      ConfirmedPassword: 'confirmedPassword',
      Name: 'name',
      Phone: 'phone',
      Address: 'address',
      Email: 'email',
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
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);

    try {
      await authAPI.signUp({
        username: formData.username,
        password: formData.password,
        confirmedPassword: formData.confirmedPassword,
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        email: formData.email
      });
      navigate('/signin');
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
      const msg = error?.message || error?.detail || error?.toString() || 'Sign up failed';
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
            <div className="brand-title">Welcome To</div>
            <div className="brand-subtitle">SwapX</div>
            <div className="brand-title">Please Sign Up</div>
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
          
          <h2>Sign Up</h2>
          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="input-group">
              <input 
                type="text" 
                name="username"
                placeholder="Username *"
                value={formData.username}
                onChange={handleChange}
                required
                disabled={loading}
                autoComplete="username"
              />
              {errors.username && <div className="input-error">{errors.username}</div>}
            </div>
            <div className="input-group">
              <input 
                type="password" 
                name="password"
                placeholder="Password *"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={3}
                disabled={loading}
                autoComplete="new-password"
              />
              {errors.password && <div className="input-error">{errors.password}</div>}
            </div>
            <div className="input-group">
              <input 
                type="password" 
                name="confirmedPassword"
                placeholder="Confirmed Password *"
                value={formData.confirmedPassword}
                onChange={handleChange}
                required
                minLength={3}
                disabled={loading}
                autoComplete="new-password"
              />
              {errors.confirmedPassword && <div className="input-error">{errors.confirmedPassword}</div>}
            </div>
            <div className="input-group">
              <input 
                type="text" 
                name="name"
                placeholder="Name *"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={loading}
                autoComplete='name'
              />
              {errors.name && <div className="input-error">{errors.name}</div>}
            </div>
            <div className="input-group">
              <input 
                type="text" 
                name="phone"
                placeholder="Phone *"
                value={formData.phone}
                onChange={handleChange}
                required
                disabled={loading}
                autoComplete='phone'
              />
              {errors.phone && <div className="input-error">{errors.phone}</div>}
            </div>
            <div className="input-group">
              <input 
                type="text" 
                name="address"
                placeholder="Address *"
                value={formData.address}
                onChange={handleChange}
                required
                disabled={loading}
                autoComplete='address'
              />
              {errors.address && <div className="input-error">{errors.address}</div>}
            </div>
            <div className="input-group">
              <input 
                type="email" 
                name="email"
                placeholder="Email *"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
                autoComplete="email"
              />
              {errors.email && <div className="input-error">{errors.email}</div>}
            </div>
            {formError && <div className="input-error" style={{ marginBottom: 12 }}>{formError}</div>}
            <button type="submit" className="sign-button" disabled={loading}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>
          
          <p className="sign-link">
            Already have an account? <Link to="/signin">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignUp;