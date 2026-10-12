/**
 * Central API Client for Homeroom 360°
 * Encapsulates RBAC headers and controller endpoints
 */
const API = {
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

  async request(url, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'X-User-Role': this.currentRole,
      'X-Student-Id': this.currentStudentId.toString(),
      ...(options.headers || {})
    };

    try {
      const response = await fetch(url, { ...options, headers });
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          showToast(data.detail?.message || 'Quyền truy cập bị từ chối bởi RBAC Auth Guard', 'danger');
        } else {
          showToast(data.detail || 'Đã có lỗi xảy ra', 'danger');
        }
        throw new Error(data.detail || 'API Error');
      }

      return data;
    } catch (err) {
      console.error('API Request failed:', err);
      throw err;
    }
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
  }
};
