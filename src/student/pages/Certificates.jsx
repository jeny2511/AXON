import { useState } from "react";
import "./Certificates.css";
import StudentLayout from "../layouts/StudentLayout";
import ProgressBar from "../components/ProgressBar";
import CertificateCard from "../components/CertificateCard";
import CertificateView from "../components/CertificateView";
import EmptyState from "../components/EmptyState/EmptyState";
import {
  getStudentCertificates,
  getEventById,
} from "../services/studentService";

function Certificates() {
  const studentId = "ST002";

  const certificates = getStudentCertificates(studentId);

  const [selectedCertificate, setSelectedCertificate] = useState(null);

  const handleViewCertificate = (certificate) => {
    setSelectedCertificate(certificate);
  };

  const handleCloseCertificate = () => {
    setSelectedCertificate(null);
  };

  return (
    <StudentLayout>
      <div className="student-page">
        <div className="page-header">
          <h1>My Certificates</h1>
          <p>View and access certificates earned from TCF events.</p>
        </div>

        <div className="certificate-progress">
          <ProgressBar
            current={certificates.length}
            total={certificates.length}
            label="Certificates Available"
          />
        </div>

        <div className="certificates-section">
          {certificates.length > 0 ? (
            certificates.map((certificate) => {
              const event = getEventById(certificate.eventId);

              return (
                <CertificateCard
                  key={certificate.certificateId}
                  title={certificate.certificateTitle}
                  eventName={event?.title || certificate.eventId}
                  issueDate={certificate.issueDate}
                  verificationCode={certificate.verificationCode}
                  certificateUrl={certificate.certificateUrl}
                  status={certificate.status}
                  onView={() => handleViewCertificate(certificate)}
                />
              );
            })
          ) : (
            <EmptyState
              title="No Certificates Available"
              message="Certificates earned from eligible events will appear here."
            />
          )}
        </div>
      </div>

      {selectedCertificate && (
        <CertificateView
          certificate={selectedCertificate}
          studentName="Archi Patel"
          enrollmentNo="220130107055"
          eventName={
            getEventById(selectedCertificate.eventId)?.title ||
            selectedCertificate.eventId
          }
          onClose={handleCloseCertificate}
        />
      )}
    </StudentLayout>
  );
}

export default Certificates;