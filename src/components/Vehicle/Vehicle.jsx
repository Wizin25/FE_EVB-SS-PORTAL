import React, { useState, useEffect } from 'react';
import { vehicleAPI } from '../services/vehicleAPI';
import { useNavigate } from 'react-router-dom';
import { getCurrentUserPayload, isInRole } from '../services/jwt';
import './Vehicle.css';
import HeaderDriver from "../Home/header";
import Footer from "../Home/footer";

const Vehicle = () => {
  const [vehicles, setVehicles] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [vehiclePackages, setVehiclePackages] = useState({});
  const [packageLoading, setPackageLoading] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    vin: '',
    vehicleName: '',
    vehicleType: 'electric_motorbike'
  });
  
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
  
  // Danh sách các tên xe từ enum
  const vehicleNameOptions = [
    // Xe máy điện
    { value: 'YADEA_VELAX', label: 'Yadea Velax' },
    { value: 'YADEA_VOLTGUARD_U', label: 'Yadea Voltguard U' },
    { value: 'YADEA_VOLTGUARD_P', label: 'Yadea Voltguard P' },
    { value: 'YADEA_ORLA', label: 'Yadea Orla' },
    { value: 'YADEA_ORIS', label: 'Yadea Oris' },
    { value: 'YADEA_OSSY', label: 'Yadea Ossy' },
    { value: 'YADEA_OCEAN', label: 'Yadea Ocean' },
    { value: 'YADEA_ICUTE', label: 'Yadea iCute' },
    { value: 'YADEA_ODORA_S', label: 'Yadea Odora S' },
    { value: 'YADEA_ODORA_S2', label: 'Yadea Odora S2' },
    { value: 'YADEA_M6I', label: 'Yadea M6i' },
    { value: 'YADEA_VIGOR', label: 'Yadea Vigor' },
    { value: 'YADEA_X_ZONE', label: 'Yadea X-Zone' },
    { value: 'YADEA_VEKOO', label: 'Yadea Vekoo' },
    { value: 'YADEA_X_MEN_NEO', label: 'Yadea X-Men Neo' },
    { value: 'YADEA_X_SKY', label: 'Yadea X-Sky' },
    { value: 'YADEA_X_BULL', label: 'Yadea X-Bull' },
    { value: 'YADEA_VEKOO_SOOBIN', label: 'Yadea Vekoo Soobin' },
    { value: 'YADEA_VELAX_SOOBIN', label: 'Yadea Velax Soobin' },
    { value: 'YADEA_ORIS_SOOBIN', label: 'Yadea Oris Soobin' },
    // Xe đạp điện
    { value: 'YADEA_I8_VINTAGE', label: 'Yadea i8 Vintage' },
    { value: 'YADEA_I8', label: 'Yadea i8' },
    { value: 'YADEA_I6_Accumulator', label: 'Yadea i6 Accumulator' },
    { value: 'YADEA_I6_Lithium_Battery', label: 'Yadea i6 Lithium Battery' },
    { value: 'YADEA_IFUN', label: 'Yadea iFun' },
    { value: 'YADEA_IGO', label: 'Yadea iGo' },
    // Xe đạp trợ lực
    { value: 'YADEA_VITO', label: 'Yadea Vito' },
    { value: 'YADEA_FLIT', label: 'Yadea Flit' }
  ];

  // Danh sách loại xe từ enum VehicleTypeEnums
  const vehicleTypeOptions = [
    { value: 'electric_bike', label: 'Xe đạp điện' },
    { value: 'electric_motorbike', label: 'Xe máy điện' },
    { value: 'electric_assist_bicycle', label: 'Xe đạp trợ lực' }
  ];

  // Thêm vào Vehicle.jsx
const vehicleImageMapping = {
  // Xe máy điện
  'YADEA_VELAX': 'https://www.yadea.com.vn/wp-content/uploads/2025/05/Velax-Anh-nho-ben-tren.png',
  'YADEA_VOLTGUARD_U': 'https://www.yadea.com.vn/wp-content/uploads/2025/01/V002-U-anh-chinh-1-480x361.png',
  'YADEA_VOLTGUARD_P': 'https://www.yadea.com.vn/wp-content/uploads/2025/01/Anh-sp-chinh-1200x880-den.png',
  'YADEA_ORLA': 'https://www.yadea.com.vn/wp-content/uploads/2023/10/orla-black-detail.png',
  'YADEA_ORIS': 'https://www.yadea.com.vn/wp-content/uploads/2024/06/oris-xam.png',
  'YADEA_OSSY': 'https://www.yadea.com.vn/wp-content/uploads/2024/05/c.png',
  'YADEA_OCEAN': 'https://www.yadea.com.vn/wp-content/uploads/2023/11/ocean-cyan-banner-001.png',
  'YADEA_ICUTE': 'https://www.yadea.com.vn/wp-content/uploads/2023/10/icute-banner-cyan.png',
  'YADEA_ODORA_S': 'https://www.yadea.com.vn/wp-content/uploads/2023/11/odoras-xanh-banner.png',
  'YADEA_ODORA_S2': 'https://www.yadea.com.vn/wp-content/uploads/2025/09/Anh-ngang-to-1280x880px-den.png',
  'YADEA_M6I': 'https://www.yadea.com.vn/wp-content/uploads/2023/11/m6i-blue-banner.png',
  'YADEA_VIGOR': 'https://www.yadea.com.vn/wp-content/uploads/2023/11/virgo-grey-banner.png',
  'YADEA_X_ZONE': 'https://www.yadea.com.vn/wp-content/uploads/2024/08/xzone-den-ngang-1280x880-1.png',
  'YADEA_VEKOO': 'https://www.yadea.com.vn/wp-content/uploads/2025/05/Vekoo_4_Hong-anh-dao.png',
  'YADEA_X_MEN_NEO': 'https://www.yadea.com.vn/wp-content/uploads/2023/11/xmen-red-banner-1.png',
  'YADEA_X_SKY': 'https://www.yadea.com.vn/wp-content/uploads/2025/02/XSKY-Anh-ngang-chinh-1280x880px.png',
  'YADEA_X_BULL': 'https://www.yadea.com.vn/wp-content/uploads/2023/11/xbull.png',
  'YADEA_VEKOO_SOOBIN': 'https://www.yadea.com.vn/wp-content/uploads/2025/05/Vekoo_3_Xanh-lam-anh-ngoc.png',
  'YADEA_VELAX_SOOBIN': 'https://www.yadea.com.vn/wp-content/uploads/2025/05/Velax_3_Xanh-Bentley.png',
  'YADEA_ORIS_SOOBIN': 'https://www.yadea.com.vn/wp-content/uploads/2025/05/Oris_3_Hong-anh-dao.png',
  
  // Xe đạp điện
  'YADEA_I8_VINTAGE': 'https://www.yadea.com.vn/wp-content/uploads/2025/03/Anh-dau-banner-i8-gau-xanh-1280x880px.png',
  'YADEA_I8': 'https://www.yadea.com.vn/wp-content/uploads/2023/11/Anh-sp-banner-1280x880-trang-sua-i8-moi.png',
  'YADEA_I6_Accumulator': 'https://product.hstatic.net/200000859553/product/hong_cb6790de6aa84124ae1f359932b6b20c_master.png',
  'YADEA_I6_Lithium_Battery': 'https://www.yadea.com.vn/wp-content/uploads/2023/11/i6-black2.png',
  'YADEA_IFUN': 'https://www.yadea.com.vn/wp-content/uploads/2024/08/YADEA-iFUN-xanh-anh-ngang.webp',
  'YADEA_IGO': 'https://www.yadea.com.vn/wp-content/uploads/2023/11/igo-black-banner-1.png',
  
  // Xe đạp trợ lực
  'YADEA_VITO': 'https://www.yadea.com.vn/wp-content/uploads/2025/09/Anh-ngang-VITO-xanh.png',
  'YADEA_FLIT': 'https://www.yadea.com.vn/wp-content/uploads/2025/09/Anh-ngang-FLIT-trang.png'
};

// Hàm lấy ảnh xe
const getVehicleImage = (vehicleName) => {
  return vehicleImageMapping[vehicleName] || '#DEFAULT_VEHICLE_IMAGE_URL';
};

  const loadPackagesForVehicles = async (vehiclesData) => {
  try {
    setPackageLoading(true);
    const packagesMap = {};
    
    // Lặp qua từng xe để lấy gói phù hợp
    for (const vehicle of vehiclesData) {
      const vehicleName = getVehicleProperty(vehicle, 'name');
      if (vehicleName && vehicleName !== 'N/A') {
        try {
          console.log(`Loading packages for vehicle: ${vehicleName}`);
          const response = await vehicleAPI.getPackageByVehicleName(vehicleName);
          
          let packagesData = [];
          if (response && Array.isArray(response)) {
            packagesData = response;
          } else if (response && response.data && Array.isArray(response.data)) {
            packagesData = response.data;
          } else if (response && response.data && response.data.data && Array.isArray(response.data.data)) {
            packagesData = response.data.data;
          } else if (response && response.data && response.data.isSuccess && Array.isArray(response.data.data)) {
            packagesData = response.data.data;
          }
          
          packagesMap[getVehicleProperty(vehicle, 'vin')] = packagesData;
          console.log(`Packages for ${vehicleName}:`, packagesData);
        } catch (err) {
          console.error(`Error loading packages for ${vehicleName}:`, err);
          packagesMap[getVehicleProperty(vehicle, 'vin')] = [];
        }
      }
    }
    
    setVehiclePackages(packagesMap);
  } catch (err) {
    console.error('Error loading vehicle packages:', err);
  } finally {
    setPackageLoading(false);
  }
};

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
    console.log('Loading vehicles for current customer...');
    
    const response = await vehicleAPI.getCurrentUserVehicles();
    console.log('Current user vehicles API Response:', response);
    
    let vehiclesData = [];
    
    if (response && Array.isArray(response)) {
      vehiclesData = response;
    } else if (response && response.data && Array.isArray(response.data)) {
      vehiclesData = response.data;
    } else if (response && response.data && response.data.data && Array.isArray(response.data.data)) {
      vehiclesData = response.data.data;
    } else if (response && response.data && response.data.isSuccess && Array.isArray(response.data.data)) {
      vehiclesData = response.data.data;
    } else {
      console.warn('Unexpected response structure:', response);
      setError('Không thể tải danh sách xe');
      setVehicles({});
      return;
    }
    
    console.log('Extracted user vehicles data:', vehiclesData);

    if (vehiclesData && vehiclesData.length > 0) {
      // CHỈ LỌC XE ACTIVE - ẨN XE INACTIVE
      const activeVehicles = vehiclesData.filter(vehicle => 
        getVehicleProperty(vehicle, 'status')?.toLowerCase() === 'active'
      );
      
      console.log('Active user vehicles:', activeVehicles);
      
      if (activeVehicles.length > 0) {
        const vehicleTypes = {};
        activeVehicles.forEach(vehicle => {
          const type = vehicle.vehicle_type || vehicle.type || vehicle.vehicleType || 'Khác';
          if (!vehicleTypes[type]) {
            vehicleTypes[type] = [];
          }
          vehicleTypes[type].push(vehicle);
        });
        
        console.log('Grouped active vehicles:', vehicleTypes);
        setVehicles(vehicleTypes);
        
        // Load packages cho các xe
        await loadPackagesForVehicles(activeVehicles);
      } else {
        setError('Không có xe nào đang hoạt động trong tài khoản của bạn');
        setVehicles({});
      }
    } else {
      setError('Không có xe nào trong tài khoản của bạn');
      setVehicles({});
    }
  } catch (err) {
    console.error('Error loading vehicles:', err);
    if (err.response?.status === 401 || err.response?.status === 403) {
      setError('Bạn không có quyền truy cập danh sách xe');
    } else {
      const errorMessage = err?.response?.data?.message || 
                          err?.message || 
                          'Lỗi khi tải danh sách phương tiện. Vui lòng thử lại sau';
      setError(errorMessage);
    }
    setVehicles({});
  } finally {
    setLoading(false);
  }
};

  const handleCreateVehicle = async () => {
    try {
      setCreating(true);
      setError('');

      // Validate required fields
      if (!newVehicle.vin.trim()) {
        setError('Vui lòng nhập VIN');
        return;
      }
      if (!newVehicle.vehicleName.trim()) {
        setError('Vui lòng chọn tên xe');
        return;
      }

      console.log('Creating new vehicle:', newVehicle);

      // Gọi API link_vehicle với đầy đủ tham số
      const formData = new FormData();
      formData.append('VIN', newVehicle.vin);
      formData.append('VehicleName', newVehicle.vehicleName);
      formData.append('VehicleType', newVehicle.vehicleType);

      const response = await vehicleAPI.linkVehicle(formData);
      console.log('Create vehicle response:', response);

      // Đóng modal và reset form
      setShowCreateModal(false);
      setNewVehicle({
        vin: '',
        vehicleName: '',
        vehicleType: 'electric_motorbike'
      });

      // Load lại danh sách xe
      await loadVehicles();

    } catch (err) {
      console.error('Error creating vehicle:', err);
      const errorMessage = err?.response?.data?.message || 
                          err?.message || 
                          'Lỗi khi tạo xe. Vui lòng thử lại sau';
      setError(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteVehicle = async (vehicleId) => {
    try {
      if (!window.confirm('Bạn có chắc muốn xóa xe này?')) {
        return;
      }

      setLoading(true);
      setError('');
      console.log('Deleting vehicle with ID:', vehicleId);

      // Gọi API unlink_vehicle
      const formData = new FormData();
      formData.append('vehicleId', vehicleId);

      const response = await vehicleAPI.unlinkVehicle(formData);
      console.log('Delete vehicle response:', response);

      // Load lại danh sách xe
      await loadVehicles();

    } catch (err) {
      console.error('Error deleting vehicle:', err);
      const errorMessage = err?.response?.data?.message || 
                          err?.message || 
                          'Lỗi khi xóa xe. Vui lòng thử lại sau';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVehicle = (vehicle) => {
    navigate('/plans', { state: { selectedVehicle: vehicle } });
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const getVehicleIcon = (type) => {
    const icons = {
      'electric_bike': '🚲',
      'electric_scooter': '🛴',
      'electric_motorbike': '🏍️',
      'electric_assist_bicycle': '🚲',
    };
    return icons[type] || '🏍️';
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

          {/* Nút Tạo Xe - chỉ hiển thị cho EvDriver */}
          {isInRole('EvDriver') && (
            <button 
              className="create-vehicle-btn"
              onClick={() => setShowCreateModal(true)}
            >
              <span className="btn-icon">+</span>
              <span>Tạo Xe Mới</span>
            </button>
          )}
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
  <div className="vehicle-image-container">
    <img 
      src={getVehicleImage(getVehicleProperty(vehicle, 'name'))} 
      alt={getVehicleProperty(vehicle, 'name')}
      className="vehicle-image"
      onError={(e) => {
        // Fallback nếu ảnh lỗi
        e.target.style.display = 'none';
        e.target.nextSibling.style.display = 'block';
      }}
    />
    {/* Fallback emoji nếu không có ảnh */}
    <div 
      className="vehicle-icon-fallback"
      style={{display: 'none'}}
    >
      {getVehicleIcon(getVehicleProperty(vehicle, 'type'))}
    </div>
  </div>
  <div className="card-actions">
                          <span className={`status-badge ${getVehicleProperty(vehicle, 'status')?.toLowerCase()}`}>
                            <span className="status-dot"></span>
                            {getVehicleProperty(vehicle, 'status') === 'Active' ? 'Hoạt động' : 'Không hoạt động'}
                          </span>
                          {isInRole('EvDriver') && (
                            <button 
                              className="delete-vehicle-btn"
                              onClick={() => handleDeleteVehicle(getVehicleProperty(vehicle, 'vin'))}
                              title="Xóa xe"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
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
            <h3 className="empty-title">Không có xe đang hoạt động</h3>
            <p className="empty-text">
              Tất cả xe trong tài khoản của bạn đang ở trạng thái không hoạt động
            </p>
            {isInRole('EvDriver') && (
              <button className="primary-btn" onClick={() => setShowCreateModal(true)}>
                <span>Tạo xe mới</span>
                <span className="btn-arrow">→</span>
              </button>
            )}
          </div>
        )}

        {/* Modal Tạo Xe */}
        {showCreateModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Tạo Xe Mới</h2>
              
              <div className="form-group">
                <label>VIN *</label>
                <input
                  type="text"
                  value={newVehicle.vin}
                  onChange={(e) => setNewVehicle({...newVehicle, vin: e.target.value})}
                  placeholder="Nhập VIN của xe"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Tên xe *</label>
                <select
                  value={newVehicle.vehicleName}
                  onChange={(e) => setNewVehicle({...newVehicle, vehicleName: e.target.value})}
                  className="form-select"
                >
                  <option value="">Chọn tên xe</option>
                  {vehicleNameOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Loại xe *</label>
                <select 
                  value={newVehicle.vehicleType} 
                  onChange={(e) => setNewVehicle({...newVehicle, vehicleType: e.target.value})}
                  className="form-select"
                >
                  {vehicleTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button 
                  className="btn-cancel" 
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                >
                  Hủy
                </button>
                <button 
                  className="btn-confirm" 
                  onClick={handleCreateVehicle}
                  disabled={creating || !newVehicle.vin.trim() || !newVehicle.vehicleName.trim()}
                >
                  {creating ? 'Đang tạo...' : 'Tạo xe'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
       <Footer />
    </div>
  );
};

export default Vehicle;