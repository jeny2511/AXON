import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  Printer,
  Download,
  Plus,
  X,
  Calendar,
  Clock,
  MapPin,
  User,
  Users,
  UserCheck,
  UserX,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  getFullEvents,
  getNearestEvent,
  getAttendees,
  saveAttendees,
  formatTime12,
  formatDateStr,
} from "../utils/attendanceStorage";

export default function RegistrationSheet() {
  const [searchParams] = useSearchParams();
  const eventIdParam = searchParams.get("id");

  const allEvents = useMemo(() => getFullEvents(), []);

  // Find target event from param or nearest event
  const currentEvent = useMemo(() => {
    if (eventIdParam) {
      const match = allEvents.find((e) => e.id === eventIdParam);
      if (match) return match;
    }
    return getNearestEvent();
  }, [eventIdParam, allEvents]);

  const [attendees, setAttendees] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Manual Form States
  const [manualEnrollment, setManualEnrollment] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualBranch, setManualBranch] = useState("IT");
  const [manualStatus, setManualStatus] = useState("Present");

  // Load attendees on mount / event change
  useEffect(() => {
    if (currentEvent) {
      setAttendees(getAttendees(currentEvent.id));
    }
  }, [currentEvent]);

  // Sync across tabs & storage events
  useEffect(() => {
    function handleStorageUpdate() {
      if (currentEvent) {
        setAttendees(getAttendees(currentEvent.id));
      }
    }
    window.addEventListener("storage", handleStorageUpdate);
    window.addEventListener("axon_attendance_updated", handleStorageUpdate);
    return () => {
      window.removeEventListener("storage", handleStorageUpdate);
      window.removeEventListener("axon_attendance_updated", handleStorageUpdate);
    };
  }, [currentEvent]);

  const showToast = (text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Stats
  const stats = useMemo(() => {
    const total = attendees.length;
    const present = attendees.filter((a) => a.status === "Present").length;
    const absent = attendees.filter((a) => a.status === "Absent").length;
    const turnout = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, turnout };
  }, [attendees]);

  // Filtered Attendees
  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return attendees.filter((att) => {
      if (statusFilter === "present" && att.status !== "Present") return false;
      if (statusFilter === "absent" && att.status !== "Absent") return false;
      if (!q) return true;
      return (
        att.name.toLowerCase().includes(q) ||
        att.enrollmentNo.toLowerCase().includes(q) ||
        att.branch.toLowerCase().includes(q)
      );
    });
  }, [attendees, searchQuery, statusFilter]);

  // Toggle status
  const handleToggleStatus = (id) => {
    const nowTime = new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const updated = attendees.map((item) => {
      if (item.id === id) {
        const newStatus = item.status === "Present" ? "Absent" : "Present";
        const newTime = newStatus === "Present" ? nowTime : "—";
        showToast(`${item.name} marked ${newStatus}`);
        return { ...item, status: newStatus, checkInTime: newTime };
      }
      return item;
    });

    setAttendees(updated);
    saveAttendees(currentEvent.id, updated);
  };

  // Manual Check-in
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualEnrollment.trim() || !manualName.trim()) {
      showToast("Please enter enrollment and name", "error");
      return;
    }

    const nowTime = new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const existingIndex = attendees.findIndex(
      (a) => a.enrollmentNo.toLowerCase() === manualEnrollment.trim().toLowerCase()
    );

    let updated;
    if (existingIndex >= 0) {
      updated = attendees.map((item, idx) =>
        idx === existingIndex
          ? {
              ...item,
              name: manualName,
              branch: manualBranch,
              status: manualStatus,
              checkInTime: manualStatus === "Present" ? nowTime : "—",
            }
          : item
      );
      showToast(`Updated ${manualName}`);
    } else {
      const newEntry = {
        id: `ATT-MANUAL-${Date.now()}`,
        enrollmentNo: manualEnrollment.trim().toUpperCase(),
        name: manualName.trim(),
        branch: manualBranch,
        status: manualStatus,
        checkInTime: manualStatus === "Present" ? nowTime : "—",
        email: `${manualName.toLowerCase().replace(/\s+/g, ".")}@vgec.ac.in`,
      };
      updated = [newEntry, ...attendees];
      showToast(`Added ${manualName}`);
    }

    setAttendees(updated);
    saveAttendees(currentEvent.id, updated);
    setIsManualModalOpen(false);
    setManualEnrollment("");
    setManualName("");
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!currentEvent) return;
    const headers = [
      "Sr No",
      "Enrollment No",
      "Student Name",
      "Branch",
      "Status",
      "Check-in Time",
      "Event Name",
    ];
    const rows = attendees.map((att, idx) => [
      idx + 1,
      `"${att.enrollmentNo}"`,
      `"${att.name}"`,
      `"${att.branch}"`,
      `"${att.status}"`,
      `"${att.checkInTime}"`,
      `"${currentEvent.name}"`,
    ]);
    const csv = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${currentEvent.name.replace(/\s+/g, "_")}_Attendance_Sheet.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Downloaded attendance sheet CSV!");
  };

  if (!currentEvent) {
    return <div className="p-8 text-center text-gray-500">Loading attendance sheet...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f7f7f9] p-4 sm:p-6 lg:p-8">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-gray-900 text-white text-xs font-semibold rounded-xl shadow-xl">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toast.text}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-100 text-[#7040d0]">
                {currentEvent.category || "Workshop"}
              </span>
              <span className="text-xs text-gray-400">• Official Attendance Register</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#24154f]">
              {currentEvent.name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 pt-1">
              <span className="flex items-center gap-1">
                <Calendar size={14} className="text-[#7040d0]" />
                {formatDateStr(currentEvent.eventDate)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock size={14} className="text-[#7040d0]" />
                {formatTime12(currentEvent.startTime)} - {formatTime12(currentEvent.endTime)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin size={14} className="text-[#7040d0]" />
                {currentEvent.venue || "Campus Venue"}
              </span>
              {currentEvent.speakerName && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <User size={14} className="text-[#7040d0]" />
                    {currentEvent.speakerName}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
            <button
              type="button"
              onClick={() => setIsManualModalOpen(true)}
              className="h-10 px-4 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors shadow-xs"
            >
              <Plus size={15} className="text-[#7040d0]" />
              <span>Mark Manually</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="h-10 px-4 bg-white hover:bg-purple-50 text-[#7040d0] border border-purple-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors shadow-xs"
            >
              <Printer size={15} />
              <span>Print Sheet</span>
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="h-10 px-4 bg-[#7040d0] hover:bg-[#5b32af] text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors shadow-xs"
            >
              <Download size={15} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* 3 Metric Summary Boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 shadow-xs">
            <div className="w-11 h-11 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Users size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Registered</p>
              <h4 className="text-2xl font-bold text-gray-900">{stats.total}</h4>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 shadow-xs">
            <div className="w-11 h-11 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <UserCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-gray-500 uppercase">Present</p>
                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-700 rounded">
                  {stats.turnout}%
                </span>
              </div>
              <h4 className="text-2xl font-bold text-emerald-600">{stats.present}</h4>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 shadow-xs">
            <div className="w-11 h-11 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
              <UserX size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Absent</p>
              <h4 className="text-2xl font-bold text-rose-600">{stats.absent}</h4>
            </div>
          </div>
        </div>

        {/* Main Sheet Table Card */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
          {/* Controls Bar */}
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or enrollment..."
                className="w-full h-9 pl-9 pr-8 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:bg-white focus:outline-none focus:border-[#7040d0]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-lg text-xs font-semibold text-gray-600 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1 rounded-md transition-all ${
                  statusFilter === "all" ? "bg-white text-gray-900 shadow-xs" : "hover:text-gray-900"
                }`}
              >
                All ({attendees.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("present")}
                className={`px-3 py-1 rounded-md transition-all ${
                  statusFilter === "present" ? "bg-emerald-500 text-white shadow-xs" : "hover:text-emerald-700"
                }`}
              >
                Present ({stats.present})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("absent")}
                className={`px-3 py-1 rounded-md transition-all ${
                  statusFilter === "absent" ? "bg-rose-500 text-white shadow-xs" : "hover:text-rose-700"
                }`}
              >
                Absent ({stats.absent})
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4 text-center w-14">#</th>
                  <th className="py-3 px-4">Enrollment No.</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4 text-center">Branch</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Check-in Time</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
                {filteredList.length > 0 ? (
                  filteredList.map((att, idx) => (
                    <tr key={att.id} className="hover:bg-purple-50/20 transition-colors">
                      <td className="py-3 px-4 text-center text-gray-400 font-medium text-xs">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-gray-800">
                        {att.enrollmentNo}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">{att.name}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs font-semibold">
                          {att.branch}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(att.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                            att.status === "Present"
                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                              : "bg-rose-100 text-rose-700 hover:bg-rose-200"
                          }`}
                          title="Click to toggle status"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              att.status === "Present" ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                          ></span>
                          <span>{att.status}</span>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center text-gray-600 font-medium">
                        {att.checkInTime}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(att.id)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                            att.status === "Present"
                              ? "text-rose-600 border-rose-200 hover:bg-rose-50"
                              : "text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                          }`}
                        >
                          {att.status === "Present" ? "Mark Absent" : "Mark Present"}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400 text-xs">
                      No student records match the search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Manual Check-in Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Manual Student Entry</h3>
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Enrollment No. *
                </label>
                <input
                  type="text"
                  required
                  value={manualEnrollment}
                  onChange={(e) => setManualEnrollment(e.target.value)}
                  placeholder="e.g. 24IT015"
                  className="w-full h-9 px-3 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#7040d0] font-mono uppercase"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Student Name *
                </label>
                <input
                  type="text"
                  required
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="e.g. Parth Patel"
                  className="w-full h-9 px-3 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#7040d0]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Branch</label>
                  <select
                    value={manualBranch}
                    onChange={(e) => setManualBranch(e.target.value)}
                    className="w-full h-9 px-2 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none"
                  >
                    <option value="IT">IT</option>
                    <option value="CE">CE</option>
                    <option value="EC">EC</option>
                    <option value="ICT">ICT</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Status</label>
                  <select
                    value={manualStatus}
                    onChange={(e) => setManualStatus(e.target.value)}
                    className="w-full h-9 px-2 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none"
                  >
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="h-9 px-3 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 bg-[#7040d0] text-white rounded-lg text-xs font-semibold"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
