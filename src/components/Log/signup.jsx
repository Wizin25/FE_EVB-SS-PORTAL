import { useState } from 'react';
import { Link } from 'react-router-dom';
import './sign.css';

function SignUp() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    phone: '',
    address: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Sign Up Data:', formData);
    alert('Sign Up functionality would be implemented here');
  };

  return (
    <div className="sign-page">
      <div className="sign-main-container">
        <div className="brand-panel">
          <div className="brand-content">
            <div className="brand-title">...</div>
            <div className="brand-title">...</div>
            <div className="brand-subtitle">...</div>
            <div className="brand-title">...</div>
            <div className="brand-logo">Logo</div>
          </div>
        </div>

        <div className="sign-container">
          <h2>Sign Up</h2>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <input 
                type="text" 
                name="username"
                placeholder="Username" 
                value={formData.username}
                onChange={handleChange}
                required 
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
              />
            </div>
            <div className="input-group">
              <input 
                type="text" 
                name="phone"
                placeholder="Phone" 
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
            <div className="input-group">
              <input 
                type="text" 
                name="address"
                placeholder="Address" 
                value={formData.address}
                onChange={handleChange}
              />
            </div>
            <button type="submit" className="sign-button">Sign Up</button>
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