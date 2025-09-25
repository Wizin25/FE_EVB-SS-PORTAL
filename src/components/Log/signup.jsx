import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/authAPI';
import './sign.css';

function SignUp() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    name: '',
    phone: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  // Validation function
  const validateForm = () => {
    const newErrors = {};
    
    // Name validation - no numbers or special characters
    const nameRegex = /^[a-zA-ZÀ-ỹ\s]+$/;
    if (!nameRegex.test(formData.name)) {
      newErrors.name = 'Name must contain only letters and spaces';
    }
    
    // Phone validation
    const phoneRegex = /^\d{10,11}$/;
    if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Phone must be 10-11 digits';
    }
    
    // Password validation
    if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user types
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setErrors({});
    
    try {
      await authAPI.signUp(formData);
      alert('Sign up successful! Please sign in.');
      navigate('/signin');
    } catch (error) {
      console.error('Sign up error:', error);
      
      // Handle server validation errors
      if (error.errors) {
        setErrors(error.errors);
      } else {
        alert(`Sign up failed: ${error.message || 'Please try again'}`);
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
            <div className="brand-subtitle">SwapX</div>
            <div className="brand-title">Please Sign Up</div>
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
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <input 
                type="text" 
                name="name"
                placeholder="Full Name (letters only)" 
                value={formData.name}
                onChange={handleChange}
                required 
                disabled={loading}
              />
              {errors.name && <div className="error-message">{errors.name}</div>}
              {errors.Name && <div className="error-message">{errors.Name[0]}</div>}
            </div>
            
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
                type="email" 
                name="email"
                placeholder="Email" 
                value={formData.email}
                onChange={handleChange}
                required 
                disabled={loading}
              />
            </div>
            
            <div className="input-group">
              <input 
                type="password" 
                name="password"
                placeholder="Password (min. 6 characters)" 
                value={formData.password}
                onChange={handleChange}
                required 
                disabled={loading}
              />
              {errors.password && <div className="error-message">{errors.password}</div>}
            </div>
            
            <div className="input-group">
              <input 
                type="text" 
                name="phone"
                placeholder="Phone (10-11 digits)" 
                value={formData.phone}
                onChange={handleChange}
                required
                disabled={loading}
              />
              {errors.phone && <div className="error-message">{errors.phone}</div>}
            </div>
            
            <div className="input-group">
              <input 
                type="text" 
                name="address"
                placeholder="Address" 
                value={formData.address}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            
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