import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { message } from 'antd';
import { authAPI } from '../services/authAPI';
import { formAPI } from '../services/formAPI';
import Calendar from '../Admin/pages/Calendar'; // Import Calendar component đã sửa
import './Staff.css';

const ITEMS_PER_PAGE = 10;

const DEFAULT_VIEW_KEY = 'forms';

const VIEW_NAV = [
  { key: 'forms', label: 'Quản lý Form', icon: '📋' },
  { key: 'station-schedules', label: 'Lịch trình trạm', icon: '🗓️' },
  { key: 'battery-report', label: 'Báo cáo pin', icon: '📝' },
  { key: 'exchange-battery', label: 'Xác nhận giao dịch', icon: '✅' },
];

const VIEW_CONFIG = VIEW_NAV.reduce((acc, item) => {
  acc[item.key] = item;
  return acc;
}, {});

/** Chuẩn hoá ID form */
const getFormId = (f) => f?.formId ?? f?.id ?? f?._id ?? null;

// Helper function for date formatting
const formatDate = (dateString) => {
  if (!dateString || dateString === 'N/A') return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleString('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh'
    });
  } catch { return dateString; }
};

function BatteryReportForm({
  defaults,
  onCreated,
  messageApi,
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [reportType, setReportType] = useState('General');
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const toast = messageApi || message;

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setImageFile(null);
      setImageUrl('');
      return;
    }

    setImageFile(file);
    
    // Automatically upload to Cloudinary
    try {
      setUploading(true);
      const res = await authAPI.uploadToCloudinary(file);
      const url =
        res?.data?.secureUrl || res?.data?.secure_url ||
        res?.data?.url || res?.secureUrl || res?.secure_url || res?.url;
      if (!url) throw new Error('Không tìm thấy URL ảnh từ Cloudinary');
      setImageUrl(url);
      toast.success('Upload ảnh thành công!');
    } catch (e) {
      toast.error(e?.message || 'Upload ảnh thất bại!');
      setImageFile(null);
      setImageUrl('');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!name?.trim() || !description?.trim()) {
      toast.warning('Vui lòng nhập Name và Description.');
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        name,
        description,
        image: imageUrl, // Use imageUrl as the image field
        accountId: defaults?.accountId || '',
        stationId: defaults?.stationId || '',
        batteryId: defaults?.batteryId || '',
        exchangeBatteryId: defaults?.exchangeBatteryId || '',
        reportType,
      };
      console.log('Battery Report Payload:', payload); // Add logging to verify payload
      const res = await authAPI.addBatteryReport(payload);
      if (res?.isSuccess) {
        toast.success('Tạo Battery Report thành công!');
        onCreated?.(res);
        setName('');
        setDescription('');
        setReportType('General');
        setImageFile(null);
        setImageUrl('');
      } else {
        toast.error(res?.responseCode || 'Tạo Battery Report thất bại');
      }
    } catch (e) {
      toast.error(e?.message || 'Tạo Battery Report thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        marginTop: 16,
        padding: 16,
        borderRadius: 12,
        background: 'rgba(255,255,255,0.75)',
        border: '1px solid rgba(15,23,42,0.08)',
      }}
    >
      <h3 style={{ margin: '0 0 10px 0' }}>🧾 Tạo Battery Report</h3>
      <div style={{ display: 'grid', gap: 10 }}>
        <div style={{ display: 'grid', gap: 6 }}>
          <label><strong>Tên báo cáo (Name)</strong></label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ví dụ: Báo cáo pin hư cell…"
            className="select"
            style={{ padding: 10 }}
          />
        </div>

        <div style={{ display: 'grid', gap: 6 }}>
          <label><strong>Mô tả (Description)</strong></label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả chi tiết tình trạng, thời điểm, nguyên nhân dự đoán…"
            className="select"
            rows={4}
            style={{ padding: 10, resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'grid', gap: 6 }}>
          <label><strong>Report Type</strong></label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="select"
            style={{ padding: 10 }}
          >
            <option value="General">General</option>
            <option value="Damage">Damage</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Exchange">Exchange</option>
          </select>
        </div>

        <div className="customer-box" style={{ background: 'rgba(255,255,255,0.6)' }}>
          <div className="customer-grid">
            <div><strong>AccountId:</strong> {defaults?.accountId || 'N/A'}</div>
            <div><strong>StationId:</strong> {defaults?.stationId || 'N/A'}</div>
            <div><strong>BatteryId:</strong> {defaults?.batteryId || 'N/A'}</div>
          <div><strong>ExchangeBatteryId:</strong> {defaults?.exchangeBatteryId || 'N/A'}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 8 }}>
          <label><strong>Ảnh minh hoạ (Image)</strong></label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
          />
          {uploading && (
            <div style={{ fontSize: 12, color: '#0f172a', fontStyle: 'italic' }}>
              Đang upload ảnh...
            </div>
          )}
          {imageUrl && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 12, color: '#059669', marginBottom: 8 }}>
                ✅ Ảnh đã được upload thành công
              </div>
              <img
                src={imageUrl}
                alt="preview"
                style={{
                  width: 220,
                  height: 140,
                  objectFit: 'cover',
                  borderRadius: 10,
                  border: '1px solid rgba(15,23,42,0.08)',
                }}
              />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <button
            className="status-apply-btn"
            onClick={handleSubmit}
            disabled={submitting || uploading}
          >
            {submitting ? 'Đang tạo...' : 'Tạo Battery Report'}
          </button>
        </div>
      </div>
    </div>
  );
}

function StaffPage() {
  const [messageApi, contextHolder] = message.useMessage();
  const toast = messageApi;
  const [forms, setForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Drawer hồ sơ
  const [showProfile, setShowProfile] = useState(false);

  // Chế độ hiển thị: 'forms' hoặc 'battery-report'
  const [viewMode, setViewMode] = useState(DEFAULT_VIEW_KEY);

  // Dropdown chọn trạng thái theo từng form
  const [statusChoice, setStatusChoice] = useState({});

  // Cache thông tin account theo ACCOUNT ID
  const [customerDetails, setCustomerDetails] = useState({});
  const [detailLoading, setDetailLoading] = useState({});

  // Cache battery details theo batteryId
  const [batteryDetails, setBatteryDetails] = useState({});
  const [batteryLoading, setBatteryLoading] = useState({});

  // Cache station (key theo stationId), CHỈ lấy qua staffId
  const [stationDetails, setStationDetails] = useState({
    byStaffId: {},
    byStationId: {},
  });
  
  // Tìm kiếm/sắp xếp
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('startDate');
  const [sortDirection, setSortDirection] = useState('desc');

  // Phân trang
  const [page, setPage] = useState(1);

  // State for battery report form pre-population
  const [batteryReportDefaults, setBatteryReportDefaults] = useState({});

  // Flag to control when to show success toast
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // THÊM CÁC STATE CHO LỊCH TRÌNH VỚI CALENDAR
  const [stationSchedules, setStationSchedules] = useState({});
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [selectedScheduleDate, setSelectedScheduleDate] = useState(null);
  const [schedulesByDate, setSchedulesByDate] = useState({});

  // ✅ THÊM STATE CHO EXCHANGE BATTERY PANEL
  const [activePanel, setActivePanel] = useState('dashboard');
  const [stationIdSelected, setStationIdSelected] = useState(null);
  const [exchanges, setExchanges] = useState([]);
  const [loadingExchanges, setLoadingExchanges] = useState(false);
  const [filters, setFilters] = useState({ status: 'Pending', keyword: '' });
  const [ordersMap, setOrdersMap] = useState({}); // { [orderId]: { status: 'Paid' | ... } }

  // MOVE stationAssignments UP HERE - before functions that use it
  const stationAssignments = useMemo(() => {
    const assignments = [];
    if (!currentUser) {
      return assignments;
    }

    const byStationId = stationDetails?.byStationId || {};
    const byStaffId = stationDetails?.byStaffId || {};

    if (Array.isArray(currentUser?.bssStaffs) && currentUser.bssStaffs.length > 0) {
      currentUser.bssStaffs.forEach((staff, index) => {
        const staffId = staff?.staffId;
        const stationId = staff?.stationId || staff?.StationId;
        const stationNameFromCache = (stationId && byStationId[stationId]) || (staffId && byStaffId[staffId]);
        assignments.push({
          id: `${staffId || index}-${stationId || index}`,
          staffId,
          stationId,
          stationName: stationNameFromCache || stationId || 'Unknown station',
          role: staff?.role || staff?.Role || 'Staff',
        });
      });
      return assignments;
    }

    const fallbackStationId = currentUser?.stationId || currentUser?.StationId || currentUser?.stationID;
    if (fallbackStationId) {
      assignments.push({
        id: `primary-${fallbackStationId}`,
        staffId: currentUser?.staffId,
        stationId: fallbackStationId,
        stationName:
          byStationId[fallbackStationId] ||
          (currentUser?.staffId && byStaffId[currentUser.staffId]) ||
          fallbackStationId,
        role: Array.isArray(currentUser?.roles)
          ? currentUser.roles.join(', ')
          : (currentUser?.role || currentUser?.Role || 'Staff'),
      });
    }

    return assignments;
  }, [currentUser, stationDetails]);

  const batteryReportData = useMemo(() => {
    const summary = {};
    forms.forEach((form) => {
      if (!form) return;

      const batteryId =
        form?.batteryId ||
        form?.BatteryId ||
        form?.battery?.batteryId ||
        form?.battery?._id ||
        form?.battery?.id;

      if (!batteryId) return;

      const batteryName =
        form?.batteryName ||
        form?.battery?.batteryName ||
        form?.battery?.name ||
        `Battery ${batteryId}`;

      const status = form?.status || form?.Status || form?.formStatus || 'Unknown';

      if (!summary[batteryId]) {
        summary[batteryId] = {
          batteryId,
          batteryName,
          total: 0,
          statusCounts: {},
        };
      }

      summary[batteryId].total += 1;
      summary[batteryId].statusCounts[status] = (summary[batteryId].statusCounts[status] || 0) + 1;
    });

    return Object.values(summary).sort((a, b) => b.total - a.total);
  }, [forms]);

  const activeViewKey = VIEW_CONFIG[viewMode] ? viewMode : DEFAULT_VIEW_KEY;
  const activeView = VIEW_CONFIG[activeViewKey];
  const isFormsView = activeViewKey === 'forms';
  const isStationSchedulesView = activeViewKey === 'station-schedules';
  const isBatteryReportView = activeViewKey === 'battery-report';
  const isExchangeBatteryView = activeViewKey === 'exchange-battery';
  const pageTitle = activeView?.label || VIEW_CONFIG[DEFAULT_VIEW_KEY].label;

  const handleSwitchView = useCallback((nextView) => {
    const safeView = VIEW_CONFIG[nextView] ? nextView : DEFAULT_VIEW_KEY;
    setSelectedForm(null);
    setViewMode(safeView);
    if (safeView === DEFAULT_VIEW_KEY) {
      setPage(1);
    }
  }, [setViewMode, setSelectedForm, setPage]);

  // Hàm xử lý khi chọn ngày từ calendar - ĐÃ CẬP NHẬT
  const handleDateSelect = useCallback((date) => {
    setSelectedScheduleDate(date);
    
    // Format date để so sánh (YYYY-MM-DD)
    const dateKey = `${date.year}-${String(date.month + 1).padStart(2, '0')}-${String(date.date).padStart(2, '0')}`;
    
    // Nếu đã có dữ liệu cho ngày này trong cache, không cần xử lý lại
    if (schedulesByDate[dateKey]) {
      return;
    }

    // Lọc lịch trình từ stationSchedules đã preload theo ngày được chọn
    const allSchedules = [];
    Object.keys(stationSchedules).forEach(stationId => {
      const schedules = stationSchedules[stationId] || [];
      const assignment = stationAssignments.find(a => a.stationId === stationId);
      
      const filteredSchedules = schedules.filter(schedule => {
        if (!schedule.date && !schedule.startDate) return false;
        
        const scheduleDate = new Date(schedule.date || schedule.startDate);
        const scheduleDateKey = `${scheduleDate.getFullYear()}-${String(scheduleDate.getMonth() + 1).padStart(2, '0')}-${String(scheduleDate.getDate()).padStart(2, '0')}`;
        
        return scheduleDateKey === dateKey;
      });

      filteredSchedules.forEach(schedule => {
        allSchedules.push({
          ...schedule,
          stationName: assignment?.stationName || stationId,
          stationId: stationId
        });
      });
    });

    // Lưu vào cache
    setSchedulesByDate(prev => ({
      ...prev,
      [dateKey]: allSchedules
    }));
  }, [stationAssignments, schedulesByDate, stationSchedules]);

  // Hàm render lịch trình theo ngày đã chọn
  const renderSchedulesForSelectedDate = useCallback(() => {
    if (!selectedScheduleDate) return null;

    const dateKey = `${selectedScheduleDate.year}-${String(selectedScheduleDate.month + 1).padStart(2, '0')}-${String(selectedScheduleDate.date).padStart(2, '0')}`;
    const schedules = schedulesByDate[dateKey] || [];

    if (loadingSchedules) {
      return (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⏳</div>
          <p>Đang tải lịch trình...</p>
        </div>
      );
    }

    if (schedules.length === 0) {
      return (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px',
          color: '#64748b',
          fontStyle: 'italic'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📭</div>
          <h4 style={{ color: '#475569', marginBottom: '8px' }}>Không có lịch trình</h4>
          <p>Không có lịch trình nào cho ngày này.</p>
        </div>
      );
    }

    return (
      <div style={{
        display: 'grid',
        gap: '16px',
        maxHeight: '500px',
        overflowY: 'auto',
        padding: '10px'
      }}>
        {schedules.map((schedule, index) => (
          <div 
            key={`${schedule.stationScheduleId}-${index}`}
            style={{
              padding: '16px',
              background: 'rgba(255,255,255,0.95)',
              borderRadius: '12px',
              border: '2px solid rgba(226, 232, 240, 0.8)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
            }}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              marginBottom: '12px'
            }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ 
                  margin: '0 0 8px 0', 
                  color: '#0f172a',
                  fontSize: '16px',
                  fontWeight: '600'
                }}>
                  🏢 {schedule.stationName || `Trạm ${schedule.stationId}`}
                </h4>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap'
                }}>
                  <span style={{ 
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '700',
                    background: schedule.status === 'Active' 
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                      : schedule.status === 'Pending'
                      ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                      : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: 'white'
                  }}>
                    {schedule.status === 'Active' ? '🟢' : 
                     schedule.status === 'Pending' ? '🟡' : '🔴'} {schedule.status}
                  </span>
                  <span style={{ 
                    fontSize: '12px',
                    color: '#64748b',
                    background: 'rgba(15,23,42,0.05)',
                    padding: '4px 8px',
                    borderRadius: '6px'
                  }}>
                    ID: {schedule.stationScheduleId}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ 
              color: '#475569', 
              fontSize: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              {schedule.description && (
                <div>
                  <strong>Mô tả:</strong> {schedule.description}
                </div>
              )}
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <strong>Form ID:</strong> {schedule.formId || 'N/A'}
                </div>
                <div>
                  <strong>Trạm ID:</strong> {schedule.stationId}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <strong>Ngày tạo:</strong> {formatDate(schedule.startDate)}
                </div>
                <div>
                  <strong>Cập nhật:</strong> {formatDate(schedule.updateDate)}
                </div>
              </div>

              {schedule.exchangeBatteries && schedule.exchangeBatteries.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <strong>🔋 Pin trao đổi:</strong>
                  <div style={{ 
                    marginTop: '4px',
                    padding: '8px',
                    background: 'rgba(15,23,42,0.03)',
                    borderRadius: '6px'
                  }}>
                    {schedule.exchangeBatteries.map((battery, idx) => (
                      <div key={idx} style={{ fontSize: '12px' }}>
                        • {battery.batteryId || battery.id} - {battery.status || 'Unknown'}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }, [selectedScheduleDate, schedulesByDate, loadingSchedules]);

  // New function to handle battery report navigation with form data
  const handleBatteryReport = useCallback((form) => {
    const defaults = {
      accountId: form.accountId || '',
      stationId: form.stationId || '',
      batteryId: form.batteryId || form.BatteryId || form.battery?.batteryId || form.battery?._id || form.battery?.id || '',
      staffName: currentUser?.name || currentUser?.Name || 'Staff'
    };
    setBatteryReportDefaults(defaults);
    handleSwitchView('battery-report');
  }, [currentUser, handleSwitchView]);

  // ✅ THÊM HÀM LOAD EXCHANGES
  const loadExchanges = useCallback(async (stationId) => {
    setLoadingExchanges(true);
    try {
      const data = await authAPI.getExchangesByStation(stationId);
      const list = data?.data ?? data ?? [];
      setExchanges(list);

      const uniqueOrderIds = [...new Set(list.map(x => x.orderId).filter(Boolean))];
      if (uniqueOrderIds.length) {
        const results = await Promise.allSettled(uniqueOrderIds.map((id) => authAPI.getOrderById(id)));
        const map = {};
        results.forEach((r, idx) => {
          const id = uniqueOrderIds[idx];
          if (r.status === 'fulfilled') {
            // getOrderById của bạn trả res.data → có thể là object trực tiếp hoặc { data: {...} }
            const raw = r.value;
            const od = raw?.data ?? raw ?? {};
            map[id] = { status: od?.status || od?.orderStatus || od?.data?.status || 'Unknown' };
          }
        });
        setOrdersMap(map);
      } else {
        setOrdersMap({});
      }
    } catch (e) {
      console.error('Error loading exchanges:', e);
      toast.error('Lỗi khi tải danh sách trao đổi: ' + (e?.message || 'Lỗi không xác định'));
    } finally {
      setLoadingExchanges(false);
    }
  }, [toast]);

  // ✅ MỞ PANEL (gọi ở nút entry point)
  const openConfirmExchangePanel = useCallback((stationId) => {
    setStationIdSelected(stationId);
    setActivePanel('confirmExchange');
  }, []);

  // ✅ CHUYỂN SANG KHỐI BÁO CÁO PIN (prefill exchangeBatteryId)
  const handleOpenReport = useCallback((exchange) => {
    const defaults = {
      stationId: stationIdSelected,
      batteryId: exchange?.oldBatteryId,            // tuỳ nghiệp vụ
      exchangeBatteryId: exchange?.exchangeBatteryId, // BẮT BUỘC
      accountId: exchange?.accountId || '',
    };
    setBatteryReportDefaults(defaults);
    handleSwitchView('battery-report');
  }, [stationIdSelected, handleSwitchView]);

  // ✅ ĐIỀU KIỆN ENABLE "HOÀN TẤT"
  const canComplete = useCallback((exchange) => {
    const orderStatus = ordersMap?.[exchange?.orderId]?.status;
    const orderPaid = ['Paid', 'PAID'].includes(orderStatus);

    // Nếu BE đã trả kèm các field này thì dùng trực tiếp; nếu chưa có, tạm coi true (để không chặn sai).
    const reportCompleted = exchange?.reportStatus ? exchange.reportStatus === 'Completed' : true;
    const newBatteryAvailable = exchange?.newBatteryStatus ? exchange.newBatteryStatus === 'Available' : true;

    return orderPaid && reportCompleted && newBatteryAvailable && exchange?.status === 'Pending';
  }, [ordersMap]);

  // ✅ PUT "Completed"
  const handleComplete = useCallback(async (exchange) => {
    try {
      const currentStaffId = currentUser?.staffId || currentUser?.accountId;
      await authAPI.updateExchangeStatus({
        StaffId: currentStaffId, // Changed from staffId to StaffId
        ExchangeBatteryId: exchange.exchangeBatteryId, // Changed from exchangeBatteryId to ExchangeBatteryId
        status: 'Completed',
      });
      await loadExchanges(stationIdSelected);
      toast.success('Đã hoàn tất trao đổi.');
    } catch (e) {
      console.error('Error completing exchange:', e);
      toast.error('Không thể hoàn tất: ' + (e?.message || 'Lỗi không xác định'));
    }
  }, [currentUser, stationIdSelected, loadExchanges, toast]);

  // ✅ PUT "Cancelled"
  const handleCancel = useCallback(async (exchange) => {
    try {
      const currentStaffId = currentUser?.staffId || currentUser?.accountId;
      await authAPI.updateExchangeStatus({
        StaffId: currentStaffId, // Changed from staffId to StaffId
        ExchangeBatteryId: exchange.exchangeBatteryId, // Changed from exchangeBatteryId to ExchangeBatteryId
        status: 'Cancelled',
      });
      await loadExchanges(stationIdSelected);
      toast.success('Đã huỷ yêu cầu.');
    } catch (e) {
      console.error('Error cancelling exchange:', e);
      toast.error('Không thể huỷ: ' + (e?.message || 'Lỗi không xác định'));
    }
  }, [currentUser, stationIdSelected, loadExchanges, toast]);

  // ✅ TỰ LOAD KHI VÀO PANEL
  useEffect(() => {
    if (activePanel === 'confirmExchange' && stationIdSelected) {
      loadExchanges(stationIdSelected);
    }
  }, [activePanel, stationIdSelected, loadExchanges]);

  // Preload station schedules khi stationAssignments thay đổi
  useEffect(() => {
    const preloadStationSchedules = async () => {
      if (stationAssignments.length === 0) return;
      
      setLoadingSchedules(true);
      try {
        const allSchedules = {};
        
        for (const assignment of stationAssignments) {
          try {
            const res = await authAPI.getStationSchedulesByStationId(assignment.stationId);
            
            // Xử lý response - có thể là array trực tiếp hoặc nested trong data
            const schedules = Array.isArray(res?.data) ? res.data : 
                             (Array.isArray(res?.data?.data) ? res.data.data : []);
            
            allSchedules[assignment.stationId] = schedules;
          } catch (err) {
            console.error(`Error fetching schedules for station ${assignment.stationId}:`, err);
            allSchedules[assignment.stationId] = [];
          }
        }
        
        setStationSchedules(allSchedules);
      } catch (error) {
        console.error('Error preloading station schedules:', error);
        toast.error('Lỗi khi tải lịch trình trạm: ' + (error?.message || 'Lỗi không xác định'));
      } finally {
        setLoadingSchedules(false);
      }
    };

    preloadStationSchedules();
  }, [stationAssignments]);

  /* ======== Init: current user + prefetch station by staffId + forms by station ======== */
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = await authAPI.getCurrent();
        setCurrentUser(user);

        // Prefetch station theo staffId để có stationName (Sxxx) -> cache theo stationId
        const staffIds = Array.isArray(user?.bssStaffs)
          ? user.bssStaffs.map(s => s?.staffId).filter(Boolean)
          : [];
        
        staffIds.forEach(fetchStationByStaffId);

        // Lấy stationId để load forms
        let stationId = user?.stationId || user?.StationId || user?.stationID;
        if (!stationId && Array.isArray(user?.bssStaffs) && user.bssStaffs.length > 0) {
          stationId = user.bssStaffs[0]?.stationId || user.bssStaffs[0]?.StationId;
        }

        if (stationId) {
          
          await fetchFormsForStation(stationId);
        } else {
          toast.warning('Không tìm thấy station ID cho user hiện tại');
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
        toast.error('Lỗi khi tải thông tin người dùng: ' + (error?.message || 'Lỗi không xác định'));
      }
    };
    fetchCurrentUser();
  }, []);

  /* ======== API calls ======== */
  // Gửi staffId và lưu về stationName
  // data.data.stationName trong đây lấy được - ưu tiên lấy ở đó
  const fetchStationByStaffId = useCallback(async (staffId) => {
    if (!staffId) return;
    try {
      // Gửi staffId lên API, API trả về đối tượng station (hoặc { stationName }), đôi khi lồng trong .station hoặc .data.stationName
      const data = await authAPI.getStationByStaffId(staffId);
      let stationName = 
        data?.data?.stationName // Ưu tiên stationName trong data.data
        || data?.stationName
        || data?.station?.stationName
        || data?.station?.name
        || data?.name; // fallback      

      // Lấy stationId từ response
      let stationId = 
        data?.data?.stationId
        || data?.stationId
        || data?.station?.stationId
        || data?.station?.id
        || data?.id;

      // Nếu vẫn không có, thử kiểm tra object values
      if (!stationName && data && typeof data === 'object') {
        const found = Object.values(data).find(val =>
          typeof val === 'object' && (val.stationName || val.name)
        );
        stationName = found?.stationName || found?.name;
        if (!stationId && found) {
          stationId = found.stationId || found.id;
        }
      }

      console.log("Fetched stationName for staffId:", staffId, stationName, "stationId:", stationId, "rawData:", data?.data?.stationName);

      if (stationName) {
        setStationDetails(prev => ({
          byStaffId: {
            ...(prev?.byStaffId || {}),
            [staffId]: stationName,
          },
          byStationId: stationId
            ? {
                ...(prev?.byStationId || {}),
                [stationId]: stationName,
              }
            : (prev?.byStationId || {}),
        }));
      } else {
        toast.warning(`Không tìm thấy thông tin trạm cho Staff ID: ${staffId}`);
      }
    } catch (err) {
      console.error("Error fetching station for staffId:", staffId, err);
      toast.error(`Lỗi khi tải thông tin trạm cho Staff ID ${staffId}: ${err?.message || 'Lỗi không xác định'}`);
      setStationDetails(prev => ({
        ...prev,
        byStaffId: {
          ...(prev?.byStaffId || {}),
          [staffId]: 'Fetch error'
        }
      }));
    }
  }, []);

  const fetchFormsForStation = async (stationId, shouldShowToast = false) => {
    try {
      setLoading(true);
      const data = await formAPI.getFormsByStationId(stationId);
      const arr = Array.isArray(data) ? data : [];
      const normalized = arr.map(f => ({ ...f, formId: f.formId ?? f.id ?? f._id ?? null }));
      setForms(normalized);
      
      // Fetch customer and battery details for each form
      const customerPromises = [];
      const batteryPromises = [];
      
      normalized.forEach(f => { 
        if (f.accountId && !customerDetails[f.accountId]) {
          customerPromises.push(fetchAccountByCustomerId(f.accountId));
        }
        if (f.batteryId && !batteryDetails[f.batteryId]) {
          batteryPromises.push(fetchBatteryDetails(f.batteryId));
        }
      });

      // Wait for all customer and battery details to load
      if (customerPromises.length > 0) {
        await Promise.allSettled(customerPromises);
      }
      
      if (batteryPromises.length > 0) {
        await Promise.allSettled(batteryPromises);
      }

      setStatusChoice({});
      setPage(1);
      
      // Only show success toast when explicitly requested (like manual refresh)
      if (shouldShowToast) {
        toast.success(`Tải thành công ${normalized.length} form từ trạm ${stationId}`);
      }
    } catch (error) {
      console.error('Error fetching forms:', error);
      toast.error('Lỗi khi tải forms theo trạm: ' + (error?.message || 'Lỗi không xác định'));
    } finally {
      setLoading(false);
    }
  };

  /** Lấy thông tin pin theo batteryId */
  // Đã sửa: chưa lấy được thông tin pin
  const fetchBatteryDetails = useCallback(async (batteryId) => {
    if (!batteryId || batteryDetails[batteryId]) return;
    setBatteryLoading(prev => ({ ...prev, [batteryId]: true }));
    try {
      // Sử dụng đúng API từ authAPI (hoặc formAPI nếu đã truyền qua prop/context)
      // Đảm bảo đã import authAPI từ services/authAPI.js
      const battery = await authAPI.getBatteryById(batteryId);
      if (battery) {
        setBatteryDetails(prev => ({ ...prev, [batteryId]: battery }));
        
      } else {
        setBatteryDetails(prev => ({ ...prev, [batteryId]: null }));
        toast.warning(`Không tìm thấy thông tin pin ${batteryId}`);
      }
    } catch (error) {
      console.error('Error fetching battery details:', error);
      setBatteryDetails(prev => ({ ...prev, [batteryId]: null }));
      toast.error(`Lỗi khi tải thông tin pin ${batteryId}: ${error?.message || 'Lỗi không xác định'}`);
    } finally {
      setBatteryLoading(prev => ({ ...prev, [batteryId]: false }));
    }
  }, [batteryDetails]);

  /** Lấy account theo customerId bằng API /api/Account/get_customer_by_account_id */
  const fetchAccountByCustomerId = useCallback(async (accountId) => {
    if (!accountId || customerDetails[accountId]) return;
    setDetailLoading(prev => ({ ...prev, [accountId]: true }));
    try {
      const acc = await authAPI.getCustomerByAccountId(accountId);
      if (acc) {
        // Chỉ lấy các trường cần thiết: name, phone, address, email
        const customerInfo = {
          name: acc.name || acc.Name || '',
          phone: acc.phone || acc.Phone || '',  
          address: acc.address || acc.Address || '',
          email: acc.email || acc.Email || '',
          // Giữ lại một số trường khác có thể cần thiết cho hiển thị
          username: acc.username || acc.Username || '',
          customerID: acc.customerID || acc.CustomerID || '',
          status: acc.status || acc.Status || ''
        };
        setCustomerDetails(prev => ({ ...prev, [accountId]: customerInfo }));
        
      } else {
        toast.warning(`Không tìm thấy thông tin khách hàng cho Account ID: ${accountId}`);
      }
    } catch (error) {
      console.error('Error fetching customer details:', error);
      toast.error(`Lỗi khi tải thông tin khách hàng ${accountId}: ${error?.message || 'Lỗi không xác định'}`);
    } finally {
      setDetailLoading(prev => ({ ...prev, [accountId]: false }));
    }
  }, [customerDetails]);

  /* ======== Filters / Sort ======== */
  const handleSort = (field) => {
    if (sortBy === field) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortDirection('desc'); }
  };

  // FILTER OUT deleted forms
  const filteredAndSortedForms = useMemo(() => {
    // Only display non-deleted forms (status not 'deleted')
    let results = [...forms].filter(form => {
      const status = form?.status?.toLowerCase?.() || '';
      return status !== 'deleted';
    });

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(form => {
        const customer = customerDetails[form.accountId];
        const station  = stationDetails[form.stationId];

        const customerNameMatch  = customer?.name?.toLowerCase().includes(term);
        const customerUserMatch  = customer?.username?.toLowerCase().includes(term);
        const customerPhoneMatch = customer?.phone?.toLowerCase().includes(term);
        const customerEmailMatch = customer?.email?.toLowerCase().includes(term);

        const stationNameMatch   = station?.stationName?.toLowerCase().includes(term);
        const titleMatch         = form.title?.toLowerCase().includes(term);
        const descriptionMatch   = form.description?.toLowerCase().includes(term);

        const idMatch =
          (form.customerId && String(form.customerId).toLowerCase().includes(term)) ||
          (form.accountId && String(form.accountId).toLowerCase().includes(term));

        return idMatch || stationNameMatch || titleMatch || descriptionMatch ||
               customerNameMatch || customerUserMatch || customerPhoneMatch || customerEmailMatch;
      });
    }

    if (statusFilter !== 'All') {
      results = results.filter(form =>
        form.status && form.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    if (sortBy) {
      results.sort((a, b) => {
        let aValue = a[sortBy]; let bValue = b[sortBy];
        if (sortBy === 'date') { aValue = aValue ? new Date(aValue) : new Date(0); bValue = bValue ? new Date(bValue) : new Date(0); }
        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return results;
  }, [forms, searchTerm, statusFilter, sortBy, sortDirection, customerDetails, stationDetails]);

  // Separate filtered forms for different sections
  const submittedForms = useMemo(() => {
    return filteredAndSortedForms.filter(f => f.status?.toLowerCase() === 'submitted');
  }, [filteredAndSortedForms]);

  const processedForms = useMemo(() => {
    return filteredAndSortedForms.filter(f => ['approved', 'rejected', 'completed'].includes(f.status?.toLowerCase()));
  }, [filteredAndSortedForms]);

  /* ======== Pagination ======== */
  const totalItems = filteredAndSortedForms.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  useEffect(() => { setPage(1); }, [searchTerm, statusFilter, sortBy, sortDirection, totalItems]);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentForms = filteredAndSortedForms.slice(startIndex, endIndex);
  const handlePageChange = (p) => { if (p >= 1 && p <= totalPages) setPage(p); };

  /* ======== Status / Actions ======== */
  const handleUpdateStatus = async (formId, status) => {
    if (!formId) { 
      toast.error('Không xác định được Form ID'); 
      return; 
    }
    if (!status) { 
      toast.info('Hãy chọn trạng thái trước khi cập nhật'); 
      return; 
    }
    
    const loadingMessage = toast.loading('Đang cập nhật trạng thái form...', 0);
    try {
      setLoading(true);
      const response = await formAPI.updateFormStatusStaff({ formId, status });
      loadingMessage();
      
      // Check if response indicates success
      if (response?.isSuccess !== false && !response?.error) {
        const successMsg = status?.toLowerCase() === 'approved' 
          ? `✅ Đã duyệt form ${formId} thành công!` 
          : `✅ Đã từ chối form ${formId} thành công!`;
        
        toast.success({
          content: successMsg,
          duration: 3,
          style: { fontSize: 16 }
        });

        // Clear the status choice for this form
        setStatusChoice(prev => {
          const newChoice = { ...prev };
          delete newChoice[formId];
          return newChoice;
        });

        // Refresh forms
        const stationId =
          (Array.isArray(currentUser?.bssStaffs) && currentUser.bssStaffs.length > 0)
            ? (currentUser.bssStaffs[0]?.stationId || currentUser.bssStaffs[0]?.StationId)
            : (currentUser?.stationId || currentUser?.StationId || currentUser?.stationID);
        if (stationId) {
          await fetchFormsForStation(stationId, false); // Don't show toast on status update refresh
        }
      } else {
        // Handle API error response
        const errorMsg = response?.message || response?.responseCode || response?.error || 'Lỗi không xác định từ server';
        toast.error({
          content: `❌ Cập nhật trạng thái thất bại: ${errorMsg}`,
          duration: 4,
          style: { fontSize: 16 }
        });
      }
    } catch (e) {
      loadingMessage();
      console.error('Error updating form status:', e);
      
      // Detailed error message
      let errorDetail = 'Lỗi không xác định';
      if (e?.response?.data?.message) {
        errorDetail = e.response.data.message;
      } else if (e?.response?.data?.error) {
        errorDetail = e.response.data.error;
      } else if (e?.message) {
        errorDetail = e.message;
      } else if (e?.response?.status) {
        errorDetail = `HTTP ${e.response.status}: ${e.response.statusText || 'Lỗi server'}`;
      }
      
      toast.error({
        content: `❌ Cập nhật trạng thái thất bại: ${errorDetail}`,
        duration: 5,
        style: { fontSize: 16 }
      });
    } finally { 
      setLoading(false); 
    }
  };

  const handleDeleteForm = async (formId) => {
    if (!formId) { 
      toast.error('Không xác định được Form ID'); 
      return; 
    }
    if (!window.confirm('Bạn có chắc muốn xóa form này? Hành động này không thể hoàn tác.')) return;
    
    const loadingMessage = toast.loading('Đang xóa form...', 0);
    try {
      setLoading(true);
      const resp = await formAPI.deleteForm(formId);
      loadingMessage();
      
      if (resp?.isSuccess) {
        toast.success({
          content: `✅ Xóa form ${formId} thành công!`,
          duration: 3,
          style: { fontSize: 16 }
        });
        setSelectedForm(null);
        
        // Refresh forms
        const stationId =
          (Array.isArray(currentUser?.bssStaffs) && currentUser.bssStaffs.length > 0)
            ? (currentUser.bssStaffs[0]?.stationId || currentUser.bssStaffs[0]?.StationId)
            : (currentUser?.stationId || currentUser?.StationId || currentUser?.stationID);
        if (stationId) {
          await fetchFormsForStation(stationId, false); // Don't show toast on delete refresh
        }
      } else {
        // Handle API error response
        const errorMsg = resp?.responseCode || resp?.message || resp?.error || 'Lỗi không xác định từ server';
        toast.error({
          content: `❌ Xóa form thất bại: ${errorMsg}`,
          duration: 4,
          style: { fontSize: 16 }
        });
      }
    } catch (e) {
      loadingMessage();
      console.error('Error deleting form:', e);
      
      // Detailed error message
      let errorDetail = 'Lỗi không xác định';
      if (e?.response?.data?.message) {
        errorDetail = e.response.data.message;
      } else if (e?.response?.data?.error) {
        errorDetail = e.response.data.error;
      } else if (e?.message) {
        errorDetail = e.message;
      } else if (e?.response?.status) {
        errorDetail = `HTTP ${e.response.status}: ${e.response.statusText || 'Lỗi server'}`;
      } else if (e?.code) {
        errorDetail = `Mã lỗi: ${e.code}`;
      }
      
      toast.error({
        content: `❌ Xóa form thất bại: ${errorDetail}`,
        duration: 5,
        style: { fontSize: 16 }
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'pending' || s === 'chờ xử lý') return 'status-chip status-pending';
    if (s === 'approved' || s === 'đã duyệt') return 'status-chip status-approved';
    if (s === 'rejected' || s === 'từ chối') return 'status-chip status-rejected';
    if (s === 'completed' || s === 'hoàn thành') return 'status-chip status-completed';
    return 'status-chip status-unknown';
  };

  const handleRefresh = async () => {
    const stationId =
      (Array.isArray(currentUser?.bssStaffs) && currentUser.bssStaffs.length > 0)
        ? (currentUser.bssStaffs[0]?.stationId || currentUser.bssStaffs[0]?.StationId)
        : (currentUser?.stationId || currentUser?.StationId || currentUser?.stationID);
    
    if (stationId) {
      toast.loading('Đang làm mới dữ liệu...', 1);
      await fetchFormsForStation(stationId, true); // Pass true to show success toast
    } else {
      toast.warning('Không tìm thấy station ID để refresh');
    }
  };

  const handleLogout = () => {
    try {
      toast.loading('Đang đăng xuất...', 1);
      // Gỡ mọi token/token staff khỏi localStorage/sessionStorage và cookies nếu có
      sessionStorage.setItem('authToken', '');
      sessionStorage.removeItem('authToken');
      
      document.cookie = 'authToken=; Max-Age=0; path=/;'; 
      toast.success('Đăng xuất thành công!');
      
      setTimeout(() => {
        window.location.replace('/signin');
      }, 500);
    } catch (e) {
      console.error('Error during logout:', e);
      toast.error('Có lỗi xảy ra khi đăng xuất');
      window.location.replace('/signin');
    }
  };

  /* Helper: ký tự viết tắt cho avatar khi không có ảnh */
  const getInitials = (name) => {
    if (!name) return 'ST';
    const parts = String(name).trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';
    return (first + last).toUpperCase() || 'ST';
  };

  /* =================== RENDER =================== */
  return (
    <>
      {contextHolder}
      {/* SVG filter LiquidGlass (ẩn) – dùng cho card */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <filter id="liquidGlass" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="2" seed="8" result="noise" />
            <feGaussianBlur in="noise" stdDeviation="2" result="map" />
            <feDisplacementMap in="SourceGraphic" in2="map" scale="50" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {/* NỀN ẢNH TOÀN TRANG */}
      <div className="staff-bg" />

      <div className="staff-root">
        {/* CỤM AVATAR + 3 NÚT NỔI BÊN TRÁI */}
        <div className="floating-rail">
          <button
            type="button"
            className="action-fab"
            title="Hồ sơ"
            onClick={() => setShowProfile(true)}
          >
            {currentUser?.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                fill="currentColor"
                viewBox="0 0 24 24"
                style={{ display: 'block', margin: '0 auto' }}
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20v-1c0-2.761 3.134-5 7-5s7 2.239 7 5v1" />
              </svg>
            )}
          </button>

          {VIEW_NAV.map(({ key, label, icon }) => (
            <button
              key={key}
              type="button"
              className={`action-fab ${activeViewKey === key ? 'active' : ''}`}
              title={label}
              aria-pressed={activeViewKey === key}
              onClick={() => handleSwitchView(key)}
            >
              {icon}
            </button>
          ))}
        </div>

        {/* Backdrop + Drawer */}
        <div className={`drawer-backdrop ${showProfile ? 'open' : ''}`} onClick={() => setShowProfile(false)} />
        <aside className={`profile-drawer ${showProfile ? 'open' : ''}`}>
          <div className="profile-drawer-header">
            <h3 className="profile-drawer-title">Hồ sơ nhân viên</h3>
            <button className="profile-close-btn" onClick={() => setShowProfile(false)}>Đóng</button>
          </div>
          <div className="profile-drawer-content liquid">
            {currentUser ? (
              <>
                <div className="profile-section">
                  <div className="profile-row"><div className="profile-label">Tên</div><div className="profile-value">{currentUser.name || currentUser.Name || 'N/A'}</div></div>
                  <div className="profile-row"><div className="profile-label">Username</div><div className="profile-value">{currentUser.username || currentUser.Username || 'N/A'}</div></div>
                  <div className="profile-row"><div className="profile-label">Email</div><div className="profile-value">{currentUser.email || currentUser.Email || 'N/A'}</div></div>
                  <div className="profile-row"><div className="profile-label">SĐT</div><div className="profile-value">{currentUser.phone || currentUser.Phone || 'N/A'}</div></div>
                  <div className="profile-row"><div className="profile-label">Địa chỉ</div><div className="profile-value">{currentUser.address || currentUser.Address || 'N/A'}</div></div>
                  <div className="profile-row"><div className="profile-label">Vai trò</div><div className="profile-value">{Array.isArray(currentUser.roles) ? currentUser.roles.join(', ') : (currentUser.role || currentUser.Role || 'N/A')}</div></div>
                  <div className="profile-row"><div className="profile-label">Account ID</div><div className="profile-value">{currentUser.accountId || currentUser.accountID || currentUser.AccountId || 'N/A'}</div></div>
                  <div className="profile-row"><div className="profile-label">Station ID</div>
                    <div className="profile-value">
                      {(Array.isArray(currentUser?.bssStaffs) && currentUser.bssStaffs[0]?.stationId) ||
                        currentUser?.stationId || currentUser?.StationId || currentUser?.stationID || 'N/A'}
                    </div>
                  </div>
                </div>
                <button className="logout-btn" onClick={handleLogout}>Đăng xuất</button>
              </>
            ) : (
              <div className="profile-section">Đang tải thông tin người dùng…</div>
            )}
          </div>
        </aside>

        <h1 className="staff-title">{pageTitle}</h1>

        {isFormsView && (
          <>
            {/* Filters (GLASS) */}
            <section className="filters glass liquid">
              <h2 className="filters-title">Tìm kiếm & Sắp xếp Form</h2>
              <div className="filters-row">
                <div className="input-search">
                  <input
                    type="text"
                    placeholder="Search by Customer, Phone, Email, Station..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <span className="icon">🔍</span>
                </div>

                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6, color: 'white' }}>Filter by Status</div>
                  <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="All">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6, color: 'white' }}>Sort by</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <select className="select" value={sortBy} onChange={(e) => handleSort(e.target.value)}>
                      <option value="startDate">Date</option>
                      <option value="title">Title</option>
                      <option value="status">Status</option>
                    </select>
                    <button
                      className="btn-sortdir"
                      onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                    >
                      {sortDirection === 'asc' ? '↑ Asc' : '↓ Desc'}
                    </button>
                  </div>
                </div>

                <div className="results">
                  <span>Results</span>
                  <div>Showing: {filteredAndSortedForms.length} / {forms.length} forms</div>
                </div>
              </div>
            </section>


            {/* Duyệt Form (bên ngoài phần Form đã gửi) */}
            <section className="liquid" style={{ marginTop: 24, padding: 24, borderRadius: 24 }}>
              <h3 style={{ 
                margin: '0 0 16px 0', 
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>✅</span>
                Duyệt Form đổi pin
              </h3>
              {submittedForms.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: '#64748b',
                  fontStyle: 'italic'
                }}>
                  <div style={{ fontSize: '2.2rem', marginBottom: '16px' }}>🎉</div>
                  <h4 style={{ color: '#475569', marginBottom: '8px' }}>Không có form nào đang chờ duyệt</h4>
                  <p>Tất cả form đã được duyệt hoặc chuyển trạng thái khác.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {submittedForms.map((form) => {
                    const fid = getFormId(form);
                    const accountId = form.accountId;
                    const customer = customerDetails[accountId];
                    const battery = batteryDetails[form.batteryId];

                    return (
                      <div 
                        key={fid ?? Math.random()}
                        style={{
                          padding: '16px',
                          background: 'rgba(255,255,255,0.95)',
                          borderRadius: '12px',
                          border: '2px solid rgba(59,130,246,0.25)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                              <h4 style={{ 
                                margin: 0, 
                                color: '#0f172a',
                                fontSize: '16px',
                                fontWeight: '600'
                              }}>
                                📋 {form.title || 'Form đổi pin'}
                              </h4>
                              <span style={{
                                padding: '4px 12px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: '700',
                                background: 'linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)',
                                color: 'white'
                              }}>
                                📤 Đang chờ duyệt
                              </span>
                            </div>
                            <div style={{ 
                              display: 'grid', 
                              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
                              gap: '12px',
                              marginBottom: '12px'
                            }}>
                              <div>
                                <strong>📅 Ngày đăng ký:</strong> {formatDate(form.date || form.startDate)}
                              </div>
                              <div>
                                <strong>🔋 Battery ID:</strong> {form.batteryId || 'N/A'}
                              </div>
                              <div>
                                <strong>🏢 Trạm:</strong> {stationDetails.byStationId?.[form.stationId] || form.stationId || 'N/A'}
                              </div>
                              <div>
                                <strong>👤 Khách hàng:</strong> {customer?.name || 'Đang tải...'}
                              </div>
                            </div>
                            {form.description && (
                              <div style={{ marginBottom: '12px' }}>
                                <strong>📝 Mô tả:</strong> {form.description}
                              </div>
                            )}
                            {/* Thông tin pin chi tiết */}
                            {battery && (
                              <div style={{
                                background: 'rgba(16, 185, 129, 0.1)',
                                padding: '12px',
                                borderRadius: '8px',
                                marginBottom: '12px'
                              }}>
                                <div style={{ fontWeight: '600', marginBottom: '8px', color: '#059669' }}>
                                  🔋 Thông tin pin
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px', fontSize: '13px' }}>
                                  <div><strong>Tên:</strong> {battery.batteryName || 'N/A'}</div>
                                  <div><strong>Trạng thái:</strong> {battery.status || 'N/A'}</div>
                                  <div><strong>Dung lượng:</strong> {battery.capacity ? `${battery.capacity}%` : 'N/A'}</div>
                                  <div><strong>Chất lượng:</strong> {battery.batteryQuality ? `${battery.batteryQuality}%` : 'N/A'}</div>
                                </div>
                              </div>
                            )}
                            {/* Thông tin khách hàng chi tiết */}
                            {customer && (
                              <div style={{
                                background: 'rgba(59, 130, 246, 0.1)',
                                padding: '12px',
                                borderRadius: '8px',
                                marginBottom: '12px'
                              }}>
                                <div style={{ fontWeight: '600', marginBottom: '8px', color: '#2563eb' }}>
                                  👤 Thông tin khách hàng
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px', fontSize: '13px' }}>
                                  <div><strong>Tên:</strong> {customer.name || 'N/A'}</div>
                                  <div><strong>SĐT:</strong> {customer.phone || 'N/A'}</div>
                                  <div><strong>Email:</strong> {customer.email || 'N/A'}</div>
                                  <div><strong>Account ID:</strong> {accountId}</div>
                                </div>
                              </div>
                            )}
                          </div>
                          {/* Actions */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '180px', marginLeft: '10px' }}>
                            <select
                              className="status-select"
                              value={statusChoice[fid] || ''}
                              onChange={(e) => setStatusChoice(prev => ({ ...prev, [fid]: e.target.value }))}
                              style={{ marginBottom: 8 }}
                            >
                              <option value="">-- Chọn trạng thái --</option>
                              <option value="approved">Duyệt (Approved)</option>
                              <option value="rejected">Từ chối (Rejected)</option>
                            </select>
                            <button
                              className="status-apply-btn"
                              style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                background: 'rgba(16, 185, 129, 0.15)',
                                color: '#059669',
                                border: '1px solid rgba(15,23,42,0.13)',
                                fontSize: '14px'
                              }}
                              disabled={!statusChoice[fid] || loading}
                              onClick={() => handleUpdateStatus(fid, statusChoice[fid])}
                            >
                              Xác nhận giao dịch đổi pin
                            </button>
                            <button
                              className="status-apply-btn"
                              onClick={() => setSelectedForm(form)}
                              style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                background: 'rgba(15,23,42,0.08)',
                                color: '#0f172a',
                                border: '1px solid rgba(15,23,42,0.16)',
                                fontSize: '14px'
                              }}
                            >
                              👁️ Xem chi tiết
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {selectedForm && (
              <div className="modal-root">
                <div className="modal-card liquid">
                  <div className="modal-head liquid">
                    <h2>Form Chi Tiết</h2>
                    <button className="btn-close" onClick={() => setSelectedForm(null)}>Đóng</button>
                  </div>
                  <div className="modal-body liquid">
                    {/* <pre className="modal-pre">{JSON.stringify(selectedForm, null, 2)}</pre> */}
                    {/* Hiển thị chi tiết cục pin nếu có batteryId */}
                    {selectedForm?.batteryId && (
                      <div style={{ marginTop: 16, background: "#f9fafb", padding: 12, borderRadius: 8 }}>
                        <h4>Thông tin Pin</h4>
                        {batteryLoading[selectedForm.batteryId] ? (
                          <div>Đang tải thông tin pin...</div>
                        ) : batteryDetails[selectedForm.batteryId] ? (
                          <table className="battery-detail-table" style={{ width: '100%' }}>
                            <tbody>
                              {[
                                { key: 'batteryName', label: 'Tên Pin' },
                                { key: 'status', label: 'Trạng thái' },
                                { key: 'capacity', label: 'Dung lượng', isPercent: true },
                                { key: 'batteryType', label: 'Loại Pin' },
                                { key: 'specification', label: 'Thông số kỹ thuật' },
                                { key: 'batteryQuality', label: 'Chất lượng Pin', isPercent: true }
                              ].map(({ key, label, isPercent }) => {
                                const value = batteryDetails[selectedForm.batteryId][key];
                                let displayValue = value;
                                if (
                                  value !== undefined &&
                                  value !== null &&
                                  isPercent
                                ) {
                                  const numVal = typeof value === 'number' ? value : parseFloat(value);
                                  if (!isNaN(numVal)) {
                                    displayValue = `${numVal}%`;
                                  } else if (typeof value === 'string' && !value.trim().endsWith('%')) {
                                    displayValue = `${value}%`;
                                  } else {
                                    displayValue = value;
                                  }
                                }
                                return value !== undefined && value !== null ? (
                                  <tr key={key}>
                                    <td style={{ fontWeight: 500, paddingRight: 8 }}>{label}:</td>
                                    <td>{displayValue}</td>
                                  </tr>
                                ) : null;
                              })}
                            </tbody>
                          </table>
                        ) : (
                          <div>Không tìm thấy thông tin pin.</div>
                        )}
                      </div>
                    )}

                    {/* Dropdown đổi status trong modal */}
                    {(() => {
                      const fid = getFormId(selectedForm);
                      return (
                        <div className="status-inline" style={{ marginTop: 12 }}>
                          <select
                            className="status-select"
                            value={statusChoice[fid] || ''}
                            onChange={(e) => setStatusChoice(prev => ({ ...prev, [fid]: e.target.value }))}
                          >
                            <option value="">-- Chọn trạng thái --</option>
                            <option value="approved">Duyệt (Approved)</option>
                            <option value="rejected">Từ chối (Rejected)</option>
                          </select>
                          <button
                            className="status-apply-btn"
                            disabled={!statusChoice[fid] || loading}
                            onClick={() => handleUpdateStatus(fid, statusChoice[fid])}
                          >
                            Cập nhật
                          </button>
                        </div>
                      );
                    })()}
                    <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                      <button
                        className="btn-danger"
                        onClick={() => { const fid = getFormId(selectedForm); handleDeleteForm(fid); setSelectedForm(null); }}
                      >
                        Xóa Form
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Lịch sử giao dịch đã xử lý */}
            <section className="liquid" style={{ marginTop: 24, padding: 24, borderRadius: 24 }}>
              <h3 style={{ 
                margin: '0 0 16px 0', 
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>📋</span>
                Lịch sử Form đã xử lý
              </h3>

              {processedForms.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: '#64748b',
                  fontStyle: 'italic'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📭</div>
                  <h4 style={{ color: '#475569', marginBottom: '8px' }}>Chưa có giao dịch nào được xác nhận</h4>
                  <p>Các giao dịch đã xác nhận sẽ hiển thị ở đây.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
                  {processedForms.map((form) => {
                    const fid = getFormId(form);
                    const customer = customerDetails[form.accountId];
                    const statusColor = 
                      form.status?.toLowerCase() === 'approved' ? '#10b981' :
                      form.status?.toLowerCase() === 'rejected' ? '#ef4444' : '#3b82f6';
                    const statusIcon = 
                      form.status?.toLowerCase() === 'approved' ? '✅' :
                      form.status?.toLowerCase() === 'rejected' ? '❌' : '🔄';

                    return (
                      <div 
                        key={fid ?? Math.random()}
                        style={{
                          padding: '12px 16px',
                          background: 'rgba(255,255,255,0.95)',
                          borderRadius: '8px',
                          border: `1px solid ${statusColor}20`,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '16px' }}>{statusIcon}</span>
                            <h4 style={{ 
                              margin: 0, 
                              fontSize: '14px', 
                              fontWeight: '600',
                              color: '#0f172a'
                            }}>
                              {form.title || 'Giao dịch đổi pin'}
                            </h4>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: '600',
                              background: `${statusColor}20`,
                              color: statusColor
                            }}>
                              {form.status?.toUpperCase()}
                            </span>
                          </div>
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                            gap: '8px',
                            fontSize: '12px',
                            color: '#64748b'
                          }}>
                            <div>
                              <strong>📅 Ngày đặt:</strong> {formatDate(form.date)}
                            </div>
                            <div>
                              <strong>🗓️ Ngày tạo:</strong> {formatDate(form.startDate)}
                            </div>
                            <div>
                              <strong>🔋 Battery:</strong> {form.batteryId || 'N/A'}
                            </div>
                            <div>
                              <strong>👤 Khách hàng:</strong> {customer?.name || 'N/A'}
                            </div>
                            <div>
                              <strong>📞 Sđt khách hàng:</strong> {customer?.phone || 'N/A'}
                            </div>
                            <div>
                              <strong>🏢 Trạm:</strong> {stationDetails.byStationId?.[form.stationId] || form.stationId || 'N/A'}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            className="status-apply-btn"
                            onClick={() => setSelectedForm(form)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              background: 'rgba(15,23,42,0.1)',
                              color: '#0f172a',
                              border: '1px solid rgba(15,23,42,0.2)',
                              fontSize: '12px'
                            }}
                          >
                            👁️ Chi tiết
                          </button>
                          {form.status?.toLowerCase() === 'approved' && (
                            <button
                              className="status-apply-btn"
                              onClick={() =>  handleSwitchView('exchange-battery')}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                background: 'rgba(16, 185, 129, 0.1)',
                                color: '#059669',
                                border: '1px solid rgba(16, 185, 129, 0.2)'
                              }}
                            >
                              ✅ Xác nhận giao dịch
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}

        {/* PHẦN LỊCH TRÌNH TRẠM VỚI CALENDAR */}
        {isStationSchedulesView && (
          <section className="liquid" style={{ marginTop: 24, padding: 24, borderRadius: 24 }}>
            <h2 className="filters-title">Lịch trình các trạm theo ngày</h2>
            <p style={{ marginTop: 4, color: 'rgba(15,23,42,0.7)' }}>
              Chọn ngày để xem lịch trình của các trạm bạn phụ trách
            </p>

            {/* Calendar Component */}
            <div style={{ 
              background: 'rgba(255,255,255,0.8)', 
              borderRadius: '16px', 
              padding: '20px',
              marginBottom: '20px'
            }}>
              <Calendar 
                onDateSelect={(selectedDate) => {
                  console.log('Date selected in Staff:', selectedDate);
                  setSelectedScheduleDate(selectedDate);
                  
                  // Format selected date để so sánh (YYYY-MM-DD)
                  const selectedDateStr = `${selectedDate.year}-${String(selectedDate.month + 1).padStart(2, '0')}-${String(selectedDate.date).padStart(2, '0')}`;
                  
                  console.log('Looking for schedules on:', selectedDateStr);
                  
                  // Lọc lịch trình từ stationSchedules đã preload
                  const allSchedulesForDate = [];
                  Object.keys(stationSchedules).forEach(stationId => {
                    const schedules = stationSchedules[stationId] || [];
                    const assignment = stationAssignments.find(a => a.stationId === stationId);
                    
                    const filteredSchedules = schedules.filter(schedule => {
                      if (!schedule.date) return false;
                      
                      // Sử dụng UTC để tránh vấn đề timezone
                      const scheduleDate = new Date(schedule.date);
                      const scheduleDateStr = `${scheduleDate.getUTCFullYear()}-${String(scheduleDate.getUTCMonth() + 1).padStart(2, '0')}-${String(scheduleDate.getUTCDate()).padStart(2, '0')}`;
                      
                      return scheduleDateStr === selectedDateStr;
                    });

                    filteredSchedules.forEach(schedule => {
                      allSchedulesForDate.push({
                        ...schedule,
                        stationName: assignment?.stationName || `Trạm ${stationId}`,
                        stationId: stationId
                      });
                    });
                  });

                  console.log('Found schedules:', allSchedulesForDate.length);
                  
                  // Cập nhật cache
                  setSchedulesByDate(prev => ({
                    ...prev,
                    [selectedDateStr]: allSchedulesForDate
                  }));
                }}
              />
            </div>            
          </section>
        )}

        {isBatteryReportView && (
          <section className="liquid" style={{ marginTop: 24, padding: 24, borderRadius: 24 }}>
            <h2 className="filters-title">Battery Report</h2>
            <p style={{ marginTop: 4, color: 'rgba(15,23,42,0.7)' }}>
              Báo cáo dựa trên các form đã tải về. Chọn một form ở chế độ quản lý để cập nhật dữ liệu.
            </p>
            
            {/* Add Battery Report Form */}
            <BatteryReportForm
              defaults={{
                accountId: batteryReportDefaults.accountId || currentUser?.accountId || currentUser?.accountID || currentUser?.AccountId || '',
                stationId: batteryReportDefaults.stationId || (Array.isArray(currentUser?.bssStaffs) && currentUser.bssStaffs.length > 0)
                  ? (currentUser.bssStaffs[0]?.stationId || currentUser.bssStaffs[0]?.StationId)
                  : (currentUser?.stationId || currentUser?.StationId || currentUser?.stationID || ''),
                batteryId: batteryReportDefaults.batteryId || '',
                staffName: batteryReportDefaults.staffName || currentUser?.name || currentUser?.Name || 'Staff'
              }}
              onCreated={(result) => {
                setBatteryReportDefaults({});
                if (result?.isSuccess !== false && !result?.error) {
                  // Thành công
                  toast.success({
                    content: (
                      <div>
                        <span role="img" aria-label="success" style={{fontSize: 22, marginRight: 8}}>✅</span>
                        <b>Battery Report đã được tạo thành công!</b>
                      </div>
                    ),
                    duration: 3,
                    style: { marginTop: '30vh', fontSize: 18 }
                  });
                } else {
                  // Thất bại - show lỗi chi tiết ra màn hình
                  let errorMsg = result?.message || result?.error || 'Đã xảy ra lỗi khi tạo Battery Report.';
                  toast.error({
                    content: (
                      <div>
                        <span role="img" aria-label="error" style={{fontSize: 22, marginRight: 8}}>❌</span>
                        <b>Tạo Battery Report thất bại!</b>
                        <div style={{ marginTop: 4, fontWeight: 400, fontSize: 15 }}>{errorMsg}</div>
                      </div>
                    ),
                    duration: 5,
                    style: { marginTop: '30vh', fontSize: 18 }
                  });
                }
              }}
              messageApi={toast}
            />
          </section>
        )}

        {/* PHẦN XÁC NHẬN GIAO DỊCH PIN */}
        {isExchangeBatteryView && (
          <section className="liquid" style={{ marginTop: 24, padding: 24, borderRadius: 24 }}>
            <h2 className="filters-title">Xác nhận giao dịch đổi pin</h2>
            <p style={{ marginTop: 4, color: 'rgba(15,23,42,0.7)' }}>
              Quản lý và xác nhận các giao dịch đổi pin tại trạm của bạn
            </p>

            {/* Thống kê tổng quan */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '16px', 
              marginBottom: '24px' 
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                padding: '20px',
                borderRadius: '16px',
                color: 'white',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔋</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {forms.filter(f => f.status?.toLowerCase() === 'approved').length}
                </div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>Giao dịch đã duyệt</div>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                padding: '20px',
                borderRadius: '16px',
                color: 'white',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⏳</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {forms.filter(f => f.status?.toLowerCase() === 'pending').length}
                </div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>Chờ xác nhận</div>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                padding: '20px',
                borderRadius: '16px',
                color: 'white',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📊</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {forms.filter(f => f.status?.toLowerCase() !== 'deleted').length}
                </div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>Tổng giao dịch</div>
              </div>
            </div>

            {/* Station Selection for Exchange Panel */}
            <div style={{
              background: 'rgba(255,255,255,0.9)',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <h3 style={{ 
                margin: '0 0 16px 0', 
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>🏢</span>
                Chọn trạm để xem giao dịch đổi pin
              </h3>
              
              <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                {stationAssignments.map((assignment) => (
                  <button
                    key={assignment.id}
                    onClick={() => openConfirmExchangePanel(assignment.stationId)}
                    style={{
                      padding: '16px',
                      background: 'rgba(255,255,255,0.95)',
                      borderRadius: '12px',
                      border: '2px solid rgba(59, 130, 246, 0.3)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                    }}
                  >
                    <div style={{ fontWeight: '600', color: '#0f172a', marginBottom: '8px' }}>
                      🏢 {assignment.stationName}
                    </div>
                    <div style={{ fontSize: '14px', color: '#64748b' }}>
                      Station ID: {assignment.stationId}
                    </div>
                    <div style={{ fontSize: '14px', color: '#64748b' }}>
                      Role: {assignment.role}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Confirm Exchange Panel */}
            {activePanel === 'confirmExchange' && (
              <div style={{
                background: 'rgba(255,255,255,0.9)',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '20px'
              }}>
                <header style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  marginBottom: '16px'
                }}>
                  <h2 style={{ 
                    fontSize: '20px', 
                    fontWeight: '600',
                    margin: 0,
                    color: '#0f172a'
                  }}>
                    Xác nhận giao dịch đổi pin - {stationDetails.byStationId?.[stationIdSelected] || stationIdSelected}
                  </h2>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters(s => ({ ...s, status: e.target.value }))}
                      className="select"
                      style={{ padding: '8px 12px', borderRadius: '8px' }}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                    <input
                      placeholder="Tìm VIN / OrderId"
                      value={filters.keyword}
                      onChange={(e) => setFilters(s => ({ ...s, keyword: e.target.value }))}
                      className="select"
                      style={{ padding: '8px 12px', borderRadius: '8px' }}
                    />
                    <button
                      onClick={() => setActivePanel('dashboard')}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        background: 'rgba(15,23,42,0.1)',
                        color: '#0f172a',
                        border: '1px solid rgba(15,23,42,0.2)',
                        cursor: 'pointer'
                      }}
                    >
                      ← Quay lại
                    </button>
                  </div>
                </header>

                {loadingExchanges ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⏳</div>
                    <p>Đang tải yêu cầu…</p>
                  </div>
                ) : (
                  <div style={{ 
                    border: '1px solid rgba(15,23,42,0.1)', 
                    borderRadius: '12px', 
                    overflow: 'hidden',
                    background: 'rgba(255,255,255,0.95)'
                  }}>
                    <table style={{ width: '100%', fontSize: '14px' }}>
                      <thead style={{ background: 'rgba(15,23,42,0.05)' }}>
                        <tr>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Exchange ID</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>VIN / Xe</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Pin cũ → Pin mới</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Order</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Status</th>
                          <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exchanges
                          .filter(x => (filters.status ? x.status === filters.status : true))
                          .filter(x => {
                            const kw = filters.keyword?.trim()?.toLowerCase();
                            if (!kw) return true;
                            return (x.vin?.toLowerCase()?.includes(kw)) || (String(x.orderId || '').includes(kw));
                          })
                          .map((x) => {
                            const order = ordersMap?.[x.orderId];
                            const isReady = canComplete(x);
                            return (
                              <tr key={x.exchangeBatteryId} style={{ borderTop: '1px solid rgba(15,23,42,0.1)' }}>
                                <td style={{ padding: '12px' }}>{x.exchangeBatteryId}</td>
                                <td style={{ padding: '12px' }}>
                                  <div style={{ fontWeight: '500' }}>{x.vin || x.vehicleName}</div>
                                  <div style={{ color: '#64748b', fontSize: '12px' }}>{x.vehicleName}</div>
                                </td>
                                <td style={{ padding: '12px' }}>
                                  <div style={{ fontSize: '12px' }}>
                                    <div>Old: {x.oldBatteryName || x.oldBatteryId}</div>
                                    <div>New: {x.newBatteryName || x.newBatteryId}</div>
                                  </div>
                                </td>
                                <td style={{ padding: '12px' }}>
                                  <div>{x.orderId || '-'}</div>
                                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                                    {order ? `Order: ${order.status}` : 'Đang kiểm tra…'}
                                  </div>
                                </td>
                                <td style={{ padding: '12px' }}>
                                  <span style={{
                                    padding: '4px 8px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    background: x.status === 'Pending' 
                                      ? 'rgba(251, 191, 36, 0.2)' 
                                      : x.status === 'Completed'
                                      ? 'rgba(16, 185, 129, 0.2)'
                                      : 'rgba(239, 68, 68, 0.2)',
                                    color: x.status === 'Pending' 
                                      ? '#d97706' 
                                      : x.status === 'Completed'
                                      ? '#059669'
                                      : '#dc2626'
                                  }}>
                                    {x.status}
                                  </span>
                                </td>
                                <td style={{ padding: '12px', textAlign: 'right' }}>
                                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                    <button
                                      className="status-apply-btn"
                                      onClick={() => handleOpenReport(x)}
                                      style={{
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        background: 'rgba(15,23,42,0.1)',
                                        color: '#0f172a',
                                        border: '1px solid rgba(15,23,42,0.2)'
                                      }}
                                    >
                                      Báo cáo pin
                                    </button>
                                    <button
                                      className="status-apply-btn"
                                      disabled={!isReady}
                                      onClick={() => handleComplete(x)}
                                      title={!isReady ? 'Cần: Order Paid + Report Completed + Pin mới Available' : ''}
                                      style={{
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        background: isReady ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#e2e8f0',
                                        color: isReady ? 'white' : '#64748b',
                                        border: 'none',
                                        cursor: isReady ? 'pointer' : 'not-allowed'
                                      }}
                                    >
                                      Hoàn tất trao đổi
                                    </button>
                                    <button
                                      className="btn-danger"
                                      onClick={() => handleCancel(x)}
                                      disabled={x.status !== 'Pending'}
                                      style={{
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        background: x.status === 'Pending' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : '#e2e8f0',
                                        color: x.status === 'Pending' ? 'white' : '#64748b',
                                        border: 'none',
                                        cursor: x.status === 'Pending' ? 'pointer' : 'not-allowed'
                                      }}
                                    >
                                      Huỷ
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                    {(!exchanges || exchanges.length === 0) && (
                      <div style={{ 
                        padding: '40px', 
                        textAlign: 'center', 
                        color: '#64748b',
                        fontStyle: 'italic'
                      }}>
                        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📭</div>
                        <h4 style={{ color: '#475569', marginBottom: '8px' }}>Chưa có yêu cầu đổi pin</h4>
                        <p>Chưa có yêu cầu đổi pin tại trạm này.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </>
  );
}

export default StaffPage;