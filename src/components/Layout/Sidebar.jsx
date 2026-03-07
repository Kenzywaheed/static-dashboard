import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  ShoppingCartIcon,
  BellIcon,
  CalendarIcon,
  CreditCardIcon,
  CubeIcon,
  UserGroupIcon,
  PlusCircleIcon,
  FolderIcon,
} from '@heroicons/react/24/outline';

const menuItems = [
  { name: 'Dashboard', path: '/dashboard', icon: HomeIcon },
  { name: 'Order Management', path: '/orders', icon: ShoppingCartIcon },
  { name: 'Notifications', path: '/notifications', icon: BellIcon },
  { name: 'Calendar', path: '/calendar', icon: CalendarIcon },
  { name: 'Payment Way', path: '/payment', icon: CreditCardIcon },
  { name: 'Order Model', path: '/order-model', icon: CubeIcon },
  { name: 'Add Products', path: '/products/add', icon: PlusCircleIcon },
  { name: 'Categories', path: '/categories', icon: FolderIcon },
  { name: 'Admin Roles', path: '/admin-roles', icon: UserGroupIcon },
];

const Sidebar = ({ isDarkMode }) => {
  return (
    <div className={`w-64 h-screen flex flex-col transition-colors ${
      isDarkMode 
        ? 'bg-gray-900 border-r border-gray-700' 
        : 'bg-sidebar'
    }`}>
      {/* Logo */}
      <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-700'}`}>
        <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-xs text-gray-400 mt-1">Manage your store</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="text-sm font-medium">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className={`p-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-700'}`}>
        <p className="text-xs text-gray-400 text-center">v1.0.0</p>
      </div>
    </div>
  );
};

export default Sidebar;

