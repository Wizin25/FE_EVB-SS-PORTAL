import { useState, useEffect } from 'react';
import { authAPI } from '../../services/authAPI';
import { getCurrentUserPayload, extractRolesFromPayload } from '../../services/jwt';
import './Controller.css';

export default function ControllerPage() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [error, setError] = useState('');

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

  // Fetch all users using authAPI
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!checkAuth()) return;

      console.log('Controller: Starting to fetch users');
      
        const res = await authAPI.getAllUsers();
      console.log('Controller: Raw API response:', res);

      const usersArray = Array.isArray(res?.data) ? res.data : [];

      if (usersArray.length > 0) {
        console.log(`Controller: Received ${usersArray.length} users`);

        const formattedUsers = usersArray.map(user => ({
          accountId: user.accountId ?? 'N/A',
          role: user.role ?? 'N/A',
          username: user.username?.trim() || 'N/A',
          name: user.name?.trim() || 'N/A',
          phone: user.phone?.trim() || 'N/A',
          address: user.address?.trim() || 'N/A',
          email: user.email?.trim() || 'N/A',
          status: user.status ?? 'Active',
          startDate: user.startDate ?? 'N/A',
          updateDate: user.updateDate ?? 'N/A'
        }));

        setUsers(formattedUsers);
        setFilteredUsers(formattedUsers);
      } else {
        console.warn('Controller: No users array found in response:', res);
        setUsers([]);
        setFilteredUsers([]);
      }
    } catch (error) {
      console.error('Controller: Error fetching users:', error);
      
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
  }, [users, searchTerm, sortField, sortDirection]);

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
      return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
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
      <button className="Staff-button">New Staff</button>
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
              <th onClick={() => handleSort('startDate')}>
                Start Date {getSortIcon('startDate')}
              </th>
              <th onClick={() => handleSort('updateDate')}>
                Update Date {getSortIcon('updateDate')}
              </th>
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
                    <span className={`status-${user.status ? user.status.toLowerCase() : 'active'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td>{formatDate(user.startDate)}</td>
                  <td>{formatDate(user.updateDate)}</td>
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
    </div>
  );
}