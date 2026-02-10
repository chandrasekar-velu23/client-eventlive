import { useState, useCallback, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

export interface Participant {
  userId: string;
  userName: string;
  role: 'organizer' | 'speaker' | 'moderator' | 'attendee';
  isMuted: boolean;
  videoEnabled: boolean;
  screenshareActive: boolean;
  joinedAt: Date;
  leftAt?: Date;
}

export interface SessionData {
  _id: string;
  title: string;
  description: string;
  status: 'draft' | 'scheduled' | 'live' | 'ended';
  participants: Participant[];
  organizerId: string;
  scheduledStartTime: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  duration: number;
}

// Socket event data interfaces
interface ParticipantJoinedData {
  userId: string;
  userName: string;
  role: string;
  timestamp: string;
}

interface ParticipantLeftData {
  userId: string;
  timestamp: string;
}

interface ParticipantMediaChangedData {
  userId: string;
  isMuted: boolean;
  videoEnabled: boolean;
  timestamp: string;
}

interface UseSessionReturn {
  session: SessionData | null;
  participants: Participant[];
  loading: boolean;
  error: string | null;
  socket: Socket | null;
  joinSession: (sessionId: string) => Promise<void>;
  leaveSession: () => Promise<void>;
  startSession: () => Promise<void>;
  endSession: () => Promise<void>;
  muteParticipant: (userId: string) => Promise<void>;
  unmuteParticipant: (userId: string) => Promise<void>;
  removeParticipant: (userId: string) => Promise<void>;
}

/**
 * Hook for managing session state and real-time updates
 * Backend is single source of truth
 */
export const useSession = (sessionId: string | null): UseSessionReturn => {
  const [session, setSession] = useState<SessionData | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Fetch session data
  const fetchSession = useCallback(
    async (id: string) => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/sessions/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch session: ${response.statusText}`);
        }

        const data = await response.json();
        setSession(data.data);
        setParticipants(data.data.participants || []);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch session';
        setError(message);
        console.error('Fetch session error:', err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Initialize WebSocket connection
  useEffect(() => {
    if (!sessionId) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setError('No authentication token found');
      return;
    }

    try {
      const newSocket = io('http://localhost:5000', {
        auth: { token },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      newSocket.on('connect', () => {
        console.log('✅ Connected to WebSocket');
        // Join session
        newSocket.emit('join-session', { sessionId });
      });

      newSocket.on('session-joined', (data: SessionData) => {
        console.log('Session joined:', data);
      });

      newSocket.on('participant-joined', (data: ParticipantJoinedData) => {
        console.log('Participant joined:', data);
        // Refetch session to sync participants
        fetchSession(sessionId);
      });

      newSocket.on('participant-left', (data: ParticipantLeftData) => {
        console.log('Participant left:', data);
        fetchSession(sessionId);
      });

      newSocket.on('participant-media-changed', (data: ParticipantMediaChangedData) => {
        console.log('Media state changed:', data);
        // Update participant state
        setParticipants((prev) =>
          prev.map((p) =>
            p.userId === data.userId
              ? {
                  ...p,
                  isMuted: data.isMuted !== undefined ? data.isMuted : p.isMuted,
                  videoEnabled:
                    data.videoEnabled !== undefined ? data.videoEnabled : p.videoEnabled,
                }
              : p
          )
        );
      });

      newSocket.on('error', (error: { message?: string }) => {
        console.error('Socket error:', error);
        setError(typeof error === 'object' && 'message' in error ? (error.message || 'Unknown error') : 'Unknown error');
      });

      newSocket.on('disconnect', () => {
        console.log('❌ Disconnected from WebSocket');
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect';
      setError(message);
    }
  }, [fetchSession, sessionId]);

  // Join session
  const joinSession = useCallback(
    async (id: string) => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/sessions/${id}/join`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role: 'attendee' }),
        });

        if (!response.ok) {
          throw new Error(`Failed to join session: ${response.statusText}`);
        }

        await fetchSession(id);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to join session';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [fetchSession]
  );

  // Leave session
  const leaveSession = useCallback(async () => {
    if (!sessionId) return;

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/sessions/${sessionId}/leave`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to leave session: ${response.statusText}`);
      }

      setSession(null);
      setParticipants([]);
      socket?.emit('leave-session', { sessionId });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to leave session';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [sessionId, socket]);

  // Start session
  const startSession = useCallback(async () => {
    if (!sessionId) return;

    try {
      setError(null);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/sessions/${sessionId}/start`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to start session: ${response.statusText}`);
      }

      await fetchSession(sessionId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start session';
      setError(message);
    }
  }, [sessionId, fetchSession]);

  // End session
  const endSession = useCallback(async () => {
    if (!sessionId) return;

    try {
      setError(null);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/sessions/${sessionId}/end`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to end session: ${response.statusText}`);
      }

      await fetchSession(sessionId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to end session';
      setError(message);
    }
  }, [sessionId, fetchSession]);

  // Mute participant
  const muteParticipant = useCallback(
    async (userId: string) => {
      if (!sessionId) return;

      try {
        setError(null);
        const token = localStorage.getItem('token');
        const response = await fetch(
          `http://localhost:5000/api/sessions/${sessionId}/participants/${userId}/mute`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to mute participant: ${response.statusText}`);
        }

        setParticipants((prev) =>
          prev.map((p) => (p.userId === userId ? { ...p, isMuted: true } : p))
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to mute participant';
        setError(message);
      }
    },
    [sessionId]
  );

  // Unmute participant
  const unmuteParticipant = useCallback(
    async (userId: string) => {
      if (!sessionId) return;

      try {
        setError(null);
        const token = localStorage.getItem('token');
        const response = await fetch(
          `http://localhost:5000/api/sessions/${sessionId}/participants/${userId}/unmute`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to unmute participant: ${response.statusText}`);
        }

        setParticipants((prev) =>
          prev.map((p) => (p.userId === userId ? { ...p, isMuted: false } : p))
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to unmute participant';
        setError(message);
      }
    },
    [sessionId]
  );

  // Remove participant
  const removeParticipant = useCallback(
    async (userId: string) => {
      if (!sessionId) return;

      try {
        setError(null);
        const token = localStorage.getItem('token');
        const response = await fetch(
          `http://localhost:5000/api/sessions/${sessionId}/participants/${userId}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to remove participant: ${response.statusText}`);
        }

        setParticipants((prev) => prev.filter((p) => p.userId !== userId));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to remove participant';
        setError(message);
      }
    },
    [sessionId]
  );

  // Initial fetch when sessionId changes
  useEffect(() => {
    if (sessionId) {
      fetchSession(sessionId);
    }
  }, [sessionId, fetchSession]);

  return {
    session,
    participants,
    loading,
    error,
    socket,
    joinSession,
    leaveSession,
    startSession,
    endSession,
    muteParticipant,
    unmuteParticipant,
    removeParticipant,
  };
};
