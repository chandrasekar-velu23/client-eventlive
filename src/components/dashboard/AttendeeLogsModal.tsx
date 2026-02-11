
import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { getAttendeeDetailedLogs, type ActivityLogItem } from '../../services/api';
import { toast } from 'sonner';

interface AttendeeLogsModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventId: string;
    userId: string;
    userName: string;
}

export default function AttendeeLogsModal({
    isOpen,
    onClose,
    eventId,
    userId,
    userName,
}: AttendeeLogsModalProps) {
    const [logs, setLogs] = useState<ActivityLogItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && userId && eventId) {
            loadLogs();
        }
    }, [isOpen, userId, eventId]);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const data = await getAttendeeDetailedLogs(eventId, userId);
            setLogs(data);
        } catch (error) {
            toast.error('Failed to load logs');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        // Trigger download via API endpoint
        window.open(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/analytics/attendees/${eventId}/export/${userId}?token=${localStorage.getItem('token')}`, '_blank');
    };

    const getIconForType = (type: string) => {
        switch (type) {
            case 'SESSION_JOIN': return '🟢';
            case 'SESSION_LEAVE': return '🔴';
            case 'CHAT_MESSAGE': return '💬';
            case 'POLL_RESPONSE': return '📊';
            case 'QUESTION_ASKED': return '❓';
            default: return '📝';
        }
    };

    const formatDetails = (type: string, details: any) => {
        if (!details) return '';
        if (type === 'SESSION_LEAVE' && details.duration) return `Duration: ${details.duration} mins`;
        if (type === 'CHAT_MESSAGE') return 'Sent a message';
        if (type === 'POLL_RESPONSE') return 'Voted in a poll';
        if (type === 'QUESTION_ASKED') return 'Asked a question';
        return '';
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <div className="flex items-center justify-between mb-6">
                                    <Dialog.Title as="h3" className="text-lg font-bold text-gray-900">
                                        Activity Logs: {userName}
                                    </Dialog.Title>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleExport}
                                            className="p-2 text-brand-primary hover:bg-brand-surface rounded-full transition-colors"
                                            title="Export Logs"
                                        >
                                            <ArrowDownTrayIcon className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={onClose}
                                            className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100 transition-colors"
                                        >
                                            <XMarkIcon className="h-6 w-6" />
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2">
                                    {loading ? (
                                        <div className="text-center py-8 text-gray-500">Loading logs...</div>
                                    ) : logs.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">No activity recorded.</div>
                                    ) : (
                                        <div className="relative border-l-2 border-gray-200 ml-3 space-y-6">
                                            {logs.map((log, index) => (
                                                <div key={index} className="mb-8 ml-6 relative">
                                                    <span className="absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full bg-white ring-2 ring-gray-200 text-sm">
                                                        {getIconForType(log.type)}
                                                    </span>
                                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                                                        <div>
                                                            <h4 className="text-sm font-semibold text-gray-900">{log.type.replace(/_/g, ' ')}</h4>
                                                            <p className="text-sm text-gray-600">{formatDetails(log.type, log.details)}</p>
                                                        </div>
                                                        <time className="text-xs text-gray-400 whitespace-nowrap mt-1 sm:mt-0">
                                                            {new Date(log.timestamp).toLocaleString()}
                                                        </time>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 flex justify-end">
                                    <button
                                        type="button"
                                        className="inline-flex justify-center rounded-lg border border-transparent bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                                        onClick={onClose}
                                    >
                                        Close
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
