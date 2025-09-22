import { useState } from 'react';
import { Link } from 'react-router-dom';
import './sign.css';

function SignIn() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Sign In Data:', formData);
    alert('Sign In functionality would be implemented here');
  };

  return (
    <div className="sign-page">
      <div className="sign-main-container">
        <div className="brand-panel">
          <div className="brand-content">
            <div className="brand-content">
            <div className="brand-title">Welcome to</div>
            <div className="brand-subtitle">SwapS</div>
            <div className="brand-title">Please Sign In</div>
          </div>
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
            <Link to="/forgot" className="forgot-link">Forgot Password?</Link>

            <button type="submit" className="sign-button">Sign In</button>
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