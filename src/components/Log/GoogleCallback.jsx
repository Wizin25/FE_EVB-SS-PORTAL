import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/authAPI';
import { decodeJwt, extractRolesFromPayload } from '../services/jwt';

function GoogleCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    handleGoogleCallback();
  }, []);

  const handleGoogleCallback = async () => {
    try {
      const result = await authAPI.handleGoogleCallback();
      const token = result?.accessToken || result?.token;
      
      if (token) {
        localStorage.setItem('authToken', token);
        const payload = decodeJwt(token);
        const roles = extractRolesFromPayload(payload);

        if (roles.includes('Admin')) navigate('/admin');
        else if (roles.includes('Bsstaff')) navigate('/staff');
        else navigate('/home');
      } else {
        navigate('/signin', { state: { error: 'Google login failed' } });
      }
    } catch (error) {
      console.error('Google callback error:', error);
      navigate('/signin', { state: { error: error.message } });
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh' 
    }}>
      <div>Processing Google login...</div>
    </div>
  );
}

export default GoogleCallback;