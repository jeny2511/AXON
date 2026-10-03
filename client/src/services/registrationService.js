import apiClient from "./apiClient";

/**
 * Registration Service — Live API client wrapper for Event Registrations
 */
export const registrationService = {
  /**
   * Register authenticated student for an event
   */
  registerForEvent: async (eventId) => {
    return apiClient.post("/registrations", { eventId });
  },

  /**
   * Get current student's registered events with QR tokens
   */
  getMyRegistrations: async () => {
    return apiClient.get("/registrations/my");
  },

  /**
   * Cancel an event registration
   */
  cancelRegistration: async (registrationId, reason = "") => {
    return apiClient.delete(`/registrations/${registrationId}`, { reason });
  },

  /**
   * Get participants for an event (Volunteer / Admin)
   */
  getEventParticipants: async (eventId) => {
    return apiClient.get(`/registrations/event/${eventId}`);
  },

  /**
   * Alias for getEventParticipants
   */
  getEventRegistrations: async (eventId) => {
    return apiClient.get(`/registrations/event/${eventId}`);
  },

  /**
   * Get all registrations across all events (Volunteer / Admin)
   */
  getAllRegistrations: async () => {
    return apiClient.get("/registrations");
  },
};

export default registrationService;
