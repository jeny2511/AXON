import apiClient from "./apiClient";

/**
 * Attendance Service — Live API client wrapper for Attendance & QR Verification
 */
export const attendanceService = {
  /**
   * Scan / verify QR token for attendance (Volunteer / Admin)
   */
  scanQR: async (token, eventId) => {
    return apiClient.post("/attendance/scan", { token, eventId });
  },

  /**
   * Manually mark attendance by studentId or enrollmentNo (Volunteer / Admin)
   */
  markManual: async ({ studentId, enrollmentNo, eventId }) => {
    return apiClient.post("/attendance/manual", { studentId, enrollmentNo, eventId });
  },

  /**
   * Get authenticated student's attendance records
   */
  getMyAttendance: async () => {
    return apiClient.get("/attendance/my");
  },

  /**
   * Get attendance list for a specific event (Volunteer / Admin)
   */
  getEventAttendance: async (eventId) => {
    return apiClient.get(`/attendance/event/${eventId}`);
  },

  /**
   * Get specific attendance record by ID
   */
  getAttendanceById: async (id) => {
    return apiClient.get(`/attendance/${id}`);
  },

  /**
   * Get all attendance records across all events (Admin)
   */
  getAllAttendance: async (params = {}) => {
    return apiClient.get("/attendance", { params });
  },
};

export default attendanceService;
