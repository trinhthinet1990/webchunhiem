/**
 * Interactive System Architecture Flow Visualizer
 * Accurately implements the diagram from AI Architecture Studio
 */
const ArchitectureVisualizer = {
  selectedComponent: null,

  async render() {
    const container = document.getElementById('architecture-container');
    if (!container) return;

    try {
      const data = await API.getArchitectureStatus();
      this.renderDiagram(container, data);
    } catch (err) {
      container.innerHTML = `<div class="p-8 text-center text-rose-400">Không thể tải thông tin sơ đồ kiến trúc: ${err.message}</div>`;
    }
  },

  renderDiagram(container, data) {
    const tiers = data.tiers;

    container.innerHTML = `
      <div class="relative bg-slate-900/90 rounded-2xl p-6 border border-slate-700/60 shadow-2xl overflow-x-auto">
        <!-- Header info -->
        <div class="flex flex-wrap items-center justify-between pb-6 border-b border-slate-800 gap-4">
          <div>
            <div class="flex items-center space-x-3">
              <span class="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></span>
              <h2 class="text-xl font-bold text-white tracking-wide">Luồng Hoạt Động Mới • Homeroom AI Architecture</h2>
            </div>
            <p class="text-xs text-slate-400 mt-1">Sơ đồ luồng dữ liệu 4 tầng độc lập: Giao diện ➔ Bảo mật RBAC ➔ Nghiệp vụ API ➔ CSDL tập trung</p>
          </div>
          <div class="flex items-center space-x-3 text-xs">
            <span class="px-3 py-1 bg-slate-800 text-indigo-300 rounded-full border border-indigo-500/30">
              <i class="fa-solid fa-code-branch mr-1"></i> Version 2.5.0
            </span>
            <span class="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/30">
              <i class="fa-solid fa-signal mr-1"></i> Tác giả: Nết Trình • AI Studio
            </span>
          </div>
        </div>

        <!-- Architecture 4-Tier Grid Canvas -->
        <div class="relative grid grid-cols-1 md:grid-cols-4 gap-6 mt-8 min-w-[950px]">
          
          <!-- TIER 1: FRONTEND -->
          <div class="arch-tier-box p-5 rounded-2xl bg-indigo-950/20 border-2 border-dashed border-indigo-500/40 flex flex-col space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-indigo-500/20">
              <div class="flex items-center space-x-2">
                <span class="px-2 py-0.5 text-[11px] font-bold uppercase rounded bg-indigo-600 text-white">TẦNG GIAO DIỆN (FRONTEND)</span>
              </div>
              <i class="fa-solid fa-desktop text-indigo-400 text-sm"></i>
            </div>

            <!-- Component 1.1 -->
            <div class="arch-node p-4 border border-indigo-500/30 hover:border-indigo-400 bg-slate-800/90 rounded-xl"
                 onclick="ArchitectureVisualizer.inspect('gvcn_dashboard')">
              <div class="flex items-start justify-between">
                <div class="flex items-center space-x-2">
                  <span class="text-lg">💻 🧑‍🏫</span>
                  <h4 class="font-bold text-sm text-indigo-200">Dashboard GVCN</h4>
                </div>
                <span class="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded">Toàn quyền</span>
              </div>
              <p class="text-xs text-slate-300 mt-2 line-clamp-2">Giao diện quản lý sơ đồ lớp, điểm danh, xem báo cáo, nhận xét AI, thi đua...</p>
              <div class="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-700/60">
                <span class="text-indigo-400"><i class="fa-solid fa-user-shield mr-1"></i>Role: teacher</span>
                <span class="text-emerald-400">● 30 Học sinh</span>
              </div>
            </div>

            <!-- Component 1.2 -->
            <div class="arch-node p-4 border border-indigo-500/30 hover:border-indigo-400 bg-slate-800/90 rounded-xl"
                 onclick="ArchitectureVisualizer.inspect('parent_portal')">
              <div class="flex items-start justify-between">
                <div class="flex items-center space-x-2">
                  <span class="text-lg">📱 👨‍👩‍👧</span>
                  <h4 class="font-bold text-sm text-indigo-200">Cổng Phụ Huynh & Học Sinh</h4>
                </div>
                <span class="text-[10px] px-2 py-0.5 bg-sky-500/20 text-sky-300 rounded">Tra cứu</span>
              </div>
              <p class="text-xs text-slate-300 mt-2 line-clamp-2">Tra cứu kết quả rèn luyện, chuyên cần, thông báo & nộp đơn nghỉ học...</p>
              <div class="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-700/60">
                <span class="text-sky-400"><i class="fa-solid fa-users mr-1"></i>Role: parent_student</span>
                <span class="text-sky-300">● 100% Online</span>
              </div>
            </div>

            <!-- Component 1.3 -->
            <div class="arch-node p-4 border border-indigo-500/30 hover:border-indigo-400 bg-slate-800/90 rounded-xl"
                 onclick="ArchitectureVisualizer.inspect('monitor_portal')">
              <div class="flex items-start justify-between">
                <div class="flex items-center space-x-2">
                  <span class="text-lg">📱 🎖️</span>
                  <h4 class="font-bold text-sm text-indigo-200">Cổng Cán Sự Lớp</h4>
                </div>
                <span class="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded">Hỗ trợ</span>
              </div>
              <p class="text-xs text-slate-300 mt-2 line-clamp-2">Giao diện hỗ trợ cán sự lớp thực hiện điểm danh nhanh và ghi nhận thi đua nề nếp...</p>
              <div class="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-700/60">
                <span class="text-amber-400"><i class="fa-solid fa-bolt mr-1"></i>Role: monitor</span>
                <span class="text-amber-300">● 1-Click Action</span>
              </div>
            </div>
          </div>

          <!-- TIER 2: SECURITY & MIDDLEWARE -->
          <div class="arch-tier-box p-5 rounded-2xl bg-amber-950/20 border-2 border-dashed border-amber-500/40 flex flex-col justify-center space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-amber-500/20">
              <div class="flex items-center space-x-2">
                <span class="px-2 py-0.5 text-[11px] font-bold uppercase rounded bg-amber-600 text-white">TẦNG BẢO MẬT & MIDDLEWARE</span>
              </div>
              <i class="fa-solid fa-shield-halved text-amber-400 text-sm"></i>
            </div>

            <!-- Component 2.1 -->
            <div class="arch-node p-5 border border-amber-500/40 hover:border-amber-300 bg-slate-800/90 rounded-xl shadow-lg my-auto"
                 onclick="ArchitectureVisualizer.inspect('api_gateway_rbac')">
              <div class="flex items-center space-x-2">
                <span class="text-2xl">🛡️ 🔑</span>
                <h4 class="font-bold text-sm text-amber-200">API Gateway & RBAC Auth Guard</h4>
              </div>
              <p class="text-xs text-slate-300 mt-3 leading-relaxed">
                Xác thực người dùng và phân quyền truy cập rõ ràng theo vai trò (Teacher, Monitor, Parent). Chặn truy cập trái phép và bảo vệ dữ liệu.
              </p>
              <div class="mt-4 p-3 bg-slate-900/80 rounded-lg border border-amber-500/20">
                <div class="text-[11px] text-amber-400 font-mono flex items-center justify-between">
                  <span>Trạng thái: Enforcing</span>
                  <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>
                <div class="text-[10px] text-slate-400 mt-1 font-mono">Header: X-User-Role</div>
              </div>
            </div>
          </div>

          <!-- TIER 3: BACKEND API -->
          <div class="arch-tier-box p-5 rounded-2xl bg-sky-950/20 border-2 border-dashed border-sky-500/40 flex flex-col space-y-3">
            <div class="flex items-center justify-between pb-3 border-b border-sky-500/20">
              <div class="flex items-center space-x-2">
                <span class="px-2 py-0.5 text-[11px] font-bold uppercase rounded bg-sky-600 text-white">TẦNG NGHIỆP VỤ (BACKEND API)</span>
              </div>
              <i class="fa-solid fa-server text-sky-400 text-sm"></i>
            </div>

            <!-- 3.1 -->
            <div class="arch-node p-3 border border-sky-500/30 hover:border-sky-300 bg-slate-800/90 rounded-xl"
                 onclick="ArchitectureVisualizer.inspect('seatmap_ctrl')">
              <div class="flex items-center space-x-2">
                <span>⚙️ 🪑</span>
                <h5 class="font-bold text-xs text-sky-200">Profile & Smart SeatMap Controller</h5>
              </div>
              <p class="text-[11px] text-slate-300 mt-1">Quản lý hồ sơ 360° học sinh và vị trí sơ đồ lớp học tương tác...</p>
            </div>

            <!-- 3.2 -->
            <div class="arch-node p-3 border border-sky-500/30 hover:border-sky-300 bg-slate-800/90 rounded-xl"
                 onclick="ArchitectureVisualizer.inspect('attendance_ctrl')">
              <div class="flex items-center space-x-2">
                <span>⚙️ 📋</span>
                <h5 class="font-bold text-xs text-sky-200">Attendance & Gamified Point Controller</h5>
              </div>
              <p class="text-[11px] text-slate-300 mt-1">Xử lý điểm danh chuyên cần, cộng/trừ điểm thi đua nề nếp sống...</p>
            </div>

            <!-- 3.3 -->
            <div class="arch-node p-3 border border-sky-500/30 hover:border-sky-300 bg-slate-800/90 rounded-xl"
                 onclick="ArchitectureVisualizer.inspect('academic_ctrl')">
              <div class="flex items-center space-x-2">
                <span>⚙️ 📈</span>
                <h5 class="font-bold text-xs text-sky-200">Academic & Conduct Controller</h5>
              </div>
              <p class="text-[11px] text-slate-300 mt-1">Tổng hợp điểm số học lực, cảnh báo học tập sút giảm và xếp loại...</p>
            </div>

            <!-- 3.4 -->
            <div class="arch-node p-3 border border-sky-500/30 hover:border-sky-300 bg-slate-800/90 rounded-xl"
                 onclick="ArchitectureVisualizer.inspect('ai_report_engine')">
              <div class="flex items-center space-x-2">
                <span>⚙️ 🤖</span>
                <h5 class="font-bold text-xs text-sky-200">AI Report Writer Engine</h5>
              </div>
              <p class="text-[11px] text-slate-300 mt-1">Phân tích dữ liệu học lực, nề nếp sống để tự động sinh nhận xét học sinh...</p>
            </div>

            <!-- 3.5 -->
            <div class="arch-node p-3 border border-sky-500/30 hover:border-sky-300 bg-slate-800/90 rounded-xl"
                 onclick="ArchitectureVisualizer.inspect('parent_comm_worker')">
              <div class="flex items-center space-x-2">
                <span>⚙️ 📬</span>
                <h5 class="font-bold text-xs text-sky-200">Parent Communication Worker</h5>
              </div>
              <p class="text-[11px] text-slate-300 mt-1">Tự động gửi báo cáo tuần/tháng và cảnh báo vắng học qua Zalo/SMS...</p>
            </div>
          </div>

          <!-- TIER 4: DATABASE -->
          <div class="arch-tier-box p-5 rounded-2xl bg-emerald-950/20 border-2 border-dashed border-emerald-500/40 flex flex-col justify-center space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-emerald-500/20">
              <div class="flex items-center space-x-2">
                <span class="px-2 py-0.5 text-[11px] font-bold uppercase rounded bg-emerald-600 text-white">TẦNG CƠ SỞ DỮ LIỆU (DATABASE)</span>
              </div>
              <i class="fa-solid fa-database text-emerald-400 text-sm"></i>
            </div>

            <!-- Component 4.1 -->
            <div class="arch-node p-5 border border-emerald-500/40 hover:border-emerald-300 bg-slate-800/90 rounded-xl shadow-lg my-auto"
                 onclick="ArchitectureVisualizer.inspect('homeroom_db')">
              <div class="flex items-center space-x-2">
                <span class="text-2xl">🗄️ 💾</span>
                <h4 class="font-bold text-sm text-emerald-200">Main Homeroom DB</h4>
              </div>
              <p class="text-xs text-slate-300 mt-3 leading-relaxed">
                Lưu trữ tập trung hồ sơ học sinh, sơ đồ chỗ ngồi, lịch sử điểm danh, điểm thi đua, học bạ, liên lạc phụ huynh.
              </p>
              <div class="mt-4 p-3 bg-slate-900/80 rounded-lg border border-emerald-500/20 space-y-1.5 text-[11px] font-mono">
                <div class="text-emerald-400">● 8 Bảng dữ liệu quan hệ</div>
                <div class="text-slate-400">● SQLite Engine</div>
                <div class="text-slate-400">● Tốc độ truy vấn &lt; 2ms</div>
              </div>
            </div>
          </div>

        </div>

        <!-- Footer watermark from diagram -->
        <div class="mt-8 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400">
          <div class="flex items-center space-x-2">
            <i class="fa-solid fa-graduation-cap text-indigo-400"></i>
            <span>Tác giả: <strong>Nết Trình • AI Architecture Studio</strong></span>
          </div>
          <div>
            <span>Xuất bản: <strong>05/10/2026</strong> | <strong>homeroom.alphacap.vn</strong></span>
          </div>
        </div>
      </div>

      <!-- Component Inspector Drawer Modal -->
      <div id="arch-inspector-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
        <div class="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl overflow-hidden relative">
          <button onclick="ArchitectureVisualizer.closeInspector()" class="absolute top-4 right-4 text-slate-400 hover:text-white text-xl">
            <i class="fa-solid fa-xmark"></i>
          </button>
          <div id="arch-inspector-content">
            <!-- Dynamic content injected here -->
          </div>
        </div>
      </div>
    `;
  },

  async inspect(componentId) {
    const modal = document.getElementById('arch-inspector-modal');
    const content = document.getElementById('arch-inspector-content');
    if (!modal || !content) return;

    modal.classList.remove('hidden');
    content.innerHTML = `<div class="p-6 text-center text-slate-300"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Đang lấy thông tin khối kiến trúc...</div>`;

    const statusData = await API.getArchitectureStatus();
    let compInfo = null;

    // Search across tiers
    for (const tierKey in statusData.tiers) {
      const found = statusData.tiers[tierKey].components.find(c => c.id === componentId);
      if (found) {
        compInfo = { ...found, tier: statusData.tiers[tierKey].name };
        break;
      }
    }

    if (!compInfo) {
      content.innerHTML = `<div class="p-4 text-rose-400">Không tìm thấy thông tin thành phần</div>`;
      return;
    }

    content.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-center space-x-3">
          <span class="px-2.5 py-1 text-xs font-bold rounded bg-indigo-600 text-white">${compInfo.tier}</span>
          <h3 class="text-xl font-bold text-white">${compInfo.title}</h3>
        </div>

        <p class="text-sm text-slate-300 leading-relaxed">${compInfo.desc}</p>

        <div class="p-4 bg-slate-800/80 rounded-xl border border-slate-700 space-y-2 text-xs">
          <div class="flex justify-between py-1 border-b border-slate-700/50">
            <span class="text-slate-400">Trạng thái:</span>
            <span class="text-emerald-400 font-semibold flex items-center">
              <span class="w-2 h-2 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span> HOẠT ĐỘNG TỐT (${compInfo.status || 'ONLINE'})
            </span>
          </div>
          ${compInfo.endpoint ? `
            <div class="flex justify-between py-1 border-b border-slate-700/50">
              <span class="text-slate-400">REST Endpoints:</span>
              <span class="font-mono text-indigo-300">${compInfo.endpoint}</span>
            </div>
          ` : ''}
          ${compInfo.target_role ? `
            <div class="flex justify-between py-1 border-b border-slate-700/50">
              <span class="text-slate-400">Yêu cầu RBAC Role:</span>
              <span class="font-mono text-amber-300">${compInfo.target_role}</span>
            </div>
          ` : ''}
          ${compInfo.metrics ? `
            <div class="flex justify-between py-1 border-b border-slate-700/50">
              <span class="text-slate-400">Chỉ số thực tế:</span>
              <span class="text-sky-300 font-semibold">${compInfo.metrics}</span>
            </div>
          ` : ''}
        </div>

        <div class="pt-4 flex justify-end space-x-3">
          <button onclick="ArchitectureVisualizer.closeInspector()" class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm">
            Đóng
          </button>
          <button onclick="ArchitectureVisualizer.jumpToView('${componentId}')" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium">
            <i class="fa-solid fa-arrow-up-right-from-square mr-1.5"></i> Mở phân hệ này trên website
          </button>
        </div>
      </div>
    `;
  },

  closeInspector() {
    const modal = document.getElementById('arch-inspector-modal');
    if (modal) modal.classList.add('hidden');
  },

  jumpToView(componentId) {
    this.closeInspector();
    if (componentId === 'gvcn_dashboard' || componentId === 'seatmap_ctrl') {
      App.switchTab('seatmap');
    } else if (componentId === 'parent_portal') {
      App.switchRole('parent_student');
      App.switchTab('parent_portal');
    } else if (componentId === 'monitor_portal') {
      App.switchRole('monitor');
      App.switchTab('monitor_portal');
    } else if (componentId === 'attendance_ctrl') {
      App.switchTab('attendance');
    } else if (componentId === 'academic_ctrl') {
      App.switchTab('academic');
    } else if (componentId === 'ai_report_engine') {
      App.switchTab('ai_report');
    } else if (componentId === 'parent_comm_worker') {
      App.switchTab('communication');
    }
  }
};
