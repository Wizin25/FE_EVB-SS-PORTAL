import React, { useMemo, useState } from "react";
import { authAPI } from "../services/authAPI";

export default function RatingStation({ stationId, accountId, onClose, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [allRatings, setAllRatings] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [filterRating, setFilterRating] = useState(0); // 0 = all ratings

  // Edit state cho rating của chính user
  const [editingId, setEditingId] = useState(null);
  const [editStars, setEditStars] = useState(0);
  const [editComment, setEditComment] = useState("");
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState("");
  const [editing, setEditing] = useState(false);

  const stars = useMemo(() => [1, 2, 3, 4, 5], []);

  const onPickImage = (file, setPreview) => {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
  };

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
    if (!imageFile) {
      setError("Vui lòng chọn hình ảnh (bắt buộc)");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      // 1) Upload ảnh lên Cloudinary (nhận về { secureUrl })
      // Chưa chắc BE trả về secureUrl trực tiếp, phải kiểm tra kỹ response
      const res = await authAPI.uploadToCloudinary(imageFile);
      // Có thể là res.data hoặc res.data.data, hoặc res.secureUrl, hoặc res.url tuỳ BE
      // Ưu tiên lấy secureUrl, fallback sang url, hoặc nested
      let secureUrl = "";
      if (res?.secureUrl) {
        secureUrl = res.secureUrl;
      } else if (res?.data?.secureUrl) {
        secureUrl = res.data.secureUrl;
      } else if (res?.url) {
        secureUrl = res.url;
      } else if (res?.data?.url) {
        secureUrl = res.data.url;
      }
      // console.log('secureUrl from Cloudinary upload:', secureUrl, res);

      // 2) Gửi addRating kèm secureUrl vào 'image'
      const ratingData = {
        rating1: rating,
        description: comment,
        stationId,
        accountId,
        image: secureUrl || url,         // <-- DÙNG secureUrl, KHÔNG dùng uploadResponse.*
      };

      // console.log('Fields being passed to addRating API:', ratingData);

      await authAPI.addRating(ratingData);

      // Reload list
      await loadRatings();
      onSuccess && onSuccess();

      // Reset form
      setRating(0);
      setHover(0);
      setComment("");
      setImageFile(null);
      setImagePreview("");
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
      const filtered = items.filter(
        (r) =>
          (r.stationId && r.stationId === stationId) ||
          (r.station?.stationId && r.station.stationId === stationId)
      );

      // Đảm bảo mỗi rating có trường image được xử lý đúng
      const processedRatings = filtered.map((rating) => ({
        ...rating,
        // Đảm bảo image field được normalize
        image: rating.image || rating.Image || rating.imageUrl || rating.ImageUrl || null,
      }));

      processedRatings.sort(
        (a, b) => new Date(b.startDate) - new Date(a.startDate)
      );
      setAllRatings(processedRatings);
    } catch (e) {
      console.error("Error loading ratings:", e);
      // silent
    } finally {
      setLoadingList(false);
    }
  }, [stationId]);

  React.useEffect(() => {
    loadRatings();
  }, [loadRatings]);

  const resolveRatingStatus = React.useCallback((item) => {
    if (!item) return "";
    const candidates = [
      item.status,
      item.Status,
      item.ratingStatus,
      item.statusName,
    ];
    const raw = candidates.find(
      (val) => typeof val === "string" && val.trim()
    );
    return raw ? raw.trim().toLowerCase() : "";
  }, []);

  const resolveAccountStatus = React.useCallback((item) => {
    if (!item) return "";
    const candidates = [
      item.account?.status,
      item.account?.Status,
      item.account?.statusAccount,
      item.account?.statusName,
      item.accountStatus,
      item.statusAccount,
    ];
    const raw = candidates.find(
      (val) => typeof val === "string" && val.trim()
    );
    return raw ? raw.trim().toLowerCase() : "";
  }, []);

  const resolveAccountName = React.useCallback(
    (item) => {
      const status = resolveAccountStatus(item);
      if (status === "inactive") return "deleted account";
      return item?.accountName || item?.account?.name || "N/A";
    },
    [resolveAccountStatus]
  );

  const filteredRatings = useMemo(() => {
    return allRatings.filter((r) => {
      if (resolveRatingStatus(r) === "inactive") return false;
      if (resolveAccountStatus(r) === "inactive") return false;
      if (filterRating === 0) return true;
      return Math.round(r.rating1 || 0) === filterRating;
    });
  }, [
    allRatings,
    filterRating,
    resolveAccountStatus,
    resolveRatingStatus,
  ]);

  // ====== EDIT / DELETE hành động cho chính user ======
  const beginEdit = (r) => {
    setEditingId(r.ratingId);
    setEditStars(Math.round(r.rating1 || 0));
    setEditComment(r.description || "");
    setEditImageFile(null);
    setEditImagePreview(r.image || r.Image || ""); // nếu BE trả image url
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditingId(null);
    setEditStars(0);
    setEditComment("");
    setEditImageFile(null);
    setEditImagePreview("");
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      setSubmitting(true);
      let imageUrl = editImagePreview || "";

      // Nếu user chọn ảnh mới -> upload
      if (editImageFile) {
        const { secureUrl } = await authAPI.uploadToCloudinary(editImageFile);
        imageUrl = secureUrl;
      }

      await authAPI.updateRating({
        ratingId: editingId,
        rating1: editStars,
        description: editComment,
        image: imageUrl || null,
      });

      await loadRatings();
      cancelEdit();
    } catch (err) {
      setError(err?.message || "Cập nhật đánh giá thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (ratingId) => {
    if (!ratingId) return;
    if (!window.confirm("Xoá đánh giá này?")) return;
    try {
      setSubmitting(true);
      await authAPI.deleteRatingForCustomerByRatingId({
        ratingId,
        accountId,
      });
      await loadRatings();
    } catch (err) {
      setError(err?.message || "Xoá đánh giá thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          background: "white",
          borderRadius: 12,
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: 16,
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
            Đánh giá trạm
          </h3>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              fontSize: 18,
              cursor: "pointer",
            }}
          >
            ✖
          </button>
        </div>

        {/* FORM ADD */}
        <form
          onSubmit={handleSubmit}
          style={{ padding: 16, borderBottom: "1px solid #e5e7eb" }}
        >
          <label
            style={{ display: "block", marginBottom: 8, fontWeight: 600 }}
          >
            Chọn số sao
          </label>
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

          <label
            style={{ display: "block", marginBottom: 8, fontWeight: 600 }}
          >
            Bình luận
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Viết cảm nhận của bạn về trạm..."
            rows={4}
            style={{
              width: "100%",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              padding: 10,
              outline: "none",
              resize: "vertical",
              marginBottom: 12,
              overflowY: "auto",
              maxHeight: "120px",
            }}
          />

          <div style={{ marginBottom: 12 }}>
            <label
              style={{ display: "block", marginBottom: 8, fontWeight: 600 }}
            >
              Hình ảnh (bắt buộc)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                setImageFile(f || null);
                setImagePreview("");
                if (f) onPickImage(f, setImagePreview);
              }}
            />
            {imagePreview && (
              <div style={{ marginTop: 8 }}>
                <img
                  src={imagePreview}
                  alt="preview"
                  style={{
                    maxWidth: "100%",
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                  }}
                />
              </div>
            )}
          </div>

          {error && (
            <div style={{ color: "#b91c1c", marginBottom: 12 }}>
              ❌ {error}
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "10px 16px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                background: "#f9fafb",
                cursor: "pointer",
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "10px 16px",
                borderRadius: 8,
                border: "none",
                background: "#2563eb",
                color: "white",
                cursor: "pointer",
              }}
            >
              {submitting ? "Đang gửi..." : "Gửi đánh giá"}
            </button>
          </div>
        </form>

        {/* LIST + FILTER */}
        <div style={{ padding: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
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
                  cursor: "pointer",
                }}
              >
                <option value={0}>Tất cả</option>
                <option value={1}>1 sao</option>
                <option value={2}>2 sao</option>
                <option value={3}>3 sao</option>
                <option value={4}>4 sao</option>
                <option value={5}>5 sao</option>
              </select>
              {loadingList && (
                <span style={{ fontSize: 12, color: "#64748b" }}>
                  Đang tải...
                </span>
              )}
            </div>
          </div>

          <div
            style={{
              maxHeight: 320,
              overflowY: "auto",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
            }}
          >
            {filteredRatings.length === 0 ? (
              <div style={{ padding: 12, color: "#64748b" }}>
                {filterRating === 0
                  ? "Chưa có đánh giá cho trạm này"
                  : `Chưa có đánh giá ${filterRating} sao cho trạm này`}
              </div>
            ) : (
              filteredRatings.map((r) => {
                const isMine =
                  r.accountId === accountId ||
                  r.account?.accountId === accountId ||
                  r.accountID === accountId;

                const showingEdit = editing && editingId === r.ratingId;

                return (
                  <div
                    key={r.ratingId}
                    style={{
                      padding: 12,
                      borderBottom: "1px solid #f1f5f9",
                    }}
                  >
                    {!showingEdit ? (
                      <>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: 6,
                          }}
                        >
                          <div style={{ fontWeight: 600 }}>
                            {"⭐".repeat(Math.round(r.rating1 || 0))}
                            <span
                              style={{
                                marginLeft: 8,
                                color: "#64748b",
                                fontSize: 12,
                              }}
                            >
                              Trạm:{" "}
                              {r.stationName ||
                                r.station?.stationName ||
                                "N/A"}
                            </span>
                          </div>
                          <span
                            style={{ color: "#94a3b8", fontSize: 12 }}
                          >
                            {r.startDate
                              ? new Date(r.startDate).toLocaleString()
                              : ""}
                          </span>
                        </div>

                        {/* Hiển thị hình ảnh của rating */}
                        {(r.image ||
                          r.Image ||
                          r.imageUrl ||
                          r.ImageUrl) && (
                          <div style={{ marginBottom: 8 }}>
                            <img
                              src={
                                r.image ||
                                r.Image ||
                                r.imageUrl ||
                                r.ImageUrl
                              }
                              alt="Hình ảnh đánh giá"
                              style={{
                                maxWidth: "100%",
                                maxHeight: "200px",
                                borderRadius: 8,
                                border: "1px solid #e5e7eb",
                                objectFit: "cover",
                                display: "block",
                              }}
                              onError={(e) => {
                                e.target.style.display = "none";
                                // console.log('Failed to load image:', r.image || r.Image || r.imageUrl || r.ImageUrl);
                              }}
                              onLoad={(e) => {
                                e.target.style.display = "block";
                              }}
                            />
                          </div>
                        )}

                        <div
                          style={{
                            color: "#1f2937",
                            maxHeight: "80px",
                            overflowY: "auto",
                            wordWrap: "break-word",
                          }}
                        >
                          {r.description}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginTop: 6,
                          }}
                        >
                          <div
                            style={{ color: "#64748b", fontSize: 12 }}
                          >
                            By {resolveAccountName(r)}
                          </div>
                          {isMine && (
                            <div style={{ display: "flex", gap: 8 }}>
                              <button
                                type="button"
                                onClick={() => beginEdit(r)}
                                style={{
                                  fontSize: 12,
                                  padding: "6px 10px",
                                  borderRadius: 6,
                                  border: "1px solid #e5e7eb",
                                  background: "#f9fafb",
                                  cursor: "pointer",
                                }}
                              >
                                Sửa
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(r.ratingId)}
                                style={{
                                  fontSize: 12,
                                  padding: "6px 10px",
                                  borderRadius: 6,
                                  border: "1px solid #fee2e2",
                                  background: "#fef2f2",
                                  color: "#b91c1c",
                                  cursor: "pointer",
                                }}
                                disabled={submitting}
                              >
                                Xoá
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        {/* EDIT UI */}
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            marginBottom: 8,
                          }}
                        >
                          {stars.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setEditStars(s)}
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 6,
                                border: "1px solid #e5e7eb",
                                background:
                                  editStars >= s ? "#fde68a" : "#f9fafb",
                                cursor: "pointer",
                                fontSize: 18,
                              }}
                              aria-label={`edit ${s} sao`}
                            >
                              ⭐
                            </button>
                          ))}
                        </div>
                        <textarea
                          rows={3}
                          value={editComment}
                          onChange={(e) =>
                            setEditComment(e.target.value)
                          }
                          placeholder="Cập nhật bình luận..."
                          style={{
                            width: "100%",
                            borderRadius: 8,
                            border: "1px solid #e5e7eb",
                            padding: 10,
                            outline: "none",
                            resize: "vertical",
                            marginBottom: 8,
                            overflowY: "auto",
                            maxHeight: "100px",
                          }}
                        />

                        <div style={{ marginBottom: 8 }}>
                          <label
                            style={{
                              display: "block",
                              marginBottom: 6,
                              fontWeight: 600,
                            }}
                          >
                            Cập nhật hình ảnh (không bắt buộc)
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              setEditImageFile(f || null);
                              if (f) {
                                setEditImagePreview(
                                  URL.createObjectURL(f)
                                );
                              }
                            }}
                          />
                          {(editImagePreview || r.image || r.Image) && (
                            <div style={{ marginTop: 8 }}>
                              <img
                                src={
                                  editImagePreview ||
                                  r.image ||
                                  r.Image
                                }
                                alt="edit-preview"
                                style={{
                                  maxWidth: "100%",
                                  borderRadius: 8,
                                  border: "1px solid #e5e7eb",
                                }}
                              />
                            </div>
                          )}
                        </div>

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: 8,
                          }}
                        >
                          <button
                            type="button"
                            onClick={cancelEdit}
                            style={{
                              fontSize: 12,
                              padding: "8px 12px",
                              borderRadius: 6,
                              border: "1px solid #e5e7eb",
                              background: "#f9fafb",
                              cursor: "pointer",
                            }}
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            onClick={saveEdit}
                            disabled={submitting}
                            style={{
                              fontSize: 12,
                              padding: "8px 12px",
                              borderRadius: 6,
                              border: "none",
                              background: "#2563eb",
                              color: "white",
                              cursor: "pointer",
                            }}
                          >
                            {submitting ? "Đang lưu..." : "Lưu"}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
