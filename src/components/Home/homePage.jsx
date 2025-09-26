// HomePage.jsx
import React, { useState, useEffect } from "react";
import HeaderDriver from "./header"; 
import api from "../services/api";
import Footer from "./footer";

export default function HomePage() {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") || "light";
    }
    return "light";
  });
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [nextBooking, setNextBooking] = useState(null);
  const [stats, setStats] = useState({
    totalBookings: 0,
    completedBookings: 0,
    totalDistance: 0,
    energySaved: 0
  });

  // Theme toggle handler
  const handleToggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    
    const root = document.documentElement;
    if (newTheme === "dark") {
      root.classList.add("dark");
      document.body.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      document.body.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  useEffect(() => {
    // Initialize theme
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    
    const root = document.documentElement;
    if (savedTheme === "dark") {
      root.classList.add("dark");
      document.body.classList.add("dark");
    }

    // Fetch data
    const fetchData = async () => {
      try {
        // Fetch user profile
        const userRes = await api.get("/me");
        setUser(userRes.data);
      } catch (error) {
        console.error("Error fetching user:", error);
      }

      try {
        // Fetch unread notifications count
        const notificationRes = await api.get("/notifications/unread-count");
        setUnreadCount(notificationRes.data.count);
      } catch (error) {
        setUnreadCount(0);
      }

      try {
        // Fetch next booking
        const bookingRes = await api.get("/bookings/next");
        setNextBooking(bookingRes.data);
      } catch (error) {
        setNextBooking(null);
      }

      try {
        // Fetch user stats
        const statsRes = await api.get("/stats/dashboard");
        setStats(statsRes.data);
      } catch (error) {
        // Keep default stats if API fails
      }
    };

    fetchData();
  }, []);

  const handleOpenBooking = () => {
    window.location.href = "/booking";
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'findStation':
        window.location.href = "/stations";
        break;
      case 'history':
        window.location.href = "/bookings/history";
        break;
      case 'profile':
        window.location.href = "/profile";
        break;
      case 'support':
        window.location.href = "/support";
        break;
      default:
        break;
    }
  };

  // Thêm style cho scroll
  const scrollStyles = {
    height: "100vh",
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
    // Để tránh scroll ngang ngoài ý muốn
    overflowX: "hidden"
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
          : 'bg-gradient-to-br from-blue-50 via-white to-green-50'
      }`}
      style={scrollStyles}
    >
      <HeaderDriver
        onToggleTheme={handleToggleTheme}
        theme={theme}
        user={user}
        unreadCount={unreadCount}
        nextBooking={nextBooking}
        onOpenBooking={handleOpenBooking}
      />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Welcome Section */}
        <div className={`rounded-2xl p-8 mb-8 shadow-xl ${
          theme === 'dark'
            ? 'bg-gradient-to-r from-gray-800 to-gray-700 border border-gray-600'
            : 'bg-gradient-to-r from-blue-600 to-green-600 text-white'
        }`}>
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h1 className="text-4xl font-bold mb-2">
                Welcome back, {user?.name || 'Driver'}! 👋
              </h1>
              <p className="text-lg opacity-90">
                Ready to make your next eco-friendly journey with SwapX?
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={handleOpenBooking}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                  theme === 'dark'
                    ? 'bg-green-600 hover:bg-green-500 text-white'
                    : 'bg-white text-blue-600 hover:bg-gray-100'
                } shadow-lg`}
              >
                Book Now
              </button>
              <button
                onClick={() => handleQuickAction('findStation')}
                className={`px-6 py-3 rounded-xl font-semibold border-2 transition-all duration-300 transform hover:scale-105 ${
                  theme === 'dark'
                    ? 'border-gray-400 text-gray-300 hover:bg-gray-600'
                    : 'border-white text-white hover:bg-white hover:text-blue-600'
                }`}
              >
                Find Stations
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              title: "Total Bookings",
              value: stats.totalBookings,
              icon: "📅",
              color: "blue",
              suffix: ""
            },
            {
              title: "Completed Trips",
              value: stats.completedBookings,
              icon: "✅",
              color: "green",
              suffix: ""
            },
            {
              title: "Distance Traveled",
              value: stats.totalDistance,
              icon: "🛣️",
              color: "purple",
              suffix: " km"
            },
            {
              title: "Energy Saved",
              value: stats.energySaved,
              icon: "⚡",
              color: "yellow",
              suffix: " kWh"
            }
          ].map((stat, index) => (
            <div
              key={index}
              className={`rounded-xl p-6 shadow-lg transition-all duration-300 hover:transform hover:scale-105 ${
                theme === 'dark'
                  ? 'bg-gray-800 border border-gray-700'
                  : 'bg-white border border-gray-100'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{stat.icon}</span>
                <div className={`w-3 h-3 rounded-full bg-${stat.color}-500`}></div>
              </div>
              <h3 className={`text-sm font-medium mb-1 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {stat.title}
              </h3>
              <p className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {stat.value}{stat.suffix}
              </p>
            </div>
          ))}
        </div>

        {/* Next Booking Card */}
        {nextBooking && (
          <div className={`rounded-xl p-6 mb-8 shadow-lg ${
            theme === 'dark'
              ? 'bg-gray-800 border border-gray-700'
              : 'bg-white border border-gray-100'
          }`}>
            <h2 className={`text-xl font-semibold mb-4 flex items-center ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              <span className="mr-2">🚗</span>
              Your Next Booking
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Station
                </p>
                <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {nextBooking.stationName}
                </p>
              </div>
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Date & Time
                </p>
                <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {new Date(nextBooking.dateTime).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className={`rounded-xl p-6 shadow-lg mb-8 ${
          theme === 'dark'
            ? 'bg-gray-800 border border-gray-700'
            : 'bg-white border border-gray-100'
        }`}>
          <h2 className={`text-xl font-semibold mb-6 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { action: 'findStation', icon: '🔍', title: 'Find Stations', desc: 'Locate nearby charging stations' },
              { action: 'history', icon: '📊', title: 'Trip History', desc: 'View your past bookings' },
              { action: 'profile', icon: '👤', title: 'Profile', desc: 'Manage your account' },
              { action: 'support', icon: '💬', title: 'Support', desc: 'Get help and support' }
            ].map((item, index) => (
              <button
                key={index}
                onClick={() => handleQuickAction(item.action)}
                className={`p-4 rounded-lg text-left transition-all duration-300 hover:transform hover:scale-105 ${
                  theme === 'dark'
                    ? 'bg-gray-700 hover:bg-gray-600 border border-gray-600'
                    : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <div className="text-2xl mb-2">{item.icon}</div>
                <h3 className={`font-semibold mb-1 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {item.title}
                </h3>
                <p className={`text-xs ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {item.desc}
                </p>
              </button>
            ))}
          </div>
        </div>
      </main>
      {/* Footer */}
      <Footer theme={theme} />
    </div>
  );
}