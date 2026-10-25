-- ==============================================================================
-- HOMEROOM 360° - FILE KHỞI TẠO CƠ SỞ DỮ LIỆU SUPABASE POSTGRESQL
-- Tác giả: Nết Trình • AI Architecture Studio
-- Hệ thống: Quản lý lớp chủ nhiệm thông minh 4 tầng kiến trúc
-- Hướng dẫn: Đăng nhập Supabase -> Chọn Project -> SQL Editor -> Dán toàn bộ file này -> Nhấn RUN
-- ==============================================================================

-- 1. XÓA BẢNG CŨ (Nếu muốn cài đặt lại từ đầu sạch sẽ)
DROP TABLE IF EXISTS absence_requests CASCADE;
DROP TABLE IF EXISTS parent_communications CASCADE;
DROP TABLE IF EXISTS ai_reports CASCADE;
DROP TABLE IF EXISTS academic_grades CASCADE;
DROP TABLE IF EXISTS gamified_points_logs CASCADE;
DROP TABLE IF EXISTS attendance_logs CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ==============================================================================
-- 2. TẠO CẤU TRÚC 8 BẢNG DỮ LIỆU CHUẨN POSTGRESQL (SUPABASE)
-- ==============================================================================

-- 1. Bảng users (Phân quyền 3 vai trò: teacher, monitor, parent_student)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL,
    student_id INTEGER,
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tự động thêm cột password_hash nếu bảng đã tồn tại từ trước
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- 2. Bảng students (Hồ sơ học sinh 360° & Tọa độ ma trận chỗ ngồi)
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    student_code TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    gender TEXT NOT NULL,
    dob TEXT,
    height_cm INTEGER DEFAULT 160,
    has_glasses INTEGER DEFAULT 0,
    seat_row INTEGER DEFAULT 1,
    seat_col INTEGER DEFAULT 1,
    conduct TEXT DEFAULT 'Tốt',
    academic_rank TEXT DEFAULT 'Giỏi',
    gpa REAL DEFAULT 8.0,
    gamified_points INTEGER DEFAULT 100,
    badge TEXT DEFAULT 'Học Sinh Tiêu Biểu',
    parent_name TEXT,
    parent_phone TEXT,
    parent_email TEXT,
    avatar TEXT,
    health_notes TEXT,
    teacher_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bảng attendance_logs (Nhật ký điểm danh chuyên cần)
CREATE TABLE attendance_logs (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    session TEXT NOT NULL,
    status TEXT NOT NULL,
    note TEXT,
    recorded_by TEXT DEFAULT 'teacher',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Bảng gamified_points_logs (Điểm thi đua nề nếp)
CREATE TABLE gamified_points_logs (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    reason TEXT NOT NULL,
    category TEXT DEFAULT 'nề nếp',
    recorded_by TEXT DEFAULT 'monitor',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Bảng academic_grades (Bảng điểm 5 môn học chính)
CREATE TABLE academic_grades (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    tx1 REAL,
    tx2 REAL,
    gk REAL,
    ck REAL,
    average REAL,
    trend TEXT DEFAULT 'stable',
    warning_flag INTEGER DEFAULT 0
);

-- 6. Bảng ai_reports (Nhận xét tự động từ AI Report Writer)
CREATE TABLE ai_reports (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    term TEXT NOT NULL,
    tone TEXT DEFAULT 'constructive',
    generated_text TEXT NOT NULL,
    strengths TEXT,
    areas_for_improvement TEXT,
    action_plan TEXT,
    approved_by_teacher INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Bảng parent_communications (Nhật ký gửi thông báo phụ huynh)
CREATE TABLE parent_communications (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    channel TEXT NOT NULL,
    recipient TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'Đã gửi',
    trigger_type TEXT DEFAULT 'Hệ thống',
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Bảng absence_requests (Đơn xin nghỉ học trực tuyến)
CREATE TABLE absence_requests (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    parent_name TEXT NOT NULL,
    from_date TEXT NOT NULL,
    to_date TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    teacher_reply TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chỉ mục (Indexes)
CREATE INDEX IF NOT EXISTS idx_students_code ON students(student_code);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_logs(date);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_student ON academic_grades(student_id);

-- Vô hiệu hóa RLS để backend API và Supabase REST truy cập trực tiếp
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE gamified_points_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE academic_grades DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE parent_communications DISABLE ROW LEVEL SECURITY;
ALTER TABLE absence_requests DISABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 3. CHÈN DỮ LIỆU BAN ĐẦU (SEED DATA)
-- ==============================================================================

-- Dữ liệu bảng users (4 bản ghi - mật khẩu mặc định: 123456)
INSERT INTO users (id, username, password_hash, full_name, role, student_id, avatar, created_at) VALUES
(1, 'gvcn_maianh', '515e1a2e18299c8fdb10ab4de52bd4a5:565791ad8880f57b0302ad89a6315cd8b4d4911b61b6856d752d89d66caa95e5', 'Cô Hoàng Mai Anh', 'teacher', NULL, 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80', '2026-10-05 09:45:29'),
(2, 'lt_duchuy', '515e1a2e18299c8fdb10ab4de52bd4a5:565791ad8880f57b0302ad89a6315cd8b4d4911b61b6856d752d89d66caa95e5', 'Nguyễn Đức Huy (Lớp Trưởng)', 'monitor', 1, 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80', '2026-10-05 09:45:29'),
(3, 'ph_baongoc', '515e1a2e18299c8fdb10ab4de52bd4a5:565791ad8880f57b0302ad89a6315cd8b4d4911b61b6856d752d89d66caa95e5', 'Trần Văn Nam (PH em Bảo Ngọc)', 'parent_student', 2, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', '2026-10-05 09:45:29'),
(4, 'ph_minhtri', '515e1a2e18299c8fdb10ab4de52bd4a5:565791ad8880f57b0302ad89a6315cd8b4d4911b61b6856d752d89d66caa95e5', 'Lê Thị Thảo (PH em Minh Trí)', 'parent_student', 6, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', '2026-10-05 09:45:29');

-- Dữ liệu bảng students (30 bản ghi)
INSERT INTO students (id, student_code, full_name, gender, dob, height_cm, has_glasses, seat_row, seat_col, conduct, academic_rank, gpa, gamified_points, badge, parent_name, parent_phone, parent_email, avatar, health_notes, teacher_notes, created_at) VALUES
(1, 'HS1201', 'Nguyễn Đức Huy', 'Nam', '2008-04-12', 175, 0, 1, 1, 'Tốt', 'Xuất sắc', 9.4, 210, 'Lớp Trưởng Gương Mẫu', 'Nguyễn Văn Hùng', '0912345678', 'nguyenhung@gmail.com', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80', 'Sức khỏe tốt, năng động', 'Lớp trưởng gương mẫu, có uy tín cao.', '2026-10-05 09:45:29'),
(2, 'HS1202', 'Trần Bảo Ngọc', 'Nữ', '2008-09-20', 158, 1, 1, 5, 'Tốt', 'Xuất sắc', 9.2, 195, 'Sao Chăm Ngoan', 'Trần Văn Nam', '0987654321', 'namtran@gmail.com', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', 'Cận thị 2.5 độ, cần ngồi gần bảng', 'Lớp phó học tập, học đều các môn.', '2026-10-05 09:45:29'),
(3, 'HS1203', 'Lê Hoàng Long', 'Nam', '2008-01-15', 168, 1, 4, 3, 'Tốt', 'Giỏi', 8.6, 140, 'Hiệp Sĩ Toán Học', 'Lê Minh Tuấn', '0903112233', 'tuanle@gmail.com', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', 'Cận 1.5 độ', 'Nắm vững kiến thức tự nhiên.', '2026-10-05 09:45:29'),
(4, 'HS1204', 'Vũ Phương Linh', 'Nữ', '2008-11-05', 162, 0, 3, 3, 'Tốt', 'Giỏi', 8.8, 165, 'Hoa Điểm Mười', 'Vũ Quốc Cường', '0934556677', 'cuongvu@gmail.com', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', 'Bình thường', 'Trầm tính, bài vở nề nếp cẩn thận.', '2026-10-05 09:45:29'),
(5, 'HS1205', 'Đỗ Minh Quân', 'Nam', '2008-03-28', 172, 0, 2, 2, 'Khá', 'Khá', 7.4, 90, 'Chiến Binh Nỗ Lực', 'Đỗ Văn Toàn', '0977889900', 'toando@gmail.com', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80', 'Bình thường', 'Cần tập trung hơn trong giờ Vật Lý.', '2026-10-05 09:45:29'),
(6, 'HS1206', 'Phạm Minh Trí', 'Nam', '2008-07-14', 165, 1, 1, 2, 'Khá', 'Trung bình', 6.2, 75, 'Hạt Giống Cần Nâng Đỡ', 'Lê Thị Thảo', '0918776655', 'thaole@gmail.com', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80', 'Cận 3.0 độ, hay đau mắt', 'Có dấu hiệu giảm sút môn Tiếng Anh và Hóa.', '2026-10-05 09:45:29'),
(7, 'HS1207', 'Hoàng Thảo My', 'Nữ', '2008-08-19', 160, 0, 2, 3, 'Tốt', 'Xuất sắc', 9.1, 180, 'Cây Bút Trẻ', 'Hoàng Văn Thái', '0915123456', 'thaihoang@gmail.com', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80', 'Bình thường', 'Giỏi Văn và Ngoại ngữ, năng nổ văn nghệ.', '2026-10-05 09:45:29'),
(8, 'HS1208', 'Ngô Gia Bảo', 'Nam', '2008-05-22', 170, 0, 5, 4, 'Tốt', 'Giỏi', 8.4, 130, 'Lá Cờ Đầu', 'Ngô Trọng Hiếu', '0916234567', 'hieungo@gmail.com', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80', 'Bình thường', 'Lớp phó lao động nhiệt tình, có trách nhiệm.', '2026-10-05 09:45:29'),
(9, 'HS1209', 'Đinh Ngọc Ánh', 'Nữ', '2008-12-10', 157, 1, 3, 5, 'Tốt', 'Giỏi', 8.7, 155, 'Học Tốt - Chăm Ngoan', 'Đinh Hữu Phước', '0917345678', 'phuocdinh@gmail.com', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 'Cận nhẹ', 'Chăm chỉ phát biểu, ghi chép đẹp.', '2026-10-05 09:45:29'),
(10, 'HS1210', 'Bùi Tấn Phát', 'Nam', '2008-06-30', 176, 0, 5, 2, 'Tốt', 'Giỏi', 8.3, 125, 'Ngôi Sao Thể Thao', 'Bùi Quang Vinh', '0918456789', 'vinhbui@gmail.com', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80', 'Thể lực rất tốt', 'Đội trưởng đội bóng rổ của trường.', '2026-10-05 09:45:29'),
(11, 'HS1211', 'Võ Khánh Huyền', 'Nữ', '2008-02-14', 163, 0, 3, 2, 'Khá', 'Khá', 7.8, 110, 'Hoa Chăm Chỉ', 'Võ Đình Trọng', '0919567890', 'trongvo@gmail.com', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80', 'Bình thường', 'Cần tự tin hơn khi lên bảng.', '2026-10-05 09:45:29'),
(12, 'HS1212', 'Lý Quốc Anh', 'Nam', '2008-10-08', 174, 1, 2, 5, 'Tốt', 'Xuất sắc', 9.0, 175, 'Chiến Binh Tin Học', 'Lý Thanh Bình', '0920678901', 'binhly@gmail.com', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80', 'Cận 2.0 độ', 'Đoạt giải nhì HSG Tin cấp thành phố.', '2026-10-05 09:45:29'),
(13, 'HS1213', 'Dương Thu Trang', 'Nữ', '2008-07-07', 159, 1, 5, 3, 'Tốt', 'Giỏi', 8.5, 145, 'Họa Sĩ Nhỏ', 'Dương Đình Hưng', '0921789012', 'hungduong@gmail.com', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', 'Cận 1.0 độ', 'Phụ trách báo tường và trang trí lớp.', '2026-10-05 09:45:29'),
(14, 'HS1214', 'Hà Trọng Kiên', 'Nam', '2008-09-17', 178, 0, 3, 6, 'Tốt', 'Khá', 7.9, 105, 'Chiến Binh Bền Bỉ', 'Hà Văn Thắng', '0922890123', 'thangha@gmail.com', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', 'Bình thường', 'Lực học tiến bộ rõ rệt qua từng tháng.', '2026-10-05 09:45:29'),
(15, 'HS1215', 'Phan Thùy Chi', 'Nữ', '2008-03-03', 161, 0, 1, 3, 'Tốt', 'Xuất sắc', 9.3, 200, 'Giọng Ca Vàng', 'Phan Văn Đức', '0923901234', 'ducphan@gmail.com', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', 'Bình thường', 'Thủ khoa đầu vào khối tự nhiên.', '2026-10-05 09:45:29'),
(16, 'HS1216', 'Trịnh Anh Tuấn', 'Nam', '2008-12-25', 169, 0, 1, 4, 'Khá', 'Trung bình', 6.5, 80, 'Cần Cố Gắng', 'Trịnh Xuân Hải', '0924012345', 'haitrinh@gmail.com', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', 'Bình thường', 'Còn lơ đãng trong giờ tự học.', '2026-10-05 09:45:29'),
(17, 'HS1217', 'Mai Tuyết Lan', 'Nữ', '2008-04-01', 164, 1, 4, 6, 'Tốt', 'Giỏi', 8.2, 135, 'Bông Hoa Tri Thức', 'Mai Văn Phú', '0925123456', 'phumai@gmail.com', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', 'Cận 2.0 độ', 'Cẩn thận, nhiệt tình giúp đỡ bạn.', '2026-10-05 09:45:29'),
(18, 'HS1218', 'Tạ Quang Dũng', 'Nam', '2008-05-15', 177, 0, 4, 5, 'Tốt', 'Giỏi', 8.6, 150, 'Cộng Tác Viên Năng Nổ', 'Tạ Quốc Huy', '0926234567', 'huyta@gmail.com', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80', 'Bình thường', 'Hòa đồng, kỹ năng thuyết trình xuất sắc.', '2026-10-05 09:45:29'),
(19, 'HS1219', 'Lương Mỹ Linh', 'Nữ', '2008-10-31', 156, 1, 5, 5, 'Tốt', 'Giỏi', 8.5, 140, 'Đại Sứ Thân Thiện', 'Lương Thế Thành', '0927345678', 'thanhluong@gmail.com', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80', 'Cận 1.5 độ', 'Nề nếp mẫu mực, tác phong nhanh nhẹn.', '2026-10-05 09:45:29'),
(20, 'HS1220', 'Cao Văn Nam', 'Nam', '2008-02-20', 181, 0, 2, 6, 'Khá', 'Khá', 7.6, 95, 'Chiến Binh Nỗ Lực', 'Cao Văn Hưởng', '0928456789', 'huongcao@gmail.com', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80', 'Cao vượt trội, ngồi sau để tránh che bạn', 'Môn Hóa cần bổ túc bài tập nâng cao.', '2026-10-05 09:45:29'),
(21, 'HS1221', 'Nghiêm Thanh Hằng', 'Nữ', '2008-06-18', 162, 0, 3, 1, 'Tốt', 'Xuất sắc', 9.0, 170, 'Ngôi Sao Tự Nhiên', 'Nghiêm Quang Sáng', '0929567890', 'sangnghiem@gmail.com', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 'Bình thường', 'Tư duy mạch lạc, giải bài khoa học.', '2026-10-05 09:45:29'),
(22, 'HS1222', 'Phùng Thế Hiển', 'Nam', '2008-08-08', 175, 1, 4, 4, 'Tốt', 'Giỏi', 8.1, 120, 'Nhà Khoa Học Tương Lai', 'Phùng Văn Lợi', '0930678901', 'loiphung@gmail.com', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80', 'Cận 2.5 độ', 'Đam mê thí nghiệm Vật Lý.', '2026-10-05 09:45:29'),
(23, 'HS1223', 'Chu Ngọc Diệp', 'Nữ', '2008-11-22', 160, 0, 4, 2, 'Tốt', 'Khá', 7.9, 115, 'Búp Sen Xanh', 'Chu Văn Quý', '0931789012', 'quychu@gmail.com', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80', 'Bình thường', 'Trầm tính, hoàn thành đủ nhiệm vụ.', '2026-10-05 09:45:29'),
(24, 'HS1224', 'Thái Đăng Khoa', 'Nam', '2008-01-29', 179, 0, 1, 6, 'Khá', 'Trung bình', 6.8, 85, 'Cần Cải Thiện', 'Thái Doãn Hùng', '0932890123', 'hungthai@gmail.com', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80', 'Bình thường', 'Cần theo sát kiểm tra bài cũ môn Toán.', '2026-10-05 09:45:29'),
(25, 'HS1225', 'Đoàn Diệu Linh', 'Nữ', '2008-05-09', 165, 0, 4, 1, 'Tốt', 'Giỏi', 8.7, 160, 'Tổ Trưởng Gương Mẫu', 'Đoàn Minh Trí', '0933901234', 'tridoan@gmail.com', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', 'Bình thường', 'Tổ trưởng tổ 1 điều hành nhóm rất tốt.', '2026-10-05 09:45:29'),
(26, 'HS1226', 'Lâm Quốc Cường', 'Nam', '2008-09-12', 182, 0, 5, 6, 'Tốt', 'Giỏi', 8.4, 135, 'Vận Động Viên Điền Kinh', 'Lâm Văn Hiệp', '0934012345', 'hieplam@gmail.com', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', 'Cao 1m82, ngồi hàng cuối hợp lý', 'Thể lực dồi dào, tinh thần đồng đội cao.', '2026-10-05 09:45:29'),
(27, 'HS1227', 'Tôn Nữ Uyên Phương', 'Nữ', '2008-12-01', 163, 1, 2, 1, 'Tốt', 'Xuất sắc', 9.2, 190, 'Thủ Thư Tận Tụy', 'Tôn Thất Minh', '0935123456', 'minhton@gmail.com', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', 'Cận 1.5 độ', 'Đọc sách phong phú, tư duy độc lập.', '2026-10-05 09:45:29'),
(28, 'HS1228', 'Trịnh Hữu Nghĩa', 'Nam', '2008-03-16', 180, 0, 3, 4, 'Tốt', 'Khá', 7.8, 100, 'Cần Cố Gắng', 'Trịnh Xuân Lộc', '0936234567', 'loctrinh@gmail.com', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80', 'Bình thường', 'Có tinh thần giúp đỡ bạn bè.', '2026-10-05 09:45:29'),
(29, 'HS1229', 'Quách Kim Ngân', 'Nữ', '2008-07-25', 166, 0, 5, 1, 'Tốt', 'Giỏi', 8.6, 145, 'Ngôi Sao Đổi Mới', 'Quách Văn Khải', '0937345678', 'khaiquach@gmail.com', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', 'Bình thường', 'Sáng tạo trong các bài tập nhóm.', '2026-10-05 09:45:29'),
(30, 'HS1230', 'Ngô Minh Khang', 'Nam', '2008-10-14', 183, 0, 2, 4, 'Khá', 'Khá', 7.5, 95, 'Chiến Binh Nỗ Lực', 'Ngô Văn Hải', '0938456789', 'haingo@gmail.com', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', 'Cao 1m83, ngồi cuối lớp', 'Ngoan ngoãn, cần cải thiện tốc độ giải đề.', '2026-10-05 09:45:29');

-- Dữ liệu bảng attendance_logs (63 bản ghi)
INSERT INTO attendance_logs (id, student_id, date, session, status, note, recorded_by, created_at) VALUES
(1, 1, '2026-10-05', 'Sáng', 'present', 'Đúng giờ', 'teacher', '2026-10-05 09:45:29'),
(2, 1, '2026-10-04', 'Sáng', 'present', 'Có mặt đầy đủ', 'teacher', '2026-10-05 09:45:29'),
(3, 2, '2026-10-05', 'Sáng', 'present', 'Đúng giờ', 'teacher', '2026-10-05 09:45:29'),
(4, 2, '2026-10-04', 'Sáng', 'present', 'Có mặt đầy đủ', 'teacher', '2026-10-05 09:45:29'),
(5, 3, '2026-10-05', 'Sáng', 'present', 'Đúng giờ', 'teacher', '2026-10-05 09:45:29'),
(6, 3, '2026-10-04', 'Sáng', 'present', 'Có mặt đầy đủ', 'teacher', '2026-10-05 09:45:29'),
(7, 4, '2026-10-05', 'Sáng', 'present', 'Đúng giờ', 'teacher', '2026-10-05 09:45:29'),
(8, 4, '2026-10-04', 'Sáng', 'present', 'Có mặt đầy đủ', 'teacher', '2026-10-05 09:45:29'),
(9, 5, '2026-10-05', 'Sáng', 'present', 'Đúng giờ', 'teacher', '2026-10-05 09:45:29'),
(10, 5, '2026-10-04', 'Sáng', 'present', 'Có mặt đầy đủ', 'teacher', '2026-10-05 09:45:29'),
(11, 6, '2026-10-05', 'Sáng', 'late', 'Đến lớp muộn 15 phút do hỏng xe đạp điện', 'teacher', '2026-10-05 09:45:29'),
(12, 6, '2026-10-04', 'Sáng', 'present', 'Có mặt đầy đủ', 'teacher', '2026-10-05 09:45:29'),
(13, 7, '2026-10-05', 'Sáng', 'present', 'Đúng giờ', 'teacher', '2026-10-05 09:45:29'),
(14, 7, '2026-10-04', 'Sáng', 'present', 'Có mặt đầy đủ', 'teacher', '2026-10-05 09:45:29'),
(15, 8, '2026-10-05', 'Sáng', 'present', 'Đúng giờ', 'teacher', '2026-10-05 09:45:29'),
(16, 8, '2026-10-04', 'Sáng', 'present', 'Có mặt đầy đủ', 'teacher', '2026-10-05 09:45:29'),
(17, 9, '2026-10-05', 'Sáng', 'present', 'Đúng giờ', 'teacher', '2026-10-05 09:45:29'),
(18, 9, '2026-10-04', 'Sáng', 'present', 'Có mặt đầy đủ', 'teacher', '2026-10-05 09:45:29'),
(19, 10, '2026-10-05', 'Sáng', 'present', 'Đúng giờ', 'teacher', '2026-10-05 09:45:29'),
(20, 10, '2026-10-04', 'Sáng', 'present', 'Có mặt đầy đủ', 'teacher', '2026-10-05 09:45:29'),
(21, 11, '2026-10-05', 'Sáng', 'present', 'Đúng giờ', 'teacher', '2026-10-05 09:45:29'),
(22, 11, '2026-10-04', 'Sáng', 'present', 'Có mặt đầy đủ', 'teacher', '2026-10-05 09:45:29'),
(23, 12, '2026-10-05', 'Sáng', 'present', 'Đúng giờ', 'teacher', '2026-10-05 09:45:29'),
(24, 12, '2026-10-04', 'Sáng', 'present', 'Có mặt đầy đủ', 'teacher', '2026-10-05 09:45:29'),
(25, 13, '2026-10-05', 'Sáng', 'present', 'Đúng giờ', 'teacher', '2026-10-05 09:45:29'),
(26, 13, '2026-10-04', 'Sáng', 'present', 'Có mặt đầy đủ', 'teacher', '2026-10-05 09:45:29'),
(27, 14, '2026-10-05', 'Sáng', 'present', 'Đúng giờ', 'teacher', '2026-10-05 09:45:29'),
(28, 14, '2026-10-04', 'Sáng', 'present', 'Có mặt đầy đủ', 'teacher', '2026-10-05 09:45:29'),
(29, 15, '2026-10-05', 'Sáng', 'present', 'Đúng giờ', 'teacher', '2026-10-05 09:45:29'),
(30, 15, '2026-10-04', 'Sáng', 'present', 'Có mặt đầy đủ', 'teacher', '2026-10-05 09:45:29'),
(31, 16, '2026-10-05', 'Sáng', 'excused', 'Nghỉ ốm sốt siêu vi, PH đã nộp đơn', 'monitor', '2026-10-05 09:45:29'),
(32, 16, '2026-10-04', 'Sáng', 'present', 'Có mặt đầy đủ', 'teacher', '2026-10-05 09:45:29'),
(33, 17, '2026-10-05', 'Sáng', 'present', 'Đúng giờ', 'monitor', '2026-10-05 09:45:29'),
(34, 17, '2026-10-04', 'Sáng', 'present', 'Có mặt đầy đủ', 'teacher', '2026-10-05 09:45:29'),
(35, 18, '2026-10-05', 'Sáng', 'present', 'Đúng giờ', 'monitor', '2026-10-05 09:45:29'),
(36, 18, '2026-10-04', 'Sáng', 'present', 'Có mặt đầy đủ', 'teacher', '2026-10-05 09:45:29'),
(37, 19, '2026-10-05', 'Sáng', 'present', 'Đúng giờ', 'monitor', '2026-10-05 09:45:29'),
(38, 19, '2026-10-04', 'Sáng', 'present', 'Có mặt đầy đủ', 'teacher', '2026-10-05 09:45:29'),
(39, 20, '2026-10-05', 'Sáng', 'present', 'Đúng giờ', 'monitor', '2026-10-05 09:45:29'),
(40, 20, '2026-10-04', 'Sáng', 'present', 'Có mặt đầy đủ', 'teacher', '2026-10-05 09:45:29'),
(41, 21, '2026-10-05', 'Sáng', 'present', 'Đúng giờ', 'monitor', '2026-10-05 09:45:29'),
(42, 21, '2026-10-04', 'Sáng', 'present', 'Có mặt đầy đủ', 'teacher', '2026-10-05 09:45:29'),
(43, 22, '2026-10-05', 'Sáng', 'present', 'Đúng giờ', 'monitor', '2026-10-05 09:45:29'),
(44, 22, '2026-10-04', 'Sáng', 'present', 'Có mặt đầy đủ', 'teacher', '2026-10-05 09:45:29'),
(45, 23, '2026-10-05', 'Sáng', 'present', 'Đúng giờ', 'monitor', '2026-10-05 09:45:29'),
(46, 23, '2026-10-04', 'Sáng', 'present', 'Có mặt đầy đủ', 'teacher', '2026-10-05 09:45:29'),
(47, 24, '2026-10-05', 'Sáng', 'unexcused', 'Chưa có mặt đầu giờ, GVCN đã kích hoạt thông báo tự động', 'monitor', '2026-10-05 09:45:29'),
(48, 24, '2026-10-04', 'Sáng', 'present', 'Có mặt đầy đủ', 'teacher', '2026-10-05 09:45:29'),
(49, 25, '2026-10-05', 'Sáng', 'present', 'Đúng giờ', 'monitor', '2026-10-05 09:45:29'),
(50, 25, '2026-10-04', 'Sáng', 'present', 'Có mặt đầy đủ', 'teacher', '2026-10-05 09:45:29'),
(51, 26, '2026-10-05', 'Sáng', 'present', 'Đúng giờ', 'monitor', '2026-10-05 09:45:29'),
(52, 26, '2026-10-04', 'Sáng', 'present', 'Có mặt đầy đủ', 'teacher', '2026-10-05 09:45:29'),
(53, 27, '2026-10-05', 'Sáng', 'present', 'Đúng giờ', 'monitor', '2026-10-05 09:45:29'),
(54, 27, '2026-10-04', 'Sáng', 'present', 'Có mặt đầy đủ', 'teacher', '2026-10-05 09:45:29'),
(55, 28, '2026-10-05', 'Sáng', 'present', 'Đúng giờ', 'monitor', '2026-10-05 09:45:29'),
(56, 28, '2026-10-04', 'Sáng', 'present', 'Có mặt đầy đủ', 'teacher', '2026-10-05 09:45:29'),
(57, 29, '2026-10-05', 'Sáng', 'present', 'Đúng giờ', 'monitor', '2026-10-05 09:45:29'),
(58, 29, '2026-10-04', 'Sáng', 'present', 'Có mặt đầy đủ', 'teacher', '2026-10-05 09:45:29'),
(59, 30, '2026-10-05', 'Sáng', 'present', 'Đúng giờ', 'monitor', '2026-10-05 09:45:29'),
(60, 30, '2026-10-04', 'Sáng', 'present', 'Có mặt đầy đủ', 'teacher', '2026-10-05 09:45:29'),
(61, 2, '2026-10-06', 'Sáng', 'present', '', 'teacher', '2026-10-06 02:39:55'),
(62, 3, '2026-10-06', 'Sáng', 'unexcused', '', 'teacher', '2026-10-06 13:10:28'),
(63, 4, '2026-10-06', 'Sáng', 'excused', '', 'teacher', '2026-10-06 13:10:43');

-- Dữ liệu bảng gamified_points_logs (13 bản ghi)
INSERT INTO gamified_points_logs (id, student_id, points, reason, category, recorded_by, created_at) VALUES
(1, 1, 10, 'Điều hành sinh hoạt lớp xuất sắc', 'hoạt động', 'teacher', '2026-10-05 09:45:29'),
(2, 1, 5, 'Xung phong giải bài tập Toán nâng cao', 'học tập', 'monitor', '2026-10-05 09:45:29'),
(3, 2, 10, 'Đạt 10 điểm kiểm tra 1 tiết Tiếng Anh', 'học tập', 'teacher', '2026-10-05 09:45:29'),
(4, 2, 5, 'Giúp đỡ bạn bàn bên hiểu bài Hóa', 'nề nếp', 'monitor', '2026-10-05 09:45:29'),
(5, 3, 10, 'Giải bài toán khó trên bảng', 'học tập', 'teacher', '2026-10-05 09:45:29'),
(6, 6, -5, 'Đi học muộn và quên sách giáo khoa', 'nề nếp', 'monitor', '2026-10-05 09:45:29'),
(7, 6, -5, 'Không thuộc bài cũ môn Hóa', 'học tập', 'teacher', '2026-10-05 09:45:29'),
(8, 7, 10, 'Bài viết Văn đạt giải Nhì cấp trường', 'học tập', 'teacher', '2026-10-05 09:45:29'),
(9, 10, 10, 'Ghi bàn thắng quyết định giải bóng rổ trường', 'hoạt động', 'teacher', '2026-10-05 09:45:29'),
(10, 15, 10, 'Hoàn thành xuất sắc nhiệm vụ đội tuyển', 'học tập', 'teacher', '2026-10-05 09:45:29'),
(11, 16, -5, 'Nói chuyện riêng nhiều lần trong giờ sinh hoạt', 'nề nếp', 'monitor', '2026-10-05 09:45:29'),
(12, 20, 5, 'Tích cực trực nhật lớp sạch sẽ', 'nề nếp', 'monitor', '2026-10-05 09:45:29'),
(13, 24, -10, 'Vắng học không phép đầu giờ', 'nề nếp', 'teacher', '2026-10-05 09:45:29');

-- Dữ liệu bảng academic_grades (150 bản ghi)
INSERT INTO academic_grades (id, student_id, subject, tx1, tx2, gk, ck, average, trend, warning_flag) VALUES
(1, 1, 'Toán', 8.8, 9.0, 8.8, 8.9, 8.9, 'stable', 0),
(2, 1, 'Ngữ Văn', 9.2, 9.4, 9.2, 9.3, 9.3, 'up', 0),
(3, 1, 'Tiếng Anh', 9.6, 9.8, 9.6, 9.7, 9.7, 'up', 0),
(4, 1, 'Vật Lý', 8.8, 9.0, 8.8, 8.9, 8.9, 'stable', 0),
(5, 1, 'Hóa Học', 9.2, 9.4, 9.2, 9.3, 9.3, 'up', 0),
(6, 2, 'Toán', 8.8, 9.0, 8.8, 8.9, 8.9, 'stable', 0),
(7, 2, 'Ngữ Văn', 9.2, 9.4, 9.2, 9.3, 9.3, 'up', 0),
(8, 2, 'Tiếng Anh', 9.6, 9.8, 9.6, 9.7, 9.7, 'up', 0),
(9, 2, 'Vật Lý', 8.8, 9.0, 8.8, 8.9, 8.9, 'stable', 0),
(10, 2, 'Hóa Học', 9.2, 9.4, 9.2, 9.3, 9.3, 'up', 0),
(11, 3, 'Toán', 8.1, 8.3, 8.1, 8.2, 8.2, 'stable', 0),
(12, 3, 'Ngữ Văn', 8.5, 8.7, 8.5, 8.6, 8.6, 'stable', 0),
(13, 3, 'Tiếng Anh', 8.9, 9.1, 8.9, 9.0, 9.0, 'stable', 0),
(14, 3, 'Vật Lý', 8.1, 8.3, 8.1, 8.2, 8.2, 'stable', 0),
(15, 3, 'Hóa Học', 8.5, 8.7, 8.5, 8.6, 8.6, 'stable', 0),
(16, 4, 'Toán', 8.1, 8.3, 8.1, 8.2, 8.2, 'stable', 0),
(17, 4, 'Ngữ Văn', 8.5, 8.7, 8.5, 8.6, 8.6, 'stable', 0),
(18, 4, 'Tiếng Anh', 8.9, 9.1, 8.9, 9.0, 9.0, 'stable', 0),
(19, 4, 'Vật Lý', 8.1, 8.3, 8.1, 8.2, 8.2, 'stable', 0),
(20, 4, 'Hóa Học', 8.5, 8.7, 8.5, 8.6, 8.6, 'stable', 0),
(21, 5, 'Toán', 7.4, 7.6, 7.4, 7.5, 7.5, 'stable', 0),
(22, 5, 'Ngữ Văn', 7.8, 8.0, 7.8, 7.9, 7.9, 'stable', 0),
(23, 5, 'Tiếng Anh', 8.2, 8.4, 8.2, 8.3, 8.3, 'stable', 0),
(24, 5, 'Vật Lý', 7.4, 7.6, 7.4, 7.5, 7.5, 'stable', 0),
(25, 5, 'Hóa Học', 7.8, 8.0, 7.8, 7.9, 7.9, 'stable', 0),
(26, 6, 'Toán', 5.6, 5.3, 4.9, 5.1, 5.1, 'down', 1),
(27, 6, 'Ngữ Văn', 6.0, 6.2, 6.0, 6.1, 6.1, 'stable', 0),
(28, 6, 'Tiếng Anh', 6.4, 6.1, 5.7, 5.9, 5.9, 'down', 1),
(29, 6, 'Vật Lý', 5.6, 5.8, 5.6, 5.7, 5.7, 'stable', 0),
(30, 6, 'Hóa Học', 6.0, 5.7, 5.3, 5.5, 5.5, 'down', 1),
(31, 7, 'Toán', 8.8, 9.0, 8.8, 8.9, 8.9, 'stable', 0),
(32, 7, 'Ngữ Văn', 9.2, 9.4, 9.2, 9.3, 9.3, 'up', 0),
(33, 7, 'Tiếng Anh', 9.6, 9.8, 9.6, 9.7, 9.7, 'up', 0),
(34, 7, 'Vật Lý', 8.8, 9.0, 8.8, 8.9, 8.9, 'stable', 0),
(35, 7, 'Hóa Học', 9.2, 9.4, 9.2, 9.3, 9.3, 'up', 0),
(36, 8, 'Toán', 8.1, 8.3, 8.1, 8.2, 8.2, 'stable', 0),
(37, 8, 'Ngữ Văn', 8.5, 8.7, 8.5, 8.6, 8.6, 'stable', 0),
(38, 8, 'Tiếng Anh', 8.9, 9.1, 8.9, 9.0, 9.0, 'stable', 0),
(39, 8, 'Vật Lý', 8.1, 8.3, 8.1, 8.2, 8.2, 'stable', 0),
(40, 8, 'Hóa Học', 8.5, 8.7, 8.5, 8.6, 8.6, 'stable', 0),
(41, 9, 'Toán', 8.1, 8.3, 8.1, 8.2, 8.2, 'stable', 0),
(42, 9, 'Ngữ Văn', 8.5, 8.7, 8.5, 8.6, 8.6, 'stable', 0),
(43, 9, 'Tiếng Anh', 8.9, 9.1, 8.9, 9.0, 9.0, 'stable', 0),
(44, 9, 'Vật Lý', 8.1, 8.3, 8.1, 8.2, 8.2, 'stable', 0),
(45, 9, 'Hóa Học', 8.5, 8.7, 8.5, 8.6, 8.6, 'stable', 0),
(46, 10, 'Toán', 8.1, 8.3, 8.1, 8.2, 8.2, 'stable', 0),
(47, 10, 'Ngữ Văn', 8.5, 8.7, 8.5, 8.6, 8.6, 'stable', 0),
(48, 10, 'Tiếng Anh', 8.9, 9.1, 8.9, 9.0, 9.0, 'stable', 0),
(49, 10, 'Vật Lý', 8.1, 8.3, 8.1, 8.2, 8.2, 'stable', 0),
(50, 10, 'Hóa Học', 8.5, 8.7, 8.5, 8.6, 8.6, 'stable', 0),
(51, 11, 'Toán', 7.4, 7.6, 7.4, 7.5, 7.5, 'stable', 0),
(52, 11, 'Ngữ Văn', 7.8, 8.0, 7.8, 7.9, 7.9, 'stable', 0),
(53, 11, 'Tiếng Anh', 8.2, 8.4, 8.2, 8.3, 8.3, 'stable', 0),
(54, 11, 'Vật Lý', 7.4, 7.6, 7.4, 7.5, 7.5, 'stable', 0),
(55, 11, 'Hóa Học', 7.8, 8.0, 7.8, 7.9, 7.9, 'stable', 0),
(56, 12, 'Toán', 8.8, 9.0, 8.8, 8.9, 8.9, 'stable', 0),
(57, 12, 'Ngữ Văn', 9.2, 9.4, 9.2, 9.3, 9.3, 'up', 0),
(58, 12, 'Tiếng Anh', 9.6, 9.8, 9.6, 9.7, 9.7, 'up', 0),
(59, 12, 'Vật Lý', 8.8, 9.0, 8.8, 8.9, 8.9, 'stable', 0),
(60, 12, 'Hóa Học', 9.2, 9.4, 9.2, 9.3, 9.3, 'up', 0),
(61, 13, 'Toán', 8.1, 8.3, 8.1, 8.2, 8.2, 'stable', 0),
(62, 13, 'Ngữ Văn', 8.5, 8.7, 8.5, 8.6, 8.6, 'stable', 0),
(63, 13, 'Tiếng Anh', 8.9, 9.1, 8.9, 9.0, 9.0, 'stable', 0),
(64, 13, 'Vật Lý', 8.1, 8.3, 8.1, 8.2, 8.2, 'stable', 0),
(65, 13, 'Hóa Học', 8.5, 8.7, 8.5, 8.6, 8.6, 'stable', 0),
(66, 14, 'Toán', 7.4, 7.6, 7.4, 7.5, 7.5, 'stable', 0),
(67, 14, 'Ngữ Văn', 7.8, 8.0, 7.8, 7.9, 7.9, 'stable', 0),
(68, 14, 'Tiếng Anh', 8.2, 8.4, 8.2, 8.3, 8.3, 'stable', 0),
(69, 14, 'Vật Lý', 7.4, 7.6, 7.4, 7.5, 7.5, 'stable', 0),
(70, 14, 'Hóa Học', 7.8, 8.0, 7.8, 7.9, 7.9, 'stable', 0),
(71, 15, 'Toán', 8.8, 9.0, 8.8, 8.9, 8.9, 'stable', 0),
(72, 15, 'Ngữ Văn', 9.2, 9.4, 9.2, 9.3, 9.3, 'up', 0),
(73, 15, 'Tiếng Anh', 9.6, 9.8, 9.6, 9.7, 9.7, 'up', 0),
(74, 15, 'Vật Lý', 8.8, 9.0, 8.8, 8.9, 8.9, 'stable', 0),
(75, 15, 'Hóa Học', 9.2, 9.4, 9.2, 9.3, 9.3, 'up', 0),
(76, 16, 'Toán', 5.6, 5.8, 5.6, 5.7, 5.7, 'stable', 0),
(77, 16, 'Ngữ Văn', 6.0, 6.2, 6.0, 6.1, 6.1, 'stable', 0),
(78, 16, 'Tiếng Anh', 6.4, 6.6, 6.4, 6.5, 6.5, 'stable', 0),
(79, 16, 'Vật Lý', 5.6, 5.8, 5.6, 5.7, 5.7, 'stable', 0),
(80, 16, 'Hóa Học', 6.0, 6.2, 6.0, 6.1, 6.1, 'stable', 0),
(81, 17, 'Toán', 8.1, 8.3, 8.1, 8.2, 8.2, 'stable', 0),
(82, 17, 'Ngữ Văn', 8.5, 8.7, 8.5, 8.6, 8.6, 'stable', 0),
(83, 17, 'Tiếng Anh', 8.9, 9.1, 8.9, 9.0, 9.0, 'stable', 0),
(84, 17, 'Vật Lý', 8.1, 8.3, 8.1, 8.2, 8.2, 'stable', 0),
(85, 17, 'Hóa Học', 8.5, 8.7, 8.5, 8.6, 8.6, 'stable', 0),
(86, 18, 'Toán', 7.4, 7.6, 7.4, 7.5, 7.5, 'stable', 0),
(87, 18, 'Ngữ Văn', 7.8, 8.0, 7.8, 7.9, 7.9, 'stable', 0),
(88, 18, 'Tiếng Anh', 8.2, 8.4, 8.2, 8.3, 8.3, 'stable', 0),
(89, 18, 'Vật Lý', 7.4, 7.6, 7.4, 7.5, 7.5, 'stable', 0),
(90, 18, 'Hóa Học', 7.8, 8.0, 7.8, 7.9, 7.9, 'stable', 0),
(91, 19, 'Toán', 8.1, 8.3, 8.1, 8.2, 8.2, 'stable', 0),
(92, 19, 'Ngữ Văn', 8.5, 8.7, 8.5, 8.6, 8.6, 'stable', 0),
(93, 19, 'Tiếng Anh', 8.9, 9.1, 8.9, 9.0, 9.0, 'stable', 0),
(94, 19, 'Vật Lý', 8.1, 8.3, 8.1, 8.2, 8.2, 'stable', 0),
(95, 19, 'Hóa Học', 8.5, 8.7, 8.5, 8.6, 8.6, 'stable', 0),
(96, 20, 'Toán', 7.4, 7.6, 7.4, 7.5, 7.5, 'stable', 0),
(97, 20, 'Ngữ Văn', 7.8, 8.0, 7.8, 7.9, 7.9, 'stable', 0),
(98, 20, 'Tiếng Anh', 8.2, 8.4, 8.2, 8.3, 8.3, 'stable', 0),
(99, 20, 'Vật Lý', 7.4, 7.6, 7.4, 7.5, 7.5, 'stable', 0),
(100, 20, 'Hóa Học', 7.8, 8.0, 7.8, 7.9, 7.9, 'stable', 0),
(101, 21, 'Toán', 8.8, 9.0, 8.8, 8.9, 8.9, 'stable', 0),
(102, 21, 'Ngữ Văn', 9.2, 9.4, 9.2, 9.3, 9.3, 'up', 0),
(103, 21, 'Tiếng Anh', 9.6, 9.8, 9.6, 9.7, 9.7, 'up', 0),
(104, 21, 'Vật Lý', 8.8, 9.0, 8.8, 8.9, 8.9, 'stable', 0),
(105, 21, 'Hóa Học', 9.2, 9.4, 9.2, 9.3, 9.3, 'up', 0),
(106, 22, 'Toán', 8.1, 8.3, 8.1, 8.2, 8.2, 'stable', 0),
(107, 22, 'Ngữ Văn', 8.5, 8.7, 8.5, 8.6, 8.6, 'stable', 0),
(108, 22, 'Tiếng Anh', 8.9, 9.1, 8.9, 9.0, 9.0, 'stable', 0),
(109, 22, 'Vật Lý', 8.1, 8.3, 8.1, 8.2, 8.2, 'stable', 0),
(110, 22, 'Hóa Học', 8.5, 8.7, 8.5, 8.6, 8.6, 'stable', 0),
(111, 23, 'Toán', 7.4, 7.6, 7.4, 7.5, 7.5, 'stable', 0),
(112, 23, 'Ngữ Văn', 7.8, 8.0, 7.8, 7.9, 7.9, 'stable', 0),
(113, 23, 'Tiếng Anh', 8.2, 8.4, 8.2, 8.3, 8.3, 'stable', 0),
(114, 23, 'Vật Lý', 7.4, 7.6, 7.4, 7.5, 7.5, 'stable', 0),
(115, 23, 'Hóa Học', 7.8, 8.0, 7.8, 7.9, 7.9, 'stable', 0),
(116, 24, 'Toán', 5.6, 5.3, 4.9, 5.1, 5.1, 'down', 1),
(117, 24, 'Ngữ Văn', 6.0, 6.2, 6.0, 6.1, 6.1, 'stable', 0),
(118, 24, 'Tiếng Anh', 6.4, 6.1, 5.7, 5.9, 5.9, 'down', 1),
(119, 24, 'Vật Lý', 5.6, 5.8, 5.6, 5.7, 5.7, 'stable', 0),
(120, 24, 'Hóa Học', 6.0, 5.7, 5.3, 5.5, 5.5, 'down', 1),
(121, 25, 'Toán', 8.1, 8.3, 8.1, 8.2, 8.2, 'stable', 0),
(122, 25, 'Ngữ Văn', 8.5, 8.7, 8.5, 8.6, 8.6, 'stable', 0),
(123, 25, 'Tiếng Anh', 8.9, 9.1, 8.9, 9.0, 9.0, 'stable', 0),
(124, 25, 'Vật Lý', 8.1, 8.3, 8.1, 8.2, 8.2, 'stable', 0),
(125, 25, 'Hóa Học', 8.5, 8.7, 8.5, 8.6, 8.6, 'stable', 0),
(126, 26, 'Toán', 8.1, 8.3, 8.1, 8.2, 8.2, 'stable', 0),
(127, 26, 'Ngữ Văn', 8.5, 8.7, 8.5, 8.6, 8.6, 'stable', 0),
(128, 26, 'Tiếng Anh', 8.9, 9.1, 8.9, 9.0, 9.0, 'stable', 0),
(129, 26, 'Vật Lý', 8.1, 8.3, 8.1, 8.2, 8.2, 'stable', 0),
(130, 26, 'Hóa Học', 8.5, 8.7, 8.5, 8.6, 8.6, 'stable', 0),
(131, 27, 'Toán', 8.8, 9.0, 8.8, 8.9, 8.9, 'stable', 0),
(132, 27, 'Ngữ Văn', 9.2, 9.4, 9.2, 9.3, 9.3, 'up', 0),
(133, 27, 'Tiếng Anh', 9.6, 9.8, 9.6, 9.7, 9.7, 'up', 0),
(134, 27, 'Vật Lý', 8.8, 9.0, 8.8, 8.9, 8.9, 'stable', 0),
(135, 27, 'Hóa Học', 9.2, 9.4, 9.2, 9.3, 9.3, 'up', 0),
(136, 28, 'Toán', 7.4, 7.6, 7.4, 7.5, 7.5, 'stable', 0),
(137, 28, 'Ngữ Văn', 7.8, 8.0, 7.8, 7.9, 7.9, 'stable', 0),
(138, 28, 'Tiếng Anh', 8.2, 8.4, 8.2, 8.3, 8.3, 'stable', 0),
(139, 28, 'Vật Lý', 7.4, 7.6, 7.4, 7.5, 7.5, 'stable', 0),
(140, 28, 'Hóa Học', 7.8, 8.0, 7.8, 7.9, 7.9, 'stable', 0),
(141, 29, 'Toán', 8.1, 8.3, 8.1, 8.2, 8.2, 'stable', 0),
(142, 29, 'Ngữ Văn', 8.5, 8.7, 8.5, 8.6, 8.6, 'stable', 0),
(143, 29, 'Tiếng Anh', 8.9, 9.1, 8.9, 9.0, 9.0, 'stable', 0),
(144, 29, 'Vật Lý', 8.1, 8.3, 8.1, 8.2, 8.2, 'stable', 0),
(145, 29, 'Hóa Học', 8.5, 8.7, 8.5, 8.6, 8.6, 'stable', 0),
(146, 30, 'Toán', 7.4, 7.6, 7.4, 7.5, 7.5, 'stable', 0),
(147, 30, 'Ngữ Văn', 7.8, 8.0, 7.8, 7.9, 7.9, 'stable', 0),
(148, 30, 'Tiếng Anh', 8.2, 8.4, 8.2, 8.3, 8.3, 'stable', 0),
(149, 30, 'Vật Lý', 7.4, 7.6, 7.4, 7.5, 7.5, 'stable', 0),
(150, 30, 'Hóa Học', 7.8, 8.0, 7.8, 7.9, 7.9, 'stable', 0);

-- Dữ liệu bảng ai_reports (3 bản ghi)
INSERT INTO ai_reports (id, student_id, term, tone, generated_text, strengths, areas_for_improvement, action_plan, approved_by_teacher, created_at) VALUES
(1, 1, 'Học kỳ 1 - 2026', 'motivational', 'Em Nguyễn Đức Huy thể hiện vai trò Lớp Trưởng vô cùng xuất sắc. Điểm trung bình học tập 9.4 dẫn đầu lớp, nề nếp gương mẫu, hòa nhã với bạn bè. Đề xuất tiếp tục phát huy năng lực lãnh đạo và tự tin tham gia kỳ thi Học sinh giỏi Quốc Gia.', 'Năng lực lãnh đạo xuất sắc, tư duy logic nhạy bén, tinh thần trách nhiệm cao.', 'Cần cân đối thời gian giữa hoạt động Đoàn đội và nghỉ ngơi để duy trì phong độ.', 'Duy trì vị trí Top 1 của lớp, làm hạt nhân thúc đẩy các phong trào tự học.', 1, '2026-10-05 09:45:29'),
(2, 2, 'Học kỳ 1 - 2026', 'constructive', 'Trần Bảo Ngọc là học sinh chăm chỉ, cầu tiến và có trách nhiệm cao trong vai trò Lớp phó học tập. Điểm số các môn tự nhiên và Ngoại ngữ đều đạt loại Xuất sắc (GPA 9.2). Em luôn chủ động hỗ trợ các bạn cùng bàn.', 'Thái độ học tập nghiêm túc, tỉ mỉ, khả năng tự học và ghi nhớ rất tốt.', 'Cần tích cực phát biểu xây dựng bài hơn nữa trên lớp để rèn luyện sự tự tin trước đám đông.', 'Đặt mục tiêu đạt chứng chỉ IELTS 7.5 trong học kỳ tới.', 1, '2026-10-05 09:45:29'),
(3, 6, 'Học kỳ 1 - 2026', 'strict', 'Em Phạm Minh Trí có tố chất thông minh nhưng thiếu tập trung trong giai đoạn gần đây. Điểm số môn Tiếng Anh và Hóa Học có xu hướng giảm rõ rệt (cảnh báo nguy cơ học lực giảm sút). Cần chấn chỉnh ngay việc đi học muộn và nộp bài tập đúng hạn.', 'Khả năng tiếp thu nhanh khi tập trung, có tinh thần tương thân tương ái.', 'Thường xuyên mất tập trung trong giờ học, còn vi phạm đi trễ, bài vở chưa chu đáo.', 'GVCN xếp em ngồi bàn 1 cạnh Lớp trưởng để kèm cặp; gia đình phối hợp kiểm tra góc học tập tại nhà mỗi tối.', 1, '2026-10-05 09:45:29');

-- Dữ liệu bảng parent_communications (5 bản ghi)
INSERT INTO parent_communications (id, student_id, channel, recipient, subject, message, status, trigger_type, sent_at) VALUES
(1, 6, 'Zalo Oa', '0918776655 (Mẹ Thảo)', 'Cảnh báo vắng học & đi muộn', 'Kính gửi Phụ huynh em Phạm Minh Trí: Sáng nay em Trí đến lớp muộn 15 phút. Nhờ gia đình nhắc nhở em chuẩn bị đi học sớm hơn.', 'Đã gửi', 'Vắng học khẩn cấp', '2026-10-05 09:45:29'),
(2, 24, 'SMS Gateway', '0932890123 (Bố Hùng)', 'Khẩn: Học sinh vắng mặt chưa rõ lý do', 'Kính gửi Phụ huynh em Thái Đăng Khoa: Hệ thống điểm danh ghi nhận em Khoa chưa có mặt tại lớp tiết 1 sáng nay. Xin vui lòng phản hồi GVCN.', 'Đã gửi', 'Vắng học khẩn cấp', '2026-10-05 09:45:29'),
(3, 1, 'Zalo Oa', '0912345678 (Bố Hùng)', 'Tuyên dương tuần', 'Chúc mừng gia đình: Em Nguyễn Đức Huy vừa được cộng 15 điểm thi đua và nhận danh hiệu Lớp Trưởng Gương Mẫu tuần này!', 'Đã gửi', 'Khen thưởng', '2026-10-05 09:45:29'),
(4, 2, 'Cổng Phụ Huynh', '0987654321 (Bố Nam)', 'Báo cáo tiến độ học tập tháng 10/2026', 'Báo cáo học tập định kỳ của em Trần Bảo Ngọc đã sẵn sàng trên cổng thông tin. GPA hiện tại: 9.2, xếp hạng 2/30.', 'Đã gửi', 'Báo cáo tuần', '2026-10-05 09:45:29'),
(5, 3, 'SMS Gateway', '0903112233', 'Cảnh báo vắng học khẩn cấp', 'Kính gửi Lê Minh Tuấn: Hệ thống ghi nhận em Lê Hoàng Long chưa có mặt tại lớp sáng nay. Vui lòng xác nhận với nhà trường.', 'Đã gửi', 'Tự động bởi Điểm danh', '2026-10-06 13:10:28');

-- Dữ liệu bảng absence_requests (1 bản ghi)
INSERT INTO absence_requests (id, student_id, parent_name, from_date, to_date, reason, status, teacher_reply, created_at) VALUES
(1, 16, 'Trịnh Xuân Hải', '2026-10-05', '2026-10-05', 'Em bị sốt virus cần đi khám tại bệnh viện Nhi Đồng, xin phép cô cho em nghỉ học 1 ngày.', 'approved', 'Cô đã nhận đơn và đồng ý. Chúc em mau khỏe, bài tập cô đã gửi qua bạn Trịnh Anh Tuấn.', '2026-10-05 09:45:29');

-- Đồng bộ bộ đếm ID tự tăng (SERIAL sequences)
SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 1));
SELECT setval(pg_get_serial_sequence('students', 'id'), COALESCE((SELECT MAX(id) FROM students), 1));
SELECT setval(pg_get_serial_sequence('attendance_logs', 'id'), COALESCE((SELECT MAX(id) FROM attendance_logs), 1));
SELECT setval(pg_get_serial_sequence('gamified_points_logs', 'id'), COALESCE((SELECT MAX(id) FROM gamified_points_logs), 1));
SELECT setval(pg_get_serial_sequence('academic_grades', 'id'), COALESCE((SELECT MAX(id) FROM academic_grades), 1));
SELECT setval(pg_get_serial_sequence('ai_reports', 'id'), COALESCE((SELECT MAX(id) FROM ai_reports), 1));
SELECT setval(pg_get_serial_sequence('parent_communications', 'id'), COALESCE((SELECT MAX(id) FROM parent_communications), 1));
SELECT setval(pg_get_serial_sequence('absence_requests', 'id'), COALESCE((SELECT MAX(id) FROM absence_requests), 1));