import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import HeaderDriver from '../Home/header';
import Footer from '../Home/footer';
import { authAPI } from '../services/authAPI';
import { vehicleAPI } from '../services/vehicleAPI';

const PAYMENT_CTX = 'paymentCtx'; // context dùng chung cho mọi thanh toán qua PayOS

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

  const [orderId, setOrderId] = useState('');
  const [orderCode, setOrderCode] = useState('');
  const [status, setStatus] = useState('Pending');
  const [serviceType, setServiceType] = useState();
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState('Đang xác minh thanh toán…');
  const [attaching, setAttaching] = useState(false);
  const [doneAttach, setDoneAttach] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") { root.classList.add("dark"); document.body.classList.add("dark"); }
  }, [theme]);

  useEffect(() => {
    const run = async () => {
      try {
        // 1) Lấy orderId và orderCode từ URL hoặc session
        const ctxStr = sessionStorage.getItem(PAYMENT_CTX);
        const ctx = ctxStr ? JSON.parse(ctxStr) : {};
        const qsOrderId = searchParams.get('orderId');
        const qsOrderCode = searchParams.get('orderCode');
        
        const oid = qsOrderId || ctx?.orderId;
        const ocode = qsOrderCode || ctx?.orderCode;
        
        if (!oid && !ocode) { 
          setMessage('Không tìm thấy mã đơn hàng hoặc mã thanh toán.'); 
          return; 
        }
        
        if (oid) setOrderId(String(oid));
        if (ocode) setOrderCode(String(ocode));

        // serviceType fallback từ context (BE có thể trả trong getOrderById)
        if (ctx?.serviceType) setServiceType(ctx.serviceType);

        // 2) Xác minh trạng thái thanh toán (poll ngắn 6 lần, mỗi 1.5s)
        // Sử dụng orderId hoặc orderCode để query, ưu tiên orderId
        const queryId = oid || ocode;
        setMessage('Đang xác minh trạng thái đơn hàng…');
        let info = null, st = 'Pending';
        for (let i = 0; i < 6; i++) {
          const res = await authAPI.getOrderById(queryId);
          info = res?.data || res;
          const maybeStatus = (info?.status || info?.Status || '').toString();
          const maybeType   = (info?.serviceType || info?.ServiceType || ctx?.serviceType || '').toString();
          const maybeTotal  = Number(info?.total ?? info?.Total ?? ctx?.total ?? 0);

          if (maybeType) setServiceType(maybeType);
          setTotal(maybeTotal);
          st = maybeStatus || st;
          setStatus(st);

          if (/paid|completed|success/i.test(st)) break;
          await new Promise(r => setTimeout(r, 1500));
        }

        // 3) Nếu chưa xác nhận Paid
        if (!/paid|completed|success/i.test(st)) {
          // Kiểm tra nếu trạng thái là failed
          if (/failed|error|cancelled/i.test(st)) {
            setMessage('Thanh toán thất bại. Vui lòng thử lại.');
            return;
          }
          setMessage('Hệ thống chưa ghi nhận thanh toán thành công. Vui lòng đợi thêm hoặc thử lại sau.');
          return;
        }

        // 4) Đã Paid
        setMessage('Thanh toán đã xác nhận ✓');

        // 5) Nếu là Package → gắn gói vào xe (PrePaid thì KHÔNG gắn gì)
        const isPackage = /package/i.test(serviceType);
        if (isPackage) {
          const vin = ctx?.vin;
          const packageId = ctx?.packageId;
          console.log('[PAYMENT] Gắn gói vào xe:', {vin, packageId, ctx});
          if (!vin || !packageId) {
            console.log('[PAYMENT] Thiếu VIN hoặc PackageId để kích hoạt gói.', {vin, packageId, ctx});
            setMessage(prev => prev + ' — Thiếu VIN hoặc PackageId để kích hoạt gói.');
          } else {
            try {
              setAttaching(true);
              setMessage('Đang kích hoạt gói cho xe…');
              console.log('[PAYMENT] Gọi API vehicleAPI.addVehicleInPackage', { Vin: vin, PackageId: packageId });
              const attachRes = await vehicleAPI.addVehicleInPackage({ Vin: vin, PackageId: packageId });
              console.log('[PAYMENT] Kết quả addVehicleInPackage:', attachRes);
              const ok = attachRes?.isSuccess || attachRes?.data?.isSuccess || attachRes?.status === 200;
              if (!ok) throw new Error(attachRes?.message || 'Kích hoạt gói thất bại');
              setDoneAttach(true);
              setMessage('Gói đã được gắn vào xe thành công!');
            } catch (e) {
              console.log('[PAYMENT] Lỗi khi gắn gói vào xe:', e);
              setMessage(e?.message || 'Có lỗi khi gắn gói vào xe.');
            } finally {
              setAttaching(false);
            }
          }
        }

        // 6) Xoá context dùng một lần
        sessionStorage.removeItem(PAYMENT_CTX);
      } catch (e) {
        setMessage(e?.message || 'Có lỗi xảy ra khi xác minh thanh toán.');
      }
    };
    run();
  }, [searchParams]);

  // UI helpers
  const StatusBadge = ({ value }) => {
    const v = (value || '').toLowerCase();
    const bg = /paid|success|completed/.test(v) ? '#059669'
       : /pending|processing/.test(v) ? '#d97706'
       : /failed|error|cancelled/.test(v) ? '#ef4444'
       : '#6b7280';
    return (
      <span style={{
        display:'inline-block', padding:'4px 10px', borderRadius:9999,
        color:'#fff', background:bg, fontSize:12, letterSpacing:0.2
      }}>{value || 'Unknown'}</span>
    );
  };

  const go = (path) => () => navigate(path);

  // Kiểm tra trạng thái để hiển thị UI phù hợp
  const isSuccess = /paid|completed|success/i.test(status);
  const isFailed = /failed|error|cancelled/i.test(status);

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`} style={{ maxHeight: "calc(100vh - 120px)", overflowY: "auto" }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 50 }}>
        <HeaderDriver onToggleTheme={() => setTheme(t => t==='dark'?'light':'dark')} theme={theme} user={null} unreadCount={0} nextBooking={null} onOpenBooking={() => {}} />
      </div>

      <div style={{ maxWidth: 900, margin: '2rem auto', padding: '0 1rem' }}>
        <div style={{
          textAlign:'center', marginBottom:'1.5rem',
          background: isFailed 
            ? (theme==='dark'?'linear-gradient(135deg,#7f1d1d 0%,#991b1b 100%)':'linear-gradient(135deg,#fee2e2 0%,#fecaca 100%)')
            : (theme==='dark'?'linear-gradient(135deg,#232946 0%,#1f2937 100%)':'linear-gradient(135deg,#e0ffe7 0%,#b2f5ea 100%)'),
          padding:'1.75rem 1.25rem', borderRadius:24
        }}>
          <div style={{fontSize:'2.5rem', marginBottom:10}}>
            {isFailed ? '❌' : isSuccess ? '✅' : '⏳'}
          </div>
          <h1 style={{margin:0, color: isFailed ? (theme==='dark'?'#fca5a5':'#dc2626') : (theme==='dark'?'#fff':'#059669')}}>
            {isFailed ? 'Thanh toán thất bại' : isSuccess ? 'Thanh toán thành công' : 'Đang xử lý thanh toán'}
          </h1>
          <p style={{opacity:0.92, marginTop:8}}>{message}</p>
        </div>

        {/* Thẻ thông tin đơn hàng (HIỂN THỊ orderId và orderCode rõ ràng) */}
        <div style={{
          background: theme==='dark'?'#111827':'#ffffff',
          border: '1px solid ' + (theme==='dark'?'#374151':'#e5e7eb'),
          borderRadius: 16, padding: '1.25rem', marginBottom: '1.5rem'
        }}>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
            <div><strong>Mã đơn hàng (orderId):</strong><br/>{orderId || '—'}</div>
            <div><strong>Mã thanh toán (orderCode):</strong><br/>{orderCode || '—'}</div>
            <div><strong>Loại dịch vụ:</strong><br/>{serviceType}</div>
            <div><strong>Số tiền:</strong><br/>{Number(total || 0).toLocaleString('vi-VN')} VND</div>
            <div><strong>Trạng thái:</strong><br/><StatusBadge value={status}/></div>
          </div>
          {/* Gợi ý hành động theo loại dịch vụ */}
          <div style={{marginTop:12, fontSize:14, opacity:0.9}}>
            { /package/i.test(serviceType)
              ? (attaching ? 'Đang kích hoạt gói vào xe…'
                : doneAttach ? 'Gói đã kích hoạt. Bạn có thể xem tại mục gói của tôi.'
                : 'Đã thanh toán gói. Hệ thống sẽ kích hoạt gói cho xe ngay.')
              : 'Đã thanh toán đặt lịch (PrePaid). Bạn có thể kiểm tra lịch trong hồ sơ của mình.'}
          </div>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:12}}>
          <button onClick={go('/plans')} style={{background:'#059669', color:'#fff', padding:'12px 16px', borderRadius:12, border:'none'}}>📦 Gói của tôi</button>
          <button onClick={go('/stations')} style={{background:'#1d4ed8', color:'#fff', padding:'12px 16px', borderRadius:12, border:'none'}}>🔋 Xem trạm</button>
          <button onClick={go('/home')} style={{background: theme==='dark'?'#374151':'#f1f5f9', color: theme==='dark'?'#fff':'#111827', padding:'12px 16px', borderRadius:12, border:'1px solid #e5e7eb'}}>🏠 Trang chủ</button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
