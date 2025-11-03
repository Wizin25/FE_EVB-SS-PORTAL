import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './home.css';
import { authAPI } from '../services/authAPI';

export default function Header({
  onToggleTheme, theme,
  user, unreadCount, nextBooking,
  onOpenBooking
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(user || null);
  const [avatar, setAvatar] = useState(() => (user?.avatar || localStorage.getItem('avatarUrl') || null));

  const handleOpenBooking = () => {
    if (typeof onOpenBooking === 'function') {
      try { onOpenBooking(); } catch {}
    } else {
      navigate('/booking');
    }
  };

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

  // Sync avatar từ props/localStorage và fetch current user nếu cần
  useEffect(() => {
    if (user && user !== currentUser) {
      setCurrentUser(user);
      if (user.avatar) {
        setAvatar(user.avatar);
        try { localStorage.setItem('avatarUrl', user.avatar); } catch {}
      }
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!avatar) {
      const stored = localStorage.getItem('avatarUrl');
      if (stored) setAvatar(stored);
    }

    const onStorage = (e) => {
      if (e.key === 'avatarUrl') {
        setAvatar(e.newValue);
      }
    };
    const onAvatarUpdated = (e) => {
      const url = e?.detail;
      if (url) setAvatar(url);
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('avatar-updated', onAvatarUpdated);

    const ensureUser = async () => {
      if (!currentUser && localStorage.getItem('authToken')) {
        try {
          const res = await authAPI.getCurrent();
          const u = res?.data ?? res;
          setCurrentUser(u);
          if (u?.avatar) {
            setAvatar(u.avatar);
            try { localStorage.setItem('avatarUrl', u.avatar); } catch {}
          }
        } catch {}
      }
    };
    ensureUser();

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('avatar-updated', onAvatarUpdated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Avatar URL logic
  const avatarUrl = avatar
    ? avatar
    : `https://ui-avatars.com/api/?name=${encodeURIComponent((currentUser?.name || user?.name || "U"))}&background=2563eb&color=fff&size=128`;

  return (
    <>
      {/* SVG filter LiquidGlass (ẩn) */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <filter id="liquidGlass" x="-20%" y="-20%" width="150%" height="150%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="2" seed="8" result="noise" />
            <feGaussianBlur in="noise" stdDeviation="2" result="map" />
            <feDisplacementMap in="SourceGraphic" in2="map" scale="80" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {/* Thêm class 'liquid' + dark toggle */}
      <header className={`app-header liquid ${theme === 'dark' ? 'dark' : ''}`}>
        <div className="left">
          <a href="/home" className="logo">
            <img
              src="https://res.cloudinary.com/dzht29nkq/image/upload/v1758274139/SwapX_1_-Photoroom_wvmglm.png"
              alt="SwapX"
              style={{ height: 36 }}
            />
          </a>
          <nav className="main-nav">
            <a href="/stations" className="liquid">Trạm</a>
            <button className="cta liquid" onClick={handleOpenBooking}>Đặt lịch</button>
            <a href="/plans" className="liquid">Gói dịch vụ</a>
            <a href="/vehicles" className="liquid">Phương tiện</a>
            <a href="/contact" className="liquid">Hỗ trợ</a>
          </nav>
        </div>
        
        <div className="right">
          <button aria-label="Toggle theme" onClick={onToggleTheme}>
            {theme === 'dark' ? '🌙' : '☀️'}
          </button>

          <div className="notif" title={`${unreadCount} thông báo`}>
            <a href="/notifications">' '{unreadCount>0 && <span className="badge">{unreadCount}</span>}</a>
          </div>
        </div>
      </header>

      {/* Account Dropdown OUTSIDE the header */}
      <div
        className={`account-dropdown${open ? " open" : ""}`}
        id="account-dropdown-root"
        style={{ 
          position: 'fixed',
          top: 20,
          right: 36,
          zIndex: 10001
        }}
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
            objectFit: 'cover',
            boxShadow: '0 2px 10px rgba(0,0,0,0.12)'
          }}
        />
        {open && (
          <div 
            className="dropdown"
            style={{
              zIndex: 10001,
              position: 'absolute',
              right: 0,
              marginTop: 12,
              minWidth: 240,
              background: theme === 'dark'
                ? 'linear-gradient(135deg, #222941 65%, #334155 100%)'
                : 'linear-gradient(135deg, #f0faff 60%, #ffffff 100%)',
              borderRadius: 18,
              boxShadow: theme === 'dark'
                ? '0 8px 32px 0 rgba(56,189,248,0.17), 0 2px 14px 0 rgba(56,189,248,0.13) inset'
                : '0 14px 48px 0 rgba(56,189,248,0.10), 0 2px 12px 0 rgba(56,189,248,0.08) inset',
              border: theme === 'dark'
                ? '1.5px solid #334155'
                : '1.5px solid #bfe4ff',
              padding: 0,
              overflow: 'hidden',
              transition: 'box-shadow 0.18s, background 0.18s',
              backdropFilter: 'blur(18px) saturate(1.12)',
              WebkitBackdropFilter: 'blur(18px) saturate(1.12)',
            }}
          >
            <div
              style={{
                padding: '24px 0 10px 0',
                borderBottom: theme === 'dark' ? '1px solid #29344b' : '1px solid #e0f2fe',
                marginBottom: 12,
                background: 'none',
                textAlign: 'center'
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  fontSize: '17px',
                  color: theme === 'dark' ? '#e0e7ef' : '#1e293b',
                  letterSpacing: '0.01em'
                }}
              >
                Xin chào, {currentUser?.name || user?.name || 'User'}
              </span>
              <div
                style={{
                  fontSize: '13px',
                  color: theme === 'dark' ? '#93c5fd' : '#3b82f6',
                  marginTop: 2,
                  opacity: 0.8,
                  fontWeight: 500
                }}
              >
                Quản lý tài khoản của bạn
              </div>
            </div>
            <button
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => { navigate('/profile'); setOpen(false); }}
              style={{
                width: '100%',
                padding: '14px 28px',
                fontWeight: 600,
                fontSize: '15px',
                background: 'none',
                color: theme === 'dark' ? '#e0e7ef' : '#1557c0',
                border: 'none',
                borderTop: 'none',
                borderBottom: theme === 'dark' ? '1px solid #2a3957' : '1px solid #e0f2fe',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'background 0.15s, color 0.15s'
              }}
              className="liquid-dropdown-link"
            >
              Hồ sơ cá nhân
            </button>
            <button
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => { navigate('/stationschehistory'); setOpen(false); }}
              style={{
                width: '100%',
                padding: '14px 28px',
                fontWeight: 600,
                fontSize: '15px',
                background: 'none',
                color: theme === 'dark' ? '#e0e7ef' : '#1557c0',
                border: 'none',
                borderBottom: theme === 'dark' ? '1px solid #2a3957' : '1px solid #e0f2fe',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'background 0.15s, color 0.15s'
              }}
              className="liquid-dropdown-link"
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
              style={{
                width: '100%',
                padding: '14px 28px',
                fontWeight: 600,
                fontSize: '15px',
                background: 'none',
                color: theme === 'dark' ? '#e0e7ef' : '#1557c0',
                border: 'none',
                borderBottom: theme === 'dark' ? '1px solid #2a3957' : '1px solid #e0f2fe',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'background 0.15s, color 0.15s'
              }}
              className="liquid-dropdown-link"
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
              style={{
                width: '100%',
                padding: '14px 28px',
                fontWeight: 700,
                fontSize: '15px',
                background: theme === 'dark' 
                  ? 'linear-gradient(90deg, #3b82f6 0%, #0ea5e9 100%)'
                  : 'linear-gradient(90deg, #38bdf8 0%, #0ea5e9 85%)',
                color: '#fff',
                border: 'none',
                borderRadius: '0 0 16px 16px',
                textAlign: 'center',
                cursor: 'pointer',
                letterSpacing: '0.02em',
                marginTop: 15,
                marginBottom: 3,
                boxShadow: theme === 'dark'
                  ? '0 4px 18px 0 rgba(56,189,248,0.18), 0 2px 8px 0 rgba(56,189,248,0.10) inset'
                  : '0 4px 12px 0 rgba(56,189,248,0.15), 0 1.5px 8px 0 rgba(56,189,248,0.08) inset',
                transition: 'background 0.18s cubic-bezier(.4,0,.2,1), box-shadow 0.18s, transform 0.13s cubic-bezier(.4,0,.2,1)'
              }}
              className="liquid-dropdown-link"
            >
              Đăng xuất
            </button>
          </div>
        )}
      </div>
    </>
  );
  
}
