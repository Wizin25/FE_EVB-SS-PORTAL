// Form.jsx
import { useState, useEffect, useMemo } from 'react';
import { authAPI } from '../../services/authAPI';
import { formAPI } from '../../services/formAPI';
import { getCurrentUserPayload, isInRole } from '../../services/jwt';

export default function FormPage() {
  const [forms, setForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Thêm state mới cho customer details
  const [customerDetails, setCustomerDetails] = useState({});
  const [detailLoading, setDetailLoading] = useState({});

  // State cho form tạo mới
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    stationId: ''
  });

  // State cho tìm kiếm và sắp xếp
  const [searchAccountId, setSearchAccountId] = useState('');
  const [searchStation, setSearchStation] = useState('');
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
  const fetchCustomerDetails = async (accountId, formId) => {
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
  };

  // Lấy tất cả forms
  const fetchAllForms = async () => {
    setLoading(true);
    try {
      const response = await formAPI.getAllForms();
      if (response.isSuccess) {
        const formsData = response.data || [];
        setForms(formsData);

        // Fetch customer details cho mỗi form
        formsData.forEach(form => {
          if (form.accountId) {
            fetchCustomerDetails(form.accountId, form.id);
          }
        });
      } else {
        console.error('Error fetching forms:', response.message);
        alert('Lỗi khi tải danh sách form: ' + response.message);
      }
    } catch (error) {
      console.error('Error fetching forms:', error);
      alert('Lỗi khi tải danh sách form');
    } finally {
      setLoading(false);
    }
  };

  // Tạo form mới
  const handleCreateForm = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      alert('Vui lòng đăng nhập để tạo form');
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
        alert('Tạo form thành công!');
        resetForm();
        fetchAllForms();
      } else {
        alert('Lỗi khi tạo form: ' + response.message);
      }
    } catch (error) {
      console.error('Error creating form:', error);
      alert('Lỗi khi tạo form: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Xóa form
  const handleDeleteForm = async (id) => {
    console.log('Attempting to delete form ID:', id);
    
    if (!window.confirm('Bạn có chắc muốn xóa form này?')) return;

    setLoading(true);
    try {
      console.log('Calling deleteForm API...');
      const response = await formAPI.deleteForm(id);
      console.log('Delete response:', response);
      
      if (response.isSuccess) {
        console.log('Delete successful');
        alert('Xóa form thành công!');
        setSelectedForm(null);
        fetchAllForms();
      } else {
        console.log('Delete failed:', response.message);
        alert('Lỗi khi xóa form: ' + response.message);
      }
    } catch (error) {
      console.error('Delete error details:', {
        error,
        response: error.response,
        data: error.response?.data
      });
      alert('Lỗi khi xóa form: ' + (error.message || 'Vui lòng thử lại'));
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

    // Tìm kiếm theo AccountID
    if (searchAccountId) {
      const accountIdLower = searchAccountId.toLowerCase();
      results = results.filter(form => 
        form.accountId && form.accountId.toLowerCase().includes(accountIdLower)
      );
    }

    // Tìm kiếm theo Station Name hoặc Station ID
    if (searchStation) {
      const stationLower = searchStation.toLowerCase();
      results = results.filter(form => 
        (form.stationId && form.stationId.toLowerCase().includes(stationLower)) ||
        (form.stationName && form.stationName.toLowerCase().includes(stationLower))
      );
    }

    // Sắp xếp
    if (sortBy) {
      results.sort((a, b) => {
        let aValue = a[sortBy];
        let bValue = b[sortBy];

        // Xử lý sắp xếp theo date
        if (sortBy === 'date') {
          aValue = aValue ? new Date(aValue) : new Date(0);
          bValue = bValue ? new Date(bValue) : new Date(0);
        }

        // Xử lý các trường string
        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return results;
  }, [forms, searchAccountId, searchStation, sortBy, sortDirection]);

  // Tính toán phân trang
  const totalItems = filteredAndSortedForms.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentForms = filteredAndSortedForms.slice(startIndex, endIndex);

  // Reset về trang 1 khi filters thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [searchAccountId, searchStation, sortBy, sortDirection]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  useEffect(() => {
    fetchAllForms();
  }, []);

  const canCreateForm = currentUser && isInRole('EvDriver');

  // Hàm format date giống Controller.jsx
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
        return '#f59e0b'; // orange
      case 'approved':
      case 'đã duyệt':
        return '#10b981'; // green
      case 'rejected':
      case 'từ chối':
        return '#ef4444'; // red
      case 'completed':
      case 'hoàn thành':
        return '#3b82f6'; // blue
      default:
        return '#6b7280'; // gray
    }
  };

  // Icon sắp xếp
  const getSortIcon = (field) => {
    if (sortBy !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
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
          
          {/* Tìm kiếm theo Account ID */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 200 }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Tìm theo Account</span>
            <input
              placeholder="Nhập Account ..."
              value={searchAccountId}
              onChange={(e) => setSearchAccountId(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}
            />
          </div>

          {/* Tìm kiếm theo Station */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 200 }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Tìm theo Station</span>
            <input
              placeholder="Nhập Station ..."
              value={searchStation}
              onChange={(e) => setSearchStation(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}
            />
          </div>

          {/* Sắp xếp */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Sắp xếp theo</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select 
                value={sortBy} 
                onChange={(e) => handleSort(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}
              >
                <option value="date">Ngày tạo</option>
                <option value="title">Tiêu đề</option>
                <option value="status">Trạng thái</option>
              </select>
              <button 
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                style={{ 
                  padding: '8px 12px', 
                  background: '#3b82f6', 
                  color: 'white', 
                  borderRadius: 6,
                  minWidth: 100
                }}
              >
                {sortDirection === 'asc' ? '↑ Tăng dần' : '↓ Giảm dần'}
              </button>
            </div>
          </div>

          {/* Thống kê */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginLeft: 'auto' }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Kết quả</span>
            <div style={{ fontSize: 14, color: '#64748b' }}>
              Hiển thị: {filteredAndSortedForms.length} / {forms.length} forms
            </div>
          </div>
        </div>
      </section>

      {/* Hiển thị form chi tiết */}
      {selectedForm && (
        <section style={{ marginBottom: 40, padding: 20, border: '1px solid #e2e8f0', borderRadius: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2>Form Chi Tiết</h2>
            <button 
              onClick={() => setSelectedForm(null)}
              style={{ padding: '6px 12px', background: '#6b7280', color: 'white', borderRadius: 6 }}
            >
              Đóng
            </button>
          </div>
          <div style={{ padding: 16, background: '#f8fafc', borderRadius: 6 }}>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: 14 }}>
              {JSON.stringify(selectedForm, null, 2)}
            </pre>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button 
                onClick={() => handleDeleteForm(selectedForm.id)}
                style={{ padding: '8px 16px', background: '#ef4444', color: 'white', borderRadius: 6 }}
              >
                Xóa Form
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Danh sách forms - ĐÃ CẬP NHẬT VỚI PHÂN TRANG */}
      <section style={{ padding: 20, border: '1px solid #e2e8f0', borderRadius: 8 }}>
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
            <div style={{ display: 'grid', gap: 12 }}>
              {currentForms.map((form) => {
                const customer = customerDetails[form.accountId];
                const isLoading = detailLoading[form.accountId];
                
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
                      background: 'white'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 600 }}>{form.title}</h3>
                      <p style={{ margin: '4px 0', color: '#64748b' }}>{form.description}</p>
                      
                      {/* Thông tin Form cơ bản */}
                      <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 14, flexWrap: 'wrap' }}>
                        <span><strong>ID:</strong> {form.id}</span>
                        {form.accountId && <span><strong>Account ID:</strong> {form.accountId}</span>}
                        {form.stationId && <span><strong>Station ID:</strong> {form.stationId}</span>}
                        {form.date && (
                          <span>
                            <strong>Ngày tạo:</strong> {formatDate(form.date)}
                          </span>
                        )}
                      </div>

                      {/* Thông tin Customer chi tiết - GIỐNG CONTROLLER.JSX */}
                      {form.accountId && (
                        <div style={{ marginTop: 12, padding: 12, background: '#f8fafc', borderRadius: 6 }}>
                          <h4 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 600 }}>Thông tin Customer:</h4>
                          {isLoading ? (
                            <p style={{ margin: 0, fontSize: 14, color: '#64748b' }}>Đang tải thông tin...</p>
                          ) : customer ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, fontSize: 14 }}>
                              <div>
                                <strong>Name:</strong> {customer.name || 'N/A'}
                              </div>
                              <div>
                                <strong>Phone:</strong> {customer.phone || 'N/A'}
                              </div>
                              <div>
                                <strong>Email:</strong> {customer.email || 'N/A'}
                              </div>
                              <div>
                                <strong>Address:</strong> {customer.address || 'N/A'}
                              </div>
                              {customer.customerID && (
                                <div>
                                  <strong>Customer ID:</strong> {customer.customerID}
                                </div>
                              )}
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
                        onClick={() => handleDeleteForm(form.id)}
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
    </div>
  );
}