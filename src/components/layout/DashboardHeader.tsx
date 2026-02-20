import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Bars3Icon,
  BellIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../hooks/useAuth";
import { Popover, Transition, Menu } from '@headlessui/react';
import { Fragment } from 'react';
import { useNotificationContext } from '../../context/NotificationContext';
import CalendarDropdown from './CalendarDropdown';

interface DashboardHeaderProps {
  setIsOpen: (value: boolean) => void;
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
}

export default function DashboardHeader({ setIsOpen, collapsed, setCollapsed }: DashboardHeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { unreadCount, notifications, markAsRead } = useNotificationContext();

  const userName = user?.name || "Guest";
  const userInitial = userName.charAt(0).toUpperCase();

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      logout();
      sessionStorage.clear();
      toast.info("Logged out successfully");
      navigate("/", { replace: true });
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 md:h-16 shrink-0 items-center border-b border-brand-accent bg-bg-primary/90 backdrop-blur-md shadow-sm transition-all">
      <div className="flex w-full items-center justify-between gap-2 px-4 lg:px-6">

        {/* LEFT — burger + back/forward */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Mobile burger */}
          <button
            type="button"
            className="p-2 text-brand-dark hover:bg-brand-surface rounded-lg transition-colors lg:hidden"
            onClick={() => setIsOpen(true)}
            aria-label="Open sidebar"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>

          {/* Desktop collapse toggle */}
          <button
            type="button"
            className="hidden p-2 text-brand-muted hover:bg-brand-surface hover:text-brand-primary rounded-lg transition-colors lg:block"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Bars3Icon className={`h-5 w-5 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
          </button>

          {/* Back/forward — desktop only */}
          <div className="hidden lg:flex items-center gap-1 bg-brand-surface/50 p-1 rounded-full border border-brand-accent/10">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 rounded-full hover:bg-white text-brand-muted hover:text-brand-primary transition-all"
              title="Go Back"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigate(1)}
              className="p-1.5 rounded-full hover:bg-white text-brand-muted hover:text-brand-primary transition-all"
              title="Go Forward"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* RIGHT — calendar, bell, profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">

          {/* Calendar — hide on very small screens */}
          <div className="hidden sm:block">
            <CalendarDropdown />
          </div>

          {/* Notification Bell */}
          <Popover className="relative">
            {({ open }) => (
              <>
                <Popover.Button className={`relative p-2 rounded-full hover:bg-brand-50 transition-colors outline-none ${open ? 'bg-brand-50 text-brand-primary' : 'text-brand-muted'}`}>
                  <BellIcon className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
                  )}
                </Popover.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-200"
                  enterFrom="opacity-0 translate-y-1"
                  enterTo="opacity-100 translate-y-0"
                  leave="transition ease-in duration-150"
                  leaveFrom="opacity-100 translate-y-0"
                  leaveTo="opacity-0 translate-y-1"
                >
                  <Popover.Panel className="absolute right-0 z-50 mt-3 w-[calc(100vw-2rem)] max-w-xs">
                    <div className="overflow-hidden rounded-xl shadow-2xl ring-1 ring-black/5 bg-white">
                      <div className="p-3 bg-brand-primary/5 border-b border-brand-primary/10 flex justify-between items-center">
                        <h3 className="text-sm font-bold text-brand-dark">Notifications</h3>
                        {unreadCount > 0 && <span className="text-xs font-bold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full">{unreadCount} new</span>}
                      </div>
                      <div className="max-h-72 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-brand-muted text-sm italic">No new notifications</div>
                        ) : (
                          <ul className="divide-y divide-gray-100">
                            {notifications.map((note) => (
                              <li
                                key={note.id}
                                className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${!note.read ? 'bg-brand-primary/5' : ''}`}
                                onClick={() => markAsRead(note.id)}
                              >
                                <div className="flex gap-3">
                                  <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${!note.read ? 'bg-brand-primary' : 'bg-transparent'}`} />
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-brand-dark truncate">{note.title}</p>
                                    <p className="text-xs text-brand-muted mt-0.5 line-clamp-2">{note.message}</p>
                                    <p className="text-[10px] text-gray-400 mt-1">{new Date(note.timestamp).toLocaleTimeString()}</p>
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </Popover.Panel>
                </Transition>
              </>
            )}
          </Popover>

          {/* Profile */}
          <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-brand-accent/20">
            <div className="hidden md:block text-right leading-none">
              <p className="text-xs font-bold text-brand-dark truncate max-w-[120px]">{userName}</p>
              <p className="text-[10px] text-brand-muted truncate max-w-[120px]">{user?.email}</p>
            </div>

            <Menu as="div" className="relative">
              <Menu.Button className="flex items-center p-0.5 outline-none">
                <span className="sr-only">Open user menu</span>
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-white text-sm font-bold shadow-md ring-2 ring-white cursor-pointer overflow-hidden">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={userName} className="h-full w-full object-cover" />
                  ) : (
                    userInitial
                  )}
                </div>
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-xl bg-white py-1.5 shadow-xl ring-1 ring-gray-900/5 focus:outline-none">
                  <div className="px-3 py-2 border-b border-gray-100 mb-1 md:hidden">
                    <p className="text-sm font-bold text-gray-900 truncate">{userName}</p>
                    <p className="text-xs text-brand-muted truncate">{user?.email}</p>
                  </div>
                  <Menu.Item>
                    {({ active }) => (
                      <button onClick={() => navigate('/dashboard/profile')} className={`${active ? 'bg-brand-surface text-brand-dark' : 'text-gray-700'} block w-full text-left px-4 py-2 text-sm font-medium transition-colors`}>
                        Profile Settings
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button onClick={handleLogout} className={`${active ? 'bg-red-50 text-red-600' : 'text-gray-700'} block w-full text-left px-4 py-2 text-sm font-medium transition-colors`}>
                        Sign out
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>
    </header>
  );
}