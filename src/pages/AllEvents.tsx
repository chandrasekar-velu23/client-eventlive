import { useEffect, useState, useMemo, Fragment } from "react";
import { useLocation } from "react-router-dom";
import { useEvents } from "../hooks/useEvents";
import { toast } from "sonner";
import {
  MagnifyingGlassIcon,
  HeartIcon,
  CalendarIcon,
  UsersIcon,
  SparklesIcon,
  FunnelIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { Dialog, Transition, Listbox } from "@headlessui/react";
import { enrollEvent as enrollEventApi, toggleFavorite as toggleFavoriteApi, getFavorites as getFavoritesApi } from "../services/api";
import type { EventData } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function AllEvents() {
  const { events: apiEvents, loading, error, fetchAllEvents } = useEvents();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<(EventData & { id: string }) | null>(null);
  const [enrollLoading, setEnrollLoading] = useState(false);

  // Load Events
  useEffect(() => {
    fetchAllEvents();
  }, [fetchAllEvents]);

  // Load Favorites
  useEffect(() => {
    const loadFavorites = async () => {
      if (user) {
        try {
          const favs = await getFavoritesApi();
          setFavorites(favs);
        } catch (err) {
          console.error("Failed to load favorites", err);
        }
      }
    };
    loadFavorites();
  }, [user]);

  // Extract unique event categories for filter
  const eventCategories = useMemo(() => {
    const categories = new Set(apiEvents.map(e => e.category || "Other"));
    return ["All", ...Array.from(categories)];
  }, [apiEvents]);

  const filteredEvents = useMemo(() => {
    return apiEvents.filter((event) => {
      const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedType === "All" || event.category === selectedType;

      return matchesSearch && matchesCategory;
    });
  }, [apiEvents, searchQuery, selectedType]);


  const handleToggleFavorite = async (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation();
    if (!user) {
      toast.error("Please login to save events");
      return;
    }

    // Optimistic update
    const isFav = favorites.includes(eventId);
    setFavorites(prev => isFav ? prev.filter(id => id !== eventId) : [...prev, eventId]);

    try {
      const updatedFavs = await toggleFavoriteApi(eventId);
      setFavorites(updatedFavs);
      toast.success(isFav ? "Removed from favorites" : "Added to favorites");
    } catch (err) {
      // Revert on error
      setFavorites(prev => isFav ? [...prev, eventId] : prev.filter(id => id !== eventId));
      toast.error("Failed to update favorite");
    }
  };

  const handleEnroll = async () => {
    if (!selectedEvent) return;
    if (!user) {
      toast.error("Please login to enroll");
      navigate("/login");
      return;
    }

    setEnrollLoading(true);
    try {
      await enrollEventApi(selectedEvent.id);
      toast.success("Enrolled successfully! Check your email for details.");
      setSelectedEvent(null);
      fetchAllEvents(); // Refresh to update attendee count/status
    } catch (err: any) {
      toast.error(err.message || "Failed to enroll");
    } finally {
      setEnrollLoading(false);
    }
  };

  const isEnrolled = (event: EventData & { id: string }) => {
    if (!user) return false;
    return event.attendees?.includes(user?.id || "");
  };

  const location = useLocation();
  const isDashboard = location.pathname.includes("/dashboard");

  return (
    <main className={isDashboard ? "animate-fade-in" : "min-h-screen bg-bg-secondary"}>
      <div className={isDashboard ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 animate-fade-in"}>
        {/* Header Section */}
        <div className="mb-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <h1 className={`${isDashboard ? "text-3xl" : "text-4xl md:text-5xl"} font-bold text-brand-dark mb-3`}>
                Discover Events
              </h1>
              <p className="text-lg text-brand-muted max-w-2xl">
                Browse and join exciting virtual events from all organizers.
              </p>
            </div>

            {/* Filter Dropdown */}
            <div className="w-full md:w-64 relative z-20">
              <Listbox value={selectedType} onChange={setSelectedType}>
                <div className="relative mt-1">
                  <Listbox.Button className="relative w-full cursor-default rounded-xl bg-white py-3 pl-4 pr-10 text-left shadow-sm focus:outline-none focus-visible:border-brand-primary focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary sm:text-sm border border-gray-200">
                    <span className="block truncate font-medium text-brand-dark"><span className="text-brand-muted font-normal">Category:</span> {selectedType}</span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <FunnelIcon className="h-5 w-5 text-brand-muted" aria-hidden="true" />
                    </span>
                  </Listbox.Button>
                  <Transition
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-50">
                      {eventCategories.map((type, typeIdx) => (
                        <Listbox.Option
                          key={typeIdx}
                          className={({ active }) =>
                            `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-brand-surface text-brand-primary' : 'text-brand-dark'
                            }`
                          }
                          value={type}
                        >
                          {({ selected }) => (
                            <>
                              <span className={`block truncate ${selected ? 'font-bold' : 'font-normal'}`}>
                                {type}
                              </span>
                              {selected ? (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-brand-primary">
                                  <SparklesIcon className="h-5 w-5" aria-hidden="true" />
                                </span>
                              ) : null}
                            </>
                          )}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Transition>
                </div>
              </Listbox>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-brand-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Search events by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 bg-white text-brand-dark placeholder-brand-muted focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-brand-primary mb-4"></div>
            <p className="text-brand-muted text-lg">Loading events...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500 bg-red-50 rounded-xl border border-red-100">
            <p className="font-bold">{error}</p>
            <button onClick={() => fetchAllEvents()} className="mt-2 underline">Retry</button>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-brand-surface/50 border border-brand-accent/20 rounded-xl p-16 text-center">
            <SparklesIcon className="h-16 w-16 text-brand-muted/20 mx-auto mb-4" />
            <p className="text-brand-dark font-bold mb-2 text-xl">
              {searchQuery ? "No events found" : "No events available"}
            </p>
            <p className="text-brand-muted max-w-md mx-auto">
              Check back soon for new events or try adjusting your filters.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <p className="text-base font-medium text-brand-dark">
                <span className="text-brand-primary font-bold text-lg">{filteredEvents.length}</span>
                {" "}
                event{filteredEvents.length !== 1 ? "s" : ""} found
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max">
              {filteredEvents.map((event) => {
                const isFavorite = favorites.includes(event.id);
                const startDate = new Date(event.startTime);
                const isUpcoming = startDate > new Date();
                const attendeeCount = event.attendees?.length || 0;

                return (
                  <div
                    key={event.id}
                    className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-brand-primary/20 hover:shadow-sm transition-all duration-300 group flex flex-col h-full cursor-pointer"
                    onClick={() => setSelectedEvent(event)}
                  >
                    {/* Cover Image */}
                    <div className="relative h-48 overflow-hidden bg-brand-surface">
                      <div className="absolute inset-0 bg-linear-to-br from-brand-primary/10 to-brand-accent/10" />
                      {event.coverImage ? (
                        <img
                          src={event.coverImage}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <SparklesIcon className="h-12 w-12 text-brand-primary/20" />
                        </div>
                      )}

                      <div className="absolute top-3 right-3 flex gap-2">
                        {isUpcoming && <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">Upcoming</div>}
                        {event.category && <div className="bg-brand-primary text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">{event.category}</div>}
                      </div>
                    </div>

                    <div className="p-5 flex flex-col grow space-y-4">
                      <div className="space-y-2">
                        <h3 className="font-bold text-brand-dark text-lg line-clamp-2 group-hover:text-brand-primary transition-colors">
                          {event.title}
                        </h3>
                        <p className="text-sm text-brand-muted line-clamp-2 leading-relaxed">
                          {event.description}
                        </p>
                      </div>

                      <div className="space-y-2.5 text-sm text-brand-muted border-t border-gray-100 pt-4">
                        <div className="flex items-center gap-3">
                          <CalendarIcon className="h-4 w-4 shrink-0 text-brand-primary" />
                          <span>{startDate.toLocaleDateString()} at {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <UsersIcon className="h-4 w-4 shrink-0 text-brand-primary" />
                          <span>{attendeeCount} enrolled</span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4 border-t border-gray-100 mt-auto">
                        <button
                          onClick={(e) => handleToggleFavorite(e, event.id)}
                          className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${isFavorite
                            ? "bg-red-50 text-red-500 border border-red-100"
                            : "bg-gray-50 text-brand-muted border border-gray-200 hover:bg-gray-100"
                            }`}
                        >
                          {isFavorite ? <HeartIconSolid className="h-4 w-4" /> : <HeartIcon className="h-4 w-4" />}
                          <span>{isFavorite ? "Saved" : "Save"}</span>
                        </button>
                        <button className="flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm bg-brand-primary text-white hover:bg-brand-primary/90 transition-all duration-200 hover:shadow-md active:scale-95">
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Event Details Modal */}
      <Transition appear show={!!selectedEvent} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setSelectedEvent(null)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30 backdrop-blur-xs" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                  {selectedEvent && (
                    <>
                      <div className="relative h-48 sm:h-64 bg-brand-surface">
                        {selectedEvent.coverImage ? (
                          <img src={selectedEvent.coverImage} alt={selectedEvent.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-brand-gradient">
                            <SparklesIcon className="h-16 w-16 text-white/50" />
                          </div>
                        )}
                        <button
                          onClick={() => setSelectedEvent(null)}
                          className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="p-6 md:p-8 space-y-6">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="bg-brand-primary/10 text-brand-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                              {selectedEvent.type || "Event"}
                            </span>
                            {isEnrolled(selectedEvent) && (
                              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                <SparklesIcon className="h-3 w-3" /> Enrolled
                              </span>
                            )}
                          </div>
                          <Dialog.Title as="h3" className="text-2xl md:text-3xl font-bold text-brand-dark leading-tight">
                            {selectedEvent.title}
                          </Dialog.Title>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-y border-gray-100">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-brand-surface rounded-lg text-brand-primary">
                              <CalendarIcon className="h-6 w-6" />
                            </div>
                            <div>
                              <p className="text-xs text-brand-muted font-bold uppercase">Date & Time</p>
                              <p className="text-sm font-medium text-brand-dark">
                                {new Date(selectedEvent.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-brand-surface rounded-lg text-brand-primary">
                              <UsersIcon className="h-6 w-6" />
                            </div>
                            <div>
                              <p className="text-xs text-brand-muted font-bold uppercase">Attendees</p>
                              <p className="text-sm font-medium text-brand-dark">
                                {selectedEvent.attendees?.length || 0} Registered
                              </p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-lg font-bold text-brand-dark mb-2">About this event</h4>
                          <p className="text-brand-muted leading-relaxed whitespace-pre-wrap">
                            {selectedEvent.description}
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-4 flex gap-4">
                          <button
                            onClick={handleEnroll}
                            disabled={enrollLoading || isEnrolled(selectedEvent)}
                            className={`flex-1 py-3 px-6 rounded-xl font-bold text-white shadow-lg shadow-brand-primary/20 transition-all ${isEnrolled(selectedEvent)
                              ? "bg-green-500 cursor-default"
                              : "bg-brand-primary hover:bg-brand-primary/90 hover:scale-[1.02] active:scale-[0.98]"
                              } ${enrollLoading ? "opacity-70 cursor-wait" : ""}`}
                          >
                            {enrollLoading ? "Enrolling..." : isEnrolled(selectedEvent) ? "You are Enrolled!" : "Enroll Now"}
                          </button>
                          <button
                            onClick={() => setSelectedEvent(null)}
                            className="px-6 py-3 rounded-xl font-bold text-brand-muted hover:bg-gray-100 transition-colors"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </main>
  );
}
