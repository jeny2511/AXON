import apiClient from "./apiClient";

/**
 * Certificate Service — Live API client wrapper for Certificates & Verification
 */
export const certificateService = {
  /**
   * Get authenticated student's earned certificates
   */
  getMyCertificates: async () => {
    return apiClient.get("/certificates/my");
  },

  /**
   * Check certificate eligibility for current student for an event
   */
  checkEligibility: async (eventId) => {
    return apiClient.get(`/certificates/eligibility/${eventId}`);
  },

  /**
   * Generate certificates for eligible attendees of an event (Volunteer / Admin)
   */
  generateEventCertificates: async (eventId) => {
    return apiClient.post(`/certificates/generate/${eventId}`);
  },

  /**
   * Get certificates list for an event (Volunteer / Admin)
   */
  getEventCertificates: async (eventId) => {
    return apiClient.get(`/certificates/event/${eventId}`);
  },

  /**
   * Get certificate by ID
   */
  getCertificateById: async (id) => {
    return apiClient.get(`/certificates/${id}`);
  },

  /**
   * Verify certificate by code (Public / Authenticated)
   */
  verifyCertificate: async (code) => {
    return apiClient.get(`/certificates/verify/${code}`);
  },
};

export default certificateService;
