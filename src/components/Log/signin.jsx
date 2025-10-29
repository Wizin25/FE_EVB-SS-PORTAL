import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/authAPI';
import { decodeJwt, extractRolesFromPayload } from '../services/jwt';
import './sign.css';

function SignIn() {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    if (name === 'username' || name === 'password') {
      processedValue = value.replace(/\s/g, '');
    }
    setFormData({ ...formData, [name]: processedValue });
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setFormError('');
  };

  const validate = () => {
    const newErrors = {};
    const trimmedUsername = formData.username.trim();
    if (!trimmedUsername) newErrors.username = 'Username is required';
    if (trimmedUsername.includes(' ')) newErrors.username = 'Username cannot contain spaces';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password && formData.password.length < 3) newErrors.password = 'Mật khẩu phải có ít nhất 3 ký tự';
    if (formData.password.includes(' ')) newErrors.password = 'Password cannot contain spaces';
    return newErrors;
  };

  const mapBackendErrorsToFields = (errObj) => {
    const fieldMap = { Username: 'username', Password: 'password' };
    const mapped = {};
    if (errObj && typeof errObj === 'object') {
      Object.keys(errObj).forEach((key) => {
        const field = fieldMap[key] || null;
        const messages = Array.isArray(errObj[key]) ? errObj[key] : [];
        if (field && messages.length > 0) mapped[field] = messages[0];
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
      const result = await authAPI.signIn({ username: formData.username.trim(), password: formData.password });
      const token = result?.token || result?.accessToken || result?.data?.token;
      if (token) localStorage.setItem('authToken', token);
      const payload = token ? decodeJwt(token) : null;
      const roles = extractRolesFromPayload(payload);
      if (roles.includes('Admin')) navigate('/admin');
      else if (roles.includes('Bsstaff')) navigate('/staff');
      else navigate('/home');
    } catch (error) {
      if (error?.errors && typeof error.errors === 'object') {
        const mapped = mapBackendErrorsToFields(error.errors);
        if (Object.keys(mapped).length > 0) setErrors(mapped);
        else {
          const aggregated = Object.values(error.errors).flat().filter(Boolean).join(' - ');
          if (aggregated) setFormError(aggregated);
        }
      } else if (error?.title) {
        setFormError(error.title);
      } else {
        const msg = error?.message || error?.detail || error?.toString() || 'Đăng nhập thất bại';
        setFormError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sign-page">
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: "fixed",
          top: 0, left: 0,
          width: "100vw", height: "100vh",
          objectFit: "cover", zIndex: -2, pointerEvents: "none"
        }}
      >
        <source src="https://res.cloudinary.com/dscvguyvb/video/upload/v1761766142/15107541-uhd_3840_2160_30fps_mt03rn.mp4" type="video/mp4" />
      </video>

      {/* LiquidGlass filter */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <filter id="liquidGlass" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="1" seed="10" result="noise" />
            <feGaussianBlur in="noise" stdDeviation="2" result="map" />
            <feDisplacementMap in="SourceGraphic" in2="map" scale="100" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      <div className="sign-main-container liquid">
        <div className="sign-container">
          <div style={{ position: 'absolute', top: -130, padding: 0 }}>
            <img
              src="https://res.cloudinary.com/dzht29nkq/image/upload/v1758274139/SwapX_1_-Photoroom_wvmglm.png"
              alt="Brand Logo"
              style={{ maxWidth: '120px', height: 'auto', display: 'block' }}
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
