import StudentRoutes from "./student/routes/StudentRoutes";
import AppRoutes from "./volunteer/routes/AppRoutes";
import AdminRoutes from "./admin/routes/AdminRoutes";

function App() {
  return (
    <>
      <StudentRoutes />
      <AppRoutes />
      <AdminRoutes />
    </>
  );
}

export default App;