import { Fragment, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Link } from "react-router-dom";
import {
  CalendarDaysIcon,
  UsersIcon,
  VideoCameraIcon,
  ChartBarIcon,
  PlusIcon,
  XMarkIcon,
  ArrowTopRightOnSquareIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  LinkIcon
} from "@heroicons/react/24/outline";

import { useAuth } from "../hooks/useAuth";
import { useEvents } from "../hooks/useEvents";
import { useEventAttendance } from "../hooks/useEventAttendance";
import { useNotificationContext } from "../context/NotificationContext";
import { type Notification } from "../hooks/useNotifications";
import { formatEventDate, formatEventTime, isEventLive } from "../utils/date";

import StatCard from "../components/dashboard/StatCard";
import EventRow from "../components/dashboard/EventRow";
import QuickActionCard from "../components/dashboard/QuickActionCard";

// Helper to get notification configuration
const getNotificationConfig = (type: string) => {
  switch (type) {
    case 'event_created':
      return {
        icon: CalendarDaysIcon,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        borderColor: 'border-green-200',
        bgSoft: 'bg-green-50',
        label: 'Event Created'
      };
    case 'recording_ready':
      return {
        icon: VideoCameraIcon,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        borderColor: 'border-purple-200',
        bgSoft: 'bg-purple-50',
        label: 'Recording Ready'
      };
    case 'transcript_ready':
      return {
        icon: DocumentTextIcon,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        borderColor: 'border-yellow-200',
        bgSoft: 'bg-yellow-50',
        label: 'Transcript Ready'
      };
    case 'new_enrollment':
    case 'new_attendee':
      return {
        icon: UsersIcon,
        color: 'text-brand-600',
        bgColor: 'bg-brand-100',
        borderColor: 'border-brand-200',
        bgSoft: 'bg-brand-50',
        label: 'New Enrollment'
      };
    case 'link_request':
      return {
        icon: LinkIcon,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        borderColor: 'border-orange-200',
        bgSoft: 'bg-orange-50',
        label: 'Link Request'
      };
    case 'qa_ready':
      return {
        icon: ChatBubbleLeftRightIcon,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-100',
        borderColor: 'border-indigo-200',
        bgSoft: 'bg-indigo-50',
        label: 'Q/A Ready'
      };
    default:
      return {
        icon: ChartBarIcon,
        color: 'text-surface-600',
        bgColor: 'bg-surface-100',
        borderColor: 'border-surface-200',
        bgSoft: 'bg-surface-50',
        label: 'Notification'
      };
  }
};

export default function Dashboard() {
  const { user } = useAuth();
  const { events, loading, error, fetchMyEvents, fetchEnrolledEvents } = useEvents();
  const { fetchGlobalAnalytics, analytics: globalAnalytics } = useEventAttendance();
  const { notifications } = useNotificationContext();

  const isOrganizer = user?.role === 'Organizer' || user?.role === 'Admin';

  const [stats, setStats] = useState({
    totalEvents: 0,
    totalAttendees: 0,
    liveSessions: 0,
    engagementRate: 0,
  });

  const [upcomingEvents, setUpcomingEvents] = useState<typeof events>([]);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  const firstName = user?.name ? user.name.split(" ")[0] : (isOrganizer ? "Organizer" : "Attendee");

  useEffect(() => {
    const fetch = isOrganizer ? fetchMyEvents : fetchEnrolledEvents;
    fetch().catch((err: any) => {
      console.error("Failed to load events:", err);
    });

    if (isOrganizer) {
      fetchGlobalAnalytics();
    }
  }, [fetchMyEvents, fetchEnrolledEvents, isOrganizer, fetchGlobalAnalytics]);

  useEffect(() => {
    if (events.length >= 0) {
      const now = new Date();

      // Filter & Sort
      const upcoming = events
        .filter(e => new Date(e.endTime) > now)
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

      const live = events.filter(e => isEventLive(e.startTime, e.endTime));

      setUpcomingEvents(upcoming);

      // Real-time calculation from DB data
      const totalAttendees = events.reduce((sum, event) => sum + (event.attendees?.length || 0), 0);

      setStats({
        totalEvents: events.length,
        totalAttendees,
        liveSessions: live.length,
        engagementRate: globalAnalytics ? globalAnalytics.attendanceRate : 0,
      });
    }
  }, [events, globalAnalytics]);

  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* Notification Details Modal */}
      <Transition appear show={!!selectedNotification} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setSelectedNotification(null)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
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
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all border border-surface-200">
                  {selectedNotification && (() => {
                    const config = getNotificationConfig(selectedNotification.type);
                    const Icon = config.icon;

                    return (
                      <>
                        <div className="flex justify-between items-start mb-4">
                          <Dialog.Title as="h3" className="text-lg font-bold font-display leading-6 text-slate-900 flex items-center gap-2">
                            <span className={`p-2 rounded-lg ${config.bgSoft}`}>
                              <Icon className={`h-5 w-5 ${config.color}`} />
                            </span>
                            {config.label}
                          </Dialog.Title>
                          <button
                            onClick={() => setSelectedNotification(null)}
                            className="text-muted hover:text-default transition-colors p-1 rounded-full hover:bg-surface-50"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </div>

                        <div className="mt-2 space-y-4">
                          <div>
                            <p className="text-sm font-bold text-slate-900 mb-1">{selectedNotification.title}</p>
                            <p className="text-sm text-muted leading-relaxed">
                              {selectedNotification.message}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-muted font-medium bg-surface-50 p-2 rounded border border-surface-200">
                            <CalendarDaysIcon className="h-4 w-4" />
                            {`${formatEventDate(selectedNotification.timestamp)} • ${formatEventTime(selectedNotification.timestamp)}`}
                          </div>

                          {/* Action Buttons based on context */}
                          <div className="flex gap-3 pt-2">
                            {(selectedNotification.data?.eventId || selectedNotification.data?.eventTitle) && (
                              <Link
                                to={`/dashboard/events/${selectedNotification.data?.eventId || ''}`}
                                className="flex-1 btn-primary text-xs justify-center py-2 no-underline"
                                onClick={() => setSelectedNotification(null)}
                              >
                                View Event
                                <ArrowTopRightOnSquareIcon className="ml-2 h-3 w-3" />
                              </Link>
                            )}

                            {(selectedNotification.data?.userId || selectedNotification.data?.userEmail) && (
                              <Link
                                to={`/dashboard/attendees?query=${selectedNotification.data?.userEmail || ''}`}
                                className="flex-1 btn-secondary text-xs justify-center py-2 no-underline"
                                onClick={() => setSelectedNotification(null)}
                              >
                                View Attendee
                              </Link>
                            )}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Header Section with Reactive Welcome */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-muted mt-1">
            Welcome back, <span className="font-semibold text-brand-600">{firstName}!</span> Here's what's happening today.
          </p>
        </div>

        {isOrganizer && (
          <Link
            to="/dashboard/create-event"
            className="btn-primary flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold shadow-lg shadow-brand-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <PlusIcon className="h-5 w-5 stroke-[2.5px]" />
            Create Event
          </Link>
        )}
      </div>

      {/* Stats Grid - Dynamic data from real events */}
      <div className={`grid grid-cols-1 gap-6 ${isOrganizer ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-2'}`}>
        <StatCard
          label={isOrganizer ? "Total Events" : "Enrolled Events"}
          value={stats.totalEvents.toString()}
          helper={isOrganizer ? "Created by you" : "Upcoming events"}
          Icon={CalendarDaysIcon}
        />

        {isOrganizer && (
          <>
            <StatCard
              label="Total Attendees"
              value={stats.totalAttendees.toLocaleString()}
              helper="Enrolled users"
              Icon={UsersIcon}
            // color="text-brand-600"
            // bgColor="bg-brand-50"
            />
            <StatCard
              label="Live Now"
              value={stats.liveSessions.toString()}
              helper="Active sessions"
              Icon={VideoCameraIcon}
            // color="text-red-500"
            // bgColor="bg-red-50"
            />
            <StatCard
              label="Engagement Rate"
              value={`${stats.engagementRate}%`}
              helper="Avg. participation"
              Icon={ChartBarIcon}
            />
          </>
        )}

        {!isOrganizer && (
          <StatCard
            label="Live Sessions"
            value={stats.liveSessions.toString()}
            helper="Happening right now"
            Icon={VideoCameraIcon}
          />
        )}
      </div>

      {/* Main Content: Split View */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Upcoming Events Panel - Displays user's created events */}
        <div className="card lg:col-span-2 p-6 h-full relative overflow-hidden group">
          {/* Decorative generic gradient background for card header area if desired */}
          {/* <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" /> */}

          <div className="mb-6 flex items-center justify-between border-b border-surface-100 pb-4">
            <h2 className="text-lg font-bold font-display text-slate-900 flex items-center gap-3">
              {isOrganizer ? "Upcoming Events" : "My Schedule"}
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${upcomingEvents.length > 0 ? "bg-brand-50 text-brand-600" : "bg-surface-100 text-muted"}`}>
                {upcomingEvents.length > 0 ? "Active" : "None"}
              </span>
            </h2>
            <Link to={isOrganizer ? "/dashboard/events" : "/dashboard/all-events"} className="text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors flex items-center gap-1">
              View all <ArrowTopRightOnSquareIcon className="h-3 w-3" />
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted animate-pulse">Loading events...</div>
          ) : error ? (
            <div className="text-center py-12 text-red-500 bg-red-50 rounded-xl border border-red-100">{error}</div>
          ) : upcomingEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-surface-50 rounded-full flex items-center justify-center mb-4 text-surface-400">
                <CalendarDaysIcon className="h-8 w-8" />
              </div>
              <p className="text-muted mb-4 max-w-xs mx-auto">
                {isOrganizer ? "You don't have any upcoming events scheduled." : "You haven't enrolled in any upcoming events."}
              </p>
              {isOrganizer ? (
                <Link to="/dashboard/create-event" className="btn-primary text-sm px-4 py-2">Create Event</Link>
              ) : (
                <Link to="/dashboard/all-events" className="btn-primary text-sm px-4 py-2">Browse Events</Link>
              )}
            </div>
          ) : (
            <div className="space-y-3 relative z-10">
              {upcomingEvents.slice(0, 3).map((event) => {
                return (
                  <EventRow
                    key={event.id}
                    id={event.id}
                    title={event.title}
                    time={`${formatEventDate(event.startTime)} ${formatEventTime(event.startTime, event.timezone)}`}
                    attendees={event.attendees?.length || 0}
                    live={isEventLive(event.startTime, event.endTime)}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Activity Feed - Powered by Notifications */}
        <div className="card p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold font-display text-slate-900">Recent Activity</h2>
            {notifications.length > 0 && (
              <span className="bg-brand-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm shadow-brand-500/20">
                {notifications.length} New
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto pr-1 -mr-2 scrollbar-thin scrollbar-thumb-surface-200 scrollbar-track-transparent">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                <div className="p-3 bg-surface-50 rounded-full mb-3 ring-1 ring-surface-100">
                  <ChartBarIcon className="h-6 w-6 text-muted" />
                </div>
                <p className="text-sm text-muted font-medium italic">No recent activity.</p>
              </div>
            ) : (
              <ul className="relative space-y-6 before:absolute before:left-[17px] before:top-2 before:h-[calc(100%-20px)] before:w-px before:bg-surface-200">
                {notifications.slice(0, 5).map((note, idx) => {
                  const config = getNotificationConfig(note.type);

                  return (
                    <li key={note.id || idx} className="relative pl-10 animate-fade-in group">
                      <button
                        onClick={() => setSelectedNotification(note)}
                        className="text-left w-full focus:outline-none"
                      >
                        <span className={`absolute left-2 top-1.5 h-3 w-3 rounded-full border-2 border-white ring-1 ring-surface-200 shadow-sm ${config.borderColor} ${config.bgColor} group-hover:scale-125 transition-transform duration-300 z-10`} />
                        <div className="flex flex-col group-hover:translate-x-1 transition-transform duration-200">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-slate-900 opacity-90 line-clamp-1">{note.title}</span>
                          </div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-muted opacity-70 mb-1 block">
                            {config.label}
                          </span>
                          <span className="text-sm text-muted group-hover:text-slate-900 transition-colors line-clamp-2 leading-relaxed mb-1">{note.message}</span>
                          <p className="text-[10px] text-muted/60 font-medium">{formatEventTime(note.timestamp)}</p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions Footer */}
      <div className="pt-4">
        <h2 className="mb-4 text-xs font-black uppercase tracking-widest text-muted">
          Quick Actions
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isOrganizer ? (
            <>
              <QuickActionCard
                label="Create Event"
                Icon={PlusIcon}
                to="/dashboard/create-event"
                description="Host a new session"
              />
              <QuickActionCard
                label="Manage Events"
                Icon={CalendarDaysIcon}
                to="/dashboard/events"
                description="Edit upcoming events"
              />
              <QuickActionCard
                label="View Attendees"
                Icon={UsersIcon}
                to="/dashboard/attendees"
                description="Check enrollment list"
              />
              <QuickActionCard
                label="Settings"
                Icon={UsersIcon}
                to="/dashboard/settings"
                description="Manage your profile"
              />
            </>
          ) : (
            <>
              <QuickActionCard
                label="Browse Events"
                Icon={CalendarDaysIcon}
                to="/dashboard/all-events"
                description="Discover new sessions"
              />
              <QuickActionCard
                label="My Enrollments"
                Icon={UsersIcon}
                to="/dashboard/enrolled"
                description="View joined events"
              />
              <QuickActionCard
                label="Profile Settings"
                Icon={UsersIcon}
                to="/dashboard/settings"
                description="Update account details"
              />
              {/* Optional 4th card for attendees to balance grid */}
              <QuickActionCard
                label="Support"
                Icon={ChatBubbleLeftRightIcon}
                onClick={() => { }} // Placeholder
                description="Get help & Support"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}