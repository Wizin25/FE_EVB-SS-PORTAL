import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { message } from 'antd';
import { authAPI } from '../services/authAPI';
import { formAPI } from '../services/formAPI';
import './Staff.css';

const ITEMS_PER_PAGE = 10;

/** Chuẩn hoá ID form */
const getFormId = (f) => f?.formId ?? f?.id ?? f?._id ?? null;

function StaffPage() {
  const [forms, setForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Drawer hồ sơ
  const [showProfile, setShowProfile] = useState(false);

  // Dropdown chọn trạng thái theo từng form
  const [statusChoice, setStatusChoice] = useState({});

  // Cache thông tin account theo CUSTOMER ID
  const [customerDetails, setCustomerDetails] = useState({});
  const [detailLoading, setDetailLoading] = useState({});

  // Cache station (key theo stationId), CHỈ lấy qua staffId
  const [stationDetails, setStationDetails] = useState({});

  // Tìm kiếm/sắp xếp
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');

  // Phân trang
  const [page, setPage] = useState(1);

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
          message.warning('Không tìm thấy station ID cho user hiện tại');
        }
      } catch {
        message.error('Lỗi khi tải thông tin người dùng');
      }
    };
    fetchCurrentUser();
  }, []);

  /* ======== API calls ======== */
  const fetchStationByStaffId = useCallback(async (staffId) => {
    if (!staffId) return;
    try {
      const data = await authAPI.getStationByStaffIdForStaff(staffId);
      if (data?.stationId) {
        setStationDetails(prev => ({
          ...prev,
          [data.stationId]: data,
        }));
      }
    } catch { /* silent */ }
  }, []);

  const fetchFormsForStation = async (stationId) => {
    try {
      setLoading(true);
      const data = await formAPI.getFormsByStationId(stationId);
      const arr = Array.isArray(data) ? data : [];
      const normalized = arr.map(f => ({ ...f, formId: f.formId ?? f.id ?? f._id ?? null }));
      setForms(normalized);
      normalized.forEach(f => { if (f.customerId) fetchAccountByCustomerId(f.customerId); });
      setStatusChoice({});
      setPage(1);
    } catch {
      message.error('Lỗi khi tải forms theo trạm');
    } finally {
      setLoading(false);
    }
  };

  /** Lấy account theo customerId bằng API /api/Account/get_account_by_customer_id_for_staff */
  const fetchAccountByCustomerId = useCallback(async (customerId) => {
    if (!customerId || customerDetails[customerId]) return;
    setDetailLoading(prev => ({ ...prev, [customerId]: true }));
    try {
      const response = await authAPI.getAccountByCustomerIdForStaff(customerId);
      const acc = response?.data ?? response;
      if (acc) setCustomerDetails(prev => ({ ...prev, [customerId]: acc }));
    } catch {
      /* silent */
    } finally {
      setDetailLoading(prev => ({ ...prev, [customerId]: false }));
    }
  }, [customerDetails]);

  /* ======== Filters / Sort ======== */
  const handleSort = (field) => {
    if (sortBy === field) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortDirection('desc'); }
  };

  const filteredAndSortedForms = useMemo(() => {
    let results = [...forms];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(form => {
        const customer = customerDetails[form.customerId];
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
    if (!formId) { message.error('Không xác định được Form ID'); return; }
    if (!status) { message.info('Hãy chọn trạng thái trước khi cập nhật'); return; }
    try {
      setLoading(true);
      await formAPI.updateFormStatusStaff({ formId, status });
      message.success(status?.toLowerCase() === 'approved' ? 'Đã duyệt form' : 'Đã từ chối form');

      const stationId =
        (Array.isArray(currentUser?.bssStaffs) && currentUser.bssStaffs.length > 0)
          ? (currentUser.bssStaffs[0]?.stationId || currentUser.bssStaffs[0]?.StationId)
          : (currentUser?.stationId || currentUser?.StationId || currentUser?.stationID);
      if (stationId) await fetchFormsForStation(stationId);
    } catch (e) {
      message.error(e?.message || 'Cập nhật trạng thái thất bại');
    } finally { setLoading(false); }
  };

  const handleDeleteForm = async (formId) => {
    if (!formId) { message.error('Không xác định được Form ID'); return; }
    if (!window.confirm('Bạn có chắc muốn xóa form này?')) return;
    try {
      setLoading(true);
      const resp = await formAPI.deleteForm(formId);
      if (resp?.isSuccess) {
        message.success('Xóa form thành công!');
        setSelectedForm(null);
        const stationId =
          (Array.isArray(currentUser?.bssStaffs) && currentUser.bssStaffs.length > 0)
            ? (currentUser.bssStaffs[0]?.stationId || currentUser.bssStaffs[0]?.StationId)
            : (currentUser?.stationId || currentUser?.StationId || currentUser?.stationID);
        if (stationId) await fetchFormsForStation(stationId);
      } else {
        message.error('Xóa form thất bại');
      }
    } catch (e) {
      message.error(e?.message || 'Xóa form thất bại');
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
    if (stationId) await fetchFormsForStation(stationId);
    else message.warning('Không tìm thấy station ID để refresh');
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
    } catch {}
    window.location.href = '/signin';
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

          <button className="action-fab" title="Thông tin 1">i</button>
          <button className="action-fab" title="Thông tin 2">i</button>
          <button className="action-fab" title="Thông tin 3">i</button>
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

        <h1 className="staff-title">Quản lý Form</h1>

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
          ) : forms.length === 0 ? (
            <div className="state-center"><p>Không có form nào</p></div>
          ) : currentForms.length === 0 ? (
            <div className="state-center"><p>Không tìm thấy form nào phù hợp với tiêu chí tìm kiếm</p></div>
          ) : (
            <>
              <div className="list-grid">
                {currentForms.map((form) => {
                  const fid = getFormId(form);
                  const customerId = form.customerId;
                  const customer = customerDetails[customerId];
                  const isCustomerLoading = detailLoading[customerId];
                  const station = stationDetails[form.stationId];
                  const currentChoice = statusChoice[fid] || '';

                  return (
                    <div key={fid ?? Math.random()} className="form-card" onClick={() => setSelectedForm(form)}>
                      <div style={{ flex: 1 }}>
                        <h3 className="form-title">{form.title}</h3>
                        <p className="form-desc">{form.description}</p>

                        <div className="form-meta">
                          {form.stationId && (
                            <span>
                              <strong>Station: </strong>
                              {station?.stationName || form.stationId}
                            </span>
                          )}
                          {form.date && <span><strong>Ngày tạo:</strong> {formatDate(form.date)}</span>}
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
                        {customerId && (
                          <div className="customer-box">
                            <h4 className="customer-title">Thông tin Customer:</h4>
                            {isCustomerLoading ? (
                              <p className="form-desc" style={{ margin: 0 }}>Đang tải thông tin...</p>
                            ) : customer ? (
                              <div className="customer-grid">
                                <div><strong>Name:</strong> {customer.name || 'N/A'}</div>
                                <div><strong>Phone:</strong> {customer.phone || 'N/A'}</div>
                                <div><strong>Email:</strong> {customer.email || 'N/A'}</div>
                                <div><strong>Address:</strong> {customer.address || 'N/A'}</div>
                                {customer.customerID && <div><strong>Customer ID:</strong> {customer.customerID}</div>}
                                {customer.username && <div><strong>Username:</strong> {customer.username}</div>}
                                {customer.status && (
                                  <div>
                                    <strong>Status:</strong>
                                    <span style={{
                                      marginLeft: 6, padding: '2px 8px', borderRadius: 12, fontSize: 12,
                                      backgroundColor: customer.status === 'Active' ? '#10b981' : '#ef4444', color: 'white'
                                    }}>
                                      {customer.status}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="form-desc" style={{ margin: 0 }}>Không tìm thấy thông tin customer</p>
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
                <pre className="modal-pre">{JSON.stringify(selectedForm, null, 2)}</pre>

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
      </div>
    </>
  );
}

export default StaffPage;
