import React, { useEffect, useState, useMemo, useCallback } from "react";
import { authAPI } from "../../services/authAPI";
import StaffSelectionPopup from "./StaffSelectionPopup";
import StationHistoryPopup from "./StationHistoryPopup";
import "./Station.css";

export default function Station() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [opLoading, setOpLoading] = useState(false);
  const [error, setError] = useState(null);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("");

  const [sortBy, setSortBy] = useState(""); // stationName | batteryNumber | status | startDate | updateDate
  const [sortOrder, setSortOrder] = useState("asc");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const [createName, setCreateName] = useState("");
  const [createLocation, setCreateLocation] = useState("");
  const [createImage, setCreateImage] = useState("");


  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editBatteryNumber, setEditBatteryNumber] = useState("");
  const [editLocation, setEditLocation] = useState("");

  const [expandedId, setExpandedId] = useState(null);

  // Staff management states
  const [showStaffPopup, setShowStaffPopup] = useState(false);
  const [selectedStationId, setSelectedStationId] = useState(null);
  const [selectedStationName, setSelectedStationName] = useState("");
  // Danh sách nhân viên (đã gắn staffId đúng) của mỗi trạm để hiển thị trong chi tiết
  const [stationStaff, setStationStaff] = useState({}); // stationId -> [{ username,name,phone,email, staffId }]

  // Thêm state cho status update
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);

  const [showHistoryPopup, setShowHistoryPopup] = useState(false);
  const [historyStationId, setHistoryStationId] = useState(null);
  const [historyStationName, setHistoryStationName] = useState("");
  const [stationHistoryData, setStationHistoryData] = useState({});
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  // Thêm state để lưu số lượng exchange history của mỗi trạm
  const [stationExchangeCounts, setStationExchangeCounts] = useState({});

  // Hàm đếm số lượng exchange battery history của một trạm
  const getExchangeCountForStation = (stationId) => {
    return stationExchangeCounts[stationId] || 0;
  };

  // Hàm fetch và đếm exchange history cho một trạm
  const fetchAndCountExchangeHistory = async (stationId) => {
    if (!stationId) return 0;

    try {
      const data = await authAPI.getExchangesByStation(stationId);
      const list = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
          ? data
          : [];

      const count = list.length;
      setStationExchangeCounts(prev => ({ ...prev, [stationId]: count }));
      return count;
    } catch (err) {
      console.error(`Error fetching exchange count for station ${stationId}:`, err);
      setStationExchangeCounts(prev => ({ ...prev, [stationId]: 0 }));
      return 0;
    }
  };

  // ===== STRICT: chỉ trả staffId thật khi đào sâu các nhánh có thể chứa =====
  const getStaffIdStrict = (node) => {
    if (!node || typeof node !== "object") return null;
    const q = [node];
    const seen = new Set();
    const add = (v) => { if (v && typeof v === "object" && !seen.has(v)) { seen.add(v); q.push(v); } };

    while (q.length) {
      const cur = q.shift();
      if (!cur || typeof cur !== "object") continue;

      if (cur.staffId !== undefined && cur.staffId !== null && cur.staffId !== "") {
        return cur.staffId;
      }
      if (Array.isArray(cur.bssStaffs)) cur.bssStaffs.forEach(add);
      add(cur.staff); add(cur.account); add(cur.staffRef); add(cur.accountRef);
      add(cur.staff?.account); add(cur.primaryBssRecord);
    }
    return null;
  };

  /**
   * Station list mới đã có bssStaffs: [{staffId}, ...]
   * => Đếm staff đơn giản theo length.
   */
  const getStaffCountForStation = (station) =>
    Array.isArray(station?.bssStaffs) ? station.bssStaffs.length : 0;

  /**
   * Chuẩn hoá danh sách staff (từ API get_staffs_by_station_id_for_admin) chỉ để hiển thị:
   * - Lấy các field: username, name, phone, email
   * - Gắn staffId CHUẨN bằng cách tra từ allStaff[accountId] -> bssStaffs[].staffId theo stationId
   * - Nếu không tra được, fallback: staffId từ stations[].bssStaffs (khi số lượng match 1-1)
   */
  const normalizeStationStaffForDisplay = (rawList, stationId, accountIdToStaffMeta, stationStaffIds) => {
    if (!Array.isArray(rawList)) return [];

    console.log('normalizeStationStaffForDisplay:', {
      rawListLength: rawList.length,
      stationId,
      stationStaffIds,
      rawList: rawList.map(item => ({ accountId: item?.accountId, username: item?.username }))
    });

    return rawList.map((item, index) => {
      const username = item?.username ?? "";
      const name = item?.name ?? "";
      const phone = item?.phone ?? "";
      const email = item?.email ?? "";
      const accountId = item?.accountId ?? "";

      // Tra staffId từ allStaff theo accountId -> bssStaffs[].staffId có stationId trùng
      let staffId = null;
      const meta = accountIdToStaffMeta.get(accountId);
      if (meta && Array.isArray(meta.bssStaffs)) {
        const found = meta.bssStaffs.find((x) => x?.stationId === stationId && x?.staffId);
        if (found?.staffId) {
          staffId = found.staffId;
          console.log(`Found staffId from allStaff mapping: ${staffId} for accountId: ${accountId}`);
        }
      }

      // Fallback: nếu không tìm được từ allStaff, thử lấy từ stationStaffIds theo thứ tự
      if (!staffId && Array.isArray(stationStaffIds) && stationStaffIds.length > index) {
        staffId = stationStaffIds[index];
        console.log(`Fallback staffId from stationStaffIds[${index}]: ${staffId} for accountId: ${accountId}`);
      }

      const result = { username, name, phone, email, accountId, staffId };
      console.log(`Normalized staff item:`, result);
      return result;
    });
  };

  // Lưu allStaff 1 lần để map accountId -> bssStaffs (tìm staffId theo stationId)
  const [allStaff, setAllStaff] = useState([]);
  const accountIdToStaffMeta = useMemo(() => {
    const map = new Map();
    if (Array.isArray(allStaff)) {
      allStaff.forEach((s) => {
        if (!s || typeof s !== "object") return;
        map.set(s.accountId, {
          bssStaffs: Array.isArray(s.bssStaffs) ? s.bssStaffs : [],
        });
      });
    }
    return map;
  }, [allStaff]);

  useEffect(() => {
    const fetchAllStaff = async () => {
      try {
        const staff = await authAPI.getAllStaff();
        setAllStaff(Array.isArray(staff) ? staff : []);
      } catch {
        setAllStaff([]);
      }
    };
    fetchAllStaff();
  }, []);

  // Hàm cập nhật station status
  const handleUpdateStationStatus = async (stationId, newStatus) => {
    if (!stationId) return;

    setStatusUpdateLoading(true);
    try {
      await authAPI.updateStationStatus(stationId, newStatus);

      // Cập nhật local state
      setStations(prev => prev.map(st =>
        st.stationId === stationId ? { ...st, status: newStatus } : st
      ));

      alert(`Đã cập nhật trạng thái thành ${newStatus}`);
    } catch (error) {
      alert("Cập nhật trạng thái thất bại: " + error.message);
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  // Lấy stations + lưu sẵn mảng staffId của trạm (từ bssStaffs)
  const fetchStations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await authAPI.getAllStations();
      const stationsArray = Array.isArray(data) ? data : [];
      // Chuẩn hoá bssStaffs về dạng [{staffId}] (đã đúng theo API mới)
      const normalizedStations = stationsArray.map((st) => ({
        ...st,
        bssStaffs: Array.isArray(st?.bssStaffs)
          ? st.bssStaffs
            .filter((x) => x && typeof x === "object" && x.staffId)
            .map((x) => ({ staffId: x.staffId }))
          : [],
      }));
      setStations(normalizedStations);
    } catch (err) {
      console.error("fetchStations:", err);
      setError(err?.message || "Lỗi khi tải danh sách trạm");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStations(); }, []);

  // Fetch exchange counts for all stations when stations are loaded
  useEffect(() => {
    if (stations.length > 0) {
      stations.forEach(station => {
        if (station.stationId) {
          fetchAndCountExchangeHistory(station.stationId);
        }
      });
    }
  }, [stations]);

  // Lọc/sắp xếp/paginate
  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    return stations.filter((st) => {
      if (statusFilter !== "All" && (st.status ?? "").toLowerCase() !== statusFilter.toLowerCase()) return false;
      if (locationFilter && !(st.location ?? "").toLowerCase().includes(locationFilter.toLowerCase())) return false;
      if (!text) return true;
      const candidate = `${st.stationName ?? st.Name ?? ""} ${st.location ?? ""}`.toLowerCase();
      return candidate.includes(text);
    });
  }, [stations, q, statusFilter, locationFilter]);

  const sorted = useMemo(() => {
    if (!sortBy) return filtered;
    const dir = sortOrder === "desc" ? -1 : 1;
    const getVal = (st) => {
      switch (sortBy) {
        case "stationName": return (st.stationName || st.Name || "").toString().toLowerCase();
        case "batteryNumber": return Number.isFinite(Number(st.batteryNumber)) ? Number(st.batteryNumber) : Number.NEGATIVE_INFINITY;
        case "status": return (st.status || "").toString().toLowerCase();
        case "startDate": return st.startDate ? new Date(st.startDate).getTime() : 0;
        case "updateDate": return st.updateDate ? new Date(st.updateDate).getTime() : 0;
        default: return "";
      }
    };
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = getVal(a);
      const bv = getVal(b);
      if (typeof av === "number" && typeof bv === "number") return av === bv ? 0 : av < bv ? -1 * dir : 1 * dir;
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return copy;
  }, [filtered, sortBy, sortOrder]);

  const totalItems = sorted.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = sorted.slice(startIndex, endIndex);

  useEffect(() => { setCurrentPage(1); }, [q, statusFilter, locationFilter]);
  useEffect(() => { setCurrentPage(1); }, [sortBy, sortOrder]);

  const safeLen = (arr) => (Array.isArray(arr) ? arr.length : 0);

  // Mở/đóng chi tiết
  const toggleExpand = (stationId) => {
    const newExpandedId = expandedId === stationId ? null : stationId;
    setExpandedId(newExpandedId);
    if (newExpandedId && !stationStaff[stationId]) {
      fetchStationStaff(stationId);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setExpandedId(null);
  };

  // Gọi API lấy staff của trạm và gắn staffId cho từng người (để có thể xoá chính xác)
  const fetchStationStaff = async (stationId) => {
    if (!stationId) return;
    try {
      const detailList = await authAPI.getStaffsByStationId(stationId); // accounts info
      const stationSummary = stations.find((s) => s.stationId === stationId);
      const stationStaffIds = Array.isArray(stationSummary?.bssStaffs)
        ? stationSummary.bssStaffs.map((x) => x.staffId).filter(Boolean)
        : [];

      const displayList = normalizeStationStaffForDisplay(
        detailList,
        stationId,
        accountIdToStaffMeta,
        stationStaffIds
      );

      setStationStaff((prev) => ({ ...prev, [stationId]: displayList }));
    } catch (err) {
      console.error("Error fetching station staff:", err);
      setStationStaff((prev) => ({ ...prev, [stationId]: [] }));
    }
  };

  // Tập ID staff đã thuộc 1 trạm (dùng để loại trừ khi thêm)
  const assignedStaffIds = useMemo(() => {
    const ids = new Set();
    stations.forEach((st) => {
      (st?.bssStaffs || []).forEach((x) => x?.staffId && ids.add(String(x.staffId)));
    });
    return Array.from(ids);
  }, [stations]);

  // CRUD Stations
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createName) { alert("Vui lòng nhập Tên trạm."); return; }
    if (!createLocation) { alert("Vui lòng nhập Location."); return; }
    if (!createImage) { alert("Vui lòng nhập link google map"); return; }
    setOpLoading(true);
    try {
      await authAPI.createStation({ stationName: createName, location: createLocation, image: createImage });
      alert("Tạo trạm thành công");
      setCreateName(""); setCreateLocation(""); setCreateImage("");
      await fetchStations();
    } catch (err) {
      console.error("createStation error:", err);
      alert("Tạo trạm thất bại: " + (err?.message || err));
    } finally { setOpLoading(false); }
  };

  const startEdit = (station) => {
    setEditingId(station.stationId);
    setEditName(station.stationName ?? "");
    setEditBatteryNumber(String(station.batteryNumber ?? ""));
    setEditLocation(station.location ?? "");
  };
  const cancelEdit = () => { setEditingId(null); setEditName(""); setEditBatteryNumber(""); setEditLocation(""); };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingId) return;
    if (!editName) { alert("Vui lòng nhập Tên trạm."); return; }
    if (!editLocation) { alert("Vui lòng nhập Location."); return; }
    const batteryNumber = parseInt(editBatteryNumber || "0", 10);
    setOpLoading(true);
    try {
      await authAPI.updateStation({ stationId: editingId, stationName: editName, batteryNumber, location: editLocation });
      cancelEdit(); await fetchStations();
    } catch (err) {
      console.error("updateStation error:", err);
      alert("Cập nhật thất bại: " + (err?.message || err));
    } finally { setOpLoading(false); }
  };

  const handleDelete = async (stationId) => {
    const ok = window.confirm(`Bạn chắc chắn muốn xóa station "${stationId}" ?`);
    if (!ok) return;
    setOpLoading(true);
    try {
      await authAPI.deleteStation(stationId);
      setStations(prev => prev.filter(s => s.stationId !== stationId));
    } catch (err) {
      console.error("deleteStation error:", err);
      alert("Xóa thất bại: " + (err?.message || err));
    } finally { setOpLoading(false); }
  };

  // Mở popup thêm/xóa staff
  const handleAddStaffClick = (stationId, stationName) => {
    setSelectedStationId(stationId);
    setSelectedStationName(stationName);
    setShowStaffPopup(true);
    if (stationId) fetchStationStaff(stationId);
  };

  // Xoá 1 staff khỏi trạm — cần staffId CHUẨN (đã map ở normalizeStationStaffForDisplay)
  const handleRemoveStaff = async (staff, stationId) => {
    const staffName = staff?.name || staff?.username || "nhân viên";
    const staffIdForApi = staff?.staffId || getStaffIdStrict(staff);
    if (!staffIdForApi) { alert("Không thể xác định staffId để xóa."); return; }

    const ok = window.confirm(`Bạn có chắc muốn xóa ${staffName} khỏi trạm này?`);
    if (!ok) return;

    try {
      await authAPI.removeStaffFromStation({ staffId: staffIdForApi, stationId });
      alert(`Đã xóa ${staffName} khỏi trạm`);
      await fetchStations();       // cập nhật số lượng staff
      await fetchStationStaff(stationId); // cập nhật danh sách chi tiết
    } catch (err) {
      console.error("Error removing staff:", err);
      alert("Lỗi khi xóa nhân viên: " + (err?.message || "Không xác định"));
    }
  };

  const handleStaffAdded = async () => {
    if (selectedStationId) {
      await fetchStations();            // cập nhật count staff
      await fetchStationStaff(selectedStationId); // cập nhật danh sách chi tiết
    }
  };

  const closeStaffPopup = () => {
    setShowStaffPopup(false);
    setSelectedStationId(null);
    setSelectedStationName("");
  };

  const fetchStationHistory = useCallback(
    async (stationId, options = {}) => {
      if (!stationId) return;
      const force = options.force ?? false;
      const hasCached = Object.prototype.hasOwnProperty.call(
        stationHistoryData,
        stationId
      );

      if (!force && hasCached) {
        setHistoryLoading(false);
        return;
      }

      setHistoryLoading(true);
      setHistoryError(null);
      try {
        const data = await authAPI.getExchangesByStation(stationId);
        const list = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : [];

        setStationHistoryData((prev) => ({ ...prev, [stationId]: list }));
      } catch (err) {
        setHistoryError(
          err?.message || "Khong the tai lich su doi pin cho tram nay."
        );
      } finally {
        setHistoryLoading(false);
      }
    },
    [stationHistoryData]
  );

  const openHistoryPopup = useCallback(
    (station) => {
      if (!station || !station.stationId) return;
      setHistoryStationId(station.stationId);
      setHistoryStationName(
        station.stationName || station.Name || station.stationId || "Station"
      );
      setShowHistoryPopup(true);
      setHistoryError(null);
      fetchStationHistory(station.stationId);
    },
    [fetchStationHistory]
  );

  const closeHistoryPopup = useCallback(() => {
    setShowHistoryPopup(false);
    setHistoryStationId(null);
    setHistoryStationName("");
    setHistoryError(null);
  }, []);

  const historyItems = historyStationId
    ? stationHistoryData[historyStationId]
    : [];

  // NEW: modal cho slot/battery
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [activeSlot, setActiveSlot] = useState(null);
  const [slotBattery, setSlotBattery] = useState(null);
  const [slotLoading, setSlotLoading] = useState(false);
  const [slotError, setSlotError] = useState(null);

  // NEW: build grid 5 hàng x 6 cột từ slots
  const buildSlotGrid = (slots = []) => {
    const rows = Array.from({ length: 5 }, (_, i) => i + 1); // y: 1..5
    const cols = Array.from({ length: 6 }, (_, i) => i + 1); // x: 1..6
    return rows.map((y) =>
      cols.map((x) => slots.find(s => s.cordinateX === x && s.cordinateY === y) || null)
    );
  };

  // NEW: đếm pin theo slots (occupied/battery != null)
  const getBatteryCountFromSlots = (station) => {
    if (!Array.isArray(station?.slots)) return 0;
    return station.slots.filter(s => !!s?.battery).length;
  };

  // NEW: mở modal – ưu tiên dùng battery embed; fallback gọi get-battery-by-id nếu cần
  const openSlotModal = async (slot) => {
    if (!slot) return;

    setActiveSlot(slot);
    setShowSlotModal(true);
    setSlotError(null);

    // Dùng dữ liệu đã có sẵn
    if (slot.battery) {
      setSlotBattery(slot.battery);
      return;
    }

    // Fallback (tuỳ bạn có cần làm "refresh" hay không)
    const batteryId =
      slot?.battery?.batteryId || // nếu BE gửi cả batteryId bên trong
      slot?.batteryId ||          // nếu có field cũ
      null;

    if (!batteryId) {
      setSlotBattery(null);
      return;
    }

    setSlotLoading(true);
    try {
      const b = await authAPI.getBatteryById(batteryId);
      setSlotBattery(b);
    } catch (err) {
      setSlotError(err?.message || "Không lấy được thông tin pin");
    } finally {
      setSlotLoading(false);
    }
  };

  const closeSlotModal = () => {
    setShowSlotModal(false);
    setActiveSlot(null);
    setSlotBattery(null);
    setSlotError(null);
  };

  return (

    <div className="station-container">
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <filter id="liquidGlass" x="-20%" y="-20%" width="150%" height="150%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="2" seed="8" result="noise" />
            <feGaussianBlur in="noise" stdDeviation="2" result="map" />
            <feDisplacementMap in="SourceGraphic" in2="map" scale="80" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
      <h2 className="station-title">Quản lý danh sách trạm đổi pin</h2>

      <form className="station-create" onSubmit={handleCreate}>
        <div className="create-row">
          <input
            className="input"
            type="text"
            placeholder="Tên trạm"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
          />
          <input
            className="input"
            type="text"
            placeholder="Location"
            value={createLocation}
            onChange={(e) => setCreateLocation(e.target.value)}
          />
          <input
            className="input"
            type="text"
            placeholder="Link google map"
            value={createImage}
            onChange={(e) => setCreateImage(e.target.value)}
          />
          <button className="btn primary" type="submit" disabled={opLoading}>
            {opLoading ? "Đang xử lý..." : "Tạo trạm"}
          </button>
        </div>
      </form>

      <div className="station-controls">
        <input className="station-search" placeholder="Tìm tên trạm hoặc location..."
          value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="station-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="All">Tất cả trạng thái</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        <input className="station-search" placeholder="Lọc theo Location..."
          value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} />
        <select className="station-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="">-- Không sắp xếp --</option>
          <option value="stationName">Tên trạm</option>
          <option value="batteryNumber">BatteryNumber</option>
          <option value="status">Trạng thái</option>
          <option value="startDate">Ngày tạo</option>
          <option value="updateDate">Ngày cập nhật</option>
        </select>
        <select className="station-select" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
          <option value="asc">Tăng dần</option>
          <option value="desc">Giảm dần</option>
        </select>
        <button className="btn" onClick={fetchStations} disabled={loading || opLoading}>Reload</button>
      </div>

      <div className="station-summary">
        <span className="total-count">
          Tổng số trạm: <strong>{sorted.length}</strong>
          {sorted.length > 0 && (
            <span className="page-info">
              {" "}(Trang {currentPage}/{totalPages} - Hiển thị {startIndex + 1}-{Math.min(endIndex, sorted.length)})
            </span>
          )}
        </span>
      </div>

      {loading && <div className="station-loading">Đang tải dữ liệu...</div>}
      {error && <div className="station-error">Lỗi: {error}</div>}

      {!loading && !error && (
        <>
          {sorted.length === 0 ? (
            <div className="station-empty">Không tìm thấy trạm nào phù hợp.</div>
          ) : (
            <>
              <div className="station-grid">
                {currentItems.map((station, idx) => {
                  const batteryCount = getBatteryCountFromSlots(station);
                  const isExpanded = expandedId === station.stationId;
                  const staffCount = getStaffCountForStation(station);
                  const exchangeCount = getExchangeCountForStation(station.stationId);

                  return (
                    <article
                      key={station.stationId}
                      className={`station-card ${isExpanded ? "expanded" : ""}`}
                      style={{
                        animationDelay: `${idx * 40}ms`,
                        height: "auto",
                        maxHeight: "none",
                        minHeight: 0,
                        borderRadius: "10px", // giảm bo tròn border, hơi vuông
                        borderWidth: "2px",
                        borderStyle: "solid",
                        borderColor: "rgba(15,23,42,0.10)"
                      }}
                    >
                      <div className="station-head">
                        <div className="head-left">
                          <h3 className="station-id">{station.stationName ?? "Tên trạm chưa có"}</h3>
                          <div className="station-subinfo">
                            <span className="sub-location">{station.location ?? "-"}</span>
                            <span className="sub-sep">•</span>

                            {/* Status Select */}
                            <div className="status-select-container">
                              <select
                                value={station.status || ''}
                                onChange={(e) => handleUpdateStationStatus(station.stationId, e.target.value)}
                                disabled={statusUpdateLoading}
                                className={`status-select ${station.status === 'Active' ? 'status-active' : station.status === 'Inactive' ? 'status-inactive' : ''}`}
                              >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                              </select>
                            </div>
                          </div>
                          <div className={`station-status ${(station.status ?? "").toLowerCase() === "active" ? "active" : "inactive"}`}>
                            {station.status ?? "Unknown"}
                          </div>
                        </div>

                        <div className="head-right">
                          <div className="tiny">Start: {station.startDate ? new Date(station.startDate).toLocaleString() : "-"}</div>
                          <div className="tiny">Updated: {station.updateDate ? new Date(station.updateDate).toLocaleString() : "-"}</div>

                          <div className="card-actions">
                            <button className="btn small" onClick={() => toggleExpand(station.stationId)}>
                              {isExpanded ? "Thu gọn" : "Chi tiết"}
                            </button>
                            <button
                              className="btn small"
                              onClick={() => openHistoryPopup(station)}
                            >
                              Xem lịch sử
                            </button>
                            <button className="btn small" onClick={() => startEdit(station)}>Sửa</button>
                            <button className="btn danger small" onClick={() => handleDelete(station.stationId)}>Xóa</button>
                            <button className="btn primary small"
                              onClick={() => handleAddStaffClick(station.stationId, station.stationName)}>
                              Thêm Staff
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="summary-row">
                        <div className="summary-item">
                          <div className="summary-num">{station.batteryNumber ?? 0}</div>
                          <div className="summary-label">Số pin đăng ký</div>
                        </div>
                        <div className="summary-item">
                          <div className="summary-num">{batteryCount}</div>
                          <div className="summary-label">Pin đang ở trạm</div>
                        </div>
                        <div className="summary-item">
                          <div className="summary-num">{staffCount}</div>
                          <div className="summary-label">Số nhân viên</div>
                        </div>
                        <div className="summary-item hide-mobile">
                          <div className="summary-num">{exchangeCount}</div>
                          <div className="summary-label">Lịch sử đổi pin</div>
                        </div>
                      </div>

                      {editingId === station.stationId ? (
                        <form className="edit-form" onSubmit={handleUpdate}>
                          <div className="form-row">
                            <label> Tên trạm
                              <input className="input" type="text" value={editName}
                                onChange={(e) => setEditName(e.target.value)} />
                            </label>
                            <label> BatteryNumber
                              <input className="input" type="number" min="0" value={editBatteryNumber}
                                onChange={(e) => setEditBatteryNumber(e.target.value)} />
                            </label>
                            <label> Location
                              <input className="input" type="text" value={editLocation}
                                onChange={(e) => setEditLocation(e.target.value)} />
                            </label>
                          </div>
                          <div className="edit-actions">
                            <button className="btn primary small" type="submit" disabled={opLoading}>
                              {opLoading ? "Đang lưu..." : "Lưu"}
                            </button>
                            <button type="button" className="btn small" onClick={cancelEdit}>Hủy</button>
                          </div>
                        </form>
                      ) : null}

                      {/* Chi tiết trạm */}
                      <div className={`station-detail ${isExpanded ? "open" : ""}`}>
                        {/* SLOTS LAYOUT 6x5 */}
                        <div className="slots-section">
                          <div className="section-title">
                            Pin đang ở trạm
                          </div>

                          {Array.isArray(station.slots) && station.slots.length > 0 ? (
                            <div className="slot-grid">
                              {buildSlotGrid(station.slots).map((row, rIdx) => (
                                <div className="liquid slot-row" key={`row-${rIdx}`}>
                                  {row.map((slot, cIdx) => {
                                    const s = (slot?.status || "Empty").toLowerCase(); // Empty/Occupied/Reserved/Faulty
                                    const hasBattery = !!slot?.battery;
                                    const name = slot?.battery?.batteryName || slot?.battery?.batteryId;

                                    return (
                                      <button
                                        type="button"
                                        key={slot?.slotId || `slot-${rIdx}-${cIdx}`}
                                        className={`slot-cell status-${s} ${hasBattery ? "has-battery" : ""}`}
                                        onClick={() => openSlotModal(slot)}
                                        title={
                                          slot
                                            ? (hasBattery
                                              ? `${slot.battery?.batteryName || slot.battery?.batteryId || "battery"}${slot.battery?.capacity ? ` • ${slot.battery.capacity}Ah` : ""}`
                                              : slot.status || "Empty")
                                            : "Trống"
                                        }
                                      >
                                        {hasBattery ? (
                                          <React.Fragment>
                                            {slot.battery?.batteryName || slot.battery?.batteryId || "battery"}
                                            {slot.battery?.capacity ? ` • ${slot.battery.capacity}%` : ""}
                                            {slot.battery?.status ? (
                                              <span className="slot-badge" style={{ marginTop: 4 }}>{slot.battery.status}</span>
                                            ) : null}
                                          </React.Fragment>
                                        ) : (
                                          <div className="slot-status">{slot?.status || "Empty"}</div>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="empty-note">Trạm chưa có slot nào.</div>
                          )}

                          <div className="slot-legend">
                            <span><i className="lg lg-empty" />Empty</span>
                            <span><i className="lg lg-occupied" />Occupied</span>
                            <span><i className="lg lg-reserved" />Reserved</span>
                            <span><i className="lg lg-faulty" />Faulty</span>
                          </div>
                        </div>

                        {/* DANH SÁCH NHÂN VIÊN CỦA TRẠM: username, name, phone, email */}
                        <div className="staff-section">
                          <div className="section-title">
                            Nhân viên tại trạm ({stationStaff[station.stationId]?.length || 0})
                            <button className="btn small refresh-staff"
                              onClick={() => fetchStationStaff(station.stationId)}>
                              Refresh
                            </button>
                          </div>

                          {!stationStaff[station.stationId] ? (
                            <div className="loading-staff">Đang tải danh sách nhân viên...</div>
                          ) : stationStaff[station.stationId].length === 0 ? (
                            <div className="empty-note">Chưa có nhân viên nào được phân công tại trạm này.</div>
                          ) : (
                            <div className="staff-list">
                              {stationStaff[station.stationId].map((staff, index) => (
                                <div className="liquid staff-item" key={(staff.staffId || staff.accountId || index)}>
                                  <div className="staff-info">
                                    <div className="staff-name">@{staff.username}</div>
                                    <div className="staff-username">{staff.name}</div>
                                    <div className="staff-details">
                                      <span className="staff-phone">{staff.phone || "Chưa có SĐT"}</span>
                                      <span className="staff-email">{staff.email || "Chưa có email"}</span>
                                    </div>
                                  </div>
                                  <button
                                    className="btn danger small"
                                    onClick={() => handleRemoveStaff(staff, station.stationId)}
                                    disabled={!staff.staffId} // nếu không map được staffId thì không cho xoá
                                  >
                                    Xóa khỏi trạm
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Batteries */}
                        {/* <div className="batteries-section">
                          <div className="section-title">Pin đang ở trạm ({batteryCount})</div>
                          {batteryCount === 0 ? (
                            <div className="empty-note">Không có battery nào ở trạm này.</div>
                          ) : (
                            <div className="batt-list">
                              {(Array.isArray(station.batteries) ? station.batteries : []).map((b) => (
                                <div className="batt-item" key={b.batteryId}>
                                  <div className="batt-left">
                                    <div className="batt-id">{b.batteryName || b.batteryId}</div>
                                    <div className="batt-meta">
                                      {b.batteryType ? `${b.batteryType} • ${b.capacity ?? "?"}%` : `${b.capacity ?? "?"}%`}
                                      {b.specification ? ` • ${b.specification}` : ""}
                                    </div>
                                  </div>
                                  <div className="batt-right">
                                      <div className="batt-quality">SoH: <strong>{b.batteryQuality ?? "-" }%</strong></div>
                                      <div className={`batt-status ${(b.status ?? "").toLowerCase() === "available" ? "ok" : (b.status ?? "").toLowerCase() === "inuse" ? "warn" : ""}`}>
                                        {b.status ?? "-"}
                                      </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div> */}
                      </div>
                    </article>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button className="btn small" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>← Trước</button>
                  <div className="page-numbers">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button key={page} className={`btn small ${page === currentPage ? 'active' : ''}`} onClick={() => handlePageChange(page)}>
                        {page}
                      </button>
                    ))}
                  </div>
                  <button className="btn small" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>Sau →</button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Modal chi tiết slot/battery */}
      {showSlotModal && (
        <div className="modal-overlay" onClick={closeSlotModal}>
          <div className="modal slot-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Chi tiết Slot</h2>

            {!activeSlot ? (
              <div className="loading-staff">Không có dữ liệu slot.</div>
            ) : (
              <>
                <ul className="detail-list">
                  <li><strong>Toạ độ:</strong> ({activeSlot.cordinateX},{activeSlot.cordinateY})</li>
                  <li><strong>Trạng thái:</strong> {activeSlot.status}</li>
                  <li><strong>SlotId:</strong> {activeSlot.slotId}</li>
                  <li><strong>Updated:</strong> {activeSlot.updateDate ? new Date(activeSlot.updateDate).toLocaleString() : "—"}</li>
                </ul>

                {slotBattery ? (
                  <div className="battery-detail">
                    <div className="section-title">Thông tin pin</div>
                    <div className="batt-card-mini">
                      <div className="batt-mini-row">
                        <span className="batt-mini-label">Tên/ID:</span>
                        <span className="batt-mini-val">
                          {slotBattery.batteryName || slotBattery.batteryId}
                        </span>
                      </div>
                      <div className="batt-mini-row">
                        <span className="batt-mini-label">Type:</span>
                        <span className="batt-mini-val">{slotBattery.batteryType || "—"}</span>
                      </div>
                      <div className="batt-mini-row">
                        <span className="batt-mini-label">Spec:</span>
                        <span className="batt-mini-val">{slotBattery.specification || "—"}</span>
                      </div>
                      <div className="batt-mini-row">
                        <span className="batt-mini-label">Capacity:</span>
                        <span className="batt-mini-val">{slotBattery.capacity ?? "—"}%</span>
                      </div>
                      <div className="batt-mini-row">
                        <span className="batt-mini-label">SoH:</span>
                        <span className="batt-mini-val">{slotBattery.batteryQuality ?? "—"}%</span>
                      </div>
                      <div className="batt-mini-row">
                        <span className="batt-mini-label">Status:</span>
                        <span className="batt-mini-val">{slotBattery.status || "—"}</span>
                      </div>
                      <div className="batt-mini-row">
                        <span className="batt-mini-label">Updated:</span>
                        <span className="batt-mini-val">
                          {slotBattery.updateDate ? new Date(slotBattery.updateDate).toLocaleString() : "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : slotLoading ? (
                  <div className="loading-staff">Đang tải thông tin pin…</div>
                ) : (
                  <div className="empty-note">Slot này chưa có pin.</div>
                )}
              </>
            )}

            <div style={{ marginTop: 14, textAlign: "right" }}>
              <button className="btn" onClick={closeSlotModal}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* Popup thêm staff: luôn liệt kê nhân viên CHƯA gán trạm để thêm */}
      <StaffSelectionPopup
        isOpen={showStaffPopup}
        onClose={closeStaffPopup}
        stationId={selectedStationId}
        stationName={selectedStationName}
        onStaffAdded={handleStaffAdded}
        assignedStaffIds={assignedStaffIds}
      />
      <StationHistoryPopup
        isOpen={showHistoryPopup}
        onClose={closeHistoryPopup}
        stationName={historyStationName}
        history={historyItems}
        loading={historyLoading}
        error={historyError}
        onRefresh={() =>
          historyStationId && fetchStationHistory(historyStationId, { force: true })
        }
      />
    </div>
  );
}


