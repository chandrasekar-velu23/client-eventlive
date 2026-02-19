import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Bars3Icon,
  BellIcon,
  MagnifyingGlassIcon,
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
      sessionStorage.clear(); // Clear all session caches (drafts, params)
      toast.info("Logged out successfully");
      navigate("/", { replace: true });
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-20 shrink-0 items-center gap-x-6 border-b border-brand-accent bg-bg-primary/80 backdrop-blur-md px-4 shadow-sm lg:px-8 transition-all">
      <div className="flex items-center gap-2">
        {/* Mobile Toggle */}
        <button
          type="button"
          className="p-2.5 text-brand-dark hover:bg-brand-surface rounded-lg transition-colors lg:hidden"
          onClick={() => setIsOpen(true)}
          aria-label="Open sidebar"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>

        {/* Desktop Collapse Toggle */}
        <button
          type="button"
          className="hidden p-2 text-brand-muted hover:bg-brand-surface hover:text-brand-primary rounded-lg transition-colors lg:block"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Bars3Icon className={`h-6 w-6 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Navigation History Controls - Desktop */}
      <div className="hidden lg:flex items-center gap-2 mr-4 bg-brand-surface/50 p-1 rounded-full border border-brand-accent/10">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-white text-brand-muted hover:text-brand-primary transition-all shadow-sm hover:shadow"
          title="Go Back"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <button
          onClick={() => navigate(1)}
          className="p-2 rounded-full hover:bg-white text-brand-muted hover:text-brand-primary transition-all shadow-sm hover:shadow"
          title="Go Forward"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <form className="relative flex flex-1 items-center" onSubmit={(e) => e.preventDefault()}>
          <MagnifyingGlassIcon className="absolute left-3 h-5 w-5 text-brand-muted/70" />
          <input
            className="h-10 w-full max-w-md rounded-full border-0 bg-brand-50 pl-10 pr-4 text-brand-dark placeholder:text-brand-muted/70 focus:bg-white focus:ring-2 focus:ring-brand-primary/20 sm:text-sm outline-none transition-all"
            placeholder="Search events, analytics, attendees..."
            type="search"
          />
        </form>

        <div className="flex items-center gap-x-4 lg:gap-x-6">



          {/* Calendar Dropdown */}
          <CalendarDropdown />

          {/* Notification Bell */}
          <Popover className="relative">
            {({ open }) => (
              <>
                <Popover.Button className={`group relative p-2 rounded-full hover:bg-brand-50 transition-colors outline-none ${open ? 'bg-brand-50 text-brand-primary' : 'text-brand-muted'}`}>
                  <BellIcon className="h-6 w-6 group-hover:text-brand-dark transition-colors" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
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
                  <Popover.Panel className="absolute right-0 z-50 mt-4 w-screen max-w-[20rem] sm:max-w-xs transform px-0">
                    <div className="overflow-hidden rounded-xl shadow-2xl ring-1 ring-black/5 bg-white mx-4 sm:mx-0">
                      <div className="p-4 bg-brand-primary/5 border-b border-brand-primary/10 flex justify-between items-center">
                        <h3 className="text-sm font-bold text-brand-dark">Notifications</h3>
                        {unreadCount > 0 && <span className="text-xs font-bold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full">{unreadCount} new</span>}
                      </div>

                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-brand-muted text-sm italic">
                            No new notifications
                          </div>
                        ) : (
                          <ul className="divide-y divide-gray-100">
                            {notifications.map((note) => (
                              <li
                                key={note.id}
                                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${!note.read ? 'bg-brand-primary/5' : ''}`}
                                onClick={() => markAsRead(note.id)}
                              >
                                <div className="flex gap-3">
                                  <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${!note.read ? 'bg-brand-primary shadow-sm shadow-brand-primary/50' : 'bg-transparent'}`} />
                                  <div>
                                    <p className="text-xs font-bold text-brand-dark">{note.title}</p>
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

          {/* Profile Dropdown */}
          <div className="flex items-center gap-3 pl-4 border-l border-brand-accent/20">
            <div className="hidden md:block text-right">
              <p className="text-sm font-bold text-brand-dark leading-none">{userName}</p>
              <p className="text-xs text-brand-muted mt-1">{user?.email}</p>
            </div>

            <Menu as="div" className="relative">
              <Menu.Button className="-m-1.5 flex items-center p-1.5">
                <span className="sr-only">Open user menu</span>
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-white font-bold shadow-lg shadow-brand-primary/20 ring-2 ring-white cursor-pointer hover:ring-brand-primary/30 transition-all overflow-hidden">
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
                <Menu.Items className="absolute right-0 z-50 mt-2.5 w-48 origin-top-right rounded-xl bg-white py-2 shadow-xl ring-1 ring-gray-900/5 focus:outline-none">
                  <div className="px-3 py-2 border-b border-gray-100 mb-1 md:hidden">
                    <p className="text-sm font-bold text-gray-900">{userName}</p>
                    <p className="text-xs text-brand-muted truncate">{user?.email}</p>
                  </div>
                  <Menu.Item>
                    {({ active }) => (
                      <button onClick={() => navigate('/dashboard/settings')} className={`${active ? 'bg-brand-surface text-brand-dark' : 'text-gray-700'} block w-full text-left px-4 py-2 text-sm font-medium transition-colors`}>
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