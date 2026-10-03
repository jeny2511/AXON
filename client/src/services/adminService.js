import apiClient from "./apiClient";

export const adminService = {
  getDashboardStats: () => apiClient.get("/admin/dashboard-stats"),
  getUsers: (params = {}) => apiClient.get("/admin/users", { params }),
  getUserById: (id) => apiClient.get(`/admin/users/${id}`),
  createVolunteer: (data) => apiClient.post("/admin/volunteers", data),
  updateUserStatus: (id, status) => apiClient.put(`/admin/users/${id}/status`, { accountStatus: status }),
  deleteUser: (id) => apiClient.delete(`/admin/users/${id}`),
  getSystemAnalysis: () => apiClient.get("/admin/analysis"),
  getAboutTCF: () => apiClient.get("/admin/about"),
  updateAboutTCF: (data) => apiClient.put("/admin/about", data),
  getSettings: () => apiClient.get("/admin/settings"),
  updateSettings: (data) => apiClient.put("/admin/settings", data),
};

export default adminService;
