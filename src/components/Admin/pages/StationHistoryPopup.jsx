import React from "react";
import "./StationHistoryPopup.css";

const getBatteryLabel = (battery) => {
  if (!battery) return "-";
  return battery.batteryName || battery.batteryId || battery.id || "-";
};

const getVehicleLabel = (exchange) => {
  return exchange?.vin || exchange?.vehicleVin || exchange?.vehicleName || "-";
};

const formatDateTime = (value) => {
  if (!value) return "-";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return value;
  }
};

export default function StationHistoryPopup({
  isOpen,
  onClose,
  stationName,
  history = [],
  loading = false,
  error = null,
  onRefresh,
}) {
  if (!isOpen) return null;

  const safeHistory = Array.isArray(history) ? history : [];

  return (
    <div className="station-history-overlay">
      <div className="station-history-modal">
        <header className="station-history-header">
          <h3 className="station-history-title">
            Lịch sử đổi pin - {stationName || "Station"}
          </h3>
          <div className="station-history-actions">
            <button
              type="button"
              className="history-btn secondary"
              onClick={onRefresh}
              disabled={loading}
            >
              {loading ? "Đang tải..." : "Làm mới"}
            </button>
            <button
              type="button"
              className="history-btn danger"
              onClick={onClose}
            >
              Đóng
            </button>
          </div>
        </header>

        <div className="station-history-content">
          {error && (
            <div className="station-history-error">
              {error?.status === 204
                ? "Chưa có giao dịch đổi pin nào cho trạm này."
                : typeof error === "string"
                ? error
                : "Không thể tải lịch sử giao dịch."}
            </div>
          )}

          {!error && loading && (
            <div className="station-history-loading">Đang tải lịch sử giao dịch...</div>
          )}

          {!error && !loading && safeHistory.length === 0 && (
            <div className="station-history-empty">
              {error && error.status === 204
                ? "Trạm này chưa từng có giao dịch đổi pin (mã 204)."
                : "Chưa có giao dịch đổi pin nào cho trạm này."}
            </div>
          )}

          {!error && !loading && safeHistory.length > 0 && (
            <div className="station-history-list">
              {safeHistory.map((exchange) => (
                <article
                  key={exchange.exchangeBatteryId || exchange.id}
                  className="station-history-item"
                >
                  <div className="station-history-row top">
                    <div className="station-history-id">
                      <span className="label">Exchange ID</span>
                      <span className="value">
                        {exchange.exchangeBatteryId || exchange.id || "-"}
                      </span>
                    </div>
                    <span
                      className={`station-history-status ${
                        (exchange.status || "").toLowerCase()
                      }`}
                    >
                      {exchange.status || "Unknown"}
                    </span>
                  </div>

                  <div className="station-history-grid">
                    <div>
                      <span className="label">Xe / VIN</span>
                      <span className="value">{getVehicleLabel(exchange)}</span>
                    </div>
                    <div>
                      <span className="label">Order</span>
                      <span className="value">{exchange.orderId || "-"}</span>
                    </div>
                  </div>

                  <div className="station-history-grid batteries">
                    <div>
                      <span className="label">Pin cũ</span>
                      <span className="value">
                        {exchange.oldBatteryName ||
                          getBatteryLabel(exchange.oldBattery) ||
                          exchange.oldBatteryId ||
                          "-"}
                      </span>
                    </div>
                    <div>
                      <span className="label">Pin mới</span>
                      <span className="value">
                        {exchange.newBatteryName ||
                          getBatteryLabel(exchange.newBattery) ||
                          exchange.newBatteryId ||
                          "-"}
                      </span>
                    </div>
                  </div>

                  <div className="station-history-grid meta">
                    <div>
                      <span className="label">Ngày tạo</span>
                      <span className="value">
                        {formatDateTime(
                          exchange.startDate ||
                            exchange.startDate ||
                            exchange.createdAt
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="label">Ngày cập nhật</span>
                      <span className="value">
                        {formatDateTime(
                          exchange.updateDate ||
                            exchange.updatedDate ||
                            exchange.updatedAt
                        )}
                      </span>
                    </div>
                  </div>

                  {exchange.note && (
                    <div className="station-history-note">
                      <span className="label">Ghi chú</span>
                      <p>{exchange.notes}</p>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
