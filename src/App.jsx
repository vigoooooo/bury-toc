import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import ExtractSecret from './pages/ExtractSecret';
import ProfileSettings from './pages/ProfileSettings';
import CreateNewSecret from './pages/CreateNewSecret';
import MySecrets from './pages/MySecrets';
import Login from './pages/Login';
import Register from './pages/Register';
import ViewSecret from './pages/ViewSecret';

// 认证中间件
const RequireAuth = () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return <Outlet />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/extract-secret" element={<ExtractSecret />} />
        <Route path="/view-secret" element={<ViewSecret />} />
        <Route element={<RequireAuth />}>
          <Route path="/" element={<Navigate to="/my-secrets" />} />
          <Route path="/profile" element={<ProfileSettings />} />
          <Route path="/new-secret" element={<CreateNewSecret />} />
          <Route path="/my-secrets" element={<MySecrets />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
