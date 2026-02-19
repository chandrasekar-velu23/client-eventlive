import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { SOCKET_URL } from '../services/api';

export type NotificationType =
    | 'event_created'
    | 'new_attendee' // Legacy support
    | 'new_enrollment'
    | 'link_request'
    | 'transcript_ready'
    | 'recording_ready'
    | 'qa_ready'
    | 'system'
    | 'message'; // Legacy support

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    data?: any;
}



const formatMessage = (type: NotificationType, data: any): { title: string, message: string } => {
    switch (type) {
        case 'event_created':
            return { title: 'New Event', message: `Event "${data.eventTitle}" has been created.` };
        case 'new_enrollment':
        case 'new_attendee':
            return { title: 'New Enrollment', message: `${data.userName} joined "${data.eventTitle}".` };
        case 'link_request':
            return { title: 'Link Request', message: `${data.userName} requested a link for "${data.eventTitle}".` };
        case 'transcript_ready':
            return { title: 'Transcript Ready', message: `Transcript for "${data.eventTitle}" is now available.` };
        case 'recording_ready':
            return { title: 'Recording Ready', message: `Recording for "${data.eventTitle}" has been processed.` };
        case 'qa_ready':
            return { title: 'Q/A Dataset', message: `Q/A dataset for "${data.eventTitle}" is ready.` };
        case 'system':
            return { title: 'System', message: data.message || 'System notification.' };
        default:
            return { title: 'Notification', message: data.message || 'You have a new update.' };
    }
};

export const useNotifications = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        if (!user?.token) return;

        // Prevent multiple connections
        if (socketRef.current?.connected) return;

        // Connect to notification namespace
        const socket = io(`${SOCKET_URL}/notifications`, {
            path: '/socket.io',
            auth: { token: user.token },
            reconnectionAttempts: 5,
            transports: ['websocket', 'polling'],
            autoConnect: false // Important for StrictMode
        });

        socketRef.current = socket;
        socket.connect();

        socket.on('connect', () => {
            console.log('✅ Connected to notification service');
            setIsConnected(true);
        });

        socket.on('connect_error', (err) => {
            console.warn('⚠️ Notification socket connection error:', err.message);
            setIsConnected(false);
        });

        socket.on('disconnect', (reason) => {
            console.log('❌ Disconnected from notification service:', reason);
            setIsConnected(false);
        });

        socket.on('notification', (payload: any) => {
            // Handle incoming notification
            const { title, message } = formatMessage(payload.type, payload);

            const newNotif: Notification = {
                id: payload.id || Math.random().toString(36).substr(2, 9),
                type: payload.type,
                title,
                message,
                timestamp: new Date(payload.timestamp || Date.now()),
                read: false,
                data: payload
            };

            setNotifications(prev => [newNotif, ...prev]);

            // Toast alert
            toast.info(title, { description: message });
        });

        return () => {
            if (socket) {
                socket.offAny(); // Remove all listeners
                if (socket.connected) {
                    socket.disconnect();
                } else {
                    socket.close();
                }
            }
            socketRef.current = null;
        };
    }, [user?.token]);

    const markAsRead = (id: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    };

    const clearAll = () => setNotifications([]);

    return {
        notifications,
        isConnected,
        markAsRead,
        clearAll
    };
};
