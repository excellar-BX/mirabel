import { lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import CheckIn from "./pages/CheckIn";
import Login from "./pages/Login";
import AdminLayout from "./components/AdminLayout";
import { AuthProvider, RequireAdmin } from "./lib/auth";
import { ThemeProvider } from "./lib/theme";

// Admin pages are split out so the check-in desk loads fast.
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Register = lazy(() => import("./pages/Register"));
const People = lazy(() => import("./pages/People"));
const Logs = lazy(() => import("./pages/Logs"));

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<CheckIn />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <AdminLayout />
                </RequireAdmin>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="people" element={<People />} />
              <Route path="register" element={<Register />} />
              <Route path="logs" element={<Logs />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
