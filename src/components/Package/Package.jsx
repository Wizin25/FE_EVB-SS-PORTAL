import React, { useState, useEffect } from 'react';
import { vehicleAPI } from '../services/vehicleAPI';
import { packageAPI } from '../services/packageAPI';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCurrentUserPayload } from '../services/jwt';
import './Package.css';
import HeaderDriver from "../Home/header";
import Footer from "../Home/footer";

const Package = () => {
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [batterySpecification, setBatterySpecification] = useState(null);
  const [packagesCache, setPackagesCache] = useState({});
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [nextBooking, setNextBooking] = useState(null);
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") || "light";
    }
    return "light";
  });

  // 🔧 HELPER FUNCTIONS
  const getVehicleProperty = (vehicle, property) => {
    if (!vehicle) return 'N/A';
    
    const possibleKeys = {
      vin: ['VIN', 'vin', 'Vin', 'vehicleId', 'id', 'vehicleID', 'VehicleID'],
      battery: ['BatteryID', 'batteryId', 'batteryID', 'battery', 'BatteryId'],
      batteryName: ['BatteryName', 'batteryName', 'battery_name', 'Battery_Name'],
      package: ['PackageID', 'packageId', 'packageID', 'package', 'PackageId'],
      name: ['vehicle_name', 'name', 'vehicleName', 'model', 'VehicleName'],
      status: ['status', 'Status', 'state'],
      type: ['vehicle_type', 'type', 'vehicleType', 'VehicleType'],
      id: ['vehicleId', 'id', 'vehicleID', 'VehicleID', 'VIN', 'vin'],
      specification: ['specification', 'Specification', 'batterySpecification']
    };
    
    const keys = possibleKeys[property] || [property];
    
    for (let key of keys) {
      if (vehicle[key] !== undefined && vehicle[key] !== null && vehicle[key] !== '') {
        return vehicle[key];
      }
    }
    
    return 'N/A';
  };

  const getPackageProperty = (pkg, property) => {
    const possibleKeys = {
      id: ['packageId', 'id', 'packageID', 'PackageID', 'PackageId'],
      name: ['packName', 'name', 'packageName', 'title', 'PackageName'],
      price: ['price', 'cost', 'amount', 'Price'],
      duration: ['duration', 'period', 'validity', 'Duration'],
      description: ['description', 'desc', 'details', 'Description'],
      battery: ['batteryId', 'batteryID', 'battery', 'BatteryId', 'BatteryID'],
      status: ['status', 'Status']
    };
    
    const keys = possibleKeys[property] || [property];
    for (let key of keys) {
      if (pkg[key] !== undefined && pkg[key] !== null && pkg[key] !== '') {
        return pkg[key];
      }
    }
    return property === 'price' ? 0 : 'N/A';
  };

  const getPackageDisplayName = (pkg) => {
    const name = getPackageProperty(pkg, 'name');
    const packageId = getPackageProperty(pkg, 'id');
    return name !== 'N/A' ? name : `Package ${packageId}`;
  };

  const isPackageDecommissioned = (pkg) => {
    const status = getPackageProperty(pkg, 'status');
    return status === 'Decommissioned' || status === 'decommissioned' || status === 'Inactive';
  };

  const isPackageUsedByVehicle = (pkg) => {
    if (!selectedVehicle || !pkg) return false;
    
    const vehiclePackageId = getVehicleProperty(selectedVehicle, 'package');
    const packageId = getPackageProperty(pkg, 'id');
    
    console.log('Package usage check:', {
      vehiclePackageId,
      packageId,
      isSame: vehiclePackageId === packageId
    });
    
    return vehiclePackageId === packageId;
  };

  // 🎯 CORE FUNCTION: Extract packages from different API response structures
  const extractPackagesFromResponse = (response) => {
    if (!response) return [];
    
    // Case 1: Direct array
    if (Array.isArray(response)) {
      return response;
    }
    
    // Case 2: Response với data array
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    }
    
    // Case 3: Response với data.data array
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    // Case 4: Response với isSuccess và data array
    if (response.data && response.data.isSuccess && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    // Case 5: Tìm array trong object (deep search)
    const findArrayInObject = (obj) => {
      if (Array.isArray(obj)) return obj;
      if (typeof obj === 'object' && obj !== null) {
        for (let key in obj) {
          if (Array.isArray(obj[key])) {
            return obj[key];
          }
          if (typeof obj[key] === 'object') {
            const found = findArrayInObject(obj[key]);
            if (found) return found;
          }
        }
      }
      return null;
    };
    
    const foundArray = findArrayInObject(response);
    return foundArray || [];
  };

  // 🎯 CORE FUNCTION: Filter packages by specification (fallback logic)
  const filterPackagesBySpecification = (allPackages, specification) => {
    if (!specification || !allPackages.length) return allPackages;
    
    // Mapping logic giữa battery specification và packages
    const specMapping = {
      'V48_Ah12': ['Cơ Bản', 'Tiết Kiệm', 'Basic', 'Standard'],
      'V72_Ah38': ['Cao Cấp', 'Doanh Nghiệp', 'Premium', 'Enterprise'],
      'V60_Ah22': ['Tiêu Chuẩn', 'Phổ Thông', 'Standard', 'Regular'],
      'V72_Ah50': ['Cao Cấp', 'Premium', 'Pro'],
      'V48_Ah22': ['Tiêu Chuẩn', 'Standard'],
      'V72_Ah30': ['Trung Bình', 'Medium'],
      'V36_Ah10_4': ['Cơ Bản', 'Basic'],
      'V36_Ah7_8': ['Cơ Bản', 'Basic']
    };
    
    const packageNamesForSpec = specMapping[specification] || [];
    
    return allPackages.filter(pkg => {
      // Nếu không có mapping, trả về tất cả
      if (packageNamesForSpec.length === 0) return true;
      
      const packageName = getPackageProperty(pkg, 'name').toLowerCase();
      const packageDesc = getPackageProperty(pkg, 'description').toLowerCase();
      
      // Check nếu package name hoặc description chứa từ khóa
      return packageNamesForSpec.some(name => 
        packageName.includes(name.toLowerCase()) || 
        packageDesc.includes(name.toLowerCase())
      );
    });
  };

  // 🎯 CORE FUNCTION: Get battery specification from vehicle
  const getVehicleBatterySpecification = async (vehicle) => {
  try {
    const vehicleId = getVehicleProperty(vehicle, 'vin');
    
    if (!vehicleId || vehicleId === 'N/A') {
      console.warn('⚠️ Vehicle ID not found');
      return null;
    }

    console.log('🔋 Fetching battery for vehicle:', vehicleId);
    
    // BƯỚC 1: Gọi API để lấy battery của vehicle
    const batteryResponse = await vehicleAPI.getBatteryByVehicleId(vehicleId);
    
    // Extract battery data từ response
    let batteryData = null;
    if (batteryResponse && batteryResponse.data) {
      batteryData = batteryResponse.data;
    } else if (batteryResponse && batteryResponse.isSuccess) {
      batteryData = batteryResponse.data;
    } else {
      batteryData = batteryResponse;
    }

    console.log('📦 Battery response:', batteryData);

    if (!batteryData) {
      console.warn('❌ No battery data found for vehicle');
      return null;
    }

    // BƯỚC 2: Lấy specification từ battery
    const specification = batteryData.specification || 
                         batteryData.Specification || 
                         batteryData.batterySpecification;

    if (!specification) {
      console.warn('❌ No specification found in battery data:', batteryData);
      return null;
    }

    console.log('✅ Found battery specification:', specification);
    return specification;

  } catch (error) {
    console.error('💥 Error getting battery specification:', error);
    
    // Fallback: Thử lấy specification từ vehicle data trực tiếp
    try {
      const directSpec = getVehicleProperty(vehicle, 'specification');
      if (directSpec && directSpec !== 'N/A') {
        console.log('🔄 Using fallback specification from vehicle:', directSpec);
        return directSpec;
      }
    } catch (fallbackError) {
      console.error('💥 Fallback also failed:', fallbackError);
    }
    
    return null;
  }
};

  // 🎯 MAIN FUNCTION: Load packages với multi-fallback strategy
  const loadPackagesForSelectedVehicle = async (forceRefresh = false) => {
  if (!selectedVehicle) {
    setPackages([]);
    setBatterySpecification(null);
    return;
  }

  try {
    setLoading(true);
    setError('');
    
    // BƯỚC 1: Lấy battery specification từ vehicle
    const specification = await getVehicleBatterySpecification(selectedVehicle);
    
    if (!specification) {
      setError('Không thể xác định thông số kỹ thuật pin của xe. Vui lòng kiểm tra thông tin xe.');
      setPackages([]);
      setBatterySpecification(null);
      return;
    }

    console.log('🔄 Loading packages for battery specification:', specification);
    setBatterySpecification(specification);

    // Kiểm tra cache trước
    const cacheKey = `${specification}_${getVehicleProperty(selectedVehicle, 'vin')}`;
    if (packagesCache[cacheKey] && !forceRefresh) {
      console.log('📦 Using cached packages');
      setPackages(packagesCache[cacheKey]);
      setLoading(false);
      return;
    }

    let packagesData = [];
    let apiSource = 'unknown';
    
    // BƯỚC 2: SỬ DỤNG FLOW MỚI - Dùng battery specification để lấy package
    try {
      console.log('🔍 Using NEW FLOW: get_package_by_battery_type with:', specification);
      const batteryTypeResponse = await packageAPI.getPackageByBatteryType(specification);
      packagesData = extractPackagesFromResponse(batteryTypeResponse);
      apiSource = 'battery_specification';
      console.log('✅ Packages from battery specification API:', packagesData.length);
    } catch (batteryTypeError) {
      console.warn('❌ Battery specification API failed, trying fallbacks...', batteryTypeError);
      
      // Fallback đến các method cũ nếu cần
      try {
        const vehicleName = getVehicleProperty(selectedVehicle, 'name');
        if (vehicleName && vehicleName !== 'N/A') {
          console.log('🔍 Trying vehicle name fallback...', vehicleName);
          const vehicleNameResponse = await vehicleAPI.getPackageByVehicleName(vehicleName);
          packagesData = extractPackagesFromResponse(vehicleNameResponse);
          apiSource = 'vehicle_name_fallback';
        }
      } catch (fallbackError) {
        console.warn('❌ All API methods failed, using empty list');
        packagesData = [];
      }
    }

    console.log(`📊 Final packages from ${apiSource}:`, packagesData);

    // BƯỚC 3: Thêm package hiện tại của vehicle (nếu có)
    const currentPackageId = getVehicleProperty(selectedVehicle, 'package');
    let currentPackage = null;
    
    if (currentPackageId && currentPackageId !== 'N/A') {
      try {
        console.log('🔍 Fetching current package details:', currentPackageId);
        const currentPackageResponse = await packageAPI.getPackageById(currentPackageId);
        if (currentPackageResponse && currentPackageResponse.data) {
          currentPackage = currentPackageResponse.data;
          // Đảm bảo package hiện tại có trong danh sách
          if (!packagesData.some(pkg => getPackageProperty(pkg, 'id') === currentPackageId)) {
            packagesData.push(currentPackage);
            console.log('✅ Added current package to list');
          }
        }
      } catch (err) {
        console.warn('⚠️ Cannot fetch current package details:', err);
      }
    }

    // BƯỚC 4: Lọc packages active và hiển thị
    const activePackages = packagesData.filter(pkg => 
      !isPackageDecommissioned(pkg) || getPackageProperty(pkg, 'id') === currentPackageId
    );
    
    // Cache kết quả
    setPackagesCache(prev => ({
      ...prev,
      [cacheKey]: activePackages
    }));
    
    setPackages(activePackages);
    
    if (activePackages.length === 0) {
      setError(`Không có gói nào phù hợp với loại pin ${formatBatterySpecification(specification)} của xe này`);
    } else {
      console.log(`🎯 Displaying ${activePackages.length} active packages for battery spec: ${specification}`);
    }

  } catch (err) {
    console.error('💥 Error loading packages:', err);
    setError('Không thể tải danh sách gói dịch vụ: ' + (err.message || 'Vui lòng thử lại sau'));
    setPackages([]);
  } finally {
    setLoading(false);
  }
};

  // 🔄 FORMATTING FUNCTIONS
  const formatBatterySpecification = (spec) => {
    if (!spec) return 'Đang tải...';
    
    const specMap = {
      'V48_Ah13': '48V-13Ah',
      'V60_Ah22': '60V-22Ah', 
      'V72_Ah38': '72V-38Ah',
      'V72_Ah50': '72V-50Ah',
      'V48_Ah22': '48V-22Ah',
      'V72_Ah30': '72V-30Ah',
      'V72_Ah22': '72V-22Ah',
      'V60_Ah20': '60V-20Ah',
      'V48_Ah12': '48V-12Ah',
      'V36_Ah10_4': '36V-10.4Ah',
      'V36_Ah7_8': '36V-7.8Ah'
    };
    
    return specMap[spec] || spec;
  };

  // 🎯 EVENT HANDLERS
  const handleVehicleChange = (e) => {
    const vehicleId = e.target.value;
    if (vehicleId === "") {
      setSelectedVehicle(null);
      setSelectedPackage(null);
      setPackages([]);
      setBatterySpecification(null);
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

  const handleRemovePackage = async () => {
    if (!selectedVehicle) return;

    try {
      setActionLoading(true);
      setError('');

      const packageDisplayName = getPackageDisplayName(selectedPackage);
      const vehicleName = getVehicleProperty(selectedVehicle, 'name');
      
      const confirmRemove = window.confirm(
        `Bạn có chắc muốn bỏ chọn gói "${packageDisplayName}" khỏi xe ${vehicleName}?`
      );
      
      if (!confirmRemove) {
        setActionLoading(false);
        return;
      }

      const vehicleId = getVehicleProperty(selectedVehicle, 'vin');
      
      console.log('🗑️ Removing package - Vehicle ID:', vehicleId);

      if (!vehicleId || vehicleId === 'N/A') {
        throw new Error('Không tìm thấy mã vehicleId của xe.');
      }

      const response = await vehicleAPI.deleteVehicleInPackage({
        vehicleId: vehicleId
      });
      
      console.log('Remove package API response:', response);
      
      const isSuccess = response?.isSuccess || 
                       response?.data?.isSuccess || 
                       response?.status === 200 || 
                       (response?.message && response.message.toLowerCase().includes('success'));

      if (isSuccess) {
        alert(`✅ Đã bỏ chọn gói thành công khỏi xe ${vehicleName}`);
        
        // Update local state
        const updatedVehicles = vehicles.map(v => {
          const currentVehicleId = getVehicleProperty(v, 'vin');
          if (currentVehicleId === vehicleId) {
            return { 
              ...v, 
              PackageID: null, 
              packageId: null, 
              PackageId: null,
              package: null
            };
          }
          return v;
        });
        
        setVehicles(updatedVehicles);
        setSelectedVehicle(updatedVehicles.find(v => 
          getVehicleProperty(v, 'vin') === vehicleId
        ));
        
        setSelectedPackage(null);
        await loadPackagesForSelectedVehicle(true); // Force refresh
        
      } else {
        const errorMessage = response?.message || 
                            response?.responseCode || 
                            response?.data?.message ||
                            'Bỏ chọn gói thất bại';
        throw new Error(errorMessage);
      }
    } catch (err) {
      console.error('💥 ERROR - Removing package failed:', err);
      
      let errorMsg = '❌ Bỏ chọn gói thất bại: ';
      
      if (err.message && err.message.includes('Không tìm thấy mã vehicleId')) {
        errorMsg = err.message;
      } else if (err.response && err.response.data) {
        const errorData = err.response.data;
        errorMsg += errorData.message || errorData.responseCode || JSON.stringify(errorData);
      } else if (err.message) {
        errorMsg += err.message;
      } else {
        errorMsg += 'Lỗi không xác định';
      }
      
      setError(errorMsg);
      setTimeout(() => setError(''), 5000);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePackagePurchase = async () => {
    if (!selectedPackage || !selectedVehicle) return;

    try {
      setActionLoading(true);
      setError('');

      const packageDisplayName = getPackageDisplayName(selectedPackage);
      const vehicleName = getVehicleProperty(selectedVehicle, 'name');
      
      const confirmPurchase = window.confirm(
        `Bạn có chắc muốn chọn gói "${packageDisplayName}" với giá ${getPackageProperty(selectedPackage, 'price')?.toLocaleString('vi-VN')} VND cho xe ${vehicleName}?`
      );
      
      if (!confirmPurchase) {
        setActionLoading(false);
        return;
      }

      const vehicleVin = getVehicleProperty(selectedVehicle, 'vin');
      const packageId = getPackageProperty(selectedPackage, 'id');
      
      console.log('🛒 Adding package - Vehicle Vin:', vehicleVin, 'Package ID:', packageId);

      const response = await vehicleAPI.addVehicleInPackage({
        Vin: vehicleVin,
        PackageId: packageId
      });
      
      console.log('Purchase response:', response);
      
      const isSuccess = response?.isSuccess || 
                       response?.data?.isSuccess || 
                       response?.status === 200 || 
                       (response?.message && response.message.toLowerCase().includes('success'));

      if (isSuccess) {
        alert(`✅ Đã chọn thành công gói: ${packageDisplayName} cho xe ${vehicleName}`);
        
        const updatedVehicles = vehicles.map(v => 
          getVehicleProperty(v, 'vin') === vehicleVin 
            ? { 
                ...v, 
                PackageID: packageId, 
                packageId: packageId, 
                PackageId: packageId,
                package: packageDisplayName
              }
            : v
        );
        setVehicles(updatedVehicles);
        setSelectedVehicle(updatedVehicles.find(v => 
          getVehicleProperty(v, 'vin') === vehicleVin
        ));
        
        setSelectedPackage(null);
        await loadPackagesForSelectedVehicle(true); // Force refresh
        
      } else {
        const errorMessage = response?.message || 
                            response?.responseCode || 
                            response?.data?.message ||
                            'Chọn gói thất bại';
        throw new Error(errorMessage);
      }
    } catch (err) {
      console.error('💥 Error purchasing package:', err);
      
      let errorMsg = '❌ Chọn gói thất bại: ';
      
      if (err.response && err.response.data) {
        const errorData = err.response.data;
        errorMsg += errorData.message || errorData.responseCode || JSON.stringify(errorData);
      } else if (err.message) {
        errorMsg += err.message;
      } else {
        errorMsg += 'Lỗi không xác định';
      }
      
      setError(errorMsg);
      setTimeout(() => setError(''), 5000);
    } finally {
      setActionLoading(false);
    }
  };

  // 🎯 COMPONENT LIFECYCLE
  useEffect(() => {
    if (location.state?.selectedVehicle) {
      setSelectedVehicle(location.state.selectedVehicle);
    }
  }, [location.state]);

  useEffect(() => {
    const fetchUserVehicles = async () => {
      try {
        setLoading(true);
        
        if (!selectedVehicle) {
          console.log('🚗 Fetching current user vehicles...');
          const response = await vehicleAPI.getCurrentUserVehicles();
          console.log('Current user vehicles API Response:', response);
          
          let userVehicles = [];
          
          if (response && Array.isArray(response)) {
            userVehicles = response;
          } else if (response && response.data && Array.isArray(response.data)) {
            userVehicles = response.data;
          } else if (response && response.data && response.data.data && Array.isArray(response.data.data)) {
            userVehicles = response.data.data;
          } else if (response && response.data && response.data.isSuccess && Array.isArray(response.data.data)) {
            userVehicles = response.data.data;
          }
          
          console.log('User vehicles extracted:', userVehicles);
          setVehicles(userVehicles || []);
        }
      } catch (err) {
        console.error('💥 Error fetching user vehicles:', err);
        setError('Lỗi khi tải danh sách xe: ' + (err.message || 'Vui lòng thử lại sau'));
        setVehicles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserVehicles();
  }, [selectedVehicle]);

  useEffect(() => {
    if (selectedVehicle) {
      loadPackagesForSelectedVehicle();
    }
  }, [selectedVehicle]);

  // 🎯 NAVIGATION HANDLERS
  const handleGoBack = () => {
    navigate(-1);
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

  const handleSelectDifferentVehicle = () => {
    setSelectedVehicle(null);
    setSelectedPackage(null);
    setPackages([]);
    setBatterySpecification(null);
  };

  // 🎯 RENDER COMPONENT
  return (
    <div className="package-page" style={{ overflowY: 'auto', maxHeight: '100vh' }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50 }}>
        <HeaderDriver
          onToggleTheme={handleToggleTheme}
          theme={theme}
          user={user}
          unreadCount={unreadCount}
          nextBooking={nextBooking}
          onOpenBooking={() => {}}
        />
      </div>

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

          {/* Vehicle Selection */}
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
                      ` (Đang dùng gói: ${getVehicleProperty(vehicle, 'package')})`
                    }
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Vehicle Info */}
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
                       getVehicleProperty(selectedVehicle, 'type') === 'Car' ? '🚗' : 
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
                      <span className="info-label">🔋 Pin ID:</span>
                      <span className="info-value">{getVehicleProperty(selectedVehicle, 'battery')}</span>
                    </div>
                    
                    <div className="info-item">
  <span className="info-label">⚡ Thông số pin:</span>
  <span className="info-value specification">
    {batterySpecification ? 
      formatBatterySpecification(batterySpecification) : 
      loading ? 'Đang tải...' : 'Chưa xác định'
    }
  </span>
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
                {selectedVehicle ? `Gói Phù Hợp Với Pin ${formatBatterySpecification(batterySpecification)}` : 'Bước 2: Chọn Gói Phù Hợp'}
              </h2>
              
              {error && (
                <div className="package-error">
                  <span>⚠️</span>
                  <span>{error}</span>
                  <button 
                    onClick={() => loadPackagesForSelectedVehicle(true)}
                    className="retry-btn"
                  >
                    🔄 Thử lại
                  </button>
                </div>
              )}
              
              {loading ? (
                <div className="package-loading">
                  <div className="loading-spinner"></div>
                  Đang tải gói dịch vụ phù hợp với pin của xe...
                </div>
              ) : packages.length === 0 ? (
                <div className="package-empty-state">
                  <div className="package-empty-icon">📦</div>
                  <h3 className="package-empty-title">Không có gói phù hợp</h3>
                  <p className="package-empty-text">
                    Không có gói nào phù hợp với loại pin {formatBatterySpecification(batterySpecification)} của xe {getVehicleProperty(selectedVehicle, 'name')}
                  </p>
                  <button 
                    onClick={() => loadPackagesForSelectedVehicle(true)}
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
                      const isCurrentlyUsed = isPackageUsedByVehicle(pkg);
                      const isDecommissioned = isPackageDecommissioned(pkg);
                      
                      return (
                        <div 
                          key={packageId} 
                          className={`package-card 
                            ${isCurrentlyUsed ? 'package-currently-used' : ''} 
                            ${isDecommissioned ? 'package-decommissioned' : ''}
                            ${selectedPackage && getPackageProperty(selectedPackage, 'id') === packageId ? 'selected' : ''}`}
                          onClick={() => !isDecommissioned && handlePackageSelect(pkg)}
                          style={{animationDelay: `${idx * 0.1}s`}}
                        >
                          {isCurrentlyUsed && (
                            <div className="package-current-badge">
                              ✓ ĐANG SỬ DỤNG
                            </div>
                          )}
                          
                          {isDecommissioned && !isCurrentlyUsed && (
                            <div className="package-decommissioned-badge">
                              ⚠️ NGỪNG KINH DOANH
                            </div>
                          )}
                          
                          <h3>{packageDisplayName}</h3>
                          <p className="package-price">{getPackageProperty(pkg, 'price')?.toLocaleString('vi-VN')} VND</p>
                          <p className="package-duration">⏱️ {getPackageProperty(pkg, 'duration') || '30 ngày'}</p>
                          <p className="package-description">{getPackageProperty(pkg, 'description') || 'Không có mô tả'}</p>
                          
                          <div className="package-card-actions">
                            {isCurrentlyUsed ? (
                              <button 
                                className="package-remove-card-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPackage(pkg);
                                }}
                              >
                                Bỏ chọn gói
                              </button>
                            ) : isDecommissioned ? (
                              <button 
                                className="package-disabled-card-btn"
                                disabled
                              >
                                Không khả dụng
                              </button>
                            ) : (
                              <button 
                                className="package-select-card-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPackage(pkg);
                                }}
                              >
                                Chọn gói này
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="package-hint">
                    💡 Nhấn vào gói để xem chi tiết và đăng ký
                    {batterySpecification && (
                      <span style={{marginLeft: '10px', opacity: 0.8}}>
                        (Đang hiển thị gói phù hợp với pin {formatBatterySpecification(batterySpecification)})
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="package-selection-section">
              <h2 className="section-title">
                <span className="section-icon">📦</span>
                Bước 2: Chọn Gói Dịch Vụ
              </h2>
              <div className="package-empty-state">
                <div className="package-empty-icon">🚗</div>
                <h3 className="package-empty-title">
                  Vui lòng chọn xe để xem các gói dịch vụ phù hợp
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

      {/* Package Detail Modal */}
      {selectedPackage && (
        <>
          <div className="package-modal-overlay" onClick={handleCloseModal}></div>
          <div className="package-detail-modal">
            <div className="package-modal-header">
              <h3>Thông Tin Gói Dịch Vụ</h3>
              <button className="package-close-btn" onClick={handleCloseModal}>×</button>
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
                  <br />
                  <strong>Thông số pin:</strong> {formatBatterySpecification(batterySpecification)}
                </div>
                
                {isPackageUsedByVehicle(selectedPackage) ? (
                  <>
                    <div className="package-current-indicator">
                      <span>✓</span> Bạn đang sử dụng gói này
                    </div>
                    <button 
                      onClick={handleRemovePackage}
                      className="package-remove-btn"
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'ĐANG XỬ LÝ...' : 'BỎ CHỌN GÓI'}
                    </button>
                    {actionLoading && (
                      <div className="package-processing">
                        ⏳ Đang xử lý yêu cầu...
                      </div>
                    )}
                  </>
                ) : (
                  <button 
                    onClick={handlePackagePurchase}
                    className="package-purchase-btn"
                    disabled={actionLoading || isPackageDecommissioned(selectedPackage)}
                  >
                    {actionLoading ? 'ĐANG XỬ LÝ...' : 
                     isPackageDecommissioned(selectedPackage) ? 'GÓI ĐÃ NGỪNG KINH DOANH' : 
                     `CHỌN GÓI NÀY - ${getPackageProperty(selectedPackage, 'price')?.toLocaleString('vi-VN')} VND`}
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
      <Footer />
    </div>
  );
};

export default Package;