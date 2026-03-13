import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HomeIcon, BuildingOfficeIcon, UsersIcon, CalendarIcon,
  ArrowRightOnRectangleIcon, CreditCardIcon, SparklesIcon,
  UserGroupIcon, ChartBarIcon, BriefcaseIcon
} from '@heroicons/react/24/outline';

const navItems = [
  { to: '/', label: 'Dashboard', icon: HomeIcon, exact: true },
  { to: '/rooms', label: 'Rooms', icon: BuildingOfficeIcon },
  { to: '/guests', label: 'Guests', icon: UsersIcon, roles: ['admin', 'manager', 'receptionist'] },
  { to: '/reservations', label: 'Reservations', icon: CalendarIcon, roles: ['admin', 'manager', 'receptionist'] },
  { to: '/checkinout', label: 'Check-In / Out', icon: ArrowRightOnRectangleIcon, roles: ['admin', 'manager', 'receptionist'] },
  { to: '/billing', label: 'Billing', icon: CreditCardIcon, roles: ['admin', 'manager', 'receptionist'] },
  { to: '/housekeeping', label: 'Housekeeping', icon: SparklesIcon },
  { to: '/staff', label: 'Staff', icon: UserGroupIcon, roles: ['admin', 'manager'] },
  { to: '/reports', label: 'Reports', icon: ChartBarIcon, roles: ['admin', 'manager'] },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const visibleItems = navItems.filter(item =>
    !item.roles || item.roles.includes(user?.role)
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <BriefcaseIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">Hotel HMS</p>
              <p className="text-gray-400 text-xs capitalize">{user?.role}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {visibleItems.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-white text-xs font-medium truncate">{user?.name}</p>
              <p className="text-gray-400 text-xs truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full text-left flex items-center gap-2 text-gray-400 hover:text-white text-sm py-1.5 px-2 rounded hover:bg-gray-800 transition-colors">
            <ArrowRightOnRectangleIcon className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
