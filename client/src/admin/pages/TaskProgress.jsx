import { useState, useEffect } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  ListTodo,
  Plus,
  UserRound,
  RefreshCw,
  AlertCircle,
  X,
} from "lucide-react";
import { eventService } from "../../services/eventService";
import { volunteerService } from "../../services/volunteerService";
import { adminService } from "../../services/adminService";

function TaskProgress() {
  const [eventsList, setEventsList] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showTaskForm, setShowTaskForm] = useState(false);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskEvent, setTaskEvent] = useState("");
  const [taskVolunteer, setTaskVolunteer] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState("Medium");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eventsRes, volRes, taskRes] = await Promise.all([
        eventService.getEvents(),
        adminService.getUsers({ role: "volunteer" }).catch(() => ({ data: [] })),
        volunteerService.getTasks().catch(() => ({ data: [] })),
      ]);

      setEventsList(eventsRes.data || []);
      setVolunteers(volRes.data || []);
      setTasks(taskRes.data || []);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch task progress data:", err);
      setError(err.message || "Failed to load events and tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getEventTasks = (eventId) => {
    return tasks.filter((task) => {
      const eId = task.eventId?._id || task.eventId || task.event;
      return eId === eventId || eId === String(eventId);
    });
  };

  const getEventProgress = (eventId) => {
    const eventTasks = getEventTasks(eventId);
    if (eventTasks.length === 0) return 0;
    const completedTasks = eventTasks.filter(
      (task) => task.status === "Completed" || task.status === "completed" || task.completed === true
    ).length;
    return Math.round((completedTasks / eventTasks.length) * 100);
  };

  const handleAssignTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskEvent || !taskVolunteer) {
      alert("Please enter a task title, select an event, and choose an assigned volunteer.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await volunteerService.createTask({
        title: taskTitle.trim(),
        eventId: taskEvent,
        assignedTo: taskVolunteer,
        description: taskDescription.trim() || undefined,
        priority: (taskPriority || "medium").toLowerCase(),
      });

      if (res.data) {
        setTasks((prev) => [res.data, ...prev]);
      } else {
        await fetchData();
      }

      setTaskTitle("");
      setTaskEvent("");
      setTaskVolunteer("");
      setTaskDescription("");
      setShowTaskForm(false);
    } catch (err) {
      alert(err.message || "Failed to assign task.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleTaskStatus = async (task) => {
    const taskId = task._id || task.id;
    const isDone = task.status === "Completed" || task.status === "completed" || task.completed === true;
    const newStatus = isDone ? "pending" : "completed";

    try {
      await volunteerService.updateTask(taskId, {
        status: newStatus,
        completed: !isDone,
      });

      setTasks((prev) =>
        prev.map((t) =>
          (t._id || t.id) === taskId
            ? { ...t, status: newStatus, completed: !isDone }
            : t
        )
      );
    } catch (err) {
      alert(err.message || "Failed to update task status.");
    }
  };

  const getVolunteerName = (task) => {
    if (task.assignedTo && typeof task.assignedTo === "object" && task.assignedTo.fullName) {
      return task.assignedTo.fullName;
    }
    const volId = task.assignedTo?._id || task.assignedTo || task.volunteerId;
    const volunteer = volunteers.find((u) => (u._id || u.id) === volId);
    return volunteer ? volunteer.fullName : "Assigned Volunteer";
  };

  return (
    <main className="dashboard task-progress-page">
      <div className="page-heading">
        <div>
          <h2>Task Progress</h2>
          <p>Track and monitor volunteer work for each event</p>
        </div>

        <button
          className="primary-button"
          onClick={() => {
            if (selectedEvent) {
              setTaskEvent(selectedEvent._id || selectedEvent.id);
            }
            setShowTaskForm(true);
          }}
        >
          <Plus size={16} />
          Add Task
        </button>
      </div>

      {error && (
        <div style={{ color: "#ef4444", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 0.5rem" }} />
          <p>Loading events and tasks...</p>
        </div>
      ) : !selectedEvent ? (
        <section className="task-event-list">
          <div className="task-section-title">
            <div>
              <h3>All Events</h3>
              <p>Select an event to view volunteer tasks</p>
            </div>
            <span>{eventsList.length} Events</span>
          </div>

          {eventsList.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
              <p>No events found. Create an event in Event Management first.</p>
            </div>
          ) : (
            eventsList.map((event) => {
              const eventId = event._id || event.id;
              const progress = getEventProgress(eventId);
              const eventTasks = getEventTasks(eventId);
              const completedTasks = eventTasks.filter(
                (task) =>
                  task.status === "Completed" ||
                  task.status === "completed" ||
                  task.completed === true
              ).length;

              return (
                <div
                  className="task-event-list-item"
                  key={eventId}
                  onClick={() => setSelectedEvent(event)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="task-event-info">
                    <div className="task-event-icon">
                      <ListTodo size={19} />
                    </div>
                    <div>
                      <span className="task-event-id">{event.category || "Event"}</span>
                      <h3>{event.name}</h3>
                      <p>
                        {event.venue} • {event.date ? new Date(event.date).toLocaleDateString() : event.eventDate || "Date TBD"}
                      </p>
                    </div>
                  </div>

                  <div className="task-event-progress">
                    <div className="task-progress-heading">
                      <span>Task Progress</span>
                      <strong>{progress}%</strong>
                    </div>
                    <div className="task-progress-track">
                      <div
                        className="task-progress-fill"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <span className="task-completed-text">
                      {completedTasks} of {eventTasks.length} tasks completed
                    </span>
                  </div>

                  <div className="task-event-action">
                    <span>{eventTasks.length} Tasks</span>
                    <strong>View Tasks →</strong>
                  </div>
                </div>
              );
            })
          )}
        </section>
      ) : (
        <section className="selected-event-section">
          <button
            className="back-task-button"
            onClick={() => setSelectedEvent(null)}
          >
            <ArrowLeft size={16} />
            Back to Events
          </button>

          <div className="selected-event-header">
            <div>
              <span className="task-event-id">{selectedEvent.category || "Event"}</span>
              <h3>{selectedEvent.name}</h3>
              <p>
                {selectedEvent.venue} •{" "}
                {selectedEvent.date
                  ? new Date(selectedEvent.date).toLocaleDateString()
                  : selectedEvent.eventDate || "Date TBD"}
              </p>
            </div>

            <div className="selected-event-progress">
              <span>Task Progress</span>
              <strong>{getEventProgress(selectedEvent._id || selectedEvent.id)}%</strong>
            </div>
          </div>

          <div className="volunteer-task-panel">
            <div className="task-panel-header">
              <div>
                <h3>Volunteer Tasks</h3>
                <p>Tasks assigned for this event</p>
              </div>
              <UserRound size={20} />
            </div>

            {getEventTasks(selectedEvent._id || selectedEvent.id).length === 0 ? (
              <div className="empty-task-state">
                <ListTodo size={30} />
                <h4>No tasks assigned yet</h4>
                <p>Use the Add Task button to assign work to a volunteer.</p>
              </div>
            ) : (
              <div className="volunteer-task-list">
                {getEventTasks(selectedEvent._id || selectedEvent.id).map((task) => {
                  const taskId = task._id || task.id;
                  const isDone =
                    task.status === "Completed" ||
                    task.status === "completed" ||
                    task.completed === true;

                  return (
                    <div className="volunteer-task-row" key={taskId}>
                      <div className="volunteer-task-person">
                        <div className="task-avatar">
                          {getVolunteerName(task).charAt(0)}
                        </div>
                        <div>
                          <h4>{getVolunteerName(task)}</h4>
                          <p>{task.title || task.taskName}</p>
                        </div>
                      </div>

                      <div
                        className="volunteer-task-status"
                        style={{ cursor: "pointer" }}
                        onClick={() => handleToggleTaskStatus(task)}
                        title="Click to toggle completion"
                      >
                        {isDone ? (
                          <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "#22c55e" }}>
                            <CheckCircle2 size={16} /> Completed
                          </span>
                        ) : (
                          <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "#eab308" }}>
                            <Clock3 size={16} /> Pending
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {showTaskForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(2px)" }}>
          <div style={{ background: "#ffffff", padding: "2rem", borderRadius: "0.75rem", width: "90%", maxWidth: "500px", border: "1px solid #e2e8f0", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.25rem", color: "#0f172a" }}>Assign New Volunteer Task</h3>
              <button
                type="button"
                onClick={() => setShowTaskForm(false)}
                style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAssignTask}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", color: "#334155", fontWeight: 500 }}>Task Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Manage registration desk"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  required
                  style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "0.375rem", border: "1px solid #d1d5db", background: "#ffffff", color: "#0f172a" }}
                />
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", color: "#334155", fontWeight: 500 }}>Target Event *</label>
                <select
                  value={taskEvent}
                  onChange={(e) => setTaskEvent(e.target.value)}
                  required
                  style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "0.375rem", border: "1px solid #d1d5db", background: "#ffffff", color: "#0f172a" }}
                >
                  <option value="">Select Event</option>
                  {eventsList.map((ev) => (
                    <option key={ev._id || ev.id} value={ev._id || ev.id}>
                      {ev.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", color: "#334155", fontWeight: 500 }}>Assign To Volunteer *</label>
                <select
                  value={taskVolunteer}
                  onChange={(e) => setTaskVolunteer(e.target.value)}
                  required
                  style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "0.375rem", border: "1px solid #d1d5db", background: "#ffffff", color: "#0f172a" }}
                >
                  <option value="">Select Volunteer</option>
                  {volunteers.map((vol) => (
                    <option key={vol._id || vol.id} value={vol._id || vol.id}>
                      {vol.fullName} ({vol.department})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", color: "#334155", fontWeight: 500 }}>Priority</label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value)}
                  style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "0.375rem", border: "1px solid #d1d5db", background: "#ffffff", color: "#0f172a" }}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", color: "#334155", fontWeight: 500 }}>Description</label>
                <textarea
                  rows={3}
                  placeholder="Additional task details..."
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "0.375rem", border: "1px solid #d1d5db", background: "#ffffff", color: "#0f172a" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => setShowTaskForm(false)}
                  style={{ padding: "0.6rem 1rem", borderRadius: "0.375rem", border: "1px solid #d1d5db", background: "#f8fafc", color: "#334155", cursor: "pointer", fontWeight: 500 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="primary-button"
                >
                  {submitting ? "Assigning..." : "Assign Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default TaskProgress;