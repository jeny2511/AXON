import apiClient from "./apiClient";

export const galleryService = {
  getGallery: (params = {}) => apiClient.get("/gallery", { params }),
  getGalleryById: (id) => apiClient.get(`/gallery/${id}`),
  createGallery: (data) => apiClient.post("/gallery", data),
  updateGallery: (id, data) => apiClient.put(`/gallery/${id}`, data),
  deleteGallery: (id) => apiClient.delete(`/gallery/${id}`),
};

export default galleryService;
