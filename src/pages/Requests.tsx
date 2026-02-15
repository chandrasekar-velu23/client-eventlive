import { useState, useEffect } from "react";

import {
    InboxStackIcon,
    EnvelopeIcon,
    VideoCameraIcon,
    DocumentTextIcon
} from "@heroicons/react/24/outline";

// Mock data for requests since backend API endpoint doesn't exist yet for listing them
const MOCK_REQUESTS = [
    {
        id: '1',
        type: 'transcript',
        eventId: 'evt_123',
        eventTitle: 'Future of AI Conference',
        status: 'completed',
        date: '2023-10-15T10:30:00Z',
        response: 'Transcript is ready and sent to your email.'
    },
    {
        id: '2',
        type: 'recording',
        eventId: 'evt_456',
        eventTitle: 'React Summit 2024',
        status: 'pending',
        date: '2023-10-18T14:20:00Z',
        response: null
    },
    {
        id: '3',
        type: 'inquiry',
        eventId: 'evt_789',
        eventTitle: 'Web3 Workshop',
        status: 'responded',
        date: '2023-10-20T09:15:00Z',
        response: 'Hi, yes, the workshop materials will be shared after the session.'
    }
];

export default function Requests() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate API fetch
        const timer = setTimeout(() => {
            setRequests(MOCK_REQUESTS);
            setLoading(false);
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'text-green-600 bg-green-50 border-green-200';
            case 'pending': return 'text-amber-600 bg-amber-50 border-amber-200';
            case 'responded': return 'text-blue-600 bg-blue-50 border-blue-200';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'transcript': return DocumentTextIcon;
            case 'recording': return VideoCameraIcon;
            default: return EnvelopeIcon;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-brand-dark">My Requests</h1>
                    <p className="text-sm text-brand-muted">Track your inquiries and resource requests</p>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12 text-brand-muted">Loading requests...</div>
            ) : requests.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                    <div className="mx-auto h-12 w-12 text-gray-300 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <InboxStackIcon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-brand-dark">No requests found</h3>
                    <p className="text-sm text-brand-muted max-w-sm mx-auto mt-2">
                        You haven't made any requests yet. Requests for transcripts, recordings, or inquiries will appear here.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {requests.map((req) => {
                        const Icon = getTypeIcon(req.type);
                        return (
                            <div key={req.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-6">
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider border ${getStatusColor(req.status)}`}>
                                            {req.status}
                                        </span>
                                        <span className="text-xs text-brand-muted">{new Date(req.date).toLocaleDateString()}</span>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-brand-surface rounded-lg text-brand-primary shrink-0">
                                            <Icon className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-brand-dark text-lg capitalize">{req.type} Request</h3>
                                            <p className="text-sm text-brand-muted">Event: <span className="font-medium text-brand-dark">{req.eventTitle}</span></p>
                                        </div>
                                    </div>
                                </div>

                                {req.response && (
                                    <div className="md:w-1/3 bg-gray-50 rounded-lg p-4 border border-gray-100 text-sm">
                                        <p className="font-bold text-brand-dark mb-1 flex items-center gap-2">
                                            <EnvelopeIcon className="h-4 w-4 text-brand-primary" /> Organizer Response:
                                        </p>
                                        <p className="text-gray-600 leading-relaxed">
                                            "{req.response}"
                                        </p>
                                    </div>
                                )}

                                {!req.response && (
                                    <div className="md:w-1/3 flex items-center justify-center bg-gray-50 rounded-lg p-4 border border-gray-100 text-sm italic text-gray-400">
                                        No response yet.
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
