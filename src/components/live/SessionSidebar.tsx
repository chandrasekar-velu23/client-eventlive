import React from 'react';
import LiveChat from './LiveChat';
import { PollsWidget } from './PollsWidget';
import type { ChatMessage } from '../../hooks/useRealtimeChat';
import type { Poll } from '../../hooks/usePolls';

interface SessionSidebarProps {
    open: boolean;
    activeView: 'chat' | 'participants' | 'polls' | null;
    messages: ChatMessage[];
    onSendMessage: (message: string) => Promise<void>;
    theme: 'light' | 'dark';

    // Polls
    polls: Poll[];
    activePoll: Poll | null;
    createPoll: (question: string, options: string[]) => void;
    votePoll: (pollId: string, optionId: number) => void;
    isHost: boolean;
}

export const SessionSidebar: React.FC<SessionSidebarProps> = ({
    open,
    activeView,
    messages,
    onSendMessage,
    theme,
    polls,
    activePoll,
    createPoll,
    votePoll,
    isHost
}) => {
    return (
        <aside className={`${open ? 'w-80 translate-x-0' : 'w-0 translate-x-full'} transition-all duration-300 border-l flex flex-col ${theme === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
            {activeView === 'chat' && (
                <div className="h-full flex flex-col">
                    <LiveChat
                        messages={messages}
                        onSendMessage={onSendMessage}
                    />
                </div>
            )}

            {activeView === 'participants' && (
                <div className="p-4">
                    <h3 className={`font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Participants</h3>
                    <p className="text-gray-500 text-sm">Participant list coming soon...</p>
                </div>
            )}

            {activeView === 'polls' && (
                <div className="h-full flex flex-col p-4">
                    <PollsWidget
                        polls={polls}
                        activePoll={activePoll}
                        createPoll={createPoll}
                        votePoll={votePoll}
                        isHost={isHost}
                        theme={theme}
                    />
                </div>
            )}
        </aside>
    );
};

