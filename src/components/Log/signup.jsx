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
    const { name, value } = e.target;
    
    // Không cho phép khoảng trắng ở đầu cho các trường text thông thường
    // Không cho phép khoảng trắng hoàn toàn trong username, password, phone, email
    let processedValue = value;
    
    if (['username', 'password', 'confirmedPassword', 'phone', 'email'].includes(name)) {
      processedValue = value.replace(/\s/g, ''); // Remove all spaces
    } else if (['name', 'address'].includes(name)) {
      processedValue = value.replace(/^\s+/, ''); // Remove leading spaces only
    }
    
    setFormData({
      ...formData,
      [name]: processedValue
    });
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setFormError('');
  };

  // Thêm hàm xử lý khi paste vào email để loại bỏ khoảng trắng
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const cleanedText = pastedText.replace(/\s/g, ''); // Remove all spaces
    
    const { name } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: cleanedText
    }));
  };

  const validate = () => {
    const newErrors = {};
    
    // Trim dữ liệu trước khi validate
    const trimmedUsername = formData.username.trim();
    const trimmedName = formData.name.trim();
    const trimmedPhone = formData.phone.trim();
    const trimmedAddress = formData.address.trim();
    const trimmedEmail = formData.email.trim();
    
    // Username validation - no spaces allowed
    if (!trimmedUsername) newErrors.username = 'Username is required';
    if (trimmedUsername.includes(' ')) newErrors.username = 'Username cannot contain spaces';
    
    // Password validation - no spaces allowed
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password && formData.password.length < 3) newErrors.password = 'Mật khẩu phải có ít nhất 3 ký tự';
    if (formData.password.includes(' ')) newErrors.password = 'Password cannot contain spaces';
    
    // Confirmed Password validation - no spaces allowed
    if (!formData.confirmedPassword) newErrors.confirmedPassword = 'Confirmed password is required';
    if (formData.confirmedPassword && formData.confirmedPassword.length < 3) newErrors.confirmedPassword = 'Mật khẩu phải có ít nhất 3 ký tự';
    if (formData.confirmedPassword.includes(' ')) newErrors.confirmedPassword = 'Password cannot contain spaces';
    if (formData.password && formData.confirmedPassword && formData.password !== formData.confirmedPassword) {
      newErrors.confirmedPassword = 'Passwords do not match';
    }
    
    if (!trimmedName) newErrors.name = 'Name is required';
    if (!trimmedPhone) newErrors.phone = 'Phone is required';
    if (!trimmedAddress) newErrors.address = 'Address is required';
    if (!trimmedEmail) newErrors.email = 'Email is required';
    
    // Name validation - no numbers or special characters
    const nameRegex = /^[a-zA-ZÀ-ỹ\s]+$/;
    if (trimmedName && !nameRegex.test(trimmedName)) {
      newErrors.name = 'Name must contain only letters and spaces';
    }
    
    // Phone validation
    const phoneRegex = /^\d{10,11}$/;
    if (trimmedPhone && !phoneRegex.test(trimmedPhone)) {
      newErrors.phone = 'Phone must be 10-11 digits';
    }
    
    // Email validation - không cho phép khoảng trắng
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (trimmedEmail && !emailRegex.test(trimmedEmail)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (trimmedEmail.includes(' ')) {
      newErrors.email = 'Email cannot contain spaces';
    }
    
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
    
    // Trim tất cả dữ liệu trước khi gửi
    const trimmedData = {
      username: formData.username.trim(),
      password: formData.password,
      confirmedPassword: formData.confirmedPassword,
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      email: formData.email.trim()
    };
    
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setLoading(true);

    try {
      await authAPI.signUp(trimmedData);
      alert('Sign up successful! Please sign in.');
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
                onPaste={handlePaste}
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
                onPaste={handlePaste}
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
                onPaste={handlePaste}
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
                onPaste={handlePaste}
                required
                disabled={loading}
                autoComplete="tel"
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
                autoComplete="street-address"
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
                onPaste={handlePaste}
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