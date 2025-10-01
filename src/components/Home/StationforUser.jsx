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
              {currentItems.map((st, idx) => (
                <article 
                  key={st.stationId} 
                  className="station-card" 
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
                    <div className="station-head">
                      <div className="head-left">
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
                            ⭐ {st.rating ?? "-"}
                          </span>
                        </div>
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

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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
              ))}
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

      <Footer />
    </div>
  );
}
