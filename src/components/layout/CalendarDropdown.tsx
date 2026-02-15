import { Fragment, useEffect } from 'react';
import { Popover, Transition } from '@headlessui/react';
import { CalendarIcon, ClockIcon, BellAlertIcon } from '@heroicons/react/24/outline';
import { useEvents } from '../../hooks/useEvents';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';

export default function CalendarDropdown() {
    const { user } = useAuth();
    const { events, fetchMyEvents, fetchEnrolledEvents, loading } = useEvents();

    useEffect(() => {
        if (user) {
            if (user.role === 'Organizer' || user.role === 'Admin') {
                fetchMyEvents();
            } else {
                fetchEnrolledEvents();
            }
        }
    }, [user, fetchMyEvents, fetchEnrolledEvents]);

    // Filter for upcoming events and sort by date
    // Ensure events is an array to avoid errors
    const safeEvents = Array.isArray(events) ? events : [];

    const upcomingEvents = safeEvents
        .filter(e => new Date(e.startTime) > new Date())
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
        .slice(0, 5); // Take top 5

    return (
        <Popover className="relative">
            {({ open }) => (
                <>
                    <Popover.Button className={`group relative p-2 rounded-full hover:bg-brand-50 transition-colors outline-none ${open ? 'bg-brand-50 text-brand-primary' : 'text-brand-muted'}`}>
                        <CalendarIcon className="h-6 w-6 group-hover:text-brand-dark transition-colors" />
                        {upcomingEvents.length > 0 && (
                            <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-brand-primary ring-2 ring-white" />
                        )}
                    </Popover.Button>
                    <Transition
                        as={Fragment}
                        enter="transition ease-out duration-200"
                        enterFrom="opacity-0 translate-y-1"
                        enterTo="opacity-100 translate-y-0"
                        leave="transition ease-in duration-150"
                        leaveFrom="opacity-100 translate-y-0"
                        leaveTo="opacity-0 translate-y-1"
                    >
                        <Popover.Panel className="absolute right-0 z-50 mt-4 w-96 transform px-0 lg:max-w-sm">
                            <div className="overflow-hidden rounded-xl shadow-2xl ring-1 ring-black/5 bg-white">
                                <div className="p-4 bg-brand-primary/5 border-b border-brand-primary/10 flex justify-between items-center">
                                    <h3 className="text-sm font-bold text-brand-dark flex items-center gap-2">
                                        <CalendarIcon className="h-4 w-4" /> My Schedule
                                    </h3>
                                    <span className="text-xs font-bold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full">
                                        {upcomingEvents.length} Upcoming
                                    </span>
                                </div>

                                <div className="max-h-[400px] overflow-y-auto">
                                    {loading ? (
                                        <div className="p-8 text-center text-brand-muted text-sm">Loading schedule...</div>
                                    ) : upcomingEvents.length === 0 ? (
                                        <div className="p-8 text-center text-brand-muted text-sm italic">
                                            No upcoming events scheduled.
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-100">
                                            {upcomingEvents.map(event => {
                                                const start = new Date(event.startTime);
                                                const isSoon = (start.getTime() - new Date().getTime()) < 24 * 60 * 60 * 1000; // < 24 hrs

                                                return (
                                                    <div key={event.id} className="p-4 hover:bg-gray-50 transition-colors block">
                                                        <div className="flex gap-4">
                                                            {/* Date Box */}
                                                            <div className="flex flex-col items-center justify-center w-14 h-14 rounded-lg bg-brand-surface border border-brand-accent/20 shrink-0">
                                                                <span className="text-[10px] uppercase font-bold text-brand-primary">{start.toLocaleString('default', { month: 'short' })}</span>
                                                                <span className="text-xl font-black text-brand-dark leading-none">{start.getDate()}</span>
                                                            </div>

                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="text-sm font-bold text-brand-dark truncate">{event.title}</h4>
                                                                <div className="flex items-center gap-2 mt-1 text-xs text-brand-muted">
                                                                    <ClockIcon className="h-3.5 w-3.5" />
                                                                    <span>{start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                </div>

                                                                {isSoon && (
                                                                    <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-amber-600 bg-amber-50 w-fit px-2 py-0.5 rounded-full">
                                                                        <BellAlertIcon className="h-3 w-3" />
                                                                        Happening Soon
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="mt-3 flex gap-2">
                                                            <Link to={`/dashboard/events/${event.id}`} className="flex-1 text-center py-1.5 text-xs font-bold bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-brand-dark transition-colors">
                                                                View Details
                                                            </Link>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
                                    <Link to="/dashboard/events" className="text-xs font-bold text-brand-primary hover:text-brand-dark transition-colors">
                                        View Full Calendar
                                    </Link>
                                </div>
                            </div>
                        </Popover.Panel>
                    </Transition>
                </>
            )}
        </Popover>
    );
}
