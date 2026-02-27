import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDaysIcon,
  UsersIcon,
  VideoCameraIcon,
  ChartBarIcon,
  PlusIcon,
  ArrowTopRightOnSquareIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon
} from "@heroicons/react/24/outline";

import { useAuth } from "../hooks/useAuth";
import { useEvents } from "../hooks/useEvents";
import { useEventAttendance } from "../hooks/useEventAttendance";
import { formatEventDate, formatEventTime, isEventLive } from "../utils/date";
import { useActivityLogs } from "../hooks/useActivityLogs";
import { motion, AnimatePresence } from "framer-motion";

import StatCard from "../components/dashboard/StatCard";
import EventRow from "../components/dashboard/EventRow";
import QuickActionCard from "../components/dashboard/QuickActionCard";


// Helper to get activity configuration
const getActivityConfig = (action: string) => {
  switch (action) {
    case 'User Signup':
    case 'User Login':
      return {
        icon: UsersIcon,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50',
        borderColor: 'border-indigo-100',
        label: action
      };
    case 'Event Created':
      return {
        icon: PlusIcon,
        color: 'text-brand-600',
        bgColor: 'bg-brand-50',
        borderColor: 'border-brand-100',
        label: 'New Event'
      };
    case 'Event Enrollment':
      return {
        icon: CalendarDaysIcon,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-100',
        label: 'Enrollment'
      };
    case 'Profile Update':
    case 'Avatar Update':
      return {
        icon: DocumentTextIcon,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-100',
        label: 'Profile'
      };
    default:
      return {
        icon: ChartBarIcon,
        color: 'text-slate-500',
        bgColor: 'bg-slate-50',
        borderColor: 'border-slate-100',
        label: action
      };
  }
};

export default function Dashboard() {
  const { user } = useAuth();
  const { events, loading, error, fetchMyEvents, fetchEnrolledEvents } = useEvents();
  const { fetchGlobalAnalytics, analytics: globalAnalytics } = useEventAttendance();
  const { logs: activityLogs, loading: logsLoading } = useActivityLogs();

  const isOrganizer = user?.role === 'Organizer' || user?.role === 'Admin';

  const [stats, setStats] = useState({
    totalEvents: 0,
    totalAttendees: 0,
    liveSessions: 0,
    engagementRate: 0,
  });

  const [upcomingEvents, setUpcomingEvents] = useState<typeof events>([]);

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
      {/* Main Content Area */}

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

        {/* Recent Activity Feed - Dynamically fetched logs */}
        <div className="card p-6 h-full flex flex-col border border-slate-100 shadow-sm" style={{ background: '#FFFFFF' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold font-display text-slate-900 border-b-2 border-brand-500/10 pb-1">Activity Feed</h2>
            {activityLogs.length > 0 && (
              <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-indigo-100">
                Live Update
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto pr-1 -mr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            {logsLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-3"></div>
                <p className="text-sm text-slate-400">Loading activities...</p>
              </div>
            ) : activityLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                <div className="p-4 bg-indigo-50 rounded-2xl mb-4 ring-1 ring-indigo-100/50">
                  <ChartBarIcon className="h-8 w-8 text-indigo-400 opacity-60" />
                </div>
                <p className="text-sm text-slate-500 font-medium font-display italic">No activities recorded yet.</p>
              </div>
            ) : (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[19px] top-2 bottom-6 w-px bg-gradient-to-bottom from-slate-200 to-transparent" />

                <ul className="space-y-6">
                  <AnimatePresence mode="popLayout">
                    {activityLogs.slice(0, 7).map((log, idx) => {
                      const config = getActivityConfig(log.action);
                      const Icon = config.icon;

                      return (
                        <motion.li
                          key={log._id || idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="relative pl-12 group"
                        >
                          {/* Indicator Dot/Icon */}
                          <div className={`absolute left-0 top-0.5 z-10 p-1.5 rounded-lg border-2 border-white shadow-sm ring-1 ring-slate-100 ${config.bgColor} ${config.color} transition-all duration-300 group-hover:scale-110`}>
                            <Icon className="h-4 w-4" />
                          </div>

                          <div className="flex flex-col">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                                {config.label}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                {formatEventTime(log.createdAt)}
                              </span>
                            </div>

                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-1">
                              {log.action === 'Event Created' ? `Hosted: ${log.details.title || 'a new event'}` :
                                log.action === 'Event Enrollment' ? `Joined: ${log.details.title || 'an event'}` :
                                  log.action === 'Profile Update' ? `Updated profile details` :
                                    log.action === 'Avatar Update' ? `Changed profile picture` :
                                      `Generic user activity`}
                            </p>
                          </div>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
              </div>
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