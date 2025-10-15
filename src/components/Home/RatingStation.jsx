import React, { useMemo, useState } from "react";
import { authAPI } from "../services/authAPI";

export default function RatingStation({ stationId, accountId, onClose, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [allRatings, setAllRatings] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [filterRating, setFilterRating] = useState(0); // 0 = all ratings

  const stars = useMemo(() => [1,2,3,4,5], []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stationId || !accountId) {
      setError("Thiếu StationId hoặc AccountId");
      return;
    }
    if (rating <= 0) {
      setError("Vui lòng chọn số sao");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await authAPI.addRating({
        rating1: rating,
        description: comment,
        stationId,
        accountId,
      });
      // Reload list for this station after submitting
      await loadRatings();
      onSuccess && onSuccess();
    } catch (err) {
      setError(err?.message || "Gửi đánh giá thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const loadRatings = React.useCallback(async () => {
    setLoadingList(true);
    try {
      const list = await authAPI.getAllRatings();
      const items = Array.isArray(list) ? list : [];
      const filtered = items.filter((r) =>
        (r.stationId && r.stationId === stationId) || (r.station?.stationId && r.station.stationId === stationId)
      );
      // Sort by newest date first
      filtered.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
      setAllRatings(filtered);
    } catch (e) {
      // silent
    } finally {
      setLoadingList(false);
    }
  }, [stationId]);

  React.useEffect(() => {
    loadRatings();
  }, [loadRatings]);

  // Filter ratings based on selected rating filter
  const resolveRatingStatus = React.useCallback((item) => {
    if (!item) return '';
    const candidates = [
      item.status,
      item.Status,
      item.ratingStatus,
      item.statusName,
    ];
    const raw = candidates.find((val) => typeof val === 'string' && val.trim());
    return raw ? raw.trim().toLowerCase() : '';
  }, []);

  const resolveAccountStatus = React.useCallback((item) => {
    if (!item) return '';
    const candidates = [
      item.account?.status,
      item.account?.Status,
      item.account?.statusAccount,
      item.account?.statusName,
      item.accountStatus,
      item.statusAccount,
    ];
    const raw = candidates.find((val) => typeof val === 'string' && val.trim());
    return raw ? raw.trim().toLowerCase() : '';
  }, []);

  const resolveAccountName = React.useCallback((item) => {
    const status = resolveAccountStatus(item);
    if (status === 'inactive') return 'deleted account';
    return item?.accountName || item?.account?.name || 'N/A';
  }, [resolveAccountStatus]);

  const filteredRatings = useMemo(() => {
    return allRatings.filter((r) => {
      // Hide ratings whose own status is Inactive
      if (resolveRatingStatus(r) === 'inactive') return false;
      if (resolveAccountStatus(r) === 'inactive') return false;
      if (filterRating === 0) return true;
      return Math.round(r.rating1 || 0) === filterRating;
    });
  }, [allRatings, filterRating, resolveAccountStatus, resolveRatingStatus]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ width: "100%", maxWidth: 480, background: "white", borderRadius: 12, boxShadow: "0 10px 30px rgba(0,0,0,0.2)", overflow: "hidden" }}>
        <div style={{ padding: 16, borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Đánh giá trạm</h3>
          <button onClick={onClose} style={{ border: "none", background: "transparent", fontSize: 18, cursor: "pointer" }}>✖</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: 16, borderBottom: "1px solid #e5e7eb" }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Chọn số sao</label>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {stars.map((s) => (
              <button
                key={s}
                type="button"
                onMouseEnter={() => setHover(s)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(s)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  background: (hover || rating) >= s ? "#fde68a" : "#f9fafb",
                  cursor: "pointer",
                  fontSize: 20,
                }}
                aria-label={`${s} sao`}
              >
                ⭐
              </button>
            ))}
          </div>

          <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Bình luận</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Viết cảm nhận của bạn về trạm..."
            rows={4}
            style={{ width: "100%", borderRadius: 8, border: "1px solid #e5e7eb", padding: 10, outline: "none", resize: "vertical", marginBottom: 12 }}
          />

          {error && <div style={{ color: "#b91c1c", marginBottom: 12 }}>❌ {error}</div>}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button type="button" onClick={onClose} style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#f9fafb", cursor: "pointer" }}>Hủy</button>
            <button type="submit" disabled={submitting} style={{ padding: "10px 16px", borderRadius: 8, border: "none", background: "#2563eb", color: "white", cursor: "pointer" }}>
              {submitting ? "Đang gửi..." : "Gửi đánh giá"}
            </button>
          </div>
        </form>
        <div style={{ padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <h4 style={{ margin: 0, fontWeight: 700 }}>Đánh giá của trạm</h4>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <select
                value={filterRating}
                onChange={(e) => setFilterRating(Number(e.target.value))}
                style={{
                  padding: "4px 8px",
                  borderRadius: 6,
                  border: "1px solid #e5e7eb",
                  fontSize: 12,
                  background: "white",
                  cursor: "pointer"
                }}
              >
                <option value={0}>Tất cả</option>
                <option value={1}>1 sao</option>
                <option value={2}>2 sao</option>
                <option value={3}>3 sao</option>
                <option value={4}>4 sao</option>
                <option value={5}>5 sao</option>
              </select>
              {loadingList && <span style={{ fontSize: 12, color: '#64748b' }}>Đang tải...</span>}
            </div>
          </div>
          <div style={{ maxHeight: 280, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 8 }}>
            {filteredRatings.length === 0 ? (
              <div style={{ padding: 12, color: '#64748b' }}>
                {filterRating === 0 ? 'Chưa có đánh giá cho trạm này' : `Chưa có đánh giá ${filterRating} sao cho trạm này`}
              </div>
            ) : (
              filteredRatings.map((r) => (
                <div key={r.ratingId} style={{ padding: 12, borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ fontWeight: 600 }}>
                      {"⭐".repeat(Math.round(r.rating1 || 0))}
                      <span style={{ marginLeft: 8, color: '#64748b', fontSize: 12 }}>Trạm: {r.stationName || r.station?.stationName || 'N/A'}</span>
                    </div>
                    <span style={{ color: '#94a3b8', fontSize: 12 }}>{new Date(r.startDate).toLocaleString()}</span>
                  </div>
                  <div style={{ color: '#1f2937' }}>{r.description}</div>
                  <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>By {resolveAccountName(r)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
