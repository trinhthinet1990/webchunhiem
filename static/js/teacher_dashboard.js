/**
 * Teacher Dashboard Controller (GVCN - Toàn quyền Quản lý)
 * Implements Smart SeatMap, Student 360, Gamification, Attendance, AI Writer & Parent Worker
 */
const TeacherDashboard = {
  draggedStudentId: null,
  currentStudent360Id: null,

  // ==================== 1. SMART SEATMAP ====================
  async renderSeatMap() {
    const container = document.getElementById('seatmap-grid-container');
    if (!container) return;

    try {
      const data = await API.getSeatMap();
      this.drawClassroom(container, data);
    } catch (err) {
      container.innerHTML = `<div class="p-6 text-center text-rose-400">Lỗi tải sơ đồ lớp: ${err.message}</div>`;
    }
  },

  drawClassroom(container, data) {
    const grid = data.grid;
    let html = `
      <!-- Classroom Stage & Blackboard -->
      <div class="mb-6 flex flex-col items-center">
        <div class="chalkboard w-full max-w-2xl py-3 px-8 rounded-xl text-center text-emerald-200 shadow-xl mb-4 border-2 border-amber-900/60">
          <div class="font-bold text-sm tracking-wider uppercase">BẢNG LỚP 12A1 • CHUYÊN BAN TỰ NHIÊN</div>
          <div class="text-[11px] text-emerald-300/80 italic mt-0.5">"Học để biết, học để làm, học để chung sống, học để tự khẳng định mình"</div>
        </div>
        
        <!-- Teacher podium -->
        <div class="teacher-podium px-6 py-2 rounded-lg text-slate-200 text-xs font-semibold shadow flex items-center space-x-2">
          <i class="fa-solid fa-chalkboard-user text-indigo-400"></i>
          <span>BÀN GIÁO VIÊN CHỦ NHIỆM (Cô Hoàng Mai Anh)</span>
        </div>
      </div>

      <!-- 3 Columns of Double Desks (6 cols total) -->
      <div class="grid grid-cols-3 gap-6 max-w-6xl mx-auto">
    `;

    // 3 Double-desk aisles
    const aisles = [
      { name: 'DÃY 1 (Bàn 1 & 2)', cols: [0, 1] },
      { name: 'DÃY 2 (Bàn 3 & 4)', cols: [2, 3] },
      { name: 'DÃY 3 (Bàn 5 & 6)', cols: [4, 5] }
    ];

    aisles.forEach((aisle, aisleIdx) => {
      html += `
        <div class="bg-slate-800/40 p-3.5 rounded-2xl border border-slate-700/50 flex flex-col space-y-3">
          <div class="text-center font-bold text-xs uppercase tracking-wider text-indigo-300 py-1 bg-slate-900/60 rounded-lg">
            ${aisle.name}
          </div>
      `;

      for (let r = 0; r < 5; r++) {
        html += `<div class="grid grid-cols-2 gap-2.5">`;
        aisle.cols.forEach(c => {
          const student = grid[r][c];
          if (student) {
            const statusClass = `status-${student.today_status || 'present'}`;
            const statusBadgeText = {
              'present': 'Có mặt',
              'late': 'Đi muộn',
              'excused': 'Có phép',
              'unexcused': 'Vắng K.phép'
            }[student.today_status || 'present'];

            const statusBadgeBg = {
              'present': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
              'late': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
              'excused': 'bg-sky-500/20 text-sky-300 border-sky-500/30',
              'unexcused': 'bg-rose-500/20 text-rose-300 border-rose-500/30'
            }[student.today_status || 'present'];

            html += `
              <div class="student-seat-card ${statusClass} glass-card p-2.5 rounded-xl border border-slate-700/80 relative group"
                   draggable="true"
                   ondragstart="TeacherDashboard.handleDragStart(event, ${student.id})"
                   ondragover="TeacherDashboard.handleDragOver(event)"
                   ondrop="TeacherDashboard.handleDrop(event, ${student.id})"
                   onclick="TeacherDashboard.openStudent360(${student.id})">
                
                <div class="flex items-center space-x-2">
                  <img src="${student.avatar}" class="w-8 h-8 rounded-full object-cover border border-slate-600 flex-shrink-0" alt="">
                  <div class="truncate">
                    <div class="font-bold text-xs text-white truncate group-hover:text-indigo-300 transition-colors">${student.full_name}</div>
                    <div class="text-[10px] text-slate-400 font-mono">${student.student_code}</div>
                  </div>
                </div>

                <div class="mt-2 flex items-center justify-between text-[10px]">
                  <span class="px-1.5 py-0.5 rounded border ${statusBadgeBg} text-[9px] font-medium">
                    ${statusBadgeText}
                  </span>
                  <div class="flex items-center space-x-1.5 text-slate-300">
                    ${student.has_glasses ? '<span title="Cận thị - Cần ngồi gần bảng" class="text-sky-400 text-xs">👓</span>' : ''}
                    <span class="font-bold text-amber-400 text-[11px]">${student.gpa}</span>
                  </div>
                </div>

                <div class="mt-1 flex items-center justify-between text-[9px] text-slate-400 border-t border-slate-700/40 pt-1">
                  <span>Hàng ${r+1}, Ghế ${c+1}</span>
                  <span class="text-indigo-300 font-semibold">${student.gamified_points}đ</span>
                </div>
              </div>
            `;
          } else {
            html += `
              <div class="seat-slot border-2 border-dashed border-slate-700/60 rounded-xl flex items-center justify-center text-slate-500 text-xs"
                   ondragover="TeacherDashboard.handleDragOver(event)">
                Ghế trống
              </div>
            `;
          }
        });
        html += `</div>`;
      }

      html += `</div>`;
    });

    html += `</div>`;
    container.innerHTML = html;
  },

  handleDragStart(event, studentId) {
    this.draggedStudentId = studentId;
    event.dataTransfer.setData('text/plain', studentId);
  },

  handleDragOver(event) {
    event.preventDefault();
  },

  async handleDrop(event, targetStudentId) {
    event.preventDefault();
    if (!this.draggedStudentId || this.draggedStudentId === targetStudentId) return;

    try {
      const res = await API.swapSeats(this.draggedStudentId, targetStudentId);
      showToast(res.message, 'success');
      this.renderSeatMap();
    } catch (err) {
      showToast('Không thể đổi chỗ: ' + err.message, 'danger');
    } finally {
      this.draggedStudentId = null;
    }
  },

  async triggerAutoArrange(strategy) {
    try {
      const res = await API.smartAutoArrange(strategy);
      showToast(res.message, 'success');
      this.renderSeatMap();
    } catch (err) {
      showToast('Lỗi tự động sắp xếp: ' + err.message, 'danger');
    }
  },

  // ==================== 2. STUDENT 360 PROFILE ====================
  async openStudent360(studentId) {
    this.currentStudent360Id = studentId;
    const modal = document.getElementById('student-360-modal');
    const content = document.getElementById('student-360-content');
    if (!modal || !content) return;

    modal.classList.remove('hidden');
    content.innerHTML = `<div class="p-12 text-center text-slate-300"><i class="fa-solid fa-spinner fa-spin text-2xl mb-2"></i><div>Đang tổng hợp dữ liệu 360° học sinh...</div></div>`;

    try {
      const data = await API.getStudent360(studentId);
      const s = data.student;
      const att = data.attendance;
      const points = data.gamified_points;
      const academic = data.academic;
      const reports = data.ai_reports;

      content.innerHTML = `
        <div class="space-y-6">
          <!-- Top Bar: Avatar & Summary -->
          <div class="flex flex-wrap items-center justify-between gap-4 p-5 bg-slate-800/80 rounded-2xl border border-slate-700">
            <div class="flex items-center space-x-4">
              <img src="${s.avatar}" class="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500 shadow-md" alt="">
              <div>
                <div class="flex items-center space-x-2">
                  <h3 class="text-xl font-bold text-white">${s.full_name}</h3>
                  <span class="px-2.5 py-0.5 text-xs rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">${s.student_code}</span>
                  <span class="px-2.5 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">${s.badge}</span>
                </div>
                <div class="text-xs text-slate-400 mt-1 flex items-center space-x-4">
                  <span><i class="fa-solid fa-venus-mars mr-1"></i>${s.gender}</span>
                  <span><i class="fa-solid fa-ruler-vertical mr-1"></i>${s.height_cm} cm</span>
                  <span><i class="fa-solid fa-glasses mr-1"></i>${s.has_glasses ? 'Cận thị (Cần ngồi gần)' : 'Mắt tốt'}</span>
                  <span><i class="fa-solid fa-chair mr-1"></i>Vị trí: Hàng ${s.seat_row}, Cột ${s.seat_col}</span>
                </div>
              </div>
            </div>

            <!-- Quick Action: Award Points & Quick Mark -->
            <div class="flex items-center space-x-2">
              <button onclick="TeacherDashboard.quickAwardPointsModal(${s.id}, '${s.full_name}')" 
                      class="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition">
                <i class="fa-solid fa-star"></i>
                <span>Cộng/Trừ Điểm Thi Đua</span>
              </button>
              <button onclick="TeacherDashboard.quickNotifyParentModal(${s.id}, '${s.full_name}', '${s.parent_name}', '${s.parent_phone}')"
                      class="px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition">
                <i class="fa-solid fa-comment-sms"></i>
                <span>Gửi Zalo/SMS PH</span>
              </button>
            </div>
          </div>

          <!-- 3 Columns Stats -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <!-- Chuyên cần -->
            <div class="p-4 bg-slate-800/60 rounded-xl border border-slate-700">
              <div class="flex justify-between items-center mb-2">
                <span class="text-xs font-bold uppercase text-slate-400">Chuyên cần</span>
                <span class="text-xs text-emerald-400 font-bold">${att.summary.rate}% Có mặt</span>
              </div>
              <div class="grid grid-cols-3 text-center gap-1 text-xs">
                <div class="p-2 bg-emerald-500/10 rounded-lg"><div class="font-bold text-emerald-400">${att.summary.present}</div><div class="text-[10px] text-slate-400">Đúng giờ</div></div>
                <div class="p-2 bg-amber-500/10 rounded-lg"><div class="font-bold text-amber-400">${att.summary.late}</div><div class="text-[10px] text-slate-400">Đi muộn</div></div>
                <div class="p-2 bg-rose-500/10 rounded-lg"><div class="font-bold text-rose-400">${att.summary.absent}</div><div class="text-[10px] text-slate-400">Nghỉ học</div></div>
              </div>
            </div>

            <!-- Thi đua & Nề nếp -->
            <div class="p-4 bg-slate-800/60 rounded-xl border border-slate-700">
              <div class="flex justify-between items-center mb-2">
                <span class="text-xs font-bold uppercase text-slate-400">Điểm Thi Đua</span>
                <span class="text-xs text-amber-400 font-bold">${points.current_points} Điểm</span>
              </div>
              <div class="text-xs text-slate-300 line-clamp-2">
                Huy hiệu hiện tại: <strong class="text-white">${points.badge}</strong>
              </div>
              <div class="text-[11px] text-slate-400 mt-2">
                Hạnh kiểm: <span class="text-emerald-400 font-semibold">${s.conduct}</span>
              </div>
            </div>

            <!-- Học lực -->
            <div class="p-4 bg-slate-800/60 rounded-xl border border-slate-700">
              <div class="flex justify-between items-center mb-2">
                <span class="text-xs font-bold uppercase text-slate-400">Học lực (GPA)</span>
                <span class="text-xs text-indigo-400 font-bold">${academic.gpa} / 10.0</span>
              </div>
              <div class="text-xs text-slate-300">
                Xếp loại: <strong class="text-white">${academic.rank}</strong>
              </div>
              <div class="text-[11px] text-slate-400 mt-2">
                Sức khỏe: <span class="text-slate-300">${s.health_notes || 'Bình thường'}</span>
              </div>
            </div>

          </div>

          <!-- Academic Transcript Table -->
          <div class="p-4 bg-slate-800/60 rounded-xl border border-slate-700">
            <h4 class="font-bold text-sm text-white mb-3 flex items-center">
              <i class="fa-solid fa-graduation-cap text-indigo-400 mr-2"></i>
              Bảng Điểm Chi Tiết Các Môn (Học Kỳ 1 - 2026)
            </h4>
            <div class="overflow-x-auto">
              <table class="w-full text-xs text-left">
                <thead class="text-slate-400 border-b border-slate-700 uppercase text-[10px]">
                  <tr>
                    <th class="py-2">Môn Học</th>
                    <th class="py-2 text-center">TX1</th>
                    <th class="py-2 text-center">TX2</th>
                    <th class="py-2 text-center">Giữa Kỳ</th>
                    <th class="py-2 text-center">Cuối Kỳ</th>
                    <th class="py-2 text-center">ĐTB Môn</th>
                    <th class="py-2 text-center">Xu hướng</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-700/50">
                  ${academic.subjects.map(sub => `
                    <tr>
                      <td class="py-2.5 font-medium text-slate-200">${sub.subject}</td>
                      <td class="py-2.5 text-center">${sub.tx1}</td>
                      <td class="py-2.5 text-center">${sub.tx2}</td>
                      <td class="py-2.5 text-center">${sub.gk}</td>
                      <td class="py-2.5 text-center">${sub.ck}</td>
                      <td class="py-2.5 text-center font-bold ${sub.average >= 8.5 ? 'text-emerald-400' : (sub.average < 6.5 ? 'text-rose-400' : 'text-amber-400')}">
                        ${sub.average}
                      </td>
                      <td class="py-2.5 text-center">
                        ${sub.trend === 'up' ? '<span class="text-emerald-400"><i class="fa-solid fa-arrow-trend-up"></i> Tăng</span>' : 
                          (sub.trend === 'down' ? '<span class="text-rose-400 font-bold"><i class="fa-solid fa-arrow-trend-down"></i> Sút giảm</span>' : '<span class="text-slate-400">Ổn định</span>')}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- AI Report Writer Section -->
          <div class="p-5 bg-gradient-to-br from-indigo-950/40 to-purple-950/40 rounded-xl border border-indigo-500/30">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center space-x-2">
                <i class="fa-solid fa-wand-magic-sparkles text-indigo-400 text-lg"></i>
                <h4 class="font-bold text-sm text-white">AI Report Writer Engine (Nhận xét học sinh tự động)</h4>
              </div>
              <div class="flex items-center space-x-2">
                <select id="ai-tone-select" class="bg-slate-800 text-xs text-white rounded-lg px-2.5 py-1 border border-slate-700 focus:outline-none">
                  <option value="constructive">Sắc thái: Xây dựng & Khách quan</option>
                  <option value="motivational">Sắc thái: Động viên & Khích lệ</option>
                  <option value="strict">Sắc thái: Nghiêm khắc & Đôn đốc</option>
                  <option value="praise">Sắc thái: Khen ngợi & Tuyên dương</option>
                </select>
                <button onclick="TeacherDashboard.generateSingleAIReport(${s.id})" 
                        class="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition">
                  <i class="fa-solid fa-bolt mr-1"></i> Tái tạo nhận xét AI
                </button>
              </div>
            </div>

            <div id="ai-report-display-area" class="space-y-3">
              ${reports.length > 0 ? `
                <div class="p-4 bg-slate-900/80 rounded-xl border border-indigo-500/20 text-xs text-slate-300 leading-relaxed">
                  <p class="text-indigo-200 font-medium">${reports[0].generated_text}</p>
                  <div class="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                    <div><strong class="text-emerald-400">● Điểm mạnh:</strong> ${reports[0].strengths || 'Nề nếp tốt, chăm chỉ'}</div>
                    <div><strong class="text-amber-400">● Cần cải thiện:</strong> ${reports[0].areas_for_improvement || 'Phát huy thêm'}</div>
                  </div>
                  <div class="mt-2 text-[11px] text-slate-400">
                    <strong class="text-sky-300">🎯 Kế hoạch hành động:</strong> ${reports[0].action_plan || 'Duy trì kết quả hiện tại'}
                  </div>
                </div>
              ` : `
                <div class="p-4 bg-slate-900/60 rounded-xl text-center text-slate-400 text-xs">
                  Chưa có bản nhận xét AI nào. Nhấn <strong>"Tái tạo nhận xét AI"</strong> để hệ thống phân tích học lực và sinh nhận xét tức thì.
                </div>
              `}
            </div>
          </div>

        </div>
      `;
    } catch (err) {
      content.innerHTML = `<div class="p-6 text-center text-rose-400">Lỗi lấy thông tin học sinh: ${err.message}</div>`;
    }
  },

  closeStudent360() {
    const modal = document.getElementById('student-360-modal');
    if (modal) modal.classList.add('hidden');
  },

  async generateSingleAIReport(studentId) {
    const toneSelect = document.getElementById('ai-tone-select');
    const tone = toneSelect ? toneSelect.value : 'constructive';
    const displayArea = document.getElementById('ai-report-display-area');

    if (displayArea) {
      displayArea.innerHTML = `<div class="p-6 text-center text-indigo-300"><i class="fa-solid fa-spinner fa-spin mr-2"></i>AI Report Writer Engine đang phân tích học bạ và chuyên cần...</div>`;
    }

    try {
      const res = await API.generateAIReport(studentId, 'Học kỳ 1 - 2026', tone);
      showToast('Đã sinh nhận xét AI thành công!', 'success');
      this.openStudent360(studentId);
    } catch (err) {
      showToast('Lỗi sinh nhận xét: ' + err.message, 'danger');
    }
  },

  // ==================== 3. ATTENDANCE VIEW ====================
  async renderAttendanceView() {
    const container = document.getElementById('attendance-container');
    if (!container) return;

    try {
      const data = await API.getTodayAttendance();
      const stats = data.stats;

      container.innerHTML = `
        <div class="space-y-6">
          <!-- Stats Top -->
          <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div class="p-4 bg-slate-800/80 rounded-xl border border-slate-700">
              <div class="text-xs text-slate-400">Tổng sỉ số</div>
              <div class="text-2xl font-bold text-white mt-1">${data.total} Học sinh</div>
            </div>
            <div class="p-4 bg-emerald-950/40 rounded-xl border border-emerald-500/30">
              <div class="text-xs text-emerald-400">Có mặt đúng giờ</div>
              <div class="text-2xl font-bold text-emerald-300 mt-1">${stats.present}</div>
            </div>
            <div class="p-4 bg-amber-950/40 rounded-xl border border-amber-500/30">
              <div class="text-xs text-amber-400">Đi muộn</div>
              <div class="text-2xl font-bold text-amber-300 mt-1">${stats.late}</div>
            </div>
            <div class="p-4 bg-sky-950/40 rounded-xl border border-sky-500/30">
              <div class="text-xs text-sky-400">Nghỉ có phép</div>
              <div class="text-2xl font-bold text-sky-300 mt-1">${stats.excused}</div>
            </div>
            <div class="p-4 bg-rose-950/40 rounded-xl border border-rose-500/30">
              <div class="text-xs text-rose-400">Vắng không phép</div>
              <div class="text-2xl font-bold text-rose-300 mt-1">${stats.unexcused}</div>
            </div>
          </div>

          <!-- Attendance Records Matrix -->
          <div class="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
            <div class="p-4 border-b border-slate-700 flex flex-wrap items-center justify-between gap-4">
              <div class="flex items-center space-x-2">
                <i class="fa-solid fa-clipboard-check text-indigo-400 text-lg"></i>
                <h3 class="font-bold text-white text-base">Sổ Điểm Danh Lớp 12A1 Hôm Nay (${data.date})</h3>
              </div>
              <div class="text-xs text-slate-400">
                Tỷ lệ chuyên cần hiện tại: <strong class="text-emerald-400 text-sm">${stats.attendance_rate}%</strong>
              </div>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-xs text-left">
                <thead class="bg-slate-900/60 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th class="py-3 px-4">Học Sinh</th>
                    <th class="py-3 px-4 text-center">Chỗ ngồi</th>
                    <th class="py-3 px-4 text-center">Trạng Thái Hiện Tại</th>
                    <th class="py-3 px-4 text-center">Điểm danh nhanh 1-chạm</th>
                    <th class="py-3 px-4">Ghi chú</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-700/60">
                  ${data.records.map(r => `
                    <tr class="hover:bg-slate-700/30 transition-colors">
                      <td class="py-3 px-4">
                        <div class="flex items-center space-x-3">
                          <img src="${r.avatar}" class="w-8 h-8 rounded-full object-cover border border-slate-600" alt="">
                          <div>
                            <div class="font-bold text-white">${r.full_name}</div>
                            <div class="text-[10px] text-slate-400">${r.student_code}</div>
                          </div>
                        </div>
                      </td>
                      <td class="py-3 px-4 text-center font-mono text-slate-300">
                        Hàng ${r.seat_row}, Ghế ${r.seat_col}
                      </td>
                      <td class="py-3 px-4 text-center">
                        <span class="px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          r.status === 'present' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          r.status === 'late' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          r.status === 'excused' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' :
                          'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                        }">
                          ${r.status === 'present' ? 'Có mặt' : r.status === 'late' ? 'Đi muộn' : r.status === 'excused' ? 'Có phép' : 'Vắng không phép'}
                        </span>
                      </td>
                      <td class="py-3 px-4 text-center">
                        <div class="inline-flex rounded-lg border border-slate-700 p-0.5 bg-slate-900/80 space-x-1">
                          <button onclick="TeacherDashboard.markAttendanceSingle(${r.student_id}, 'present')" 
                                  class="px-2 py-1 rounded text-[10px] ${r.status === 'present' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}">
                            Có mặt
                          </button>
                          <button onclick="TeacherDashboard.markAttendanceSingle(${r.student_id}, 'late')" 
                                  class="px-2 py-1 rounded text-[10px] ${r.status === 'late' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}">
                            Muộn
                          </button>
                          <button onclick="TeacherDashboard.markAttendanceSingle(${r.student_id}, 'excused')" 
                                  class="px-2 py-1 rounded text-[10px] ${r.status === 'excused' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}">
                            Có phép
                          </button>
                          <button onclick="TeacherDashboard.markAttendanceSingle(${r.student_id}, 'unexcused')" 
                                  class="px-2 py-1 rounded text-[10px] ${r.status === 'unexcused' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'}">
                            Vắng K.phép
                          </button>
                        </div>
                      </td>
                      <td class="py-3 px-4 text-slate-400 text-xs italic">
                        ${r.note || '<span class="text-slate-600">Không có ghi chú</span>'}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="p-6 text-center text-rose-400">Lỗi tải dữ liệu điểm danh: ${err.message}</div>`;
    }
  },

  async markAttendanceSingle(studentId, status) {
    try {
      const res = await API.quickMarkAttendance(studentId, status);
      showToast(res.message, 'success');
      this.renderAttendanceView();
      this.renderSeatMap(); // Refresh colors on seatmap as well
    } catch (err) {
      showToast('Lỗi cập nhật: ' + err.message, 'danger');
    }
  },

  // ==================== 4. GAMIFICATION & LEADERBOARD ====================
  async renderGamificationView() {
    const container = document.getElementById('gamification-container');
    if (!container) return;

    try {
      const data = await API.getLeaderboard();

      container.innerHTML = `
        <div class="space-y-6">
          <!-- Header Banner -->
          <div class="p-6 bg-gradient-to-r from-amber-950/40 via-purple-950/40 to-slate-900 rounded-2xl border border-amber-500/30 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div class="flex items-center space-x-2">
                <span class="text-2xl">🏆 ⭐</span>
                <h3 class="text-xl font-bold text-white">Bảng Xếp Hạng Thi Đua & Nề Nếp Lớp 12A1</h3>
              </div>
              <p class="text-xs text-slate-300 mt-1">Hệ thống Gamification tích lũy điểm thưởng và huy hiệu rèn luyện phẩm chất theo tuần</p>
            </div>
            <button onclick="TeacherDashboard.batchAwardModal()" class="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition">
              <i class="fa-solid fa-plus-circle mr-1"></i> Ghi Nhận Điểm Nề Nếp Mới
            </button>
          </div>

          <!-- 2 Columns: Top Leaderboard + Recent Feed -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <!-- Top Leaderboard (2 cols) -->
            <div class="lg:col-span-2 bg-slate-800/80 rounded-2xl border border-slate-700 p-5 shadow-xl">
              <h4 class="font-bold text-sm text-white mb-4 flex items-center">
                <i class="fa-solid fa-ranking-star text-amber-400 mr-2"></i> Top 10 Ngôi Sao Thi Đua Hàng Đầu
              </h4>
              <div class="space-y-3">
                ${data.top_students.map((stu, idx) => `
                  <div class="flex items-center justify-between p-3 rounded-xl ${idx === 0 ? 'bg-amber-500/10 border border-amber-500/40' : (idx === 1 ? 'bg-slate-700/40 border border-slate-600' : (idx === 2 ? 'bg-amber-900/20 border border-amber-700/30' : 'bg-slate-900/40'))}">
                    <div class="flex items-center space-x-3">
                      <span class="w-6 text-center font-bold text-sm ${idx === 0 ? 'text-amber-400 text-base' : (idx === 1 ? 'text-slate-300' : (idx === 2 ? 'text-amber-600' : 'text-slate-500'))}">
                        ${idx === 0 ? '🥇' : (idx === 1 ? '🥈' : (idx === 2 ? '🥉' : idx + 1))}
                      </span>
                      <img src="${stu.avatar}" class="w-10 h-10 rounded-full object-cover border border-slate-600" alt="">
                      <div>
                        <div class="font-bold text-white text-sm">${stu.full_name}</div>
                        <div class="text-[11px] text-slate-400">${stu.badge}</div>
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="font-bold text-amber-400 text-base">${stu.gamified_points} <span class="text-xs font-normal text-slate-400">điểm</span></div>
                      <div class="text-[10px] text-slate-400">GPA: ${stu.academic_rank}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Recent Gamified Activity (1 col) -->
            <div class="bg-slate-800/80 rounded-2xl border border-slate-700 p-5 shadow-xl">
              <h4 class="font-bold text-sm text-white mb-4 flex items-center">
                <i class="fa-solid fa-clock-rotate-left text-indigo-400 mr-2"></i> Nhật Ký Điểm Thi Đua
              </h4>
              <div class="space-y-3 text-xs">
                ${data.recent_activity.map(act => `
                  <div class="p-3 bg-slate-900/60 rounded-xl border border-slate-700/60">
                    <div class="flex items-center justify-between">
                      <strong class="text-white">${act.student_name}</strong>
                      <span class="font-bold ${act.points > 0 ? 'text-emerald-400' : 'text-rose-400'}">
                        ${act.points > 0 ? '+' : ''}${act.points}đ
                      </span>
                    </div>
                    <p class="text-slate-300 mt-1 text-[11px]">${act.reason}</p>
                    <div class="mt-2 text-[10px] text-slate-500 flex justify-between">
                      <span>Loại: ${act.category}</span>
                      <span>Bởi: ${act.recorded_by}</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="p-6 text-center text-rose-400">Lỗi tải dữ liệu thi đua: ${err.message}</div>`;
    }
  },

  quickAwardPointsModal(studentId, studentName) {
    const reason = prompt(`Cộng / trừ điểm thi đua cho ${studentName}:\nNhập lý do (ví dụ: 'Phát biểu tốt', 'Quên sách', 'Trực nhật tốt'):`, 'Phát biểu xây dựng bài sôi nổi');
    if (!reason) return;

    const pointsStr = prompt(`Nhập số điểm (+ hoặc -) cho ${studentName}:`, '5');
    const points = parseInt(pointsStr);
    if (isNaN(points)) {
      alert('Số điểm không hợp lệ');
      return;
    }

    API.awardPoints(studentId, points, reason)
      .then(res => {
        showToast(res.message, 'success');
        TeacherDashboard.openStudent360(studentId);
        TeacherDashboard.renderSeatMap();
      })
      .catch(err => showToast(err.message, 'danger'));
  },

  async batchAwardModal() {
    const students = await API.getStudents();
    const selectOptions = students.map(s => `<option value="${s.id}">${s.student_code} - ${s.full_name}</option>`).join('');

    const modalHtml = `
      <div id="award-points-modal" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
          <div class="flex justify-between items-center pb-3 border-b border-slate-800">
            <h3 class="font-bold text-white text-base">Ghi Nhận Điểm Nề Nếp & Thi Đua</h3>
            <button onclick="document.getElementById('award-points-modal').remove()" class="text-slate-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="space-y-4 mt-4 text-xs">
            <div>
              <label class="block text-slate-300 mb-1">Chọn học sinh:</label>
              <select id="modal-award-student" class="w-full bg-slate-800 text-white rounded-lg p-2.5 border border-slate-700">
                ${selectOptions}
              </select>
            </div>
            <div>
              <label class="block text-slate-300 mb-1">Số điểm (+ cộng / - trừ):</label>
              <input type="number" id="modal-award-points" value="5" class="w-full bg-slate-800 text-white rounded-lg p-2.5 border border-slate-700">
            </div>
            <div>
              <label class="block text-slate-300 mb-1">Lý do ghi nhận:</label>
              <input type="text" id="modal-award-reason" placeholder="VD: Giải bài tập Toán khó trên bảng" class="w-full bg-slate-800 text-white rounded-lg p-2.5 border border-slate-700">
            </div>
            <div>
              <label class="block text-slate-300 mb-1">Danh mục:</label>
              <select id="modal-award-cat" class="w-full bg-slate-800 text-white rounded-lg p-2.5 border border-slate-700">
                <option value="học tập">Học tập & Phát biểu</option>
                <option value="nề nếp">Nề nếp & Kỷ luật</option>
                <option value="hoạt động">Phong trào & Hoạt động lớp</option>
              </select>
            </div>
            <div class="pt-2 flex justify-end space-x-2">
              <button onclick="document.getElementById('award-points-modal').remove()" class="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg">Hủy</button>
              <button onclick="TeacherDashboard.submitModalAward()" class="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-lg">Xác nhận ghi nhận</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  },

  async submitModalAward() {
    const studentId = parseInt(document.getElementById('modal-award-student').value);
    const points = parseInt(document.getElementById('modal-award-points').value);
    const reason = document.getElementById('modal-award-reason').value || 'Tích cực trong giờ học';
    const cat = document.getElementById('modal-award-cat').value;

    try {
      const res = await API.awardPoints(studentId, points, reason, cat);
      showToast(res.message, 'success');
      document.getElementById('award-points-modal').remove();
      this.renderGamificationView();
      this.renderSeatMap();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  },

  // ==================== 5. ACADEMIC & DROP WARNINGS ====================
  async renderAcademicView() {
    const container = document.getElementById('academic-container');
    if (!container) return;

    try {
      const [overview, warnings] = await Promise.all([
        API.getAcademicOverview(),
        API.getDropWarnings()
      ]);

      container.innerHTML = `
        <div class="space-y-6">
          <!-- Overview Cards -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="p-5 bg-slate-800/80 rounded-2xl border border-slate-700">
              <div class="text-xs text-slate-400">ĐTB Chung Cả Lớp</div>
              <div class="text-3xl font-extrabold text-white mt-1">${overview.class_avg_gpa} <span class="text-xs text-indigo-400 font-normal">/ 10</span></div>
            </div>
            <div class="p-5 bg-emerald-950/40 rounded-2xl border border-emerald-500/30">
              <div class="text-xs text-emerald-400">Học sinh Xuất sắc & Giỏi</div>
              <div class="text-3xl font-extrabold text-emerald-300 mt-1">
                ${(overview.rank_distribution['Xuất sắc'] || 0) + (overview.rank_distribution['Giỏi'] || 0)} <span class="text-xs font-normal">/ ${overview.total_students}</span>
              </div>
            </div>
            <div class="p-5 bg-amber-950/40 rounded-2xl border border-amber-500/30">
              <div class="text-xs text-amber-400">Học sinh Khá</div>
              <div class="text-3xl font-extrabold text-amber-300 mt-1">${overview.rank_distribution['Khá'] || 0}</div>
            </div>
            <div class="p-5 bg-rose-950/40 rounded-2xl border border-rose-500/30">
              <div class="text-xs text-rose-400">Cảnh Báo Sút Giảm Học Lực</div>
              <div class="text-3xl font-extrabold text-rose-300 mt-1">${overview.at_risk_count} <span class="text-xs font-normal">Học sinh</span></div>
            </div>
          </div>

          <!-- Academic Drop Warnings Alert Box -->
          <div class="bg-rose-950/20 border-2 border-rose-500/40 rounded-2xl p-5 shadow-xl">
            <div class="flex items-center space-x-3 mb-3">
              <span class="w-3 h-3 rounded-full bg-rose-500 animate-ping"></span>
              <h4 class="font-bold text-base text-rose-200">Danh Sách Học Sinh Có Dấu Hiệu Sút Giảm Học Lực Cần Kèm Cặp</h4>
            </div>
            <p class="text-xs text-slate-300 mb-4">Hệ thống AI tự động phát hiện các học sinh có điểm kiểm tra đột ngột sút giảm hoặc có môn dưới 6.5 để GVCN kịp thời can thiệp chỗ ngồi và liên hệ phụ huynh.</p>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              ${warnings.warnings.map(w => `
                <div class="p-3.5 bg-slate-900/80 rounded-xl border border-rose-500/30 flex items-start space-x-3">
                  <img src="${w.avatar}" class="w-10 h-10 rounded-full object-cover border border-rose-500/50 flex-shrink-0" alt="">
                  <div class="truncate text-xs">
                    <div class="font-bold text-white truncate">${w.full_name}</div>
                    <div class="text-rose-400 font-semibold mt-0.5">Môn ${w.subject}: ${w.average}đ (${w.trend === 'down' ? 'Đang giảm sút' : 'Dưới chuẩn'})</div>
                    <div class="text-slate-400 text-[10px] mt-1">Chỗ ngồi: Hàng ${w.seat_row}, Ghế ${w.seat_col}</div>
                    <div class="mt-2 flex space-x-2">
                      <button onclick="TeacherDashboard.openStudent360(${w.student_id})" class="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px]">
                        Xem hồ sơ 360°
                      </button>
                      <button onclick="TeacherDashboard.quickNotifyParentModal(${w.student_id}, '${w.full_name}', '${w.parent_name}', '${w.parent_phone}')" class="px-2 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded text-[10px]">
                        Báo Phụ huynh
                      </button>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="p-6 text-center text-rose-400">Lỗi tải dữ liệu học tập: ${err.message}</div>`;
    }
  },

  // ==================== 6. AI REPORT WRITER ENGINE VIEW ====================
  async renderAIReportView() {
    const container = document.getElementById('ai-report-container');
    if (!container) return;

    try {
      const students = await API.getStudents();

      container.innerHTML = `
        <div class="space-y-6">
          <div class="p-6 bg-gradient-to-r from-purple-950/40 via-indigo-950/40 to-slate-900 rounded-2xl border border-indigo-500/30 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div class="flex items-center space-x-3">
                <i class="fa-solid fa-wand-magic-sparkles text-2xl text-purple-400 animate-pulse"></i>
                <h3 class="text-xl font-bold text-white">AI Report Writer Engine (Tự Động Sinh Nhận Xét Sư Phạm)</h3>
              </div>
              <p class="text-xs text-slate-300 mt-1">Động cơ AI tự động tổng hợp kết quả học lực 5 môn, điểm nề nếp chuyên cần và vị trí lớp để sinh nhận xét chuẩn hóa</p>
            </div>
            <button onclick="TeacherDashboard.batchGenerateAllAI()" class="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center space-x-2">
              <i class="fa-solid fa-bolt"></i>
              <span>Sinh Nhận Xét Cho Toàn Bộ 30 Học Sinh (1-Click)</span>
            </button>
          </div>

          <!-- Students List for AI Review -->
          <div class="bg-slate-800/80 rounded-2xl border border-slate-700 p-5 shadow-xl">
            <h4 class="font-bold text-sm text-white mb-4">Danh Sách Học Sinh & Trạng Thái Nhận Xét Học Kỳ 1 - 2026</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              ${students.map(s => `
                <div class="p-4 bg-slate-900/60 rounded-xl border border-slate-700/60 flex items-center justify-between">
                  <div class="flex items-center space-x-3">
                    <img src="${s.avatar}" class="w-10 h-10 rounded-full object-cover border border-slate-600" alt="">
                    <div>
                      <div class="font-bold text-white text-xs">${s.full_name}</div>
                      <div class="text-[10px] text-slate-400">GPA: ${s.gpa} • ${s.academic_rank}</div>
                    </div>
                  </div>
                  <button onclick="TeacherDashboard.openStudent360(${s.id})" class="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 rounded-lg text-xs font-semibold">
                    Xem / Tạo AI
                  </button>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="p-6 text-center text-rose-400">Lỗi tải phân hệ AI: ${err.message}</div>`;
    }
  },

  async batchGenerateAllAI() {
    if (!confirm('Bạn có muốn hệ thống AI Report Writer tự động phân tích và tạo nhận xét sư phạm cho toàn bộ 30 học sinh lớp 12A1 không?')) return;

    showToast('AI Engine đang tiến hành phân tích học bạ và chuyên cần...', 'info');
    try {
      const res = await API.batchGenerateAllReports('Học kỳ 1 - 2026');
      showToast(res.message, 'success');
      this.renderAIReportView();
    } catch (err) {
      showToast('Lỗi: ' + err.message, 'danger');
    }
  },

  // ==================== 7. PARENT WORKER & ABSENCE REQUESTS ====================
  async renderCommunicationView() {
    const container = document.getElementById('communication-container');
    if (!container) return;

    try {
      const [logs, requests] = await Promise.all([
        API.getCommunicationLogs(),
        API.getAbsenceRequests()
      ]);

      container.innerHTML = `
        <div class="space-y-6">
          
          <!-- Dispatch Actions Header -->
          <div class="p-6 bg-slate-800/80 rounded-2xl border border-slate-700 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div class="flex items-center space-x-2">
                <i class="fa-solid fa-bullhorn text-sky-400 text-xl"></i>
                <h3 class="text-xl font-bold text-white">Parent Communication Worker</h3>
              </div>
              <p class="text-xs text-slate-300 mt-1">Cơ chế phát thông báo đa kênh tự động (Zalo OA, SMS Gateway, Cổng phụ huynh) & Quản lý đơn xin phép nghỉ</p>
            </div>
            <div class="flex items-center space-x-2">
              <button onclick="TeacherDashboard.triggerWeeklyBroadcast()" class="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-lg transition">
                <i class="fa-solid fa-paper-plane mr-1.5"></i> Phát Báo Cáo Tuần Cho 30 Phụ Huynh
              </button>
            </div>
          </div>

          <!-- Absence Requests Inbox (Đơn xin nghỉ phép từ phụ huynh) -->
          <div class="bg-slate-800/80 rounded-2xl border border-slate-700 p-5 shadow-xl">
            <h4 class="font-bold text-sm text-white mb-3 flex items-center justify-between">
              <span><i class="fa-solid fa-envelope-open-text text-amber-400 mr-2"></i> Hộp Thư Đơn Xin Phép Nghỉ Từ Phụ Huynh</span>
              <span class="text-xs text-slate-400">${requests.length} Đơn gửi đến</span>
            </h4>
            
            <div class="space-y-3">
              ${requests.length === 0 ? '<div class="text-center py-4 text-xs text-slate-500">Không có đơn xin phép nào đang chờ xử lý</div>' : ''}
              ${requests.map(req => `
                <div class="p-4 bg-slate-900/60 rounded-xl border ${req.status === 'pending' ? 'border-amber-500/50' : 'border-slate-700/60'}">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <div class="flex items-center space-x-3">
                      <img src="${req.avatar}" class="w-9 h-9 rounded-full object-cover border border-slate-600" alt="">
                      <div>
                        <div class="font-bold text-white text-xs">${req.student_name} (${req.student_code})</div>
                        <div class="text-[11px] text-slate-400">Phụ huynh gửi: <strong>${req.parent_name}</strong> • Nghỉ từ ${req.from_date} đến ${req.to_date}</div>
                      </div>
                    </div>
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold ${req.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300' : (req.status === 'pending' ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300')}">
                      ${req.status === 'approved' ? 'Đã duyệt' : (req.status === 'pending' ? 'Đang chờ duyệt' : 'Từ chối')}
                    </span>
                  </div>

                  <div class="mt-2.5 text-xs text-slate-300 bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50">
                    <strong>Lý do xin nghỉ:</strong> ${req.reason}
                  </div>

                  ${req.teacher_reply ? `
                    <div class="mt-2 text-[11px] text-emerald-300 bg-emerald-950/30 p-2 rounded-lg border border-emerald-500/20">
                      <strong>Phản hồi của GVCN:</strong> ${req.teacher_reply}
                    </div>
                  ` : ''}

                  ${req.status === 'pending' ? `
                    <div class="mt-3 flex justify-end space-x-2">
                      <button onclick="TeacherDashboard.reviewAbsence(${req.id}, 'rejected')" class="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded text-xs">
                        Từ chối
                      </button>
                      <button onclick="TeacherDashboard.reviewAbsence(${req.id}, 'approved')" class="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold">
                        <i class="fa-solid fa-check mr-1"></i> Phê Duyệt & Điểm Danh Có Phép
                      </button>
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Sent Communication Logs Feed -->
          <div class="bg-slate-800/80 rounded-2xl border border-slate-700 p-5 shadow-xl">
            <h4 class="font-bold text-sm text-white mb-3 flex items-center">
              <i class="fa-solid fa-clock-rotate-left text-sky-400 mr-2"></i> Nhật Ký Gửi Thông Báo Phụ Huynh Gần Nhất
            </h4>
            <div class="space-y-2 text-xs">
              ${logs.slice(0, 8).map(l => `
                <div class="p-3 bg-slate-900/60 rounded-xl border border-slate-700/60 flex items-center justify-between">
                  <div>
                    <div class="font-bold text-white">${l.subject} ➔ ${l.student_name} (${l.recipient})</div>
                    <div class="text-[11px] text-slate-400 mt-0.5">${l.message}</div>
                  </div>
                  <div class="text-right flex-shrink-0 ml-4">
                    <span class="px-2 py-0.5 bg-sky-500/10 text-sky-300 rounded text-[10px] font-mono">${l.channel}</span>
                    <div class="text-[10px] text-slate-500 mt-1">${l.sent_at}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="p-6 text-center text-rose-400">Lỗi tải kênh liên lạc: ${err.message}</div>`;
    }
  },

  async reviewAbsence(requestId, status) {
    const reply = prompt(`Nhập lời nhắn gửi tới phụ huynh (${status === 'approved' ? 'Phê duyệt' : 'Từ chối'}):`, status === 'approved' ? 'Cô đã duyệt đơn. Chúc em mau khỏe!' : 'Đề nghị phụ huynh liên hệ trực tiếp GVCN.');
    if (reply === null) return;

    try {
      const res = await API.reviewAbsenceRequest(requestId, status, reply);
      showToast(res.message, 'success');
      this.renderCommunicationView();
      this.renderSeatMap();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  },

  async triggerWeeklyBroadcast() {
    if (!confirm('Xác nhận kích hoạt Parent Communication Worker để gửi báo cáo tuần cho toàn bộ 30 phụ huynh học sinh qua Zalo OA?')) return;

    showToast('Đang phát thông báo tuần tới phụ huynh...', 'info');
    try {
      const res = await API.autoWeeklyDispatch();
      showToast(res.message, 'success');
      this.renderCommunicationView();
    } catch (err) {
      showToast('Lỗi gửi: ' + err.message, 'danger');
    }
  },

  quickNotifyParentModal(studentId, studentName, parentName, parentPhone) {
    const subject = prompt(`Gửi tin nhắn tới phụ huynh em ${studentName} (${parentName} - ${parentPhone}):\nTiêu đề tin nhắn:`, 'Thông báo tình hình học tập và rèn luyện');
    if (!subject) return;

    const message = prompt('Nội dung tin nhắn:', `Kính gửi phụ huynh em ${studentName}: Nhờ gia đình nhắc nhở em chuẩn bị bài vở chu đáo hơn trước khi đến lớp.`);
    if (!message) return;

    API.sendParentMessage(studentId, 'Zalo Oa', subject, message)
      .then(res => showToast(res.message, 'success'))
      .catch(err => showToast(err.message, 'danger'));
  }
};
