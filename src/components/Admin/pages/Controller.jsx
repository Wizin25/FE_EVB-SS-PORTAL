import { useState, useEffect } from 'react';
import { authAPI } from '../../services/authAPI';
import { getCurrentUserPayload, extractRolesFromPayload } from '../../services/jwt';
import NewStaffPopup from './NewStaffPopup';
import UserDetailPopup from './UserDetailPopup';
import './Controller.css';

export default function ControllerPage() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [roleFilter, setRoleFilter] = useState('All');
  const [error, setError] = useState('');
  const [showNewStaffPopup, setShowNewStaffPopup] = useState(false);
  const [exchangeHistory, setExchangeHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // 👇 detail popup
  const [showDetailPopup, setShowDetailPopup] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [customerDetails, setCustomerDetails] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Thêm state cho status update
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);

  const checkAuth = () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('No authentication token found. Please sign in again.');
      setLoading(false);
      return false;
    }

    try {
      const payload = getCurrentUserPayload();
      const roles = extractRolesFromPayload(payload);
      
      if (!roles.includes('Admin')) {
        setError('Access denied. Admin role required.');
        setLoading(false);
        return false;
      }
      
      return true;
    } catch (err) {
      setError('Invalid token. Please sign in again.');
      setLoading(false);
      return false;
    }
  };

  // Hàm cập nhật account status
  const handleUpdateAccountStatus = async (accountId, newStatus) => {
    if (!accountId) return;
    
    setStatusUpdateLoading(true);
    try {
      await authAPI.updateAccountStatus(accountId, newStatus);
      
      // Cập nhật local state
      setUsers(prev => prev.map(user => 
        user.accountId === accountId ? { ...user, status: newStatus } : user
      ));
      
      setFilteredUsers(prev => prev.map(user => 
        user.accountId === accountId ? { ...user, status: newStatus } : user
      ));
      
      alert(`Đã cập nhật trạng thái thành ${newStatus}`);
    } catch (error) {
      alert("Cập nhật trạng thái thất bại: " + error.message);
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!checkAuth()) return;

      const res = await authAPI.getAllUsers();
      console.log('API Response:', res); // Debug API response
      
      const usersArray = Array.isArray(res?.data) ? res.data : [];

      if (usersArray.length > 0) {
        const formattedUsers = usersArray.map(user => ({
          accountId: user.accountId ?? 'N/A',
          role: user.role ?? 'N/A',
          username: user.username?.trim() || 'N/A',
          name: user.name?.trim() || 'N/A',
          phone: user.phone?.trim() || 'N/A',
          address: user.address?.trim() || 'N/A',
          email: user.email?.trim() || 'N/A',
          status: user.status ?? 'Null',
          startDate: user.startDate ?? 'N/A',
          updateDate: user.updateDate ?? 'N/A'
        }));

        console.log('Formatted users:', formattedUsers); // Debug formatted data
        
        setUsers(formattedUsers);
        setFilteredUsers(formattedUsers);
      } else {
        setUsers([]);
        setFilteredUsers([]);
      }
    } catch (error) {
      let errorMessage = 'Failed to fetch users: ';
      if (error.response) {
        errorMessage += `Server error ${error.response.status}: ${error.response.data?.message || error.response.statusText}`;
      } else if (error.request) {
        errorMessage += 'No response from server. Check if backend is running.';
      } else {
        errorMessage += error.message || 'Unknown error';
      }
      
      setError(errorMessage);
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleShowDetail = async (user) => {
    setSelectedUser(user);
    setShowDetailPopup(true);
    setCustomerDetails(null);
    setExchangeHistory([]);

    if (user.role === 'EvDriver') {
      setDetailLoading(true);
      try {
        const res = await authAPI.getAllCustomers();
        const customers = Array.isArray(res?.data) ? res.data : [];
        
        const customer = customers.find(c => 
          c.accountID === user.accountId || c.accountId === user.accountId
        );
        
        if (customer) {
          setCustomerDetails(customer);

          setHistoryLoading(true);
          try {
            const historyRes = await authAPI.getExchangeHistory(customer.customerID);
            const historyData = Array.isArray(historyRes?.data) ? historyRes.data : [];
            setExchangeHistory(historyData);
          } catch (historyError) {
            console.error('Failed to fetch exchange history:', historyError);
            setExchangeHistory([]);
          } finally {
            setHistoryLoading(false);
          }
        }
      } catch (error) {
        console.error('Failed to fetch customer details:', error);
      } finally {
        setDetailLoading(false);
      }
    }
  };

  // HÀM LƯU THÔNG TIN USER SAU KHI CHỈNH SỬA
  const handleSaveUser = async (accountId, updatedData) => {
    try {
      console.log('Saving user:', { accountId, updatedData, selectedUser });
      
      let response;
      
      if (selectedUser.role === 'Bsstaff') {
        response = await authAPI.updateStaff({ 
          accountId, 
          ...updatedData 
        });
      } else if (selectedUser.role === 'EvDriver') {
        response = await authAPI.updateCustomer({ 
          accountId, 
          ...updatedData 
        });
      } else {
        alert('Cannot edit Admin users');
        return;
      }

      console.log('Save response:', response);
      
      if (response && response.statusCode === 200) {
        // Cập nhật local state và fetch lại dữ liệu từ server
        await fetchUsers();
        setShowDetailPopup(false);
        alert('User updated successfully!');
      } else {
        alert('Failed to update user. Please try again.');
      }
    } catch (error) {
      console.error('Failed to update user:', error);
      alert(`Failed to update user: ${error.message || 'Please try again.'}`);
    }
  };

  // HÀM XÓA USER - GỌI API THỰC TẾ
  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to delete user: ${user.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      let response;
      
      if (user.role === 'Bsstaff') {
        response = await authAPI.deleteStaff(user.accountId);
      } else if (user.role === 'EvDriver') {
        response = await authAPI.deleteCustomer(user.accountId);
      } else {
        alert('Cannot delete Admin users');
        return;
      }

      if (response && response.statusCode === 200) {
        // Xóa thành công, fetch lại dữ liệu từ server
        await fetchUsers();
        setShowDetailPopup(false);
        alert(`User ${user.name} has been deleted successfully`);
      } else {
        alert('Failed to delete user. Please try again.');
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user. Please try again.');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!users.length) return;

    let results = users;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(user =>
        (user.name || '').toLowerCase().includes(term) ||
        (user.username || '').toLowerCase().includes(term) ||
        (user.email || '').toLowerCase().includes(term) ||
        (user.phone || '').toLowerCase().includes(term) ||
        (user.role || '').toLowerCase().includes(term) ||
        (user.address || '').toLowerCase().includes(term)
      );
    }

    if (roleFilter !== 'All') {
      results = results.filter(user => user.role === roleFilter);
    }

    if (sortField) {
      results = [...results].sort((a, b) => {
        const aValue = a[sortField] || '';
        const bValue = b[sortField] || '';
        
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setFilteredUsers(results);
  }, [users, searchTerm, sortField, sortDirection, roleFilter]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return '';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const handleRetry = () => {
    if (error.includes('token') || error.includes('auth')) {
      localStorage.removeItem('authToken');
      window.location.href = '/signin';
      return;
    }
    fetchUsers();
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'N/A') return 'N/A';
    try {
      const date = new Date(dateString);
      
      // Kiểm tra nếu date không hợp lệ
      if (isNaN(date.getTime())) return 'N/A';
      
      // Sử dụng toLocaleString để bao gồm cả thời gian
      return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Ho_Chi_Minh' // Chỉ định rõ múi giờ Việt Nam
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="controller-page">
        <div className="loading">
          <div>Loading users...</div>
          <div style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
            Calling endpoint: /api/Account/get_all_account_for_admin
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="controller-page">
        <div className="error-state">
          <h2>Error Loading Users</h2>
          <p>{error}</p>
          <button onClick={handleRetry} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="controller-page">
      <div className="controller-header">
        <div className="header-content">
          <h1>User Management</h1>
          <p>Quản lý tài khoản người dùng hệ thống SwapX</p>
          <p style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
            Total accounts: {users.length} | Showing: {filteredUsers.length}
          </p>
        </div>
        <button
          className="Staff-button"
          onClick={() => setShowNewStaffPopup(true)}
        >
          New Staff
        </button>
      </div>

      <div className="controller-tools">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name, username, email, phone, role, or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="sort-controls">
          <label>Sort by: </label>
          <select 
            value={sortField} 
            onChange={(e) => setSortField(e.target.value)}
            className="sort-select"
          >
            <option value="name">Name</option>
            <option value="username">Username</option>
            <option value="email">Email</option>
            <option value="phone">Phone</option>
            <option value="role">Role</option>
            <option value="address">Address</option>
            <option value="startDate">Join Date</option>
            <option value="updateDate">Update Date</option>
          </select>
          
          <button 
            onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
            className="sort-direction-btn"
          >
            {sortDirection === 'asc' ? '↑ Ascending' : '↓ Descending'}
          </button>
        </div>

        <div className="role-filter">
          <label>Filter by Role: </label>
          <select 
            value={roleFilter} 
            onChange={(e) => setRoleFilter(e.target.value)}
            className="sort-select"
          >
            <option value="All">All</option>
            <option value="Admin">Admin</option>
            <option value="Bsstaff">Bsstaff</option>
            <option value="EvDriver">EvDriver</option>
          </select>
        </div>
      </div>

      <div className="users-stats">
        <div className="stat-card">
          <h3>Total Accounts</h3>
          <span className="stat-number">{users.length}</span>
        </div>
        <div className="stat-card">
          <h3>Staff Members</h3>
          <span className="stat-number">
            {users.filter(user => user.role === 'Bsstaff').length}
          </span>
        </div>
        <div className="stat-card">
          <h3>Drivers</h3>
          <span className="stat-number">
            {users.filter(user => user.role === 'EvDriver').length}
          </span>
        </div>
        <div className="stat-card">
          <h3>Admins</h3>
          <span className="stat-number">
            {users.filter(user => user.role === 'Admin').length}
          </span>
        </div>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('role')}>
                Role {getSortIcon('role')}
              </th>
              <th onClick={() => handleSort('username')}>
                Username {getSortIcon('username')}
              </th>
              <th onClick={() => handleSort('name')}>
                Name {getSortIcon('name')}
              </th>
              <th onClick={() => handleSort('phone')}>
                Phone {getSortIcon('phone')}
              </th>
              <th onClick={() => handleSort('address')}>
                Address {getSortIcon('address')}
              </th>
              <th onClick={() => handleSort('email')}>
                Email {getSortIcon('email')}
              </th>
              <th>Status</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="10" className="no-data">
                  {users.length === 0 ? 'No accounts found in system' : 'No accounts match your search'}
                </td>
              </tr>
            ) : (
              filteredUsers.map((user, index) => (
                <tr key={user.accountId || index}>
                  <td>
                    <span className={`role-badge role-${user.role?.toLowerCase()}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>{user.username}</td>
                  <td>
                    <div className="user-info">
                      <span className="user-name">{user.name}</span>
                    </div>
                  </td>
                  <td>{user.phone}</td>
                  <td>{user.address}</td>
                  <td>{user.email}</td>
                  <td>
                    <select 
                      value={user.status || 'Active'} 
                      onChange={(e) => handleUpdateAccountStatus(user.accountId, e.target.value)}
                      disabled={statusUpdateLoading}
                      className={`status-select ${user.status === 'Active' ? 'status-active' : user.status === 'Inactive' ? 'status-inactive' : ''}`}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </td>
                  <td>
                    <button 
                      className="detail-button"
                      onClick={() => handleShowDetail(user)}
                    >
                      Show
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <div className="results-count">
          Showing {filteredUsers.length} of {users.length} accounts
        </div>
      </div>

      {/* Popup create staff */}
      <NewStaffPopup
        open={showNewStaffPopup}
        onClose={() => setShowNewStaffPopup(false)}
        onSuccess={fetchUsers}
      />

      {/* Popup detail user */}
      <UserDetailPopup
        open={showDetailPopup}
        onClose={() => {
          setShowDetailPopup(false);
          setCustomerDetails(null);
          setExchangeHistory([]);
        }}
        user={selectedUser}
        customerDetails={customerDetails}
        detailLoading={detailLoading}
        exchangeHistory={exchangeHistory}
        historyLoading={historyLoading}
        onSave={handleSaveUser}
        onDelete={handleDeleteUser}
      />
    </div>
  );
}