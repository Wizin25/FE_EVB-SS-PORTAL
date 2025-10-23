import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../Home/header';
import Footer from '../Home/footer';
import { authAPI } from '../services/authAPI';
import './Report.css';

const Report = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [nextBooking, setNextBooking] = useState(null);
  const [stations, setStations] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: null,
    stationId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');

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

    // Fetch data
    const fetchData = async () => {
      try {
        // Fetch user profile
        const userData = await authAPI.getCurrent();
        setUser(userData);
      } catch (error) {
        console.error("Error fetching user:", error);
      }

      try {
        // Fetch stations for dropdown
        const stationsData = await authAPI.getAllStations();
        setStations(stationsData);
      } catch (error) {
        console.error("Error fetching stations:", error);
      }

      try {
        setUnreadCount(3); // Giá trị mẫu
      } catch (error) {
        setUnreadCount(0);
      }
    };

    fetchData();
  }, []);

  // Cleanup image preview URL
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleOpenBooking = () => {
    window.location.href = "/booking";
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }));
      
      // Tạo URL preview
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    } else {
      setFormData(prev => ({
        ...prev,
        image: null
      }));
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setSubmitStatus('error: Bạn cần đăng nhập để gửi báo cáo');
      return;
    }

    if (!formData.name || !formData.description || !formData.stationId) {
      setSubmitStatus('error: Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('');

    try {
      // Tạo FormData object để gửi dữ liệu
      const formDataToSend = new FormData();
      formDataToSend.append('Name', formData.name);
      formDataToSend.append('Description', formData.description);
      formDataToSend.append('AccountId', user.accountId);
      formDataToSend.append('StationId', formData.stationId);

      let imageUrl = null;

      // Upload ảnh lên Cloudinary nếu có
      if (formData.image) {
        setIsUploading(true);
        try {
          console.log('Bắt đầu upload ảnh lên Cloudinary...');
          const uploadResult = await authAPI.uploadToCloudinary(formData.image);
          console.log('Kết quả upload Cloudinary:', uploadResult);
          
          // Lấy URL đầy đủ từ response
          imageUrl = uploadResult.data?.secure_url || 
                     uploadResult.data?.url || 
                     uploadResult.secure_url || 
                     uploadResult.url;
          
          if (!imageUrl) {
            console.error('Không tìm thấy URL trong response:', uploadResult);
            throw new Error('Không nhận được URL từ Cloudinary');
          }
          
          console.log('Upload thành công, URL:', imageUrl);
          
          // Thêm URL ảnh vào FormData
          formDataToSend.append('Image', imageUrl);
        } catch (uploadError) {
          console.error('Lỗi upload ảnh:', uploadError);
          setSubmitStatus('error: Lỗi khi tải lên hình ảnh: ' + (uploadError.message || 'Unknown error'));
          setIsSubmitting(false);
          setIsUploading(false);
          return;
        } finally {
          setIsUploading(false);
        }
      } else {
        // Nếu không có ảnh, gửi empty string
        formDataToSend.append('Image', '');
      }

      console.log('Gửi dữ liệu báo cáo:', {
        Name: formData.name,
        Description: formData.description,
        Image: imageUrl,
        AccountId: user.accountId,
        StationId: formData.stationId
      });

      // Gửi báo cáo với FormData
      const result = await authAPI.addReport(formDataToSend);
      console.log('Kết quả gửi báo cáo:', result);
      
      setSubmitStatus('success');
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        image: null,
        stationId: ''
      });
      
      // Reset preview và file input
      setImagePreview(null);
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      console.error('Lỗi khi gửi báo cáo:', error);
      setSubmitStatus('error: ' + (error.message || 'Có lỗi xảy ra khi gửi báo cáo'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      image: null
    }));
    setImagePreview(null);
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
  };

  return (
    <div 
      className="report-page-container"
      style={{ overflowY: 'auto', overflowX: 'hidden', height: '100vh' }}
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

      <div className="report-container">
        <div className="report-wrapper">
          {/* Hero Section */}
          <section className="report-hero">
            <div className="hero-content">
              <div className="hero-badge">🚨 Báo cáo sự cố</div>
              <h1>Báo cáo sự cố khẩn cấp</h1>
              <p>Chúng tôi sẽ xử lý báo cáo của bạn trong thời gian sớm nhất</p>
            </div>
          </section>

          {/* Report Form */}
          <section className="report-form-section">
            <div className="report-form-card">
              <h2>Thông tin báo cáo</h2>
              
              {submitStatus && (
                <div className={`status-message ${
                  submitStatus.startsWith('error') ? 'error' : 'success'
                }`}>
                  {submitStatus.startsWith('error') 
                    ? submitStatus.replace('error: ', '')
                    : '✅ Báo cáo đã được gửi thành công! Chúng tôi sẽ liên hệ với bạn sớm.'
                  }
                </div>
              )}

              <form onSubmit={handleSubmit} className="report-form">
                <div className="form-group">
                  <label htmlFor="name">Tiêu đề báo cáo *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Nhập tiêu đề báo cáo..."
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="stationId">Trạm gặp sự cố *</label>
                  <select
  id="stationId"
  name="stationId"
  value={formData.stationId}
  onChange={handleInputChange}
  required
>
  <option value="">Chọn trạm</option>
  {stations.map(station => (
    <option key={station.stationId} value={station.stationId}>
      {station.stationName} ( {station.location} )
    </option>
  ))}
</select>
                </div>

                <div className="form-group">
                  <label htmlFor="description">Mô tả chi tiết *</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Mô tả chi tiết sự cố bạn gặp phải..."
                    rows="5"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="image">Hình ảnh minh họa</label>
                  <input
                    type="file"
                    id="image"
                    name="image"
                    onChange={handleImageChange}
                    accept="image/*"
                  />
                  <small>Chọn hình ảnh minh họa cho sự cố (tùy chọn)</small>
                  
                  {isUploading && (
                    <div className="upload-loading">
                      Đang tải lên hình ảnh...
                    </div>
                  )}

                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="image-preview">
                      <div className="image-preview-container">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="image-preview-img"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="image-remove-btn"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={() => navigate(-1)}
                  >
                    ← Quay lại
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={isSubmitting || isUploading}
                  >
                    {isSubmitting ? '⏳ Đang gửi...' : 
                     isUploading ? '⏳ Đang tải ảnh...' : '📤 Gửi báo cáo'}
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <Footer theme={theme} />
    </div>
  );
};

export default Report;