
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  UserGroupIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  EnvelopeIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  ArrowLeftIcon,
  UserIcon
} from "@heroicons/react/24/outline";
import { useEventAttendance, type FilterOptions } from "../hooks/useEventAttendance";
import AttendeeTable from "../components/dashboard/AttendeesTable";
import AttendanceLogs from "../components/dashboard/AttendanceLogs";
import AttendeeLogsModal from "../components/dashboard/AttendeeLogsModal";
import EmailComposerModal from "../components/dashboard/EmailComposerModal";
import FilterPanel from "../components/dashboard/FilterPanel";
import { useFormDraft } from "../hooks/useFormDraft";
import { toast } from "sonner";

export default function Attendees() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const {
    attendees,
    loading,
    error,
    filters,
    setFilters,
    fetchAttendees,
    fetchAllAttendees,
    attendanceStats,
    fetchAttendanceStats,
    applyFilters,
  } = useEventAttendance();

  // Persist search query
  const { formData: searchParams, updateFormData } = useFormDraft("attendeesParams", {
    query: "",
  });
  const searchQuery = searchParams.query;

  const [activeTab, setActiveTab] = useState<"participants" | "logs" | "analytics">("participants");
  const [filteredAttendees, setFilteredAttendees] = useState(attendees);

  // Modal States
  const [logsModal, setLogsModal] = useState<{ isOpen: boolean; userId: string; userName: string }>({
    isOpen: false,
    userId: "",
    userName: "",
  });

  const [emailModal, setEmailModal] = useState<{ isOpen: boolean; toEmail: string | string[]; userName?: string }>({
    isOpen: false,
    toEmail: "",
  });

  useEffect(() => {
    if (eventId) {
      fetchAttendees(eventId);
      fetchAttendanceStats(eventId);
    } else {
      fetchAllAttendees();
    }
  }, [eventId, fetchAttendees, fetchAllAttendees, fetchAttendanceStats]);

  useEffect(() => {
    const filtered = applyFilters(attendees, {
      ...filters,
      searchQuery,
    });
    setFilteredAttendees(filtered);
  }, [attendees, searchQuery, filters, applyFilters]);

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
    updateFormData({ query: "" });
    toast.success("Filters cleared");
  };

  const handleExportCSV = () => {
    const csv = [
      [
        "Name",
        "Email",
        "Event",
        "Category",
        "Status",
        "Duration (min)",
        "Check-In Time",
        "Check-Out Time",
        "Enrolled Date",
      ],
      ...filteredAttendees.map((a) => [
        `"${a.name}"`,
        `"${a.email}"`,
        `"${a.eventTitle || "N/A"}"`,
        `"${a.eventCategory || "N/A"}"`,
        `"${a.status || "Registered"}"`,
        a.durationMinutes || 0,
        a.checkInTime ? new Date(a.checkInTime).toLocaleString() : "N/A",
        a.checkOutTime ? new Date(a.checkOutTime).toLocaleString() : "N/A",
        new Date(a.enrolledAt).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendees-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast.success("Attendees exported successfully");
  };

  const handleEmailClick = (email: string) => {
    setEmailModal({
      isOpen: true,
      toEmail: email,
      userName: attendees.find(a => a.email === email)?.name
    });
  };

  const handleBulkEmail = () => {
    const emails = filteredAttendees.map((a) => a.email);
    setEmailModal({
      isOpen: true,
      toEmail: emails,
    });
  };

  const handleViewLogs = (userId: string, userName: string) => {
    if (!eventId) return;
    setLogsModal({ isOpen: true, userId, userName });
  };

  if (loading && attendees.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => eventId ? fetchAttendees(eventId) : fetchAllAttendees()}
          className="btn btn-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <header className="flex items-center gap-4">
          {eventId && (
            <button
              onClick={() => navigate(`/dashboard/events/${eventId}`)}
              className="p-2 -ml-2 hover:bg-brand-surface rounded-lg transition-colors group"
              title="Back to Event"
            >
              <ArrowLeftIcon className="h-5 w-5 text-brand-muted group-hover:text-brand-dark" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">

              {eventId ? "Event Attendees" : "All Attendees"}
            </h1>
            <p className="text-sm text-brand-muted">
              {eventId
                ? "View and manage attendees for this event"
                : "View and manage attendees across all your events"}
            </p>
          </div>
        </header>

        {filteredAttendees.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkEmail}
              className="px-4 py-2 text-sm font-bold text-brand-primary hover:bg-brand-surface rounded-lg transition-colors flex items-center gap-2"
              title="Send email to all filtered attendees"
            >
              <EnvelopeIcon className="h-4 w-4" />
              Email All
            </button>
            <button
              onClick={handleExportCSV}
              className="btn btn-secondary flex items-center gap-2"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      {eventId && (
        <div className="flex border-b border-brand-accent/10">
          <button
            onClick={() => setActiveTab("participants")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === "participants"
              ? "border-brand-primary text-brand-primary"
              : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
          >
            <UserGroupIcon className="h-4 w-4" />
            Participants
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === "logs"
              ? "border-brand-primary text-brand-primary"
              : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
          >
            <ClipboardDocumentListIcon className="h-4 w-4" />
            Attendance Logs
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === "analytics"
              ? "border-brand-primary text-brand-primary"
              : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
          >
            <ChartBarIcon className="h-4 w-4" />
            Analytics
          </button>
        </div>
      )}

      {/* Content */}
      {activeTab === "participants" && (
        <>
          {/* Search Bar */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-3.5 h-5 w-5 text-brand-muted" />
            <input
              type="text"
              placeholder="Search attendees by name, email, or event..."
              value={searchQuery}
              onChange={(e) => updateFormData({ query: e.target.value })}
              className="w-full pl-12 pr-4 py-3 rounded-lg border border-brand-accent bg-brand-surface/20 text-brand-dark placeholder-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          {/* Filter Panel */}
          <FilterPanel
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            showEventFilter={!eventId}
          />

          {/* List */}
          {filteredAttendees.length === 0 ? (
            <div className="card p-12 text-center">
              <UserIcon className="h-12 w-12 text-brand-muted mx-auto mb-3 opacity-50" />
              <p className="text-brand-muted text-lg">
                {searchQuery || Object.keys(filters).length > 0
                  ? "No attendees matching your filters"
                  : "No attendees yet"}
              </p>
            </div>
          ) : (
            <AttendeeTable
              attendees={filteredAttendees}
              onEmailClick={handleEmailClick}
              onViewLogs={eventId ? handleViewLogs : undefined}
              showEventColumn={!eventId}
            />
          )}
        </>
      )}

      {activeTab === "logs" && eventId && (
        <AttendanceLogs eventId={eventId} eventTitle="" />
      )}

      {activeTab === "analytics" && eventId && attendanceStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card p-6 border-l-4 border-l-brand-primary">
            <h3 className="text-gray-500 text-sm font-medium">Total Check-ins</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{attendanceStats.totalCheckIns}</p>
          </div>
          <div className="card p-6 border-l-4 border-l-green-500">
            <h3 className="text-gray-500 text-sm font-medium">Active Now</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{attendanceStats.activeNow}</p>
          </div>
          <div className="card p-6 border-l-4 border-l-blue-500">
            <h3 className="text-gray-500 text-sm font-medium">Unique Attendees</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{attendanceStats.uniqueAttendees}</p>
          </div>
          <div className="card p-6 border-l-4 border-l-purple-500">
            <h3 className="text-gray-500 text-sm font-medium">Avg. Duration</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{Math.round(attendanceStats.avgDuration)} mins</p>
          </div>

          {/* Placeholder for more charts */}
          <div className="card p-8 col-span-full text-center border-dashed border-2 border-gray-200">
            <ChartBarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Detailed Visual Analytics</h3>
            <p className="text-gray-500 mt-2">Charts for engagement trends and activity distribution coming soon.</p>
          </div>
        </div>
      )}

      {/* Modals */}
      {logsModal.isOpen && eventId && (
        <AttendeeLogsModal
          isOpen={logsModal.isOpen}
          onClose={() => setLogsModal(prev => ({ ...prev, isOpen: false }))}
          eventId={eventId}
          userId={logsModal.userId}
          userName={logsModal.userName}
        />
      )}

      <EmailComposerModal
        isOpen={emailModal.isOpen}
        onClose={() => setEmailModal(prev => ({ ...prev, isOpen: false }))}
        toEmail={emailModal.toEmail}
        userName={emailModal.userName}
      />
    </div>
  );
}
