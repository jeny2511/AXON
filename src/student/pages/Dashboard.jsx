import StudentLayout from "../layouts/StudentLayout";
import EventCard from "../components/EventCard/EventCard";
import SearchBar from "../components/SearchBar/SearchBar";
import EmptyState from "../components/EmptyState/EmptyState";

function Dashboard() {
  return (
    <StudentLayout>
  <div className="page-container">
    <h1 className="page-title">Dashboard</h1>
    <p className="page-subtitle">
      Welcome to the AXON Student Dashboard.
    </p>
  </div>
</StudentLayout>
  );
}

export default Dashboard;