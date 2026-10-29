/**
 * Central API Client for Homeroom 360°
 * Encapsulates RBAC headers and controller endpoints
 */
const API = {
  token: localStorage.getItem('homeroom_token') || null,
  currentUser: JSON.parse(localStorage.getItem('homeroom_user') || 'null'),
  currentRole: localStorage.getItem('homeroom_role') || 'teacher',
  currentStudentId: parseInt(localStorage.getItem('homeroom_student_id') || '2'),

  setRole(role, studentId = null) {
    this.currentRole = role;
    localStorage.setItem('homeroom_role', role);
    if (studentId !== null) {
      this.currentStudentId = studentId;
      localStorage.setItem('homeroom_student_id', studentId);
    }
  },

  setSession(token, user) {
    this.token = token;
    this.currentUser = user;
    localStorage.setItem('homeroom_token', token);
    localStorage.setItem('homeroom_user', JSON.stringify(user));
    if (user.role) {
      this.setRole(user.role, user.student_id);
    }
  },

  clearSession() {
    this.token = null;
    this.currentUser = null;
    localStorage.removeItem('homeroom_token');
    localStorage.removeItem('homeroom_user');
  },

  async request(url, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'X-User-Role': this.currentRole,
      'X-Student-Id': this.currentStudentId.toString(),
      ...(options.headers || {})
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
      headers['X-Session-Token'] = this.token;
    }

    try {
      const response = await fetch(url, { ...options, headers });
      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.detail?.message || data.detail || 'Đã có lỗi xảy ra';
        if (response.status === 403) {
          showToast(errorMsg, 'danger');
        } else if (response.status !== 401) {
          showToast(errorMsg, 'danger');
        }
        throw new Error(errorMsg);
      }

      return data;
    } catch (err) {
      console.error('API Request failed:', err);
      throw err;
    }
  },

  // Auth & Supabase APIs
  async login(username, password) {
    const res = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    if (res.token && res.user) {
      this.setSession(res.token, res.user);
    }
    return res;
  },

  async register(payload) {
    const res = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (res.token && res.user) {
      this.setSession(res.token, res.user);
    }
    return res;
  },

  async getMe() {
    return this.request('/api/auth/me');
  },

  async getAuthUsers() {
    return this.request('/api/auth/users');
  },

  async syncAllToSupabase() {
    return this.request('/api/auth/sync-all-to-supabase', {
      method: 'POST'
    });
  },

  // Architecture status
  async getArchitectureStatus() {
    return this.request('/api/architecture/status');
  },

  // SeatMap & Student APIs
  async getSeatMap() {
    return this.request('/api/seatmap/layout');
  },

  async swapSeats(studentId1, studentId2) {
    return this.request('/api/seatmap/swap', {
      method: 'POST',
      body: JSON.stringify({ student_id_1: studentId1, student_id_2: studentId2 })
    });
  },

  async updatePositions(positions) {
    return this.request('/api/seatmap/update-positions', {
      method: 'POST',
      body: JSON.stringify({ positions })
    });
  },

  async smartAutoArrange(strategy) {
    return this.request('/api/seatmap/smart-auto-arrange', {
      method: 'POST',
      body: JSON.stringify({ strategy })
    });
  },

  async getStudents(search = '', rank = '', conduct = '') {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (rank) params.append('rank', rank);
    if (conduct) params.append('conduct', conduct);
    return this.request(`/api/students?${params.toString()}`);
  },

  async getStudent360(studentId) {
    return this.request(`/api/students/${studentId}/360`);
  },

  // Attendance APIs
  async getTodayAttendance(date = null, session = 'Sáng') {
    let url = `/api/attendance/today?session=${session}`;
    if (date) url += `&date=${date}`;
    return this.request(url);
  },

  async quickMarkAttendance(studentId, status, note = '') {
    return this.request(`/api/attendance/quick-mark?student_id=${studentId}&status=${status}&note=${encodeURIComponent(note)}`, {
      method: 'POST'
    });
  },

  async batchUpdateAttendance(date, session, items) {
    return this.request('/api/attendance/batch', {
      method: 'POST',
      body: JSON.stringify({ date, session, items })
    });
  },

  // Gamified Points APIs
  async awardPoints(studentId, points, reason, category = 'nề nếp') {
    return this.request('/api/gamification/award', {
      method: 'POST',
      body: JSON.stringify({ student_id: studentId, points, reason, category })
    });
  },

  async getLeaderboard() {
    return this.request('/api/gamification/leaderboard');
  },

  // Academic APIs
  async getAcademicOverview() {
    return this.request('/api/academic/overview');
  },

  async getDropWarnings() {
    return this.request('/api/academic/drop-warnings');
  },

  async getStudentAcademic(studentId) {
    return this.request(`/api/academic/student/${studentId}`);
  },

  // AI Report Writer Engine APIs
  async generateAIReport(studentId, term, tone, extraNotes = '') {
    return this.request('/api/ai-report/generate', {
      method: 'POST',
      body: JSON.stringify({
        student_id: studentId,
        term,
        tone,
        extra_notes: extraNotes
      })
    });
  },

  async batchGenerateAllReports(term = 'Học kỳ 1 - 2026') {
    return this.request(`/api/ai-report/batch-generate-all?term=${encodeURIComponent(term)}`, {
      method: 'POST'
    });
  },

  async getStudentReports(studentId) {
    return this.request(`/api/ai-report/student/${studentId}`);
  },

  // Parent Communication Worker APIs
  async getCommunicationLogs(studentId = null, channel = null) {
    let url = '/api/communication/logs';
    const params = new URLSearchParams();
    if (studentId) params.append('student_id', studentId);
    if (channel) params.append('channel', channel);
    if (params.toString()) url += `?${params.toString()}`;
    return this.request(url);
  },

  async sendParentMessage(studentId, channel, subject, message, triggerType = 'Thủ công') {
    return this.request('/api/communication/send', {
      method: 'POST',
      body: JSON.stringify({
        student_id: studentId,
        channel,
        subject,
        message,
        trigger_type: triggerType
      })
    });
  },

  async autoWeeklyDispatch() {
    return this.request('/api/communication/auto-weekly-dispatch', {
      method: 'POST'
    });
  },

  // Absence Requests APIs
  async getAbsenceRequests() {
    return this.request('/api/absence/requests');
  },

  async submitAbsenceRequest(studentId, parentName, fromDate, toDate, reason) {
    return this.request('/api/absence/requests', {
      method: 'POST',
      body: JSON.stringify({
        student_id: studentId,
        parent_name: parentName,
        from_date: fromDate,
        to_date: toDate,
        reason
      })
    });
  },

  async reviewAbsenceRequest(requestId, status, teacherReply) {
    return this.request('/api/absence/requests/review', {
      method: 'PUT',
      body: JSON.stringify({
        request_id: requestId,
        status,
        teacher_reply: teacherReply
      })
    });
  },

  // ==============================================================
  // Admin Portal & Comprehensive System Management APIs
  // ==============================================================
  async getAdminStats() {
    return this.request('/api/admin/stats');
  },

  async getAdminUsers(search = '', role = '') {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (role) params.append('role', role);
    return this.request(`/api/admin/users?${params.toString()}`);
  },

  async createAdminUser(payload) {
    return this.request('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async updateAdminUser(userId, payload) {
    return this.request(`/api/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  async resetAdminUserPassword(userId, newPassword) {
    return this.request(`/api/admin/users/${userId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ new_password: newPassword })
    });
  },

  async deleteAdminUser(userId) {
    return this.request(`/api/admin/users/${userId}`, {
      method: 'DELETE'
    });
  },

  async getAdminStudents(search = '', rank = '', conduct = '') {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (rank) params.append('rank', rank);
    if (conduct) params.append('conduct', conduct);
    return this.request(`/api/admin/students?${params.toString()}`);
  },

  async createAdminStudent(payload) {
    return this.request('/api/admin/students', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async updateAdminStudent(studentId, payload) {
    return this.request(`/api/admin/students/${studentId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  async deleteAdminStudent(studentId) {
    return this.request(`/api/admin/students/${studentId}`, {
      method: 'DELETE'
    });
  },

  async getAdminAttendance(date = '', studentId = null) {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (studentId) params.append('student_id', studentId);
    return this.request(`/api/admin/attendance?${params.toString()}`);
  },

  async updateAdminAttendance(logId, status, note = '') {
    return this.request(`/api/admin/attendance/${logId}`, {
      method: 'PUT',
      body: JSON.stringify({ status, note })
    });
  },

  async deleteAdminAttendance(logId) {
    return this.request(`/api/admin/attendance/${logId}`, {
      method: 'DELETE'
    });
  },

  async getAdminGamification(studentId = null) {
    const params = new URLSearchParams();
    if (studentId) params.append('student_id', studentId);
    return this.request(`/api/admin/gamification/logs?${params.toString()}`);
  },

  async deleteAdminGamification(logId) {
    return this.request(`/api/admin/gamification/logs/${logId}`, {
      method: 'DELETE'
    });
  },

  async getAdminGrades(studentId = null, subject = '') {
    const params = new URLSearchParams();
    if (studentId) params.append('student_id', studentId);
    if (subject) params.append('subject', subject);
    return this.request(`/api/admin/grades?${params.toString()}`);
  },

  async updateAdminGrade(gradeId, payload) {
    return this.request(`/api/admin/grades/${gradeId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  async getAdminAIReports(studentId = null) {
    const params = new URLSearchParams();
    if (studentId) params.append('student_id', studentId);
    return this.request(`/api/admin/ai-reports?${params.toString()}`);
  },

  async updateAdminAIReport(reportId, payload) {
    return this.request(`/api/admin/ai-reports/${reportId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  async deleteAdminAIReport(reportId) {
    return this.request(`/api/admin/ai-reports/${reportId}`, {
      method: 'DELETE'
    });
  },

  async getAdminAbsences(status = '') {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    return this.request(`/api/admin/absence-requests?${params.toString()}`);
  },

  async reviewAdminAbsence(requestId, status, teacherReply = '') {
    return this.request(`/api/admin/absence-requests/${requestId}?status=${status}&teacher_reply=${encodeURIComponent(teacherReply)}`, {
      method: 'PUT'
    });
  },

  async getAdminAuditLogs() {
    return this.request('/api/admin/maintenance/audit-logs');
  },

  async syncAllTablesToSupabase() {
    return this.request('/api/admin/maintenance/sync-all-to-supabase', {
      method: 'POST'
    });
  },

  async exportDatabaseBackup() {
    return this.request('/api/admin/maintenance/export-backup');
  }
};
