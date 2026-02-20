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
    // Open prop removed as it's handled by parent
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
        <aside className="w-full h-full flex flex-col bg-white">
            {activeView === 'chat' && (
                <div className="h-full flex flex-col">
                    <LiveChat
                        messages={messages}
                        currentUserId={currentUserId}
                        onSendMessage={onSendMessage}
                        onSendFile={onSendFile}
                    />
                </div>
            )}

            {activeView === 'participants' && (
                <div className="p-4 h-full overflow-y-auto">
                    <h3 className="font-bold mb-4 text-text-primary">Participants</h3>
                    <p className="text-text-secondary text-sm">Participant list coming soon...</p>
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

