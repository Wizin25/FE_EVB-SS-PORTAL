import React, { useState, useEffect } from 'react';
import { vehicleAPI } from '../services/vehicleAPI';
import { authAPI } from '../services/authAPI';
import { packageAPI } from '../services/packageAPI';
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
  const [batteryDetails, setBatteryDetails] = useState({});
  const [packageDetails, setPackageDetails] = useState({});
  const [allPackages, setAllPackages] = useState([]);
  const [newVehicle, setNewVehicle] = useState({
    vin: '',
    vehicleName: '',
    vehicleType: 'electric_motorbike',
    batteryInfo: ''
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
  
  // Danh sách các tên xe từ enum - ĐÃ SẮP XẾP THEO LOẠI
  const vehicleNameOptions = [
    // electric_motorbike - Xe máy điện
    { value: 'YADEA_VELAX', label: 'Yadea Velax', type: 'electric_motorbike' },
    { value: 'YADEA_VOLTGUARD_U', label: 'Yadea Voltguard U', type: 'electric_motorbike' },
    { value: 'YADEA_VOLTGUARD_P', label: 'Yadea Voltguard P', type: 'electric_motorbike' },
    { value: 'YADEA_ORLA', label: 'Yadea Orla', type: 'electric_motorbike' },
    { value: 'YADEA_ORIS', label: 'Yadea Oris', type: 'electric_motorbike' },
    { value: 'YADEA_OSSY', label: 'Yadea Ossy', type: 'electric_motorbike' },
    { value: 'YADEA_OCEAN', label: 'Yadea Ocean', type: 'electric_motorbike' },
    { value: 'YADEA_ICUTE', label: 'Yadea iCute', type: 'electric_motorbike' },
    { value: 'YADEA_ODORA_S', label: 'Yadea Odora S', type: 'electric_motorbike' },
    { value: 'YADEA_ODORA_S2', label: 'Yadea Odora S2', type: 'electric_motorbike' },
    { value: 'YADEA_M6I', label: 'Yadea M6i', type: 'electric_motorbike' },
    { value: 'YADEA_VIGOR', label: 'Yadea Vigor', type: 'electric_motorbike' },
    { value: 'YADEA_X_ZONE', label: 'Yadea X-Zone', type: 'electric_motorbike' },
    { value: 'YADEA_VEKOO', label: 'Yadea Vekoo', type: 'electric_motorbike' },
    { value: 'YADEA_X_MEN_NEO', label: 'Yadea X-Men Neo', type: 'electric_motorbike' },
    { value: 'YADEA_X_SKY', label: 'Yadea X-Sky', type: 'electric_motorbike' },
    { value: 'YADEA_X_BULL', label: 'Yadea X-Bull', type: 'electric_motorbike' },
    { value: 'YADEA_VEKOO_SOOBIN', label: 'Yadea Vekoo Soobin', type: 'electric_motorbike' },
    { value: 'YADEA_VELAX_SOOBIN', label: 'Yadea Velax Soobin', type: 'electric_motorbike' },
    { value: 'YADEA_ORIS_SOOBIN', label: 'Yadea Oris Soobin', type: 'electric_motorbike' },
    
    // electric_bike - Xe đạp điện
    { value: 'YADEA_I8_VINTAGE', label: 'Yadea i8 Vintage', type: 'electric_bike' },
    { value: 'YADEA_I8', label: 'Yadea i8', type: 'electric_bike' },
    { value: 'YADEA_I6_Accumulator', label: 'Yadea i6 Accumulator', type: 'electric_bike' },
    { value: 'YADEA_I6_Lithium_Battery', label: 'Yadea i6 Lithium Battery', type: 'electric_bike' },
    { value: 'YADEA_IFUN', label: 'Yadea iFun', type: 'electric_bike' },
    { value: 'YADEA_IGO', label: 'Yadea iGo', type: 'electric_bike' },
    
    // electric_assist_bicycle - Xe đạp trợ lực
    { value: 'YADEA_VITO', label: 'Yadea Vito', type: 'electric_assist_bicycle' },
    { value: 'YADEA_FLIT', label: 'Yadea Flit', type: 'electric_assist_bicycle' }
  ];

  // Danh sách loại xe từ enum VehicleTypeEnums - ĐÃ SẮP XẾP
  const vehicleTypeOptions = [
    { value: 'electric_motorbike', label: 'Electric Motorbike' },
    { value: 'electric_bike', label: 'Electric Bike' },
    { value: 'electric_assist_bicycle', label: 'Electric Assist Bicycle' }
  ];

  // Hàm tự động xác định loại xe dựa trên tên xe
  const getVehicleTypeFromName = (vehicleName) => {
    const vehicle = vehicleNameOptions.find(v => v.value === vehicleName);
    return vehicle ? vehicle.type : 'electric_motorbike'; // Mặc định là xe máy điện
  };

  // Mapping ảnh xe
  const vehicleImageMapping = {
    // Xe máy điện - electric_motorbike
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
    
    // Xe đạp điện - electric_bike
    'YADEA_I8_VINTAGE': 'https://www.yadea.com.vn/wp-content/uploads/2025/03/Anh-dau-banner-i8-gau-xanh-1280x880px.png',
    'YADEA_I8': 'https://www.yadea.com.vn/wp-content/uploads/2023/11/Anh-sp-banner-1280x880-trang-sua-i8-moi.png',
    'YADEA_I6_Accumulator': 'https://product.hstatic.net/200000859553/product/hong_cb6790de6aa84124ae1f359932b6b20c_master.png',
    'YADEA_I6_Lithium_Battery': 'https://www.yadea.com.vn/wp-content/uploads/2023/11/i6-black2.png',
    'YADEA_IFUN': 'https://www.yadea.com.vn/wp-content/uploads/2024/08/YADEA-iFUN-xanh-anh-ngang.webp',
    'YADEA_IGO': 'https://www.yadea.com.vn/wp-content/uploads/2023/11/igo-black-banner-1.png',
    
    // Xe đạp trợ lực - electric_assist_bicycle
    'YADEA_VITO': 'https://www.yadea.com.vn/wp-content/uploads/2025/09/Anh-ngang-VITO-xanh.png',
    'YADEA_FLIT': 'https://www.yadea.com.vn/wp-content/uploads/2025/09/Anh-ngang-FLIT-trang.png'
  };

  // Hàm lấy ảnh xe
  const getVehicleImage = (vehicleName) => {
    return vehicleImageMapping[vehicleName] || '#DEFAULT_VEHICLE_IMAGE_URL';
  };

  // Hàm lọc danh sách xe theo loại
  const getVehicleNameOptionsByType = (vehicleType) => {
    return vehicleNameOptions.filter(vehicle => vehicle.type === vehicleType);
  };

  // HÀM MỚI: Load chi tiết package bằng packageId
  const loadPackageDetails = async (vehiclesData) => {
    try {
      const packageMap = {};
      
      for (const vehicle of vehiclesData) {
        const packageId = getVehicleProperty(vehicle, 'package');
        if (packageId && packageId !== 'N/A') {
          try {
            console.log(`Loading package details for packageId: ${packageId}`);
            const packageResponse = await packageAPI.getPackageById(packageId);
            
            let packageData = null;
            if (packageResponse && packageResponse.data) {
              packageData = packageResponse.data;
            } else if (packageResponse) {
              packageData = packageResponse;
            }
            
            if (packageData) {
              packageMap[packageId] = packageData;
              console.log(`Package details for ${packageId}:`, packageData);
            }
          } catch (err) {
            console.error(`Error loading package details for ${packageId}:`, err);
          }
        }
      }
      
      setPackageDetails(packageMap);
    } catch (err) {
      console.error('Error loading package details:', err);
    }
  };

  // Hàm lấy thông tin chi tiết pin
  const loadBatteryDetails = async (vehiclesData) => {
    try {
      const batteryMap = {};
      
      for (const vehicle of vehiclesData) {
        const batteryId = getVehicleProperty(vehicle, 'battery');
        if (batteryId && batteryId !== 'N/A') {
          try {
            console.log(`Loading battery details for batteryId: ${batteryId}`);
            const batteryResponse = await authAPI.getBatteryById(batteryId);
            
            let batteryData = null;
            if (batteryResponse && batteryResponse.data) {
              batteryData = batteryResponse.data;
            } else if (batteryResponse) {
              batteryData = batteryResponse;
            }
            
            if (batteryData) {
              batteryMap[batteryId] = batteryData;
              console.log(`Battery details for ${batteryId}:`, batteryData);
            }
          } catch (err) {
            console.error(`Error loading battery details for ${batteryId}:`, err);
          }
        }
      }
      
      setBatteryDetails(batteryMap);
    } catch (err) {
      console.error('Error loading battery details:', err);
    }
  };

  // HÀM MỚI: Load tất cả packages
  const loadAllPackages = async () => {
    try {
      const response = await packageAPI.getAllPackages();
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
      
      setAllPackages(packagesData);
      console.log('All packages loaded:', packagesData);
    } catch (err) {
      console.error('Error loading all packages:', err);
    }
  };

  // HÀM MỚI: Lấy thông tin pin từ vehicle data
  const getBatteryInfoFromVehicle = (vehicle) => {
    const batteryId = getVehicleProperty(vehicle, 'battery');
    
    // Ưu tiên lấy từ batteryDetails
    if (batteryId && batteryId !== 'N/A' && batteryDetails[batteryId]) {
      const battery = batteryDetails[batteryId];
      return {
        type: battery.batteryType || battery.type || 'Chưa có thông tin',
        specification: battery.specification || 'Chưa có thông tin',
        quality: battery.batteryQuality ? `${battery.batteryQuality}%` : 'Chưa có thông tin'
      };
    }
    
    return {
      type: 'Chưa có thông tin',
      specification: 'Chưa có thông tin',
      quality: 'Chưa có thông tin'
    };
  };

  // Hàm xử lý khi chọn tên xe - TỰ ĐỘNG CẬP NHẬT LOẠI XE
  const handleVehicleNameChange = (selectedVehicleName) => {
    const vehicleType = getVehicleTypeFromName(selectedVehicleName);
    
    setNewVehicle({
      ...newVehicle,
      vehicleName: selectedVehicleName,
      vehicleType: vehicleType,
      batteryInfo: '' // Không còn set batteryInfo tĩnh nữa
    });
  };

  // Helper to safely get package properties
  const getPackageProperty = (pkg, property) => {
    const possibleKeys = {
      id: ['packageId', 'id', 'packageID', 'PackageId'],
      name: ['packageName', 'name', 'PackageName', 'package_name'],
      expiredDate: ['expiredDate', 'expired_date', 'endDate', 'end_date', 'validUntil', 'expiryDate']
    };
    
    const keys = possibleKeys[property] || [property];
    for (let key of keys) {
      if (pkg[key] !== undefined && pkg[key] !== null) {
        return pkg[key];
      }
    }
    return 'N/A';
  };

  // HÀM CẬP NHẬT: Lấy thông tin package từ packageDetails
  const getPackageDisplayInfo = (vehicle) => {
    const packageId = getVehicleProperty(vehicle, 'package');
    
    if (!packageId || packageId === 'N/A') {
      return { name: 'Chưa có gói', expiredDate: null };
    }

    // Ưu tiên lấy từ packageDetails trước
    if (packageDetails[packageId]) {
      const pkg = packageDetails[packageId];
      const packageName = getPackageProperty(pkg, 'name');
      const expiredDate = getPackageProperty(pkg, 'expiredDate');
      
      return {
        name: packageName || `Gói ${packageId}`,
        expiredDate: expiredDate !== 'N/A' ? expiredDate : null
      };
    }

    // Fallback: tìm trong allPackages
    const foundPackage = allPackages.find(pkg => {
      const pkgId = getPackageProperty(pkg, 'id');
      return pkgId === packageId;
    });

    if (foundPackage) {
      const packageName = getPackageProperty(foundPackage, 'name');
      const expiredDate = getPackageProperty(foundPackage, 'expiredDate');
      
      return {
        name: packageName || `Gói ${packageId}`,
        expiredDate: expiredDate !== 'N/A' ? expiredDate : null
      };
    }

    return {
      name: `Gói ${packageId}`,
      expiredDate: null
    };
  };

  // Hàm format ngày
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN');
    } catch (e) {
      console.error('Invalid date string:', dateString);
      return dateString;
    }
  };

  // Hàm kiểm tra gói sắp hết hạn (trong 7 ngày)
  const isExpiringSoon = (expiredDate) => {
    if (!expiredDate) return false;
    try {
      const expDate = new Date(expiredDate);
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return expDate <= sevenDaysFromNow && expDate > now;
    } catch (e) {
      return false;
    }
  };

  // Hàm kiểm tra gói đã hết hạn
  const isExpired = (expiredDate) => {
    if (!expiredDate) return false;
    try {
      const expDate = new Date(expiredDate);
      const now = new Date();
      return expDate < now;
    } catch (e) {
      return false;
    }
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
    loadAllPackages(); // Load all packages when component mounts
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
        // Lọc xe active với các trạng thái khác nhau từ enum
        const activeVehicles = vehiclesData.filter(vehicle => {
          const status = getVehicleProperty(vehicle, 'status');
          // Kiểm tra nhiều trạng thái có thể được coi là "active"
          return status === 'Active' || 
                 status === 'active' || 
                 status === 'linked' || 
                 status === 'Linked';
        });
        
        console.log('Active user vehicles:', activeVehicles);
        
        if (activeVehicles.length > 0) {
          const vehicleTypes = {};
          activeVehicles.forEach(vehicle => {
            // CHUẨN HÓA LOẠI XE THEO ENUM
            const rawType = vehicle.vehicle_type || vehicle.type || vehicle.vehicleType || 'other';
            let normalizedType = 'other';
            
            // Ánh xạ các giá trị về enum chuẩn
            if (rawType.includes('electric_motorbike') || rawType.includes('motorbike')) {
              normalizedType = 'electric_motorbike';
            } else if (rawType.includes('electric_bike') || rawType.includes('e_bike')) {
              normalizedType = 'electric_bike';
            } else if (rawType.includes('electric_assist_bicycle') || rawType.includes('assist_bicycle')) {
              normalizedType = 'electric_assist_bicycle';
            } else {
              normalizedType = rawType; // Giữ nguyên nếu không khớp
            }
            
            if (!vehicleTypes[normalizedType]) {
              vehicleTypes[normalizedType] = [];
            }
            vehicleTypes[normalizedType].push(vehicle);
          });
          
          console.log('Grouped active vehicles:', vehicleTypes);
          setVehicles(vehicleTypes);
          
          // Load packages, battery details, và package details song song
          await Promise.all([
            loadPackagesForVehicles(activeVehicles),
            loadBatteryDetails(activeVehicles),
            loadPackageDetails(activeVehicles)
          ]);
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

      // Gọi API link_vehicle - backend sẽ tự động tạo pin phù hợp
      const formData = new FormData();
      formData.append('VIN', newVehicle.vin);
      formData.append('VehicleName', newVehicle.vehicleName);
      formData.append('VehicleType', newVehicle.vehicleType);
      
      // KHÔNG cần gửi BatteryID - backend sẽ tự động tạo

      const response = await vehicleAPI.linkVehicle(formData);
      console.log('Create vehicle response:', response);

      // Đóng modal và reset form
      setShowCreateModal(false);
      setNewVehicle({
        vin: '',
        vehicleName: '',
        vehicleType: 'electric_motorbike',
        batteryInfo: ''
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
      'electric_motorbike': '🏍️',
      'electric_assist_bicycle': '🚲',
      'other': '🚗'
    };
    return icons[type] || '🚗';
  };

  // Helper to safely get vehicle properties
  const getVehicleProperty = (vehicle, property) => {
    const possibleKeys = {
      vin: ['VIN', 'vin', 'vehicleId', 'id', 'vehicleID'],
      battery: ['BatteryID', 'batteryId', 'batteryID', 'battery'],
      batteryName: ['BatteryName', 'batteryName', 'battery_name', 'Battery_Name'],
      package: ['PackageID', 'packageId', 'packageID', 'package'],
      packageName: ['PackageName', 'packageName', 'package_name', 'Package_Name'],
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

  // Hàm hiển thị status text
  const getStatusDisplayText = (status) => {
    switch(status) {
      case 'Linked':
      case 'linked':
        return 'Đã liên kết';
      case 'Unlinked':
      case 'unlinked':
        return 'Chưa liên kết';
      default:
        return status || 'Không xác định';
    }
  };

  // Hàm lấy tên hiển thị cho loại xe
  const getVehicleTypeDisplayName = (type) => {
    const typeMap = {
      'electric_motorbike': 'Electric Motorbike',
      'electric_bike': 'Electric Bike', 
      'electric_assist_bicycle': 'Electric Assist Bicycle',
      'other': 'Loại Khác'
    };
    return typeMap[type] || type;
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

        {/* Vehicle Grid - SẮP XẾP THEO THỨ TỰ ENUM */}
        {!loading && vehicleTypes.length > 0 && (
          <div className="vehicles-wrapper">
            {/* Hiển thị theo thứ tự enum: electric_motorbike -> electric_bike -> electric_assist_bicycle -> other */}
            {['electric_motorbike', 'electric_bike', 'electric_assist_bicycle', 'other']
              .filter(type => vehicles[type] && vehicles[type].length > 0)
              .map((type, idx) => (
              <div 
                key={type} 
                className="vehicle-section" 
                style={{animationDelay: `${idx * 0.1}s`}}
              >
                <div className="section-header">
                  <span className="section-icon">{getVehicleIcon(type)}</span>
                  <h2 className="section-title">
                    {getVehicleTypeDisplayName(type)}
                  </h2>
                  <div className="section-badge">{vehicles[type].length} xe</div>
                </div>
                
                <div className="vehicle-grid">
                  {vehicles[type].map((vehicle, vIdx) => {
                    const packageInfo = getPackageDisplayInfo(vehicle);
                    const batteryInfo = getBatteryInfoFromVehicle(vehicle);
                    
                    return (
                      <div 
                        key={getVehicleProperty(vehicle, 'vin')} 
                        className="vehicle-card-modern"
                        style={{animationDelay: `${(idx * 0.1) + (vIdx * 0.05)}s`}}
                        onClick={() => handleSelectVehicle(vehicle)}
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
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                            <div 
                              className="vehicle-icon-fallback"
                              style={{display: 'none'}}
                            >
                              {getVehicleIcon(getVehicleProperty(vehicle, 'type'))}
                            </div>
                          </div>
                        </div>

                        {/* Status và Delete button */}
                        <div className="card-actions">
                          <span className={`status-badge ${getVehicleProperty(vehicle, 'status')?.toLowerCase()}`}>
                            <span className="status-dot"></span>
                            {getStatusDisplayText(getVehicleProperty(vehicle, 'status'))}
                          </span>
                          {isInRole('EvDriver') && (
                            <button 
                              className="delete-vehicle-btn"
                              onClick={(e) => {
                                e.stopPropagation(); // Quan trọng: Ngăn sự kiện click lan ra ngoài
                                e.preventDefault();
                                handleDeleteVehicle(getVehicleProperty(vehicle, 'vin'));
                              }}
                              title="Xóa xe"
                            >
                              🗑️
                            </button>
                          )}
                        </div>

                        <div className="card-body">
                          <h3 className="vehicle-name">{getVehicleProperty(vehicle, 'name')}</h3>
                          
                          <div className="vehicle-details">
                            <div className="detail-row">
                              <span className="detail-label">VIN</span>
                              <span className="detail-value">{getVehicleProperty(vehicle, 'vin')}</span>
                            </div>
                            
                            {/* THÊM: Hiển thị thông tin pin chi tiết */}
                            <div className="detail-row">
                              <span className="detail-label">🔋 Pin</span>
                              <span className="detail-value battery-type">
                                {batteryInfo.type}
                              </span>
                            </div>
                            <div className="detail-row">
                              <span className="detail-label">⚡ Thông số pin</span>
                              <span className="detail-value battery-spec">
                                {batteryInfo.specification}
                              </span>
                            </div>
                            <div className="detail-row">
                              <span className="detail-label">📊 Dung lượng pin</span>
                              <span className="detail-value battery-quality">
                                {batteryInfo.quality}
                              </span>
                            </div>
                            
                            <div className="detail-row">
                              <span className="detail-label">Gói hiện tại</span>
                              <span className="detail-value package-id">
                                {getVehicleProperty(vehicle, 'package') && getVehicleProperty(vehicle, 'package') !== 'N/A' ? (
                                  <span className="has-package">📦 {packageInfo.name}</span>
                                ) : (
                                  <span className="no-package">Chưa có</span>
                                )}
                              </span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Ngày hết hạn gói</span>
                                <span className="detail-value">
                                  <span className={`expired-date ${isExpiringSoon(packageInfo.expiredDate) ? 'expiring-soon' : ''} ${isExpired(packageInfo.expiredDate) ? 'expiredDate' : ''}`}>
                                    ⏰ {formatDate(packageInfo.expiredDate)}
                                    {isExpiringSoon(packageInfo.expiredDate) && ' (Sắp hết hạn)'}
                                    {isExpired(packageInfo.expiredDate) && ' (Đã hết hạn)'}
                                  </span>
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
                    );
                  })}
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

        {/* Modal Tạo Xe - CẬP NHẬT HIỂN THỊ THÔNG TIN PIN */}
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
                  onChange={(e) => handleVehicleNameChange(e.target.value)}
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

              {/* Hiển thị loại xe đã được tự động xác định */}
              <div className="form-group">
                <label>Loại xe (Tự động)</label>
                <div className="form-readonly">
                  {vehicleTypeOptions.find(opt => opt.value === newVehicle.vehicleType)?.label || 'Chưa xác định'}
                </div>
              </div>

              {/* CẬP NHẬT: Hiển thị thông báo về pin sẽ được tạo tự động */}
              {newVehicle.vehicleName && (
                <div className="form-group">
                  <label>Thông tin pin</label>
                  <div className="battery-info-display">
                    🔋 Pin sẽ được tạo tự động phù hợp với xe đã chọn
                  </div>
                  <div className="battery-info-note">
                    Hệ thống sẽ tự động tạo pin với thông số kỹ thuật phù hợp cho xe {newVehicle.vehicleName}
                  </div>
                </div>
              )}

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