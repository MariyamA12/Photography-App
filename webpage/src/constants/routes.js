// src/constants/routes.js
export const routes = {
  LOGIN: "/login",
  ADMIN_DASHBOARD: "/admin",
  PARENT_DASHBOARD: "/parent",

  // Admin sub-routes
  ADMIN_USERS: "/admin/users",
  ADMIN_PARENTS: "/admin/parents",
  ADMIN_SIBLINGS: "/admin/siblings",
  ADMIN_SCHOOLS: "/admin/schools",
  ADMIN_STUDENTS: "/admin/students",
  ADMIN_QR_CODES: "/admin/qr-codes",
  ADMIN_QR_CODE_DETAILS: "/admin/qr-codes/:eventId",
  ADMIN_ATTENDANCE: "/admin/attendance",
  ADMIN_ATTENDANCE_DETAILS: "/admin/attendance/:eventId",
  ADMIN_PURCHASES: "purchases",
  ADMIN_NOTIFICATIONS: "/admin/notifications",
  ADMIN_PHOTOS:        "/admin/photos",
  ADMIN_PHOTOS_DETAILS: "/admin/photos/:eventId",

  // Events
  ADMIN_EVENTS: "/admin/events",
  ADMIN_EVENT_DETAILS: "/admin/events/:id",
};
