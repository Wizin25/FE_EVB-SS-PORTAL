import React, { useState, useEffect } from 'react';
import { authAPI } from '../services/authAPI';
import { useNavigate } from 'react-router-dom';
import { getCurrentUserPayload } from '../services/jwt'; // Import hàm lấy thông tin user từ JWT
import './Vehicle.css';
import HeaderDriver from "../Home/header";

const Vehicle = () => {
  const [vehicles, setVehicles] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") || "light";
    }
    return "light";
  });
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [nextBooking, setNextBooking] = useState(null);
  const handleOpenBooking = () => {
    window.location.href = "/booking";
  };
  
  const handleToggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);

    const root = document.documentElement;
    if (newTheme === "dark") {
      root.classList.add("dark");
      document.body.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      document.body.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Loading all vehicles...');
      
      // Lấy tất cả vehicles từ API
      const response = await authAPI.getAllVehicles();
      console.log('All vehicles API Response:', response);
      
      let vehiclesData = [];
      
      // Xử lý các cấu trúc response khác nhau
      if (response && Array.isArray(response)) {
        vehiclesData = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        vehiclesData = response.data;
      } else if (response && response.data && response.data.data && Array.isArray(response.data.data)) {
        vehiclesData = response.data.data;
      } else if (response && response.data && response.data.isSuccess && Array.isArray(response.data.data)) {
        vehiclesData = response.data.data;
      } else if (response && response.data && response.data.result && Array.isArray(response.data.result)) {
        vehiclesData = response.data.result;
      } else {
        console.warn('Unexpected response structure:', response);
        // Thử tìm mảng trong response
        const findArray = (obj) => {
          if (Array.isArray(obj)) return obj;
          if (typeof obj === 'object' && obj !== null) {
            for (let key in obj) {
              if (Array.isArray(obj[key])) {
                return obj[key];
              }
            }
          }
          return null;
        };
        
        const foundArray = findArray(response);
        if (foundArray) {
          vehiclesData = foundArray;
        }
      }
      
      console.log('Extracted vehicles data:', vehiclesData);

      // Lấy thông tin user hiện tại từ JWT
      const currentUser = getCurrentUserPayload();
      console.log('Current user from JWT:', currentUser);
      
      if (vehiclesData && vehiclesData.length > 0) {
        // Lọc vehicles của user hiện tại
        const userVehicles = filterUserVehicles(vehiclesData, currentUser);
        console.log('User vehicles after filtering:', userVehicles);
        
        if (userVehicles.length > 0) {
          const vehicleTypes = {};
          userVehicles.forEach(vehicle => {
            const type = vehicle.vehicle_type || vehicle.type || vehicle.vehicleType || 'Khác';
            if (!vehicleTypes[type]) {
              vehicleTypes[type] = [];
            }
            vehicleTypes[type].push(vehicle);
          });
          
          console.log('Grouped vehicles:', vehicleTypes);
          setVehicles(vehicleTypes);
        } else {
          setError('Không có xe nào trong tài khoản của bạn');
          setVehicles({});
        }
      } else {
        setError('Không có xe nào trong hệ thống');
        setVehicles({});
      }
    } catch (err) {
      console.error('Error loading vehicles:', err);
      const errorMessage = err?.response?.data?.message || 
                          err?.message || 
                          'Lỗi khi tải danh sách phương tiện. Vui lòng thử lại sau';
      setError(errorMessage);
      setVehicles({});
    } finally {
      setLoading(false);
    }
  };

  // Hàm lọc vehicles của user hiện tại
  const filterUserVehicles = (allVehicles, currentUser) => {
    if (!currentUser || !allVehicles) return [];
    
    // Các trường có thể chứa ID của user
    const userIdentifier = currentUser.nameid || currentUser.sub || currentUser.userId || currentUser.id;
    console.log('User identifier:', userIdentifier);
    
    return allVehicles.filter(vehicle => {
      // Kiểm tra các trường có thể chứa thông tin user
      const vehicleUserId = vehicle.accountId || vehicle.userId || vehicle.AccountID || vehicle.UserID;
      console.log('Vehicle user ID:', vehicleUserId, 'for vehicle:', vehicle);
      
      return vehicleUserId === userIdentifier;
    });
  };

  const handleSelectVehicle = (vehicle) => {
  navigate('/plans', { state: { selectedVehicle: vehicle } });
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const getVehicleIcon = (type) => {
    const icons = {
      'electric_bike': '🏍️',
      'electric_scooter': '🛴',
      'electric_car': '🚗',
      'motorcycle': '🏍️',
      'bicycle': '🚲',
      'scooter': '🛴',
      'Bike': '🚲',
      'Car': '🚗'
    };
    return icons[type] || '';
  };

  // Helper to safely get vehicle properties
  const getVehicleProperty = (vehicle, property) => {
    const possibleKeys = {
      vin: ['VIN', 'vin', 'vehicleId', 'id', 'vehicleID'],
      battery: ['BatteryID', 'batteryId', 'batteryID', 'battery'],
      package: ['PackageID', 'packageId', 'packageID', 'package'],
      name: ['vehicle_name', 'name', 'vehicleName', 'model', 'vehicle_name'],
      status: ['status', 'Status', 'state'],
      type: ['vehicle_type', 'type', 'vehicleType']
    };
    
    const keys = possibleKeys[property] || [property];
    for (let key of keys) {
      if (vehicle[key] !== undefined && vehicle[key] !== null) {
        return vehicle[key];
      }
    }
    return 'N/A';
  };

  const vehicleTypes = Object.keys(vehicles);

  return (
    <div className="vehicle-page" style={{ overflowY: 'auto', maxHeight: '100vh' }}>
       {/* HeaderDriver là lớp trên cùng của màn hình */}
       <div style={{ position: 'sticky', top: 0, zIndex: 50 }}>
        <HeaderDriver
          onToggleTheme={handleToggleTheme}
          theme={theme}
          user={user}
          unreadCount={unreadCount}
          nextBooking={nextBooking}
          onOpenBooking={handleOpenBooking}
        />
      </div>
      {/* Animated Background */}
      <div className="animated-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      {/* Floating Particles */}
      <div className="particles">
        {[...Array(20)].map((_, i) => (
          <div 
            key={i} 
            className="particle" 
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`
            }}
          />
        ))}
      </div>

      <div className="vehicle-container">
        {/* Hero Section */}
        <div className="hero-section">
          <button className="back-btn" onClick={handleGoBack}>
            <span className="back-icon">←</span>
            <span>Quay lại</span>
          </button>
          
          <div className="hero-content">
            <h1 className="hero-title">
              <span className="title-line">Chọn Xe Của Bạn</span>
            </h1>
            <div className="title-underline"></div>
            <p className="hero-subtitle">
              Khám phá và quản lý phương tiện của bạn một cách thông minh
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="loading-container">
            <div className="loading-spinner">
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
            </div>
            <p className="loading-text">Đang tải xe của bạn...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="alert-box error-alert">
            <span className="alert-icon">⚠️</span>
            <span>{error}</span>
            <button 
              onClick={loadVehicles} 
              style={{
                marginLeft: 'auto',
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Debug Info - Remove in production */}
        {process.env.NODE_ENV === 'development' && !loading && (
          <div style={{ 
            background: 'rgba(0,0,0,0.1)', 
            padding: '10px', 
            margin: '10px 0', 
            borderRadius: '5px',
            fontSize: '12px',
            color: '#666'
          }}>
            <strong>Debug Info:</strong> Found {vehicleTypes.length} vehicle types with {vehicleTypes.reduce((total, type) => total + vehicles[type].length, 0)} total vehicles
          </div>
        )}

        {/* Vehicle Grid */}
        {!loading && vehicleTypes.length > 0 && (
          <div className="vehicles-wrapper">
            {vehicleTypes.map((type, idx) => (
              <div 
                key={type} 
                className="vehicle-section" 
                style={{animationDelay: `${idx * 0.1}s`}}
              >
                <div className="section-header">
                  <span className="section-icon">{getVehicleIcon(type)}</span>
                  <h2 className="section-title">
                    {type.replace('_', ' ').toUpperCase()}
                  </h2>
                  <div className="section-badge">{vehicles[type].length} xe</div>
                </div>
                
                <div className="vehicle-grid">
                  {vehicles[type].map((vehicle, vIdx) => (
                    <div 
                      key={getVehicleProperty(vehicle, 'vin')} 
                      className="vehicle-card-modern"
                      style={{animationDelay: `${(idx * 0.1) + (vIdx * 0.05)}s`}}
                    >
                      <div className="card-shine"></div>
                      <div className="card-glow"></div>
                      
                      <div className="card-header">
                        <div className="vehicle-icon-large">
                          {getVehicleIcon(getVehicleProperty(vehicle, 'type'))}
                        </div>
                        <span className={`status-badge ${getVehicleProperty(vehicle, 'status')?.toLowerCase()}`}>
                          <span className="status-dot"></span>
                          {getVehicleProperty(vehicle, 'status') === 'Active' ? 'Hoạt động' : 'Không hoạt động'}
                        </span>
                      </div>

                      <div className="card-body">
                        <h3 className="vehicle-name">{getVehicleProperty(vehicle, 'name')}</h3>
                        
                        <div className="vehicle-details">
                          <div className="detail-row">
                            <span className="detail-label">VIN</span>
                            <span className="detail-value">{getVehicleProperty(vehicle, 'vin')}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Pin</span>
                            <span className="detail-value battery-id">
                              🔋 {getVehicleProperty(vehicle, 'battery')}
                            </span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Gói hiện tại</span>
                            <span className="detail-value package-id">
                              {getVehicleProperty(vehicle, 'package') && getVehicleProperty(vehicle, 'package') !== 'N/A' ? (
                                <span className="has-package">📦 {getVehicleProperty(vehicle, 'package')}</span>
                              ) : (
                                <span className="no-package">Chưa có</span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="card-footer">
                        <button 
                          className="select-btn"
                          onClick={() => handleSelectVehicle(vehicle)}
                        >
                          <span className="btn-text">Chọn xe này</span>
                          <span className="btn-icon">→</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && vehicleTypes.length === 0 && !error && (
          <div className="empty-state">
            <div className="empty-icon">🚗</div>
            <h3 className="empty-title">Chưa có xe nào</h3>
            <p className="empty-text">Bạn chưa có phương tiện nào trong tài khoản</p>
            <button className="primary-btn" onClick={() => navigate('/plans')}>
              <span>Khám phá gói dịch vụ</span>
              <span className="btn-arrow">→</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Vehicle;