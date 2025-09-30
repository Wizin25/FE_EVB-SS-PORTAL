// src/components/Profile.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from '../services/authAPI';
import './ProfileStyle.css';

function Profile({ theme = "light" }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [editError, setEditError] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

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

  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    authAPI.getCurrent()
      .then((data) => {
        if (!mounted) return;
        // authAPI.getCurrent có thể trả wrapper hoặc data trực tiếp
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

  // responsive handler: cập nhật isMobile khi resize
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 800);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (loading) {
    return (
      <div className={`rounded-lg p-4 ${theme === "dark" ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"} border`}>
        <p className="text-sm">Đang tải thông tin...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-lg p-4 ${theme === "dark" ? "bg-gray-800 text-red-300" : "bg-white text-red-600"} border`}>
        <p className="text-sm">Lỗi: {error}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`rounded-lg p-4 ${theme === "dark" ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"} border`}>
        <p className="text-sm">Chưa đăng nhập</p>
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
    forms = [],
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
      // Gọi API update profile
      const response = await authAPI.updateProfile({
        name: editData.name,
        phone: editData.phone,
        address: editData.address,
        email: editData.email,
      });
      
      // Kiểm tra response và cập nhật state
      if (response && response.isSuccess) {
        // Cập nhật user data với dữ liệu mới
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
    // Gọi API change password với đủ 3 trường
    const response = await authAPI.changePassword({
      oldPassword: passwordData.oldPassword,
      newPassword: passwordData.newPassword,
      confirmPassword: passwordData.confirmPassword  // THÊM TRƯỜNG NÀY
    });

    // Kiểm tra response
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

  // Cập nhật sidebarItems với nút trở về trang chủ thay vì đăng xuất
  const sidebarItems = [
    { key: "profile", label: "Hồ sơ", icon: "👤", onClick: () => setActiveSidebar("profile") },
    { key: "bookHistory", label: "Lịch sử Book lịch", icon: "📅", onClick: () => setActiveSidebar("bookHistory") },
    { key: "paymentHistory", label: "Lịch sử thanh toán", icon: "💳", onClick: () => setActiveSidebar("paymentHistory") },
    { key: "changePassword", label: "Thay đổi mật khẩu", icon: "🔒", onClick: () => setActiveSidebar("changePassword") },
    { 
      key: "home", 
      label: "Trở về trang chủ", 
      icon: "🏠", 
      onClick: () => navigate('/home'),
      isHome: true // Thêm flag để style riêng
    },
  ];

  const renderBookHistory = () => (
    <div style={{ padding: 24 }}>
      <h3 style={{ fontWeight: 600, fontSize: 18, marginBottom: 12 }}>📅 Lịch sử Book lịch</h3>
      {Array.isArray(orders) && orders.length > 0 ? (
        <ul style={{ paddingLeft: 16 }}>
          {orders.map((order, idx) => (
            <li key={order.orderId || idx} style={{ marginBottom: 8 }}>
              <span style={{ fontWeight: 500 }}>Mã đơn:</span> {order.orderId || "-"}<br />
              <span style={{ fontWeight: 500 }}>Ngày:</span> {order.date || "-"}
            </li>
          ))}
        </ul>
      ) : (
        <div>Không có lịch sử đặt lịch.</div>
      )}
    </div>
  );

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

  // NOTE: set flexDirection based on isMobile so layout shows sidebar + main correctly
  const containerStyle = {
    position: "relative",
    minHeight: "100vh",
    display: "flex",
    flexDirection: isMobile ? "column" : "row", // <-- FIX: enforce row on desktop, column on mobile
    width: "100%",
    overflow: "hidden",
  };

  return (
    <div className={`profile-container${theme === "dark" ? " dark" : ""}`} style={containerStyle}>
      {/* Sidebar */}
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

      {/* Main content */}
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
                    {renderPreview(forms, "id")}
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

        {activeSidebar === "bookHistory" && renderBookHistory()}
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