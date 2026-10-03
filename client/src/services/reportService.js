import apiClient from "./apiClient";

export const reportService = {
  getReports: (params = {}) => apiClient.get("/reports", { params }),
  getReportById: (id) => apiClient.get(`/reports/${id}`),
  uploadReport: (formData) =>
    apiClient.post("/reports", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updateReportStatus: (id, status, comment = "") =>
    apiClient.put(`/reports/${id}/status`, { status, comment }),
  deleteReport: (id) => apiClient.delete(`/reports/${id}`),
};

export default reportService;
