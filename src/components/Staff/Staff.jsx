import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { message } from 'antd';
import { authAPI } from '../services/authAPI';
import { formAPI } from '../services/formAPI';
import './Staff.css';

const ITEMS_PER_PAGE = 10;

const DEFAULT_VIEW_KEY = 'forms';

const VIEW_NAV = [
  { key: 'forms', label: 'Quan ly Form', icon: '📋' },
  { key: 'station-schedule', label: 'Station Schedule', icon: '📅' },
  { key: 'battery-report', label: 'Battery Report', icon: '📝' },
];

const VIEW_CONFIG = VIEW_NAV.reduce((acc, item) => {
  acc[item.key] = item;
  return acc;
}, {});

/** Chuẩn hoá ID form */
const getFormId = (f) => f?.formId ?? f?.id ?? f?._id ?? null;

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
  const [sortBy, setSortBy] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');

  // Phân trang
  const [page, setPage] = useState(1);

  // State for battery report form pre-population
  const [batteryReportDefaults, setBatteryReportDefaults] = useState({});

  const activeViewKey = VIEW_CONFIG[viewMode] ? viewMode : DEFAULT_VIEW_KEY;
  const activeView = VIEW_CONFIG[activeViewKey];
  const isFormsView = activeViewKey === 'forms';
  const isStationScheduleView = activeViewKey === 'station-schedule';
  const isBatteryReportView = activeViewKey === 'battery-report';
  const pageTitle = activeView?.label || VIEW_CONFIG[DEFAULT_VIEW_KEY].label;

  const handleSwitchView = useCallback((nextView) => {
    const safeView = VIEW_CONFIG[nextView] ? nextView : DEFAULT_VIEW_KEY;
    setSelectedForm(null);
    setViewMode(safeView);
    if (safeView === DEFAULT_VIEW_KEY) {
      setPage(1);
    }
  }, [setViewMode, setSelectedForm, setPage]);

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

  /* ======== Init: current user + prefetch station by staffId + forms by station ======== */
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        toast.loading('Đang tải thông tin người dùng...', 0.5);
        const user = await authAPI.getCurrent();
        setCurrentUser(user);
        toast.success('Tải thông tin người dùng thành công!');

        // Prefetch station theo staffId để có stationName (Sxxx) -> cache theo stationId
        const staffIds = Array.isArray(user?.bssStaffs)
          ? user.bssStaffs.map(s => s?.staffId).filter(Boolean)
          : [];
        
        if (staffIds.length > 0) {
          toast.loading('Đang tải thông tin trạm...', 0.5);
        }
        staffIds.forEach(fetchStationByStaffId);

        // Lấy stationId để load forms
        let stationId = user?.stationId || user?.StationId || user?.stationID;
        if (!stationId && Array.isArray(user?.bssStaffs) && user.bssStaffs.length > 0) {
          stationId = user.bssStaffs[0]?.stationId || user.bssStaffs[0]?.StationId;
        }

        if (stationId) {
          toast.loading('Đang tải danh sách form...', 1);
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
        toast.success(`Tải thông tin trạm ${stationName} thành công!`);
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

  const fetchFormsForStation = async (stationId) => {
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
        toast.loading('Đang tải thông tin khách hàng...', 1);
        await Promise.allSettled(customerPromises);
      }
      
      if (batteryPromises.length > 0) {
        toast.loading('Đang tải thông tin pin...', 1);
        await Promise.allSettled(batteryPromises);
      }

      setStatusChoice({});
      setPage(1);
      toast.success(`Tải thành công ${normalized.length} form từ trạm ${stationId}`);
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
        toast.success(`Tải thông tin pin ${batteryId} thành công!`);
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
        toast.success(`Tải thông tin khách hàng ${customerInfo.name || accountId} thành công!`);
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
          await fetchFormsForStation(stationId);
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
          await fetchFormsForStation(stationId);
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

  const handleRefresh = async () => {
    const stationId =
      (Array.isArray(currentUser?.bssStaffs) && currentUser.bssStaffs.length > 0)
        ? (currentUser.bssStaffs[0]?.stationId || currentUser.bssStaffs[0]?.StationId)
        : (currentUser?.stationId || currentUser?.StationId || currentUser?.stationID);
    
    if (stationId) {
      toast.loading('Đang làm mới dữ liệu...', 1);
      await fetchFormsForStation(stationId);
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
              // icon user, có thể thay bằng svg hoặc chữ viết tắt
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
          <div className="profile-drawer-content">
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
        <section className="filters glass">
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
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Filter by Status</div>
              <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="All">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Sort by</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select className="select" value={sortBy} onChange={(e) => handleSort(e.target.value)}>
                  <option value="date">Date</option>
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

        {/* List (GLASS) */}
        <section className="list-wrap glass">
          <div className="list-header">
            <h2>
              Danh sách Forms
              <span className="list-title-sub">({currentForms.length} / {filteredAndSortedForms.length} trên {forms.length} forms)</span>
            </h2>
            <div>
              <button className="btn-refresh" onClick={handleRefresh} disabled={loading}>
                {loading ? 'Đang tải...' : 'Làm mới'}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="state-center"><p>Đang tải dữ liệu...</p></div>
          ) : forms.filter(f => (f?.status?.toLowerCase?.() ?? '') !== 'deleted').length === 0 ? (
            <div className="state-center"><p>Không có form nào</p></div>
          ) : currentForms.length === 0 ? (
            <div className="state-center"><p>Không tìm thấy form nào phù hợp với tiêu chí tìm kiếm</p></div>
          ) : (
            <>
              <div className="list-grid">
                {currentForms.map((form) => {
                  const fid = getFormId(form);
                  const accountId = form.accountId;
                  const customer = customerDetails[accountId];
                  const isCustomerLoading = detailLoading[accountId];
                  const stationName =   stationDetails.byStationId?.[form.stationId] || '—';
                  const currentChoice = statusChoice[fid] || '';

                  return (
                    <div key={fid ?? Math.random()} className="form-card" onClick={() => setSelectedForm(form)}>
                      <div style={{ flex: 1 }}>
                        <h3 className="form-title">{form.title}</h3>
                        <p className="form-desc">{form.description}</p>

                        <div className="form-meta">
                          <span>
                            <strong>Station: </strong>
                            {stationName}
                          </span>
                          {form.date && <span><strong>Ngày tạo:</strong> {formatDate(form.date)}</span>}
                          {form.batteryId && <span><strong>Battery ID:</strong> {form.batteryId}</span>}
                        </div>

                        {/* Dropdown đổi trạng thái */}
                        <div className="status-inline" onClick={(e) => e.stopPropagation()}>
                          <select
                            className="status-select"
                            value={currentChoice}
                            onChange={(e) => setStatusChoice(prev => ({ ...prev, [fid]: e.target.value }))}
                          >
                            <option value="">-- Chọn trạng thái --</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                          <button
                            className="status-apply-btn"
                            disabled={!currentChoice || loading}
                            onClick={() => handleUpdateStatus(fid, currentChoice)}
                          >
                            Cập nhật
                          </button>
                        </div>

                        {/* Customer */}
                        {accountId && (
                          <div className="customer-box">
                            <h4 className="customer-title">📋 Thông tin Khách hàng:</h4>
                            {isCustomerLoading ? (
                              <div className="customer-loading">
                                <span>⏳ Đang tải thông tin khách hàng...</span>
                              </div>
                            ) : customer ? (
                              <div className="customer-info">
                                <div className="customer-row">
                                  <span className="customer-label">👤 Tên: </span>
                                  <span className="customer-value">{customer.name || customer.Name || 'Chưa có thông tin'}</span>
                                </div>
                                <div className="customer-row">
                                  <span className="customer-label">📞 Số điện thoại: </span>
                                  <span className="customer-value">{customer.phone || customer.Phone || 'Chưa có thông tin'}</span>
                                </div>
                                <div className="customer-row">
                                  <span className="customer-label">📧 Email: </span>
                                  <span className="customer-value">{customer.email || customer.Email || 'Chưa có thông tin'}</span>
                                </div>
                                <div className="customer-row">
                                  <span className="customer-label">🏠 Địa chỉ: </span>
                                  <span className="customer-value">{customer.address || customer.Address || 'Chưa có thông tin'}</span>
                                </div>
                                <div className="customer-row">
                                  <span className="customer-label">🆔 Account ID: </span>
                                  <span className="customer-value">{accountId}</span>
                                </div>
                                {customer.customerID && (
                                  <div className="customer-row">
                                    <span className="customer-label">👥 Customer ID: </span>
                                    <span className="customer-value">{customer.customerID}</span>
                                  </div>
                                )}
                                {customer.username && (
                                  <div className="customer-row">
                                    <span className="customer-label">🔑 Username: </span>
                                    <span className="customer-value">{customer.username}</span>
                                  </div>
                                )}
                                {customer.status && (
                                  <div className="customer-row">
                                    <span className="customer-label">📊 Trạng thái: </span>
                                    <span className={`customer-status ${customer.status === 'Active' ? 'active' : 'inactive'}`}>
                                      {customer.status}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="customer-error">
                                <span>❌ Không tìm thấy thông tin khách hàng</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexDirection: 'column' }}>
                        <span className={getStatusClass(form.status)}>{form.status || 'Chưa xác định'}</span>
                        <button
                          className="btn-danger"
                          onClick={(e) => { e.stopPropagation(); handleDeleteForm(fid); }}
                        >
                          Xóa
                        </button>
                        <button
                          className="status-apply-btn"
                          onClick={(e) => { e.stopPropagation(); handleBatteryReport(form); }}
                          style={{ fontSize: '12px', padding: '6px 12px' }}
                        >
                          Báo cáo pin
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 20 }}>
                  <button onClick={() => handlePageChange(page - 1)} disabled={page === 1}
                          className="btn-sortdir" style={{ background: page === 1 ? '#cbd5e1' : '#0f172a', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>
                    ← Trước
                  </button>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button key={p}
                              onClick={() => handlePageChange(p)}
                              className="select"
                              style={{ padding: '8px 12px', background: p === page ? '#0f172a' : 'rgba(255,255,255,0.7)', color: p === page ? 'white' : '#334155', border: '1px solid rgba(15,23,42,0.1)', cursor: 'pointer', minWidth: 40, borderRadius: 10 }}>
                        {p}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => handlePageChange(page + 1)} disabled={page === totalPages}
                          className="btn-sortdir" style={{ background: page === totalPages ? '#cbd5e1' : '#0f172a', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}>
                    Sau →
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* Modal chi tiết (GLASS) */}
        {selectedForm && (
          <div className="modal-root">
            <div className="modal-card glass">
              <div className="modal-head">
                <h2>Form Chi Tiết</h2>
                <button className="btn-close" onClick={() => setSelectedForm(null)}>Đóng</button>
              
              </div>
              <div className="modal-body glass">
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
                            // Format percent for 'capacity' and 'batteryQuality'
                            let displayValue = value;
                            if (
                              value !== undefined &&
                              value !== null &&
                              isPercent
                            ) {
                              // Interpret numeric value or string number as percent
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
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
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
        </>
        )}

        {isStationScheduleView && (
          <section className="glass" style={{ marginTop: 24, padding: 24, borderRadius: 24 }}>
            <h2 className="filters-title">Station Schedule</h2>
            <p style={{ marginTop: 4, color: 'rgba(15,23,42,0.7)' }}>
              Danh sách được tự động tổng hợp từ thông tin bssStaffs và station cache.
            </p>
            {stationAssignments.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginTop: 20 }}>
                {stationAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    style={{
                      padding: 16,
                      borderRadius: 18,
                      background: 'rgba(255,255,255,0.75)',
                      border: '1px solid rgba(15,23,42,0.08)',
                      boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#0f172a' }}>
                      {assignment.stationName || 'Station'}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155', fontSize: 14 }}>
                      <span>Station ID</span>
                      <span>{assignment.stationId || 'N/A'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155', fontSize: 14 }}>
                      <span>Staff ID</span>
                      <span>{assignment.staffId || 'N/A'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155', fontSize: 14 }}>
                      <span>Role</span>
                      <span>{assignment.role || 'Staff'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ marginTop: 24, padding: 24, textAlign: 'center', background: 'rgba(15,23,42,0.05)', borderRadius: 16, color: '#475569' }}>
                Chưa có dữ liệu lịch trực cho trạm của bạn.
              </div>
            )}
          </section>
        )}

        {isBatteryReportView && (
          <section className="glass" style={{ marginTop: 24, padding: 24, borderRadius: 24 }}>
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
      </div>
    </>
  );
}

export default StaffPage;
