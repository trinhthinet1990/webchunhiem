/**
 * Authentication & Supabase Synchronization Module
 * Handles Login, Registration, Session Management, and Role Synchronization
 */
const AuthModal = {
  studentsLoaded: false,

  open(tab = 'login') {
    const modal = document.getElementById('auth-modal');
    if (!modal) return;
    this.clearAlert();
    this.switchTab(tab);
    modal.classList.remove('hidden');

    if (!this.studentsLoaded) {
      this.populateStudentDropdown();
    }
  },

  close() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
    this.clearAlert();
  },

  switchTab(tab) {
    const btnLogin = document.getElementById('auth-tab-btn-login');
    const btnRegister = document.getElementById('auth-tab-btn-register');
    const formLogin = document.getElementById('form-login');
    const formRegister = document.getElementById('form-register');

    this.clearAlert();

    if (tab === 'login') {
      btnLogin.className = 'py-2 text-xs font-bold rounded-lg transition flex items-center justify-center space-x-1.5 bg-indigo-600 text-white shadow';
      btnRegister.className = 'py-2 text-xs font-bold rounded-lg transition flex items-center justify-center space-x-1.5 text-slate-400 hover:text-white';
      formLogin.classList.remove('hidden');
      formRegister.classList.add('hidden');
    } else {
      btnRegister.className = 'py-2 text-xs font-bold rounded-lg transition flex items-center justify-center space-x-1.5 bg-emerald-600 text-white shadow';
      btnLogin.className = 'py-2 text-xs font-bold rounded-lg transition flex items-center justify-center space-x-1.5 text-slate-400 hover:text-white';
      formLogin.classList.add('hidden');
      formRegister.classList.remove('hidden');
    }
  },

  togglePassword(inputId, btnEl) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const icon = btnEl.querySelector('i');
    if (input.type === 'password') {
      input.type = 'text';
      if (icon) {
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
      }
    } else {
      input.type = 'password';
      if (icon) {
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
      }
    }
  },

  quickFill(username, password) {
    this.switchTab('login');
    const uInput = document.getElementById('login-username');
    const pInput = document.getElementById('login-password');
    if (uInput) uInput.value = username;
    if (pInput) pInput.value = password;
  },

  onRoleChange(role) {
    const picker = document.getElementById('reg-student-picker');
    if (!picker) return;
    if (role === 'teacher') {
      picker.classList.add('hidden');
    } else {
      picker.classList.remove('hidden');
    }
  },

  async populateStudentDropdown() {
    const select = document.getElementById('reg-student-id');
    if (!select) return;

    try {
      const students = await API.getStudents();
      select.innerHTML = '';
      students.forEach(st => {
        const opt = document.createElement('option');
        opt.value = st.id;
        opt.textContent = `${st.student_code} - ${st.full_name} (Bàn ${st.seat_row}-${st.seat_col})`;
        select.appendChild(opt);
      });
      this.studentsLoaded = true;
    } catch (err) {
      console.warn('Không thể tải danh sách học sinh:', err);
      select.innerHTML = '<option value="1">Học sinh mặc định</option>';
    }
  },

  showAlert(message, type = 'error') {
    const box = document.getElementById('auth-alert');
    if (!box) return;
    box.classList.remove('hidden');

    if (type === 'error') {
      box.className = 'p-3 rounded-xl text-xs font-medium flex items-center space-x-2 bg-rose-500/10 border border-rose-500/30 text-rose-300';
      box.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-rose-400 text-sm"></i><span>${message}</span>`;
    } else {
      box.className = 'p-3 rounded-xl text-xs font-medium flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300';
      box.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-400 text-sm"></i><span>${message}</span>`;
    }
  },

  clearAlert() {
    const box = document.getElementById('auth-alert');
    if (box) {
      box.classList.add('hidden');
      box.innerHTML = '';
    }
  },

  async handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const submitBtn = document.getElementById('btn-login-submit');

    if (!username || !password) {
      this.showAlert('Vui lòng điền đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    const originalBtnHtml = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Đang xác thực...';

    try {
      const res = await API.login(username, password);
      showToast(res.message || 'Đăng nhập thành công!', 'success');
      this.close();
      this.renderNavUser();

      // Đồng bộ vai trò hệ thống
      if (res.user && res.user.role) {
        App.switchRole(res.user.role);
      }
    } catch (err) {
      this.showAlert(err.message || 'Tên đăng nhập hoặc mật khẩu không đúng.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnHtml;
    }
  },

  async handleRegister(event) {
    event.preventDefault();
    const fullName = document.getElementById('reg-fullname').value.trim();
    const username = document.getElementById('reg-username').value.trim().toLowerCase();
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;
    const role = document.getElementById('reg-role').value;
    const studentIdVal = document.getElementById('reg-student-id').value;
    const studentId = (role === 'teacher') ? null : (parseInt(studentIdVal) || null);
    const submitBtn = document.getElementById('btn-reg-submit');

    // Validation
    if (!fullName) {
      this.showAlert('Vui lòng nhập họ và tên đầy đủ.');
      return;
    }
    if (!username || username.length < 3) {
      this.showAlert('Tên đăng nhập phải có ít nhất 3 ký tự (chữ cái thường, số, gạch dưới).');
      return;
    }
    if (!/^[a-z0-9_]+$/.test(username)) {
      this.showAlert('Tên đăng nhập chỉ chứa chữ cái thường không dấu, chữ số và gạch dưới.');
      return;
    }
    if (!password || password.length < 6) {
      this.showAlert('Mật khẩu phải chứa ít nhất 6 ký tự.');
      return;
    }
    if (password !== confirmPassword) {
      this.showAlert('Mật khẩu xác nhận không khớp với mật khẩu đã nhập.');
      return;
    }

    const originalBtnHtml = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Đang lưu & Đồng bộ Supabase...';

    try {
      const payload = {
        username,
        password,
        full_name: fullName,
        role,
        student_id: studentId
      };

      const res = await API.register(payload);
      showToast(res.message || 'Đăng ký tài khoản thành công và đã lưu tại Supabase!', 'success');
      this.close();
      this.renderNavUser();

      // Đồng bộ vai trò hệ thống
      if (res.user && res.user.role) {
        App.switchRole(res.user.role);
      }
    } catch (err) {
      this.showAlert(err.message || 'Đăng ký thất bại. Vui lòng thử lại.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnHtml;
    }
  },

  logout() {
    API.clearSession();
    this.renderNavUser();
    App.switchRole('teacher');
    showToast('Đã đăng xuất khỏi tài khoản.', 'info');
  },

  renderNavUser() {
    const container = document.getElementById('nav-auth-container');
    if (!container) return;

    const user = API.currentUser;

    if (user && API.token) {
      const roleBadgeColor = {
        'teacher': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        'monitor': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        'parent_student': 'bg-sky-500/20 text-sky-300 border-sky-500/30'
      }[user.role] || 'bg-slate-700 text-slate-300 border-slate-600';

      const avatarSrc = user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

      container.innerHTML = `
        <div class="flex items-center space-x-2 bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 rounded-2xl p-1 pr-2.5 transition group">
          <img src="${avatarSrc}" alt="${user.full_name}" class="w-8 h-8 rounded-xl object-cover border border-slate-600 shadow" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=6366f1&color=fff'">
          
          <div class="hidden sm:block text-left">
            <div class="flex items-center space-x-1.5">
              <span class="text-xs font-bold text-white max-w-[120px] truncate">${user.full_name}</span>
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="Supabase Cloud Synced"></span>
            </div>
            <span class="text-[10px] text-slate-400 block -mt-0.5">${user.role_label || user.role}</span>
          </div>

          <div class="h-5 w-[1px] bg-slate-700 mx-1 hidden sm:block"></div>

          <!-- Quick Action Buttons -->
          <div class="flex items-center space-x-1">
            <button onclick="AuthModal.open('login')" title="Đổi tài khoản" class="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-700/60 rounded-lg text-xs transition">
              <i class="fa-solid fa-arrows-rotate"></i>
            </button>
            <button onclick="AuthModal.logout()" title="Đăng xuất" class="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg text-xs transition">
              <i class="fa-solid fa-right-from-bracket"></i>
            </button>
          </div>
        </div>
      `;
    } else {
      container.innerHTML = `
        <button onclick="AuthModal.open('login')" class="flex items-center space-x-2 px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 border border-indigo-400/30 transition">
          <i class="fa-solid fa-right-to-bracket"></i>
          <span>Đăng Nhập</span>
        </button>
      `;
    }
  },

  async initAuth() {
    this.renderNavUser();
    if (API.token) {
      try {
        const res = await API.getMe();
        if (res && res.authenticated && res.user) {
          API.currentUser = res.user;
          localStorage.setItem('homeroom_user', JSON.stringify(res.user));
          this.renderNavUser();
        } else {
          // Token expired or invalid
          API.clearSession();
          this.renderNavUser();
        }
      } catch (e) {
        console.warn('Không thể kiểm tra phiên đăng nhập:', e);
      }
    }
  }
};
