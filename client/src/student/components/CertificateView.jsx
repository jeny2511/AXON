import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "./CertificateView.css";

function CertificateView({
  certificate,
  studentName,
  enrollmentNo,
  eventName,
  onClose,
}) {
  const certificateRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!certificate) return null;

  const formattedDate = certificate.issueDate
    ? new Date(certificate.issueDate).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "Date not available";

  const handleDownload = async () => {
    if (!certificateRef.current || isDownloading) return;

    try {
      setIsDownloading(true);
      const element = certificateRef.current;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");

      const cleanStudentName = (studentName || "Student").replace(/[^a-zA-Z0-9_-]/g, "_");
      const cleanEventName = (eventName || "Certificate").replace(/[^a-zA-Z0-9_-]/g, "_");
      pdf.save(`Certificate_${cleanStudentName}_${cleanEventName}.pdf`);
    } catch (error) {
      console.error("Error generating certificate PDF:", error);
      alert("Failed to download certificate. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="certificate-modal">
      <div className="certificate-modal-content">
        {/* Top Controls */}
        <div className="certificate-toolbar">
          <button
            type="button"
            className="certificate-close-btn"
            onClick={onClose}
            disabled={isDownloading}
          >
            ✕ Close
          </button>

          <button
            type="button"
            className="certificate-download-btn"
            onClick={handleDownload}
            disabled={isDownloading}
          >
            {isDownloading ? "⏳ Generating PDF..." : "↓ Download Certificate"}
          </button>
        </div>

        {/* Certificate */}
        <div className="certificate-print-area" ref={certificateRef}>
          <div className="certificate-border">
            <div className="certificate-inner-border">
              <div className="certificate-content">

                {/* Header */}
                <div className="certificate-header">
                  <div className="certificate-logo">
                    TCF
                  </div>

                  <div>
                    <h2>THE CYBER FORCE</h2>
                    <p>Vishwakarma Government Engineering College</p>
                  </div>
                </div>

                <div className="certificate-divider" />

                {/* Title */}
                <div className="certificate-title-section">
                  <p className="certificate-small-title">
                    CERTIFICATE OF PARTICIPATION
                  </p>

                  <h1>Certificate of Participation</h1>

                  <p className="certificate-subtitle">
                    This certificate is proudly presented to
                  </p>
                </div>

                {/* Student */}
                <div className="certificate-student">
                  <h2>{studentName}</h2>

                  <div className="certificate-underline" />

                  <p>
                    Enrollment No. <strong>{enrollmentNo}</strong>
                  </p>
                </div>

                {/* Event */}
                <div className="certificate-description">
                  <p>
                    for actively participating in
                  </p>

                  <h3>{certificate.certificateTitle}</h3>

                  {eventName && (
                    <p className="certificate-event-name">
                      Event: <strong>{eventName}</strong>
                    </p>
                  )}
                </div>

                {/* Date */}
                <div className="certificate-details">
                  <div className="certificate-detail">
                    <span>DATE OF ISSUE</span>
                    <strong>{formattedDate}</strong>
                  </div>

                  <div className="certificate-detail">
                    <span>STATUS</span>
                    <strong>Verified & Issued</strong>
                  </div>
                </div>

                {/* Signatures */}
                <div className="certificate-signatures">
                  <div className="signature">
                    <div className="signature-line" />
                    <strong>TCF Coordinator</strong>
                    <span>The Cyber Force</span>
                  </div>

                  <div className="certificate-seal">
                    TCF
                    <span>VERIFIED</span>
                  </div>

                  <div className="signature">
                    <div className="signature-line" />
                    <strong>TCF Mentor</strong>
                    <span>VGEC</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="certificate-footer">
                  <span>Certificate ID: {certificate.certificateId}</span>
                  <span>THE CYBER FORCE • VGEC</span>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CertificateView;