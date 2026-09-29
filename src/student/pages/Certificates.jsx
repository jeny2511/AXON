import { useState } from "react";
import "./pages.css";
import "./Certificates.css";
import StudentLayout from "../layouts/StudentLayout";
import ProgressBar from "../components/ProgressBar";
import CertificateCard from "../components/CertificateCard";
import CertificateView from "../components/CertificateView";
import EmptyState from "../components/EmptyState/EmptyState";
import {
  getActiveStudentId,
  getStudentProfile,
  getStudentCertificates,
  getStudentCompletedEvents,
  getEventById,
} from "../services/studentService";

function Certificates() {
  const studentId = getActiveStudentId();
  const student = getStudentProfile(studentId) || {
    id: studentId,
    fullName: "Student",
    enrollmentNo: "220130107054",
  };

  const certificates = getStudentCertificates(studentId);
  const attendedEvents = getStudentCompletedEvents(studentId);

  const [selectedCertificate, setSelectedCertificate] = useState(null);

  const handleViewCertificate = (certificate) => {
    const event = getEventById(certificate.eventId);
    setSelectedCertificate({
      ...certificate,
      eventName: event ? event.name : certificate.eventId,
    });
  };

  const handleCloseCertificate = () => {
    setSelectedCertificate(null);
  };

  const totalPossible = attendedEvents.length > 0 ? attendedEvents.length : certificates.length;

  return (
    <StudentLayout>
      <div className="certificates-page">
        <div className="page-container">
          <h1 className="page-title">My Certificates</h1>
          <p className="page-subtitle">View and access certificates earned from attended TCF events.</p>
        </div>

        {certificates.length > 0 && (
          <div className="certificate-progress">
            <ProgressBar
              current={certificates.length}
              total={totalPossible || 1}
              label="Certificates Issued vs Attended Events"
            />
          </div>
        )}

        <div className="certificates-section">
          {certificates.length > 0 ? (
            certificates.map((certificate) => {
              const event = getEventById(certificate.eventId);

              return (
                <CertificateCard
                  key={certificate.certificateId}
                  title={certificate.certificateTitle}
                  eventName={event?.name || certificate.eventId}
                  issueDate={certificate.issueDate}
                  status={certificate.status}
                  onView={() => handleViewCertificate(certificate)}
                />
              );
            })
          ) : (
            <EmptyState
              title="No Certificates Issued Yet"
              message="Certificates will appear here once your attendance at eligible events is marked and verified."
            />
          )}
        </div>
      </div>

      {selectedCertificate && (
        <CertificateView
          certificate={selectedCertificate}
          studentName={student.fullName}
          enrollmentNo={student.enrollmentNo || "220130107054"}
          eventName={selectedCertificate.eventName}
          onClose={handleCloseCertificate}
        />
      )}
    </StudentLayout>
  );
}

export default Certificates;