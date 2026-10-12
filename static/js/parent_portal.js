/**
 * Parent & Student Portal Controller (Cổng Phụ Huynh & Học Sinh)
 * Look up conduct, attendance, report cards, AI reports, and submit absence requests
 */
const ParentPortal = {
  async render() {
    const container = document.getElementById('parent-portal-container');
    if (!container) return;

    const studentId = API.currentStudentId || 2; // Default to Trần Bảo Ngọc (id: 2)

    try {
      const [data, requests, comms] = await Promise.all([
        API.getStudent360(studentId),
        API.getAbsenceRequests(),
        API.getCommunicationLogs(studentId)
      ]);

      const s = data.student;
      const att = data.attendance;
      const points = data.gamified_points;
      const academic = data.academic;
      const reports = data.ai_reports;

      container.innerHTML = `
        <div class="space-y-6">
          
          <!-- Parent Banner -->
          <div class="p-6 bg-gradient-to-r from-indigo-950/50 via-sky-950/40 to-slate-900 rounded-2xl border border-sky-500/30 flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center space-x-4">
              <img src="${s.avatar}" class="w-16 h-16 rounded-2xl object-cover border-2 border-sky-400 shadow-lg" alt="">
              <div>
                <div class="flex items-center space-x-2">
                  <h3 class="text-xl font-bold text-white">${s.full_name}</h3>
                  <span class="px-2.5 py-0.5 text-xs rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">Lớp 12A1</span>
                  <span class="px-2.5 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">${points.badge}</span>
                </div>
                <div class="text-xs text-slate-300 mt-1">
                  Phụ huynh học sinh: <strong class="text-white">${s.parent_name}</strong> • SĐT: ${s.parent_phone}
                </div>
              </div>
            </div>

            <!-- Online Absence Request Button -->
            <button onclick="ParentPortal.openAbsenceModal(${s.id}, '${s.parent_name}')" 
                    class="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center space-x-2">
              <i class="fa-solid fa-file-pen"></i>
              <span>Gửi Đơn Xin Phép Nghỉ Học Trực Tuyến</span>
            </button>
          </div>

          <!-- Quick Metrics: Seat Location, Attendance Rate, GPA -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="p-4 bg-slate-800/80 rounded-xl border border-slate-700">
              <div class="text-xs text-slate-400">Vị Trí Sơ Đồ Lớp</div>
              <div class="text-xl font-bold text-indigo-300 mt-1">Hàng ${s.seat_row}, Ghế ${s.seat_col}</div>
              <div class="text-[10px] text-slate-400 mt-1">Dãy ${s.seat_col <= 2 ? '1' : (s.seat_col <= 4 ? '2' : '3')} • Bàn đôi</div>
            </div>
            <div class="p-4 bg-slate-800/80 rounded-xl border border-slate-700">
              <div class="text-xs text-slate-400">Chuyên Cần</div>
              <div class="text-xl font-bold text-emerald-400 mt-1">${att.summary.rate}% Có mặt</div>
              <div class="text-[10px] text-slate-400 mt-1">${att.summary.present} đúng giờ • ${att.summary.late} muộn</div>
            </div>
            <div class="p-4 bg-slate-800/80 rounded-xl border border-slate-700">
              <div class="text-xs text-slate-400">Điểm Thi Đua Tuần</div>
              <div class="text-xl font-bold text-amber-400 mt-1">${points.current_points} Điểm</div>
              <div class="text-[10px] text-slate-400 mt-1">Hạnh kiểm: ${s.conduct}</div>
            </div>
            <div class="p-4 bg-slate-800/80 rounded-xl border border-slate-700">
              <div class="text-xs text-slate-400">Học Lực (GPA)</div>
              <div class="text-xl font-bold text-sky-400 mt-1">${academic.gpa} / 10</div>
              <div class="text-[10px] text-slate-400 mt-1">Hạng: ${academic.rank}</div>
            </div>
          </div>

          <!-- Sổ Điểm Học Tập & AI Report -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <!-- Academic Grades -->
            <div class="bg-slate-800/80 rounded-2xl border border-slate-700 p-5 shadow-xl">
              <h4 class="font-bold text-sm text-white mb-3 flex items-center">
                <i class="fa-solid fa-graduation-cap text-sky-400 mr-2"></i> Bảng Điểm Các Môn (Kỳ 1)
              </h4>
              <div class="overflow-x-auto">
                <table class="w-full text-xs text-left">
                  <thead class="text-slate-400 border-b border-slate-700 uppercase text-[10px]">
                    <tr>
                      <th class="py-2">Môn</th>
                      <th class="py-2 text-center">TX1</th>
                      <th class="py-2 text-center">TX2</th>
                      <th class="py-2 text-center">Giữa Kỳ</th>
                      <th class="py-2 text-center">Cuối Kỳ</th>
                      <th class="py-2 text-center">ĐTB</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-700/50">
                    ${academic.subjects.map(sub => `
                      <tr>
                        <td class="py-2 font-medium text-slate-200">${sub.subject}</td>
                        <td class="py-2 text-center">${sub.tx1}</td>
                        <td class="py-2 text-center">${sub.tx2}</td>
                        <td class="py-2 text-center">${sub.gk}</td>
                        <td class="py-2 text-center">${sub.ck}</td>
                        <td class="py-2 text-center font-bold ${sub.average >= 8.5 ? 'text-emerald-400' : 'text-amber-400'}">${sub.average}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- AI Pedagogical Assessment -->
            <div class="bg-slate-800/80 rounded-2xl border border-slate-700 p-5 shadow-xl flex flex-col justify-between">
              <div>
                <h4 class="font-bold text-sm text-white mb-3 flex items-center">
                  <i class="fa-solid fa-wand-magic-sparkles text-indigo-400 mr-2"></i> Nhận Xét Của Giáo Viên Chủ Nhiệm (AI Verified)
                </h4>
                ${reports.length > 0 ? `
                  <div class="p-4 bg-slate-900/70 rounded-xl border border-indigo-500/20 text-xs text-slate-300 leading-relaxed space-y-2">
                    <p class="text-indigo-200 font-medium">${reports[0].generated_text}</p>
                    <div class="pt-2 border-t border-slate-800 text-[11px] space-y-1">
                      <div><strong class="text-emerald-400">● Điểm mạnh:</strong> ${reports[0].strengths}</div>
                      <div><strong class="text-amber-400">● Cần cải thiện:</strong> ${reports[0].areas_for_improvement}</div>
                      <div><strong class="text-sky-300">🎯 Định hướng:</strong> ${reports[0].action_plan}</div>
                    </div>
                  </div>
                ` : '<div class="p-4 bg-slate-900/50 rounded-xl text-center text-xs text-slate-400">Chưa có bản nhận xét định kỳ</div>'}
              </div>

              <!-- Student change switcher for demo -->
              <div class="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs">
                <span class="text-slate-400">Đổi xem học sinh khác (Demo):</span>
                <select onchange="ParentPortal.changeStudent(this.value)" class="bg-slate-900 text-slate-200 rounded-lg px-2.5 py-1 border border-slate-700 text-xs">
                  <option value="2" ${studentId === 2 ? 'selected' : ''}>HS1202 - Trần Bảo Ngọc (Xuất sắc)</option>
                  <option value="6" ${studentId === 6 ? 'selected' : ''}>HS1206 - Phạm Minh Trí (Cảnh báo sút giảm)</option>
                  <option value="1" ${studentId === 1 ? 'selected' : ''}>HS1201 - Nguyễn Đức Huy (Lớp trưởng)</option>
                </select>
              </div>
            </div>

          </div>

          <!-- Absence Requests History -->
          <div class="bg-slate-800/80 rounded-2xl border border-slate-700 p-5 shadow-xl">
            <h4 class="font-bold text-sm text-white mb-3 flex items-center">
              <i class="fa-solid fa-clock-rotate-left text-sky-400 mr-2"></i> Lịch Sử Đơn Xin Phép Nghỉ Của Gia Đình
            </h4>
            <div class="space-y-3">
              ${requests.length === 0 ? '<div class="text-center py-4 text-xs text-slate-500">Gia đình chưa gửi đơn xin nghỉ nào</div>' : ''}
              ${requests.map(req => `
                <div class="p-3.5 bg-slate-900/60 rounded-xl border border-slate-700/60 text-xs flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div class="font-bold text-white">Nghỉ từ ${req.from_date} đến ${req.to_date}</div>
                    <div class="text-slate-300 mt-1">Lý do: "${req.reason}"</div>
                    ${req.teacher_reply ? `<div class="mt-1 text-emerald-300 text-[11px]">GVCN phản hồi: ${req.teacher_reply}</div>` : ''}
                  </div>
                  <span class="px-2.5 py-1 rounded-full text-[11px] font-semibold ${req.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300' : (req.status === 'pending' ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300')}">
                    ${req.status === 'approved' ? 'GVCN Đã Duyệt' : (req.status === 'pending' ? 'Đang Chờ Duyệt' : 'Từ Chối')}
                  </span>
                </div>
              `).join('')}
            </div>
          </div>

        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="p-6 text-center text-rose-400">Lỗi: ${err.message}</div>`;
    }
  },

  changeStudent(newId) {
    API.currentStudentId = parseInt(newId);
    this.render();
  },

  openAbsenceModal(studentId, parentName) {
    const today = new Date().toISOString().split('T')[0];

    const modalHtml = `
      <div id="parent-absence-modal" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
          <div class="flex justify-between items-center pb-3 border-b border-slate-800">
            <h3 class="font-bold text-white text-base">Đơn Xin Phép Nghỉ Học Trực Tuyến</h3>
            <button onclick="document.getElementById('parent-absence-modal').remove()" class="text-slate-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="space-y-4 mt-4 text-xs">
            <div>
              <label class="block text-slate-300 mb-1">Họ tên phụ huynh:</label>
              <input type="text" id="absence-parent-name" value="${parentName}" class="w-full bg-slate-800 text-white rounded-lg p-2.5 border border-slate-700">
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-slate-300 mb-1">Nghỉ từ ngày:</label>
                <input type="date" id="absence-from-date" value="${today}" class="w-full bg-slate-800 text-white rounded-lg p-2 border border-slate-700">
              </div>
              <div>
                <label class="block text-slate-300 mb-1">Đến ngày:</label>
                <input type="date" id="absence-to-date" value="${today}" class="w-full bg-slate-800 text-white rounded-lg p-2 border border-slate-700">
              </div>
            </div>
            <div>
              <label class="block text-slate-300 mb-1">Lý do xin nghỉ học:</label>
              <textarea id="absence-reason" rows="3" placeholder="VD: Em bị cảm sốt cần nghỉ ngơi tại nhà và đi khám bác sĩ..." class="w-full bg-slate-800 text-white rounded-lg p-2.5 border border-slate-700"></textarea>
            </div>
            <div class="pt-2 flex justify-end space-x-2">
              <button onclick="document.getElementById('parent-absence-modal').remove()" class="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg">Hủy</button>
              <button onclick="ParentPortal.submitAbsence(${studentId})" class="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg">Gửi Đơn Tới GVCN</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  },

  async submitAbsence(studentId) {
    const parentName = document.getElementById('absence-parent-name').value;
    const fromDate = document.getElementById('absence-from-date').value;
    const toDate = document.getElementById('absence-to-date').value;
    const reason = document.getElementById('absence-reason').value;

    if (!reason) {
      alert('Vui lòng nhập lý do xin nghỉ');
      return;
    }

    try {
      const res = await API.submitAbsenceRequest(studentId, parentName, fromDate, toDate, reason);
      showToast(res.message, 'success');
      document.getElementById('parent-absence-modal').remove();
      this.render();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }
};
