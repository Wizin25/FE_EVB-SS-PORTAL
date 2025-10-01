import React, { useEffect, useMemo, useState } from "react";
import { authAPI } from "../services/authAPI";
import HeaderDriver from "./header";
import Footer from "./footer";
import "../Admin/pages/Station.css";

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

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

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

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    return stations.filter((st) => {
      if (statusFilter !== "All" && (st.status ?? "").toLowerCase() !== statusFilter.toLowerCase()) return false;
      if (!text) return true;
      const candidate = `${st.stationName ?? st.Name ?? ""} ${st.location ?? ""}`.toLowerCase();
      return candidate.includes(text);
    });
  }, [stations, q, statusFilter]);

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filtered.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [q, statusFilter]);

  const safeLen = (arr) => (Array.isArray(arr) ? arr.length : 0);

  return (
    <div
      className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}
      style={{ maxHeight: "calc(100vh - 120px)", overflowY: "auto" }}
    >
      <HeaderDriver
        onToggleTheme={handleToggleTheme}
        theme={theme}
        user={user}
        unreadCount={unreadCount}
        nextBooking={nextBooking}
        onOpenBooking={handleOpenBooking}
      />

      <div className="station-container" >
        <h2 className="station-title">Danh sách trạm đổi pin</h2>

        <div className="station-controls">
          <input
            className="station-search"
            placeholder="Tìm tên trạm hoặc location..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select className="station-select" value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)}>
            <option value="All">Tất cả trạng thái</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <button className="btn" onClick={fetchStations} disabled={loading}>
            {loading ? "Đang tải..." : "Reload"}
          </button>
        </div>

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

        {error && <div className="station-error">Lỗi: {error}</div>}
        {loading && <div className="station-loading">Đang tải dữ liệu...</div>}

        {!loading && !error && (
          totalItems === 0 ? (
            <div className="station-empty">Không tìm thấy trạm nào phù hợp.</div>
          ) : (
            <div className="station-grid">
              {currentItems.map((st, idx) => (
                <article key={st.stationId} className="station-card" style={{ animationDelay: `${idx * 40}ms` }}>
                  <div className="station-head">
                    <div className="head-left">
                      <h3 className="station-id">{st.stationName ?? "Tên trạm chưa có"}</h3>
                      <div className="station-subinfo">
                        <span className="sub-location">{st.location ?? "-"}</span>
                        <span className="sub-sep">•</span>
                        <span className="sub-rating">⭐ {st.rating ?? "-"}</span>
                      </div>
                      <div className={`station-status ${ (st.status ?? "").toLowerCase() === "active" ? "active": "inactive"}`}>
                        {st.status ?? "Unknown"}
                      </div>
                    </div>
                 </div>

                  <div className="summary-row">
                    <div className="summary-item">
                      <div className="summary-num">{st.batteryNumber ?? 0}</div>
                      <div className="summary-label">Số pin đăng ký</div>
                    </div>
                    <div className="summary-item">
                      <div className="summary-num">{safeLen(st.batteries)}</div>
                      <div className="summary-label">Pin đang ở trạm</div>
                    </div>
                    <div className="summary-item hide-mobile">
                      <div className="summary-num">{safeLen(st.batteryHistories)}</div>
                      <div className="summary-label">Lịch sử</div>
                    </div>
                  </div>

                  <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                    <a className="btn primary" href={`/booking?stationId=${encodeURIComponent(st.stationId)}`}>
                      Đặt lịch
                    </a>
                  </div>
                </article>
              ))}
            </div>
          )
        )}

        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="btn small"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              ← Trước
            </button>
            <div className="page-numbers">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  className={`btn small ${page === currentPage ? 'active' : ''}`}
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

      <Footer />
    </div>
  );
}
