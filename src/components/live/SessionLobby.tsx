import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    VideoCameraIcon,
    MicrophoneIcon,
    VideoCameraSlashIcon,
    SunIcon,
    MoonIcon,
    UserCircleIcon,
    CalendarIcon,
    ArrowRightOnRectangleIcon,
    LockClosedIcon,
    UsersIcon
} from '@heroicons/react/24/outline';

interface SessionLobbyProps {
    event: any;
    session: any;
    user: any;
    localStream: MediaStream | null;
    audioEnabled: boolean;
    videoEnabled: boolean;
    onToggleAudio: () => void;
    onToggleVideo: () => void;
    onJoin: () => void;
    isEnrolling: boolean;
    theme: 'light' | 'dark';
    onThemeToggle: () => void;
}

export const SessionLobby: React.FC<SessionLobbyProps> = ({
    event,
    session,
    user,
    localStream,
    audioEnabled,
    videoEnabled,
    onToggleAudio,
    onToggleVideo,
    onJoin,
    isEnrolling,
    theme,
    onThemeToggle
}) => {
    const navigate = useNavigate();
    const { code } = useParams();
    const start = event?.startTime ? new Date(event.startTime) : null;
    const isLate = start && !isNaN(start.getTime()) ? new Date() > start : false;

    return (
        <div className={`flex h-screen w-full flex-col font-sans transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
            <header className={`flex h-20 shrink-0 items-center justify-between border-b px-8 ${theme === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white shadow-sm'}`}>
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-primary to-purple-600 text-white shadow-lg shadow-brand-primary/20">
                        <VideoCameraIcon className="h-6 w-6" />
                    </div>
                    <span className={`text-2xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>EventLive</span>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={onThemeToggle}
                        className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
                        title="Toggle Theme"
                    >
                        {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
                    </button>

                    {user ? (
                        <div className={`flex items-center gap-3 pl-6 border-l ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}>
                            <div className="text-right hidden sm:block">
                                <p className={`text-sm font-bold leading-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{user.name}</p>
                                <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{user.email}</p>
                            </div>
                            {user.avatar ? (
                                <img src={user.avatar} alt={user.name} className="h-10 w-10 rounded-full object-cover ring-2 ring-brand-primary/20" />
                            ) : (
                                <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-white shadow-inner text-lg">
                                    {user.name?.charAt(0) || "U"}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={`flex items-center gap-3 pl-6 border-l ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}>
                            <button
                                onClick={() => navigate(`/login?returnUrl=/join/${code}`)}
                                className={`hidden sm:block px-4 py-2 text-sm font-semibold transition-colors rounded-lg ${theme === 'dark' ? 'text-gray-300 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
                            >
                                Log in
                            </button>
                            <button
                                onClick={() => navigate(`/signup?returnUrl=/join/${code}`)}
                                className="px-5 py-2.5 text-sm font-bold text-white bg-brand-primary rounded-lg shadow-lg shadow-brand-primary/20 hover:bg-brand-primary/90 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Get Started
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <main className="flex flex-1 items-center justify-center p-6 overflow-y-auto">
                <div className={`flex w-full max-w-5xl flex-col gap-8 rounded-2xl p-8 shadow-2xl md:flex-row ${theme === 'dark' ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>

                    {/* Logic split: Authenticated vs Guest */}
                    {user ? (
                        /* AUTHENTICATED LOBBY VIEW */
                        <>
                            <div className="flex-1 space-y-4">
                                <h2 className="text-xl font-bold">Check your hair</h2>
                                <div className="aspect-video w-full overflow-hidden rounded-xl bg-black relative shadow-lg ring-1 ring-white/10">
                                    {localStream && (
                                        <video
                                            ref={el => { if (el) el.srcObject = localStream }}
                                            autoPlay
                                            muted
                                            playsInline
                                            className="h-full w-full object-cover transform scale-x-[-1]"
                                        />
                                    )}
                                    {!videoEnabled && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                                            {user?.avatar ? (
                                                <img src={user.avatar} alt={user.name} className="h-24 w-24 rounded-full object-cover border-4 border-gray-800" />
                                            ) : (
                                                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center border-4 border-gray-800">
                                                    <span className="text-3xl font-bold text-white">{user?.name?.charAt(0) || "G"}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Media Controls Overlay */}
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
                                        <button
                                            onClick={onToggleAudio}
                                            className={`p-4 rounded-full shadow-lg transition-all transform hover:scale-105 ${audioEnabled ? 'bg-gray-700/90 hover:bg-gray-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'} backdrop-blur-sm ring-1 ring-white/10`}
                                            title={audioEnabled ? "Mute Microphone" : "Unmute Microphone"}
                                        >
                                            {audioEnabled ? <MicrophoneIcon className="h-6 w-6" /> : <MicrophoneIcon className="h-6 w-6 opacity-50" />}
                                        </button>
                                        <button
                                            onClick={onToggleVideo}
                                            className={`p-4 rounded-full shadow-lg transition-all transform hover:scale-105 ${videoEnabled ? 'bg-gray-700/90 hover:bg-gray-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'} backdrop-blur-sm ring-1 ring-white/10`}
                                            title={videoEnabled ? "Stop Camera" : "Start Camera"}
                                        >
                                            {videoEnabled ? <VideoCameraIcon className="h-6 w-6" /> : <VideoCameraSlashIcon className="h-6 w-6" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-1 flex-col justify-center space-y-6">
                                {/* Event & Host Info */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="inline-block rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-bold text-brand-primary uppercase tracking-wider ring-1 ring-brand-primary/20">
                                            {event?.category || "Live Event"}
                                        </span>
                                        {isLate && (
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold text-red-500 uppercase tracking-wider ring-1 ring-red-500/20 animate-pulse">
                                                <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" /> Live Now
                                            </span>
                                        )}
                                    </div>
                                    <h1 className={`text-3xl lg:text-4xl font-extrabold leading-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                        {event?.title}
                                    </h1>

                                    <div className="mt-6 flex items-center gap-4 bg-gray-500/5 p-4 rounded-xl border border-gray-500/10">
                                        {event?.organizerLogo ? (
                                            <img src={event.organizerLogo} className="h-12 w-12 rounded-full object-cover ring-2 ring-brand-primary/20" alt="Organizer" />
                                        ) : (
                                            <div className="h-12 w-12 rounded-full bg-brand-primary/20 flex items-center justify-center ring-2 ring-brand-primary/20">
                                                <UserCircleIcon className="h-8 w-8 text-brand-primary" />
                                            </div>
                                        )}
                                        <div>
                                            <p className={`text-base font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{event?.organizerDisplayName || "Event Organizer"}</p>
                                            <p className={`text-xs uppercase tracking-wider font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Host</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Join Action */}
                                <div className="pt-2 space-y-4">
                                    <button
                                        onClick={onJoin}
                                        disabled={isEnrolling}
                                        className="w-full rounded-xl bg-brand-primary py-4 text-lg font-bold text-white shadow-lg shadow-brand-primary/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isEnrolling ? "Registering..." : (event.attendees?.includes(user?.id) || event.organizerId === user?.id ? "Join Session Now" : "Register & Join Now")}
                                    </button>
                                    {!event.attendees?.includes(user?.id) && event.organizerId !== user?.id && (
                                        <p className={`text-center text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                            Clicking Join will automatically register you for this event.
                                        </p>
                                    )}
                                    <p className={`text-center text-xs flex items-center justify-center gap-1.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                        <UsersIcon className="h-3.5 w-3.5" />
                                        {session?.participants?.length > 0 ? (
                                            <span className="font-medium">{session.participants.length} others are already in the session</span>
                                        ) : (
                                            <span>You'll be the first to join</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* GUEST / UNAUTHENTICATED VIEW */
                        <>
                            <div className="flex-1 flex flex-col justify-center items-start space-y-6 md:pr-12">
                                <div>
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary font-bold text-xs uppercase tracking-wider mb-4">
                                        <LockClosedIcon className="h-4 w-4" />
                                        Authenticated Access Only
                                    </div>
                                    <h1 className={`text-4xl lg:text-5xl font-extrabold leading-tight mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                        {event?.title}
                                    </h1>
                                    <div className="flex items-center gap-2 text-sm opacity-70 mb-8">
                                        <CalendarIcon className="h-5 w-5" />
                                        <span>{event?.startTime ? new Date(event.startTime).toLocaleString() : 'Scheduled Event'}</span>
                                    </div>
                                    <p className={`text-lg leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                        Join <strong>{event?.organizerDisplayName}</strong> and others in this exclusive live session. Please log in to verify your registration and access the event.
                                    </p>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 w-full">
                                    <button
                                        onClick={() => navigate(`/login?returnUrl=/join/${code}`)}
                                        className={`flex-1 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${theme === 'dark' ? 'bg-white text-gray-900 hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
                                    >
                                        <ArrowRightOnRectangleIcon className="h-5 w-5" />
                                        Log In to Join
                                    </button>
                                    <button
                                        onClick={() => navigate(`/signup?returnUrl=/join/${code}`)}
                                        className="flex-1 py-3.5 rounded-xl font-bold border-2 border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white transition-all"
                                    >
                                        Create Account
                                    </button>
                                </div>
                            </div>

                            {/* Decorative Side (Mock Preview) */}
                            <div className="flex-1 hidden md:flex items-center justify-center relative">
                                <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/20 to-purple-600/20 rounded-2xl blur-3xl opacity-50" />
                                {event?.coverImage ? (
                                    <img src={event.coverImage} className="relative w-full aspect-video object-cover rounded-2xl shadow-2xl ring-1 ring-white/10" alt="Event Cover" />
                                ) : (
                                    <div className={`relative w-full aspect-video rounded-2xl shadow-2xl flex items-center justify-center ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                        <VideoCameraSlashIcon className="h-24 w-24 opacity-10" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="text-center">
                                                <LockClosedIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                                <p className="font-bold opacity-50">Stream Locked</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                </div>
            </main>
        </div>
    );
};
