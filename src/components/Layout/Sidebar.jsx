import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  BellIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  FolderIcon,
  HomeIcon,
  PlusIcon,
  QueueListIcon,
  TagIcon,
  TruckIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';

const directItems = [
  { label: 'Dashboard', path: '/dashboard', icon: HomeIcon },
  { label: 'Orders', path: '/orders', icon: TruckIcon },
  { label: 'Calendar', path: '/calendar', icon: CalendarDaysIcon },
  { label: 'Notifications', path: '/notifications', icon: BellIcon },
];

const groupedItems = [
  {
    id: 'products',
    label: 'Products',
    icon: TagIcon,
    routes: ['/products', '/products/add', '/add-product'],
    items: [
      { label: 'Add Product', path: '/products/add', icon: PlusIcon },
      { label: 'All Products', path: '/products', icon: QueueListIcon },
    ],
  },
  {
    id: 'categories',
    label: 'Categories',
    icon: FolderIcon,
    routes: ['/categories', '/categories/new', '/add-category'],
    items: [
      { label: 'Add Category', path: '/categories/new', icon: PlusIcon },
      { label: 'All Categories', path: '/categories', icon: QueueListIcon },
    ],
  },
];

const Sidebar = ({ isDarkMode, onNavigate }) => {
  const { user } = useAuth();
  const { isRtl } = useLanguage();
  const location = useLocation();
  const userInitial = user?.name?.charAt(0)?.toUpperCase() || 'B';
  const [openGroups, setOpenGroups] = useState({
    products: true,
    categories: true,
  });

  const toggleGroup = (groupId) => {
    setOpenGroups((current) => ({ ...current, [groupId]: !current[groupId] }));
  };

  const groupIsActive = (group) => group.routes.some((route) => location.pathname.startsWith(route));

  return (
    <aside className={`h-screen w-64 flex flex-col transition-colors ${
      isDarkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'
    } ${isRtl ? 'border-l' : 'border-r'}`}>
      <div className={`border-b border-slate-200 px-5 py-5 dark:border-slate-800 ${isRtl ? 'text-right' : 'text-left'}`}>
        <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--brand-primary)] text-sm font-bold text-white">
            {userInitial}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-950 dark:text-white">{user?.name || 'Brand'}</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {directItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={({ isActive }) => (
                `flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition ${isRtl ? 'flex-row-reverse text-right' : 'text-left'} ${
                  isActive
                    ? 'bg-[var(--brand-primary)] text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                }`
              )}
            >
              {({ isActive }) => (
                <>
                  <span className={`grid h-9 w-9 place-items-center rounded-xl ${
                    isActive ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-300'
                  }`}>
                    <item.icon className="h-5 w-5" />
                  </span>
                  <span className="truncate">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}

          {groupedItems.map((group) => {
            const active = groupIsActive(group);
            const open = openGroups[group.id];

            return (
              <div key={group.id} className="rounded-2xl">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition ${isRtl ? 'flex-row-reverse text-right' : 'text-left'} ${
                    active
                      ? 'bg-slate-100 text-slate-950 dark:bg-slate-800 dark:text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                  }`}
                >
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-300">
                    <group.icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{group.label}</span>
                  <ChevronDownIcon className={`h-4 w-4 text-slate-400 transition ${open ? 'rotate-180' : ''}`} />
                </button>

                {open && (
                  <div className="mt-1 space-y-1 pl-3">
                    {group.items.map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={onNavigate}
                        className={({ isActive }) => (
                          `flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition ${isRtl ? 'flex-row-reverse text-right' : 'text-left'} ${
                            isActive
                              ? 'bg-[var(--brand-primary)] text-white'
                              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                          }`
                        )}
                      >
                        {({ isActive }) => (
                          <>
                            <span className={`grid h-8 w-8 place-items-center rounded-xl ${
                              isActive ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-300'
                            }`}>
                              <item.icon className="h-4 w-4" />
                            </span>
                            <span className="truncate">{item.label}</span>
                          </>
                        )}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
