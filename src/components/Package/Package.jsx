import React, { useState, useEffect } from 'react';
import { vehicleAPI } from '../services/vehicleAPI';
import { authAPI } from '../services/authAPI';
import { packageAPI } from '../services/packageAPI';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCurrentUserPayload } from '../services/jwt';
import './Package.css';

const Package = () => {
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Khi có vehicle từ location.state, set luôn làm selectedVehicle
  useEffect(() => {
    if (location.state?.selectedVehicle) {
      setSelectedVehicle(location.state.selectedVehicle);
    }
  }, [location.state]);

  useEffect(() => {
    const fetchUserVehicles = async () => {
      try {
        setLoading(true);
        
        // Chỉ fetch vehicles nếu chưa có selectedVehicle
        if (!selectedVehicle) {
          console.log('Fetching all vehicles...');
          const response = await vehicleAPI.getAllVehicles();
          console.log('All vehicles API Response:', response);
          
          let allVehicles = [];
          
          // Xử lý các cấu trúc response khác nhau
          if (response && Array.isArray(response)) {
            allVehicles = response;
          } else if (response && response.data && Array.isArray(response.data)) {
            allVehicles = response.data;
          } else if (response && response.data && response.data.data && Array.isArray(response.data.data)) {
            allVehicles = response.data.data;
          } else if (response && response.data && response.data.isSuccess && Array.isArray(response.data.data)) {
            allVehicles = response.data.data;
          } else {
            console.warn('Unexpected response structure:', response);
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
              allVehicles = foundArray;
            }
          }
          
          console.log('All vehicles extracted:', allVehicles);

          // Lọc vehicles của user hiện tại
          const currentUser = getCurrentUserPayload();
          const userVehicles = filterUserVehicles(allVehicles, currentUser);
          console.log('User vehicles after filtering:', userVehicles);
          
          setVehicles(userVehicles);
        }
      } catch (err) {
        console.error('Error fetching user vehicles:', err);
        setError('Lỗi khi tải danh sách xe: ' + (err.message || 'Vui lòng thử lại sau'));
      } finally {
        setLoading(false);
      }
    };

    fetchUserVehicles();
  }, [selectedVehicle]); // Chỉ fetch khi selectedVehicle thay đổi

  // Hàm lọc vehicles của user hiện tại
  const filterUserVehicles = (allVehicles, currentUser) => {
    if (!currentUser || !allVehicles) return [];
    
    const userIdentifier = currentUser.nameid || currentUser.sub || currentUser.userId || currentUser.id;
    console.log('User identifier for filtering:', userIdentifier);
    
    return allVehicles.filter(vehicle => {
      const vehicleUserId = vehicle.accountId || vehicle.AccountID || vehicle.userId || vehicle.UserID;
      console.log('Vehicle user ID:', vehicleUserId, 'for vehicle:', vehicle);
      
      return vehicleUserId === userIdentifier;
    });
  };

  // Helper để lấy property từ vehicle một cách an toàn
  const getVehicleProperty = (vehicle, property) => {
    const possibleKeys = {
      vin: ['VIN', 'vin', 'vehicleId', 'id', 'vehicleID'],
      battery: ['BatteryID', 'batteryId', 'batteryID', 'battery'],
      package: ['PackageID', 'packageId', 'packageID', 'package'],
      name: ['vehicle_name', 'name', 'vehicleName', 'model'],
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

  const fetchPackageById = async (packageId) => {
    try {
      setLoading(true);
      const response = await packageAPI.getPackageById(packageId);
      console.log('Package by ID response:', response);
      
      let packageData = null;
      
      // Xử lý các cấu trúc response khác nhau
      if (response && response.data) {
        packageData = response.data;
      } else if (response && response.isSuccess && response.data) {
        packageData = response.data;
      } else if (Array.isArray(response) && response.length > 0) {
        packageData = response[0];
      }
      
      return packageData;
    } catch (err) {
      console.error('Error fetching package by ID:', err);
      setError('Không thể tải thông tin gói: ' + (err.message || 'Vui lòng thử lại sau'));
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Hàm lọc package phù hợp với vehicle
  const filterPackagesForVehicle = (allPackages, vehicle) => {
    if (!vehicle || !allPackages || allPackages.length === 0) return [];

    const vehicleBatteryId = getVehicleProperty(vehicle, 'battery');
    const vehiclePackageId = getVehicleProperty(vehicle, 'package');
    
    console.log('Filtering packages for vehicle:', {
      vehicleName: getVehicleProperty(vehicle, 'name'),
      batteryId: vehicleBatteryId,
      currentPackageId: vehiclePackageId
    });

    // Lọc packages phù hợp dựa trên BatteryID hoặc PackageID
    const compatiblePackages = allPackages.filter(pkg => {
      const packageId = getPackageProperty(pkg, 'id');
      const packageBatteryId = getPackageProperty(pkg, 'battery');
      
      // Nếu xe đã có package, hiển thị package đó
      if (vehiclePackageId && vehiclePackageId !== 'N/A' && packageId === vehiclePackageId) {
        return true;
      }
      
      // Nếu package có BatteryID phù hợp với xe
      if (vehicleBatteryId && vehicleBatteryId !== 'N/A' && packageBatteryId === vehicleBatteryId) {
        return true;
      }
      
      return false;
    });

    console.log('Compatible packages found:', compatiblePackages.length);
    return compatiblePackages;
  };

  useEffect(() => {
    const fetchAndFilterPackages = async () => {
      if (!selectedVehicle) {
        setPackages([]);
        return;
      }

      try {
        setLoading(true);
        setError('');
        
        // Lấy tất cả packages
        const allPackagesResponse = await packageAPI.getAllPackages();
        console.log('All packages response:', allPackagesResponse);
        
        let allPackages = [];
        
        // Xử lý response structure
        if (allPackagesResponse && Array.isArray(allPackagesResponse)) {
          allPackages = allPackagesResponse;
        } else if (allPackagesResponse && allPackagesResponse.data && Array.isArray(allPackagesResponse.data)) {
          allPackages = allPackagesResponse.data;
        } else if (allPackagesResponse && allPackagesResponse.data && allPackagesResponse.data.data && Array.isArray(allPackagesResponse.data.data)) {
          allPackages = allPackagesResponse.data.data;
        } else if (allPackagesResponse && allPackagesResponse.data && allPackagesResponse.data.isSuccess && Array.isArray(allPackagesResponse.data.data)) {
          allPackages = allPackagesResponse.data.data;
        }
        
        if (allPackages.length > 0) {
          // Lọc packages phù hợp với vehicle
          const compatiblePackages = filterPackagesForVehicle(allPackages, selectedVehicle);
          setPackages(compatiblePackages);
          
          if (compatiblePackages.length === 0) {
            setError('Không có gói nào phù hợp với xe này');
          }
        } else {
          setError('Không có gói dịch vụ nào');
          setPackages([]);
        }
      } catch (err) {
        console.error('Error fetching packages:', err);
        setError('Không thể tải danh sách gói dịch vụ');
        setPackages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAndFilterPackages();
  }, [selectedVehicle]);

  const handleVehicleChange = (e) => {
    const vehicleId = e.target.value;
    if (vehicleId === "") {
      setSelectedVehicle(null);
      setSelectedPackage(null);
      setPackages([]);
      return;
    }
    
    const vehicle = vehicles.find(v => getVehicleProperty(v, 'vin') === vehicleId);
    setSelectedVehicle(vehicle || null);
    setSelectedPackage(null);
  };

  const handlePackageSelect = (pkg) => {
    setSelectedPackage(pkg);
  };

  const handleCloseModal = () => {
    setSelectedPackage(null);
  };

  const handlePackagePurchase = async () => {
    if (!selectedPackage || !selectedVehicle) return;

    try {
      const packageDisplayName = getPackageDisplayName(selectedPackage);
      const confirmPurchase = window.confirm(
        `Bạn có chắc muốn mua gói "${packageDisplayName}" với giá ${getPackageProperty(selectedPackage, 'price')?.toLocaleString('vi-VN')} VND cho xe ${getVehicleProperty(selectedVehicle, 'name')}?`
      );
      
      if (confirmPurchase) {
        // Gọi API để thêm vehicle vào package
        const requestData = {
          vehicleId: getVehicleProperty(selectedVehicle, 'vin'),
          packageId: getPackageProperty(selectedPackage, 'id')
        };
        
        const response = await vehicleAPI.addVehicleInPackage(requestData);
        console.log('Purchase response:', response);
        
        alert(`Đã mua thành công gói: ${packageDisplayName} cho xe ${getVehicleProperty(selectedVehicle, 'name')}`);
        
        // Cập nhật local state
        const updatedVehicles = vehicles.map(v => 
          getVehicleProperty(v, 'vin') === getVehicleProperty(selectedVehicle, 'vin') 
            ? { ...v, PackageID: getPackageProperty(selectedPackage, 'id') }
            : v
        );
        setVehicles(updatedVehicles);
        setSelectedVehicle(updatedVehicles.find(v => 
          getVehicleProperty(v, 'vin') === getVehicleProperty(selectedVehicle, 'vin')
        ));
        
        setSelectedPackage(null);
      }
    } catch (err) {
      console.error('Error purchasing package:', err);
      setError('Mua gói thất bại: ' + (err.message || err));
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  // Helper để lấy property từ package một cách an toàn
  const getPackageProperty = (pkg, property) => {
    const possibleKeys = {
      id: ['packageId', 'id', 'packageID', 'PackageID'],
      name: ['name', 'packageName', 'title'],
      price: ['price', 'cost', 'amount'],
      duration: ['duration', 'period', 'validity'],
      description: ['description', 'desc', 'details'],
      battery: ['batteryId', 'batteryID', 'battery']
    };
    
    const keys = possibleKeys[property] || [property];
    for (let key of keys) {
      if (pkg[key] !== undefined && pkg[key] !== null) {
        return pkg[key];
      }
    }
    return property === 'price' ? 0 : 'N/A';
  };

  // Helper để hiển thị tên package (ưu tiên PackageID nếu name là N/A)
  const getPackageDisplayName = (pkg) => {
    const name = getPackageProperty(pkg, 'name');
    const packageId = getPackageProperty(pkg, 'id');
    return name !== 'N/A' ? name : `Package ${packageId}`;
  };

  const handleRefreshPackage = async (packageId) => {
    if (!packageId) return;
    
    const updatedPackage = await fetchPackageById(packageId);
    if (updatedPackage) {
      // Cập nhật package trong danh sách
      const updatedPackages = packages.map(pkg => 
        getPackageProperty(pkg, 'id') === packageId ? updatedPackage : pkg
      );
      setPackages(updatedPackages);
      
      // Cập nhật selected package nếu đang xem
      if (selectedPackage && getPackageProperty(selectedPackage, 'id') === packageId) {
        setSelectedPackage(updatedPackage);
      }
      
      alert('Đã cập nhật thông tin gói');
    }
  };

  // Hàm chọn xe khác
  const handleSelectDifferentVehicle = () => {
    setSelectedVehicle(null);
    setSelectedPackage(null);
    setPackages([]);
  };

  if (loading && vehicles.length === 0 && !selectedVehicle) {
    return (
      <div className="package-page" style={{ overflowY: 'auto', maxHeight: '100vh' }}>
        <div className="package-animated-bg">
          <div className="package-gradient-orb package-orb-1"></div>
          <div className="package-gradient-orb package-orb-2"></div>
          <div className="package-gradient-orb package-orb-3"></div>
        </div>
        <div className="package-loading">Đang tải thông tin xe...</div>
      </div>
    );
  }

  return (
    <div className="package-page" style={{ overflowY: 'auto', maxHeight: '100vh' }}>
      {/* Animated Background */}
      <div className="package-animated-bg">
        <div className="package-gradient-orb package-orb-1"></div>
        <div className="package-gradient-orb package-orb-2"></div>
        <div className="package-gradient-orb package-orb-3"></div>
      </div>

      {/* Floating Particles */}
      <div className="package-particles">
        {[...Array(20)].map((_, i) => (
          <div 
            key={i} 
            className="package-particle" 
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`
            }}
          />
        ))}
      </div>

      <div className="package-container">
        <div className="package-content">
          {/* Hero Section */}
          <div className="package-hero">
            <button className="package-back-btn" onClick={handleGoBack}>
              <span className="package-back-icon">←</span>
              <span>Quay lại</span>
            </button>
            
            <div>
              <h1 className="package-title">
                <span className="package-title-line">Chọn Gói Dịch Vụ</span>
              </h1>
              <div className="package-title-underline"></div>
            </div>
          </div>

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
              <strong>Debug Info:</strong> {vehicles.length} vehicles loaded, {packages.length} packages available
            </div>
          )}

          {/* Vehicle Selection - CHỈ HIỆN KHI CHƯA CÓ XE ĐƯỢC CHỌN */}
          {!selectedVehicle && (
            <div className="vehicle-selection-section">
              <h2 className="section-title">
                <span className="section-icon">🚗</span>
                Bước 1: Chọn Xe Của Bạn
              </h2>
              <select 
                value={selectedVehicle ? getVehicleProperty(selectedVehicle, 'vin') : ''} 
                onChange={handleVehicleChange}
                className="vehicle-select"
              >
                <option value="">-- Chọn xe --</option>
                {vehicles.map(vehicle => (
                  <option key={getVehicleProperty(vehicle, 'vin')} value={getVehicleProperty(vehicle, 'vin')}>
                    {getVehicleProperty(vehicle, 'name')} - {getVehicleProperty(vehicle, 'type')}
                    {getVehicleProperty(vehicle, 'package') && getVehicleProperty(vehicle, 'package') !== 'N/A' && 
                      ` (Đang dùng: ${getVehicleProperty(vehicle, 'package')})`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Vehicle Info - HIỆN KHI ĐÃ CÓ XE ĐƯỢC CHỌN */}
          {selectedVehicle && (
            <div className="vehicle-info-section">
              <div className="vehicle-info-header">
                <h2 className="section-title">
                  <span className="section-icon">🚗</span>
                  Thông Tin Xe Đã Chọn
                </h2>
                <button 
                  className="change-vehicle-btn"
                  onClick={handleSelectDifferentVehicle}
                >
                  Chọn xe khác
                </button>
              </div>
              
              <div className="vehicle-info-box">
                <div className="vehicle-info-content">
                  <div className="vehicle-main-info">
                    <div className="vehicle-icon-large">
                      {getVehicleProperty(selectedVehicle, 'type') === 'electric_bike' ? '🏍️' : 
                       getVehicleProperty(selectedVehicle, 'type') === 'electric_scooter' ? '🛴' : 
                       getVehicleProperty(selectedVehicle, 'type') === 'electric_car' ? '🚗' : '🚲'}
                    </div>
                    <div className="vehicle-details">
                      <h3>{getVehicleProperty(selectedVehicle, 'name')}</h3>
                      <div className="vehicle-specs">
                        <span className="vehicle-type">{getVehicleProperty(selectedVehicle, 'type')}</span>
                        <span className="vehicle-vin">VIN: {getVehicleProperty(selectedVehicle, 'vin')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="vehicle-additional-info">
                    <div className="info-item">
                      <span className="info-label">🔋 Pin:</span>
                      <span className="info-value">{getVehicleProperty(selectedVehicle, 'battery')}</span>
                    </div>
                    {getVehicleProperty(selectedVehicle, 'package') && getVehicleProperty(selectedVehicle, 'package') !== 'N/A' && (
                      <div className="current-package-badge">
                        ⭐ Đang sử dụng gói: {getVehicleProperty(selectedVehicle, 'package')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Package Selection */}
          {selectedVehicle ? (
            <div className="package-selection-section">
              <h2 className="section-title">
                <span className="section-icon">📦</span>
                {selectedVehicle ? 'Chọn Gói Phù Hợp' : 'Bước 2: Chọn Gói Phù Hợp'}
              </h2>
              
              {error && (
                <div className="package-error">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}
              
              {loading ? (
                <div className="package-loading">Đang tải gói dịch vụ...</div>
              ) : packages.length === 0 ? (
                <div className="package-empty-state">
                  <div className="package-empty-icon">📦</div>
                  <h3 className="package-empty-title">Không có gói nào</h3>
                  <p className="package-empty-text">
                    Không có gói nào phù hợp với xe {getVehicleProperty(selectedVehicle, 'name')}
                  </p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="package-empty-btn"
                  >
                    🔄 Tải lại
                  </button>
                </div>
              ) : (
                <>
                  <div className="package-grid">
                    {packages.map((pkg, idx) => {
                      const packageDisplayName = getPackageDisplayName(pkg);
                      const packageId = getPackageProperty(pkg, 'id');
                      
                      return (
                        <div 
                          key={packageId} 
                          className={`package-card ${selectedPackage && getPackageProperty(selectedPackage, 'id') === packageId ? 'selected' : ''}`}
                          onClick={() => handlePackageSelect(pkg)}
                          style={{animationDelay: `${idx * 0.1}s`}}
                        >
                          <h3>{packageDisplayName}</h3>
                          <p className="package-price">{getPackageProperty(pkg, 'price')?.toLocaleString('vi-VN')} VND</p>
                          <p className="package-duration">⏱️ {getPackageProperty(pkg, 'duration') || '30 ngày'}</p>
                          <p className="package-description">{getPackageProperty(pkg, 'description') || 'Không có mô tả'}</p>
                          {getPackageProperty(pkg, 'battery') && getPackageProperty(pkg, 'battery') !== 'N/A' && (
                            <div className="package-battery-info">
                              🔋 Pin đi kèm: {getPackageProperty(pkg, 'battery')}
                            </div>
                          )}
                          {getVehicleProperty(selectedVehicle, 'package') === packageId && (
                            <div className="package-status-badge">
                              ✓ ĐANG SỬ DỤNG
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="package-hint">
                    💡 Nhấn vào gói để xem chi tiết và đăng ký
                  </div>
                </>
              )}
            </div>
          ) : (
            // Hiển thị khi chưa chọn xe
            <div className="package-selection-section">
              <h2 className="section-title">
                <span className="section-icon">📦</span>
                Bước 2: Chọn Gói Dịch Vụ
              </h2>
              <div className="package-empty-state">
                <div className="package-empty-icon">🚗</div>
                <h3 className="package-empty-title">
                  Vui lòng chọn xe để xem các gói dịch vụ
                </h3>
                {vehicles.length === 0 ? (
                  <button 
                    onClick={() => navigate('/vehicles')}
                    className="package-empty-btn"
                  >
                    ➕ Thêm xe mới
                  </button>
                ) : (
                  <p className="package-empty-text" style={{ fontStyle: 'italic', opacity: 0.7 }}>
                    Chọn xe từ dropdown "Chọn xe" ở trên
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {selectedPackage && (
        <>
          <div className="package-modal-overlay" onClick={handleCloseModal}></div>
          <div className="package-detail-modal">
            <div className="package-modal-header">
              <h3>Thông Tin Gói Dịch Vụ</h3>
              <div>
                <button 
                  className="package-refresh-btn"
                  onClick={() => handleRefreshPackage(getPackageProperty(selectedPackage, 'id'))}
                  title="Làm mới thông tin"
                >
                  🔄
                </button>
                <button className="package-close-btn" onClick={handleCloseModal}>×</button>
              </div>
            </div>
            <div className="package-modal-content">
              <div className="package-detail-info">
                <h4>{getPackageDisplayName(selectedPackage)}</h4>
                <p><strong>Mã gói:</strong> {getPackageProperty(selectedPackage, 'id')}</p>
                <p><strong>Giá:</strong> {getPackageProperty(selectedPackage, 'price')?.toLocaleString('vi-VN')} VND</p>
                <p><strong>Thời hạn:</strong> {getPackageProperty(selectedPackage, 'duration') || '30 ngày'}</p>
                <p><strong>Mô tả:</strong> {getPackageProperty(selectedPackage, 'description') || 'Không có mô tả'}</p>
                
                <div className="vehicle-info-box">
                  <strong>Áp dụng cho xe:</strong> {getVehicleProperty(selectedVehicle, 'name')}
                  <br />
                  <strong>Loại xe:</strong> {getVehicleProperty(selectedVehicle, 'type')}
                  <br />
                  <strong>VIN:</strong> {getVehicleProperty(selectedVehicle, 'vin')}
                </div>
                
                <button 
                  onClick={handlePackagePurchase}
                  className="package-purchase-btn"
                  disabled={getVehicleProperty(selectedVehicle, 'package') === getPackageProperty(selectedPackage, 'id')}
                >
                  {getVehicleProperty(selectedVehicle, 'package') === getPackageProperty(selectedPackage, 'id') 
                    ? 'ĐANG SỬ DỤNG' 
                    : `ĐĂNG KÝ NGAY - ${getPackageProperty(selectedPackage, 'price')?.toLocaleString('vi-VN')} VND`
                  }
                </button>
                
                {getVehicleProperty(selectedVehicle, 'package') === getPackageProperty(selectedPackage, 'id') && (
                  <div className="package-current-indicator">
                    <span>✓</span> Bạn đang sử dụng gói này
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Package;