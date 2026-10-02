import { useEffect, useMemo, useRef, useState } from "react";
import {
    Check,
    ChevronDown,
    Download,
    FileText,
    Search,
    Upload,
    X,
} from "lucide-react";

import {
    attendance,
    events as initialMockEvents,
    feedback,
    registrations,
    users,
} from "../../mockData";
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

function Certificates() {
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

    const [templates, setTemplates] = useState(() => {
        try {
            const saved = localStorage.getItem("axon_certificate_templates");
            if (saved) return JSON.parse(saved);
        } catch {}
        return {};
    });
    const [generated, setGenerated] = useState(() => {
        try {
            const saved = localStorage.getItem("axon_generated_certificates");
            if (saved) return JSON.parse(saved);
        } catch {}
        return {};
    });
    const [eligibility, setEligibility] = useState("attendance");

    const [showGenerate, setShowGenerate] = useState(false);
    const [showTemplate, setShowTemplate] = useState(false);
    const [toast, setToast] = useState("");

    // Load live events from API
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
                        certificateAvailable: ev.certificateAvailable !== false,
                        feedbackRequired: ev.feedbackRequired !== false,
                        poster: ev.poster || null,
                    }));
                    setEventsList(normalized);
                    localStorage.setItem("axon_live_events", JSON.stringify(normalized));
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
            const aDate = new Date(
                `${a.eventDate || a.date}T${a.startTime || "09:00"}`
            ).getTime();

            const bDate = new Date(
                `${b.eventDate || b.date}T${b.startTime || "09:00"}`
            ).getTime();

            return (
                Math.abs(aDate - Date.now()) -
                Math.abs(bDate - Date.now())
            );
        })[0];
    }, [eventsList]);

    useEffect(() => {
        if (!selectedEvent && nearestEvent) {
            setSelectedEvent(nearestEvent);
            setSearch(nearestEvent.name);
        }
    }, [nearestEvent, selectedEvent]);

    // Load event certificates when event is selected
    useEffect(() => {
        if (!selectedEvent) return;
        const fetchIssued = async () => {
            try {
                const token = localStorage.getItem("axon_token");
                const res = await fetch(`${API_BASE_URL}/certificates/event/${selectedEvent.id || selectedEvent._id}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                const data = await res.json();
                if (data.success && Array.isArray(data.certificates)) {
                    const ids = data.certificates.map(c => c.studentId?._id || c.studentId || c._id);
                    if (ids.length > 0) {
                        setGenerated(prev => {
                            const updated = { ...prev, [selectedEvent.id]: ids };
                            localStorage.setItem("axon_generated_certificates", JSON.stringify(updated));
                            return updated;
                        });
                    }
                }
            } catch {}
        };
        fetchIssued();
    }, [selectedEvent]);

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

    const template = selectedEvent
        ? templates[selectedEvent.id]
        : null;

    const generatedCertificates = selectedEvent
        ? generated[selectedEvent.id] || []
        : [];

    const eligibleStudents = selectedEvent
        ? getEligibleStudents(
            selectedEvent.id,
            eligibility
        )
        : [];

    const generatedCount = generatedCertificates.length;
    const totalCount = eligibleStudents.length;

    const featureIncluded =
        selectedEvent?.certificateAvailable !== false;

    function handleTemplateUpload(file) {
        if (!file) return;

        const fileName = file.name.toLowerCase();
        const isAllowed =
            fileName.endsWith(".pdf") ||
            fileName.endsWith(".docx") ||
            fileName.endsWith(".doc") ||
            fileName.endsWith(".png") ||
            fileName.endsWith(".jpg") ||
            fileName.endsWith(".jpeg") ||
            file.type === "application/pdf" ||
            file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
            file.type === "application/msword" ||
            file.type === "image/png" ||
            file.type === "image/jpeg";

        if (!isAllowed) {
            setToast("Only PDF, DOCX, DOC, PNG and JPG files are allowed.");
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            setToast("Template size must be below 10 MB.");
            return;
        }

        const templateData = {
            file,
            name: file.name,
            uploadedAt: new Date().toISOString(),
        };

        setTemplates((current) => {
            const updated = {
                ...current,
                [selectedEvent.id]: templateData,
            };
            try {
                localStorage.setItem("axon_certificate_templates", JSON.stringify(updated));
            } catch {}
            return updated;
        });

        setToast("Template uploaded successfully.");
    }

    function downloadTemplate() {
        if (!template?.file) return;

        const url = URL.createObjectURL(template.file);

        const link = document.createElement("a");
        link.href = url;
        link.download = template.name;
        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
    }

    async function generateCertificates(partial = false) {
        if (!template) {
            setToast("Upload a certificate template first.");
            return;
        }

        const ids = eligibleStudents.map((student) => student.id || student._id);
        if (!ids.length) {
            setToast("No eligible participants found for this rule.");
            return;
        }

        const idsToGenerate =
            partial && ids.length > 1
                ? ids.slice(0, Math.ceil(ids.length / 2))
                : ids;

        try {
            const token = localStorage.getItem("axon_token");
            const res = await fetch(`${API_BASE_URL}/certificates/issue/${selectedEvent.id || selectedEvent._id}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    eligibilityRule: eligibility,
                    studentIds: idsToGenerate,
                }),
            });
            const data = await res.json();
            if (data.success) {
                window.dispatchEvent(new Event("axon-certificates-updated"));
            }
        } catch {}

        setGenerated((current) => {
            const updated = {
                ...current,
                [selectedEvent.id]: idsToGenerate,
            };
            try {
                localStorage.setItem("axon_generated_certificates", JSON.stringify(updated));
            } catch {}
            return updated;
        });

        setShowGenerate(false);
        setToast(
            idsToGenerate.length === ids.length
                ? `All ${ids.length} certificates generated successfully!`
                : `${idsToGenerate.length}/${ids.length} certificates generated.`
        );
    }

    async function generateRemaining() {
        if (!template) return;
        const allIds = eligibleStudents.map((student) => student.id || student._id);

        try {
            const token = localStorage.getItem("axon_token");
            const res = await fetch(`${API_BASE_URL}/certificates/issue/${selectedEvent.id || selectedEvent._id}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    eligibilityRule: eligibility,
                    studentIds: allIds,
                }),
            });
            const data = await res.json();
            if (data.success) {
                window.dispatchEvent(new Event("axon-certificates-updated"));
            }
        } catch {}

        setGenerated((current) => {
            const updated = {
                ...current,
                [selectedEvent.id]: allIds,
            };
            try {
                localStorage.setItem("axon_generated_certificates", JSON.stringify(updated));
            } catch {}
            return updated;
        });
        setToast(`Remaining certificates generated. All ${allIds.length} complete!`);
    }

    if (!selectedEvent) {
        return (
            <div className="p-6 text-sm text-gray-500">
                Loading certificates...
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-[#24154f]">
                    Certificates
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                    Manage certificate templates and generate event
                    certificates.
                </p>
            </div>

            {/* Event Search */}
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

            {/* Event Info */}
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

            {/* Event does not include certificates */}
            {!featureIncluded ? (
                <EmptyBox text="This event doesn't include certificates." />
            ) : (
                <div className="space-y-5">
                    {/* Template */}
                    {!template ? (
                        <ActionBox
                            icon={<Upload size={26} />}
                            title="Upload Certificate Template"
                            text="Upload the template (PDF, DOCX, DOC, PNG, JPG) that will be used for this event."
                            action={
                                <label className="cursor-pointer rounded-lg bg-[#24154f] px-4 py-2 text-sm font-medium text-white hover:bg-[#36216f]">
                                    Upload Template
                                    <input
                                        type="file"
                                        accept=".pdf,.docx,.doc,.png,.jpg,.jpeg"
                                        className="hidden"
                                        onChange={(e) =>
                                            handleTemplateUpload(
                                                e.target.files?.[0]
                                            )
                                        }
                                    />
                                </label>
                            }
                        />
                    ) : (
                        <ActionBox
                            icon={<FileText size={26} />}
                            title="Certificate Template"
                            text={template.name}
                            action={
                                <button
                                    type="button"
                                    onClick={() => setShowTemplate(true)}
                                    className="rounded-lg bg-[#24154f] px-4 py-2 text-sm font-medium text-white hover:bg-[#36216f]"
                                >
                                    View Template
                                </button>
                            }
                        />
                    )}

                    {/* Template actions */}
                    {template && (
                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setShowTemplate(true)}
                                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                <FileText size={16} />
                                View Uploaded Template
                            </button>

                            <button
                                type="button"
                                onClick={downloadTemplate}
                                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                <Download size={16} />
                                Download Template
                            </button>

                            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                                <Upload size={16} />
                                Replace Template
                                <input
                                    type="file"
                                    accept=".pdf,.docx,.doc,.png,.jpg,.jpeg"
                                    className="hidden"
                                    onChange={(e) =>
                                        handleTemplateUpload(
                                            e.target.files?.[0]
                                        )
                                    }
                                />
                            </label>
                        </div>
                    )}

                    {/* Generation Lifecycle */}
                    {status === "past" && template && (
                        <>
                            {/* 1. NOT GENERATED YET: Show Generate Option */}
                            {generatedCount === 0 && (
                                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <h3 className="font-semibold text-gray-800">
                                                Generate Certificates
                                            </h3>
                                            <p className="mt-1 text-sm text-gray-500">
                                                {totalCount} eligible participant(s) ready for certificate issuance.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setShowGenerate(true)}
                                            className="rounded-lg bg-[#24154f] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#36216f]"
                                        >
                                            Generate Certificates
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* 2. PARTIALLY GENERATED: Show Progress & Generate Remaining (Initial option is GONE) */}
                            {generatedCount > 0 && generatedCount < totalCount && (
                                <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 shadow-sm">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <h3 className="font-semibold text-gray-800">
                                                Certificate Generation in Progress
                                            </h3>
                                            <p className="mt-1 text-sm text-gray-600">
                                                <span className="font-semibold text-amber-700">{generatedCount}</span> of{" "}
                                                <span className="font-semibold text-gray-800">{totalCount}</span> generated ({totalCount - generatedCount} remaining)
                                            </p>
                                            <div className="mt-3 h-2 w-48 overflow-hidden rounded-full bg-amber-200">
                                                <div
                                                    className="h-full bg-amber-500 transition-all duration-300"
                                                    style={{ width: `${Math.round((generatedCount / totalCount) * 100)}%` }}
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={generateRemaining}
                                            className="rounded-lg bg-[#24154f] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#36216f]"
                                        >
                                            Generate Remaining ({totalCount - generatedCount})
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* 3. FULLY GENERATED: Success State (All Generate Options are GONE) */}
                            {generatedCount > 0 && generatedCount >= totalCount && (
                                <div className="rounded-2xl border border-green-200 bg-green-50/70 p-6 shadow-sm">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700">
                                                <Check size={22} />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-green-900">
                                                    All Certificates Generated
                                                </h3>
                                                <p className="mt-1 text-sm text-green-700">
                                                    All {totalCount} certificates have been generated successfully. No pending participants.
                                                </p>
                                            </div>
                                        </div>

                                        <span className="rounded-full bg-green-100 px-3.5 py-1 text-xs font-semibold text-green-800">
                                            Completed ({totalCount}/{totalCount})
                                        </span>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Status message for upcoming / ongoing */}
                    {(status === "upcoming" || status === "ongoing") && (
                        <p className="text-sm text-gray-500">
                            Certificate generation will be available after the event is completed.
                        </p>
                    )}
                </div>
            )}

            {/* Generate Modal */}
            {showGenerate && (
                <Modal onClose={() => setShowGenerate(false)}>
                    <div className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800">
                                    Generate Certificates
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    Select the eligibility condition for participants.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowGenerate(false)}
                                className="rounded-lg p-1.5 hover:bg-gray-100"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="mt-6 space-y-3">
                            <label className="flex cursor-pointer gap-3 rounded-xl border border-gray-200 p-4 hover:bg-gray-50">
                                <input
                                    type="radio"
                                    name="eligibility"
                                    value="attendance"
                                    checked={eligibility === "attendance"}
                                    onChange={(e) =>
                                        setEligibility(e.target.value)
                                    }
                                    className="mt-1"
                                />
                                <div>
                                    <p className="font-medium text-gray-800">
                                        Attendance
                                    </p>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Certificates will be generated for students who attended the event.
                                    </p>
                                </div>
                            </label>

                            <label className="flex cursor-pointer gap-3 rounded-xl border border-gray-200 p-4 hover:bg-gray-50">
                                <input
                                    type="radio"
                                    name="eligibility"
                                    value="attendance-feedback"
                                    checked={
                                        eligibility === "attendance-feedback"
                                    }
                                    onChange={(e) =>
                                        setEligibility(e.target.value)
                                    }
                                    className="mt-1"
                                />
                                <div>
                                    <p className="font-medium text-gray-800">
                                        Attendance + Feedback
                                    </p>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Student must have attended the event and submitted feedback.
                                    </p>
                                </div>
                            </label>
                        </div>

                        <div className="mt-5 rounded-lg bg-gray-50 p-4">
                            <p className="text-sm text-gray-600">
                                Eligible participants:{" "}
                                <span className="font-semibold text-gray-800">
                                    {
                                        getEligibleStudents(
                                            selectedEvent.id,
                                            eligibility
                                        ).length
                                    }
                                </span>
                            </p>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowGenerate(false)}
                                className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>

                            {getEligibleStudents(selectedEvent.id, eligibility).length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => generateCertificates(true)}
                                    className="rounded-lg border border-purple-200 bg-purple-50 px-4 py-2.5 text-sm font-medium text-purple-800 hover:bg-purple-100"
                                >
                                    Generate Half ({Math.ceil(getEligibleStudents(selectedEvent.id, eligibility).length / 2)})
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => generateCertificates(false)}
                                className="rounded-lg bg-[#24154f] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#36216f]"
                            >
                                Generate All ({getEligibleStudents(selectedEvent.id, eligibility).length})
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Template Preview */}
            {showTemplate && template && (
                <Modal onClose={() => setShowTemplate(false)}>
                    <div className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="font-semibold text-gray-800">
                                    Certificate Template
                                </h2>
                                <p className="text-xs text-gray-500">
                                    {template.name}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowTemplate(false)}
                                className="rounded-lg p-1.5 hover:bg-gray-100"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="mt-5 flex min-h-[350px] items-center justify-center rounded-xl bg-gray-50 p-4">
                            {template.file.name.toLowerCase().endsWith(".pdf") || template.file.type === "application/pdf" ? (
                                <iframe
                                    src={URL.createObjectURL(template.file)}
                                    title="Certificate Template"
                                    className="h-[60vh] w-full rounded-lg border bg-white"
                                />
                            ) : template.file.name.toLowerCase().endsWith(".docx") || template.file.name.toLowerCase().endsWith(".doc") ? (
                                <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                                        <FileText size={36} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">{template.name}</p>
                                        <p className="mt-1 text-xs text-gray-500">
                                            Microsoft Word Document · {(template.file.size / 1024).toFixed(1)} KB
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={downloadTemplate}
                                        className="mt-2 flex items-center gap-2 rounded-lg bg-[#24154f] px-4 py-2 text-xs font-medium text-white hover:bg-[#36216f]"
                                    >
                                        <Download size={14} />
                                        Download & View Document
                                    </button>
                                </div>
                            ) : (
                                <img
                                    src={URL.createObjectURL(template.file)}
                                    alt="Certificate template"
                                    className="max-h-[60vh] max-w-full rounded-lg object-contain"
                                />
                            )}
                        </div>

                        <div className="mt-4 flex justify-end">
                            <button
                                type="button"
                                onClick={downloadTemplate}
                                className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50"
                            >
                                <Download size={16} />
                                Download Template
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Toast */}
            {toast && (
                <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-[#24154f] px-4 py-3 text-sm font-medium text-white shadow-lg">
                    <Check size={16} />
                    {toast}
                </div>
            )}
        </div>
    );
}

function getEligibleStudents(eventId, rule) {
    let allRegistrations = registrations;
    try {
        const liveRegs = localStorage.getItem("axon_registrations");
        if (liveRegs) allRegistrations = [...JSON.parse(liveRegs), ...registrations];
    } catch {}

    let allAttendance = attendance;
    try {
        const liveAtt = localStorage.getItem("axon_attendance_records");
        if (liveAtt) allAttendance = [...JSON.parse(liveAtt), ...attendance];
    } catch {}

    let allFeedback = feedback;
    try {
        const liveFb = localStorage.getItem("axon_feedbacks");
        if (liveFb) allFeedback = [...JSON.parse(liveFb), ...feedback];
    } catch {}

    let allUsers = users;
    try {
        const liveUsers = localStorage.getItem("axon_users");
        if (liveUsers) allUsers = [...JSON.parse(liveUsers), ...users];
    } catch {}

    const registeredStudentIds = allRegistrations
        .filter(
            (registration) =>
                (registration.eventId === eventId || registration.event === eventId) &&
                (registration.status === "registered" || !registration.status)
        )
        .map((registration) => registration.studentId || registration.student || registration.enrollmentNo);

    const attendedStudentIds = allAttendance
        .filter(
            (record) =>
                (record.eventId === eventId || record.event === eventId) &&
                record.status === "present"
        )
        .map((record) => record.studentId || record.student || record.enrollmentNo);

    const feedbackStudentIds = allFeedback
        .filter((item) => item.eventId === eventId || item.event === eventId)
        .map((item) => item.studentId || item.student || item.enrollmentNo);

    let eligibleIds = attendedStudentIds.filter((id) =>
        registeredStudentIds.length === 0 || registeredStudentIds.includes(id)
    );

    if (rule === "attendance-feedback") {
        eligibleIds = eligibleIds.filter((id) =>
            feedbackStudentIds.includes(id)
        );
    }

    const matchedUsers = allUsers.filter(
        (user) =>
            (user.role === "student" || !user.role) &&
            (eligibleIds.includes(user.id) || eligibleIds.includes(user._id) || eligibleIds.includes(user.enrollmentNo))
    );

    return matchedUsers.length > 0
        ? matchedUsers
        : attendedStudentIds.map(id => ({ id, _id: id, fullName: `Student (${id})`, name: `Student (${id})` }));
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

function EmptyBox({ text }) {
    return (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
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
                className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl"
                onMouseDown={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
}

export default Certificates;