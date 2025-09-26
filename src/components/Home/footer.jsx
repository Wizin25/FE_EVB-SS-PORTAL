import React from "react";

export default function Footer() {
  return (
    <footer
      className="footer"
      style={{
        background: "linear-gradient(90deg, #ff9800 0%, #ffb347 100%)",
        color: "#fff",
        padding: "48px 0 0 0",
        borderTopLeftRadius: "32px",
        borderTopRightRadius: "32px",
        boxShadow: "0 -4px 32px 0 rgba(255,152,0,0.10)",
        fontFamily: "inherit",
        width: "100vw",
        left: "0",
        position: "relative",
        marginLeft: "calc(-50vw + 50%)",
        minWidth: "100vw",
        maxWidth: "100vw",
        overflowX: "hidden",
      }}
    >
      <div
        className="container"
        style={{
          width: "100%",
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "32px",
          maxWidth: "1200px",
        }}
      >
        {/* Logo & Slogan */}
        <div style={{ flex: "1 1 260px", minWidth: 220 }}>
          <a href="/home" style={{ display: "flex" }}>
            <img
              src="https://res.cloudinary.com/dzht29nkq/image/upload/v1758274139/SwapX_1_-Photoroom_wvmglm.png"
              alt="SwapX"
              style={{
                height: 90,
                width: "auto",
                borderRadius: "18px",
                boxShadow: "0 4px 24px 0 rgba(255,152,0,0.18)",
                background: "#fff",
                padding: 10,
                display: "block",
                marginBottom: 8,
              }}
            />
          </a>
          <div
            style={{
              fontWeight: 700,
              fontSize: "1.25rem",
              marginTop: 16,
              letterSpacing: "0.03em",
              color: "#fff",
              textShadow: "0 2px 8px rgba(255,152,0,0.18)",
            }}
          >
            SwapX - Đổi mới năng lượng, vững bước tương lai
          </div>
        </div>

        {/* Navigation */}
        <div style={{ flex: "1 1 180px", minWidth: 160 }}>
          <h4 style={{ fontWeight: 700, marginBottom: 16, fontSize: "1.1rem" }}>
            Điều hướng
          </h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, lineHeight: 2 }}>
            <li>
              <a href="/stations" style={footerLinkStyle}>Trạm</a>
            </li>
            <li>
              <a href="/plans" style={footerLinkStyle}>Gói dịch vụ</a>
            </li>
            <li>
              <a href="/vehicles" style={footerLinkStyle}>Phương tiện</a>
            </li>
            <li>
              <a href="/payments" style={footerLinkStyle}>Thanh toán</a>
            </li>
            <li>
              <a href="/support" style={footerLinkStyle}>Hỗ trợ</a>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div style={{ flex: "1 1 220px", minWidth: 180 }}>
          <h4 style={{ fontWeight: 700, marginBottom: 16, fontSize: "1.1rem" }}>
            Liên hệ
          </h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, lineHeight: 2 }}>
            <li>
              <span style={{ fontWeight: 600 }}>Hotline:</span>{" "}
              <a href="tel:19001234" style={footerLinkStyle}>1900 1234</a>
            </li>
            <li>
              <span style={{ fontWeight: 600 }}>Email:</span>{" "}
              <a href="mailto:support@swapx.vn" style={footerLinkStyle}>support@swapx.vn</a>
            </li>
            <li>
              <span style={{ fontWeight: 600 }}>Địa chỉ:</span>
              <div style={{ color: "#fff", fontWeight: 400, fontSize: "0.98rem" }}>
                123 Đường Năng Lượng, Quận 1, TP.HCM
              </div>
            </li>
          </ul>
        </div>

        {/* Social */}
        <div style={{ flex: "1 1 160px", minWidth: 140 }}>
          <h4 style={{ fontWeight: 700, marginBottom: 16, fontSize: "1.1rem" }}>
            Kết nối
          </h4>
          <div style={{ display: "flex", gap: 16 }}>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              style={socialBtnStyle}
              aria-label="Facebook"
            >
              <svg width="24" height="24" fill="#fff" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="12" fill="#ff9800" />
                <path
                  d="M15.5 8.5h-2V7.5c0-.41.34-.75.75-.75h1.25V4.75A4.25 4.25 0 0 0 11.25 0.5C8.35 0.5 6 2.85 6 5.75v2.75H4.5A.5.5 0 0 0 4 9v2a.5.5 0 0 0 .5.5H6v7.25A.75.75 0 0 0 6.75 19.5h2.5a.75.75 0 0 0 .75-.75V11.5h2l.5-2.5z"
                  fill="#fff"
                />
              </svg>
            </a>
            <a
              href="https://zalo.me"
              target="_blank"
              rel="noopener noreferrer"
              style={socialBtnStyle}
              aria-label="Zalo"
            >
              <svg width="24" height="24" fill="#fff" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="12" fill="#ff9800" />
                <text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#fff">Z</text>
              </svg>
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              style={socialBtnStyle}
              aria-label="Instagram"
            >
              <svg width="24" height="24" fill="#fff" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="12" fill="#ff9800" />
                <g>
                  <rect x="7" y="7" width="10" height="10" rx="3" fill="none" stroke="#fff" strokeWidth="1.5"/>
                  <circle cx="12" cy="12" r="2.5" fill="none" stroke="#fff" strokeWidth="1.2"/>
                  <circle cx="15.2" cy="8.8" r="0.8" fill="#fff"/>
                </g>
              </svg>
            </a>
          </div>
        </div>
      </div>
      <div
        style={{
          borderTop: "1.5px solid #fff5e1",
          marginTop: 36,
          padding: "18px 0",
          textAlign: "center",
          fontSize: "1rem",
          color: "#fff",
          opacity: 0.93,
          letterSpacing: "0.01em",
        }}
      >
        © {new Date().getFullYear()} <b>SwapX</b>. All rights reserved.
      </div>
    </footer>
  );
}

// Inline styles for links and social buttons
const footerLinkStyle = {
  color: "#fff",
  textDecoration: "none",
  fontWeight: 500,
  fontSize: "1rem",
  transition: "color 0.18s",
  opacity: 0.96,
  display: "flex",
  marginBottom: 2,
};
const socialBtnStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 40,
  height: 40,
  borderRadius: "50%",
  background: "rgba(255,255,255,0.13)",
  boxShadow: "0 2px 8px 0 rgba(255,152,0,0.13)",
  transition: "background 0.18s, transform 0.13s",
  marginRight: 4,
  border: "none",
  outline: "none",
  cursor: "pointer",
};
