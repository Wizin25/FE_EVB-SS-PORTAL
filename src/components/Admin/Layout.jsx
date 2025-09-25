import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { decodeJwt, extractRolesFromPayload } from '../services/jwt';
import { CSSTransition } from 'react-transition-group';
import './Layout.css';


const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/form', label: 'Form' },
  { to: '/admin/chart', label: 'Chart' },
  { to: '/admin/calendar', label: 'Calendar' },
  { to: '/admin/station', label: 'Station' },
];

function ThemeToggle({ className = "" }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") || "light";
    }
    return "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [theme]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
  }, []);

  return (
    <button
      className={`p-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-orange-100 dark:hover:bg-gray-700 transition-all duration-300 transform hover:scale-105 active:scale-95 ${className}`}
      aria-label="Toggle theme"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      type="button"
    >
      {theme === "light" ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" fill="none"/>
          <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z"/>
        </svg>
      )}
    </button>
  );
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true); // Changed from false to true
  const location = useLocation();
  const navigate = useNavigate();
  const nodeRef = useRef(null);

  const [isAdmin, setIsAdmin] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setIsAdmin(false);
        return;
      }
      if (typeof decodeJwt === 'function' && typeof extractRolesFromPayload === 'function') {
        const payload = decodeJwt(token);
        const roles = extractRolesFromPayload(payload);
        setIsAdmin(roles.includes('Admin'));
      } else {
        console.warn('JWT functions not available, assuming admin role');
        setIsAdmin(true);
      }
    } catch (error) {
      console.error('Error checking admin role:', error);
      setIsAdmin(false);
    }
  }, []);

  useEffect(() => {
    setShow(false);
    const timer = setTimeout(() => setShow(true), 10);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (isAdmin === null) return null;
  if (!isAdmin) return <Navigate to="/signin" state={{ from: location }} replace />;

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/signin');
  };

  return (
    <CSSTransition
      nodeRef={nodeRef}
      in={show}
      timeout={400}
      classNames="admin-fade-slide"
      unmountOnExit={false}
      appear
    >
      <div ref={nodeRef} className="flex min-h-screen font-sans bg-white dark:bg-gray-900 transition-colors">
        {/* Sidebar */}
        <aside
          className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'} bg-white dark:bg-gray-900 border-r border-orange-200 dark:border-gray-700 shadow-2xl flex flex-col fixed md:relative z-40`}
        >
          <div className={`mb-8 mt-4 px-6 transition-all duration-300 ${sidebarOpen ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}`}>
            <img
              src="https://res.cloudinary.com/dzht29nkq/image/upload/v1758274139/SwapX_1_-Photoroom_wvmglm.png"
              alt="SwapX Logo"
              className="w-20 h-20 rounded-3xl shadow-2xl admin-brand-logo mx-auto mb-2"
              style={{ display: 'block' }}
            />
            <div className="flex flex-col items-center justify-center">
              {/* <span className="font-extrabold text-2xl text-gray-900 dark:text-white tracking-widest leading-tight drop-shadow-lg uppercase">SwapX</span> */}
              <span className="font-extrabold text-base text-orange-600 dark:text-orange-400 tracking-widest mt-1 italic drop-shadow-md uppercase">Admin</span>
            </div>
          </div>

          <nav className="flex flex-col gap-3 px-6">
            {navItems.map((item, index) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-4 px-4 py-3 rounded-xl font-semibold transition-all duration-300 transform",
                    sidebarOpen ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0",
                    isActive
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg scale-105"
                      : "text-gray-700 dark:text-gray-200 hover:bg-orange-50 dark:hover:bg-gray-800 hover:text-orange-600 dark:hover:text-orange-400 hover:scale-105"
                  ].join(" ")
                }
                style={{ transitionDelay: `${index * 50}ms` }}
                // Removed onClick={() => setSidebarOpen(false)} to prevent auto-close
              >
                <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-orange-600 dark:text-orange-400 font-bold text-sm">
                    {item.label.charAt(0)}
                  </span>
                </div>
                <span className="text-lg">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className={`mt-auto px-6 py-4 transition-all duration-300 ${sidebarOpen ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}`}>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold shadow-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" />
              </svg>
              <span>Đăng xuất</span>
            </button>
          </div>
        </aside>

        {/* Overlay for mobile when sidebar is open */}
        {sidebarOpen && (
          <div
            className="admin-overlay md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Header */}
          <header className="admin-header h-16 flex items-center justify-between bg-white dark:bg-gray-900 border-b border-orange-100 dark:border-gray-800 px-4">
            <div className="flex items-center gap-2">
              {/* Hamburger/Menu button */}
              <button
                className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-300 group relative z-50 transform hover:scale-105 active:scale-95 ${sidebarOpen ? 'hamburger-open' : ''}`}
                onClick={() => setSidebarOpen((open) => !open)}
                aria-label="Toggle sidebar"
                type="button"
              >
                <span className="relative w-6 h-6 flex flex-col justify-center items-center">
                  <span className="hamburger-line line1" />
                  <span className="hamburger-line line2" />
                  <span className="hamburger-line line3" />
                </span>
              </button>

              <NavLink
                to="/admin/dashboard"
                className="font-bold text-lg text-orange-600 hover:text-orange-700 transition"
              >
                Dashboard
              </NavLink>

              <NavLink
                to="/admin/users"
                className="ml-2 font-semibold text-gray-700 dark:text-gray-200 hover:text-orange-600 dark:hover:text-orange-400 transition"
              >
                Users
              </NavLink>
            </div>

            <div className="flex items-center gap-4">
              <ThemeToggle />
              <button
                className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-100 dark:bg-gray-800 text-orange-600 dark:text-orange-300 font-bold shadow hover:bg-orange-200 dark:hover:bg-gray-700 transition"
                aria-label="Account"
                type="button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M4 20c0-2.5 3.5-4 8-4s8 1.5 8 4"/>
                </svg>
              </button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 bg-white dark:bg-gray-900 transition-colors">
            <div className="p-8">
              <div className="mb-6 border-b border-orange-200 dark:border-gray-800 pb-2" />
              <div className="admin-content-card rounded-xl bg-white dark:bg-gray-800 shadow-lg p-6 min-h-[60vh] transition-colors">
                <Outlet />
              </div>
            </div>
          </main>
        </div>
      </div>
    </CSSTransition>
  );
}
