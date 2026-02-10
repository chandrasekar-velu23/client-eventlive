import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
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

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useEvents } from "../hooks/useEvents";
import { useEventAttendance } from "../hooks/useEventAttendance";
import { useNotificationContext } from "../context/NotificationContext";
import { type Notification } from "../hooks/useNotifications";

import StatCard from "../components/dashboard/StatCard";
import EventRow from "../components/dashboard/EventRow";
import QuickActionCard from "../components/dashboard/QuickActionCard";

// Helper to get notification configuration
const getNotificationConfig = (type: string) => {
  switch (type) {
    case 'event_created':
      return {
        icon: CalendarDaysIcon,
        color: 'text-green-500',
        bgColor: 'bg-green-500',
        borderColor: 'border-green-500',
        bgSoft: 'bg-green-50',
        label: 'Event Created'
      };
    case 'recording_ready':
      return {
        icon: VideoCameraIcon,
        color: 'text-purple-500',
        bgColor: 'bg-purple-500',
        borderColor: 'border-purple-500',
        bgSoft: 'bg-purple-50',
        label: 'Recording Ready'
      };
    case 'transcript_ready':
      return {
        icon: DocumentTextIcon,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500',
        borderColor: 'border-yellow-500',
        bgSoft: 'bg-yellow-50',
        label: 'Transcript Ready'
      };
    case 'new_enrollment':
    case 'new_attendee':
      return {
        icon: UsersIcon,
        color: 'text-brand-primary',
        bgColor: 'bg-brand-primary',
        borderColor: 'border-brand-primary',
        bgSoft: 'bg-brand-surface',
        label: 'New Enrollment'
      };
    case 'link_request':
      return {
        icon: LinkIcon,
        color: 'text-orange-500',
        bgColor: 'bg-orange-500',
        borderColor: 'border-orange-500',
        bgSoft: 'bg-orange-50',
        label: 'Link Request'
      };
    case 'qa_ready':
      return {
        icon: ChatBubbleLeftRightIcon,
        color: 'text-indigo-500',
        bgColor: 'bg-indigo-500',
        borderColor: 'border-indigo-500',
        bgSoft: 'bg-indigo-50',
        label: 'Q/A Ready'
      };
    default:
      return {
        icon: ChartBarIcon,
        color: 'text-brand-accent',
        bgColor: 'bg-brand-accent',
        borderColor: 'border-brand-accent',
        bgSoft: 'bg-gray-50',
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
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null); // State for modal

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

      const live = events.filter(e => {
        const start = new Date(e.startTime);
        const end = new Date(e.endTime);
        return start <= now && end >= now;
      });

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
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all border border-brand-accent/10">
                  {selectedNotification && (() => {
                    const config = getNotificationConfig(selectedNotification.type);
                    const Icon = config.icon;

                    return (
                      <>
                        <div className="flex justify-between items-start mb-4">
                          <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-brand-dark flex items-center gap-2">
                            <span className={`p-2 rounded-lg ${config.bgSoft}`}>
                              <Icon className={`h-5 w-5 ${config.color}`} />
                            </span>
                            {config.label}
                          </Dialog.Title>
                          <button
                            onClick={() => setSelectedNotification(null)}
                            className="text-brand-muted hover:text-brand-dark transition-colors"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </div>

                        <div className="mt-2 space-y-4">
                          <div>
                            <p className="text-sm font-bold text-brand-dark mb-1">{selectedNotification.title}</p>
                            <p className="text-sm text-brand-muted leading-relaxed">
                              {selectedNotification.message}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-brand-muted bg-brand-surface/50 p-2 rounded border border-brand-accent/10">
                            <CalendarDaysIcon className="h-4 w-4" />
                            {new Date(selectedNotification.timestamp).toLocaleString(undefined, {
                              dateStyle: 'medium',
                              timeStyle: 'short'
                            })}
                          </div>

                          {/* Action Buttons based on context */}
                          <div className="flex gap-3 pt-2">
                            {(selectedNotification.data?.eventId || selectedNotification.data?.eventTitle) && (
                              <Link
                                to={`/dashboard/events/${selectedNotification.data?.eventId || ''}`}
                                className="flex-1 btn-primary text-xs justify-center py-2"
                                onClick={() => setSelectedNotification(null)}
                              >
                                View Event
                                <ArrowTopRightOnSquareIcon className="ml-2 h-3 w-3" />
                              </Link>
                            )}

                            {(selectedNotification.data?.userId || selectedNotification.data?.userEmail) && (
                              <Link
                                to={`/dashboard/attendees?query=${selectedNotification.data?.userEmail || ''}`}
                                className="flex-1 btn-secondary text-xs justify-center py-2"
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* ... (rest of header remains same) ... */}
        <div>
          <h1 className="text-2xl font-bold text-brand-dark tracking-tight">Dashboard</h1>
          <p className="text-sm text-brand-muted">
            Welcome back, <span className="font-bold text-brand-primary">{firstName}!</span>
          </p>
        </div>

        {isOrganizer && (
          <Link
            to="/dashboard/create-event"
            className="btn-primary flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold shadow-lg shadow-brand-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <PlusIcon className="h-5 w-5 stroke-[2.5px]" />
            Create Event
          </Link>
        )}
      </div>

      {/* Stats Grid - Dynamic data from real events */}
      <div className={`grid grid-cols-1 gap-5 ${isOrganizer ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-2'}`}>
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
            />
            <StatCard
              label="Live Now"
              value={stats.liveSessions.toString()}
              helper="Active sessions"
              Icon={VideoCameraIcon}
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
        <div className="card lg:col-span-2 p-6 ring-1 ring-brand-accent/5">
          <div className="mb-6 flex items-center justify-between border-b border-brand-accent/10 pb-4">
            <h2 className="text-lg font-bold text-brand-dark flex items-center gap-2">
              {isOrganizer ? "Upcoming Events" : "My Schedule"}
              <span className="rounded-full bg-brand-surface px-2 py-0.5 text-[10px] font-black text-brand-primary uppercase">
                {upcomingEvents.length > 0 ? "Active" : "None"}
              </span>
            </h2>
            <Link to="/my-events" className="text-xs font-bold text-brand-primary hover:text-brand-muted transition-colors">
              View all
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-8 text-brand-muted">Loading events...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : upcomingEvents.length === 0 ? (
            <div className="text-center py-8 text-brand-muted">
              {isOrganizer ? (
                <>No upcoming events. <Link to="/dashboard/create-event" className="text-brand-primary font-bold">Create one now</Link></>
              ) : (
                <>You haven't enrolled in any events yet. <Link to="/dashboard/all-events" className="text-brand-primary font-bold">Browse Events</Link></>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.slice(0, 3).map((event) => {
                const isLive = new Date(event.startTime) <= new Date() && new Date(event.endTime) >= new Date();
                return (
                  <EventRow
                    key={event.id}
                    id={event.id}
                    title={event.title}
                    time={`${new Date(event.startTime).toLocaleDateString()} ${new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                    attendees={event.attendees?.length || 0}
                    live={isLive}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Activity Feed - Powered by Notifications */}
        <div className="card p-6 bg-brand-surface/20 border-brand-accent/10 h-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-brand-dark">Recent Activity</h2>
            {notifications.length > 0 && (
              <span className="bg-brand-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {notifications.length} New
              </span>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center opacity-60">
              <div className="p-3 bg-brand-surface rounded-full mb-2">
                <ChartBarIcon className="h-6 w-6 text-brand-muted" />
              </div>
              <p className="text-sm text-brand-muted italic">No recent activity.</p>
            </div>
          ) : (
            <ul className="relative space-y-6 before:absolute before:left-2 before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-brand-accent/20">
              {notifications.slice(0, 5).map((note, idx) => {
                const config = getNotificationConfig(note.type);

                return (
                  <li key={note.id || idx} className="relative pl-8 animate-fade-in group">
                    <button
                      onClick={() => setSelectedNotification(note)}
                      className="text-left w-full focus:outline-none"
                    >
                      <span className={`absolute left-0 top-1 h-4 w-4 rounded-full border-4 border-white shadow-sm ${config.borderColor} ${config.bgColor} group-hover:scale-110 transition-transform`} />
                      <div className="flex flex-col group-hover:translate-x-1 transition-transform duration-200">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-bold text-brand-dark opacity-90">{note.title}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${config.bgSoft} ${config.color} font-bold`}>
                            {config.label}
                          </span>
                        </div>
                        <span className="text-sm text-brand-muted group-hover:text-brand-dark transition-colors line-clamp-2">{note.message}</span>
                        <p className="text-[10px] text-brand-muted mt-1 font-medium">{new Date(note.timestamp).toLocaleTimeString()}</p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Quick Actions Footer */}
      <div className="pt-4">
        <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-brand-muted">
          Quick Actions
        </h2>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {isOrganizer ? (
            <>
              <QuickActionCard label="Create Event" Icon={PlusIcon} to="/dashboard/create-event" />
              <QuickActionCard label="View Analytics" Icon={ChartBarIcon} to="/dashboard/analytics" />
              <QuickActionCard label="Manage Events" Icon={CalendarDaysIcon} to="/dashboard/events" />
              <QuickActionCard label="View Attendees" Icon={UsersIcon} to="/dashboard/attendees" />
            </>
          ) : (
            <>
              <QuickActionCard label="Browse Events" Icon={CalendarDaysIcon} to="/dashboard/all-events" />
              <QuickActionCard label="My Profile" Icon={UsersIcon} to="/dashboard/settings" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}