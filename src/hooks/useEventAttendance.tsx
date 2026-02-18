import { useState, useCallback } from "react";
import {
  getEventAttendees,
  enrollEvent,
  getEventAnalytics,
  getAllMyAttendees,
  getGlobalAnalytics,
  getEventAttendanceLogs,
  getEventAttendanceStats,
} from "../services/api";

export interface AttendeeData {
  id: string;
  name: string;
  email: string;
  enrolledAt: string;
  eventTitle?: string;
  eventCategory?: string;
  status?: string;
  durationMinutes?: number;
  checkInTime?: string;
  checkOutTime?: string;
  avatar?: string;
}

export interface AttendanceLog {
  _id: string;
  eventId: string;
  sessionId: string;
  userId: string;
  userEmail: string;
  userName: string;
  checkInTime: string;
  checkOutTime?: string;
  durationMinutes?: number;
  status: "active" | "completed";
  ipAddress?: string;
  userAgent?: string;
}

export interface AttendanceStats {
  uniqueAttendees: number;
  totalCheckIns: number;
  activeNow: number;
  avgDuration: number;
}

export interface FilterOptions {
  eventType?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  minDuration?: number;
  maxDuration?: number;
  searchQuery?: string;
}

/**
 * Custom hook for managing event attendance and analytics
 */
export const useEventAttendance = () => {
  const [attendees, setAttendees] = useState<AttendeeData[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);

  const [analytics, setAnalytics] = useState<{
    registrations: number;
    attendanceRate: number;
    avgDuration: number;
    pollResponses: number;
    totalEvents?: number;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({});

  /**
   * Fetch attendees for a specific event
   */
  const fetchAttendees = useCallback(async (eventId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getEventAttendees(eventId);
      const mapped = (response || []).map((a: any) => ({
        id: a._id || a.id,
        name: a.name,
        email: a.email,
        enrolledAt: a.enrolledAt,
        eventTitle: a.eventTitle,
        eventCategory: a.eventCategory,
        status: a.status,
        durationMinutes: a.durationMinutes,
        checkInTime: a.checkInTime,
        checkOutTime: a.checkOutTime,
      }));
      setAttendees(mapped);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch attendees";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch ALL attendees across all events
   */
  const fetchAllAttendees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAllMyAttendees();
      setAttendees(
        response.map((a: any) => ({
          id: a._id,
          name: a.name,
          email: a.email,
          enrolledAt: a.enrolledAt,
          eventTitle: a.eventTitle,
          eventCategory: a.eventCategory,
          status: a.status,
          durationMinutes: a.durationMinutes,
          avatar: a.avatar,
          checkInTime: a.checkInTime || undefined,
          checkOutTime: a.checkOutTime || undefined,
        })) || []
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch all attendees";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch attendance logs for an event
   */
  const fetchAttendanceLogs = useCallback(async (eventId: string, limit: number = 500) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getEventAttendanceLogs(eventId, limit);
      setAttendanceLogs(response || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch attendance logs";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch attendance statistics for an event
   */
  const fetchAttendanceStats = useCallback(async (eventId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getEventAttendanceStats(eventId);
      setAttendanceStats(response || null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch attendance statistics";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Enroll current user in an event
   */
  const enrollInEvent = useCallback(async (eventId: string) => {
    setLoading(true);
    setError(null);
    try {
      await enrollEvent(eventId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to enroll in event";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch analytics for a specific event
   */
  const fetchAnalytics = useCallback(async (eventId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getEventAnalytics(eventId);
      setAnalytics(response || null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch analytics";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch global analytics
   */
  const fetchGlobalAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getGlobalAnalytics();
      setAnalytics(response || null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch global analytics";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Apply filters to attendees
   */
  const applyFilters = useCallback(
    (attendeeList: AttendeeData[], filterOptions: FilterOptions): AttendeeData[] => {
      let filtered = [...attendeeList];

      // Search query
      if (filterOptions.searchQuery) {
        const query = filterOptions.searchQuery.toLowerCase();
        filtered = filtered.filter(
          (a) =>
            a.name.toLowerCase().includes(query) ||
            a.email.toLowerCase().includes(query) ||
            (a.eventTitle && a.eventTitle.toLowerCase().includes(query))
        );
      }

      // Event type
      if (filterOptions.eventType) {
        filtered = filtered.filter((a) => a.eventCategory === filterOptions.eventType);
      }

      // Status
      if (filterOptions.status) {
        filtered = filtered.filter((a) => a.status === filterOptions.status);
      }

      // Date range
      if (filterOptions.dateFrom) {
        const fromDate = new Date(filterOptions.dateFrom);
        filtered = filtered.filter((a) => new Date(a.enrolledAt) >= fromDate);
      }

      if (filterOptions.dateTo) {
        const toDate = new Date(filterOptions.dateTo);
        toDate.setHours(23, 59, 59, 999); // End of day
        filtered = filtered.filter((a) => new Date(a.enrolledAt) <= toDate);
      }

      // Duration range
      if (filterOptions.minDuration !== undefined) {
        filtered = filtered.filter(
          (a) => (a.durationMinutes || 0) >= filterOptions.minDuration!
        );
      }

      if (filterOptions.maxDuration !== undefined) {
        filtered = filtered.filter(
          (a) => (a.durationMinutes || 0) <= filterOptions.maxDuration!
        );
      }

      return filtered;
    },
    []
  );

  /**
   * Get filtered attendees
   */
  const getFilteredAttendees = useCallback(() => {
    return applyFilters(attendees, filters);
  }, [attendees, filters, applyFilters]);

  return {
    attendees,
    attendanceLogs,
    attendanceStats,
    analytics,
    loading,
    error,
    filters,
    setFilters,
    fetchAttendees,
    fetchAllAttendees,
    fetchAttendanceLogs,
    fetchAttendanceStats,
    enrollInEvent,
    fetchAnalytics,
    fetchGlobalAnalytics,
    applyFilters,
    getFilteredAttendees,
  };
};
