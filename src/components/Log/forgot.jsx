import { useState } from 'react';
import { Link } from 'react-router-dom';
import './sign.css';

function ForgotPassword() {
  const [formData, setFormData] = useState({
    email: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log('Forgot Password Data:', formData);
      setIsSubmitted(true);
      setIsLoading(false);
    }, 1500);
  };

  const handleResend = () => {
    setIsLoading(true);
    setTimeout(() => {
      console.log('Resending reset email to:', formData.email);
      setIsLoading(false);
    }, 1000);
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
          
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <input 
                type="email" 
                name="email"
                placeholder="Enter your email address" 
                value={formData.email}
                onChange={handleChange}
                required 
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