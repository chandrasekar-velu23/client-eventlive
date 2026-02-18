import { useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  Squares2X2Icon, CalendarIcon, UsersIcon,
  XMarkIcon,
  TicketIcon,
  DocumentDuplicateIcon,
  InboxStackIcon,
} from "@heroicons/react/24/outline";


import { useAuth } from "../../hooks/useAuth";
import { useEvents } from "../../hooks/useEvents";



interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  collapsed: boolean;

}

export default function Sidebar({ isOpen, setIsOpen, collapsed }: SidebarProps) {
  const { user } = useAuth();
  const { events, fetchMyEvents, fetchEnrolledEvents } = useEvents();

  const isOrganizer = user?.role === 'Organizer' || user?.role === 'Admin';

  const navItems = isOrganizer ? [
    { name: "Dashboard", href: "/dashboard", icon: Squares2X2Icon },
    { name: "Events", href: "/dashboard/events", icon: CalendarIcon }, // Manage
    { name: "Drafts", href: "/dashboard/drafts", icon: DocumentDuplicateIcon },
    { name: "Attendees", href: "/dashboard/attendees", icon: UsersIcon },
  ] : [
    { name: "Dashboard", href: "/dashboard", icon: Squares2X2Icon },
    { name: "All Events", href: "/dashboard/all-events", icon: CalendarIcon }, // Browse
    { name: "My Enrollments", href: "/dashboard/enrolled", icon: TicketIcon },
    { name: "My Requests", href: "/dashboard/requests", icon: InboxStackIcon },
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


  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-brand-950/50 backdrop-blur-sm lg:hidden" onClick={() => setIsOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 transform border-r border-white bg-white/80 backdrop-blur-md transition-all duration-300 lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"} ${collapsed ? "w-20" : "w-64"}`}>
        <div className="flex h-full flex-col">
          {/* Logo Section */}
          <div className={`flex h-20 items-center px-6 border-b border-white ${collapsed ? "justify-center" : "justify-between"}`}>
            <div className="flex items-center gap-3 overflow-hidden">
              <img src="/iconEventLive.svg" alt="EventLive" className="h-10 w-10 text-brand-600 shrink-0" />
              {!collapsed && <span className="text-2xl font-black tracking-tight text-brand-950 font-display truncate">...</span>}
            </div>
            <button className="lg:hidden p-1 text-muted hover:text-brand-600 transition-colors" onClick={() => setIsOpen(false)} aria-label="Close Sidebar">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto space-y-1 p-4 scrollbar-hide">
            {/* Primary Navigation */}
            <div className="space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  title={collapsed ? item.name : ""}
                  className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all whitespace-nowrap ${isActive ? "bg-brand-600 text-white shadow-md shadow-brand-500/20" : "text-muted hover:bg-surface-100 hover:text-default"
                    } ${collapsed ? "justify-center" : ""}`}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </NavLink>
              ))}
            </div>

            {/* Dynamic "My Events" Section - Hide when collapsed */}
            {!collapsed && myEvents.length > 0 && (
              <div className="mt-8 animate-fade-in">
                <h3 className="px-3 text-[10px] font-black uppercase tracking-widest text-muted mb-3 opacity-70">Recent Events</h3>
                <div className="space-y-1">
                  {myEvents.map((event) => (
                    <NavLink
                      key={event.id}
                      to={`/dashboard/events/${event.id}`}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-default hover:bg-surface-100 truncate group transition-colors"
                    >
                      <div className="p-1 rounded bg-brand-50 text-brand-600 group-hover:bg-brand-100 transition-colors">
                        <TicketIcon className="h-3.5 w-3.5 shrink-0" />
                      </div>
                      <span className="truncate">{event.title}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            )}
          </nav>

          {/* User Session Block */}

        </div>
      </aside>
    </>
  );
}