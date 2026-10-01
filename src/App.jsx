import { BrowserRouter } from "react-router-dom";
import StudentRoutes from "./student/routes/StudentRoutes";

function App() {
  return (
    <BrowserRouter>
      <StudentRoutes />
    </BrowserRouter>
  );
}

export default App;