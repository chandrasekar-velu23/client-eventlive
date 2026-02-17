export const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Derive SOCKET_URL from BASE_URL (strip /api if present)
// This ensures we connect to the root domain where socket.io is hosted
export const SOCKET_URL = BASE_URL.replace(/\/api\/?$/, '');

const joinPaths = (base: string, endpoint: string): string => {
  const cleanBase = base.endsWith("/") ? base : `${base}/`;
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
  return `${cleanBase}${cleanEndpoint}`;
};

export interface Speaker {
  _id: string;
  name: string;
  role: string;
  bio: string;
  avatar?: string;
  email?: string;
  tags?: string[];
  labels?: string[];
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
}

export interface AgendaItem {
  startTime: string;
  endTime: string;
  title: string;
  description: string;
  speakerId?: string;
}

// Update EventData to include new fields
// Note: On fetch, speakers might be populated objects, but on create we send IDs.
export interface EventData {
  id?: string;
  _id?: string;
  title: string;
  description: string;
  shortSummary?: string;
  startTime: string; // ISO String
  endTime: string; // ISO String
  timezone?: string;
  type?: string;
  category?: string;
  tags?: string[];
  accessType?: 'Free' | 'Paid' | 'Invite-only';
  capacity?: number;
  organizerDisplayName?: string;
  organizerLogo?: string;
  organizerWebsite?: string;
  organizerEmail?: string;
  organizerPhone?: string;
  organizerDescription?: string;
  brandAccentColor?: string;
  coverImage?: string;
  organizerId?: string;
  visibility?: 'public' | 'private';
  attendees?: string[]; // IDs
  speakers?: string[] | Speaker[]; // IDs or Populated Objects
  agenda?: AgendaItem[];
  sessionCode?: string;
  shareableLink?: string;
  status?: 'draft' | 'published';
}

// Export unified image upload utilities
export {
  uploadCoverImage,
  uploadSpeakerImage,
  uploadUserAvatar as uploadAvatar,
  uploadOrganizerLogo,
  validateImageFile
} from '../utils/imageUpload';

export const getAllSpeakers = async (): Promise<Speaker[]> => {
  const result = await apiFetch<Speaker[]>("speakers", {
    method: "GET",
  });
  return result.data || [];
};

export const createGlobalSpeaker = async (speakerData: Omit<Speaker, "_id">): Promise<Speaker> => {
  const result = await apiFetch<Speaker>("speakers", {
    method: "POST",
    body: JSON.stringify(speakerData),
  });

  if (!result.data) {
    throw new Error("Failed to create speaker");
  }

  return result.data;
};

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
  accountType?: "User" | "Organizer" | "Attendee";
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  data: {
    token: string;
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      onboardingCompleted: boolean;
      bio?: string;
      avatar?: string;
      organizationName?: string;
      eventTypes?: string[];
      socialLinks?: {
        twitter?: string;
        linkedin?: string;
        facebook?: string;
        instagram?: string;
        website?: string;
      };
      createdAt?: string;
    };
  };
}






interface ApiResponse<T> {
  message: string;
  data?: T;
}

const apiFetch = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const savedUser = localStorage.getItem("user");
  const tokenFromStorage = localStorage.getItem("token");
  let token = tokenFromStorage || "";

  if (!token && savedUser && savedUser !== "undefined") {
    try {
      const parsed = JSON.parse(savedUser);
      token = parsed.token;
    } catch {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
  }

  const headers: any = {
    // "Content-Type": "application/json", // Don't set default here, set logic below
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  } else {
    // Remove Content-Type if it exists, let browser set boundary
    delete headers["Content-Type"];
  }

  const url = joinPaths(BASE_URL, endpoint);

  try {
    const response = await fetch(url, { ...options, headers });

    const contentType = response.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");
    const responseData = isJson ? await response.json() : null;

    if (!response.ok) {
      const errorMessage = responseData?.message || `Error ${response.status}: ${response.statusText}`;
      console.error(`API Error: ${response.status} - ${url}`, errorMessage);
      throw new Error(errorMessage);
    }

    return responseData as ApiResponse<T>;
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      console.error("Network Error: backend is likely down or unreachable at", url);
      throw new Error("Unable to connect to server. Please ensure the backend is running.");
    }
    console.error("API Request Failed:", {
      endpoint,
      url,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unexpected error occurred.");
  }
};



export const signup = async (
  payload: SignupPayload
): Promise<AuthResponse> => {
  const response = await apiFetch<AuthResponse["data"]>("auth/signup", {
    method: "POST",
    body: JSON.stringify({
      name: payload.name,
      email: payload.email,
      password: payload.password,
      role: payload.accountType || "User",
    }),
  });

  if (!response.data) {
    throw new Error(response.message || "Signup failed");
  }

  return {
    message: response.message,
    data: response.data,
  };
};

export const login = async (
  payload: LoginPayload
): Promise<AuthResponse> => {
  const response = await apiFetch<AuthResponse["data"]>("auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!response.data) {
    throw new Error(response.message || "Login failed");
  }

  return {
    message: response.message,
    data: response.data,
  };
};

export const googleAuth = async (token: string): Promise<AuthResponse> => {
  const response = await apiFetch<AuthResponse["data"]>("auth/google", {
    method: "POST",
    body: JSON.stringify({ token }),
  });

  if (!response.data) {
    throw new Error(response.message || "Google authentication failed");
  }

  return {
    message: response.message,
    data: response.data,
  };
};



export const forgotPassword = async (email: string): Promise<{ message: string }> => {
  const response = await apiFetch<null>("auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  return { message: response.message };
};

export const resetPassword = async (token: string, password: string): Promise<AuthResponse> => {
  const response = await apiFetch<AuthResponse["data"]>(`auth/reset-password/${token}`, {
    method: "POST",
    body: JSON.stringify({ password }),
  });

  if (!response.data) {
    throw new Error(response.message || "Password reset failed");
  }

  return {
    message: response.message,
    data: response.data,
  };
};

export const createEventRequest = async (
  data: EventData
): Promise<{ message: string; data: EventData & { id: string } }> => {
  const result = await apiFetch<EventData & { id: string }>("events", {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!result.data) {
    throw new Error(result.message || "Failed to create event");
  }

  return result as { message: string; data: EventData & { id: string } };
};



export const getMyEvents = async (): Promise<(EventData & { id: string })[]> => {
  try {
    const result = await apiFetch<any[]>("events/my", {
      method: "GET",
    });
    return (result.data || []).map(e => ({ ...e, id: e._id || e.id }));
  } catch (error) {
    console.warn("Failed to fetch my events:", error);
    return [];
  }
};

export const getEnrolledEvents = async (): Promise<(EventData & { id: string })[]> => {
  try {
    const result = await apiFetch<any[]>("events/enrolled", {
      method: "GET",
    });
    return (result.data || []).map(e => ({ ...e, id: e._id || e.id }));
  } catch (error) {
    console.warn("Failed to fetch enrolled events:", error);
    return [];
  }
};


export const getAllEvents = async (): Promise<(EventData & { id: string })[]> => {
  try {
    const result = await apiFetch<any[]>("events/all", {
      method: "GET",
    });
    return (result.data || []).map(e => ({ ...e, id: e._id || e.id }));
  } catch (error) {
    console.warn("Failed to fetch all events:", error);
    return [];
  }
};

export const getEventById = async (
  eventId: string
): Promise<EventData & { id: string }> => {
  const result = await apiFetch<any>(`events/${eventId}`, {
    method: "GET",
  });

  if (!result.data) {
    throw new Error("Event not found");
  }

  return { ...result.data, id: result.data._id || result.data.id };
};


export const updateEvent = async (
  eventId: string,
  data: Partial<EventData>
): Promise<EventData & { id: string }> => {
  const result = await apiFetch<any>(`events/${eventId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

  if (!result.data) {
    throw new Error("Failed to update event");
  }

  return { ...result.data, id: result.data._id || result.data.id };
};


export const deleteEvent = async (eventId: string): Promise<void> => {
  const result = await apiFetch<null>(`events/${eventId}`, {
    method: "DELETE",
  });

  if (!result.message) {
    throw new Error("Failed to delete event");
  }
};


export const enrollEvent = async (eventId: string): Promise<{ eventId: string; userId: string }> => {
  const result = await apiFetch<{ eventId: string; userId: string }>(`events/${eventId}/enroll`, {
    method: "POST",
  });

  if (!result.data) {
    throw new Error("Failed to enroll in event");
  }

  return result.data;
};


export const joinEventSession = async (
  code: string
): Promise<{ event: EventData & { id: string }; session: any }> => {
  const result = await apiFetch<{ event: EventData & { id: string }; session: any }>(`events/join/${code}`, {
    method: "GET",
  });

  if (!result.data) {
    throw new Error("Failed to join session");
  }

  return result.data;
};

export const submitSessionFeedback = async (
  eventId: string,
  feedback: string,
  rating: number,
  requests: { transcript: boolean; recording: boolean }
): Promise<void> => {
  await apiFetch(`events/${eventId}/feedback`, {
    method: "POST",
    body: JSON.stringify({ feedback, rating, requestTranscript: requests.transcript, requestRecording: requests.recording }),
  });
};

export const getEventAttendees = async (
  eventId: string
): Promise<Array<{ id: string; name: string; email: string; enrolledAt: string }>> => {
  try {
    const result = await apiFetch<Array<{ id: string; name: string; email: string; enrolledAt: string }>>(`events/${eventId}/attendees`, {
      method: "GET",
    });
    return result.data || [];
  } catch (error) {
    console.warn("Failed to fetch attendees:", error);
    return [];
  }
};


export const getEventAnalytics = async (
  eventId: string
): Promise<{ registrations: number; attendanceRate: number; avgDuration: number; pollResponses: number }> => {
  try {
    const result = await apiFetch<{ registrations: number; attendanceRate: number; avgDuration: number; pollResponses: number }>(`events/${eventId}/analytics`, {
      method: "GET",
    });
    return result.data || { registrations: 0, attendanceRate: 0, avgDuration: 0, pollResponses: 0 };
  } catch (error) {
    console.warn("Failed to fetch analytics:", error);
    return { registrations: 0, attendanceRate: 0, avgDuration: 0, pollResponses: 0 };
  }
};


export const getEventSpeakers = async (
  eventId: string
): Promise<Array<{ id: string; name: string; bio: string; avatar: string; role: string }>> => {
  try {
    const result = await apiFetch<Array<{ id: string; name: string; bio: string; avatar: string; role: string }>>(`events/${eventId}/speakers`, {
      method: "GET",
    });
    return result.data || [];
  } catch (error) {
    console.warn("Failed to fetch speakers:", error);
    return [];
  }
};


export const addSpeaker = async (
  eventId: string,
  speakerData: { name: string; bio: string; avatar: string; role: string }
): Promise<{ id: string; name: string; bio: string; avatar: string; role: string }> => {
  const result = await apiFetch<{ id: string; name: string; bio: string; avatar: string; role: string }>(`events/${eventId}/speakers`, {
    method: "POST",
    body: JSON.stringify(speakerData),
  });

  if (!result.data) {
    throw new Error("Failed to add speaker");
  }

  return result.data;
};


export const removeSpeaker = async (
  eventId: string,
  speakerId: string
): Promise<void> => {
  const result = await apiFetch<null>(`events/${eventId}/speakers/${speakerId}`, {
    method: "DELETE",
  });

  if (!result.message) {
    throw new Error("Failed to remove speaker");
  }
};

export const updateSpeaker = async (
  eventId: string,
  speakerId: string,
  speakerData: Partial<{ name: string; bio: string; avatar: string; role: string }>
): Promise<{ id: string; name: string; bio: string; avatar: string; role: string }> => {
  const result = await apiFetch<{ id: string; name: string; bio: string; avatar: string; role: string }>(`events/${eventId}/speakers/${speakerId}`, {
    method: "PUT",
    body: JSON.stringify(speakerData),
  });

  if (!result.data) {
    throw new Error("Failed to update speaker");
  }

  return result.data;
};


export const getUserProfile = async (): Promise<{ id: string; name: string; email: string; bio: string; avatar: string; socialLinks: Record<string, string> }> => {
  try {
    const result = await apiFetch<{ id: string; name: string; email: string; bio: string; avatar: string; socialLinks: Record<string, string> }>("users/profile", {
      method: "GET",
    });
    return result.data || { id: "", name: "", email: "", bio: "", avatar: "", socialLinks: {} };
  } catch (error) {
    console.warn("Failed to fetch user profile:", error);
    return { id: "", name: "", email: "", bio: "", avatar: "", socialLinks: {} };
  }
};


export const updateUserProfile = async (
  data: Partial<{ name: string; bio: string; avatar: string; socialLinks: Record<string, string>; organizationName: string; eventTypes: string[]; role: string; onboardingCompleted: boolean }>
): Promise<{ id: string; name: string; email: string; bio: string; avatar: string; socialLinks: Record<string, string>; organizationName?: string; eventTypes?: string[]; role?: string; onboardingCompleted?: boolean }> => {
  const result = await apiFetch<{ id: string; name: string; email: string; bio: string; avatar: string; socialLinks: Record<string, string>; organizationName?: string; eventTypes?: string[]; role?: string; onboardingCompleted?: boolean }>("users/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  });

  if (!result.data) {
    throw new Error("Failed to update profile");
  }

  return result.data;
};

export const getUserActivityLogs = async (): Promise<Array<{ action: string; details: any; createdAt: string; ip?: string }>> => {
  try {
    const result = await apiFetch<Array<{ action: string; details: any; createdAt: string; ip?: string }>>("users/logs", {
      method: "GET",
    });
    return result.data || [];
  } catch (error) {
    console.warn("Failed to fetch logs:", error);
    return [];
  }
};


export const getFavorites = async (): Promise<string[]> => {
  const result = await apiFetch<Array<{ _id: string }>>("users/favorites", {
    method: "GET",
  });
  // Return array of IDs
  return result.data?.map((f: any) => f._id) || [];
};

export const toggleFavorite = async (eventId: string): Promise<string[]> => {
  const result = await apiFetch<{ favorites: string[] }>("users/favorites", {
    method: "POST",
    body: JSON.stringify({ eventId }),
  });
  return result.data?.favorites || [];
};

export const getAllMyAttendees = async (): Promise<Array<{
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  eventId: string;
  eventTitle: string;
  eventCategory: string;
  enrolledAt: string;
  status: string;
  durationMinutes: number
}>> => {
  try {
    const result = await apiFetch<any[]>("events/my-attendees", {
      method: "GET",
    });
    return result.data || [];
  } catch (error) {
    console.warn("Failed to fetch my attendees:", error);
    return [];
  }
};


export const getGlobalAnalytics = async (): Promise<{
  registrations: number;
  attendanceRate: number;
  avgDuration: number;
  pollResponses: number;
  totalEvents: number;
} | null> => {
  try {
    const result = await apiFetch<any>("events/analytics/global");
    return result.data;
  } catch (error) {
    console.warn("Failed to fetch global analytics", error);
    return null;
  }
};

// Analytics & detailed logs

export interface ActivityLogItem {
  type: string;
  timestamp: string;
  details?: any;
}

export const getAttendeeDetailedLogs = async (eventId: string, userId: string): Promise<ActivityLogItem[]> => {
  try {
    const result = await apiFetch<ActivityLogItem[]>(`analytics/attendees/${eventId}/logs/${userId}`, {
      method: "GET"
    });
    return result.data || [];
  } catch (error) {
    console.warn("Failed to fetch attendee logs:", error);
    return [];
  }
};

export const sendAttendeeEmail = async (data: { toEmail: string; subject: string; content: string }): Promise<void> => {
  const result = await apiFetch<null>("analytics/email/send-attendee", {
    method: "POST",
    body: JSON.stringify(data)
  });
  if (!result.message) throw new Error("Failed to send email");
};

export const sendRequestEmail = async (data: { type: "inquiry" | "support"; subject: string; content: string }): Promise<void> => {
  const result = await apiFetch<null>("analytics/email/request", {
    method: "POST",
    body: JSON.stringify(data)
  });
  if (!result.message) throw new Error("Failed to send request");
};

export const uploadRecording = async (sessionId: string, blob: Blob): Promise<{ url: string }> => {
  const formData = new FormData();
  formData.append('recording', blob, `session-${sessionId}-${Date.now()}.webm`);

  const result = await apiFetch<{ url: string }>(`sessions/${sessionId}/recording`, {
    method: "POST",
    body: formData
  });

  if (!result.data) throw new Error("Failed to upload recording");
  return result.data;
};
