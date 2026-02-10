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
    <div className="flex items-center justify-between rounded-lg p-3 hover:bg-brand-surface/30 transition-colors group">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-surface text-brand-primary">
          <VideoCameraIcon className="h-4 w-4" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-brand-dark group-hover:text-brand-primary transition-colors">
              {title}
            </p>
            {live && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-black text-red-600 animate-pulse">
                LIVE
              </span>
            )}
          </div>
          <p className="text-xs text-brand-muted">
            {time} · <span className="font-semibold text-brand-dark">{attendees} registered</span>
          </p>
        </div>
      </div>

      <Link
        to={`/dashboard/events/${id}`}
        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all shadow-sm ${live
          ? "bg-red-600 text-white hover:bg-red-700 shadow-red-200"
          : "bg-white border border-brand-accent/20 text-brand-dark hover:border-brand-primary hover:text-brand-primary"
          }`}
      >
        {live ? "Join Session" : "View Details"}
      </Link>
    </div>
  );
}
