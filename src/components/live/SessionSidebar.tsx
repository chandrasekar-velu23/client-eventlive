import React from 'react';
import LiveChat from './LiveChat';
import { PollsWidget } from './PollsWidget';
import QAPanel from './QAPanel';
import type { ChatMessage } from '../../hooks/useRealtimeChat';
import type { Poll } from '../../hooks/usePolls';
import type { Question } from '../../hooks/useQA';

interface SessionSidebarProps {
    open: boolean;
    activeView: 'chat' | 'participants' | 'polls' | 'qa' | null;
    messages: ChatMessage[];
    onSendMessage: (message: string) => Promise<void>;
    onSendFile: (file: File) => Promise<void>;

    // Polls
    polls: Poll[];
    activePoll: Poll | null;
    createPoll: (question: string, options: string[]) => void;
    votePoll: (pollId: string, optionId: number) => void;
    isHost: boolean;

    // Q&A
    questions: Question[];
    onAskQuestion: (question: string) => Promise<void>;
    onUpvoteQuestion: (questionId: string) => Promise<void>;
    onAnswerQuestion?: (questionId: string, answer: string) => Promise<void>;
    currentUserId: string;
}

export const SessionSidebar: React.FC<SessionSidebarProps> = ({
    open,
    activeView,
    messages,
    onSendMessage,
    onSendFile,
    polls,
    activePoll,
    createPoll,
    votePoll,
    isHost,
    questions,
    onAskQuestion,
    onUpvoteQuestion,
    onAnswerQuestion,
    currentUserId
}) => {
    return (
        <aside className={`${open ? 'w-80 translate-x-0' : 'w-0 translate-x-full'} transition-all duration-300 border-l flex flex-col border-gray-200 bg-white`}>
            {activeView === 'chat' && (
                <div className="h-full flex flex-col">
                    <LiveChat
                        messages={messages}
                        onSendMessage={onSendMessage}
                        onSendFile={onSendFile}
                    />
                </div>
            )}

            {activeView === 'participants' && (
                <div className="p-4">
                    <h3 className="font-bold mb-4 text-gray-900">Participants</h3>
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
                    />
                </div>
            )}

            {activeView === 'qa' && (
                <div className="h-full flex flex-col">
                    <QAPanel
                        questions={questions}
                        currentUserId={currentUserId}
                        onAskQuestion={onAskQuestion}
                        onUpvoteQuestion={onUpvoteQuestion}
                        onAnswerQuestion={onAnswerQuestion}
                        userRole={isHost ? 'organizer' : 'attendee'}
                    />
                </div>
            )}
        </aside>
    );
};

