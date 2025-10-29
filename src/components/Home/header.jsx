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
          <filter id="liquidGlass" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="2" seed="8" result="noise" />
            <feGaussianBlur in="noise" stdDeviation="2" result="map" />
            <feDisplacementMap in="SourceGraphic" in2="map" scale="50" xChannelSelector="R" yChannelSelector="G" />
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
                  onClick={() => { navigate('/stationschehistory'); setOpen(false); }}
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
    </>
  );
}
