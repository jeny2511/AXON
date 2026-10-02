import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ClipboardCheck,
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
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

function formatTime(timeStr) {
  if (!timeStr) return "";
  return timeStr;
}

function TaskProgress() {
  // 1. Events State
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

  // Selected Event: null = Table View, object = Task Progress Detail View
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventSearch, setEventSearch] = useState("");

  // 2. Tasks State for Selected Event
  const [tasks, setTasks] = useState([]);
  const [notification, setNotification] = useState(null);

  // 3. Add Task Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [addError, setAddError] = useState("");

  // 4. Edit Task Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTaskTitle, setEditTaskTitle] = useState("");
  const [editError, setEditError] = useState("");

  // Load events from backend
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
            startTime: ev.startTime || "10:00 AM",
            endTime: ev.endTime || "01:00 PM",
            venue: ev.venue || "Campus Venue",
            status: ev.status || "upcoming",
          }));
          setEventsList(normalized);
        }
      } catch {}
    };
    fetchEvents();

    const handleEventsChange = () => {
      try {
        const savedEvents = localStorage.getItem("axon_live_events");
        if (savedEvents) setEventsList(JSON.parse(savedEvents));
      } catch {}
    };
    window.addEventListener("axon-events-change", handleEventsChange);
    return () => window.removeEventListener("axon-events-change", handleEventsChange);
  }, []);

  // Helper to load tasks for any event (from storage or mock defaults)
  const loadEventTasks = (eventId) => {
    if (!eventId) return [];
    let loadedTasks = [];
    try {
      const stored = localStorage.getItem("axon_volunteer_tasks");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed[eventId]) {
          loadedTasks = parsed[eventId];
        }
      }
    } catch {}

    if (!loadedTasks || loadedTasks.length === 0) {
      loadedTasks = mockTasks
        .filter((task) => task.eventId === eventId)
        .map((t) => ({
          id: t.id,
          eventId: eventId,
          title: t.taskName || t.title || "Event Task",
          completed: t.status === "Completed" || t.completed || false,
        }));

      if (loadedTasks.length === 0) {
        loadedTasks = [
          {
            id: `TSK_${eventId}_1`,
            eventId: eventId,
            title: "Coordinate with Venue Manager",
            completed: false,
          },
          {
            id: `TSK_${eventId}_2`,
            eventId: eventId,
            title: "Set up Audio/Visual system",
            completed: false,
          },
          {
            id: `TSK_${eventId}_3`,
            eventId: eventId,
            title: "Verify participant registration passes",
            completed: false,
          },
          {
            id: `TSK_${eventId}_4`,
            eventId: eventId,
            title: "Distribute certificates and take feedback",
            completed: false,
          },
        ];
      }
    }
    return loadedTasks;
  };

  // Helper to get stats for any event in the table view
  const getEventTaskStats = (event) => {
    const eventId = event.id || event._id;
    const eventTasks = loadEventTasks(eventId);
    const total = eventTasks.length;
    const completed = eventTasks.filter((t) => t.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage };
  };

  // Load Tasks whenever selectedEvent changes
  useEffect(() => {
    if (selectedEvent) {
      const loaded = loadEventTasks(selectedEvent.id || selectedEvent._id);
      setTasks(loaded);
    }
  }, [selectedEvent]);

  // Filter events for Table View
  const filteredEvents = useMemo(() => {
    if (!eventSearch.trim()) return eventsList;
    const q = eventSearch.toLowerCase();
    return eventsList.filter(
      (event) =>
        (event.name && event.name.toLowerCase().includes(q)) ||
        (event.category && event.category.toLowerCase().includes(q)) ||
        (event.venue && event.venue.toLowerCase().includes(q))
    );
  }, [eventsList, eventSearch]);

  // Calculations for selected event
  const completedCount = useMemo(() => {
    return tasks.filter((t) => t.completed).length;
  }, [tasks]);

  const totalTasksCount = tasks.length;
  const progressPercent = totalTasksCount
    ? Math.round((completedCount / totalTasksCount) * 100)
    : 0;

  // Delete Task
  function deleteTask(taskId) {
    const updated = tasks.filter((task) => task.id !== taskId);
    setTasks(updated);

    if (selectedEvent) {
      try {
        const stored = localStorage.getItem("axon_volunteer_tasks");
        const parsed = stored ? JSON.parse(stored) : {};
        parsed[selectedEvent.id || selectedEvent._id] = updated;
        localStorage.setItem("axon_volunteer_tasks", JSON.stringify(parsed));
      } catch {}
    }

    setNotification("Task deleted successfully.");
    setTimeout(() => setNotification(null), 3000);
  }

  // Open Edit Task Modal
  function openEditModal(task) {
    setEditingTaskId(task.id);
    setEditTaskTitle(task.title);
    setEditError("");
    setShowEditModal(true);
  }

  // Handle Edit Task Submit
  function handleEditTaskSubmit(e) {
    e.preventDefault();
    setEditError("");

    if (!editTaskTitle.trim()) {
      setEditError("Please enter a task title.");
      return;
    }

    const updated = tasks.map((task) =>
      task.id === editingTaskId
        ? { ...task, title: editTaskTitle.trim() }
        : task
    );
    setTasks(updated);

    if (selectedEvent) {
      try {
        const stored = localStorage.getItem("axon_volunteer_tasks");
        const parsed = stored ? JSON.parse(stored) : {};
        parsed[selectedEvent.id || selectedEvent._id] = updated;
        localStorage.setItem("axon_volunteer_tasks", JSON.stringify(parsed));
      } catch {}
    }

    setShowEditModal(false);
    setEditingTaskId(null);
    setEditTaskTitle("");
    setNotification("Task updated successfully!");
    setTimeout(() => setNotification(null), 3000);
  }

  // Handle Add New Task Submit
  function handleAddNewTask(e) {
    e.preventDefault();
    setAddError("");

    if (!newTaskTitle.trim()) {
      setAddError("Please enter a task title.");
      return;
    }

    if (!selectedEvent) {
      setAddError("Please select an event first.");
      return;
    }

    const newTask = {
      id: `TSK_${selectedEvent.id || selectedEvent._id}_${Date.now()}`,
      eventId: selectedEvent.id || selectedEvent._id,
      title: newTaskTitle.trim(),
      completed: false,
    };

    const updated = [...tasks, newTask];
    setTasks(updated);

    // Save to storage
    try {
      const stored = localStorage.getItem("axon_volunteer_tasks");
      const parsed = stored ? JSON.parse(stored) : {};
      parsed[selectedEvent.id || selectedEvent._id] = updated;
      localStorage.setItem("axon_volunteer_tasks", JSON.stringify(parsed));
    } catch {}

    setNewTaskTitle("");
    setShowAddModal(false);
    setNotification(`Task "${newTask.title}" added successfully!`);
    setTimeout(() => setNotification(null), 3000);
  }

  const selectedEventStatus = selectedEvent ? getEventStatus(selectedEvent) : null;

  return (
    <div className="space-y-6">
      {/* ==================================================== */}
      {/* 1. NOTIFICATION BANNER                               */}
      {/* ==================================================== */}
      {notification && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold animate-in fade-in duration-200">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* ==================================================== */}
      {/* VIEW A: ALL EVENTS LIST (Horizontal Table View)       */}
      {/* ==================================================== */}
      {!selectedEvent ? (
        <>
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-[#24154f] tracking-tight">
                  Task Progress
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-[#7040d0] border border-purple-200">
                  {eventsList.length} Events
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Select an event to view, manage, and track task progress
              </p>
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-72">
              <Search
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="text"
                value={eventSearch}
                onChange={(e) => setEventSearch(e.target.value)}
                placeholder="Search events by title, venue..."
                className="w-full h-10 pl-9 pr-8 text-xs bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#7040d0] focus:ring-2 focus:ring-[#7040d0]/15 transition-all shadow-xs"
              />
              {eventSearch && (
                <button
                  type="button"
                  onClick={() => setEventSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Events Horizontal Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Event Name</th>
                    <th className="py-3.5 px-6">Date</th>
                    <th className="py-3.5 px-6">Time</th>
                    <th className="py-3.5 px-6">Venue</th>
                    <th className="py-3.5 px-6">Task Progress</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 text-xs">
                  {filteredEvents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <AlertCircle size={28} className="text-gray-300" />
                          <p className="font-semibold text-sm text-gray-700">
                            No events found
                          </p>
                          <p className="text-xs text-gray-400">
                            {eventSearch
                              ? `No events match "${eventSearch}". Try another search keyword.`
                              : "There are currently no events to display."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredEvents.map((event) => {
                      const eventKey = event.id || event._id;
                      const stats = getEventTaskStats(event);
                      const status = getEventStatus(event);

                      return (
                        <tr
                          key={eventKey}
                          className="hover:bg-purple-50/30 transition-colors"
                        >
                          {/* 1. Event Name */}
                          <td className="py-4 px-6">
                            <div className="font-bold text-gray-900 text-sm">
                              {event.name}
                            </div>
                            <div className="text-[11px] text-gray-500 mt-0.5">
                              {event.category || "Campus Event"}
                            </div>
                          </td>

                          {/* 2. Date */}
                          <td className="py-4 px-6 text-gray-700 font-medium text-xs whitespace-nowrap">
                            {formatDate(event.eventDate || event.date)}
                          </td>

                          {/* 3. Time */}
                          <td className="py-4 px-6 text-gray-700 font-medium text-xs whitespace-nowrap">
                            {formatTime(event.startTime)}
                            {event.endTime ? ` - ${formatTime(event.endTime)}` : ""}
                          </td>

                          {/* 4. Venue */}
                          <td className="py-4 px-6 text-gray-700 font-medium text-xs">
                            {event.venue || "Campus Venue"}
                          </td>

                          {/* 5. Task Progress */}
                          <td className="py-4 px-6">
                            <div className="space-y-1 min-w-[130px]">
                              <div className="flex items-center justify-between text-xs font-semibold">
                                <span className="text-[#7040d0]">
                                  {stats.completed}/{stats.total} Tasks
                                </span>
                                <span className="text-[11px] text-gray-500">
                                  {stats.percentage}%
                                </span>
                              </div>
                              <div className="w-full bg-purple-100/80 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-[#7040d0] h-full rounded-full transition-all duration-300"
                                  style={{ width: `${stats.percentage}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* 6. Status Badge */}
                          <td className="py-4 px-6 whitespace-nowrap">
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${
                                status === "ongoing"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : status === "past"
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {status}
                            </span>
                          </td>

                          {/* 7. Action */}
                          <td className="py-4 px-6 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setSelectedEvent(event)}
                              className="px-3.5 py-1.5 rounded-lg bg-[#7040d0] hover:bg-[#5b32af] text-white text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
                            >
                              View Task Progress
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 border-t border-gray-100 bg-gray-50/50 text-xs text-gray-500 flex items-center justify-between">
              <span>
                Showing <strong>{filteredEvents.length}</strong> of{" "}
                <strong>{eventsList.length}</strong> events
              </span>
            </div>
          </div>
        </>
      ) : (
        /* ==================================================== */
        /* VIEW B: SELECTED EVENT TASK PROGRESS DETAIL VIEW     */
        /* ==================================================== */
        <div className="space-y-6">
          {/* Top Bar: Back Button & Add Task Button */}
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setSelectedEvent(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-2xs cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back to Events</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAddError("");
                setShowAddModal(true);
              }}
              className="inline-flex items-center justify-center gap-1.5 px-4 h-9 rounded-xl bg-[#7040d0] hover:bg-[#5b32af] text-white text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              <Plus size={15} />
              <span>Add Task</span>
            </button>
          </div>

          {/* Selected Event Banner Card */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold text-gray-800 text-base">
                  {selectedEvent.name}
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  {formatDate(selectedEvent.eventDate || selectedEvent.date)} ·{" "}
                  {selectedEvent.startTime || "10:00 AM"} -{" "}
                  {selectedEvent.endTime || "01:00 PM"} ·{" "}
                  {selectedEvent.venue || "Campus Venue"}
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                  selectedEventStatus === "ongoing"
                    ? "bg-emerald-100 text-emerald-700"
                    : selectedEventStatus === "past"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {selectedEventStatus}
              </span>
            </div>
          </div>

          {/* Task Progress Bar Section */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">
                Task Progress
              </span>
              <span className="text-base font-bold text-[#7040d0]">
                {progressPercent}%
              </span>
            </div>

            {/* Progress Track */}
            <div className="h-2 w-full rounded-full bg-purple-100/80 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#7040d0] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Task Counter */}
            <p className="text-xs text-gray-400">
              {completedCount} of {totalTasksCount} tasks completed
            </p>
          </div>

          {/* Event Tasks List */}
          {!tasks.length ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
              <ClipboardCheck size={40} className="mx-auto text-gray-300" />
              <h3 className="mt-4 font-semibold text-gray-700 text-sm">
                No tasks assigned
              </h3>
              <p className="mx-auto mt-1 max-w-md text-xs text-gray-500">
                No tasks have been created for this event yet. Click "Add Task" to create one.
              </p>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#7040d0] text-white text-xs font-semibold hover:bg-[#5b32af] transition shadow-xs cursor-pointer"
              >
                <Plus size={14} />
                <span>Add Task</span>
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm">
                    Event Tasks
                  </h3>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Tasks assigned for volunteers to mark upon completion.
                  </p>
                </div>

                <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 border border-purple-100">
                  {completedCount}/{totalTasksCount} Completed
                </span>
              </div>

              {/* Task rows */}
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-center justify-between gap-3.5 rounded-xl border p-4 transition ${
                      task.completed
                        ? "border-emerald-200/70 bg-emerald-50/30"
                        : "border-gray-200 hover:bg-gray-50/80 bg-white"
                    }`}
                  >
                    {/* Title */}
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="text-xs sm:text-sm font-semibold text-gray-800 truncate">
                        {task.title}
                      </p>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                      {/* Status Badge */}
                      {task.completed ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 text-[11px] font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                          Pending
                        </span>
                      )}

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => openEditModal(task)}
                        title="Edit task"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#7040d0] hover:bg-purple-50 transition cursor-pointer"
                      >
                        <Pencil size={15} />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => deleteTask(task.id)}
                        title="Delete task"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* 5. ADD TASK MODAL POPUP                              */}
      {/* ==================================================== */}
      {showAddModal && selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/60">
              <div>
                <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                  Add New Task
                </h3>
                <p className="text-[11px] text-gray-500">
                  Create a task for {selectedEvent.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition cursor-pointer"
              >
                <X size={17} />
              </button>
            </div>

            {/* Error */}
            {addError && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0 text-rose-600" />
                <span>{addError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleAddNewTask} className="p-6 space-y-4 text-xs">
              {/* Event Name Readonly */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Event
                </label>
                <input
                  type="text"
                  disabled
                  value={selectedEvent.name}
                  className="w-full h-9 px-3 bg-gray-100 border border-gray-200 rounded-xl text-xs text-gray-600 font-medium"
                />
              </div>

              {/* Task Title */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Task Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Set up registration counter"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full h-9 px-3 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:border-[#7040d0] focus:ring-2 focus:ring-[#7040d0]/15 outline-none transition"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 transition shadow-2xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#7040d0] hover:bg-[#5b32af] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 6. EDIT TASK MODAL POPUP                             */}
      {/* ==================================================== */}
      {showEditModal && selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/60">
              <div>
                <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                  Edit Task
                </h3>
                <p className="text-[11px] text-gray-500">
                  Update task for {selectedEvent.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition cursor-pointer"
              >
                <X size={17} />
              </button>
            </div>

            {/* Error */}
            {editError && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0 text-rose-600" />
                <span>{editError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleEditTaskSubmit} className="p-6 space-y-4 text-xs">
              {/* Event Name Readonly */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Event
                </label>
                <input
                  type="text"
                  disabled
                  value={selectedEvent.name}
                  className="w-full h-9 px-3 bg-gray-100 border border-gray-200 rounded-xl text-xs text-gray-600 font-medium"
                />
              </div>

              {/* Task Title */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Task Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Set up registration counter"
                  value={editTaskTitle}
                  onChange={(e) => setEditTaskTitle(e.target.value)}
                  className="w-full h-9 px-3 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:border-[#7040d0] focus:ring-2 focus:ring-[#7040d0]/15 outline-none transition"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 transition shadow-2xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#7040d0] hover:bg-[#5b32af] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TaskProgress;