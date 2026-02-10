import { useState } from "react";
import AttendeeRow from "./AttendeesRow";
import {
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowsUpDownIcon,
} from "@heroicons/react/24/outline";

type Attendee = {
  id: string;
  name: string;
  email: string;
  eventTitle?: string;
  eventCategory?: string;
  enrolledAt: string;
  status?: string;
  durationMinutes?: number;
  checkInTime?: string;
  checkOutTime?: string;
};

type SortField = "name" | "email" | "eventTitle" | "enrolledAt" | "status" | "durationMinutes";
type SortDirection = "asc" | "desc" | null;

interface AttendeesTableProps {
  attendees: Attendee[];
  onEmailClick?: (email: string) => void;
  showEventColumn?: boolean;
}

export default function AttendeeTable({
  attendees,
  onEmailClick,
  showEventColumn = true,
}: AttendeesTableProps) {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortDirection(null);
        setSortField(null);
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedAttendees = [...attendees].sort((a, b) => {
    if (!sortField || !sortDirection) return 0;

    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    // Handle undefined/null values
    if (aValue === undefined || aValue === null) return 1;
    if (bValue === undefined || bValue === null) return -1;

    // Convert to comparable values
    if (sortField === "enrolledAt") {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    } else if (typeof aValue === "string") {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowsUpDownIcon className="h-4 w-4 text-brand-muted opacity-0 group-hover:opacity-100 transition-opacity" />;
    }
    return sortDirection === "asc" ? (
      <ChevronUpIcon className="h-4 w-4 text-brand-primary" />
    ) : (
      <ChevronDownIcon className="h-4 w-4 text-brand-primary" />
    );
  };

  return (
    <div className="card p-0 overflow-hidden border border-brand-accent/10 bg-white rounded-xl shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-brand-surface border-b border-brand-accent/10 text-brand-muted uppercase text-xs font-bold tracking-wider">
            <tr>
              <th
                className="px-6 py-4 cursor-pointer hover:bg-brand-accent/5 transition-colors group"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center gap-2">
                  Name
                  <SortIcon field="name" />
                </div>
              </th>
              <th
                className="hidden sm:table-cell px-6 py-4 cursor-pointer hover:bg-brand-accent/5 transition-colors group"
                onClick={() => handleSort("email")}
              >
                <div className="flex items-center gap-2">
                  Email
                  <SortIcon field="email" />
                </div>
              </th>
              {showEventColumn && (
                <th
                  className="px-6 py-4 cursor-pointer hover:bg-brand-accent/5 transition-colors group"
                  onClick={() => handleSort("eventTitle")}
                >
                  <div className="flex items-center gap-2">
                    Event
                    <SortIcon field="eventTitle" />
                  </div>
                </th>
              )}
              <th
                className="px-6 py-4 cursor-pointer hover:bg-brand-accent/5 transition-colors group"
                onClick={() => handleSort("status")}
              >
                <div className="flex items-center gap-2">
                  Status
                  <SortIcon field="status" />
                </div>
              </th>
              <th
                className="px-6 py-4 cursor-pointer hover:bg-brand-accent/5 transition-colors group"
                onClick={() => handleSort("durationMinutes")}
              >
                <div className="flex items-center gap-2">
                  Duration
                  <SortIcon field="durationMinutes" />
                </div>
              </th>
              <th
                className="px-6 py-4 cursor-pointer hover:bg-brand-accent/5 transition-colors group"
                onClick={() => handleSort("enrolledAt")}
              >
                <div className="flex items-center gap-2">
                  Registered
                  <SortIcon field="enrolledAt" />
                </div>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-brand-accent/5">
            {sortedAttendees.length > 0 ? (
              sortedAttendees.map((attendee, index) => (
                <AttendeeRow
                  key={`${attendee.id}-${index}`}
                  attendee={attendee}
                  onEmailClick={onEmailClick}
                  showEventColumn={showEventColumn}
                />
              ))
            ) : (
              <tr>
                <td
                  colSpan={showEventColumn ? 6 : 5}
                  className="py-12 text-center text-brand-muted"
                >
                  No attendees found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer with Count */}
      {sortedAttendees.length > 0 && (
        <div className="px-6 py-3 bg-brand-surface/30 border-t border-brand-accent/10">
          <p className="text-xs text-brand-muted">
            Showing <span className="font-bold text-brand-dark">{sortedAttendees.length}</span>{" "}
            {sortedAttendees.length === 1 ? "attendee" : "attendees"}
          </p>
        </div>
      )}
    </div>
  );
}
