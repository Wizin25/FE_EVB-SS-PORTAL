import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './home.css';

export default function Header({
  onToggleTheme, theme,
  user, unreadCount, nextBooking,
  onOpenBooking
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (!document.getElementById('account-dropdown-root')?.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Avatar URL logic giống như trong Profile
  const avatarUrl = user?.avatar 
    ? user.avatar 
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "U")}&background=2563eb&color=fff&size=128`;

  return (
    <header className="app-header">
      <div className="left">
        <a href="/home" className="logo"> 
          <img src="https://res.cloudinary.com/dzht29nkq/image/upload/v1758274139/SwapX_1_-Photoroom_wvmglm.png" alt="SwapX" style={{height:36}}/>
        </a>
        <nav className="main-nav">
          <a href="/stations" className="LiquidGlass">Trạm</a>
          <button className="cta LiquidGlass" onClick={onOpenBooking}>Đặt lịch</button>
          <a href="/plans" className="LiquidGlass">Gói dịch vụ</a>
          <a href="/vehicles" className="LiquidGlass">Phương tiện</a>
          <a href="/payments" className="LiquidGlass">Thanh toán</a>
          <a href="/contact" className="LiquidGlass">Hỗ trợ</a>
        </nav>
      </div>

      <div className="right">
        <button aria-label="Toggle theme" onClick={onToggleTheme}>
          {theme === 'dark' ? '🌙' : '☀️'}
        </button>

        <div className="notif" title={`${unreadCount} thông báo`}>
          <a href="/notifications">🔔{unreadCount>0 && <span className="badge">{unreadCount}</span>}</a>
        </div>

        {/* Account Dropdown */}
        <div
          className={`account-dropdown${open ? " open" : ""}`}
          id="account-dropdown-root"
        >
          <img
            src={avatarUrl}
            alt="avatar"
            className="avatar"
            tabIndex={0}
            onClick={() => setOpen((v) => !v)}
            style={{ 
              cursor: 'pointer',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              objectFit: 'cover'
            }}
          />
          {open && (
            <div className="dropdown">
              <button 
                type="button" 
                onMouseDown={e => e.preventDefault()} 
                onClick={() => { navigate('/profile'); setOpen(false); }}
              >
                Hồ sơ
              </button>
              <button
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={() => { navigate('/my-bookings'); setOpen(false); }}
              >
                Lịch của tôi
              </button>
              <button
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={() => { 
                  navigate('/profile', { state: { setActiveSidebar: 'paymentHistory' } }); 
                  setOpen(false); 
                }}
              >
                Lịch sử thanh toán
              </button>
              <button
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={() => {
                  localStorage.removeItem("authToken");
                  navigate('/signin');
                  setOpen(false);
                }}
              >
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}