// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import "./i18n";

// Pages
import LoginPage from "./pages/LoginPage";
import StudentDashboard from "./pages/student/StudentDashboard";
import BookReader from "./pages/student/BookReader";
import DailyTest from "./pages/student/DailyTest";
import FinalTest from "./pages/student/FinalTest";
import Leaderboard from "./pages/student/Leaderboard";
import Contests from "./pages/student/Contests";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminBooks from "./pages/admin/AdminBooks";
import AdminTests from "./pages/admin/AdminTests";
import AdminContests from "./pages/admin/AdminContests";
import AdminLeaderboard from "./pages/admin/AdminLeaderboard";

function PrivateRoute({ children, role }) {
  const { currentUser, userRole } = useAuth();
  if (!currentUser) return <Navigate to="/login" />;
  if (role && userRole !== role) return <Navigate to="/" />;
  return children;
}

function HomeRedirect() {
  const { userRole } = useAuth();
  if (userRole === "admin") return <Navigate to="/admin" />;
  return <Navigate to="/dashboard" />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<PrivateRoute><HomeRedirect /></PrivateRoute>} />

          {/* Student routes */}
          <Route path="/dashboard" element={<PrivateRoute role="student"><StudentDashboard /></PrivateRoute>} />
          <Route path="/book/:bookId" element={<PrivateRoute role="student"><BookReader /></PrivateRoute>} />
          <Route path="/test/daily/:bookId/:chapterId" element={<PrivateRoute role="student"><DailyTest /></PrivateRoute>} />
          <Route path="/test/final/:testId" element={<PrivateRoute role="student"><FinalTest /></PrivateRoute>} />
          <Route path="/leaderboard" element={<PrivateRoute role="student"><Leaderboard /></PrivateRoute>} />
          <Route path="/contests" element={<PrivateRoute role="student"><Contests /></PrivateRoute>} />

          {/* Admin routes */}
          <Route path="/admin" element={<PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>} />
          <Route path="/admin/users" element={<PrivateRoute role="admin"><AdminUsers /></PrivateRoute>} />
          <Route path="/admin/books" element={<PrivateRoute role="admin"><AdminBooks /></PrivateRoute>} />
          <Route path="/admin/tests" element={<PrivateRoute role="admin"><AdminTests /></PrivateRoute>} />
          <Route path="/admin/contests" element={<PrivateRoute role="admin"><AdminContests /></PrivateRoute>} />
          <Route path="/admin/leaderboard" element={<PrivateRoute role="admin"><AdminLeaderboard /></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
