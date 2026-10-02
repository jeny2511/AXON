import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import "../styles/admin.css";

function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f7f7f9]">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="min-h-screen lg:ml-[230px]">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="min-h-[calc(100vh-60px)] p-4 sm:p-5 lg:p-6">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;

