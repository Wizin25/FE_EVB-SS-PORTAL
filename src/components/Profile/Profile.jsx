// src/components/Profile.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from '../services/authAPI';
import { formAPI } from '../services/formAPI';
import { isInRole, getUserRoles } from '../services/jwt';
import './ProfileStyle.css';

function Profile({ theme = "light" }) {
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

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState(null);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(null);

  const [activeSidebar, setActiveSidebar] = useState("profile");
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth <= 800 : false);
  const [userRoles, setUserRoles] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
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
        });
        setLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err?.message || "Lỗi khi lấy thông tin tài khoản");
        setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const roles = getUserRoles();
    setUserRoles(roles);
    
    console.log('Current user roles:', roles);
    console.log('Current user:', user);
    
    if (roles.includes('EvDriver') && user) {
      fetchForms();
    }
  }, [user]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 800);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const fetchForms = async () => {
    if (!isInRole('EvDriver') || !user) {
      console.log('User is not EvDriver or user not loaded');
      return;
    }
    
    setLoadingForms(true);
    try {
      // Sử dụng accountId thay vì id
      const accountId = user.accountId || user.id;
      if (!accountId) {
        console.error('No account ID found for user:', user);
        return;
      }

      console.log('Fetching forms for account ID:', accountId);
      const response = await formAPI.getFormsByAccountId(accountId);
      console.log('Forms API response:', response);
      
      // Kiểm tra cấu trúc response
      if (response && response.isSuccess) {
        setForms(response.data || []);
        console.log('Forms loaded successfully:', response.data?.length || 0, 'forms');
      } else {
        console.error('Error fetching forms:', response?.message || 'Unknown error');
        // Có thể hiển thị thông báo lỗi cho user
      }
    } catch (error) {
      console.error('Error fetching forms:', error);
      // Xử lý lỗi, ví dụ: hiển thị thông báo
    } finally {
      setLoadingForms(false);
    }
  };

  const fetchFormDetail = async (formId) => {
    if (!isInRole('EvDriver') || !formId) {
      console.log('Cannot fetch form detail - missing formId or not EvDriver');
      return;
    }
    
    setLoadingFormDetail(true);
    try {
      console.log('Fetching form detail for ID:', formId);
      const response = await formAPI.getFormById(formId);
      console.log('Form detail response:', response);
      
      if (response && response.isSuccess) {
        setFormDetail(response.data);
      } else {
        console.error('Error fetching form detail:', response?.message || 'Unknown error');
      }
    } catch (error) {
      console.error('Error fetching form detail:', error);
    } finally {
      setLoadingFormDetail(false);
    }
  };

  if (loading) {
    return (
      <div className={`profile-loading-state ${theme === "dark" ? "dark" : ""}`}>
        <p>Đang tải thông tin...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`profile-error-state ${theme === "dark" ? "dark" : ""}`}>
        <p>Lỗi: {error}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`profile-empty ${theme === "dark" ? "dark" : ""}`}>
        <p>Chưa đăng nhập</p>
      </div>
    );
  }

  const {
    name = "-",
    phone = "-",
    address = "-",
    email = "-",
    evdrivers = [],
    exchangeBatteries = [],
    orders = [],
    reports = [],
  } = user;

  const ev = Array.isArray(evdrivers) && evdrivers.length > 0 ? evdrivers[0] : null;
  const customerId = ev && typeof ev === "object" ? (ev.customerId ?? "-") : "-";
  const vin = ev && typeof ev === "object" ? (ev.vin ?? "-") : "-";

  const count = (arr) => (Array.isArray(arr) ? arr.length : 0);

  const renderPreview = (arr, labelKey = null) => {
    if (!Array.isArray(arr) || arr.length === 0) {
      return <div className="text-sm opacity-70">Không có</div>;
    }
    return (
      <ul className="p-0 m-0 space-y-1 list-none">
        {arr.slice(0, 3).map((it, idx) => {
          let label;
          if (labelKey) {
            if (it && typeof it === "object" && it[labelKey] !== undefined && it[labelKey] !== null) {
              label = String(it[labelKey]);
            } else {
              label = JSON.stringify(it);
            }
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
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
    setEditError(null);
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError(null);
    try {
      const response = await authAPI.updateProfile({
        name: editData.name,
        phone: editData.phone,
        address: editData.address,
        email: editData.email,
      });
      
      if (response && response.isSuccess) {
        setUser(prev => ({
          ...prev,
          name: editData.name,
          phone: editData.phone,
          address: editData.address,
          email: editData.email
        }));
        setEditMode(false);
      } else {
        throw new Error(response?.message || "Cập nhật thất bại");
      }
    } catch (err) {
      setEditError(err?.message || "Lỗi khi cập nhật hồ sơ");
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditCancel = () => {
    setEditData({
      name: user?.name || "",
      phone: user?.phone || "",
      address: user?.address || "",
      email: user?.email || "",
    });
    setEditError(null);
    setEditMode(false);
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    setPasswordError(null);
    setPasswordSuccess(null);
  };

  const handlePasswordSubmit = async (e) => {
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
      const response = await authAPI.changePassword({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword
      });

      if (response && response.isSuccess) {
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
  };

  const handlePasswordCancel = () => {
    setShowPasswordModal(false);
    setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    setPasswordError(null);
    setPasswordSuccess(null);
  };

  const getSidebarItems = () => {
    const baseItems = [
      { key: "profile", label: "Hồ sơ", icon: "👤", onClick: () => setActiveSidebar("profile") },
    ];

    // Chỉ thêm "Lịch sử Đặt lịch" cho EvDriver
    if (userRoles.includes('EvDriver')) {
      baseItems.push({
        key: "bookingHistory", 
        label: "Lịch sử Đặt lịch", 
        icon: "📋", 
        onClick: () => setActiveSidebar("bookingHistory")
      });
    }

    // Các item khác
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
  };

  const sidebarItems = getSidebarItems();

  const renderBookingHistory = () => {
    if (!userRoles.includes('EvDriver')) {
      return (
        <div style={{ padding: 24, textAlign: 'center' }}>
          <h3 style={{ fontWeight: 600, fontSize: 18, marginBottom: 12 }}>🚫 Truy cập bị từ chối</h3>
          <p>Bạn không có quyền truy cập tính năng này.</p>
        </div>
      );
    }

    return (
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontWeight: 600, fontSize: 18, marginBottom: 0 }}>📋 Lịch sử Đặt lịch của bạn</h3>
          <button
            onClick={fetchForms}
            disabled={loadingForms}
            style={{
              padding: '8px 16px',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loadingForms ? 'not-allowed' : 'pointer',
              fontSize: 14
            }}
          >
            {loadingForms ? 'Đang tải...' : '🔄 Làm mới'}
          </button>
        </div>

        {loadingForms ? (
          <div className="profile-loading-state">
            <p>Đang tải lịch sử đặt lịch...</p>
          </div>
        ) : forms.length === 0 ? (
          <div className="profile-empty">
            <p>Bạn chưa có lịch sử đặt lịch nào.</p>
            <button 
              onClick={() => navigate('/booking')}
              style={{
                marginTop: '12px',
                padding: '10px 20px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: 14
              }}
            >
              📝 Tạo đặt lịch mới
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>
              Hiển thị {forms.length} đặt lịch của bạn
            </p>
            {forms.map((form) => (
              <div
                key={form.id}
                style={{
                  padding: '16px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  background: theme === 'dark' ? '#374151' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
                onClick={() => {
                  setSelectedForm(form);
                  fetchFormDetail(form.id);
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600 }}>
                      {form.title || 'Không có tiêu đề'}
                    </h4>
                    <p style={{ margin: '4px 0', fontSize: '14px', color: theme === 'dark' ? '#d1d5db' : '#64748b' }}>
                      {form.description || 'Không có mô tả'}
                    </p>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: theme === 'dark' ? '#9ca3af' : '#6b7280', flexWrap: 'wrap' }}>
                      <span>📅 {form.date ? new Date(form.date).toLocaleDateString('vi-VN') : 'Chưa có ngày'}</span>
                      <span>🏢 Trạm: {form.stationId || 'Chưa xác định'}</span>
                      <span>🆔 {form.id}</span>
                      {form.status && <span>📊 {form.status}</span>}
                    </div>
                  </div>
                  <div style={{ 
                    padding: '4px 8px', 
                    borderRadius: '12px', 
                    fontSize: '12px',
                    background: form.status === 'Completed' ? '#10b981' : 
                               form.status === 'Pending' ? '#f59e0b' : 
                               form.status === 'Approved' ? '#3b82f6' : 
                               form.status === 'Rejected' ? '#ef4444' : '#6b7280',
                    color: 'white',
                    whiteSpace: 'nowrap'
                  }}>
                    {form.status || 'Chưa xác định'}
                  </div>
                </div>

                {selectedForm && selectedForm.id === form.id && (
                  <div style={{
                    marginTop: '16px',
                    padding: '16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    background: theme === 'dark' ? '#1f2937' : '#f9fafb'
                  }}>
                    {loadingFormDetail ? (
                      <div className="profile-loading-state">
                        <p>Đang tải chi tiết...</p>
                      </div>
                    ) : formDetail ? (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <h5 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                            Chi tiết đặt lịch của bạn
                          </h5>
                          <button
                            onClick={() => setSelectedForm(null)}
                            style={{
                              background: 'none',
                              border: 'none',
                              fontSize: '18px',
                              cursor: 'pointer',
                              color: theme === 'dark' ? '#d1d5db' : '#374151'
                            }}
                          >
                            ✕
                          </button>
                        </div>
                        <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
                          <div><strong>ID:</strong> {formDetail.id}</div>
                          <div><strong>Tiêu đề:</strong> {formDetail.title || 'N/A'}</div>
                          <div><strong>Mô tả:</strong> {formDetail.description || 'N/A'}</div>
                          <div><strong>Ngày đặt lịch:</strong> {formDetail.date ? new Date(formDetail.date).toLocaleDateString('vi-VN') : 'N/A'}</div>
                          <div><strong>Trạm hỗ trợ:</strong> {formDetail.stationId || 'N/A'}</div>
                          <div><strong>Trạng thái:</strong> 
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              marginLeft: '8px',
                              background: formDetail.status === 'Completed' ? '#10b981' : 
                                         formDetail.status === 'Pending' ? '#f59e0b' : 
                                         formDetail.status === 'Approved' ? '#3b82f6' : 
                                         formDetail.status === 'Rejected' ? '#ef4444' : '#6b7280',
                              color: 'white'
                            }}>
                              {formDetail.status || 'N/A'}
                            </span>
                          </div>
                          <div><strong>Ngày tạo:</strong> {formDetail.createdAt ? new Date(formDetail.createdAt).toLocaleDateString('vi-VN') : 'N/A'}</div>
                          {formDetail.updatedAt && (
                            <div><strong>Cập nhật lần cuối:</strong> {new Date(formDetail.updatedAt).toLocaleDateString('vi-VN')}</div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="profile-error-state">
                        Không thể tải chi tiết đặt lịch
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

  const renderPaymentHistory = () => (
    <div style={{ padding: 24 }}>
      <h3 style={{ fontWeight: 600, fontSize: 18, marginBottom: 12 }}>💳 Lịch sử thanh toán</h3>
      {Array.isArray(orders) && orders.length > 0 ? (
        <ul style={{ paddingLeft: 16 }}>
          {orders.map((order, idx) => (
            <li key={order.orderId || idx} style={{ marginBottom: 8 }}>
              <span style={{ fontWeight: 500 }}>Mã đơn:</span> {order.orderId || "-"}<br />
              <span style={{ fontWeight: 500 }}>Số tiền:</span> {order.amount ? `${order.amount}₫` : "-"}
            </li>
          ))}
        </ul>
      ) : (
        <div>Không có lịch sử thanh toán.</div>
      )}
    </div>
  );

  const containerStyle = {
    position: "relative",
    minHeight: "100vh",
    display: "flex",
    flexDirection: isMobile ? "column" : "row",
    width: "100%",
    overflow: "hidden",
  };

  return (
    <div className={`profile-container${theme === "dark" ? " dark" : ""}`} style={containerStyle}>
      <div
        className="profile-sidebar"
        style={{
          width: isMobile ? "100%" : 220,
          background: theme === "dark" ? "#23272f" : "#f0fdfa",
          color: theme === "dark" ? "#e0e7ef" : "#1e293b",
          borderRight: isMobile ? "none" : "1px solid #bae6fd",
          padding: isMobile ? "12px 8px" : "32px 0 0 0",
          minHeight: isMobile ? "auto" : "100vh",
          display: "flex",
          flexDirection: "column",
          gap: 0,
          zIndex: 2,
        }}
      >
        {sidebarItems.map((item) => (
          <button
            key={item.key}
            className={`profile-sidebar-btn${activeSidebar === item.key ? " active" : ""}${item.isHome ? " profile-home-btn" : ""}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              width: "100%",
              padding: isMobile ? "10px 12px" : "14px 24px",
              background: item.isHome 
                ? "linear-gradient(to right, #10b981, #059669)" 
                : activeSidebar === item.key 
                  ? (theme === "dark" ? "#2563eb22" : "#bae6fd") 
                  : "none",
              border: "none",
              borderRight: activeSidebar === item.key && !isMobile && !item.isHome ? "4px solid #2563eb" : "none",
              color: item.isHome 
                ? "white" 
                : activeSidebar === item.key 
                  ? (theme === "dark" ? "#38bdf8" : "#2563eb") 
                  : (theme === "dark" ? "#e0e7ef" : "#1e293b"),
              fontWeight: activeSidebar === item.key || item.isHome ? 600 : 500,
              fontSize: 16,
              cursor: "pointer",
              outline: "none",
              transition: item.isHome ? "all 0.3s" : "background 0.2s",
              textAlign: "left",
              marginTop: item.isHome ? "auto" : "0",
              marginBottom: item.isHome && isMobile ? "16px" : item.isHome ? "32px" : "0",
              boxShadow: item.isHome ? "0 4px 12px 0 rgba(16, 185, 129, 0.3)" : "none",
            }}
            onClick={item.onClick}
            type="button"
            onMouseEnter={(e) => {
              if (item.isHome) {
                e.target.style.background = "linear-gradient(to right, #059669, #047857)";
                e.target.style.transform = "translateY(-2px) scale(1.05)";
                e.target.style.boxShadow = "0 6px 20px 0 rgba(5, 150, 105, 0.4)";
              }
            }}
            onMouseLeave={(e) => {
              if (item.isHome) {
                e.target.style.background = "linear-gradient(to right, #10b981, #059669)";
                e.target.style.transform = "translateY(0) scale(1)";
                e.target.style.boxShadow = "0 4px 12px 0 rgba(16, 185, 129, 0.3)";
              }
            }}
          >
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      <div
        className="profile-main-content"
        style={{
          flex: 1,
          overflowY: "auto",
          minHeight: "100vh",
          background: theme === "dark" ? "#1f2937" : "#ffffff",
          zIndex: 1,
        }}
      >
        {activeSidebar === "profile" && (
          <div
            className="profile-scroll-area"
            style={{
              padding: isMobile ? 12 : 24,
              minHeight: "100%",
              boxSizing: "border-box",
            }}
          >
            <div className="profile-header" style={{ marginBottom: 24 }}>
              <img
                className="profile-avatar"
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name || "U")}&background=2563eb&color=fff&size=128`}
                alt="avatar"
              />
              <div className="profile-info" style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div className="profile-name" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {editMode ? (
                        <form onSubmit={handleEditSave} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <input
                            type="text"
                            name="name"
                            value={editData.name}
                            onChange={handleEditChange}
                            className="profile-edit-input"
                            style={{ fontWeight: 600, fontSize: 18, borderRadius: 6, border: "1px solid #bae6fd", padding: "2px 8px", minWidth: 80 }}
                            placeholder="Tên"
                            disabled={editLoading}
                            required
                          />
                          <button
                            className="profile-btn"
                            style={{
                              fontSize: 14,
                              padding: "2px 8px",
                              marginLeft: 4,
                              borderRadius: 6,
                              border: "1px solid #bae6fd",
                              background: theme === "dark" ? "#23272f" : "#f0fdfa",
                              color: theme === "dark" ? "#38bdf8" : "#2563eb",
                              cursor: "pointer"
                            }}
                            title="Lưu"
                            type="submit"
                            disabled={editLoading}
                          >
                            💾
                          </button>
                          <button
                            className="profile-btn"
                            style={{
                              fontSize: 14,
                              padding: "2px 8px",
                              marginLeft: 2,
                              borderRadius: 6,
                              border: "1px solid #bae6fd",
                              background: theme === "dark" ? "#23272f" : "#f0fdfa",
                              color: theme === "dark" ? "#f87171" : "#ef4444",
                              cursor: "pointer"
                            }}
                            title="Hủy"
                            type="button"
                            onClick={handleEditCancel}
                            disabled={editLoading}
                          >
                            ✖️
                          </button>
                        </form>
                      ) : (
                        <>
                          {name}
                          <button
                            className="profile-btn"
                            style={{
                              fontSize: 14,
                              padding: "2px 8px",
                              marginLeft: 4,
                              borderRadius: 6,
                              border: "1px solid #bae6fd",
                              background: theme === "dark" ? "#23272f" : "#f0fdfa",
                              color: theme === "dark" ? "#38bdf8" : "#2563eb",
                              cursor: "pointer"
                            }}
                            title="Chỉnh sửa hồ sơ"
                            onClick={() => setEditMode(true)}
                            type="button"
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
                          style={{ fontSize: 14, borderRadius: 6, border: "1px solid #bae6fd", padding: "2px 8px", minWidth: 120 }}
                          placeholder="Email"
                          disabled={editLoading}
                          required
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
                          style={{ fontWeight: 500, fontSize: 14, borderRadius: 6, border: "1px solid #bae6fd", padding: "2px 8px", minWidth: 80, marginBottom: 4 }}
                          placeholder="Số điện thoại"
                          disabled={editLoading}
                          required
                        />
                        <br />
                        <input
                          type="text"
                          name="address"
                          value={editData.address}
                          onChange={handleEditChange}
                          className="profile-edit-input"
                          style={{ fontSize: 12, borderRadius: 6, border: "1px solid #bae6fd", padding: "2px 8px", minWidth: 120 }}
                          placeholder="Địa chỉ"
                          disabled={editLoading}
                          required
                        />
                      </>
                    ) : (
                      <>
                        <div style={{ fontWeight: 500 }}>{phone}</div>
                        <div style={{ fontSize: 12, opacity: 0.7 }}>{address}</div>
                      </>
                    )}
                  </div>
                </div>
                {editMode && editError && (<div style={{ color: "#ef4444", fontSize: 13, marginTop: 6 }}>{editError}</div>)}
                {editMode && editLoading && (<div style={{ color: "#2563eb", fontSize: 13, marginTop: 6 }}>Đang lưu...</div>)}
              </div>
            </div>

            <div className="profile-details" style={{ marginTop: 8 }}>
              <div className="profile-section">
                <div className="profile-section-title">EvDriver</div>
                <div className="profile-section-content">
                  <div><span style={{ fontWeight: 500 }}>customerId:</span> {customerId}</div>
                  <div><span style={{ fontWeight: 500 }}>vin:</span> {vin}</div>
                </div>
              </div>

              <div className="profile-section">
                <div className="profile-section-title">Counts</div>
                <div className="profile-section-content">
                  <div>ExchangeBatteries: <span style={{ fontWeight: 500 }}>{count(exchangeBatteries)}</span></div>
                  <div>Forms: <span style={{ fontWeight: 500 }}>{count(forms)}</span></div>
                  <div>Orders: <span style={{ fontWeight: 500 }}>{count(orders)}</span></div>
                  <div>Reports: <span style={{ fontWeight: 500 }}>{count(reports)}</span></div>
                </div>
              </div>

              <div className="profile-section">
                <div className="profile-section-title">Preview Lists</div>
                <div className="profile-section-content" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, 1fr)", gap: 16, maxWidth: "100%", overflowX: "auto" }}>
                  <div>
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>ExchangeBatteries</div>
                    {renderPreview(exchangeBatteries, "id")}
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>Forms</div>
                    {renderPreview(forms.slice(0, 3), "title")}
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>Orders</div>
                    {renderPreview(orders, "orderId")}
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>Reports</div>
                    {renderPreview(reports, "id")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSidebar === "bookingHistory" && renderBookingHistory()}
        {activeSidebar === "paymentHistory" && renderPaymentHistory()}
        {activeSidebar === "changePassword" && (
          <div style={{ padding: 24 }}>
            <h3 style={{ fontWeight: 600, fontSize: 18, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>🔒 Đổi mật khẩu</h3>
            <form onSubmit={handlePasswordSubmit}>
              <div style={{ marginBottom: 10 }}>
                <label style={{ display: "block", fontSize: 14, marginBottom: 2 }}>Mật khẩu hiện tại</label>
                <input type="password" name="oldPassword" value={passwordData.oldPassword} onChange={handlePasswordChange}
                  className="profile-edit-input" style={{ width: "100%", borderRadius: 6, border: "1px solid #bae6fd", padding: "6px 8px" }}
                  placeholder="Nhập mật khẩu hiện tại" disabled={passwordLoading} required />
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={{ display: "block", fontSize: 14, marginBottom: 2 }}>Mật khẩu mới</label>
                <input type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange}
                  className="profile-edit-input" style={{ width: "100%", borderRadius: 6, border: "1px solid #bae6fd", padding: "6px 8px" }}
                  placeholder="Nhập mật khẩu mới" disabled={passwordLoading} required />
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={{ display: "block", fontSize: 14, marginBottom: 2 }}>Xác nhận mật khẩu mới</label>
                <input type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange}
                  className="profile-edit-input" style={{ width: "100%", borderRadius: 6, border: "1px solid #bae6fd", padding: "6px 8px" }}
                  placeholder="Nhập lại mật khẩu mới" disabled={passwordLoading} required />
              </div>
              {passwordError && (<div style={{ color: "#ef4444", fontSize: 13, marginBottom: 8 }}>{passwordError}</div>)}
              {passwordSuccess && (<div style={{ color: "#22c55e", fontSize: 13, marginBottom: 8 }}>{passwordSuccess}</div>)}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                <button className="profile-btn" type="button" onClick={() => { setActiveSidebar("profile"); handlePasswordCancel(); }}
                  style={{ borderRadius: 6, border: "1px solid #bae6fd", background: theme === "dark" ? "#23272f" : "#f0fdfa", color: theme === "dark" ? "#f87171" : "#ef4444", padding: "6px 16px", fontWeight: 500, cursor: "pointer" }}
                  disabled={passwordLoading}
                >
                  Hủy
                </button>
                <button className="profile-btn" type="submit" style={{ borderRadius: 6, border: "1px solid #bae6fd", background: theme === "dark" ? "#23272f" : "#f0fdfa", color: theme === "dark" ? "#38bdf8" : "#2563eb", padding: "6px 16px", fontWeight: 500, cursor: "pointer" }} disabled={passwordLoading}>
                  {passwordLoading ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;