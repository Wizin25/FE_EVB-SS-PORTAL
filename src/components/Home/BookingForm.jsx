import React, { useEffect, useMemo, useState } from "react";
import HeaderDriver from "./header";
import Footer from "./footer";
import { authAPI } from "../services/authAPI";
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
        const found = Array.isArray(allStations) && allStations.find(s=>String(s.stationId)===String(preselect));
        if (preselect && found) setStationId(found.stationId);
        else if (Array.isArray(allStations) && allStations.length > 0) setStationId(allStations[0].stationId);
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
    if (!user?.accountId && !user?.accountID && !user?.AccountId) {
      setError("Không tìm thấy AccountId. Hãy đăng nhập lại.");
      return;
    }
    const accountId = user.accountId || user.accountID || user.AccountId;
    try {
      setLoading(true);
      await authAPI.createForm({ accountId, title, description, date, stationId });
      setSuccess("Đặt lịch thành công.");
      setTitle("");
      setDescription("");
      setDate("");
      // giữ stationId như cũ
    } catch (err) {
      setError(err?.message || "Đặt lịch thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
      <HeaderDriver
        onToggleTheme={handleToggleTheme}
        theme={theme}
        user={user}
        unreadCount={unreadCount}
        nextBooking={nextBooking}
        onOpenBooking={() => {}}
      />

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


