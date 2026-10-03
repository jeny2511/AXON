import React from "react";
import "./QRAttendance.css";
import { getActiveStudentId, getStudentProfile, getStudentAttendanceForEvent } from "../services/studentService";

function QRAttendance({ event }) {
  const studentId = getActiveStudentId();
  const student = getStudentProfile(studentId) || {
    fullName: "",
    enrollmentNo: "",
  };

  const attendance = event ? getStudentAttendanceForEvent(student.id, event.id) : null;
  const isPresent = attendance && attendance.status === "present";
  const qrToken = event?.qrCode || `QR-${event?.id || "EV000"}-${student.id}`;

  return (
    <div className="qr-attendance-card">
      <h2>{event?.name || "Event Attendance QR"}</h2>

      <div
        className={`attendance-status ${isPresent ? "present" : "pending"}`}
        style={{
          background: isPresent ? "#dff6ee" : "#fef3c7",
          color: isPresent ? "#187a5a" : "#92400e",
          padding: "8px 16px",
          borderRadius: "20px",
          display: "inline-block",
          fontWeight: "700",
          fontSize: "14px",
          marginBottom: "20px",
        }}
      >
        {isPresent ? "Attendance Verified: Present ✓" : "Status: Pending Volunteer Scan"}
      </div>

      <div className="qr-placeholder">
        <div className="qr-icon" style={{ fontSize: "70px", color: "#6a3bc5", margin: "10px 0" }}>
          ▦
        </div>

        <p style={{ fontWeight: "700", color: "#4f46e5", fontSize: "14px", margin: "8px 0" }}>
          {qrToken}
        </p>

        <p style={{ color: "#64748b", fontSize: "13px", maxWidth: "340px", margin: "10px auto" }}>
          Please present this QR code to a designated TCF Volunteer at the entrance to mark your attendance.
        </p>
      </div>

      <div
        style={{
          marginTop: "20px",
          padding: "14px",
          background: "#f8fafc",
          borderRadius: "10px",
          fontSize: "13px",
          color: "#334155",
          textAlign: "left",
        }}
      >
        <p style={{ margin: "4px 0" }}>
          <strong>Student:</strong> {student.fullName}
        </p>
        <p style={{ margin: "4px 0" }}>
          <strong>Enrollment No:</strong> {student.enrollmentNo || "220130107054"}
        </p>
        <p style={{ margin: "4px 0" }}>
          <strong>Department:</strong> {student.department || "IT"}
        </p>
        {attendance?.attendanceTime && (
          <p style={{ margin: "4px 0", color: "#16a34a" }}>
            <strong>Scanned At:</strong> {attendance.attendanceTime} ({attendance.method || "QR Scanner"})
          </p>
        )}
      </div>
    </div>
  );
}

export default QRAttendance;