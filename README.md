# 🔋 EV Battery Swap Station Management System  
**Phần mềm quản lý trạm đổi pin xe điện**  

## 📌 Giới thiệu  
Dự án **EV Battery Swap Station Management System** nhằm xây dựng một hệ thống quản lý toàn diện cho **trạm đổi pin xe điện**, hỗ trợ 3 nhóm đối tượng chính:  
- 🚗 **EV Driver (Tài xế xe điện)**  
- 🧑‍🔧 **BSS Staff (Nhân viên trạm đổi pin)**  
- 👨‍💼 **Admin (Quản trị hệ thống)**  

Hệ thống hướng đến việc:  
- Tối ưu trải nghiệm của tài xế khi đổi pin.  
- Hỗ trợ nhân viên trạm quản lý kho pin và giao dịch.  
- Cung cấp công cụ cho quản trị viên giám sát, phân tích và dự báo nhu cầu.  

---

## 👥 Đối tượng sử dụng & Chức năng chính  

### 🚗 1. EV Driver (Tài xế)  
- **Đăng ký & quản lý tài khoản**  
  - Đăng ký dịch vụ đổi pin.  
  - Liên kết phương tiện (VIN, loại pin).  
- **Đặt lịch & tra cứu trạm đổi pin**  
  - Tìm kiếm trạm gần nhất, tình trạng pin sẵn có.  
  - Đặt lịch trước để đảm bảo có pin đầy.  
- **Thanh toán & gói dịch vụ**  
  - Thanh toán theo lượt hoặc theo gói thuê pin.  
  - Quản lý hóa đơn, lịch sử giao dịch.  
  - Theo dõi số lần đổi pin & chi phí.  
- **Hỗ trợ & phản hồi**  
  - Gửi yêu cầu hỗ trợ khi gặp sự cố pin/trạm.  
  - Đánh giá dịch vụ.  

---

### 🧑‍🔧 2. BSS Staff (Nhân viên trạm đổi pin)  
- **Quản lý tồn kho pin**  
  - Theo dõi số lượng pin đầy, pin đang sạc, pin bảo dưỡng.  
  - Phân loại theo dung lượng, model, tình trạng.  
- **Quản lý giao dịch đổi pin**  
  - Xác nhận giao dịch đổi pin.  
  - Ghi nhận thanh toán tại chỗ.  
  - Kiểm tra & ghi nhận tình trạng pin trả về.  

---

### 👨‍💼 3. Admin (Quản trị)  
- **Quản lý trạm**  
  - Theo dõi lịch sử sử dụng & trạng thái sức khỏe pin (SoH – State of Health).  
  - Điều phối pin giữa các trạm.  
  - Xử lý khiếu nại & đổi pin lỗi.  
- **Quản lý người dùng & gói thuê**  
  - Quản lý khách hàng.  
  - Tạo & quản lý gói thuê pin.  
  - Phân quyền nhân viên.  
- **Báo cáo & thống kê**  
  - Doanh thu, số lượt đổi pin.  
  - Báo cáo tần suất đổi pin, giờ cao điểm.  
  - AI dự báo nhu cầu sử dụng để nâng cấp hạ tầng.  

---

## 🛠️ Công nghệ sử dụng (gợi ý)  
- **Frontend:** ReactJS  
- **Backend:** ASP.NET Core  
- **Database:** SQL Server

---

## 🚀 Hướng phát triển  
- Tích hợp bản đồ tìm kiếm trạm (Google Maps API).  
- Cảnh báo pin lỗi/thấp SoH theo thời gian thực.  
- Gợi ý trạm tối ưu theo hành trình lái xe.  
- Tích hợp ví điện tử (VNPay, Momo, ZaloPay).  

---

## 📄 Giấy phép  
Dự án được phát triển với mục đích học tập và nghiên cứu.  
Có thể mở rộng thành **giải pháp thương mại** trong lĩnh vực năng lượng xanh & xe điện.  

---

## ✨ Tác giả  
👤 **[Phan Tan Phu]**  
📧 Liên hệ: [phantanphu2505@gmail.com]  
