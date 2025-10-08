import React, { useState, useEffect } from 'react';
import { packageAPI } from '../../services/packageAPI';
import './PackageManager.css';

const PackageManager = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const [editingPackage, setEditingPackage] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    packageName: '',
    price: '',
    description: '',
    batteryType: ''
  });

  const [errors, setErrors] = useState({});

  // Load all packages (bao gồm cả inactive)
  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const response = await packageAPI.getAllPackages();
      
      console.log('API Response:', response); // Debug response
      
      let allPackages = [];
      
      // Handle different response structures - CẢI THIỆN XỬ LÝ RESPONSE
      if (response && Array.isArray(response)) {
        allPackages = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        allPackages = response.data;
      } else if (response && response.data && response.data.data && Array.isArray(response.data.data)) {
        allPackages = response.data.data;
      } else if (response && response.data && response.data.isSuccess && Array.isArray(response.data.data)) {
        allPackages = response.data.data;
      } else if (response && response.isSuccess && Array.isArray(response.data)) {
        allPackages = response.data;
      } else if (response && Array.isArray(response.packages)) {
        allPackages = response.packages;
      } else if (response && Array.isArray(response.items)) {
        allPackages = response.items;
      }
      
      console.log('Extracted packages:', allPackages); // Debug extracted data
      
      setPackages(allPackages || []);
    } catch (error) {
      console.error('Error loading packages:', error);
      showAlert('error', 'Không thể tải danh sách gói dịch vụ: ' + (error.message || 'Lỗi không xác định'));
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
  };

  // Helper function to get package property
  const getPackageProperty = (pkg, property) => {
  const possibleKeys = {
    id: ['packageId', 'id', 'packageID', 'PackageID', 'PackageId'],
    name: ['packageName', 'packName', 'name', 'packageName', 'title', 'PackageName'],
    price: ['price', 'cost', 'amount', 'Price'],
    duration: ['duration', 'period', 'validity', 'Duration'],
    description: ['description', 'desc', 'details', 'Description'],
    status: ['status', 'Status', 'state', 'isActive'],
    batteryType: ['batteryType', 'batterySpecification', 'BatteryType'] // THÊM DÒNG NÀY
  };
  
  const keys = possibleKeys[property] || [property];
  for (let key of keys) {
    if (pkg[key] !== undefined && pkg[key] !== null && pkg[key] !== '') {
      return pkg[key];
    }
  }
  return property === 'price' ? 0 : 'N/A';
};

  const getPackageDisplayName = (pkg) => {
    const name = getPackageProperty(pkg, 'name');
    const packageId = getPackageProperty(pkg, 'id');
    return name !== 'N/A' ? name : `Package ${packageId}`;
  };

  // KIỂM TRA PACKAGE CÓ ACTIVE KHÔNG - CẢI THIỆN LOGIC
  const isPackageActive = (pkg) => {
    const status = getPackageProperty(pkg, 'status');
    const isActive = getPackageProperty(pkg, 'isActive');
    
    return status === 'Active' || status === 'active' || status === true || 
           status === 1 || isActive === true || isActive === 1 ||
           status === 'N/A' || !status; // Mặc định là active nếu không có status
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.packageName.trim()) {
      newErrors.packageName = 'Tên gói không được để trống';
    } else if (formData.packageName.trim().length < 2) {
      newErrors.packageName = 'Tên gói phải có ít nhất 2 ký tự';
    } else if (formData.packageName.trim().length > 100) {
      newErrors.packageName = 'Tên gói không được vượt quá 100 ký tự';
    }
    
    if (!formData.price) {
      newErrors.price = 'Giá không được để trống';
    } else {
      const priceValue = parseFloat(formData.price);
      if (isNaN(priceValue) || priceValue < 0) {
        newErrors.price = 'Giá phải là số hợp lệ và lớn hơn 0';
      } else if (priceValue > 1000000000) {
        newErrors.price = 'Giá không được vượt quá 1,000,000,000 VND';
      }
    }

    

    if (formData.description.length > 500) {
      newErrors.description = 'Mô tả không được vượt quá 500 ký tự';
    }
    
    if (!formData.batteryType) {
    newErrors.batteryType = 'Vui lòng chọn loại pin';
  }
  
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const resetForm = () => {
    setFormData({
      packageName: '',
      price: '',
      description: '',
      batteryType: ''
    });
    setErrors({});
    setEditingPackage(null);
    setShowForm(false);
  };

  const handleEdit = (pkg) => {
  // Kiểm tra nếu package không active thì không cho chỉnh sửa
  if (!isPackageActive(pkg)) {
    showAlert('error', 'Không thể chỉnh sửa gói dịch vụ đã bị vô hiệu hóa');
    return;
  }
  
  setEditingPackage(pkg);
  setFormData({
    packageName: getPackageProperty(pkg, 'name'),
    price: getPackageProperty(pkg, 'price'),
    description: getPackageProperty(pkg, 'description') || '',
    batteryType: pkg.batteryType || pkg.batterySpecification || '' // CẢI THIỆN LẤY BATTERY TYPE
  });
  setShowForm(true);
};

  const handleCreateNew = () => {
    resetForm();
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Validate form
  if (!validateForm()) {
    showAlert('error', 'Vui lòng kiểm tra lại thông tin trong form');
    return;
  }

  try {
    setSubmitting(true);

    // Chuẩn bị dữ liệu - THÊM BATTERY TYPE
    const submitData = {
      packageName: formData.packageName.trim(),
      price: parseFloat(formData.price),
      description: formData.description.trim() || '',
      batteryType: formData.batteryType // THÊM DÒNG NÀY
    };

    console.log('Sending package data:', submitData);

    let response;

    if (editingPackage) {
      // Update existing package
      const updateData = {
        ...submitData,
        packageId: getPackageProperty(editingPackage, 'id')
      };
      response = await packageAPI.updatePackage(updateData);
    } else {
      // Create new package
      response = await packageAPI.createPackage(submitData);
    }
      
      // CẢI THIỆN XỬ LÝ RESPONSE
      const isSuccess = response?.isSuccess || 
                       response?.data?.isSuccess || 
                       response?.status === 200 ||
                       response?.statusCode === 200 ||
                       response?.success === true;

      if (isSuccess) {
        const successMessage = editingPackage ? 
          '✅ Cập nhật gói thành công!' : 
          '✅ Tạo gói mới thành công!';
        
        showAlert('success', successMessage);
        resetForm();
        await loadPackages(); // Đợi load lại danh sách
      } else {
        const errorMsg = response?.message || 
                        response?.data?.message || 
                        response?.responseCode || 
                        (editingPackage ? 'Cập nhật thất bại' : 'Tạo mới thất bại');
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('Submit error:', error);
      let errorMessage = 'Lỗi: ';
      
      if (error.response?.data?.message) {
        errorMessage += error.response.data.message;
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Lỗi không xác định khi kết nối với server';
      }
      
      showAlert('error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (pkg) => {
    const packageId = getPackageProperty(pkg, 'id');
    const packageName = getPackageDisplayName(pkg);
    
    if (!window.confirm(`Bạn có chắc muốn vô hiệu hóa gói "${packageName}"? Gói này sẽ không hiển thị cho người dùng nữa.`)) {
      return;
    }

    try {
      setSubmitting(true);
      const response = await packageAPI.deletePackage(packageId);
      
      const isSuccess = response?.isSuccess || 
                       response?.data?.isSuccess || 
                       response?.status === 200 ||
                       response?.statusCode === 200;

      if (isSuccess) {
        showAlert('success', '✅ Đã vô hiệu hóa gói thành công!');
        loadPackages();
      } else {
        const errorMsg = response?.message || response?.responseCode || 'Vô hiệu hóa thất bại';
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('Delete error:', error);
      let errorMessage = 'Không thể vô hiệu hóa gói: ';
      
      if (error.response?.data?.message) {
        errorMessage += error.response.data.message;
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Lỗi không xác định';
      }
      
      showAlert('error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    resetForm();
  };

  return (
    <div className="package-manager-container">
      {/* Header */}
      <div className="package-manager-header">
        <h1 className="package-manager-title">📦 Quản Lý Gói Dịch Vụ</h1>
        <button 
          className="package-manager-new-btn"
          onClick={handleCreateNew}
          disabled={submitting || loading}
        >
          <span>+</span>
          <span>Thêm Gói Mới</span>
        </button>
      </div>

      {/* Alert */}
      {alert.show && (
        <div className={`package-manager-alert package-manager-alert-${alert.type}`}>
          <span>{alert.type === 'success' ? '✓' : '⚠'}</span>
          <span>{alert.message}</span>
        </div>
      )}

      {/* Form Section */}
      {showForm && (
        <div className="package-manager-form-section">
          <div className="package-manager-card">
            <h2 className="package-manager-form-title">
              {editingPackage ? `Chỉnh Sửa Gói: ${getPackageDisplayName(editingPackage)}` : 'Thêm Gói Mới'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="package-manager-grid">
                {/* Package Name */}
                <div className="package-manager-form-group">
                  <label className="package-manager-label">
                    Tên Gói *
                  </label>
                  <input
                    type="text"
                    name="packageName"
                    value={formData.packageName}
                    onChange={handleInputChange}
                    disabled={submitting}
                    className={`package-manager-input ${errors.packageName ? 'error' : ''}`}
                    placeholder="Nhập tên gói dịch vụ"
                    required
                  />
                  {errors.packageName && (
                    <div className="package-manager-error">{errors.packageName}</div>
                  )}
                </div>

                {/* Price */}
                <div className="package-manager-form-group">
                  <label className="package-manager-label">
                    Giá (VND) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    disabled={submitting}
                    className={`package-manager-input ${errors.price ? 'error' : ''}`}
                    placeholder="Nhập giá"
                    min="0"
                    step="1000"
                    required
                  />
                  {errors.price && (
                    <div className="package-manager-error">{errors.price}</div>
                  )}
                </div>
              </div>

              <div className="package-manager-form-group">
             <label className="package-manager-label">
             Battery Specification *
            </label>
            <select
            name="batteryType"
            value={formData.batteryType}
            onChange={handleInputChange}
            disabled={submitting}
           className={`package-manager-select ${errors.batteryType ? 'error' : ''}`}
           required
           >
          <option value="">Chọn loại pin</option>
          <option value="V48_Ah13">48V-13Ah</option>
          <option value="V60_Ah22">60V-22Ah</option>
          <option value="V72_Ah38">72V-38Ah</option>
          <option value="V72_Ah50">72V-50Ah</option>
          <option value="V48_Ah22">48V-22Ah</option>
          <option value="V72_Ah30">72V-30Ah</option>
          <option value="V72_Ah22">72V-22Ah</option>
          <option value="V60_Ah20">60V-20Ah</option>
          <option value="V48_Ah12">48V-12Ah</option>
          <option value="V36_Ah10_4">36V - 10.4Ah / 374.4Wh</option>
          <option value="V36_Ah7_8">36V - 7.8Ah / 378Wh</option>
       </select>
       {errors.batteryType && (
      <div className="package-manager-error">{errors.batteryType}</div>
      )}
    </div>

              {/* Description */}
              <div className="package-manager-form-group">
                <label className="package-manager-label">
                  Mô Tả (tuỳ chọn)
                  <span className="package-manager-optional"> - {formData.description.length}/500 ký tự</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  disabled={submitting}
                  className={`package-manager-textarea ${errors.description ? 'error' : ''}`}
                  placeholder="Nhập mô tả gói dịch vụ"
                  rows="4"
                  maxLength="500"
                />
                {errors.description && (
                  <div className="package-manager-error">{errors.description}</div>
                )}
              </div>

              {/* Form Actions */}
              <div className="package-manager-actions">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={submitting}
                  className="package-manager-btn package-manager-btn-cancel"
                >
                  Hủy
                </button>
                
                <button
                  type="submit"
                  disabled={submitting}
                  className="package-manager-btn package-manager-btn-submit"
                >
                  {submitting ? (
                    <>
                      <span className="package-manager-spinner"></span>
                      <span>Đang xử lý...</span>
                    </>
                  ) : (
                    <span>{editingPackage ? 'Cập Nhật' : 'Tạo Mới'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Packages List */}
      <div className="package-manager-list-section">
        <div className="package-manager-stats">
          <h3>Tổng số gói: {packages.length} (Active: {packages.filter(pkg => isPackageActive(pkg)).length})</h3>
        </div>

        {loading ? (
          <div className="package-manager-loading">
            <span className="package-manager-spinner"></span>
            Đang tải danh sách gói...
          </div>
        ) : packages.length === 0 ? (
          <div className="package-manager-empty">
            <div className="package-manager-empty-icon">📦</div>
            <h3>Chưa có gói dịch vụ nào</h3>
            <p>Hãy tạo gói dịch vụ đầu tiên của bạn</p>
            <button 
              className="package-manager-empty-btn"
              onClick={handleCreateNew}
              disabled={submitting}
            >
              Tạo Gói Đầu Tiên
            </button>
          </div>
        ) : (
          <div className="package-manager-grid-list">
            {packages.map((pkg, index) => (
              <div 
                key={getPackageProperty(pkg, 'id') || index} 
                className={`package-manager-card-item ${!isPackageActive(pkg) ? 'package-inactive' : ''}`}
              >
                <div className="package-manager-card-header">
                  <h3 className="package-manager-card-title">
                    {getPackageDisplayName(pkg)}
                    {!isPackageActive(pkg) ? (
                      <span className="package-status-badge inactive">INACTIVE</span>
                    ) : (
                      <span className="package-status-badge active">ACTIVE</span>
                    )}
                  </h3>
                  <span className="package-manager-card-id">
                    ID: {getPackageProperty(pkg, 'id')}
                  </span>
                </div>
                
                <div className="package-manager-card-content">
                  <div className="package-manager-card-price">
                  {getPackageProperty(pkg, 'price')?.toLocaleString('vi-VN')} VND
                </div>
  
                {/* THÊM HIỂN THỊ BATTERY TYPE */}
                <div className="package-manager-card-battery">
                 <strong>Loại pin:</strong> {getPackageProperty(pkg, 'batteryType')}
                </div>
  
                <div className="package-manager-card-description">
               {getPackageProperty(pkg, 'description') || 'Không có mô tả'}
               </div>

               {/* Hiển thị trạng thái */}
               <div className="package-manager-card-status">
                 <strong>Trạng thái:</strong> {isPackageActive(pkg) ? '🟢 Active' : '🔴 Inactive'}
              </div>
                </div>
                
                <div className="package-manager-card-actions">
                  <button
                    onClick={() => handleEdit(pkg)}
                    disabled={submitting || !isPackageActive(pkg)}
                    className="package-manager-card-btn package-manager-card-btn-edit"
                    title={!isPackageActive(pkg) ? 'Không thể chỉnh sửa gói đã vô hiệu hóa' : ''}
                  >
                    ✏️ Chỉnh sửa
                  </button>
                  
                  <button
                    onClick={() => handleDelete(pkg)}
                    disabled={submitting || !isPackageActive(pkg)}
                    className="package-manager-card-btn package-manager-card-btn-delete"
                  >
                    🗑️ {isPackageActive(pkg) ? 'Vô hiệu hóa' : 'Đã vô hiệu'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PackageManager;