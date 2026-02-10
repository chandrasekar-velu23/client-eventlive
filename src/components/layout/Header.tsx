import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

const navItems = [
  { name: "Features", path: "/features" },
  { name: "Use Cases", path: "/use-cases" },
  { name: "Security", path: "/security" },
  // { name: "Resources", path: "/resources" },
  // { name: "About", path: "/about" },
  // { name: "Contact", path: "/contact" },
  {name: "All Events", path:"/allevents"},
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const hideNavbarRoutes = ["/login", "/get-started"];
  if (hideNavbarRoutes.includes(location.pathname)) return null;

  return (
  
    <header className="fixed inset-x-0 top-0 z-100 h-20 bg-brand-gradient border-b border-brand-accent">
      <div className="mx-auto max-w-7xl h-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-full items-center justify-between">

         
          <Link to="/" className="flex items-center">
            <img
            src="/src/assets/logo.svg"
            alt="EVENTLIVE Logo"
            className=" p-2 h-35 w-50 md:h-25 lg:h-auto transition-transform hover:scale-105"
          />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors ${
                    isActive
                      ? "text-brand-primary"
                      : "text-brand-dark hover:text-brand-primary"
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-medium text-brand-dark hover:text-brand-primary transition"
            >
              Login
            </Link>

            {/* REPLACED with your extracted component class .btn-primary */}
            <Link
              to="/get-started"
              className="btn-primary"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden bg-brand-primary rounded-md p-2 text-white hover:bg-brand-surface transition"
            aria-label="Toggle menu"
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="lg:hidden bg-brand-bg border-t border-brand-accent">
          <nav className="space-y-1 px-4 py-4">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `block rounded-md px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-brand-surface text-brand-dark"
                      : "text-brand-dark hover:bg-brand-surface"
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}

            <NavLink
              to="/login"
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2 text-sm font-medium text-brand-dark hover:bg-brand-surface"
            >
              Login
            </NavLink>

            {/* REPLACED with your extracted component class .btn-primary */}
            {/* Added 'w-full block text-center' to ensure it looks right in the mobile menu */}
            <NavLink
              to="/get-started"
              onClick={() => setOpen(false)}
              className="btn-primary block text-center mt-4"
            >
              Get Started
            </NavLink>
          </nav>
        </div>
      )}
    </header>
  );
}