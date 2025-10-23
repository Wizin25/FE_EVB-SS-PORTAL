import React, { useEffect, useMemo, useState } from "react";
import { authAPI } from "../services/authAPI";
import { vehicleAPI } from "../services/vehicleAPI";
import HeaderDriver from "./header";
import Footer from "./footer";
import "../Admin/pages/Station.css";
import RatingStation from "./RatingStation";

export default function StationForUser() {
  // theme and header-related states
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") || "light";
    }
    return "light";
  });
  const [user] = useState(null);
  const [unreadCount] = useState(0);
  const [nextBooking] = useState(null);

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
    const root = document.documentElement;
    if (savedTheme === "dark") {
      root.classList.add("dark");
      document.body.classList.add("dark");
    }
  }, []);

  const handleOpenBooking = () => {
    window.location.href = "/booking";
  };
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openRatingFor, setOpenRatingFor] = useState(null);
  const [currentAccountId, setCurrentAccountId] = useState("");
  // Vehicles linked to current user
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleVin, setSelectedVehicleVin] = useState("");
  // State to track expanded battery details for each station
  const [expandedStations, setExpandedStations] = useState(new Set());

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Array of images to rotate through
  const stationImages = [
    "https://www.global-imi.com/sites/default/files/shutterstock_2002470953-min%20%281%29_1.jpg",
    "https://cdn.prod.website-files.com/6463200e1042b2ca8283ce6b/647869ba7866270da76ee1bb_Battery-Swapping-station%20main-min.jpg"
  ];

  const fetchStations = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await authAPI.getAllStations();
      setStations(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "Không tải được danh sách trạm");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStations(); }, []);

  // Load linked vehicles for current user
  useEffect(() => {
    (async () => {
      try {
        const res = await vehicleAPI.getCurrentUserVehicles();
        let list = [];
        if (Array.isArray(res)) list = res;
        else if (res?.data?.data && Array.isArray(res.data.data)) list = res.data.data;
        else if (res?.data && Array.isArray(res.data)) list = res.data;
        // only active/linked
        const filtered = list.filter(v => {
          const s = (v.status || v.Status || '').toString().toLowerCase();
          return s === 'active' || s === 'linked';
        });
        
        // Load battery info for each vehicle
        const vehiclesWithBattery = await Promise.all(
          filtered.map(async (vehicle) => {
            try {
              const vehicleId = vprop(vehicle, 'vin');
              if (vehicleId) {
                const batteryInfo = await vehicleAPI.getBatteryByVehicleId(vehicleId);
                return {
                  ...vehicle,
                  battery: batteryInfo?.data || batteryInfo
                };
              }
              return vehicle;
            } catch (e) {
              console.log('Failed to load battery for vehicle:', vprop(vehicle, 'vin'), e);
              return vehicle;
            }
          })
        );
        
        setVehicles(vehiclesWithBattery);
        if (vehiclesWithBattery.length > 0) {
          const vin = vprop(vehiclesWithBattery[0], 'vin');
          setSelectedVehicleVin(vin);
        }
      } catch (e) {
        console.error('Failed to load vehicles:', e);
      }
    })();
  }, []);

  useEffect(() => {
    // Try get current user info to fill AccountId
    (async () => {
      try {
        const me = await authAPI.getCurrent();
        if (me?.accountId) setCurrentAccountId(me.accountId);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  // helper to get property with multiple possible keys
  const vprop = (obj, key) => {
    const map = {
      vin: ['VIN','vin','vehicleId','vehicleID','id'],
      batteryId: ['BatteryID','batteryId','batteryID','battery'],
      batteryName: ['batteryName','BatteryName','name','Name'],
      batteryType: ['batteryType','BatteryType','type','Type'],
      batterySpec: ['specification','Specification','spec','Spec'],
      batteryCapacity: ['capacity','Capacity'],
      batteryQuality: ['batteryQuality','BatteryQuality','quality','Quality'],
      vehicleName: ['vehicle_name','vehicleName','name','model','vehicle_name']
    };
    const keys = map[key] || [key];
    for (const k of keys) if (obj && obj[k] != null) return obj[k];
    return '';
  };

  // Determine selected vehicle battery requirements
  const selectedVehicle = useMemo(() => vehicles.find(v => vprop(v,'vin') === selectedVehicleVin), [vehicles, selectedVehicleVin]);
  const selectedVehicleBatteryType = useMemo(() => vprop(selectedVehicle?.battery || selectedVehicle, 'batteryType').toString().toLowerCase(), [selectedVehicle]);
  const selectedVehicleBatterySpec = useMemo(() => vprop(selectedVehicle?.battery || selectedVehicle, 'batterySpec').toString().toLowerCase(), [selectedVehicle]);

  const batteryCompatible = (battery) => {
    if (!selectedVehicleVin) return true; // no vehicle chosen, show all
    
    const bType = (vprop(battery, 'batteryType') || '').toString().toLowerCase();
    const bSpec = (vprop(battery, 'batterySpec') || '').toString().toLowerCase();
    
    // Kiểm tra xem xe có thông tin battery type/spec không (không phải chuỗi rỗng)
    const hasVehicleType = selectedVehicleBatteryType && selectedVehicleBatteryType.trim() !== '';
    const hasVehicleSpec = selectedVehicleBatterySpec && selectedVehicleBatterySpec.trim() !== '';
    
    // Nếu xe không có thông tin battery type/spec, coi như tất cả pin đều compatible
    if (!hasVehicleType && !hasVehicleSpec) return true;
    
    // Nếu xe có thông tin battery type/spec, phải match chính xác
    const typeMatch = !hasVehicleType || bType === selectedVehicleBatteryType;
    const specMatch = !hasVehicleSpec || bSpec === selectedVehicleBatterySpec;
    
    return typeMatch && specMatch;
  };

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    return stations.filter((st) => {
      // Always hide inactive stations
      const stationStatus = (st.status ?? "").toLowerCase();
      if (stationStatus === "inactive") return false;
      
      if (statusFilter !== "All" && stationStatus !== statusFilter.toLowerCase()) return false;
      if (!text) return true;
      const candidate = `${st.stationName ?? st.Name ?? ""} ${st.location ?? ""}`.toLowerCase();
      if (!candidate.includes(text)) return false;
      // If a vehicle is selected, only keep stations having at least one compatible battery
      if (selectedVehicleVin) {
        const bs = Array.isArray(st.batteries) ? st.batteries : [];
        return bs.some(batteryCompatible);
      }
      return true;
    });
  }, [stations, q, statusFilter, selectedVehicleVin, selectedVehicleBatteryType, selectedVehicleBatterySpec]);

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filtered.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [q, statusFilter]);

  const safeLen = (arr) => (Array.isArray(arr) ? arr.length : 0);
  

  // Function to toggle battery details visibility for a station
  const toggleStationDetails = (stationId) => {
    setExpandedStations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stationId)) {
        newSet.delete(stationId);
      } else {
        newSet.add(stationId);
      }
      return newSet;
    });
  };

  // Function to handle navigation
  const navigate = (path) => {
    window.location.href = path;
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
          user={user}
          unreadCount={unreadCount}
          nextBooking={nextBooking}
          onOpenBooking={() => {}}
        />
      </div>
      {/* Main illustration with subtle border and shadow */}
      <div
            style={{
              width: "100%",
              maxWidth: 1500,
              margin: "0 auto 1.5rem auto",
              borderRadius: "8px",
              overflow: "hidden",
              boxShadow:
                theme === "dark"
                  ? "0 6px 32px rgba(59,130,246,0.12)"
                  : "0 6px 32px rgba(16,185,129,0.13)",
              border: theme === "dark"
                ? "1.5px solid #334155"
                : "1.5px solid #bbf7d0",
              position: "relative",
              zIndex: 2
            }}
          >
            <img
              src="https://etimg.etb2bimg.com/photo/97076517.cms"
              alt="Battery Station Modern"
              style={{
                width: "100%",
                height: "320px",
                objectFit: "cover",
                display: "block",
                background: "#e0ffe7"
              }}
            />
          </div>
      <div className="station-container">
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
          {/* Decorative floating shapes */}
          <div
            style={{
              position: "absolute",
              top: "-60px",
              left: "-60px",
              width: "160px",
              height: "160px",
              background:
                theme === "dark"
                  ? "radial-gradient(circle, #38bdf8 0%, #232946 80%)"
                  : "radial-gradient(circle, #bbf7d0 0%, #e0ffe7 80%)",
              opacity: 0.25,
              borderRadius: "50%",
              zIndex: 1,
              filter: "blur(2px)"
            }}
          ></div>
          <div
            style={{
              position: "absolute",
              bottom: "-40px",
              right: "-40px",
              width: "120px",
              height: "120px",
              background:
                theme === "dark"
                  ? "radial-gradient(circle, #fbbf24 0%, #232946 80%)"
                  : "radial-gradient(circle, #fbbf24 0%, #b2f5ea 80%)",
              opacity: 0.18,
              borderRadius: "50%",
              zIndex: 1,
              filter: "blur(1.5px)"
            }}
          ></div>
          <div
            style={{
              position: "absolute",
              top: "30px",
              right: "40px",
              width: "60px",
              height: "60px",
              background:
                theme === "dark"
                  ? "radial-gradient(circle, #10b981 0%, #232946 80%)"
                  : "radial-gradient(circle, #10b981 0%,rgb(49, 220, 89) 80%)",
              opacity: 0.22,
              borderRadius: "50%",
              zIndex: 1,
              filter: "blur(1.5px)"
            }}
          ></div>
        
          <h2
            className="station-title"
            style={{
              color: theme === "dark" ? "#f1f5f9" : "#059669",
              fontSize: "2.7rem",
              fontWeight: 800,
              marginBottom: "0.7rem",
              letterSpacing: "-1px",
              position: "relative",
              zIndex: 3,
              textShadow:
                theme === "dark"
                  ? "0 2px 12px #232946"
                  : "0 2px 12px #bbf7d0"
            }}
          >
            <span style={{ fontSize: "2.2rem", marginRight: 8 }}>🔋</span>
            Danh sách trạm đổi pin
          </h2>
          <p
            style={{
              fontSize: "1.18rem",
              opacity: 0.93,
              position: "relative",
              zIndex: 3,
              marginBottom: 0,
              color: theme === "dark" ? "#cbd5e1" : "#334155",
              fontWeight: 500
            }}
          >
            Tìm kiếm và đặt lịch tại các trạm đổi pin gần bạn
          </p>
          {/* Decorative animated icon strip */}
          <div
            style={{
              marginTop: "1.5rem",
              display: "flex",
              justifyContent: "center",
              gap: "1.5rem",
              zIndex: 4,
              position: "relative"
            }}
          >
            <span
              style={{
                fontSize: "1.7rem",
                animation: "bounce 1.6s infinite alternate"
              }}
              role="img"
              aria-label="battery"
            >
              🔋
            </span>
            <span
              style={{
                fontSize: "1.7rem",
                animation: "bounce 1.6s 0.3s infinite alternate"
              }}
              role="img"
              aria-label="charging"
            >
              ⚡
            </span>
            <span
              style={{
                fontSize: "1.7rem",
                animation: "bounce 1.6s 0.6s infinite alternate"
              }}
              role="img"
              aria-label="location"
            >
              📍
            </span>
            <span
              style={{
                fontSize: "1.7rem",
                animation: "bounce 1.6s 0.9s infinite alternate"
              }}
              role="img"
              aria-label="calendar"
            >
              📅
            </span>
          </div>
          <style>
            {`
              @keyframes bounce {
                0% { transform: translateY(0);}
                100% { transform: translateY(-12px);}
              }
            `}
          </style>
        </div>

        <div className="station-controls">
          <select
            className="station-select"
            value={selectedVehicleVin}
            onChange={(e)=>setSelectedVehicleVin(e.target.value)}
          >
            <option value="">🚗 Chọn xe đã liên kết (lọc theo pin phù hợp)</option>
            {vehicles.map(v => (
              <option key={vprop(v,'vin')} value={vprop(v,'vin')}>
                {vprop(v,'vehicleName') || vprop(v,'name') || 'Vehicle'}
              </option>
            ))}
          </select>
          <input
            className="station-search"
            placeholder="🔍 Tìm tên trạm hoặc location..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select className="station-select" value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)}>
            <option value="All">📊 Tất cả trạng thái</option>
            <option value="Active">✅ Active</option>
            <option value="Inactive">❌ Inactive</option>
          </select>
          <button className="btn" onClick={fetchStations} disabled={loading}>
            {loading ? "🔄 Đang tải..." : "🔄 Reload"}
          </button>
        </div>

        <div className="station-summary">
          <span className="total-count">
            📈 Tổng số trạm: <strong>{totalItems}</strong>
            {totalItems > 0 && (
              <span className="page-info">
                {" "}(Trang {currentPage}/{totalPages} - Hiển thị {startIndex + 1}-{Math.min(endIndex, totalItems)})
              </span>
            )}
          </span>
        </div>

        {error && <div className="station-error">❌ Lỗi: {error}</div>}
        {loading && <div className="station-loading">⏳ Đang tải dữ liệu...</div>}

        {!loading && !error && (
          totalItems === 0 ? (
            <div className="station-empty">🔍 Không tìm thấy trạm nào phù hợp.</div>
          ) : (
            <div className="station-grid">
              {currentItems.map((st, idx) => {
                const stationUniqueId = st.stationId ?? st.StationId ?? st.id ?? idx;
                const isExpanded = expandedStations.has(stationUniqueId);
                return (
                <article 
                  key={stationUniqueId} 
                  className="station-card-for-user" 
                  style={{ 
                    animationDelay: `${idx * 40}ms`,
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
                    overflow: 'hidden',
                    position: 'relative',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = theme === 'dark'
                      ? '0 20px 40px rgba(0, 0, 0, 0.4)'
                      : '0 20px 40px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = theme === 'dark'
                      ? '0 10px 25px rgba(0, 0, 0, 0.3)'
                      : '0 10px 25px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  {/* Station Image */}
                  <div style={{
                    height: '200px',
                    background: `url(${stationImages[idx % stationImages.length]}) center/cover`,
                    position: 'relative'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: (st.status ?? "").toLowerCase() === "active" 
                        ? 'rgba(34, 197, 94, 0.9)' 
                        : 'rgba(239, 68, 68, 0.9)',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      backdropFilter: 'blur(10px)'
                    }}>
                      {(st.status ?? "").toLowerCase() === "active" ? "🟢" : "🔴"} {st.status ?? "Unknown"}
                    </div>
                    <div style={{
                      position: 'absolute',
                      bottom: '0',
                      left: '0',
                      right: '0',
                      background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                      height: '60px'
                    }}></div>
                  </div>

                  <div style={{ padding: '20px' }}>
                    <div className="station-head" style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-start',
                      marginBottom: '12px'
                    }}>
                      <div className="head-left" style={{ flex: 1 }}>
                        <h3 className="station-id" style={{
                          fontSize: '1.4rem',
                          fontWeight: 'bold',
                          color: theme === 'dark' ? '#f1f5f9' : '#1e293b',
                          marginBottom: '8px'
                        }}>
                          🏢 {st.stationName ?? "Tên trạm chưa có"}
                        </h3>
                        <div className="station-subinfo" style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '12px'
                        }}>
                          <span className="sub-location" style={{
                            color: theme === 'dark' ? '#94a3b8' : '#64748b',
                            fontSize: '0.9rem'
                          }}>
                            📍 {st.location ?? "-"}
                          </span>
                          <span className="sub-sep" style={{
                            color: theme === 'dark' ? '#64748b' : '#94a3b8'
                          }}>•</span>
                          <span className="sub-rating" style={{
                            color: theme === 'dark' ? '#fbbf24' : '#f59e0b',
                            fontSize: '0.9rem',
                            fontWeight: '500'
                          }}>
                            ⭐ {typeof st.rating === "number" ? st.rating.toFixed(1) : "-"}
                          </span>
                        </div>
                      </div>
                      <div className="emergency-actions" style={{ marginLeft: '16px' }}>
                        <button 
                          className="emergency-btn primary" 
                          onClick={() => navigate('/report')}
                          style={{
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: '20px',
                            border: 'none',
                            fontWeight: 'bold',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = 'scale(1.05)';
                            e.target.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'scale(1)';
                            e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                          }}
                        >
                        ⚠️
                        </button>
                      </div>
                    </div>

                    <div className="summary-row" style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '16px',
                      marginBottom: '20px',
                      padding: '16px',
                      background: theme === 'dark' 
                        ? 'rgba(55, 65, 81, 0.5)' 
                        : 'rgba(248, 250, 252, 0.8)',
                      borderRadius: '12px',
                      border: theme === 'dark' 
                        ? '1px solid rgba(75, 85, 99, 0.3)'
                        : '1px solid rgba(226, 232, 240, 0.5)'
                    }}>
                      <div className="summary-item" style={{ textAlign: 'center' }}>
                        <div className="summary-num" style={{
                          fontSize: '1.8rem',
                          fontWeight: 'bold',
                          color: theme === 'dark' ? '#3b82f6' : '#2563eb',
                          marginBottom: '4px'
                        }}>
                          🔋 {st.batteryNumber ?? 0}
                        </div>
                        <div className="summary-label" style={{
                          fontSize: '0.8rem',
                          color: theme === 'dark' ? '#94a3b8' : '#64748b'
                        }}>
                          Số pin đăng ký
                        </div>
                      </div>
                      <div className="summary-item" style={{ textAlign: 'center' }}>
                        <div className="summary-num" style={{
                          fontSize: '1.8rem',
                          fontWeight: 'bold',
                          color: theme === 'dark' ? '#10b981' : '#059669',
                          marginBottom: '4px'
                        }}>
                          ⚡ {safeLen(st.batteries)}
                        </div>
                        <div className="summary-label" style={{
                          fontSize: '0.8rem',
                          color: theme === 'dark' ? '#94a3b8' : '#64748b'
                        }}>
                          Pin đang ở trạm
                        </div>
                      </div>
                      <div className="summary-item hide-mobile" style={{ textAlign: 'center' }}>
                        <div className="summary-num" style={{
                          fontSize: '1.8rem',
                          fontWeight: 'bold',
                          color: theme === 'dark' ? '#f59e0b' : '#d97706',
                          marginBottom: '4px'
                        }}>
                          📊 {safeLen(st.batteryHistories)}
                        </div>
                        <div className="summary-label" style={{
                          fontSize: '0.8rem',
                          color: theme === 'dark' ? '#94a3b8' : '#64748b'
                        }}>
                          Lịch sử
                        </div>
                      </div>
                    </div>

                    {/* Batteries detail list - Đẹp trai, lung linh hơn */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
                      <button
                        type="button"
                        onClick={() => toggleStationDetails(stationUniqueId)}
                        style={{
                          padding: '10px 18px',
                          borderRadius: '9999px',
                          border: 'none',
                          fontWeight: 600,
                          cursor: 'pointer',
                          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                          color: '#fff',
                          boxShadow: '0 8px 20px rgba(37, 99, 235, 0.25)',
                          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 12px 30px rgba(37, 99, 235, 0.35)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 8px 20px rgba(37, 99, 235, 0.25)';
                        }}
                      >
                        {isExpanded ? 'Thu gọn danh sách pin' : 'Xem danh sách pin'}
                      </button>
                    </div>
                    {isExpanded && (
                    <div
                      style={{
                        marginTop: '20px',
                        marginBottom: '20px',
                        borderTop: theme === 'dark' ? '2px solid #2563eb' : '2px solid #3b82f6',
                        paddingTop: '20px',
                        background: theme === 'dark' ? 'rgba(16,24,39,0.70)' : 'rgba(236,245,255,0.70)',
                        borderRadius: 12,
                        boxShadow: theme === 'dark'
                          ? '0 2px 12px rgba(30,41,59,.10)'
                          : '0 4px 16px rgba(59,130,246,0.09)'
                      }}
                    >
                      <h3
                        style={{
                          margin: '0 0 24px 0',
                          fontSize: '1.27rem',
                          color: theme === 'dark' ? '#60a5fa' : '#2563eb',
                          fontWeight: 'bold',
                          letterSpacing: 0.2,
                          textAlign: 'center'
                        }}
                      >
                        🪫 Danh sách pin tại trạm
                      </h3>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                          gap: '18px'
                        }}
                      >
                        {(Array.isArray(st.batteries) ? st.batteries : []).map((b) => {
                          const bid = vprop(b,'batteryId') || vprop(b,'id') || vprop(b,'BatteryId');
                          const bname = vprop(b,'batteryName') || bid || 'N/A';
                          const btype = vprop(b,'batteryType') || '-';
                          const bspec = vprop(b,'batterySpec') || '-';
                          const bcap = vprop(b,'batteryCapacity');
                          const bqual = vprop(b,'batteryQuality');
                          const bstatus = (b.status || b.Status || '').toString();
                          const compatible = batteryCompatible(b);
                          const isBooked = bstatus.toLowerCase() === 'booked';

                          // Smart icon and status color
                          let statusChipColor = '#eab308', statusIcon = '🟡';
                          if (bstatus.toLowerCase() === 'active') { statusChipColor = '#22c55e'; statusIcon = '🟢'; }
                          else if (isBooked) { statusChipColor = '#f87171'; statusIcon = '🔴'; }
                          else if (bstatus.toLowerCase().includes('ready')) { statusChipColor = '#06b6d4'; statusIcon = '🔋'; }

                          // Compose battery card
                          return (
                            <div
                              key={String(bid)}
                              style={{
                                border: compatible
                                  ? '1px solid #22c55e'
                                  : (theme === 'dark' ? '1.5px solid #334155' : '1.5px solid #e5e7eb'),
                                borderRadius: 14,
                                background: compatible
                                  ? (theme === 'dark' ? 'linear-gradient(100deg,#14532d30 10%,#111827 90%)' : 'linear-gradient(100deg, #f0fdf4 80%, #bbf7d0 100%)')
                                  : (theme === 'dark' ? '#151a23' : '#f8fafc'),
                                boxShadow: compatible
                                  ? (theme === 'dark'
                                    ? '0 2px 12px #22c55e1a'
                                    : '0 2px 9px #36d39919')
                                  : undefined,
                                padding: '16px 14px 14px 14px',
                                transition: 'all 0.18s'
                              }}
                            >
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                marginBottom: '10px',
                                gap: '8px'
                              }}>
                                <span style={{
                                  fontSize: 22,
                                  verticalAlign: 'middle',
                                }}>
                                  {statusIcon}
                                </span>
                                <span style={{
                                  display: 'inline-block',
                                  fontSize: 13,
                                  fontWeight: '700',
                                  color: statusChipColor,
                                  background: theme === 'dark'
                                    ? '#1e293b' : '#f3f4f6',
                                  borderRadius: 15,
                                  padding: '2px 10px',
                                  border: `1px solid ${statusChipColor}`,
                                  letterSpacing: '0.04em',
                                  boxShadow: theme === 'dark' ? undefined : '0 1px 3px #c7d2fe19'
                                }}>
                                  {bstatus ? bstatus : 'Chưa rõ trạng thái'}
                                </span>
                              </div>
                              <div style={{
                                fontSize: 14.5,
                                fontWeight: 600,
                                marginBottom: 7,
                                color: theme === 'dark' ? '#bae6fd' : '#0369a1',
                                textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap"
                              }}>
                                <span style={{
                                  marginRight: 6,
                                  letterSpacing: 0.02
                                }}>🔋 {bname}</span>
                              </div>
                              <div
                                style={{
                                  fontSize: 12.5,
                                  color: theme === 'dark' ? '#cbd5e1' : '#374151',
                                  marginBottom: 5,
                                  display: 'grid',
                                  rowGap: '3px'
                                }}>
                                <div>BatteryID: <b>{bid || 'N/A'}</b></div>
                                <div>Loại: <b>{btype}</b></div>
                                <div>Dung lượng: <b>{bcap ?? '-'}</b> | Spec: <b>{bspec}</b></div>
                                <div>Chất lượng: <b>{bqual ?? '-'}</b></div>
                              </div>
                              <div style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                marginTop: 12
                              }}>
                                <a
                                  className="btn small"
                                  href={
                                    (!compatible || isBooked)
                                      ? undefined
                                      : `/booking?stationId=${encodeURIComponent(st.stationId)}&batteryId=${encodeURIComponent(bid)}&batteryName=${encodeURIComponent(bname)}${selectedVehicleVin ? `&vin=${encodeURIComponent(selectedVehicleVin)}` : ''}`
                                  }
                                  style={{
                                    background: (compatible && !isBooked)
                                      ? 'linear-gradient(93deg, #22d3ee 0%, #38bdf8 29%, #22c55e 100%)'
                                      : (theme === 'dark' ? '#334155' : '#e5e7eb'),
                                    color: (compatible && !isBooked) ? 'white' : (theme === 'dark' ? '#cbd5e1' : '#0f172a'),
                                    border: (compatible && !isBooked)
                                      ? 'none'
                                      : (theme === 'dark' ? '1px solid #334155' : '1px solid #d1d5db'),
                                    fontWeight: 700,
                                    padding: '7px 16px',
                                    borderRadius: '18px',
                                    textDecoration: 'none',
                                    transition: 'all 0.17s',
                                    pointerEvents: (compatible && !isBooked) ? 'auto' : 'none',
                                    opacity: (compatible && !isBooked) ? 1 : 0.5,
                                    fontSize: 13
                                  }}
                                >
                                  {(compatible && !isBooked) ? '🔁 Chọn pin này' : (isBooked ?  'Đã được đặt' : 'Không phù hợp')}
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <button
                        className="btn"
                        style={{
                          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                          color: 'white',
                          padding: '10px 16px',
                          borderRadius: '25px',
                          fontWeight: 'bold',
                          border: 'none'
                        }}
                        onClick={() => setOpenRatingFor(st)}
                      >
                        ⭐ Đánh giá
                      </button>
                      <a 
                        className="btn primary" 
                        href={`/booking?stationId=${encodeURIComponent(st.stationId)}`}
                        style={{
                          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                          color: 'white',
                          padding: '12px 24px',
                          borderRadius: '25px',
                          textDecoration: 'none',
                          fontWeight: 'bold',
                          fontSize: '0.9rem',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
                          border: 'none'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'scale(1.05)';
                          e.target.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'scale(1)';
                          e.target.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)';
                        }}
                      >
                        📅 Đặt lịch
                      </a>
                    </div>
                  </div>
                </article>
                );
              })}
            </div>
          )
        )}

        {totalPages > 1 && (
          <div className="pagination" style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '12px',
            marginTop: '2rem',
            padding: '20px'
          }}>
            <button
              className="btn small"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                background: theme === 'dark' ? '#374151' : '#f1f5f9',
                color: theme === 'dark' ? '#f1f5f9' : '#1e293b',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: '500'
              }}
            >
              ← Trước
            </button>
            <div className="page-numbers" style={{
              display: 'flex',
              gap: '4px'
            }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  className={`btn small ${page === currentPage ? 'active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                  style={{
                    background: page === currentPage 
                      ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                      : theme === 'dark' ? '#374151' : '#f1f5f9',
                    color: page === currentPage 
                      ? 'white'
                      : theme === 'dark' ? '#f1f5f9' : '#1e293b',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontWeight: '500',
                    minWidth: '40px'
                  }}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              className="btn small"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{
                background: theme === 'dark' ? '#374151' : '#f1f5f9',
                color: theme === 'dark' ? '#f1f5f9' : '#1e293b',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: '500'
              }}
            >
              Sau →
            </button>
          </div>
        )}
      </div>

      {openRatingFor && (
        <RatingStation
          stationId={openRatingFor.stationId}
          accountId={currentAccountId}
          onClose={() => setOpenRatingFor(null)}
          onSuccess={fetchStations}
        />
      )}

      <Footer />
    </div>
  );
}