import apiClient from "./apiClient";

/**
 * Event Service — REST API integration using native fetch through apiClient
 */
export const eventService = {
  /**
   * Fetch all events with optional filters (search, tab, category, status)
   */
  getEvents: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append("search", params.search);
    if (params.tab) query.append("tab", params.tab);
    if (params.category) query.append("category", params.category);
    if (params.status) query.append("status", params.status);

    const queryString = query.toString();
    const endpoint = queryString ? `/events?${queryString}` : "/events";
    return apiClient.get(endpoint);
  },

  /**
   * Fetch a single event by ID
   */
  getEventById: async (id) => {
    return apiClient.get(`/events/${id}`);
  },

  /**
   * Create a new event (Admin / Volunteer)
   */
  createEvent: async (eventData) => {
    return apiClient.post("/events", eventData);
  },

  /**
   * Update an existing event (Admin / Volunteer)
   */
  updateEvent: async (id, eventData) => {
    return apiClient.put(`/events/${id}`, eventData);
  },

  /**
   * Soft delete an event (Admin / Volunteer)
   */
  deleteEvent: async (id) => {
    return apiClient.delete(`/events/${id}`);
  },

  /**
   * Update event status (Publish, Ongoing, Complete, Cancel)
   */
  updateEventStatus: async (id, status, cancellationReason = "") => {
    return apiClient.patch(`/events/${id}/status`, { status, cancellationReason });
  },
};

export default eventService;
