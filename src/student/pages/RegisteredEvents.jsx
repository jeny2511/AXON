import "./RegisteredEvents.css";
import StudentLayout from "../layouts/StudentLayout";
import EmptyState from "../components/EmptyState/EmptyState";

function RegisteredEvents() {
  return (
    <StudentLayout>
      <div className="student-page">

        <div className="page-header">
          <h1>Registered Events</h1>
          <p>Events you have registered for.</p>
        </div>

        <div className="registered-events-section">
          {/* Event cards will be loaded from studentService */}
          
          <EmptyState
            title="No Registered Events"
            message="You have not registered for any events yet."
          />
        </div>

      </div>
    </StudentLayout>
  );
}

export default RegisteredEvents;