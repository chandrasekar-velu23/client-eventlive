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

    return (
        <div className="flex flex-col h-full bg-transparent overflow-hidden">
            {/* Header / Actions */}
            {isHost && (
                <div className="p-4 border-b border-white/5">
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
                            className="w-full text-xs h-9 text-zinc-400"
                        >
                            <XMarkIcon className="w-4 h-4 mr-2" /> Cancel
                        </Button>
                    )}
                </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {view === 'create' && isHost ? (
                    <div className="space-y-4 animate-fade-in bg-white/5 p-4 rounded-xl border border-white/5">
                        <div>
                            <label className="block text-xs font-bold mb-1.5 text-zinc-400">Question</label>
                            <input
                                type="text"
                                placeholder="Ask something..."
                                value={newQuestion}
                                onChange={(e) => setNewQuestion(e.target.value)}
                                className="w-full p-3 rounded-lg text-sm bg-black/50 border border-white/10 text-white placeholder-zinc-600 focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-zinc-400">Options</label>
                            {newOptions.map((opt, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder={`Option ${idx + 1}`}
                                        value={opt}
                                        onChange={(e) => updateOption(idx, e.target.value)}
                                        className="flex-1 p-3 rounded-lg text-sm bg-black/50 border border-white/10 text-white placeholder-zinc-600 focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 outline-none transition-all"
                                    />
                                    {newOptions.length > 2 && (
                                        <button
                                            onClick={() => removeOption(idx)}
                                            className="p-3 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-white/5 transition-colors"
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
                                className="flex-1 py-2.5 rounded-lg text-xs font-bold border border-dashed border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 hover:bg-white/5 transition-all disabled:opacity-50"
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
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                    <ChartBarIcon className="w-8 h-8 text-white/50" />
                                </div>
                                <p className="font-bold text-white">No polls yet</p>
                                {isHost ? (
                                    <p className="text-xs text-zinc-400 mt-1">Create a poll to engage your audience</p>
                                ) : (
                                    <p className="text-xs text-zinc-400 mt-1">Waiting for the host to start a poll</p>
                                )}
                            </div>
                        ) : (
                            // Reverse to show newest first
                            [...polls].reverse().map((poll) => (
                                <div key={poll._id} className="p-4 rounded-xl border border-white/10 bg-white/5 shadow-lg">
                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className="font-bold text-sm leading-snug text-white">{poll.question}</h4>
                                        {poll.isActive && (
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-green-400 bg-green-900/30 px-2 py-0.5 rounded-full uppercase tracking-wider border border-green-500/20">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Live
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
                                                        ? 'bg-zinc-800'
                                                        : (poll.isActive
                                                            ? 'bg-zinc-800/50 hover:bg-zinc-800 hover:border-white/10'
                                                            : 'bg-zinc-900 opacity-60 cursor-not-allowed')
                                                        }`}
                                                >
                                                    {/* Progress Bar Background */}
                                                    {poll.userVoted && (
                                                        <div
                                                            className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out ${isLeading ? 'bg-brand-600/40' : 'bg-zinc-600/30'}`}
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    )}

                                                    <div className="relative p-3 flex items-center justify-between text-sm z-10">
                                                        <span className="font-medium text-zinc-200">
                                                            {opt.text}
                                                        </span>
                                                        {poll.userVoted && (
                                                            <span className={`font-bold tabular-nums text-xs ${isLeading ? 'text-brand-300' : 'text-zinc-400'}`}>
                                                                {percentage}%
                                                            </span>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
                                        <span>{poll.totalVotes} votes</span>
                                        {poll.userVoted && (
                                            <span className="flex items-center gap-1.5 text-brand-400 font-bold bg-brand-400/10 px-2 py-0.5 rounded-full">
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
