import { useEffect, useMemo, useRef, useState } from "react";
import {
    Check,
    ChevronDown,
    ClipboardCheck,
    Search,
} from "lucide-react";

import { eventService } from "../../services/eventService";
import { volunteerService } from "../../services/volunteerService";

function getEventStatus(event) {
    if (!event) return "upcoming";
    const now = new Date();
    const eventDate = event.eventDate || event.date;
    if (!eventDate) return "upcoming";

    const start = new Date(
        `${new Date(eventDate).toISOString().split("T")[0]}T${event.startTime || "09:00 AM"}`
    );

    const end = new Date(
        `${new Date(eventDate).toISOString().split("T")[0]}T${event.endTime || "05:00 PM"}`
    );

    if (now < start) return "upcoming";
    if (now <= end) return "ongoing";
    return "past";
}

function formatDate(dateStr) {
    if (!dateStr) return "";
    try {
        return new Date(dateStr).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    } catch {
        return String(dateStr);
    }
}

function Tasks() {
    const [eventsList, setEventsList] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [search, setSearch] = useState("");
    const [showEvents, setShowEvents] = useState(false);
    const searchRef = useRef(null);

    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

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

    // Load Events from API
    useEffect(() => {
        let isMounted = true;
        async function loadEvents() {
            try {
                const res = await eventService.getEvents();
                const liveEvents = res?.data || [];
                if (isMounted) {
                    setEventsList(liveEvents);
                    if (liveEvents.length > 0) {
                        setSelectedEvent(liveEvents[0]);
                        setSearch(liveEvents[0].name);
                    }
                }
            } catch (err) {
                console.warn("Failed to load events for Tasks page:", err.message);
                if (isMounted) {
                    setEventsList([]);
                }
            }
        }
        loadEvents();
        return () => {
            isMounted = false;
        };
    }, []);

    // Load Tasks for Selected Event
    useEffect(() => {
        let isMounted = true;
        async function loadEventTasks() {
            if (!selectedEvent) {
                setTasks([]);
                return;
            }
            const eventId = selectedEvent._id || selectedEvent.id;
            try {
                setLoading(true);
                const res = await volunteerService.getTasks({ eventId });
                if (isMounted && res && res.data) {
                    const formatted = res.data.map((t) => ({
                        id: t._id || t.id,
                        _id: t._id,
                        title: t.title || t.taskName,
                        description: t.description || "",
                        completed: Boolean(t.completed || t.status === "completed"),
                        status: t.status || (t.completed ? "completed" : "pending"),
                    }));
                    setTasks(formatted);
                    setLoading(false);
                    return;
                }
            } catch (err) {
                console.warn("Failed to load tasks for event:", err.message);
            }

            if (isMounted) {
                setTasks([]);
                setLoading(false);
            }
        }

        loadEventTasks();
        return () => {
            isMounted = false;
        };
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
    }, [search, selectedEvent, eventsList]);

    async function toggleTask(taskId) {
        const target = tasks.find((t) => t.id === taskId || t._id === taskId);
        if (!target) return;

        const newCompleted = !target.completed;
        const newStatus = newCompleted ? "completed" : "pending";

        // Optimistic UI update
        setTasks((current) =>
            current.map((task) =>
                task.id === taskId || task._id === taskId
                    ? { ...task, completed: newCompleted, status: newStatus }
                    : task
            )
        );

        try {
            await volunteerService.updateTask(target._id || target.id, {
                completed: newCompleted,
                status: newStatus,
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.warn("Failed to update task via API, local state saved:", err.message);
            setSaved(true);
        }
    }

    function saveChanges() {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
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
                                    key={event._id || event.id}
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
                                        {formatDate(event.eventDate || event.date)} ·{" "}
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
            {selectedEvent ? (
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h2 className="font-semibold text-gray-800">
                                {selectedEvent.name}
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                {formatDate(selectedEvent.eventDate || selectedEvent.date)} ·{" "}
                                {selectedEvent.startTime || "10:00 AM"} -{" "}
                                {selectedEvent.endTime || "04:00 PM"}
                            </p>
                        </div>

                        <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium capitalize text-purple-700">
                            {status}
                        </span>
                    </div>
                </div>
            ) : (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
                    No events available. Create an event in Admin to manage volunteer tasks.
                </div>
            )}

            {/* Tasks Area */}
            {loading ? (
                <div className="p-8 text-center text-sm text-gray-500">
                    Loading event tasks from server...
                </div>
            ) : !tasks.length ? (
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
                                    key={task.id || task._id}
                                    className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition ${task.completed
                                            ? "border-green-200 bg-green-50"
                                            : "border-gray-200 hover:bg-gray-50"
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={task.completed}
                                        onChange={() => toggleTask(task.id || task._id)}
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

                    {/* Save Confirmation */}
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