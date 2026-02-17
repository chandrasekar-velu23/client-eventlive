import { useEffect, useState, useMemo } from "react";
import { useEvents } from "../hooks/useEvents";
import { formatEventDate, formatEventTime, isEventLive, isEventPast } from "../utils/date";
import { Link } from "react-router-dom";
import {
  PlusIcon,
  CalendarIcon,
  LinkIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  FunnelIcon,
  UserGroupIcon,
  SparklesIcon
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { Listbox, Transition } from "@headlessui/react";
import { Fragment } from "react";
import Button from "../components/ui/Button";

type ViewFilter = "All" | "This Week" | "This Month" | "This Year";

export default function MyEvents() {
  const { events, loading, error, fetchMyEvents, fetchEnrolledEvents, deleteEventData } = useEvents();
  const { user } = useAuth();

  const isOrganizer = user?.role === 'Organizer' || user?.role === 'Admin';

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [viewFilter, setViewFilter] = useState<ViewFilter>("All");

  useEffect(() => {
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
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        e.title?.toLowerCase().includes(q) ||
        e.shortSummary?.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q))
      );
    }
    const now = new Date();
    filtered = filtered.filter(e => {
      const eventDate = new Date(e.startTime); // Standard comparison still needs Date object, but we could wrap this too
      if (viewFilter === "All") return true;
      if (viewFilter === "This Year") return eventDate.getFullYear() === now.getFullYear();
      if (viewFilter === "This Month") {
        return eventDate.getFullYear() === now.getFullYear() && eventDate.getMonth() === now.getMonth();
      }
      if (viewFilter === "This Week") {
        const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
        const lastDay = new Date(now.setDate(now.getDate() - now.getDay() + 6));
        return eventDate >= firstDay && eventDate <= lastDay;
      }
      return true;
    });
    return filtered;
  }, [events, searchQuery, viewFilter]);

  // --- Splitting Logic ---
  const { upcomingEvents, pastEvents } = useMemo(() => {
    // strict comparison using helper functions on the ISO strings
    const upcoming = filteredEvents.filter(e => !isEventPast(e.endTime));
    const past = filteredEvents.filter(e => isEventPast(e.endTime));

    upcoming.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    past.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    return { upcomingEvents: upcoming, pastEvents: past };
  }, [filteredEvents]);

  const hostedEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [filteredEvents]);

  return (
    <section className="space-y-8 animate-fade-in relative min-h-screen pb-24">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-brand-100">
        <div>
          <h1 className="text-3xl font-bold font-display text-brand-950 tracking-tight">
            {isOrganizer ? "Hosted Events" : "My Schedule"}
          </h1>
          <p className="text-brand-500 mt-1 font-medium">
            {isOrganizer ? "Manage and track all your created events." : "View your upcoming sessions and history."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search & Filter Group */}
          <div className="flex items-center bg-white rounded-xl shadow-sm border border-brand-100 p-1">
            <div className={`relative transition-all duration-300 ${isSearchOpen ? "w-48 sm:w-64" : "w-10"}`}>
              {isSearchOpen ? (
                <div className="relative">
                  <input
                    autoFocus
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-3 pr-8 py-1.5 rounded-lg text-sm outline-none bg-transparent placeholder-gray-400"
                    onBlur={() => !searchQuery && setIsSearchOpen(false)}
                  />
                  <button onClick={() => { setSearchQuery(""); setIsSearchOpen(false); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500">
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button onClick={() => setIsSearchOpen(true)} className="w-10 h-9 flex items-center justify-center text-brand-400 hover:text-brand-600">
                  <MagnifyingGlassIcon className="h-5 w-5" />
                </button>
              )}
            </div>

            <div className="w-px h-6 bg-gray-200 mx-1"></div>

            <Listbox value={viewFilter} onChange={setViewFilter}>
              <div className="relative">
                <Listbox.Button className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-brand-700 hover:bg-brand-50 rounded-lg transition-colors">
                  <FunnelIcon className="h-4 w-4 text-brand-400" />
                  <span className="hidden sm:inline">{viewFilter}</span>
                </Listbox.Button>
                <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                  <Listbox.Options className="absolute right-0 mt-2 w-40 overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-black/5 focus:outline-none text-sm z-30">
                    {["All", "This Week", "This Month", "This Year"].map((filter, idx) => (
                      <Listbox.Option key={idx} value={filter} className={({ active }) => `cursor-pointer select-none py-2 px-4 ${active ? 'bg-brand-50 text-brand-900' : 'text-gray-700'}`}>
                        {filter}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            </Listbox>
          </div>

          {isOrganizer && (
            <Link to="/dashboard/create-event">
              <Button className="shadow-lg shadow-brand-500/20">
                <PlusIcon className="h-5 w-5" /> <span className="hidden sm:inline ml-2">New Event</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><div className="animate-spin h-10 w-10 border-4 border-brand-600 border-t-transparent rounded-full" /></div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-100 text-red-600 rounded-xl text-center">
          <p>{error}</p>
          <button onClick={() => isOrganizer ? fetchMyEvents() : fetchEnrolledEvents()} className="mt-2 underline font-bold">Retry</button>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Main List */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1 bg-brand-600 rounded-full" />
              <h2 className="text-xl font-bold text-brand-950 uppercase tracking-wide">
                {isOrganizer ? "Created Events" : "Upcoming Events"}
              </h2>
              <span className="bg-brand-100 text-brand-700 px-2.5 py-0.5 rounded-full text-xs font-bold shadow-sm">
                {(isOrganizer ? hostedEvents : upcomingEvents).length}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
              {(isOrganizer ? hostedEvents : upcomingEvents).length === 0 ? (
                <div className="col-span-full py-16 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100"><CalendarIcon className="h-8 w-8 text-gray-300" /></div>
                  <h3 className="text-lg font-bold text-brand-900">No events found</h3>
                  <p className="text-brand-400 text-sm">Adjust your filters or create a new event.</p>
                </div>
              ) : (
                (isOrganizer ? hostedEvents : upcomingEvents).map(event => (
                  <EventCard key={event.id} event={event} isOrganizer={isOrganizer} onDelete={handleDeleteEvent} onCopyLink={copyEventLink} />
                ))
              )}
            </div>
          </div>

          {/* Past Events (Attendee only) */}
          {!isOrganizer && pastEvents.length > 0 && (
            <div className="space-y-6 pt-8 border-t border-dashed border-brand-100">
              <div className="flex items-center gap-3 opacity-60">
                <div className="h-8 w-1 bg-gray-400 rounded-full" />
                <h2 className="text-xl font-bold text-gray-500 uppercase tracking-wide">History</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75 hover:opacity-100 transition-opacity">
                {pastEvents.map(event => (
                  <EventCard key={event.id} event={event} isOrganizer={false} isPast={true} onDelete={handleDeleteEvent} onCopyLink={copyEventLink} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function EventCard({ event, isOrganizer, onDelete, onCopyLink, isPast }: any) {
  const startDate = new Date(event.startTime);
  const isLive = isEventLive(event.startTime, event.endTime);
  const attendeeCount = event.attendees?.length || 0;

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-brand-100 hover:border-brand-200 group flex flex-col h-full ring-1 ring-black/5">
      <div className="relative h-48 overflow-hidden bg-brand-50">
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10 opacity-60"></div>
        {event.coverImage ? (
          <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center sticky top-0"><SparklesIcon className="h-12 w-12 text-brand-200" /></div>
        )}

        <div className="absolute top-3 right-3 flex gap-2 z-20">
          {isLive && !isPast && (
            <span className="flex items-center gap-1 bg-red-500 text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-lg animate-pulse uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" /> Live
            </span>
          )}
          {event.visibility === 'private' && <span className="bg-black/50 backdrop-blur-md text-white px-2 py-1 rounded-lg text-[10px] font-bold border border-white/10">Private</span>}
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="mb-4">
          <h3 className="font-bold text-brand-950 text-lg line-clamp-1 group-hover:text-brand-600 transition-colors">{event.title}</h3>
          <p className="text-sm text-brand-500 line-clamp-2 mt-1 h-10">{event.shortSummary || event.description || "No description provided."}</p>
        </div>

        <div className="space-y-2 mt-auto text-sm text-brand-400 border-t border-gray-100 pt-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            <span className="font-medium text-brand-700">{formatEventDate(startDate)}</span>
            <span className="text-xs opacity-70">•</span>
            <span>{formatEventTime(startDate, event.timezone)}</span>
          </div>
          <div className="flex items-center gap-2">
            <UserGroupIcon className="h-4 w-4" />
            <span>{attendeeCount} participants</span>
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          {isOrganizer ? (
            <>
              <Link to={`/dashboard/events/${event.id}`} className="flex-1 btn-primary py-2 text-sm justify-center">Manage</Link>
              <button onClick={() => onCopyLink(event.sessionCode)} className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-brand-600 hover:bg-gray-50 transition-colors"><LinkIcon className="h-5 w-5" /></button>
              <button onClick={() => onDelete(event.id)} className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"><TrashIcon className="h-5 w-5" /></button>
            </>
          ) : (
            isLive && !isPast ? (
              <Link to={`/join/${event.sessionCode}`} className="flex-1 btn-primary py-2 text-sm justify-center bg-green-500 hover:bg-green-600 border-transparent shadow-green-500/20">Join Live</Link>
            ) : (
              <Link to={`/dashboard/events/${event.id}`} className="flex-1 btn-secondary py-2 text-sm justify-center">View Details</Link>
            )
          )}
        </div>
      </div>
    </div>
  );
}
