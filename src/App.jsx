import StudentRoutes from "./student/routes/StudentRoutes";
import AppRoutes from "./volunteer/routes/AppRoutes";

function App() {
  return (
    <>
      <StudentRoutes />
      <AppRoutes />
    </>
  );
}

export default App;