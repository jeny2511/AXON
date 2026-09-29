import { useState } from "react";
import "./QRAttendance.css";

function QRAttendance({ event }) {
  const [status, setStatus] = useState("Pending");

  const handleScan = () => {
    setStatus("Scanning QR...");

    setTimeout(() => {
      setStatus("Biometric Verification...");
    }, 1500);

    setTimeout(() => {
      setStatus("Present");
    }, 3000);
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
          <p>Your attendance status is now Present.</p>
        </div>
      )}
    </div>
  );
}

export default QRAttendance;