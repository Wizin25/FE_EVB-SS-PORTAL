import React, { useEffect, useMemo, useRef, useState } from "react";
import HeaderDriver from "./header";
import Footer from "./footer";
import { authAPI } from "../services/authAPI";
import { vehicleAPI } from "../services/vehicleAPI";
import "../Admin/pages/Station.css";
import "./booking.css";

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
      
      // Create cache key from VIN + Station
      const cacheKey = `${vin}-${stationId}`;
      
      // Clear current list immediately when VIN or Station changes
      setSuitableBatteries([]);
      setBatteryId("");
      setSelectedBatteryName("");
      
      // Check if we have cached data for this combination
      if (batteryCacheRef.current.has(cacheKey)) {
        const cachedData = batteryCacheRef.current.get(cacheKey);
        setSuitableBatteries(cachedData);
        
        // Auto-select first available battery from cache
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
      
      // Show loading state for new data
      setLoadingBatteries(true);
      
      const seq = ++loadSeqRef.current;
      try {
        const list = await authAPI.getBatteriesSuitVehicle({ vin, stationId });
        const items = Array.isArray(list) ? list : [];
        if (seq !== loadSeqRef.current) return; // stale response guard
        
        // Cache the result
        batteryCacheRef.current.set(cacheKey, items);
        setSuitableBatteries(items);
        
        // Auto-select first available battery when station/vin changes
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
        // keep silent, keep previous but clear selection
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
        // Preselect from query if present
        const params = new URLSearchParams(window.location.search);
        const preselect = params.get('stationId');
        const qVin = params.get('vin');
        const qBatteryId = params.get('batteryId') || params.get('batteryID');
        const qBatteryName = params.get('batteryName');
        const found = Array.isArray(allStations) && allStations.find(s=>String(s.stationId)===String(preselect));
        if (preselect && found) setStationId(found.stationId);
        else if (Array.isArray(allStations) && allStations.length > 0) setStationId(allStations[0].stationId);
        if (qVin) setVin(qVin);
        if (qBatteryId) setBatteryId(qBatteryId);
        const initialBatteryName = qBatteryName || '';
        setSelectedBatteryName(initialBatteryName);
        // Load my linked vehicles for convenience
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
        } catch {}
      } catch (err) {
        setError(err?.message || "Không tải được dữ liệu ban đầu");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
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
      await authAPI.createForm({ accountId, title, description, date, stationId, vin, batteryId });
      setSuccess("Đặt lịch thành công.");
      setTitle("");
      setDescription("");
      setDate("");
      // giữ stationId như cũ
      // keep vin and batteryId as well
    } catch (err) {
      setError(err?.message || "Đặt lịch thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`} style={{ overflowY: 'auto', maxHeight: '100vh' }}>
      {/* HeaderDriver là lớp trên cùng của màn hình */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50 }}>
        <HeaderDriver
          onToggleTheme={handleToggleTheme}
          theme={theme}
          user={user}
          unreadCount={unreadCount}
          nextBooking={nextBooking}
          onOpenBooking={() => {}}
        />
      </div>

      {/* Hero video section */}
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
                <input className="form-input" type="text" value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Nhập tiêu đề" />
              </label>
              <label className="form-field">
                <span>Description</span>
                <input className="form-input" type="text" value={description} onChange={(e)=>setDescription(e.target.value)} placeholder="Mô tả ngắn" />
              </label>
            </div>

            <div className="form-row">
              <label className="form-field">
                <span>Date & Time</span>
                <input className="form-input" type="datetime-local" value={date} onChange={(e)=>setDate(e.target.value)} />
              </label>
              <label className="form-field">
                <span>Station</span>
                <select className="form-input" value={stationId} onChange={(e)=>setStationId(e.target.value)}>
                  {stations.map(st => (
                    <option key={st.stationId} value={st.stationId}>{st.stationName || st.stationId} — {st.location}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="form-row">
              <label className="form-field">
                <span>VIN</span>
                <select className="form-input" value={vin} onChange={(e)=>setVin(e.target.value)}>
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
                        if (status !== 'available') {
                          return; // guard: do not allow selecting non-available
                        }
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

            <div className="form-actions">
              <button className="btn primary" type="submit" disabled={loading}>{loading ? "Đang gửi..." : "Đặt lịch"}</button>
            </div>
          </form>

          {error && <div className="form-error">{error}</div>}
          {success && <div className="form-success">{success}</div>}
        </div>
      </div>

      <Footer />
    </div>
  );
}