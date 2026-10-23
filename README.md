# Homeroom 360° - Hệ Thống Quản Lý Lớp Chủ Nhiệm Thông Minh

Dự án được xây dựng và hiện thực hóa chính xác theo sơ đồ kiến trúc hệ thống **"Luồng Hoạt Động Mới"** (Tác giả: *Nết Trình • AI Architecture Studio*, xuất bản: 05/10/2026, `homeroom.alphacap.vn`).

---

## 🏛️ Kiến Trúc Hệ Thống (4 Tầng Độc Lập)

Hệ thống được thiết kế chuẩn mực theo mô hình phân tầng trong sơ đồ:

### 1. Tầng Giao Diện (Frontend)
- **Dashboard GVCN (Toàn quyền Quản lý)**:
  - Sơ đồ phòng học tương tác dạng bàn đôi (5 hàng x 6 cột) với kéo thả đổi chỗ trực quan.
  - Thuật toán AI tự động sắp xếp chỗ ngồi: *Thị lực & Chiều cao*, *Đôi bạn cùng tiến*, *Cân bằng nề nếp*.
  - Điểm danh học sinh chuyên cần (Có mặt, Muộn, Có phép, Không phép).
  - Hồ sơ học sinh 360° đa chiều (học lực, hạnh kiểm, sức khỏe, chỗ ngồi).
  - Quản lý nề nếp & thi đua (Gamified Point System).
- **Cổng Phụ Huynh & Học Sinh**:
  - Tra cứu kết quả rèn luyện, chuyên cần, vị trí chỗ ngồi của con trong lớp.
  - Sổ điểm điện tử và nhận xét sư phạm từ GVCN & AI.
  - Gửi đơn xin phép nghỉ học trực tuyến tới GVCN và theo dõi phản hồi thời gian thực.
- **Cổng Cán Sự Lớp (Hỗ trợ Điểm danh & Nề nếp)**:
  - Giao diện 1-chạm tối ưu cho thiết bị di động / máy tính bảng.
  - Điểm danh nhanh đầu giờ tiết 1.
  - Ghi nhận nề nếp thi đua cờ đỏ (cộng điểm phát biểu, điểm 10; trừ điểm đi muộn, mất trật tự).

### 2. Tầng Bảo Mật & Middleware
- **API Gateway & RBAC Auth Guard**:
  - Xác thực người dùng và phân quyền RBAC (Role-Based Access Control) chặt chẽ giữa 3 vai trò: `teacher`, `monitor`, `parent_student`.
  - Header inspection (`X-User-Role`, `X-Student-Id`), kiểm soát quyền đọc/ghi từng endpoint.
  - Ghi nhật ký Gateway Audit Log thời gian thực.

### 3. Tầng Nghiệp Vụ (Backend API)
- **Profile & Smart SeatMap Controller**: Quản lý hồ sơ 360° học sinh, tọa độ ma trận lớp học và các thuật toán gợi ý chỗ ngồi tối ưu.
- **Attendance & Gamified Point Controller**: Xử lý điểm danh chuyên cần theo buổi/tiết, tính lũy điểm thi đua (+/-) và tự động thăng hạng danh hiệu huy hiệu.
- **Academic & Conduct Controller**: Phân tích phổ điểm, tính toán GPA, phát hiện sớm và kích hoạt cảnh báo sút giảm học lực (At-risk students).
- **AI Report Writer Engine**: Phân tích dữ liệu học lực 5 môn, điểm nề nếp và thái độ học tập để tự động sinh nhận xét học sinh chuẩn văn phong sư phạm theo 4 sắc thái (*Xây dựng, Động viên, Nghiêm khắc, Khen ngợi*).
- **Parent Communication Worker**: Worker tự động phát thông báo đa kênh (Zalo OA, SMS Gateway, Cổng phụ huynh) khi học sinh vắng không phép hoặc định kỳ phát báo cáo tuần.

### 4. Tầng Cơ Sở Dữ Liệu (Database)
- **Main Homeroom DB**: Hỗ trợ linh hoạt cả **Supabase Cloud (PostgreSQL)** lẫn **SQLite (Cục bộ)** với 8 bảng dữ liệu quan hệ:
  - `users`: Tài khoản và vai trò RBAC (`teacher`, `monitor`, `parent_student`).
  - `students`: Hồ sơ 30 học sinh lớp 12A1 & vị trí ma trận chỗ ngồi.
  - `attendance_logs`: Lịch sử điểm danh chuyên cần theo buổi/tiết.
  - `gamified_points_logs`: Nhật ký cộng/trừ điểm thi đua.
  - `academic_grades`: Bảng điểm chi tiết 5 môn học chính (Toán, Văn, Anh, Lý, Hóa).
  - `ai_reports`: Bản nhận xét sư phạm tự động do AI sinh ra.
  - `parent_communications`: Lịch sử thông báo gửi tới phụ huynh (Zalo OA, SMS Gateway, Cổng phụ huynh).
  - `absence_requests`: Đơn xin phép nghỉ học trực tuyến.
- **Tích hợp Supabase Cloud**:
  - Hỗ trợ kết nối qua chuỗi kết nối PostgreSQL URI (`DATABASE_URL`) và `supabase-py` SDK.
  - Cung cấp sẵn file [**`supabase_schema.sql`**](./supabase_schema.sql) để khởi tạo toàn bộ schema và dữ liệu mẫu chỉ với 1 click trong Supabase SQL Editor.
  - Cấu hình dễ dàng thông qua file [**`.env`**](./.env.example). Tự động fallback sang SQLite nếu chưa cấu hình Cloud.

---

## 🚀 Hướng Dẫn Chạy Website

### Cách 1: Chạy nhanh bằng file `run.bat` (Khuyên Dùng Trên Windows)
- Nhấp đúp chuột vào file `run.bat` trong thư mục dự án. Hệ thống sẽ tự động khởi động server và mở trình duyệt web.

### Cách 2: Chạy bằng dòng lệnh Terminal / PowerShell
```powershell
# Chuyển vào thư mục dự án
cd "d:\Tạo web"

# Khởi chạy server FastAPI với Uvicorn
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Sau khi chạy, mở trình duyệt và truy cập:
- **Giao diện Website**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Tài liệu API Swagger**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## 💡 Hướng Dẫn Trải Nghiệm Các Tính Năng Chính

1. **Khám phá Sơ Đồ Kiến Trúc (Architecture Flow)**:
   - Ngay tại trang đầu, nhấn vào từng khối trong sơ đồ (Frontend, Security, Controllers, Database) để xem thông tin chi tiết, endpoint API, chỉ số hoạt động thời gian thực và chuyển nhanh tới phân hệ tương ứng.
2. **Thử nghiệm Đổi Vai Trò RBAC (Role Switcher)**:
   - Tại thanh điều hướng trên cùng, chuyển đổi giữa:
     - 👑 **GVCN (Cô Mai Anh)**: Có quyền kéo thả sơ đồ lớp, chấm điểm danh, cộng/trừ điểm, duyệt đơn nghỉ học, sinh nhận xét AI.
     - ⭐ **Cán sự lớp (Lớp trưởng Huy)**: Mở Cổng Cán Sự Lớp để điểm danh 1-chạm và ghi sổ cờ đỏ.
     - 👨‍👩‍👧 **Cổng Phụ huynh (Bác Nam)**: Tra cứu kết quả của con, xem nhận xét của GVCN và nộp đơn xin nghỉ học trực tuyến.
3. **Thử nghiệm Thuật Toán AI Xếp Chỗ Ngồi**:
   - Nhấn vào tab **"Sơ Đồ Chỗ Ngồi Thông Minh"**, bấm vào các nút *"Thị lực & Chiều cao"* hoặc *"Đôi bạn cùng tiến"* để xem thuật toán tự động tính toán và di chuyển học sinh.
   - Bấm vào bất kỳ bạn học sinh nào để mở **Hồ sơ 360°**.
4. **Thử nghiệm AI Report Writer Engine**:
   - Nhấn tab **"AI Report Writer"**, bấm *"Sinh Nhận Xét Cho Toàn Bộ 30 Học Sinh (1-Click)"* để động cơ AI tự động quét dữ liệu và tạo báo cáo sư phạm hoàn chỉnh.
