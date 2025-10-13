import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Table, Button, Modal, Form, Input, Select, message } from 'antd';
import { authAPI } from '../services/authAPI';
import { formAPI } from '../services/formAPI';
import { isInRole } from '../services/jwt';

function StaffPage() {
  const [forms, setForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // State cho customer và station details
  const [customerDetails, setCustomerDetails] = useState({});
  const [detailLoading, setDetailLoading] = useState({});
  const [stationDetails, setStationDetails] = useState({});
  const [stationLoading, setStationLoading] = useState({});

  // State cho form tạo mới
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    stationId: ''
  });

  // State cho tìm kiếm và sắp xếp
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');

  // State cho phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Lấy thông tin user hiện tại
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = await authAPI.getCurrent();
        setCurrentUser(user);
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };
    fetchCurrentUser();
  }, []);

  // Hàm lấy thông tin customer theo accountId
  const fetchCustomerDetails = useCallback(async (accountId) => {
    if (!accountId || customerDetails[accountId]) return;

    setDetailLoading(prev => ({ ...prev, [accountId]: true }));
    
    try {
      const response = await authAPI.getCustomerById(accountId);
      if (response.isSuccess && response.data) {
        setCustomerDetails(prev => ({
          ...prev,
          [accountId]: response.data
        }));
      }
    } catch (error) {
      console.error(`Error fetching customer details for account ${accountId}:`, error);
    } finally {
      setDetailLoading(prev => ({ ...prev, [accountId]: false }));
    }
  }, [customerDetails]);

  // Hàm lấy thông tin station theo stationId
  const fetchStationDetails = useCallback(async (stationId) => {
    if (!stationId || stationDetails[stationId]) return;

    setStationLoading(prev => ({ ...prev, [stationId]: true }));
    
    try {
      const response = await authAPI.getStationByIdForAdmin(stationId);
      if (response) {
        setStationDetails(prev => ({
          ...prev,
          [stationId]: response
        }));
      }
    } catch (error) {
      console.error(`Error fetching station details for station ${stationId}:`, error);
    } finally {
      setStationLoading(prev => ({ ...prev, [stationId]: false }));
    }
  }, [stationDetails]);

  // Lấy tất cả forms
  const fetchAllForms = useCallback(async () => {
    setLoading(true);
    try {
      const response = await formAPI.getAllForms();
      if (response.isSuccess) {
        const formsData = response.data || [];
        setForms(formsData);

        // Fetch customer details cho mỗi form
        formsData.forEach(form => {
          if (form.accountId) {
            fetchCustomerDetails(form.accountId);
          }
        });

        // Fetch station details cho mỗi form
        formsData.forEach(form => {
          if (form.stationId) {
            fetchStationDetails(form.stationId);
          }
        });
      } else {
        console.error('Error fetching forms:', response.message);
        message.error('Lỗi khi tải danh sách form: ' + response.message);
      }
    } catch (error) {
      console.error('Error fetching forms:', error);
      message.error('Lỗi khi tải danh sách form');
    } finally {
      setLoading(false);
    }
  }, [fetchCustomerDetails, fetchStationDetails]);

  // Tạo form mới
  const handleCreateForm = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      message.warning('Vui lòng đăng nhập để tạo form');
      return;
    }

    setLoading(true);
    try {
      const createData = {
        ...formData,
        accountId: currentUser.accountId || currentUser.id
      };

      const response = await formAPI.createForm(createData);
      if (response.isSuccess) {
        message.success('Tạo form thành công!');
        resetForm();
        fetchAllForms();
      } else {
        message.error('Lỗi khi tạo form: ' + response.message);
      }
    } catch (error) {
      console.error('Error creating form:', error);
      message.error('Lỗi khi tạo form: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Xóa form
  const handleDeleteForm = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa form này?')) return;

    setLoading(true);
    try {
      const response = await formAPI.deleteForm(id);
      
      if (response.isSuccess) {
        message.success('Xóa form thành công!');
        setSelectedForm(null);
        fetchAllForms();
      } else {
        message.error('Lỗi khi xóa form: ' + response.message);
      }
    } catch (error) {
      console.error('Delete error:', error);
      message.error('Lỗi khi xóa form: ' + (error.message || 'Vui lòng thử lại'));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      stationId: ''
    });
  };

  const handleFormDataChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Hàm xử lý sắp xếp
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
  };

  // Lọc và sắp xếp forms
  const filteredAndSortedForms = useMemo(() => {
    let results = [...forms];

    // Tìm kiếm theo nhiều trường
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(form => {
        const customer = customerDetails[form.accountId];
        const station = stationDetails[form.stationId];
        
        // Tìm kiếm theo các trường
        const accountIdMatch = form.accountId && form.accountId.toLowerCase().includes(term);
        // const stationMatch = form.stationId && form.stationId.toLowerCase().includes(term);
        const stationNameMatch = station && station.stationName && station.stationName.toLowerCase().includes(term);
        const titleMatch = form.title && form.title.toLowerCase().includes(term);
        const descriptionMatch = form.description && form.description.toLowerCase().includes(term);
        
        // Tìm kiếm theo customer details
        const customerNameMatch = customer && customer.name && customer.name.toLowerCase().includes(term);
        const customerUserNameMatch = customer && customer.username && customer.username.toLowerCase().includes(term);
        const customerPhoneMatch = customer && customer.phone && customer.phone.toLowerCase().includes(term);
        const customerEmailMatch = customer && customer.email && customer.email.toLowerCase().includes(term);

        return accountIdMatch  || stationNameMatch || titleMatch || descriptionMatch || 
               customerNameMatch || customerUserNameMatch || customerPhoneMatch || customerEmailMatch;
      });
    }

    // Lọc theo status
    if (statusFilter !== 'All') {
      results = results.filter(form => 
        form.status && form.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Sắp xếp
    if (sortBy) {
      results.sort((a, b) => {
        let aValue = a[sortBy];
        let bValue = b[sortBy];

        if (sortBy === 'date') {
          aValue = aValue ? new Date(aValue) : new Date(0);
          bValue = bValue ? new Date(bValue) : new Date(0);
        }

        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return results;
  }, [forms, searchTerm, statusFilter, sortBy, sortDirection, customerDetails, stationDetails]);

  // Tính toán phân trang
  const totalItems = filteredAndSortedForms.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentForms = filteredAndSortedForms.slice(startIndex, endIndex);

  // Reset về trang 1 khi filters thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortBy, sortDirection]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  useEffect(() => {
    fetchAllForms();
  }, [fetchAllForms]);

  const canCreateForm = currentUser && isInRole('EvDriver');

  // Hàm format date
  const formatDate = (dateString) => {
    if (!dateString || dateString === 'N/A') return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      
      return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Ho_Chi_Minh'
      });
    } catch {
      return dateString;
    }
  };

  // Hàm xác định màu sắc cho status
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
      case 'chờ xử lý':
        return '#f59e0b';
      case 'approved':
      case 'đã duyệt':
        return '#10b981';
      case 'rejected':
      case 'từ chối':
        return '#ef4444';
      case 'completed':
      case 'hoàn thành':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  // Icon sắp xếp
  const getSortIcon = (field) => {
    if (sortBy !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  return (
    <div style={{ 
      padding: 20, 
      maxWidth: 1200, 
      margin: '0 auto',
      height: '100vh',
      overflowY: 'auto'
    }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 30 }}>Quản lý Form</h1>

      {/* Form tạo mới - Chỉ hiển thị cho EvDriver */}
      {canCreateForm && (
        <section style={{ marginBottom: 40, padding: 20, border: '1px solid #e2e8f0', borderRadius: 8 }}>
          <h2 style={{ marginBottom: 16 }}>Tạo Form Mới</h2>
          <form onSubmit={handleCreateForm} style={{ display: 'grid', gap: 16, maxWidth: 500 }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span>Tiêu đề *</span>
              <input 
                value={formData.title} 
                onChange={(e) => handleFormDataChange('title', e.target.value)}
                placeholder="Nhập tiêu đề form" 
                required
                style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }} 
              />
            </label>
            
            <label style={{ display: 'grid', gap: 6 }}>
              <span>Mô tả</span>
              <textarea 
                value={formData.description} 
                onChange={(e) => handleFormDataChange('description', e.target.value)}
                placeholder="Nhập mô tả" 
                rows={3}
                style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid #cbd5e1', resize: 'vertical' }} 
              />
            </label>
            
            <label style={{ display: 'grid', gap: 6 }}>
              <span>Ngày</span>
              <input 
                type="date"
                value={formData.date} 
                onChange={(e) => handleFormDataChange('date', e.target.value)}
                style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }} 
              />
            </label>
            
            <label style={{ display: 'grid', gap: 6 }}>
              <span>Station ID *</span>
              <input 
                value={formData.stationId} 
                onChange={(e) => handleFormDataChange('stationId', e.target.value)}
                placeholder="Nhập ID trạm" 
                required
                style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }} 
              />
            </label>
            
            <button 
              type="submit" 
              disabled={loading}
              style={{ 
                padding: '12px 16px', 
                background: '#0f172a', 
                color: 'white', 
                borderRadius: 6, 
                fontWeight: 600,
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Đang xử lý...' : 'Tạo Form'}
            </button>
          </form>
        </section>
      )}

      {/* Tìm kiếm và sắp xếp */}
      <section style={{ marginBottom: 40, padding: 20, border: '1px solid #e2e8f0', borderRadius: 8 }}>
        <h2 style={{ marginBottom: 16 }}>Tìm kiếm & Sắp xếp Form</h2>
        
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'end' }}>
          
          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: 300 }}>
            <input
              type="text"
              placeholder="Search by Username, Customer Name, Phone, Station..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 40px 10px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
            />
            <span 
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748b'
              }}
            >
              🔍
            </span>
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Filter by Status</span>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ 
                padding: '8px 12px', 
                borderRadius: '6px', 
                border: '1px solid #cbd5e1',
                fontSize: '14px'
              }}
            >
              <option value="All">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Sort Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Sort by</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select 
                value={sortBy} 
                onChange={(e) => handleSort(e.target.value)}
                style={{ 
                  padding: '8px 12px', 
                  borderRadius: '6px', 
                  border: '1px solid #cbd5e1',
                  fontSize: '14px'
                }}
              >
                <option value="date">Date</option>
                <option value="title">Title</option>
                <option value="status">Status</option>
              </select>
              
              <button 
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                style={{ 
                  padding: '8px 12px', 
                  background: '#3b82f6', 
                  color: 'white', 
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '14px',
                  cursor: 'pointer',
                  minWidth: '100px'
                }}
              >
                {sortDirection === 'asc' ? '↑ Asc' : '↓ Desc'}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginLeft: 'auto' }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Results</span>
            <div style={{ fontSize: 14, color: '#64748b' }}>
              Showing: {filteredAndSortedForms.length} / {forms.length} forms
            </div>
          </div>
        </div>
      </section>

      {/* Danh sách forms */}
      <section style={{ 
        padding: 20, 
        border: '1px solid #e2e8f0', 
        borderRadius: 8,
        maxHeight: '70vh',
        overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2>
            Danh sách Forms 
            <span style={{ fontSize: 16, fontWeight: 'normal', color: '#64748b', marginLeft: 8 }}>
              ({currentForms.length} / {filteredAndSortedForms.length} trên {forms.length} forms)
            </span>
          </h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 14, color: '#64748b' }}>
              Sắp xếp: {sortBy === 'date' ? 'Ngày' : sortBy === 'title' ? 'Tiêu đề' : 'Trạng thái'} {getSortIcon(sortBy)}
            </span>
            <button 
              onClick={fetchAllForms}
              disabled={loading}
              style={{ 
                padding: '8px 16px', 
                background: '#0f172a', 
                color: 'white', 
                borderRadius: 6,
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Đang tải...' : 'Làm mới'}
            </button>
          </div>
        </div>

        {/* Thông tin phân trang */}
        {totalItems > 0 && (
          <div style={{ marginBottom: 16, padding: '12px 16px', background: '#f8fafc', borderRadius: 6 }}>
            <span style={{ fontSize: 14, color: '#64748b' }}>
              Trang {currentPage}/{totalPages} - Hiển thị {startIndex + 1}-{Math.min(endIndex, totalItems)} trên {totalItems} forms
            </span>
          </div>
        )}
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : forms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
            <p>Không có form nào</p>
          </div>
        ) : currentForms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
            <p>Không tìm thấy form nào phù hợp với tiêu chí tìm kiếm</p>
          </div>
        ) : (
          <>
            <div style={{ 
              display: 'grid', 
              gap: 12,
              maxHeight: '50vh',
              overflowY: 'auto',
              paddingRight: 8
            }}>
              {currentForms.map((form) => {
                const customer = customerDetails[form.accountId];
                const station = stationDetails[form.stationId];
                const isCustomerLoading = detailLoading[form.accountId];
                const isStationLoading = stationLoading[form.stationId];
                
                return (
                  <div 
                    key={form.id} 
                    style={{ 
                      padding: 16, 
                      border: '1px solid #e2e8f0', 
                      borderRadius: 8,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      background: 'white',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedForm(form)}
                  >
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 600 }}>{form.title}</h3>
                      <p style={{ margin: '4px 0', color: '#64748b' }}>{form.description}</p>
                      
                      {/* Thông tin Form cơ bản */}
                      <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 14, flexWrap: 'wrap' }}>
                        {form.stationId && (
                          <span>
                            <strong>Station: </strong> 
                            {isStationLoading ? (
                              'Đang tải...'
                            ) : station ? (
                              `${station.stationName || 'N/A'}`
                            ) : (
                              form.stationId
                            )}
                          </span>
                        )}
                        {form.date && (
                          <span>
                            <strong>Ngày tạo:</strong> {formatDate(form.date)}
                          </span>
                        )}
                      </div>

                      {/* Thông tin Customer chi tiết */}
                      {form.accountId && (
                        <div style={{ marginTop: 12, padding: 12, background: '#f8fafc', borderRadius: 6 }}>
                          <h4 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 600 }}>Thông tin Customer:</h4>
                          {isCustomerLoading ? (
                            <p style={{ margin: 0, fontSize: 14, color: '#64748b' }}>Đang tải thông tin...</p>
                          ) : customer ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, fontSize: 14 }}>
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
                                    marginLeft: 6,
                                    padding: '2px 8px', 
                                    borderRadius: 12, 
                                    fontSize: 12,
                                    backgroundColor: customer.status === 'Active' ? '#10b981' : '#ef4444',
                                    color: 'white'
                                  }}>
                                    {customer.status}
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p style={{ margin: 0, fontSize: 14, color: '#64748b' }}>
                              Không tìm thấy thông tin customer
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexDirection: 'column' }}>
                      {/* Status */}
                      <span 
                        style={{ 
                          padding: '6px 12px', 
                          borderRadius: 20, 
                          fontSize: 12, 
                          fontWeight: 600,
                          backgroundColor: getStatusColor(form.status),
                          color: 'white',
                          textTransform: 'capitalize'
                        }}
                      >
                        {form.status || 'Chưa xác định'}
                      </span>
                      
                      {/* Nút Xóa */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteForm(form.id);
                        }}
                        style={{ 
                          padding: '6px 12px', 
                          background: '#ef4444', 
                          color: 'white', 
                          borderRadius: 6,
                          fontSize: 12
                        }}
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Phân trang */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 20 }}>
                <button 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{ 
                    padding: '8px 12px', 
                    background: currentPage === 1 ? '#cbd5e1' : '#3b82f6', 
                    color: 'white', 
                    borderRadius: 6,
                    border: 'none',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  ← Trước
                </button>
                
                <div style={{ display: 'flex', gap: 4 }}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      style={{ 
                        padding: '8px 12px', 
                        background: page === currentPage ? '#0f172a' : '#e2e8f0', 
                        color: page === currentPage ? 'white' : '#64748b', 
                        borderRadius: 6,
                        border: 'none',
                        cursor: 'pointer',
                        minWidth: 40
                      }}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{ 
                    padding: '8px 12px', 
                    background: currentPage === totalPages ? '#cbd5e1' : '#3b82f6', 
                    color: 'white', 
                    borderRadius: 6,
                    border: 'none',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                  }}
                >
                  Sau →
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Modal chi tiết form */}
      {selectedForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          overflowY: 'auto'
        }}>
          <div style={{
            background: 'white',
            padding: 20,
            borderRadius: 8,
            maxWidth: 600,
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            margin: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2>Form Chi Tiết</h2>
              <button 
                onClick={() => setSelectedForm(null)}
                style={{ padding: '6px 12px', background: '#6b7280', color: 'white', borderRadius: 6 }}
              >
                Đóng
              </button>
            </div>
            <div style={{ 
              padding: 16, 
              background: '#f8fafc', 
              borderRadius: 6,
              maxHeight: '60vh',
              overflowY: 'auto'
            }}>
              <pre style={{ 
                whiteSpace: 'pre-wrap', 
                fontSize: 14,
                margin: 0,
                wordBreak: 'break-word'
              }}>
                {JSON.stringify(selectedForm, null, 2)}
              </pre>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button 
                  onClick={() => {
                    handleDeleteForm(selectedForm.id);
                    setSelectedForm(null);
                  }}
                  style={{ padding: '8px 16px', background: '#ef4444', color: 'white', borderRadius: 6 }}
                >
                  Xóa Form
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StaffPage;
