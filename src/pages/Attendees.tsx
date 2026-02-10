import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEventAttendance, type FilterOptions } from "../hooks/useEventAttendance";
import {
  MagnifyingGlassIcon,
  UserIcon,
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";
import AttendeeTable from "../components/dashboard/AttendeesTable";
import FilterPanel from "../components/dashboard/FilterPanel";
import { useFormDraft } from "../hooks/useFormDraft";
import { toast } from "sonner";

export default function Attendees() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const {
    attendees,
    loading,
    filters,
    setFilters,
    fetchAttendees,
    fetchAllAttendees,
    applyFilters,
  } = useEventAttendance();

  // Persist search query
  const { formData: searchParams, updateFormData } = useFormDraft("attendeesParams", {
    query: "",
  });
  const searchQuery = searchParams.query;

  const [filteredAttendees, setFilteredAttendees] = useState(attendees);

  /**
   * Load attendees on component mount or when eventId changes
   */
  useEffect(() => {
    if (eventId) {
      fetchAttendees(eventId);
    } else {
      fetchAllAttendees();
    }
  }, [eventId, fetchAttendees, fetchAllAttendees]);

  /**
   * Apply filters and search
   */
  useEffect(() => {
    const filtered = applyFilters(attendees, {
      ...filters,
      searchQuery,
    });
    setFilteredAttendees(filtered);
  }, [attendees, searchQuery, filters, applyFilters]);

  /**
   * Handle filter changes
   */
  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  /**
   * Clear all filters
   */
  const handleClearFilters = () => {
    setFilters({});
    updateFormData({ query: "" });
    toast.success("Filters cleared");
  };

  /**
   * Export attendee list as CSV
   */
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

  /**
   * Export attendee list as Excel-compatible CSV
   */
  const handleExportExcel = () => {
    // Excel-compatible CSV with UTF-8 BOM
    const BOM = "\uFEFF";
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
        a.name,
        a.email,
        a.eventTitle || "N/A",
        a.eventCategory || "N/A",
        a.status || "Registered",
        a.durationMinutes || 0,
        a.checkInTime ? new Date(a.checkInTime).toLocaleString() : "N/A",
        a.checkOutTime ? new Date(a.checkOutTime).toLocaleString() : "N/A",
        new Date(a.enrolledAt).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendees-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast.success("Attendees exported for Excel");
  };

  /**
   * Handle email click
   */
  const handleEmailClick = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  /**
   * Bulk email to all filtered attendees
   */
  const handleBulkEmail = () => {
    const emails = filteredAttendees.map((a) => a.email).join(",");
    window.location.href = `mailto:${emails}`;
  };

  return (
    <section className="space-y-6">
      {/* Page Header */}
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
            <h1 className="text-2xl font-bold text-brand-dark">Attendees</h1>
            <p className="text-sm text-brand-muted">
              {eventId
                ? "View and manage attendees for this event"
                : "View and manage attendees across all your events"}
            </p>
          </div>
        </header>

        {/* Action Buttons */}
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
            <div className="relative group">
              <button className="px-4 py-2 text-sm font-bold text-white bg-brand-primary hover:bg-brand-dark rounded-lg transition-colors flex items-center gap-2">
                <ArrowDownTrayIcon className="h-4 w-4" />
                Export
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-brand-accent/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <button
                  onClick={handleExportCSV}
                  className="w-full px-4 py-2 text-left text-sm font-medium text-brand-dark hover:bg-brand-surface transition-colors rounded-t-lg"
                >
                  Export as CSV
                </button>
                <button
                  onClick={handleExportExcel}
                  className="w-full px-4 py-2 text-left text-sm font-medium text-brand-dark hover:bg-brand-surface transition-colors rounded-b-lg"
                >
                  Export for Excel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

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

      {/* Attendees Stats */}
      {attendees.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="card p-4 ring-1 ring-brand-accent/5">
            <p className="text-xs text-brand-muted font-bold uppercase mb-1">Total Attendees</p>
            <p className="text-2xl font-bold text-brand-dark">{attendees.length}</p>
          </div>
          <div className="card p-4 ring-1 ring-brand-accent/5">
            <p className="text-xs text-brand-muted font-bold uppercase mb-1">Attended</p>
            <p className="text-2xl font-bold text-green-600">
              {attendees.filter((a) => a.status === "Attended").length}
            </p>
          </div>
          <div className="card p-4 ring-1 ring-brand-accent/5">
            <p className="text-xs text-brand-muted font-bold uppercase mb-1">Registered</p>
            <p className="text-2xl font-bold text-blue-600">
              {attendees.filter((a) => a.status !== "Attended").length}
            </p>
          </div>
          <div className="card p-4 ring-1 ring-brand-accent/5">
            <p className="text-xs text-brand-muted font-bold uppercase mb-1">Filtered</p>
            <p className="text-2xl font-bold text-brand-primary">{filteredAttendees.length}</p>
          </div>
        </div>
      )}

      {/* Attendees Table */}
      {loading ? (
        <div className="card p-12 text-center">
          <p className="text-brand-muted">Loading attendees...</p>
        </div>
      ) : filteredAttendees.length === 0 ? (
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
          showEventColumn={!eventId}
        />
      )}
    </section>
  );
}
