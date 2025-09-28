import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/authAPI';
import './sign.css';

function ForgotPassword() {
  const [formData, setFormData] = useState({
    email: '',
    otp: ''
  });
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Success
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    let processedValue = value;
    if (name === 'email' || name === 'otp') {
      processedValue = value.replace(/\s/g, '');
    }
    
    setFormData({
      ...formData,
      [name]: processedValue
    });
    setError('');
    setSuccess('');
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const cleanedText = pastedText.replace(/\s/g, '');
    
    setFormData(prev => ({
      ...prev,
      email: cleanedText
    }));
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Step 1: Send OTP to email
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const trimmedEmail = formData.email.trim();

    if (!trimmedEmail) {
      setError('Email is required');
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    
    try {
      await authAPI.forgotPassword(trimmedEmail);
      setSuccess('OTP has been sent to your email');
      setStep(2);
    } catch (error) {
      console.error('Send OTP error:', error);
      
      if (error?.errors && typeof error.errors === 'object') {
        const errorMessages = Object.values(error.errors).flat().filter(Boolean);
        setError(errorMessages.join(' - '));
      } else if (error?.message) {
        setError(error.message);
      } else {
        setError('Failed to send OTP. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.otp) {
      setError('OTP is required');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await authAPI.verifyOtp(formData.email, formData.otp);
      
      if (response && response.statusCode === 200) {
        setStep(3); // Move to success step
      } else {
        setError(response?.message || 'OTP verification failed');
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      
      if (error?.errors && typeof error.errors === 'object') {
        const errorMessages = Object.values(error.errors).flat().filter(Boolean);
        setError(errorMessages.join(' - '));
      } else if (error?.message) {
        setError(error.message);
      } else {
        setError('Invalid OTP. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      await authAPI.forgotPassword(formData.email);
      setSuccess('OTP has been resent successfully');
    } catch (error) {
      console.error('Resend OTP error:', error);
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/signin');
  };

  // Render Step 1: Email Input
  const renderEmailStep = () => (
    <>
      <h2>Reset Password</h2>
      <p className="forgot-description">
        Enter your email address and we'll send you an OTP to reset your password.
      </p>
      
      {error && (
        <div className="error-message" style={{ 
          color: 'red', 
          marginBottom: '15px', 
          textAlign: 'center',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}
      
      {success && (
        <div className="success-message" style={{ 
          color: 'green', 
          marginBottom: '15px', 
          textAlign: 'center',
          fontSize: '14px'
        }}>
          {success}
        </div>
      )}
      
      <form onSubmit={handleSendOtp}>
        <div className="input-group">
          <input 
            type="email" 
            name="email"
            placeholder="Enter your email address" 
            value={formData.email}
            onChange={handleChange}
            onPaste={handlePaste}
            required 
            disabled={isLoading}
            autoComplete="email"
          />
        </div>
        
        <button 
          type="submit" 
          className="sign-button"
          disabled={isLoading}
        >
          {isLoading ? 'Sending OTP...' : 'Send OTP'}
        </button>
      </form>
      
      <div className="back-to-signin">
        <p className="sign-link">
          Remember your password? <Link to="/signin">Back to Sign In</Link>
        </p>
        <p className="sign-link">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </div>
    </>
  );

  // Render Step 2: OTP Verification
  const renderOtpStep = () => (
    <>
      <h2>Verify OTP</h2>
      <p className="forgot-description">
        We've sent a 6-digit OTP to: <strong>{formData.email}</strong>
        <br />
        Check your email for the OTP code.
      </p>
      
      {success && (
        <div className="success-message" style={{ 
          color: 'green', 
          marginBottom: '15px', 
          textAlign: 'center',
          fontSize: '14px'
        }}>
          {success}
        </div>
      )}
      
      {error && (
        <div className="error-message" style={{ 
          color: 'red', 
          marginBottom: '15px', 
          textAlign: 'center',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}
      
      <form onSubmit={handleVerifyOtp}>
        <div className="input-group">
          <input 
            type="text" 
            name="otp"
            placeholder="Enter OTP" 
            value={formData.otp}
            onChange={handleChange}
            required 
            disabled={isLoading}
            maxLength={6}
          />
        </div>
        
        <button 
          type="submit" 
          className="sign-button"
          disabled={isLoading}
        >
          {isLoading ? 'Verifying...' : 'Verify OTP'}
        </button>
      </form>
      
      <div className="reset-actions">     
        <p className="sign-link">
          <Link to="/signin">Back to Sign In</Link>
        </p>
      </div>
    </>
  );

  // Render Step 3: Success Message
  const renderSuccessStep = () => (
    <>
      <h2>Password Reset Successfully!</h2>
      
      <div className="success-message" style={{ 
        color: 'green', 
        marginBottom: '20px', 
        textAlign: 'center',
        fontSize: '16px',
        lineHeight: '1.5'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '15px' }}>✅</div>
        <strong>New password has been sent to your email!</strong>
        <br />
        <span style={{ fontSize: '14px', color: '#666' }}>
          Please check your inbox at <strong>{formData.email}</strong> to get your new password.
        </span>
      </div>

      <button 
        type="button" 
        className="sign-button"
        onClick={handleBackToLogin}
        style={{ marginTop: '20px' }}
      >
        Back to Login
      </button>
    </>
  );

  const getBrandContent = () => {
    switch (step) {
      case 1:
        return {
          title: "Forgot Your",
          subtitle: "Password?",
          message: "No worries, we'll help you reset it",
          icon: "🔐"
        };
      case 2:
        return {
          title: "Check Your",
          subtitle: "Email",
          message: "We've sent you an OTP",
          icon: "📧"
        };
      case 3:
        return {
          title: "Password",
          subtitle: "Reset Success!",
          message: "Check your email for new password",
          icon: "✅"
        };
      default:
        return {
          title: "Forgot Your",
          subtitle: "Password?",
          message: "No worries, we'll help you reset it",
          icon: "🔐"
        };
    }
  };

  const brandContent = getBrandContent();

  return (
    <div className="sign-page">
      <div className="sign-main-container">
        <div className="brand-panel">
          <div className="brand-content">
            <div className="brand-title">{brandContent.title}</div>
            <div className="brand-subtitle">{brandContent.subtitle}</div>
            <div className="brand-title">{brandContent.message}</div>
            <div className="brand-logo">{brandContent.icon}</div>
          </div>
        </div>

        <div className="sign-container">
          {step === 1 && renderEmailStep()}
          {step === 2 && renderOtpStep()}
          {step === 3 && renderSuccessStep()}
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;