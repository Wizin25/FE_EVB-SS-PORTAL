import { useState } from 'react';
import { useRef, useEffect } from 'react';
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
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    if (['username', 'password', 'confirmedPassword', 'phone', 'email'].includes(name)) {
      processedValue = value.replace(/\s/g, '');
    } else if (['name', 'address'].includes(name)) {
      processedValue = value.replace(/^\s+/, '');
    }
    setFormData({ ...formData, [name]: processedValue });
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setFormError('');
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const cleanedText = pastedText.replace(/\s/g, '');
    const { name } = e.target;
    setFormData(prev => ({ ...prev, [name]: cleanedText }));
  };

  const validate = () => {
    const newErrors = {};
    const trimmedUsername = formData.username.trim();
    const trimmedName = formData.name.trim();
    const trimmedPhone = formData.phone.trim();
    const trimmedAddress = formData.address.trim();
    const trimmedEmail = formData.email.trim();

    if (!trimmedUsername) newErrors.username = 'Username is required';
    if (trimmedUsername.includes(' ')) newErrors.username = 'Username cannot contain spaces';

    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password && formData.password.length < 3) newErrors.password = 'Mật khẩu phải có ít nhất 3 ký tự';
    if (formData.password.includes(' ')) newErrors.password = 'Password cannot contain spaces';

    if (!formData.confirmedPassword) newErrors.confirmedPassword = 'Confirmed password is required';
    if (formData.confirmedPassword && formData.confirmedPassword.length < 3) newErrors.confirmedPassword = 'Mật khẩu phải có ít nhất 3 ký tự';
    if (formData.password && formData.confirmedPassword && formData.password !== formData.confirmedPassword) {
      newErrors.confirmedPassword = 'Passwords do not match';
    }

    if (!trimmedName) newErrors.name = 'Name is required';
    if (!trimmedPhone) newErrors.phone = 'Phone is required';
    if (!trimmedAddress) newErrors.address = 'Address is required';
    if (!trimmedEmail) newErrors.email = 'Email is required';

    const nameRegex = /^[a-zA-ZÀ-ỹ\s]+$/;
    if (trimmedName && !nameRegex.test(trimmedName)) newErrors.name = 'Name must contain only letters and spaces';

    const phoneRegex = /^\d{10,11}$/;
    if (trimmedPhone && !phoneRegex.test(trimmedPhone)) newErrors.phone = 'Phone must be 10-11 digits';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (trimmedEmail && !emailRegex.test(trimmedEmail)) newErrors.email = 'Please enter a valid email address';
    if (trimmedEmail.includes(' ')) newErrors.email = 'Email cannot contain spaces';

    return newErrors;
  };

  // Extended error mapping to handle Otp error returned by the backend for OTP modal
  const mapBackendErrorsToFields = (errObj, forOtpModal = false) => {
    // This mapping will extract Otp/Email backend errors (per prompt) into 'otp' and 'email' fields
    const fieldMap = {
      Username: 'username',
      Password: 'password',
      ConfirmedPassword: 'confirmedPassword',
      Name: 'name',
      Phone: 'phone',
      Address: 'address',
      Email: 'email',
      Otp: 'otp',
    };
    const mapped = {};
    if (errObj && typeof errObj === 'object') {
      Object.keys(errObj).forEach((key) => {
        const field = fieldMap[key] || null;
        const messages = Array.isArray(errObj[key]) ? errObj[key] : [];
        if (field && messages.length > 0) mapped[field] = messages[0];
      });
    }
    if (!forOtpModal) delete mapped.otp;
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
        username: formData.username.trim(),
        password: formData.password,
        confirmedPassword: formData.confirmedPassword,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        email: formData.email.trim()
      });
      alert('Đăng ký thành công! Một mã OTP đã được gửi đến email của bạn.');
      setShowOtpModal(true);
    } catch (error) {
      if (error?.errors && typeof error.errors === 'object') {
        const mapped = mapBackendErrorsToFields(error.errors);
        if (Object.keys(mapped).length > 0) {
          setErrors(mapped);
        } else {
          const aggregated = Object.values(error.errors).flat().filter(Boolean).join(' - ');
          if (aggregated) setFormError(aggregated);
        }
      } else if (error?.title) {
        setFormError(error.title);
      } else {
        const msg = error?.message || error?.detail || error?.toString() || 'Sign up failed';
        setFormError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Add OTP-specific error handling (frontend + backend errors)
  const [otpError, setOtpError] = useState('');

  const [otpSuccessCountdown, setOtpSuccessCountdown] = useState(null);
  const [otpSuccessMessage, setOtpSuccessMessage] = useState('');

  const handleVerifyOtp = async () => {
    setOtpError('');
    setOtpSuccessCountdown(null);
    setOtpSuccessMessage('');
    if (!otp.trim()) {
      setOtpError('Mã OTP là bắt buộc.');
      return;
    }
    setIsVerifying(true);
    try {
      const res = await authAPI.verifyRegisterOtp({
        email: formData.email.trim(),
        otp: otp.trim(),
      });
      if (res?.isSuccess) {
        let seconds = 5;
        setOtpSuccessMessage(
          (res.message || 'Xác thực OTP thành công!') + `\nChuyển về trang đăng nhập sau ${seconds} giây...`
        );
        setOtpSuccessCountdown(seconds);
        const intervalId = setInterval(() => {
          seconds = seconds - 1;
          if (seconds > 0) {
            setOtpSuccessCountdown(seconds);
            setOtpSuccessMessage(
              (res.message || 'Xác thực OTP thành công!') + `\nChuyển về trang đăng nhập sau ${seconds} giây...`
            );
          } else {
            clearInterval(intervalId);
            setOtpSuccessCountdown(null);
            setOtpSuccessMessage('');
            navigate('/signin');
          }
        }, 1000);
      } else {
        setOtpError('Mã OTP không hợp lệ.');
      }
    } catch (err) {
      if (err?.errors) {
        const emailErr = err.errors.Email?.[0];
        const otpErr = err.errors.Otp?.[0];
        setOtpError(otpErr || emailErr || err.message || 'Xác thực OTP thất bại.');
      } else {
        setOtpError(err.message || 'Xác thực OTP thất bại.');
      }
    } finally {
      setIsVerifying(false);
    }
  };


  // Đếm ngược 60 giây cho nút gửi lại OTP
  const [resendCooldown, setResendCooldown] = useState(0);
  const resendIntervalRef = useRef(null);

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return; // không cho bấm nếu chưa hết cooldown

    setResendLoading(true);
    setOtpError('');
    try {
      await authAPI.resendRegisterOtp({ email: formData.email.trim() });
      alert('Đã gửi lại OTP. Vui lòng kiểm tra email của bạn.');
      setResendCooldown(60); // bắt đầu 60 giây cooldown
      // Thiết lập interval đếm ngược
      if (resendIntervalRef.current) clearInterval(resendIntervalRef.current);
      resendIntervalRef.current = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) {
            clearInterval(resendIntervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      if (err?.errors) {
        const emailErr = err.errors.Email?.[0];
        setOtpError(emailErr || err.message || 'Gửi lại OTP thất bại.');
      } else {
        setOtpError(err.message || 'Gửi lại OTP thất bại.');
      }
    } finally {
      setResendLoading(false);
    }
  };

  // Dọn dẹp interval khi unmount hoặc khi OTP modal đóng
  useEffect(() => {
    if (!showOtpModal && resendIntervalRef.current) {
      clearInterval(resendIntervalRef.current);
      setResendCooldown(0);
    }
    return () => {
      if (resendIntervalRef.current) clearInterval(resendIntervalRef.current);
    }
  }, [showOtpModal]);

  return (
    <div className="sign-page">
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          objectFit: "cover",
          zIndex: -2,
          pointerEvents: "none"
        }}
      >
        <source src="https://res.cloudinary.com/dscvguyvb/video/upload/v1761766142/15107541-uhd_3840_2160_30fps_mt03rn.mp4" type="video/mp4" />
      </video>

      {/* LiquidGlass filter */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <filter id="liquidGlass" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="2" seed="8" result="noise" />
            <feGaussianBlur in="noise" stdDeviation="2" result="map" />
            <feDisplacementMap in="SourceGraphic" in2="map" scale="70" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      <div className="sign-main-container liquid">
        <div className="sign-container">
          <h1>Sign Up</h1>
          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="input-group">
              <input type="text" name="username" placeholder="Username *" value={formData.username} onChange={handleChange} onPaste={handlePaste} required disabled={loading} autoComplete="username" />
              {errors.username && <div className="input-error">{errors.username}</div>}
            </div>
            <div className="input-group">
              <input type="password" name="password" placeholder="Password *" value={formData.password} onChange={handleChange} onPaste={handlePaste} required minLength={3} disabled={loading} autoComplete="new-password" />
              {errors.password && <div className="input-error">{errors.password}</div>}
            </div>
            <div className="input-group">
              <input type="password" name="confirmedPassword" placeholder="Confirmed Password *" value={formData.confirmedPassword} onChange={handleChange} onPaste={handlePaste} required minLength={3} disabled={loading} autoComplete="new-password" />
              {errors.confirmedPassword && <div className="input-error">{errors.confirmedPassword}</div>}
            </div>
            <div className="input-group">
              <input type="text" name="name" placeholder="Name *" value={formData.name} onChange={handleChange} required disabled={loading} autoComplete='name' />
              {errors.name && <div className="input-error">{errors.name}</div>}
            </div>
            <div className="input-group">
              <input type="text" name="phone" placeholder="Phone *" value={formData.phone} onChange={handleChange} onPaste={handlePaste} required disabled={loading} autoComplete="tel" />
              {errors.phone && <div className="input-error">{errors.phone}</div>}
            </div>
            <div className="input-group">
              <input type="text" name="address" placeholder="Address *" value={formData.address} onChange={handleChange} required disabled={loading} autoComplete="street-address" />
              {errors.address && <div className="input-error">{errors.address}</div>}
            </div>
            <div className="input-group">
              <input type="email" name="email" placeholder="Email *" value={formData.email} onChange={handleChange} onPaste={handlePaste} required disabled={loading} autoComplete="email" />
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

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="otp-modal">
          <div className="otp-box">
            <h2>Xác thực OTP</h2>
            <p>Nhập mã OTP đã được gửi đến email <b>{formData.email}</b></p>
            <input
              type="text"
              placeholder="Nhập OTP..."
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value);
                setOtpError('');
              }}
              maxLength={6}
              disabled={isVerifying || !!otpSuccessCountdown}
              autoComplete="one-time-code"
            />
            {/* Hiển thị lỗi OTP nếu có */}
            {otpError && <div className="input-error" style={{ marginTop: 8 }}>{otpError}</div>}
            {/* Hiển thị thông báo thành công và đếm ngược khi xác thực OTP thành công */}
            {otpSuccessMessage && (
              <div className="otp-success" style={{ marginTop: 8, whiteSpace: "pre-line", color: "#36b37e", fontWeight: 500 }}>
                {otpSuccessMessage}
              </div>
            )}
            <div className="otp-actions">
              <button
                className="btn small"
                onClick={handleVerifyOtp}
                disabled={isVerifying || !!otpSuccessCountdown}
              >
                {isVerifying ? 'Đang xác thực...' : 'Xác thực'}
              </button>
              <button
                className="btn small"
                onClick={handleResendOtp}
                disabled={resendLoading || resendCooldown > 0}
              >
                {resendLoading ? 'Đang gửi lại...' : resendCooldown > 0 ? `Gửi lại OTP (${resendCooldown}s)` : 'Gửi lại OTP'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SignUp;
