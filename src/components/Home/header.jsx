// HeaderDriver.jsx (skeleton)
import React from 'react';
import './home.css';


export default function Header({
  onToggleTheme, theme,
  user, unreadCount, nextBooking,
  onOpenBooking
}) {
  return (
    <header className="app-header">
      <div className="left">
        <a href="/home" className="logo"> 
          <img src="https://res.cloudinary.com/dzht29nkq/image/upload/v1758274139/SwapX_1_-Photoroom_wvmglm.png" alt="SwapX" style={{height:36}}/>
        </a>
        <nav className="main-nav">
          <a href="/stations">Trạm</a>
          <button className="cta" onClick={onOpenBooking}>Đặt lịch</button>
          <a href="/plans">Gói dịch vụ</a>
          <a href="/vehicles">Phương tiện</a>
          <a href="/payments">Thanh toán</a>
          <a href="/support">Hỗ trợ</a>
        </nav>
      </div>

      <div className="right">
        <button aria-label="Toggle theme" onClick={onToggleTheme}>
          {theme === 'dark' ? '🌙' : '☀️'}
        </button>

        <div className="notif" title={`${unreadCount} thông báo`}>
          <a href="/notifications">🔔{unreadCount>0 && <span className="badge">{unreadCount}</span>}</a>
        </div>

        {/*
          Khi người dùng bấm vào avatar mới hiện dropdown.
          Sử dụng useState để điều khiển trạng thái mở/đóng dropdown.
        */}
        {(() => {
          const [open, setOpen] = React.useState(false);
          // Đóng dropdown khi click ra ngoài
          React.useEffect(() => {
            if (!open) return;
            const handleClick = (e) => {
              // Nếu click ngoài vùng dropdown thì đóng
              if (!document.getElementById('account-dropdown-root')?.contains(e.target)) {
                setOpen(false);
              }
            };
            document.addEventListener('mousedown', handleClick);
            return () => document.removeEventListener('mousedown', handleClick);
          }, [open]);
          return (
            <div
              className={`account-dropdown${open ? " open" : ""}`}
              id="account-dropdown-root"
            >
              <img
                src={user?.profileUrl || "https://ui-avatars.com/api/?name=U&background=eee&color=888"}
                alt="avatar"
                className="avatar"
                tabIndex={0}
                onClick={() => setOpen((v) => !v)}
                onBlur={e => {
                  // Đảm bảo dropdown đóng khi tab ra ngoài (nếu cần)
                  setTimeout(() => setOpen(false), 120);
                }}
              />
              {open && (
                <div className="dropdown">
                  <a href="/profile">Hồ sơ</a>
                  <a href="/my-bookings">Lịch của tôi</a>
                  <a href="/profile/paymenthistory">Lịch sử thanh toán</a>
                  <a href="/settings">Cài đặt</a>
                  <button
                    onClick={() => {
                      localStorage.removeItem("authToken");
                      window.location.href = "/signin";
                    }}
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Quick booking preview */}
      {nextBooking && (
        <div className="booking-preview">
          Có lịch sắp tới: {nextBooking.stationName} — {nextBooking.time}
          <a href={`/bookings/${nextBooking.id}`}>Chi tiết</a>
        </div>
      )}
    </header>
);
}
