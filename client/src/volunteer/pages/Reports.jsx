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

import { eventService } from "../../services/eventService";
import { reportService } from "../../services/reportService";
import { getAssetUrl } from "../../utils/urlUtils";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function getEventStatus(event) {
    if (!event) return "upcoming";
    const now = new Date();
    const dateStr = event.eventDate || event.date;
    if (!dateStr) return "upcoming";

    const start = new Date(
        `${new Date(dateStr).toISOString().split("T")[0]}T${event.startTime || "09:00 AM"}`
    );

    const end = new Date(
        `${new Date(dateStr).toISOString().split("T")[0]}T${event.endTime || "05:00 PM"}`
    );

    if (now < start) return "upcoming";
    if (now <= end) return "ongoing";
    return "past";
}

function formatDate(date) {
    if (!date) return "";
    try {
        return new Date(date).toLocaleDateString(
            "en-IN",
            {
                day: "numeric",
                month: "short",
                year: "numeric",
            }
        );
    } catch {
        return String(date);
    }
}

function Reports() {
    const [eventsList, setEventsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [search, setSearch] = useState("");
    const [showEvents, setShowEvents] = useState(false);
    const searchRef = useRef(null);

    const [reports, setReports] = useState({});
    const [showReport, setShowReport] = useState(false);
    const [toast, setToast] = useState("");

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

    // Load Events and Reports from API
    useEffect(() => {
        let isMounted = true;
        async function loadData() {
            try {
                setLoading(true);
                const [evRes, repRes] = await Promise.all([
                    eventService.getEvents().catch(() => ({ data: [] })),
                    reportService.getReports().catch(() => ({ data: [] })),
                ]);

                const liveEvents = evRes?.data || [];
                const liveReports = repRes?.data || [];

                const map = {};
                liveReports.forEach((rep) => {
                    const evId = (rep.eventId?._id || rep.eventId?.id || rep.eventId)?.toString();
                    if (evId) {
                        map[evId] = {
                            id: rep._id,
                            name: rep.reportUrl?.split("/").pop() || "Event Report",
                            reportUrl: rep.reportUrl,
                            status: rep.status || "pending",
                            uploadedAt: rep.uploadedAt || rep.createdAt,
                            uploadedBy: rep.uploadedBy,
                            sentToAdmin: true,
                            history: rep.history || [],
                        };
                    }
                });

                if (isMounted) {
                    setReports(map);
                    setEventsList(liveEvents);
                    if (liveEvents.length > 0) {
                        setSelectedEvent(liveEvents[0]);
                        setSearch(liveEvents[0].name);
                    }
                }
            } catch (err) {
                console.warn("Failed to load events/reports:", err.message);
                if (isMounted) setEventsList([]);
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        loadData();
        return () => {
            isMounted = false;
        };
    }, []);

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
        ? reports[selectedEvent._id || selectedEvent.id]
        : null;

    if (loading) {
        return (
            <div className="p-8 text-center text-sm text-gray-500">
                Loading events and reports...
            </div>
        );
    }

    if (!selectedEvent || eventsList.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
                <FileText size={40} className="mx-auto text-gray-300" />
                <h3 className="mt-4 font-semibold text-gray-700">No events available</h3>
                <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
                    Create an event in Admin to upload and manage event reports.
                </p>
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

        const evId = (selectedEvent._id || selectedEvent.id)?.toString();
        setReports((current) => ({
            ...current,
            [evId]: {
                file,
                name: file.name,
                sentToAdmin: false,
            },
        }));

        setToast("Report uploaded. Click 'Send to Admin' to submit.");
    }

    function downloadReport() {
        if (report?.file) {
            const url = URL.createObjectURL(report.file);
            const link = document.createElement("a");
            link.href = url;
            link.download = report.name;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
            return;
        }

        if (report?.reportUrl) {
            const fullUrl = getAssetUrl(report.reportUrl);
            window.open(fullUrl, "_blank");
        }
    }

    async function sendToAdmin() {
        const evId = (selectedEvent._id || selectedEvent.id)?.toString();
        const currentRep = reports[evId];
        if (!currentRep) return;

        if (currentRep.file) {
            try {
                const formData = new FormData();
                formData.append("file", currentRep.file);
                formData.append("eventId", evId);

                const res = await reportService.uploadReport(formData);
                const saved = res.data;

                setReports((current) => ({
                    ...current,
                    [evId]: {
                        id: saved._id,
                        name: saved.reportUrl?.split("/").pop() || currentRep.file.name,
                        reportUrl: saved.reportUrl,
                        status: saved.status || "pending",
                        uploadedAt: saved.uploadedAt || new Date().toISOString(),
                        uploadedBy: saved.uploadedBy,
                        sentToAdmin: true,
                        history: saved.history || [],
                    },
                }));

                setToast("Report submitted to Admin successfully.");
            } catch (err) {
                alert(err.message || "Failed to send report to Admin.");
            }
        } else {
            setToast("Report already submitted.");
        }
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