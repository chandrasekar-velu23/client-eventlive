import React, { useState, useEffect } from 'react';
import { BellIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

import { useNotificationContext } from '../../context/NotificationContext';

interface SessionHeaderProps {
    title: string;
    theme: 'light' | 'dark';
    onThemeToggle: () => void;
    participantCount: number;
}

export const SessionHeader: React.FC<SessionHeaderProps> = ({
    title,
    theme,
    onThemeToggle,
    participantCount
}) => {
    const [time, setTime] = useState(new Date());
    const { unreadCount } = useNotificationContext();

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <header className={`flex h-16 shrink-0 items-center justify-between border-b px-4 transition-colors ${theme === 'dark' ? 'border-gray-800 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-900 shadow-sm'}`}>

            {/* Left: Title & Participant Count */}
            <div className="flex items-center gap-4 w-1/3">
                <h1 className="text-lg font-bold truncate hidden md:block">{title}</h1>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <span>{participantCount} Online</span>
                </div>
            </div>

            {/* Center: Logo */}
            <div className="flex items-center justify-center w-1/3">
                <div className="flex items-center gap-2">
                    <img src="/EventLive.svg" alt="EventLive" className="h-8 w-auto" />
                    <span className="rounded bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-500 uppercase tracking-wider animate-pulse">
                        Live
                    </span>
                </div>
            </div>

            {/* Right: Controls & Time */}
            <div className="flex items-center justify-end gap-4 w-1/3">

                {/* Live Clock */}
                <div className={`hidden md:flex flex-col items-end text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    <span className="font-mono font-medium text-lg leading-none">
                        {format(time, 'HH:mm:ss')}
                    </span>
                    <span className="text-xs opacity-75">
                        {format(time, 'EEE, MMM d')}
                    </span>
                </div>

                <div className={`h-8 w-px ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`} />

                {/* Theme Toggle */}
                <button
                    onClick={onThemeToggle}
                    className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'}`}
                    title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                    {theme === 'dark' ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
                </button>

                {/* Notifications */}
                <button
                    className={`relative p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'}`}
                >
                    <BellIcon className="w-6 h-6" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                        </span>
                    )}
                </button>

            </div>
        </header>
    );
};
