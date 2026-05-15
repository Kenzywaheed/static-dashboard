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
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { useLanguage } from '../../hooks/useLanguage';

const Sidebar = ({ onNavigate }) => {
  const { t, language } = useLanguage();
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState({
    orders: true,
    products: true,
    categories: true,
  });

  const directItems = [
    { label: t.dashboard?.title || t.nav.dashboard, path: '/dashboard', icon: HomeIcon },
    { label: t.nav?.collaboration || (language === 'ar' ? 'التعاون' : 'Collaboration'), path: '/collaboration', icon: UserGroupIcon },
    { label: t.nav.calendar, path: '/calendar', icon: CalendarDaysIcon },
    { label: t.nav.notifications, path: '/notifications', icon: BellIcon },
  ];

  const groupedItems = [
    {
      id: 'orders',
      label: t.nav.orders,
      icon: TruckIcon,
      routes: ['/orders', '/orders/view'],
      items: [
        { label: t.nav.orders, path: '/orders/view' },
      ],
    },
    {
      id: 'products',
      label: t.product?.productManagement || (language === 'ar' ? 'إدارة المنتجات' : 'Product Management'),
      icon: TagIcon,
      routes: ['/products', '/products/view', '/products/add', '/add-product'],
      items: [
        {
          label: language === 'ar' ? 'كل المنتجات' : 'All Products',
          path: '/products/view',
          icon: QueueListIcon,
        },
        {
          label: t.product?.newProduct || (language === 'ar' ? 'منتج جديد' : 'Add Product'),
          path: '/products/add',
          icon: PlusIcon,
        },
      ],
    },
    {
      id: 'categories',
      label: t.nav.categories,
      icon: FolderIcon,
      routes: ['/categories', '/categories/view', '/categories/new', '/add-category'],
      items: [
        { label: t.category?.newCategory || 'Add Category', path: '/categories/new' },
        { label: t.category?.categoriesTitle || 'View Categories', path: '/categories/view' },
      ],
    },
  ];

  const activeGroupByRoute = groupedItems.find((group) => (
    group.routes.some((route) => location.pathname.startsWith(route))
  ))?.id || '';

  const toggleGroup = (groupId) => {
    setOpenGroups((current) => ({ ...current, [groupId]: !current[groupId] }));
  };

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-[#ddd6cc] bg-[var(--sidebar-bg)] dark:border-slate-800 dark:bg-slate-950">
      <div className="border-b border-[#e8e2d7] px-5 py-4 dark:border-slate-800">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Store sections</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Move between catalog, orders, and notifications.</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {directItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={({ isActive }) => `group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition duration-200 ${
              isActive
                ? 'bg-[var(--brand-primary)] text-white'
                : 'text-slate-600 hover:bg-white hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800/90 dark:hover:text-white'
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
                    ? 'bg-white text-slate-950 dark:bg-slate-800 dark:text-white'
                    : 'text-slate-600 hover:bg-white hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800/90 dark:hover:text-white'
                }`}
              >
                <group.icon className="h-5 w-5 transition group-hover:scale-105" />
                <span className="flex-1 text-left">{group.label}</span>
                <ChevronDownIcon className={`h-4 w-4 text-slate-400 transition ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {isOpen && (
                <div className="ml-5 mt-2 border-l border-[#ddd4c5] pl-4 dark:border-slate-700">
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const ItemIcon = item.icon || PlusIcon;

                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          onClick={onNavigate}
                          className={({ isActive }) => `group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition duration-200 ${
                            isActive
                              ? 'bg-[rgba(63,111,104,0.12)] text-slate-950 dark:bg-slate-800 dark:text-white'
                              : 'text-slate-500 hover:bg-white hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                          }`}
                        >
                          <ItemIcon className="h-4 w-4 transition group-hover:scale-105" />
                          <span>{item.label}</span>
                        </NavLink>
                      );
                    })}
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
