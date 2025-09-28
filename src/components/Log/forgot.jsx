import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/authAPI';
import './sign.css';

function ForgotPassword() {
  const [formData, setFormData] = useState({
    email: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Remove spaces from email
    let processedValue = value;
    if (name === 'email') {
      processedValue = value.replace(/\s/g, '');
    }
    
    setFormData({
      ...formData,
      [name]: processedValue
    });
    setError('');
    setSuccess('');
  };

  // Handle paste event to remove spaces
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Trim email before validation
    const trimmedEmail = formData.email.trim();

    if (!trimmedEmail) {
      setError('Email is required');
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    if (trimmedEmail.includes(' ')) {
      setError('Email cannot contain spaces');
      return;
    }

    setIsLoading(true);
    
    try {
      // Call the actual forgot password API
      await authAPI.forgotPassword(trimmedEmail);
      setIsSubmitted(true);
      setSuccess('Password reset instructions have been sent to your email');
    } catch (error) {
      console.error('Forgot password error:', error);
      
      // Handle different error formats from backend
      if (error?.errors && typeof error.errors === 'object') {
        const errorMessages = Object.values(error.errors).flat().filter(Boolean);
        setError(errorMessages.join(' - '));
      } else if (error?.title) {
        setError(error.title);
      } else if (error?.message) {
        setError(error.message);
      } else {
        setError('Failed to send reset email. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      await authAPI.forgotPassword(formData.email);
      setSuccess('Reset email has been resent successfully');
    } catch (error) {
      console.error('Resend email error:', error);
      setError('Failed to resend email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="sign-page">
        <div className="sign-main-container">
          <div className="brand-panel">
            <div className="brand-content">
              <div className="brand-title">Check Your</div>
              <div className="brand-subtitle">Email</div>
              <div className="brand-title">We've sent you</div>
              <div className="brand-title">a reset link</div>
              <div className="brand-logo">📧</div>
            </div>
          </div>

          <div className="sign-container">
            <h2>Check Your Email</h2>
            
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

            <div className="success-message">
              <p>We've sent a password reset link to:</p>
              <strong>{formData.email}</strong>
              <p>Click the link in your email to reset your password.</p>
            </div>
            
            <div className="reset-actions">
              <button 
                type="button" 
                className="sign-button secondary"
                onClick={handleResend}
                disabled={isLoading}
              >
                {isLoading ? 'Resending...' : 'Resend Email'}
              </button>
              
              <p className="sign-link">
                Remember your password? <Link to="/signin">Sign In</Link>
              </p>
              
              <p className="sign-link">
                Don't have an account? <Link to="/signup">Sign Up</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sign-page">
      <div className="sign-main-container">
        <div className="brand-panel">
          <div className="brand-content">
            <div className="brand-title">Forgot Your</div>
            <div className="brand-subtitle">Password?</div>
            <div className="brand-title">No worries,</div>
            <div className="brand-title">we'll help you reset it</div>
            <div className="brand-logo">🔐</div>
          </div>
        </div>

        <div className="sign-container">
          <h2>Reset Password</h2>
          <p className="forgot-description">
            Enter your email address and we'll send you a link to reset your password.
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
          
          <form onSubmit={handleSubmit}>
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
              {isLoading ? 'Sending...' : 'Send Reset Link'}
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
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;