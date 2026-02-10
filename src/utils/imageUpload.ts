import { toast } from "sonner";

/**
 * Unified Image Upload Utility
 * Handles all image uploads with proper validation, error handling, and context-based naming
 */

export interface UploadOptions {
    file: File;
    endpoint: string;
    context?: string; // e.g., "cover", "logo", "avatar", "speaker"
    onProgress?: (progress: number) => void;
}

export interface UploadResult {
    url: string;
    filename: string;
}

/**
 * Validate image file before upload
 */
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
    // Check file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        return { valid: false, error: "Image size must be less than 5MB" };
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
        return { valid: false, error: "File must be an image" };
    }

    // Check for supported formats
    const supportedFormats = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!supportedFormats.includes(file.type)) {
        return { valid: false, error: "Supported formats: JPEG, PNG, GIF, WebP" };
    }

    return { valid: true };
};

/**
 * Upload image to server
 */
export const uploadImage = async (options: UploadOptions): Promise<UploadResult> => {
    const { file, endpoint, context, onProgress } = options;

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
        throw new Error(validation.error);
    }

    // Create FormData
    const formData = new FormData();
    formData.append("file", file);

    // Add context if provided (for backend to use in naming)
    if (context) {
        formData.append("context", context);
    }

    try {
        // Get auth token
        const token = localStorage.getItem("token");
        if (!token) {
            throw new Error("Authentication required");
        }

        // Create XMLHttpRequest for progress tracking
        return new Promise((resolve, reject) => {
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

            // Handle completion
            xhr.addEventListener("load", () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        resolve({
                            url: response.url || response.data?.url,
                            filename: response.filename || file.name,
                        });
                    } catch (error) {
                        reject(new Error("Invalid response from server"));
                    }
                } else {
                    try {
                        const error = JSON.parse(xhr.responseText);
                        reject(new Error(error.message || `Upload failed with status ${xhr.status}`));
                    } catch {
                        reject(new Error(`Upload failed with status ${xhr.status}`));
                    }
                }
            });

            // Handle errors
            xhr.addEventListener("error", () => {
                reject(new Error("Network error during upload"));
            });

            xhr.addEventListener("abort", () => {
                reject(new Error("Upload cancelled"));
            });

            // Setup request
            const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
            const url = `${baseUrl}/${endpoint}`;

            xhr.open("POST", url);
            xhr.setRequestHeader("Authorization", `Bearer ${token}`);

            // Send request
            xhr.send(formData);
        });
    } catch (error: any) {
        console.error("Upload error:", error);
        throw new Error(error.message || "Failed to upload image");
    }
};

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
        toast.error(error.message || "Failed to upload cover image");
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
        toast.error(error.message || "Failed to upload speaker image");
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
        return { url: result.url, avatar: result.url, user: {} }; // Backend returns user object
    } catch (error: any) {
        toast.error(error.message || "Failed to upload avatar");
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
        toast.error(error.message || "Failed to upload logo");
        throw error;
    }
};
