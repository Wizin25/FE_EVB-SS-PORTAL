// HomePage.jsx
import React, { useState, useEffect } from "react";
import Header from "./header";
import api from "../services/api";
import Footer from "./footer";
import { authAPI } from "../services/authAPI"; // Thêm import cho authAPI

export default function HomePage() {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") || "light";
    }
    return "light";
  });
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState('Driver'); // Thêm state để lưu tên người dùng
  const [unreadCount, setUnreadCount] = useState(0);
  const [nextBooking, setNextBooking] = useState(null);
  const [stats, setStats] = useState({
    totalBookings: Math.floor(Math.random() * 10) + 100,
    completedBookings: Math.floor(Math.random() * 100) + 50,
    totalDistance: Math.floor(Math.random() * 5000) + 500,
    energySaved: Math.floor(Math.random() * 300) + 10
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
        // Lấy user profile dùng authAPI.getCurrent (và lấy name từ response)
        const userData = await authAPI.getCurrent();
        setUser(userData);
        if (userData && userData.name) {
          setUserName(userData.name);
        } else if (userData && userData.fullName) {
          setUserName(userData.fullName);
        } else {
          setUserName('Driver');
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        setUserName('Driver');
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

  // Tùy chỉnh color cho light/dark (theo yêu cầu: light chữ trắng, dark chữ đen)
  const getTextColor = () => (theme === 'light' ? 'text-white' : 'text-black');
  const getTextColorInvert = () => (theme === 'light' ? 'text-black' : 'text-white'); // dùng nếu cần

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
          pointerEvents: "none",
          backgroundImage: "url('https://res.cloudinary.com/dscvguyvb/image/upload/v1760692941/8214be62-181e-4b47-ac49-6896dcc2a590_1_qnev9i.png')",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "top right",
          backgroundSize: "100% auto",
          transition: "opacity 0.2s"
        }}
        aria-hidden="true"
      />
      <div
        className={`min-h-screen transition-colors duration-300 ${theme === 'dark'
          ? 'bg-gradient-to-br from-white-900 via-gray-800 to-white-900'
          : 'bg-gradient-to-br from-blue-50 via-white to-green-50'
          }`}
        style={scrollStyles}
      >
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
        {/* HeaderDriver là lớp trên cùng của màn hình */}
        <div style={{ position: 'sticky', top: 0, zIndex: 1000 }}>
          <Header
            onToggleTheme={handleToggleTheme}
            theme={theme}
            user={user}
            onOpenBooking={handleOpenBooking}
          />
        </div>

        <main className="container px-4 py-8 mx-auto max-w-7xl">
          {/* Welcome Hero Section với background đẹp */}
          <div
            className="liquid relative overflow-hidden rounded-3xl mb-12 shadow-2xl"
            style={{
              background: theme === 'dark'
                ? 'rgba(0,0,0,0.5)'
                : 'rgba(255, 255, 255, 0.08)',
              padding: '60px 40px',
              position: 'relative'
            }}
          >
            {/* Decorative elements */}
            <div
              className="absolute top-0 right-0 w-96 h-96 opacity-20"
              style={{
                background: 'radial-gradient(circle, rgba(255, 255, 255, 0) 0%, transparent 70%)',
                transform: 'translate(30%, -30%)'
              }}
            />
            <div
              className="absolute bottom-0 left-0 w-80 h-80 opacity-20"
              style={{
                background: 'radial-gradient(circle, rgba(255, 255, 255, 0.04) 0%, transparent 70%)',
                transform: 'translate(-30%, 30%)'
              }}
            />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex-1 text-center md:text-left">
                <div className="inline-block px-4 py-2 mb-4 rounded-full bg-white/20 backdrop-blur-sm">
                  <span className="text-white font-semibold">SwapX Premium</span>
                </div>
                <h1 className={`mb-4 text-5xl md:text-6xl font-extrabold text-white drop-shadow-lg`}>
                  Welcome back, {userName}! 👋
                </h1>
                <p className={`text-xl md:text-2xl mb-6 text-white/90 font-medium`}>
                  Bạn đã sẵn sàng cho hành trình xanh tiếp theo cùng SwapX chưa?
                </p>
                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                  <button
                    onClick={handleOpenBooking}
                    className="px-8 py-4 bg-white text-blue-600 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-110 hover:shadow-2xl active:scale-95"
                    style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}
                  >
                    Đặt lịch ngay
                  </button>
                  <button
                    onClick={() => handleQuickAction('findStation')}
                    className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-110 hover:bg-white/20 active:scale-95"
                  >
                    Tìm trạm
                  </button>
                </div>
              </div>
              <div className="flex-shrink-0">
                <img
                  src="https://res.cloudinary.com/dmryi3rww/image/upload/v1760692941/SWP391/electric-scooter-illustration.png"
                  alt="Electric Vehicle"
                  className="w-64 h-64 md:w-80 md:h-80 object-contain animate-pulse"
                  style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.3))' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            </div>
          </div>
          {(() => {
            function Counter({ to, duration = 1200, suffix = "" }) {
              const [count, setCount] = React.useState(0);
              React.useEffect(() => {
                let start = 0;
                let raf;
                let startTime;
                const step = (timestamp) => {
                  if (!startTime) startTime = timestamp;
                  const progress = timestamp - startTime;
                  const percent = Math.min(progress / duration, 1);
                  const val = Math.floor(percent * (to - start) + start);
                  setCount(val);
                  if (percent < 1) {
                    raf = requestAnimationFrame(step);
                  } else {
                    setCount(to); // đảm bảo dừng đúng số cuối
                  }
                };
                raf = requestAnimationFrame(step);
                return () => cancelAnimationFrame(raf);
              }, [to, duration]);
              return (
                <>
                  {count.toLocaleString()}
                  <span className="text-xl">{suffix}</span>
                </>
              );
            }

            return (
              <div className="grid grid-cols-1 gap-6 mb-12 md:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    title: "Total Bookings",
                    value: stats.totalBookings,
                    icon: "📅",
                    gradient: "from-blue-500 to-cyan-500",
                    iconBg: "bg-blue-500/20",
                    suffix: ""
                  },
                  {
                    title: "Completed Trips",
                    value: stats.completedBookings,
                    icon: "✅",
                    gradient: "from-green-500 to-emerald-500",
                    iconBg: "bg-green-500/20",
                    suffix: ""
                  },
                  {
                    title: "Distance Traveled",
                    value: stats.totalDistance,
                    icon: "🛣️",
                    gradient: "from-purple-500 to-pink-500",
                    iconBg: "bg-purple-500/20",
                    suffix: " km"
                  },
                  {
                    title: "Energy Saved",
                    value: stats.energySaved,
                    icon: "⚡",
                    gradient: "from-yellow-500 to-orange-500",
                    iconBg: "bg-yellow-500/20",
                    suffix: " kWh"
                  }
                ].map((stat, index) => (
                  <div
                    key={index}
                    className={`liquid group relative overflow-hidden rounded-2xl p-6 shadow-xl transition-all duration-500 hover:transform hover:scale-105 hover:shadow-2xl ${
                      'bg-transparent border border-white/10'
                    }`}
                    style={{
                      animationDelay: `${index * 100}ms`
                    }}
                  >
                    {/* Animated background gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-14 h-14 rounded-xl ${stat.iconBg} flex items-center justify-center text-3xl transform group-hover:rotate-12 transition-transform duration-300 text-white`}>
                          {stat.icon}
                        </div>
                        <div className="w-2 h-2 rounded-full bg-white/50 animate-pulse" />
                      </div>
                      <h3 className="text-sm font-semibold mb-2 uppercase tracking-wide text-white">
                        {stat.title}
                      </h3>
                      <p className="text-4xl font-extrabold text-white transform group-hover:scale-110 transition-transform duration-300 inline-block">
                        <Counter to={Number(stat.value) || 0} suffix={stat.suffix} />
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Hero video section */}
          <div className="booking-hero" style={{ height: 600, margin: 20, width: '100%' }}>
            <video autoPlay loop muted playsInline poster="" preload="metadata">
              <source src="https://cdn.gogoro.com/resources/pages/global-home/hero/video-global-hero.mp4" type="video/mp4" />
            </video>
            <div className="booking-hero-content">
              <div className={`hero-text liquid ${getTextColor()}`}>
                <h1>Đổi pin nhanh, sẵn sàng mọi hành trình</h1>
                <p>Đặt lịch trước để đến trạm là có pin ngay, không phải đợi.</p>
              </div>
            </div>
          </div>

          

          {/* Features Section với hình ảnh */}
          <div className="liquid mb-12 rounded-3xl overflow-hidden shadow-2xl bg-transparent ">
            <div className="p-8 md:p-12">
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-white">
                  ✨ Tại sao chọn SwapX?
                </h2>
                <p className="text-xl text-white">
                  Trải nghiệm dịch vụ đổi pin hiện đại và tiện lợi nhất
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    icon: "⚡",
                    title: "Nhanh chóng",
                    description: "Đổi pin chỉ trong vài phút, không cần đợi",
                    image: "https://www.power.com/sites/default/files/styles/blog_header_image/public/content/images/EV%20Battery%20Swapping%20%20Figure%201.jpg?itok=2iWpeXYG",
                    color: "from-yellow-400 to-orange-500"
                  },
                  {
                    icon: "🌍",
                    title: "Thân thiện môi trường",
                    description: "Góp phần bảo vệ môi trường với năng lượng xanh",
                    image: "https://www.asianscientist.com/wp-content/uploads/bfi_thumb/201709012-Battery-Eco-friendly-green-shutterstock-34lm3supgsfp01tcmyjvgg.jpg",
                    color: "from-green-400 to-emerald-500"
                  },
                  {
                    icon: "🛠️",
                    title: "Dễ dàng đặt lịch",
                    description: "Đặt lịch đổi pin tiện lợi chỉ với vài thao tác đơn giản",
                    image: "https://res.cloudinary.com/dscvguyvb/image/upload/v1762082635/d9e53410-f4dd-4f5d-80c2-d7fe067c1d1f_a9fhv2.png",
                    color: "from-blue-400 to-cyan-500"
                  }
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="liquid group relative overflow-hidden rounded-2xl bg-transparent shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={feature.image}
                        alt={feature.title}
                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          e.target.src = `https://via.placeholder.com/400x300?text=${feature.title}`;
                        }}
                      />
                      <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-30 transition-opacity duration-500`} />
                      <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-white/90 dark:bg-gray-800/90 flex items-center justify-center text-3xl transform group-hover:rotate-12 transition-transform duration-300">
                        {feature.icon}
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-2xl font-bold mb-2 text-white">
                        {feature.title}
                      </h3>
                      <p className="text-white">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Next Booking Card - Cải thiện */}
          {nextBooking && (
            <div
              className="liquid relative overflow-hidden rounded-3xl mb-12 shadow-2xl"
              style={{
                background: theme === 'dark'
                  ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)'
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full transform translate-x-32 -translate-y-32" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full transform -translate-x-24 translate-y-24" />
              </div>
              <div className="relative z-10 p-8 md:p-12">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex-1">
                    <div className="inline-block px-4 py-2 mb-4 rounded-full bg-white/20 backdrop-blur-sm">
                      <span className="text-white font-semibold">📅 Lịch hẹn tiếp theo</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6">
                      🚗 Lịch hẹn của bạn
                    </h2>
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="liquid bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <p className="text-white/80 text-sm mb-2">📍 Trạm</p>
                        <p className="text-white text-xl font-bold">
                          {nextBooking.stationName}
                        </p>
                      </div>
                      <div className="liquid bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <p className="text-white/80 text-sm mb-2">🕐 Ngày & Giờ</p>
                        <p className="text-white text-xl font-bold">
                          {new Date(nextBooking.dateTime).toLocaleString('vi-VN')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <img
                      src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop"
                      alt="Station"
                      className="w-48 h-48 md:w-64 md:h-64 rounded-2xl object-cover shadow-xl border-4 border-white/20"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions - Cải thiện */}
          <div className="liquid rounded-3xl overflow-hidden shadow-2xl mb-12 bg-transparent">
            <div className="p-8 md:p-12">
              <div className="text-center mb-10">
                <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-white">
                  ⚡ Thao tác nhanh
                </h2>
                <p className="text-xl text-white">
                  Truy cập nhanh các tính năng quan trọng
                </p>
              </div>
              <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                {[
                  {
                    action: 'findStation',
                    icon: '🔍',
                    title: 'Tìm trạm',
                    desc: 'Tìm trạm đổi pin gần nhất',
                    gradient: 'from-blue-500 to-cyan-500'
                  },
                  {
                    action: 'history',
                    icon: '📊',
                    title: 'Lịch sử',
                    desc: 'Xem lịch sử đặt lịch',
                    gradient: 'from-purple-500 to-pink-500'
                  },
                  {
                    action: 'profile',
                    icon: '👤',
                    title: 'Hồ sơ',
                    desc: 'Quản lý tài khoản',
                    gradient: 'from-green-500 to-emerald-500'
                  },
                  {
                    action: 'support',
                    icon: '💬',
                    title: 'Hỗ trợ',
                    desc: 'Nhận trợ giúp & hỗ trợ',
                    gradient: 'from-orange-500 to-red-500'
                  }
                ].map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickAction(item.action)}
                    className="liquid group relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-500 transform hover:scale-110 hover:shadow-2xl bg-transparent border border-white/30"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                    <div className="relative z-10">
                      <div className="w-16 h-16 rounded-2xl mb-4 flex items-center justify-center text-4xl transform group-hover:rotate-12 group-hover:scale-110 transition-all duration-300 bg-white/10 text-white">
                        {item.icon}
                      </div>
                      <h3 className="text-lg font-bold mb-2 text-white">
                        {item.title}
                      </h3>
                      <p className="text-sm text-white">
                        {item.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Image Gallery Section */}
          <div className="liquid mb-12 rounded-3xl overflow-hidden shadow-2xl bg-transparent">
            <div className="p-8 md:p-12">
              <div className="text-center mb-10">
                <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-white">
                  📸 Trải nghiệm SwapX
                </h2>
                <p className="text-xl text-white">
                  Khám phá những khoảnh khắc tuyệt vời cùng SwapX
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    url: "https://cdn.prod.website-files.com/6463200e1042b2ca8283ce6b/647869ba7866270da76ee1bb_Battery-Swapping-station%20main-min.jpg",
                    title: "Trạm đổi pin hiện đại"
                  },
                  {
                    url: "https://community.niu.com/wp-content/uploads/2021/04/Electric-Scooter-Ride-Natural-Environment-OPT.jpg",
                    title: "Xe điện thân thiện môi trường"
                  },
                  {
                    url: "https://greentechskillnet.com/wp-content/uploads/2025/04/Battery-Technician-Programme-edited-scaled.png",
                    title: "Công nghệ tiên tiến"
                  }
                ].map((img, index) => (
                  <div
                    key={index}
                    className="liquid group relative overflow-hidden rounded-2xl aspect-[4/3] shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105"
                  >
                    <img
                      src={img.url}
                      alt={img.title}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                      onError={(e) => {
                        e.target.src = `https://via.placeholder.com/600x400?text=${img.title}`;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <h3 className="text-white text-xl font-bold">{img.title}</h3>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Secondary loop video subtle strip */}
          <div className="liquid booking-hero mb-12 rounded-3xl overflow-hidden shadow-2xl" style={{ height: 400 }}>
            <video autoPlay loop muted playsInline preload="metadata" className="w-full h-full object-cover">
              <source src="https://cdn.gogoro.com/resources/pages/home/kv/video-home-kv.mp4" type="video/mp4" />
            </video>
            <div className="booking-hero-content" style={{ alignItems: 'flex-end' }}>
              <div className={`hero-text liquid ${getTextColor()} rounded-2xl p-6`}>
                <p className="text-2xl md:text-3xl font-bold">Trạm phủ rộng, thao tác nhanh chóng, trải nghiệm mượt mà.</p>
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
