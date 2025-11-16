import { useState, useEffect } from 'react';
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

  // Xử lý Google callback nếu có token trong URL (sau khi redirect back)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const googleToken = urlParams.get('token');
    if (googleToken) handleGoogleToken(googleToken);
  }, []);


  const handleGoogleToken = async (token) => {
    try {
      localStorage.setItem('authToken', token);
      const payload = decodeJwt(token);
      const roles = extractRolesFromPayload(payload);

      if (roles.includes('Admin')) navigate('/admin');
      else if (roles.includes('Bsstaff')) navigate('/staff');
      else navigate('/home');
    } catch (error) {
      console.error('Error handling Google token:', error);
      setFormError('Failed to process Google login');
    }
  };

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
    if (formData.password && formData.password.length < 3)
      newErrors.password = 'Password must be at least 3 characters';
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
      const result = await authAPI.signIn({
        username: formData.username.trim(),
        password: formData.password,
      });
      const token = result?.token || result?.accessToken || result?.data?.token;
      if (token) {
        localStorage.setItem('authToken', token);
        const payload = decodeJwt(token);
        const roles = extractRolesFromPayload(payload);

        if (roles.includes('Admin')) navigate('/admin');
        else if (roles.includes('Bsstaff')) navigate('/staff');
        else navigate('/home');
      }
    } catch (error) {
      if (error?.errors && typeof error.errors === 'object') {
        const mapped = mapBackendErrorsToFields(error.errors);
        if (Object.keys(mapped).length > 0) setErrors(mapped);
        else {
          const aggregated = Object.values(error.errors)
            .flat()
            .filter(Boolean)
            .join(' - ');
          if (aggregated) setFormError(aggregated);
        }
      } else if (error?.title) {
        setFormError(error.title);
      } else {
        const msg =
          error?.message || error?.detail || error?.toString() || 'Đăng nhập thất bại';
        setFormError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      // 1️⃣ Gọi API login-google bằng redirect thực, không phải axios
      // => cho phép browser follow redirect tới Google mà không bị CORS
      // gọi thẳng không popup
      window.location.href = 'https://localhost:5001/api/Account/login-google';

      // 2️⃣ Theo dõi popup
      const timer = setInterval(async () => {
        if (popup.closed) {
          clearInterval(timer);
          try {
            // 3️⃣ Khi popup đóng, lấy token từ BE
            const token = await authAPI.getGoogleAccessToken();
            if (token) {
              await handleGoogleToken(token);
            } else {
              setFormError('Google login failed: no token returned');
            }
          } catch (error) {
            console.error('Error getting access token:', error);
            setFormError('Google authentication failed.');
          }
        }
      }, 1200);
    } catch (error) {
      console.error('Error initiating Google login:', error);
      setFormError('Không khởi tạo được đăng nhập Google');
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
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          objectFit: 'cover',
          zIndex: -2,
          pointerEvents: 'none',
        }}
      >
        <source
          src="https://res.cloudinary.com/dscvguyvb/video/upload/v1761766142/15107541-uhd_3840_2160_30fps_mt03rn.mp4"
          type="video/mp4"
        />
      </video>

      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <filter
            id="liquidGlass"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.008 0.012"
              numOctaves="1"
              seed="10"
              result="noise"
            />
            <feGaussianBlur in="noise" stdDeviation="2" result="map" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="map"
              scale="100"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      <div className="sign-main-container liquid">
        <div className="sign-container">
          <div style={{ position: 'absolute', top: -90, padding: 0 }}>
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
                autoComplete="username"
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

            {formError && (
              <div className="input-error" style={{ marginBottom: 12 }}>
                {formError}
              </div>
            )}

            <Link to="/forgot" className="forgot-link">
              Forgot Password?
            </Link>

            <button type="submit" className="sign-button" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>

            {/* ==== Google Login Button ==== */}
            <button
              type="button"
              className="sign-button google-btn"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <svg
                className="google-icon"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span>Sign In with Google</span>
            </button>
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