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
  const [sortOrder , setSortOrder] = useState("desc");
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
    setError("");
    setSubmitting(true);
    try {
      let ratingData = {
        rating1: rating,
        description: comment,
        stationId,
        accountId,
      };

      // Nếu có file ảnh thì upload, nếu không thì bỏ qua bước upload và KHÔNG gửi image field
      if (imageFile) {
        let secureUrl = "";
        const res = await authAPI.uploadToCloudinary(imageFile);
        if (res?.secureUrl) {
          secureUrl = res.secureUrl;
        } else if (res?.data?.secureUrl) {
          secureUrl = res.data.secureUrl;
        } else if (res?.url) {
          secureUrl = res.url;
        } else if (res?.data?.url) {
          secureUrl = res.data.url;
        }
        if (secureUrl) {
          ratingData.image = secureUrl;
        }
      }

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
        image: rating.image || rating.Image || rating.imageUrl || rating.ImageUrl || null,
      }));

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
    const filtered = allRatings.filter((r) => {
      if (resolveRatingStatus(r) === "inactive") return false;
      if (resolveAccountStatus(r) === "inactive") return false;
      if (filterRating === 0) return true;
      return Math.round(r.rating1 || 0) === filterRating;
    });

    // Sort by startDate based on sortOrder
    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.startDate || 0);
      const dateB = new Date(b.startDate || 0);
      if (sortOrder === "asc") {
        return dateA - dateB; // Oldest first
      } else {
        return dateB - dateA; // Newest first (desc)
      }
    });

    return sorted;
  }, [
    allRatings,
    filterRating,
    sortOrder,
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
      let updateData = {
        ratingId: editingId,
        rating1: editStars,
        description: editComment,
      };

      // Nếu user chọn ảnh mới -> upload
      if (editImageFile) {
        let secureUrl = "";
        const res = await authAPI.uploadToCloudinary(editImageFile);
        if (res?.secureUrl) {
          secureUrl = res.secureUrl;
        } else if (res?.data?.secureUrl) {
          secureUrl = res.data.secureUrl;
        } else if (res?.url) {
          secureUrl = res.url;
        } else if (res?.data?.url) {
          secureUrl = res.data.url;
        }
        if (secureUrl) {
          updateData.image = secureUrl;
        }
      } else if (editImagePreview) {
        updateData.image = editImagePreview;
      }
      // Nếu không có ảnh mới hoặc preview thì KHÔNG gửi image field.

      await authAPI.updateRating(updateData);

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
          maxWidth: 900,
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
        {/* WRAPPER: FORM - LIST SIDE BY SIDE */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: 0,
            alignItems: "stretch",
            minHeight: 450,
            position: "relative",
          }}
        >
          {/* FORM ADD */}
          <form
            onSubmit={handleSubmit}
            style={{
              flex: "0 0 360px",
              minWidth: 320,
              maxWidth: 400,
              borderRight: "1px solid #e5e7eb",
              padding: 16
            }}
          >
            {/* Trang trí form nhỏ gọn, xinh xinh kiểu card */}
            <div
              style={{
                background: "linear-gradient(135deg, #f4fff7 80%, #eafff7 100%)",
                borderRadius: 16,
                boxShadow: "0 2px 12px 0 rgba(36,164,92,0.10)",
                padding: "15px 0px",
                marginBottom: 6,
                position: "relative",
                minHeight: "400px",
                overflow: "hidden",
                maxWidth: 340,
                marginLeft: "auto",
                marginRight: "auto",
                display: "flex",
                flexWrap: "nowrap",
                flexDirection: "column",
               alignContent: "space-between",
               justifyContent: "space-evenly",
               alignItems: "stretch",
              }}
            >
              <label
                style={{
                  display: "block",
                  marginBottom: 6,
                  fontWeight: 700,
                  color: "#228c48",
                  letterSpacing: "0.03em",
                  fontSize: 12.5,
                }}
              >
                Chọn mức xếp hạng
              </label>
              <div
                style={{
                  display: "flex",
                  gap: 5,
                  marginBottom: 12,
                  padding: "2px 0",
                  justifyContent: "center",
                }}
              >
                {stars.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onMouseEnter={() => setHover(s)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => setRating(s)}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      border: (hover || rating) >= s ? "1.5px solid #58c885" : "1px solid #cceedd",
                      background:
                        (hover || rating) >= s
                          ? "radial-gradient(circle, #e8ffe7 65%, #6cf388 100%)"
                          : "#f4fff7",
                      cursor: "pointer",
                      fontSize: 15,
                      color: (hover || rating) >= s ? "#0ca249" : "#c6dabd",
                      boxShadow:
                        (hover || rating) >= s
                          ? "0 1px 4px 0 rgba(51,202,84,0.10)"
                          : "none",
                      transition: "all 0.13s cubic-bezier(.4,0,.2,1)",
                    }}
                    aria-label={`${s} sao`}
                  >
                    ⭐
                  </button>
                ))}
              </div>

              <label
                style={{
                  display: "block",
                  marginBottom: 5,
                  fontWeight: 600,
                  color: "#18780e",
                  fontSize: 12,
                }}
              >
                Bình luận
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Cảm nhận về trạm..."
                rows={2}
                style={{
                  width: "100%",
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  padding: 6,
                  outline: "none",
                  resize: "vertical",
                  marginBottom: 7,
                  fontSize: 12.5,
                  fontFamily:
                    "inherit, system-ui, 'Segoe UI', Arial, sans-serif",
                  background: "#f8fff8",
                  boxShadow: "0 1px 2px #dfffdd6c",
                  color: "#026d28",
                  maxHeight: "64px",
                }}
              />

              <div style={{ marginBottom: 10 }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: 6,
                    fontWeight: 600,
                    color: "#158f13",
                    fontSize: 12,
                  }}
                >
                  Hình ảnh
                </label>
                <input
                  type="file"
                  accept="image/*"
                  style={{
                    marginBottom: 4,
                    fontSize: 12,
                  }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    setImageFile(f || null);
                    setImagePreview("");
                    if (f) onPickImage(f, setImagePreview);
                  }}
                />
                {imagePreview && (
                  <div style={{ marginTop: 5, textAlign: "center" }}>
                    <img
                      src={imagePreview}
                      alt="preview"
                      style={{
                        maxWidth: "60px",
                        maxHeight: "45px",
                        borderRadius: 6,
                        border: "1px solid #a0ddb5",
                        boxShadow: "0 1px 5px #79eab72c",
                        objectFit: "cover",
                        display: "inline-block",
                      }}
                    />
                  </div>
                )}
              </div>

              {error && (
                <div
                  style={{
                    color: "#b91c1c",
                    marginBottom: 8,
                    fontWeight: 600,
                    padding: "6px 7px 6px 20px",
                    background: "#fff1f8",
                    borderRadius: 5.5,
                    boxShadow: "0 1.5px 5px 0 #ffd6ec48",
                    fontSize: 11.5,
                    borderLeft: "3.5px solid #e93d3d",
                    position: "relative",
                  }}
                >
                  <span style={{ position: "absolute", left: 7, top: 6, fontSize: 13 }}>
                    ❌
                  </span>
                  {error}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 7,
                  marginTop: 2,
                  alignItems: "center",
                }}
              >
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: "7px 12px",
                    borderRadius: 6,
                    border: "1px solid #e5e7eb",
                    background: "#f6fbf7",
                    color: "#145f28",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                    boxShadow: "0 .5px 2px #e0f3e0a2",
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: "7px 18px",
                    borderRadius: 6.5,
                    border: "none",
                    background: submitting
                      ? "linear-gradient(100deg, #87dfa7 10%, #89faad 80%)"
                      : "linear-gradient(94deg,#36d964 0%, #18ae53 100%)",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 13.5,
                    cursor: submitting ? "not-allowed" : "pointer",
                    boxShadow: "0 1.5px 4px #3ae47c27",
                    letterSpacing: ".01em",
                    textShadow: "0 1.5px 7px #18b86413",
                    minWidth: 68,
                  }}
                >
                  {submitting ? "Đang gửi..." : "Gửi đánh giá"}
                </button>
              </div>
            </div>
          </form>

          {/* LIST + FILTER */}
          <div
            style={{
              flex: 1,
              padding: 16,
              display: "flex",
              flexDirection: "column",
              minWidth: 320,
              maxWidth: 600,
            }}
          >
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
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  style={{
                    padding: "4px 8px",
                    borderRadius: 6,
                    border: "1px solid #e5e7eb",
                    fontSize: 12,
                    background: "white",
                    cursor: "pointer",
                  }}
                >
                  <option value="desc">Mới nhất</option>
                  <option value="asc">Cũ nhất</option>
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
                maxHeight: 370,
                overflowY: "auto",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                background: "#f9fafb",
                flex: 1,
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
                        background: showingEdit ? "#eef2ff" : undefined,
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
    </div>
  );
}
