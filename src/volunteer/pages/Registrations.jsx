import { useState, useMemo, useEffect, useRef } from "react";
import {
  Search,
  ChevronDown,
  Eye,
  EyeOff,
  QrCode,
  Users,
  UserCheck,
  UserX,
  FileSpreadsheet,
  Download,
  Calendar,
  Clock,
  MapPin,
  User,
  X,
  Camera,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Check,
  ShieldCheck,
} from "lucide-react";
import {
  getFullEvents,
  getNearestEvent,
  getAttendees,
  saveAttendees,
  formatTime12,
  formatDateStr,
} from "../utils/attendanceStorage";
import { users as mockUsers } from "../../mockData";

export default function Registrations() {
  const allEvents = useMemo(() => getFullEvents(), []);
  const nearestEvent = useMemo(() => getNearestEvent(), []);

  // Selected event state
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventSearch, setEventSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Eye toggle state (one eye button to show full details)
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);

  // Attendees list state (for 3 metric boxes and scanner)
  const [attendees, setAttendees] = useState([]);

  // Scanner modal states
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanCode, setScanCode] = useState("");
  const [scanFeedback, setScanFeedback] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const [toast, setToast] = useState(null);

  // Initialize selected event to nearest event
  useEffect(() => {
    if (!selectedEvent && nearestEvent) {
      setSelectedEvent(nearestEvent);
      setEventSearch(nearestEvent.name);
      setAttendees(getAttendees(nearestEvent.id));
    }
  }, [nearestEvent, selectedEvent]);

  // Load attendees when selectedEvent changes
  useEffect(() => {
    if (selectedEvent) {
      setAttendees(getAttendees(selectedEvent.id));
    }
  }, [selectedEvent]);

  // Listen to multi-tab or local updates to attendees
  useEffect(() => {
    function handleStorageUpdate() {
      if (selectedEvent) {
        setAttendees(getAttendees(selectedEvent.id));
      }
    }
    window.addEventListener("storage", handleStorageUpdate);
    window.addEventListener("axon_attendance_updated", handleStorageUpdate);
    return () => {
      window.removeEventListener("storage", handleStorageUpdate);
      window.removeEventListener("axon_attendance_updated", handleStorageUpdate);
    };
  }, [selectedEvent]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showToast = (text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Filter events for search box
  const filteredEvents = useMemo(() => {
    const q = eventSearch.trim().toLowerCase();
    if (!q) return allEvents;
    return allEvents.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        (e.category && e.category.toLowerCase().includes(q)) ||
        (e.venue && e.venue.toLowerCase().includes(q))
    );
  }, [allEvents, eventSearch]);

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setEventSearch(event.name);
    setIsDropdownOpen(false);
    showToast(`Switched event to "${event.name}"`);
  };

  // 3 Metric counts: registered, present, absent
  const stats = useMemo(() => {
    const registered = attendees.length || selectedEvent?.registeredCount || 78;
    const present = attendees.filter((a) => a.status === "Present").length;
    const absent = attendees.filter((a) => a.status === "Absent").length;
    const turnout = registered > 0 ? Math.round((present / registered) * 100) : 0;
    return { registered, present, absent, turnout };
  }, [attendees, selectedEvent]);

  // View Sheet in another tab
  const handleViewSheet = () => {
    if (!selectedEvent) return;
    const url = `/volunteer/registrations/sheet?id=${encodeURIComponent(selectedEvent.id)}`;
    window.open(url, "_blank");
  };

  // Export Sheet CSV
  const handleExportSheet = () => {
    if (!selectedEvent) return;
    const headers = ["Sr No", "Enrollment No", "Student Name", "Branch", "Status", "Check-in Time", "Event"];
    const rows = attendees.map((a, i) => [
      i + 1,
      `"${a.enrollmentNo}"`,
      `"${a.name}"`,
      `"${a.branch}"`,
      `"${a.status}"`,
      `"${a.checkInTime}"`,
      `"${selectedEvent.name}"`,
    ]);
    const csv = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${selectedEvent.name.replace(/\s+/g, "_")}_Attendance_Sheet.csv`;
    link.click();
    showToast("Downloaded attendance sheet CSV!");
  };

  // Export Present List CSV
  const handleExportPresentList = () => {
    if (!selectedEvent) return;
    const presentOnly = attendees.filter((a) => a.status === "Present");
    const headers = ["Sr No", "Enrollment No", "Student Name", "Branch", "Check-in Time"];
    const rows = presentOnly.map((a, i) => [
      i + 1,
      `"${a.enrollmentNo}"`,
      `"${a.name}"`,
      `"${a.branch}"`,
      `"${a.checkInTime}"`,
    ]);
    const csv = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${selectedEvent.name.replace(/\s+/g, "_")}_Present_Students.csv`;
    link.click();
    showToast(`Downloaded present list (${presentOnly.length} students)!`);
  };

  // QR / Code scanning handler
  const handleScanSubmit = (codeToTest) => {
    const code = (codeToTest || scanCode).trim().toLowerCase();
    if (!code) {
      setScanFeedback({ type: "error", message: "Please enter or scan an enrollment number." });
      return;
    }

    const nowTime = new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const match = attendees.find(
      (a) =>
        a.enrollmentNo.toLowerCase() === code ||
        a.name.toLowerCase().includes(code)
    );

    if (match) {
      if (match.status === "Present") {
        setScanFeedback({
          type: "warning",
          message: `${match.name} (${match.enrollmentNo}) is already marked Present at ${match.checkInTime}.`,
        });
        return;
      }

      const updated = attendees.map((item) =>
        item.id === match.id
          ? { ...item, status: "Present", checkInTime: nowTime }
          : item
      );
      setAttendees(updated);
      saveAttendees(selectedEvent.id, updated);
      setScanFeedback({
        type: "success",
        message: `Success! Checked in ${match.name} (${match.enrollmentNo}) at ${nowTime}.`,
      });
      showToast(`Checked in ${match.name}!`);
      setScanCode("");
    } else {
      // Check if student in mock users
      const user = mockUsers.find(
        (u) =>
          u.enrollmentNo?.toLowerCase() === code ||
          u.fullName?.toLowerCase().includes(code)
      );

      if (user) {
        const newAttendee = {
          id: `ATT-${Date.now()}`,
          enrollmentNo: user.enrollmentNo,
          name: user.fullName,
          branch: user.department || "IT",
          status: "Present",
          checkInTime: nowTime,
          email: user.email,
        };
        const updated = [newAttendee, ...attendees];
        setAttendees(updated);
        saveAttendees(selectedEvent.id, updated);
        setScanFeedback({
          type: "success",
          message: `Verified: ${user.fullName} (${user.enrollmentNo}) checked in!`,
        });
        showToast(`Checked in ${user.fullName}!`);
        setScanCode("");
      } else {
        setScanFeedback({
          type: "error",
          message: `No registration found for "${codeToTest || scanCode}".`,
        });
      }
    }
  };

  const toggleCamera = async () => {
    if (cameraActive) {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      }
      setCameraActive(false);
    } else {
      try {
        if (navigator.mediaDevices?.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        }
      } catch (e) {
        console.error(e);
      }
      setCameraActive(true);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-gray-900 text-white text-xs font-semibold rounded-xl shadow-xl">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toast.text}</span>
        </div>
      )}

      {/* 1. Main Heading */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#24154f] tracking-tight">
          Registrations
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-gray-500 font-medium">
          Manage event registrations, view attendance sheets, and scan entry QR codes.
        </p>
      </div>

      {/* 2. Search Bar & Start Scanning Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search bar to select / change event */}
        <div className="relative flex-1" ref={dropdownRef}>
          <div
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="flex items-center justify-between gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-xs hover:border-[#7040d0]/50 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Search
                size={18}
                className="text-gray-400 group-hover:text-[#7040d0] shrink-0 transition-colors"
              />
              <input
                type="text"
                value={eventSearch}
                onChange={(e) => {
                  setEventSearch(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDropdownOpen(true);
                }}
                placeholder="Search or select event..."
                className="w-full text-sm font-medium text-gray-800 placeholder-gray-400 outline-none bg-transparent"
              />
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {eventSearch && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEventSearch("");
                    setIsDropdownOpen(true);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-full"
                >
                  <X size={14} />
                </button>
              )}
              <ChevronDown
                size={18}
                className={`text-gray-400 transition-transform ${
                  isDropdownOpen ? "rotate-180 text-[#7040d0]" : ""
                }`}
              />
            </div>
          </div>

          {/* Event Dropdown */}
          {isDropdownOpen && (
            <div className="absolute left-0 right-0 top-full mt-2 z-40 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden max-h-72 overflow-y-auto">
              <div className="px-3 py-2 text-[11px] font-bold text-gray-400 uppercase bg-gray-50 border-b border-gray-100 flex justify-between">
                <span>Select Event</span>
                <span>{filteredEvents.length} events</span>
              </div>
              {filteredEvents.map((ev) => {
                const isSelected = selectedEvent?.id === ev.id;
                const isNearest = nearestEvent?.id === ev.id;
                return (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => handleSelectEvent(ev)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-50 flex items-center justify-between gap-3 transition-colors ${
                      isSelected ? "bg-purple-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-semibold truncate ${isSelected ? "text-[#7040d0]" : "text-gray-800"}`}>
                          {ev.name}
                        </p>
                        {isNearest && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            Nearest
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                        <span>{formatDateStr(ev.eventDate)}</span>
                        <span>•</span>
                        <span>{ev.venue || "Campus Venue"}</span>
                      </p>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-[#7040d0] text-white flex items-center justify-center shrink-0">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Start Scanning button commonly for all events */}
        <button
          type="button"
          onClick={() => {
            setIsScannerOpen(true);
            setScanFeedback(null);
            setScanCode("");
          }}
          className="shrink-0 h-12 px-6 bg-[#7040d0] hover:bg-[#5b32af] active:scale-95 text-white rounded-xl text-sm font-semibold shadow-xs flex items-center justify-center gap-2 transition-all"
        >
          <QrCode size={18} strokeWidth={2.2} />
          <span>Start Scanning</span>
        </button>
      </div>

      {/* 3. Event Card (Nearest Event or Selected Event) with ONE Eye Button */}
      {selectedEvent && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-100 text-[#7040d0]">
                    {selectedEvent.category || "Event"}
                  </span>
                  {nearestEvent?.id === selectedEvent.id && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-amber-100 text-amber-800">
                      Nearest Event
                    </span>
                  )}
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                  {selectedEvent.name}
                </h2>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-gray-600 pt-0.5">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={15} className="text-[#7040d0]" />
                    {formatDateStr(selectedEvent.eventDate)}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={15} className="text-[#7040d0]" />
                    {formatTime12(selectedEvent.startTime)} - {formatTime12(selectedEvent.endTime)}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <MapPin size={15} className="text-[#7040d0]" />
                    {selectedEvent.venue || "Campus Hall"}
                  </span>
                  {selectedEvent.speakerName && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1.5">
                        <User size={15} className="text-[#7040d0]" />
                        {selectedEvent.speakerName}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* One eye button only in addition to details which upon expanding show full event details */}
              <div className="shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => setIsDetailsExpanded((prev) => !prev)}
                  className={`p-2.5 rounded-xl border transition-all ${
                    isDetailsExpanded
                      ? "bg-purple-100 text-[#7040d0] border-purple-200"
                      : "bg-gray-50 hover:bg-purple-50 text-gray-600 hover:text-[#7040d0] border-gray-200"
                  }`}
                  title={isDetailsExpanded ? "Hide full details" : "Expand full details"}
                >
                  {isDetailsExpanded ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Expanded Full Event Details */}
            {isDetailsExpanded && (
              <div className="mt-5 pt-5 border-t border-gray-100 space-y-4 animate-in fade-in duration-200">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Event Overview
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                    {selectedEvent.description || "No full description available for this event."}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-[11px] font-semibold text-gray-400 block uppercase">
                      Seat Capacity
                    </span>
                    <span className="text-sm font-bold text-gray-800 mt-0.5 block">
                      {stats.registered} / {selectedEvent.participantLimit || 100} Registered
                    </span>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-[11px] font-semibold text-gray-400 block uppercase">
                      Eligible Branches
                    </span>
                    <span className="text-sm font-bold text-gray-800 mt-0.5 block truncate">
                      {Array.isArray(selectedEvent.eligibleDepartments)
                        ? selectedEvent.eligibleDepartments.join(", ")
                        : "All Departments"}
                    </span>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-[11px] font-semibold text-gray-400 block uppercase">
                      Attendance Window
                    </span>
                    <span className="text-sm font-bold text-gray-800 mt-0.5 block">
                      {formatTime12(selectedEvent.startTime)} - {formatTime12(selectedEvent.endTime)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Three Stat Boxes: Registered, Present, Absent */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Box 1: registered */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <Users size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              registered
            </p>
            <h3 className="text-3xl font-extrabold text-gray-900 mt-0.5">
              {stats.registered}
            </h3>
          </div>
        </div>

        {/* Box 2: present */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <UserCheck size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                present
              </p>
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-700">
                {stats.turnout}%
              </span>
            </div>
            <h3 className="text-3xl font-extrabold text-emerald-600 mt-0.5">
              {stats.present}
            </h3>
          </div>
        </div>

        {/* Box 3: absent */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
            <UserX size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              absent
            </p>
            <h3 className="text-3xl font-extrabold text-rose-600 mt-0.5">
              {stats.absent}
            </h3>
          </div>
        </div>
      </div>

      {/* 5. Buttons below boxes: View Sheet (open in new tab), Export Sheet, Export Present List */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
        {/* View Sheet Button */}
        <button
          type="button"
          onClick={handleViewSheet}
          className="w-full sm:w-auto h-11 px-6 bg-white hover:bg-purple-50 text-[#7040d0] border border-purple-200 rounded-xl text-sm font-semibold shadow-xs flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <FileSpreadsheet size={16} />
          <span>View Sheet</span>
          <ExternalLink size={13} className="text-[#7040d0]/70" />
        </button>

        {/* Export Sheet Button */}
        <button
          type="button"
          onClick={handleExportSheet}
          className="w-full sm:w-auto h-11 px-6 bg-[#7040d0] hover:bg-[#5b32af] text-white rounded-xl text-sm font-semibold shadow-xs flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <Download size={16} />
          <span>Export Sheet</span>
        </button>

        {/* Export Present List */}
        <button
          type="button"
          onClick={handleExportPresentList}
          className="w-full sm:w-auto h-11 px-5 bg-purple-100 hover:bg-purple-200/80 text-[#7040d0] rounded-xl text-sm font-semibold shadow-xs flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <span>Export Present List</span>
        </button>
      </div>

      {/* QR SCANNER MODAL */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-purple-50/50">
              <div className="flex items-center gap-2">
                <QrCode size={18} className="text-[#7040d0]" />
                <h3 className="text-base font-bold text-gray-900">Attendance QR Scanner</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (cameraActive && videoRef.current?.srcObject) {
                    videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
                  }
                  setCameraActive(false);
                  setIsScannerOpen(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="relative w-full h-48 bg-gray-900 rounded-xl overflow-hidden flex flex-col items-center justify-center border-2 border-dashed border-[#7040d0]/50">
                {cameraActive ? (
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-4">
                    <QrCode size={40} className="text-purple-400/80 mb-2" />
                    <p className="text-xs font-semibold text-gray-300">Scanner Viewfinder</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Align QR or enter enrollment below
                    </p>
                  </div>
                )}
                <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-[#a855f7] shadow-[0_0_10px_#a855f7] animate-pulse"></div>

                <button
                  type="button"
                  onClick={toggleCamera}
                  className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded bg-black/60 hover:bg-black/80 text-white text-[11px] flex items-center gap-1"
                >
                  <Camera size={12} />
                  <span>{cameraActive ? "Stop Camera" : "Use Camera"}</span>
                </button>
              </div>

              {scanFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium border flex items-center gap-2 ${
                    scanFeedback.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : scanFeedback.type === "warning"
                      ? "bg-amber-50 text-amber-800 border-amber-200"
                      : "bg-rose-50 text-rose-800 border-rose-200"
                  }`}
                >
                  {scanFeedback.type === "success" ? (
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle size={16} className="shrink-0" />
                  )}
                  <span>{scanFeedback.message}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 block">
                  Scan QR Token or Enter Enrollment No.
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={scanCode}
                    onChange={(e) => setScanCode(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleScanSubmit()}
                    placeholder="e.g. 24IT010 or 220130107054"
                    className="flex-1 h-10 px-3 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#7040d0] font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => handleScanSubmit()}
                    className="h-10 px-4 bg-[#7040d0] hover:bg-[#5b32af] text-white rounded-xl text-xs font-semibold shrink-0"
                  >
                    Check In
                  </button>
                </div>
              </div>

              {/* Quick test simulation */}
              <div className="pt-2 border-t border-gray-100">
                <span className="text-[11px] font-semibold text-gray-400 block mb-1.5">
                  Quick Simulate Scans:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {attendees
                    .filter((a) => a.status === "Absent")
                    .slice(0, 3)
                    .map((att) => (
                      <button
                        key={att.id}
                        type="button"
                        onClick={() => {
                          setScanCode(att.enrollmentNo);
                          handleScanSubmit(att.enrollmentNo);
                        }}
                        className="px-2 py-0.5 text-[11px] bg-purple-50 hover:bg-purple-100 text-[#7040d0] rounded border border-purple-200 font-medium"
                      >
                        + Scan {att.name.split(" ")[0]} ({att.enrollmentNo})
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
