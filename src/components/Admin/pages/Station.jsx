import React, { useEffect, useState, useMemo } from "react";
import { authAPI } from "../../services/authAPI";
import "./Station.css";

export default function Station() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [opLoading, setOpLoading] = useState(false);
  const [error, setError] = useState(null);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const [createName, setCreateName] = useState("");
  const [createBatteryNumber, setCreateBatteryNumber] = useState("");
  const [createLocation, setCreateLocation] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editBatteryNumber, setEditBatteryNumber] = useState("");
  const [editLocation, setEditLocation] = useState("");

  const [expandedId, setExpandedId] = useState(null);

  const fetchStations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await authAPI.getAllStations();
      setStations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("fetchStations:", err);
      setError(err?.message || "Lỗi khi tải danh sách trạm");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStations(); }, []);

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    return stations.filter((st) => {
      if (statusFilter !== "All" && (st.status ?? "").toLowerCase() !== statusFilter.toLowerCase()) return false;
      if (!text) return true;
      const candidate = `${st.Name ?? ""} ${st.location ?? ""}`.toLowerCase();
      return candidate.includes(text);
    });
  }, [stations, q, statusFilter]);

  // Pagination calculations
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filtered.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [q, statusFilter]);

  const safeLen = (arr) => (Array.isArray(arr) ? arr.length : 0);
  const fmt = (d) => (d ? new Date(d).toLocaleString() : "-");

  // Create
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createName) { alert("Vui lòng nhập Tên trạm."); return; }
    if (!createLocation) { alert("Vui lòng nhập Location."); return; }
    const batteryNumber = parseInt(createBatteryNumber || "0", 10);
    setOpLoading(true);
    try {
      await authAPI.createStation({ stationName: createName, batteryNumber, location: createLocation });
      alert("Tạo trạm thành công");
      setCreateName("");
      setCreateBatteryNumber("");
      setCreateLocation("");
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
  const cancelEdit = () => { 
    setEditingId(null); 
    setEditName("");
    setEditBatteryNumber(""); 
    setEditLocation(""); 
  };

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

  const toggleExpand = (stationId) => setExpandedId(prev => (prev === stationId ? null : stationId));

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setExpandedId(null); // Close any expanded cards when changing pages
  };

  return (
    <div className="station-container">
      <h2 className="station-title">Danh sách trạm đổi pin</h2>

      <form className="station-create" onSubmit={handleCreate}>
        <div className="create-row">
          <input type="text" placeholder="Tên trạm"
                 value={createName} onChange={(e)=>setCreateName(e.target.value)}
                 className="input" />
          <input type="number" min="0" placeholder="BatteryNumber"
                 value={createBatteryNumber} onChange={(e)=>setCreateBatteryNumber(e.target.value)}
                 className="input" />
          <input type="text" placeholder="Location"
                 value={createLocation} onChange={(e)=>setCreateLocation(e.target.value)}
                 className="input" />
          <button className="btn primary" type="submit" disabled={opLoading}>
            {opLoading ? "Đang xử lý..." : "Tạo trạm"}
          </button>
        </div>
      </form>

      <div className="station-controls">
        <input className="station-search" placeholder="Tìm tên trạm hoặc location..."
               value={q} onChange={(e)=>setQ(e.target.value)} />
        <select className="station-select" value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)}>
          <option value="All">Tất cả trạng thái</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        <button className="btn" onClick={fetchStations} disabled={loading || opLoading}>Reload</button>
      </div>

      {/* Total count display */}
      <div className="station-summary">
        <span className="total-count">
          Tổng số trạm: <strong>{totalItems}</strong>
          {totalItems > 0 && (
            <span className="page-info">
              {" "}(Trang {currentPage}/{totalPages} - Hiển thị {startIndex + 1}-{Math.min(endIndex, totalItems)})
            </span>
          )}
        </span>
      </div>

      {loading && <div className="station-loading">Đang tải dữ liệu...</div>}
      {error && <div className="station-error">Lỗi: {error}</div>}

      {!loading && !error && (
        <>
          {totalItems === 0 ? (
            <div className="station-empty">Không tìm thấy trạm nào phù hợp.</div>
          ) : (
            <>
              <div className="station-grid">
                {currentItems.map((station, idx) => {
                  const batteryCount = safeLen(station.batteries);
                  const isExpanded = expandedId === station.stationId;

                  return (
                    <article key={station.stationId}
                             className={`station-card ${isExpanded ? "expanded" : ""}`}
                             style={{ animationDelay: `${idx * 40}ms` }}>
                      <div className="station-head">
                        <div className="head-left">
                          <h3 className="station-id">{station.stationName ?? "Tên trạm chưa có"}</h3>

                          <div className="station-subinfo">
                            <span className="sub-location">{station.location ?? "-"}</span>
                            <span className="sub-sep">•</span>
                            <span className="sub-rating">⭐ {station.rating ?? "-"}</span>
                          </div>

                          <div className={`station-status ${ (station.status ?? "").toLowerCase() === "active" ? "active": "inactive"}`}>
                            {station.status ?? "Unknown"}
                          </div>
                        </div>

                        {/* Dates on the right (small gray text) */}
                        <div className="head-right">
                          <div className="tiny">Start: {station.startDate ? new Date(station.startDate).toLocaleString() : "-"}</div>
                          <div className="tiny">Updated: {station.updateDate ? new Date(station.updateDate).toLocaleString() : "-"}</div>

                          <div className="card-actions">
                            <button className="btn small" onClick={()=>toggleExpand(station.stationId)}>
                              {isExpanded ? "Thu gọn" : "Chi tiết"}
                            </button>
                            <button className="btn small" onClick={()=>startEdit(station)}>Sửa</button>
                            <button className="btn danger small" onClick={()=>handleDelete(station.stationId)}>Xóa</button>
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

                        <div className="summary-item hide-mobile">
                          <div className="summary-num">{safeLen(station.batteryHistories)}</div>
                          <div className="summary-label">Lịch sử</div>
                        </div>
                      </div>

                      {editingId === station.stationId ? (
                        <form className="edit-form" onSubmit={handleUpdate}>
                          <div className="form-row">
                            <label>
                              Tên trạm
                              <input type="text" value={editName}
                                     onChange={(e)=>setEditName(e.target.value)} className="input" />
                            </label>
                            <label>
                              BatteryNumber
                              <input type="number" min="0" value={editBatteryNumber}
                                     onChange={(e)=>setEditBatteryNumber(e.target.value)} className="input" />
                            </label>
                            <label>
                              Location
                              <input type="text" value={editLocation}
                                     onChange={(e)=>setEditLocation(e.target.value)} className="input" />
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

                      {/* DETAIL: removed Location/Rating/Start/Updated fields here per request.
                          Only counts + batteries are shown. */}
                      <div className={`station-detail ${isExpanded ? "open" : ""}`}>
                        <div className="counts-grid">
                          <div className="count-item"><div className="count-num">{batteryCount}</div><div className="count-label">Batteries</div></div>
                          <div className="count-item"><div className="count-num">{safeLen(station.batteryReports)}</div><div className="count-label">Reports</div></div>
                          <div className="count-item"><div className="count-num">{safeLen(station.slots)}</div><div className="count-label">Slots</div></div>
                        </div>

                        <div className="batteries-section">
                          <div className="section-title">Batteries ở trạm ({batteryCount})</div>
                          {batteryCount === 0 ? (
                            <div className="empty-note">Không có battery nào ở trạm này.</div>
                          ) : (
                            <div className="batt-list">
                              {station.batteries.map((b) => (
                                <div className="batt-item" key={b.batteryId}>
                                    <div className="batt-left">
                                    <div className="batt-id">{b.batteryName || b.batteryId}</div>
                                    <div className="batt-meta">
                                      {b.batteryType ? `${b.batteryType} • ${b.capacity ?? "?"}%` : `${b.capacity ?? "?"}%`}
                                      {b.specification ? ` • ${b.specification}` : ""}
                                    </div>
                                  </div>

                                  <div className="batt-right">
                                    <div className="batt-stats">
                                      <div className="batt-quality">SoH: <strong>{b.batteryQuality ?? "-" }%</strong></div>
                                      <div className={`batt-status ${(b.status ?? "").toLowerCase() === "available" ? "ok" : (b.status ?? "").toLowerCase() === "inuse" ? "warn" : ""}`}>
                                        {b.status ?? "-"}
                                      </div>
                                    </div>
                                    <div className="batt-times">
                                      <div className="small-t">Updated: {b.updateDate ? new Date(b.updateDate).toLocaleString() : "-"}</div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Pagination Controls */}
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
            </>
          )}
        </>
      )}
    </div>
  );
}
