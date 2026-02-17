import { fromZonedTime } from 'date-fns-tz';

/**
 * Converts a date string (YYYY-MM-DD) and time string (HH:mm) 
 * combined with a timezone (e.g., 'Asia/Kolkata') into a UTC ISO string.
 * 
 * This ensures that the user's selected time is respected regardless of their system's local time.
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
 * Get current time in specific timezone for initial values
 */
export const getCurrentTimeInZone = (timezone: string) => {
    try {
        return new Date().toLocaleTimeString('en-US', { timeZone: timezone, hour12: false, hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        return "09:00";
    }
}
