import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import HeaderDriver from '../Home/header';
import Footer from '../Home/footer';

export default function PaymentFailure() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") || "light";
    }
    return "light";
  });

  // Lấy thông tin từ URL params
  const orderId = searchParams.get('orderId');
  const orderCode = searchParams.get('orderCode');
  const serviceType = searchParams.get('serviceType');
  const total = searchParams.get('total');
  // Duy trì để backward compatibility/hiển thị cũ
  const amount = searchParams.get('amount');
  const status = searchParams.get('status');
  const paymentId = searchParams.get('paymentId');
  const errorCode = searchParams.get('errorCode');
  const errorMessage = searchParams.get('errorMessage');

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

  const handleRetryPayment = async () => {
    try {
      const ctxStr = sessionStorage.getItem('pkgPaymentCtx');
      const ctx = ctxStr ? JSON.parse(ctxStr) : null;
      if (!ctx?.orderId) return navigate('/plans');
  
      const desc = `${ctx.packageName || 'Package'} CHUYEN TIEN`;
      const pay = await authAPI.createPayOSPayment({ orderId: ctx.orderId, description: desc });
      const url = pay?.data?.checkoutUrl || pay?.data?.payUrl || pay?.data?.shortLink;
      if (url) window.location.href = url;
      else navigate('/plans');
    } catch {
      navigate('/plans');
    }
  };

  const handleGoHome = () => {
    navigate('/home');
  };

  const handleGoToStations = () => {
    navigate('/stations');
  };

  const handleContactSupport = () => {
    // Có thể mở modal liên hệ hoặc redirect đến trang contact
    window.open('/contact');
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
        {/* Failure Header */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "2.5rem",
            background:
              theme === "dark"
                ? "linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)"
                : "linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)",
            padding: "2.5rem 1.5rem 2rem 1.5rem",
            borderRadius: "24px",
            color: theme === "dark" ? "#f1f5f9" : "#1e293b",
            position: "relative",
            overflow: "hidden",
            boxShadow:
              theme === "dark"
                ? "0 8px 32px rgba(0,0,0,0.45)"
                : "0 8px 32px rgba(239,68,68,0.10)",
            border: theme === "dark"
              ? "1.5px solid #7f1d1d"
              : "1.5px solid #fecaca"
          }}
        >
          {/* Failure Icon */}
          <div
            style={{
              fontSize: "4rem",
              marginBottom: "1rem",
              animation: "shake 0.5s ease-in-out"
            }}
          >
            ❌
          </div>
          
          <h1
            style={{
              color: theme === "dark" ? "#fca5a5" : "#dc2626",
              fontSize: "2.5rem",
              fontWeight: 800,
              marginBottom: "0.7rem",
              letterSpacing: "-1px"
            }}
          >
            Thanh toán thất bại!
          </h1>
          
          <p
            style={{
              fontSize: "1.2rem",
              opacity: 0.9,
              marginBottom: 0,
              color: theme === "dark" ? "#fca5a5" : "#7f1d1d",
              fontWeight: 500
            }}
          >
            Rất tiếc, giao dịch của bạn không thể hoàn thành
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
            📋 Thông tin giao dịch
          </h2>
          
          <div style={{ display: 'grid', gap: '1rem' }}>
            {orderId && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: theme === 'dark' ? '#94a3b8' : '#64748b', fontWeight: '500' }}>
                  Mã đơn hàng:
                </span>
                <span style={{ 
                  color: theme === 'dark' ? '#f1f5f9' : '#1e293b', 
                  fontWeight: 'bold',
                  fontFamily: 'monospace'
                }}>
                  {orderId}
                </span>
              </div>
            )}

            {orderCode && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: theme === 'dark' ? '#94a3b8' : '#64748b', fontWeight: '500' }}>
                  Mã thanh toán:
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

            {serviceType && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: theme === 'dark' ? '#94a3b8' : '#64748b', fontWeight: '500' }}>
                  Loại dịch vụ:
                </span>
                <span style={{
                  color: theme === 'dark' ? '#f1f5f9' : '#1e293b',
                  fontWeight: 'bold'
                }}>
                  {serviceType}
                </span>
              </div>
            )}
            
            {total && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: theme === 'dark' ? '#94a3b8' : '#64748b', fontWeight: '500' }}>
                  Số tiền:
                </span>
                <span style={{ 
                  color: theme === 'dark' ? '#f87171' : '#dc2626', 
                  fontWeight: 'bold',
                  fontSize: '1.1rem'
                }}>
                  {parseInt(total).toLocaleString('vi-VN')} VNĐ
                </span>
              </div>
            )}

            {/* Backward compatibility: if 'total' không có, show 'amount' */}
            {!total && amount && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: theme === 'dark' ? '#94a3b8' : '#64748b', fontWeight: '500' }}>
                  Số tiền:
                </span>
                <span style={{ 
                  color: theme === 'dark' ? '#f87171' : '#dc2626', 
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
                color: theme === 'dark' ? '#f87171' : '#dc2626', 
                fontWeight: 'bold',
                background: theme === 'dark' ? 'rgba(248, 113, 113, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                padding: '4px 12px',
                borderRadius: '20px',
                border: theme === 'dark' ? '1px solid #f87171' : '1px solid #dc2626'
              }}>
                ❌ Thất bại
              </span>
            </div>

            {errorCode && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: theme === 'dark' ? '#94a3b8' : '#64748b', fontWeight: '500' }}>
                  Mã lỗi:
                </span>
                <span style={{ 
                  color: theme === 'dark' ? '#f87171' : '#dc2626', 
                  fontWeight: 'bold',
                  fontFamily: 'monospace'
                }}>
                  {errorCode}
                </span>
              </div>
            )}

            {errorMessage && (
              <div style={{ 
                marginTop: '1rem',
                padding: '1rem',
                background: theme === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                border: theme === 'dark' ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(239, 68, 68, 0.1)',
                borderRadius: '8px'
              }}>
                <span style={{ 
                  color: theme === 'dark' ? '#fca5a5' : '#7f1d1d', 
                  fontWeight: '500',
                  fontSize: '0.9rem'
                }}>
                  <strong>Chi tiết lỗi:</strong> {errorMessage}
                </span>
              </div>
            )}
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
          {/* <button
            onClick={handleRetryPayment}
            style={{
              background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              fontWeight: 'bold',
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(220, 38, 38, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(220, 38, 38, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(220, 38, 38, 0.3)';
            }}
          >
            🔄 Thử lại thanh toán
          </button> */}
          
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
            onClick={handleContactSupport}
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
            📞 Liên hệ hỗ trợ
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

        {/* Help Information */}
        <div
          style={{
            background: theme === 'dark' 
              ? 'rgba(239, 68, 68, 0.1)' 
              : 'rgba(239, 68, 68, 0.05)',
            border: theme === 'dark' 
              ? '1px solid rgba(239, 68, 68, 0.2)' 
              : '1px solid rgba(239, 68, 68, 0.1)',
            borderRadius: '12px',
            padding: '1.5rem',
            textAlign: 'center'
          }}
        >
          <h3 style={{
            color: theme === 'dark' ? '#fca5a5' : '#dc2626',
            margin: '0 0 1rem 0',
            fontSize: '1.1rem',
            fontWeight: 'bold'
          }}>
            🆘 Cần hỗ trợ?
          </h3>
          <p style={{
            color: theme === 'dark' ? '#fca5a5' : '#7f1d1d',
            margin: '0 0 1rem 0',
            fontSize: '0.9rem'
          }}>
            Nếu bạn gặp vấn đề với thanh toán, vui lòng:
          </p>
          <ul style={{
            color: theme === 'dark' ? '#fca5a5' : '#7f1d1d',
            margin: 0,
            paddingLeft: '1.5rem',
            fontSize: '0.9rem',
            textAlign: 'left'
          }}>
            <li>Kiểm tra lại thông tin thẻ/tài khoản</li>
            <li>Đảm bảo có đủ số dư</li>
            <li>Thử lại sau vài phút</li>
            <li>Liên hệ hotline: <strong>1900 123 456</strong></li>
          </ul>
        </div>
      </div>

      <Footer />

      <style>
        {`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
          }
        `}
      </style>
    </div>
  );
}
