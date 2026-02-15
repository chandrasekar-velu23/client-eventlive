import { useState, useCallback, useEffect } from 'react';
import { Socket } from 'socket.io-client';

export interface ChatMessage {
  _id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  messageType: 'text' | 'system' | 'announcement';
  timestamp: Date;
  reactions?: { emoji: string; count: number }[];
}

// Socket event data interfaces
interface NewMessageData {
  _id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  messageType: 'text' | 'system' | 'announcement';
  timestamp: string;
}

interface MessageDeletedData {
  messageId: string;
}

interface MessageReactionAddedData {
  messageId: string;
  reactions?: { emoji: string; count: number }[];
}

interface UseRealtimeChatReturn {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  hasMore: boolean;
}

/**
 * Hook for real-time chat in a session
 * Manages message list with pagination and real-time updates
 */
export const useRealtimeChat = (
  sessionId: string | null,
  socket: Socket | null
): UseRealtimeChatReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Fetch chat history
  const fetchChatHistory = useCallback(
    async (pageNum = 1) => {
      if (!sessionId) return;

      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('token');
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/sessions/${sessionId}/chat?page=${pageNum}&limit=50`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch chat: ${response.statusText}`);
        }

        const data = await response.json();
        setMessages(data.data);
        setHasMore(data.pagination.page < data.pagination.pages);
        setPage(pageNum);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch chat';
        setError(message);
        console.error('Fetch chat error:', err);
      } finally {
        setLoading(false);
      }
    },
    [sessionId]
  );

  // Subscribe to real-time chat events
  useEffect(() => {
    if (!socket) return;

    socket.on('new-message', (data: NewMessageData) => {
      setMessages((prev) => [
        ...prev,
        {
          ...data,
          timestamp: new Date(data.timestamp),
        },
      ]);
    });

    socket.on('message-deleted', (data: MessageDeletedData) => {
      setMessages((prev) => prev.filter((m) => m._id !== data.messageId));
    });

    socket.on('message-reaction-added', (data: MessageReactionAddedData) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === data.messageId
            ? {
              ...m,
              reactions: data.reactions || [],
            }
            : m
        )
      );
    });

    return () => {
      socket.off('new-message');
      socket.off('message-deleted');
      socket.off('message-reaction-added');
    };
  }, [socket]);

  // Send message
  const sendMessage = useCallback(
    async (content: string) => {
      if (!socket || !sessionId) {
        setError('Not connected to session');
        return;
      }

      try {
        setError(null);

        socket.emit('send-message', { sessionId, content });

        // Wait for confirmation
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Send timeout')), 5000);

          socket.once('message-sent', () => {
            clearTimeout(timeout);
            resolve(null);
          });
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to send message';
        setError(message);
        throw err;
      }
    },
    [socket, sessionId]
  );

  // Delete message
  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!socket || !sessionId) {
        setError('Not connected to session');
        return;
      }

      try {
        setError(null);

        socket.emit('delete-message', { sessionId, messageId });

        // Wait for confirmation
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Delete timeout')), 5000);

          socket.once('message-deleted', () => {
            clearTimeout(timeout);
            resolve(null);
          });
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete message';
        setError(message);
        throw err;
      }
    },
    [socket, sessionId]
  );

  // Load more messages
  const loadMoreMessages = useCallback(async () => {
    await fetchChatHistory(page + 1);
  }, [page, fetchChatHistory]);

  // Initial fetch
  useEffect(() => {
    if (sessionId) {
      fetchChatHistory(1);
    }
  }, [sessionId, fetchChatHistory]);

  return {
    messages,
    loading,
    error,
    sendMessage,
    deleteMessage,
    loadMoreMessages,
    hasMore,
  };
};
