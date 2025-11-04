// Dashboard.jsx
import { ChartContainer } from "../../lightswind/chart";
import { authAPI } from "../../services/authAPI";
import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ComposedChart,
} from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [stationData, setStationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    StationId: '',
    StartDate: '',
    EndDate: ''
  });
  const [stations, setStations] = useState([]);

  const theme = {
    background: '#f8fafc',
    cardBackground: 'white',
    textPrimary: '#1e293b',
    textSecondary: '#64748b',
    border: '#e2e8f0',
    gridStroke: '#e2e8f0',
    tooltipBg: 'white',
    tooltipBorder: '#e2e8f0',
  };

  // Fetch stations for dropdown
  useEffect(() => {
    const fetchStations = async () => {
      try {
        const stationsData = await authAPI.getAllStations();
        setStations(stationsData || []);
      } catch (err) {
        console.error('Error fetching stations:', err);
      }
    };
    fetchStations();
  }, []);

  // Fetch dashboard summary data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const summary = await authAPI.getDashboardSummary();
        setDashboardData(summary);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Fetch station-specific data when filters change
  const fetchStationData = async () => {
    try {
      setLoading(true);
      
      const formData = new FormData();
      if (filters.StationId) formData.append('StationId', filters.StationId);
      if (filters.StartDate) formData.append('StartDate', filters.StartDate);
      if (filters.EndDate) formData.append('EndDate', filters.EndDate);

      // Call show_dashboard endpoint
      const dashboardResponse = await authAPI.showDashboard(formData);
      
      // Call total_user and total_revenue endpoints
      const [userResponse, revenueResponse] = await Promise.all([
        authAPI.getTotalUsers(formData),
        authAPI.getTotalRevenue(formData)
      ]);

      setStationData({
        dashboard: dashboardResponse,
        totalUsers: userResponse,
        totalRevenue: revenueResponse
      });
    } catch (err) {
      setError(err.message);
      console.error('Error fetching station data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleApplyFilters = () => {
    fetchStationData();
  };

  const handleResetFilters = () => {
    setFilters({
      StationId: '',
      StartDate: '',
      EndDate: ''
    });
    setStationData(null);
  };

  // Generate station performance data from API response
  const generateStationPerformanceData = () => {
    if (!stationData?.dashboard) return [];
    
    // This is a sample structure - adjust based on your actual API response
    return stations.map(station => ({
      station: station.name || `Trạm ${station.stationId}`,
      efficiency: Math.floor(Math.random() * 20) + 80, // Sample data
      users: Math.floor(Math.random() * 500) + 100, // Sample data
      revenue: Math.floor(Math.random() * 100000000) + 50000000, // Sample data
      swaps: Math.floor(Math.random() * 1000) + 200 // Sample data
    }));
  };

  // Generate time series data from API response
  const generateTimeSeriesData = () => {
    if (!stationData?.dashboard) return [];
    
    // Sample time series data - replace with actual data structure from API
    const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
    return months.map((month, index) => ({
      name: month,
      revenue: Math.floor(Math.random() * 50000000) + 30000000,
      users: Math.floor(Math.random() * 1000) + 500,
      growth: Math.floor(Math.random() * 40) - 10
    }));
  };

  // Statistics cards configuration
  const statsCards = [
    { key: 'totalAccounts', label: 'Tổng người dùng', description: 'Tổng số tài khoản hệ thống', color: '#10b981' },
    { key: 'totalOrders', label: 'Tổng đơn hàng', description: 'Tổng số đơn hàng', color: '#3b82f6' },
    { key: 'totalBatteries', label: 'Tổng pin', description: 'Tổng số pin trong hệ thống', color: '#f59e0b' },
    { key: 'totalExchangeBatteries', label: 'Tổng lượt đổi pin', description: 'Tổng số lượt đổi pin', color: '#ef4444' },
    { key: 'totalStations', label: 'Tổng trạm', description: 'Tổng số trạm đổi pin', color: '#8b5cf6' },
  ];

  // Station-specific stats
  const stationStatsCards = stationData ? [
    { 
      key: 'totalUsers', 
      label: 'Tổng người dùng (Lọc)', 
      value: stationData.totalUsers?.data || 0, 
      description: `Số người dùng từ ${filters.StartDate || 'đầu'} đến ${filters.EndDate || 'nay'}${filters.StationId ? ` tại trạm ${filters.StationId}` : ''}`, 
      color: '#10b981' 
    },
    { 
      key: 'totalRevenue', 
      label: 'Tổng doanh thu (Lọc)', 
      value: stationData.totalRevenue?.data ? `${(stationData.totalRevenue.data / 1000000).toFixed(1)}M VNĐ` : '0 VNĐ', 
      description: `Doanh thu từ ${filters.StartDate || 'đầu'} đến ${filters.EndDate || 'nay'}${filters.StationId ? ` tại trạm ${filters.StationId}` : ''}`, 
      color: '#3b82f6' 
    },
  ] : [];

  if (loading && !stationData) {
    return (
      <div style={{ 
        padding: '24px', 
        backgroundColor: theme.background, 
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: theme.textPrimary 
      }}>
        <div>Đang tải dữ liệu...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '24px', 
        backgroundColor: theme.background, 
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: theme.textPrimary 
      }}>
        <div>Lỗi khi tải dữ liệu: {error}</div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '24px',
        backgroundColor: theme.background,
        minHeight: '100vh',
        transition: 'all 0.3s ease',
        color: theme.textPrimary,
      }}
    >
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: theme.textPrimary, marginBottom: 8 }}>
          Báo cáo & Thống kê
        </h1>
        <p style={{ fontSize: 16, color: theme.textSecondary }}>
          Tổng quan hệ thống đổi pin và phân tích dữ liệu người dùng
        </p>
      </div>

      {/* Filter Section */}
      <div style={{ 
        backgroundColor: theme.cardBackground, 
        borderRadius: '12px', 
        padding: '24px', 
        marginBottom: '24px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)', 
        border: `1px solid ${theme.border}`
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16, color: theme.textPrimary }}>
          Lọc dữ liệu theo trạm và thời gian
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: theme.textSecondary }}>
              Chọn trạm
            </label>
            <select
              value={filters.StationId}
              onChange={(e) => handleFilterChange('StationId', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: `1px solid ${theme.border}`,
                borderRadius: '6px',
                backgroundColor: theme.cardBackground,
                color: theme.textPrimary
              }}
            >
              <option value="">Tất cả trạm</option>
              {stations.map(station => (
                <option key={station.stationId} value={station.stationId}>
                  {station.name || `Trạm ${station.stationId}`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: theme.textSecondary }}>
              Từ ngày
            </label>
            <input
              type="date"
              value={filters.StartDate}
              onChange={(e) => handleFilterChange('StartDate', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: `1px solid ${theme.border}`,
                borderRadius: '6px',
                backgroundColor: theme.cardBackground,
                color: theme.textPrimary
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: theme.textSecondary }}>
              Đến ngày
            </label>
            <input
              type="date"
              value={filters.EndDate}
              onChange={(e) => handleFilterChange('EndDate', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: `1px solid ${theme.border}`,
                borderRadius: '6px',
                backgroundColor: theme.cardBackground,
                color: theme.textPrimary
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
            <button
              onClick={handleApplyFilters}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              Áp dụng
            </button>
            <button
              onClick={handleResetFilters}
              style={{
                padding: '8px 16px',
                backgroundColor: theme.textSecondary,
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              Đặt lại
            </button>
          </div>
        </div>
      </div>

      {/* Thống kê tổng quan */}
      <div style={{ 
        marginTop: '32px', 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '16px' 
      }}>
        {statsCards.map((stat, index) => (
          <div 
            key={stat.key}
            style={{ 
              backgroundColor: theme.cardBackground, 
              borderRadius: '12px', 
              padding: '20px', 
              textAlign: 'center', 
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)', 
              border: `1px solid ${theme.border}`,
              transition: 'all 0.3s ease',
              animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`
            }}
          >
            <h3 style={{ 
              fontSize: 14, 
              fontWeight: 500, 
              color: theme.textSecondary, 
              marginBottom: 8 
            }}>
              {stat.label}
            </h3>
            <p style={{ 
              fontSize: 24, 
              fontWeight: 700, 
              color: stat.color,
              marginBottom: 4
            }}>
              {dashboardData?.[stat.key] || 0}
            </p>
            <p style={{ 
              fontSize: 12, 
              color: theme.textSecondary 
            }}>
              {stat.description}
            </p>
          </div>
        ))}
        
        {/* Station-specific stats */}
        {stationStatsCards.map((stat, index) => (
          <div 
            key={stat.key}
            style={{ 
              backgroundColor: theme.cardBackground, 
              borderRadius: '12px', 
              padding: '20px', 
              textAlign: 'center', 
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)', 
              border: `1px solid ${theme.border}`,
              transition: 'all 0.3s ease',
              animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`
            }}
          >
            <h3 style={{ 
              fontSize: 14, 
              fontWeight: 500, 
              color: theme.textSecondary, 
              marginBottom: 8 
            }}>
              {stat.label}
            </h3>
            <p style={{ 
              fontSize: 24, 
              fontWeight: 700, 
              color: stat.color,
              marginBottom: 4
            }}>
              {stat.value}
            </p>
            <p style={{ 
              fontSize: 12, 
              color: theme.textSecondary 
            }}>
              {stat.description}
            </p>
          </div>
        ))}
      </div>

      {/* Grid Layout cho các chart */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', 
        gap: '24px', 
        marginTop: '32px' 
      }}>
        
        {/* Doanh thu và Người dùng theo thời gian */}
        <div style={{ 
          gridColumn: 'span 2', 
          backgroundColor: theme.cardBackground, 
          borderRadius: '12px', 
          padding: '24px', 
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)', 
          border: `1px solid ${theme.border}`,
          transition: 'all 0.3s ease'
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16, color: theme.textPrimary }}>
            Doanh thu & Người dùng theo thời gian
          </h2>
          <ChartContainer config={{}}>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={generateTimeSeriesData()}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.gridStroke} />
                <XAxis dataKey="name" stroke={theme.textSecondary} />
                <YAxis yAxisId="left" stroke={theme.textSecondary} />
                <YAxis yAxisId="right" orientation="right" stroke={theme.textSecondary} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme.tooltipBg,
                    border: `1px solid ${theme.tooltipBorder}`,
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    color: theme.textPrimary
                  }}
                  formatter={(value, name) => [
                    name === 'revenue' ? `${(value / 1000000).toFixed(1)}M VNĐ` : value,
                    name === 'revenue' ? 'Doanh thu' : name === 'users' ? 'Người dùng' : 'Tăng trưởng'
                  ]}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="revenue" name="Doanh thu" fill="#3b82f6" />
                <Line yAxisId="right" type="monotone" dataKey="users" name="Người dùng" stroke="#ef4444" strokeWidth={3} />
                <Line yAxisId="right" type="monotone" dataKey="growth" name="Tăng trưởng (%)" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Hiệu suất trạm đổi pin */}
        <div style={{ 
          backgroundColor: theme.cardBackground, 
          borderRadius: '12px', 
          padding: '24px', 
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)', 
          border: `1px solid ${theme.border}`,
          transition: 'all 0.3s ease'
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16, color: theme.textPrimary }}>
            Hiệu suất trạm đổi pin
          </h2>
          <ChartContainer config={{}}>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={generateStationPerformanceData()}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.gridStroke} />
                <XAxis dataKey="station" stroke={theme.textSecondary} />
                <YAxis yAxisId="left" stroke={theme.textSecondary} />
                <YAxis yAxisId="right" orientation="right" stroke={theme.textSecondary} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme.tooltipBg,
                    border: `1px solid ${theme.tooltipBorder}`,
                    borderRadius: '8px',
                    color: theme.textPrimary
                  }}
                  formatter={(value, name) => [
                    name === 'revenue' ? `${(value / 1000000).toFixed(1)}M VNĐ` :
                    name === 'efficiency' ? `${value}%` : value,
                    name === 'efficiency' ? 'Hiệu suất' :
                    name === 'users' ? 'Người dùng' :
                    name === 'revenue' ? 'Doanh thu' : 'Lượt đổi'
                  ]}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="efficiency" name="Hiệu suất (%)" fill="#22c55e" />
                <Bar yAxisId="left" dataKey="users" name="Người dùng" fill="#3b82f6" />
                <Line yAxisId="right" type="monotone" dataKey="swaps" name="Lượt đổi" stroke="#f97316" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Phân bố người dùng theo trạm */}
        <div style={{ 
          backgroundColor: theme.cardBackground, 
          borderRadius: '12px', 
          padding: '24px', 
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)', 
          border: `1px solid ${theme.border}`,
          transition: 'all 0.3s ease'
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16, color: theme.textPrimary }}>
            Phân bố người dùng theo trạm
          </h2>
          <ChartContainer config={{}}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={generateStationPerformanceData().slice(0, 6)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ station, users }) => `${station}: ${users}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="users"
                >
                  {generateStationPerformanceData().slice(0, 6).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme.tooltipBg,
                    border: `1px solid ${theme.tooltipBorder}`,
                    borderRadius: '8px',
                    color: theme.textPrimary
                  }}
                  formatter={(value, name, props) => [
                    `${value} người dùng`,
                    props.payload.station
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}