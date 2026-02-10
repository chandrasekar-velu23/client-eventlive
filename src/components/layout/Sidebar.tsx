import { useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  Squares2X2Icon, CalendarIcon, UsersIcon,
  VideoCameraIcon, ChartBarIcon, Cog6ToothIcon, XMarkIcon,
  TicketIcon
} from "@heroicons/react/24/outline";


import { useAuth } from "../../hooks/useAuth";
import { useEvents } from "../../hooks/useEvents";



export default function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (v: boolean) => void }) {
  const { user } = useAuth();
  const { events, fetchMyEvents, fetchEnrolledEvents } = useEvents();

  const isOrganizer = user?.role === 'Organizer' || user?.role === 'Admin';

  const navItems = isOrganizer ? [
    { name: "Dashboard", href: "/dashboard", icon: Squares2X2Icon },
    { name: "Events", href: "/dashboard/events", icon: CalendarIcon }, // Manage
    { name: "Attendees", href: "/dashboard/attendees", icon: UsersIcon },
    { name: "Speakers", href: "/dashboard/speakers", icon: VideoCameraIcon },
    { name: "Analytics", href: "/dashboard/analytics", icon: ChartBarIcon },
    { name: "Settings", href: "/dashboard/settings", icon: Cog6ToothIcon },
  ] : [
    { name: "Dashboard", href: "/dashboard", icon: Squares2X2Icon },
    { name: "All Events", href: "/dashboard/all-events", icon: CalendarIcon }, // Browse
    { name: "My Enrollments", href: "/dashboard/enrolled", icon: TicketIcon },
    { name: "Settings", href: "/dashboard/settings", icon: Cog6ToothIcon },
  ];

  // Fetch a preview of the user's created events for the sidebar
  useEffect(() => {
    if (user?.id) {
      if (isOrganizer) {
        fetchMyEvents();
      } else {
        fetchEnrolledEvents();
      }
    }
  }, [user?.id, fetchMyEvents, fetchEnrolledEvents, isOrganizer]);

  const myEvents = events.slice(0, 3);

  // Safe data handling to prevent charAt crashes
  const displayName = user?.name || "Guest User";
  // const displayEmail = user?.email || "No email available";
  const displayRole = user?.role || "Attendee";

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-brand-dark/50 lg:hidden" onClick={() => setIsOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-brand-accent bg-white transition-transform lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-full flex-col">
          {/* Logo Section */}
          <div className="flex h-20 items-center justify-between px-6 border-b border-brand-accent/10 bg-white">
            <div className="flex items-center gap-3">
              <img src="/icon-EventLive.svg" alt="EventLive" className="h-8 w-8 text-brand-primary" />
              <span className="text-2xl font-black tracking-tight text-brand-dark">EventLive</span>
            </div>
            <button className="lg:hidden p-1 text-brand-muted hover:text-brand-primary transition-colors" onClick={() => setIsOpen(false)} aria-label="Close Sidebar">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto space-y-1 p-4">
            {/* Primary Navigation */}
            <div className="space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-bold transition-all ${isActive ? "bg-brand-primary text-white shadow-md shadow-brand-primary/20" : "text-brand-dark hover:bg-brand-surface"
                    }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </NavLink>
              ))}
            </div>

            {/* Dynamic "My Events" Section */}
            {myEvents.length > 0 && (
              <div className="mt-8">
                <h3 className="px-3 text-xs font-black uppercase tracking-widest text-brand-muted mb-2">My Recent Events</h3>
                <div className="space-y-1">
                  {myEvents.map((event) => (
                    <NavLink
                      key={event.id}
                      to={`/dashboard/events/${event.id}`}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-brand-dark hover:bg-brand-surface truncate"
                    >
                      <TicketIcon className="h-4 w-4 text-brand-primary" />
                      {event.title}
                    </NavLink>
                  ))}
                </div>
              </div>
            )}
          </nav>

          {/* User Session Block with Role Display */}
          <div className="border-t border-brand-accent p-4">
            <div className="flex items-center gap-3 rounded-xl bg-brand-surface/30 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-primary text-white font-bold overflow-hidden border border-brand-accent/20">
                {user?.avatar ? (
                  <img src={user.avatar} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                  displayName.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-brand-dark">{displayName}</p>
                <p className="truncate text-[10px] font-black uppercase text-brand-primary">{displayRole}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}