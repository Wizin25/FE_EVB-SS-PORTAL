// src/pages/Battery.jsx
import React, { useEffect, useState } from "react";
import { authAPI } from "../../services/authAPI";
import "../pages/Station.css";

export default function BatteryManagementPage() {
  // data
  const [batteries, setBatteries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [batteryTypeFilter, setBatteryTypeFilter] = useState("");
  const [specificationFilter, setSpecificationFilter] = useState("");
  const [stationFilter, setStationFilter] = useState("");
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState("");
  // Histories state
  const [histories, setHistories] = useState([]);
  const [historiesLoading, setHistoriesLoading] = useState(false);
  const [historiesError, setHistoriesError] = useState("");
  // Report detail
  // Map lưu exchange detail theo batteryReportId
  const [exchangeByReportId, setExchangeByReportId] = useState({});
  const [exchangeLoadingByReportId, setExchangeLoadingByReportId] = useState({});
  const [exchangeErrorByReportId, setExchangeErrorByReportId] = useState({});

  // sorting
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState("asc"); // "asc" or "desc"

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  // dropdown options (fetched)
  const [batteryTypeOptions, setBatteryTypeOptions] = useState([]);
  const [specificationOptions, setSpecificationOptions] = useState([]);

  // create form
  const [createForm, setCreateForm] = useState({
    batteryName: "",
    capacity: "", // integer % 0-100
    batteryType: "",
    specification: "",
    batteryQuality: "",
    image: "https://gogoro-about-uploads.s3.ap-northeast-1.amazonaws.com/1byus5c4ubenlumaz6naywxtx240" // Thêm trường image (string)
  });
  const [createLoading, setCreateLoading] = useState(false);

  // detail modal + edit state
  const [selectedBattery, setSelectedBattery] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isEditingInModal, setIsEditingInModal] = useState(false);
  const [editForm, setEditForm] = useState({
    batteryName: "",
    capacity: "",
    batteryType: "",
    specification: "",
    batteryQuality: ""
  });
  const [opLoading, setOpLoading] = useState(false);

  // assign modal
  const [selectedBatteryForAssign, setSelectedBatteryForAssign] = useState(null);
  const [stations, setStations] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  // additional state for step 2 - slot selection modal
  const [selectedStationForAssign, setSelectedStationForAssign] = useState(null);

  // status update
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);

  // helper: normalize options (API might return strings or objects)
  const normalizeOptions = (arr) => {
    if (!Array.isArray(arr)) return [];
    return arr.map((it) => {
      if (typeof it === "string") return it;
      if (it.value) return it.value;
      if (it.name) return it.name;
      if (it.id) return it.id;
      return String(it);
    });
  };

  // fetch batteries and dropdown options
  const fetchBatteries = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await authAPI.getAllBatteries();
      setBatteries(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "Lỗi khi lấy danh sách pin");
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [types, specs] = await Promise.all([
        authAPI.getBatteryTypes?.() || Promise.resolve([]),
        authAPI.getSpecifications?.() || Promise.resolve([]),
      ]);
      const nt = normalizeOptions(types);
      const ns = normalizeOptions(specs);

      setBatteryTypeOptions(nt.length ? nt : ["Lithium", "Graphene_TTFAR_Accumulator", "Accumulator", "LFP"]);
      setSpecificationOptions(ns.length ? ns : ["V48_Ah12", "V48_Ah13", "V48_Ah20", "V48_Ah22", "V60_Ah20", "V60_Ah22", "V72_Ah22", "V72_Ah30", "V72_Ah38", "V72_Ah50", "V36_Ah7_8", "V36_Ah10_4"]);

      // default values for create form if empty
      setCreateForm((prev) => ({
        ...prev,
        batteryType: prev.batteryType || (nt[0] || ""),
        specification: prev.specification || (ns[0] || ""),
      }));
    } catch (err) {
      // fallback defaults
      setBatteryTypeOptions(["Lithium", "NiMH", "Lead-Acid"]);
      setSpecificationOptions(["V48_Ah12", "V48_Ah20", "SpecA"]);
    }
  };

  useEffect(() => {
    fetchBatteries();
    fetchOptions();
  }, []);

  // Hàm cập nhật battery status
  const handleUpdateBatteryStatus = async (batteryId, newStatus) => {
    if (!batteryId) return;

    setStatusUpdateLoading(true);
    try {
      await authAPI.updateBatteryStatus(batteryId, newStatus);

      // Cập nhật local state
      setBatteries(prev => prev.map(b =>
        b.batteryId === batteryId ? { ...b, status: newStatus } : b
      ));

      // Cập nhật selected battery nếu đang mở modal
      if (selectedBattery?.batteryId === batteryId) {
        setSelectedBattery(prev => ({ ...prev, status: newStatus }));
      }

      alert(`Đã cập nhật trạng thái thành ${newStatus}`);
    } catch (error) {
      alert("Cập nhật trạng thái thất bại: " + error.message);
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  // ---------- CREATE ----------
  const handleCreate = async (e) => {
    e.preventDefault();
    const cap = parseInt(createForm.capacity, 10);
    if (Number.isNaN(cap) || cap < 0 || cap > 100) {
      return alert("Capacity phải là số nguyên trong khoảng 0-100 (phần trăm).");
    }
    if (!createForm.batteryName || !createForm.batteryType || !createForm.specification) {
      return alert("Vui lòng nhập tên pin và chọn BatteryType, Specification.");
    }
    setCreateLoading(true);
    try {
      const fd = new FormData();
      // IMPORTANT: field names exactly as API requires
      fd.append("BatteryName", createForm.batteryName);
      fd.append("Capacity", String(cap));
      fd.append("BatteryType", createForm.batteryType);
      fd.append("Specification", createForm.specification);
      fd.append("BatteryQuality", String(parseFloat(createForm.batteryQuality || 0)));
      fd.append("Image", createForm.image);

      await authAPI.createBattery(fd);
      setCreateForm({ batteryName: "", capacity: "", batteryType: batteryTypeOptions[0] || "", specification: specificationOptions[0] || "", batteryQuality: "", image: "https://gogoro-about-uploads.s3.ap-northeast-1.amazonaws.com/1byus5c4ubenlumaz6naywxtx240" });
      await fetchBatteries();
      alert("Tạo pin thành công!");
    } catch (err) {
      alert("Tạo pin thất bại: " + (err?.message || err));
    } finally {
      setCreateLoading(false);
    }
  };

  // ---------- DETAIL & EDIT ----------
  const openDetailModal = async (batteryId) => {
    setDetailLoading(true);
    try {
      const detail = await authAPI.getBatteryById(batteryId);
      if (!detail) {
        alert("Không tìm thấy chi tiết pin.");
        return;
      }
      // Preserve both stationId and stationName if available (avoid collapsing to only id)
      if (detail.station && (detail.station.stationId || detail.station.stationName)) {
        detail.station = {
          stationId: detail.station.stationId,
          stationName: detail.station.stationName,
        };
      }
      setSelectedBattery(detail);
      // Tải histories + reports theo BatteryId
      await Promise.all([
        loadHistoriesForBattery(batteryId),
        loadReportsForBattery(batteryId),
      ]);
      setEditForm({
        batteryName: detail.batteryName ?? "",
        capacity: detail.capacity ?? "",
        batteryType: detail.batteryType ?? (batteryTypeOptions[0] || ""),
        specification: detail.specification ?? (specificationOptions[0] || ""),
        batteryQuality: detail.batteryQuality ?? ""
      });
      setIsEditingInModal(false);
      setShowDetailModal(true);
    } catch (err) {
      alert("Lấy chi tiết thất bại: " + (err?.message || err));
    } finally {
      setDetailLoading(false);
    }
  };

  const saveEditInModal = async () => {
    if (!selectedBattery) return;
    const cap = parseInt(editForm.capacity, 10);
    if (Number.isNaN(cap) || cap < 0 || cap > 100) {
      return alert("Capacity phải là số nguyên trong khoảng 0-100 (phần trăm).");
    }
    if (!editForm.batteryName || !editForm.batteryType || !editForm.specification) {
      return alert("Vui lòng nhập tên pin và chọn BatteryType, Specification.");
    }
    setOpLoading(true);
    try {
      const fd = new FormData();
      // API requires BatteryId + the fields
      fd.append("BatteryId", selectedBattery.batteryId);
      fd.append("BatteryName", editForm.batteryName);
      fd.append("Capacity", String(cap));
      fd.append("BatteryType", editForm.batteryType);
      fd.append("Specification", editForm.specification);
      fd.append("BatteryQuality", String(parseFloat(editForm.batteryQuality || 0)));

      await authAPI.updateBattery(fd);

      // refresh detail and list
      const updated = await authAPI.getBatteryById(selectedBattery.batteryId);
      if (updated) {
        if (updated.station && (updated.station.stationId || updated.station.stationName)) {
          updated.station = {
            stationId: updated.station.stationId,
            stationName: updated.station.stationName,
          };
        }
        setSelectedBattery(updated);
        setBatteries((prev) => prev.map(p => p.batteryId === updated.batteryId ? updated : p));
      }
      setIsEditingInModal(false);
      alert("Cập nhật thành công.");
    } catch (err) {
      alert("Cập nhật thất bại: " + (err?.message || err));
    } finally {
      setOpLoading(false);
    }
  };

  // ---------- DELETE ----------
  const handleDelete = async (batteryId) => {
    if (!window.confirm(`Bạn chắc chắn xóa pin ${batteryId}?`)) return;
    try {
      // delete API expects multipart/form-data with key "batteryId"
      await authAPI.deleteBattery(batteryId);
      setBatteries(prev => prev.filter(p => p.batteryId !== batteryId));
      if (selectedBattery?.batteryId === batteryId) {
        setShowDetailModal(false);
        setSelectedBattery(null);
      }
    } catch (err) {
      alert("Xóa thất bại: " + (err?.message || err));
    }
  };

  // ---------- ASSIGN STATION ----------
  const openAssignModal = async (battery) => {
    // Kiểm tra nếu pin có trạng thái "Booked" thì không cho phép gán trạm
    if (battery.status === 'Booked') {
      alert("Không thể gán trạm cho pin đang có trạng thái 'Booked'.");
      return;
    }

    setSelectedBatteryForAssign(battery);
    setSelectedStationForAssign(null);
    try {
      const list = await authAPI.getAllStations();
      setStations(Array.isArray(list) ? list : []);
      setShowAssignModal(true);
    } catch (err) {
      alert("Không lấy được danh sách trạm: " + (err?.message || err));
    }
  };

  // Bước 3: Chỉnh handleAssign để thêm slotId
  const handleAssign = async (stationId, slotId) => {
    if (!selectedBatteryForAssign) return;
    try {
      await authAPI.addBatteryToStation(selectedBatteryForAssign.batteryId, stationId, slotId);

      const matchedStation = stations.find((s) => s.stationId === stationId);
      const stationUpdate = {
        stationId,
        stationName: matchedStation?.stationName,
      };
      setBatteries(prev => prev.map(b => b.batteryId === selectedBatteryForAssign.batteryId
        ? { ...b, station: stationUpdate }
        : b));
      setShowAssignModal(false);
      setSelectedStationForAssign(null);
      alert(`Gán pin vào slot ${slotId} tại trạm ${matchedStation?.stationName} thành công!`);
    } catch (err) {
      alert("Gán pin thất bại: " + (err?.message || err));
    }
  };


  // ---------- REMOVE FROM STATION ----------
  const handleRemoveFromStation = async (battery) => {
    if (!battery.station?.stationId) {
      alert("Pin này chưa được gán vào trạm nào.");
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn gỡ pin ${battery.batteryName || battery.batteryId} khỏi trạm ${battery.station.stationName || battery.station.stationId}?`)) {
      return;
    }

    try {
      await authAPI.deleteBatteryInStation(battery.batteryId);

      // update local list: remove station info
      setBatteries(prev => prev.map(b =>
        b.batteryId === battery.batteryId ? { ...b, station: null } : b
      ));

      // update selected battery if it's the same one
      if (selectedBattery?.batteryId === battery.batteryId) {
        setSelectedBattery(prev => prev ? { ...prev, station: null } : prev);
      }

      alert("Đã gỡ pin khỏi trạm thành công!");
    } catch (err) {
      alert("Gỡ pin khỏi trạm thất bại: " + (err?.message || err));
    }
  };

  // ---------- FILTER ----------
  const filtered = batteries.filter(b => {
    const matchesSearch = search === "" ||
      (b.batteryName ?? "").toLowerCase().includes(search.toLowerCase()) ||
      b.batteryId?.toLowerCase().includes(search.toLowerCase()) ||
      (b.batteryType ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (b.specification ?? "").toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "" ||
      (b.status ?? "").toLowerCase() === statusFilter.toLowerCase();
    const matchesType = batteryTypeFilter === "" || (b.batteryType ?? "") === batteryTypeFilter;
    const matchesSpec = specificationFilter === "" || (b.specification ?? "") === specificationFilter;
    const stationText = `${b.station?.stationName ?? ""} ${b.station?.stationId ?? ""}`.toLowerCase();
    const matchesStation = stationFilter === "" || stationText.includes(stationFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesType && matchesSpec && matchesStation;
  });

  // ---------- SORT ----------
  const sorted = (() => {
    if (!sortBy) return filtered;
    const direction = sortOrder === "desc" ? -1 : 1;

    const getComparable = (item) => {
      switch (sortBy) {
        case "batteryName":
          return (item.batteryName || item.batteryId || "").toString().toLowerCase();
        case "batteryType":
          return (item.batteryType || "").toString().toLowerCase();
        case "specification":
          return (item.specification || "").toString().toLowerCase();
        case "status":
          return (item.status || "").toString().toLowerCase();
        case "capacity":
          return Number.isFinite(Number(item.capacity)) ? Number(item.capacity) : Number.NEGATIVE_INFINITY;
        case "batteryQuality":
          return Number.isFinite(Number(item.batteryQuality)) ? Number(item.batteryQuality) : Number.NEGATIVE_INFINITY;
        case "startDate":
          return item.startDate ? new Date(item.startDate).getTime() : Number.NEGATIVE_INFINITY;
        case "updateDate":
          return item.updateDate ? new Date(item.updateDate).getTime() : Number.NEGATIVE_INFINITY;
        default:
          return "";
      }
    };

    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = getComparable(a);
      const bv = getComparable(b);

      // numeric compare when both are numbers
      if (typeof av === "number" && typeof bv === "number") {
        if (av < bv) return -1 * direction;
        if (av > bv) return 1 * direction;
        return 0;
      }

      // string compare
      if (av < bv) return -1 * direction;
      if (av > bv) return 1 * direction;
      return 0;
    });
    return copy;
  })();

  // ---------- PAGINATION ----------
  // Pagination calculations
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBatteries = sorted.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, batteryTypeFilter, specificationFilter, stationFilter]);

  // Reset to page 1 when sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [sortBy, sortOrder]);

  // ---------- FETCH REPORTS ----------
  const loadReportsForBattery = async (batteryId) => {
    if (!batteryId) {
      setReports([]);
      return;
    }
    setReportsLoading(true);
    setReportsError("");
    try {
      const list = await authAPI.getBatteryReportsByBatteryId(batteryId);
      setReports(Array.isArray(list) ? list : []);
    } catch (e) {
      setReports([]);
      setReportsError(e?.message || "Không tải được báo cáo.");
    } finally {
      setReportsLoading(false);
    }
  };

  const loadHistoriesForBattery = async (batteryId) => {
    if (!batteryId) { setHistories([]); return; }
    setHistoriesLoading(true);
    setHistoriesError("");
    try {
      const list = await authAPI.getBatteryHistoryByBatteryId(batteryId);
      setHistories(Array.isArray(list) ? list : []);
    } catch (e) {
      setHistories([]);
      setHistoriesError(e?.message || "Không tải được lịch sử.");
    } finally {
      setHistoriesLoading(false);
    }
  };

  const loadExchangeDetailForReport = async (report) => {
    if (!report?.exchangeBatteryId) return;
    const repId = report.batteryReportId || report.id || report.exchangeBatteryId;

    // If exchange detail is already loaded, toggle it (collapse)
    if (exchangeByReportId[repId]) {
      setExchangeByReportId(prev => ({ ...prev, [repId]: null }));
      return;
    }

    setExchangeLoadingByReportId(prev => ({ ...prev, [repId]: true }));
    setExchangeErrorByReportId(prev => ({ ...prev, [repId]: "" }));
    try {
      const ex = await authAPI.getExchangeBatteryByExchangeId(report.exchangeBatteryId);
      setExchangeByReportId(prev => ({ ...prev, [repId]: ex || null }));
    } catch (e) {
      setExchangeByReportId(prev => ({ ...prev, [repId]: null }));
      setExchangeErrorByReportId(prev => ({ ...prev, [repId]: e?.message || "Không tải được chi tiết trao đổi" }));
    } finally {
      setExchangeLoadingByReportId(prev => ({ ...prev, [repId]: false }));
    }
  };

  // ---------- RENDER ----------
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
      <h1 className="station-title">Quản lý danh sách pin</h1>

      {/* Create form */}
      <form className="station-create" onSubmit={handleCreate} style={{ marginBottom: 12 }}>
        <div className="liquid create-row" style={{ alignItems: "center", borderRadius: 5 }}>
          <div style={{ display: "flex", gap: 18 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="batteryName" style={{
                fontWeight: 600,
                color: "#0f172a",
                marginBottom: 4,
                fontSize: 14,
                letterSpacing: 0.1,
              }}>
                <span style={{
                  background: "linear-gradient(90deg, #38bdf8 0%, #6366f1 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontWeight: 700,
                  fontSize: 15,
                }}>Tên pin</span>
              </label>
              <input
                id="batteryName"
                className="input"
                type="text"
                value={createForm.batteryName}
                onChange={(e) => setCreateForm({ ...createForm, batteryName: e.target.value })}
                placeholder="Nhập tên pin"
                style={{
                  border: "1.5px solid #c7d2fe",
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 14,
                  marginTop: 2,
                  background: "#f8fafc"
                }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="capacity" style={{
                fontWeight: 600,
                color: "#0f172a",
                marginBottom: 4,
                fontSize: 14,
                letterSpacing: 0.1,
              }}>
                <span style={{
                  background: "linear-gradient(90deg, #f59e42 0%, #fbbf24 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontWeight: 700,
                  fontSize: 15,
                }}>Dung lượng (%)</span>
              </label>
              <input
                id="capacity"
                className="input"
                type="number"
                min="0"
                max="100"
                step="1"
                value={createForm.capacity}
                onChange={(e) => setCreateForm({ ...createForm, capacity: e.target.value })}
                style={{
                  border: "1.5px solid #fde68a",
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 14,
                  marginTop: 2,
                  background: "#f8fafc"
                }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="batteryType" style={{
                fontWeight: 600,
                color: "#0f172a",
                marginBottom: 4,
                fontSize: 14,
                letterSpacing: 0.1,
              }}>
                <span style={{
                  background: "linear-gradient(90deg, #34d399 0%, #10b981 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontWeight: 700,
                  fontSize: 15,
                }}>Loại pin</span>
              </label>
              <select
                id="batteryType"
                className="input"
                value={createForm.batteryType}
                onChange={(e) => setCreateForm({ ...createForm, batteryType: e.target.value })}
                style={{
                  border: "1.5px solid #6ee7b7",
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 14,
                  marginTop: 2,
                  background: "#f8fafc"
                }}
              >
                <option value="">-- Chọn loại --</option>
                {batteryTypeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="specification" style={{
                fontWeight: 600,
                color: "#0f172a",
                marginBottom: 4,
                fontSize: 14,
                letterSpacing: 0.1,
              }}>
                <span style={{
                  background: "linear-gradient(90deg, #818cf8 0%, #a5b4fc 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontWeight: 700,
                  fontSize: 15,
                }}>Thông số</span>
              </label>
              <select
                id="specification"
                className="input"
                value={createForm.specification}
                onChange={(e) => setCreateForm({ ...createForm, specification: e.target.value })}
                style={{
                  border: "1.5px solid #a5b4fc",
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 14,
                  marginTop: 2,
                  background: "#f8fafc"
                }}
              >
                <option value="">-- Chọn thông số --</option>
                {specificationOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="batteryQuality" style={{
                fontWeight: 600,
                color: "#0f172a",
                marginBottom: 4,
                fontSize: 14,
                letterSpacing: 0.1,
              }}>
                <span style={{
                  background: "linear-gradient(90deg, #f472b6 0%, #f87171 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontWeight: 700,
                  fontSize: 15,
                }}>Chất lượng (%)</span>
              </label>
              <input
                id="batteryQuality"
                className="input"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={createForm.batteryQuality}
                onChange={(e) => setCreateForm({ ...createForm, batteryQuality: e.target.value })}
                style={{
                  border: "1.5px solid #fbcfe8",
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 14,
                  marginTop: 2,
                  background: "#f8fafc"
                }}
              />
            </div>
          </div>

          <button className="btn primary" type="submit" disabled={createLoading}>
            {createLoading ? "Đang tạo..." : "Thêm pin"}
          </button>
        </div>
      </form>

      {/* Controls */}
      <div className="station-controls">
        <div className="station-select">
          <label>Trạng thái:</label>
          <select
            className="input"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">-- Tất cả trạng thái --</option>
            <option value="Available">Sẵn sàng</option>
            <option value="InUse">Đang sử dụng</option>
            <option value="Charging">Đang sạc</option>
            <option value="Maintenance">Bảo trì</option>
            <option value="Decommissioned">Đã xóa</option>
            <option value="Booked">Đã đặt</option>
          </select>
        </div>

        <div className="station-select">
          <label>Loại pin:</label>
          <select
            className="input"
            value={batteryTypeFilter}
            onChange={e => setBatteryTypeFilter(e.target.value)}
          >
            <option value="">-- Tất cả --</option>
            {batteryTypeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>

        <div className="station-select">
          <label>Specification:</label>
          <select
            className="input"
            value={specificationFilter}
            onChange={e => setSpecificationFilter(e.target.value)}
          >
            <option value="">-- Tất cả --</option>
            {specificationOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>

        <div className="station-select">
          <label>Sắp xếp:</label>
          <select
            className="input"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            <option value="">-- Không sắp xếp --</option>
            <option value="batteryName">Tên pin</option>
            <option value="capacity">Capacity</option>
            <option value="batteryType">BatteryType</option>
            <option value="specification">Specification</option>
            <option value="batteryQuality">BatteryQuality</option>
            <option value="status">Trạng thái</option>
            <option value="startDate">Ngày tạo</option>
            <option value="updateDate">Ngày cập nhật</option>
          </select>
          <select
            className="input"
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value)}
          >
            <option value="asc">Tăng dần</option>
            <option value="desc">Giảm dần</option>
          </select>
        </div>

        <div className="station-select">
          <label>Tìm kiếm:</label>
          <input
            className="station-search"
            placeholder="Tìm theo tên pin, mã pin, loại pin, thông số..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="station-select">
          <label>Trạm:</label>
          <input
            className="station-search"
            placeholder="Lọc theo tên hoặc mã trạm"
            value={stationFilter}
            onChange={e => setStationFilter(e.target.value)}
          />
        </div>

        <div className="station-select">
          <button className="btn" onClick={fetchBatteries} disabled={loading}>
            {loading ? "Đang tải..." : "Reload"}
          </button>
          <button
            className="btn"
            onClick={() => {
              setSearch("");
              setStatusFilter("");
              setBatteryTypeFilter("");
              setSpecificationFilter("");
              setStationFilter("");
              setSortBy("");
              setSortOrder("asc");
              setCurrentPage(1);
            }}
            disabled={loading}
            type="button"
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>

      {/* Total count display */}
      <div className="station-summary">
        <span className="total-count">
          Tổng số pin: <strong>{totalItems}</strong>
          {totalItems > 0 && (
            <span className="page-info">
              {" "}(Trang {currentPage}/{totalPages} - Hiển thị {startIndex + 1}-{Math.min(endIndex, totalItems)})
            </span>
          )}
        </span>
      </div>

      {/* List */}
      {loading ? <div className="station-loading">Đang tải...</div>
        : error ? <div className="station-error">{error}</div>
          : (
            <div className="batt-list">
              {currentBatteries.length === 0 ? <div className="empty-note">Không có pin.</div> :
                currentBatteries.map(b => (
                  <div className="liquid batt-item" key={b.batteryId} style={{ borderRadius: "35px" }}>
                    <div className="batt-top">
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        {/* Battery Image, kế bên batt-id */}
                        {b.image && (
                          <div
                            className="batt-image"
                            style={{
                              width: 50,
                              height: 50,
                              borderRadius: 8,
                              overflow: 'hidden',
                              border: '2px solid #e2e8f0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              margin: 0,
                            }}
                          >
                            <img
                              src={b.image}
                              alt={`Pin ${b.batteryName || b.batteryId}`}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block'
                              }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                const parent = e.target.parentElement;
                                if (parent) parent.innerHTML = '<div style="font-size:12px;color:#64748b;line-height:40px;text-align:center;">No Image</div>';
                              }}
                            />
                          </div>
                        )}
                        <div className="batt-id">
                          {b.batteryName === "Graphene_TTFAR_Accumulator"
                            ? "GTA"
                            : (b.batteryName ? b.batteryName : b.batteryId)}
                        </div>
                      </div>
                      <div className="batt-left">
                        <div className="batt-meta">
                          Loại: <strong>{b.batteryType}</strong>
                        </div>
                        <div className="batt-meta">
                          Dung lượng: <strong>{b.capacity}%</strong>
                        </div>
                        <div className="batt-meta">
                          Dung lượng tối đa: <strong>{b.specification}</strong>
                        </div>
                        <div className="batt-submeta">
                          Trạm: <strong>{b.station?.stationName || b.station?.stationId || "Chưa gán"}</strong>
                        </div>
                      </div>
                      <div className="batt-right">
                        {/* Status Select */}
                        <div className="status-select-container">
                          <select
                            value={b.status || ''}
                            onChange={(e) => handleUpdateBatteryStatus(b.batteryId, e.target.value)}
                            disabled={statusUpdateLoading || b.status === 'InUse' || b.status === 'Booked'}
                            className={`status-select ${b.status === 'Available' ? 'status-available' :
                              b.status === 'InUse' ? 'status-inuse' :
                                b.status === 'Charging' ? 'status-charging' :
                                  b.status === 'Maintenance' ? 'status-maintenance' :
                                    b.status === 'Decommissioned' ? 'status-decommissioned' : ' '
                              }`}
                          >
                            <option value="Available">Sẵn sàng</option>
                            <option value="Charging">Đang sạc</option>
                            <option value="Maintenance">Bảo trì</option>
                            <option value="InUse">Đang sử dụng</option>
                            <option value="Booked">Đã đặt</option>
                            <option value="Decommissioned">Đã xóa</option>
                          </select>
                        </div>

                        <div className="batt-quality">SoH: <strong>{b.batteryQuality ?? "-"}%</strong></div>

                      </div>
                      <div className="batt-actions">
                        <button
                          className="btn small"
                          onClick={async () => {
                            await openDetailModal(b.batteryId);
                            setTimeout(() => {
                              const modal = document.querySelector('.modal');
                              if (modal) {
                                modal.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }
                            }, 50);
                          }}
                        >
                          Chi tiết
                        </button>
                        <button className="btn danger small" onClick={() => handleDelete(b.batteryId)}>Xóa</button>
                        <button className="btn small" onClick={() => openAssignModal(b)} disabled={b.status === 'Booked'}>Gán trạm</button>
                        {b.station?.stationId && (
                          <button className="btn small" onClick={() => handleRemoveFromStation(b)}>Gỡ khỏi trạm</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          )
      }

      {/* Detail Modal */}
      {showDetailModal && selectedBattery && (
        <div className="modal-overlay" onClick={() => { setShowDetailModal(false); setIsEditingInModal(false); }}>
          <div className="modal large" onClick={e => e.stopPropagation()}>
            {detailLoading ? <div className="station-loading">Đang tải...</div> : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h2>Chi tiết Pin {selectedBattery.batteryName ? selectedBattery.batteryName : selectedBattery.batteryId}</h2>
                  <div>
                    <button className="btn small" onClick={() => setIsEditingInModal(prev => !prev)}>{isEditingInModal ? "Hủy sửa" : "Sửa"}</button>
                    <button className="btn" onClick={() => { setShowDetailModal(false); setIsEditingInModal(false); }}>Đóng</button>
                  </div>
                </div>

                {isEditingInModal ? (
                  <div className="batt-edit-form" style={{ marginTop: 12 }}>
                    <div className="form-row">
                      <label style={{ color: "#111" }}>
                        Tên pin
                        <input
                          className="input"
                          style={{ color: "#111" }}
                          type="text"
                          value={editForm.batteryName}
                          onChange={e => setEditForm({ ...editForm, batteryName: e.target.value })}
                          placeholder="Nhập tên pin"
                        />
                      </label>

                      <label style={{ color: "#111" }}>
                        Capacity (%)
                        <input
                          className="input"
                          style={{ color: "#111" }}
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value={editForm.capacity}
                          onChange={e => setEditForm({ ...editForm, capacity: e.target.value })}
                        />
                      </label>

                      <label style={{ color: "#111" }}>
                        BatteryType
                        <select
                          className="input"
                          style={{ color: "#111" }}
                          value={editForm.batteryType}
                          onChange={e => setEditForm({ ...editForm, batteryType: e.target.value })}
                        >
                          {batteryTypeOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </label>

                      <label style={{ color: "#111" }}>
                        Specification
                        <select
                          className="input"
                          style={{ color: "#111" }}
                          value={editForm.specification}
                          onChange={e => setEditForm({ ...editForm, specification: e.target.value })}
                        >
                          {specificationOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </label>

                      <label style={{ color: "#111" }}>
                        BatteryQuality (%)
                        <input
                          className="input"
                          style={{ color: "#111" }}
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={editForm.batteryQuality}
                          onChange={e => setEditForm({ ...editForm, batteryQuality: e.target.value })}
                        />
                      </label>
                    </div>

                    <div className="edit-actions" style={{ marginTop: 12 }}>
                      <button className="btn primary" onClick={saveEditInModal} disabled={opLoading}>
                        {opLoading ? "Đang lưu..." : "Lưu thay đổi"}
                      </button>
                      <button className="btn" onClick={() => setIsEditingInModal(false)}>Hủy</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
                      {/* Info on left */}
                      <div style={{ flex: 1 }}>
                        <p><b>Tên pin:</b> {selectedBattery.batteryName ? selectedBattery.batteryName : selectedBattery.batteryId}</p>
                        <p><b>Mã pin:</b> {selectedBattery.batteryId}</p>
                        <p><b>Loại:</b> {selectedBattery.batteryType}</p>
                        <p><b>Capacity:</b> {selectedBattery.capacity}%</p>
                        <p><b>Specification:</b> {selectedBattery.specification}</p>
                        <p><b>SoH:</b> {selectedBattery.batteryQuality}%</p>
                        <p><b>Station:</b> {selectedBattery.station?.stationName || selectedBattery.station?.stationId || "Chưa gán"}</p>
                      </div>
                      {/* Battery Image on right */}
                      {selectedBattery.image && (
                        <div style={{ minWidth: 120 }}>
                          <img
                            src={selectedBattery.image}
                            alt={`Pin ${selectedBattery.batteryName || selectedBattery.batteryId}`}
                            style={{
                              maxWidth: 190,
                              maxHeight: 180,
                              borderRadius: 12,
                              border: '3px solid #e2e8f0',
                              objectFit: 'cover',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                              display: 'block',
                              marginLeft: 0,
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>
                    {/* Status Select trong modal */}
                    <div className="status-section" style={{ marginBottom: '12px' }}>
                      <label><b>Trạng thái:</b></label>
                      <select
                        value={selectedBattery.status || ''}
                        onChange={(e) => handleUpdateBatteryStatus(selectedBattery.batteryId, e.target.value)}
                        disabled={statusUpdateLoading || selectedBattery.status === 'InUse' || selectedBattery.status === 'Booked'}
                        className={`status-select ${selectedBattery.status === 'Available' ? 'status-available' :
                          selectedBattery.status === 'InUse' ? 'status-inuse' :
                            selectedBattery.status === 'Charging' ? 'status-charging' :
                              selectedBattery.status === 'Maintenance' ? 'status-maintenance' :
                                selectedBattery.status === 'Decommissioned' ? 'status-decommissioned' : ''
                          }`}
                        style={{ marginLeft: '8px' }}
                      >
                        <option value="Available">Sẵn sàng</option>
                        <option value="InUse">InUse</option>
                        <option value="Charging">Đang sạc</option>
                        <option value="Maintenance">Bảo trì</option>
                        <option value="Decommissioned">Delete</option>
                        <option value="Booked">Booked</option>
                      </select>
                    </div>
                    <div style={{ marginTop: 10 }}>
                      <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>Histories</span>
                        <button
                          className="btn small"
                          onClick={() => loadHistoriesForBattery(selectedBattery.batteryId)}
                          disabled={historiesLoading}
                        >
                          {historiesLoading ? "Đang tải..." : "Reload"}
                        </button>
                      </div>

                      {historiesError ? (
                        <div className="station-error">{historiesError}</div>
                      ) : historiesLoading ? (
                        <div className="station-loading">Đang tải lịch sử...</div>
                      ) : (histories?.length ? (
                        <div className="detail-list" style={{ display: 'grid', gap: 8 }}>
                          {histories.map((h, idx) => (
                            <div
                              key={h.batteryHistoryId || h.id || idx}
                              style={{
                                border: '1px solid #e2e8f0',
                                borderRadius: 10,
                                padding: 10,
                                background: '#ffffff'
                              }}
                            >
                              <div style={{ display: 'grid', gap: 6, fontSize: 13, color: '#0f172a' }}>
                                <div style={{ fontWeight: 700 }}>
                                  {h.title || h.action || 'Battery History'}
                                  {h.actionType ? (
                                    <span style={{
                                      marginLeft: 8,
                                      fontSize: 12,
                                      padding: '2px 8px',
                                      borderRadius: 999,
                                      border: '1px solid #cbd5e1',
                                    }}>
                                      {h.actionType}
                                    </span>
                                  ) : null}
                                </div>

                                {h.description ? (
                                  <div style={{ fontSize: 13, color: '#475569' }}>{h.description}</div>
                                ) : null}

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>

                                </div>


                                {/* Notes section */}
                                {h.notes ? (
                                  <div style={{ fontSize: 13, color: '#334155', marginTop: 4 }}>
                                    <b>Notes:</b> {h.notes}
                                  </div>
                                ) : null}

                                <div style={{ color: '#64748b' }}>
                                  <span><b>Tạo:</b> {h.startDate ? new Date(h.startDate).toLocaleString() : '-'}</span> •{" "}
                                  <span><b>Cập nhật:</b> {h.updateDate ? new Date(h.updateDate).toLocaleString() : '-'}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="empty-note">Không có lịch sử</div>
                      ))}

                      <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>Reports</span>
                        <button
                          className="btn small"
                          onClick={() => loadReportsForBattery(selectedBattery.batteryId)}
                          disabled={reportsLoading}
                        >
                          {reportsLoading ? "Đang tải..." : "Reload"}
                        </button>
                      </div>

                      {reportsError ? (
                        <div className="station-error">{reportsError}</div>
                      ) : reportsLoading ? (
                        <div className="station-loading">Đang tải báo cáo...</div>
                      ) : (reports?.length ? (
                        <div className="detail-list" style={{ display: 'grid', gap: 8 }}>
                          {reports.map((r) => (
                            <div
                              key={r.batteryReportId || r.id}
                              style={{
                                border: '1px solid #e2e8f0',
                                borderRadius: 10,
                                padding: 10,
                                background: '#ffffff'
                              }}
                            >
                              <div style={{ display: 'flex', gap: 12 }}>
                                {r.image ? (
                                  <img
                                    src={r.image}
                                    alt={r.name || r.batteryReportId}
                                    style={{ width: 72, height: 72, borderRadius: 8, objectFit: 'cover', border: '1px solid #e2e8f0' }}
                                    onError={(e) => (e.currentTarget.style.display = 'none')}
                                  />
                                ) : null}

                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: 700 }}>
                                    {r.name || 'Unnamed Report'}
                                    <span style={{
                                      marginLeft: 8,
                                      fontSize: 12,
                                      padding: '2px 8px',
                                      borderRadius: 999,
                                      border: '1px solid #cbd5e1',
                                    }}>
                                      {r.status || 'Pending'}
                                    </span>
                                  </div>

                                  {r.description ? (
                                    <div style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>
                                      {r.description}
                                    </div>
                                  ) : null}

                                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>
                                    Station: <b>{r.station?.stationName || r.stationId || '-'}</b>
                                    {r.exchangeBatteryId ? (
                                      <span> • Exchange: <b>{r.exchangeBatteryId}</b></span>
                                    ) : null}
                                  </div>

                                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                                    Bắt đầu: {r.startDate ? new Date(r.startDate).toLocaleString() : '-'} •
                                    Cập nhật: {r.updateDate ? new Date(r.updateDate).toLocaleString() : '-'}
                                  </div>

                                  {/* Actions */}
                                  {r.exchangeBatteryId ? (
                                    <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                      <button
                                        className="btn small"
                                        onClick={() => loadExchangeDetailForReport(r)}
                                        disabled={exchangeLoadingByReportId[r.batteryReportId || r.id || r.exchangeBatteryId]}
                                      >
                                        {exchangeLoadingByReportId[r.batteryReportId || r.id || r.exchangeBatteryId] ? "Đang mở..." :
                                          exchangeByReportId[r.batteryReportId || r.id || r.exchangeBatteryId] ? "Thu gọn" : "Xem trao đổi"}
                                      </button>
                                    </div>
                                  ) : null}

                                  {/* Exchange detail drawer */}
                                  {(() => {
                                    const repId = r.batteryReportId || r.id || r.exchangeBatteryId;
                                    const ex = exchangeByReportId[repId];
                                    const exErr = exchangeErrorByReportId[repId];
                                    const exLoading = exchangeLoadingByReportId[repId];

                                    if (exErr) {
                                      return <div style={{ marginTop: 8, color: '#b91c1c', fontSize: 13 }}>{exErr}</div>;
                                    }
                                    if (!ex && !exLoading) return null;

                                    // Khi có dữ liệu, hiển thị "thẻ chi tiết"
                                    return ex ? (
                                      <div
                                        style={{
                                          marginTop: 10,
                                          borderTop: '1px dashed #cbd5e1',
                                          paddingTop: 10,
                                          display: 'grid',
                                          gap: 6,
                                          fontSize: 13,
                                          color: '#0f172a'
                                        }}
                                      >
                                        <div><b>Exchange ID:</b> {ex.exchangeBatteryId}</div>
                                        <div><b>Trạng thái:</b> {ex.status}</div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                          <div>
                                            <div><b>Old Battery:</b> {ex.oldBattery?.batteryName || ex.oldBatteryId || '-'}</div>
                                            <div><b>New Battery:</b> {ex.newBattery?.batteryName || ex.newBatteryId || '-'}</div>
                                          </div>
                                          <div>
                                            <div><b>Station:</b> {ex.station?.stationName || ex.stationId || '-'}</div>
                                            <div><b>Order:</b> {ex.order?.orderId || ex.orderId || '-'}</div>
                                          </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                          <div><b>Staff:</b> {ex.staffAccount?.name || ex.staffAccountId || '-'}</div>
                                          <div><b>VIN:</b> {ex.vinNavigation?.vin || ex.vin || '-'}</div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                          <div><b>Schedule:</b> {ex.schedule?.scheduleId || ex.scheduleId || '-'}</div>
                                          <div><b>Ghi chú:</b> {ex.notes || '-'}</div>
                                        </div>

                                        <div style={{ color: '#64748b' }}>
                                          <span><b>Tạo:</b> {ex.startDate ? new Date(ex.startDate).toLocaleString() : '-'}</span> •{" "}
                                          <span><b>Cập nhật:</b> {ex.updateDate ? new Date(ex.updateDate).toLocaleString() : '-'}</span>
                                        </div>
                                      </div>
                                    ) : null;
                                  })()}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="empty-note">Không có báo cáo</div>
                      ))}
                    </div>

                    {/* Ngày tạo, cập nhật nằm dưới cuối cùng */}
                    <p className="date-info" style={{ color: "white", fontSize: 13, marginTop: 16 }}>
                      Ngày tạo: {selectedBattery.startDate ? new Date(selectedBattery.startDate).toLocaleString() : "-"} <br />
                      Cập nhật: {selectedBattery.updateDate ? new Date(selectedBattery.updateDate).toLocaleString() : "-"}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Assign modal */}
      {showAssignModal && selectedBatteryForAssign && (
        <div className="modal-overlay" onClick={() => { setShowAssignModal(false); setSelectedStationForAssign(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            {!selectedStationForAssign ? (
              <>
                <h2>
                  Chọn trạm để gán cho{" "}
                  {selectedBatteryForAssign.batteryName || selectedBatteryForAssign.batteryId}
                </h2>
                <ul className="station-list">
                  {stations.map(st => (
                    <li key={st.stationId} style={{ marginBottom: 8 }}>
                      <button
                        className="btn small" style={{ width: '100%' }}
                        onClick={async () => {
                          try {
                            // Gọi API get_station_by_id_for_admin
                            const stationDetail = await authAPI.getStationByIdForAdmin(st.stationId);

                            // Loại bỏ slot đã có pin (battery) để không cho gán vào các slot đã có pin
                            const availableSlots = Array.isArray(stationDetail?.slots)
                              ? stationDetail.slots.filter(slot => !slot.battery)
                              : [];

                            setSelectedStationForAssign({
                              ...st,
                              slots: availableSlots,
                            });
                          } catch (err) {
                            alert("Không tải được slot của trạm: " + (err?.message || err));
                          }
                        }}
                      >
                        {st.stationName || st.stationId} — {st.location}
                      </button>
                    </li>
                  ))}
                </ul>
                <div style={{ marginTop: 12 }}>
                  <button className="btn" onClick={() => setShowAssignModal(false)}>Đóng</button>
                </div>
              </>
            ) : (
              <>
                <h2>Chọn slot tại {selectedStationForAssign.stationName}</h2>
                {/* Hiển thị THEO DẠNG GRID cordinateX là cột (hàng ngang), cordinateY là dòng (hàng dọc) */}
                {selectedStationForAssign.slots?.length ? (() => {
                  const slots = selectedStationForAssign.slots;

                  // Nếu slot đã không dùng filter phía trên mà vẫn còn slot có pin, chỉ hiển thị slot trống
                  const emptySlots = slots.filter(slot => !slot.battery);

                  if (emptySlots.length === 0) {
                    return <p>Không còn slot trống để gán pin.</p>;
                  }

                  // Chuẩn hóa dữ liệu slot: tìm max X và Y chỉ trên slot rỗng
                  // Lấy max X, Y chính xác
                  const maxX = Math.max(...slots.map(s => Number(s.cordinateX) || 0));
                  const maxY = Math.max(...slots.map(s => Number(s.cordinateY) || 0));

                  // Tạo grid từ 1 đến max, KHÔNG dư
                  const grid = [];
                  for (let y = 1; y <= maxY; y++) {
                    const row = [];
                    for (let x = 1; x <= maxX; x++) {
                      const slot = slots.find(s => Number(s.cordinateX) === x && Number(s.cordinateY) === y);
                      row.push(slot || null);
                    }
                    grid.push(row);
                  }
                  return (
                    <div style={{ overflowX: 'auto', margin: '16px 0' }}>
                      <table className="slot-grid-table" style={{ borderCollapse: 'separate', borderSpacing: 10 }}>
                        <tbody>
                          {grid.map((row, y) => (
                            <tr key={y}>
                              {row.map((slot, x) => (
                                <td
                                  key={x}
                                  style={{
                                    minWidth: 130,
                                    minHeight: 80,
                                    textAlign: 'center',
                                    verticalAlign: 'middle',
                                    borderRadius: 9,
                                    border: '1.5px solid #86efac', // green border (dominant)
                                    boxShadow: slot
                                      ? '0px 2px 10px 0 #bbf7d0c0, 0 0 0 1.5px #fdba7433'
                                      : undefined // green glow, subtle orange glow
                                  }}
                                >
                                  {slot ? (
                                    slot.battery ? (
                                      // Slot có pin: hiển thị tên pin, capacity, status
                                      <div
                                        style={{
                                          minHeight: 80,
                                          display: "flex",
                                          flexDirection: "column",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          background: "linear-gradient(115deg, #bbf7d0 82%, #fdba7477 100%)", // xanh lá chủ đạo, chút cam cuối
                                          border: "2px solid #4ade80", // border xanh lá chủ đạo
                                          borderRadius: 8,
                                          padding: 10,
                                          boxShadow: "0 4px 10px #bbf7d088, 0px 0px 10px #fdba7422"
                                        }}
                                        title={slot.slotId}
                                      >
                                      </div>
                                    ) : (
                                      // Slot không có pin: cho phép gán pin vào slot này
                                      <button
                                        className="btn small"
                                        style={{
                                          width: "100%",
                                          minHeight: 80,
                                          fontWeight: 500,
                                          background: "linear-gradient(115deg, #dcfce7 90%, #fed7aa 100%)", // chủ yếu xanh, cam chỉ 1 chút
                                          border: "2.5px solid #65a30d", // border xanh lá
                                          borderRadius: 8,
                                          display: "flex",
                                          flexDirection: "column",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          cursor: "pointer",
                                          opacity: 1,
                                          boxShadow: "0 2px 8px #bbf7d0a0, 0 0 0 1px #fdba7420"
                                        }}
                                        onClick={() => handleAssign(selectedStationForAssign.stationId, slot.slotId)}
                                        title={slot.slotName || slot.slotId}
                                      >
                                        <span style={{
                                          marginTop: 6,
                                          color: "#4ade80", // xanh lá chủ đạo
                                          fontSize: 15,
                                          fontWeight: 700
                                        }}>
                                          Trống
                                        </span>
                                      </button>
                                    )
                                  ) : (
                                    <div style={{
                                      minHeight: 60,
                                      color: "#bdbdbd",
                                      fontStyle: 'italic',
                                      fontSize: 15,
                                      background: 'linear-gradient(115deg, #f1f5f9 90%, #fef3c7 100%)',
                                      borderRadius: 8,
                                      padding: 6,
                                      border: '1.5px dashed #bbf7d0',
                                      alignContent: 'center',
                                    }}>
                                      Đã có pin
                                    </div>
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })() : (
                  <p>Trạm này chưa có slot.</p>
                )}

                <div style={{ marginTop: 12 }}>
                  <button className="btn" onClick={() => setSelectedStationForAssign(null)}>
                    Quay lại
                  </button>
                  <button className="btn" onClick={() => setShowAssignModal(false)}>
                    Đóng
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn small"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ← Trước
          </button>

          <div className="page-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                className={`btn small ${page === currentPage ? 'active' : ''}`}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            className="btn small"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Sau →
          </button>
        </div>
      )}
    </div>
  );
}