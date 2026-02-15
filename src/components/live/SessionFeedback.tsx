import React, { useState } from 'react';
import {
    CheckCircleIcon,
    StarIcon as StarIconOutline
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface SessionFeedbackProps {
    event: any;
    theme: 'light' | 'dark';
    onSubmit: (feedback: string, rating: number, requests: { transcript: boolean; recording: boolean }) => Promise<void>;
    onSkip: () => void;
    submitting: boolean;
}

export const SessionFeedback: React.FC<SessionFeedbackProps> = ({
    event,
    theme,
    onSubmit,
    onSkip,
    submitting
}) => {
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState("");
    const [requestTranscript, setRequestTranscript] = useState(false);
    const [requestRecording, setRequestRecording] = useState(false);

    const handleSubmit = () => {
        onSubmit(feedback, rating, { transcript: requestTranscript, recording: requestRecording });
    };

    return (
        <div className={`flex h-screen w-full items-center justify-center p-6 font-sans transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
            <div className={`w-full max-w-lg rounded-2xl p-8 shadow-2xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
                <div className="text-center mb-8">
                    <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-4 ${theme === 'dark' ? 'bg-green-500/10' : 'bg-green-100'}`}>
                        <CheckCircleIcon className="h-10 w-10 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Session Ended</h2>
                    <p className="opacity-70">Thank you for attending <strong>{event?.title}</strong>.</p>
                </div>

                <div className="space-y-6">
                    {/* Rating */}
                    <div className="flex flex-col items-center gap-2">
                        <p className="text-sm font-medium opacity-80">How would you rate this session?</p>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setRating(star)}
                                    className={`transition-transform hover:scale-110 ${rating >= star ? 'text-yellow-400' : 'text-gray-400 opacity-30'}`}
                                >
                                    {rating >= star ? <StarIconSolid className="h-8 w-8" /> : <StarIconOutline className="h-8 w-8" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Requests */}
                    <div className={`p-4 rounded-xl space-y-3 ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                        <p className="text-sm font-bold opacity-80 mb-2">I would like to receive:</p>
                        <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                            <input
                                type="checkbox"
                                checked={requestTranscript}
                                onChange={e => setRequestTranscript(e.target.checked)}
                                className="h-5 w-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                            />
                            <span>Session Transcript</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                            <input
                                type="checkbox"
                                checked={requestRecording}
                                onChange={e => setRequestRecording(e.target.checked)}
                                className="h-5 w-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                            />
                            <span>Recorded Video</span>
                        </label>
                    </div>

                    {/* Feedback */}
                    <div>
                        <label className="block text-sm font-medium opacity-80 mb-2">Any additional feedback?</label>
                        <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="Share your thoughts with the organizer..."
                            className={`w-full rounded-lg h-24 p-3 outline-none ring-1 focus:ring-2 ring-brand-primary/50 ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'}`}
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onSkip}
                            className={`flex-1 py-3 rounded-lg font-medium transition-colors ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                        >
                            Skip
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="flex-1 py-3 rounded-lg font-bold text-white bg-brand-primary hover:bg-brand-primary/90 transition-all shadow-lg shadow-brand-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Sending...' : 'Submit Feedback'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
