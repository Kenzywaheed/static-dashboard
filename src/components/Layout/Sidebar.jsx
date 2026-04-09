import { NavLink } from 'react-router-dom';
import {
  BellIcon,
  CalendarIcon,
  FolderIcon,
  HomeIcon,
  PlusCircleIcon,
  ShoppingCartIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { usePalette } from '../../hooks/usePalette';

const menuSections = [
  {
    sectionKey: 'workspace',
    items: [
      { labelKey: 'dashboard', path: '/dashboard', icon: HomeIcon },
      { labelKey: 'orders', path: '/orders', icon: ShoppingCartIcon },
      { labelKey: 'notifications', path: '/notifications', icon: BellIcon },
    ],
  },
  {
    sectionKey: 'catalog',
    items: [
      { labelKey: 'addProduct', path: '/products/add', icon: PlusCircleIcon },
      { labelKey: 'categories', path: '/categories', icon: FolderIcon },
      { labelKey: 'calendar', path: '/calendar', icon: CalendarIcon },
    ],
  },
];

const Sidebar = ({ isDarkMode, onNavigate }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { palette } = usePalette();
  const userInitial = user?.name?.charAt(0)?.toUpperCase() || 'B';

  return (
    <aside className={`w-72 h-screen flex flex-col border-r transition-colors ${
      isDarkMode
        ? 'border-gray-800 bg-gray-950'
        : 'border-gray-200 bg-white'
    }`}>
      <div className="relative overflow-hidden border-b border-gray-200 p-5 dark:border-gray-800">
        <div className="absolute inset-x-0 top-0 h-1 bg-[var(--brand-primary)]" />
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-lg bg-[var(--brand-primary)] text-white shadow-lg shadow-gray-950/20">
            <SparklesIcon className="h-7 w-7" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-gray-950 dark:text-white">{t.app.name}</h1>
            <p className="mt-1 truncate text-xs font-semibold text-gray-500 dark:text-gray-400">{t.app.tagline}</p>
          </div>
        </div>

        <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded bg-gray-950 text-sm font-bold text-white dark:bg-white dark:text-gray-950">
              {userInitial}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-gray-950 dark:text-white">{user?.name || t.app.shortName}</p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">{t.header.localBrand}</p>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-5">
        {menuSections.map((section) => (
          <div key={section.sectionKey} className="mb-7 last:mb-0">
            <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              {t.navSections?.[section.sectionKey] || section.sectionKey}
            </p>
            <div className="space-y-1.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-bold transition ${
                      isActive
                        ? 'bg-[var(--brand-primary-soft)] text-[var(--brand-primary-dark)] dark:bg-gray-900 dark:text-white'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-950 dark:text-gray-300 dark:hover:bg-gray-900 dark:hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className={`absolute inset-y-2 w-1 rounded-full bg-[var(--brand-primary)] transition-opacity ${isActive ? 'opacity-100' : 'opacity-0'} ltr:left-0 rtl:right-0`} />
                      <span className={`grid h-9 w-9 place-items-center rounded-lg transition ${
                        isActive
                          ? 'bg-[var(--brand-primary)] text-white shadow-sm'
                          : 'bg-gray-100 text-gray-500 group-hover:text-gray-900 dark:bg-gray-800 dark:text-gray-300'
                      }`}>
                        <item.icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 truncate">{t.nav[item.labelKey]}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-gray-200 p-4 dark:border-gray-800">
        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400">{t.sidebar?.palette || 'Palette'}</p>
          <div className="mt-3 flex items-center gap-3">
            <span className="h-7 flex-1 rounded" style={{ backgroundColor: palette.primary }} />
            <span className="h-7 flex-1 rounded" style={{ backgroundColor: palette.primaryDark }} />
            <span className="h-7 flex-1 rounded" style={{ backgroundColor: palette.primarySoft }} />
          </div>
          <p className="mt-3 text-center text-[11px] font-semibold text-gray-400">{t.app.version}</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
