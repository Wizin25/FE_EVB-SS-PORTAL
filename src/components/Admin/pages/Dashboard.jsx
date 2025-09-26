// Dashboard.jsx
import { ChartContainer } from "../../lightswind/chart";

import { useState } from "react";
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

// Dữ liệu doanh thu và lượt đổi pin
const revenueSwapData = [
  { name: 'T1', revenue: 45000000, swaps: 1240, growth: 12 },
  { name: 'T2', revenue: 52000000, swaps: 1390, growth: 15 },
  { name: 'T3', revenue: 48000000, swaps: 1180, growth: -8 },
  { name: 'T4', revenue: 61000000, swaps: 1650, growth: 27 },
  { name: 'T5', revenue: 58000000, swaps: 1520, growth: 18 },
  { name: 'T6', revenue: 67000000, swaps: 1820, growth: 22 },
  { name: 'T7', revenue: 71000000, swaps: 1950, growth: 25 },
];

// Dữ liệu tần suất đổi pin theo ngày trong tuần
const weeklyFrequencyData = [
  { day: 'T2', frequency: 180, avgTime: 3.2 },
  { day: 'T3', frequency: 165, avgTime: 3.5 },
  { day: 'T4', frequency: 190, avgTime: 3.1 },
  { day: 'T5', frequency: 220, avgTime: 2.8 },
  { day: 'T6', frequency: 280, avgTime: 2.5 },
  { day: 'T7', frequency: 310, avgTime: 2.3 },
  { day: 'CN', frequency: 250, avgTime: 2.7 },
];

// Dữ liệu giờ cao điểm
const peakHoursData = [
  { hour: '6h', swaps: 45, stations: 12 },
  { hour: '7h', swaps: 120, stations: 18 },
  { hour: '8h', swaps: 180, stations: 22 },
  { hour: '9h', swaps: 95, stations: 15 },
  { hour: '10h', swaps: 70, stations: 12 },
  { hour: '11h', swaps: 85, stations: 14 },
  { hour: '12h', swaps: 140, stations: 20 },
  { hour: '13h', swaps: 110, stations: 16 },
  { hour: '14h', swaps: 90, stations: 13 },
  { hour: '15h', swaps: 75, stations: 12 },
  { hour: '16h', swaps: 85, stations: 14 },
  { hour: '17h', swaps: 160, stations: 21 },
  { hour: '18h', swaps: 200, stations: 25 },
  { hour: '19h', swaps: 185, stations: 23 },
  { hour: '20h', swaps: 135, stations: 18 },
  { hour: '21h', swaps: 95, stations: 14 },
  { hour: '22h', swaps: 60, stations: 10 },
  { hour: '23h', swaps: 35, stations: 8 },
];

// Dữ liệu phân bố người dùng
const userDistributionData = [
  { name: 'Người dùng thường xuyên', value: 45, count: 2340 },
  { name: 'Người dùng thỉnh thoảng', value: 30, count: 1560 },
  { name: 'Người dùng mới', value: 15, count: 780 },
  { name: 'Người dùng VIP', value: 8, count: 416 },
  { name: 'Tài khoản doanh nghiệp', value: 2, count: 104 },
];

// Dữ liệu hiệu suất trạm
const stationPerformanceData = [
  { station: 'Trạm A', efficiency: 95, downtime: 2.1, swaps: 450 },
  { station: 'Trạm B', efficiency: 88, downtime: 4.2, swaps: 380 },
  { station: 'Trạm C', efficiency: 92, downtime: 3.1, swaps: 420 },
  { station: 'Trạm D', efficiency: 97, downtime: 1.5, swaps: 480 },
  { station: 'Trạm E', efficiency: 85, downtime: 5.8, swaps: 340 },
  { station: 'Trạm F', efficiency: 91, downtime: 3.8, swaps: 410 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function DashboardPage() {
  // Remove dark mode state and toggle function
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

      {/* Thống kê tổng quan */}
      <div style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div style={{ 
          backgroundColor: theme.cardBackground, 
          borderRadius: '12px', 
          padding: '20px', 
          textAlign: 'center', 
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)', 
          border: `1px solid ${theme.border}`,
          transition: 'all 0.3s ease'
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 500, color: theme.textSecondary, marginBottom: 8 }}>Tổng doanh thu tháng</h3>
          <p style={{ fontSize: 24, fontWeight: 700, color: theme.textPrimary }}>71M VNĐ</p>
          <p style={{ fontSize: 12, color: '#10b981' }}>↗ +25% so với tháng trước</p>
        </div>
        <div style={{ 
          backgroundColor: theme.cardBackground, 
          borderRadius: '12px', 
          padding: '20px', 
          textAlign: 'center', 
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)', 
          border: `1px solid ${theme.border}`,
          transition: 'all 0.3s ease'
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 500, color: theme.textSecondary, marginBottom: 8 }}>Tổng lượt đổi pin</h3>
          <p style={{ fontSize: 24, fontWeight: 700, color: theme.textPrimary }}>1,950</p>
          <p style={{ fontSize: 12, color: '#10b981' }}>↗ +7.2% so với tháng trước</p>
        </div>
        <div style={{ 
          backgroundColor: theme.cardBackground, 
          borderRadius: '12px', 
          padding: '20px', 
          textAlign: 'center', 
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)', 
          border: `1px solid ${theme.border}`,
          transition: 'all 0.3s ease'
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 500, color: theme.textSecondary, marginBottom: 8 }}>Tổng người dùng</h3>
          <p style={{ fontSize: 24, fontWeight: 700, color: theme.textPrimary }}>5,200</p>
          <p style={{ fontSize: 12, color: '#10b981' }}>↗ +12.3% người dùng mới</p>
        </div>
        <div style={{ 
          backgroundColor: theme.cardBackground, 
          borderRadius: '12px', 
          padding: '20px', 
          textAlign: 'center', 
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)', 
          border: `1px solid ${theme.border}`,
          transition: 'all 0.3s ease'
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 500, color: theme.textSecondary, marginBottom: 8 }}>Hiệu suất TB</h3>
          <p style={{ fontSize: 24, fontWeight: 700, color: theme.textPrimary }}>91.3%</p>
          <p style={{ fontSize: 12, color: '#f59e0b' }}>↗ +2.1% cải thiện</p>
        </div>
      </div>
      {/* Grid Layout cho các chart */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '24px', marginTop: '20px' }}>
        {/* Doanh thu và Số lượt đổi pin - Liên kết chặt chẽ */}
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
            Doanh thu & Lượt đổi pin theo tháng
          </h2>
          <ChartContainer config={{}}>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={revenueSwapData}>
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
                    name === 'revenue' ? 'Doanh thu' : name === 'swaps' ? 'Lượt đổi pin' : 'Tăng trưởng'
                  ]}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="revenue" name="Doanh thu" fill="#3b82f6" />
                <Line yAxisId="right" type="monotone" dataKey="swaps" name="Lượt đổi pin" stroke="#ef4444" strokeWidth={3} />
                <Line yAxisId="right" type="monotone" dataKey="growth" name="Tăng trưởng (%)" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Tần suất đổi pin theo ngày */}
        <div style={{ 
          backgroundColor: theme.cardBackground, 
          borderRadius: '12px', 
          padding: '24px', 
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)', 
          border: `1px solid ${theme.border}`,
          transition: 'all 0.3s ease'
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16, color: theme.textPrimary }}>
            Tần suất đổi pin theo ngày
          </h2>
          <ChartContainer config={{}}>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={weeklyFrequencyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.gridStroke} />
                <XAxis dataKey="day" stroke={theme.textSecondary} />
                <YAxis stroke={theme.textSecondary} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme.tooltipBg,
                    border: `1px solid ${theme.tooltipBorder}`,
                    borderRadius: '8px',
                    color: theme.textPrimary
                  }}
                  formatter={(value, name) => [
                    value,
                    name === 'frequency' ? 'Số lượt đổi' : 'Thời gian TB (phút)'
                  ]}
                />
                <Legend />
                <Area type="monotone" dataKey="frequency" name="Số lượt đổi" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                <Line type="monotone" dataKey="avgTime" name="Thời gian TB" stroke="#f59e0b" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Giờ cao điểm */}
        <div style={{ 
          backgroundColor: theme.cardBackground, 
          borderRadius: '12px', 
          padding: '24px', 
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)', 
          border: `1px solid ${theme.border}`,
          transition: 'all 0.3s ease'
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16, color: theme.textPrimary }}>
            Phân tích giờ cao điểm
          </h2>
          <ChartContainer config={{}}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={peakHoursData}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.gridStroke} />
                <XAxis dataKey="hour" stroke={theme.textSecondary} />
                <YAxis stroke={theme.textSecondary} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme.tooltipBg,
                    border: `1px solid ${theme.tooltipBorder}`,
                    borderRadius: '8px',
                    color: theme.textPrimary
                  }}
                  formatter={(value, name) => [
                    value,
                    name === 'swaps' ? 'Lượt đổi pin' : 'Trạm hoạt động'
                  ]}
                />
                <Legend />
                <Bar dataKey="swaps" name="Lượt đổi pin" fill="#06b6d4" />
                <Bar dataKey="stations" name="Trạm hoạt động" fill="#84cc16" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Pie Chart - Phân bố người dùng */}
        <div style={{ 
          backgroundColor: theme.cardBackground, 
          borderRadius: '12px', 
          padding: '24px', 
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)', 
          border: `1px solid ${theme.border}`,
          transition: 'all 0.3s ease'
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16, color: theme.textPrimary }}>
            Phân bố loại người dùng
          </h2>
          <ChartContainer config={{}}>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={userDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent, count }) => `${name}: ${(percent * 100).toFixed(0)}% (${count})`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {userDistributionData.map((entry, index) => (
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
                    `${value}% (${props.payload.count} người)`,
                    'Tỷ lệ'
                  ]}
                />
                <Legend />
              </PieChart>
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
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={stationPerformanceData}>
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
                    name === 'efficiency' ? `${value}%` :
                      name === 'downtime' ? `${value}h` : value,
                    name === 'efficiency' ? 'Hiệu suất' :
                      name === 'downtime' ? 'Thời gian ngừng' : 'Lượt đổi'
                  ]}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="efficiency" name="Hiệu suất (%)" fill="#22c55e" />
                <Line yAxisId="right" type="monotone" dataKey="swaps" name="Lượt đổi" stroke="#f97316" strokeWidth={2} />
                <Bar yAxisId="right" dataKey="downtime" name="Thời gian ngừng (h)" fill="#ef4444" opacity={0.7} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </div>


    </div>
  );
}