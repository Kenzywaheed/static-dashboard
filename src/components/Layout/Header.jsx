import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import {
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  BellIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LanguageIcon,
  MoonIcon,
  SunIcon,
} from '@heroicons/react/24/outline';

const pageTitles = {
  '/dashboard': 'Home',
  '/orders': 'Orders',
  '/orders/view': 'Orders',
  '/products': 'Products',
  '/products/view': 'Products',
  '/products/add': 'Add Product',
  '/categories': 'Categories',
  '/categories/view': 'Categories',
  '/categories/new': 'Add Category',
  '/notifications': 'Notifications',
  '/calendar': 'Calendar',
  '/setup': 'Setup',
};

const Header = ({
  toggleMobileSidebar,
  toggleDesktopSidebar,
  sidebarVisible,
  isDarkMode,
  setIsDarkMode,
}) => {
  const { user, logout } = useAuth();
  const { language, setLanguage, isRtl } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const handleOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const title = useMemo(() => {
    const matchedEntry = Object.entries(pageTitles).find(([path]) => location.pathname.startsWith(path));
    return matchedEntry?.[1] || 'Home';
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-30 border-b border-[#e8e4de] bg-[rgba(250,248,244,0.88)] backdrop-blur-xl dark:border-slate-800 dark:bg-[rgba(2,6,23,0.82)]">
      <div className="relative flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleMobileSidebar}
            className="rounded-xl border border-[#dfd7cc] bg-white/80 p-2 text-slate-700 transition hover:-translate-y-0.5 hover:border-[var(--brand-primary)]/40 hover:bg-white dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300 xl:hidden"
            aria-label="Open menu"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={toggleDesktopSidebar}
            className="hidden rounded-xl border border-[#dfd7cc] bg-white/80 p-2 text-slate-700 transition hover:-translate-y-0.5 hover:border-[var(--brand-primary)]/40 hover:bg-white dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300 xl:inline-flex"
            aria-label={sidebarVisible ? 'Hide sidebar' : 'Show sidebar'}
          >
            {sidebarVisible ? <ChevronLeftIcon className="h-5 w-5" /> : <ChevronRightIcon className="h-5 w-5" />}
          </button>

          <div>
            <h1 className="text-xl font-semibold text-slate-950 dark:text-white">{title}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Soft and focused workspace</p>
          </div>
        </div>

        <div className="pointer-events-none absolute left-1/2 hidden -translate-x-1/2 xl:flex">
          <div className="inline-flex items-center gap-3 rounded-full border border-[#e4ddd2] bg-white/90 px-4 py-2 shadow-[0_16px_36px_-28px_rgba(15,23,42,0.6)] dark:border-slate-800 dark:bg-slate-900/90">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-[linear-gradient(135deg,var(--brand-primary),#7dd3c7)] text-sm font-bold text-white shadow-sm">
              SH
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-950 dark:text-white">StyleHub</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Home for your brand</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className="inline-flex items-center gap-2 rounded-xl border border-[#dfd7cc] bg-white/80 px-3 py-2 text-sm text-slate-700 transition hover:-translate-y-0.5 hover:border-[var(--brand-primary)]/40 hover:bg-white dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200"
          >
            <LanguageIcon className="h-4 w-4" />
            <span>{language === 'en' ? 'AR' : 'EN'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="rounded-xl border border-[#dfd7cc] bg-white/80 p-2 text-slate-700 transition hover:-translate-y-0.5 hover:border-[var(--brand-primary)]/40 hover:bg-white dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300"
          >
            {isDarkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          </button>

          <button
            type="button"
            onClick={() => navigate('/notifications')}
            className="rounded-xl border border-[#dfd7cc] bg-white/80 p-2 text-slate-700 transition hover:-translate-y-0.5 hover:border-[var(--brand-primary)]/40 hover:bg-white dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300"
          >
            <BellIcon className="h-5 w-5" />
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowDropdown((current) => !current)}
              className={`flex items-center gap-3 rounded-xl border border-[#dfd7cc] bg-white/80 px-3 py-2 transition hover:-translate-y-0.5 hover:border-[var(--brand-primary)]/40 hover:bg-white dark:border-slate-800 dark:bg-slate-900/80 ${isRtl ? 'flex-row-reverse' : ''}`}
            >
              <div className="grid h-8 w-8 place-items-center rounded-full bg-[linear-gradient(135deg,var(--brand-primary),#7dd3c7)] text-sm font-semibold text-white">
                {(user?.name || 'B').charAt(0).toUpperCase()}
              </div>
              <div className="hidden text-left md:block">
                <p className="max-w-[140px] truncate text-sm font-medium text-slate-950 dark:text-white">{user?.name || 'Brand user'}</p>
                <p className="max-w-[140px] truncate text-xs text-slate-500 dark:text-slate-400">{user?.email || 'brand@local.test'}</p>
              </div>
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-[#e4ddd2] bg-white p-2 shadow-[0_24px_48px_-30px_rgba(15,23,42,0.65)] dark:border-slate-800 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setShowDropdown(false);
                    navigate('/login', { replace: true });
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/40 ${isRtl ? 'flex-row-reverse justify-end' : ''}`}
                >
                  <ArrowLeftOnRectangleIcon className={`h-4 w-4 ${isRtl ? 'rotate-180' : ''}`} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
