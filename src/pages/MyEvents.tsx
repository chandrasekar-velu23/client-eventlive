import { useEffect, useState, useMemo } from "react";
import { useEvents } from "../hooks/useEvents";
import { Link } from "react-router-dom";
import {
  PlusIcon,
  CalendarIcon,
  LinkIcon,
  TrashIcon,
  ArrowRightIcon,
  VideoCameraIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  FunnelIcon,
  ClockIcon,
  UserGroupIcon
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { Listbox, Transition } from "@headlessui/react";
import { Fragment } from "react";

type ViewFilter = "All" | "This Week" | "This Month" | "This Year";

export default function MyEvents() {
  const { events, loading, error, fetchMyEvents, fetchEnrolledEvents, deleteEventData } = useEvents();
  const { user } = useAuth();
  /* Removed unused location */

  // Determine role/view mode based on user or route. 
  // User request suggests unified Page, but usually we distinguish by role.
  // Assuming 'isEnrolledView' logic is still valid OR we strictly check user role.
  // The user said "refactor for the both users... instead of having two different route".
  // So let's rely on user role more than route if possible, but keep route flexibility.
  const isOrganizer = user?.role === 'Organizer' || user?.role === 'Admin';

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [viewFilter, setViewFilter] = useState<ViewFilter>("All");

  useEffect(() => {
    // If Organizer, fetch created events. If Attendee, fetch enrolled.
    // We can also allow switching if an organizer wants to see their enrollments, 
    // but per prompt: "Organizer have words like created... Attendee have words like upcoming".
    if (isOrganizer) {
      fetchMyEvents();
    } else {
      fetchEnrolledEvents();
    }
  }, [fetchMyEvents, fetchEnrolledEvents, isOrganizer]);

  const handleDeleteEvent = async (eventId: string) => {
    if (window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      try {
        await deleteEventData(eventId);
        toast.success("Event deleted successfully");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete event");
      }
    }
  };

  const copyEventLink = (sessionCode: string) => {
    const link = `${window.location.origin}/join/${sessionCode}`;
    navigator.clipboard.writeText(link);
    toast.success("Event link copied to clipboard!");
  };

  // --- Filtering Logic ---
  const filteredEvents = useMemo(() => {
    let filtered = events;

    // 1. Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        e.title?.toLowerCase().includes(q) ||
        e.shortSummary?.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q))
      );
    }

    // 2. View/Time Filter
    const now = new Date();
    filtered = filtered.filter(e => {
      const eventDate = new Date(e.startTime);
      if (viewFilter === "All") return true;
      if (viewFilter === "This Year") return eventDate.getFullYear() === now.getFullYear();
      if (viewFilter === "This Month") {
        return eventDate.getFullYear() === now.getFullYear() && eventDate.getMonth() === now.getMonth();
      }
      if (viewFilter === "This Week") {
        // Simple "this week" logic (Sunday to Saturday)
        const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
        const lastDay = new Date(now.setDate(now.getDate() - now.getDay() + 6));
        return eventDate >= firstDay && eventDate <= lastDay;
      }
      return true;
    });

    return filtered;
  }, [events, searchQuery, viewFilter]);

  // --- Splitting Logic (For Attendees) ---
  const { upcomingEvents, pastEvents } = useMemo(() => {
    const now = new Date();
    const upcoming = filteredEvents.filter(e => new Date(e.endTime) >= now);
    const past = filteredEvents.filter(e => new Date(e.endTime) < now);

    // Sort Upcoming: Nearest first
    upcoming.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    // Sort Past: Most recent first
    past.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    return { upcomingEvents: upcoming, pastEvents: past };
  }, [filteredEvents]);

  // For Org: just use filteredEvents (Hosted), usually upcoming first
  const hostedEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [filteredEvents]);

  return (
    <section className="space-y-8 animate-fade-in p-6 bg-gray-50/50 min-h-screen">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-200">
        <div className="flex-1">
          <h1 className="text-3xl font-extrabold text-brand-dark tracking-tight">
            {isOrganizer ? "Hosted Events" : "My Schedule"}
          </h1>
          <p className="text-brand-muted mt-1 text-sm font-medium">
            {isOrganizer
              ? "Manage and track all your created events."
              : "View your upcoming sessions and history."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className={`relative transition-all duration-300 ${isSearchOpen ? "w-64" : "w-10"}`}>
            {isSearchOpen ? (
              <div className="relative">
                <input
                  type="text"
                  autoFocus
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-4 pr-10 py-2 rounded-full border border-brand-primary/20 bg-white text-sm focus:ring-2 focus:ring-brand-primary/20 outline-none shadow-sm"
                  onBlur={() => !searchQuery && setIsSearchOpen(false)}
                />
                <button
                  onClick={() => { setSearchQuery(""); setIsSearchOpen(false); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-red-500"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsSearchOpen(true)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 text-brand-muted hover:text-brand-primary hover:border-brand-primary shadow-sm hover:shadow"
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Filter Dropdown */}
          <Listbox value={viewFilter} onChange={setViewFilter}>
            <div className="relative">
              <Listbox.Button className="relative w-36 py-2.5 pl-4 pr-10 text-left bg-white rounded-lg border border-gray-200 cursor-pointer shadow-sm hover:border-brand-primary/30 sm:text-sm">
                <span className="block truncate font-bold text-brand-dark">{viewFilter}</span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <FunnelIcon className="h-4 w-4 text-brand-muted" aria-hidden="true" />
                </span>
              </Listbox.Button>
              <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                <Listbox.Options className="absolute right-0 mt-1 max-h-60 w-36 overflow-auto rounded-lg bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-20">
                  {["All", "This Week", "This Month", "This Year"].map((filter, idx) => (
                    <Listbox.Option
                      key={idx}
                      className={({ active }) => `relative cursor-pointer select-none py-2 pl-4 pr-4 ${active ? 'bg-brand-surface text-brand-primary' : 'text-brand-dark'}`}
                      value={filter}
                    >
                      {({ selected }) => (
                        <span className={`block truncate ${selected ? 'font-bold' : 'font-normal'}`}>{filter}</span>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          </Listbox>

          {isOrganizer && (
            <Link
              to="/dashboard/create-event"
              className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-lg shadow-lg shadow-brand-primary/20 transition-all hover:scale-105"
            >
              <PlusIcon className="h-5 w-5" />
              <span className="hidden sm:inline font-bold">New Event</span>
            </Link>
          )}
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="py-20 text-center">
          <div className="animate-spin h-10 w-10 border-4 border-brand-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-brand-muted mt-4 font-medium animate-pulse">Loading schedule...</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border border-red-100 text-red-600 p-6 rounded-xl text-center">
          <p>{error}</p>
          <button onClick={() => isOrganizer ? fetchMyEvents() : fetchEnrolledEvents()} className="mt-2 underline font-bold">Retry</button>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-12">

          {/* Section: Hosting (Organizer) OR Upcoming (Attendee) */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1 bg-brand-primary rounded-full" />
              <h2 className="text-xl font-bold text-brand-dark uppercase tracking-wide">
                {isOrganizer ? "Created / Hosted Events" : "Upcoming Events"}
              </h2>
              <span className="bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded text-xs font-bold">
                {isOrganizer ? hostedEvents.length : upcomingEvents.length}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {(isOrganizer ? hostedEvents : upcomingEvents).length === 0 ? (
                <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-200 rounded-xl">
                  <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-brand-muted font-medium">No events found for this filter.</p>
                </div>
              ) : (
                (isOrganizer ? hostedEvents : upcomingEvents).map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    isOrganizer={isOrganizer}
                    onDelete={handleDeleteEvent}
                    onCopyLink={copyEventLink}
                  />
                ))
              )}
            </div>
          </div>

          {/* Section: Past (Attendee Only) */}
          {!isOrganizer && (
            <div className="space-y-6 pt-8 border-t border-dashed border-brand-accent/20">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 bg-brand-muted rounded-full" />
                <h2 className="text-xl font-bold text-brand-muted uppercase tracking-wide">
                  Previously Enrolled
                </h2>
                <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-xs font-bold">
                  {pastEvents.length}
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 opacity-80 hover:opacity-100 transition-opacity">
                {pastEvents.length === 0 ? (
                  <div className="col-span-full py-8 text-center bg-gray-50 rounded-xl">
                    <p className="text-gray-400 text-sm">No past events history.</p>
                  </div>
                ) : (
                  pastEvents.map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      isOrganizer={false}
                      isPast={true}
                      onDelete={handleDeleteEvent}
                      onCopyLink={copyEventLink}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// --- Sub-Component: Event Card ---
function EventCard({ event, isOrganizer, isPast, onDelete, onCopyLink }: any) {
  const isLive = new Date(event.startTime) <= new Date() && new Date(event.endTime) >= new Date();
  const startDate = new Date(event.startTime);

  return (
    <div className={`group relative bg-white rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col ${isPast ? 'border-gray-100' : 'border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-brand-primary/30'}`}>

      {/* Date Badge (Left Stripe) */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isLive ? 'bg-red-500 animate-pulse' : isPast ? 'bg-gray-300' : 'bg-brand-primary'}`} />

      <div className="p-5 pl-7 flex-1 flex flex-col gap-4">
        {/* Top Meta */}
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-brand-primary uppercase tracking-wider mb-1">{event.type || 'Event'}</span>
            <h3 className={`text-lg font-bold text-brand-dark leading-tight line-clamp-2 ${isPast ? 'text-gray-600' : ''}`}>
              {event.title}
            </h3>
          </div>
          {isLive && (
            <div className="flex items-center gap-1 bg-red-50 text-red-600 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border border-red-100">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
              Live
            </div>
          )}
        </div>

        {/* Date Row */}
        <div className="flex items-center gap-x-4 text-sm text-brand-muted py-2 border-y border-dashed border-gray-100">
          <div className="flex items-center gap-1.5">
            <CalendarIcon className="h-4 w-4 text-brand-primary/70" />
            <span>{startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ClockIcon className="h-4 w-4 text-brand-primary/70" />
            <span>{startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        {/* Description or Meta */}
        <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
          {event.shortSummary || event.description || "No description provided."}
        </p>
      </div>

      {/* Footer Actions */}
      <div className="bg-gray-50/50 p-3 pl-7 border-t border-gray-100 flex items-center justify-between gap-3">
        {isOrganizer ? (
          <>
            <div className="flex items-center gap-3 flex-1">
              <Link to={`/dashboard/events/${event.id}`} className="text-xs font-bold text-brand-dark hover:text-brand-primary flex items-center gap-1">
                Manage <ArrowRightIcon className="h-3 w-3" />
              </Link>
              {event.attendees && event.attendees.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-brand-muted">
                  <UserGroupIcon className="h-3.5 w-3.5" />
                  <span className="font-bold">{event.attendees.length}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {event.attendees && event.attendees.length > 0 && (
                <Link
                  to={`/dashboard/attendees/${event.id}`}
                  className="p-1.5 hover:bg-white rounded-md text-gray-400 hover:text-blue-600 transition-colors"
                  title="View Attendees"
                >
                  <UserGroupIcon className="h-4 w-4" />
                </Link>
              )}
              <button onClick={() => onCopyLink(event.sessionCode)} className="p-1.5 hover:bg-white rounded-md text-gray-400 hover:text-brand-primary transition-colors" title="Share">
                <LinkIcon className="h-4 w-4" />
              </button>
              <button onClick={() => onDelete(event.id)} className="p-1.5 hover:bg-white rounded-md text-gray-400 hover:text-red-500 transition-colors" title="Delete">
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </>
        ) : (
          /* Attendee Actions */
          <>
            {isLive ? (
              <Link to={`/session/join/${event.sessionCode}`} className="flex-1 btn-primary py-1.5 text-xs font-bold flex items-center justify-center gap-2">
                <VideoCameraIcon className="h-3 w-3" /> Join Now
              </Link>
            ) : (
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                {isPast ? "Event Ended" : "Scheduled"}
              </span>
            )}
            <Link to={`/dashboard/events/${event.id}`} className="p-2 hover:bg-white rounded-full text-brand-primary/80 hover:text-brand-primary transition-colors">
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
