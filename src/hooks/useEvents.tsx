import { useState, useCallback } from "react";
import { getMyEvents, getAllEvents, getEventById, createEventRequest, updateEvent, deleteEvent, getEnrolledEvents } from "../services/api";
import type { EventData } from "../services/api";

/**
 * Custom hook for managing event data
 * Handles fetching, caching, and state management for events
 */
export const useEvents = () => {
  const [events, setEvents] = useState<(EventData & { id: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch user's created events
   */
  const fetchMyEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getMyEvents();
      setEvents(response || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch events";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch user's enrolled events
   */
  const fetchEnrolledEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getEnrolledEvents();
      setEvents(response || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch enrolled events";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch all available events
   */
  const fetchAllEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAllEvents();
      setEvents(response || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch events";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch a specific event by ID
   */
  const fetchEventById = useCallback(async (eventId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getEventById(eventId);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch event";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new event
   */
  const createEvent = useCallback(async (eventData: EventData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await createEventRequest(eventData);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create event";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update an existing event
   */
  const updateEventData = useCallback(async (eventId: string, data: Partial<EventData>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await updateEvent(eventId, data);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update event";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete an event
   */
  const deleteEventData = useCallback(async (eventId: string) => {
    setLoading(true);
    setError(null);
    try {
      await deleteEvent(eventId);
      setEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete event";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    events,
    loading,
    error,
    fetchMyEvents,
    fetchEnrolledEvents,
    fetchAllEvents,
    fetchEventById,
    createEvent,
    updateEventData,
    deleteEventData,
  };
};
