import { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  ListTodo,
  Plus,
  UserRound,
} from "lucide-react";

import { events, users, tasks as initialTasks } from "../../mockData";

function TaskProgress() {
  const volunteers = users.filter(
    (user) => user.role === "volunteer"
  );

  // Only upcoming events
  const upcomingEvents = events.filter(
    (event) => event.status === "upcoming"
  );

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showTaskForm, setShowTaskForm] = useState(false);

  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem("axon_tasks");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return initialTasks || [];
  });

  const [taskName, setTaskName] = useState("");
  const [taskEvent, setTaskEvent] = useState("");
  const [taskVolunteer, setTaskVolunteer] = useState("");

  // Get tasks of one event
  const getEventTasks = (eventId) => {
    return tasks.filter(
      (task) => task.eventId === eventId
    );
  };

  // Calculate event progress
  const getEventProgress = (eventId) => {
    const eventTasks = getEventTasks(eventId);

    if (eventTasks.length === 0) {
      return 0;
    }

    const completedTasks = eventTasks.filter(
      (task) => task.status === "Completed"
    ).length;

    return Math.round(
      (completedTasks / eventTasks.length) * 100
    );
  };

  // Assign new task
  const handleAssignTask = (e) => {
    e.preventDefault();

    if (!taskName || !taskEvent || !taskVolunteer) {
      return;
    }

    const newTask = {
      id: `TASK${tasks.length + 1}`,
      eventId: taskEvent,
      volunteerId: taskVolunteer,
      taskName: taskName,
      status: "Pending",
    };

    setTasks((previousTasks) => [
      ...previousTasks,
      newTask,
    ]);

    setTaskName("");
    setTaskEvent("");
    setTaskVolunteer("");
    setShowTaskForm(false);
  };

  // Get volunteer name
  const getVolunteerName = (volunteerId) => {
    const volunteer = volunteers.find(
      (user) => user.id === volunteerId
    );

    return volunteer
      ? volunteer.fullName
      : "Unknown Volunteer";
  };

  return (
    <main className="dashboard task-progress-page">

      {/* ========================================
          PAGE HEADER
      ======================================== */}

      <div className="page-heading">

        <div>
          <h2>Task Progress</h2>

          <p>
            Track and monitor volunteer work for each event
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => setShowTaskForm(true)}
        >
          <Plus size={16} />
          Add Task
        </button>

      </div>


      {/* ========================================
          UPCOMING EVENT LIST
      ======================================== */}

      {!selectedEvent && (

        <section className="task-event-list">

          <div className="task-section-title">
            <div>
              <h3>Upcoming Events</h3>

              <p>
                Select an event to view volunteer tasks
              </p>
            </div>

            <span>
              {upcomingEvents.length} Events
            </span>
          </div>


          {upcomingEvents.map((event) => {

            const progress = getEventProgress(event.id);

            const eventTasks =
              getEventTasks(event.id);

            const completedTasks =
              eventTasks.filter(
                (task) =>
                  task.status === "Completed"
              ).length;

            return (

              <div
                className="task-event-list-item"
                key={event.id}
                onClick={() =>
                  setSelectedEvent(event)
                }
              >

                {/* EVENT INFORMATION */}

                <div className="task-event-info">

                  <div className="task-event-icon">
                    <ListTodo size={19} />
                  </div>

                  <div>

                    <span className="task-event-id">
                      {event.id}
                    </span>

                    <h3>
                      {event.name}
                    </h3>

                    <p>
                      {event.category} •{" "}
                      {event.eventDate}
                    </p>

                  </div>

                </div>


                {/* PROGRESS */}

                <div className="task-event-progress">

                  <div className="task-progress-heading">

                    <span>
                      Task Progress
                    </span>

                    <strong>
                      {progress}%
                    </strong>

                  </div>

                  <div className="task-progress-track">

                    <div
                      className="task-progress-fill"
                      style={{
                        width: `${progress}%`,
                      }}
                    ></div>

                  </div>

                  <span className="task-completed-text">
                    {completedTasks} of{" "}
                    {eventTasks.length} tasks
                    completed
                  </span>

                </div>


                {/* RIGHT SIDE */}

                <div className="task-event-action">

                  <span>
                    {eventTasks.length} Tasks
                  </span>

                  <strong>
                    View Tasks →
                  </strong>

                </div>

              </div>

            );
          })}

        </section>

      )}


      {/* ========================================
          SELECTED EVENT
      ======================================== */}

      {selectedEvent && (

        <section className="selected-event-section">

          <button
            className="back-task-button"
            onClick={() =>
              setSelectedEvent(null)
            }
          >
            <ArrowLeft size={16} />
            Back to Events
          </button>


          {/* EVENT HEADER */}

          <div className="selected-event-header">

            <div>

              <span className="task-event-id">
                {selectedEvent.id}
              </span>

              <h3>
                {selectedEvent.name}
              </h3>

              <p>
                {selectedEvent.category} •{" "}
                {selectedEvent.eventDate}
              </p>

            </div>


            <div className="selected-event-progress">

              <span>
                Task Progress
              </span>

              <strong>
                {getEventProgress(
                  selectedEvent.id
                )}
                %
              </strong>

            </div>

          </div>


          {/* VOLUNTEER TASK PANEL */}

          <div className="volunteer-task-panel">

            <div className="task-panel-header">

              <div>

                <h3>
                  Volunteer Tasks
                </h3>

                <p>
                  Tasks assigned for this event
                </p>

              </div>

              <UserRound size={20} />

            </div>


            {/* NO TASKS */}

            {getEventTasks(
              selectedEvent.id
            ).length === 0 ? (

              <div className="empty-task-state">

                <ListTodo size={30} />

                <h4>
                  No tasks assigned yet
                </h4>

                <p>
                  Use the Add Task button to
                  assign work to a volunteer.
                </p>

              </div>

            ) : (

              /* TASK LIST */

              <div className="volunteer-task-list">

                {getEventTasks(
                  selectedEvent.id
                ).map((task) => (

                  <div
                    className="volunteer-task-row"
                    key={task.id}
                  >

                    {/* VOLUNTEER */}

                    <div className="volunteer-task-person">

                      <div className="task-avatar">

                        {getVolunteerName(
                          task.volunteerId
                        ).charAt(0)}

                      </div>

                      <div>

                        <h4>
                          {getVolunteerName(
                            task.volunteerId
                          )}
                        </h4>

                        <span>
                          {task.volunteerId}
                        </span>

                      </div>

                    </div>


                    {/* TASK */}

                    <div className="assigned-task-name">

                      <span>
                        Task
                      </span>

                      <strong>
                        {task.taskName}
                      </strong>

                    </div>


                    {/* STATUS */}

                    <div className="task-status-section">

                      <span>
                        Status
                      </span>

                      <span
                        className={`task-status ${
                          task.status
                            .toLowerCase()
                            .replace(" ", "-")
                        }`}
                      >

                        {task.status ===
                          "Completed" && (
                          <CheckCircle2
                            size={14}
                          />
                        )}

                        {task.status ===
                          "In Progress" && (
                          <Clock3
                            size={14}
                          />
                        )}

                        {task.status ===
                          "Pending" && (
                          <Clock3
                            size={14}
                          />
                        )}

                        {task.status}

                      </span>

                    </div>

                  </div>

                ))}

              </div>

            )}

          </div>

        </section>

      )}


      {/* ========================================
          ADD TASK MODAL
      ======================================== */}

      {showTaskForm && (

        <div
          className="task-modal-overlay"
          onClick={() =>
            setShowTaskForm(false)
          }
        >

          <div
            className="task-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="task-modal-header">

              <div>

                <h3>
                  Assign New Task
                </h3>

                <p>
                  Give a task to a volunteer
                </p>

              </div>

              <button
                className="task-modal-close"
                onClick={() =>
                  setShowTaskForm(false)
                }
              >
                ×
              </button>

            </div>


            <form
              onSubmit={handleAssignTask}
            >

              {/* EVENT */}

              <div className="task-form-group">

                <label>
                  Event
                </label>

                <select
                  value={taskEvent}
                  onChange={(e) =>
                    setTaskEvent(
                      e.target.value
                    )
                  }
                >

                  <option value="">
                    Select Upcoming Event
                  </option>

                  {upcomingEvents.map(
                    (event) => (

                      <option
                        value={event.id}
                        key={event.id}
                      >
                        {event.name}
                      </option>

                    )
                  )}

                </select>

              </div>


              {/* TASK NAME */}

              <div className="task-form-group">

                <label>
                  Task Name
                </label>

                <input
                  type="text"
                  placeholder="Enter task name"
                  value={taskName}
                  onChange={(e) =>
                    setTaskName(
                      e.target.value
                    )
                  }
                />

              </div>


              {/* VOLUNTEER */}

              <div className="task-form-group">

                <label>
                  Volunteer
                </label>

                <select
                  value={taskVolunteer}
                  onChange={(e) =>
                    setTaskVolunteer(
                      e.target.value
                    )
                  }
                >

                  <option value="">
                    Select Volunteer
                  </option>

                  {volunteers.map(
                    (volunteer) => (

                      <option
                        value={volunteer.id}
                        key={volunteer.id}
                      >
                        {volunteer.fullName}
                      </option>

                    )
                  )}

                </select>

              </div>


              {/* FORM BUTTONS */}

              <div className="task-form-actions">

                <button
                  type="button"
                  className="secondary-task-button"
                  onClick={() =>
                    setShowTaskForm(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                >
                  Assign Task
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