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
    batteryQuality: ""
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

      setBatteryTypeOptions(nt.length ? nt : ["Lithium", "Accumulator", "LFP"]);
      setSpecificationOptions(ns.length ? ns : ["V48_Ah12", "V60_Ah22", "V72_Ah38", "V72_Ah54"]);

      // default values for create form if empty
      setCreateForm((prev) => ({
        ...prev,
        batteryType: prev.batteryType || (nt[0] || "Lithium"),
        specification: prev.specification || (ns[0] || "V48_Ah12"),
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

      await authAPI.createBattery(fd);
      setCreateForm({ batteryName: "", capacity: "", batteryType: batteryTypeOptions[0] || "", specification: specificationOptions[0] || "", batteryQuality: "" });
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
    setSelectedBatteryForAssign(battery);
    try {
      const list = await authAPI.getAllStations();
      setStations(Array.isArray(list) ? list : []);
      setShowAssignModal(true);
    } catch (err) {
      alert("Không lấy được danh sách trạm: " + (err?.message || err));
    }
  };

  const handleAssign = async (stationId) => {
    if (!selectedBatteryForAssign) return;
    try {
      await authAPI.addBatteryToStation(selectedBatteryForAssign.batteryId, stationId);
      // update local list: set station with id and name if known
      const matchedStation = stations.find((s) => s.stationId === stationId);
      const stationUpdate = {
        stationId,
        stationName: matchedStation?.stationName,
      };
      setBatteries(prev => prev.map(b => b.batteryId === selectedBatteryForAssign.batteryId ? { ...b, station: stationUpdate } : b));
      if (selectedBattery?.batteryId === selectedBatteryForAssign.batteryId) {
        setSelectedBattery(prev => prev ? { ...prev, station: stationUpdate } : prev);
      }
      setShowAssignModal(false);
    } catch (err) {
      alert("Gán trạm thất bại: " + (err?.message || err));
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
    
    return matchesSearch && matchesStatus;
  });

  // ---------- PAGINATION ----------
  // Pagination calculations
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBatteries = filtered.slice(startIndex, endIndex);

  const handlePageChange = (page) => {  
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  // ---------- RENDER ----------
  return (
    <div className="station-container">
      <h1 className="station-title">Quản lý pin</h1>

      {/* Create form */}
      <form className="station-create" onSubmit={handleCreate} style={{ marginBottom: 12 }}>
        <div className="create-row" style={{ alignItems: "center" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            Tên pin
            <input className="input" type="text" 
                   value={createForm.batteryName}
                   onChange={(e) => setCreateForm({...createForm, batteryName: e.target.value})} 
                   placeholder="Nhập tên pin" />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            Capacity (%) 
            <input className="input" type="number" min="0" max="100" step="1"
                   value={createForm.capacity}
                   onChange={(e) => setCreateForm({...createForm, capacity: e.target.value})} />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            BatteryType
            <select className="input" value={createForm.batteryType} onChange={(e) => setCreateForm({...createForm, batteryType: e.target.value})}>
              {batteryTypeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            Specification
            <select className="input" value={createForm.specification} onChange={(e) => setCreateForm({...createForm, specification: e.target.value})}>
              {specificationOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            BatteryQuality (%)
            <input className="input" type="number" min="0" max="100" step="0.1"
                   value={createForm.batteryQuality}
                   onChange={(e) => setCreateForm({...createForm, batteryQuality: e.target.value})} />
          </label>

          <button className="btn primary" type="submit" disabled={createLoading}>
            {createLoading ? "Đang tạo..." : "Thêm pin"}
          </button>
        </div>
      </form>

      {/* Controls */}
      <div className="station-controls" style={{ marginBottom: 18, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ fontSize: "14px", fontWeight: "500" }}>Trạng thái:</label>
          <select
            className="input"
            style={{ minWidth: 160 }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">-- Tất cả trạng thái --</option>
            <option value="Available">Available</option>
            <option value="InUse">InUse</option>
            <option value="Charging">Charging</option>
            <option value="Faulty">Faulty</option>
            <option value="Decommissioned">Decommissioned</option>
          </select>
        </div>
        
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ fontSize: "14px", fontWeight: "500" }}>Tìm kiếm:</label>
          <input
            className="station-search"
            placeholder="Tìm theo tên pin, mã pin, loại pin, thông số..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ minWidth: 250 }}
          />
        </div>
        
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={fetchBatteries} disabled={loading}>
            {loading ? "Đang tải..." : "Reload"}
          </button>
          <button 
            className="btn" 
            onClick={() => {
              setSearch("");
              setStatusFilter("");
            }}
            disabled={loading}
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
                <div className="batt-item" key={b.batteryId}>
                  <div className="batt-top">
                    <div className="batt-left">
                      {/* 
                        Sửa lại: Khi hiển thị danh sách, ưu tiên hiển thị tên pin (batteryName).
                        Nếu không có tên pin thì mới fallback sang batteryId.
                        Điều này đảm bảo khi tạo mới, pin sẽ hiển thị theo tên (nếu có).
                      */}
                      <div className="batt-id">{b.batteryName ? b.batteryName : b.batteryId}</div>
                      <div className="batt-meta">{b.batteryType} • {b.capacity}% • {b.specification}</div>
                      <div className="batt-submeta">Trạm: {b.station?.stationName || b.station?.stationId || "Chưa gán"}</div>
                    </div>
                    <div className="batt-right">
                      <div className="batt-status-pill">{b.status}</div>
                      <div className="batt-quality">SoH: <strong>{b.batteryQuality ?? "-"}%</strong></div>
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
                        <button className="btn small" onClick={() => openAssignModal(b)}>Gán trạm</button>
                      </div>
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
                  {/* Ưu tiên hiển thị tên pin, nếu không có thì mới dùng batteryId */}
                  <h2>Chi tiết Pin {selectedBattery.batteryName ? selectedBattery.batteryName : selectedBattery.batteryId}</h2>
                  <div>
                    <button className="btn small" onClick={() => setIsEditingInModal(prev => !prev)}>{isEditingInModal ? "Hủy sửa" : "Sửa"}</button>
                    <button className="btn" onClick={() => { setShowDetailModal(false); setIsEditingInModal(false); }}>Đóng</button>
                  </div>
                </div>

                {isEditingInModal ? (
                  <div className="batt-edit-form" style={{ marginTop: 12 }}>
                    <div className="form-row">
                      <label>
                        Tên pin
                        <input
                          className="input"
                          type="text"
                          value={editForm.batteryName}
                          onChange={e => setEditForm({ ...editForm, batteryName: e.target.value })}
                          placeholder="Nhập tên pin"
                        />
                      </label>

                      <label>
                        Capacity (%)
                        <input
                          className="input"
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value={editForm.capacity}
                          onChange={e => setEditForm({ ...editForm, capacity: e.target.value })}
                        />
                      </label>

                      <label>
                        BatteryType
                        <select
                          className="input"
                          value={editForm.batteryType}
                          onChange={e => setEditForm({ ...editForm, batteryType: e.target.value })}
                        >
                          {batteryTypeOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </label>

                      <label>
                        Specification
                        <select
                          className="input"
                          value={editForm.specification}
                          onChange={e => setEditForm({ ...editForm, specification: e.target.value })}
                        >
                          {specificationOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </label>

                      <label>
                        BatteryQuality (%)
                        <input
                          className="input"
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
                    {/* Ưu tiên hiển thị tên pin, nếu không có thì mới dùng batteryId */}
                    <p><b>Tên pin:</b> {selectedBattery.batteryName ? selectedBattery.batteryName : selectedBattery.batteryId}</p>
                    <p><b>Loại:</b> {selectedBattery.batteryType}</p>
                    <p><b>Capacity:</b> {selectedBattery.capacity}%</p>
                    <p><b>Specification:</b> {selectedBattery.specification}</p>
                    <p><b>SoH:</b> {selectedBattery.batteryQuality}%</p>
                    <p><b>Trạng thái:</b> {selectedBattery.status}</p>
                    <p><b>Station:</b> {selectedBattery.station?.stationName || selectedBattery.station?.stationId || "Chưa gán"}</p>
                    <p className="date-info" style={{ color: "#64748b", fontSize: 13 }}>
                      Ngày tạo: {selectedBattery.startDate ? new Date(selectedBattery.startDate).toLocaleString() : "-"} <br/>
                      Cập nhật: {selectedBattery.updateDate ? new Date(selectedBattery.updateDate).toLocaleString() : "-"}
                    </p>

                    <div style={{ marginTop: 10 }}>
                      <div className="section-title">Histories</div>
                      {selectedBattery.batteryHistories?.length ? (
                        <ul className="detail-list">{selectedBattery.batteryHistories.map((h,i)=><li key={i}>{JSON.stringify(h)}</li>)}</ul>
                      ) : <div className="empty-note">Không có lịch sử</div>}

                      <div className="section-title">Reports</div>
                      {selectedBattery.batteryReports?.length ? (
                        <ul className="detail-list">{selectedBattery.batteryReports.map((r,i)=><li key={i}>{JSON.stringify(r)}</li>)}</ul>
                      ) : <div className="empty-note">Không có báo cáo</div>}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Assign modal */}
      {showAssignModal && selectedBatteryForAssign && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            {/* Ưu tiên hiển thị tên pin, nếu không có thì mới dùng batteryId */}
            <h2>Chọn trạm để gán cho {selectedBatteryForAssign.batteryName ? selectedBatteryForAssign.batteryName : selectedBatteryForAssign.batteryId}</h2>
            <ul className="station-list">
              {stations.map(st => (
                <li key={st.stationId} style={{ marginBottom: 8 }}>
                  <button className="btn small" onClick={() => handleAssign(st.stationId)}>
                    {st.stationName || st.stationId} — {st.location}
                  </button>
                </li>
              ))}
            </ul>
            <div style={{ marginTop: 12 }}>
              <button className="btn" onClick={() => setShowAssignModal(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
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
