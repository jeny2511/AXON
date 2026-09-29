import { useState } from "react";
import "./QRAttendance.css";

function QRAttendance({ event }) {
  const studentId = "ST002";

  const [status, setStatus] = useState("Pending");

  const handleScan = () => {
    setStatus("Scanning QR...");

    setTimeout(() => {
      setStatus("Biometric Verification...");
    }, 1500);

    setTimeout(() => {
      markAttendance();
      setStatus("Present");
    }, 3000);
  };

const markAttendance = () => {
  const storageKey = `axon_registrations_${studentId}`;

  const registrations = JSON.parse(
    localStorage.getItem(storageKey) || "[]"
  );

  const existingRegistration = registrations.find(
    (registration) => registration.eventId === event?.id
  );

  let updatedRegistrations;

  if (existingRegistration) {
    updatedRegistrations = registrations.map((registration) => {
      if (registration.eventId === event?.id) {
        return {
          ...registration,
          status: "attended",
          attendanceStatus: "present",
          attendedAt: new Date().toISOString(),
        };
      }

      return registration;
    });
  } else {
    updatedRegistrations = [
      ...registrations,
      {
        registrationId: `REG-${Date.now()}`,
        studentId: studentId,
        eventId: event.id,
        registeredAt: new Date().toISOString(),
        status: "attended",
        attendanceStatus: "present",
        attendedAt: new Date().toISOString(),
      },
    ];
  }

  localStorage.setItem(
    storageKey,
    JSON.stringify(updatedRegistrations)
  );

  // Tell other pages that registration/attendance changed
  window.dispatchEvent(
    new Event("axon-registration-updated")
  );
};

  return (
    <div className="qr-attendance-card">
      <h2>{event?.name || "QR Attendance"}</h2>

      <div
        className={`attendance-status ${status
          .toLowerCase()
          .replaceAll(" ", "-")}`}
      >
        {status}
      </div>

      {status === "Pending" && (
        <div className="qr-placeholder">
          <div className="qr-icon">▦</div>

          <p>Ready to scan event QR</p>

          <button type="button" onClick={handleScan}>
            Scan Event QR
          </button>
        </div>
      )}

      {status === "Scanning QR..." && (
        <div className="qr-processing">
          <h3>Scanning QR Code...</h3>
          <p>Please wait.</p>
        </div>
      )}

      {status === "Biometric Verification..." && (
        <div className="qr-processing">
          <h3>Biometric Verification</h3>
          <p>Verifying your identity...</p>
        </div>
      )}

      {status === "Present" && (
        <div className="attendance-success">
          <div className="success-icon">✓</div>

          <h3>Attendance Marked Successfully</h3>

          <p>
            Your attendance status is now Present.
          </p>

          <p>
            This event is now available in My Events.
          </p>
        </div>
      )}
    </div>
  );
}

export default QRAttendance;