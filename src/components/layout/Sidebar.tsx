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
  const isAttendee = user?.role === 'Attendee';

  const navItems = isOrganizer ? [
    { name: "Dashboard", href: "/dashboard", icon: Squares2X2Icon },
    { name: "Events", href: "/dashboard/events", icon: CalendarIcon },
    { name: "Drafts", href: "/dashboard/drafts", icon: DocumentDuplicateIcon },
    { name: "Attendees", href: "/dashboard/attendees", icon: UsersIcon },
  ] : [
    { name: "Dashboard", href: "/dashboard", icon: Squares2X2Icon },
    { name: "All Events", href: "/dashboard/all-events", icon: CalendarIcon },
    { name: "My Enrollments", href: "/dashboard/enrolled", icon: TicketIcon },
    { name: "My Requests", href: "/dashboard/requests", icon: InboxStackIcon },
  ];

  useEffect(() => {
    if (user?.id) {
      if (isOrganizer) {
        fetchMyEvents();
      } else {
        fetchEnrolledEvents();
      }
    }
  }, [user?.id, fetchMyEvents, fetchEnrolledEvents, isOrganizer]);

  // Filter events for Organizers
  const publishedEvents = isOrganizer ? events.filter(e => e.status !== 'draft').slice(0, 3) : [];
  const draftEvents = isOrganizer ? events.filter(e => e.status === 'draft').slice(0, 3) : [];

  // Events for Attendees (Enrollments)
  const enrolledEvents = !isOrganizer ? events.slice(0, 5) : [];

  const renderEventList = (title: string, items: typeof events, icon: any) => {
    if (items.length === 0) return null;
    return (
      <div className="mt-6 animate-fade-in">
        {!collapsed && (
          <h3 className="px-3 text-[10px] font-black uppercase tracking-widest text-muted mb-2 opacity-70">
            {title}
          </h3>
        )}
        <div className="space-y-1">
          {items.map((event) => (
            <NavLink
              key={event.id}
              to={`/dashboard/events/${event.id}`}
              title={collapsed ? event.title : ""}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-default hover:bg-surface-100 truncate group transition-colors ${collapsed ? "justify-center px-2" : ""}`}
            >
              <div className={`p-1 rounded bg-brand-50 text-brand-600 group-hover:bg-brand-100 transition-colors shrink-0`}>
                <icon.type className="h-3.5 w-3.5" />
              </div>
              {!collapsed && <span className="truncate">{event.title}</span>}
            </NavLink>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-brand-950/50 backdrop-blur-sm lg:hidden" onClick={() => setIsOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 transform border-r border-gray-100 bg-white/90 backdrop-blur-xl transition-all duration-300 lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"} ${collapsed ? "w-20" : "w-64"}`}>
        <div className="flex h-full flex-col">
          {/* Logo Section */}
          <div className={`flex h-20 items-center px-6 border-b border-gray-100 ${collapsed ? "justify-center" : "justify-between"}`}>
            <div className="flex items-center gap-3 overflow-hidden">
              {collapsed ? (
                <img src="/iconEventLive.png" alt="EventLive" className="h-10 w-10 shrink-0" />
              ) : (
                <img src="/EventLive.png" alt="EventLive" className="h-10 w-auto shrink-0" />
              )}
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

            {/* Application Sections based on Role */}
            {isOrganizer && renderEventList("Recent Events", publishedEvents, <TicketIcon className="h-3.5 w-3.5" />)}
            {isOrganizer && renderEventList("Drafts", draftEvents, <DocumentDuplicateIcon className="h-3.5 w-3.5" />)}
            {isAttendee && renderEventList("My Enrollments", enrolledEvents, <TicketIcon className="h-3.5 w-3.5" />)}

          </nav>


        </div>
      </aside>
    </>
  );
}