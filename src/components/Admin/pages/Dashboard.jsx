// components/Admin/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../../lightswind/chart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  LineChart,
  Line
} from 'recharts';
import { authAPI } from '../../services/authAPI';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [filters, setFilters] = useState({
    stationId: '',
    startDate: '',
    endDate: ''
  });
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Fetch initial data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async (filterData = new FormData()) => {
    try {
      setLoading(true);
      const response = await authAPI.showDashboard(filterData);
      // Handle the actual API response structure - data is in response.data.data
      const data = response.data?.data || response.data || response;
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // New function to load summary data
  const loadSummaryData = async () => {
    try {
      setSummaryLoading(true);
      const response = await authAPI.getDashboardSummary();
      setSummaryData(response);
      setShowSummary(true);
    } catch (error) {
      console.error('Failed to load summary data:', error);
      alert('Failed to load summary data: ' + error.message);
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleApplyFilters = async () => {
    try {
      const formData = new FormData();
      if (filters.stationId) formData.append('StationId', filters.stationId);
      if (filters.startDate) formData.append('StartDate', filters.startDate);
      if (filters.endDate) formData.append('EndDate', filters.endDate);

      await loadDashboardData(formData);
    } catch (error) {
      console.error('Failed to apply filters:', error);
    }
  };

  const handleResetFilters = () => {
    setFilters({
      stationId: '',
      startDate: '',
      endDate: ''
    });
    loadDashboardData(new FormData());
    setShowSummary(false);
    setSummaryData(null);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Prepare chart data from actual API response
  const getRevenueOverTimeData = () => {
    if (!dashboardData || !dashboardData.revenueOverTime) return [];
    
    return dashboardData.revenueOverTime.map(item => ({
      date: formatDate(item.date),
      revenue: item.revenue,
      fullDate: item.date
    }));
  };

  const getUserGrowthData = () => {
    if (!dashboardData || !dashboardData.userGrowthChart) return [];
    
    return dashboardData.userGrowthChart.map(item => ({
      date: formatDate(item.date),
      newUsers: item.newUsers,
      totalUsers: item.totalUsers,
      fullDate: item.date
    }));
  };

  const getTopStationsData = () => {
    if (!dashboardData || !dashboardData.topStations) return [];
    
    return dashboardData.topStations.map(station => ({
      name: station.stationName,
      revenue: station.revenue,
      orders: station.totalorders,
      transactions: station.totalTransactions
    }));
  };

  const getRevenueByServiceTypeData = () => {
    if (!dashboardData || !dashboardData.revenueByServiceType) return [];
    
    const data = dashboardData.revenueByServiceType.map(item => ({
      name: item.serviceType,
      revenue: item.revenue,
      orders: item.orders,
      transactions: item.transactions
    }));
    
    // Lọc bỏ các phần có doanh thu = 0
    return data.filter(item => item.revenue > 0);
  };

  const getBatteryStatusSummaryData = () => {
    if (!dashboardData || !dashboardData.batteryStatusSummary) return [];
    
    const { batteryStatusSummary } = dashboardData;
    const data = [
      { name: 'Charging', value: batteryStatusSummary.charging, color: '#FFBB28' },
      { name: 'In Use', value: batteryStatusSummary.inUse, color: '#0088FE' },
      { name: 'Available', value: batteryStatusSummary.available, color: '#00C49F' },
      { name: 'Decommissioned', value: batteryStatusSummary.decommissioned, color: '#FF8042' },
      { name: 'Booked', value: batteryStatusSummary.booked, color: '#8884D8' },
      { name: 'Maintenance', value: batteryStatusSummary.maintenance, color: '#82ca9d' }
    ];
    
    // Lọc bỏ các phần có giá trị 0
    return data.filter(item => item.value > 0);
  };

  const getSystemOverviewData = () => {
    if (!dashboardData) return [];
    
    const data = [
      { name: 'Stations', value: dashboardData.totalStations || 0, color: '#0088FE' },
      { name: 'Users', value: dashboardData.totalUsers || 0, color: '#00C49F' },
      { name: 'Batteries', value: dashboardData.totalBatteries || 0, color: '#FFBB28' },
      { name: 'Orders', value: dashboardData.totalorders || 0, color: '#FF8042' },
      { name: 'Transactions', value: dashboardData.totalTransactions || 0, color: '#8884D8' }
    ];
    
    // Lọc bỏ các phần có giá trị 0
    return data.filter(item => item.value > 0);
  };

  if (loading && !dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  const revenueOverTimeData = getRevenueOverTimeData();
  const userGrowthData = getUserGrowthData();
  const topStationsData = getTopStationsData();
  const revenueByServiceTypeData = getRevenueByServiceTypeData();
  const batteryStatusSummaryData = getBatteryStatusSummaryData();
  const systemOverviewData = getSystemOverviewData();

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      {/* Header */}
      <div className="flex flex-col justify-between mb-8 md:flex-row md:items-center">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="text-gray-600">
            Overview of your battery exchange system
          </p>
        </div>
        <button
          onClick={loadSummaryData}
          disabled={summaryLoading}
          className="px-4 py-2 mt-4 text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 md:mt-0"
        >
          {summaryLoading ? 'Loading Summary...' : 'View System Summary'}
        </button>
      </div>

      {/* Summary Modal */}
      {showSummary && summaryData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-4xl p-6 mx-4 bg-white rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">System Summary</h2>
              <button
                onClick={() => setShowSummary(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              <div className="p-4 text-center rounded-lg bg-blue-50">
                <div className="text-2xl font-bold text-blue-600">{summaryData.totalAccounts}</div>
                <div className="text-sm text-gray-600">Total Accounts</div>
              </div>
              <div className="p-4 text-center rounded-lg bg-green-50">
                <div className="text-2xl font-bold text-green-600">{summaryData.totalOrders}</div>
                <div className="text-sm text-gray-600">Total Orders</div>
              </div>
              <div className="p-4 text-center rounded-lg bg-yellow-50">
                <div className="text-2xl font-bold text-yellow-600">{summaryData.totalBatteries}</div>
                <div className="text-sm text-gray-600">Total Batteries</div>
              </div>
              <div className="p-4 text-center rounded-lg bg-purple-50">
                <div className="text-2xl font-bold text-purple-600">{summaryData.totalExchangeBatteries}</div>
                <div className="text-sm text-gray-600">Exchange Batteries</div>
              </div>
              <div className="p-4 text-center rounded-lg bg-indigo-50">
                <div className="text-2xl font-bold text-indigo-600">{summaryData.totalStations}</div>
                <div className="text-sm text-gray-600">Total Stations</div>
              </div>
              <div className="p-4 text-center rounded-lg bg-pink-50">
                <div className="text-2xl font-bold text-pink-600">{summaryData.totalPackages}</div>
                <div className="text-sm text-gray-600">Total Packages</div>
              </div>
              <div className="p-4 text-center rounded-lg bg-red-50">
                <div className="text-2xl font-bold text-red-600">{summaryData.totalForms}</div>
                <div className="text-sm text-gray-600">Total Forms</div>
              </div>
              <div className="p-4 text-center rounded-lg bg-teal-50">
                <div className="text-2xl font-bold text-teal-600">{summaryData.totalRatings}</div>
                <div className="text-sm text-gray-600">Total Ratings</div>
              </div>
              <div className="p-4 text-center rounded-lg bg-orange-50">
                <div className="text-2xl font-bold text-orange-600">{summaryData.totalReports}</div>
                <div className="text-sm text-gray-600">Total Reports</div>
              </div>
              <div className="p-4 text-center rounded-lg bg-cyan-50">
                <div className="text-2xl font-bold text-cyan-600">{summaryData.totalSlots}</div>
                <div className="text-sm text-gray-600">Total Slots</div>
              </div>
              <div className="p-4 text-center rounded-lg bg-lime-50">
                <div className="text-2xl font-bold text-lime-600">{summaryData.totalVehicles}</div>
                <div className="text-sm text-gray-600">Total Vehicles</div>
              </div>
              <div className="p-4 text-center rounded-lg bg-rose-50">
                <div className="text-2xl font-bold text-rose-600">{summaryData.totalBatteryReports}</div>
                <div className="text-sm text-gray-600">Battery Reports</div>
              </div>
              <div className="p-4 text-center rounded-lg bg-violet-50">
                <div className="text-2xl font-bold text-violet-600">{summaryData.totalStationSchedules}</div>
                <div className="text-sm text-gray-600">Station Schedules</div>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowSummary(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="p-6 mb-8 bg-white rounded-lg shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Filters</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {/* Station ID Filter - Changed from select to input */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Station ID
            </label>
            <input
              type="text"
              value={filters.stationId}
              onChange={(e) => handleFilterChange('stationId', e.target.value)}
              placeholder="Enter station ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Start Date */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-end space-x-2">
            <button
              onClick={handleApplyFilters}
              disabled={loading}
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Applying...' : 'Apply'}
            </button>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards - Updated to match actual API data */}
      {dashboardData && (
        <div className="grid grid-cols-2 gap-6 mb-8 md:grid-cols-3 lg:grid-cols-5">
          <div className="p-6 text-center bg-white rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{dashboardData.totalStations || 0}</div>
            <div className="mt-1 text-sm text-gray-600">Total Stations</div>
          </div>
          <div className="p-6 text-center bg-white rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-green-600">{dashboardData.totalUsers || 0}</div>
            <div className="mt-1 text-sm text-gray-600">Total Users</div>
          </div>
          <div className="p-6 text-center bg-white rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-yellow-600">{dashboardData.totalBatteries || 0}</div>
            <div className="mt-1 text-sm text-gray-600">Total Batteries</div>
          </div>
          <div className="p-6 text-center bg-white rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-purple-600">{dashboardData.totalorders || 0}</div>
            <div className="mt-1 text-sm text-gray-600">Total Orders</div>
          </div>
          <div className="p-6 text-center bg-white rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-pink-600">{dashboardData.totalRevenue?.toLocaleString() || '0'} VND</div>
            <div className="mt-1 text-sm text-gray-600">Total Revenue</div>
          </div>
        </div>
      )}

      {/* Charts Grid - Updated to use actual API data */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Revenue Over Time Chart */}
        <div className="p-6 bg-white rounded-lg shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Revenue Over Time</h3>
          <ChartContainer config={{
            revenue: { color: '#8884d8' }
          }}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueOverTimeData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue (VND)"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* User Growth Chart */}
        <div className="p-6 bg-white rounded-lg shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">User Growth</h3>
          <ChartContainer config={{
            newUsers: { color: '#82ca9d' },
            totalUsers: { color: '#8884d8' }
          }}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="newUsers"
                  name="New Users"
                  stroke="#82ca9d"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="totalUsers"
                  name="Total Users"
                  stroke="#8884d8"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Top Stations - Chỉ hiển thị khi có dữ liệu */}
        {topStationsData.length > 0 && (
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Top Stations by Revenue</h3>
            <ChartContainer config={{}}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topStationsData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar 
                    dataKey="revenue" 
                    name="Revenue (VND)"
                    fill="#0088FE"
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        )}

        {/* Revenue By Service Type */}
        <div className="p-6 bg-white rounded-lg shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Revenue By Service Type</h3>
          <ChartContainer config={{}}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revenueByServiceTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, revenue }) => `${name}: ${revenue.toLocaleString()} VND`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="revenue"
                >
                  {revenueByServiceTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Battery Status Summary */}
        <div className="p-6 bg-white rounded-lg shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Battery Status Summary</h3>
          <ChartContainer config={{}}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={batteryStatusSummaryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {batteryStatusSummaryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* System Overview */}
        <div className="p-6 bg-white rounded-lg shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">System Overview</h3>
          <ChartContainer config={{}}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={systemOverviewData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {systemOverviewData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </div>
    </div>
  );
}