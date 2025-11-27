// src/components/Profile.jsx - Final Optimized Version with HistoryOrder Integration
import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from '../services/authAPI';
import { formAPI } from '../services/formAPI';
import { vehicleAPI } from '../services/vehicleAPI';
import { isInRole, getUserRoles } from '../services/jwt';
import Header from '../Home/header';
import Footer from '../Home/footer';
import HistoryOrder from './HistoryOrder';
import './ProfileStyle.css';

function Profile({ theme = "light" }) {
  const [localTheme, setLocalTheme] = useState(theme);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [editError, setEditError] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  const [forms, setForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);
  const [loadingForms, setLoadingForms] = useState(false);
  const [formDetail, setFormDetail] = useState(null);
  const [loadingFormDetail, setLoadingFormDetail] = useState(false);
  const [sortBy, setSortBy] = useState('status'); // 'status' | 'date'

  const [showVehiclesModal, setShowVehiclesModal] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [vehiclesError, setVehiclesError] = useState(null);

  const [activeSidebar, setActiveSidebar] = useState("profile");
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth <= 800 : false);
  const [userRoles, setUserRoles] = useState([]);

  // State cho thống kê
  const [ordersCount, setOrdersCount] = useState(0);
  const [exchangeBatteriesCount, setExchangeBatteriesCount] = useState(0);
  const [loadingStats, setLoadingStats] = useState(false);

  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState(null);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(null);

  // Avatar upload states
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const fileInputRef = useRef(null);

  // Pre-load danh sách trạm để cache
  const [stationsCache, setStationsCache] = useState({});

  const navigate = useNavigate();

  // Helper function to format date
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Hàm pre-load danh sách trạm
  const loadAllStations = async () => {
    try {
      const stations = await authAPI.getAllStations();
      if (Array.isArray(stations)) {
        const cache = {};
        stations.forEach(station => {
          const stationId = station.stationId || station.StationId || station.id;
          if (stationId) {
            cache[stationId] = {
              stationName: station.stationName || station.Name || 'N/A',
              location: station.location || 'N/A'
            };
          }
        });
        setStationsCache(cache);
      }
    } catch (error) {
      console.error('Error pre-loading stations:', error);
    }
  };

  // Hàm lấy thông tin trạm từ cache
  const getStationInfo = (stationId) => {
    if (!stationId) return { stationName: 'N/A', location: 'N/A' };

    if (stationsCache[stationId]) {
      return stationsCache[stationId];
    }

    return { stationName: 'N/A', location: 'N/A' };
  };

  // Theme handling
  const handleToggleTheme = useCallback(() => {
    const newTheme = localTheme === "light" ? "dark" : "light";
    setLocalTheme(newTheme);

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
  }, [localTheme]);

  // Initialize theme and user data
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setLocalTheme(savedTheme);

    const root = document.documentElement;
    if (savedTheme === "dark") {
      root.classList.add("dark");
      document.body.classList.add("dark");
    }

    let mounted = true;
    setLoading(true);
    setError(null);

    authAPI.getCurrent()
      .then((data) => {
        if (!mounted) return;
        const safe = data?.data ?? (data?.isSuccess ? data.data : data) ?? data;
        setUser(safe);
        setEditData({
          name: safe?.name || "",
          phone: safe?.phone || "",
          address: safe?.address || "",
          email: safe?.email || "",
          avatar: safe?.avatar || "",
        });
        setLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err?.message || "Lỗi khi lấy thông tin tài khoản");
        setLoading(false);
      });

    // Pre-load stations
    loadAllStations();

    return () => { mounted = false; };
  }, []);

  // Initialize user roles and fetch forms if EvDriver
  useEffect(() => {
    const roles = getUserRoles();
    setUserRoles(roles);

    if (roles.includes('EvDriver') && user) {
      fetchForms();
    }
  }, [user]);

  // Fetch statistics (orders count and exchange batteries count)
const fetchStatistics = useCallback(async () => {
  if (!user?.accountId) return;

  setLoadingStats(true);
  try {
    const accountId = user.accountId || user.id;

    // Fetch orders count
    try {
      const ordersResponse = await authAPI.getOrdersByAccountId(accountId);
      if (ordersResponse?.isSuccess) {
        const ordersList = ordersResponse.data || [];
        setOrdersCount(ordersList.length);
      } else {
        setOrdersCount(0);
      }
    } catch (err) {
      console.error('Error fetching orders count:', err);
      setOrdersCount(0);
    }

    // Fetch exchange batteries count - CHỈ ĐẾM STATUS "Completed"
    try {
      const exchangeResponse = await authAPI.getExchangeBatteryByAccountId(accountId);
      
      if (exchangeResponse?.isSuccess) {
        const exchangeBatteriesList = exchangeResponse.data || [];
        
        const completedExchanges = exchangeBatteriesList.filter(item => 
          item.status === 'Completed'
        );
        
        setExchangeBatteriesCount(completedExchanges.length);
      } else {
        setExchangeBatteriesCount(0);
      }
    } catch (err) {
      console.error('Error fetching exchange batteries count:', err);
      setExchangeBatteriesCount(0);
    }
  } catch (err) {
    console.error('Error fetching statistics:', err);
  } finally {
    setLoadingStats(false);
  }
}, [user?.accountId]);

  // Fetch statistics when user is loaded
  useEffect(() => {
    if (user?.accountId) {
      fetchStatistics();
    }
  }, [fetchStatistics]);

  // Responsive handling
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 800);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // API calls - Updated fetchForms with battery details and station names
  const fetchForms = useCallback(async () => {
    if (!isInRole('EvDriver') || !user) return;

    setLoadingForms(true);
    try {
      const accountId = user.accountId || user.id;
      if (!accountId) return;

      const response = await formAPI.getFormsByAccountId(accountId);

      if (response?.isSuccess) {
        const formsData = response.data || [];

        // Lấy thông tin batteryName và stationName cho từng form
        const formsWithDetails = await Promise.all(
          formsData.map(async (form) => {
            let batteryName = 'Không có pin';
            let stationName = 'Chưa xác định';

            // Lấy thông tin pin
            if (form.batteryId) {
              try {
                const batteryDetail = await authAPI.getBatteryById(form.batteryId);
                batteryName = batteryDetail?.name || 'Không có tên';
              } catch (error) {
                console.error(`Error fetching battery details for ${form.batteryId}:`, error);
                batteryName = 'Lỗi khi tải thông tin pin';
              }
            }

            // Lấy thông tin trạm từ cache
            if (form.stationId) {
              const stationInfo = getStationInfo(form.stationId);
              stationName = stationInfo.stationName;
            }

            return {
              ...form,
              batteryName: batteryName,
              stationName: stationName
            };
          })
        );

        setForms(formsWithDetails);
      }
    } catch (error) {
      console.error('Error fetching forms:', error);
    } finally {
      setLoadingForms(false);
    }
  }, [user, stationsCache]);

  // Updated fetchFormDetail with battery details and station info
  const fetchFormDetail = useCallback(async (formId) => {
    if (!isInRole('EvDriver') || !formId) return;

    setLoadingFormDetail(true);
    try {
      const response = await formAPI.getFormById(formId);

      if (response?.isSuccess) {
        let formDetail = response.data;

        // Lấy thông tin batteryName nếu có batteryId
        if (formDetail.batteryId) {
          try {
            const batteryDetail = await authAPI.getBatteryById(formDetail.batteryId);
            formDetail.batteryName = batteryDetail?.name || 'Không có tên';
            formDetail.batteryDetail = batteryDetail;
          } catch (error) {
            console.error(`Error fetching battery details:`, error);
            formDetail.batteryName = 'Lỗi khi tải thông tin pin';
          }
        } else {
          formDetail.batteryName = 'Không có pin';
        }

        // Lấy thông tin stationName
        if (formDetail.stationId) {
          const stationInfo = getStationInfo(formDetail.stationId);
          formDetail.stationName = stationInfo.stationName;
          formDetail.stationLocation = stationInfo.location;
        } else {
          formDetail.stationName = 'Chưa xác định';
          formDetail.stationLocation = 'N/A';
        }

        setFormDetail(formDetail);
      } else {
        throw new Error(response?.message || 'Không thể lấy thông tin chi tiết');
      }
    } catch (error) {
      console.error('Error fetching form detail:', error);
      setError('Lỗi khi tải chi tiết đặt lịch');
    } finally {
      setLoadingFormDetail(false);
    }
  }, [stationsCache]);

  const fetchUserVehicles = useCallback(async () => {
    if (!isInRole('EvDriver')) {
      setVehiclesError('Chỉ tài xế mới có thể xem danh sách xe');
      return;
    }

    setLoadingVehicles(true);
    setVehiclesError(null);
    try {
      const response = await vehicleAPI.getCurrentUserVehicles();

      if (response?.isSuccess) {
        setVehicles(response.data || []);
      } else {
        throw new Error(response?.message || 'Lỗi khi lấy danh sách xe');
      }
    } catch (error) {
      setVehiclesError(error?.message || 'Lỗi khi lấy danh sách xe');
    } finally {
      setLoadingVehicles(false);
    }
  }, []);

  const handleShowVehicles = useCallback(() => {
    setShowVehiclesModal(true);
    fetchUserVehicles();
  }, [fetchUserVehicles]);

  // Avatar upload handlers
  const handleAvatarClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      // Kiểm tra loại file và kích thước
      if (!file.type.startsWith('image/')) {
        setError('Vui lòng chọn file ảnh');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB
        setError('Kích thước ảnh không được vượt quá 5MB');
        return;
      }

      setAvatarFile(file);
      handleAvatarUpload(file);
    }
  }, []);

  const handleAvatarUpload = useCallback(async (file) => {
    if (!file) return;

    setIsUploadingAvatar(true);
    setError(null);

    try {
      console.log('Bắt đầu upload avatar...', file.name);

      // 1. Upload lên Cloudinary
      const cloudinaryResponse = await authAPI.uploadToCloudinary(file);
      console.log('Cloudinary upload response:', cloudinaryResponse);

      // 2. Xử lý response từ Cloudinary
      let avatarUrl;

      if (cloudinaryResponse.data?.url) {
        avatarUrl = cloudinaryResponse.data.url;
      } else if (cloudinaryResponse.data?.secure_url) {
        avatarUrl = cloudinaryResponse.data.secure_url;
      } else if (cloudinaryResponse.url) {
        avatarUrl = cloudinaryResponse.url;
      } else if (cloudinaryResponse.secure_url) {
        avatarUrl = cloudinaryResponse.secure_url;
      } else if (cloudinaryResponse.data?.publicId) {
        avatarUrl = `https://res.cloudinary.com/your-cloud-name/image/upload/${cloudinaryResponse.data.publicId}`;
      } else {
        console.error('Cloudinary response structure:', cloudinaryResponse);
        throw new Error('Không nhận được URL ảnh từ Cloudinary');
      }

      console.log('Avatar URL nhận được:', avatarUrl);

      // 3. Sử dụng user data thay vì editData để đảm bảo có giá trị
      const updateData = {
        name: user?.name || "",
        phone: user?.phone || "",
        address: user?.address || "",
        email: user?.email || "",
        avatar: avatarUrl
      };

      console.log('Data gửi lên update profile:', updateData);

      const updateResponse = await authAPI.updateProfile(updateData);

      if (updateResponse?.isSuccess) {
        // Cập nhật state user với avatar mới
        setUser(prev => ({ ...prev, avatar: avatarUrl }));
        setEditData(prev => ({ ...prev, avatar: avatarUrl }));
        try {
          localStorage.setItem('avatarUrl', avatarUrl);
        } catch { }
        try {
          window.dispatchEvent(new CustomEvent('avatar-updated', { detail: avatarUrl }));
        } catch { }

        console.log('Cập nhật avatar thành công');
      } else {
        throw new Error(updateResponse?.message || 'Cập nhật avatar thất bại');
      }

    } catch (err) {
      console.error('Lỗi upload avatar:', err);
      setError(err?.message || 'Lỗi khi tải lên ảnh đại diện');
    } finally {
      setIsUploadingAvatar(false);
      setAvatarFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [user]);

  // Form handlers
  const handleEditChange = useCallback((e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
    setEditError(null);
  }, []);

  const handleEditSave = useCallback(async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError(null);

    try {
      const response = await authAPI.updateProfile(editData);

      if (response?.isSuccess) {
        setUser(prev => ({ ...prev, ...editData }));
        setEditMode(false);
      } else {
        throw new Error(response?.message || "Cập nhật thất bại");
      }
    } catch (err) {
      setEditError(err?.message || "Lỗi khi cập nhật hồ sơ");
    } finally {
      setEditLoading(false);
    }
  }, [editData]);

  const handleEditCancel = useCallback(() => {
    setEditData({
      name: user?.name || "",
      phone: user?.phone || "",
      address: user?.address || "",
      email: user?.email || "",
      avatar: user?.avatar || "",
    });
    setEditError(null);
    setEditMode(false);
  }, [user]);

  const handlePasswordChange = useCallback((e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    setPasswordError(null);
    setPasswordSuccess(null);
  }, []);

  const handlePasswordSubmit = useCallback(async (e) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError("Vui lòng điền đầy đủ thông tin.");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("Mật khẩu mới và xác nhận không khớp.");
      return;
    }

    setPasswordLoading(true);
    try {
      const response = await authAPI.changePassword(passwordData);

      if (response?.isSuccess) {
        setPasswordSuccess("Đổi mật khẩu thành công!");
        setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
        setTimeout(() => {
          setActiveSidebar("profile");
          setPasswordSuccess(null);
        }, 1200);
      } else {
        throw new Error(response?.message || "Đổi mật khẩu thất bại");
      }
    } catch (err) {
      setPasswordError(err?.message || "Lỗi khi đổi mật khẩu");
    } finally {
      setPasswordLoading(false);
    }
  }, [passwordData]);

  // Memoized data
  const { name = "-", phone = "-", address = "-", email = "-", evdrivers = [], exchangeBatteries = [], orders = [], reports = [] } = user || {};

  const ev = useMemo(() => Array.isArray(evdrivers) && evdrivers.length > 0 ? evdrivers[0] : null, [evdrivers]);
  const customerId = useMemo(() => ev && typeof ev === "object" ? (ev.customerId ?? "-") : "-", [ev]);

  const count = useCallback((arr) => (Array.isArray(arr) ? arr.length : 0), []);

  // Sắp xếp forms theo status hoặc date
  const sortedForms = useMemo(() => {
    if (!Array.isArray(forms)) return [];
    let result = [...forms];

    if (sortBy === 'status') {
      // Ưu tiên: Pending > Approved > Completed > Rejected > Others
      const statusOrder = ['Pending', 'Approved', 'Completed', 'Rejected', 'Deleted'];
      result.sort((a, b) => {
        const statusA = a.status || '';
        const statusB = b.status || '';
        const indexA = statusOrder.indexOf(statusA);
        const indexB = statusOrder.indexOf(statusB);

        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB;
        }
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return statusA.localeCompare(statusB);
      });
    } else if (sortBy === 'date') {
      // Sắp xếp theo ngày mới nhất
      result.sort((a, b) => {
        const dateA = new Date(a.date || 0);
        const dateB = new Date(b.date || 0);
        return dateB - dateA;
      });
    }

    return result;
  }, [forms, sortBy]);

  // Avatar URL - ưu tiên avatar từ user, sau đó dùng UI Avatars
  const avatarUrl = useMemo(() => {
    if (user?.avatar) {
      return user.avatar;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "U")}&background=2563eb&color=fff&size=128`;
  }, [user?.avatar, name]);

  const renderPreview = useCallback((arr, labelKey = null) => {
    if (!Array.isArray(arr) || arr.length === 0) {
      return <div className="text-sm opacity-70">Không có</div>;
    }
    return (
      <ul className="p-0 m-0 space-y-1 list-none">
        {arr.slice(0, 3).map((it, idx) => {
          let label;
          if (labelKey && it && typeof it === "object" && it[labelKey] !== undefined && it[labelKey] !== null) {
            label = String(it[labelKey]);
          } else {
            label = JSON.stringify(it);
          }
          return (
            <li key={idx} className="text-sm truncate" title={label}>
              • {label}
            </li>
          );
        })}
        {arr.length > 3 && <li className="text-xs opacity-70">+{arr.length - 3} còn lại</li>}
      </ul>
    );
  }, []);

  // Sidebar items
  const sidebarItems = useMemo(() => {
    const baseItems = [
      { key: "profile", label: "Hồ sơ", icon: "👤", onClick: () => setActiveSidebar("profile") },
    ];

    if (userRoles.includes('EvDriver')) {
      baseItems.push({
        key: "bookingHistory",
        label: "Lịch sử Đặt lịch",
        icon: "📋",
        onClick: () => setActiveSidebar("bookingHistory")
      });
    }

    baseItems.push(
      { key: "paymentHistory", label: "Lịch sử thanh toán", icon: "💳", onClick: () => setActiveSidebar("paymentHistory") },
      { key: "changePassword", label: "Thay đổi mật khẩu", icon: "🔒", onClick: () => setActiveSidebar("changePassword") },
      {
        key: "home",
        label: "Trở về trang chủ",
        icon: "🏠",
        onClick: () => navigate('/home'),
        isHome: true
      }
    );

    return baseItems;
  }, [userRoles, navigate]);

  // Scroll styles
  const scrollStyles = {
    height: "100vh",
    overflowY: "auto",
    overflowX: "hidden",
    WebkitOverflowScrolling: "touch",
    scrollBehavior: "smooth"
  };

  // Loading, Error, and Empty states
  if (loading) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${localTheme === 'dark'
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white'
        : 'bg-gradient-to-br from-blue-50 via-white to-green-50 text-gray-900'}`}
        style={scrollStyles}>
        <div style={{ position: 'sticky', top: 0, zIndex: 50 }}>
          <Header
            onToggleTheme={handleToggleTheme}
            theme={localTheme}
            user={user}
            unreadCount={0}
            nextBooking={null}
            onOpenBooking={() => navigate('/booking')}
          />
        </div>
        <div className={`profile-loading-state ${localTheme === "dark" ? "dark" : ""}`}>
          <p>⏳ Đang tải thông tin...</p>
        </div>
        <Footer theme={localTheme} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${localTheme === 'dark'
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white'
        : 'bg-gradient-to-br from-blue-50 via-white to-green-50 text-gray-900'}`}
        style={scrollStyles}>
        <div style={{ position: 'sticky', top: 0, zIndex: 50 }}>
          <Header
            onToggleTheme={handleToggleTheme}
            theme={localTheme}
            user={user}
            unreadCount={0}
            nextBooking={null}
            onOpenBooking={() => navigate('/booking')}
          />
        </div>
        <div className={`profile-error-state ${localTheme === "dark" ? "dark" : ""}`}>
          <p>❌ Lỗi: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="profile-btn-primary"
            style={{ marginTop: '16px' }}
          >
            🔄 Thử lại
          </button>
        </div>
        <Footer theme={localTheme} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${localTheme === 'dark'
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white'
        : 'bg-gradient-to-br from-blue-50 via-white to-green-50 text-gray-900'}`}
        style={scrollStyles}>
        <div style={{ position: 'sticky', top: 0, zIndex: 50 }}>
          <Header
            onToggleTheme={handleToggleTheme}
            theme={localTheme}
            user={user}
            unreadCount={0}
            nextBooking={null}
            onOpenBooking={() => navigate('/booking')}
          />
        </div>
        <div className={`profile-empty ${localTheme === "dark" ? "dark" : ""}`}>
          <p>🔒 Chưa đăng nhập</p>
          <button
            onClick={() => navigate('/login')}
            className="profile-btn-primary"
            style={{ marginTop: '16px' }}
          >
            🔑 Đăng nhập ngay
          </button>
        </div>
        <Footer theme={localTheme} />
      </div>
    );
  }

  // Main render components
  const renderBookingHistory = () => {
    if (!userRoles.includes('EvDriver')) {
      return (
        <div className="liquid-glass" style={{ padding: 32, textAlign: 'center', margin: 20 }}>
          <h3 style={{ fontWeight: 700, fontSize: 20, marginBottom: 12 }}>🚫 Truy cập bị từ chối</h3>
          <p style={{ opacity: 0.8 }}>Bạn không có quyền truy cập tính năng này.</p>
        </div>
      );
    }

    return (
      <div style={{ padding: isMobile ? 16 : 24 }}>
        <div className="liquid-glass" style={{ padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <h3 style={{ fontWeight: 700, fontSize: 20, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              📋 Lịch sử Đặt lịch của bạn
            </h3>
            <button
              onClick={fetchForms}
              disabled={loadingForms}
              className="profile-btn-primary"
              style={{ fontSize: 14, padding: '10px 20px' }}
            >
              {loadingForms ? '⏳ Đang tải...' : '🔄 Làm mới'}
            </button>
          </div>
        </div>

        {loadingForms ? (
          <div className="profile-loading-state">
            <p>⏳ Đang tải lịch sử đặt lịch...</p>
          </div>
        ) : forms.length === 0 ? (
          <div className="profile-empty liquid-glass" style={{ margin: 20 }}>
            <p>📭 Bạn chưa có lịch sử đặt lịch nào.</p>
            <button
              onClick={() => navigate('/booking')}
              className="profile-btn-primary"
              style={{ marginTop: 16 }}
            >
              📝 Tạo đặt lịch mới
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {/* Sort Buttons */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <button
                onClick={() => setSortBy('status')}
                className={`profile-btn-secondary${sortBy === 'status' ? ' profile-btn-active' : ''}`}
                style={{
                  fontSize: 13,
                  padding: '8px 16px',
                  fontWeight: 600,
                  background: sortBy === 'status' ? (localTheme === 'dark' ? '#1e293b' : '#f1f5f9') : undefined,
                  border: sortBy === 'status' ? '1.5px solid #0ea5e9' : undefined,
                  color: sortBy === 'status' ? '#0ea5e9' : undefined,
                }}
                type="button"
              >
                Sắp xếp theo trạng thái
              </button>
              <button
                onClick={() => setSortBy('date')}
                className={`profile-btn-secondary${sortBy === 'date' ? ' profile-btn-active' : ''}`}
                style={{
                  fontSize: 13,
                  padding: '8px 16px',
                  fontWeight: 600,
                  background: sortBy === 'date' ? (localTheme === 'dark' ? '#1e293b' : '#f1f5f9') : undefined,
                  border: sortBy === 'date' ? '1.5px solid #0ea5e9' : undefined,
                  color: sortBy === 'date' ? '#0ea5e9' : undefined,
                }}
                type="button"
              >
                Sắp xếp theo ngày tạo
              </button>
            </div>

            <div className="liquid-glass" style={{ padding: '12px 20px' }}>
              <p style={{ fontSize: '14px', color: localTheme === 'dark' ? '#94a3b8' : '#64748b', margin: 0 }}>
                📊 Hiển thị {sortedForms.length} đặt lịch của bạn
              </p>
            </div>
            {sortedForms.map((form, index) => (
              <div
                key={form.formId || form.id || `form-${index}`}
                className="profile-card"
                onClick={() => {
                  setSelectedForm(form);
                  fetchFormDetail(form.formId || form.id);
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700 }}>
                      {form.title || 'Không có tiêu đề'}
                    </h4>
                    <p style={{ margin: '4px 0', fontSize: '14px', color: localTheme === 'dark' ? '#d1d5db' : '#64748b', lineHeight: 1.5 }}>
                      {form.description || 'Không có mô tả'}
                    </p>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: localTheme === 'dark' ? '#9ca3af' : '#6b7280', flexWrap: 'wrap', marginTop: 8 }}>
                      <span>📅 {form.date ? formatDateTime(form.date) : 'Chưa có ngày'}</span>
                    </div>
                  </div>
                  <div className="profile-badge" style={{
                    background: form.status === 'Completed' ? '#10b981' :
                      form.status === 'Pending' ? '#f59e0b' :
                        form.status === 'Approved' ? '#10b981' : // Đổi màu Approved thành xanh lá cây
                          form.status === 'Rejected' ? '#ef4444' :
                            form.status === 'Deleted' ? '#6b7280' : '#3b82f6',
                    color: 'white'
                  }}>
                    {form.status || 'Chưa xác định'}
                  </div>
                </div>

                {/* POPUP CHI TIẾT FORM - ENHANCED VERSION */}
                {selectedForm && (selectedForm.formId || selectedForm.id) === (form.formId || form.id) && (
                  <div className="liquid-glass" style={{
                    marginTop: '20px',
                    padding: '20px',
                  }}>
                    {loadingFormDetail ? (
                      <div className="profile-loading-state">
                        <p>⏳ Đang tải chi tiết...</p>
                      </div>
                    ) : formDetail ? (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <h5 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
                            📄 Chi tiết đặt lịch
                          </h5>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedForm(null);
                              setFormDetail(null);
                            }}
                            className="profile-btn"
                            style={{ padding: '6px 12px', fontSize: '16px' }}
                          >
                            ✕
                          </button>
                        </div>

                        <div style={{ display: 'grid', gap: '12px', fontSize: '14px' }}>
                          {/* Thông tin mới - Ngày bắt đầu và cập nhật */}
                          <div><strong>🕐 Ngày tạo:</strong> {formatDateTime(formDetail.startDate)}</div>
                          <div><strong>🔄 Cập nhật lần cuối:</strong> {formatDateTime(formDetail.updateDate)}</div>
                          <div><strong>📅 Ngày đặt lịch:</strong> {formatDateTime(formDetail.date)}</div>

                          {/* Thông tin VIN */}
                          <div><strong>🚗 VIN:</strong> {formDetail.vin || 'N/A'}</div>

                          {/* Thông tin trạm - ĐÃ THÊM */}
                          <div><strong>🏢 Trạm:</strong> {formDetail.stationName || 'N/A'}</div>
                          <div><strong>📍 Địa chỉ trạm:</strong> {formDetail.stationLocation || 'N/A'}</div>

                          <div><strong>📝 Tiêu đề:</strong> {formDetail.title || 'N/A'}</div>
                          <div><strong>📋 Mô tả:</strong> {formDetail.description || 'N/A'}</div>

                          <div>
                            <strong>🔋 Thông tin Pin:</strong>
                            {formDetail.batteryId ? (
                              <div style={{ marginTop: '8px', padding: '12px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '8px' }}>
                                {formDetail.batteryDetail ? (
                                  <>
                                    <div><strong>Tên Pin:</strong> {formDetail.batteryDetail.batteryName || 'N/A'}</div>
                                    <div><strong>Loại Pin:</strong> {formDetail.batteryDetail.batteryType || 'N/A'}</div>
                                    <div><strong>Dung lượng:</strong> {formDetail.batteryDetail.capacity || 'N/A'}</div>
                                    <div><strong>Thông số kỹ thuật:</strong> {formDetail.batteryDetail.specification || 'N/A'}</div>
                                    <div><strong>Chất lượng Pin:</strong> {formDetail.batteryDetail.batteryQuality || 'N/A'}%</div>
                                  </>
                                ) : (
                                  <div>Đang tải thông tin pin...</div>
                                )}
                              </div>
                            ) : (
                              <span style={{ marginLeft: '8px', opacity: 0.7 }}>Không có thông tin pin</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="profile-error-state">
                        ❌ Không thể tải chi tiết đặt lịch
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderVehiclesModal = () => {
    if (!showVehiclesModal) return null;

    return (
      <div className="profile-modal-overlay" onClick={() => setShowVehiclesModal(false)}>
        <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              🚗 Danh sách xe của bạn
            </h3>
            <button
              onClick={() => setShowVehiclesModal(false)}
              className="profile-btn"
              style={{ padding: '6px 12px', fontSize: '16px' }}
            >
              ✕
            </button>
          </div>

          {loadingVehicles ? (
            <div className="profile-loading-state">
              <p>⏳ Đang tải danh sách xe...</p>
            </div>
          ) : vehiclesError ? (
            <div className="profile-error-state">
              <p>❌ {vehiclesError}</p>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="profile-empty">
              <p>📭 Bạn chưa có xe nào trong tài khoản.</p>
              <button
                onClick={() => navigate('/vehicles')}
                className="profile-btn-primary"
                style={{ marginTop: '12px' }}
              >
                🚗 Thêm xe mới
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {vehicles.map((vehicle, index) => (
                <div
                  key={vehicle.vehicleId || `vehicle-${index}`}
                  className="profile-card"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700' }}>
                        {vehicle.vehicleName || 'Chưa đặt tên'}
                      </h4>
                      <div style={{ display: 'grid', gap: '6px', fontSize: '14px' }}>
                        <div><strong>🔢 VIN:</strong> {vehicle.vin || 'Chưa có'}</div>
                        <div><strong>🚙 Loại xe:</strong> {vehicle.vehicleType || 'Chưa xác định'}</div>
                        {vehicle.packageName && (
                          <div><strong>📦 Gói dịch vụ:</strong> {vehicle.packageName}</div>
                        )}
                      </div>
                    </div>
                    <div className="profile-badge" style={{
                      background: vehicle.status === 'Active' ? '#10b981' :
                        vehicle.status === 'Inactive' ? '#6b7280' :
                          vehicle.status === 'Maintenance' ? '#f59e0b' : '#6b7280',
                      color: 'white'
                    }}>
                      {vehicle.status || 'Unknown'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', gap: '12px' }}>
            <button
              onClick={() => setShowVehiclesModal(false)}
              className="profile-btn"
              style={{ padding: '10px 20px' }}
            >
              Đóng
            </button>
            <button
              onClick={() => navigate('/vehicles')}
              className="profile-btn-primary"
              style={{ padding: '10px 20px' }}
            >
              🚗 Thêm xe mới
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${localTheme === 'dark'
      ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white'
      : 'bg-gradient-to-br from-blue-50 via-white to-green-50 text-gray-900'}`}
      style={scrollStyles}>

      {/* Hidden file input for avatar upload */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/*"
        onChange={handleFileChange}
      />

      {/* Sticky Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50 }}>
        <Header
          onToggleTheme={handleToggleTheme}
          theme={localTheme}
          user={user}
          unreadCount={0}
          nextBooking={null}
          onOpenBooking={() => navigate('/booking')}
        />
      </div>

      {/* Main Profile Content */}
      <div className={`profile-container${localTheme === "dark" ? " dark" : ""}`}>
        {/* Sidebar */}
        <div className="profile-sidebar">
          {sidebarItems.map((item) => (
            <button
              key={item.key}
              className={`profile-sidebar-btn${activeSidebar === item.key ? " active" : ""}${item.isHome ? " profile-home-btn" : ""}`}
              onClick={item.onClick}
              type="button"
            >
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="profile-main-content">
          {activeSidebar === "profile" && (
            <div className="profile-scroll-area">
              {/* Profile Header */}
              <div className="profile-header">
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img
                    className="profile-avatar"
                    src={isUploadingAvatar ?
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='40' fill='%2338bdf8' opacity='0.7'/%3E%3Ctext x='50' y='55' text-anchor='middle' fill='white' font-size='14'%3E⏳%3C/text%3E%3C/svg%3E"
                      : avatarUrl}
                    alt="avatar"
                    onClick={handleAvatarClick}
                    style={{
                      cursor: isUploadingAvatar ? 'wait' : 'pointer',
                      opacity: isUploadingAvatar ? 0.7 : 1
                    }}
                  />
                  {isUploadingAvatar && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      background: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      Đang tải lên...
                    </div>
                  )}
                </div>
                <div className="profile-info" style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div className="profile-name" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        {editMode ? (
                          <form onSubmit={handleEditSave} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <input
                              type="text"
                              name="name"
                              value={editData.name}
                              onChange={handleEditChange}
                              className="profile-edit-input"
                              placeholder="Tên"
                              disabled={editLoading}
                              required
                              style={{ minWidth: 120 }}
                            />
                            <div style={{ display: "flex", gap: 4 }}>
                              <button
                                className="profile-btn"
                                title="Lưu"
                                type="submit"
                                disabled={editLoading}
                                style={{ padding: '6px 12px' }}
                              >
                                {editLoading ? '⏳' : '💾'}
                              </button>
                              <button
                                className="profile-btn"
                                title="Hủy"
                                type="button"
                                onClick={handleEditCancel}
                                disabled={editLoading}
                                style={{ padding: '6px 12px', background: localTheme === "dark" ? "#ef444422" : "#fef2f2", color: "#ef4444" }}
                              >
                                ✖️
                              </button>
                            </div>
                          </form>
                        ) : (
                          <>
                            {name}
                            <button
                              className="profile-btn"
                              title="Chỉnh sửa hồ sơ"
                              onClick={() => setEditMode(true)}
                              type="button"
                              style={{ padding: '6px 12px' }}
                            >
                              ✏️
                            </button>
                          </>
                        )}
                      </div>
                      <div className="profile-username" style={{ marginTop: 4 }}>
                        {editMode ? (
                          <input
                            type="email"
                            name="email"
                            value={editData.email}
                            onChange={handleEditChange}
                            className="profile-edit-input"
                            placeholder="Email"
                            disabled={editLoading}
                            required
                            style={{ width: '100%', maxWidth: 300 }}
                          />
                        ) : (
                          email
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      {editMode ? (
                        <>
                          <input
                            type="text"
                            name="phone"
                            value={editData.phone}
                            onChange={handleEditChange}
                            className="profile-edit-input"
                            placeholder="Số điện thoại"
                            disabled={editLoading}
                            required
                            style={{ width: '100%', marginBottom: 8 }}
                          />
                          <input
                            type="text"
                            name="address"
                            value={editData.address}
                            onChange={handleEditChange}
                            className="profile-edit-input"
                            placeholder="Địa chỉ"
                            disabled={editLoading}
                            required
                            style={{ width: '100%' }}
                          />
                        </>
                      ) : (
                        <>
                          <div style={{ fontWeight: 600, fontSize: 16 }}>{phone}</div>
                          <div style={{ fontSize: 14, opacity: 0.8, marginTop: 4 }}>{address}</div>
                        </>
                      )}
                    </div>
                  </div>
                  {editMode && editError && (
                    <div style={{ color: "#ef4444", fontSize: 14, marginTop: 12, padding: '8px 12px', background: '#fef2f2', borderRadius: 8 }}>
                      {editError}
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Details */}
              <div className="profile-details">
                <div className="profile-section">
                  <div className="profile-section-title">👤 Thông tin Tài xế</div>
                  <div className="profile-section-content">
                    <div><span style={{ fontWeight: 600 }}>Mã khách hàng:</span> {customerId}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600 }}>Quản lý xe:</span>
                      <button
                        onClick={handleShowVehicles}
                        className="profile-btn-primary"
                        style={{ fontSize: '14px', padding: '8px 16px' }}
                      >
                        🚗 Hiển thị tất cả xe của bạn
                      </button>
                    </div>
                  </div>
                </div>

                <div className="profile-section">
                  <div className="profile-section-title">📊 Thống kê</div>
                  <div className="profile-section-content" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                    <div className="liquid-glass" style={{ padding: 16, textAlign: 'center' }}>
                      <div style={{ fontSize: 24, fontWeight: 700, color: '#3b82f6' }}>
                        {loadingStats ? '⏳' : exchangeBatteriesCount}
                      </div>
                      <div style={{ fontSize: 14, opacity: 0.8 }}>Pin đã trao đổi</div>
                    </div>
                    <div className="liquid-glass" style={{ padding: 16, textAlign: 'center' }}>
                      <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>{count(forms)}</div>
                      <div style={{ fontSize: 14, opacity: 0.8 }}>Đơn đặt lịch</div>
                    </div>
                    <div className="liquid-glass" style={{ padding: 16, textAlign: 'center' }}>
                      <div style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b' }}>
                        {loadingStats ? '⏳' : ordersCount}
                      </div>
                      <div style={{ fontSize: 14, opacity: 0.8 }}>Đơn hàng</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSidebar === "bookingHistory" && renderBookingHistory()}

          {/* INTEGRATED HistoryOrder Component */}
          {activeSidebar === "paymentHistory" && <HistoryOrder user={user} theme={localTheme} />}

          {activeSidebar === "changePassword" && (
            <div style={{ padding: isMobile ? 16 : 24 }}>
              <div className="liquid-glass" style={{ padding: 20, marginBottom: 20 }}>
                <h3 style={{ fontWeight: 700, fontSize: 20, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                  🔒 Đổi mật khẩu
                </h3>
              </div>

              <form onSubmit={handlePasswordSubmit} className="liquid-glass" style={{ padding: 24 }}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
                    Mật khẩu hiện tại
                  </label>
                  <input
                    type="password"
                    name="oldPassword"
                    value={passwordData.oldPassword}
                    onChange={handlePasswordChange}
                    className="profile-edit-input"
                    placeholder="Nhập mật khẩu hiện tại"
                    disabled={passwordLoading}
                    required
                    style={{ width: "100%" }}
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
                    Mật khẩu mới
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="profile-edit-input"
                    placeholder="Nhập mật khẩu mới"
                    disabled={passwordLoading}
                    required
                    style={{ width: "100%" }}
                  />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
                    Xác nhận mật khẩu mới
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="profile-edit-input"
                    placeholder="Nhập lại mật khẩu mới"
                    disabled={passwordLoading}
                    required
                    style={{ width: "100%" }}
                  />
                </div>

                {passwordError && (
                  <div style={{ color: "#ef4444", fontSize: 14, padding: '12px', background: '#fef2f2', borderRadius: 8, marginBottom: 16 }}>
                    ❌ {passwordError}
                  </div>
                )}
                {passwordSuccess && (
                  <div style={{ color: "#10b981", fontSize: 14, padding: '12px', background: '#f0fdf4', borderRadius: 8, marginBottom: 16 }}>
                    ✅ {passwordSuccess}
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setActiveSidebar("profile")}
                    className="profile-btn"
                    style={{ padding: '10px 20px' }}
                    disabled={passwordLoading}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="profile-btn-primary"
                    style={{ padding: '10px 20px' }}
                    disabled={passwordLoading}
                  >
                    {passwordLoading ? "⏳ Đang xử lý..." : "💾 Lưu mật khẩu"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {renderVehiclesModal()}
      </div>

      {/* Footer */}
      <Footer theme={localTheme} />
    </div>
  );
}

export default Profile;