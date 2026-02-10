import { EnvelopeIcon, ClockIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

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

interface AttendeeRowProps {
  attendee: Attendee;
  onEmailClick?: (email: string) => void;
  showEventColumn?: boolean;
}

export default function AttendeeRow({
  attendee,
  onEmailClick,
  showEventColumn = true,
}: AttendeeRowProps) {
  const formatDuration = (minutes?: number) => {
    if (!minutes) return "—";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "Attended":
        return "bg-green-100 text-green-700 border-green-200";
      case "Active":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Registered":
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <tr className="border-b last:border-none border-brand-accent/10 hover:bg-brand-surface/50 transition-colors group">
      {/* Name */}
      <td className="px-6 py-4">
        <div className="flex flex-col">
          <span className="font-medium text-brand-dark">{attendee.name}</span>
          <span className="text-xs text-brand-muted sm:hidden">{attendee.email}</span>
        </div>
      </td>

      {/* Email (Desktop only) */}
      <td className="hidden sm:table-cell px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-brand-muted">{attendee.email}</span>
          {onEmailClick && (
            <button
              onClick={() => onEmailClick(attendee.email)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-brand-primary/10 rounded"
              title="Send email"
            >
              <EnvelopeIcon className="h-4 w-4 text-brand-primary" />
            </button>
          )}
        </div>
      </td>

      {/* Event (if shown) */}
      {showEventColumn && (
        <td className="px-6 py-4">
          <div className="flex flex-col">
            <span className="text-brand-dark font-medium">
              {attendee.eventTitle || "N/A"}
            </span>
            {attendee.eventCategory && (
              <span className="text-xs text-brand-muted">{attendee.eventCategory}</span>
            )}
          </div>
        </td>
      )}

      {/* Status */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full border ${getStatusColor(
              attendee.status
            )}`}
          >
            {attendee.status || "Registered"}
          </span>
          {attendee.status === "Attended" && (
            <CheckCircleIcon className="h-4 w-4 text-green-600" />
          )}
        </div>
      </td>

      {/* Duration */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 text-brand-dark">
          <ClockIcon className="h-4 w-4 text-brand-muted" />
          <span className="font-medium">{formatDuration(attendee.durationMinutes)}</span>
        </div>
      </td>

      {/* Registered Date */}
      <td className="px-6 py-4">
        <div className="flex flex-col">
          <span className="text-brand-dark font-medium">
            {formatDateTime(attendee.enrolledAt).date}
          </span>
          <span className="text-xs text-brand-muted">
            {formatDateTime(attendee.enrolledAt).time}
          </span>
        </div>
      </td>
    </tr>
  );
}
