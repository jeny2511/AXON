import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f7f7f9]">

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        closeSidebar={() => setSidebarOpen(false)}
      />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-[900] bg-[rgba(24,20,40,0.45)] backdrop-blur-[2px] md:hidden"
        />
      )}

      {/* Main area */}
      <div className="min-h-screen md:ml-[210px]">

        <Topbar
          openSidebar={() => setSidebarOpen(true)}
        />

        <main className="min-h-[calc(100vh-64px)] bg-[#f7f7f9] p-6 max-md:min-h-[calc(100vh-58px)] max-md:p-[18px]">
          {children}
        </main>

      </div>
    </div>
  );
}

export default Layout;