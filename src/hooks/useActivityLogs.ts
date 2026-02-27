import { useState, useEffect, useCallback } from 'react';
import { getUserActivityLogs, type ActivityLog } from '../services/api';

export const useActivityLogs = () => {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLogs = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getUserActivityLogs();
            setLogs(data || []);
            setError(null);
        } catch (err: any) {
            console.error('Failed to fetch activity logs:', err);
            setError(err.message || 'Failed to load activity logs');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    return { logs, loading, error, refetch: fetchLogs };
};
