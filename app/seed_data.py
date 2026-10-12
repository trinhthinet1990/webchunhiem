from datetime import datetime, timedelta
from app.database import get_db_connection, init_db

def seed_database(force: bool = False):
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if data already exists
    cursor.execute("SELECT COUNT(*) as cnt FROM students")
    count = cursor.fetchone()["cnt"]
    if count > 0 and not force:
        conn.close()
        return

    # Clear existing if force
    cursor.execute("DELETE FROM users")
    cursor.execute("DELETE FROM students")
    cursor.execute("DELETE FROM attendance_logs")
    cursor.execute("DELETE FROM gamified_points_logs")
    cursor.execute("DELETE FROM academic_grades")
    cursor.execute("DELETE FROM ai_reports")
    cursor.execute("DELETE FROM parent_communications")
    cursor.execute("DELETE FROM absence_requests")

    # 1. Seed Users (RBAC)
    users_data = [
        ("gvcn_maianh", "Cô Hoàng Mai Anh", "teacher", None, "https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80"),
        ("lt_duchuy", "Nguyễn Đức Huy (Lớp Trưởng)", "monitor", 1, "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80"),
        ("ph_baongoc", "Trần Văn Nam (PH em Bảo Ngọc)", "parent_student", 2, "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"),
        ("ph_minhtri", "Lê Thị Thảo (PH em Minh Trí)", "parent_student", 6, "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"),
    ]
    cursor.executemany("""
        INSERT INTO users (username, full_name, role, student_id, avatar)
        VALUES (?, ?, ?, ?, ?)
    """, users_data)

    # 2. Seed 30 Students for Class 12A1 (5 rows x 6 columns)
    # Col 1,2: Dãy 1; Col 3,4: Dãy 2; Col 5,6: Dãy 3
    raw_students = [
        # (id=1)
        ("HS1201", "Nguyễn Đức Huy", "Nam", "2008-04-12", 175, 0, 1, 1, "Tốt", "Xuất sắc", 9.4, 210, "Lớp Trưởng Gương Mẫu", "Nguyễn Văn Hùng", "0912345678", "nguyenhung@gmail.com", "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80", "Sức khỏe tốt, năng động", "Lớp trưởng gương mẫu, có uy tín cao."),
        # (id=2)
        ("HS1202", "Trần Bảo Ngọc", "Nữ", "2008-09-20", 158, 1, 1, 2, "Tốt", "Xuất sắc", 9.2, 195, "Sao Chăm Ngoan", "Trần Văn Nam", "0987654321", "namtran@gmail.com", "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80", "Cận thị 2.5 độ, cần ngồi gần bảng", "Lớp phó học tập, học đều các môn."),
        # (id=3)
        ("HS1203", "Lê Hoàng Long", "Nam", "2008-01-15", 168, 1, 1, 3, "Tốt", "Giỏi", 8.6, 140, "Hiệp Sĩ Toán Học", "Lê Minh Tuấn", "0903112233", "tuanle@gmail.com", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80", "Cận 1.5 độ", "Nắm vững kiến thức tự nhiên."),
        # (id=4)
        ("HS1204", "Vũ Phương Linh", "Nữ", "2008-11-05", 162, 0, 1, 4, "Tốt", "Giỏi", 8.8, 165, "Hoa Điểm Mười", "Vũ Quốc Cường", "0934556677", "cuongvu@gmail.com", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80", "Bình thường", "Trầm tính, bài vở nề nếp cẩn thận."),
        # (id=5)
        ("HS1205", "Đỗ Minh Quân", "Nam", "2008-03-28", 172, 0, 1, 5, "Khá", "Khá", 7.4, 90, "Chiến Binh Nỗ Lực", "Đỗ Văn Toàn", "0977889900", "toando@gmail.com", "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80", "Bình thường", "Cần tập trung hơn trong giờ Vật Lý."),
        # (id=6)
        ("HS1206", "Phạm Minh Trí", "Nam", "2008-07-14", 165, 1, 1, 6, "Khá", "Trung bình", 6.2, 75, "Hạt Giống Cần Nâng Đỡ", "Lê Thị Thảo", "0918776655", "thaole@gmail.com", "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80", "Cận 3.0 độ, hay đau mắt", "Có dấu hiệu giảm sút môn Tiếng Anh và Hóa."),

        # Hàng 2
        ("HS1207", "Hoàng Thảo My", "Nữ", "2008-08-19", 160, 0, 2, 1, "Tốt", "Xuất sắc", 9.1, 180, "Cây Bút Trẻ", "Hoàng Văn Thái", "0915123456", "thaihoang@gmail.com", "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80", "Bình thường", "Giỏi Văn và Ngoại ngữ, năng nổ văn nghệ."),
        ("HS1208", "Ngô Gia Bảo", "Nam", "2008-05-22", 170, 0, 2, 2, "Tốt", "Giỏi", 8.4, 130, "Lá Cờ Đầu", "Ngô Trọng Hiếu", "0916234567", "hieungo@gmail.com", "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80", "Bình thường", "Lớp phó lao động nhiệt tình, có trách nhiệm."),
        ("HS1209", "Đinh Ngọc Ánh", "Nữ", "2008-12-10", 157, 1, 2, 3, "Tốt", "Giỏi", 8.7, 155, "Học Tốt - Chăm Ngoan", "Đinh Hữu Phước", "0917345678", "phuocdinh@gmail.com", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80", "Cận nhẹ", "Chăm chỉ phát biểu, ghi chép đẹp."),
        ("HS1210", "Bùi Tấn Phát", "Nam", "2008-06-30", 176, 0, 2, 4, "Tốt", "Giỏi", 8.3, 125, "Ngôi Sao Thể Thao", "Bùi Quang Vinh", "0918456789", "vinhbui@gmail.com", "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80", "Thể lực rất tốt", "Đội trưởng đội bóng rổ của trường."),
        ("HS1211", "Võ Khánh Huyền", "Nữ", "2008-02-14", 163, 0, 2, 5, "Khá", "Khá", 7.8, 110, "Hoa Chăm Chỉ", "Võ Đình Trọng", "0919567890", "trongvo@gmail.com", "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80", "Bình thường", "Cần tự tin hơn khi lên bảng."),
        ("HS1212", "Lý Quốc Anh", "Nam", "2008-10-08", 174, 1, 2, 6, "Tốt", "Xuất sắc", 9.0, 175, "Chiến Binh Tin Học", "Lý Thanh Bình", "0920678901", "binhly@gmail.com", "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80", "Cận 2.0 độ", "Đoạt giải nhì HSG Tin cấp thành phố."),

        # Hàng 3
        ("HS1213", "Dương Thu Trang", "Nữ", "2008-07-07", 159, 1, 3, 1, "Tốt", "Giỏi", 8.5, 145, "Họa Sĩ Nhỏ", "Dương Đình Hưng", "0921789012", "hungduong@gmail.com", "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80", "Cận 1.0 độ", "Phụ trách báo tường và trang trí lớp."),
        ("HS1214", "Hà Trọng Kiên", "Nam", "2008-09-17", 178, 0, 3, 2, "Tốt", "Khá", 7.9, 105, "Chiến Binh Bền Bỉ", "Hà Văn Thắng", "0922890123", "thangha@gmail.com", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80", "Bình thường", "Lực học tiến bộ rõ rệt qua từng tháng."),
        ("HS1215", "Phan Thùy Chi", "Nữ", "2008-03-03", 161, 0, 3, 3, "Tốt", "Xuất sắc", 9.3, 200, "Giọng Ca Vàng", "Phan Văn Đức", "0923901234", "ducphan@gmail.com", "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80", "Bình thường", "Thủ khoa đầu vào khối tự nhiên."),
        ("HS1216", "Trịnh Anh Tuấn", "Nam", "2008-12-25", 169, 0, 3, 4, "Khá", "Trung bình", 6.5, 80, "Cần Cố Gắng", "Trịnh Xuân Hải", "0924012345", "haitrinh@gmail.com", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80", "Bình thường", "Còn lơ đãng trong giờ tự học."),
        ("HS1217", "Mai Tuyết Lan", "Nữ", "2008-04-01", 164, 1, 3, 5, "Tốt", "Giỏi", 8.2, 135, "Bông Hoa Tri Thức", "Mai Văn Phú", "0925123456", "phumai@gmail.com", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80", "Cận 2.0 độ", "Cẩn thận, nhiệt tình giúp đỡ bạn."),
        ("HS1218", "Tạ Quang Dũng", "Nam", "2008-05-15", 177, 0, 3, 6, "Tốt", "Giỏi", 8.6, 150, "Cộng Tác Viên Năng Nổ", "Tạ Quốc Huy", "0926234567", "huyta@gmail.com", "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80", "Bình thường", "Hòa đồng, kỹ năng thuyết trình xuất sắc."),

        # Hàng 4
        ("HS1219", "Lương Mỹ Linh", "Nữ", "2008-10-31", 156, 1, 4, 1, "Tốt", "Giỏi", 8.5, 140, "Đại Sứ Thân Thiện", "Lương Thế Thành", "0927345678", "thanhluong@gmail.com", "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80", "Cận 1.5 độ", "Nề nếp mẫu mực, tác phong nhanh nhẹn."),
        ("HS1220", "Cao Văn Nam", "Nam", "2008-02-20", 181, 0, 4, 2, "Khá", "Khá", 7.6, 95, "Chiến Binh Nỗ Lực", "Cao Văn Hưởng", "0928456789", "huongcao@gmail.com", "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80", "Cao vượt trội, ngồi sau để tránh che bạn", "Môn Hóa cần bổ túc bài tập nâng cao."),
        ("HS1221", "Nghiêm Thanh Hằng", "Nữ", "2008-06-18", 162, 0, 4, 3, "Tốt", "Xuất sắc", 9.0, 170, "Ngôi Sao Tự Nhiên", "Nghiêm Quang Sáng", "0929567890", "sangnghiem@gmail.com", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80", "Bình thường", "Tư duy mạch lạc, giải bài khoa học."),
        ("HS1222", "Phùng Thế Hiển", "Nam", "2008-08-08", 175, 1, 4, 4, "Tốt", "Giỏi", 8.1, 120, "Nhà Khoa Học Tương Lai", "Phùng Văn Lợi", "0930678901", "loiphung@gmail.com", "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80", "Cận 2.5 độ", "Đam mê thí nghiệm Vật Lý."),
        ("HS1223", "Chu Ngọc Diệp", "Nữ", "2008-11-22", 160, 0, 4, 5, "Tốt", "Khá", 7.9, 115, "Búp Sen Xanh", "Chu Văn Quý", "0931789012", "quychu@gmail.com", "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80", "Bình thường", "Trầm tính, hoàn thành đủ nhiệm vụ."),
        ("HS1224", "Thái Đăng Khoa", "Nam", "2008-01-29", 179, 0, 4, 6, "Khá", "Trung bình", 6.8, 85, "Cần Cải Thiện", "Thái Doãn Hùng", "0932890123", "hungthai@gmail.com", "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80", "Bình thường", "Cần theo sát kiểm tra bài cũ môn Toán."),

        # Hàng 5
        ("HS1225", "Đoàn Diệu Linh", "Nữ", "2008-05-09", 165, 0, 5, 1, "Tốt", "Giỏi", 8.7, 160, "Tổ Trưởng Gương Mẫu", "Đoàn Minh Trí", "0933901234", "tridoan@gmail.com", "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80", "Bình thường", "Tổ trưởng tổ 1 điều hành nhóm rất tốt."),
        ("HS1226", "Lâm Quốc Cường", "Nam", "2008-09-12", 182, 0, 5, 2, "Tốt", "Giỏi", 8.4, 135, "Vận Động Viên Điền Kinh", "Lâm Văn Hiệp", "0934012345", "hieplam@gmail.com", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80", "Cao 1m82, ngồi hàng cuối hợp lý", "Thể lực dồi dào, tinh thần đồng đội cao."),
        ("HS1227", "Tôn Nữ Uyên Phương", "Nữ", "2008-12-01", 163, 1, 5, 3, "Tốt", "Xuất sắc", 9.2, 190, "Thủ Thư Tận Tụy", "Tôn Thất Minh", "0935123456", "minhton@gmail.com", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80", "Cận 1.5 độ", "Đọc sách phong phú, tư duy độc lập."),
        ("HS1228", "Trịnh Hữu Nghĩa", "Nam", "2008-03-16", 180, 0, 5, 4, "Tốt", "Khá", 7.8, 100, "Cần Cố Gắng", "Trịnh Xuân Lộc", "0936234567", "loctrinh@gmail.com", "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80", "Bình thường", "Có tinh thần giúp đỡ bạn bè."),
        ("HS1229", "Quách Kim Ngân", "Nữ", "2008-07-25", 166, 0, 5, 5, "Tốt", "Giỏi", 8.6, 145, "Ngôi Sao Đổi Mới", "Quách Văn Khải", "0937345678", "khaiquach@gmail.com", "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80", "Bình thường", "Sáng tạo trong các bài tập nhóm."),
        ("HS1230", "Ngô Minh Khang", "Nam", "2008-10-14", 183, 0, 5, 6, "Khá", "Khá", 7.5, 95, "Chiến Binh Nỗ Lực", "Ngô Văn Hải", "0938456789", "haingo@gmail.com", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80", "Cao 1m83, ngồi cuối lớp", "Ngoan ngoãn, cần cải thiện tốc độ giải đề.")
    ]

    for s in raw_students:
        cursor.execute("""
            INSERT INTO students (
                student_code, full_name, gender, dob, height_cm, has_glasses,
                seat_row, seat_col, conduct, academic_rank, gpa, gamified_points,
                badge, parent_name, parent_phone, parent_email, avatar, health_notes, teacher_notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, s)

    # 3. Seed Attendance Records for Today and Past 2 Days
    today = datetime.now().strftime("%Y-%m-%d")
    yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
    day_before = (datetime.now() - timedelta(days=2)).strftime("%Y-%m-%d")

    # Seed attendance for all 30 students today
    for sid in range(1, 31):
        # Student 6 was late, Student 16 was excused absent today
        if sid == 6:
            st = "late"
            nt = "Đến lớp muộn 15 phút do hỏng xe đạp điện"
        elif sid == 16:
            st = "excused"
            nt = "Nghỉ ốm sốt siêu vi, PH đã nộp đơn"
        elif sid == 24:
            st = "unexcused"
            nt = "Chưa có mặt đầu giờ, GVCN đã kích hoạt thông báo tự động"
        else:
            st = "present"
            nt = "Đúng giờ"

        cursor.execute("""
            INSERT INTO attendance_logs (student_id, date, session, status, note, recorded_by)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (sid, today, "Sáng", st, nt, "monitor" if sid > 15 else "teacher"))

        # Past days attendance
        cursor.execute("""
            INSERT INTO attendance_logs (student_id, date, session, status, note, recorded_by)
            VALUES (?, ?, ?, 'present', 'Có mặt đầy đủ', 'teacher')
        """, (sid, yesterday, "Sáng"))

    # 4. Seed Gamified Points History (Gamification Engine)
    points_seed = [
        (1, 10, "Điều hành sinh hoạt lớp xuất sắc", "hoạt động", "teacher"),
        (1, 5, "Xung phong giải bài tập Toán nâng cao", "học tập", "monitor"),
        (2, 10, "Đạt 10 điểm kiểm tra 1 tiết Tiếng Anh", "học tập", "teacher"),
        (2, 5, "Giúp đỡ bạn bàn bên hiểu bài Hóa", "nề nếp", "monitor"),
        (3, 10, "Giải bài toán khó trên bảng", "học tập", "teacher"),
        (6, -5, "Đi học muộn và quên sách giáo khoa", "nề nếp", "monitor"),
        (6, -5, "Không thuộc bài cũ môn Hóa", "học tập", "teacher"),
        (7, 10, "Bài viết Văn đạt giải Nhì cấp trường", "học tập", "teacher"),
        (10, 10, "Ghi bàn thắng quyết định giải bóng rổ trường", "hoạt động", "teacher"),
        (15, 10, "Hoàn thành xuất sắc nhiệm vụ đội tuyển", "học tập", "teacher"),
        (16, -5, "Nói chuyện riêng nhiều lần trong giờ sinh hoạt", "nề nếp", "monitor"),
        (20, 5, "Tích cực trực nhật lớp sạch sẽ", "nề nếp", "monitor"),
        (24, -10, "Vắng học không phép đầu giờ", "nề nếp", "teacher")
    ]
    for p in points_seed:
        cursor.execute("""
            INSERT INTO gamified_points_logs (student_id, points, reason, category, recorded_by)
            VALUES (?, ?, ?, ?, ?)
        """, p)

    # 5. Seed Academic Grades (Academic & Conduct Controller)
    subjects = ["Toán", "Ngữ Văn", "Tiếng Anh", "Vật Lý", "Hóa Học"]
    for sid in range(1, 31):
        base_score = 8.5
        if sid in [1, 2, 7, 12, 15, 21, 27]:
            base_score = 9.2
        elif sid in [5, 11, 14, 18, 20, 23, 28, 30]:
            base_score = 7.8
        elif sid in [6, 16, 24]:
            base_score = 6.0 # At-risk students!

        for idx, sub in enumerate(subjects):
            # simulate slight subject variance
            diff = (idx % 3 - 1) * 0.4
            score = round(min(10.0, max(4.0, base_score + diff)), 1)
            
            warning = 1 if (sid in [6, 24] and sub in ["Hóa Học", "Tiếng Anh", "Toán"]) else 0
            trend = "down" if warning else ("up" if score >= 9.0 else "stable")

            tx1 = score
            tx2 = round(max(4.0, score - 0.3 if warning else score + 0.2), 1)
            gk = round(max(4.0, score - 0.7 if warning else score), 1)
            ck = round(max(4.0, score - 0.5 if warning else score + 0.1), 1)
            avg = round((tx1 + tx2 + gk * 2 + ck * 3) / 7.0, 1)

            cursor.execute("""
                INSERT INTO academic_grades (student_id, subject, tx1, tx2, gk, ck, average, trend, warning_flag)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (sid, sub, tx1, tx2, gk, ck, avg, trend, warning))

    # 6. Seed AI Reports (AI Report Writer Engine)
    ai_reports_seed = [
        (1, "Học kỳ 1 - 2026", "motivational", 
         "Em Nguyễn Đức Huy thể hiện vai trò Lớp Trưởng vô cùng xuất sắc. Điểm trung bình học tập 9.4 dẫn đầu lớp, nề nếp gương mẫu, hòa nhã với bạn bè. Đề xuất tiếp tục phát huy năng lực lãnh đạo và tự tin tham gia kỳ thi Học sinh giỏi Quốc Gia.",
         "Năng lực lãnh đạo xuất sắc, tư duy logic nhạy bén, tinh thần trách nhiệm cao.",
         "Cần cân đối thời gian giữa hoạt động Đoàn đội và nghỉ ngơi để duy trì phong độ.",
         "Duy trì vị trí Top 1 của lớp, làm hạt nhân thúc đẩy các phong trào tự học."),
        (2, "Học kỳ 1 - 2026", "constructive",
         "Trần Bảo Ngọc là học sinh chăm chỉ, cầu tiến và có trách nhiệm cao trong vai trò Lớp phó học tập. Điểm số các môn tự nhiên và Ngoại ngữ đều đạt loại Xuất sắc (GPA 9.2). Em luôn chủ động hỗ trợ các bạn cùng bàn.",
         "Thái độ học tập nghiêm túc, tỉ mỉ, khả năng tự học và ghi nhớ rất tốt.",
         "Cần tích cực phát biểu xây dựng bài hơn nữa trên lớp để rèn luyện sự tự tin trước đám đông.",
         "Đặt mục tiêu đạt chứng chỉ IELTS 7.5 trong học kỳ tới."),
        (6, "Học kỳ 1 - 2026", "strict",
         "Em Phạm Minh Trí có tố chất thông minh nhưng thiếu tập trung trong giai đoạn gần đây. Điểm số môn Tiếng Anh và Hóa Học có xu hướng giảm rõ rệt (cảnh báo nguy cơ học lực giảm sút). Cần chấn chỉnh ngay việc đi học muộn và nộp bài tập đúng hạn.",
         "Khả năng tiếp thu nhanh khi tập trung, có tinh thần tương thân tương ái.",
         "Thường xuyên mất tập trung trong giờ học, còn vi phạm đi trễ, bài vở chưa chu đáo.",
         "GVCN xếp em ngồi bàn 1 cạnh Lớp trưởng để kèm cặp; gia đình phối hợp kiểm tra góc học tập tại nhà mỗi tối.")
    ]
    for rep in ai_reports_seed:
        cursor.execute("""
            INSERT INTO ai_reports (student_id, term, tone, generated_text, strengths, areas_for_improvement, action_plan, approved_by_teacher)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        """, rep)

    # 7. Seed Parent Communication Logs (Parent Communication Worker)
    comm_seed = [
        (6, "Zalo Oa", "0918776655 (Mẹ Thảo)", "Cảnh báo vắng học & đi muộn", "Kính gửi Phụ huynh em Phạm Minh Trí: Sáng nay em Trí đến lớp muộn 15 phút. Nhờ gia đình nhắc nhở em chuẩn bị đi học sớm hơn.", "Đã gửi", "Vắng học khẩn cấp"),
        (24, "SMS Gateway", "0932890123 (Bố Hùng)", "Khẩn: Học sinh vắng mặt chưa rõ lý do", "Kính gửi Phụ huynh em Thái Đăng Khoa: Hệ thống điểm danh ghi nhận em Khoa chưa có mặt tại lớp tiết 1 sáng nay. Xin vui lòng phản hồi GVCN.", "Đã gửi", "Vắng học khẩn cấp"),
        (1, "Zalo Oa", "0912345678 (Bố Hùng)", "Tuyên dương tuần", "Chúc mừng gia đình: Em Nguyễn Đức Huy vừa được cộng 15 điểm thi đua và nhận danh hiệu Lớp Trưởng Gương Mẫu tuần này!", "Đã gửi", "Khen thưởng"),
        (2, "Cổng Phụ Huynh", "0987654321 (Bố Nam)", "Báo cáo tiến độ học tập tháng 10/2026", "Báo cáo học tập định kỳ của em Trần Bảo Ngọc đã sẵn sàng trên cổng thông tin. GPA hiện tại: 9.2, xếp hạng 2/30.", "Đã gửi", "Báo cáo tuần")
    ]
    for c in comm_seed:
        cursor.execute("""
            INSERT INTO parent_communications (student_id, channel, recipient, subject, message, status, trigger_type)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, c)

    # 8. Seed Absence Requests (Cổng Phụ Huynh)
    cursor.execute("""
        INSERT INTO absence_requests (student_id, parent_name, from_date, to_date, reason, status, teacher_reply)
        VALUES (16, 'Trịnh Xuân Hải', ?, ?, 'Em bị sốt virus cần đi khám tại bệnh viện Nhi Đồng, xin phép cô cho em nghỉ học 1 ngày.', 'approved', 'Cô đã nhận đơn và đồng ý. Chúc em mau khỏe, bài tập cô đã gửi qua bạn Trịnh Anh Tuấn.')
    """, (today, today))

    conn.commit()
    conn.close()

if __name__ == "__main__":
    seed_database(force=True)
    print("Database seeded successfully!")
