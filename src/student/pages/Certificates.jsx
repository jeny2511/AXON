import "./Certificates.css";
import StudentLayout from "../layouts/StudentLayout";
import ProgressBar from "../components/ProgressBar";
import CertificateCard from "../components/CertificateCard";
import EmptyState from "../components/EmptyState/EmptyState";

function Certificates() {
  const certificates = [];

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
            certificates.map((certificate) => (
              <CertificateCard
                key={certificate.id}
                title={certificate.title}
                eventName={certificate.eventName}
                issueDate={certificate.issueDate}
                verificationCode={certificate.verificationCode}
                certificateUrl={certificate.certificateUrl}
                status={certificate.status}
              />
            ))
          ) : (
            <EmptyState
              title="No Certificates Available"
              message="Certificates earned from eligible events will appear here."
            />
          )}
        </div>

      </div>
    </StudentLayout>
  );
}

export default Certificates;