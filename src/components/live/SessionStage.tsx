import React from 'react';
import { VideoGrid } from './VideoGrid';

interface SessionStageProps {
    localStream: MediaStream | null;
    remoteStreams: { userId: string; stream: MediaStream }[];
    theme: 'light' | 'dark';
}

export const SessionStage: React.FC<SessionStageProps> = ({
    localStream,
    remoteStreams,
    theme
}) => {
    return (
        <div className="relative flex-1 overflow-hidden p-4">
            <div className={`w-full h-full rounded-2xl overflow-hidden shadow-2xl ${theme === 'dark' ? 'bg-gray-900' : 'bg-white border border-gray-200 shadow-inner'}`}>
                <VideoGrid
                    localStream={localStream}
                    remoteStreams={remoteStreams}
                    isSelf={true}
                />
            </div>
        </div>
    );
};
