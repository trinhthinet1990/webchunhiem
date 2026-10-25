/**
 * Authentication & Supabase Synchronization Module
 * Handles Email/Username Registration, Specific Class Duties, and Conditional Student Linking
 */

// Đảm bảo API.login và API.register luôn sẵn sàng ngay cả khi trình duyệt lưu cache api.js cũ
if (typeof API !== 'undefined') {
  if (typeof API.register !== 'function') {
    API.register = async function(payload) {
      const res = await this.request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (res && res.token && res.user) {
        if (typeof this.setSession === 'function') {
          this.setSession(res.token, res.user);
        } else {
          localStorage.setItem('homeroom_token', res.token);
          localStorage.setItem('homeroom_user', JSON.stringify(res.user));
          this.token = res.token;
          this.currentUser = res.user;
        }
      }
      return res;
    };
  }

  if (typeof API.login !== 'function') {
    API.login = async function(username, password) {
      const res = await this.request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      if (res && res.token && res.user) {
        if (typeof this.setSession === 'function') {
          this.setSession(res.token, res.user);
        } else {
          localStorage.setItem('homeroom_token', res.token);
          localStorage.setItem('homeroom_user', JSON.stringify(res.user));
          this.token = res.token;
          this.currentUser = res.user;
        }
      }
      return res;
    };
  }
}

const AuthModal = {
  studentsLoaded: false,

  open(tab = 'login') {
    const modal = document.getElementById('auth-modal');
    if (!modal) return;
    this.clearAlert();
    this.switchTab(tab);
    modal.classList.remove('hidden');

    // Trigger role change logic to display/hide fields correctly based on default selected role
    const currentRole = document.getElementById('reg-role')?.value || 'parent_student';
    this.onRoleChange(currentRole);

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

      const roleVal = document.getElementById('reg-role')?.value || 'parent_student';
      this.onRoleChange(roleVal);
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

  /**
   * Xử lý hiển thị điều kiện theo vai trò:
   * 1. Phụ huynh: BẮT BUỘC hiện chọn học sinh liên kết (1-1)
   * 2. Ban cán sự lớp: BẮT BUỘC hiện chọn nhiệm vụ cụ thể của cán sự, ẨN học sinh liên kết
   * 3. Giáo viên / Học sinh: Ẩn cả 2
   */
  onRoleChange(role) {
    const studentPicker = document.getElementById('reg-student-picker');
    const dutyGroup = document.getElementById('reg-duty-group');

    // 1. Chỉ phụ huynh mới liên kết 1-1 đến học sinh
    if (studentPicker) {
      if (role === 'parent_student') {
        studentPicker.classList.remove('hidden');
      } else {
        studentPicker.classList.add('hidden');
      }
    }

    // 2. Cán bộ lớp: Hiển thị chọn nhiệm vụ / chức danh cụ thể
    if (dutyGroup) {
      if (role === 'monitor') {
        dutyGroup.classList.remove('hidden');
      } else {
        dutyGroup.classList.add('hidden');
      }
    }
  },

  async populateStudentDropdown() {
    const select = document.getElementById('reg-student-id');
    if (!select) return;

    try {
      const students = await API.getStudents();
      select.innerHTML = '<option value="">-- Chọn con em học sinh trong lớp 12A1 --</option>';
      students.forEach(st => {
        const opt = document.createElement('option');
        opt.value = st.id;
        opt.textContent = `${st.student_code} - ${st.full_name} (Bàn ${st.seat_row}-${st.seat_col} • Bố mẹ: ${st.parent_name || 'PH'})`;
        select.appendChild(opt);
      });
      this.studentsLoaded = true;
    } catch (err) {
      console.warn('Không thể tải danh sách học sinh:', err);
      select.innerHTML = '<option value="2">HS1202 - Trần Bảo Ngọc</option>';
    }
  },

  showAlert(message, type = 'error') {
    const box = document.getElementById('auth-alert');
    if (!box) return;
    box.classList.remove('hidden');

    if (type === 'error') {
      box.className = 'p-3 rounded-xl text-xs font-medium flex items-center space-x-2 bg-rose-500/10 border border-rose-500/30 text-rose-300';
      box.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-rose-400 text-sm flex-shrink-0"></i><span>${message}</span>`;
    } else {
      box.className = 'p-3 rounded-xl text-xs font-medium flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300';
      box.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-400 text-sm flex-shrink-0"></i><span>${message}</span>`;
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
    const ident = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const submitBtn = document.getElementById('btn-login-submit');

    if (!ident || !password) {
      this.showAlert('Vui lòng điền email/tên đăng nhập và mật khẩu.');
      return;
    }

    const originalBtnHtml = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Đang xác thực...';

    try {
      let res;
      if (typeof API !== 'undefined' && typeof API.login === 'function') {
        res = await API.login(ident, password);
      } else {
        const resp = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: ident, password })
        });
        res = await resp.json();
        if (!resp.ok) {
          throw new Error(res.detail || 'Email hoặc mật khẩu không chính xác.');
        }
        localStorage.setItem('homeroom_token', res.token);
        localStorage.setItem('homeroom_user', JSON.stringify(res.user));
        if (typeof API !== 'undefined') {
          API.token = res.token;
          API.currentUser = res.user;
        }
      }
      showToast(res.message || 'Đăng nhập thành công!', 'success');
      this.close();
      this.renderNavUser();

      // Chuyển vai trò hệ thống tương ứng
      if (res.user && res.user.role) {
        App.switchRole(res.user.role);
      }
    } catch (err) {
      this.showAlert(err.message || 'Email hoặc mật khẩu không chính xác.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnHtml;
    }
  },

  async handleRegister(event) {
    event.preventDefault();
    const fullName = document.getElementById('reg-fullname').value.trim();
    const email = document.getElementById('reg-email').value.trim().toLowerCase();
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;
    const role = document.getElementById('reg-role').value;
    const submitBtn = document.getElementById('btn-reg-submit');

    // Validation cơ bản
    if (!fullName) {
      this.showAlert('Vui lòng nhập họ và tên đầy đủ.');
      return;
    }

    // Kiểm tra định dạng Email chuẩn
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      this.showAlert('Vui lòng nhập địa chỉ email hợp lệ (ví dụ: nguyentruongthinh24102013@gmail.com).');
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

    // Xử lý logic vai trò:
    let duty = null;
    let studentId = null;

    if (role === 'monitor') {
      // Cán bộ lớp: Lấy chức danh/nhiệm vụ cụ thể
      const dutySelect = document.getElementById('reg-duty');
      duty = dutySelect ? dutySelect.value : 'Cán sự lớp';
      studentId = null; // Cán bộ lớp KHÔNG liên kết học sinh con em
    } else if (role === 'parent_student') {
      // Phụ huynh: BẮT BUỘC chọn học sinh liên kết 1-1
      const studentIdVal = document.getElementById('reg-student-id').value;
      if (!studentIdVal) {
        this.showAlert('Tài khoản Phụ huynh bắt buộc phải chọn học sinh con em liên kết (1-1).');
        return;
      }
      studentId = parseInt(studentIdVal);
    }

    const originalBtnHtml = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Đang đăng ký & Đồng bộ Supabase...';

    try {
      const payload = {
        email: email,
        username: email, // Sử dụng email làm tên định danh
        password: password,
        full_name: fullName,
        role: role,
        duty: duty,
        student_id: studentId
      };

      let res;
      if (typeof API !== 'undefined' && typeof API.register === 'function') {
        res = await API.register(payload);
      } else {
        const resp = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        res = await resp.json();
        if (!resp.ok) {
          throw new Error(res.detail || 'Đăng ký thất bại. Vui lòng thử lại.');
        }
        localStorage.setItem('homeroom_token', res.token);
        localStorage.setItem('homeroom_user', JSON.stringify(res.user));
        if (typeof API !== 'undefined') {
          API.token = res.token;
          API.currentUser = res.user;
        }
      }

      showToast(res.message || 'Đăng ký tài khoản thành công và đã lưu tại Supabase!', 'success');
      this.close();
      this.renderNavUser();

      // Tự động chuyển vai trò
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
      const avatarSrc = user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
      
      // Hiển thị chức danh cụ thể nếu có duty
      const displayRole = user.duty ? `⭐ ${user.duty}` : (user.role_label || user.role);

      container.innerHTML = `
        <div class="flex items-center space-x-2 bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 rounded-2xl p-1 pr-2.5 transition group">
          <img src="${avatarSrc}" alt="${user.full_name}" class="w-8 h-8 rounded-xl object-cover border border-slate-600 shadow" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=6366f1&color=fff'">
          
          <div class="hidden sm:block text-left">
            <div class="flex items-center space-x-1.5">
              <span class="text-xs font-bold text-white max-w-[130px] truncate">${user.full_name}</span>
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="Supabase Cloud Synced"></span>
            </div>
            <span class="text-[10px] text-amber-300 font-medium block -mt-0.5 max-w-[140px] truncate">${displayRole}</span>
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
          API.clearSession();
          this.renderNavUser();
        }
      } catch (e) {
        console.warn('Không thể kiểm tra phiên đăng nhập:', e);
      }
    }
  }
};
