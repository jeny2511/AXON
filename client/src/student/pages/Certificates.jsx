import { useState, useEffect } from "react";
import "./pages.css";
import "./Certificates.css";
import StudentLayout from "../layouts/StudentLayout";
import ProgressBar from "../components/ProgressBar";
import CertificateCard from "../components/CertificateCard";
import CertificateView from "../components/CertificateView";
import EmptyState from "../components/EmptyState/EmptyState";
import {
  fetchMyCertificatesApi,
  getActiveStudentId,
  getStudentProfile,
  getStudentCertificates,
  getStudentCompletedEvents,
  getEventById,
} from "../services/studentService";
import { getCurrentUser } from "../../services/authService";

function Certificates() {
  const currentUser = getCurrentUser();
  const studentId = currentUser?.id || currentUser?._id || getActiveStudentId();
  const [student, setStudent] = useState({
    id: studentId,
    fullName: currentUser?.fullName || currentUser?.name || "Student",
    enrollmentNo: currentUser?.enrollmentNumber || currentUser?.enrollmentNo || "220130107054",
  });

  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCertificate, setSelectedCertificate] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadCertificates() {
      try {
        setLoading(true);
        const res = await fetchMyCertificatesApi();
        if (isMounted && res && res.data) {
          const certs = res.data.map((c) => ({
            certificateId: c.verificationCode || c._id,
            _id: c._id,
            certificateTitle: c.certificateTitle || c.title || (c.eventId?.name ? `${c.eventId.name} Certificate` : "Certificate of Participation"),
            eventId: c.eventId?._id || c.eventId,
            eventName: c.eventId?.name || c.eventName || "TCF Event",
            issueDate: c.issueDate || c.issuedAt || c.createdAt,
            status: c.status ? (c.status.charAt(0).toUpperCase() + c.status.slice(1)) : "Issued",
            pdfUrl: c.pdfUrl,
            studentName: c.studentName || currentUser?.fullName || student.fullName,
            enrollmentNo: c.enrollmentNumber || currentUser?.enrollmentNumber || student.enrollmentNo,
          }));
          setCertificates(certs);
          return;
        }
      } catch (err) {
        console.warn("Failed to fetch live certificates:", err.message);
      } finally {
        if (isMounted) setLoading(false);
      }

      if (isMounted) {
        setCertificates([]);
      }
    }

    const fallbackProfile = getStudentProfile(studentId);
    if (fallbackProfile) {
      setStudent(fallbackProfile);
    }

    loadCertificates();

    return () => {
      isMounted = false;
    };
  }, [studentId]);

  const handleViewCertificate = (certificate) => {
    setSelectedCertificate(certificate);
  };

  const handleCloseCertificate = () => {
    setSelectedCertificate(null);
  };

  const totalPossible = certificates.length > 0 ? certificates.length : 1;

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
              total={totalPossible}
              label="Certificates Issued vs Attended Events"
            />
          </div>
        )}

        <div className="certificates-section">
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}>
              Loading your certificates...
            </div>
          ) : certificates.length > 0 ? (
            certificates.map((certificate) => (
              <CertificateCard
                key={certificate.certificateId || certificate._id}
                title={certificate.certificateTitle}
                eventName={certificate.eventName}
                issueDate={
                  certificate.issueDate
                    ? new Date(certificate.issueDate).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "Issued"
                }
                status={certificate.status}
                onView={() => handleViewCertificate(certificate)}
              />
            ))
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
          studentName={selectedCertificate.studentName || student.fullName}
          enrollmentNo={selectedCertificate.enrollmentNo || student.enrollmentNo}
          eventName={selectedCertificate.eventName}
          onClose={handleCloseCertificate}
        />
      )}
    </StudentLayout>
  );
}

export default Certificates;