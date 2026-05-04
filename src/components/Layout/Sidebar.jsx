import { useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  BellIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  FolderIcon,
  HomeIcon,
  PlusIcon,
  TagIcon,
  TruckIcon,
} from '@heroicons/react/24/outline';

const directItems = [
  { label: 'Home', path: '/dashboard', icon: HomeIcon },
  { label: 'Calendar', path: '/calendar', icon: CalendarDaysIcon },
  { label: 'Notifications', path: '/notifications', icon: BellIcon },
];

const groupedItems = [
  {
    id: 'orders',
    label: 'Orders',
    icon: TruckIcon,
    routes: ['/orders', '/orders/view'],
    items: [
      { label: 'View Orders', path: '/orders/view' },
    ],
  },
  {
    id: 'products',
    label: 'Products',
    icon: TagIcon,
    routes: ['/products', '/products/view', '/products/add', '/add-product'],
    items: [
      { label: 'Add Product', path: '/products/add' },
      { label: 'View Products', path: '/products/view' },
    ],
  },
  {
    id: 'categories',
    label: 'Categories',
    icon: FolderIcon,
    routes: ['/categories', '/categories/view', '/categories/new', '/add-category'],
    items: [
      { label: 'Add Category', path: '/categories/new' },
      { label: 'View Categories', path: '/categories/view' },
    ],
  },
];

const Sidebar = ({ onNavigate }) => {
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState({
    orders: true,
    products: true,
    categories: true,
  });

  const activeGroupByRoute = useMemo(() => (
    groupedItems.find((group) => group.routes.some((route) => location.pathname.startsWith(route)))?.id || ''
  ), [location.pathname]);

  const toggleGroup = (groupId) => {
    setOpenGroups((current) => ({ ...current, [groupId]: !current[groupId] }));
  };

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-[#e8e2d7] bg-[linear-gradient(180deg,#fffdfa_0%,#f7f4ee_100%)] dark:border-slate-800 dark:bg-[linear-gradient(180deg,#0f172a_0%,#111827_100%)]">
      <div className="border-b border-[#e8e2d7] px-5 py-6 dark:border-slate-800">
        <div className="flex justify-center">
          <div className="inline-flex flex-col items-center gap-3 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-[linear-gradient(135deg,var(--brand-primary),#86d8cb)] text-base font-bold text-white shadow-[0_16px_30px_-18px_rgba(15,118,110,0.8)]">
              SH
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-950 dark:text-white">StyleHub</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Soft commerce control</p>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {directItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={({ isActive }) => `group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition duration-200 ${
              isActive
                ? 'bg-[linear-gradient(135deg,var(--brand-primary),#2f9084)] text-white shadow-[0_18px_28px_-20px_rgba(15,118,110,0.9)]'
                : 'text-slate-600 hover:-translate-y-0.5 hover:bg-white hover:text-slate-950 hover:shadow-[0_16px_30px_-24px_rgba(15,23,42,0.5)] dark:text-slate-300 dark:hover:bg-slate-800/90 dark:hover:text-white'
            }`}
          >
            <item.icon className="h-5 w-5 transition group-hover:scale-105" />
            <span>{item.label}</span>
          </NavLink>
        ))}

        <div className="my-4 border-t border-[#e8e2d7] dark:border-slate-800" />

        {groupedItems.map((group) => {
          const isGroupActive = group.id === activeGroupByRoute;
          const isOpen = openGroups[group.id];

          return (
            <div key={group.id} className="rounded-xl">
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition duration-200 ${
                  isGroupActive
                    ? 'bg-white text-slate-950 shadow-[0_16px_30px_-24px_rgba(15,23,42,0.45)] dark:bg-slate-800 dark:text-white'
                    : 'text-slate-600 hover:-translate-y-0.5 hover:bg-white hover:text-slate-950 hover:shadow-[0_16px_30px_-24px_rgba(15,23,42,0.45)] dark:text-slate-300 dark:hover:bg-slate-800/90 dark:hover:text-white'
                }`}
              >
                <group.icon className="h-5 w-5 transition group-hover:scale-105" />
                <span className="flex-1 text-left">{group.label}</span>
                <ChevronDownIcon className={`h-4 w-4 text-slate-400 transition ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {isOpen && (
                <div className="ml-5 mt-2 border-l border-[#ddd4c5] pl-4 dark:border-slate-700">
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={onNavigate}
                        className={({ isActive }) => `group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition duration-200 ${
                          isActive
                            ? 'bg-[rgba(15,118,110,0.12)] text-slate-950 dark:bg-slate-800 dark:text-white'
                            : 'text-slate-500 hover:translate-x-1 hover:bg-white hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                        }`}
                      >
                        <PlusIcon className="h-4 w-4 transition group-hover:scale-105" />
                        <span>{item.label}</span>
                      </NavLink>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
