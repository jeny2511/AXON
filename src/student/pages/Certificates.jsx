import "./Certificates.css";
import StudentLayout from "../layouts/StudentLayout";
import ProgressBar from "../components/ProgressBar";
import EmptyState from "../components/EmptyState/EmptyState";

function Certificates() {
  return (
    <StudentLayout>
      <div className="student-page">

        <div className="page-header">
          <h1>My Certificates</h1>
          <p>View and access certificates earned from TCF events.</p>
        </div>

        <div className="certificate-progress">
          <ProgressBar
            current={0}
            total={0}
            label="Certificates Available"
          />
        </div>

        <div className="certificates-section">
          {/* Certificate cards will be loaded from studentService */}

          <EmptyState
            title="No Certificates Available"
            message="Certificates earned from eligible events will appear here."
          />
        </div>

      </div>
    </StudentLayout>
  );
}

export default Certificates;