
import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, PaperAirplaneIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { sendRequestEmail } from '../../services/api';
import { toast } from 'sonner';

interface RequestSupportModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventId?: string; // Optional context
}

export default function RequestSupportModal({
    isOpen,
    onClose,
    eventId,
}: RequestSupportModalProps) {
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [sending, setSending] = useState(false);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);

        try {
            await sendRequestEmail({
                type: 'support',
                subject: eventId ? `[Event ${eventId}] ${subject}` : subject,
                content,
            });

            toast.success('Request sent successfully!');
            setSubject('');
            setContent('');
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Failed to send request. Please try again.');
        } finally {
            setSending(false);
        }
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
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <div className="flex items-center justify-between mb-6">
                                    <Dialog.Title as="h3" className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <ChatBubbleLeftRightIcon className="h-6 w-6 text-brand-primary" />
                                        Contact Support
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
                                            placeholder="How can we help?"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                                            Message
                                        </label>
                                        <textarea
                                            id="content"
                                            required
                                            rows={4}
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                            className="input-field w-full resize-none"
                                            placeholder="Describe your issue or request..."
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
                                                    Send Request
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
