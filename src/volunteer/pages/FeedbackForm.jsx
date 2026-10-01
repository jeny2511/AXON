import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Check,
  ChevronDown,
  Download,
  Edit,
  FileText,
  Plus,
  Search,
  Send,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { events, feedbackForms } from "../../mockData";

const MAX_QUESTIONS = 15;
const MIN_QUESTIONS = 5;
const DEFAULT_QUESTIONS = 10;
const MAX_OPTIONS = 5;

function getStatus(event) {
  const now = new Date();
  const start = new Date(`${event.eventDate}T${event.startTime}`);
  const end = new Date(`${event.eventDate}T${event.endTime}`);

  if (now < start) return "upcoming";
  if (now <= end) return "ongoing";
  return "past";
}

function formatDate(dateStr) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function FeedbackForm() {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [search, setSearch] = useState("");
  const [showEvents, setShowEvents] = useState(false);
  const searchRef = useRef(null);

  const [forms, setForms] = useState(feedbackForms);
  const [modal, setModal] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [toast, setToast] = useState("");

  const [report, setReport] = useState(null);

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

  // Default selection: Nearest event chronologically to now
  const nearestEvent = useMemo(() => {
    return [...events].sort((a, b) => {
      const aDate = new Date(`${a.eventDate}T${a.startTime}`).getTime();
      const bDate = new Date(`${b.eventDate}T${b.startTime}`).getTime();
      return Math.abs(aDate - Date.now()) - Math.abs(bDate - Date.now());
    })[0];
  }, []);

  useEffect(() => {
    if (nearestEvent && !selectedEvent) {
      setSelectedEvent(nearestEvent);
      setSearch(nearestEvent.name);
    }
  }, [nearestEvent, selectedEvent]);

  // Dropdown list & live typeahead
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

  const form = forms.find((item) => item.eventId === selectedEvent?.id);
  const status = selectedEvent ? getStatus(selectedEvent) : "";

  // Edit lockout: Locked during last 15 minutes of ongoing event when already active
  const isEditLocked = useMemo(() => {
    if (!selectedEvent) return false;
    if (status === "ongoing" && form?.publishedAt) {
      const end = new Date(`${selectedEvent.eventDate}T${selectedEvent.endTime}`).getTime();
      const fifteenMinutesBefore = end - 15 * 60 * 1000;
      return Date.now() >= fifteenMinutesBefore;
    }
    return false;
  }, [selectedEvent, status, form]);

  // 12-hour feedback window state
  const isWindowOpen = useMemo(() => {
    if (!form?.publishedAt) return false;
    const publishedTime = new Date(form.publishedAt).getTime();
    const twelveHoursAfter = publishedTime + 12 * 60 * 60 * 1000;
    return Date.now() < twelveHoursAfter;
  }, [form]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  function createForm() {
    setQuestions(
      Array.from({ length: DEFAULT_QUESTIONS }, (_, index) => ({
        id: `Q${Date.now()}_${index}`,
        question: "",
        type: index < 2 ? "radio" : index < 4 ? "checkbox" : "textarea",
        options: index < 2 ? ["Excellent", "Good", "Average"] : index < 4 ? ["Option 1", "Option 2"] : [],
      }))
    );
    setModal("create");
  }

  function editForm() {
    if (!form || !form.questions) return;
    if (isEditLocked) {
      setToast("Form editing is unavailable during the last 15 minutes of the event.");
      return;
    }
    setQuestions(
      form.questions.map((question, idx) => ({
        ...question,
        id: question.id || `Q${Date.now()}_${idx}`,
        options: Array.isArray(question.options) ? [...question.options] : [],
      }))
    );
    setModal("edit");
  }

  function updateQuestion(id, value) {
    setQuestions((items) =>
      items.map((item) => (item.id === id ? { ...item, question: value } : item))
    );
  }

  function updateType(id, type) {
    setQuestions((items) =>
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              type,
              options: type === "textarea" ? [] : item.options?.length ? item.options : ["Option 1", "Option 2"],
            }
          : item
      )
    );
  }

  function updateOption(questionId, index, value) {
    setQuestions((items) =>
      items.map((item) => {
        if (item.id !== questionId) return item;
        const options = [...item.options];
        options[index] = value;
        return { ...item, options };
      })
    );
  }

  function addOption(questionId) {
    setQuestions((items) =>
      items.map((item) =>
        item.id === questionId && item.options.length < MAX_OPTIONS
          ? { ...item, options: [...item.options, `Option ${item.options.length + 1}`] }
          : item
      )
    );
  }

  function removeOption(questionId, optionIndex) {
    setQuestions((items) =>
      items.map((item) => {
        if (item.id !== questionId) return item;
        const options = item.options.filter((_, idx) => idx !== optionIndex);
        return { ...item, options };
      })
    );
  }

  function addQuestion() {
    if (questions.length >= MAX_QUESTIONS) {
      setToast(`Maximum limit of ${MAX_QUESTIONS} questions reached.`);
      return;
    }
    setQuestions((items) => [
      ...items,
      {
        id: `Q${Date.now()}_${items.length}`,
        question: "",
        type: "textarea",
        options: [],
      },
    ]);
  }

  function removeQuestion(id) {
    if (questions.length <= 1) {
      setToast("At least 1 question must remain in the editor.");
      return;
    }
    setQuestions((items) => items.filter((item) => item.id !== id));
  }

  function saveForm() {
    const validQuestions = questions.filter((q) => q.question.trim());

    if (validQuestions.length < MIN_QUESTIONS) {
      setToast(`Minimum ${MIN_QUESTIONS} non-empty questions are required (currently ${validQuestions.length}).`);
      return;
    }

    const invalid = validQuestions.some((question) => {
      if (question.type !== "textarea") {
        return question.options.filter((opt) => opt && opt.trim()).length < 2;
      }
      return false;
    });

    if (invalid) {
      setToast("Please complete at least 2 non-empty options for choice questions.");
      return;
    }

    const updatedForm = {
      eventId: selectedEvent.id,
      included: true,
      generated: true,
      publishedAt: form?.publishedAt || null,
      closedAt: form?.closedAt || null,
      questions: validQuestions,
      responses: form?.responses || [],
      analyticsReport: form?.analyticsReport || null,
      responseFile: form?.responseFile || null,
      responseSentToAdmin: form?.responseSentToAdmin || false,
      reportSentToAdmin: form?.reportSentToAdmin || false,
    };

    setForms((items) => {
      const exists = items.some((item) => item.eventId === selectedEvent.id);
      return exists
        ? items.map((item) => (item.eventId === selectedEvent.id ? updatedForm : item))
        : [...items, updatedForm];
    });

    setModal(null);
    setToast(modal === "create" ? "Feedback form created successfully!" : "Form changes saved successfully!");
  }

  function publishForm() {
    setForms((items) =>
      items.map((item) =>
        item.eventId === selectedEvent.id
          ? {
              ...item,
              publishedAt: new Date().toISOString(),
            }
          : item
      )
    );
    setToast("Feedback form published successfully.");
  }

  function unpublishForm() {
    setForms((items) =>
      items.map((item) =>
        item.eventId === selectedEvent.id
          ? {
              ...item,
              publishedAt: null,
            }
          : item
      )
    );
    setToast("Feedback form unpublished and returned to draft.");
  }

  function exportCSV() {
    if (!form?.responses?.length) {
      setToast("No responses to export.");
      return;
    }
    const questionHeaders = (form.questions || []).map((q, idx) => `Q${idx + 1}: ${q.question.replace(/"/g, '""')}`);
    const headers = ["Name", "Enrollment", "Branch", "Year/Sem", ...questionHeaders];
    
    const rows = form.responses.map((r) => {
      const questionAnswers = (form.questions || []).map((q) => {
        const ans = r.answers?.[q.id];
        const text = Array.isArray(ans) ? ans.join("; ") : (ans || "N/A");
        return `"${text.replace(/"/g, '""')}"`;
      });
      return [
        `"${(r.name || "").replace(/"/g, '""')}"`,
        `"${r.enrollment || ""}"`,
        `"${r.branch || ""}"`,
        `"${r.yearSem || ""}"`,
        ...questionAnswers,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.map((h) => `"${h}"`).join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${(selectedEvent.name || "Event").replace(/\s+/g, "_")}_Feedback_Responses.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setToast("Response spreadsheet exported successfully.");
  }

  function uploadReport(file) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setToast("File size must be below 10 MB.");
      return;
    }
    setReport(file);
    setToast("Analytics report uploaded.");
  }

  function sendReport() {
    setForms((items) =>
      items.map((item) =>
        item.eventId === selectedEvent.id ? { ...item, reportSentToAdmin: true } : item
      )
    );
    setToast("Analytics report sent to Admin.");
  }

  function downloadFile(file) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (!selectedEvent) {
    return <div className="p-6 text-sm text-gray-500">Loading feedback...</div>;
  }

  // Extract top 5 questions for the analytics preview
  const previewQuestions = form?.questions?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#24154f]">Feedback</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create, manage and analyze event feedback throughout the lifecycle.
        </p>
      </div>

      {/* Top Bar: Smart Event Search */}
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
          <button type="button" onClick={() => setShowEvents((prev) => !prev)}>
            <ChevronDown size={18} className="text-gray-400" />
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
                  <p className="font-medium text-gray-800">{event.name}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {formatDate(event.eventDate)} · {getStatus(event)}
                  </p>
                </button>
              ))
            ) : (
              <p className="px-3 py-4 text-sm text-gray-500">No events found.</p>
            )}
          </div>
        )}
      </div>

      {/* Event Info Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-gray-800">{selectedEvent.name}</h2>
            <p className="mt-1 text-sm text-gray-500">
              {formatDate(selectedEvent.eventDate)} · {selectedEvent.startTime} -{" "}
              {selectedEvent.endTime}
            </p>
          </div>
          <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium capitalize text-purple-700">
            {status}
          </span>
        </div>
      </div>

      {/* Feature Flag Check: Feedback required by Admin? */}
      {selectedEvent.feedbackRequired === false ? (
        <EmptyBox text="This event does not include a feedback form." />
      ) : (
        <div className="space-y-5">
          {/* 1. UPCOMING & UNGENERATED STATE: Create Form Box */}
          {!form?.generated && (
            <ActionBox
              icon={<Plus size={26} />}
              title="Create Feedback Form"
              text="Create 5 to 15 questions for this event."
              button="Create Form"
              onClick={createForm}
            />
          )}

          {/* 2. FORM ALREADY CREATED: View Form Box with Edit option */}
          {form?.generated && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
                    <FileText size={26} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Feedback Form Configured</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {form.questions?.length || 0} questions configured for this event.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={editForm}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Edit size={16} />
                    Edit Form
                  </button>
                  <button
                    type="button"
                    onClick={() => setModal("view")}
                    className="flex items-center gap-2 rounded-lg bg-[#24154f] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#36216f] transition-colors"
                  >
                    <FileText size={16} />
                    View Form
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3. ONGOING STATE: Lock notice during last 15 mins */}
          {status === "ongoing" && form?.generated && (
            <p className="text-xs text-gray-500">
              {isEditLocked
                ? "Form editing is locked during the last 15 minutes of the event."
                : "Form editing will automatically lock during the last 15 minutes of the event."}
            </p>
          )}

          {/* 4. MANUAL PUBLISH CARRYOVER: When form is generated but not yet published */}
          {(status === "past" || status === "ongoing") && form?.generated && !form.publishedAt && (
            <ActionBox
              icon={<Send size={26} />}
              title="Publish Feedback Form"
              text="The form is ready. Publish to open the 12-hour response window for students."
              button="Publish Form"
              onClick={publishForm}
            />
          )}

          {/* 5. PUBLISHED FORM WORKFLOW */}
          {form?.publishedAt && (
            <>
              {/* Response Summary & Window Status */}
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoBox
                  title="Completed Responses"
                  value={form.responses?.length || 0}
                  text="Students submitted feedback"
                  onClick={() => setModal("responses")}
                />

                <div className="rounded-xl border border-gray-200 bg-white p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500">Feedback Window</p>
                      {isWindowOpen && (
                        <button
                          type="button"
                          onClick={unpublishForm}
                          className="text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-md transition-colors"
                          title="Revert form back to draft mode and stop receiving submissions"
                        >
                          Unpublish Form
                        </button>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={`inline-block h-2.5 w-2.5 rounded-full ${
                          isWindowOpen ? "bg-green-500 animate-pulse" : "bg-gray-400"
                        }`}
                      />
                      <p className="text-2xl font-bold text-[#24154f]">
                        {isWindowOpen ? "Open" : "Closed"}
                      </p>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {isWindowOpen
                      ? "Submissions active for 12 hours from publish. You can unpublish or edit anytime."
                      : "12-hour submission window completed"}
                  </p>
                </div>
              </div>

              {/* 6. ANALYTICS PREVIEW: Top 5 questions breakdown */}
              {form?.responses?.length > 0 && (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <BarChart3 size={20} className="text-[#24154f]" />
                        <h3 className="font-semibold text-gray-800">Feedback Analytics (Top Questions)</h3>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        {form.responses?.length || 0} student submissions analyzed across {form.questions?.length || 0} questions
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setModal("analytics")}
                      className="flex items-center gap-2 rounded-lg bg-[#24154f] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#36216f] transition-colors"
                    >
                      <BarChart3 size={16} />
                      View Full Detailed Analytics
                    </button>
                  </div>

                  {/* Top 5 Questions visual cards */}
                  {previewQuestions.length > 0 && (
                    <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {previewQuestions.map((q, idx) => {
                        const totalSubmissions = form.responses?.length || 0;
                        return (
                          <div key={q.id || idx} className="rounded-xl border border-gray-100 bg-gray-50/70 p-4 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
                                  Q{idx + 1}
                                </span>
                                <span className="rounded bg-white px-2 py-0.5 text-[11px] font-medium text-gray-600 border border-gray-200 capitalize">
                                  {q.type === "radio" ? "Single Choice" : q.type === "checkbox" ? "Multi Choice" : "Written"}
                                </span>
                              </div>
                              <p className="mt-2 text-sm font-medium text-gray-800 line-clamp-2">
                                {q.question}
                              </p>
                            </div>

                            <div className="mt-3 border-t border-gray-200/60 pt-2 text-xs text-gray-500">
                              {q.type === "textarea" ? (
                                <span className="font-medium text-purple-900">
                                  {form.responses.filter((r) => r.answers?.[q.id]).length} written answers recorded
                                </span>
                              ) : (
                                <span className="font-medium text-purple-900">
                                  {q.options?.length || 0} choices · {totalSubmissions} responses
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 7. Response File Management (Available during & after responses) */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800">Response File & Export</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      View real-time responses or export full questionnaire spreadsheet to Excel/CSV.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setModal("responses")}
                      className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      View Responses ({form.responses?.length || 0})
                    </button>

                    <button
                      type="button"
                      onClick={exportCSV}
                      disabled={!form.responses?.length}
                      className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                      title="Download Excel/CSV containing student info and answers to all questions"
                    >
                      <Download size={16} />
                      Download Excel/CSV
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setForms((items) =>
                          items.map((item) =>
                            item.eventId === selectedEvent.id
                              ? { ...item, responseSentToAdmin: true }
                              : item
                          )
                        );
                        setToast("Feedback response file sent to Admin.");
                      }}
                      disabled={!form.responses?.length || form.responseSentToAdmin}
                      className="flex items-center gap-2 rounded-lg bg-[#24154f] px-4 py-2 text-sm font-medium text-white hover:bg-[#36216f] disabled:opacity-50 transition-colors"
                    >
                      <Send size={16} />
                      {form.responseSentToAdmin ? "Sent to Admin" : "Send to Admin"}
                    </button>
                  </div>
                </div>
              </div>

                  {/* 8. Analytics Report Upload */}
                  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-800">Analytics Report</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Upload finalized post-event feedback report (PDF, Word, Excel).
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                          <Upload size={16} />
                          Upload Report
                          <input
                            type="file"
                            accept=".pdf,.xlsx,.xls,.doc,.docx"
                            hidden
                            onChange={(e) => uploadReport(e.target.files?.[0])}
                          />
                        </label>

                        {report && (
                          <>
                            <button
                              type="button"
                              onClick={() => downloadFile(report)}
                              className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                              <Download size={16} />
                              View / Download
                            </button>

                            <button
                              type="button"
                              onClick={sendReport}
                              disabled={form.reportSentToAdmin}
                              className="flex items-center gap-2 rounded-lg bg-[#24154f] px-4 py-2 text-sm font-medium text-white hover:bg-[#36216f] disabled:opacity-50"
                            >
                              <Send size={16} />
                              {form.reportSentToAdmin ? "Sent to Admin" : "Send to Admin"}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
            </>
          )}
        </div>
      )}

      {/* Modals */}
      {modal && (
        <Modal onClose={() => setModal(null)}>
          {modal === "create" || modal === "edit" ? (
            <FormEditor
              questions={questions}
              updateQuestion={updateQuestion}
              updateType={updateType}
              updateOption={updateOption}
              addOption={addOption}
              removeOption={removeOption}
              addQuestion={addQuestion}
              removeQuestion={removeQuestion}
              saveForm={saveForm}
              onClose={() => setModal(null)}
              edit={modal === "edit"}
            />
          ) : modal === "view" ? (
            <ViewForm
              form={form}
              onClose={() => setModal(null)}
              onEdit={editForm}
              canEdit={!isEditLocked}
            />
          ) : modal === "responses" ? (
            <Responses form={form} onClose={() => setModal(null)} />
          ) : (
            <Analytics form={form} onClose={() => setModal(null)} />
          )}
        </Modal>
      )}

      {/* Toast Feedback */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-[#24154f] px-4 py-3 text-sm font-medium text-white shadow-lg">
          <Check size={16} />
          {toast}
        </div>
      )}
    </div>
  );
}

function ActionBox({ icon, title, text, button, onClick, secondary }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{title}</h3>
            <p className="mt-1 text-sm text-gray-500">{text}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {secondary}
          <button
            type="button"
            onClick={onClick}
            className="rounded-lg bg-[#24154f] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#36216f]"
          >
            {button}
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoBox({ title, value, text, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm hover:bg-gray-50"
    >
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-[#24154f]">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{text}</p>
    </button>
  );
}

function EmptyBox({ text }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-500">
      {text}
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
        className="w-full max-w-3xl rounded-2xl bg-white shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function FormEditor({
  questions,
  updateQuestion,
  updateType,
  updateOption,
  addOption,
  removeOption,
  addQuestion,
  removeQuestion,
  saveForm,
  onClose,
  edit,
}) {
  return (
    <div className="max-h-[85vh] overflow-y-auto p-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            {edit ? "Edit Feedback Form" : "Create Feedback Form"}
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            {questions.length}/15 questions (Min 5 required to generate)
          </p>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100">
          <X size={20} />
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {questions.map((question, index) => (
          <div key={question.id || index} className="rounded-xl border border-gray-200 p-4 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold text-sm text-[#24154f]">
                Question {index + 1}
              </span>
              <div className="flex items-center gap-2">
                <select
                  value={question.type}
                  onChange={(e) => updateType(question.id, e.target.value)}
                  className="rounded-lg border border-gray-200 px-3 py-1 text-xs outline-none bg-gray-50 font-medium"
                >
                  <option value="textarea">Textarea (Written)</option>
                  <option value="radio">Radio (Single Choice)</option>
                  <option value="checkbox">Checkbox (Multi Choice)</option>
                </select>

                <button
                  type="button"
                  onClick={() => removeQuestion(question.id)}
                  className="rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                  title="Delete Question"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <textarea
              value={question.question}
              onChange={(e) => updateQuestion(question.id, e.target.value)}
              rows={2}
              placeholder="Enter your question text here..."
              className="mt-3 w-full rounded-lg border border-gray-200 p-3 text-sm outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />

            {question.type !== "textarea" && (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-medium text-gray-500">Options (Max 5):</p>
                {question.options.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-center gap-2">
                    <input
                      value={option}
                      onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
                      placeholder={`Option ${optionIndex + 1}`}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-500"
                    />
                    {question.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(question.id, optionIndex)}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-500"
                        title="Remove option"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}

                {question.options.length < MAX_OPTIONS && (
                  <button
                    type="button"
                    onClick={() => addOption(question.id)}
                    className="text-xs font-semibold text-purple-700 hover:text-purple-900 pt-1 block"
                  >
                    + Add option
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {questions.length < MAX_QUESTIONS && (
        <button
          type="button"
          onClick={addQuestion}
          className="mt-4 flex items-center gap-2 text-sm font-semibold text-purple-700 hover:text-purple-900"
        >
          <Plus size={16} />
          Add More Question
        </button>
      )}

      <div className="mt-6 flex justify-end gap-3 border-t pt-4">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={saveForm}
          className="rounded-lg bg-[#24154f] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#36216f]"
        >
          {edit ? "Save Changes" : "Generate Form"}
        </button>
      </div>
    </div>
  );
}

function ViewForm({ form, onClose, onEdit, canEdit }) {
  return (
    <div className="max-h-[80vh] overflow-y-auto p-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Feedback Form Preview</h2>
          <p className="mt-1 text-xs text-gray-500">{form?.questions?.length || 0} questions configured</p>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="flex items-center gap-1.5 rounded-lg bg-[#24154f] px-3.5 py-1.5 text-xs font-medium text-white hover:bg-[#36216f]"
            >
              <Edit size={14} />
              Edit Form
            </button>
          )}
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {form?.questions?.map((question, index) => (
          <div key={question.id} className="rounded-xl border border-gray-200 p-4">
            <p className="font-medium text-gray-800">
              {index + 1}. {question.question}
            </p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-purple-600">
              {question.type}
            </p>

            {question.options?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {question.options.map((option, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700"
                  >
                    {option}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Responses({ form, onClose }) {
  const [filterQuery, setFilterQuery] = useState("");

  const filteredResponses = useMemo(() => {
    if (!filterQuery.trim()) return form?.responses || [];
    return (form?.responses || []).filter(
      (r) =>
        r.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
        r.enrollment.toLowerCase().includes(filterQuery.toLowerCase()) ||
        r.branch.toLowerCase().includes(filterQuery.toLowerCase())
    );
  }, [form, filterQuery]);

  return (
    <div className="max-h-[80vh] overflow-y-auto p-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Feedback Submissions</h2>
          <p className="mt-1 text-xs text-gray-500">
            {form?.responses?.length || 0} total submissions (student identity auto-fetched)
          </p>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100">
          <X size={20} />
        </button>
      </div>

      {/* Quick Search / Filter within responses */}
      <div className="mt-4">
        <input
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          placeholder="Filter by student name, enrollment, branch..."
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-500"
        />
      </div>

      <div className="mt-4 space-y-3">
        {filteredResponses.length ? (
          filteredResponses.map((response) => (
            <div key={response.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                <div>
                  <p className="font-semibold text-gray-800">{response.name}</p>
                  <p className="text-xs text-gray-500">Enrollment: {response.enrollment}</p>
                </div>
                <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
                  {response.branch} · {response.yearSem}
                </span>
              </div>

              {response.answers && (
                <div className="mt-3 space-y-2">
                  {Object.entries(response.answers).map(([qId, ans]) => {
                    const qObj = form.questions.find((q) => q.id === qId);
                    return (
                      <div key={qId} className="text-xs">
                        <span className="font-medium text-gray-600">
                          {qObj ? qObj.question : qId}:{" "}
                        </span>
                        <span className="text-gray-800 font-semibold">
                          {Array.isArray(ans) ? ans.join(", ") : ans}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="py-10 text-center text-sm text-gray-500">No responses recorded yet.</p>
        )}
      </div>
    </div>
  );
}

function Analytics({ form, onClose }) {
  const total = form?.responses?.length || 0;

  return (
    <div className="max-h-[85vh] overflow-y-auto p-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Question Analytics</h2>
          <p className="mt-1 text-xs text-gray-500">
            {total} total student submissions analyzed
          </p>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100">
          <X size={20} />
        </button>
      </div>

      <div className="mt-6 space-y-6">
        {form?.questions?.map((question, index) => {
          if (question.type === "textarea") {
            const textAnswers = (form.responses || [])
              .map((r) => ({ name: r.name, text: r.answers?.[question.id] }))
              .filter((item) => item.text);

            return (
              <div key={question.id} className="rounded-xl border border-gray-200 p-5">
                <p className="font-semibold text-gray-800">
                  {index + 1}. {question.question}
                </p>
                <p className="mt-1 text-xs text-purple-600">Written Responses ({textAnswers.length})</p>

                <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                  {textAnswers.length ? (
                    textAnswers.map((item, idx) => (
                      <div key={idx} className="rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
                        <span className="font-semibold text-gray-900">{item.name}: </span>
                        {item.text}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400">No written answers submitted.</p>
                  )}
                </div>
              </div>
            );
          }

          // Multiple choice (radio/checkbox) distribution calculation
          return (
            <div key={question.id} className="rounded-xl border border-gray-200 p-5">
              <p className="font-semibold text-gray-800">
                {index + 1}. {question.question}
              </p>
              <p className="mt-1 text-xs text-purple-600 capitalize">
                {question.type === "radio" ? "Single Choice" : "Multiple Choice"} ({total} responses)
              </p>

              <div className="mt-4 space-y-3">
                {question.options.map((option, optIdx) => {
                  const matchCount = (form.responses || []).filter((r) => {
                    const ans = r.answers?.[question.id];
                    return Array.isArray(ans) ? ans.includes(option) : ans === option;
                  }).length;

                  const percentage = total > 0 ? Math.round((matchCount / total) * 100) : 0;
                  const barColors = [
                    "bg-[#4285f4]",
                    "bg-[#ea4335]",
                    "bg-[#fbbc05]",
                    "bg-[#34a853]",
                    "bg-[#8e24aa]",
                  ];
                  const barColor = barColors[optIdx % barColors.length];

                  return (
                    <div key={option} className="space-y-1.5 rounded-lg bg-gray-50/70 p-2.5">
                      <div className="flex justify-between text-xs font-semibold text-gray-700">
                        <span>{option}</span>
                        <span className="text-gray-900">
                          {percentage}% ({matchCount} response{matchCount === 1 ? "" : "s"})
                        </span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default FeedbackForm;