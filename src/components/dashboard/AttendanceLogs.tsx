import { useState, useEffect } from "react";
import {
    ClockIcon,
    UserIcon,
    ArrowRightIcon,
    FunnelIcon,
} from "@heroicons/react/24/outline";
import type { AttendanceLog } from "../../hooks/useEventAttendance";

interface AttendanceLogsProps {
    eventId: string;
    eventTitle: string;
}

export default function AttendanceLogs({ eventId, eventTitle }: AttendanceLogsProps) {
    const [logs, setLogs] = useState<AttendanceLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

    useEffect(() => {
        fetchLogs();
    }, [eventId]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

            const response = await fetch(`${apiBase}/events/${eventId}/attendance/logs`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error("Failed to fetch logs");

            const data = await response.json();
            setLogs(data.data || []);
        } catch (error) {
            console.error("Fetch logs error:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter((log) => {
        if (filter === "all") return true;
        return log.status === filter;
    });

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const formatDuration = (minutes?: number) => {
        if (!minutes) return "—";
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-brand-dark">Attendance Logs</h3>
                    <p className="text-sm text-brand-muted">{eventTitle}</p>
                </div>

                {/* Filter */}
                <div className="flex items-center gap-2">
                    <FunnelIcon className="h-4 w-4 text-brand-muted" />
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value as any)}
                        className="input-field text-sm py-1"
                    >
                        <option value="all">All ({logs.length})</option>
                        <option value="active">
                            Active ({logs.filter((l) => l.status === "active").length})
                        </option>
                        <option value="completed">
                            Completed ({logs.filter((l) => l.status === "completed").length})
                        </option>
                    </select>
                </div>
            </div>

            {/* Logs List */}
            {loading ? (
                <div className="card p-12 text-center">
                    <p className="text-brand-muted">Loading attendance logs...</p>
                </div>
            ) : filteredLogs.length === 0 ? (
                <div className="card p-12 text-center">
                    <ClockIcon className="h-12 w-12 text-brand-muted mx-auto mb-3 opacity-50" />
                    <p className="text-brand-muted">No attendance logs found</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredLogs.map((log) => (
                        <div
                            key={log._id}
                            className="card p-4 hover:shadow-md transition-shadow border border-brand-accent/10"
                        >
                            <div className="flex items-start justify-between">
                                {/* User Info */}
                                <div className="flex items-start gap-3 flex-1">
                                    <div className="p-2 bg-brand-primary/10 rounded-lg">
                                        <UserIcon className="h-5 w-5 text-brand-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-brand-dark">{log.userName}</p>
                                        <p className="text-sm text-brand-muted">{log.userEmail}</p>
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <span
                                    className={`px-3 py-1 text-xs font-bold rounded-full ${log.status === "active"
                                            ? "bg-blue-100 text-blue-700 border border-blue-200"
                                            : "bg-green-100 text-green-700 border border-green-200"
                                        }`}
                                >
                                    {log.status === "active" ? "🟢 Active" : "✓ Completed"}
                                </span>
                            </div>

                            {/* Timeline */}
                            <div className="mt-4 flex items-center gap-4 text-sm">
                                {/* Check-in */}
                                <div className="flex items-center gap-2">
                                    <ClockIcon className="h-4 w-4 text-green-600" />
                                    <div>
                                        <p className="text-xs text-brand-muted">Check-in</p>
                                        <p className="font-medium text-brand-dark">
                                            {formatTime(log.checkInTime)}
                                        </p>
                                        <p className="text-xs text-brand-muted">
                                            {formatDate(log.checkInTime)}
                                        </p>
                                    </div>
                                </div>

                                {/* Arrow */}
                                {log.checkOutTime && (
                                    <>
                                        <ArrowRightIcon className="h-4 w-4 text-brand-muted" />

                                        {/* Check-out */}
                                        <div className="flex items-center gap-2">
                                            <ClockIcon className="h-4 w-4 text-red-600" />
                                            <div>
                                                <p className="text-xs text-brand-muted">Check-out</p>
                                                <p className="font-medium text-brand-dark">
                                                    {formatTime(log.checkOutTime)}
                                                </p>
                                                <p className="text-xs text-brand-muted">
                                                    {formatDate(log.checkOutTime)}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Duration */}
                                        <div className="ml-auto">
                                            <p className="text-xs text-brand-muted">Duration</p>
                                            <p className="font-bold text-brand-primary text-lg">
                                                {formatDuration(log.durationMinutes)}
                                            </p>
                                        </div>
                                    </>
                                )}

                                {!log.checkOutTime && (
                                    <div className="ml-auto">
                                        <p className="text-xs text-brand-muted">Duration</p>
                                        <p className="font-bold text-blue-600 text-lg animate-pulse">
                                            In Progress...
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Metadata */}
                            {(log.ipAddress || log.userAgent) && (
                                <div className="mt-3 pt-3 border-t border-brand-accent/10">
                                    <div className="flex items-center gap-4 text-xs text-brand-muted">
                                        {log.ipAddress && (
                                            <span>
                                                <strong>IP:</strong> {log.ipAddress}
                                            </span>
                                        )}
                                        {log.userAgent && (
                                            <span className="truncate max-w-xs" title={log.userAgent}>
                                                <strong>Device:</strong>{" "}
                                                {log.userAgent.includes("Mobile") ? "📱 Mobile" : "💻 Desktop"}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
