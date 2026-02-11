
import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, PaperAirplaneIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { sendAttendeeEmail } from '../../services/api';
import { toast } from 'sonner';

interface EmailComposerModalProps {
    isOpen: boolean;
    onClose: () => void;
    toEmail: string | string[]; // Single email or array for bulk
    defaultSubject?: string;
    userName?: string;
}

const TEMPLATES = [
    {
        id: 'welcome',
        name: 'Welcome Message',
        subject: 'Welcome to the Event!',
        content: 'Hi {{name}},\n\nWe are excited to have you join us! Please let us know if you have any questions.\n\nBest,\nEvent Team'
    },
    {
        id: 'reminder',
        name: 'Event Reminder',
        subject: 'Reminder: Event Starting Soon',
        content: 'Hi {{name}},\n\nJust a friendly reminder that the event is starting soon. We look forward to seeing you there!\n\nBest,\nEvent Team'
    },
    {
        id: 'thanks',
        name: 'Thank You',
        subject: 'Thank You for Attending',
        content: 'Hi {{name}},\n\nThank you for attending our event. We hope you found it valuable.\n\nBest,\nEvent Team'
    },
];

export default function EmailComposerModal({
    isOpen,
    onClose,
    toEmail,
    defaultSubject = '',
    userName = 'Attendee',
}: EmailComposerModalProps) {
    const [subject, setSubject] = useState(defaultSubject);
    const [content, setContent] = useState('');
    const [sending, setSending] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState('');

    useEffect(() => {
        if (isOpen) {
            setSubject(defaultSubject);
            setContent('');
            setSelectedTemplate('');
        }
    }, [isOpen, defaultSubject]);

    const handleTemplateChange = (templateId: string) => {
        const template = TEMPLATES.find(t => t.id === templateId);
        if (template) {
            setSelectedTemplate(templateId);
            setSubject(template.subject);
            setContent(template.content.replace('{{name}}', Array.isArray(toEmail) ? 'Everyone' : userName));
        } else {
            setSelectedTemplate('');
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);

        try {
            const emails = Array.isArray(toEmail) ? toEmail : [toEmail];

            // In a real app, we might want to handle bulk sending in backend
            // For now, we loop or send as one request if backend supports it. 
            // Our backend sendAttendeeEmail takes a single email. 
            // So we should loop here or improve backend.
            // Given the requirement "Send to All", looping might be slow but safe for now.
            // Better to upgrade backend for bulk, but for this task I'll just loop sequentially for simplicity/safety.

            let successCount = 0;
            for (const email of emails) {
                await sendAttendeeEmail({
                    toEmail: email,
                    subject,
                    content,
                });
                successCount++;
            }

            toast.success(`Sent ${successCount} email(s) successfully`);
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Failed to send email. Please try again.');
        } finally {
            setSending(false);
        }
    };

    const recipientsLabel = Array.isArray(toEmail)
        ? `${toEmail.length} Recipients`
        : toEmail;

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
                            <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <div className="flex items-center justify-between mb-6">
                                    <Dialog.Title as="h3" className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <EnvelopeIcon className="h-6 w-6 text-brand-primary" />
                                        Compose Email
                                    </Dialog.Title>
                                    <button
                                        onClick={onClose}
                                        className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100 transition-colors"
                                    >
                                        <XMarkIcon className="h-6 w-6" />
                                    </button>
                                </div>

                                <form onSubmit={handleSend} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            To:
                                        </label>
                                        <div className="p-2 bg-gray-100 rounded text-sm text-gray-700 truncate">
                                            {recipientsLabel}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Template (Optional):
                                        </label>
                                        <select
                                            value={selectedTemplate}
                                            onChange={(e) => handleTemplateChange(e.target.value)}
                                            className="input-field w-full"
                                        >
                                            <option value="">Select a template...</option>
                                            {TEMPLATES.map(t => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                                            Subject
                                        </label>
                                        <input
                                            type="text"
                                            id="subject"
                                            required
                                            value={subject}
                                            onChange={(e) => setSubject(e.target.value)}
                                            className="input-field w-full"
                                            placeholder="Enter email subject"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                                            Message
                                        </label>
                                        <textarea
                                            id="content"
                                            required
                                            rows={6}
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                            className="input-field w-full resize-none"
                                            placeholder="Type your message here..."
                                        />
                                    </div>

                                    <div className="mt-6 flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="btn btn-secondary"
                                            disabled={sending}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-primary flex items-center gap-2"
                                            disabled={sending}
                                        >
                                            {sending ? 'Sending...' : (
                                                <>
                                                    <PaperAirplaneIcon className="h-4 w-4" />
                                                    Send Email
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
