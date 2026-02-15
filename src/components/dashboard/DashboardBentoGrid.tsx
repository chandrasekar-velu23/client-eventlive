import { NavLink } from 'react-router-dom';
import {
    PlusIcon,
    CalendarIcon,
    UsersIcon,
    CurrencyDollarIcon,
    ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

interface BentoGridProps {
    stats: {
        totalEvents: number;
        totalAttendees: number;
        totalRevenue: number;
    };
    activeEvent?: {
        id: string;
        title: string;
        date: string;
        attendees: number;
        imageUrl?: string;
    };
    recentActivity: Array<{
        id: string;
        text: string;
        time: string;
    }>;
}

export default function DashboardBentoGrid({ stats, activeEvent, recentActivity }: BentoGridProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[minmax(180px,auto)]">

            {/* --- HERO CELL: Active Event (Span 2x2) --- */}
            <div className="col-span-1 md:col-span-2 lg:col-span-2 row-span-2 relative group overflow-hidden rounded-3xl border border-surface-700 bg-surface-800 transition-all hover:border-brand-500/50">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface-900/90 z-10" />

                {activeEvent?.imageUrl && (
                    <img
                        src={activeEvent.imageUrl}
                        alt="Active Event"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                )}

                <div className="absolute inset-0 z-20 p-6 flex flex-col justify-end">
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-brand-500/20 px-3 py-1 text-xs font-medium text-brand-500 backdrop-blur-md border border-brand-500/20">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
                        </span>
                        Active Now
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">{activeEvent?.title || "No Active Event"}</h2>
                    <div className="flex items-center gap-4 text-accent-100 text-sm">
                        <span className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" />
                            {activeEvent?.date || "Suggest creating one"}
                        </span>
                        <span className="flex items-center gap-1">
                            <UsersIcon className="h-4 w-4" />
                            {activeEvent?.attendees || 0} Registered
                        </span>
                    </div>

                    {activeEvent && (
                        <NavLink
                            to={`/dashboard/events/${activeEvent.id}`}
                            className="mt-4 w-fit btn-primary"
                        >
                            Manage Live Session
                        </NavLink>
                    )}
                </div>
            </div>

            {/* --- STAT CARD: Total Attendees --- */}
            <div className="card p-6 flex flex-col justify-between hover:border-brand-500/30 group">
                <div className="flex justify-between items-start">
                    <div className="p-2 rounded-xl bg-surface-700/50 text-accent-100 group-hover:bg-brand-500 group-hover:text-white transition-colors">
                        <UsersIcon className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-medium text-success flex items-center gap-1 bg-success/10 px-2 py-1 rounded-full">
                        <ArrowTrendingUpIcon className="h-3 w-3" /> +12%
                    </span>
                </div>
                <div>
                    <h3 className="text-4xl font-bold text-white mb-1">{stats.totalAttendees}</h3>
                    <p className="text-sm text-accent-500">Total Attendees</p>
                </div>
            </div>

            {/* --- STAT CARD: Total Revenue --- */}
            <div className="card p-6 flex flex-col justify-between hover:border-brand-500/30 group">
                <div className="flex justify-between items-start">
                    <div className="p-2 rounded-xl bg-surface-700/50 text-accent-100 group-hover:bg-brand-500 group-hover:text-white transition-colors">
                        <CurrencyDollarIcon className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-medium text-success flex items-center gap-1 bg-success/10 px-2 py-1 rounded-full">
                        <ArrowTrendingUpIcon className="h-3 w-3" /> +8%
                    </span>
                </div>
                <div>
                    <h3 className="text-4xl font-bold text-white mb-1">${stats.totalRevenue.toLocaleString()}</h3>
                    <p className="text-sm text-accent-500">Total Revenue</p>
                </div>
            </div>

            {/* --- QUICK ACTION: Create Event --- */}
            <NavLink
                to="/dashboard/create-event"
                className="card p-6 flex flex-col items-center justify-center gap-4 border-dashed border-2 border-surface-600 bg-transparent hover:border-brand-500 hover:bg-surface-800/50 group cursor-pointer"
            >
                <div className="h-16 w-16 rounded-full bg-surface-800 flex items-center justify-center group-hover:scale-110 group-hover:bg-brand-500 transition-all shadow-lg">
                    <PlusIcon className="h-8 w-8 text-accent-500 group-hover:text-white" />
                </div>
                <div className="text-center">
                    <h3 className="text-lg font-bold text-white group-hover:text-brand-500 transition-colors">Create New Event</h3>
                    <p className="text-xs text-accent-500">Launch a webinar or conference</p>
                </div>
            </NavLink>

            {/* --- ACTIVITY FEED (Tall Cell) --- */}
            <div className="col-span-1 md:col-span-2 lg:col-span-1 row-span-1 lg:row-span-2 card p-6 flex flex-col">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
                    Live Activity
                </h3>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                    {recentActivity.length > 0 ? (
                        recentActivity.map((activity) => (
                            <div key={activity.id} className="flex gap-3 items-start group">
                                <div className="mt-1 h-2 w-2 rounded-full bg-surface-600 group-hover:bg-brand-500 transition-colors" />
                                <div>
                                    <p className="text-sm text-accent-100 group-hover:text-white transition-colors">{activity.text}</p>
                                    <p className="text-xs text-accent-500">{activity.time}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-accent-500 text-center py-4">No recent activity</p>
                    )}
                </div>

                <div className="mt-4 pt-4 border-t border-surface-700">
                    <NavLink to="/dashboard/analytics" className="text-xs font-bold text-brand-500 hover:text-brand-600 uppercase tracking-wider">
                        View All Analytics &rarr;
                    </NavLink>
                </div>
            </div>

        </div>
    );
}
