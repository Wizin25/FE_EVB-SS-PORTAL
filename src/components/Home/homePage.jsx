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
    <>
      {/* SVG filter LiquidGlass (ẩn) */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <filter id="liquidGlass" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="2" seed="8" result="noise" />
            <feGaussianBlur in="noise" stdDeviation="2" result="map" />
            <feDisplacementMap in="SourceGraphic" in2="map" scale="50" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      <div
        className={`min-h-screen transition-colors duration-300 ${theme === 'dark'
            ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
            : 'bg-gradient-to-br from-blue-50 via-white to-green-50'
          }`}
        style={scrollStyles}
      >
        {/* HeaderDriver là lớp trên cùng của màn hình */}
        <div style={{ position: 'sticky', top: 0, zIndex: 1000 }}>
          <HeaderDriver
            onToggleTheme={handleToggleTheme}
            theme={theme}
            user={user}
            unreadCount={unreadCount}
            nextBooking={nextBooking}
            onOpenBooking={handleOpenBooking}
          />
        </div>

        <main className="container px-4 py-8 mx-auto max-w-7xl">
          {/* Welcome Section (LiquidGlass card) */}
          <div
            className={`liquid rounded-2xl p-6 mb-8 ${theme === 'dark'
                ? 'border border-gray-700'
                : 'border border-gray-200'
              }`}
          >
            <div className="flex flex-col items-center justify-between">
              <div className="mb-5 md:mb-5 p-5">
                <div className="flex flex-col items-center justify-center text-center">
                  <h1 className="mb-4 text-3xl font-bold">
                    Welcome back, {user?.name || 'Driver'}! 👋
                  </h1>
                  <p className="text-lg opacity-90">
                    Bạn đã sẵn sàng cho hành trình xanh tiếp theo cùng SwapX chưa?
                  </p>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handleOpenBooking}
                  className={`liquid px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${theme === 'dark'
                      ? 'text-white'
                      : 'text-blue-700'
                    } shadow-lg`}
                >
                  Book Now
                </button>
                <button
                  onClick={() => handleQuickAction('findStation')}
                  className={`liquid px-6 py-3 rounded-xl font-semibold border-2 transition-all duration-300 transform hover:scale-105 ${theme === 'dark'
                      ? ''
                      : ''
                    }`}
                >
                  Find Stations
                </button>
              </div>
            </div>
          </div>

          {/* Hero video section */}
          <div className="booking-hero" style={{ height: 600, margin: 20, width: 1200 }}>
            <video autoPlay loop muted playsInline poster="" preload="metadata">
              <source src="https://cdn.gogoro.com/resources/pages/global-home/hero/video-global-hero.mp4" type="video/mp4" />
            </video>
            <div className="booking-hero-content">
              <div className="hero-text liquid">
                <h1>Đổi pin nhanh, sẵn sàng mọi hành trình</h1>
                <p>Đặt lịch trước để đến trạm là có pin ngay, không phải đợi.</p>
              </div>
              <div className="hero-badge">⚡ Nguồn cảm hứng: video Gogoro</div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
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
                className={`liquid rounded-xl p-6 shadow-lg transition-all duration-300 hover:transform hover:scale-105 ${theme === 'dark'
                    ? 'border border-gray-700'
                    : 'border border-gray-200'
                  }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{stat.icon}</span>
                  <div className={`w-3 h-3 rounded-full`} />
                </div>
                <h3 className={`text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  {stat.title}
                </h3>
                <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {stat.value}{stat.suffix}
                </p>
              </div>
            ))}
          </div>

          {/* Next Booking Card */}
          {nextBooking && (
            <div
              className={`liquid rounded-xl p-6 mb-8 shadow-lg ${theme === 'dark'
                  ? 'border border-gray-700'
                  : 'border border-gray-200'
                }`}
            >
              <h2
                className={`text-xl font-semibold mb-4 flex items-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}
              >
                <span className="mr-2">🚗</span>
                Your Next Booking
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    Station
                  </p>
                  <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {nextBooking.stationName}
                  </p>
                </div>
                <div>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
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
          <div
            className={`liquid rounded-xl p-6 shadow-lg mb-8 ${theme === 'dark'
                ? 'border border-gray-700'
                : 'border border-gray-200'
              }`}
          >
            <h2 className={`text-xl font-semibold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { action: 'findStation', icon: '🔍', title: 'Find Stations', desc: 'Locate nearby charging stations' },
                { action: 'history', icon: '📊', title: 'Trip History', desc: 'View your past bookings' },
                { action: 'profile', icon: '👤', title: 'Profile', desc: 'Manage your account' },
                { action: 'support', icon: '💬', title: 'Support', desc: 'Get help and support' }
              ].map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAction(item.action)}
                  className="liquid p-4 rounded-lg text-left transition-all duration-300 hover:transform hover:scale-105"
                >
                  <div className="mb-2 text-2xl">{item.icon}</div>
                  <h3 className={`font-semibold mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {item.title}
                  </h3>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                    {item.desc}
                  </p>
                </button>
              ))}
            </div>

            {/* Secondary loop video subtle strip */}
            <div className="booking-hero" style={{ height: 400, marginTop: 10 }}>
              <video autoPlay loop muted playsInline preload="metadata">
                <source src="https://cdn.gogoro.com/resources/pages/home/kv/video-home-kv.mp4" type="video/mp4" />
              </video>
              <div className="booking-hero-content" style={{ alignItems: 'flex-end' }}>
                <div className="hero-text liquid">
                  <p>Trạm phủ rộng, thao tác nhanh chóng, trải nghiệm mượt mà.</p>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <Footer theme={theme} />
      </div>
    </>
  );
}
