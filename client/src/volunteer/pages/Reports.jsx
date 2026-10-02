import { useEffect, useMemo, useRef, useState } from "react";
import {
    Check,
    ChevronDown,
    Download,
    FileText,
    Search,
    Send,
    Upload,
    X,
} from "lucide-react";

import { events as initialMockEvents } from "../../mockData";
import { API_BASE_URL } from "../../services/api";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function getEventStatus(event) {
    const now = new Date();

    const start = new Date(
        `${event.eventDate || event.date || ""}`.includes("T")
            ? (event.eventDate || event.date)
            : `${event.eventDate || event.date || ""}T${event.startTime || "09:00"}`
    );

    const end = new Date(
        `${event.eventDate || event.endDate || event.date || ""}`.includes("T")
            ? (event.eventDate || event.endDate || event.date)
            : `${event.eventDate || event.endDate || event.date || ""}T${event.endTime || "17:00"}`
    );

    if (now < start) return "upcoming";
    if (now <= end) return "ongoing";
    return "past";
}

function formatDate(date) {
    if (!date) return "";
    const dateStr = `${date}`.includes("T") ? date : `${date}T00:00:00`;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return date;
    return d.toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            year: "numeric",
        }
    );
}

function Reports() {
    const [eventsList, setEventsList] = useState(() => {
        try {
            const saved = localStorage.getItem("axon_live_events");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch {}
        return initialMockEvents;
    });

    const [selectedEvent, setSelectedEvent] = useState(null);
    const [search, setSearch] = useState("");
    const [showEvents, setShowEvents] = useState(false);
    const searchRef = useRef(null);

    const [reports, setReports] = useState(() => {
        try {
            const saved = localStorage.getItem("axon_event_reports");
            if (saved) return JSON.parse(saved);
        } catch {}
        return {};
    });
    const [showReport, setShowReport] = useState(false);
    const [toast, setToast] = useState("");

    // Load live events
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/events`);
                const data = await res.json();
                if (data.success && Array.isArray(data.events)) {
                    const normalized = data.events.map((ev) => ({
                        id: ev._id || ev.id,
                        _id: ev._id || ev.id,
                        name: ev.name,
                        category: ev.category || "Workshop",
                        eventDate: ev.date ? ev.date.split("T")[0] : ev.eventDate,
                        date: ev.date ? ev.date.split("T")[0] : ev.eventDate,
                        startTime: ev.startTime || "10:00",
                        endTime: ev.endTime || "12:00",
                        venue: ev.venue || "Campus Venue",
                        status: ev.status || "upcoming",
                        poster: ev.poster || null,
                    }));
                    setEventsList(normalized);
                }
            } catch {}
        };
        fetchEvents();

        const handleEventsChange = () => {
            try {
                const saved = localStorage.getItem("axon_live_events");
                if (saved) setEventsList(JSON.parse(saved));
            } catch {}
        };
        window.addEventListener("axon-events-change", handleEventsChange);
        return () => window.removeEventListener("axon-events-change", handleEventsChange);
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(e) {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowEvents(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const nearestEvent = useMemo(() => {
        return [...eventsList].sort((a, b) => {
            const aTime = new Date(
                `${a.eventDate || a.date}T${a.startTime || "09:00"}`
            ).getTime();

            const bTime = new Date(
                `${b.eventDate || b.date}T${b.startTime || "09:00"}`
            ).getTime();

            return (
                Math.abs(aTime - Date.now()) -
                Math.abs(bTime - Date.now())
            );
        })[0];
    }, [eventsList]);

    useEffect(() => {
        if (!selectedEvent && nearestEvent) {
            setSelectedEvent(nearestEvent);
            setSearch(nearestEvent.name);
        }
    }, [nearestEvent, selectedEvent]);

    useEffect(() => {
        if (!toast) return;

        const timer = setTimeout(() => setToast(""), 2500);
        return () => clearTimeout(timer);
    }, [toast]);

    const filteredEvents = useMemo(() => {
        if (
            !search.trim() ||
            (selectedEvent && search.trim().toLowerCase() === selectedEvent.name.toLowerCase())
        ) {
            return eventsList;
        }
        return eventsList.filter((event) =>
            event.name.toLowerCase().includes(search.toLowerCase())
        );
    }, [eventsList, search, selectedEvent]);

    const status = selectedEvent
        ? getEventStatus(selectedEvent)
        : "";

    const report = selectedEvent
        ? reports[selectedEvent.id]
        : null;

    if (!selectedEvent) {
        return (
            <div className="p-6 text-sm text-gray-500">
                Loading reports...
            </div>
        );
    }

    function uploadReport(file) {
        if (!file) return;

        const allowedTypes = [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel",
        ];

        if (!allowedTypes.includes(file.type)) {
            setToast(
                "Please upload a PDF, Word or Excel report."
            );
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            setToast("Report size must be below 10 MB.");
            return;
        }

        setReports((current) => {
            const updated = {
                ...current,
                [selectedEvent.id]: {
                    file,
                    name: file.name,
                    sentToAdmin: false,
                },
            };
            try {
                localStorage.setItem("axon_event_reports", JSON.stringify(updated));
            } catch {}
            return updated;
        });

        setToast("Report uploaded successfully.");
    }

    function downloadReport() {
        if (!report?.file) return;

        const url = URL.createObjectURL(report.file);
        const link = document.createElement("a");

        link.href = url;
        link.download = report.name;

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
    }

    function sendToAdmin() {
        if (!report) return;

        setReports((current) => {
            const updated = {
                ...current,
                [selectedEvent.id]: {
                    ...current[selectedEvent.id],
                    sentToAdmin: true,
                },
            };
            try {
                localStorage.setItem("axon_event_reports", JSON.stringify(updated));
            } catch {}
            return updated;
        });

        setToast("Report sent to Admin.");
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-[#24154f]">
                    Reports
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                    Upload and submit reports for completed events.
                </p>
            </div>

            {/* Search */}
            <div className="relative max-w-2xl" ref={searchRef}>
                <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                    <Search size={18} className="text-gray-400" />

                    <input
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setShowEvents(true);
                        }}
                        onFocus={() => setShowEvents(true)}
                        placeholder="Search event..."
                        className="w-full text-sm outline-none"
                    />

                    <button
                        type="button"
                        onClick={() => setShowEvents((value) => !value)}
                    >
                        <ChevronDown
                            size={18}
                            className="text-gray-400"
                        />
                    </button>
                </div>

                {showEvents && (
                    <div className="absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
                        {filteredEvents.length ? (
                            filteredEvents.map((event) => (
                                <button
                                    key={event.id}
                                    type="button"
                                    onClick={() => {
                                        setSelectedEvent(event);
                                        setSearch(event.name);
                                        setShowEvents(false);
                                        setShowReport(false);
                                    }}
                                    className="w-full rounded-lg px-3 py-3 text-left hover:bg-gray-50"
                                >
                                    <p className="font-medium text-gray-800">
                                        {event.name}
                                    </p>

                                    <p className="mt-1 text-xs text-gray-500">
                                        {formatDate(event.eventDate)} ·{" "}
                                        {getEventStatus(event)}
                                    </p>
                                </button>
                            ))
                        ) : (
                            <p className="px-3 py-4 text-sm text-gray-500">
                                No events found.
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Event information */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h2 className="font-semibold text-gray-800">
                            {selectedEvent.name}
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            {formatDate(selectedEvent.eventDate)} ·{" "}
                            {selectedEvent.startTime} -{" "}
                            {selectedEvent.endTime}
                        </p>
                    </div>

                    <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium capitalize text-purple-700">
                        {status}
                    </span>
                </div>
            </div>

            {/* Report not required */}
            {selectedEvent.reportRequired === false ? (
                <EmptyBox text="This event doesn't include a report." />
            ) : (
                <>
                    {/* UPCOMING */}
                    {status === "upcoming" && (
                        <MessageBox>
                            This event is upcoming. The report can be uploaded
                            after the event is completed.
                        </MessageBox>
                    )}

                    {/* ONGOING */}
                    {status === "ongoing" && (
                        <ActionBox
                            icon={<Upload size={26} />}
                            title="Upload Report"
                            text="Report upload will be available after the event is completed."
                            action={
                                <label
                                    className="cursor-pointer rounded-lg bg-gray-300 px-4 py-2 text-sm font-medium text-gray-600"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setToast(
                                            "Report cannot be uploaded until the event is completed."
                                        );
                                    }}
                                >
                                    Upload Report
                                </label>
                            }
                        />
                    )}

                    {/* PAST + NO REPORT */}
                    {status === "past" && !report && (
                        <ActionBox
                            icon={<Upload size={26} />}
                            title="Upload Report"
                            text="Upload the report for this completed event."
                            action={
                                <label className="cursor-pointer rounded-lg bg-[#24154f] px-4 py-2 text-sm font-medium text-white">
                                    Upload Report
                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx,.xls,.xlsx"
                                        className="hidden"
                                        onChange={(e) =>
                                            uploadReport(e.target.files?.[0])
                                        }
                                    />
                                </label>
                            }
                        />
                    )}

                    {/* REPORT UPLOADED */}
                    {report && (
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
                                        <FileText size={25} />
                                    </div>

                                    <div>
                                        <h3 className="font-semibold text-gray-800">
                                            Report Uploaded
                                        </h3>

                                        <p className="mt-1 text-sm text-gray-500">
                                            {report.name}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowReport(true)}
                                        className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700"
                                    >
                                        View Report
                                    </button>

                                    <button
                                        type="button"
                                        onClick={downloadReport}
                                        className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700"
                                    >
                                        <Download size={16} />
                                        Download
                                    </button>

                                    {!report.sentToAdmin ? (
                                        <button
                                            type="button"
                                            onClick={sendToAdmin}
                                            className="flex items-center gap-2 rounded-lg bg-[#24154f] px-4 py-2 text-sm font-medium text-white"
                                        >
                                            <Send size={16} />
                                            Send to Admin
                                        </button>
                                    ) : (
                                        <span className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
                                            <Check size={16} />
                                            Report sent to Admin
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Report preview */}
            {showReport && report && (
                <Modal onClose={() => setShowReport(false)}>
                    <div className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="font-semibold text-gray-800">
                                    Uploaded Report
                                </h2>

                                <p className="mt-1 text-xs text-gray-500">
                                    {report.name}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowReport(false)}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="mt-5 flex min-h-[400px] items-center justify-center rounded-xl bg-gray-50 p-4">
                            {report.file.type === "application/pdf" ? (
                                <iframe
                                    src={URL.createObjectURL(report.file)}
                                    title="Uploaded Report"
                                    className="h-[60vh] w-full rounded-lg border bg-white"
                                />
                            ) : (
                                <div className="text-center">
                                    <FileText
                                        size={48}
                                        className="mx-auto text-gray-300"
                                    />

                                    <p className="mt-3 text-sm text-gray-600">
                                        Preview is not available for this file type.
                                    </p>

                                    <button
                                        type="button"
                                        onClick={downloadReport}
                                        className="mt-4 flex items-center gap-2 rounded-lg bg-[#24154f] px-4 py-2 text-sm text-white"
                                    >
                                        <Download size={16} />
                                        Download Report
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </Modal>
            )}

            {toast && (
                <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-[#24154f] px-4 py-3 text-sm font-medium text-white shadow-lg">
                    <Check size={16} />
                    {toast}
                </div>
            )}
        </div>
    );
}

function ActionBox({ icon, title, text, action }) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
                        {icon}
                    </div>

                    <div>
                        <h3 className="font-semibold text-gray-800">
                            {title}
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                            {text}
                        </p>
                    </div>
                </div>

                {action}
            </div>
        </div>
    );
}

function MessageBox({ children }) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
            <FileText
                size={36}
                className="mx-auto text-gray-300"
            />

            <p className="mt-4 text-sm text-gray-500">
                {children}
            </p>
        </div>
    );
}

function EmptyBox({ text }) {
    return (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <FileText
                size={36}
                className="mx-auto text-gray-300"
            />

            <p className="mt-4 text-sm text-gray-500">
                {text}
            </p>
        </div>
    );
}

function Modal({ children, onClose }) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onMouseDown={onClose}
        >
            <div
                className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl"
                onMouseDown={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
}

export default Reports;