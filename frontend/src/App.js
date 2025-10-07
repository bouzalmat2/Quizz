import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import DashboardTeacher from './components/TeacherDashboard';
import DashboardStudent from './components/StudentDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard/teacher" element={<DashboardTeacher />} />
        <Route path="/dashboard/student" element={<DashboardStudent />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
