import { useState, useEffect, useMemo } from 'react';
import { authAPI } from '../../services/authAPI';
import { formAPI } from '../../services/formAPI';
import { isInRole } from '../../services/jwt';

export default function FormPage() {
  const [forms, setForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [customerDetails, setCustomerDetails] = useState({});
  const [detailLoading, setDetailLoading] = useState({});
  const [stationDetails, setStationDetails] = useState({});
  const [stationLoading, setStationLoading] = useState({});

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    stationId: ''
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [stationFilter, setStationFilter] = useState('All');
  const [stations, setStations] = useState([]);
  const [sortBy, setSortBy] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const fetchStationDetails = async (stationId, formId) => {
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
  };

  const fetchAllForms = async () => {
    setLoading(true);
    try {
      const response = await formAPI.getAllForms();
      if (response.isSuccess) {
        const formsData = response.data || [];
        setForms(formsData);
        formsData.forEach(form => {
          if (form.accountId) fetchCustomerDetails(form.accountId, form.id);
          if (form.stationId) fetchStationDetails(form.stationId, form.id);
        });
      } else {
        alert('Lỗi khi tải danh sách form: ' + response.message);
      }
    } catch (error) {
      console.error('Error fetching forms:', error);
      alert('Lỗi khi tải danh sách form');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllStations = async () => {
    try {
      const response = await authAPI.getAllStations();
      if (response && Array.isArray(response)) {
        setStations(response);
      }
    } catch (error) {
      console.error('Error fetching stations:', error);
    }
  };

  const handleCreateForm = async () => {
    if (!currentUser) {
      alert('Vui lòng đăng nhập để tạo form');
      return;
    }
    if (!formData.title || !formData.stationId) {
      alert('Vui lòng nhập đầy đủ thông tin bắt buộc');
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

  const handleDeleteForm = async (form) => {
    const formId = form.id || form.formId || form.FormId;
    if (!formId) {
      alert('Không tìm thấy ID của form để xóa');
      return;
    }
    if (!window.confirm('Bạn có chắc muốn xóa form này?')) return;
    setLoading(true);
    try {
      const response = await formAPI.deleteForm(formId);
      if (response.isSuccess) {
        alert('Xóa form thành công!');
        setSelectedForm(null);
        fetchAllForms();
      } else {
        alert('Lỗi khi xóa form: ' + response.message);
      }
    } catch (error) {
      console.error('Delete error details:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Vui lòng thử lại';
      alert('Lỗi khi xóa form: ' + errorMessage);
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
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
  };

  const filteredAndSortedForms = useMemo(() => {
    let results = [...forms];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(form => {
        const customer = customerDetails[form.accountId];
        const station = stationDetails[form.stationId];
        return (
          (form.accountId && form.accountId.toLowerCase().includes(term)) ||
          (form.stationId && form.stationId.toLowerCase().includes(term)) ||
          (station && station.stationName && station.stationName.toLowerCase().includes(term)) ||
          (form.title && form.title.toLowerCase().includes(term)) ||
          (form.description && form.description.toLowerCase().includes(term)) ||
          (customer && customer.name && customer.name.toLowerCase().includes(term)) ||
          (customer && customer.username && customer.username.toLowerCase().includes(term)) ||
          (customer && customer.phone && customer.phone.toLowerCase().includes(term)) ||
          (customer && customer.email && customer.email.toLowerCase().includes(term))
        );
      });
    }
    if (statusFilter !== 'All') {
      results = results.filter(form => 
        form.status && form.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }
    if (stationFilter !== 'All') {
      results = results.filter(form => form.stationId === stationFilter);
    }
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
  }, [forms, searchTerm, statusFilter, stationFilter, sortBy, sortDirection, customerDetails, stationDetails]);

  const totalItems = filteredAndSortedForms.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentForms = filteredAndSortedForms.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, stationFilter, sortBy, sortDirection]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  useEffect(() => {
    fetchAllForms();
    fetchAllStations();
  }, []);

  const canCreateForm = currentUser && isInRole('EvDriver');

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

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
      case 'submitted':
        return 'bg-orange-500';
      case 'approved':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      case 'deleted':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const getFormId = (form) => {
    return form.id || form.formId || form.FormId || 'N/A';
  };

  return (
    <div className="mx-auto space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white dark:text-white">📋 Quản lý Form</h1>
        <button 
          onClick={fetchAllForms}
          disabled={loading}
          className="px-4 py-2 font-semibold text-white transition-all transform rounded-lg shadow-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 hover:scale-105"
        >
          {loading ? '🔄 Đang tải...' : '🔄 Làm mới'}
        </button>
      </div>

      {canCreateForm && (
        <div className="p-6 border border-orange-200 shadow-xl bg-gradient-to-br from-white to-orange-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl dark:border-gray-700">
          <h2 className="flex items-center gap-2 mb-4 text-xl font-bold text-gray-900 dark:text-white">
            ✨ Tạo Form Mới
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Tiêu đề *
              </label>
              <input 
                value={formData.title} 
                onChange={(e) => handleFormDataChange('title', e.target.value)}
                placeholder="Nhập tiêu đề form" 
                className="w-full px-4 py-3 text-gray-900 transition-all bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Station ID *
              </label>
              <input 
                value={formData.stationId} 
                onChange={(e) => handleFormDataChange('stationId', e.target.value)}
                placeholder="Nhập ID trạm" 
                className="w-full px-4 py-3 text-gray-900 transition-all bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Mô tả
              </label>
              <textarea 
                value={formData.description} 
                onChange={(e) => handleFormDataChange('description', e.target.value)}
                placeholder="Nhập mô tả" 
                rows={3}
                className="w-full px-4 py-3 text-gray-900 transition-all bg-white border border-gray-300 rounded-lg resize-none dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Ngày đăng ký đổi pin
              </label>
              <input 
                type="date"
                value={formData.date} 
                onChange={(e) => handleFormDataChange('date', e.target.value)}
                className="w-full px-4 py-3 text-gray-900 transition-all bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-end">
              <button 
                onClick={handleCreateForm}
                disabled={loading}
                className="w-full px-6 py-3 font-semibold text-white transition-all transform rounded-lg shadow-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 hover:scale-105"
              >
                {loading ? '⏳ Đang xử lý...' : '✅ Tạo Form'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 bg-white border border-gray-200 shadow-xl dark:bg-gray-800 rounded-2xl dark:border-gray-700">
        <h2 className="flex items-center gap-2 mb-4 text-xl font-bold text-gray-900 dark:text-white">
          🔍 Tìm kiếm & Lọc
        </h2>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-2 lg:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Tìm kiếm
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm theo Username, Customer, Phone, Station..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pl-10 text-gray-900 transition-all bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <span className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2">
                🔍
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Lọc theo Status
            </label>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 text-gray-900 transition-all bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="All">📊 Tất cả</option>
              <option value="submitted">✅ Submitted</option>
              <option value="approved">✅ Approved</option>
              <option value="rejected">❌ Rejected</option>
              <option value="deleted">🗑️ Deleted</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Lọc theo Station
            </label>
            <select 
              value={stationFilter} 
              onChange={(e) => setStationFilter(e.target.value)}
              className="w-full px-4 py-3 text-gray-900 transition-all bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="All">🏢 Tất cả Trạm</option>
              {stations.map((station) => (
                <option key={station.stationId} value={station.stationId}>
                  {station.stationName || station.stationId}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Sắp xếp theo
            </label>
            <div className="flex gap-2">
              <select 
                value={sortBy} 
                onChange={(e) => handleSort(e.target.value)}
                className="flex-1 px-4 py-3 text-gray-900 transition-all bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="date">📅 Ngày</option>
                <option value="title">📝 Tiêu đề</option>
                <option value="status">📊 Status</option>
              </select>
              <button 
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                className="px-4 py-3 font-semibold text-white transition-all transform bg-blue-500 rounded-lg shadow-md hover:bg-blue-600 hover:scale-105"
              >
                {sortDirection === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 mt-4 rounded-lg bg-gradient-to-r from-orange-50 to-orange-100 dark:from-gray-700 dark:to-gray-600">
          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            📈 Kết quả: <span className="text-orange-600 dark:text-orange-400">{filteredAndSortedForms.length}</span> / {forms.length} forms
          </div>
          {totalPages > 0 && (
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              📄 Trang {currentPage}/{totalPages}
            </div>
          )}
        </div>
      </div>

      <div className="p-6 bg-white border border-gray-200 shadow-xl dark:bg-gray-800 rounded-2xl dark:border-gray-700">
        <h2 className="flex items-center gap-2 mb-6 text-xl font-bold text-gray-900 dark:text-white">
          📑 Danh sách Forms
          <span className="text-sm font-normal text-gray-500">
            ({currentForms.length} forms)
          </span>
        </h2>
        
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block w-12 h-12 border-4 border-orange-500 rounded-full animate-spin border-t-transparent"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Đang tải dữ liệu...</p>
          </div>
        ) : currentForms.length === 0 ? (
          <div className="py-20 text-center">
            <p className="mb-4 text-4xl">📭</p>
            <p className="text-gray-600 dark:text-gray-400">
              {forms.length === 0 ? 'Không có form nào' : 'Không tìm thấy form phù hợp'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {currentForms.map((form) => {
              const customer = customerDetails[form.accountId];
              const station = stationDetails[form.stationId];
              const isCustomerLoading = detailLoading[form.accountId];
              const isStationLoading = stationLoading[form.stationId];
              const formId = getFormId(form);
              
              const isDeleteDisabled = form.status?.toLowerCase() === 'deleted';
              
              return (
                <div 
                  key={formId} 
                  className="p-6 transition-all duration-300 transform border border-gray-200 bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 rounded-xl dark:border-gray-600 hover:shadow-2xl hover:-translate-y-1"
                >
                  <div className="flex flex-col gap-6 lg:flex-row">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                        <h3 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                          📝 {form.title}
                        </h3>
                        <span className={`${getStatusColor(form.status)} text-white px-4 py-1 rounded-full text-xs font-bold uppercase shadow-md`}>
                          {form.status || 'N/A'}
                        </span>
                      </div>
                      
                      {form.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {form.description}
                        </p>
                      )}
                      
                      {/* Form Details - Compact */}
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 dark:text-gray-400">🆔</span>
                          <span className="font-medium text-gray-900 dark:text-white">{formId}</span>
                        </div>
                        
                        {form.stationId && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 dark:text-gray-400">🏢</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {isStationLoading ? '⏳' : station ? station.stationName || 'N/A' : form.stationId}
                            </span>
                          </div>
                        )}
                        
                        {form.startDate && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 dark:text-gray-400">📅 Ngày tạo:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{formatDate(form.startDate)}</span>
                          </div>
                        )}
                        
                        {form.date && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 dark:text-gray-400">🗓️ Ngày đặt lịch:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{formatDate(form.date)}</span>
                          </div>
                        )}
                      </div>

                      {form.accountId && (
                        <div className="p-4 mt-4 border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-600 dark:to-gray-700 rounded-xl dark:border-gray-500">
                          <h4 className="flex items-center gap-2 mb-3 font-bold text-gray-900 dark:text-white">
                            👤 Thông tin Customer
                          </h4>
                          {isCustomerLoading ? (
                            <p className="text-sm text-gray-600 dark:text-gray-300">⏳ Đang tải...</p>
                          ) : customer ? (
                            <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2 lg:grid-cols-3">
                              <div>
                                <span className="font-semibold text-gray-700 dark:text-gray-200">📛 Tên:</span>
                                <p className="text-gray-900 dark:text-white">{customer.name || 'N/A'}</p>
                              </div>
                              <div>
                                <span className="font-semibold text-gray-700 dark:text-gray-200">📞 SĐT:</span>
                                <p className="text-gray-900 dark:text-white">{customer.phone || 'N/A'}</p>
                              </div>
                              <div>
                                <span className="font-semibold text-gray-700 dark:text-gray-200">📧 Email:</span>
                                <p className="text-gray-900 truncate dark:text-white">{customer.email || 'N/A'}</p>
                              </div>
                              {customer.username && (
                                <div>
                                  <span className="font-semibold text-gray-700 dark:text-gray-200">👥 Username:</span>
                                  <p className="text-gray-900 dark:text-white">{customer.username}</p>
                                </div>
                              )}
                              {customer.address && (
                                <div className="md:col-span-2">
                                  <span className="font-semibold text-gray-700 dark:text-gray-200">📍 Địa chỉ:</span>
                                  <p className="text-gray-900 dark:text-white">{customer.address}</p>
                                </div>
                              )}
                              {customer.status && (
                                <div>
                                  <span className="font-semibold text-gray-700 dark:text-gray-200">⚡ Status:</span>
                                  <span className={`ml-2 px-3 py-1 rounded-full text-xs font-bold text-white ${customer.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}>
                                    {customer.status}
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-600 dark:text-gray-300">❌ Không tìm thấy thông tin</p>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-3 lg:flex-col lg:w-32">
                      <button 
                        onClick={() => handleDeleteForm(form)}
                        disabled={loading || isDeleteDisabled}
                        className={`flex-1 px-4 py-3 text-sm font-semibold text-white transition-all transform rounded-lg shadow-lg lg:flex-none ${
                          isDeleteDisabled 
                            ? 'bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 hover:scale-105'
                        } disabled:opacity-50`}
                      >
                        {isDeleteDisabled ? '❌ Đã xóa' : '🗑️ Xóa'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
            <button 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 font-semibold text-gray-700 transition-all bg-gray-200 rounded-lg dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Trước
            </button>
            
            <div className="flex gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all transform hover:scale-105 ${
                      page === currentPage
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            
            <button 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 font-semibold text-gray-700 transition-all bg-gray-200 rounded-lg dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sau →
            </button>
          </div>
        )}
      </div>

      {selectedForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between p-6 text-white bg-gradient-to-r from-orange-500 to-orange-600 rounded-t-2xl">
              <h2 className="text-2xl font-bold">📋 Chi tiết Form</h2>
              <button 
                onClick={() => setSelectedForm(null)}
                className="px-4 py-2 font-semibold transition-all bg-white rounded-lg bg-opacity-20 hover:bg-opacity-30"
              >
                ✕ Đóng
              </button>
            </div>
            <div className="p-6">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <pre className="overflow-x-auto text-sm text-gray-800 whitespace-pre-wrap dark:text-gray-200">
                  {JSON.stringify(selectedForm, null, 2)}
                </pre>
              </div>
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => {
                    handleDeleteForm(selectedForm);
                    setSelectedForm(null);
                  }}
                  disabled={selectedForm.status?.toLowerCase() === 'deleted'}
                  className={`px-6 py-3 font-semibold text-white transition-all transform rounded-lg shadow-lg ${
                    selectedForm.status?.toLowerCase() === 'deleted'
                      ? 'bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 hover:scale-105'
                  }`}
                >
                  {selectedForm.status?.toLowerCase() === 'deleted' ? '❌ Đã xóa' : '🗑️ Xóa Form'}
                </button>
                <button 
                  onClick={() => setSelectedForm(null)}
                  className="px-6 py-3 font-semibold text-gray-700 transition-all bg-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}