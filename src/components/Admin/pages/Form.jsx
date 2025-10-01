// Form.jsx
import { useState, useEffect } from 'react';
import { authAPI } from '../../services/authAPI';
import { formAPI } from '../../services/formAPI';
import { getCurrentUserPayload, isInRole } from '../../services/jwt';

export default function FormPage() {
  const [forms, setForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // State cho form tạo mới
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    stationId: ''
  });

  // State cho tìm kiếm và lọc
  const [searchId, setSearchId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [stationId, setStationId] = useState('');

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

  // Lấy tất cả forms
  const fetchAllForms = async () => {
    setLoading(true);
    try {
      const response = await formAPI.getAllForms();
      if (response.isSuccess) {
        setForms(response.data || []);
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

  // Lấy form theo ID
  const fetchFormById = async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await formAPI.getFormById(id);
      if (response.isSuccess) {
        setSelectedForm(response.data);
      } else {
        alert('Không tìm thấy form: ' + response.message);
      }
    } catch (error) {
      console.error('Error fetching form:', error);
      alert('Không tìm thấy form');
    } finally {
      setLoading(false);
    }
  };

  // Lấy forms theo account ID
  const fetchFormsByAccountId = async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await formAPI.getFormsByAccountId(id);
      if (response.isSuccess) {
        setForms(response.data || []);
      } else {
        alert('Lỗi khi tải forms theo account: ' + response.message);
      }
    } catch (error) {
      console.error('Error fetching forms:', error);
      alert('Lỗi khi tải forms theo account');
    } finally {
      setLoading(false);
    }
  };

  // Lấy forms theo station ID
  const fetchFormsByStationId = async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await formAPI.getFormsByStationId(id);
      if (response.isSuccess) {
        setForms(response.data || []);
      } else {
        alert('Lỗi khi tải forms theo trạm: ' + response.message);
      }
    } catch (error) {
      console.error('Error fetching forms:', error);
      alert('Lỗi khi tải forms theo trạm');
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

  // Cập nhật form
  const handleUpdateForm = async (updatedData) => {
    setLoading(true);
    try {
      const response = await formAPI.updateForm(updatedData);
      if (response.isSuccess) {
        alert('Cập nhật form thành công!');
        setSelectedForm(null);
        fetchAllForms();
      } else {
        alert('Lỗi khi cập nhật form: ' + response.message);
      }
    } catch (error) {
      console.error('Error updating form:', error);
      alert('Lỗi khi cập nhật form');
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
        alert('Xóa form thành công!');
        setSelectedForm(null);
        fetchAllForms();
      } else {
        alert('Lỗi khi xóa form: ' + response.message);
      }
    } catch (error) {
      console.error('Error deleting form:', error);
      alert('Lỗi khi xóa form');
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

  useEffect(() => {
    fetchAllForms();
  }, []);

  const canCreateForm = currentUser && isInRole('EvDriver');

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

      {/* Tìm kiếm và bộ lọc */}
      <section style={{ marginBottom: 40, padding: 20, border: '1px solid #e2e8f0', borderRadius: 8 }}>
        <h2 style={{ marginBottom: 16 }}>Tìm kiếm & Lọc Form</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Tìm theo Form ID</span>
            <input
              placeholder="Nhập Form ID"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}
            />
            <button 
              onClick={() => fetchFormById(searchId)}
              style={{ padding: '8px 12px', background: '#3b82f6', color: 'white', borderRadius: 6 }}
            >
              Tìm Form
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Lọc theo Account ID</span>
            <input
              placeholder="Nhập Account ID"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}
            />
            <button 
              onClick={() => fetchFormsByAccountId(accountId)}
              style={{ padding: '8px 12px', background: '#10b981', color: 'white', borderRadius: 6 }}
            >
              Lọc theo Account
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Lọc theo Station ID</span>
            <input
              placeholder="Nhập Station ID"
              value={stationId}
              onChange={(e) => setStationId(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}
            />
            <button 
              onClick={() => fetchFormsByStationId(stationId)}
              style={{ padding: '8px 12px', background: '#f59e0b', color: 'white', borderRadius: 6 }}
            >
              Lọc theo Station
            </button>
          </div>

          <button 
            onClick={fetchAllForms}
            style={{ padding: '8px 16px', background: '#6b7280', color: 'white', borderRadius: 6, height: 'fit-content' }}
          >
            Hiển thị tất cả
          </button>
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

      {/* Danh sách forms */}
      <section style={{ padding: 20, border: '1px solid #e2e8f0', borderRadius: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2>Danh sách Forms ({forms.length})</h2>
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
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : forms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
            <p>Không có form nào</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {forms.map((form) => (
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
                  <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 14 }}>
                    <span>ID: {form.id}</span>
                    {form.accountId && <span>Account: {form.accountId}</span>}
                    {form.stationId && <span>Station: {form.stationId}</span>}
                    {form.date && <span>Ngày: {new Date(form.date).toLocaleDateString('vi-VN')}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button 
                    onClick={() => setSelectedForm(form)}
                    style={{ padding: '6px 12px', border: '1px solid #3b82f6', color: '#3b82f6', borderRadius: 6 }}
                  >
                    Xem
                  </button>
                  <button 
                    onClick={() => handleDeleteForm(form.id)}
                    style={{ padding: '6px 12px', background: '#ef4444', color: 'white', borderRadius: 6 }}
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}