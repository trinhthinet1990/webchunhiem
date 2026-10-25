/**
 * Class Monitor Portal Controller (Cán sự lớp - Hỗ trợ Điểm danh & Nề nếp)
 * Fast 1-touch attendance check & disciplinary point logger
 */
const MonitorPortal = {
  async render() {
    const container = document.getElementById('monitor-portal-container');
    if (!container) return;

    try {
      const loggedUser = API.currentUser;
      const officerName = loggedUser ? loggedUser.full_name : 'Nguyễn Đức Huy';
      const officerDuty = (loggedUser && loggedUser.duty) ? loggedUser.duty : 'Lớp Trưởng';

      const [todayAtt, leaderboard] = await Promise.all([
        API.getTodayAttendance(),
        API.getLeaderboard()
      ]);

      container.innerHTML = `
        <div class="space-y-6">
          
          <!-- Banner for Monitor -->
          <div class="p-6 bg-gradient-to-r from-amber-950/40 to-slate-900 rounded-2xl border border-amber-500/30 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div class="flex items-center space-x-2">
                <span class="text-2xl">🎖️ ⚡</span>
                <h3 class="text-xl font-bold text-white">Cổng Ban Cán Sự Lớp • Điểm Danh & Nề Nếp</h3>
              </div>
              <p class="text-xs text-slate-300 mt-1">Đang thực hiện nhiệm vụ: <strong class="text-amber-300 font-bold">${officerDuty} • ${officerName}</strong></p>
            </div>
            <div class="flex items-center space-x-3 text-xs">
              <span class="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-lg border border-amber-500/30">
                <i class="fa-solid fa-bolt mr-1"></i> Chế độ điểm danh đầu giờ 1-chạm
              </span>
            </div>
          </div>

          <!-- Quick Attendance Sheet Grid -->
          <div class="bg-slate-800/80 rounded-2xl border border-slate-700 p-5 shadow-xl">
            <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-700">
              <h4 class="font-bold text-sm text-white flex items-center">
                <i class="fa-solid fa-list-check text-amber-400 mr-2"></i> Danh Sách Điểm Danh Đầu Giờ Tiết 1
              </h4>
              <div class="text-xs text-slate-400">
                Hôm nay: <strong class="text-indigo-300">${todayAtt.date}</strong> • Sỉ số: ${todayAtt.total} học sinh
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              ${todayAtt.records.map(r => `
                <div class="p-3 bg-slate-900/70 rounded-xl border border-slate-700/60 flex items-center justify-between">
                  <div class="flex items-center space-x-2.5 truncate">
                    <img src="${r.avatar}" class="w-8 h-8 rounded-full object-cover border border-slate-600 flex-shrink-0" alt="">
                    <div class="truncate">
                      <div class="font-bold text-white text-xs truncate">${r.full_name}</div>
                      <div class="text-[10px] text-slate-400">Hàng ${r.seat_row}, Ghế ${r.seat_col}</div>
                    </div>
                  </div>

                  <div class="flex items-center space-x-1 flex-shrink-0 ml-2">
                    <button onclick="MonitorPortal.quickMark(${r.student_id}, 'present')" 
                            title="Có mặt đúng giờ"
                            class="w-7 h-7 rounded-lg text-xs flex items-center justify-center transition ${r.status === 'present' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}">
                      ✓
                    </button>
                    <button onclick="MonitorPortal.quickMark(${r.student_id}, 'late')" 
                            title="Đi học muộn"
                            class="w-7 h-7 rounded-lg text-xs flex items-center justify-center transition ${r.status === 'late' ? 'bg-amber-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}">
                      M
                    </button>
                    <button onclick="MonitorPortal.quickMark(${r.student_id}, 'unexcused')" 
                            title="Vắng không phép"
                            class="w-7 h-7 rounded-lg text-xs flex items-center justify-center transition ${r.status === 'unexcused' ? 'bg-rose-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}">
                      V
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Quick Disciplinary Point Logger -->
          <div class="bg-slate-800/80 rounded-2xl border border-slate-700 p-5 shadow-xl">
            <h4 class="font-bold text-sm text-white mb-3 flex items-center">
              <i class="fa-solid fa-feather text-amber-400 mr-2"></i> Ghi Nhận Nề Nếp & Thi Đua Nhanh (Sổ Cờ Đỏ)
            </h4>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <!-- Preset 1: Positive -->
              <div class="p-4 bg-emerald-950/30 rounded-xl border border-emerald-500/30">
                <h5 class="text-xs font-bold text-emerald-300 uppercase mb-2">Cộng Điểm Tích Cực (+5 / +10)</h5>
                <div class="space-y-2">
                  <button onclick="MonitorPortal.promptDiscipline(5, 'Phát biểu sôi nổi xây dựng bài', 'học tập')" 
                          class="w-full text-left p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-200 rounded-lg text-xs border border-emerald-500/20 transition">
                    +5đ • Xung phong phát biểu
                  </button>
                  <button onclick="MonitorPortal.promptDiscipline(10, 'Đạt điểm 10 kiểm tra miệng / bảng', 'học tập')" 
                          class="w-full text-left p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-200 rounded-lg text-xs border border-emerald-500/20 transition">
                    +10đ • Điểm 10 miệng hoặc giải bài khó
                  </button>
                  <button onclick="MonitorPortal.promptDiscipline(5, 'Trực nhật lớp sạch sẽ, đúng giờ', 'nề nếp')" 
                          class="w-full text-left p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-200 rounded-lg text-xs border border-emerald-500/20 transition">
                    +5đ • Trực nhật xuất sắc
                  </button>
                </div>
              </div>

              <!-- Preset 2: Violation -->
              <div class="p-4 bg-rose-950/30 rounded-xl border border-rose-500/30">
                <h5 class="text-xs font-bold text-rose-300 uppercase mb-2">Trừ Điểm Vi Phạm (-3 / -5)</h5>
                <div class="space-y-2">
                  <button onclick="MonitorPortal.promptDiscipline(-5, 'Đi học muộn đầu giờ', 'nề nếp')" 
                          class="w-full text-left p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-200 rounded-lg text-xs border border-rose-500/20 transition">
                    -5đ • Đi học muộn
                  </button>
                  <button onclick="MonitorPortal.promptDiscipline(-3, 'Mất trật tự trong giờ học', 'nề nếp')" 
                          class="w-full text-left p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-200 rounded-lg text-xs border border-rose-500/20 transition">
                    -3đ • Nói chuyện riêng / mất trật tự
                  </button>
                  <button onclick="MonitorPortal.promptDiscipline(-5, 'Quên sách giáo khoa / không làm bài tập', 'học tập')" 
                          class="w-full text-left p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-200 rounded-lg text-xs border border-rose-500/20 transition">
                    -5đ • Quên bài tập / tài liệu học
                  </button>
                </div>
              </div>

              <!-- Preset 3: Custom -->
              <div class="p-4 bg-slate-900/60 rounded-xl border border-slate-700 flex flex-col justify-center items-center text-center">
                <i class="fa-solid fa-pen-to-square text-amber-400 text-3xl mb-2"></i>
                <h5 class="text-xs font-bold text-white">Ghi Nhận Tùy Chỉnh</h5>
                <p class="text-[11px] text-slate-400 mt-1 mb-3">Tự nhập số điểm và lý do theo dõi cờ đỏ</p>
                <button onclick="TeacherDashboard.batchAwardModal()" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold border border-slate-600 transition">
                  Mở form ghi nhận tự do
                </button>
              </div>
            </div>
          </div>

        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="p-6 text-center text-rose-400">Lỗi: ${err.message}</div>`;
    }
  },

  async quickMark(studentId, status) {
    try {
      const res = await API.quickMarkAttendance(studentId, status);
      showToast(res.message, 'success');
      this.render();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  },

  async promptDiscipline(points, reason, category) {
    const students = await API.getStudents();
    const studentName = prompt(`Chọn học sinh ghi nhận "${reason}" (${points > 0 ? '+' : ''}${points}đ):\nNhập họ tên hoặc mã học sinh (ví dụ: 'Trí' hoặc 'HS1206'):`);
    if (!studentName) return;

    const matched = students.find(s => s.full_name.toLowerCase().includes(studentName.toLowerCase()) || s.student_code.toLowerCase().includes(studentName.toLowerCase()));
    if (!matched) {
      alert(`Không tìm thấy học sinh với từ khóa "${studentName}"`);
      return;
    }

    try {
      const res = await API.awardPoints(matched.id, points, reason, category);
      showToast(res.message, 'success');
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }
};
