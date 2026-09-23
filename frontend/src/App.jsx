import React from "react";
import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/shared/ProtectedRoute";

import Login from "./pages/auth/Login";
import NotFound from "./pages/NotFound";
import Home from "./pages/public/Home";
import RequestAccess from "./pages/public/RequestAccess";

import Dashboard from "./pages/doctor/Dashboard";
import Diagnosis from "./pages/doctor/Diagnosis";
import DiagnosisResult from "./pages/doctor/DiagnosisResult";
import NewPatient from "./pages/doctor/NewPatient";
import PatientDetail from "./pages/doctor/PatientDetail";
import Patients from "./pages/doctor/Patients";
import Profile from "./pages/doctor/Profile";
import Reports from "./pages/doctor/Reports";

import AIModel from "./pages/admin/AIModel";
import AccessRequests from "./pages/admin/AccessRequests";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageDoctors from "./pages/admin/ManageDoctors";
import SystemLogs from "./pages/admin/SystemLogs";

const doctorRoute = (element) => (
  <ProtectedRoute role="doctor">{element}</ProtectedRoute>
);
const adminRoute = (element) => <ProtectedRoute role="admin">{element}</ProtectedRoute>;

function App() {
  // basename comes from Vite's base so the router and the asset paths cannot
  // drift: on GitHub Pages both are /dr-xai-platform/, in dev both are /.
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: "12px",
              background: "#1A1A1A",
              color: "#fff",
              fontSize: "14px",
            },
          }}
        />
        <Routes>
          {/* Public. "/" used to redirect straight to /login, which gave the
              platform no front door and nowhere to explain who it is for. */}
          <Route path="/" element={<Home />} />
          <Route path="/request-access" element={<RequestAccess />} />
          <Route path="/login" element={<Login />} />

          <Route path="/dashboard" element={doctorRoute(<Dashboard />)} />
          <Route path="/patients" element={doctorRoute(<Patients />)} />
          <Route path="/patients/new" element={doctorRoute(<NewPatient />)} />
          <Route path="/patients/:id" element={doctorRoute(<PatientDetail />)} />
          <Route path="/patients/:id/edit" element={doctorRoute(<NewPatient />)} />
          <Route path="/diagnosis/new" element={doctorRoute(<Diagnosis />)} />
          <Route path="/diagnosis/:id" element={doctorRoute(<DiagnosisResult />)} />
          <Route path="/reports" element={doctorRoute(<Reports />)} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute role="any">
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route path="/admin" element={adminRoute(<AdminDashboard />)} />
          <Route path="/admin/doctors" element={adminRoute(<ManageDoctors />)} />
          <Route path="/admin/requests" element={adminRoute(<AccessRequests />)} />
          <Route path="/admin/logs" element={adminRoute(<SystemLogs />)} />
          <Route path="/admin/ai-model" element={adminRoute(<AIModel />)} />

          {/* A real 404, rather than redirecting to /login and making a typo
              look like an expired session. */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
