// src/components/layout/AdminLayout.jsx
import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/useAuth';
import { useToast } from '../../features/toast/useToast';
import {
  HiOutlineViewGrid,
  HiOutlineUserAdd,
  HiOutlineCalendar,
  HiOutlineUserGroup,
  HiOutlineUser,
  HiOutlineUsers,
  HiOutlinePhotograph,
  HiOutlineQrcode,
  HiOutlineClipboardList,
  HiOutlineShoppingCart,
  HiOutlineBell,
  HiOutlineLogout,
} from 'react-icons/hi';
import { routes } from '../../constants/routes';

const sidebarConfig = [
  {
    title: null,
    items: [
      { name: 'Dashboard', to: routes.ADMIN_DASHBOARD, Icon: HiOutlineViewGrid },
    ],
  },
  {
    title: 'Events',
    items: [
      { name: 'All Events', to: routes.ADMIN_EVENTS, Icon: HiOutlineCalendar },
    ],
  },
  {
    title: 'People',
    items: [
      { name: 'Users', to: routes.ADMIN_USERS, Icon: HiOutlineUserAdd },
      { name: 'Students', to: routes.ADMIN_STUDENTS, Icon: HiOutlineUserGroup },
      { name: 'Parents', to: routes.ADMIN_PARENTS, Icon: HiOutlineUser },
      { name: 'Siblings', to: routes.ADMIN_SIBLINGS, Icon: HiOutlineUsers },
    ],
  },
  {
    title: 'School',
    items: [
      { name: 'Schools', to: routes.ADMIN_SCHOOLS, Icon: HiOutlineClipboardList },
    ],
  },
  {
    title: 'Media',
    items: [
      { name: 'Photos', to: routes.ADMIN_PHOTOS, Icon: HiOutlinePhotograph },
      { name: 'QR Codes', to: routes.ADMIN_QR_CODES, Icon: HiOutlineQrcode },
    ],
  },
  {
    title: 'Operations',
    items: [
      { name: 'Attendance', to: routes.ADMIN_ATTENDANCE, Icon: HiOutlineClipboardList },
      { name: 'Purchases', to: routes.ADMIN_PURCHASES, Icon: HiOutlineShoppingCart },
      { name: 'Notifications', to: routes.ADMIN_NOTIFICATIONS, Icon: HiOutlineBell },
    ],
  },
];

export default function AdminLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Normalize a path (remove trailing slash)
  const normalizePath = (p) => (typeof p === 'string' ? p.replace(/\/+$/, '') : '');
  const currentPath = normalizePath(pathname);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      toast('Logged out successfully', 'success');
      navigate(routes.LOGIN, { replace: true });
    } catch {
      toast('Logout failed', 'error');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="flex h-screen">
      <aside className="flex flex-col w-64 bg-white shadow-md overflow-y-auto">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">Admin</h2>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-6">
          {sidebarConfig.map(({ title, items }) => (
            <div key={title || 'root'}>
              {title && (
                <p className="px-3 text-xs font-semibold text-gray-500 uppercase">
                  {title}
                </p>
              )}
              <div className="mt-2 space-y-1">
                {items.map(({ name, to, Icon }) => {
                  const itemPath = normalizePath(to);
                  // Dashboard only active on exact match, others active on sub-routes
                  const isDashboard = to === routes.ADMIN_DASHBOARD;
                  const isActive = isDashboard
                    ? currentPath === itemPath
                    : currentPath === itemPath || currentPath.startsWith(itemPath + '/');
                  return (
                    <Link
                      key={name}
                      to={to}
                      className={`flex items-center px-3 py-2 rounded ${
                        isActive
                          ? 'bg-primary text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      <span>{name}</span>
                    </Link>
                  );
                })}
              </div>
              <hr className="border-gray-200 my-4" />
            </div>
          ))}
        </nav>
        <div className="px-4 pb-4 border-t">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center text-red-500 hover:text-red-700 focus:outline-none"
          >
            <HiOutlineLogout className="w-5 h-5 mr-2" />
            {isLoggingOut ? 'Logging out…' : 'Logout'}
          </button>
        </div>
      </aside>
      <main className="flex-grow bg-gray-50 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
