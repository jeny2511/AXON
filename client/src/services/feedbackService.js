import apiClient from "./apiClient";

/**
 * Feedback Service — Live API client wrapper for Event Feedback
 */
export const feedbackService = {
  /**
   * Submit feedback for an attended event
   */
  submitFeedback: async (feedbackData) => {
    return apiClient.post("/feedback", feedbackData);
  },

  /**
   * Get authenticated student's submitted feedback
   */
  getMyFeedback: async () => {
    return apiClient.get("/feedback/my");
  },

  /**
   * Get feedback overview for an event (Volunteer / Admin)
   */
  getEventFeedback: async (eventId) => {
    return apiClient.get(`/feedback/event/${eventId}`);
  },

  /**
   * Get specific feedback by ID
   */
  getFeedbackById: async (id) => {
    return apiClient.get(`/feedback/${id}`);
  },
};

export default feedbackService;
