// components/Log/SignIn.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';

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
          <button type="submit" className="sign-button">Sign In</button>
        </form>
        <p className="sign-link">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}

export default SignIn;