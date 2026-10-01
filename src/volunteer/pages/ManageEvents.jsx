import { useState, useMemo } from "react";
import {
  Search,
  Plus,
  Pencil,
  Eye,
  Trash2,
  X,
  Calendar,
  Clock,
  MapPin,
  User,
  Users,
  FileText,
  AlertCircle,
  Upload,
  Image,
} from "lucide-react";
import { events as mockEvents } from "../../mockData";

// ============================================================================
// SERVICE LAYER (MVC ARCHITECTURE: FRONTEND SERVICE / API SIMULATOR)
// In a full-stack MERN application, these functions will make real HTTP requests:
// - getAll:   GET    /api/events
// - create:   POST   /api/events
// - update:   PUT    /api/events/:id
// - delete:   DELETE /api/events/:id
// Currently, it interacts with our shared mockData as our mock API.
// ============================================================================
const eventService = {
  // Fetch all events from API/mockData
  getAllEvents: () => {
    return [...mockEvents];
  },

  // Create a new event (supports 'upcoming' or 'draft' status)
  createEvent: (newEventData, existingList, targetStatus = "upcoming") => {
    const generatedId = `EV${String(existingList.length + 1).padStart(3, "0")}`;
    return {
      ...newEventData,
      id: generatedId,
      status: targetStatus,
      registrationStatus: targetStatus === "draft" ? "closed" : "open",
      registeredCount: 0,
      certificateAvailable: false,
      feedbackRequired: true,
    };
  },

  // Update an existing event by ID
  updateEvent: (eventId, updatedData, existingList) => {
    return existingList.map((ev) =>
      ev.id === eventId
        ? {
            ...ev,
            ...updatedData,
            participantLimit: Number(updatedData.participantLimit) || 100,
          }
        : ev
    );
  },

  // Remove an event by ID
  deleteEvent: (eventId, existingList) => {
    return existingList.filter((ev) => ev.id !== eventId);
  },
};

// ============================================================================
// HELPER FUNCTIONS (Date, Time, and Tab resolution)
// ============================================================================

// Determines which tab ('upcoming' | 'ongoing' | 'past' | 'drafts') an event belongs to
function getEventTab(event) {
  if (event.status === "draft") return "drafts";
  if (event.status === "ongoing") return "ongoing";
  if (event.status === "completed" || event.status === "past") return "past";
  return "upcoming";
}

// Formats a date string (YYYY-MM-DD) into Indian standard display (e.g. "23 Oct 2027")
function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  const dateObj = new Date(`${dateStr}T00:00:00`);
  if (isNaN(dateObj)) return dateStr;
  return dateObj.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Formats 24-hour time string ("14:00") into 12-hour format with AM/PM ("02:00 PM")
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

// Predefined configuration lists for dropdowns and checkboxes
const EVENT_CATEGORIES = [
  "Workshop",
  "Competition",
  "Seminar",
  "Hackathon",
  "Session",
  "Webinar",
];
const COMBINATION_YEARS = [
  { year: 1, label: "1st Year" },
  { year: 2, label: "2nd Year" },
  { year: 3, label: "3rd Year" },
  { year: 4, label: "4th Year" },
];
const COMBINATION_DEPTS = ["IT", "CS", "CE", "ICT", "EC"];

// ============================================================================
// MAIN COMPONENT: ManageEvents
// ============================================================================
function ManageEvents() {
  // ----------------------------------------------------
  // STATE MANAGEMENT
  // ----------------------------------------------------

  // Master events state loaded through our service layer (acting as API)
  const [eventList, setEventList] = useState(() => eventService.getAllEvents());

  // Active navigation tab: 'upcoming' | 'ongoing' | 'past' | 'drafts'
  const [activeTab, setActiveTab] = useState("upcoming");

  // Search input state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Modal display toggles
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Current selected event references for operations
  const [editingEvent, setEditingEvent] = useState(null);
  const [viewingEvent, setViewingEvent] = useState(null);
  const [deletingEventId, setDeletingEventId] = useState(null);

  // Default clean form structure matching the complete event schema
  const defaultFormData = {
    name: "",
    speakerName: "",
    eventDate: "",
    startTime: "",
    endTime: "",
    venue: "",
    category: "Workshop", // Type of event field
    description: "",
    registrationOpen: "",
    registrationClose: "",
    attendanceOpen: "",
    attendanceClose: "",
    participantLimit: 100,
    poster: "", // Uploaded poster filename / preview URL
    rulebook: "", // Uploaded rulebook PDF filename
    // Individual Year + Department combinations (e.g. "1st Year IT", "2nd Year CS")
    eligibleCombinations: [
      "1st Year IT",
      "2nd Year CS",
      "2nd Year IT",
      "3rd Year EC",
    ],
  };

  const [formData, setFormData] = useState(defaultFormData);
  const [formError, setFormError] = useState("");

  // ----------------------------------------------------
  // COMPUTED DATA (useMemo for Performance & Efficiency)
  // ----------------------------------------------------

  // Count of events inside each respective tab for badges
  const tabCounts = useMemo(() => {
    const counts = { upcoming: 0, ongoing: 0, past: 0, drafts: 0 };
    eventList.forEach((ev) => {
      const tab = getEventTab(ev);
      if (counts[tab] !== undefined) counts[tab]++;
    });
    return counts;
  }, [eventList]);

  // Global search matches across ALL tabs for the interactive dropdown
  const searchMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return eventList.filter((ev) => {
      const name = (ev.name || "").toLowerCase();
      const speaker = (ev.speakerName || "").toLowerCase();
      const venue = (ev.venue || "").toLowerCase();
      const category = (ev.category || "").toLowerCase();
      return (
        name.includes(q) ||
        speaker.includes(q) ||
        venue.includes(q) ||
        category.includes(q)
      );
    });
  }, [eventList, searchQuery]);

  // Events filtered for the currently active tab + any search filter applied
  const displayedEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return eventList.filter((ev) => {
      const matchesTab = getEventTab(ev) === activeTab;
      if (!matchesTab) return false;
      if (!q) return true;
      const name = (ev.name || "").toLowerCase();
      const speaker = (ev.speakerName || "").toLowerCase();
      const venue = (ev.venue || "").toLowerCase();
      const category = (ev.category || "").toLowerCase();
      return (
        name.includes(q) ||
        speaker.includes(q) ||
        venue.includes(q) ||
        category.includes(q)
      );
    });
  }, [eventList, activeTab, searchQuery]);

  // ----------------------------------------------------
  // EVENT HANDLERS
  // ----------------------------------------------------

  // Handles clicking a search result in the live dropdown:
  // Automatically switches to that event's tab and highlights it
  const handleSelectSearchResult = (event) => {
    const targetTab = getEventTab(event);
    setActiveTab(targetTab);
    setSearchQuery(event.name);
    setIsSearchFocused(false);
  };

  // Opens modal for creating a new event
  const handleOpenCreateModal = () => {
    setEditingEvent(null);
    setFormData(defaultFormData);
    setFormError("");
    setIsFormModalOpen(true);
  };

  // Opens modal pre-populated with existing event details for editing
  const handleOpenEditModal = (event) => {
    setEditingEvent(event);

    // Prepare eligible combinations from saved event or synthesize from eligibleYears/eligibleDepartments
    let initialCombos = event.eligibleCombinations;
    if (!initialCombos || initialCombos.length === 0) {
      if (event.eligibleYears && event.eligibleDepartments) {
        initialCombos = event.eligibleYears.flatMap((yr) => {
          const yrLabel =
            yr === 1
              ? "1st Year"
              : yr === 2
              ? "2nd Year"
              : yr === 3
              ? "3rd Year"
              : "4th Year";
          return event.eligibleDepartments
            .filter((d) => d !== "ALL")
            .map((d) => `${yrLabel} ${d}`);
        });
      } else {
        initialCombos = [];
      }
    }

    setFormData({
      name: event.name || "",
      speakerName: event.speakerName || "",
      eventDate: event.eventDate || "",
      startTime: event.startTime || "",
      endTime: event.endTime || "",
      venue: event.venue || "",
      category: event.category || "Workshop",
      description: event.description || "",
      registrationOpen: event.registrationOpen || "",
      registrationClose: event.registrationClose || "",
      attendanceOpen: event.attendanceOpen || "",
      attendanceClose: event.attendanceClose || "",
      participantLimit: event.participantLimit || 100,
      poster: event.poster || "",
      rulebook: event.rulebook || "",
      eligibleCombinations: initialCombos,
    });
    setFormError("");
    setIsFormModalOpen(true);
  };

  // Handles file upload for event poster (images only)
  const handlePosterUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Stores filename or temporary object URL for preview
      setFormData((prev) => ({
        ...prev,
        poster: file.name,
      }));
    }
  };

  // Handles file upload for rulebook (PDF documents only)
  const handleRulebookUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        rulebook: file.name,
      }));
    }
  };

  // Toggle individual Year + Branch combination (e.g. "1st Year IT", "2nd Year CE")
  const handleCombinationToggle = (combo) => {
    setFormData((prev) => {
      const current = prev.eligibleCombinations || [];
      if (current.includes(combo)) {
        return {
          ...prev,
          eligibleCombinations: current.filter((c) => c !== combo),
        };
      } else {
        return {
          ...prev,
          eligibleCombinations: [...current, combo],
        };
      }
    });
  };

  // Toggle all branches for an entire academic year
  const handleToggleWholeYear = (yearLabel) => {
    setFormData((prev) => {
      const current = prev.eligibleCombinations || [];
      const yearCombos = COMBINATION_DEPTS.map((dept) => `${yearLabel} ${dept}`);
      const allSelected = yearCombos.every((c) => current.includes(c));
      if (allSelected) {
        return {
          ...prev,
          eligibleCombinations: current.filter((c) => !yearCombos.includes(c)),
        };
      } else {
        const toAdd = yearCombos.filter((c) => !current.includes(c));
        return {
          ...prev,
          eligibleCombinations: [...current, ...toAdd],
        };
      }
    });
  };

  // Select all Year + Branch combinations
  const handleSelectAllCombinations = () => {
    const allCombos = [];
    COMBINATION_YEARS.forEach(({ label }) => {
      COMBINATION_DEPTS.forEach((dept) => {
        allCombos.push(`${label} ${dept}`);
      });
    });
    setFormData((prev) => ({
      ...prev,
      eligibleCombinations: allCombos,
    }));
  };

  // Clear all combinations
  const handleClearAllCombinations = () => {
    setFormData((prev) => ({
      ...prev,
      eligibleCombinations: [],
    }));
  };

  // Saves event changes:
  // - targetStatus = "draft": saves as draft (goes to Drafts tab)
  // - targetStatus = "upcoming": creates or moves draft to Upcoming tab
  // - targetStatus = null: regular edit (preserves existing status)
  const handleSaveEvent = (e, targetStatus = null) => {
    if (e) e.preventDefault();
    if (!formData.name.trim()) {
      setFormError("Event name is required.");
      return;
    }
    if (!formData.eventDate) {
      setFormError("Event date is required.");
      return;
    }

    // Extract unique years and departments for backwards compatibility
    const combos = formData.eligibleCombinations || [];
    const derivedYears = [
      ...new Set(
        combos.map((c) => {
          if (c.startsWith("1st")) return 1;
          if (c.startsWith("2nd")) return 2;
          if (c.startsWith("3rd")) return 3;
          if (c.startsWith("4th")) return 4;
          return 1;
        })
      ),
    ];
    const derivedDepts = [
      ...new Set(combos.map((c) => c.split(" ").slice(-1)[0])),
    ];

    const eventPayload = {
      ...formData,
      eligibleYears: derivedYears,
      eligibleDepartments: derivedDepts,
    };

    if (editingEvent) {
      // If moving draft to upcoming, set status to 'upcoming';
      // Otherwise preserve existing status (e.g. keeping it in draft or upcoming)
      const finalStatus = targetStatus ? targetStatus : editingEvent.status;
      const updatedList = eventService.updateEvent(
        editingEvent.id,
        {
          ...eventPayload,
          status: finalStatus,
          registrationStatus: finalStatus === "draft" ? "closed" : "open",
        },
        eventList
      );
      setEventList(updatedList);

      // If moved to upcoming, automatically switch active tab to "upcoming"
      if (targetStatus === "upcoming") {
        setActiveTab("upcoming");
      }
    } else {
      // Creating new event: either as "draft" or as "upcoming"
      const finalStatus = targetStatus === "draft" ? "draft" : "upcoming";
      const newEvent = eventService.createEvent(
        {
          ...eventPayload,
          participantLimit: Number(formData.participantLimit) || 100,
        },
        eventList,
        finalStatus
      );
      setEventList([newEvent, ...eventList]);

      // Automatically switch active tab to where the event was placed
      setActiveTab(finalStatus === "draft" ? "drafts" : "upcoming");
    }

    setIsFormModalOpen(false);
  };

  // Opens delete confirmation modal
  const handleOpenDelete = (eventId) => {
    setDeletingEventId(eventId);
    setIsDeleteModalOpen(true);
  };

  // Confirms deletion and deletes via Service Layer
  const handleConfirmDelete = () => {
    if (deletingEventId) {
      // DELETE /api/events/:id -> Remove event in service layer
      const remainingEvents = eventService.deleteEvent(
        deletingEventId,
        eventList
      );
      setEventList(remainingEvents);
      setIsDeleteModalOpen(false);
      setDeletingEventId(null);
    }
  };

  // Opens event detail modal for read-only view
  const handleOpenView = (event) => {
    setViewingEvent(event);
    setIsViewModalOpen(true);
  };

  // ----------------------------------------------------
  // RENDER (JSX)
  // ----------------------------------------------------
  return (
    <div className="space-y-6">
      {/* ==================================================== */}
      {/* 1. TOP HEADER: Page Title + Search Box + Create Button*/}
      {/* ==================================================== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left Side: Page Title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Manage Events
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Create, update, and monitor student events and schedules
          </p>
        </div>

        {/* Right Side: Search Box + "+ Create Event" Button */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
          {/* Interactive Search Input with Tab Auto-Redirect Dropdown */}
          <div className="relative w-full sm:w-72">
            <div className="relative flex items-center">
              <Search
                size={17}
                className="absolute left-3 text-gray-400 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                placeholder="Search events..."
                className="w-full h-10 pl-9 pr-8 text-xs bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#7040d0] focus:ring-2 focus:ring-[#7040d0]/15 transition-all shadow-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 p-1 text-gray-400 hover:text-gray-600 rounded-full"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Dropdown Results: Clicking an event redirects to its respective tab */}
            {isSearchFocused && searchQuery && searchMatches.length > 0 && (
              <div
                className="absolute left-0 right-0 top-12 z-20 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden max-h-64 overflow-y-auto"
                onMouseDown={(e) => e.preventDefault()}
              >
                <div className="p-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                  Click event to open in tab
                </div>
                {searchMatches.map((ev) => {
                  const evTab = getEventTab(ev);
                  return (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => handleSelectSearchResult(ev)}
                      className="w-full text-left px-3 py-2.5 hover:bg-purple-50/70 border-b border-gray-50 flex items-center justify-between gap-2 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate">
                          {ev.name}
                        </p>
                        <p className="text-[11px] text-gray-400 flex items-center gap-1.5 mt-0.5">
                          <span>{formatDate(ev.eventDate)}</span>
                          <span>•</span>
                          <span>{ev.venue || "Venue N/A"}</span>
                        </p>
                      </div>
                      <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize bg-purple-100 text-[#7040d0]">
                        {evTab}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* "+ Create Event" Button */}
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="shrink-0 inline-flex items-center justify-center gap-2 h-10 px-4 bg-[#7040d0] hover:bg-[#5b32af] text-white rounded-lg text-xs font-semibold shadow-sm transition-colors active:scale-95"
          >
            <Plus size={16} strokeWidth={2.2} />
            <span>Create Event</span>
          </button>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 2. OPERATIONAL TABS: Upcoming | Ongoing | Past | Drafts */}
      {/* ==================================================== */}
      <div className="flex border-b border-gray-200 gap-6 overflow-x-auto text-xs font-medium">
        {[
          { key: "upcoming", label: "Upcoming" },
          { key: "ongoing", label: "Ongoing" },
          { key: "past", label: "Past" },
          { key: "drafts", label: "Drafts" },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          const count = tabCounts[tab.key] || 0;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 font-semibold whitespace-nowrap border-b-2 flex items-center gap-2 transition-all ${
                isActive
                  ? "border-[#7040d0] text-[#7040d0]"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  isActive
                    ? "bg-[#7040d0]/10 text-[#7040d0]"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ==================================================== */}
      {/* 3. EVENT DATA TABLE (Mobile Responsive with scroll)   */}
      {/* ==================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-gray-50/75 border-b border-gray-200 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                {/* Column 1: Event Name & Category */}
                <th className="py-3.5 px-5">Event Name</th>
                {/* Column 2: Scheduled Date */}
                <th className="py-3.5 px-5">Date</th>
                {/* Column 3: Event Timings */}
                <th className="py-3.5 px-5">Time</th>
                {/* Column 4: Registered count / Participant capacity */}
                <th className="py-3.5 px-5">Registrations</th>
                {/* Column 5: Edit, View, and Delete action buttons */}
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {/* Empty state when no events exist in this tab or match search */}
              {displayedEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle size={28} className="text-gray-300" />
                      <p className="font-medium text-sm text-gray-600">
                        No {activeTab} events found
                      </p>
                      <p className="text-xs text-gray-400">
                        {searchQuery
                          ? `No events match "${searchQuery}" in this tab.`
                          : `There are currently no events listed under ${activeTab}.`}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayedEvents.map((event) => (
                  <tr
                    key={event.id}
                    className="hover:bg-gray-50/60 transition-colors"
                  >
                    {/* Column 1: Event Name & Category/Venue */}
                    <td className="py-4 px-5">
                      <div className="font-semibold text-gray-900 text-sm">
                        {event.name}
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-2">
                        {event.category && (
                          <span className="text-purple-700 font-medium bg-purple-50 px-2 py-0.5 rounded">
                            {event.category}
                          </span>
                        )}
                        {event.venue && <span>• {event.venue}</span>}
                      </div>
                    </td>

                    {/* Column 2: Date */}
                    <td className="py-4 px-5 text-gray-800 font-medium">
                      {formatDate(event.eventDate)}
                    </td>

                    {/* Column 3: Time */}
                    <td className="py-4 px-5 text-gray-600 font-medium">
                      {formatTime(event.startTime)}
                      {event.endTime && ` - ${formatTime(event.endTime)}`}
                    </td>

                    {/* Column 4: Registrations (Current / Limit) */}
                    <td className="py-4 px-5 text-gray-700">
                      <span className="font-semibold text-gray-800">
                        {event.registeredCount || 0}
                      </span>
                      <span className="text-gray-400">
                        /{event.participantLimit || 100}
                      </span>
                    </td>

                    {/* Column 5: Action Icons (Pencil, Eye, Trash) */}
                    <td className="py-4 px-5 text-right">
                      <div className="inline-flex items-center gap-2 text-gray-500">
                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(event)}
                          title="Edit Event"
                          className="p-1.5 rounded-md hover:bg-purple-50 hover:text-[#7040d0] transition-colors"
                        >
                          <Pencil size={16} />
                        </button>

                        {/* View Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenView(event)}
                          title="View Full Details"
                          className="p-1.5 rounded-md hover:bg-purple-50 hover:text-[#7040d0] transition-colors"
                        >
                          <Eye size={16} />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenDelete(event.id)}
                          title="Delete Event"
                          className="p-1.5 rounded-md hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary Counter */}
        <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-500 flex items-center justify-between">
          <span>
            Showing {displayedEvents.length} of {displayedEvents.length} events
          </span>
          <span className="text-gray-400 font-medium">AXON Event Manager</span>
        </div>
      </div>

      {/* ==================================================== */}
      {/* MODAL 1: CREATE & EDIT EVENT POPUP FORM               */}
      {/* ==================================================== */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-200 max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/50">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editingEvent ? "Edit Event" : "Create New Event"}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Fill in all event operations and registration rules
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form Body */}
            <form
              onSubmit={handleSaveEvent}
              className="overflow-y-auto p-6 space-y-5 text-xs"
            >
              {/* Error Alert Display */}
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{formError}</span>
                </div>
              )}

              {/* 1. Name & Speaker of Event */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1.5">
                    Name of event <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g. Capture The Flag 2027"
                    className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg focus:border-[#7040d0] focus:ring-2 focus:ring-[#7040d0]/15 outline-none transition-all text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1.5">
                    Speaker of event
                  </label>
                  <input
                    type="text"
                    value={formData.speakerName}
                    onChange={(e) =>
                      setFormData({ ...formData, speakerName: e.target.value })
                    }
                    placeholder="e.g. Rahul Sharma"
                    className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg focus:border-[#7040d0] focus:ring-2 focus:ring-[#7040d0]/15 outline-none transition-all text-xs"
                  />
                </div>
              </div>

              {/* 2. Date & Time of Event */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1.5">
                    Date of event <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.eventDate}
                    onChange={(e) =>
                      setFormData({ ...formData, eventDate: e.target.value })
                    }
                    className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg focus:border-[#7040d0] focus:ring-2 focus:ring-[#7040d0]/15 outline-none transition-all text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1.5">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                    className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg focus:border-[#7040d0] focus:ring-2 focus:ring-[#7040d0]/15 outline-none transition-all text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1.5">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData({ ...formData, endTime: e.target.value })
                    }
                    className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg focus:border-[#7040d0] focus:ring-2 focus:ring-[#7040d0]/15 outline-none transition-all text-xs"
                  />
                </div>
              </div>

              {/* 3. Venue of Event & Type of Event (Placed right after Venue) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1.5">
                    Venue of event
                  </label>
                  <input
                    type="text"
                    value={formData.venue}
                    onChange={(e) =>
                      setFormData({ ...formData, venue: e.target.value })
                    }
                    placeholder="e.g. VGEC Seminar Hall"
                    className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg focus:border-[#7040d0] focus:ring-2 focus:ring-[#7040d0]/15 outline-none transition-all text-xs"
                  />
                </div>

                {/* Field: Type of event (Category) */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1.5">
                    Type of event
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg focus:border-[#7040d0] focus:ring-2 focus:ring-[#7040d0]/15 outline-none transition-all text-xs"
                  >
                    {EVENT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 4. Description of Event */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1.5">
                  Description of event
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Provide detailed description of the event..."
                  className="w-full p-3 bg-white border border-gray-200 rounded-lg focus:border-[#7040d0] focus:ring-2 focus:ring-[#7040d0]/15 outline-none transition-all text-xs"
                />
              </div>

              {/* 5. Registration Window & Attendance Window (Neutral Bordered Boxes) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Registration Window Box */}
                <div className="p-3.5 bg-white rounded-xl border border-gray-200 space-y-2.5 shadow-sm">
                  <p className="font-semibold text-gray-800 text-xs">
                    Registration Window
                  </p>
                  <div>
                    <label className="block text-gray-600 mb-1">Opens at</label>
                    <input
                      type="datetime-local"
                      value={formData.registrationOpen}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          registrationOpen: e.target.value,
                        })
                      }
                      className="w-full h-9 px-2 bg-white border border-gray-200 rounded-md focus:border-[#7040d0] focus:ring-1 focus:ring-[#7040d0]/20 outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 mb-1">Closes at</label>
                    <input
                      type="datetime-local"
                      value={formData.registrationClose}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          registrationClose: e.target.value,
                        })
                      }
                      className="w-full h-9 px-2 bg-white border border-gray-200 rounded-md focus:border-[#7040d0] focus:ring-1 focus:ring-[#7040d0]/20 outline-none text-xs"
                    />
                  </div>
                </div>

                {/* Attendance Window Box */}
                <div className="p-3.5 bg-white rounded-xl border border-gray-200 space-y-2.5 shadow-sm">
                  <p className="font-semibold text-gray-800 text-xs">
                    Attendance Window
                  </p>
                  <div>
                    <label className="block text-gray-600 mb-1">Opens at</label>
                    <input
                      type="datetime-local"
                      value={formData.attendanceOpen}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          attendanceOpen: e.target.value,
                        })
                      }
                      className="w-full h-9 px-2 bg-white border border-gray-200 rounded-md focus:border-[#7040d0] focus:ring-1 focus:ring-[#7040d0]/20 outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 mb-1">Closes at</label>
                    <input
                      type="datetime-local"
                      value={formData.attendanceClose}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          attendanceClose: e.target.value,
                        })
                      }
                      className="w-full h-9 px-2 bg-white border border-gray-200 rounded-md focus:border-[#7040d0] focus:ring-1 focus:ring-[#7040d0]/20 outline-none text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 6. Participants Limit Field */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1.5">
                  Participants limit field
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.participantLimit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      participantLimit: e.target.value,
                    })
                  }
                  className="w-full sm:w-48 h-10 px-3 bg-white border border-gray-200 rounded-lg focus:border-[#7040d0] focus:ring-2 focus:ring-[#7040d0]/15 outline-none text-xs"
                />
              </div>

              {/* 7. Upload Poster & Upload Rulebook (Placed directly below Participants limit) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50/80 rounded-xl border border-gray-200">
                {/* Upload Poster: File Input */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1.5">
                    Upload poster (Image file)
                  </label>
                  <label className="flex items-center gap-2 px-3 py-2 bg-white border border-dashed border-gray-300 hover:border-[#7040d0] rounded-lg cursor-pointer transition-colors text-xs text-gray-600">
                    <Image size={16} className="text-[#7040d0] shrink-0" />
                    <span className="truncate flex-1">
                      {formData.poster || "Choose image file (PNG, JPG)..."}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePosterUpload}
                      className="hidden"
                    />
                  </label>
                  {formData.poster && (
                    <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-medium">
                      ✓ Selected: {formData.poster}
                    </p>
                  )}
                </div>

                {/* Upload Rulebook: File Input */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1.5">
                    Upload rulebook (PDF file)
                  </label>
                  <label className="flex items-center gap-2 px-3 py-2 bg-white border border-dashed border-gray-300 hover:border-[#7040d0] rounded-lg cursor-pointer transition-colors text-xs text-gray-600">
                    <FileText size={16} className="text-[#7040d0] shrink-0" />
                    <span className="truncate flex-1">
                      {formData.rulebook || "Choose PDF document..."}
                    </span>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handleRulebookUpload}
                      className="hidden"
                    />
                  </label>
                  {formData.rulebook && (
                    <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-medium">
                      ✓ Selected: {formData.rulebook}
                    </p>
                  )}
                </div>
              </div>

              {/* 8. Condition for Registration (Individual Year + Department Combinations) */}
              <div className="p-4 bg-gray-50/90 rounded-xl border border-gray-200 space-y-3">
                {/* Header with Quick Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-800 text-xs">
                      Conditions for Registration (Year & Department Combinations)
                    </p>
                    <p className="text-[11px] text-gray-500">
                      Select specific combinations allowed to register (e.g., 1st Year IT, 2nd Year CS).
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleSelectAllCombinations}
                      className="px-2.5 py-1 text-[11px] font-semibold text-[#7040d0] bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-md transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAllCombinations}
                      className="px-2.5 py-1 text-[11px] font-semibold text-gray-600 bg-white hover:bg-gray-100 border border-gray-200 rounded-md transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Grid by Academic Year */}
                <div className="space-y-2.5 pt-1">
                  {COMBINATION_YEARS.map(({ year, label }) => {
                    const yearCombos = COMBINATION_DEPTS.map(
                      (dept) => `${label} ${dept}`
                    );
                    const isAllYearSelected = yearCombos.every((combo) =>
                      formData.eligibleCombinations.includes(combo)
                    );

                    return (
                      <div
                        key={year}
                        className="p-2.5 bg-white rounded-lg border border-gray-200/80 flex flex-col sm:flex-row sm:items-center gap-2.5"
                      >
                        {/* Year title & Toggle whole year shortcut */}
                        <div className="flex items-center justify-between sm:justify-start gap-2 min-w-[130px] shrink-0">
                          <span className="font-bold text-xs text-gray-800">
                            {label}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleWholeYear(label)}
                            className={`text-[10px] px-1.5 py-0.5 rounded font-semibold transition-colors ${
                              isAllYearSelected
                                ? "bg-purple-100 text-[#7040d0]"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                            title={`Toggle all branches for ${label}`}
                          >
                            {isAllYearSelected ? "Deselect Year" : "+ Whole Year"}
                          </button>
                        </div>

                        {/* Department Badges for this Year */}
                        <div className="flex flex-wrap items-center gap-1.5 flex-1">
                          {COMBINATION_DEPTS.map((dept) => {
                            const comboKey = `${label} ${dept}`;
                            const isSelected =
                              formData.eligibleCombinations.includes(comboKey);
                            return (
                              <button
                                key={comboKey}
                                type="button"
                                onClick={() => handleCombinationToggle(comboKey)}
                                className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-all flex items-center gap-1 ${
                                  isSelected
                                    ? "bg-[#7040d0] text-white border-[#7040d0] shadow-xs"
                                    : "bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50/30"
                                }`}
                              >
                                {isSelected && <span>✓</span>}
                                <span>{label} {dept}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Selected Combinations Chips Display */}
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold text-gray-700">
                      Selected Combinations ({formData.eligibleCombinations.length}):
                    </span>
                    {formData.eligibleCombinations.length === 0 && (
                      <span className="text-[11px] text-amber-600 font-medium">
                        ⚠️ Please select at least one combination
                      </span>
                    )}
                  </div>
                  {formData.eligibleCombinations.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-white rounded-lg border border-gray-100">
                      {formData.eligibleCombinations.map((combo) => (
                        <span
                          key={combo}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-[#7040d0] border border-purple-200 rounded-md text-[11px] font-semibold"
                        >
                          <span>{combo}</span>
                          <button
                            type="button"
                            onClick={() => handleCombinationToggle(combo)}
                            className="hover:text-red-500 font-bold ml-0.5"
                            title={`Remove ${combo}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-400 italic">
                      No combinations selected yet. Click above badges to select combinations like "1st Year IT", "2nd Year CS".
                    </p>
                  )}
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-4 border-t border-gray-200 flex flex-wrap items-center justify-end gap-2.5">
                {/* Cancel Button */}
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 hover:bg-gray-100 rounded-lg text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>

                {/* Case 1: Creating a New Event */}
                {!editingEvent && (
                  <>
                    {/* Save as Draft Button (sends event to Drafts tab) */}
                    <button
                      type="button"
                      onClick={(e) => handleSaveEvent(e, "draft")}
                      className="px-4 py-2 border border-[#7040d0] text-[#7040d0] hover:bg-purple-50 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Save as Draft
                    </button>

                    {/* Create Event Button (sends event to Upcoming tab) */}
                    <button
                      type="submit"
                      onClick={(e) => handleSaveEvent(e, "upcoming")}
                      className="px-5 py-2 bg-[#7040d0] hover:bg-[#5b32af] text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                    >
                      Create Event
                    </button>
                  </>
                )}

                {/* Case 2: Editing an Existing Event */}
                {editingEvent && (
                  <>
                    {/* Save Changes Button (preserves current status; doesn't transfer draft to upcoming) */}
                    <button
                      type="submit"
                      onClick={(e) => handleSaveEvent(e, null)}
                      className="px-4 py-2 border border-gray-300 text-gray-800 hover:bg-gray-100 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Save Changes
                    </button>

                    {/* Move to Upcoming Button (visible only when editing a Draft event) */}
                    {editingEvent.status === "draft" && (
                      <button
                        type="button"
                        onClick={(e) => handleSaveEvent(e, "upcoming")}
                        className="px-5 py-2 bg-[#7040d0] hover:bg-[#5b32af] text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                      >
                        <span>Move to Upcoming</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 2: VIEW EVENT DETAILS (Eye Icon Action)         */}
      {/* ==================================================== */}
      {isViewModalOpen && viewingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-200 max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-base font-bold text-gray-900">
                Event Overview
              </h2>
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Event Details Content */}
            <div className="overflow-y-auto p-6 space-y-4 text-xs">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {viewingEvent.name}
                </h3>
                <p className="text-[#7040d0] font-semibold mt-0.5">
                  {viewingEvent.category || "General Event"}
                </p>
              </div>

              {/* Schedule and Location Grid */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 text-gray-700">
                <div className="flex items-center gap-2">
                  <Calendar size={15} className="text-purple-600" />
                  <span>{formatDate(viewingEvent.eventDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={15} className="text-purple-600" />
                  <span>
                    {formatTime(viewingEvent.startTime)} -{" "}
                    {formatTime(viewingEvent.endTime)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={15} className="text-purple-600" />
                  <span>{viewingEvent.venue || "Venue not set"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User size={15} className="text-purple-600" />
                  <span>{viewingEvent.speakerName || "Speaker TBA"}</span>
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="font-semibold text-gray-800 mb-1">Description</p>
                <p className="text-gray-600 leading-relaxed bg-white border border-gray-100 p-3 rounded-xl">
                  {viewingEvent.description || "No description provided."}
                </p>
              </div>

              {/* Capacity and Tab Status */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                  <p className="font-semibold text-purple-900 mb-1">Capacity</p>
                  <p className="text-sm font-bold text-gray-800">
                    {viewingEvent.registeredCount || 0} /{" "}
                    {viewingEvent.participantLimit || 100} Registered
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="font-semibold text-blue-900 mb-1">Status</p>
                  <p className="text-sm font-bold text-blue-800 capitalize">
                    {getEventTab(viewingEvent)}
                  </p>
                </div>
              </div>

              {/* Eligibility Criteria */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-800">Eligible Criteria</p>
                  {viewingEvent.eligibleCombinations && (
                    <span className="text-[11px] text-gray-500 font-medium">
                      {viewingEvent.eligibleCombinations.length} combination(s) allowed
                    </span>
                  )}
                </div>
                {viewingEvent.eligibleCombinations && viewingEvent.eligibleCombinations.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {viewingEvent.eligibleCombinations.map((combo) => (
                      <span
                        key={combo}
                        className="px-2 py-0.5 bg-purple-100/70 text-[#7040d0] rounded-md text-[11px] font-semibold border border-purple-200"
                      >
                        {combo}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-600 space-y-1">
                    <p>
                      Departments:{" "}
                      {viewingEvent.eligibleDepartments?.join(", ") || "All"}
                    </p>
                    <p>
                      Years:{" "}
                      {viewingEvent.eligibleYears
                        ? `Year ${viewingEvent.eligibleYears.join(", ")}`
                        : "All"}
                    </p>
                  </div>
                )}
              </div>

              {/* Rulebook Document */}
              {viewingEvent.rulebook && (
                <div className="flex items-center justify-between p-3 bg-gray-100 rounded-xl">
                  <span className="font-medium text-gray-700 flex items-center gap-2">
                    <FileText size={16} /> Rulebook: {viewingEvent.rulebook}
                  </span>
                  <span className="text-[#7040d0] font-semibold">Attached</span>
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg text-xs font-semibold hover:bg-gray-900 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 3: DELETE CONFIRMATION POPUP                    */}
      {/* ==================================================== */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-gray-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2.5 bg-red-100 rounded-full">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Delete Event
                </h3>
                <p className="text-xs text-gray-500">
                  This action will remove the event.
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-600">
              Are you sure you want to delete this event? This action cannot be
              undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageEvents;
