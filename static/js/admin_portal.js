/**
 * Admin Portal 360° Controller
 * Quản trị toàn diện 4 tầng kiến trúc Homeroom 360°:
 * 1. RBAC & Quản lý Tài khoản (Users)
 * 2. Hồ sơ Học sinh 360° (Students)
 * 3. Điểm danh & Chuyên cần (Attendance)
 * 4. Thi đua & Nề nếp (Gamification Points)
 * 5. Bảng điểm & Học lực (Academic Grades)
 * 6. Báo cáo AI Writer (AI Reports)
 * 7. Đơn xin nghỉ phép & Kênh Phụ huynh (Absences & Comms)
 * 8. Nhật ký Gateway RBAC & Bảo trì CSDL Supabase Cloud (Maintenance)
 */

const AdminPortal = {
  currentSubTab: 'overview',
  cache: {
    stats: null,
    users: [],
    students: [],
    attendance: [],
    gamification: [],
    grades: [],
    aiReports: [],
    absences: [],
    auditLogs: []
  },

  filters: {
    userSearch: '',
    userRole: '',
    studentSearch: '',
    studentRank: '',
    studentConduct: '',
    attendanceDate: new Date().toISOString().split('T')[0],
    gradeSubject: '',
    absenceStatus: ''
  },

  async render() {
    const container = document.getElementById('admin-portal-container');
    if (!container) return;

    container.innerHTML = `
      <div class="space-y-6">
        
        <!-- Header Banner -->
        <div class="p-6 bg-gradient-to-r from-rose-950/60 via-slate-900 to-indigo-950/50 rounded-2xl border border-rose-500/30 shadow-2xl flex flex-wrap items-center justify-between gap-4">
          <div class="flex items-center space-x-4">
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-600 to-red-700 flex items-center justify-center text-white text-2xl shadow-lg shadow-rose-900/50 flex-shrink-0">
              <i class="fa-solid fa-shield-halved"></i>
            </div>
            <div>
              <div class="flex items-center space-x-3">
                <h2 class="text-xl sm:text-2xl font-black text-white tracking-wide">TRUNG TÂM QUẢN TRỊ ADMIN 360°</h2>
                <span class="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  <i class="fa-solid fa-crown text-amber-400 mr-1"></i> Root SuperAdmin
                </span>
              </div>
              <p class="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Toàn quyền kiểm soát và điều hành 4 tầng kiến trúc: Quản lý người dùng & phân quyền RBAC, hồ sơ 36 học sinh, điểm danh, bảng điểm, thi đua nề nếp, duyệt đơn nghỉ và bảo trì cơ sở dữ liệu Supabase Cloud.
              </p>
            </div>
          </div>

          <!-- Quick Action Buttons in Header -->
          <div class="flex flex-wrap items-center gap-2 text-xs">
            <button onclick="AdminPortal.syncAllSupabase()" class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold flex items-center space-x-2 shadow-lg shadow-emerald-900/30 transition">
              <i class="fa-solid fa-cloud-arrow-up"></i>
              <span>Đồng Bộ Supabase Cloud</span>
            </button>
            <button onclick="AdminPortal.exportBackupJson()" class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white border border-slate-700 font-bold flex items-center space-x-2 transition">
              <i class="fa-solid fa-download"></i>
              <span>Sao Lưu JSON</span>
            </button>
            <button onclick="AdminPortal.refreshCurrentSubTab()" class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-bold flex items-center space-x-1.5 transition" title="Làm mới dữ liệu">
              <i class="fa-solid fa-arrows-rotate"></i>
            </button>
          </div>
        </div>

        <!-- Sub-Navigation Tabs Bar -->
        <div class="bg-slate-900/90 rounded-2xl border border-slate-800 p-2 shadow-xl flex items-center overflow-x-auto space-x-1.5 no-scrollbar">
          <button onclick="AdminPortal.switchSubTab('overview')" data-subtab="overview" class="admin-subtab-btn px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition flex-shrink-0">
            <i class="fa-solid fa-chart-pie text-rose-400"></i>
            <span>Tổng Quan & KPIs</span>
          </button>
          <button onclick="AdminPortal.switchSubTab('users')" data-subtab="users" class="admin-subtab-btn px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition flex-shrink-0">
            <i class="fa-solid fa-users-gear text-indigo-400"></i>
            <span>Tài Khoản & RBAC</span>
          </button>
          <button onclick="AdminPortal.switchSubTab('students')" data-subtab="students" class="admin-subtab-btn px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition flex-shrink-0">
            <i class="fa-solid fa-graduation-cap text-sky-400"></i>
            <span>Hồ Sơ Học Sinh (360°)</span>
          </button>
          <button onclick="AdminPortal.switchSubTab('attendance')" data-subtab="attendance" class="admin-subtab-btn px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition flex-shrink-0">
            <i class="fa-solid fa-clipboard-check text-emerald-400"></i>
            <span>Điểm Danh & Chuyên Cần</span>
          </button>
          <button onclick="AdminPortal.switchSubTab('gamification')" data-subtab="gamification" class="admin-subtab-btn px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition flex-shrink-0">
            <i class="fa-solid fa-trophy text-amber-400"></i>
            <span>Điểm Thi Đua (Points)</span>
          </button>
          <button onclick="AdminPortal.switchSubTab('grades')" data-subtab="grades" class="admin-subtab-btn px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition flex-shrink-0">
            <i class="fa-solid fa-award text-purple-400"></i>
            <span>Bảng Điểm & Học Lực</span>
          </button>
          <button onclick="AdminPortal.switchSubTab('ai_reports')" data-subtab="ai_reports" class="admin-subtab-btn px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition flex-shrink-0">
            <i class="fa-solid fa-wand-magic-sparkles text-pink-400"></i>
            <span>Báo Cáo AI Writer</span>
          </button>
          <button onclick="AdminPortal.switchSubTab('absences')" data-subtab="absences" class="admin-subtab-btn px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition flex-shrink-0">
            <i class="fa-solid fa-envelope-open-text text-cyan-400"></i>
            <span>Đơn Xin Nghỉ Phép</span>
          </button>
          <button onclick="AdminPortal.switchSubTab('maintenance')" data-subtab="maintenance" class="admin-subtab-btn px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition flex-shrink-0">
            <i class="fa-solid fa-database text-teal-400"></i>
            <span>Gateway Audit & Supabase</span>
          </button>
        </div>

        <!-- Dynamic Subtab Content Area -->
        <div id="admin-subtab-content" class="min-h-[500px]">
          <div class="flex items-center justify-center p-16 text-slate-400">
            <i class="fa-solid fa-circle-notch fa-spin text-3xl text-rose-500 mr-3"></i>
            <span class="text-sm font-semibold">Đang tải dữ liệu trung tâm quản trị...</span>
          </div>
        </div>

      </div>

      <!-- Generic Admin Modal Container -->
      <div id="admin-modal-container" class="hidden"></div>
    `;

    this.switchSubTab(this.currentSubTab);
  },

  switchSubTab(tabName) {
    this.currentSubTab = tabName;

    // Update active button styles
    document.querySelectorAll('.admin-subtab-btn').forEach(btn => {
      const active = btn.getAttribute('data-subtab') === tabName;
      if (active) {
        btn.className = 'admin-subtab-btn px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition flex-shrink-0 bg-rose-600 text-white shadow-lg shadow-rose-900/40';
      } else {
        btn.className = 'admin-subtab-btn px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition flex-shrink-0 text-slate-400 hover:text-white hover:bg-slate-800/60';
      }
    });

    const content = document.getElementById('admin-subtab-content');
    if (!content) return;

    switch (tabName) {
      case 'overview':
        this.renderOverview();
        break;
      case 'users':
        this.renderUsers();
        break;
      case 'students':
        this.renderStudents();
        break;
      case 'attendance':
        this.renderAttendance();
        break;
      case 'gamification':
        this.renderGamification();
        break;
      case 'grades':
        this.renderGrades();
        break;
      case 'ai_reports':
        this.renderAIReports();
        break;
      case 'absences':
        this.renderAbsences();
        break;
      case 'maintenance':
        this.renderMaintenance();
        break;
    }
  },

  refreshCurrentSubTab() {
    this.switchSubTab(this.currentSubTab);
  },

  // ==============================================================
  // 1. SUB-TAB: TỔNG QUAN & KPIS HỆ THỐNG
  // ==============================================================
  async renderOverview() {
    const content = document.getElementById('admin-subtab-content');
    content.innerHTML = `
      <div class="flex items-center justify-center p-16 text-slate-400">
        <i class="fa-solid fa-circle-notch fa-spin text-3xl text-rose-500 mr-3"></i>
        <span>Đang tổng hợp chỉ số quản trị...</span>
      </div>
    `;

    try {
      const res = await API.getAdminStats();
      this.cache.stats = res;
      const c = res.counts || {};
      const sb = res.supabase || {};
      const att = res.today_attendance || {};
      const rankDist = res.rank_distribution || {};
      const conductDist = res.conduct_distribution || {};

      content.innerHTML = `
        <div class="space-y-6">
          
          <!-- KPI Cards Grid (8 Cards for 8 Core Modules) -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div class="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 shadow-lg relative overflow-hidden">
              <div class="flex items-center justify-between text-slate-400 mb-2">
                <span class="text-xs font-semibold">Sĩ Số Học Sinh</span>
                <i class="fa-solid fa-graduation-cap text-sky-400 text-lg"></i>
              </div>
              <div class="text-2xl font-black text-white">${c.students || 0}</div>
              <div class="text-[11px] text-sky-300 mt-1 flex items-center">
                <span class="w-1.5 h-1.5 rounded-full bg-sky-400 mr-1.5"></span>
                Lớp 12A1 Chuẩn Hóa
              </div>
            </div>

            <div class="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 shadow-lg relative overflow-hidden">
              <div class="flex items-center justify-between text-slate-400 mb-2">
                <span class="text-xs font-semibold">Tài Khoản RBAC</span>
                <i class="fa-solid fa-users text-indigo-400 text-lg"></i>
              </div>
              <div class="text-2xl font-black text-white">${c.users || 0}</div>
              <div class="text-[11px] text-indigo-300 mt-1 flex items-center">
                <span class="w-1.5 h-1.5 rounded-full bg-indigo-400 mr-1.5"></span>
                GVCN, Cán sự & Phụ huynh
              </div>
            </div>

            <div class="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 shadow-lg relative overflow-hidden">
              <div class="flex items-center justify-between text-slate-400 mb-2">
                <span class="text-xs font-semibold">Chuyên Cần Hôm Nay</span>
                <i class="fa-solid fa-clipboard-check text-emerald-400 text-lg"></i>
              </div>
              <div class="text-2xl font-black text-emerald-400">${att.attendance_rate || 0}%</div>
              <div class="text-[11px] text-slate-400 mt-1">
                Có mặt: <strong class="text-white">${att.present || 0}</strong> • Muộn: <strong class="text-amber-400">${att.late || 0}</strong>
              </div>
            </div>

            <div class="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 shadow-lg relative overflow-hidden">
              <div class="flex items-center justify-between text-slate-400 mb-2">
                <span class="text-xs font-semibold">Đơn Nghỉ Phép</span>
                <i class="fa-solid fa-envelope-open-text text-amber-400 text-lg"></i>
              </div>
              <div class="text-2xl font-black ${c.pending_absences > 0 ? 'text-amber-400' : 'text-white'}">${c.pending_absences || 0}</div>
              <div class="text-[11px] text-slate-400 mt-1">
                Chờ duyệt / Tổng số: <strong class="text-white">${c.absence_requests || 0}</strong>
              </div>
            </div>

            <div class="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 shadow-lg relative overflow-hidden">
              <div class="flex items-center justify-between text-slate-400 mb-2">
                <span class="text-xs font-semibold">Bản Ghi Thi Đua</span>
                <i class="fa-solid fa-trophy text-amber-400 text-lg"></i>
              </div>
              <div class="text-2xl font-black text-white">${c.points_logs || 0}</div>
              <div class="text-[11px] text-amber-300 mt-1">
                Khen thưởng & Nhắc nhở
              </div>
            </div>

            <div class="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 shadow-lg relative overflow-hidden">
              <div class="flex items-center justify-between text-slate-400 mb-2">
                <span class="text-xs font-semibold">Điểm Môn Học</span>
                <i class="fa-solid fa-award text-purple-400 text-lg"></i>
              </div>
              <div class="text-2xl font-black text-white">${c.grades || 0}</div>
              <div class="text-[11px] text-purple-300 mt-1">
                Toán, Văn, Anh, Lý, Hóa
              </div>
            </div>

            <div class="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 shadow-lg relative overflow-hidden">
              <div class="flex items-center justify-between text-slate-400 mb-2">
                <span class="text-xs font-semibold">Báo Cáo AI Writer</span>
                <i class="fa-solid fa-wand-magic-sparkles text-pink-400 text-lg"></i>
              </div>
              <div class="text-2xl font-black text-white">${c.ai_reports || 0}</div>
              <div class="text-[11px] text-pink-300 mt-1">
                Nhận xét tự động hàng tuần
              </div>
            </div>

            <div class="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 shadow-lg relative overflow-hidden">
              <div class="flex items-center justify-between text-slate-400 mb-2">
                <span class="text-xs font-semibold">Tin Nhắn Phụ Huynh</span>
                <i class="fa-solid fa-paper-plane text-cyan-400 text-lg"></i>
              </div>
              <div class="text-2xl font-black text-white">${c.communications || 0}</div>
              <div class="text-[11px] text-cyan-300 mt-1">
                SMS, Zalo & Email
              </div>
            </div>

          </div>

          <!-- Supabase Cloud Connection & Infrastructure Health -->
          <div class="p-5 bg-gradient-to-r from-slate-900 to-emerald-950/40 rounded-2xl border border-emerald-500/30 shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center space-x-3.5">
              <div class="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl border border-emerald-500/40">
                <i class="fa-solid fa-cloud-bolt"></i>
              </div>
              <div>
                <div class="flex items-center space-x-2">
                  <h4 class="font-bold text-white text-sm">Trạng Thái Kết Nối Supabase Cloud</h4>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${sb.status === 'Connected' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}">
                    ● ${sb.status || 'Active'}
                  </span>
                </div>
                <div class="text-xs text-slate-300 mt-0.5">
                  Project URL: <code class="text-emerald-400 bg-slate-900/80 px-2 py-0.5 rounded">${sb.url || 'hgdyrrnzbabnyqsrxhmj.supabase.co'}</code>
                  <span class="mx-2">•</span> Độ trễ: <strong class="text-white">${sb.latency_ms || 12} ms</strong>
                  <span class="mx-2">•</span> Chế độ: <strong class="text-indigo-300">${sb.mode || 'PostgreSQL'}</strong>
                </div>
              </div>
            </div>

            <div class="flex items-center space-x-2">
              <button onclick="AdminPortal.syncAllSupabase()" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-700/30 transition flex items-center space-x-2">
                <i class="fa-solid fa-arrows-rotate"></i>
                <span>Đồng Bộ Ngay 8 Bảng Dữ Liệu</span>
              </button>
            </div>
          </div>

          <!-- Academic & Conduct Distribution Stats -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            <!-- Academic Rank Distribution -->
            <div class="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80 shadow-xl space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-slate-700">
                <h4 class="font-bold text-sm text-white flex items-center">
                  <i class="fa-solid fa-chart-column text-purple-400 mr-2"></i> Phân Bố Học Lực Lớp 12A1
                </h4>
                <span class="text-xs text-slate-400">36 Học Sinh</span>
              </div>
              <div class="space-y-3">
                ${Object.entries({
                  'Giỏi': { cnt: rankDist['Giỏi'] || 0, color: 'bg-emerald-500', text: 'text-emerald-400' },
                  'Khá': { cnt: rankDist['Khá'] || 0, color: 'bg-indigo-500', text: 'text-indigo-400' },
                  'Trung bình': { cnt: rankDist['Trung bình'] || 0, color: 'bg-amber-500', text: 'text-amber-400' },
                  'Yếu': { cnt: rankDist['Yếu'] || 0, color: 'bg-rose-500', text: 'text-rose-400' }
                }).map(([rank, data]) => {
                  const pct = Math.round((data.cnt / 36) * 100);
                  return `
                    <div>
                      <div class="flex justify-between text-xs font-semibold mb-1">
                        <span class="${data.text}">${rank}</span>
                        <span class="text-white">${data.cnt} HS (${pct}%)</span>
                      </div>
                      <div class="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden">
                        <div class="${data.color} h-full rounded-full transition-all duration-500" style="width: ${pct}%"></div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Conduct Distribution -->
            <div class="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80 shadow-xl space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-slate-700">
                <h4 class="font-bold text-sm text-white flex items-center">
                  <i class="fa-solid fa-medal text-amber-400 mr-2"></i> Phân Bố Hạnh Kiểm Lớp 12A1
                </h4>
                <span class="text-xs text-slate-400">Đánh giá kỳ I</span>
              </div>
              <div class="space-y-3">
                ${Object.entries({
                  'Tốt': { cnt: conductDist['Tốt'] || 0, color: 'bg-emerald-500', text: 'text-emerald-400' },
                  'Khá': { cnt: conductDist['Khá'] || 0, color: 'bg-sky-500', text: 'text-sky-400' },
                  'Trung bình': { cnt: conductDist['Trung bình'] || 0, color: 'bg-amber-500', text: 'text-amber-400' },
                  'Yếu': { cnt: conductDist['Yếu'] || 0, color: 'bg-rose-500', text: 'text-rose-400' }
                }).map(([conduct, data]) => {
                  const pct = Math.round((data.cnt / 36) * 100);
                  return `
                    <div>
                      <div class="flex justify-between text-xs font-semibold mb-1">
                        <span class="${data.text}">${conduct}</span>
                        <span class="text-white">${data.cnt} HS (${pct}%)</span>
                      </div>
                      <div class="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden">
                        <div class="${data.color} h-full rounded-full transition-all duration-500" style="width: ${pct}%"></div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

          </div>

          <!-- Fast Management Navigators -->
          <div class="p-5 bg-slate-800/80 rounded-2xl border border-slate-700 shadow-xl">
            <h4 class="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Truy Cập Nhanh Module Quản Trị</h4>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button onclick="AdminPortal.switchSubTab('users')" class="p-3 bg-slate-900/80 hover:bg-slate-700/80 rounded-xl border border-slate-700 text-left transition group">
                <div class="text-indigo-400 group-hover:text-indigo-300 text-base mb-1"><i class="fa-solid fa-user-plus"></i></div>
                <div class="text-xs font-bold text-white">Thêm / Sửa Tài Khoản</div>
                <div class="text-[10px] text-slate-400">RBAC, Mật khẩu, Vai trò</div>
              </button>
              <button onclick="AdminPortal.switchSubTab('students')" class="p-3 bg-slate-900/80 hover:bg-slate-700/80 rounded-xl border border-slate-700 text-left transition group">
                <div class="text-sky-400 group-hover:text-sky-300 text-base mb-1"><i class="fa-solid fa-user-graduate"></i></div>
                <div class="text-xs font-bold text-white">Quản Lý Học Sinh 360°</div>
                <div class="text-[10px] text-slate-400">Sơ đồ ghế, GPA, Điểm thi đua</div>
              </button>
              <button onclick="AdminPortal.switchSubTab('grades')" class="p-3 bg-slate-900/80 hover:bg-slate-700/80 rounded-xl border border-slate-700 text-left transition group">
                <div class="text-purple-400 group-hover:text-purple-300 text-base mb-1"><i class="fa-solid fa-pen-to-square"></i></div>
                <div class="text-xs font-bold text-white">Cập Nhật Bảng Điểm</div>
                <div class="text-[10px] text-slate-400">TX1, TX2, Giữa kỳ, Cuối kỳ</div>
              </button>
              <button onclick="AdminPortal.switchSubTab('absences')" class="p-3 bg-slate-900/80 hover:bg-slate-700/80 rounded-xl border border-slate-700 text-left transition group">
                <div class="text-amber-400 group-hover:text-amber-300 text-base mb-1"><i class="fa-solid fa-clock-rotate-left"></i></div>
                <div class="text-xs font-bold text-white">Duyệt Đơn Nghỉ Phép</div>
                <div class="text-[10px] text-slate-400">${c.pending_absences || 0} đơn đang chờ duyệt</div>
              </button>
            </div>
          </div>

        </div>
      `;
    } catch (err) {
      content.innerHTML = `
        <div class="p-8 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-center space-y-3">
          <i class="fa-solid fa-triangle-exclamation text-3xl text-rose-400"></i>
          <div class="text-sm font-bold text-white">Không thể tải thông tin thống kê quản trị</div>
          <p class="text-xs text-rose-300">${err.message}</p>
          <button onclick="AdminPortal.renderOverview()" class="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold">Thử Lại</button>
        </div>
      `;
    }
  },

  // ==============================================================
  // 2. SUB-TAB: QUẢN LÝ NGƯỜI DÙNG & PHÂN QUYỀN RBAC
  // ==============================================================
  async renderUsers() {
    const content = document.getElementById('admin-subtab-content');
    content.innerHTML = `
      <div class="flex items-center justify-center p-16 text-slate-400">
        <i class="fa-solid fa-circle-notch fa-spin text-3xl text-indigo-500 mr-3"></i>
        <span>Đang tải danh sách tài khoản hệ thống...</span>
      </div>
    `;

    try {
      const res = await API.getAdminUsers(this.filters.userSearch, this.filters.userRole);
      this.cache.users = res.users || [];
      const rolesMap = res.roles_map || {};

      content.innerHTML = `
        <div class="space-y-4">
          
          <!-- Filters & Action Bar -->
          <div class="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 flex flex-wrap items-center justify-between gap-3 shadow-lg">
            <div class="flex flex-wrap items-center gap-2 flex-grow max-w-2xl">
              <div class="relative flex-grow min-w-[200px]">
                <i class="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-xs text-slate-400"></i>
                <input type="text" id="admin-user-search" value="${this.filters.userSearch}" 
                  placeholder="Tìm kiếm username, email, họ tên..." 
                  class="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  onkeydown="if(event.key==='Enter') AdminPortal.filterUsers()">
              </div>

              <select id="admin-user-role-filter" class="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500" onchange="AdminPortal.filterUsers()">
                <option value="">-- Tất cả vai trò --</option>
                <option value="admin" ${this.filters.userRole === 'admin' ? 'selected' : ''}>Quản trị viên (Admin)</option>
                <option value="teacher" ${this.filters.userRole === 'teacher' ? 'selected' : ''}>Giáo viên chủ nhiệm (GVCN)</option>
                <option value="monitor" ${this.filters.userRole === 'monitor' ? 'selected' : ''}>Cán sự lớp (Monitor)</option>
                <option value="parent_student" ${this.filters.userRole === 'parent_student' ? 'selected' : ''}>Phụ huynh học sinh</option>
              </select>

              <button onclick="AdminPortal.filterUsers()" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold">Lọc</button>
            </div>

            <div>
              <button onclick="AdminPortal.openAddUserModal()" class="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-900/30 flex items-center space-x-2">
                <i class="fa-solid fa-user-plus"></i>
                <span>Thêm Tài Khoản Mới</span>
              </button>
            </div>
          </div>

          <!-- Users Table -->
          <div class="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-slate-300">
                <thead class="bg-slate-900/90 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-700">
                  <tr>
                    <th class="py-3 px-4 font-bold">ID / User</th>
                    <th class="py-3 px-4 font-bold">Họ & Tên</th>
                    <th class="py-3 px-4 font-bold">Email</th>
                    <th class="py-3 px-4 font-bold">Vai Trò & Chức Vụ</th>
                    <th class="py-3 px-4 font-bold">Học Sinh Liên Kết</th>
                    <th class="py-3 px-4 font-bold">Ngày Tạo</th>
                    <th class="py-3 px-4 font-bold text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-700/60">
                  ${this.cache.users.map(u => {
                    const roleBadge = {
                      'admin': 'bg-rose-500/20 text-rose-300 border-rose-500/30',
                      'teacher': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                      'monitor': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                      'parent_student': 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                    }[u.role] || 'bg-slate-700 text-slate-300';

                    return `
                      <tr class="hover:bg-slate-700/30 transition">
                        <td class="py-3 px-4 font-medium">
                          <div class="flex items-center space-x-2">
                            <span class="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300">${u.id}</span>
                            <span class="font-bold text-white">${u.username}</span>
                          </div>
                        </td>
                        <td class="py-3 px-4 text-white font-semibold">${u.full_name || '—'}</td>
                        <td class="py-3 px-4 text-slate-400 font-mono text-[11px]">${u.email || '—'}</td>
                        <td class="py-3 px-4">
                          <span class="px-2 py-0.5 rounded-md border text-[10px] font-bold ${roleBadge}">
                            ${u.duty ? `⭐ ${u.duty}` : (rolesMap[u.role] || u.role)}
                          </span>
                        </td>
                        <td class="py-3 px-4">
                          ${u.student_name ? `
                            <span class="px-2 py-0.5 rounded bg-sky-950/60 text-sky-300 border border-sky-500/30 font-medium">
                              <i class="fa-solid fa-graduation-cap mr-1"></i>${u.student_name} (#${u.student_id})
                            </span>
                          ` : '<span class="text-slate-500">—</span>'}
                        </td>
                        <td class="py-3 px-4 text-slate-400 text-[11px]">${u.created_at ? u.created_at.split('T')[0] : '—'}</td>
                        <td class="py-3 px-4 text-right">
                          <div class="inline-flex items-center space-x-1.5">
                            <button onclick="AdminPortal.openEditUserModal(${u.id})" class="p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg transition" title="Chỉnh sửa thông tin">
                              <i class="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button onclick="AdminPortal.openResetPasswordModal(${u.id}, '${u.username}')" class="p-1.5 bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white rounded-lg border border-amber-500/30 transition" title="Đặt lại mật khẩu">
                              <i class="fa-solid fa-key"></i>
                            </button>
                            ${u.username !== 'admin' ? `
                              <button onclick="AdminPortal.deleteUser(${u.id}, '${u.username}')" class="p-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg border border-rose-500/30 transition" title="Xóa tài khoản">
                                <i class="fa-solid fa-trash-can"></i>
                              </button>
                            ` : ''}
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
            
            <div class="p-3 bg-slate-900/60 border-t border-slate-700 text-xs text-slate-400 flex justify-between items-center">
              <span>Hiển thị <strong>${this.cache.users.length}</strong> tài khoản</span>
              <span class="text-[11px] text-emerald-400"><i class="fa-solid fa-cloud-check mr-1"></i> Đồng bộ tự động với Supabase Cloud</span>
            </div>
          </div>

        </div>
      `;
    } catch (err) {
      content.innerHTML = `
        <div class="p-8 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-center">
          <p class="text-rose-300 text-xs">${err.message}</p>
        </div>
      `;
    }
  },

  filterUsers() {
    const s = document.getElementById('admin-user-search');
    const r = document.getElementById('admin-user-role-filter');
    if (s) this.filters.userSearch = s.value;
    if (r) this.filters.userRole = r.value;
    this.renderUsers();
  },

  // ==============================================================
  // USER MODALS & ACTIONS
  // ==============================================================
  openAddUserModal() {
    const modalContainer = document.getElementById('admin-modal-container');
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 class="font-bold text-white text-base flex items-center">
              <i class="fa-solid fa-user-plus text-indigo-400 mr-2"></i> Thêm Tài Khoản Mới
            </h3>
            <button onclick="AdminPortal.closeModal()" class="text-slate-400 hover:text-white"><i class="fa-solid fa-xmark text-lg"></i></button>
          </div>

          <form id="admin-add-user-form" onsubmit="AdminPortal.submitAddUser(event)" class="space-y-3">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Tên đăng nhập (Username) *</label>
              <input type="text" id="new-user-username" required class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500">
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Địa chỉ Email *</label>
              <input type="email" id="new-user-email" required class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500">
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Họ và Tên *</label>
              <input type="text" id="new-user-fullname" required class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500">
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Mật khẩu khởi tạo *</label>
              <input type="password" id="new-user-password" required value="123456" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500">
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Vai trò hệ thống *</label>
                <select id="new-user-role" onchange="AdminPortal.toggleDutyAndStudentFields(this.value)" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500">
                  <option value="parent_student">Phụ Huynh Học Sinh</option>
                  <option value="monitor">Cán Sự Lớp (Monitor)</option>
                  <option value="teacher">Giáo Viên Chủ Nhiệm (GVCN)</option>
                  <option value="admin">Quản Trị Viên (SuperAdmin)</option>
                </select>
              </div>

              <div id="new-user-duty-box" class="hidden">
                <label class="block text-xs font-semibold text-amber-300 mb-1">Chức vụ cán sự</label>
                <select id="new-user-duty" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500">
                  <option value="Lớp Trưởng">Lớp Trưởng</option>
                  <option value="Lớp Phó Học Tập">Lớp Phó Học Tập</option>
                  <option value="Lớp Phó Kỷ Luật & Nề Nếp">Lớp Phó Kỷ Luật & Nề Nếp</option>
                  <option value="Lớp Phó Lao Động">Lớp Phó Lao Động</option>
                  <option value="Tổ Trưởng Tổ 1">Tổ Trưởng Tổ 1</option>
                  <option value="Tổ Trưởng Tổ 2">Tổ Trưởng Tổ 2</option>
                  <option value="Tổ Trưởng Tổ 3">Tổ Trưởng Tổ 3</option>
                  <option value="Tổ Trưởng Tổ 4">Tổ Trưởng Tổ 4</option>
                </select>
              </div>
            </div>

            <div id="new-user-student-box">
              <label class="block text-xs font-semibold text-sky-300 mb-1">Học sinh liên kết 1-1 (Con em trong lớp)</label>
              <select id="new-user-student-id" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500">
                <option value="">-- Không liên kết --</option>
              </select>
            </div>

            <div class="pt-3 flex justify-end space-x-2 border-t border-slate-800">
              <button type="button" onclick="AdminPortal.closeModal()" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold">Hủy Bỏ</button>
              <button type="submit" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-700/30">Tạo Tài Khoản</button>
            </div>
          </form>
        </div>
      </div>
    `;
    modalContainer.classList.remove('hidden');

    // Populate student select
    this.populateStudentDropdown('new-user-student-id');
  },

  async populateStudentDropdown(selectId, selectedId = null) {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    try {
      if (!this.cache.students || this.cache.students.length === 0) {
        const res = await API.getStudents();
        this.cache.students = res.students || [];
      }
      sel.innerHTML = '<option value="">-- Không liên kết --</option>' + this.cache.students.map(s => `
        <option value="${s.id}" ${selectedId == s.id ? 'selected' : ''}>#${s.id} - ${s.name} (Hàng ${s.seat_row}, Ghế ${s.seat_col})</option>
      `).join('');
    } catch (e) {
      console.error(e);
    }
  },

  toggleDutyAndStudentFields(role) {
    const dutyBox = document.getElementById('new-user-duty-box');
    const studentBox = document.getElementById('new-user-student-box');
    if (dutyBox) {
      if (role === 'monitor') dutyBox.classList.remove('hidden');
      else dutyBox.classList.add('hidden');
    }
    if (studentBox) {
      if (role === 'parent_student') studentBox.classList.remove('hidden');
      else studentBox.classList.add('hidden');
    }
  },

  async submitAddUser(event) {
    event.preventDefault();
    const payload = {
      username: document.getElementById('new-user-username').value.trim(),
      email: document.getElementById('new-user-email').value.trim(),
      full_name: document.getElementById('new-user-fullname').value.trim(),
      password: document.getElementById('new-user-password').value,
      role: document.getElementById('new-user-role').value,
      duty: document.getElementById('new-user-role').value === 'monitor' ? document.getElementById('new-user-duty').value : null,
      student_id: document.getElementById('new-user-role').value === 'parent_student' && document.getElementById('new-user-student-id').value ? parseInt(document.getElementById('new-user-student-id').value) : null
    };

    try {
      showToast('Đang tạo tài khoản và đồng bộ Supabase Cloud...', 'info');
      await API.createAdminUser(payload);
      showToast('Tạo tài khoản người dùng thành công!', 'success');
      this.closeModal();
      this.renderUsers();
    } catch (err) {
      showToast('Lỗi: ' + err.message, 'danger');
    }
  },

  openEditUserModal(userId) {
    const user = this.cache.users.find(u => u.id === userId);
    if (!user) return;

    const modalContainer = document.getElementById('admin-modal-container');
    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 class="font-bold text-white text-base flex items-center">
              <i class="fa-solid fa-user-pen text-indigo-400 mr-2"></i> Chỉnh Sửa Tài Khoản: ${user.username}
            </h3>
            <button onclick="AdminPortal.closeModal()" class="text-slate-400 hover:text-white"><i class="fa-solid fa-xmark text-lg"></i></button>
          </div>

          <form id="admin-edit-user-form" onsubmit="AdminPortal.submitEditUser(event, ${user.id})" class="space-y-3">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Địa chỉ Email *</label>
              <input type="email" id="edit-user-email" value="${user.email || ''}" required class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500">
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Họ và Tên *</label>
              <input type="text" id="edit-user-fullname" value="${user.full_name || ''}" required class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500">
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Vai trò hệ thống *</label>
                <select id="edit-user-role" onchange="AdminPortal.toggleDutyAndStudentFields(this.value)" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500">
                  <option value="parent_student" ${user.role === 'parent_student' ? 'selected' : ''}>Phụ Huynh Học Sinh</option>
                  <option value="monitor" ${user.role === 'monitor' ? 'selected' : ''}>Cán Sự Lớp (Monitor)</option>
                  <option value="teacher" ${user.role === 'teacher' ? 'selected' : ''}>Giáo Viên Chủ Nhiệm (GVCN)</option>
                  <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Quản Trị Viên (SuperAdmin)</option>
                </select>
              </div>

              <div id="new-user-duty-box" class="${user.role === 'monitor' ? '' : 'hidden'}">
                <label class="block text-xs font-semibold text-amber-300 mb-1">Chức vụ cán sự</label>
                <select id="new-user-duty" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500">
                  ${['Lớp Trưởng', 'Lớp Phó Học Tập', 'Lớp Phó Kỷ Luật & Nề Nếp', 'Lớp Phó Lao Động', 'Tổ Trưởng Tổ 1', 'Tổ Trưởng Tổ 2', 'Tổ Trưởng Tổ 3', 'Tổ Trưởng Tổ 4'].map(d => `
                    <option value="${d}" ${user.duty === d ? 'selected' : ''}>${d}</option>
                  `).join('')}
                </select>
              </div>
            </div>

            <div id="new-user-student-box" class="${user.role === 'parent_student' ? '' : 'hidden'}">
              <label class="block text-xs font-semibold text-sky-300 mb-1">Học sinh liên kết</label>
              <select id="edit-user-student-id" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500">
                <option value="">-- Không liên kết --</option>
              </select>
            </div>

            <div class="pt-3 flex justify-end space-x-2 border-t border-slate-800">
              <button type="button" onclick="AdminPortal.closeModal()" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold">Hủy Bỏ</button>
              <button type="submit" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-700/30">Lưu Thay Đổi</button>
            </div>
          </form>
        </div>
      </div>
    `;
    modalContainer.classList.remove('hidden');
    this.populateStudentDropdown('edit-user-student-id', user.student_id);
  },

  async submitEditUser(event, userId) {
    event.preventDefault();
    const role = document.getElementById('edit-user-role').value;
    const payload = {
      email: document.getElementById('edit-user-email').value.trim(),
      full_name: document.getElementById('edit-user-fullname').value.trim(),
      role: role,
      duty: role === 'monitor' ? document.getElementById('new-user-duty').value : null,
      student_id: role === 'parent_student' && document.getElementById('edit-user-student-id').value ? parseInt(document.getElementById('edit-user-student-id').value) : null
    };

    try {
      showToast('Đang cập nhật tài khoản...', 'info');
      await API.updateAdminUser(userId, payload);
      showToast('Cập nhật người dùng thành công!', 'success');
      this.closeModal();
      this.renderUsers();
    } catch (err) {
      showToast('Lỗi: ' + err.message, 'danger');
    }
  },

  openResetPasswordModal(userId, username) {
    const modalContainer = document.getElementById('admin-modal-container');
    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 class="font-bold text-white text-base flex items-center">
              <i class="fa-solid fa-key text-amber-400 mr-2"></i> Đặt Lại Mật Khẩu
            </h3>
            <button onclick="AdminPortal.closeModal()" class="text-slate-400 hover:text-white"><i class="fa-solid fa-xmark text-lg"></i></button>
          </div>

          <p class="text-xs text-slate-300">Nhập mật khẩu mới cho tài khoản: <strong class="text-amber-400 font-bold">${username}</strong></p>

          <div>
            <input type="password" id="reset-user-newpwd" placeholder="Mật khẩu mới (ít nhất 6 ký tự)" value="123456" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500">
          </div>

          <div class="pt-3 flex justify-end space-x-2 border-t border-slate-800">
            <button type="button" onclick="AdminPortal.closeModal()" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold">Hủy</button>
            <button type="button" onclick="AdminPortal.submitResetPassword(${userId})" class="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-700/30">Cập Nhật Mật Khẩu</button>
          </div>
        </div>
      </div>
    `;
    modalContainer.classList.remove('hidden');
  },

  async submitResetPassword(userId) {
    const pwd = document.getElementById('reset-user-newpwd').value;
    if (!pwd || pwd.length < 6) {
      showToast('Mật khẩu phải từ 6 ký tự trở lên', 'warning');
      return;
    }
    try {
      showToast('Đang mã hóa và cập nhật mật khẩu...', 'info');
      await API.resetAdminUserPassword(userId, pwd);
      showToast('Đặt lại mật khẩu thành công!', 'success');
      this.closeModal();
    } catch (err) {
      showToast('Lỗi: ' + err.message, 'danger');
    }
  },

  async deleteUser(userId, username) {
    if (!confirm(`Bạn có chắc chắn muốn xóa tài khoản "${username}"? Thao tác này sẽ đồng thời xóa người dùng trên Supabase Cloud.`)) {
      return;
    }
    try {
      showToast(`Đang xóa tài khoản ${username}...`, 'info');
      await API.deleteAdminUser(userId);
      showToast(`Đã xóa tài khoản ${username} thành công!`, 'success');
      this.renderUsers();
    } catch (err) {
      showToast('Lỗi xóa tài khoản: ' + err.message, 'danger');
    }
  },

  // ==============================================================
  // 3. SUB-TAB: QUẢN LÝ HỒ SƠ HỌC SINH 360° (STUDENTS)
  // ==============================================================
  async renderStudents() {
    const content = document.getElementById('admin-subtab-content');
    content.innerHTML = `
      <div class="flex items-center justify-center p-16 text-slate-400">
        <i class="fa-solid fa-circle-notch fa-spin text-3xl text-sky-500 mr-3"></i>
        <span>Đang tải hồ sơ 360° học sinh...</span>
      </div>
    `;

    try {
      const res = await API.getAdminStudents(this.filters.studentSearch, this.filters.studentRank, this.filters.studentConduct);
      this.cache.students = res.students || [];

      content.innerHTML = `
        <div class="space-y-4">
          
          <!-- Filters & Action Bar -->
          <div class="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 flex flex-wrap items-center justify-between gap-3 shadow-lg">
            <div class="flex flex-wrap items-center gap-2 flex-grow max-w-2xl">
              <div class="relative flex-grow min-w-[200px]">
                <i class="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-xs text-slate-400"></i>
                <input type="text" id="admin-student-search" value="${this.filters.studentSearch}" 
                  placeholder="Tìm theo tên học sinh hoặc ghi chú..." 
                  class="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  onkeydown="if(event.key==='Enter') AdminPortal.filterStudents()">
              </div>

              <select id="admin-student-rank-filter" class="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500" onchange="AdminPortal.filterStudents()">
                <option value="">-- Học Lực --</option>
                <option value="Giỏi" ${this.filters.studentRank === 'Giỏi' ? 'selected' : ''}>Giỏi</option>
                <option value="Khá" ${this.filters.studentRank === 'Khá' ? 'selected' : ''}>Khá</option>
                <option value="Trung bình" ${this.filters.studentRank === 'Trung bình' ? 'selected' : ''}>Trung bình</option>
                <option value="Yếu" ${this.filters.studentRank === 'Yếu' ? 'selected' : ''}>Yếu</option>
              </select>

              <select id="admin-student-conduct-filter" class="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500" onchange="AdminPortal.filterStudents()">
                <option value="">-- Hạnh Kiểm --</option>
                <option value="Tốt" ${this.filters.studentConduct === 'Tốt' ? 'selected' : ''}>Tốt</option>
                <option value="Khá" ${this.filters.studentConduct === 'Khá' ? 'selected' : ''}>Khá</option>
                <option value="Trung bình" ${this.filters.studentConduct === 'Trung bình' ? 'selected' : ''}>Trung bình</option>
              </select>

              <button onclick="AdminPortal.filterStudents()" class="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold">Lọc</button>
            </div>

            <div>
              <button onclick="AdminPortal.openAddStudentModal()" class="px-4 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-900/30 flex items-center space-x-2">
                <i class="fa-solid fa-user-plus"></i>
                <span>Thêm Học Sinh Mới</span>
              </button>
            </div>
          </div>

          <!-- Students Table -->
          <div class="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-slate-300">
                <thead class="bg-slate-900/90 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-700">
                  <tr>
                    <th class="py-3 px-4 font-bold">STT / ID</th>
                    <th class="py-3 px-4 font-bold">Học Sinh 360°</th>
                    <th class="py-3 px-4 font-bold">Tọa Độ Ghế</th>
                    <th class="py-3 px-4 font-bold">Đặc Điểm & Thị Lực</th>
                    <th class="py-3 px-4 font-bold">Điểm Thi Đua</th>
                    <th class="py-3 px-4 font-bold">GPA & Học Lực</th>
                    <th class="py-3 px-4 font-bold">Hạnh Kiểm</th>
                    <th class="py-3 px-4 font-bold text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-700/60">
                  ${this.cache.students.map(s => {
                    const rankClass = {
                      'Giỏi': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
                      'Khá': 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
                      'Trung bình': 'bg-amber-500/20 text-amber-300 border-amber-500/40',
                      'Yếu': 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    }[s.academic_rank] || 'bg-slate-700 text-slate-300';

                    return `
                      <tr class="hover:bg-slate-700/30 transition">
                        <td class="py-3 px-4 font-mono font-bold text-slate-400">#${s.id}</td>
                        <td class="py-3 px-4">
                          <div class="flex items-center space-x-2.5">
                            <img src="${s.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=st_${s.id}`}" class="w-8 h-8 rounded-full border border-slate-600 bg-slate-800 object-cover" alt="">
                            <div>
                              <div class="font-bold text-white">${s.name}</div>
                              <div class="text-[10px] text-slate-400">${s.behavioral_note || 'Học sinh ngoan, tích cực'}</div>
                            </div>
                          </div>
                        </td>
                        <td class="py-3 px-4">
                          <span class="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 font-bold text-sky-400">
                            Hàng ${s.seat_row} • Ghế ${s.seat_col}
                          </span>
                        </td>
                        <td class="py-3 px-4">
                          <div class="space-y-0.5">
                            <span class="inline-block px-1.5 py-0.5 rounded text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                              ${s.learning_style || 'Visual'}
                            </span>
                            ${s.vision_condition && s.vision_condition !== 'Bình thường' ? `
                              <span class="inline-block px-1.5 py-0.5 rounded text-[10px] bg-rose-950 text-rose-300 border border-rose-500/30">
                                <i class="fa-solid fa-glasses mr-0.5"></i> ${s.vision_condition}
                              </span>
                            ` : ''}
                          </div>
                        </td>
                        <td class="py-3 px-4">
                          <span class="font-black text-amber-400 flex items-center">
                            <i class="fa-solid fa-trophy mr-1 text-xs"></i> ${s.points || 0} pts
                          </span>
                        </td>
                        <td class="py-3 px-4">
                          <div class="flex items-center space-x-1.5">
                            <span class="font-black text-white text-sm">${s.gpa ? s.gpa.toFixed(1) : '8.0'}</span>
                            <span class="px-1.5 py-0.5 rounded border text-[10px] font-bold ${rankClass}">${s.academic_rank || 'Khá'}</span>
                          </div>
                        </td>
                        <td class="py-3 px-4">
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${s.conduct === 'Tốt' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-700 text-slate-300'}">
                            ${s.conduct || 'Tốt'}
                          </span>
                        </td>
                        <td class="py-3 px-4 text-right">
                          <div class="inline-flex items-center space-x-1.5">
                            <button onclick="AdminPortal.openEditStudentModal(${s.id})" class="p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg transition" title="Sửa hồ sơ học sinh">
                              <i class="fa-solid fa-user-pen"></i>
                            </button>
                            <button onclick="AdminPortal.deleteStudent(${s.id}, '${s.name}')" class="p-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg border border-rose-500/30 transition" title="Xóa học sinh">
                              <i class="fa-solid fa-trash-can"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>

            <div class="p-3 bg-slate-900/60 border-t border-slate-700 text-xs text-slate-400 flex justify-between items-center">
              <span>Hiển thị <strong>${this.cache.students.length}</strong> học sinh lớp 12A1</span>
              <span class="text-[11px] text-sky-400"><i class="fa-solid fa-chair mr-1"></i> Tọa độ ghế tương thích hoàn toàn Smart SeatMap Controller</span>
            </div>
          </div>

        </div>
      `;
    } catch (err) {
      content.innerHTML = `
        <div class="p-8 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-center">
          <p class="text-rose-300 text-xs">${err.message}</p>
        </div>
      `;
    }
  },

  filterStudents() {
    const s = document.getElementById('admin-student-search');
    const r = document.getElementById('admin-student-rank-filter');
    const c = document.getElementById('admin-student-conduct-filter');
    if (s) this.filters.studentSearch = s.value;
    if (r) this.filters.studentRank = r.value;
    if (c) this.filters.studentConduct = c.value;
    this.renderStudents();
  },

  openAddStudentModal() {
    const modalContainer = document.getElementById('admin-modal-container');
    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 class="font-bold text-white text-base flex items-center">
              <i class="fa-solid fa-graduation-cap text-sky-400 mr-2"></i> Thêm Hồ Sơ Học Sinh Mới
            </h3>
            <button onclick="AdminPortal.closeModal()" class="text-slate-400 hover:text-white"><i class="fa-solid fa-xmark text-lg"></i></button>
          </div>

          <form id="admin-add-student-form" onsubmit="AdminPortal.submitAddStudent(event)" class="space-y-3">
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Mã STT (ID) *</label>
                <input type="number" id="new-student-id" required value="${(this.cache.students.length || 36) + 1}" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono">
              </div>
              <div class="col-span-2">
                <label class="block text-xs font-semibold text-slate-300 mb-1">Họ và Tên Học Sinh *</label>
                <input type="text" id="new-student-name" required placeholder="Nguyễn Văn A" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500">
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Hàng Ghế (1 - 6) *</label>
                <input type="number" id="new-student-row" min="1" max="6" value="1" required class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500">
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Cột Ghế (1 - 6) *</label>
                <input type="number" id="new-student-col" min="1" max="6" value="1" required class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500">
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Phong cách học</label>
                <select id="new-student-style" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500">
                  <option value="Visual (Hình ảnh)">Visual (Hình ảnh)</option>
                  <option value="Auditory (Âm thanh)">Auditory (Âm thanh)</option>
                  <option value="Kinesthetic (Vận động)">Kinesthetic (Vận động)</option>
                  <option value="Reading/Writing (Đọc viết)">Reading/Writing (Đọc viết)</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Tình trạng thị lực</label>
                <select id="new-student-vision" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500">
                  <option value="Bình thường">Bình thường</option>
                  <option value="Cận 1.5 độ">Cận 1.5 độ</option>
                  <option value="Cận 2.5 độ">Cận 2.5 độ</option>
                  <option value="Cận 3.5 độ">Cận 3.5 độ</option>
                  <option value="Loạn thị nhẹ">Loạn thị nhẹ</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Ghi chú hành vi / đặc điểm</label>
              <input type="text" id="new-student-note" placeholder="Học sinh năng động, chăm phát biểu" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500">
            </div>

            <div class="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-300">
              <i class="fa-solid fa-circle-check mr-1"></i> Tự động khởi tạo 5 môn học (Toán, Văn, Anh, Lý, Hóa) và điểm thi đua ban đầu (100 pts) cho học sinh mới.
            </div>

            <div class="pt-3 flex justify-end space-x-2 border-t border-slate-800">
              <button type="button" onclick="AdminPortal.closeModal()" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold">Hủy</button>
              <button type="submit" class="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-700/30">Thêm Học Sinh</button>
            </div>
          </form>
        </div>
      </div>
    `;
    modalContainer.classList.remove('hidden');
  },

  async submitAddStudent(event) {
    event.preventDefault();
    const payload = {
      id: parseInt(document.getElementById('new-student-id').value),
      name: document.getElementById('new-student-name').value.trim(),
      seat_row: parseInt(document.getElementById('new-student-row').value),
      seat_col: parseInt(document.getElementById('new-student-col').value),
      learning_style: document.getElementById('new-student-style').value,
      vision_condition: document.getElementById('new-student-vision').value,
      behavioral_note: document.getElementById('new-student-note').value.trim() || 'Học sinh ngoan, tích cực',
      initial_points: 100
    };

    try {
      showToast('Đang thêm học sinh và khởi tạo 5 môn học...', 'info');
      await API.createAdminStudent(payload);
      showToast('Thêm học sinh thành công!', 'success');
      this.closeModal();
      this.renderStudents();
    } catch (err) {
      showToast('Lỗi: ' + err.message, 'danger');
    }
  },

  openEditStudentModal(studentId) {
    const student = this.cache.students.find(s => s.id === studentId);
    if (!student) return;

    const modalContainer = document.getElementById('admin-modal-container');
    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 class="font-bold text-white text-base flex items-center">
              <i class="fa-solid fa-user-pen text-sky-400 mr-2"></i> Chỉnh Sửa Học Sinh: #${student.id} - ${student.name}
            </h3>
            <button onclick="AdminPortal.closeModal()" class="text-slate-400 hover:text-white"><i class="fa-solid fa-xmark text-lg"></i></button>
          </div>

          <form id="admin-edit-student-form" onsubmit="AdminPortal.submitEditStudent(event, ${student.id})" class="space-y-3">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Họ và Tên *</label>
              <input type="text" id="edit-student-name" value="${student.name}" required class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500">
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Hàng Ghế (1 - 6) *</label>
                <input type="number" id="edit-student-row" min="1" max="6" value="${student.seat_row}" required class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500">
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Cột Ghế (1 - 6) *</label>
                <input type="number" id="edit-student-col" min="1" max="6" value="${student.seat_col}" required class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500">
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Điểm Thi Đua (Points)</label>
                <input type="number" id="edit-student-points" value="${student.points || 0}" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-bold text-amber-400">
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Điểm Trung Bình (GPA)</label>
                <input type="number" step="0.1" id="edit-student-gpa" value="${student.gpa || 8.0}" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-bold">
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Học Lực</label>
                <select id="edit-student-rank" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500">
                  <option value="Giỏi" ${student.academic_rank === 'Giỏi' ? 'selected' : ''}>Giỏi</option>
                  <option value="Khá" ${student.academic_rank === 'Khá' ? 'selected' : ''}>Khá</option>
                  <option value="Trung bình" ${student.academic_rank === 'Trung bình' ? 'selected' : ''}>Trung bình</option>
                  <option value="Yếu" ${student.academic_rank === 'Yếu' ? 'selected' : ''}>Yếu</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Hạnh Kiểm</label>
                <select id="edit-student-conduct" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500">
                  <option value="Tốt" ${student.conduct === 'Tốt' ? 'selected' : ''}>Tốt</option>
                  <option value="Khá" ${student.conduct === 'Khá' ? 'selected' : ''}>Khá</option>
                  <option value="Trung bình" ${student.conduct === 'Trung bình' ? 'selected' : ''}>Trung bình</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Ghi chú hành vi / đặc điểm</label>
              <input type="text" id="edit-student-note" value="${student.behavioral_note || ''}" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500">
            </div>

            <div class="pt-3 flex justify-end space-x-2 border-t border-slate-800">
              <button type="button" onclick="AdminPortal.closeModal()" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold">Hủy</button>
              <button type="submit" class="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-700/30">Lưu Hồ Sơ</button>
            </div>
          </form>
        </div>
      </div>
    `;
    modalContainer.classList.remove('hidden');
  },

  async submitEditStudent(event, studentId) {
    event.preventDefault();
    const payload = {
      name: document.getElementById('edit-student-name').value.trim(),
      seat_row: parseInt(document.getElementById('edit-student-row').value),
      seat_col: parseInt(document.getElementById('edit-student-col').value),
      points: parseInt(document.getElementById('edit-student-points').value),
      gpa: parseFloat(document.getElementById('edit-student-gpa').value),
      academic_rank: document.getElementById('edit-student-rank').value,
      conduct: document.getElementById('edit-student-conduct').value,
      behavioral_note: document.getElementById('edit-student-note').value.trim()
    };

    try {
      showToast('Đang lưu thông tin học sinh...', 'info');
      await API.updateAdminStudent(studentId, payload);
      showToast('Cập nhật hồ sơ học sinh thành công!', 'success');
      this.closeModal();
      this.renderStudents();
    } catch (err) {
      showToast('Lỗi: ' + err.message, 'danger');
    }
  },

  async deleteStudent(studentId, name) {
    if (!confirm(`CẢNH BÁO: Xóa học sinh "${name}" (#${studentId}) sẽ xóa toàn bộ bản ghi điểm danh, bảng điểm, thi đua và báo cáo AI liên quan. Bạn có chắc chắn muốn xóa?`)) {
      return;
    }
    try {
      showToast(`Đang xóa hồ sơ #${studentId}...`, 'info');
      await API.deleteAdminStudent(studentId);
      showToast(`Đã xóa học sinh #${studentId} thành công!`, 'success');
      this.renderStudents();
    } catch (err) {
      showToast('Lỗi xóa học sinh: ' + err.message, 'danger');
    }
  },

  // ==============================================================
  // 4. SUB-TAB: QUẢN LÝ ĐIỂM DANH & CHUYÊN CẦN (ATTENDANCE)
  // ==============================================================
  async renderAttendance() {
    const content = document.getElementById('admin-subtab-content');
    content.innerHTML = `
      <div class="flex items-center justify-center p-16 text-slate-400">
        <i class="fa-solid fa-circle-notch fa-spin text-3xl text-emerald-500 mr-3"></i>
        <span>Đang tải nhật ký điểm danh chuyên cần...</span>
      </div>
    `;

    try {
      const res = await API.getAdminAttendance(this.filters.attendanceDate);
      this.cache.attendance = res.logs || [];

      content.innerHTML = `
        <div class="space-y-4">
          
          <!-- Filters Bar -->
          <div class="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 flex flex-wrap items-center justify-between gap-3 shadow-lg">
            <div class="flex flex-wrap items-center gap-3">
              <div class="flex items-center space-x-2">
                <span class="text-xs text-slate-300 font-semibold"><i class="fa-solid fa-calendar-day text-emerald-400 mr-1"></i> Ngày điểm danh:</span>
                <input type="date" id="admin-att-date" value="${this.filters.attendanceDate}" 
                  class="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  onchange="AdminPortal.changeAttendanceDate(this.value)">
              </div>
              <button onclick="AdminPortal.changeAttendanceDate('')" class="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-xs font-semibold">Tất Cả Ngày</button>
            </div>

            <div class="text-xs text-slate-400">
              Tổng số bản ghi: <strong class="text-emerald-400 font-bold">${this.cache.attendance.length}</strong>
            </div>
          </div>

          <!-- Attendance Table -->
          <div class="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-slate-300">
                <thead class="bg-slate-900/90 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-700">
                  <tr>
                    <th class="py-3 px-4 font-bold">Mã Log</th>
                    <th class="py-3 px-4 font-bold">Học Sinh</th>
                    <th class="py-3 px-4 font-bold">Ngày</th>
                    <th class="py-3 px-4 font-bold">Giờ Quẹt Thẻ/Ghi Nhận</th>
                    <th class="py-3 px-4 font-bold">Trạng Thái Chuyên Cần</th>
                    <th class="py-3 px-4 font-bold">Ghi Chú</th>
                    <th class="py-3 px-4 font-bold text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-700/60">
                  ${this.cache.attendance.length === 0 ? `
                    <tr><td colspan="7" class="py-8 text-center text-slate-500 text-xs">Không tìm thấy dữ liệu điểm danh cho ngày đã chọn.</td></tr>
                  ` : this.cache.attendance.map(log => {
                    const statusConfig = {
                      'present': { text: 'Có mặt đúng giờ', class: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
                      'late': { text: 'Đi học muộn', class: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
                      'excused': { text: 'Nghỉ có phép', class: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
                      'unexcused': { text: 'Nghỉ không phép', class: 'bg-rose-500/20 text-rose-300 border-rose-500/30' }
                    }[log.status] || { text: log.status, class: 'bg-slate-700 text-slate-300' };

                    return `
                      <tr class="hover:bg-slate-700/30 transition">
                        <td class="py-3 px-4 font-mono text-slate-400">#${log.id}</td>
                        <td class="py-3 px-4 font-bold text-white">${log.student_name} <span class="text-[10px] text-slate-500 font-normal">(#${log.student_id})</span></td>
                        <td class="py-3 px-4 font-mono">${log.date}</td>
                        <td class="py-3 px-4 font-mono text-[11px] text-slate-400">${log.check_in_time || '07:15:00'}</td>
                        <td class="py-3 px-4">
                          <select onchange="AdminPortal.quickUpdateAttendance(${log.id}, this.value)" class="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[11px] font-bold text-white focus:outline-none focus:border-emerald-500">
                            <option value="present" ${log.status === 'present' ? 'selected' : ''}>✓ Có mặt</option>
                            <option value="late" ${log.status === 'late' ? 'selected' : ''}>⏰ Đi muộn</option>
                            <option value="excused" ${log.status === 'excused' ? 'selected' : ''}>📩 Có phép</option>
                            <option value="unexcused" ${log.status === 'unexcused' ? 'selected' : ''}>❌ Không phép</option>
                          </select>
                        </td>
                        <td class="py-3 px-4 text-slate-400 text-[11px]">${log.note || '—'}</td>
                        <td class="py-3 px-4 text-right">
                          <button onclick="AdminPortal.deleteAttendance(${log.id})" class="p-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg border border-rose-500/30 transition" title="Xóa bản ghi">
                            <i class="fa-solid fa-trash-can"></i>
                          </button>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      `;
    } catch (err) {
      content.innerHTML = `
        <div class="p-8 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-center">
          <p class="text-rose-300 text-xs">${err.message}</p>
        </div>
      `;
    }
  },

  changeAttendanceDate(dateStr) {
    this.filters.attendanceDate = dateStr;
    this.renderAttendance();
  },

  async quickUpdateAttendance(logId, status) {
    try {
      await API.updateAdminAttendance(logId, status);
      showToast('Đã cập nhật trạng thái điểm danh!', 'success');
    } catch (err) {
      showToast('Lỗi cập nhật: ' + err.message, 'danger');
    }
  },

  async deleteAttendance(logId) {
    if (!confirm('Bạn có chắc muốn xóa bản ghi điểm danh này?')) return;
    try {
      await API.deleteAdminAttendance(logId);
      showToast('Đã xóa bản ghi điểm danh!', 'success');
      this.renderAttendance();
    } catch (err) {
      showToast('Lỗi xóa: ' + err.message, 'danger');
    }
  },

  // ==============================================================
  // 5. SUB-TAB: QUẢN LÝ ĐIỂM THI ĐUA (GAMIFICATION POINTS)
  // ==============================================================
  async renderGamification() {
    const content = document.getElementById('admin-subtab-content');
    content.innerHTML = `
      <div class="flex items-center justify-center p-16 text-slate-400">
        <i class="fa-solid fa-circle-notch fa-spin text-3xl text-amber-500 mr-3"></i>
        <span>Đang tải nhật ký thi đua & điểm thưởng...</span>
      </div>
    `;

    try {
      const res = await API.getAdminGamification();
      this.cache.gamification = res.logs || [];

      content.innerHTML = `
        <div class="space-y-4">
          
          <div class="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 flex flex-wrap items-center justify-between gap-3 shadow-lg">
            <div class="flex items-center space-x-2">
              <span class="text-xs text-slate-300 font-semibold"><i class="fa-solid fa-trophy text-amber-400 mr-1"></i> Nhật ký thi đua nề nếp toàn lớp</span>
            </div>
            <div class="text-xs text-slate-400">
              Tổng số bản ghi: <strong class="text-amber-400 font-bold">${this.cache.gamification.length}</strong>
            </div>
          </div>

          <div class="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-slate-300">
                <thead class="bg-slate-900/90 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-700">
                  <tr>
                    <th class="py-3 px-4 font-bold">Mã Log</th>
                    <th class="py-3 px-4 font-bold">Học Sinh</th>
                    <th class="py-3 px-4 font-bold">Biến Động Điểm</th>
                    <th class="py-3 px-4 font-bold">Lý Do / Hành Vi</th>
                    <th class="py-3 px-4 font-bold">Thời Gian</th>
                    <th class="py-3 px-4 font-bold">Người Ghi Nhận</th>
                    <th class="py-3 px-4 font-bold text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-700/60">
                  ${this.cache.gamification.map(log => `
                    <tr class="hover:bg-slate-700/30 transition">
                      <td class="py-3 px-4 font-mono text-slate-400">#${log.id}</td>
                      <td class="py-3 px-4 font-bold text-white">${log.student_name} <span class="text-[10px] text-slate-500 font-normal">(#${log.student_id})</span></td>
                      <td class="py-3 px-4">
                        <span class="px-2 py-0.5 rounded-full font-bold text-[11px] ${log.points_delta >= 0 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}">
                          ${log.points_delta >= 0 ? '+' + log.points_delta : log.points_delta} pts
                        </span>
                      </td>
                      <td class="py-3 px-4 text-white font-medium">${log.reason}</td>
                      <td class="py-3 px-4 font-mono text-slate-400 text-[11px]">${log.timestamp ? log.timestamp.split('T')[0] : '—'}</td>
                      <td class="py-3 px-4">
                        <span class="px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 text-[10px]">
                          ${log.recorder_role || 'Cán sự'} • ${log.recorder_name || 'Hệ thống'}
                        </span>
                      </td>
                      <td class="py-3 px-4 text-right">
                        <button onclick="AdminPortal.deleteGamification(${log.id}, ${log.points_delta})" class="p-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg border border-rose-500/30 transition" title="Thu hồi điểm & hoàn trả về hồ sơ học sinh">
                          <i class="fa-solid fa-rotate-left mr-1"></i> Thu hồi
                        </button>
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
      content.innerHTML = `
        <div class="p-8 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-center">
          <p class="text-rose-300 text-xs">${err.message}</p>
        </div>
      `;
    }
  },

  async deleteGamification(logId, pointsDelta) {
    if (!confirm(`Bạn có chắc muốn thu hồi bản ghi này? Điểm số của học sinh sẽ tự động được hoàn trả (${pointsDelta >= 0 ? '-' : '+'}${Math.abs(pointsDelta)} pts).`)) {
      return;
    }
    try {
      showToast('Đang thu hồi bản ghi điểm thi đua...', 'info');
      await API.deleteAdminGamification(logId);
      showToast('Đã thu hồi điểm thành công!', 'success');
      this.renderGamification();
    } catch (err) {
      showToast('Lỗi: ' + err.message, 'danger');
    }
  },

  // ==============================================================
  // 6. SUB-TAB: QUẢN LÝ BẢNG ĐIỂM & HỌC LỰC (ACADEMIC GRADES)
  // ==============================================================
  async renderGrades() {
    const content = document.getElementById('admin-subtab-content');
    content.innerHTML = `
      <div class="flex items-center justify-center p-16 text-slate-400">
        <i class="fa-solid fa-circle-notch fa-spin text-3xl text-purple-500 mr-3"></i>
        <span>Đang tải bảng điểm học bạ các môn học...</span>
      </div>
    `;

    try {
      const res = await API.getAdminGrades(null, this.filters.gradeSubject);
      this.cache.grades = res.grades || [];

      content.innerHTML = `
        <div class="space-y-4">
          
          <!-- Filter bar -->
          <div class="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 flex flex-wrap items-center justify-between gap-3 shadow-lg">
            <div class="flex items-center space-x-3">
              <span class="text-xs text-slate-300 font-semibold"><i class="fa-solid fa-book text-purple-400 mr-1"></i> Lọc theo môn học:</span>
              <select id="admin-grade-subject-filter" class="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500" onchange="AdminPortal.changeGradeSubject(this.value)">
                <option value="">-- Tất Cả 5 Môn --</option>
                <option value="Toán" ${this.filters.gradeSubject === 'Toán' ? 'selected' : ''}>Toán Học</option>
                <option value="Ngữ văn" ${this.filters.gradeSubject === 'Ngữ văn' ? 'selected' : ''}>Ngữ Văn</option>
                <option value="Tiếng Anh" ${this.filters.gradeSubject === 'Tiếng Anh' ? 'selected' : ''}>Tiếng Anh</option>
                <option value="Vật lý" ${this.filters.gradeSubject === 'Vật lý' ? 'selected' : ''}>Vật Lý</option>
                <option value="Hóa học" ${this.filters.gradeSubject === 'Hóa học' ? 'selected' : ''}>Hóa Học</option>
              </select>
            </div>

            <div class="text-xs text-slate-400">
              Công thức ĐTB Môn: <code class="bg-slate-900 px-2 py-0.5 rounded text-purple-300 font-bold">(TX1 + TX2 + GK*2 + CK*3) / 7</code>
            </div>
          </div>

          <!-- Grades Table -->
          <div class="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-slate-300">
                <thead class="bg-slate-900/90 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-700">
                  <tr>
                    <th class="py-3 px-4 font-bold">Học Sinh</th>
                    <th class="py-3 px-4 font-bold">Môn Học</th>
                    <th class="py-3 px-4 font-bold">TX1</th>
                    <th class="py-3 px-4 font-bold">TX2</th>
                    <th class="py-3 px-4 font-bold">Giữa Kỳ (x2)</th>
                    <th class="py-3 px-4 font-bold">Cuối Kỳ (x3)</th>
                    <th class="py-3 px-4 font-bold">ĐTB Môn</th>
                    <th class="py-3 px-4 font-bold">Xu Hướng</th>
                    <th class="py-3 px-4 font-bold">Cảnh Báo</th>
                    <th class="py-3 px-4 font-bold text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-700/60">
                  ${this.cache.grades.map(g => {
                    const avg = g.average_score || 0;
                    const avgColor = avg >= 8.0 ? 'text-emerald-400' : (avg >= 6.5 ? 'text-indigo-400' : (avg >= 5.0 ? 'text-amber-400' : 'text-rose-400'));
                    
                    return `
                      <tr class="hover:bg-slate-700/30 transition">
                        <td class="py-3 px-4 font-bold text-white">${g.student_name} <span class="text-[10px] text-slate-500 font-normal">(#${g.student_id})</span></td>
                        <td class="py-3 px-4">
                          <span class="px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-500/30 font-bold">
                            ${g.subject}
                          </span>
                        </td>
                        <td class="py-3 px-4 font-mono font-bold">${g.tx1 !== null ? g.tx1.toFixed(1) : '—'}</td>
                        <td class="py-3 px-4 font-mono font-bold">${g.tx2 !== null ? g.tx2.toFixed(1) : '—'}</td>
                        <td class="py-3 px-4 font-mono font-bold text-sky-400">${g.gk !== null ? g.gk.toFixed(1) : '—'}</td>
                        <td class="py-3 px-4 font-mono font-bold text-indigo-400">${g.ck !== null ? g.ck.toFixed(1) : '—'}</td>
                        <td class="py-3 px-4 font-mono font-black text-sm ${avgColor}">${avg.toFixed(1)}</td>
                        <td class="py-3 px-4">
                          <span class="text-[11px] font-semibold ${g.trend === 'up' ? 'text-emerald-400' : (g.trend === 'down' ? 'text-rose-400' : 'text-slate-400')}">
                            ${g.trend === 'up' ? '▲ Tăng' : (g.trend === 'down' ? '▼ Giảm' : '— Ổn định')}
                          </span>
                        </td>
                        <td class="py-3 px-4">
                          ${g.is_warning ? `
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center w-fit">
                              <i class="fa-solid fa-triangle-exclamation mr-1"></i> Nguy cơ
                            </span>
                          ` : '<span class="text-emerald-400 text-xs">✓ An toàn</span>'}
                        </td>
                        <td class="py-3 px-4 text-right">
                          <button onclick="AdminPortal.openEditGradeModal(${g.id})" class="p-1.5 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white rounded-lg border border-purple-500/30 transition" title="Chỉnh sửa điểm số">
                            <i class="fa-solid fa-pen"></i> Sửa
                          </button>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      `;
    } catch (err) {
      content.innerHTML = `
        <div class="p-8 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-center">
          <p class="text-rose-300 text-xs">${err.message}</p>
        </div>
      `;
    }
  },

  changeGradeSubject(sub) {
    this.filters.gradeSubject = sub;
    this.renderGrades();
  },

  openEditGradeModal(gradeId) {
    const g = this.cache.grades.find(item => item.id === gradeId);
    if (!g) return;

    const modalContainer = document.getElementById('admin-modal-container');
    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 class="font-bold text-white text-base flex items-center">
              <i class="fa-solid fa-award text-purple-400 mr-2"></i> Cập Nhật Điểm: ${g.subject}
            </h3>
            <button onclick="AdminPortal.closeModal()" class="text-slate-400 hover:text-white"><i class="fa-solid fa-xmark text-lg"></i></button>
          </div>

          <p class="text-xs text-slate-300">Học sinh: <strong class="text-white">${g.student_name}</strong> (Mã HS: #${g.student_id})</p>

          <form id="admin-edit-grade-form" onsubmit="AdminPortal.submitEditGrade(event, ${g.id})" class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Điểm Thường Xuyên 1 (TX1)</label>
                <input type="number" step="0.1" min="0" max="10" id="grade-tx1" value="${g.tx1 !== null ? g.tx1 : ''}" required class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-bold">
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Điểm Thường Xuyên 2 (TX2)</label>
                <input type="number" step="0.1" min="0" max="10" id="grade-tx2" value="${g.tx2 !== null ? g.tx2 : ''}" required class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-bold">
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Điểm Giữa Kỳ (GK x2)</label>
                <input type="number" step="0.1" min="0" max="10" id="grade-gk" value="${g.gk !== null ? g.gk : ''}" required class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-bold text-sky-400">
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Điểm Cuối Kỳ (CK x3)</label>
                <input type="number" step="0.1" min="0" max="10" id="grade-ck" value="${g.ck !== null ? g.ck : ''}" required class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-bold text-indigo-400">
              </div>
            </div>

            <div class="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-[11px] text-purple-300">
              <i class="fa-solid fa-calculator mr-1"></i> Hệ thống tự động tính ĐTB Môn, phân loại xu hướng và tự động cập nhật lại GPA & Học Lực của học sinh!
            </div>

            <div class="pt-3 flex justify-end space-x-2 border-t border-slate-800">
              <button type="button" onclick="AdminPortal.closeModal()" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold">Hủy</button>
              <button type="submit" class="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-700/30">Lưu Điểm Số</button>
            </div>
          </form>
        </div>
      </div>
    `;
    modalContainer.classList.remove('hidden');
  },

  async submitEditGrade(event, gradeId) {
    event.preventDefault();
    const payload = {
      tx1: parseFloat(document.getElementById('grade-tx1').value),
      tx2: parseFloat(document.getElementById('grade-tx2').value),
      gk: parseFloat(document.getElementById('grade-gk').value),
      ck: parseFloat(document.getElementById('grade-ck').value)
    };

    try {
      showToast('Đang cập nhật điểm và tính toán lại GPA...', 'info');
      await API.updateAdminGrade(gradeId, payload);
      showToast('Cập nhật điểm thành công!', 'success');
      this.closeModal();
      this.renderGrades();
    } catch (err) {
      showToast('Lỗi: ' + err.message, 'danger');
    }
  },

  // ==============================================================
  // 7. SUB-TAB: QUẢN LÝ BÁO CÁO AI WRITER (AI REPORTS)
  // ==============================================================
  async renderAIReports() {
    const content = document.getElementById('admin-subtab-content');
    content.innerHTML = `
      <div class="flex items-center justify-center p-16 text-slate-400">
        <i class="fa-solid fa-circle-notch fa-spin text-3xl text-pink-500 mr-3"></i>
        <span>Đang tải các báo cáo AI đã khởi tạo...</span>
      </div>
    `;

    try {
      const res = await API.getAdminAIReports();
      this.cache.aiReports = res.reports || [];

      content.innerHTML = `
        <div class="space-y-4">
          
          <div class="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 flex flex-wrap items-center justify-between gap-3 shadow-lg">
            <div class="flex items-center space-x-2">
              <span class="text-xs text-slate-300 font-semibold"><i class="fa-solid fa-wand-magic-sparkles text-pink-400 mr-1"></i> Báo cáo tổng hợp tiến độ học sinh tự động bằng AI</span>
            </div>
            <div class="text-xs text-slate-400">
              Tổng số báo cáo: <strong class="text-pink-400 font-bold">${this.cache.aiReports.length}</strong>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${this.cache.aiReports.map(r => `
              <div class="bg-slate-800/80 rounded-2xl border ${r.approved ? 'border-emerald-500/40' : 'border-amber-500/40'} p-5 shadow-xl space-y-3">
                <div class="flex items-center justify-between pb-3 border-b border-slate-700">
                  <div>
                    <h4 class="font-bold text-sm text-white">${r.student_name} <span class="text-xs text-slate-400">(#${r.student_id})</span></h4>
                    <span class="text-[11px] text-pink-300 font-mono">${r.week_label || 'Tuần 8'}</span>
                  </div>
                  <div>
                    <span class="px-2.5 py-1 rounded-full text-[10px] font-bold ${r.approved ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}">
                      ${r.approved ? '✓ Đã Duyệt' : '⏳ Bản Nháp Chưa Duyệt'}
                    </span>
                  </div>
                </div>

                <div class="space-y-2 text-xs">
                  <div class="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span class="text-emerald-400 font-bold block mb-1">🌟 Điểm mạnh nổi bật:</span>
                    <p class="text-slate-300 leading-relaxed">${r.content_strengths || 'Học sinh tiếp thu nhanh, năng nổ.'}</p>
                  </div>
                  <div class="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span class="text-amber-400 font-bold block mb-1">⚠️ Cần cải thiện:</span>
                    <p class="text-slate-300 leading-relaxed">${r.content_improvements || 'Cần chú ý trình bày cẩn thận hơn.'}</p>
                  </div>
                  <div class="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span class="text-sky-400 font-bold block mb-1">💡 Lời khuyên phụ huynh:</span>
                    <p class="text-slate-300 leading-relaxed">${r.content_parent_advice || 'Khuyến khích em tự học 30p mỗi tối.'}</p>
                  </div>
                  ${r.teacher_edit ? `
                    <div class="p-2.5 bg-indigo-950/40 rounded-xl border border-indigo-500/30 text-indigo-200">
                      <span class="font-bold block mb-1">✍️ Ghi chú bổ sung từ GVCN:</span>
                      <p>${r.teacher_edit}</p>
                    </div>
                  ` : ''}
                </div>

                <div class="pt-3 border-t border-slate-700 flex justify-end space-x-2">
                  <button onclick="AdminPortal.openEditAIReportModal(${r.id})" class="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-xl text-xs font-bold transition">
                    <i class="fa-solid fa-pen mr-1"></i> Sửa / Duyệt Báo Cáo
                  </button>
                  <button onclick="AdminPortal.deleteAIReport(${r.id})" class="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-xl text-xs font-bold transition">
                    <i class="fa-solid fa-trash mr-1"></i> Xóa
                  </button>
                </div>
              </div>
            `).join('')}
          </div>

        </div>
      `;
    } catch (err) {
      content.innerHTML = `
        <div class="p-8 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-center">
          <p class="text-rose-300 text-xs">${err.message}</p>
        </div>
      `;
    }
  },

  openEditAIReportModal(reportId) {
    const r = this.cache.aiReports.find(item => item.id === reportId);
    if (!r) return;

    const modalContainer = document.getElementById('admin-modal-container');
    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 class="font-bold text-white text-base flex items-center">
              <i class="fa-solid fa-wand-magic-sparkles text-pink-400 mr-2"></i> Duyệt Báo Cáo: ${r.student_name}
            </h3>
            <button onclick="AdminPortal.closeModal()" class="text-slate-400 hover:text-white"><i class="fa-solid fa-xmark text-lg"></i></button>
          </div>

          <form id="admin-edit-ai-form" onsubmit="AdminPortal.submitEditAIReport(event, ${r.id})" class="space-y-3">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Ghi chú bổ sung từ Quản trị / GVCN</label>
              <textarea id="ai-teacher-edit" rows="3" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500">${r.teacher_edit || ''}</textarea>
            </div>

            <div class="flex items-center space-x-2">
              <input type="checkbox" id="ai-approved" ${r.approved ? 'checked' : ''} class="w-4 h-4 rounded text-pink-600 focus:ring-pink-500 bg-slate-800 border-slate-700">
              <label for="ai-approved" class="text-xs font-bold text-white">Phê duyệt và công bố báo cáo cho phụ huynh</label>
            </div>

            <div class="pt-3 flex justify-end space-x-2 border-t border-slate-800">
              <button type="button" onclick="AdminPortal.closeModal()" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold">Hủy</button>
              <button type="submit" class="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-pink-700/30">Cập Nhật Báo Cáo</button>
            </div>
          </form>
        </div>
      </div>
    `;
    modalContainer.classList.remove('hidden');
  },

  async submitEditAIReport(event, reportId) {
    event.preventDefault();
    const payload = {
      teacher_edit: document.getElementById('ai-teacher-edit').value.trim(),
      approved: document.getElementById('ai-approved').checked
    };

    try {
      showToast('Đang cập nhật báo cáo AI...', 'info');
      await API.updateAdminAIReport(reportId, payload);
      showToast('Cập nhật báo cáo thành công!', 'success');
      this.closeModal();
      this.renderAIReports();
    } catch (err) {
      showToast('Lỗi: ' + err.message, 'danger');
    }
  },

  async deleteAIReport(reportId) {
    if (!confirm('Bạn có chắc muốn xóa báo cáo AI này?')) return;
    try {
      await API.deleteAdminAIReport(reportId);
      showToast('Đã xóa báo cáo AI!', 'success');
      this.renderAIReports();
    } catch (err) {
      showToast('Lỗi: ' + err.message, 'danger');
    }
  },

  // ==============================================================
  // 8. SUB-TAB: QUẢN LÝ ĐƠN XIN NGHỈ PHÉP (ABSENCE REQUESTS)
  // ==============================================================
  async renderAbsences() {
    const content = document.getElementById('admin-subtab-content');
    content.innerHTML = `
      <div class="flex items-center justify-center p-16 text-slate-400">
        <i class="fa-solid fa-circle-notch fa-spin text-3xl text-cyan-500 mr-3"></i>
        <span>Đang tải danh sách đơn xin nghỉ phép...</span>
      </div>
    `;

    try {
      const res = await API.getAdminAbsences(this.filters.absenceStatus);
      this.cache.absences = res.requests || [];

      content.innerHTML = `
        <div class="space-y-4">
          
          <!-- Filter bar -->
          <div class="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 flex flex-wrap items-center justify-between gap-3 shadow-lg">
            <div class="flex items-center space-x-3">
              <span class="text-xs text-slate-300 font-semibold"><i class="fa-solid fa-filter text-cyan-400 mr-1"></i> Trạng thái đơn:</span>
              <select id="admin-absence-status-filter" class="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500" onchange="AdminPortal.changeAbsenceStatus(this.value)">
                <option value="">-- Tất Cả Đơn --</option>
                <option value="pending" ${this.filters.absenceStatus === 'pending' ? 'selected' : ''}>⏳ Chờ Phê Duyệt</option>
                <option value="approved" ${this.filters.absenceStatus === 'approved' ? 'selected' : ''}>✓ Đã Duyệt Có Phép</option>
                <option value="rejected" ${this.filters.absenceStatus === 'rejected' ? 'selected' : ''}>❌ Đã Từ Chối</option>
              </select>
            </div>

            <div class="text-xs text-slate-400">
              Tổng số đơn: <strong class="text-cyan-400 font-bold">${this.cache.absences.length}</strong>
            </div>
          </div>

          <!-- Absence Table -->
          <div class="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-slate-300">
                <thead class="bg-slate-900/90 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-700">
                  <tr>
                    <th class="py-3 px-4 font-bold">Mã Đơn</th>
                    <th class="py-3 px-4 font-bold">Học Sinh</th>
                    <th class="py-3 px-4 font-bold">Người Gửi (Phụ Huynh)</th>
                    <th class="py-3 px-4 font-bold">Thời Gian Nghỉ</th>
                    <th class="py-3 px-4 font-bold">Lý Do</th>
                    <th class="py-3 px-4 font-bold">Trạng Thái</th>
                    <th class="py-3 px-4 font-bold">Phản Hồi</th>
                    <th class="py-3 px-4 font-bold text-right">Phê Duyệt</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-700/60">
                  ${this.cache.absences.length === 0 ? `
                    <tr><td colspan="8" class="py-8 text-center text-slate-500 text-xs">Không có đơn xin nghỉ phép nào phù hợp.</td></tr>
                  ` : this.cache.absences.map(req => {
                    const statusBadge = {
                      'pending': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                      'approved': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                      'rejected': 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    }[req.status] || 'bg-slate-700 text-slate-300';

                    return `
                      <tr class="hover:bg-slate-700/30 transition">
                        <td class="py-3 px-4 font-mono text-slate-400">#${req.id}</td>
                        <td class="py-3 px-4 font-bold text-white">${req.student_name} <span class="text-[10px] text-slate-500 font-normal">(#${req.student_id})</span></td>
                        <td class="py-3 px-4 text-cyan-300 font-medium">${req.parent_name || 'Phụ huynh'}</td>
                        <td class="py-3 px-4 font-mono text-[11px] text-slate-300">${req.from_date} ➔ ${req.to_date}</td>
                        <td class="py-3 px-4 text-slate-200 max-w-xs truncate" title="${req.reason}">${req.reason}</td>
                        <td class="py-3 px-4">
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadge}">
                            ${req.status === 'pending' ? '⏳ Chờ duyệt' : (req.status === 'approved' ? '✓ Đã duyệt' : '❌ Từ chối')}
                          </span>
                        </td>
                        <td class="py-3 px-4 text-slate-400 text-[11px]">${req.teacher_reply || '—'}</td>
                        <td class="py-3 px-4 text-right">
                          ${req.status === 'pending' ? `
                            <div class="inline-flex items-center space-x-1.5">
                              <button onclick="AdminPortal.reviewAbsence(${req.id}, 'approved')" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md transition" title="Duyệt có phép (tự động ghi nhận điểm danh)">
                                ✓ Duyệt
                              </button>
                              <button onclick="AdminPortal.reviewAbsence(${req.id}, 'rejected')" class="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow-md transition" title="Từ chối đơn">
                                ✕
                              </button>
                            </div>
                          ` : `
                            <button onclick="AdminPortal.reviewAbsence(${req.id}, '${req.status}')" class="p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs font-semibold" title="Sửa phản hồi">
                              <i class="fa-solid fa-comment-dots"></i>
                            </button>
                          `}
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      `;
    } catch (err) {
      content.innerHTML = `
        <div class="p-8 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-center">
          <p class="text-rose-300 text-xs">${err.message}</p>
        </div>
      `;
    }
  },

  changeAbsenceStatus(status) {
    this.filters.absenceStatus = status;
    this.renderAbsences();
  },

  async reviewAbsence(requestId, defaultStatus) {
    const reply = prompt('Nhập lời nhắn phản hồi của GVCN / Ban Giám Hiệu gửi đến Phụ Huynh:', defaultStatus === 'approved' ? 'Nhà trường đã tiếp nhận đơn và xác nhận cho học sinh nghỉ có phép.' : 'Đề nghị phụ huynh liên hệ trực tiếp GVCN.');
    if (reply === null) return;

    try {
      showToast('Đang xử lý phê duyệt đơn nghỉ phép...', 'info');
      await API.reviewAdminAbsence(requestId, defaultStatus, reply);
      showToast('Xử lý đơn nghỉ phép thành công!', 'success');
      this.renderAbsences();
    } catch (err) {
      showToast('Lỗi: ' + err.message, 'danger');
    }
  },

  // ==============================================================
  // 9. SUB-TAB: GATEWAY RBAC AUDIT & BẢO TRÌ SUPABASE CLOUD
  // ==============================================================
  async renderMaintenance() {
    const content = document.getElementById('admin-subtab-content');
    content.innerHTML = `
      <div class="flex items-center justify-center p-16 text-slate-400">
        <i class="fa-solid fa-circle-notch fa-spin text-3xl text-teal-500 mr-3"></i>
        <span>Đang đọc nhật ký Gateway RBAC và trạng thái CSDL...</span>
      </div>
    `;

    try {
      const res = await API.getAdminAuditLogs();
      this.cache.auditLogs = res.audit_logs || [];

      content.innerHTML = `
        <div class="space-y-6">
          
          <!-- Cloud Maintenance Console -->
          <div class="p-6 bg-slate-800/80 rounded-2xl border border-teal-500/30 shadow-xl space-y-4">
            <div class="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 class="text-base font-bold text-white flex items-center">
                  <i class="fa-solid fa-cloud-arrow-up text-teal-400 mr-2 text-lg"></i> Bảng Điều Khiển Bảo Trì Supabase Cloud & Sao Lưu
                </h3>
                <p class="text-xs text-slate-300 mt-1">Đồng bộ toàn vẹn cả 8 bảng dữ liệu quan hệ sang đám mây Supabase PostgreSQL hoặc tải bản snapshot JSON về máy tính.</p>
              </div>

              <div class="flex flex-wrap items-center gap-3">
                <button onclick="AdminPortal.syncAllSupabase()" class="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-700/30 flex items-center space-x-2 transition">
                  <i class="fa-solid fa-arrows-rotate"></i>
                  <span>Đồng Bộ Ngay 8 Bảng Dữ Liệu</span>
                </button>
                <button onclick="AdminPortal.exportBackupJson()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-700/30 flex items-center space-x-2 transition">
                  <i class="fa-solid fa-download"></i>
                  <span>Tải Bản Snapshot JSON</span>
                </button>
              </div>
            </div>

            <!-- Table Synchronizer Checklist -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
              ${[
                { name: 'users', label: 'Tài khoản & RBAC', icon: 'fa-users' },
                { name: 'students', label: 'Học sinh 360°', icon: 'fa-graduation-cap' },
                { name: 'attendance_logs', label: 'Điểm danh chuyên cần', icon: 'fa-clipboard-check' },
                { name: 'gamified_points_logs', label: 'Nhật ký thi đua', icon: 'fa-trophy' },
                { name: 'academic_grades', label: 'Bảng điểm 5 môn', icon: 'fa-award' },
                { name: 'ai_reports', label: 'Báo cáo AI Writer', icon: 'fa-wand-magic-sparkles' },
                { name: 'parent_communications', label: 'Kênh phụ huynh', icon: 'fa-paper-plane' },
                { name: 'absence_requests', label: 'Đơn xin nghỉ phép', icon: 'fa-envelope-open-text' }
              ].map(t => `
                <div class="p-3 bg-slate-900/80 rounded-xl border border-slate-700/60 flex items-center space-x-2.5">
                  <i class="fa-solid ${t.icon} text-teal-400"></i>
                  <div>
                    <div class="font-bold text-white text-xs">${t.label}</div>
                    <code class="text-[10px] text-slate-400">${t.name}</code>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- RBAC Gateway Audit Trail Table -->
          <div class="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden shadow-xl space-y-3 p-5">
            <div class="flex items-center justify-between pb-3 border-b border-slate-700">
              <h4 class="font-bold text-sm text-white flex items-center">
                <i class="fa-solid fa-shield-virus text-indigo-400 mr-2"></i> Nhật Ký Truy Cập RBAC Gateway Audit (Real-time 50 Events)
              </h4>
              <span class="text-xs text-slate-400">Chặn & ghi nhận mọi thao tác phân quyền</span>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-slate-300">
                <thead class="bg-slate-900/90 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-700">
                  <tr>
                    <th class="py-2.5 px-3 font-bold">Thời Gian</th>
                    <th class="py-2.5 px-3 font-bold">Tài Khoản / Role</th>
                    <th class="py-2.5 px-3 font-bold">Hành Động</th>
                    <th class="py-2.5 px-3 font-bold">Method & Path</th>
                    <th class="py-2.5 px-3 font-bold">Client IP</th>
                    <th class="py-2.5 px-3 font-bold text-right">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-700/60 font-mono text-[11px]">
                  ${this.cache.auditLogs.length === 0 ? `
                    <tr><td colspan="6" class="py-6 text-center text-slate-500">Chưa ghi nhận sự kiện bảo mật nào.</td></tr>
                  ` : this.cache.auditLogs.map(log => `
                    <tr class="hover:bg-slate-700/30 transition">
                      <td class="py-2.5 px-3 text-slate-400">${log.timestamp ? log.timestamp.split('T')[1] : '—'}</td>
                      <td class="py-2.5 px-3">
                        <span class="font-bold text-white">${log.username || 'anonymous'}</span>
                        <span class="text-[10px] text-indigo-400">(${log.role || 'guest'})</span>
                      </td>
                      <td class="py-2.5 px-3 font-sans font-semibold text-slate-200">${log.action || 'API Request'}</td>
                      <td class="py-2.5 px-3">
                        <span class="px-1.5 py-0.5 rounded bg-slate-900 text-teal-300 font-bold mr-1">${log.method || 'GET'}</span>
                        <span class="text-slate-400 truncate">${log.path || '/'}</span>
                      </td>
                      <td class="py-2.5 px-3 text-slate-500">${log.ip || '127.0.0.1'}</td>
                      <td class="py-2.5 px-3 text-right">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${log.status >= 400 ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}">
                          ${log.status || 200} OK
                        </span>
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
      content.innerHTML = `
        <div class="p-8 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-center">
          <p class="text-rose-300 text-xs">${err.message}</p>
        </div>
      `;
    }
  },

  // ==============================================================
  // GLOBAL ADMIN UTILITIES (SUPABASE SYNC & BACKUP EXPORT)
  // ==============================================================
  async syncAllSupabase() {
    showToast('Đang kết nối và đồng bộ toàn diện 8 bảng dữ liệu lên Supabase Cloud...', 'info');
    try {
      const res = await API.syncAllTablesToSupabase();
      const s = res.summary || {};
      showToast(`Đồng bộ Supabase thành công! Đã chuyển: ${s.users || 0} users, ${s.students || 0} students, ${s.academic_grades || 0} grades...`, 'success');
      this.refreshCurrentSubTab();
    } catch (err) {
      showToast('Đồng bộ Supabase thất bại: ' + err.message, 'danger');
    }
  },

  async exportBackupJson() {
    showToast('Đang kết xuất bản sao lưu JSON toàn bộ hệ thống...', 'info');
    try {
      const data = await API.exportDatabaseBackup();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `homeroom360_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Tải bản sao lưu JSON hoàn tất!', 'success');
    } catch (err) {
      showToast('Xuất bản sao lưu thất bại: ' + err.message, 'danger');
    }
  },

  closeModal() {
    const modalContainer = document.getElementById('admin-modal-container');
    if (modalContainer) {
      modalContainer.classList.add('hidden');
      modalContainer.innerHTML = '';
    }
  }
};
