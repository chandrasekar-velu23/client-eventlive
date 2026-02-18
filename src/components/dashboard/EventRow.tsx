import { VideoCameraIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";

type EventRowProps = {
  id: string;
  title: string;
  time: string;
  attendees: number;
  live?: boolean;
};

export default function EventRow({
  id,
  title,
  time,
  attendees,
  live,
}: EventRowProps) {
  return (
    <div className="flex items-center justify-between rounded-xl p-3 hover:bg-surface-50 transition-colors group border border-transparent hover:border-surface-200">
      <div className="flex items-center gap-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg shadow-sm ${live ? 'bg-red-50 text-red-600 ring-1 ring-red-100' : 'bg-surface-100 text-muted ring-1 ring-surface-200'}`}>
          <VideoCameraIcon className="h-5 w-5" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-text-primary group-hover:text-brand-600 transition-colors">
              {title}
            </p>
            {live && (
              <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse ring-2 ring-red-100" />
            )}
          </div>
          <p className="text-xs text-muted font-medium mt-0.5">
            {time} <span className="mx-1.5 opacity-30">|</span> <span className="text-text-primary">{attendees} registered</span>
          </p>
        </div>
      </div>

      <Link
        to={`/dashboard/events/${id}`}
        className={`btn text-xs py-2 px-3 justify-center ${live
          ? "btn-primary bg-red-600 hover:bg-red-700 shadow-red-200 border-transparent text-white"
          : "btn-secondary"
          }`}
      >
        {live ? "Join Now" : "Details"}
      </Link>
    </div>
  );
}
