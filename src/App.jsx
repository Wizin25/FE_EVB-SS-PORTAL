// App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SignIn from './components/Log/signin';
import SignUp from './components/Log/signup';

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<SignIn />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;