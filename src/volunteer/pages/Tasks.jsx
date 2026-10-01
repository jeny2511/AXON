import { useEffect, useMemo, useRef, useState } from "react";
import {
    Check,
    ChevronDown,
    ClipboardCheck,
    Search,
} from "lucide-react";

import { events, tasks as mockTasks } from "../../mockData";

function getEventStatus(event) {
    const now = new Date();

    const start = new Date(
        `${event.eventDate}T${event.startTime}`
    );

    const end = new Date(
        `${event.eventDate}T${event.endTime}`
    );

    if (now < start) return "upcoming";
    if (now <= end) return "ongoing";
    return "past";
}

function formatDate(dateStr) {
    if (!dateStr) return "";
    return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function Tasks() {
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [search, setSearch] = useState("");
    const [showEvents, setShowEvents] = useState(false);
    const searchRef = useRef(null);

    const [tasks, setTasks] = useState([]);
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

    const nearestEvent = useMemo(() => {
        return [...events].sort((a, b) => {
            const aTime = new Date(
                `${a.eventDate}T${a.startTime}`
            ).getTime();

            const bTime = new Date(
                `${b.eventDate}T${b.startTime}`
            ).getTime();

            return (
                Math.abs(aTime - Date.now()) -
                Math.abs(bTime - Date.now())
            );
        })[0];
    }, []);

    useEffect(() => {
        if (!selectedEvent && nearestEvent) {
            setSelectedEvent(nearestEvent);
            setSearch(nearestEvent.name);
        }
    }, [nearestEvent, selectedEvent]);

    useEffect(() => {
        if (selectedEvent) {
            const eventTasks = mockTasks.filter(
                (task) => task.eventId === selectedEvent.id
            );
            setTasks(eventTasks);
            setSaved(false);
        }
    }, [selectedEvent]);

    const filteredEvents = useMemo(() => {
        if (
            !search.trim() ||
            (selectedEvent && search.trim().toLowerCase() === selectedEvent.name.toLowerCase())
        ) {
            return events;
        }
        return events.filter((event) =>
            event.name.toLowerCase().includes(search.toLowerCase())
        );
    }, [search, selectedEvent]);

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