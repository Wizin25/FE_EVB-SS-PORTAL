import React, { useState, useEffect } from 'react';
import { vehicleAPI } from '../services/vehicleAPI';
import { authAPI } from '../services/authAPI';
import { useNavigate } from 'react-router-dom';
import './Package.css';

const Package = () => {
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserVehicles = async () => {
      try {
        setLoading(true);
        const response = await authAPI.getCurrentUserVehicles();
        setVehicles(response.data || []);
      } catch (err) {
        console.error('Error fetching user vehicles:', err);
        setVehicles([
          {
            VIN: 'V006',
            vehicle_name: 'Yadea_ULike',
            vehicle_type: 'electric_bike',
            BatteryID: 'B001',
            PackageID: 'P001',
            status: 'Active'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserVehicles();
  }, []);

  useEffect(() => {
    const fetchPackagesByVehicle = async () => {
      if (!selectedVehicle) return;

      try {
        setLoading(true);
        setError('');
        
        const response = await vehicleAPI.getPackageByVehicleName(selectedVehicle.vehicle_name);
        
        if (response.isSuccess) {
          setPackages(response.data || []);
        } else {
          setError('Không có gói nào phù hợp với xe này');
          setPackages([]);
        }
      } catch (err) {
        setError('Không thể tải danh sách gói cho xe này');
        console.error('Error fetching packages by vehicle:', err);
        setPackages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPackagesByVehicle();
  }, [selectedVehicle]);

  const handleVehicleChange = (e) => {
    const vehicleId = e.target.value;
    const vehicle = vehicles.find(v => v.VIN === vehicleId);
    setSelectedVehicle(vehicle || null);
    setSelectedPackage(null);
    setPackages([]);
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
      alert(`Đã chọn gói: ${selectedPackage.name} cho xe ${selectedVehicle.vehicle_name}`);
      
      const updatedVehicles = vehicles.map(v => 
        v.VIN === selectedVehicle.VIN 
          ? { ...v, PackageID: selectedPackage.packageId }
          : v
      );
      setVehicles(updatedVehicles);
      
      setSelectedPackage(null);
      setSelectedVehicle(null);
      setPackages([]);
    } catch (err) {
      setError('Mua gói thất bại');
      console.error('Error purchasing package:', err);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  if (loading && vehicles.length === 0) return <div className="loading">Đang tải thông tin xe...</div>;

  return (
    <div style={{ 
      height: '100vh',
      overflow: 'hidden',
      width: '100%',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      backgroundAttachment: 'fixed'
    }}>
      <button className="back-button" onClick={handleGoBack}>
        <span className="back-arrow">←</span>
        Quay lại
      </button>

      <div className="package-container">
        <div className="package-content">
          <h1>Chọn Gói Dịch Vụ Cho Xe Của Bạn</h1>
          
          <div className="battery-selection">
            <h2>Bước 1: Chọn Xe Của Bạn</h2>
            <select 
              value={selectedVehicle?.VIN || ''} 
              onChange={handleVehicleChange}
              className="battery-select"
            >
              <option value="">-- Chọn xe --</option>
              {vehicles.map(vehicle => (
                <option key={vehicle.VIN} value={vehicle.VIN}>
                  {vehicle.vehicle_name} - {vehicle.vehicle_type}
                  {vehicle.PackageID && ` (Đã có gói: ${vehicle.PackageID})`}
                </option>
              ))}
            </select>
            
            {selectedVehicle && (
              <div style={{ 
                marginTop: '10px', 
                padding: '15px', 
                backgroundColor: 'rgba(255, 255, 255, 0.25)', 
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
              }}>
                <strong style={{ fontSize: '1.1rem' }}>Thông tin xe:</strong>
                <div style={{ marginTop: '8px' }}>Tên: {selectedVehicle.vehicle_name}</div>
                <div>Loại: {selectedVehicle.vehicle_type}</div>
                <div>VIN: {selectedVehicle.VIN}</div>
                {selectedVehicle.PackageID && (
                  <div style={{ 
                    color: '#ffd93d', 
                    fontWeight: 'bold',
                    marginTop: '8px',
                    padding: '8px',
                    background: 'rgba(255, 217, 61, 0.2)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 217, 61, 0.4)'
                  }}>
                    Hiện tại đang sử dụng gói: {selectedVehicle.PackageID}
                  </div>
                )}
              </div>
            )}
          </div>

          {selectedVehicle && (
            <div className="package-selection">
              <h2>Bước 2: Chọn Gói Phù Hợp Với Xe {selectedVehicle.vehicle_name}</h2>
              
              {error && <div className="error">{error}</div>}
              
              {loading ? (
                <div className="loading">Đang tải gói dịch vụ...</div>
              ) : packages.length === 0 ? (
                <div className="no-packages">
                  Không có gói nào phù hợp với xe {selectedVehicle.vehicle_name}
                </div>
              ) : (
                <>
                  <div className="package-list">
                    {packages.map(pkg => (
                      <div 
                        key={pkg.packageId} 
                        className={`package-card ${selectedPackage?.packageId === pkg.packageId ? 'selected' : ''}`}
                        onClick={() => handlePackageSelect(pkg)}
                      >
                        <h3>{pkg.name || pkg.packageId}</h3>
                        <p className="price">{pkg.price?.toLocaleString('vi-VN')} VND</p>
                        <p className="duration">ID: {pkg.packageId}</p>
                        <p className="description">{pkg.description || 'Không có mô tả'}</p>
                        {pkg.batteryId && (
                          <p className="battery-info">Pin đi kèm: {pkg.batteryId}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedPackage && (
        <>
          <div className="modal-overlay" onClick={handleCloseModal}></div>
          <div className="package-detail">
            <div className="modal-header">
              <h3>Thông Tin Gói Đã Chọn</h3>
              <button className="close-modal-btn" onClick={handleCloseModal}>×</button>
            </div>
            <div className="modal-content">
              <div className="detail-content">
                <h4>{selectedPackage.name || selectedPackage.packageId}</h4>
                <p><strong>Mã gói:</strong> {selectedPackage.packageId}</p>
                <p><strong>Giá:</strong> {selectedPackage.price?.toLocaleString('vi-VN')} VND</p>
                <p><strong>Mô tả:</strong> {selectedPackage.description || 'Không có mô tả'}</p>
                
                <div className="vehicle-info-box">
                  <strong>Áp dụng cho xe:</strong> {selectedVehicle.vehicle_name}
                  <br />
                  <strong>Loại xe:</strong> {selectedVehicle.vehicle_type}
                  <br />
                  <strong>VIN:</strong> {selectedVehicle.VIN}
                </div>
                
                <button 
                  onClick={handlePackagePurchase}
                  className="purchase-btn"
                  disabled={selectedVehicle.PackageID === selectedPackage.packageId}
                >
                  {selectedVehicle.PackageID === selectedPackage.packageId 
                    ? 'Đang Sử Dụng' 
                    : `Mua Ngay - ${selectedPackage.price?.toLocaleString('vi-VN')} VND`
                  }
                </button>
                
                {selectedVehicle.PackageID === selectedPackage.packageId && (
                  <div className="current-package-indicator">
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