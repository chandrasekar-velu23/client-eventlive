import React, { useState } from 'react';
import { PlusIcon, TrashIcon, ChartBarIcon, XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline'; // Icons
import { toast } from 'sonner';
import Button from '../ui/Button';

interface PollOption {
    id: number;
    text: string;
    votes: number;
}

interface Poll {
    _id: string;
    question: string;
    options: PollOption[];
    isActive: boolean;
    totalVotes: number;
    userVoted?: boolean;
}

interface PollsWidgetProps {
    polls: Poll[];
    activePoll: Poll | null;
    createPoll: (question: string, options: string[]) => void;
    votePoll: (pollId: string, optionId: number) => void;
    isHost: boolean;
}

export const PollsWidget: React.FC<PollsWidgetProps> = ({
    polls,
    createPoll,
    votePoll,
    isHost,
}) => {
    const [view, setView] = useState<'list' | 'create'>('list');
    const [newQuestion, setNewQuestion] = useState('');
    const [newOptions, setNewOptions] = useState<string[]>(['', '']);

    const handleCreate = () => {
        if (!newQuestion.trim()) {
            toast.error("Please enter a question");
            return;
        }
        if (newOptions.filter(o => o.trim()).length < 2) {
            toast.error("Please provide at least 2 options");
            return;
        }

        createPoll(newQuestion, newOptions.filter(o => o.trim()));
        setNewQuestion('');
        setNewOptions(['', '']);
        setView('list');
        toast.success("Poll created successfully");
    };

    const addOption = () => {
        if (newOptions.length >= 5) {
            toast.error("Maximum 5 options allowed");
            return;
        }
        setNewOptions([...newOptions, '']);
    };

    const removeOption = (idx: number) => {
        if (newOptions.length <= 2) return;
        setNewOptions(newOptions.filter((_, i) => i !== idx));
    };

    const updateOption = (idx: number, val: string) => {
        const updated = [...newOptions];
        updated[idx] = val;
        setNewOptions(updated);
    };

    // Light theme styles
    const containerClass = 'bg-white border-gray-200 shadow-sm';
    const textClass = 'text-gray-900';
    const subTextClass = 'text-gray-500';
    const inputClass = 'bg-gray-50/50 border-gray-200 text-gray-900 placeholder-gray-400';

    return (
        <div className="flex flex-col h-full bg-transparent overflow-hidden">
            {/* Header / Actions */}
            {isHost && (
                <div className="p-4 border-b border-gray-100">
                    {view === 'list' ? (
                        <Button
                            variant="secondary"
                            onClick={() => setView('create')}
                            className="w-full text-xs h-9 bg-brand-600/10 border-brand-600/20 text-brand-400 hover:bg-brand-600/20 hover:text-brand-300"
                        >
                            <PlusIcon className="w-4 h-4 mr-2" /> Create New Poll
                        </Button>
                    ) : (
                        <Button
                            variant="glass"
                            onClick={() => setView('list')}
                            className="w-full text-xs h-9 text-gray-500 hover:text-gray-900"
                        >
                            <XMarkIcon className="w-4 h-4 mr-2" /> Cancel
                        </Button>
                    )}
                </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {view === 'create' && isHost ? (
                    <div className={`space-y-4 animate-fade-in p-4 rounded-xl border ${containerClass}`}>
                        <div>
                            <label className={`block text-xs font-bold mb-1.5 ${subTextClass}`}>Question</label>
                            <input
                                type="text"
                                placeholder="Ask something..."
                                value={newQuestion}
                                onChange={(e) => setNewQuestion(e.target.value)}
                                className={`w-full p-3 rounded-lg text-sm border focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 outline-none transition-all ${inputClass}`}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className={`block text-xs font-bold ${subTextClass}`}>Options</label>
                            {newOptions.map((opt, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder={`Option ${idx + 1}`}
                                        value={opt}
                                        onChange={(e) => updateOption(idx, e.target.value)}
                                        className={`flex-1 p-3 rounded-lg text-sm border focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 outline-none transition-all ${inputClass}`}
                                    />
                                    {newOptions.length > 2 && (
                                        <button
                                            onClick={() => removeOption(idx)}
                                            className="p-3 rounded-lg transition-colors text-gray-400 hover:text-red-500 hover:bg-red-50"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="pt-2 flex gap-2">
                            <button
                                onClick={addOption}
                                disabled={newOptions.length >= 5}
                                className="flex-1 py-2.5 rounded-lg text-xs font-bold border border-dashed transition-all disabled:opacity-50 border-gray-300 text-gray-400 hover:text-brand-600 hover:border-brand-300 hover:bg-brand-50"
                            >
                                + Add Option
                            </button>
                            <Button
                                variant="primary"
                                onClick={handleCreate}
                                className="flex-1 text-xs"
                            >
                                Launch Poll
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {polls.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center opacity-50">
                                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-gray-100">
                                    <ChartBarIcon className="w-8 h-8 text-gray-400" />
                                </div>
                                <p className={`font-bold ${textClass}`}>No polls yet</p>
                                {isHost ? (
                                    <p className={`text-xs mt-1 ${subTextClass}`}>Create a poll to engage your audience</p>
                                ) : (
                                    <p className={`text-xs mt-1 ${subTextClass}`}>Waiting for the host to start a poll</p>
                                )}
                            </div>
                        ) : (
                            // Reverse to show newest first
                            [...polls].reverse().map((poll) => (
                                <div key={poll._id} className={`p-4 rounded-xl border shadow-lg ${containerClass}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className={`font-bold text-sm leading-snug ${textClass}`}>{poll.question}</h4>
                                        {poll.isActive && (
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full uppercase tracking-wider border border-green-200">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Live
                                            </span>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        {poll.options.map((opt, idx) => {
                                            const percentage = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
                                            const isLeading = poll.totalVotes > 0 && opt.votes === Math.max(...poll.options.map(o => o.votes));

                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => votePoll(poll._id, idx)}
                                                    disabled={poll.userVoted || !poll.isActive}
                                                    className={`relative w-full text-left rounded-lg overflow-hidden group transition-all border border-transparent ${poll.userVoted
                                                        ? 'bg-gray-50'
                                                        : (poll.isActive
                                                            ? 'bg-gray-50 hover:bg-gray-100 hover:border-gray-200'
                                                            : 'bg-gray-50 opacity-60' + ' cursor-not-allowed')
                                                        }`}
                                                >
                                                    {/* Progress Bar Background */}
                                                    {poll.userVoted && (
                                                        <div
                                                            className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out ${isLeading ? 'bg-brand-100' : 'bg-gray-200'}`}
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    )}

                                                    <div className="relative p-3 flex items-center justify-between text-sm z-10">
                                                        <span className="font-medium text-gray-700">
                                                            {opt.text}
                                                        </span>
                                                        {poll.userVoted && (
                                                            <span className={`font-bold tabular-nums text-xs ${isLeading ? 'text-brand-600' : 'text-gray-500'}`}>
                                                                {percentage}%
                                                            </span>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                                        <span>{poll.totalVotes} votes</span>
                                        {poll.userVoted && (
                                            <span className="flex items-center gap-1.5 text-brand-600 font-bold bg-brand-50 px-2 py-0.5 rounded-full">
                                                <CheckCircleIcon className="w-3.5 h-3.5" /> Voted
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PollsWidget;
