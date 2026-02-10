import { createContext, useContext, type ReactNode } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import type { Notification } from '../hooks/useNotifications';

interface NotificationContextType {
    notifications: Notification[];
    isConnected: boolean;
    markAsRead: (id: string) => void;
    clearAll: () => void;
    unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const notificationState = useNotifications();

    const unreadCount = notificationState.notifications.filter(n => !n.read).length;

    return (
        <NotificationContext.Provider value={{ ...notificationState, unreadCount }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotificationContext = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotificationContext must be used within a NotificationProvider');
    }
    return context;
};
