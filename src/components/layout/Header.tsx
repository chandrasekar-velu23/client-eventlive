import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

const navItems = [
  { name: "Features", path: "/features" },
  { name: "Use Cases", path: "/use-cases" },
  { name: "All Events", path: "/allevents" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const hideNavbarRoutes = ["/login", "/get-started"];
  if (hideNavbarRoutes.includes(location.pathname)) return null;

  return (

    <header className="fixed inset-x-0 top-0 z-100 h-20 bg-glass/80 border-b border-brand-accent shadow-sm backdrop-blur-md">
      <div className="mx-auto max-w-7xl h-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-full items-center justify-between">
          <Link to="/" className="flex items-center group">
            <img
              src="/EventLive.svg"
              alt="EVENTLIVE Logo"
              className="h-30 w-auto transition-transform duration-300 group-hover:scale-105"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `text-sm font-medium transition-all duration-300 ${isActive
                    ? "text-brand-primary font-semibold"
                    : "text-text-secondary hover:text-text-primary"
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-6">
            <Link
              to="/login"
              className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors duration-200"
            >
              Login
            </Link>

            <Link
              to="/get-started"
              className="px-6 py-2.5 rounded-full bg-brand-primary text-white font-semibold text-sm shadow-lg shadow-brand-primary/25 hover:bg-brand-600 hover:scale-105 transition-all duration-300"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden text-text-primary p-2 hover:bg-brand-surface rounded-md transition"
            aria-label="Toggle menu"
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="lg:hidden absolute top-20 left-0 w-full bg-white shadow-xl border-b border-gray-100 animate-fade-in">
          <nav className="flex flex-col space-y-2 px-6 py-6">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `block py-3 text-base font-medium transition-all duration-200 border-b border-gray-50 ${isActive
                    ? "text-brand-600 underline underline-offset-4 decoration-2 decoration-brand-600"
                    : "text-gray-800 hover:text-brand-600 hover:underline hover:underline-offset-4 hover:decoration-brand-300"
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}

            <NavLink
              to="/login"
              onClick={() => setOpen(false)}
              className="block py-3 text-base font-medium text-gray-800 hover:text-brand-600 transition border-b border-gray-50"
            >
              Login
            </NavLink>

            <div className="pt-6 pb-2">
              <NavLink
                to="/get-started"
                onClick={() => setOpen(false)}
                className="w-full flex items-center justify-center px-6 py-3 rounded-xl bg-brand-600 text-white font-semibold text-base shadow-md hover:bg-brand-700 transition-all duration-300 active:scale-95"
              >
                Get Started
              </NavLink>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}