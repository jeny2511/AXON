import { useState, useMemo } from "react";
import {
  Search,
  X,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import StudentLayout from "../layouts/StudentLayout";
import CertificateView from "../components/CertificateView";
import {
  getActiveStudentId,
  getStudentProfile,
  getStudentCertificates,
  getStudentCompletedEvents,
  getEventById,
} from "../services/studentService";

// Format date into standard display (e.g. "23 Oct 2027")
function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  const dateObj = new Date(`${dateStr}`.includes("T") ? dateStr : `${dateStr}T00:00:00`);
  if (isNaN(dateObj.getTime())) return dateStr;
  return dateObj.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Format 24-hour time string into 12-hour format ("02:00 PM")
function formatTime(timeStr) {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedHours = hours < 10 ? `0${hours}` : hours;
  return `${formattedHours}:${minutes} ${ampm}`;
}

function Certificates() {
  const studentId = getActiveStudentId();
  const student = getStudentProfile(studentId) || {
    id: studentId,
    fullName: "Student",
    enrollmentNo: "220130107054",
  };

  const certificates = getStudentCertificates(studentId);
  const attendedEvents = getStudentCompletedEvents(studentId);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCertificate, setSelectedCertificate] = useState(null);

  const filteredCertificates = useMemo(() => {
    if (!searchTerm.trim()) return certificates;
    const term = searchTerm.toLowerCase();
    return certificates.filter((cert) => {
      const event = getEventById(cert.eventId);
      const titleMatch = cert.certificateTitle?.toLowerCase().includes(term);
      const idMatch = cert.certificateId?.toLowerCase().includes(term);
      const eventMatch = event?.name?.toLowerCase().includes(term);
      return titleMatch || idMatch || eventMatch;
    });
  }, [certificates, searchTerm]);

  const handleViewCertificate = (certificate) => {
    const event = getEventById(certificate.eventId);
    setSelectedCertificate({
      ...certificate,
      eventName: event ? event.name : certificate.eventId,
    });
  };

  const handleCloseCertificate = () => {
    setSelectedCertificate(null);
  };

  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* ==================================================== */}
        {/* 1. HEADER SECTION (Matches Volunteer Layout)        */}
        {/* ==================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              My Certificates
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              View, verify, and download certificates earned from attended club events.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search certificates..."
              className="w-full h-10 pl-9 pr-8 text-xs bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#7040d0] focus:ring-2 focus:ring-[#7040d0]/15 transition-all shadow-xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* ==================================================== */}
        {/* 2. STAT METRICS (Volunteer Design Language)          */}
        {/* ==================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
            <p className="text-xs font-semibold text-gray-500">Issued Certificates</p>
            <p className="text-2xl font-bold text-gray-900 mt-1.5">
              {certificates.length}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
            <p className="text-xs font-semibold text-gray-500">Attended Events</p>
            <p className="text-2xl font-bold text-gray-900 mt-1.5">
              {attendedEvents.length}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
            <p className="text-xs font-semibold text-gray-500">Issuance Completion</p>
            <p className="text-2xl font-bold text-[#7040d0] mt-1.5">
              {attendedEvents.length > 0
                ? `${Math.min(100, Math.round((certificates.length / attendedEvents.length) * 100))}%`
                : "100%"}
            </p>
          </div>
        </div>

        {/* ==================================================== */}
        {/* 3. CERTIFICATES GRID                                 */}
        {/* ==================================================== */}
        {filteredCertificates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <AlertCircle size={32} className="mx-auto text-gray-300" />
            <p className="mt-2 text-sm font-semibold text-gray-700">
              No certificates found
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {searchTerm
                ? `No certificates match "${searchTerm}". Try a different keyword.`
                : "Certificates will appear here once your attendance at eligible events is marked and verified."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredCertificates.map((certificate) => {
              const event = getEventById(certificate.eventId);

              return (
                <div
                  key={certificate.certificateId}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs transition-all hover:shadow-md"
                >
                  {/* Event Poster / Cover */}
                  <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-purple-900 to-indigo-950">
                    {event?.poster ? (
                      <img
                        src={event.poster}
                        alt={event.name || certificate.certificateTitle}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    ) : null}
                  </div>

                  {/* Card Body */}
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-bold text-gray-900 text-base line-clamp-1 group-hover:text-[#7040d0] transition-colors">
                      {event?.name || certificate.certificateTitle}
                    </h3>

                    <p className="mt-2 flex-1 text-xs text-gray-600 line-clamp-2 leading-relaxed">
                      {event?.description || certificate.certificateTitle || "Certificate of participation for this event."}
                    </p>

                    {/* Metadata Items: Date, Time, Venue */}
                    <div className="mt-4 space-y-2 border-t border-gray-100 pt-3 text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-[#7040d0] shrink-0" />
                        <span>{formatDate(event?.eventDate || certificate.issueDate)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-[#7040d0] shrink-0" />
                        <span>
                          {formatTime(event?.startTime)} - {formatTime(event?.endTime)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-[#7040d0] shrink-0" />
                        <span className="truncate">{event?.venue || "VGEC Campus"}</span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                      <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 size={13} />
                        <span>Verified & Issued</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => handleViewCertificate(certificate)}
                        className="px-3.5 py-1.5 rounded-lg bg-[#7040d0] hover:bg-[#5b32af] text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
                      >
                        View Certificate
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CERTIFICATE MODAL */}
      {selectedCertificate && (
        <CertificateView
          certificate={selectedCertificate}
          studentName={student.fullName}
          enrollmentNo={student.enrollmentNo || "220130107054"}
          eventName={selectedCertificate.eventName}
          onClose={handleCloseCertificate}
        />
      )}
    </StudentLayout>
  );
}

export default Certificates;