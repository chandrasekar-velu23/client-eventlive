import { useState, useEffect, useCallback } from 'react';
import { Socket } from 'socket.io-client';

export interface Poll {
    _id: string;
    question: string;
    options: { id: number; text: string; votes: number }[];
    isActive: boolean;
    totalVotes: number;
    userVoted?: boolean;
}

export const usePolls = (socket: Socket | null, sessionId: string | null) => {
    const [polls, setPolls] = useState<Poll[]>([]);
    const [activePoll, setActivePoll] = useState<Poll | null>(null);

    useEffect(() => {
        if (!socket || !sessionId) return;

        // Listen for new polls
        socket.on('new-poll', (poll: Poll) => {
            setPolls(prev => [...prev, poll]);
            if (poll.isActive) setActivePoll(poll);
        });

        // Listen for poll updates
        socket.on('poll-updated', ({ pollId, results, respondentCount }: any) => {
            setPolls(prev => prev.map(p => {
                if (p._id === pollId) {
                    const updated = { ...p, options: results, totalVotes: respondentCount };
                    if (activePoll?._id === pollId) setActivePoll(updated);
                    return updated;
                }
                return p;
            }));
        });

        return () => {
            socket.off('new-poll');
            socket.off('poll-updated');
        };
    }, [socket, sessionId, activePoll]);

    const createPoll = useCallback((question: string, options: string[]) => {
        if (!socket || !sessionId) return;
        socket.emit('create-poll', { sessionId, question, options });
    }, [socket, sessionId]);

    const votePoll = useCallback((pollId: string, optionId: number) => {
        if (!socket || !sessionId) return;
        socket.emit('vote-poll', { sessionId, pollId, answer: optionId });
        // Optimistic update
        setPolls(prev => prev.map(p =>
            p._id === pollId ? { ...p, userVoted: true } : p
        ));
    }, [socket, sessionId]);

    return { polls, activePoll, createPoll, votePoll };
};
