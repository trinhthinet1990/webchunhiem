/**
 * Main Application Orchestrator for Homeroom 360°
 */
const App = {
  currentTab: 'architecture',

  init() {
    this.setupEventListeners();
    this.updateRoleUI();
    if (typeof AuthModal !== 'undefined') {
      AuthModal.initAuth();
    }
    this.switchTab('architecture');
  },

  setupEventListeners() {
    // Role selector change
    const roleSelector = document.getElementById('global-role-selector');
    if (roleSelector) {
      roleSelector.value = API.currentRole;
      roleSelector.addEventListener('change', (e) => {
        this.switchRole(e.target.value);
      });
    }
  },

  switchRole(newRole) {
    API.setRole(newRole);
    this.updateRoleUI();
    if (typeof AuthModal !== 'undefined') {
      AuthModal.renderNavUser();
    }

    showToast(`Đã chuyển vai trò RBAC: ${API.currentRole.toUpperCase()}`, 'info');

    // Auto navigate to role specific portal if relevant
    if (newRole === 'admin') {
      this.switchTab('admin_portal');
    } else if (newRole === 'monitor') {
      this.switchTab('monitor_portal');
    } else if (newRole === 'parent_student') {
      this.switchTab('parent_portal');
    } else {
      if (this.currentTab === 'monitor_portal' || this.currentTab === 'parent_portal' || this.currentTab === 'admin_portal') {
        this.switchTab('seatmap');
      } else {
        this.refreshCurrentTab();
      }
    }
  },

  updateRoleUI() {
    const roleBadge = document.getElementById('current-role-badge');
    const roleSelector = document.getElementById('global-role-selector');
    if (roleSelector) roleSelector.value = API.currentRole;

    if (roleBadge) {
      let roleText = '👑 GVCN (Toàn quyền)';
      let badgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';

      if (API.currentUser && API.currentUser.role === API.currentRole) {
        if (API.currentUser.duty) {
          roleText = `⭐ ${API.currentUser.duty}`;
          badgeClass = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
        } else if (API.currentUser.role_label) {
          roleText = API.currentUser.role_label;
          if (API.currentUser.role === 'admin') badgeClass = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
          else if (API.currentUser.role === 'teacher') badgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
          else if (API.currentUser.role === 'monitor') badgeClass = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
          else badgeClass = 'bg-sky-500/20 text-sky-300 border-sky-500/40';
        }
      } else {
        const config = {
          'admin': { text: '🛡️ Quản Trị Viên (Admin 360°)', class: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
          'teacher': { text: '👑 GVCN (Toàn quyền)', class: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
          'monitor': { text: '⭐ Cán sự lớp (Hỗ trợ)', class: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
          'parent_student': { text: '👨‍👩‍👧 Cổng Phụ Huynh', class: 'bg-sky-500/20 text-sky-300 border-sky-500/40' },
          'student': { text: '🎓 Học Sinh', class: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' }
        }[API.currentRole] || { text: API.currentRole, class: 'bg-slate-700 text-slate-300' };
        roleText = config.text;
        badgeClass = config.class;
      }

      roleBadge.className = `px-3 py-1 text-xs rounded-full border font-semibold flex items-center space-x-1.5 ${badgeClass}`;
      roleBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-current animate-pulse mr-1"></span> ${roleText}`;
    }
  },

  switchTab(tabId) {
    this.currentTab = tabId;

    // Update nav links styling
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      if (btn.getAttribute('data-tab') === tabId) {
        btn.classList.add('bg-indigo-600', 'text-white', 'shadow-lg');
        btn.classList.remove('text-slate-400', 'hover:text-slate-200');
      } else {
        btn.classList.remove('bg-indigo-600', 'text-white', 'shadow-lg');
        btn.classList.add('text-slate-400', 'hover:text-slate-200');
      }
    });

    // Hide all tab views
    document.querySelectorAll('.tab-view-pane').forEach(pane => {
      pane.classList.add('hidden');
    });

    // Show target tab
    const targetPane = document.getElementById(`tab-pane-${tabId}`);
    if (targetPane) {
      targetPane.classList.remove('hidden');
    }

    // Refresh data for the specific tab
    this.refreshCurrentTab();
  },

  async syncToSupabase() {
    showToast('Đang kết nối & đồng bộ dữ liệu tài khoản lên Supabase Cloud...', 'info');
    try {
      const res = await API.syncAllToSupabase();
      showToast(res.message || 'Đồng bộ Supabase Cloud hoàn tất!', 'success');
    } catch (err) {
      showToast('Đồng bộ thất bại: ' + err.message, 'danger');
    }
  },

  refreshCurrentTab() {
    switch (this.currentTab) {
      case 'architecture':
        ArchitectureVisualizer.render();
        break;
      case 'seatmap':
        TeacherDashboard.renderSeatMap();
        break;
      case 'attendance':
        TeacherDashboard.renderAttendanceView();
        break;
      case 'gamification':
        TeacherDashboard.renderGamificationView();
        break;
      case 'academic':
        TeacherDashboard.renderAcademicView();
        break;
      case 'ai_report':
        TeacherDashboard.renderAIReportView();
        break;
      case 'communication':
        TeacherDashboard.renderCommunicationView();
        break;
      case 'monitor_portal':
        MonitorPortal.render();
        break;
      case 'parent_portal':
        ParentPortal.render();
        break;
      case 'admin_portal':
        if (typeof AdminPortal !== 'undefined') {
          AdminPortal.render();
        }
        break;
    }
  }
};

// Global Toast notification utility
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const bg = {
    'success': 'bg-emerald-600 text-white',
    'danger': 'bg-rose-600 text-white',
    'warning': 'bg-amber-600 text-white',
    'info': 'bg-indigo-600 text-white'
  }[type] || 'bg-slate-800 text-white';

  toast.className = `p-3.5 rounded-xl shadow-2xl flex items-center space-x-3 text-xs font-semibold transform transition-all duration-300 translate-y-2 opacity-0 ${bg}`;
  toast.innerHTML = `
    <i class="fa-solid ${type === 'success' ? 'fa-circle-check' : (type === 'danger' ? 'fa-triangle-exclamation' : 'fa-bell')} text-base"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  });

  // Remove after 3.5s
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Bootstrap on window load
window.addEventListener('DOMContentLoaded', () => {
  App.init();
});
