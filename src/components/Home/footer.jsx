import React from "react";

export default function Footer() {
  return (
    <footer
      className="footer"
      style={{
        background: "linear-gradient(90deg, #f97316 0%, #ea580c 20%, #fb923c 40%, #fdba74 60%, #fbbf24 80%, #fcd34d 100%)",
        color: "#fff",
        padding: "60px 0 0 0",
        boxShadow: "0 -8px 40px 0 rgba(16,185,129,0.15)",
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
        <div style={{ flex: "1 1 300px", minWidth: 260 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: "1.2rem",
                letterSpacing: "0.02em",
                color: "#fff",
                textShadow: "0 2px 12px rgba(0,0,0,0.2)",
                lineHeight: 1.4,
                flex: 1,
              }}
            >
              ⚡ Đổi pin nhanh<br/>Di chuyển xa
            </div>
          </div>
          <p style={{
            fontSize: "0.95rem",
            lineHeight: 1.6,
            color: "rgba(255,255,255,0.9)",
            marginTop: 0,
          }}>
            Giải pháp cho thuê pin thông minh cho xe điện, 
            bảo vệ môi trường và tiết kiệm chi phí.
          </p>
        </div>

        {/* Navigation */}
        <div style={{ flex: "1 1 200px", minWidth: 180 }}>
          <h4 style={{ 
            fontWeight: 700, 
            marginBottom: 20, 
            fontSize: "1.15rem",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            <span style={{ fontSize: "1.3rem" }}>🔗</span>
            Dịch vụ
          </h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, lineHeight: 2.2 }}>
            <li>
              <a href="/stations" style={footerLinkStyle} onMouseEnter={(e) => e.currentTarget.style.transform = "translateX(4px)"} onMouseLeave={(e) => e.currentTarget.style.transform = "translateX(0)"}>
                <span style={{ marginRight: 8 }}>📍</span>
                Tìm trạm đổi pin
              </a>
            </li>
            <li>
              <a href="/plans" style={footerLinkStyle} onMouseEnter={(e) => e.currentTarget.style.transform = "translateX(4px)"} onMouseLeave={(e) => e.currentTarget.style.transform = "translateX(0)"}>
                <span style={{ marginRight: 8 }}>💳</span>
                Gói thuê bao
              </a>
            </li>
            <li>
              <a href="/vehicles" style={footerLinkStyle} onMouseEnter={(e) => e.currentTarget.style.transform = "translateX(4px)"} onMouseLeave={(e) => e.currentTarget.style.transform = "translateX(0)"}>
                <span style={{ marginRight: 8 }}>🏍️</span>
                Xe tương thích
              </a>
            </li>
            <li>
              <a href="/payments" style={footerLinkStyle} onMouseEnter={(e) => e.currentTarget.style.transform = "translateX(4px)"} onMouseLeave={(e) => e.currentTarget.style.transform = "translateX(0)"}>
                <span style={{ marginRight: 8 }}>💰</span>
                Thanh toán
              </a>
            </li>
            <li>
              <a href="/support" style={footerLinkStyle} onMouseEnter={(e) => e.currentTarget.style.transform = "translateX(4px)"} onMouseLeave={(e) => e.currentTarget.style.transform = "translateX(0)"}>
                <span style={{ marginRight: 8 }}>🎧</span>
                Hỗ trợ 24/7
              </a>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div style={{ flex: "1 1 240px", minWidth: 200 }}>
          <h4 style={{ 
            fontWeight: 700, 
            marginBottom: 20, 
            fontSize: "1.15rem",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            <span style={{ fontSize: "1.3rem" }}>📞</span>
            Liên hệ
          </h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, lineHeight: 2.2 }}>
            <li style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: "1.1rem" }}>📱</span>
                <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>Hotline</span>
              </div>
              <a href="tel:19001234" style={{...footerLinkStyle, fontSize: "1.05rem", fontWeight: 700, marginLeft: 28}}>
                ...
              </a>
            </li>
            <li style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: "1.1rem" }}>✉️</span>
                <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>Email</span>
              </div>
              <a href="mailto:support@swapx.vn" style={{...footerLinkStyle, marginLeft: 28}}>
                ...
              </a>
            </li>
            <li>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: "1.1rem", marginTop: 2 }}>📍</span>
                <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>Địa chỉ</span>
              </div>
              <div style={{ color: "rgba(255,255,255,0.95)", fontWeight: 400, fontSize: "0.95rem", lineHeight: 1.5, marginLeft: 28 }}>
                ...
              </div>
            </li>
          </ul>
        </div>

        {/* Social & App Download */}
        <div style={{ flex: "1 1 200px", minWidth: 180 }}>
          <h4 style={{ 
            fontWeight: 700, 
            marginBottom: 20, 
            fontSize: "1.15rem",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            <span style={{ fontSize: "1.3rem" }}>🌐</span>
            Kết nối
          </h4>
          <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              style={socialBtnStyle}
              aria-label="Facebook"
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px) scale(1.1)";
                e.currentTarget.style.background = "rgba(255,255,255,0.35)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.background = "rgba(255,255,255,0.2)";
              }}
            >
              <svg width="20" height="20" fill="#fff" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a
              href="https://zalo.me"
              target="_blank"
              rel="noopener noreferrer"
              style={socialBtnStyle}
              aria-label="Zalo"
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px) scale(1.1)";
                e.currentTarget.style.background = "rgba(255,255,255,0.35)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.background = "rgba(255,255,255,0.2)";
              }}
            >
              <svg width="20" height="20" fill="#fff" viewBox="0 0 24 24">
                <text x="12" y="16" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#fff">Z</text>
              </svg>
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              style={socialBtnStyle}
              aria-label="Instagram"
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px) scale(1.1)";
                e.currentTarget.style.background = "rgba(255,255,255,0.35)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.background = "rgba(255,255,255,0.2)";
              }}
            >
              <svg width="20" height="20" fill="#fff" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              style={socialBtnStyle}
              aria-label="YouTube"
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px) scale(1.1)";
                e.currentTarget.style.background = "rgba(255,255,255,0.35)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.background = "rgba(255,255,255,0.2)";
              }}
            >
              <svg width="20" height="20" fill="#fff" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
      
      {/* Bottom Bar */}
      <div
        style={{
          borderTop: "2px solid rgba(255,255,255,0.2)",
          marginTop: 48,
          padding: "24px 0",
          textAlign: "center",
          fontSize: "0.95rem",
          color: "rgba(255,255,255,0.95)",
          letterSpacing: "0.01em",
          background: "rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ marginBottom: 12, display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap", fontSize: "0.9rem" }}>
            <a 
              href="/terms" 
              style={{ color: "rgba(255,255,255,0.9)", textDecoration: "none", fontWeight: 500, transition: "color 0.2s" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#fff"}
              onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.9)"}
            >
              Điều khoản sử dụng
            </a>
            <span style={{ color: "rgba(255,255,255,0.5)" }}>|</span>
            <a 
              href="/privacy" 
              style={{ color: "rgba(255,255,255,0.9)", textDecoration: "none", fontWeight: 500, transition: "color 0.2s" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#fff"}
              onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.9)"}
            >
              Chính sách bảo mật
            </a>
            <span style={{ color: "rgba(255,255,255,0.5)" }}>|</span>
            <a 
              href="/cookie" 
              style={{ color: "rgba(255,255,255,0.9)", textDecoration: "none", fontWeight: 500, transition: "color 0.2s" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#fff"}
              onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.9)"}
            >
              Cookie Policy
            </a>
          </div>
          <p style={{ margin: 0, fontWeight: 600 }}>
            © {new Date().getFullYear()} <b>SwapX</b> - Hệ thống cho thuê pin xe điện hàng đầu Việt Nam
          </p>
          <p style={{ margin: "8px 0 0 0", fontSize: "0.85rem", opacity: 0.85 }}>
            ...
          </p>
        </div>
      </div>
    </footer>
  );
}

// Inline styles for links and social buttons
const footerLinkStyle = {
  color: "rgba(255,255,255,0.95)",
  textDecoration: "none",
  fontWeight: 500,
  fontSize: "0.95rem",
  transition: "all 0.2s",
  display: "flex",
  alignItems: "center",
  marginBottom: 4,
};

const socialBtnStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 44,
  height: 44,
  borderRadius: "50%",
  background: "rgba(255,255,255,0.2)",
  boxShadow: "0 4px 12px 0 rgba(0,0,0,0.15)",
  transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
  border: "2px solid rgba(255,255,255,0.3)",
  outline: "none",
  cursor: "pointer",
  textDecoration: "none",
};