import { useEffect, useMemo, useRef, useState } from "react";
import {
    Check,
    ChevronDown,
    ClipboardCheck,
    Search,
} from "lucide-react";

import { events as initialMockEvents, tasks as mockTasks } from "../../mockData";
import { API_BASE_URL } from "../../services/api";

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

function formatDate(dateStr) {
    if (!dateStr) return "";
    const str = `${dateStr}`.includes("T") ? dateStr : `${dateStr}T00:00:00`;
    const d = new Date(str);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function Tasks() {
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

    const [tasks, setTasks] = useState([]);
    const [saved, setSaved] = useState(false);

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
        if (selectedEvent) {
            let loadedTasks = [];
            try {
                const stored = localStorage.getItem("axon_volunteer_tasks");
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (parsed[selectedEvent.id]) {
                        loadedTasks = parsed[selectedEvent.id];
                    }
                }
            } catch {}

            if (!loadedTasks || loadedTasks.length === 0) {
                loadedTasks = mockTasks.filter(
                    (task) => task.eventId === selectedEvent.id || task.eventId === selectedEvent._id
                );
                if (loadedTasks.length === 0) {
                    loadedTasks = [
                        { id: `TSK_${selectedEvent.id}_1`, eventId: selectedEvent.id, title: "Coordinate with Venue Manager", completed: false },
                        { id: `TSK_${selectedEvent.id}_2`, eventId: selectedEvent.id, title: "Set up Audio/Visual system", completed: false },
                        { id: `TSK_${selectedEvent.id}_3`, eventId: selectedEvent.id, title: "Verify participant registration passes", completed: false },
                        { id: `TSK_${selectedEvent.id}_4`, eventId: selectedEvent.id, title: "Distribute certificates and take feedback", completed: false },
                    ];
                }
            }
            setTasks(loadedTasks);
            setSaved(false);
        }
    }, [selectedEvent]);

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

    function toggleTask(taskId) {
        setTasks((current) =>
            current.map((task) =>
                task.id === taskId
                    ? { ...task, completed: !task.completed }
                    : task
            )
        );

        setSaved(false);
    }

    function saveChanges() {
        if (selectedEvent) {
            try {
                const stored = localStorage.getItem("axon_volunteer_tasks");
                const parsed = stored ? JSON.parse(stored) : {};
                parsed[selectedEvent.id] = tasks;
                localStorage.setItem("axon_volunteer_tasks", JSON.stringify(parsed));
            } catch {}
        }
        setSaved(true);
    }

    if (!selectedEvent) {
        return (
            <div className="p-6 text-sm text-gray-500">
                Loading tasks...
            </div>
        );
    }

    const status = getEventStatus(selectedEvent);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-[#24154f]">
                    Tasks
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                    Complete the tasks assigned for your events.
                </p>
            </div>

            {/* Event Search */}
            <div className="relative max-w-2xl" ref={searchRef}>
                <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                    <Search
                        size={18}
                        className="text-gray-400"
                    />

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
                        onClick={() =>
                            setShowEvents((value) => !value)
                        }
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
                                        setSaved(false);
                                    }}
                                    className="w-full rounded-lg px-3 py-3 text-left hover:bg-gray-50"
                                >
                                    <p className="font-medium text-gray-800">
                                        {event.name}
                                    </p>

                                    <p className="mt-1 text-xs capitalize text-gray-500">
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

            {/* Selected Event */}
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

            {/* No Tasks */}
            {!tasks.length ? (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
                    <ClipboardCheck
                        size={40}
                        className="mx-auto text-gray-300"
                    />

                    <h3 className="mt-4 font-semibold text-gray-700">
                        No tasks assigned
                    </h3>

                    <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
                        No tasks have been assigned to this event by Admin.
                    </p>
                </div>
            ) : (
                <>
                    {/* Task List */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-gray-800">
                                    Event Tasks
                                </h3>

                                <p className="mt-1 text-sm text-gray-500">
                                    Mark each task as completed when finished.
                                </p>
                            </div>

                            <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
                                {tasks.filter((t) => t.completed).length}/{tasks.length} Completed
                            </span>
                        </div>

                        <div className="space-y-3">
                            {tasks.map((task) => (
                                <label
                                    key={task.id}
                                    className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition ${task.completed
                                            ? "border-green-200 bg-green-50"
                                            : "border-gray-200 hover:bg-gray-50"
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={task.completed}
                                        onChange={() => toggleTask(task.id)}
                                        className="h-5 w-5 accent-[#24154f]"
                                    />

                                    <div className="flex-1">
                                        <p
                                            className={`text-sm font-medium ${task.completed
                                                    ? "text-green-700 line-through"
                                                    : "text-gray-800"
                                                }`}
                                        >
                                            {task.title}
                                        </p>

                                        {task.description && (
                                            <p className="mt-1 text-xs text-gray-500">
                                                {task.description}
                                            </p>
                                        )}
                                    </div>

                                    {task.completed && (
                                        <Check
                                            size={18}
                                            className="text-green-600"
                                        />
                                    )}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Save */}
                    <div className="flex items-center justify-end gap-3">
                        {saved && (
                            <span className="flex items-center gap-1 text-sm text-green-600">
                                <Check size={16} />
                                Changes saved
                            </span>
                        )}

                        <button
                            type="button"
                            onClick={saveChanges}
                            className="rounded-lg bg-[#24154f] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#36216f]"
                        >
                            Save Changes
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

export default Tasks;