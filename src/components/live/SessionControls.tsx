import React from 'react';
import {
    MicrophoneIcon,
    VideoCameraIcon,
    VideoCameraSlashIcon,
    PhoneXMarkIcon,
    ChatBubbleLeftRightIcon,
    UsersIcon,
    ChartBarIcon,
    ComputerDesktopIcon,
    StopIcon,
    PaperAirplaneIcon,
    EllipsisVerticalIcon
} from '@heroicons/react/24/outline';

interface SessionControlsProps {
    audioEnabled: boolean;
    videoEnabled: boolean;
    onToggleAudio: () => void;
    onToggleVideo: () => void;
    onLeave: () => void;
    theme: 'light' | 'dark';
    onToggleSidebar: (view: 'chat' | 'participants' | 'polls') => void;
    activeSidebarView: 'chat' | 'participants' | 'polls' | null;
    isScreenSharing: boolean;
    onToggleScreenShare: () => void;
    isRecording: boolean;
    onToggleRecording: () => void;
    onSendFile?: (file: File) => void;
}

export const SessionControls: React.FC<SessionControlsProps> = ({
    audioEnabled,
    videoEnabled,
    onToggleAudio,
    onToggleVideo,
    onLeave,
    theme,
    onToggleSidebar,
    activeSidebarView,
    isScreenSharing,
    onToggleScreenShare,
    isRecording,
    onToggleRecording,
    onSendFile
}) => {
    return (
        <footer className={`flex h-20 shrink-0 items-center justify-center gap-4 border-t px-4 pb-2 transition-colors ${theme === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
            <button
                onClick={onToggleAudio}
                className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors shadow-sm ${audioEnabled ? (theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300 text-gray-900') : 'bg-red-500 hover:bg-red-600 text-white'}`}
                title={audioEnabled ? "Mute" : "Unmute"}
            >
                {audioEnabled ? <MicrophoneIcon className="h-6 w-6" /> : <MicrophoneIcon className="h-6 w-6 opacity-50" />}
            </button>

            <button
                onClick={onToggleVideo}
                className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors shadow-sm ${videoEnabled ? (theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300 text-gray-900') : 'bg-red-500 hover:bg-red-600 text-white'}`}
                title={videoEnabled ? "Stop Video" : "Start Video"}
            >
                {videoEnabled ? <VideoCameraIcon className="h-6 w-6" /> : <VideoCameraSlashIcon className="h-6 w-6" />}
            </button>

            <div className={`mx-4 h-8 w-px ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`} />

            <button
                onClick={() => onToggleSidebar('chat')}
                className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors shadow-sm ${activeSidebarView === 'chat' ? 'bg-brand-primary text-white' : (theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300 text-gray-900')}`}
                title="Chat"
            >
                <ChatBubbleLeftRightIcon className="h-6 w-6" />
            </button>
            <button
                onClick={() => onToggleSidebar('participants')}
                className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors shadow-sm ${activeSidebarView === 'participants' ? 'bg-brand-primary text-white' : (theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300 text-gray-900')}`}
                title="Participants"
            >
                <UsersIcon className="h-6 w-6" />
            </button>
            <button
                onClick={() => onToggleSidebar('polls')}
                className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors shadow-sm ${activeSidebarView === 'polls' ? 'bg-brand-primary text-white' : (theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300 text-gray-900')}`}
                title="Polls & Q&A"
            >
                <ChartBarIcon className="h-6 w-6" />
            </button>

            <div className={`mx-4 h-8 w-px ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`} />

            {/* More Options Menu (Mockup for now, could be a real dropdown) */}
            <div className="relative group">
                <button
                    className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors shadow-sm ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'}`}
                >
                    <EllipsisVerticalIcon className="h-6 w-6" />
                </button>

                {/* Dropdown Content */}
                <div className={`absolute bottom-16 right-0 mb-2 w-48 rounded-lg shadow-xl overflow-hidden ${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} hidden group-hover:block`}>
                    <div className="p-1 flex flex-col gap-1">
                        <button
                            onClick={onToggleRecording}
                            className={`flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors w-full ${isRecording ? 'text-red-500 bg-red-500/10' : (theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100')}`}
                        >
                            {isRecording ? <StopIcon className="h-5 w-5" /> : <VideoCameraIcon className="h-5 w-5" />}
                            {isRecording ? "Stop Recording" : "Start Recording"}
                        </button>

                        <button
                            onClick={onToggleScreenShare}
                            className={`flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors w-full ${isScreenSharing ? 'text-blue-500 bg-blue-500/10' : (theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100')}`}
                        >
                            <ComputerDesktopIcon className="h-5 w-5" />
                            {isScreenSharing ? "Stop Sharing" : "Share Screen"}
                        </button>

                        <label
                            className={`flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors w-full cursor-pointer ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                        >
                            <input
                                type="file"
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        onSendFile?.(e.target.files[0]);
                                    }
                                }}
                            />
                            <PaperAirplaneIcon className="h-5 w-5 -rotate-45" />
                            Share File
                        </label>
                    </div>
                </div>
            </div>

            <button
                onClick={onLeave}
                className="flex h-12 items-center gap-2 rounded-full bg-red-600 px-6 font-bold text-white hover:bg-red-700 transition-colors shadow-md hover:shadow-lg"
            >
                <PhoneXMarkIcon className="h-6 w-6" />
                <span className="hidden sm:inline">End</span>
            </button>
        </footer>
    );
};
