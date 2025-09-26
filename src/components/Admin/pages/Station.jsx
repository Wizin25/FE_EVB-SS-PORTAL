// Station.jsx
export default function StationPage() {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1e293b" }}>Quản lý trạm</h1>
      <p style={{ marginTop: 8, color: "#64748b" }}>
        Theo dõi lịch sử sử dụng &amp; trạng thái sức khỏe pin (SoH – State of Health).<br />
        Điều phối pin giữa các trạm.<br />
        Xử lý khiếu nại &amp; đổi pin lỗi.
      </p>
      <div
        style={{
          marginTop: 24,
          borderRadius: 12,
          border: "1px dashed #94a3b8",
          background: "#fff",
          minHeight: 240,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#94a3b8",
          fontSize: 18,
        }}
      >
        {/* TODO: Hiển thị bảng trạm, lịch sử pin, điều phối & khiếu nại ở đây */}
        Chức năng quản lý trạm sẽ được phát triển tại đây.
      </div>
    </div>
  );
}
