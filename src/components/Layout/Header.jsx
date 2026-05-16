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
import BrandAvatar from '../Common/BrandAvatar';
import { useBrandProfile } from '../../hooks/useBrandProfile';

const Header = ({
  toggleMobileSidebar,
  toggleDesktopSidebar,
  sidebarVisible,
  isDarkMode,
  setIsDarkMode,
}) => {
  const { user, logout } = useAuth();
  const { language, setLanguage, isRtl, t } = useLanguage();
  const brandProfileQuery = useBrandProfile();
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
    const pageTitles = [
      ['/products/add', t.product?.newProduct || t.nav.addProduct],
      ['/products/view', t.product?.productManagement || t.nav.addProduct],
      ['/products/', t.product?.productManagement || t.nav.addProduct],
      ['/products', t.product?.productManagement || t.nav.addProduct],
      ['/orders/view', t.nav.orders],
      ['/orders', t.nav.orders],
      ['/categories/new', t.category?.newCategory || t.nav.categories],
      ['/categories/view', t.nav.categories],
      ['/categories', t.nav.categories],
      ['/collaboration', t.nav?.collaboration || (language === 'ar' ? 'التعاون' : 'Collaboration')],
      ['/notifications', t.nav.notifications],
      ['/calendar', t.nav.calendar],
      ['/setup', t.setup?.badge || 'Setup'],
      ['/dashboard', t.dashboard?.title || t.nav.dashboard],
    ];

    const matchedEntry = pageTitles.find(([path]) => (
      path.endsWith('/')
        ? location.pathname.startsWith(path)
        : location.pathname === path || location.pathname.startsWith(`${path}/`)
    ));

    return matchedEntry?.[1] || (t.dashboard?.title || t.nav.dashboard);
  }, [language, location.pathname, t]);

  const displayBrandName = brandProfileQuery.profile.brandName || user?.name || 'Brand user';
  const displayBrandEmail = brandProfileQuery.profile.brandEmail || user?.email || 'brand@local.test';

  return (
    <header className="sticky top-0 z-30 border-b border-[#ddd6cc] bg-[rgba(247,244,238,0.96)] dark:border-slate-800 dark:bg-[rgba(11,17,32,0.94)]">
      <div className="relative flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleMobileSidebar}
            className="rounded-lg border border-[#d8d0c5] bg-white p-2 text-slate-700 transition hover:border-[var(--brand-primary)]/40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 xl:hidden"
            aria-label="Open menu"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={toggleDesktopSidebar}
            className="hidden rounded-lg border border-[#d8d0c5] bg-white p-2 text-slate-700 transition hover:border-[var(--brand-primary)]/40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 xl:inline-flex"
            aria-label={sidebarVisible ? 'Hide sidebar' : 'Show sidebar'}
          >
            {sidebarVisible ? <ChevronLeftIcon className="h-5 w-5" /> : <ChevronRightIcon className="h-5 w-5" />}
          </button>

          <div>
            <h1 className="text-xl font-semibold text-slate-950 dark:text-white">{title}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Clear and practical workspace</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className="inline-flex items-center gap-2 rounded-lg border border-[#d8d0c5] bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-[var(--brand-primary)]/40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <LanguageIcon className="h-4 w-4" />
            <span>{language === 'en' ? 'AR' : 'EN'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="rounded-lg border border-[#d8d0c5] bg-white p-2 text-slate-700 transition hover:border-[var(--brand-primary)]/40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            {isDarkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          </button>

          <button
            type="button"
            onClick={() => navigate('/notifications')}
            className="rounded-lg border border-[#d8d0c5] bg-white p-2 text-slate-700 transition hover:border-[var(--brand-primary)]/40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <BellIcon className="h-5 w-5" />
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowDropdown((current) => !current)}
              className={`flex items-center gap-3 rounded-lg border border-[#d8d0c5] bg-white px-3 py-2 transition hover:border-[var(--brand-primary)]/40 dark:border-slate-800 dark:bg-slate-900 ${isRtl ? 'flex-row-reverse' : ''}`}
            >
              <BrandAvatar
                name={displayBrandName}
                icon={brandProfileQuery.profile.icon}
                sizeClassName="h-8 w-8"
                roundedClassName="rounded-full"
                textClassName="text-sm"
                iconClassName="h-4 w-4"
              />
              <div className="hidden text-left md:block">
                <p className="max-w-[140px] truncate text-sm font-medium text-slate-950 dark:text-white">{displayBrandName}</p>
                <p className="max-w-[140px] truncate text-xs text-slate-500 dark:text-slate-400">{displayBrandEmail}</p>
              </div>
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[#ded6cb] bg-white p-2 dark:border-slate-800 dark:bg-slate-900">
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
