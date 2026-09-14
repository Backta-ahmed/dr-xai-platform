import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/shared/ProtectedRoute";

// Auth
import Login from "./pages/auth/Login";

// Doctor
import Dashboard from "./pages/doctor/Dashboard";
import Patients from "./pages/doctor/Patients";
import NewPatient from "./pages/doctor/NewPatient";
import PatientDetail from "./pages/doctor/PatientDetail";
import Diagnosis from "./pages/doctor/Diagnosis";
import DiagnosisResult from "./pages/doctor/DiagnosisResult";
import Reports from "./pages/doctor/Reports";
import Profile from "./pages/doctor/Profile";

// Admin
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageDoctors from "./pages/admin/ManageDoctors";
import SystemLogs from "./pages/admin/SystemLogs";
import AIModel from "./pages/admin/AIModel";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { borderRadius: "12px", background: "#1A1A1A", color: "#fff", fontSize: "14px" },
          }}
        />
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Doctor Routes */}
          <Route path="/dashboard" element={<ProtectedRoute role="doctor"><Dashboard /></ProtectedRoute>} />
          <Route path="/patients" element={<ProtectedRoute role="doctor"><Patients /></ProtectedRoute>} />
          <Route path="/patients/new" element={<ProtectedRoute role="doctor"><NewPatient /></ProtectedRoute>} />
          <Route path="/patients/:id" element={<ProtectedRoute role="doctor"><PatientDetail /></ProtectedRoute>} />
          <Route path="/patients/:id/edit" element={<ProtectedRoute role="doctor"><NewPatient /></ProtectedRoute>} />
          <Route path="/diagnosis/new" element={<ProtectedRoute role="doctor"><Diagnosis /></ProtectedRoute>} />
          <Route path="/diagnosis/:id" element={<ProtectedRoute role="doctor"><DiagnosisResult /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute role="doctor"><Reports /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute role="any"><Profile /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/doctors" element={<ProtectedRoute role="admin"><ManageDoctors /></ProtectedRoute>} />
          <Route path="/admin/logs" element={<ProtectedRoute role="admin"><SystemLogs /></ProtectedRoute>} />
          <Route path="/admin/ai-model" element={<ProtectedRoute role="admin"><AIModel /></ProtectedRoute>} />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
