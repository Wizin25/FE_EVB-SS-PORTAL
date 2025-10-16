import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import Header from '../Home/header';
import Footer from '../Home/footer';
import './Contact.css';

const SupportCenter = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'light';
    }
    return 'light';
  });

  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [nextBooking, setNextBooking] = useState(null);

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
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);

    const root = document.documentElement;
    if (savedTheme === 'dark') {
      root.classList.add('dark');
      document.body.classList.add('dark');
    }

    // Fetch data (giống như trong HomePage)
    const fetchData = async () => {
      try {
        // Fetch user profile - giả sử có API
        // const userRes = await api.get("/me");
        // setUser(userRes.data);
        setUser({ name: "User", profileUrl: "https://ui-avatars.com/api/?name=U&background=eee&color=888" });
      } catch (error) {
        console.error("Error fetching user:", error);
      }

      try {
        // Fetch unread notifications count
        // const notificationRes = await api.get("/notifications/unread-count");
        // setUnreadCount(notificationRes.data.count);
        setUnreadCount(3); // Giá trị mẫu
      } catch (error) {
        setUnreadCount(0);
      }

      try {
        // Fetch next booking
        // const bookingRes = await api.get("/bookings/next");
        // setNextBooking(bookingRes.data);
        setNextBooking(null); // Hoặc dữ liệu mẫu
      } catch (error) {
        setNextBooking(null);
      }
    };

    fetchData();
  }, []);

  const handleOpenBooking = () => {
    window.location.href = "/booking";
  };

  const [activeTab, setActiveTab] = useState('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  const supportCategories = [
    {
      id: 'general',
      icon: '💬',
      title: 'Hỗ trợ chung',
      description: 'Câu hỏi về dịch vụ và tài khoản',
      color: '#3B82F6'
    },
    {
      id: 'technical',
      icon: '🔧',
      title: 'Vấn đề kỹ thuật',
      description: 'Sự cố trạm và ứng dụng',
      color: '#10B981'
    },
    {
      id: 'billing',
      icon: '💳',
      title: 'Thanh toán',
      description: 'Hóa đơn và gói dịch vụ',
      color: '#F59E0B'
    },
    {
      id: 'booking',
      icon: '📅',
      title: 'Đặt lịch',
      description: 'Đặt và hủy lịch hẹn',
      color: '#EF4444'
    }
  ];

  const faqData = {
    general: [
      {
        question: 'Làm thế nào để đăng ký tài khoản SwapX?',
        answer: 'Bạn có thể đăng ký tài khoản thông qua ứng dụng SwapX trên iOS/Android hoặc truy cập website và chọn "Đăng ký". Chỉ cần số điện thoại và email là có thể tạo tài khoản ngay.',
        tags: ['đăng ký', 'tài khoản']
      },
      {
        question: 'SwapX hoạt động như thế nào?',
        answer: 'SwapX cung cấp dịch vụ thuê pin xe điện theo mô hình đổi pin nhanh. Bạn đến trạm, quét mã QR và hệ thống sẽ tự động đổi pin đã sạc đầy cho bạn trong vòng 2 phút.',
        tags: ['hoạt động', 'giới thiệu']
      },
      {
        question: 'Làm sao để tìm trạm đổi pin gần nhất?',
        answer: 'Trong ứng dụng hoặc website, chọn mục "Trạm" để xem bản đồ và danh sách các trạm gần bạn. Hệ thống sẽ hiển thị khoảng cách, số pin có sẵn và đánh giá của người dùng.',
        tags: ['trạm', 'vị trí']
      }
    ],
    technical: [
      {
        question: 'Ứng dụng báo lỗi kết nối phải làm sao?',
        answer: 'Hãy kiểm tra kết nối internet, khởi động lại ứng dụng. Nếu vẫn lỗi, hãy xóa cache ứng dụng hoặc cập nhật lên phiên bản mới nhất từ App Store/Google Play.',
        tags: ['ứng dụng', 'lỗi']
      },
      {
        question: 'Máy đổi pin không hoạt động?',
        answer: 'Vui lòng thử lại sau 2 phút. Nếu vẫn không hoạt động, hãy liên hệ hotline 1900 1234 để được hỗ trợ kỹ thuật ngay lập tức. Chúng tôi có đội ngũ kỹ thuật 24/7.',
        tags: ['trạm', 'kỹ thuật']
      },
      {
        question: 'QR Code không quét được?',
        answer: 'Đảm bảo đủ ánh sáng, lau sạch camera. Nếu vẫn không được, bạn có thể nhập mã trạm thủ công hoặc sử dụng tính năng "Nhận diện vị trí" trong ứng dụng.',
        tags: ['QR', 'quét mã']
      }
    ],
    billing: [
      {
        question: 'Các phương thức thanh toán nào được chấp nhận?',
        answer: 'SwapX chấp nhận ví điện tử (Momo, ZaloPay), thẻ ngân hàng, thẻ tín dụng và tiền mặt tại trạm. Tất cả giao dịch đều được bảo mật và mã hóa.',
        tags: ['thanh toán', 'tiền']
      },
      {
        question: 'Làm thế nào để hủy gói dịch vụ?',
        answer: 'Vào mục "Gói dịch vụ" trong ứng dụng, chọn gói đang sử dụng và nhấn "Hủy gói". Lưu ý: chỉ có thể hủy vào cuối chu kỳ thanh toán.',
        tags: ['hủy', 'gói dịch vụ']
      }
    ],
    booking: [
      {
        question: 'Có thể đặt lịch trước bao lâu?',
        answer: 'Bạn có thể đặt lịch trước tối đa 7 ngày. Khuyến nghị đặt trước ít nhất 2 giờ để đảm bảo có chỗ.',
        tags: ['đặt lịch', 'thời gian']
      },
      {
        question: 'Hủy lịch hẹn có bị phí không?',
        answer: 'Hủy trước 2 giờ: miễn phí. Hủy trong vòng 2 giờ: phí 20.000đ. Không đến và không hủy: phí 50.000đ.',
        tags: ['hủy lịch', 'phí']
      }
    ]
  };

  const contactMethods = [
    {
      icon: '📞',
      title: 'Hotline 24/7',
      number: '1900 1234',
      description: 'Hỗ trợ nhanh nhất',
      available: true
    },
    {
      icon: '💬',
      title: 'Zalo OA',
      number: '@SwapXSupport',
      description: 'Chat trực tuyến',
      available: true
    },
    {
      icon: '✉️',
      title: 'Email',
      number: 'support@swapx.vn',
      description: 'Phản hồi trong 2h',
      available: true
    },
    {
      icon: '🏪',
      title: 'Trạm hỗ trợ',
      number: 'Hà Nội & TP.HCM',
      description: 'Hỗ trợ trực tiếp',
      available: true
    }
  ];

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const filteredFaqs = faqData[activeTab].filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${theme === 'dark'
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
          : 'bg-gradient-to-br from-blue-50 via-white to-green-50'
        }`}
    >
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50 }}>
        <Header
          onToggleTheme={handleToggleTheme}
          theme={theme}
          user={user}
          unreadCount={unreadCount}
          nextBooking={nextBooking}
          onOpenBooking={handleOpenBooking}
        />
      </div>

      <div className={`support-center ${theme}`}>
        <div className="support-wrapper">
          {/* Hero Section */}
          <section className="support-hero">
            <div className="hero-content">
              <div className="hero-badge">🎯 Trung tâm hỗ trợ</div>
              <h1>Chúng tôi luôn sẵn sàng hỗ trợ bạn</h1>
              <p>Giải đáp mọi thắc mắc về dịch vụ SwapX. Tìm câu trả lời nhanh hoặc liên hệ trực tiếp với đội ngũ hỗ trợ 24/7.</p>
              
              <div className="search-container">
                <input
                  type="text"
                  placeholder="🔍 Tìm kiếm câu hỏi thường gặp..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>
            <div className="hero-graphics">
              <div className="floating-icon">🔋</div>
              <div className="floating-icon">⚡</div>
              <div className="floating-icon">📱</div>
            </div>
          </section>

          {/* Contact Methods */}
          <section className="contact-methods-section">
            <div className="section-headerh">
              <h2>Liên hệ hỗ trợ</h2>
              <p>Nhiều cách để kết nối với chúng tôi</p>
            </div>
            <div className="contact-methods-grid">
              {contactMethods.map((method, index) => (
                <div key={index} className="contact-method-card">
                  <div className="method-icon">{method.icon}</div>
                  <div className="method-content">
                    <h3>{method.title}</h3>
                    <p className="method-number">{method.number}</p>
                    <p className="method-description">{method.description}</p>
                  </div>
                  <div className={`availability ${method.available ? 'available' : 'busy'}`}>
                    {method.available ? '🟢 Sẵn sàng' : '🔴 Bận'}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ Categories */}
          <section className="faq-section">
            <div className="section-headerh">
              <h2>Câu hỏi thường gặp</h2>
              <p>Chọn chủ đề để xem câu trả lời</p>
            </div>

            <div className="category-tabs">
              {supportCategories.map(category => (
                <button
                  key={category.id}
                  className={`category-tab ${activeTab === category.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab(category.id);
                    setSearchQuery('');
                    setExpandedFaq(null);
                  }}
                  style={{
                    '--accent-color': category.color
                  }}
                >
                  <span className="tab-icon">{category.icon}</span>
                  <div className="tab-content">
                    <h4>{category.title}</h4>
                    <p>{category.description}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* FAQ List */}
            <div className="faq-list">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq, index) => (
                  <div
                    key={index}
                    className={`faq-item ${expandedFaq === index ? 'expanded' : ''}`}
                  >
                    <div
                      className="faq-question"
                      onClick={() => toggleFaq(index)}
                    >
                      <h3>{faq.question}</h3>
                      <span className="expand-icon">
                        {expandedFaq === index ? '−' : '+'}
                      </span>
                    </div>
                    <div className="faq-answer">
                      <p>{faq.answer}</p>
                      <div className="faq-tags">
                        {faq.tags.map((tag, tagIndex) => (
                          <span key={tagIndex} className="tag">#{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-results">
                  <div className="no-results-icon">🔍</div>
                  <h3>Không tìm thấy kết quả phù hợp</h3>
                  <p>Hãy thử từ khóa tìm kiếm khác hoặc liên hệ trực tiếp với chúng tôi</p>
                </div>
              )}
            </div>
          </section>

          {/* Emergency Support */}
          <section className="emergency-section">
            <div className="emergency-card">
              <div className="emergency-content">
                <div className="emergency-icon">🚨</div>
                <div className="emergency-text">
                  <h3>Hỗ trợ khẩn cấp</h3>
                  <p>Gặp sự cố nghiêm trọng tại trạm? Cần hỗ trợ ngay lập tức?</p>
                </div>
                <div className="emergency-actions">
                  <button className="emergency-btn primary">
                    ⚠️ Report
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Feedback Section */}
          <section className="feedback-section">
            <div className="feedback-card">
              <div className="feedback-content">
                <h2>Chưa tìm thấy câu trả lời?</h2>
                <p>Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp đỡ bạn</p>
                <div className="feedback-actions">
                  <button className="feedback-btn primary">
                    📞 Gọi hỗ trợ
                  </button>
                  <button className="feedback-btn secondary">
                    ✉️ Gửi yêu cầu
                  </button>
                </div>
              </div>
              <div className="feedback-graphic">
                <div className="support-avatar">👨‍💼</div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <Footer theme={theme} />
    </div>
  );
};

export default SupportCenter;