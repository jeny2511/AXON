import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './index.css';

function Home() {
  return (
    <div className="app-foundation">
      <h1>AXON</h1>
      <p>TCF Centralized Event Management Platform</p>

      <div className="modules">
        <div className="module-card student">
          Student Module
        </div>

        <div className="module-card volunteer">
          Volunteer Module
        </div>

        <Link to="/admin" className="module-card admin">
          Admin Module
        </Link>
      </div>
    </div>
  );
}

function Admin() {
  return (
    <div>
      <h1>AXON Admin Panel</h1>
      <p>Admin panel is working.</p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;