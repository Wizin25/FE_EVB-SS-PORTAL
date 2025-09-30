import React, { useEffect, useState } from "react";
//import authAPI from "../../services/authAPI"; // Sử dụng authAPI vì batteryAPI chưa có, và các API khác đều ở đây
import "../pages/Station.css"; // Dùng chung style với Station

export default function BatteryManagementPage() {
   const [batteries, setBatteries] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState("");
   const [search, setSearch] = useState("");

  // useEffect(() => {
  //   let ignore = false;
  //   setLoading(true);
  //   setError("");
  //   // Giả sử API battery nằm trong authAPI, nếu có batteryAPI riêng thì đổi lại
  //   if (typeof authAPI.getAllBatteries === "function") {
  //     authAPI
  //       .getAllBatteries()
  //       .then((data) => {
  //         if (!ignore) {
  //           setBatteries(data || []);
  //           setLoading(false);
  //         }
  //       })
  //       .catch((err) => {
  //         setError(
  //           err?.message ||
  //             err?.response?.data?.message ||
  //             "Lỗi khi tải danh sách pin"
  //         );
  //         setLoading(false);
  //       });
  //   } else {
  //     setError("API lấy danh sách pin chưa được cài đặt.");
  //     setLoading(false);
  //   }
  //   return () => {
  //     ignore = true;
  //   };
  // }, []);

  // const filteredBatteries = batteries.filter(
  //   (b) =>
  //     b.batteryId?.toString().includes(search) ||
  //     b.status?.toLowerCase().includes(search.toLowerCase()) ||
  //     b.quality?.toLowerCase().includes(search.toLowerCase())
  // );

  return (
    <div className="station-container">
      <h1 className="station-title">Quản lý pin</h1>
      <div className="station-controls" style={{ marginBottom: 18 }}>
        <input
          className="station-search"
          placeholder="Tìm kiếm theo mã pin, trạng thái, chất lượng..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {loading ? (
        <div className="station-loading">Đang tải danh sách pin...</div>
      ) : error ? (
        <div className="station-error">{error}</div>
      ) : (
        <div className="batt-list">
          {filteredBatteries.length === 0 ? (
            <div className="empty-note">Không có pin nào phù hợp.</div>
          ) : (
            filteredBatteries.map((batt) => (
              <div className="batt-item" key={batt.batteryId}>
                <div className="batt-left">
                  <div className="batt-id">Mã pin: {batt.batteryId}</div>
                  <div className="batt-meta">
                    {batt.stationName
                      ? `Trạm: ${batt.stationName}`
                      : "Chưa gán trạm"}
                  </div>
                </div>
                <div className="batt-right">
                  <div className="batt-stats">
                    <div className="batt-quality">
                      Chất lượng:{" "}
                      <span style={{ fontWeight: 700 }}>
                        {batt.quality || "Không rõ"}
                      </span>
                    </div>
                    <div
                      className={
                        "batt-status " +
                        (batt.status === "OK"
                          ? "ok"
                          : batt.status === "Warning"
                          ? "warn"
                          : "")
                      }
                    >
                      {batt.status || "Không rõ"}
                    </div>
                  </div>
                  <div className="batt-times">
                    {batt.lastUsed
                      ? `Lần sử dụng gần nhất: ${new Date(
                          batt.lastUsed
                        ).toLocaleString()}`
                      : "Chưa sử dụng"}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
