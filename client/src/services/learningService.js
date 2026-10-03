import apiClient from "./apiClient";

export const learningService = {
  getResources: (params = {}) => apiClient.get("/learning", { params }),
  getResourceById: (id) => apiClient.get(`/learning/${id}`),
  createResource: (data) => apiClient.post("/learning", data),
  updateResource: (id, data) => apiClient.put(`/learning/${id}`, data),
  deleteResource: (id) => apiClient.delete(`/learning/${id}`),
};

export default learningService;
