// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./features/auth/authContext";
import { ToastProvider } from "./features/toast/useToast";
import Toast from "./components/ui/Toast";
import ProtectedRoute from "./components/routing/ProtectedRoute";
import RoleRoute from "./components/routing/RoleRoute";
import AdminLayout from "./components/layout/AdminLayout";
import Login from "./pages/Login";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import Users from "./pages/Admin/User";
import Schools from "./pages/Admin/Schools";
import Students from "./pages/Admin/Students";
import Parents from "./pages/Admin/Parents";
import Siblings from "./pages/Admin/Siblings";
import Events from "./pages/Admin/Events";
import EventDetails from "./pages/Admin/EventDetails";
import ParentDashboard from "./pages/Parent/ParentDashboard";
import QRCodes from "./pages/Admin/QRCodes";
import QrCodeDetails from "./pages/Admin/QrCodeDetails";
import Notifications from "./pages/Admin/Notifications";
import AttendanceOverview from "./pages/Admin/AttendanceOverview";
import AttendanceDetails from "./pages/Admin/AttendanceDetails";
import Photos from "./pages/Admin/Photos";
import PhotoDetails from "./pages/Admin/PhotoDetails";
import Unauthorized from "./pages/Unauthorized";
import { routes } from "./constants/routes";
import PurchaseHistory from "./pages/Parent/PurchaseHistory";

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Redirect root to login */}
            <Route path="/" element={<Navigate to={routes.LOGIN} replace />} />

            {/* Public */}
            <Route path={routes.LOGIN} element={<Login />} />

            {/* Protected */}
            <Route element={<ProtectedRoute redirectTo={routes.LOGIN} />}>
              {/* Admin-only */}
              <Route element={<RoleRoute requiredRole="admin" />}>
                <Route path={routes.ADMIN_DASHBOARD} element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />

                  <Route path="users" element={<Users />} />
                  <Route path="parents" element={<Parents />} />
                  <Route path="siblings" element={<Siblings />} />
                  <Route path="events" element={<Events />} />
                  <Route path="events/:id" element={<EventDetails />} />
                  <Route path="schools" element={<Schools />} />
                  <Route path="students" element={<Students />} />
                  <Route path="notifications" element={<Notifications />} />
                  <Route path="qr-codes" element={<QRCodes />} />
                  <Route path="qr-codes/:eventId" element={<QrCodeDetails />} />
                  <Route path="attendance" element={<AttendanceOverview />} />
                  <Route path="purchases" element={<PurchaseHistory />} />
                  <Route path={routes.ADMIN_PHOTOS} element={<Photos />} />
                  <Route
                    path={routes.ADMIN_PHOTOS_DETAILS}
                    element={<PhotoDetails />}
                  />

                  <Route
                    path="attendance/:eventId"
                    element={<AttendanceDetails />}
                  />
                </Route>
              </Route>

              {/* Parent-only */}
              <Route element={<RoleRoute requiredRole="parent" />}>
                <Route
                  path={routes.PARENT_DASHBOARD}
                  element={<ParentDashboard />}
                />
              </Route>
            </Route>

            {/* Unauthorized */}
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to={routes.LOGIN} replace />} />
          </Routes>
        </BrowserRouter>
        <Toast />
      </ToastProvider>
    </AuthProvider>
  );
}
