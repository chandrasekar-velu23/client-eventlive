import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEvents } from "../hooks/useEvents";
import { useEventAttendance } from "../hooks/useEventAttendance";
import AnalyticsCard from "../components/dashboard/AnalyticsCard";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

/**
 * Analytics Component
 * 
 * Displays comprehensive analytics for a specific event or aggregate.
 */
export default function Analytics() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { events } = useEvents();
  const { analytics, loading, fetchAnalytics, fetchGlobalAnalytics } = useEventAttendance();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadAnalytics = async () => {
      if (eventId) {
        await fetchAnalytics(eventId);
      } else {
        await fetchGlobalAnalytics();
      }
      setIsLoaded(true);
    };

    loadAnalytics();
  }, [eventId, fetchAnalytics, fetchGlobalAnalytics]);

  // Use values based on data source
  const stats = {
    registrations: analytics?.registrations || 0,
    attendanceRate: analytics?.attendanceRate || 0,
    avgDuration: analytics?.avgDuration || 0,
    pollResponses: analytics?.pollResponses || 0,
    totalEvents: analytics?.totalEvents || events.length
  };

  return (
    <section className="space-y-6 animate-fade-in">
      {/* Header */}
      <header className="flex items-center gap-4">
        {eventId && (
          <button
            onClick={() => navigate(`/dashboard/events/${eventId}`)}
            className="p-2 -ml-2 hover:bg-brand-surface rounded-lg transition-colors group"
            title="Back to Event"
          >
            <ArrowLeftIcon className="h-5 w-5 text-brand-muted group-hover:text-brand-dark" />
          </button>
        )}
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Analytics</h1>
          <p className="text-sm text-brand-muted">
            Track engagement and event performance metrics {eventId ? 'for this event' : 'across all events'}
          </p>
        </div>
      </header>

      {/* Loading State */}
      {loading && !isLoaded && (
        <div className="card p-8 text-center">
          <p className="text-brand-muted">Loading analytics...</p>
        </div>
      )}

      {/* Analytics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {!eventId && (
          <AnalyticsCard
            label="Total Events"
            value={stats.totalEvents.toLocaleString()}
            helper="Created by you"
          />
        )}
        <AnalyticsCard
          label="Registrations"
          value={stats.registrations.toLocaleString()}
          helper={eventId ? "Total signups" : "Across all events"}
        />
        <AnalyticsCard
          label="Attendance Rate"
          value={`${stats.attendanceRate}%`}
          helper="Average"
        />
        <AnalyticsCard
          label="Avg Duration"
          value={`${stats.avgDuration} min`}
          helper="Per session"
        />
        <AnalyticsCard
          label="Engagement"
          value={stats.pollResponses.toLocaleString()}
          helper="Total interactions"
        />
      </div>

      {/* Detailed Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Metrics */}
        <div className="card p-8 ring-1 ring-brand-accent/5">
          <h2 className="text-lg font-bold text-brand-dark mb-6">Engagement Breakdown</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-brand-accent/10">
              <span className="text-sm text-brand-muted">Q&A Questions</span>
              <span className="text-lg font-bold text-brand-dark">{stats.pollResponses}</span>
            </div>
            {/* Mock other metrics since backend doesn't track generic 'chat' yet, only questions are proxied to pollResponses */}
            <div className="flex items-center justify-between pb-3 border-b border-brand-accent/10">
              <span className="text-sm text-brand-muted">Active Participants</span>
              <span className="text-lg font-bold text-brand-dark">
                {Math.round((stats.registrations * stats.attendanceRate) / 100)}
              </span>
            </div>
          </div>
        </div>

        {/* Attendance Timeline - Placeholder until timeseries supported */}
        <div className="card p-8 ring-1 ring-brand-accent/5">
          <h2 className="text-lg font-bold text-brand-dark mb-6">System Status</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <div className="flex-1">
                <p className="text-sm font-bold text-brand-dark">Analytics Engine</p>
                <p className="text-xs text-brand-muted">Active & Syncing</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

