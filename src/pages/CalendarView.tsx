import { useState } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    isToday,
    parseISO
} from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { useEvents } from '../hooks/useEvents';
import { useNavigate } from 'react-router-dom';

export default function CalendarView() {
    const navigate = useNavigate();
    const { events, loading } = useEvents();
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const goToToday = () => setCurrentMonth(new Date());

    // Generate calendar grid
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Filter events for the current view (optional optimization, but we can just map all)
    // Actually, mapping all is fine for client-side lists unless huge.

    return (
        <div className="max-w-7xl mx-auto p-4 lg:p-8 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-brand-dark flex items-center gap-3">
                        <CalendarIcon className="h-8 w-8 text-brand-primary" />
                        Calendar
                    </h1>
                    <p className="text-brand-muted text-sm mt-1">View your schedule and upcoming events.</p>
                </div>

                <div className="flex items-center gap-2 bg-white rounded-xl shadow-sm border border-brand-accent/10 p-1 self-start md:self-auto">
                    <button
                        onClick={prevMonth}
                        className="p-2 hover:bg-brand-surface rounded-lg text-brand-dark transition-colors"
                        aria-label="Previous Month"
                    >
                        <ChevronLeftIcon className="h-5 w-5" />
                    </button>
                    <span className="px-4 font-bold text-lg min-w-[140px] text-center text-brand-dark">
                        {format(currentMonth, 'MMMM yyyy')}
                    </span>
                    <button
                        onClick={nextMonth}
                        className="p-2 hover:bg-brand-surface rounded-lg text-brand-dark transition-colors"
                        aria-label="Next Month"
                    >
                        <ChevronRightIcon className="h-5 w-5" />
                    </button>
                    <div className="w-px h-6 bg-brand-accent/20 mx-1" />
                    <button
                        onClick={goToToday}
                        className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors"
                    >
                        Today
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white border border-brand-accent/20 rounded-xl shadow-xl shadow-brand-dark/5 overflow-hidden">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 border-b border-brand-accent/10 bg-brand-surface/50">
                    {weekDays.map(day => (
                        <div key={day} className="py-3 text-center text-xs font-bold uppercase text-brand-muted tracking-wide">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days */}
                <div className="grid grid-cols-7 auto-rows-fr bg-brand-accent/10 gap-px">
                    {calendarDays.map((day) => {
                        const isCurrentMonth = isSameMonth(day, monthStart);
                        const isDayToday = isToday(day);

                        // Find events for this day
                        const dayEvents = events.filter(event =>
                            isSameDay(parseISO(event.startTime), day)
                        );

                        return (
                            <div
                                key={day.toString()}
                                className={`min-h-[120px] bg-white p-2 transition-colors hover:bg-brand-surface/30 flex flex-col gap-1
                                    ${!isCurrentMonth ? 'bg-brand-surface/20 text-brand-muted' : 'text-brand-dark'}
                                    ${isDayToday ? 'bg-brand-primary/5' : ''}
                                `}
                            >
                                <div className="flex justify-between items-start">
                                    <span
                                        className={`text-sm font-semibold h-7 w-7 flex items-center justify-center rounded-full
                                        ${isDayToday ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/30' : ''}
                                        ${!isCurrentMonth ? 'opacity-50' : ''}
                                    `}>
                                        {format(day, 'd')}
                                    </span>
                                </div>

                                <div className="flex-1 flex flex-col gap-1 mt-1 overflow-y-auto custom-scrollbar">
                                    {dayEvents.map(event => (
                                        <button
                                            key={event.id}
                                            onClick={() => navigate(`/dashboard/events/${event.id}`)}
                                            className="text-left group text-xs p-1.5 rounded-md bg-brand-surface border border-brand-accent/10 hover:border-brand-primary/50 hover:shadow-sm transition-all text-brand-dark truncate w-full"
                                            title={event.title}
                                        >
                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                <div className="h-1.5 w-1.5 rounded-full bg-brand-primary shrink-0" />
                                                <span className="font-bold truncate">{format(parseISO(event.startTime), 'HH:mm')}</span>
                                            </div>
                                            <span className="block truncate opacity-90 group-hover:text-brand-primary transition-colors">
                                                {event.title}
                                            </span>
                                        </button>
                                    ))}
                                    {/* Show "more" if needed, but scrolling handled by flex-col */}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {loading && (
                <div className="flex justify-center mt-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
                </div>
            )}
        </div>
    );
}
