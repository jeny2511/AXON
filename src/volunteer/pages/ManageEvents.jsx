import { Plus } from "lucide-react";
import PageHeader from "../components/PageHeader";

function ManageEvents() {
  return (
    <div>
      {/* Page Header */}
      <PageHeader
        title="Events Management"
        subtitle="View and manage all events"
        actionButton={
          <button className="inline-flex items-center gap-1.5 rounded-xl bg-[#635bff] px-4 py-2.5 text-xs sm:text-sm font-medium text-white shadow-xs transition hover:bg-[#5249ea]">
            <Plus size={16} />
            <span>Create Event</span>
          </button>
        }
      />

      {/* Events Card */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-gray-900">
            All Events
          </h2>
          <p className="mt-0.5 text-xs text-gray-400">
            Manage upcoming and completed events
          </p>
        </div>

        <div className="mt-6 rounded-xl border border-gray-100 p-8 text-sm text-gray-500">
          Events table will be built here.
        </div>
      </div>
    </div>
  );
}

export default ManageEvents;
