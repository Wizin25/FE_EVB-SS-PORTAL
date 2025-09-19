// App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SignIn from './components/Log/signin';
import SignUp from './components/Log/signup';
import ForgotPassword from './components/Log/forgot';

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<SignIn />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot" element={<ForgotPassword />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;