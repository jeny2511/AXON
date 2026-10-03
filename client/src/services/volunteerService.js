import apiClient from "./apiClient";

export const volunteerService = {
  // Tasks
  getTasks: (params = {}) => apiClient.get("/volunteer/tasks", { params }),
  getTaskById: (id) => apiClient.get(`/volunteer/tasks/${id}`),
  createTask: (data) => apiClient.post("/volunteer/tasks", data),
  updateTask: (id, data) => apiClient.put(`/volunteer/tasks/${id}`, data),
  deleteTask: (id) => apiClient.delete(`/volunteer/tasks/${id}`),

  // Attendance
  getAttendance: (params = {}) => apiClient.get("/volunteer/attendance", { params }),
  markAttendance: (data) => apiClient.post("/volunteer/attendance", data),
  deleteAttendance: (id) => apiClient.delete(`/volunteer/attendance/${id}`),

  // Involvements
  getInvolvements: (params = {}) => apiClient.get("/volunteer/involvements", { params }),
  createInvolvement: (data) => apiClient.post("/volunteer/involvements", data),
  deleteInvolvement: (id) => apiClient.delete(`/volunteer/involvements/${id}`),

  // Dashboard Stats
  getDashboardStats: (params = {}) => apiClient.get("/volunteer/dashboard-stats", { params }),
};

export default volunteerService;
