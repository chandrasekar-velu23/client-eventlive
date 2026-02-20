import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
    targetDate: Date;
    onComplete?: () => void;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate, onComplete }) => {
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    });

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = +new Date(targetDate) - +new Date();

            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60)
                });
            } else {
                // Countdown finished
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                if (onComplete) {
                    onComplete();
                }
            }
        };

        const timer = setInterval(calculateTimeLeft, 1000);
        calculateTimeLeft(); // Run immediately

        return () => clearInterval(timer);
    }, [targetDate, onComplete]);

    const TimeBox = ({ value, label }: { value: number; label: string }) => (
        <div className="flex flex-col items-center">
            <div className="w-14 h-14 sm:w-20 sm:h-20 bg-white rounded-2xl shadow-lg border border-gray-100 flex items-center justify-center mb-2">
                <span className="text-xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-brand-600 to-brand-400 font-display">
                    {value.toString().padStart(2, '0')}
                </span>
            </div>
            <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</span>
        </div>
    );

    return (
        <div className="flex gap-4 sm:gap-6">
            {timeLeft.days > 0 && <TimeBox value={timeLeft.days} label="Days" />}
            <TimeBox value={timeLeft.hours} label="Hours" />
            <TimeBox value={timeLeft.minutes} label="Minutes" />
            <TimeBox value={timeLeft.seconds} label="Seconds" />
        </div>
    );
};
