import React, { useEffect, useMemo, useState, useRef } from "react";
import { authAPI } from "../services/authAPI";
import { vehicleAPI } from "../services/vehicleAPI";
import HeaderDriver from "./header";
import Footer from "./footer";
import "../Admin/pages/Station.css";
import RatingStation from "./RatingStation";
import { useNavigate } from "react-router-dom";

export default function StationForUser() {
  const navigate = useNavigate();

  // ================= THEME / HEADER =================
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

  // ================= CORE STATES =================
  const [stations, setStations] = useState([]);
  const [error, setError] = useState("");
  const [openRatingFor, setOpenRatingFor] = useState(null);
  const [currentAccountId, setCurrentAccountId] = useState("");

  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleVin, setSelectedVehicleVin] = useState("");

  const [expandedStations, setExpandedStations] = useState(new Set());
  const [showMapFor, setShowMapFor] = useState({});

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Loading flags
  const [isLoading, setIsLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Station detail + auto refresh
  const [stationDetails, setStationDetails] = useState({});
  const [batteryIntervals, setBatteryIntervals] = useState({});
  const batteryIntervalsRef = useRef(batteryIntervals);
  batteryIntervalsRef.current = batteryIntervals;

  // Slot modal
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [activeSlot, setActiveSlot] = useState(null);
  const [slotBattery, setSlotBattery] = useState(null);

  // ================= FLOW ĐỔI PIN =================
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [swapVin, setSwapVin] = useState("");
  const [pendingExchange, setPendingExchange] = useState(null);
  const [swapLoading, setSwapLoading] = useState(false);
  const [swapError, setSwapError] = useState("");
  const [swapSuccess, setSwapSuccess] = useState("");

  // Background images fallback
  const stationImages = [
    "https://www.global-imi.com/sites/default/files/shutterstock_2002470953-min%20%281%29_1.jpg",
    "https://cdn.prod.website-files.com/6463200e1042b2ca8283ce6b/647869ba7866270da76ee1bb_Battery-Swapping-station%20main-min.jpg"
  ];

  // ================= HELPERS =================
  const unwrapStations = (res) => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.data)) return res.data.data;
    return [];
  };

  const vprop = (obj, key) => {
    const map = {
      vin: ["VIN", "vin", "vehicleId", "vehicleID", "id"],
      batteryId: ["BatteryID", "batteryId", "batteryID", "battery"],
      batteryName: ["batteryName", "BatteryName", "name", "Name"],
      batteryType: ["batteryType", "BatteryType", "type", "Type"],
      batterySpec: ["specification", "Specification", "spec", "Spec"],
      batteryCapacity: ["capacity", "Capacity"],
      batteryQuality: ["batteryQuality", "BatteryQuality", "quality", "Quality"],
      vehicleName: ["vehicle_name", "vehicleName", "name", "model", "vehicle_name"]
    };
    const keys = map[key] || [key];
    for (const k of keys) if (obj && obj[k] != null) return obj[k];
    return "";
  };

  // ================= FETCH STATIONS =================
  const fetchStations = async ({ silent = false } = {}) => {
    if (!silent) setIsLoading(true);
    setError("");
    try {
      const res = await authAPI.getAllStations();
      const newStations = unwrapStations(res);
      setStations(newStations);

      // Nếu đang mở modal slot, cố gắng cập nhật theo station mới (nếu cần)
      if (showSlotModal && activeSlot) {
        const st = newStations.find(
          (s) => s.stationId === (activeSlot.stationId || activeSlot?.stationId)
        );
        const updatedSlot = st?.slots?.find((sl) => sl.slotId === activeSlot.slotId);

        if (updatedSlot) {
          const updatedBattery = updatedSlot.battery || null;
          if (updatedBattery && batteryCompatible(updatedBattery)) {
            setActiveSlot((prev) => ({
              ...prev,
              ...updatedSlot,
              stationId: st.stationId
            }));
            setSlotBattery(updatedBattery);
          } else {
            setSlotBattery(null);
          }
        } else {
          setSlotBattery(null);
        }
      }
    } catch (err) {
      setError(err?.message || "Không tải được danh sách trạm");
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // ================= FETCH SUITABLE STATIONS FOR VEHICLE =================
  const fetchSuitStations = async (vehicleId) => {
    setIsLoading(true);
    setError("");
    try {
      const res = await authAPI.getAllStationsOfCustomerSuitVehicle(vehicleId);
      setStations(res); // BE trả đúng danh sách trạm phù hợp
    } catch (err) {
      setError(err?.message || "Không tải được danh sách trạm phù hợp với xe");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();
  }, []);

  // ================= FETCH VEHICLES + BATTERY =================
  useEffect(() => {
    (async () => {
      try {
        const res = await vehicleAPI.getCurrentUserVehicles();
        let list = [];
        if (Array.isArray(res)) list = res;
        else if (res?.data?.data && Array.isArray(res.data.data)) list = res.data.data;
        else if (res?.data && Array.isArray(res.data)) list = res.data;

        const filtered = list.filter((v) => {
          const s = (v.status || v.Status || "").toString().toLowerCase();
          return s === "active" || s === "linked";
        });

        const vehiclesWithBattery = await Promise.all(
          filtered.map(async (vehicle) => {
            try {
              const vehicleId = vprop(vehicle, "vin");
              if (vehicleId) {
                const batteryInfo = await vehicleAPI.getBatteryByVehicleId(vehicleId);
                return {
                  ...vehicle,
                  battery: batteryInfo?.data || batteryInfo
                };
              }
              return vehicle;
            } catch (e) {
              console.log("Failed to load battery for vehicle:", vprop(vehicle, "vin"), e);
              return vehicle;
            }
          })
        );

        setVehicles(vehiclesWithBattery);
      } catch (e) {
        console.error("Failed to load vehicles:", e);
      }
    })();
  }, []);

  // ================= FETCH CURRENT USER (ACCOUNTID) =================
  useEffect(() => {
    (async () => {
      try {
        const res = await authAPI.getCurrent();
        const me = res?.data?.data || res?.data || res;
        if (me?.accountId) {
          setCurrentAccountId(me.accountId);
        } else {
          console.log("Không tìm thấy accountId trong response:", me);
        }
      } catch (e) {
        console.error("Lỗi khi gọi getCurrent:", e);
      }
    })();
  }, []);

  // ================= BATTERY COMPAT =================
  const selectedVehicle = useMemo(
    () => vehicles.find((v) => vprop(v, "vin") === selectedVehicleVin),
    [vehicles, selectedVehicleVin]
  );
  const selectedVehicleBatteryType = useMemo(
    () =>
      vprop(selectedVehicle?.battery || selectedVehicle, "batteryType")
        .toString()
        .toLowerCase(),
    [selectedVehicle]
  );
  const selectedVehicleBatterySpec = useMemo(
    () =>
      vprop(selectedVehicle?.battery || selectedVehicle, "batterySpec")
        .toString()
        .toLowerCase(),
    [selectedVehicle]
  );

  const batteryCompatible = (battery) => {
    if (!selectedVehicleVin) return true;
    const bType = (vprop(battery, "batteryType") || "").toString().toLowerCase();
    const bSpec = (vprop(battery, "batterySpec") || "").toString().toLowerCase();

    const hasVehicleType = selectedVehicleBatteryType && selectedVehicleBatteryType.trim() !== "";
    const hasVehicleSpec = selectedVehicleBatterySpec && selectedVehicleBatterySpec.trim() !== "";

    if (!hasVehicleType && !hasVehicleSpec) return true;

    const typeMatch = !hasVehicleType || bType === selectedVehicleBatteryType;
    const specMatch = !hasVehicleSpec || bSpec === selectedVehicleBatterySpec;

    return typeMatch && specMatch;
  };

  // ================= FILTERED STATIONS =================
  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    return stations.filter((st) => {
      const stationStatus = (st.status ?? "").toLowerCase();
      if (stationStatus === "inactive") return false;

      if (statusFilter !== "All" && stationStatus !== statusFilter.toLowerCase()) return false;

      if (text) {
        const candidate = `${st.stationName ?? st.Name ?? ""} ${st.location ?? ""}`.toLowerCase();
        if (!candidate.includes(text)) return false;
      }

      // FE filter pin đã bỏ khi chọn xe, vì BE đã trả đúng.
      // if (selectedVehicleVin) {
      //   const bs = Array.isArray(st.slots)
      //     ? st.slots.map((s) => s?.battery).filter(Boolean)
      //     : [];
      //   return bs.some(batteryCompatible);
      // }

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
  }, [q, statusFilter, selectedVehicleVin]);

  // ================= FETCH STATION DETAIL (PIN) =================
  const fetchStationDetail = async (stationId) => {
    try {
      setLoadingDetails(true);
      const res = await authAPI.getStationById(stationId);
      const data = res?.data?.data || res?.data || res;
      setStationDetails((prev) => ({
        ...prev,
        [stationId]: data
      }));
    } catch (err) {
      console.error("Failed to fetch station detail:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleToggleStationDetail = async (stationId) => {
    const isExpanded = expandedStations.has(stationId);

    if (isExpanded) {
      setExpandedStations((prev) => {
        const s = new Set(prev);
        s.delete(stationId);
        return s;
      });

      if (batteryIntervals[stationId]) {
        clearInterval(batteryIntervals[stationId]);
        setBatteryIntervals((prev) => {
          const clone = { ...prev };
          delete clone[stationId];
          return clone;
        });
      }
      return;
    }

    await fetchStationDetail(stationId);

    setExpandedStations((prev) => new Set(prev).add(stationId));

    const intervalId = setInterval(() => {
      fetchStationDetail(stationId);
    }, 15000);

    setBatteryIntervals((prev) => ({
      ...prev,
      [stationId]: intervalId
    }));
  };

  useEffect(() => {
    return () => {
      const _intervals = batteryIntervalsRef.current;
      Object.values(_intervals).forEach((id) => clearInterval(id));
    };
  }, []);

  // ================= REPORT BUTTON =================
  const handleReportClick = (station) => {
    navigate(
      `/report?stationId=${station.stationId}&stationName=${encodeURIComponent(
        station.stationName || ""
      )}&location=${encodeURIComponent(station.location || "")}`
    );
  };

  // ================= SLOT GRID =================
  const buildSlotGrid = (slots = []) => {
    const rows = Array.from({ length: 5 }, (_, i) => i + 1);
    const cols = Array.from({ length: 6 }, (_, i) => i + 1);
    return rows.map((y) =>
      cols.map((x) => slots.find((s) => s.cordinateX === x && s.cordinateY === y) || null)
    );
  };

  const openSlotModal = (slot, stationId) => {
    const b = slot?.battery;
    if (!b) return;
    if (!batteryCompatible(b)) return;
    setActiveSlot({ ...slot, stationId });
    setSlotBattery(b);
    setShowSlotModal(true);
  };

  const closeSlotModal = () => {
    setShowSlotModal(false);
    setActiveSlot(null);
    setSlotBattery(null);
  };

  const chooseBatteryFromModal = () => {
    const b = slotBattery;
    if (!b) return;
    const bid = b.batteryId || b.id;
    const bname = b.batteryName || bid || "";
    const sid = activeSlot?.stationId || "";
    const qs = new URLSearchParams({
      stationId: sid,
      batteryId: bid,
      batteryName: bname,
      ...(selectedVehicleVin ? { vin: selectedVehicleVin } : {})
    }).toString();
    window.location.href = `/booking?${qs}`;
  };

  // ================= FLOW ĐỔI PIN - HANDLERS =================
  const openSwapModal = () => {
    setSwapVin(selectedVehicleVin || "");
    setPendingExchange(null);
    setSwapError("");
    setSwapSuccess("");
    setSwapModalOpen(true);
  };

  const closeSwapModal = () => {
    setSwapModalOpen(false);
  };

  const fetchPendingExchange = async () => {
    if (!swapVin) {
      setSwapError("Vui lòng nhập VIN hoặc chọn xe.");
      return;
    }
    if (!currentAccountId) {
      setSwapError("Không tìm thấy tài khoản hiện tại. Vui lòng đăng nhập lại.");
      return;
    }
    setSwapLoading(true);
    setSwapError("");
    setSwapSuccess("");
    try {
      // GỌI ĐÚNG CHỮ KÝ: (vin, accountId)
      const res = await authAPI.getPendingExchangeByVINAndAccountId(swapVin, currentAccountId);
      const data = res?.data?.data || res?.data || res;
      if (!data) {
        setPendingExchange(null);
        setSwapError("Không tìm thấy giao dịch đang chờ cho VIN này.");
      } else {
        setPendingExchange(data);
      }
    } catch (err) {
      setSwapError(err?.message || "Không lấy được giao dịch đang chờ.");
      setPendingExchange(null);
    } finally {
      setSwapLoading(false);
    }
  };

  const handleConfirmSwap = async () => {
    if (!pendingExchange) return;
    if (!currentAccountId) {
      setSwapError("Không tìm thấy accountId. Vui lòng đăng nhập lại.");
      return;
    }
    setSwapLoading(true);
    setSwapError("");
    setSwapSuccess("");
    try {
      const exchangeId = pendingExchange.exchangeBatteryId || pendingExchange.id;

      // 1) TẠO BÁO CÁO PIN TRỰC TIẾP (TRẢ PIN CŨ)
      //    ĐÚNG CHỮ KÝ: addBatteryReportDirect(accountId, vin)
      await authAPI.addBatteryReportDirect(currentAccountId, pendingExchange?.vin || swapVin);

      // 2) CẬP NHẬT TRẠNG THÁI GIAO DỊCH
      await authAPI.updateExchangeStatusV2({
        exchangeBatteryId: exchangeId,
        status: "Completed"
      });

      setSwapSuccess("Đã xác nhận giao dịch đổi pin thành công.");
    } catch (err) {
      setSwapError(err?.message || "Không thể xác nhận giao dịch.");
    } finally {
      setSwapLoading(false);
    }
  };

  // ================= RENDER =================
  return (
    <div
      className={`min-h-screen ${theme === "dark" ? "bg-gray-900" : "bg-white"}`}
      style={{ maxHeight: "calc(100vh - 120px)", overflowY: "auto" }}
    >
      {/* Background */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
          pointerEvents: "none",
          backgroundImage:
            "url('https://res.cloudinary.com/dscvguyvb/image/upload/v1760692941/8214be62-181e-4b47-ac49-6896dcc2a590_1_qnev9i.png')",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "top right",
          backgroundSize: "100% auto",
          transition: "opacity 0.2s"
        }}
        aria-hidden="true"
      />

      {/* Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 50 }}>
        <HeaderDriver
          onToggleTheme={handleToggleTheme}
          theme={theme}
          user={user}
          unreadCount={unreadCount}
          nextBooking={nextBooking}
          onOpenBooking={handleOpenBooking}
        />
      </div>

      {/* Hero image */}
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
          border: theme === "dark" ? "1.5px solid #334155" : "1.5px solid #bbf7d0",
          position: "relative",
          zIndex: 2
        }}
      >
        <img
          src="https://etimg.etb2bimg.com/photo/97076517.cms"
          alt="Battery Station Modern"
          style={{
            width: "100%",
            height: "520px",
            objectFit: "cover",
            display: "block",
            background: "#e0ffe7"
          }}
        />
      </div>

      <div className="station-container">
        {/* Title */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "2.5rem",
            background: "transparent",
            padding: "2.5rem 1.5rem 2rem 1.5rem",
            borderRadius: "24px",
            color: "#fff",
            position: "relative"
          }}
        >
          <h2
            className="station-title"
            style={{
              color: "#fff",
              fontSize: "2.5rem",
              fontWeight: 800,
              marginBottom: "0.7rem",
              letterSpacing: "-1px",
              position: "relative"
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
              marginBottom: 0,
              color: "#fff",
              fontWeight: 500
            }}
          >
            Tìm kiếm và đặt lịch tại các trạm đổi pin gần bạn
          </p>
        </div>

        {/* Controls */}
        <div className="station-controls">
          <select
            className="station-select"
            value={selectedVehicleVin}
            onChange={async (e) => {
              const vin = e.target.value;
              setSelectedVehicleVin(vin);

              if (!vin) {
                // Không chọn xe => load tất cả trạm
                fetchStations();
              } else {
                // Có chọn xe => lọc trạm theo BE
                fetchSuitStations(vin);
              }
            }}
          >
            <option value="">🚗 Chọn xe đã liên kết (lọc theo pin phù hợp)</option>
            {vehicles.map((v) => (
              <option key={vprop(v, "vin")} value={vprop(v, "vin")}>
                {vprop(v, "vehicleName") || vprop(v, "name") || "Vehicle"}
              </option>
            ))}
          </select>

          <input
            className="station-search"
            placeholder="🔍 Tìm tên trạm hoặc location..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <select
            className="station-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">📊 Tất cả trạng thái</option>
            <option value="Active">✅ Active</option>
            <option value="Inactive">❌ Inactive</option>
          </select>

          <button
            className="btn"
            onClick={() => {
              if (selectedVehicleVin) {
                fetchSuitStations(selectedVehicleVin); // reload filtered
              } else {
                fetchStations(); // reload full
              }
            }}
            disabled={isLoading}
          >
            {isLoading ? "🔄 Đang tải..." : "🔄 Reload"}
          </button>

          {/* Nút Đổi pin */}
          <button className="btn" onClick={openSwapModal}>
            🔄 Đổi pin
          </button>
        </div>

        {/* Summary */}
        <div className="station-summary">
          <span className="total-count">
            📈 Tổng số trạm: <strong>{totalItems}</strong>
            {totalItems > 0 && (
              <span className="page-info">
                {" "}
                (Trang {currentPage}/{totalPages} - Hiển thị{" "}
                {startIndex + 1}-{Math.min(endIndex, totalItems)})
              </span>
            )}
          </span>
        </div>

        {error && <div className="station-error">❌ Lỗi: {error}</div>}
        {isLoading && <div className="station-loading">⏳ Đang tải dữ liệu...</div>}

        {/* Station list */}
        {!isLoading && !error && (
          <>
            {totalItems === 0 ? (
              <div className="station-empty">🔍 Không tìm thấy trạm nào phù hợp.</div>
            ) : (
              <div className="station-grid">
                {currentItems.map((st, idx) => {
                  const stationUniqueId =
                    st.stationId ?? st.StationId ?? st.id ?? idx;
                  const isExpanded = expandedStations.has(stationUniqueId);
                  const detail = stationDetails[stationUniqueId];
                  const slots = detail?.slots || [];

                  return (
                    <article
                      key={stationUniqueId}
                      className="station-card-for-user"
                      style={{
                        animationDelay: `${idx * 40}ms`,
                        background:
                          theme === "dark"
                            ? "linear-gradient(145deg, #374151 0%, #1f2937 100%)"
                            : "linear-gradient(145deg,rgba(255, 255, 255, 0.08) 0%,rgba(248, 250, 252, 0.26) 100%)",
                        border:
                          theme === "dark" ? "1px solid #4b5563" : "1px solid #e2e8f0",
                        borderRadius: "16px",
                        boxShadow:
                          theme === "dark"
                            ? "0 10px 25px rgba(0, 0, 0, 0.3)"
                            : "0 10px 25px rgba(0, 0, 0, 0.1)",
                        overflow: "hidden",
                        position: "relative",
                        transition: "all 0.3s ease"
                      }}
                    >
                      {/* Image / Map */}
                      <div
                        style={{
                          height: "400px",
                          width: "100%",
                          position: "relative",
                          overflow: "hidden"
                        }}
                      >
                        {showMapFor[stationUniqueId] && st.image ? (
                          <div
                            style={{ width: "100%", height: "100%" }}
                            dangerouslySetInnerHTML={{ __html: st.image }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              background: `url(${
                                stationImages[idx % stationImages.length]
                              }) center/cover`
                            }}
                          />
                        )}

                        <div
                          style={{
                            position: "absolute",
                            top: "12px",
                            right: "12px",
                            background:
                              (st.status ?? "").toLowerCase() === "active"
                                ? "rgba(34, 197, 94, 0.9)"
                                : "rgba(239, 68, 68, 0.9)",
                            color: "white",
                            padding: "4px 12px",
                            borderRadius: "20px",
                            fontSize: "0.8rem",
                            fontWeight: "bold",
                            backdropFilter: "blur(10px)",
                            zIndex: 10
                          }}
                        >
                          {(st.status ?? "").toLowerCase() === "active" ? "🟢" : "🔴"}{" "}
                          {st.status ?? "Unknown"}
                        </div>

                        <button
                          onClick={() =>
                            setShowMapFor((prev) => ({
                              ...prev,
                              [stationUniqueId]: !prev[stationUniqueId]
                            }))
                          }
                          style={{
                            position: "absolute",
                            bottom: "12px",
                            left: "12px",
                            padding: "6px 12px",
                            background: "rgba(0,0,0,0.6)",
                            color: "#fff",
                            borderRadius: "8px",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            zIndex: 20
                          }}
                        >
                          {showMapFor[stationUniqueId] ? "📸 Xem hình" : "🗺 Xem bản đồ"}
                        </button>
                      </div>

                      {/* Card content */}
                      <div style={{ padding: "20px" }}>
                        <div
                          className="station-head"
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: "12px"
                          }}
                        >
                          <div className="head-left" style={{ flex: 1 }}>
                            <h3
                              className="station-id"
                              style={{
                                fontSize: "1.4rem",
                                fontWeight: "bold",
                                color: theme === "dark" ? "#f1f5f9" : "#ffffff",
                                marginBottom: "8px"
                              }}
                            >
                              🏢 {st.stationName ?? "Tên trạm chưa có"}
                            </h3>
                            <div
                              className="station-subinfo"
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                marginBottom: "12px"
                              }}
                            >
                              <span
                                className="sub-location"
                                style={{
                                  color: theme === "dark" ? "#94a3b8" : "#ffffff",
                                  fontSize: "0.9rem"
                                }}
                              >
                                📍 {st.location ?? "-"}
                              </span>
                              <span
                                className="sub-sep"
                                style={{
                                  color: theme === "dark" ? "#64748b" : "#94a3b8"
                                }}
                              >
                                •
                              </span>
                              <span
                                className="sub-rating"
                                style={{
                                  color: theme === "dark" ? "#fbbf24" : "#f59e0b",
                                  fontSize: "0.9rem",
                                  fontWeight: "500"
                                }}
                              >
                                ⭐{" "}
                                {typeof st.rating === "number"
                                  ? st.rating.toFixed(1)
                                  : "-"}
                              </span>
                            </div>
                          </div>
                          <div
                            className="emergency-actions"
                            style={{ marginLeft: "16px" }}
                          >
                            <button
                              className="emergency-btn primary"
                              onClick={() => handleReportClick(st)}
                              style={{
                                background:
                                  "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                                color: "white",
                                padding: "8px 16px",
                                borderRadius: "20px",
                                border: "none",
                                fontWeight: "bold",
                                fontSize: "0.8rem",
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                                boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
                                transition: "all 0.3s ease"
                              }}
                            >
                              ⚠️ Báo cáo
                            </button>
                          </div>
                        </div>

                        {/* Summary */}
                        <div
                          className="summary-row"
                          style={{
                            display: "grid",
                            gap: "16px",
                            marginBottom: "20px",
                            padding: "16px",
                            background:
                              theme === "dark"
                                ? "rgba(55, 65, 81, 0.5)"
                                : "rgba(248, 250, 252, 0.8)",
                            borderRadius: "12px",
                            border:
                              theme === "dark"
                                ? "1px solid rgba(75, 85, 99, 0.3)"
                                : "1px solid rgba(226, 232, 240, 0.5)"
                          }}
                        >
                          <div
                            className="summary-item"
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              textAlign: "center",
                              justifyContent: "center"
                            }}
                          >
                            <div
                              className="summary-num"
                              style={{
                                fontSize: "1.8rem",
                                fontWeight: "bold",
                                color: theme === "dark" ? "#10b981" : "#059669",
                                marginBottom: "4px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                              }}
                            >
                              🔋 {st.batteryNumber ?? 0}
                            </div>
                            <div
                              className="summary-label"
                              style={{
                                fontSize: "0.8rem",
                                color: theme === "dark" ? "#94a3b8" : "#64748b"
                              }}
                            >
                              Pin đang ở trạm
                            </div>
                          </div>
                        </div>

                        {/* Buttons */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            marginTop: "16px"
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => handleToggleStationDetail(stationUniqueId)}
                            style={{
                              padding: "10px 18px",
                              borderRadius: "9999px",
                              border: "none",
                              fontWeight: 600,
                              cursor: "pointer",
                              background:
                                "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                              color: "#fff",
                              boxShadow: "0 8px 20px rgba(37, 99, 235, 0.25)"
                            }}
                          >
                            {isExpanded ? "Thu gọn danh sách pin" : "Xem danh sách pin"}
                          </button>
                        </div>

                        {/* Slot list */}
                        {isExpanded && (
                          <div
                            style={{
                              marginTop: "20px",
                              marginBottom: "20px",
                              borderTop:
                                theme === "dark"
                                  ? "2px solid #2563eb"
                                  : "2px solid rgb(59, 246, 78)",
                              paddingTop: "20px",
                              background:
                                theme === "dark"
                                  ? "rgba(16,24,39,0.70)"
                                  : "rgba(236, 245, 255, 0)",
                              borderRadius: 12,
                              boxShadow:
                                theme === "dark"
                                  ? "0 2px 12px rgba(30,41,59,.10)"
                                  : "0 4px 16px rgba(59,130,246,0.09)"
                            }}
                          >
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                                gap: "18px"
                              }}
                            >
                              <div className="slots-section" style={{ marginTop: 6 }}>
                                {loadingDetails && !slots.length && (
                                  <div className="station-loading">Đang tải slot...</div>
                                )}

                                {Array.isArray(slots) && slots.length > 0 ? (
                                  <div className="slot-grid">
                                    {buildSlotGrid(slots).map((row, rIdx) => (
                                      <div className="slot-row liquid" key={`row-${rIdx}`}>
                                        {row.map((slot, cIdx) => {
                                          const hasBattery = !!slot?.battery;
                                          const b = slot?.battery || null;
                                          const status = (
                                            b?.status || slot?.status || "Trống"
                                          )
                                            .toLowerCase();
                                          const isCompatible =
                                            hasBattery && batteryCompatible(b);
                                          const canOpen = hasBattery && isCompatible;

                                          const name = hasBattery
                                            ? b.batteryName || b.batteryId
                                            : "";
                                          const badge = hasBattery
                                            ? b.status || ""
                                            : slot?.status || "Trống";

                                          return (
                                            <button
                                              type="button"
                                              key={slot?.slotId || `slot-${rIdx}-${cIdx}`}
                                              className={`slot-cell status-${status} ${
                                                hasBattery ? "has-battery" : ""
                                              }`}
                                              onClick={() =>
                                                canOpen && openSlotModal(slot, st.stationId)
                                              }
                                              title={
                                                !hasBattery
                                                  ? slot?.status || "Trống"
                                                  : isCompatible
                                                  ? `${name}${
                                                      b?.capacity != null
                                                        ? ` • ${b.capacity}%`
                                                        : ""
                                                    } • ${badge} (phù hợp)`
                                                  : `${name} • Không phù hợp với xe`
                                              }
                                              style={{
                                                cursor: canOpen ? "pointer" : "not-allowed",
                                                opacity: hasBattery
                                                  ? isCompatible
                                                    ? 1
                                                    : 0.42
                                                  : 1,
                                                outline:
                                                  hasBattery && isCompatible
                                                    ? "2px solid rgb(59, 246, 78)"
                                                    : undefined
                                              }}
                                            >
                                              {hasBattery ? (
                                                <>
                                                  <div
                                                    className="slot-status"
                                                    style={{ fontWeight: 800 }}
                                                  >
                                                    {name}
                                                  </div>
                                                  <div className="slot-badge">
                                                    {badge}
                                                    {b?.capacity != null
                                                      ? ` • ${b.capacity}%`
                                                      : ""}
                                                  </div>
                                                </>
                                              ) : (
                                                <div className="slot-status">Trống</div>
                                              )}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="empty-note">
                                    Trạm chưa có slot nào.
                                  </div>
                                )}

                                <div
                                  className="slot-legend"
                                  style={{ justifyContent: "center" }}
                                >
                                  <span>
                                    <i className="lg lg-empty" />
                                    Trống
                                  </span>
                                  <span>
                                    <i className="lg lg-available" />
                                    Sẵn sàng
                                  </span>
                                  <span>
                                    <i className="lg lg-charging" />
                                    Đang sạc
                                  </span>
                                  <span>
                                    <i className="lg lg-faulty" />
                                    Đã đặt
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                          }}
                        >
                          <button
                            className="btn"
                            style={{
                              background:
                                "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                              color: "white",
                              padding: "10px 16px",
                              borderRadius: "25px",
                              fontWeight: "bold",
                              border: "none"
                            }}
                            onClick={() => setOpenRatingFor(st)}
                          >
                            ⭐ Đánh giá
                          </button>
                          <a
                            className="btn primary"
                            href={`/booking?stationId=${encodeURIComponent(
                              st.stationId
                            )}`}
                            style={{
                              background:
                                "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                              color: "white",
                              padding: "12px 24px",
                              borderRadius: "25px",
                              textDecoration: "none",
                              fontWeight: "bold",
                              fontSize: "0.9rem",
                              border: "none"
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
            )}
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            className="pagination"
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "12px",
              marginTop: "2rem",
              padding: "20px"
            }}
          >
            <button
              className="btn small"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              ← Trước
            </button>
            <div className="page-numbers" style={{ display: "flex", gap: "4px" }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`btn small ${page === currentPage ? "active" : ""}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              className="btn small"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Sau →
            </button>
          </div>
        )}
      </div>

      {/* Rating modal */}
      {openRatingFor && (
        <RatingStation
          stationId={openRatingFor.stationId}
          accountId={currentAccountId}
          onClose={() => setOpenRatingFor(null)}
          onSuccess={fetchStations}
        />
      )}

      {/* MODAL ĐỔI PIN */}
      {swapModalOpen && (
        <div className="modal-overlay" onClick={closeSwapModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <h2>🔄 Đổi pin đã đặt trước</h2>
            {swapError && (
              <div className="station-error" style={{ marginBottom: 8 }}>
                {swapError}
              </div>
            )}
            {swapSuccess && (
              <div
                className="station-success"
                style={{ marginBottom: 8, color: "#16a34a", fontWeight: 600 }}
              >
                {swapSuccess}
              </div>
            )}

            {!pendingExchange ? (
              <>
                <label className="form-label" style={{ display: "block" }}>
                  VIN của xe
                  <input
                    className="station-search"
                    value={swapVin}
                    onChange={(e) => setSwapVin(e.target.value)}
                    placeholder="Nhập VIN hoặc chọn xe ở trên"
                    style={{ marginTop: 6 }}
                  />
                </label>
                <p
                  className="helper-text"
                  style={{ fontSize: "0.85rem", marginTop: 6 }}
                >
                  Hệ thống sẽ tìm giao dịch đổi pin đang chờ dựa trên VIN và tài khoản của bạn.
                </p>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 8,
                    marginTop: 16
                  }}
                >
                  <button className="btn light" onClick={closeSwapModal}>
                    Đóng
                  </button>
                  <button
                    className="btn"
                    onClick={fetchPendingExchange}
                    disabled={swapLoading}
                  >
                    {swapLoading ? "Đang kiểm tra..." : "🔍 Lấy giao dịch đang chờ"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div
                  className="detail-list"
                  style={{ marginBottom: 12, fontSize: "0.9rem" }}
                >
                  <div>
                    <strong>Mã giao dịch:</strong>{" "}
                    {pendingExchange.exchangeBatteryId || pendingExchange.id || "-"}
                  </div>
                  <div>
                    <strong>Trạm:</strong> {pendingExchange.stationName || "-"}
                  </div>
                  <div>
                    <strong>Tên xe:</strong> {pendingExchange.vehicleName || "-"}
                  </div>
                  <div>
                    <strong>VIN:</strong> {pendingExchange.vin || swapVin}
                  </div>
                  <div>
                    <strong>Pin cũ:</strong> {pendingExchange.oldBatteryName || "-"}
                  </div>
                  <div>
                    <strong>Pin mới:</strong> {pendingExchange.newBatteryName || "-"}
                  </div>
                  <div>
                    <strong>Thời gian lịch giao dịch:</strong>{" "}
                    {pendingExchange.scheduleTime
                      ? new Date(pendingExchange.scheduleTime).toLocaleString()
                      : "-"}
                  </div>
                  <div>
                    <strong>Trạng thái hiện tại:</strong>{" "}
                    {pendingExchange.status || "Pending"}
                  </div>
                </div>
                <p
                  className="helper-text"
                  style={{ fontSize: "0.85rem", marginTop: 6 }}
                >
                  Vui lòng đưa pin cũ vào trạm, sau đó bấm{" "}
                  <strong>"Xác nhận giao dịch"</strong> để hệ thống ghi nhận báo cáo pin và hoàn
                  tất trao đổi.
                </p>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 16
                  }}
                >
                  <button className="btn light" onClick={closeSwapModal}>
                    Đóng
                  </button>
                  <button
                    className="btn"
                    onClick={handleConfirmSwap}
                    disabled={swapLoading}
                  >
                    {swapLoading ? "Đang xử lý..." : "✅ Xác nhận giao dịch"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* SLOT MODAL */}
      {showSlotModal && (
        <div className="modal-overlay" onClick={closeSlotModal}>
          <div className="modal slot-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Chi tiết Pin</h2>
            {!activeSlot || !slotBattery ? (
              <div className="empty-note">Không có dữ liệu pin.</div>
            ) : (
              <>
                <ul className="detail-list" style={{ marginBottom: 8 }}>
                  <li>
                    <strong>Toạ độ slot:</strong> ({activeSlot.cordinateX},{activeSlot.cordinateY})
                  </li>
                  <li>
                    <strong>Trạng thái slot:</strong> {activeSlot.status}
                  </li>
                </ul>

                <div className="batt-card-mini">
                  <div className="batt-mini-row">
                    <span className="batt-mini-label">Tên/ID:</span>
                    <span className="batt-mini-val">
                      {slotBattery.batteryName || slotBattery.batteryId}
                    </span>
                  </div>
                  <div className="batt-mini-row">
                    <span className="batt-mini-label">Type:</span>
                    <span className="batt-mini-val">
                      {slotBattery.batteryType || "—"}
                    </span>
                  </div>
                  <div className="batt-mini-row">
                    <span className="batt-mini-label">Spec:</span>
                    <span className="batt-mini-val">
                      {slotBattery.specification || "—"}
                    </span>
                  </div>
                  <div className="batt-mini-row">
                    <span className="batt-mini-label">Capacity:</span>
                    <span className="batt-mini-val">
                      {slotBattery.capacity ?? "—"}%
                    </span>
                  </div>
                  <div className="batt-mini-row">
                    <span className="batt-mini-label">SoH:</span>
                    <span className="batt-mini-val">
                      {slotBattery.batteryQuality ?? "—"}%
                    </span>
                  </div>
                  <div className="batt-mini-row">
                    <span className="batt-mini-label">Status:</span>
                    <span className="batt-mini-val">
                      {slotBattery.status || "—"}
                    </span>
                  </div>
                  <div className="batt-mini-row">
                    <span className="batt-mini-label">Updated:</span>
                    <span className="batt-mini-val">
                      {slotBattery.updateDate
                        ? new Date(slotBattery.updateDate).toLocaleString()
                        : "—"}
                    </span>
                  </div>
                </div>

                {(() => {
                  const batteryStatus =
                    slotBattery?.status?.toString().toLowerCase() || "";
                  const isAvailable = batteryStatus === "available";
                  return (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: 12
                      }}
                    >
                      <button className="btn light" onClick={closeSlotModal}>
                        Đóng
                      </button>
                      <button
                        className="btn"
                        onClick={isAvailable ? chooseBatteryFromModal : undefined}
                        disabled={!isAvailable}
                        style={{
                          opacity: isAvailable ? 1 : 0.4,
                          cursor: isAvailable ? "pointer" : "not-allowed"
                        }}
                      >
                        {isAvailable ? "🔁 Chọn pin này" : "🚫 Pin không khả dụng"}
                      </button>
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
