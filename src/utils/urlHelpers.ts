/**
 * URL Utilities for Image Handling
 * Ensures proper URL encoding/decoding for image display and storage
 */

/**
 * Normalize URL for storage (decode any encoding)
 * This should be used when STORING URLs in the database
 */
export const normalizeUrlForStorage = (url: string): string => {
    if (!url) return url;

    try {
        // Decode the URL to remove any encoding
        let decodedUrl = decodeURIComponent(url);

        // Check if it's double-encoded and decode again if needed
        if (decodedUrl !== url && decodedUrl.includes('%')) {
            decodedUrl = decodeURIComponent(decodedUrl);
        }

        return decodedUrl;
    } catch (error) {
        console.warn('[URL] Decode error, returning original:', error);
        return url;
    }
};

/**
 * Normalize URL for display (encode for browser)
 * This should be used when DISPLAYING URLs in img src attributes
 */
export const normalizeUrlForDisplay = (url: string): string => {
    if (!url) return url;

    try {
        // First decode to ensure we start with a clean URL
        const decoded = normalizeUrlForStorage(url);

        // Split URL into base and path
        const urlObj = new URL(decoded);

        // Encode only the pathname (not the protocol, domain, etc.)
        const encodedPath = urlObj.pathname
            .split('/')
            .map(segment => encodeURIComponent(decodeURIComponent(segment)))
            .join('/');

        // Reconstruct URL
        return `${urlObj.origin}${encodedPath}${urlObj.search}${urlObj.hash}`;
    } catch (error) {
        // If URL parsing fails, try simple encoding
        try {
            // Decode first, then encode
            const decoded = decodeURIComponent(url);
            return encodeURI(decoded);
        } catch {
            console.warn('[URL] Encoding error, returning original:', error);
            return url;
        }
    }
};

/**
 * Check if URL is valid
 */
export const isValidUrl = (url: string): boolean => {
    if (!url) return false;

    try {
        new URL(url);
        return true;
    } catch {
        // Check if it's a relative path
        return url.startsWith('/') || url.startsWith('./') || url.startsWith('../');
    }
};

/**
 * Get image URL with fallback
 * Handles both absolute and relative URLs
 */
export const getImageUrl = (url: string, fallback?: string): string => {
    if (!url) return fallback || '';

    // If it's a relative path, return as-is
    if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
        return url;
    }

    // If it's an absolute URL, normalize for display
    if (isValidUrl(url)) {
        return normalizeUrlForDisplay(url);
    }

    // Invalid URL, return fallback
    return fallback || url;
};
