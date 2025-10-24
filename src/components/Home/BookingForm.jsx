import React, { useEffect, useMemo, useRef, useState } from "react";
import HeaderDriver from "./header";
import Footer from "./footer";
import { authAPI } from "../services/authAPI";
import { vehicleAPI } from "../services/vehicleAPI";
import "../Admin/pages/Station.css";
import "./booking.css";

/** Map chuẩn hoá tên serviceType khớp enum PaymentType (BE) */
const SERVICE_TYPES = {
  PACKAGE: "Package",
  PREPAID: "PrePaid",
  USE_PACKAGE: "UsePackage",
  PAID_AT_STATION: "PaidAtStation",
};

// Toggle nhanh sang Cách 1 (chọn phương thức ngay trong form)
const INLINE_METHOD = false;

export default function BookingForm() {
  // theme minimal to reuse header/footer
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [user, setUser] = useState(null);
  const [unreadCount] = useState(0);
  const [nextBooking] = useState(null);

  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(""); // ISO string or yyyy-MM-ddTHH:mm
  const [stationId, setStationId] = useState("");
  const [vin, setVin] = useState("");
  const [batteryId, setBatteryId] = useState("");
  const [selectedBatteryName, setSelectedBatteryName] = useState("");
  const [suitableBatteries, setSuitableBatteries] = useState([]);
  const loadSeqRef = useRef(0);
  const [myVehicles, setMyVehicles] = useState([]);
  const [loadingBatteries, setLoadingBatteries] = useState(false);

  // Payment modal state (Cách 2)
  const [showPayModal, setShowPayModal] = useState(false);
  const [createdFormId, setCreatedFormId] = useState("");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");

  // Cache for storing battery lists by VIN+Station combination
  const batteryCacheRef = useRef(new Map());

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

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
    }
  }, []);

  // Load suitable batteries when VIN or Station changes
  useEffect(() => {
    const loadSuit = async () => {
      if (!vin || !stationId) {
        setSuitableBatteries([]);
        setBatteryId("");
        setSelectedBatteryName("");
        setLoadingBatteries(false);
        return;
      }

      const cacheKey = `${vin}-${stationId}`;
      setSuitableBatteries([]);
      setBatteryId("");
      setSelectedBatteryName("");

      if (batteryCacheRef.current.has(cacheKey)) {
        const cachedData = batteryCacheRef.current.get(cacheKey);
        setSuitableBatteries(cachedData);
        const availableBatteries = cachedData.filter(b => {
          const status = (b.status || b.Status || '').toString().toLowerCase();
          return status === 'available';
        });
        if (availableBatteries.length > 0) {
          const firstBattery = availableBatteries[0];
          const firstId = String(firstBattery.batteryId || firstBattery.BatteryId || firstBattery.id || '');
          const firstName = firstBattery.batteryName || firstBattery.BatteryName || firstBattery.name || '';
          setBatteryId(firstId);
          setSelectedBatteryName(firstName);
        }
        return;
      }

      setLoadingBatteries(true);
      const seq = ++loadSeqRef.current;
      try {
        const list = await authAPI.getBatteriesSuitVehicle({ vin, stationId });
        const items = Array.isArray(list) ? list : [];
        if (seq !== loadSeqRef.current) return;

        batteryCacheRef.current.set(cacheKey, items);
        setSuitableBatteries(items);

        const availableBatteries = items.filter(b => {
          const status = (b.status || b.Status || '').toString().toLowerCase();
          return status === 'available';
        });
        if (availableBatteries.length > 0) {
          const firstBattery = availableBatteries[0];
          const firstId = String(firstBattery.batteryId || firstBattery.BatteryId || firstBattery.id || '');
          const firstName = firstBattery.batteryName || firstBattery.BatteryName || firstBattery.name || '';
          setBatteryId(firstId);
          setSelectedBatteryName(firstName);
        }
      } catch (e) {
        if (seq === loadSeqRef.current) {
          setBatteryId("");
          setSelectedBatteryName("");
        }
      } finally {
        if (seq === loadSeqRef.current) {
          setLoadingBatteries(false);
        }
      }
    };
    loadSuit();
  }, [vin, stationId]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const [current, allStations] = await Promise.all([
          authAPI.getCurrent(),
          authAPI.getAllStations(),
        ]);
        setUser(current);
        setStations(Array.isArray(allStations) ? allStations : []);
        const params = new URLSearchParams(window.location.search);
        const preselect = params.get('stationId');
        const qVin = params.get('vin');
        const qBatteryId = params.get('batteryId') || params.get('batteryID');
        const qBatteryName = params.get('batteryName');
        const found = Array.isArray(allStations) && allStations.find(s => String(s.stationId) === String(preselect));
        if (preselect && found) setStationId(found.stationId);
        else if (Array.isArray(allStations) && allStations.length > 0) setStationId(allStations[0].stationId);
        if (qVin) setVin(qVin);
        if (qBatteryId) setBatteryId(qBatteryId);
        const initialBatteryName = qBatteryName || '';
        setSelectedBatteryName(initialBatteryName);

        try {
          const res = await vehicleAPI.getCurrentUserVehicles();
          let list = [];
          if (Array.isArray(res)) list = res;
          else if (res?.data?.data && Array.isArray(res.data.data)) list = res.data.data;
          else if (res?.data && Array.isArray(res.data)) list = res.data;
          const active = list.filter(v => {
            const s = (v.status || v.Status || '').toString().toLowerCase();
            return s === 'active' || s === 'linked';
          });
          setMyVehicles(active);
          if (!qVin && active.length > 0) {
            const vin0 = (active[0].VIN || active[0].vin || active[0].vehicleId || active[0].id || '').toString();
            setVin(vin0);
          }
        } catch { }
      } catch (err) {
        setError(err?.message || "Không tải được dữ liệu ban đầu");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  // ========== SUBMIT BOOKING ==========
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setPayError("");
    if (!title || !description || !date || !stationId) {
      setError("Vui lòng nhập đủ Title, Description, Date và chọn Station.");
      return;
    }
    if (!vin) {
      setError("Thiếu VIN. Vui lòng chọn xe hoặc quay lại chọn từ trạm.");
      return;
    }
    if (!batteryId) {
      setError("Thiếu BatteryID. Vui lòng chọn pin từ trạm.");
      return;
    }
    if (!user?.accountId && !user?.accountID && !user?.AccountId) {
      setError("Không tìm thấy AccountId. Hãy đăng nhập lại.");
      return;
    }
    const accountId = user.accountId || user.accountID || user.AccountId;

    try {
      setLoading(true);
      const res = await authAPI.createForm({ accountId, title, description, date, stationId, vin, batteryId });

      // formId linh động tuỳ backend wrapper
      const formId =
        res?.data?.formId ||
        res?.data?.FormId ||
        res?.data?.id ||
        res?.data?.ID ||
        res?.formId ||
        res?.FormId ||
        res?.id ||
        res?.ID;

      if (!formId) {
        throw new Error("Không xác định được FormId từ phản hồi tạo lịch.");
      }

      setCreatedFormId(String(formId));
      setSuccess("Đặt lịch thành công.");
      // Mở popup chọn phương thức (Cách 2)
      setShowPayModal(true);

      // Reset trường nhập, giữ stationId/vin/batteryId để user còn xem
      setTitle("");
      setDescription("");
      setDate("");
    } catch (err) {
      setError(err?.message || "Đặt lịch thất bại");
    } finally {
      setLoading(false);
    }
  };

  // ========== PAY MODAL HANDLER ==========
  const handleCreatePayment = async ({ serviceType, exchangeId, packageId }) => {
    setPayError("");
    if (!createdFormId) {
      setPayError("Thiếu formId, vui lòng đặt lịch lại.");
      return;
    }
    if (!user) {
      setPayError("Thiếu thông tin người dùng.");
      return;
    }
    const accountId = user.accountId || user.accountID || user.AccountId;
    const customerName =
      user?.name || user?.Name || user?.username || user?.Username || "Khach Hang";
    const serviceId =
      serviceType === SERVICE_TYPES.PACKAGE ? (packageId || "") : createdFormId;

    try {
      setPaying(true);
      // Total mặc định để test
      const total = 10000;

      // Build & validate theo rule bạn đưa
      const orderPayload = {
        serviceType,
        accountId,
        total,
        serviceId,
        batteryId,
        vin: serviceType === SERVICE_TYPES.PACKAGE ? vin : undefined,
        exchangeId: serviceType === SERVICE_TYPES.PAID_AT_STATION ? (exchangeId || undefined) : undefined,
      };


      console.log("=== CREATE ORDER PAYLOAD ===");
      console.log(JSON.stringify(orderPayload, null, 2));
      console.log("=============================");

      const orderRes = await authAPI.createOrder(orderPayload);

      // Lấy orderId từ response
      const orderId =
        orderRes?.data?.orderId ||
        orderRes?.data?.OrderId ||
        orderRes?.data?.id ||
        orderRes?.orderId ||
        orderRes?.OrderId ||
        orderRes?.id;

      if (!orderId) {
        throw new Error("Không xác định được OrderId từ phản hồi tạo Order.");
      }

      // Gọi PayOS — “name + CHUYEN TIEN”
      const description = `${customerName} CHUYEN TIEN`;
      const payRes = await authAPI.createPayOSPayment({ orderId, description });

      // Tuỳ BE: lấy checkoutUrl / shortLink / payUrl
      const redirectUrl =
        payRes?.data?.paymentUrl ||
        payRes?.data?.checkoutUrl ||
        payRes?.data?.payUrl ||
        payRes?.data?.shortLink ||
        payRes?.paymentUrl ||
        payRes?.checkoutUrl ||
        payRes?.payUrl ||
        payRes?.shortLink;

      if (!redirectUrl) {
        throw new Error("Không nhận được link thanh toán từ PayOS.");
      }

      // Chuyển người dùng qua trang thanh toán
      window.location.href = redirectUrl;
    } catch (err) {
      setPayError(err?.message || "Không tạo được thanh toán.");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`} style={{ overflowY: 'auto', maxHeight: '100vh' }}>
      {/* HeaderDriver */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50 }}>
        <HeaderDriver
          onToggleTheme={handleToggleTheme}
          theme={theme}
          user={user}
          unreadCount={unreadCount}
          nextBooking={nextBooking}
          onOpenBooking={() => { }}
        />
      </div>

      {/* Hero */}
      <div className="booking-hero" style={{ height: 400, width: 1500 }}>
        <video autoPlay loop muted playsInline poster="" preload="metadata">
          <source src="https://cdn.gogoro.com/resources/pages/home/kv/video-home-kv.mp4" type="video/mp4" />
        </video>
        <div className="booking-hero-content">
          <div className="hero-text">
            <h1>Đổi pin nhanh, sẵn sàng mọi hành trình</h1>
            <p>Đặt lịch trước để đến trạm là có pin ngay, không phải đợi.</p>
          </div>
          <div className="hero-badge">⚡ Nguồn cảm hứng: video Gogoro</div>
        </div>
      </div>

      <div className="booking-container">
        <div className="booking-card">
          <h2 className="booking-title">Đặt lịch đổi pin</h2>
          <p className="booking-sub">Chọn trạm, thời gian và mô tả yêu cầu của bạn</p>

          <form className="booking-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <label className="form-field">
                <span>Title</span>
                <input className="form-input" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nhập tiêu đề" />
              </label>
              <label className="form-field">
                <span>Description</span>
                <input className="form-input" type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mô tả ngắn" />
              </label>
            </div>

            <div className="form-row">
              <label className="form-field">
                <span>Date & Time</span>
                <input className="form-input" type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
              </label>
              <label className="form-field">
                <span>Station</span>
                <select className="form-input" value={stationId} onChange={(e) => setStationId(e.target.value)}>
                  {stations.map(st => (
                    <option key={st.stationId} value={st.stationId}>{st.stationName || st.stationId} — {st.location}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="form-row">
              <label className="form-field">
                <span>VIN</span>
                <select className="form-input" value={vin} onChange={(e) => setVin(e.target.value)}>
                  <option value="">Chọn VIN</option>
                  {myVehicles.map(v => {
                    const vvin = (v.VIN || v.vin || v.vehicleId || v.id || '').toString();
                    const vname = (v.vehicle_name || v.vehicleName || v.name || 'Vehicle');
                    return <option key={vvin} value={vvin}>{vname}</option>
                  })}
                </select>
              </label>
              <label className="form-field">
                <span>Pin phù hợp</span>
                {loadingBatteries ? (
                  <div className="form-input" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40px' }}>
                    <span>Đang tải pin...</span>
                  </div>
                ) : (
                  <>
                    <select
                      className="form-input"
                      value={batteryId}
                      onChange={(e) => {
                        const id = e.target.value;
                        const found = suitableBatteries.find(b => String(b.batteryId || b.BatteryId || b.id) === String(id));
                        const status = (found?.status || found?.Status || '').toString().toLowerCase();
                        if (status !== 'available') return;
                        setBatteryId(id);
                        const name = found?.batteryName || found?.BatteryName || found?.name || '';
                        setSelectedBatteryName(name);
                      }}
                    >
                      <option value="">
                        {!vin || !stationId
                          ? "Chọn VIN và Station trước"
                          : suitableBatteries.length === 0
                            ? "Không có pin phù hợp"
                            : "Chọn pin theo VIN + Station"
                        }
                      </option>
                      {suitableBatteries.map(b => {
                        const id = String(b.batteryId || b.BatteryId || b.id || '');
                        const name = b.batteryName || b.BatteryName || b.name || id;
                        const status = (b.status || b.Status || '').toString();
                        const isAvailable = status.toLowerCase() === 'available';
                        return (
                          <option key={id} value={id} disabled={!isAvailable}>
                            {name} — {status || '-'}
                          </option>
                        );
                      })}
                    </select>
                    {vin && stationId && suitableBatteries.length === 0 && !loadingBatteries && (
                      <div style={{ fontSize: '14px', color: '#f56565', marginTop: '4px' }}>
                        Không có pin nào phù hợp với xe và trạm đã chọn
                      </div>
                    )}
                  </>
                )}
                <input style={{ display: 'none' }} type="text" value={selectedBatteryName} readOnly />
              </label>
            </div>

            {/* CÁCH 1: Inline chọn phương thức ngay trong form (bật INLINE_METHOD = true) */}
            {INLINE_METHOD && (
              <div className="form-row">
                <div className="form-field">
                  <span>Phương thức thanh toán</span>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span className="badge">PrePaid</span>
                    <span className="badge">UsePackage</span>
                    <span className="badge">PaidAtStation</span>
                    <span className="badge">Package</span>
                  </div>
                  <small>Demo inline: bạn có thể lưu lựa chọn vào sessionStorage và gọi createOrder + PayOS sau khi CreateForm.</small>
                </div>
              </div>
            )}

            <div className="form-actions">
              <button className="btn primary" type="submit" disabled={loading}>{loading ? "Đang gửi..." : "Đặt lịch"}</button>
            </div>
          </form>

          {error && <div className="form-error">{error}</div>}
          {success && <div className="form-success">{success}</div>}
        </div>
      </div>

      {/* Popup chọn phương thức thanh toán (Cách 2) */}
      {showPayModal && (
        <PaymentMethodModal
          onClose={() => setShowPayModal(false)}
          onConfirm={handleCreatePayment}
          paying={paying}
          error={payError}
          serviceTypes={SERVICE_TYPES}
        />
      )}

      <Footer />
    </div>
  );
}

/** Payment modal component */
function PaymentMethodModal({ onClose, onConfirm, paying, error, serviceTypes }) {
  const [method, setMethod] = useState(serviceTypes.PREPAID);
  const [exchangeId, setExchangeId] = useState("");
  const [packageId, setPackageId] = useState("");

  const requireExchange = method === serviceTypes.PAID_AT_STATION;
  const requirePackage = method === serviceTypes.PACKAGE;

  const canSubmit = () => {
    if (requireExchange && !exchangeId) return false;
    if (requirePackage && !packageId) return false;
    return true;
  };

  return (
    <div className="modal-backdrop" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="modal-card" style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
            Chọn phương thức thanh toán
          </h3>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '4px'
            }}
          >
            ×
          </button>
        </div>
        
        <p style={{ marginTop: 4, color: '#6b7280', marginBottom: '20px', lineHeight: '1.5' }}>
          Vui lòng chọn phương thức thanh toán để hoàn tất đặt lịch. Hệ thống sẽ tự động tạo Order và chuyển bạn sang cổng PayOS.
        </p>

        <div className="modal-body">
          <label className="form-field" style={{ marginBottom: '16px' }}>
            <span style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
              Phương thức thanh toán *
            </span>
            <select
              className="form-input"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            >
              <option value={serviceTypes.PREPAID}>💳 PrePaid — thanh toán trước</option>
              <option value={serviceTypes.USE_PACKAGE}>📦 UsePackage — dùng gói đã mua</option>
              <option value={serviceTypes.PAID_AT_STATION}>🏪 PaidAtStation — thanh toán tại trạm</option>
              
            </select>
          </label>

          {requireExchange && (
            <label className="form-field" style={{ marginBottom: '16px' }}>
              <span style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                ExchangeId (bắt buộc khi thanh toán tại trạm) *
              </span>
              <input
                className="form-input"
                placeholder="Nhập ExchangeId"
                value={exchangeId}
                onChange={(e) => setExchangeId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                ID của giao dịch đổi pin tại trạm
              </small>
            </label>
          )}

          {requirePackage && (
            <label className="form-field" style={{ marginBottom: '16px' }}>
              <span style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                PackageId (bắt buộc khi mua gói) *
              </span>
              <input
                className="form-input"
                placeholder="Nhập PackageId"
                value={packageId}
                onChange={(e) => setPackageId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                ID của gói dịch vụ muốn mua
              </small>
            </label>
          )}

          {error && (
            <div className="form-error" style={{ 
              marginTop: 8, 
              padding: '12px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#dc2626',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}
        </div>

        <div className="modal-actions" style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              backgroundColor: 'white',
              color: '#374151',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Hủy
          </button>
          <button
            className="btn primary"
            disabled={paying || !canSubmit()}
            onClick={() => onConfirm({ serviceType: method, exchangeId, packageId })}
            style={{
              flex: 2,
              padding: '12px 16px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: paying || !canSubmit() ? '#9ca3af' : '#3b82f6',
              color: 'white',
              fontSize: '14px',
              fontWeight: '500',
              cursor: paying || !canSubmit() ? 'not-allowed' : 'pointer'
            }}
          >
            {paying ? "⏳ Đang tạo thanh toán..." : "💰 Tiếp tục thanh toán"}
          </button>
        </div>
      </div>
    </div>
  );
}
