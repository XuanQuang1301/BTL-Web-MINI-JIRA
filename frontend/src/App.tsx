import { Routes, Route, Navigate } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import Projects from './pages/Projects'; 
import ProjectDetail from './pages/ProjectDetail';
import MyTasks from './pages/MyTasks';
import Profile from './pages/Profile';
import UserManagement from './pages/UserManagement'; 

function App() {
    const isAuthenticated = !!localStorage.getItem('token');

    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
                path="/" 
                element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} 
            />
            <Route element={<Layout />}>
                <Route path="/dashboard" element={<Dashboard />} /> 
                <Route path="/projects" element={<Projects />} /> 
                <Route path="/projects/:id" element={<ProjectDetail />} /> 
                <Route path="/tasks" element={<MyTasks />} /> 
                <Route path="/profile" element={<Profile />} />
                <Route path="/users" element={<UserManagement />} /> 
            </Route>
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
}

export default App;