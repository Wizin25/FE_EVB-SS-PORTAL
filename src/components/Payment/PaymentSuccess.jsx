import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import HeaderDriver from '../Home/header';
import Footer from '../Home/footer';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") || "light";
    }
    return "light";
  });

  // Lấy thông tin từ URL params
  const orderCode = searchParams.get('orderCode');
  const amount = searchParams.get('amount');
  const status = searchParams.get('status');
  const paymentId = searchParams.get('paymentId');

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    const root = document.documentElement;
    if (savedTheme === "dark") {
      root.classList.add("dark");
      document.body.classList.add("dark");
    }
  }, []);

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

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoToStations = () => {
    navigate('/stations');
  };

  const handleGoToBookings = () => {
    navigate('/bookings');
  };

  return (
    <div
      className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}
      style={{ maxHeight: "calc(100vh - 120px)", overflowY: "auto" }}
    >
      <div style={{ position: 'sticky', top: 0, zIndex: 50 }}>
        <HeaderDriver
          onToggleTheme={handleToggleTheme}
          theme={theme}
          user={null}
          unreadCount={0}
          nextBooking={null}
          onOpenBooking={() => {}}
        />
      </div>

      <div className="payment-container" style={{
        maxWidth: '800px',
        margin: '2rem auto',
        padding: '0 1rem'
      }}>
        {/* Success Header */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "2.5rem",
            background:
              theme === "dark"
                ? "linear-gradient(135deg, #232946 0%, #1f2937 100%)"
                : "linear-gradient(135deg, #e0ffe7 0%, #b2f5ea 100%)",
            padding: "2.5rem 1.5rem 2rem 1.5rem",
            borderRadius: "24px",
            color: theme === "dark" ? "#f1f5f9" : "#1e293b",
            position: "relative",
            overflow: "hidden",
            boxShadow:
              theme === "dark"
                ? "0 8px 32px rgba(0,0,0,0.45)"
                : "0 8px 32px rgba(29,216,132,0.10)",
            border: theme === "dark"
              ? "1.5px solid #334155"
              : "1.5px solid #bbf7d0"
          }}
        >
          {/* Success Icon */}
          <div
            style={{
              fontSize: "4rem",
              marginBottom: "1rem",
              animation: "bounce 2s infinite"
            }}
          >
            ✅
          </div>
          
          <h1
            style={{
              color: theme === "dark" ? "#f1f5f9" : "#059669",
              fontSize: "2.5rem",
              fontWeight: 800,
              marginBottom: "0.7rem",
              letterSpacing: "-1px"
            }}
          >
            Thanh toán thành công!
          </h1>
          
          <p
            style={{
              fontSize: "1.2rem",
              opacity: 0.9,
              marginBottom: 0,
              color: theme === "dark" ? "#cbd5e1" : "#334155",
              fontWeight: 500
            }}
          >
            Cảm ơn bạn đã sử dụng dịch vụ đổi pin
          </p>
        </div>

        {/* Payment Details Card */}
        <div
          style={{
            background: theme === 'dark' 
              ? 'linear-gradient(145deg, #374151 0%, #1f2937 100%)'
              : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
            border: theme === 'dark' 
              ? '1px solid #4b5563'
              : '1px solid #e2e8f0',
            borderRadius: '16px',
            boxShadow: theme === 'dark'
              ? '0 10px 25px rgba(0, 0, 0, 0.3)'
              : '0 10px 25px rgba(0, 0, 0, 0.1)',
            padding: '2rem',
            marginBottom: '2rem'
          }}
        >
          <h2
            style={{
              color: theme === 'dark' ? '#f1f5f9' : '#1e293b',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}
          >
            📋 Thông tin thanh toán
          </h2>
          
          <div style={{ display: 'grid', gap: '1rem' }}>
            {orderCode && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: theme === 'dark' ? '#94a3b8' : '#64748b', fontWeight: '500' }}>
                  Mã đơn hàng:
                </span>
                <span style={{ 
                  color: theme === 'dark' ? '#f1f5f9' : '#1e293b', 
                  fontWeight: 'bold',
                  fontFamily: 'monospace'
                }}>
                  {orderCode}
                </span>
              </div>
            )}
            
            {amount && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: theme === 'dark' ? '#94a3b8' : '#64748b', fontWeight: '500' }}>
                  Số tiền:
                </span>
                <span style={{ 
                  color: theme === 'dark' ? '#10b981' : '#059669', 
                  fontWeight: 'bold',
                  fontSize: '1.1rem'
                }}>
                  {parseInt(amount).toLocaleString('vi-VN')} VNĐ
                </span>
              </div>
            )}
            
            {paymentId && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: theme === 'dark' ? '#94a3b8' : '#64748b', fontWeight: '500' }}>
                  Mã giao dịch:
                </span>
                <span style={{ 
                  color: theme === 'dark' ? '#f1f5f9' : '#1e293b', 
                  fontWeight: 'bold',
                  fontFamily: 'monospace'
                }}>
                  {paymentId}
                </span>
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: theme === 'dark' ? '#94a3b8' : '#64748b', fontWeight: '500' }}>
                Trạng thái:
              </span>
              <span style={{ 
                color: theme === 'dark' ? '#10b981' : '#059669', 
                fontWeight: 'bold',
                background: theme === 'dark' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(5, 150, 105, 0.1)',
                padding: '4px 12px',
                borderRadius: '20px',
                border: theme === 'dark' ? '1px solid #10b981' : '1px solid #059669'
              }}>
                ✅ Thành công
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}
        >
          <button
            onClick={handleGoToStations}
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              fontWeight: 'bold',
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)';
            }}
          >
            🔋 Xem trạm đổi pin
          </button>
          
          <button
            onClick={handleGoToBookings}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              fontWeight: 'bold',
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)';
            }}
          >
            📅 Xem lịch đặt
          </button>
          
          <button
            onClick={handleGoHome}
            style={{
              background: theme === 'dark' ? '#374151' : '#f1f5f9',
              color: theme === 'dark' ? '#f1f5f9' : '#1e293b',
              padding: '12px 24px',
              borderRadius: '12px',
              border: theme === 'dark' ? '1px solid #4b5563' : '1px solid #d1d5db',
              fontWeight: 'bold',
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
            }}
          >
            🏠 Về trang chủ
          </button>
        </div>

        {/* Additional Info */}
        <div
          style={{
            background: theme === 'dark' 
              ? 'rgba(59, 130, 246, 0.1)' 
              : 'rgba(59, 130, 246, 0.05)',
            border: theme === 'dark' 
              ? '1px solid rgba(59, 130, 246, 0.2)' 
              : '1px solid rgba(59, 130, 246, 0.1)',
            borderRadius: '12px',
            padding: '1.5rem',
            textAlign: 'center'
          }}
        >
          <p style={{
            color: theme === 'dark' ? '#cbd5e1' : '#374151',
            margin: 0,
            fontSize: '0.9rem'
          }}>
            💡 <strong>Lưu ý:</strong> Bạn có thể sử dụng mã đơn hàng để tra cứu thông tin đặt lịch của mình.
            Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ hotline hỗ trợ.
          </p>
        </div>
      </div>

      <Footer />

      <style>
        {`
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-10px); }
            60% { transform: translateY(-5px); }
          }
        `}
      </style>
    </div>
  );
}
