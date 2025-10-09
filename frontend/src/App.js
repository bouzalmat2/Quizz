import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import DashboardTeacher from './components/TeacherDashboard';
import DashboardStudent from './components/StudentDashboard';
import TeacherQcms from './pages/TeacherQcms';
import StudentQcms from './pages/StudentQcms';
import Profile from './pages/Profile';
import QuestionBank from './pages/QuestionBank';
import MyResults from './pages/MyResults';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
  <Route path="/dashboard/teacher" element={<DashboardTeacher />} />
  <Route path="/dashboard/student" element={<DashboardStudent />} />
  <Route path="/qcms/teacher" element={<TeacherQcms />} />
  <Route path="/qcms/student" element={<StudentQcms />} />
  <Route path="/bank/questions" element={<QuestionBank />} />
  <Route path="/profile" element={<Profile />} />
  <Route path="/my-results" element={<MyResults />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
