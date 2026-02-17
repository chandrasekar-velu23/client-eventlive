import { format, parseISO, isAfter, isBefore, isValid, formatDistanceToNow } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';

/**
 * ============================================================================
 * CORE CONVERSION UTILITIES
 * ============================================================================
 */

/**
 * Converts a date string (YYYY-MM-DD) and time string (HH:mm) 
 * combined with a timezone (e.g., 'Asia/Kolkata') into a UTC ISO string.
 * Used primarily in forms (Create Event) to send standardized UTC to backend.
 */
export const localToUTC = (dateStr: string, timeStr: string, timezone: string): string => {
    if (!dateStr || !timeStr || !timezone) return "";

    try {
        // Combine to get "2023-10-25T10:00:00"
        const localDateTimeString = `${dateStr}T${timeStr}:00`;
        // Convert this "local" time in the specific timezone to a JS Date (which is UTC)
        const utcDate = fromZonedTime(localDateTimeString, timezone);
        return utcDate.toISOString();
    } catch (error) {
        console.error("Error converting date to UTC:", error);
        return "";
    }
};

/**
 * Get current time in specific timezone for initial form values (HH:mm format)
 */
export const getCurrentTimeInZone = (timezone: string): string => {
    try {
        return new Date().toLocaleTimeString('en-US', {
            timeZone: timezone,
            hour12: false,
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        console.warn("Invalid timezone for getCurrentTimeInZone:", timezone);
        return "09:00";
    }
};

/**
 * ============================================================================
 * FORMATTING UTILITIES (DISPLAY)
 * ============================================================================
 */

/**
 * Safely format a date string or Date object into a readable time string (e.g., "10:30 AM").
 * Handles timezone conversion if provided.
 */
export const formatEventTime = (dateInput: string | Date, timezone?: string): string => {
    try {
        const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
        if (!isValid(date)) return "Invalid Time";

        const options: Intl.DateTimeFormatOptions = {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            ...(timezone && { timeZone: timezone })
        };

        return new Intl.DateTimeFormat('en-US', options).format(date);
    } catch (error) {
        // Fallback
        return "Invalid Time";
    }
};

/**
 * Safely format a date string or Date object into a readable date string (e.g., "Oct 25, 2023").
 */
export const formatEventDate = (dateInput: string | Date): string => {
    try {
        const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
        if (!isValid(date)) return "Invalid Date";
        return format(date, 'MMM d, yyyy');
    } catch {
        return "Invalid Date";
    }
};

/**
 * Returns relative time string (e.g., "in 5 minutes", "2 hours ago")
 */
export const getRelativeTime = (dateInput: string | Date): string => {
    try {
        const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
        if (!isValid(date)) return "";
        return formatDistanceToNow(date, { addSuffix: true });
    } catch {
        return "";
    }
};

/**
 * ============================================================================
 * LOGIC / STATUS UTILITIES
 * ============================================================================
 */

export const isEventLive = (startTime: string | Date, endTime: string | Date): boolean => {
    try {
        const now = new Date();
        const start = typeof startTime === 'string' ? parseISO(startTime) : startTime;
        const end = typeof endTime === 'string' ? parseISO(endTime) : endTime;
        return isBefore(start, now) && isAfter(end, now);
    } catch {
        return false;
    }
};

export const isEventUpcoming = (startTime: string | Date): boolean => {
    try {
        const now = new Date();
        const start = typeof startTime === 'string' ? parseISO(startTime) : startTime;
        return isAfter(start, now);
    } catch {
        return false;
    }
};

export const isEventPast = (endTime: string | Date): boolean => {
    try {
        const now = new Date();
        const end = typeof endTime === 'string' ? parseISO(endTime) : endTime;
        return isBefore(end, now);
    } catch {
        return false;
    }
};
