import { useState } from "react";
import {
    PaperAirplaneIcon,
    XMarkIcon,
    EnvelopeIcon,
    LinkIcon,
    BellIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

interface EmailComposerProps {
    eventId: string;
    eventTitle: string;
    attendeeCount: number;
    onClose: () => void;
}

type EmailType = "session-link" | "reminder" | "custom";

export default function EmailComposer({
    eventId,
    eventTitle,
    attendeeCount,
    onClose,
}: EmailComposerProps) {
    const [emailType, setEmailType] = useState<EmailType>("custom");
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [sessionLink, setSessionLink] = useState("");
    const [sessionCode, setSessionCode] = useState("");
    const [sending, setSending] = useState(false);

    const handleSend = async () => {
        setSending(true);
        const token = localStorage.getItem("token");
        const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

        try {
            let endpoint = "";
            let body = {};

            switch (emailType) {
                case "session-link":
                    if (!sessionLink || !sessionCode) {
                        toast.error("Please provide session link and code");
                        setSending(false);
                        return;
                    }
                    endpoint = `${apiBase}/events/${eventId}/send-session-link`;
                    body = { sessionLink, sessionCode };
                    break;

                case "reminder":
                    endpoint = `${apiBase}/events/${eventId}/send-reminder`;
                    body = {};
                    break;

                case "custom":
                    if (!subject || !message) {
                        toast.error("Please provide subject and message");
                        setSending(false);
                        return;
                    }
                    endpoint = `${apiBase}/events/${eventId}/send-custom-email`;
                    body = { subject, message };
                    break;
            }

            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                throw new Error("Failed to send emails");
            }

            const data = await response.json();
            toast.success(
                `Emails sent successfully! ${data.data?.sent || attendeeCount} sent${data.data?.failed ? `, ${data.data.failed} failed` : ""
                }`
            );
            onClose();
        } catch (error) {
            console.error("Send email error:", error);
            toast.error("Failed to send emails");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-brand-accent/10">
                    <div>
                        <h2 className="text-xl font-bold text-brand-dark">Send Email to Attendees</h2>
                        <p className="text-sm text-brand-muted mt-1">
                            {eventTitle} • {attendeeCount} attendees
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-brand-surface rounded-lg transition-colors"
                    >
                        <XMarkIcon className="h-5 w-5 text-brand-muted" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Email Type Selection */}
                    <div className="space-y-3">
                        <label className="block text-sm font-bold text-brand-dark uppercase">
                            Email Type
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <button
                                onClick={() => setEmailType("session-link")}
                                className={`p-4 rounded-lg border-2 transition-all ${emailType === "session-link"
                                        ? "border-brand-primary bg-brand-primary/5"
                                        : "border-brand-accent/20 hover:border-brand-accent/40"
                                    }`}
                            >
                                <LinkIcon className="h-6 w-6 text-brand-primary mx-auto mb-2" />
                                <p className="text-sm font-bold text-brand-dark">Session Link</p>
                                <p className="text-xs text-brand-muted mt-1">Share join link</p>
                            </button>

                            <button
                                onClick={() => setEmailType("reminder")}
                                className={`p-4 rounded-lg border-2 transition-all ${emailType === "reminder"
                                        ? "border-brand-primary bg-brand-primary/5"
                                        : "border-brand-accent/20 hover:border-brand-accent/40"
                                    }`}
                            >
                                <BellIcon className="h-6 w-6 text-brand-primary mx-auto mb-2" />
                                <p className="text-sm font-bold text-brand-dark">Reminder</p>
                                <p className="text-xs text-brand-muted mt-1">Event reminder</p>
                            </button>

                            <button
                                onClick={() => setEmailType("custom")}
                                className={`p-4 rounded-lg border-2 transition-all ${emailType === "custom"
                                        ? "border-brand-primary bg-brand-primary/5"
                                        : "border-brand-accent/20 hover:border-brand-accent/40"
                                    }`}
                            >
                                <EnvelopeIcon className="h-6 w-6 text-brand-primary mx-auto mb-2" />
                                <p className="text-sm font-bold text-brand-dark">Custom</p>
                                <p className="text-xs text-brand-muted mt-1">Write your own</p>
                            </button>
                        </div>
                    </div>

                    {/* Session Link Fields */}
                    {emailType === "session-link" && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-brand-dark">
                                    Session Link
                                </label>
                                <input
                                    type="url"
                                    value={sessionLink}
                                    onChange={(e) => setSessionLink(e.target.value)}
                                    placeholder="https://eventlive.com/session/..."
                                    className="input-field w-full"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-brand-dark">
                                    Session Code
                                </label>
                                <input
                                    type="text"
                                    value={sessionCode}
                                    onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                                    placeholder="ABC123"
                                    className="input-field w-full font-mono"
                                    maxLength={10}
                                />
                            </div>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-800">
                                    <strong>📧 Email Preview:</strong> Attendees will receive a beautifully
                                    formatted email with the session link, code, event date/time, and a "Join
                                    Session" button.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Reminder Info */}
                    {emailType === "reminder" && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <p className="text-sm text-yellow-800 mb-2">
                                <strong>⏰ Event Reminder Email</strong>
                            </p>
                            <p className="text-sm text-yellow-700">
                                Attendees will receive a reminder email with:
                            </p>
                            <ul className="list-disc list-inside text-sm text-yellow-700 mt-2 space-y-1">
                                <li>Event date and time</li>
                                <li>Join event button</li>
                                <li>Pre-event checklist</li>
                                <li>Preparation tips</li>
                            </ul>
                        </div>
                    )}

                    {/* Custom Email Fields */}
                    {emailType === "custom" && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-brand-dark">Subject</label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="Email subject..."
                                    className="input-field w-full"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-brand-dark">Message</label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Write your message here..."
                                    rows={8}
                                    className="input-field w-full resize-none"
                                />
                                <p className="text-xs text-brand-muted">
                                    {message.length} characters • Personalized with attendee names
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-brand-accent/10 bg-brand-surface/30">
                    <p className="text-sm text-brand-muted">
                        Will be sent to <strong>{attendeeCount}</strong> attendees
                    </p>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-bold text-brand-muted hover:text-brand-dark transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSend}
                            disabled={sending}
                            className="px-6 py-2 text-sm font-bold text-white bg-brand-primary hover:bg-brand-dark rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {sending ? (
                                <>
                                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <PaperAirplaneIcon className="h-4 w-4" />
                                    Send Emails
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
