import { toast } from "sonner";

/**
 * Production-Ready Image Upload Utility
 * 
 * Features:
 * - Comprehensive validation
 * - Progress tracking
 * - Proper URL handling (decoding)
 * - Error handling with retry logic
 * - Type safety
 * - Logging for debugging
 */

// ========== TYPES ==========

export interface UploadOptions {
    file: File;
    endpoint: string;
    context?: string; // e.g., "cover", "logo", "avatar", "speaker"
    onProgress?: (progress: number) => void;
    maxRetries?: number;
}

export interface UploadResult {
    url: string;
    filename: string;
}

export interface ValidationResult {
    valid: boolean;
    error?: string;
}

// ========== CONSTANTS ==========

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const SUPPORTED_FORMATS = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
const DEFAULT_MAX_RETRIES = 2;

// ========== UTILITY FUNCTIONS ==========

/**
 * Decode URL to ensure it's stored without encoding
 * Handles both single and double encoding
 */
const normalizeUrl = (url: string): string => {
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
        console.warn('URL decode error, returning original:', error);
        return url;
    }
};

/**
 * Get base API URL
 */
const getBaseUrl = (): string => {
    return import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
};

/**
 * Get authentication token
 */
const getAuthToken = (): string | null => {
    const token = localStorage.getItem("token");

    // Fallback: check user object
    if (!token) {
        const savedUser = localStorage.getItem("user");
        if (savedUser && savedUser !== "undefined") {
            try {
                const parsed = JSON.parse(savedUser);
                return parsed.token || null;
            } catch {
                return null;
            }
        }
    }

    return token;
};

/**
 * Format file size for display
 */
const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
};

// ========== VALIDATION ==========

/**
 * Validate image file before upload
 */
export const validateImageFile = (file: File): ValidationResult => {
    // Check if file exists
    if (!file) {
        return { valid: false, error: "No file provided" };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
        return {
            valid: false,
            error: `Image size (${formatFileSize(file.size)}) exceeds maximum allowed size (${formatFileSize(MAX_FILE_SIZE)})`
        };
    }

    // Check if file is empty
    if (file.size === 0) {
        return { valid: false, error: "File is empty" };
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
        return { valid: false, error: `Invalid file type: ${file.type}. File must be an image.` };
    }

    // Check for supported formats
    if (!SUPPORTED_FORMATS.includes(file.type)) {
        return {
            valid: false,
            error: `Unsupported format: ${file.type}. Supported formats: JPEG, PNG, GIF, WebP`
        };
    }

    return { valid: true };
};

// ========== UPLOAD LOGIC ==========

/**
 * Upload image to server with retry logic
 */
export const uploadImage = async (options: UploadOptions): Promise<UploadResult> => {
    const { file, endpoint, context, onProgress, maxRetries = DEFAULT_MAX_RETRIES } = options;

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
        throw new Error(validation.error);
    }

    // Check authentication
    const token = getAuthToken();
    if (!token) {
        throw new Error("Authentication required. Please log in.");
    }

    // Log upload attempt
    console.log(`[ImageUpload] Starting upload:`, {
        filename: file.name,
        size: formatFileSize(file.size),
        type: file.type,
        endpoint,
        context
    });

    // Attempt upload with retry logic
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            if (attempt > 0) {
                console.log(`[ImageUpload] Retry attempt ${attempt}/${maxRetries}`);
            }

            const result = await performUpload(file, endpoint, context, token, onProgress);

            console.log(`[ImageUpload] Upload successful:`, {
                url: result.url,
                filename: result.filename
            });

            return result;
        } catch (error: any) {
            lastError = error;

            // Don't retry on authentication errors
            if (error.message?.includes('Authentication') || error.message?.includes('Unauthorized')) {
                throw error;
            }

            // Don't retry on validation errors
            if (error.message?.includes('Invalid') || error.message?.includes('Unsupported')) {
                throw error;
            }

            // Retry on network errors
            if (attempt < maxRetries) {
                console.warn(`[ImageUpload] Attempt ${attempt + 1} failed, retrying...`, error.message);
                await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
            }
        }
    }

    // All retries failed
    console.error(`[ImageUpload] Upload failed after ${maxRetries + 1} attempts:`, lastError);
    throw lastError || new Error("Upload failed");
};

/**
 * Perform the actual upload using XMLHttpRequest
 */
const performUpload = (
    file: File,
    endpoint: string,
    context: string | undefined,
    token: string,
    onProgress?: (progress: number) => void
): Promise<UploadResult> => {
    return new Promise((resolve, reject) => {
        // Create FormData
        const formData = new FormData();
        formData.append("file", file);

        if (context) {
            formData.append("context", context);
        }

        const xhr = new XMLHttpRequest();

        // Progress tracking
        if (onProgress) {
            xhr.upload.addEventListener("progress", (e) => {
                if (e.lengthComputable) {
                    const progress = Math.round((e.loaded / e.total) * 100);
                    onProgress(progress);
                }
            });
        }

        // Handle successful completion
        xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const response = JSON.parse(xhr.responseText);

                    // Extract URL from response
                    const rawUrl = response.url || response.data?.url || response.fileUrl;

                    if (!rawUrl) {
                        reject(new Error("Server did not return an image URL"));
                        return;
                    }

                    // Normalize URL (decode any encoding)
                    const normalizedUrl = normalizeUrl(rawUrl);

                    console.log(`[ImageUpload] URL normalized:`, {
                        original: rawUrl,
                        normalized: normalizedUrl,
                        wasEncoded: rawUrl !== normalizedUrl
                    });

                    resolve({
                        url: normalizedUrl, // Store decoded URL
                        filename: response.filename || response.data?.filename || file.name,
                    });
                } catch (error) {
                    console.error("[ImageUpload] Failed to parse server response:", xhr.responseText);
                    reject(new Error("Invalid response from server"));
                }
            } else {
                // Handle HTTP errors
                try {
                    const error = JSON.parse(xhr.responseText);
                    reject(new Error(error.message || `Upload failed with status ${xhr.status}`));
                } catch {
                    reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.statusText}`));
                }
            }
        });

        // Handle network errors
        xhr.addEventListener("error", () => {
            reject(new Error("Network error during upload. Please check your connection."));
        });

        // Handle upload cancellation
        xhr.addEventListener("abort", () => {
            reject(new Error("Upload cancelled"));
        });

        // Handle timeout
        xhr.addEventListener("timeout", () => {
            reject(new Error("Upload timed out. Please try again."));
        });

        // Setup request
        const baseUrl = getBaseUrl();
        const url = `${baseUrl}/${endpoint}`;

        xhr.open("POST", url);
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.timeout = 60000; // 60 second timeout

        // Send request
        xhr.send(formData);
    });
};

// ========== SPECIALIZED UPLOAD FUNCTIONS ==========

/**
 * Upload cover image for events
 */
export const uploadCoverImage = async (
    file: File,
    onProgress?: (progress: number) => void
): Promise<{ url: string }> => {
    try {
        const result = await uploadImage({
            file,
            endpoint: "events/cover",
            context: "cover",
            onProgress,
        });
        return { url: result.url };
    } catch (error: any) {
        const errorMessage = error.message || "Failed to upload cover image";
        console.error("[CoverImage]", errorMessage, error);
        toast.error(errorMessage);
        throw error;
    }
};

/**
 * Upload speaker avatar/image
 */
export const uploadSpeakerImage = async (
    file: File,
    onProgress?: (progress: number) => void
): Promise<{ url: string }> => {
    try {
        const result = await uploadImage({
            file,
            endpoint: "speakers/upload",
            context: "speaker-avatar",
            onProgress,
        });
        return { url: result.url };
    } catch (error: any) {
        const errorMessage = error.message || "Failed to upload speaker image";
        console.error("[SpeakerImage]", errorMessage, error);
        toast.error(errorMessage);
        throw error;
    }
};

/**
 * Upload user avatar
 */
export const uploadUserAvatar = async (
    file: File,
    onProgress?: (progress: number) => void
): Promise<{ url: string; avatar?: string; user?: any }> => {
    try {
        const result = await uploadImage({
            file,
            endpoint: "users/avatar",
            context: "user-avatar",
            onProgress,
        });
        return {
            url: result.url,
            avatar: result.url,
            user: {} // Backend may return updated user object
        };
    } catch (error: any) {
        const errorMessage = error.message || "Failed to upload avatar";
        console.error("[UserAvatar]", errorMessage, error);
        toast.error(errorMessage);
        throw error;
    }
};

/**
 * Upload organizer logo
 */
export const uploadOrganizerLogo = async (
    file: File,
    onProgress?: (progress: number) => void
): Promise<{ url: string }> => {
    try {
        const result = await uploadImage({
            file,
            endpoint: "events/logo",
            context: "organizer-logo",
            onProgress,
        });
        return { url: result.url };
    } catch (error: any) {
        const errorMessage = error.message || "Failed to upload logo";
        console.error("[OrganizerLogo]", errorMessage, error);
        toast.error(errorMessage);
        throw error;
    }
};
