/**
 * Class Monitor Portal Controller (Ban Cán Sự Lớp 11A5 - 3 Vai Trò Mod)
 * 1. ⭐ Lớp Trưởng (Mod điều hành chung & thi đua)
 * 2. 📚 Lớp Phó Học Tập (Mod theo dõi học tập & điểm số)
 * 3. ⚖️ Lớp Phó Nề Nếp & Kỷ Luật (Mod theo dõi nề nếp & chuyên cần)
 * 
 * Toàn quyền sửa, xóa, cập nhật thông tin tình hình các bạn trong lớp.
 */
const MonitorPortal = {
  currentSubTab: 'attendance', // 'attendance', 'discipline', 'grades', 'notes'

  switchSubTab(tab) {
    this.currentSubTab = tab;
    this.render();
  },

  async render() {
    const container = document.getElementById('monitor-portal-container');
    if (!container) return;

    try {
      const loggedUser = API.currentUser;
      const officerName = loggedUser ? loggedUser.full_name : 'Cán Sự Lớp (Mod)';
      const officerDuty = (loggedUser && loggedUser.duty) ? loggedUser.duty : 'Ban Cán Sự Lớp (Mod)';

      container.innerHTML = `
        <div class="space-y-6">
          
          <!-- Banner for Class Mods -->
          <div class="p-6 bg-gradient-to-r from-amber-950/50 via-slate-900 to-indigo-950/40 rounded-2xl border border-amber-500/30 flex flex-wrap items-center justify-between gap-4 shadow-xl">
            <div>
              <div class="flex items-center space-x-3">
                <span class="text-3xl">🎖️ ⭐</span>
                <div>
                  <h3 class="text-xl font-bold text-white flex items-center space-x-2">
                    <span>Cổng Ban Cán Sự Lớp 11A5 (Quyền Mod)</span>
                    <span class="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">Quyền Quản Lý & Cập Nhật</span>
                  </h3>
                  <p class="text-xs text-slate-300 mt-1">
                    Cán bộ đang trực tuyến: <strong class="text-amber-300 font-bold">${officerDuty} • ${officerName}</strong>
                  </p>
                </div>
              </div>
            </div>

            <!-- 3 Mod Roles Badges -->
            <div class="flex flex-wrap gap-2 text-xs">
              <span class="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30 font-medium">
                ⭐ Lớp Trưởng
              </span>
              <span class="px-2.5 py-1 rounded-xl bg-sky-500/10 text-sky-300 border border-sky-500/30 font-medium">
                📚 Lớp Phó Học Tập
              </span>
              <span class="px-2.5 py-1 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/30 font-medium">
                ⚖️ Lớp Phó Nề Nếp
              </span>
            </div>
          </div>

          <!-- Mod Subtabs Navigation -->
          <div class="flex flex-wrap gap-2 p-1.5 bg-slate-800/80 rounded-2xl border border-slate-700">
            <button onclick="MonitorPortal.switchSubTab('attendance')" 
                    class="px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${this.currentSubTab === 'attendance' ? 'bg-amber-500 text-slate-950 shadow-lg' : 'text-slate-300 hover:text-white hover:bg-slate-700/50'}">
              <i class="fa-solid fa-clipboard-check"></i>
              <span>1. Điểm Danh & Chuyên Cần</span>
            </button>
            <button onclick="MonitorPortal.switchSubTab('discipline')" 
                    class="px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${this.currentSubTab === 'discipline' ? 'bg-amber-500 text-slate-950 shadow-lg' : 'text-slate-300 hover:text-white hover:bg-slate-700/50'}">
              <i class="fa-solid fa-scale-balanced"></i>
              <span>2. Nề Nếp & Sổ Cờ Đỏ</span>
            </button>
            <button onclick="MonitorPortal.switchSubTab('grades')" 
                    class="px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${this.currentSubTab === 'grades' ? 'bg-amber-500 text-slate-950 shadow-lg' : 'text-slate-300 hover:text-white hover:bg-slate-700/50'}">
              <i class="fa-solid fa-graduation-cap"></i>
              <span>3. Bảng Điểm & Học Tập (LP Học Tập & Mod)</span>
            </button>
            <button onclick="MonitorPortal.switchSubTab('notes')" 
                    class="px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${this.currentSubTab === 'notes' ? 'bg-amber-500 text-slate-950 shadow-lg' : 'text-slate-300 hover:text-white hover:bg-slate-700/50'}">
              <i class="fa-solid fa-user-pen"></i>
              <span>4. Cập Nhật Tình Hình Các Bạn</span>
            </button>
          </div>

          <!-- Subtab Pane Content -->
          <div id="monitor-subtab-pane">
            ${await this.renderSubTabContent()}
          </div>

        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="p-6 text-center text-rose-400">Lỗi Cổng Cán Sự Lớp: ${err.message}</div>`;
    }
  },

  async renderSubTabContent() {
    switch (this.currentSubTab) {
      case 'attendance':
        return await this.renderAttendanceTab();
      case 'discipline':
        return await this.renderDisciplineTab();
      case 'grades':
        return await this.renderGradesTab();
      case 'notes':
        return await this.renderNotesTab();
      default:
        return await this.renderAttendanceTab();
    }
  },

  // ==============================================================
  // 1. ATTENDANCE SUBTAB (Điểm danh 1-chạm & Sửa / Xóa bản ghi)
  // ==============================================================
  async renderAttendanceTab() {
    const todayAtt = await API.getTodayAttendance();
    const records = todayAtt.records || [];

    return `
      <div class="space-y-6 animate-in fade-in duration-200">
        
        <!-- Quick 1-touch Attendance -->
        <div class="bg-slate-800/80 rounded-2xl border border-slate-700 p-5 shadow-xl">
          <div class="flex flex-wrap items-center justify-between mb-4 pb-3 border-b border-slate-700 gap-3">
            <div>
              <h4 class="font-bold text-sm text-white flex items-center">
                <i class="fa-solid fa-list-check text-amber-400 mr-2"></i> Điểm Danh Đầu Giờ Tiết 1 - Lớp 11A5
              </h4>
              <p class="text-xs text-slate-400 mt-0.5">Hôm nay: <strong class="text-amber-300">${todayAtt.date}</strong> • Sĩ số: ${todayAtt.total} học sinh</p>
            </div>
            <div class="flex items-center space-x-3 text-xs">
              <span class="text-emerald-400 font-semibold"><i class="fa-solid fa-circle-check mr-1"></i>${todayAtt.stats.present} Có mặt</span>
              <span class="text-amber-400 font-semibold"><i class="fa-solid fa-clock mr-1"></i>${todayAtt.stats.late} Muộn</span>
              <span class="text-rose-400 font-semibold"><i class="fa-solid fa-circle-xmark mr-1"></i>${todayAtt.stats.unexcused} Vắng</span>
            </div>
          </div>

          ${records.length === 0 ? `
            <div class="p-8 text-center bg-slate-900/60 rounded-xl border border-slate-700/60 space-y-2">
              <i class="fa-solid fa-users-slash text-2xl text-slate-500"></i>
              <div class="text-xs text-slate-400">Lớp 11A5 hiện chưa có học sinh nào đăng ký.</div>
              <p class="text-[11px] text-slate-500">Khi các bạn tạo tài khoản, danh sách sẽ tự động xuất hiện tại đây.</p>
            </div>
          ` : `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              ${records.map(r => `
                <div class="p-3 bg-slate-900/70 rounded-xl border border-slate-700/60 flex items-center justify-between hover:border-slate-600 transition">
                  <div class="flex items-center space-x-2.5 truncate">
                    <img src="${r.avatar}" class="w-8 h-8 rounded-full object-cover border border-slate-600 flex-shrink-0" alt="">
                    <div class="truncate">
                      <div class="font-bold text-white text-xs truncate">${r.full_name}</div>
                      <div class="text-[10px] text-slate-400">Hàng ${r.seat_row}, Ghế ${r.seat_col} • ${r.student_code}</div>
                    </div>
                  </div>

                  <div class="flex items-center space-x-1 flex-shrink-0 ml-2">
                    <button onclick="MonitorPortal.quickMark(${r.student_id}, 'present')" 
                            title="Có mặt đúng giờ"
                            class="w-7 h-7 rounded-lg text-xs flex items-center justify-center transition ${r.status === 'present' ? 'bg-emerald-600 text-white font-bold shadow' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}">
                      ✓
                    </button>
                    <button onclick="MonitorPortal.quickMark(${r.student_id}, 'late')" 
                            title="Đi học muộn"
                            class="w-7 h-7 rounded-lg text-xs flex items-center justify-center transition ${r.status === 'late' ? 'bg-amber-600 text-white font-bold shadow' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}">
                      M
                    </button>
                    <button onclick="MonitorPortal.quickMark(${r.student_id}, 'unexcused')" 
                            title="Vắng không phép"
                            class="w-7 h-7 rounded-lg text-xs flex items-center justify-center transition ${r.status === 'unexcused' ? 'bg-rose-600 text-white font-bold shadow animate-pulse' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}">
                      V
                    </button>
                    <button onclick="MonitorPortal.openEditAttendanceModal(${r.student_id}, '${r.full_name}', '${r.status}', '${r.note || ''}')"
                            title="Sửa chi tiết & ghi chú"
                            class="w-7 h-7 rounded-lg text-xs bg-slate-800 text-slate-300 hover:bg-indigo-600 hover:text-white flex items-center justify-center transition">
                      <i class="fa-solid fa-pen text-[10px]"></i>
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>

      </div>
    `;
  },

  // ==============================================================
  // 2. DISCIPLINE SUBTAB (Sổ cờ đỏ, chấm điểm, thu hồi điểm)
  // ==============================================================
  async renderDisciplineTab() {
    const leaderboard = await API.getLeaderboard();
    const recentLogs = leaderboard.recent_activity || [];

    return `
      <div class="space-y-6 animate-in fade-in duration-200">
        
        <!-- Preset Action Cards -->
        <div class="bg-slate-800/80 rounded-2xl border border-slate-700 p-5 shadow-xl">
          <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-700">
            <h4 class="font-bold text-sm text-white flex items-center">
              <i class="fa-solid fa-feather text-amber-400 mr-2"></i> Ghi Nhận Nề Nếp & Thi Đua Nhanh (Sổ Cờ Đỏ Lớp 11A5)
            </h4>
            <span class="text-xs text-amber-300 font-semibold"><i class="fa-solid fa-shield-halved mr-1"></i>Quyền Mod Lớp</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Preset 1: Positive -->
            <div class="p-4 bg-emerald-950/30 rounded-xl border border-emerald-500/30">
              <h5 class="text-xs font-bold text-emerald-300 uppercase mb-2 flex items-center">
                <i class="fa-solid fa-circle-plus mr-1.5"></i> Cộng Điểm Tích Cực (+5 / +10)
              </h5>
              <div class="space-y-2">
                <button onclick="MonitorPortal.promptDiscipline(5, 'Phát biểu sôi nổi xây dựng bài', 'học tập')" 
                        class="w-full text-left p-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-200 rounded-lg text-xs border border-emerald-500/20 transition flex items-center justify-between">
                  <span>+5đ • Xung phong phát biểu bài</span>
                  <i class="fa-solid fa-chevron-right text-[10px] text-emerald-400"></i>
                </button>
                <button onclick="MonitorPortal.promptDiscipline(10, 'Đạt điểm 10 kiểm tra miệng / bảng', 'học tập')" 
                        class="w-full text-left p-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-200 rounded-lg text-xs border border-emerald-500/20 transition flex items-center justify-between">
                  <span>+10đ • Điểm 10 miệng / giải bài khó</span>
                  <i class="fa-solid fa-chevron-right text-[10px] text-emerald-400"></i>
                </button>
                <button onclick="MonitorPortal.promptDiscipline(5, 'Trực nhật lớp sạch sẽ, đúng giờ', 'nề nếp')" 
                        class="w-full text-left p-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-200 rounded-lg text-xs border border-emerald-500/20 transition flex items-center justify-between">
                  <span>+5đ • Trực nhật lớp sạch sẽ</span>
                  <i class="fa-solid fa-chevron-right text-[10px] text-emerald-400"></i>
                </button>
              </div>
            </div>

            <!-- Preset 2: Violation -->
            <div class="p-4 bg-rose-950/30 rounded-xl border border-rose-500/30">
              <h5 class="text-xs font-bold text-rose-300 uppercase mb-2 flex items-center">
                <i class="fa-solid fa-circle-minus mr-1.5"></i> Trừ Điểm Vi Phạm (-3 / -5)
              </h5>
              <div class="space-y-2">
                <button onclick="MonitorPortal.promptDiscipline(-5, 'Đi học muộn đầu giờ', 'nề nếp')" 
                        class="w-full text-left p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-200 rounded-lg text-xs border border-rose-500/20 transition flex items-center justify-between">
                  <span>-5đ • Đi học muộn đầu giờ</span>
                  <i class="fa-solid fa-chevron-right text-[10px] text-rose-400"></i>
                </button>
                <button onclick="MonitorPortal.promptDiscipline(-3, 'Mất trật tự trong giờ học', 'nề nếp')" 
                        class="w-full text-left p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-200 rounded-lg text-xs border border-rose-500/20 transition flex items-center justify-between">
                  <span>-3đ • Mất trật tự / nói chuyện riêng</span>
                  <i class="fa-solid fa-chevron-right text-[10px] text-rose-400"></i>
                </button>
                <button onclick="MonitorPortal.promptDiscipline(-5, 'Quên sách giáo khoa / không làm bài tập', 'học tập')" 
                        class="w-full text-left p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-200 rounded-lg text-xs border border-rose-500/20 transition flex items-center justify-between">
                  <span>-5đ • Quên bài tập / tài liệu học</span>
                  <i class="fa-solid fa-chevron-right text-[10px] text-rose-400"></i>
                </button>
              </div>
            </div>

            <!-- Preset 3: Custom Award -->
            <div class="p-4 bg-slate-900/60 rounded-xl border border-slate-700 flex flex-col justify-center items-center text-center">
              <i class="fa-solid fa-pen-to-square text-amber-400 text-3xl mb-2"></i>
              <h5 class="text-xs font-bold text-white">Ghi Nhận Tự Do</h5>
              <p class="text-[11px] text-slate-400 mt-1 mb-3">Tự nhập số điểm và lý do theo dõi cờ đỏ cụ thể</p>
              <button onclick="TeacherDashboard.batchAwardModal()" class="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition">
                <i class="fa-solid fa-plus-circle mr-1"></i> Mở Form Tùy Chỉnh
              </button>
            </div>
          </div>
        </div>

        <!-- Recent Logs Table with Revoke/Delete Button -->
        <div class="bg-slate-800/80 rounded-2xl border border-slate-700 p-5 shadow-xl">
          <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-700">
            <h4 class="font-bold text-sm text-white flex items-center">
              <i class="fa-solid fa-clock-rotate-left text-indigo-400 mr-2"></i> Nhật Ký Ghi Nhận Điểm Nề Nếp Gần Đây
            </h4>
            <span class="text-xs text-slate-400">Cán sự lớp có quyền thu hồi / xóa lượt ghi nhận sai sót</span>
          </div>

          ${recentLogs.length === 0 ? `
            <div class="p-6 text-center text-xs text-slate-400">Chưa có lượt ghi nhận nề nếp nào.</div>
          ` : `
            <div class="overflow-x-auto">
              <table class="w-full text-xs text-left">
                <thead class="bg-slate-900/60 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th class="py-2.5 px-3">Học Sinh</th>
                    <th class="py-2.5 px-3 text-center">Điểm</th>
                    <th class="py-2.5 px-3">Lý Do / Tiêu Chí</th>
                    <th class="py-2.5 px-3 text-center">Người ghi nhận</th>
                    <th class="py-2.5 px-3 text-right">Thao Tác Mod</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-700/60">
                  ${recentLogs.map(log => `
                    <tr class="hover:bg-slate-700/30 transition">
                      <td class="py-2.5 px-3">
                        <div class="flex items-center space-x-2">
                          <img src="${log.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=st'}" class="w-7 h-7 rounded-full object-cover border border-slate-600" alt="">
                          <span class="font-bold text-white">${log.student_name}</span>
                        </div>
                      </td>
                      <td class="py-2.5 px-3 text-center font-bold ${log.points > 0 ? 'text-emerald-400' : 'text-rose-400'}">
                        ${log.points > 0 ? `+${log.points}` : log.points}đ
                      </td>
                      <td class="py-2.5 px-3 text-slate-300">
                        ${log.reason}
                        <span class="text-[10px] text-slate-500 block">${log.category} • ${log.created_at || ''}</span>
                      </td>
                      <td class="py-2.5 px-3 text-center text-slate-400 text-[11px]">
                        ${log.recorded_by || 'Cán sự'}
                      </td>
                      <td class="py-2.5 px-3 text-right">
                        <button onclick="MonitorPortal.deleteGamificationLog(${log.id})" 
                                class="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-semibold transition"
                                title="Thu hồi / xóa bản ghi điểm này">
                          <i class="fa-solid fa-trash-can mr-1"></i> Thu hồi
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>

      </div>
    `;
  },

  // ==============================================================
  // 3. GRADES SUBTAB (Bảng điểm 5 môn & Sửa điểm - Lớp Phó Học Tập)
  // ==============================================================
  async renderGradesTab() {
    const studentsWithGrades = await API.getAllGrades();

    return `
      <div class="space-y-6 animate-in fade-in duration-200">
        
        <div class="bg-slate-800/80 rounded-2xl border border-slate-700 p-5 shadow-xl">
          <div class="flex flex-wrap items-center justify-between mb-4 pb-3 border-b border-slate-700 gap-3">
            <div>
              <h4 class="font-bold text-sm text-white flex items-center">
                <i class="fa-solid fa-graduation-cap text-sky-400 mr-2"></i> Bảng Điểm 5 Môn Học Lớp 11A5 (Dành cho Lớp Phó Học Tập & Mod)
              </h4>
              <p class="text-xs text-slate-400 mt-0.5">Nhấp nút <strong class="text-sky-300">Sửa Điểm</strong> để cập nhật TX1, TX2, Giữa kỳ, Cuối kỳ. Hệ thống tự động tính lại GPA và Xếp loại.</p>
            </div>
            <span class="px-3 py-1 bg-sky-500/10 text-sky-300 border border-sky-500/30 rounded-xl text-xs font-semibold">
              <i class="fa-solid fa-calculator mr-1"></i> Công thức: (TX1 + TX2 + GK*2 + CK*3) / 7
            </span>
          </div>

          ${studentsWithGrades.length === 0 ? `
            <div class="p-8 text-center text-slate-400 text-xs">Chưa có dữ liệu học sinh trong lớp 11A5.</div>
          ` : `
            <div class="overflow-x-auto">
              <table class="w-full text-xs text-left">
                <thead class="bg-slate-900/60 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th class="py-3 px-3">Học Sinh</th>
                    <th class="py-3 px-2 text-center">Toán</th>
                    <th class="py-3 px-2 text-center">Ngữ Văn</th>
                    <th class="py-3 px-2 text-center">Tiếng Anh</th>
                    <th class="py-3 px-2 text-center">Vật Lý</th>
                    <th class="py-3 px-2 text-center">Hóa Học</th>
                    <th class="py-3 px-2 text-center">GPA</th>
                    <th class="py-3 px-2 text-center">Xếp Loại</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-700/60">
                  ${studentsWithGrades.map(st => {
                    const subjects = st.subjects || [];
                    const getSub = name => subjects.find(s => s.subject === name) || {};
                    return `
                      <tr class="hover:bg-slate-700/30 transition">
                        <td class="py-3 px-3 font-medium text-white">
                          <div class="font-bold">${st.full_name}</div>
                          <div class="text-[10px] text-slate-400">${st.student_code} • Hàng ${st.seat_row}, Ghế ${st.seat_col}</div>
                        </td>
                        ${["Toán", "Ngữ Văn", "Tiếng Anh", "Vật Lý", "Hóa Học"].map(sname => {
                          const sub = getSub(sname);
                          const avg = sub.average !== undefined ? sub.average : '-';
                          const gradeId = sub.id || 0;
                          return `
                            <td class="py-3 px-2 text-center">
                              <button onclick="MonitorPortal.openEditGradeModal(${gradeId}, '${st.full_name}', '${sname}', ${sub.tx1 || 0}, ${sub.tx2 || 0}, ${sub.gk || 0}, ${sub.ck || 0})" 
                                      class="px-2 py-1 bg-slate-900 hover:bg-sky-600/30 text-white rounded-lg border border-slate-700 hover:border-sky-500/50 transition group"
                                      title="Nhấp để sửa điểm môn ${sname}">
                                <span class="font-bold ${avg >= 8.0 ? 'text-emerald-400' : (avg < 6.5 ? 'text-rose-400' : 'text-amber-400')}">${avg}</span>
                                <i class="fa-solid fa-pen text-[9px] text-slate-500 group-hover:text-sky-300 ml-1"></i>
                              </button>
                            </td>
                          `;
                        }).join('')}
                        <td class="py-3 px-2 text-center font-bold text-indigo-400">
                          ${st.gpa}
                        </td>
                        <td class="py-3 px-2 text-center">
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold ${st.academic_rank === 'Xuất sắc' || st.academic_rank === 'Giỏi' ? 'bg-emerald-500/20 text-emerald-300' : (st.academic_rank === 'Khá' ? 'bg-sky-500/20 text-sky-300' : 'bg-amber-500/20 text-amber-300')}">
                            ${st.academic_rank}
                          </span>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>

      </div>
    `;
  },

  // ==============================================================
  // 4. NOTES SUBTAB (Cập nhật tình hình, ghi chú hạnh kiểm các bạn)
  // ==============================================================
  async renderNotesTab() {
    const students = await API.getStudents();

    return `
      <div class="space-y-6 animate-in fade-in duration-200">
        
        <div class="bg-slate-800/80 rounded-2xl border border-slate-700 p-5 shadow-xl">
          <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-700">
            <div>
              <h4 class="font-bold text-sm text-white flex items-center">
                <i class="fa-solid fa-user-pen text-amber-400 mr-2"></i> Cập Nhật Tình Hình & Ghi Chú Học Sinh Lớp 11A5
              </h4>
              <p class="text-xs text-slate-400 mt-0.5">Ban cán sự lớp theo dõi và ghi nhận hạnh kiểm, sức khỏe, phản ánh học tập để báo cáo GVCN.</p>
            </div>
            <span class="text-xs text-amber-300 font-semibold"><i class="fa-solid fa-bolt mr-1"></i>Đồng bộ tức thì</span>
          </div>

          ${students.length === 0 ? `
            <div class="p-8 text-center text-slate-400 text-xs">Chưa có học sinh trong lớp.</div>
          ` : `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${students.map(s => `
                <div class="p-4 bg-slate-900/70 rounded-xl border border-slate-700/60 hover:border-slate-600 transition space-y-3">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                      <img src="${s.avatar}" class="w-10 h-10 rounded-full object-cover border border-slate-600" alt="">
                      <div>
                        <div class="font-bold text-white text-sm">${s.full_name}</div>
                        <div class="text-[11px] text-slate-400">${s.student_code} • Bàn ${s.seat_row}-${s.seat_col} • Hạnh kiểm: <strong class="text-emerald-400">${s.conduct}</strong></div>
                      </div>
                    </div>
                    <button onclick="MonitorPortal.openEditNotesModal(${s.id}, '${s.full_name}', '${s.conduct || 'Tốt'}', '${s.health_notes || ''}', '${s.teacher_notes || ''}')"
                            class="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5">
                      <i class="fa-solid fa-pen-to-square"></i>
                      <span>Cập nhật</span>
                    </button>
                  </div>

                  <div class="bg-slate-800/60 p-2.5 rounded-lg text-xs space-y-1">
                    <div><span class="text-slate-400">Tình hình / Ghi chú nề nếp:</span> <span class="text-slate-200">${s.teacher_notes || '<em class="text-slate-500">Chưa có ghi chú</em>'}</span></div>
                    <div><span class="text-slate-400">Sức khỏe:</span> <span class="text-slate-200">${s.health_notes || 'Bình thường'}</span></div>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>

      </div>
    `;
  },

  // ==============================================================
  // ACTIONS & MODALS
  // ==============================================================

  async quickMark(studentId, status) {
    try {
      const res = await API.quickMarkAttendance(studentId, status);
      showToast(res.message, 'success');
      this.render();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  },

  openEditAttendanceModal(studentId, studentName, currentStatus, currentNote) {
    const existing = document.getElementById('mod-edit-att-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'mod-edit-att-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200';
    modal.innerHTML = `
      <div class="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 class="font-bold text-white text-sm flex items-center">
            <i class="fa-solid fa-pen-to-square text-amber-400 mr-2"></i> Cập Nhật Điểm Danh: ${studentName}
          </h3>
          <button onclick="document.getElementById('mod-edit-att-modal').remove()" class="text-slate-400 hover:text-white">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="space-y-3">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Trạng thái:</label>
            <select id="mod-att-status" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white">
              <option value="present" ${currentStatus === 'present' ? 'selected' : ''}>✓ Có mặt đúng giờ</option>
              <option value="late" ${currentStatus === 'late' ? 'selected' : ''}>⏰ Đi học muộn</option>
              <option value="excused" ${currentStatus === 'excused' ? 'selected' : ''}>📝 Nghỉ có phép</option>
              <option value="unexcused" ${currentStatus === 'unexcused' ? 'selected' : ''}>❌ Vắng không phép</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Ghi chú chuyên cần / lý do:</label>
            <input type="text" id="mod-att-note" value="${currentNote}" placeholder="Ví dụ: Đi muộn 15p do hỏng xe..." class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white">
          </div>
        </div>

        <div class="flex justify-end space-x-2 pt-3 border-t border-slate-800">
          <button onclick="document.getElementById('mod-edit-att-modal').remove()" class="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs hover:bg-slate-700">Hủy</button>
          <button onclick="MonitorPortal.submitEditAttendance(${studentId})" class="px-4 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-400">Lưu Điểm Danh</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },

  async submitEditAttendance(studentId) {
    const status = document.getElementById('mod-att-status').value;
    const note = document.getElementById('mod-att-note').value.trim();

    try {
      const res = await API.quickMarkAttendance(studentId, status, note);
      showToast(res.message, 'success');
      document.getElementById('mod-edit-att-modal')?.remove();
      this.render();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  },

  async promptDiscipline(points, reason, category) {
    const students = await API.getStudents();
    if (students.length === 0) {
      alert('Lớp học chưa có học sinh nào.');
      return;
    }

    const studentName = prompt(`Chọn học sinh ghi nhận "${reason}" (${points > 0 ? '+' : ''}${points}đ):\nNhập họ tên hoặc mã học sinh (ví dụ: 'An' hoặc 'HS01'):`);
    if (!studentName) return;

    const matched = students.find(s => s.full_name.toLowerCase().includes(studentName.toLowerCase()) || s.student_code.toLowerCase().includes(studentName.toLowerCase()));
    if (!matched) {
      alert(`Không tìm thấy học sinh với từ khóa "${studentName}"`);
      return;
    }

    try {
      const res = await API.awardPoints(matched.id, points, reason, category);
      showToast(res.message, 'success');
      this.render();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  },

  async deleteGamificationLog(logId) {
    if (!confirm('Bạn có chắc muốn thu hồi / xóa lượt ghi nhận điểm thi đua này không?')) return;
    try {
      const res = await API.deleteGamificationLog(logId);
      showToast(res.message, 'success');
      this.render();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  },

  openEditGradeModal(gradeId, studentName, subjectName, tx1, tx2, gk, ck) {
    const existing = document.getElementById('mod-edit-grade-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'mod-edit-grade-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200';
    modal.innerHTML = `
      <div class="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 class="font-bold text-white text-sm flex items-center">
              <i class="fa-solid fa-graduation-cap text-sky-400 mr-2"></i> Cập Nhật Điểm: ${studentName}
            </h3>
            <p class="text-xs text-sky-300 mt-0.5">Môn: <strong>${subjectName}</strong> (Học kỳ 1 - 2026)</p>
          </div>
          <button onclick="document.getElementById('mod-edit-grade-modal').remove()" class="text-slate-400 hover:text-white">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">TX1 (Thường xuyên 1):</label>
            <input type="number" step="0.1" min="0" max="10" id="grade-tx1" value="${tx1}" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">TX2 (Thường xuyên 2):</label>
            <input type="number" step="0.1" min="0" max="10" id="grade-tx2" value="${tx2}" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Giữa kỳ (Hệ số 2):</label>
            <input type="number" step="0.1" min="0" max="10" id="grade-gk" value="${gk}" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Cuối kỳ (Hệ số 3):</label>
            <input type="number" step="0.1" min="0" max="10" id="grade-ck" value="${ck}" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white">
          </div>
        </div>

        <div class="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl text-[11px] text-sky-300 flex items-center space-x-2">
          <i class="fa-solid fa-circle-info text-sky-400"></i>
          <span>Hệ thống sẽ tự động tính lại Điểm Trung Bình môn, GPA toàn diện và Xếp loại học lực.</span>
        </div>

        <div class="flex justify-end space-x-2 pt-3 border-t border-slate-800">
          <button onclick="document.getElementById('mod-edit-grade-modal').remove()" class="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs hover:bg-slate-700">Hủy</button>
          <button onclick="MonitorPortal.submitEditGrade(${gradeId})" class="px-4 py-1.5 bg-sky-600 text-white font-bold rounded-xl text-xs hover:bg-sky-500">Lưu Điểm Số</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },

  async submitEditGrade(gradeId) {
    const tx1 = parseFloat(document.getElementById('grade-tx1').value) || 0;
    const tx2 = parseFloat(document.getElementById('grade-tx2').value) || 0;
    const gk = parseFloat(document.getElementById('grade-gk').value) || 0;
    const ck = parseFloat(document.getElementById('grade-ck').value) || 0;

    try {
      const res = await API.updateGrade(gradeId, { tx1, tx2, gk, ck });
      showToast(res.message, 'success');
      document.getElementById('mod-edit-grade-modal')?.remove();
      this.render();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  },

  openEditNotesModal(studentId, studentName, conduct, healthNotes, teacherNotes) {
    const existing = document.getElementById('mod-edit-notes-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'mod-edit-notes-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200';
    modal.innerHTML = `
      <div class="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 class="font-bold text-white text-sm flex items-center">
            <i class="fa-solid fa-user-pen text-amber-400 mr-2"></i> Cập Nhật Tình Hình: ${studentName}
          </h3>
          <button onclick="document.getElementById('mod-edit-notes-modal').remove()" class="text-slate-400 hover:text-white">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="space-y-3">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Đánh giá hạnh kiểm:</label>
            <select id="notes-conduct" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white">
              <option value="Tốt" ${conduct === 'Tốt' ? 'selected' : ''}>🌟 Tốt</option>
              <option value="Khá" ${conduct === 'Khá' ? 'selected' : ''}>👍 Khá</option>
              <option value="Trung bình" ${conduct === 'Trung bình' ? 'selected' : ''}>⚠️ Trung bình</option>
              <option value="Yếu" ${conduct === 'Yếu' ? 'selected' : ''}>❌ Yếu</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Ghi chú nề nếp / phản ánh của Cán sự:</label>
            <textarea id="notes-teacher" rows="3" placeholder="Nhập tình hình học tập, ý thức trong lớp..." class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white">${teacherNotes}</textarea>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Tình hình sức khỏe (nếu có):</label>
            <input type="text" id="notes-health" value="${healthNotes}" placeholder="Bình thường / Cận thị / Có bệnh lý..." class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white">
          </div>
        </div>

        <div class="flex justify-end space-x-2 pt-3 border-t border-slate-800">
          <button onclick="document.getElementById('mod-edit-notes-modal').remove()" class="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs hover:bg-slate-700">Hủy</button>
          <button onclick="MonitorPortal.submitEditNotes(${studentId})" class="px-4 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-400">Lưu Thông Tin</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },

  async submitEditNotes(studentId) {
    const conduct = document.getElementById('notes-conduct').value;
    const teacher_notes = document.getElementById('notes-teacher').value.trim();
    const health_notes = document.getElementById('notes-health').value.trim();

    try {
      const res = await API.updateStudentNotes(studentId, { conduct, teacher_notes, health_notes });
      showToast(res.message, 'success');
      document.getElementById('mod-edit-notes-modal')?.remove();
      this.render();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }
};
