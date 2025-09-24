import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/authAPI';
import './sign.css';

function SignIn() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await authAPI.signIn(formData);
      
      localStorage.setItem('authToken', response.accessToken || response.token);
      localStorage.setItem('user', JSON.stringify(response.user || response.account));
      
      const userRole = response.user?.role || response.account?.role;
      if (userRole === 'Admin') {
        navigate('/admin/dashboard');
      } else if (userRole === 'Staff') {
        navigate('/staff/dashboard');
      } else {
        navigate('/customer/dashboard');
      }
      
    } catch (error) {
      console.error('Sign in error:', error);
      alert(`Sign in failed: ${error.message || 'Invalid credentials'}`);
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
            <div className="brand-subtitle">SwapS</div>
            <div className="brand-title">Please Sign In</div>
          </div>
        </div>

        <div className="sign-container">
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
              />
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
            </div>
            <Link to="/forgot" className="forgot-link">Forgot Password?</Link>

            <button type="submit" className="sign-button" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
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