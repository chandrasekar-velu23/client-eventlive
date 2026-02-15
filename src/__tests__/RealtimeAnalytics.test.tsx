import { render, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Dashboard from '../pages/Dashboard';
import { NotificationProvider } from '../context/NotificationContext';
import { BrowserRouter } from 'react-router-dom';

// Mocks
const mockEmit = vi.fn();
const mockOn = vi.fn();
const mockDisconnect = vi.fn();

vi.mock('socket.io-client', () => ({
    io: () => ({
        on: mockOn,
        emit: mockEmit,
        disconnect: mockDisconnect,
        connect: vi.fn(),
    }),
}));

vi.mock('../hooks/useAuth', () => ({
    useAuth: () => ({
        user: {
            role: 'Organizer',
            name: 'Test Organizer',
            token: 'fake-token'
        },
    }),
}));

const mockFetchGlobalAnalytics = vi.fn();
const mockFetchMyEvents = vi.fn();

vi.mock('../hooks/useEventAttendance', () => ({
    useEventAttendance: () => ({
        fetchGlobalAnalytics: mockFetchGlobalAnalytics,
        analytics: {
            attendanceRate: 75,
            registrations: 100,
            avgDuration: 45,
            pollResponses: 20
        }
    }),
}));

vi.mock('../hooks/useEvents', () => ({
    useEvents: () => ({
        events: [],
        loading: false,
        fetchMyEvents: mockFetchMyEvents,
    }),
}));

describe('Real-time Analytics Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('triggers analytics refresh when stats-update is received', async () => {
        // 1. Render Dashboard wrapped in providers
        render(
            <BrowserRouter>
                <NotificationProvider>
                    <Dashboard />
                </NotificationProvider>
            </BrowserRouter>
        );

        // 2. Verify initial calls
        expect(mockFetchGlobalAnalytics).toHaveBeenCalled();

        // 3. Simulate socket "stats-update" event
        // Find the callback registered for 'stats-update'
        const statsUpdateCallback = mockOn.mock.calls.find(call => call[0] === 'stats-update')?.[1];

        expect(statsUpdateCallback).toBeDefined();

        // 4. Trigger the update
        if (statsUpdateCallback) {
            // Reset mocks to clear initial render calls
            mockFetchGlobalAnalytics.mockClear();

            // Execute callback
            await statsUpdateCallback({
                type: 'attendance',
                delta: 1,
                timestamp: new Date()
            });
        }

        // 5. Verify fetchGlobalAnalytics was called again due to the update
        await waitFor(() => {
            expect(mockFetchGlobalAnalytics).toHaveBeenCalled();
        });
    });
});
