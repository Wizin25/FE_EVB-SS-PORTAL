// App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SignIn from './components/Log/signin';
import SignUp from './components/Log/signup';
import ForgotPassword from './components/Log/forgot';
import AdminLayout from './components/Admin/Layout.jsx';
import DashboardPage from './components/Admin/pages/Dashboard.jsx';
import FormPage from './components/Admin/pages/Form.jsx';
import CalendarPage from './components/Admin/pages/Calendar.jsx';
import StationPage from './components/Admin/pages/Station.jsx';
import HomePage from './components/Home/homePage.jsx';
import StaffPage from './components/Admin/pages/Staff.jsx';
import ControllerPage from './components/Admin/pages/Controller.jsx';
import Profile from './components/Profile/Profile.jsx';
import BatteryManagementPage from './components/Admin/pages/Battery.jsx';

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<SignIn />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot" element={<ForgotPassword />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/staff" element={<StaffPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="form" element={<FormPage />} />
            <Route path="battery" element={<BatteryManagementPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="station" element={<StationPage />} />
            <Route path="controller" element={<ControllerPage />} />
          </Route>
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;