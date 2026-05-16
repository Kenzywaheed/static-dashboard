import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import {
  ArrowLeftOnRectangleIcon,
  ArrowPathIcon,
  Bars3Icon,
  BellIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
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
  const brandIdMissingMessage = t.category?.brandRequired || 'Brand id is missing from the current session.';

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
                <div className="mb-2 rounded-lg border border-[#e5ddd2] bg-[#faf7f2] p-3 dark:border-slate-800 dark:bg-slate-950/80">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-primary)]">{t.header?.profile || 'Brand profile'}</p>

                  {brandProfileQuery.isLoading ? (
                    <div className="mt-3 animate-pulse space-y-3">
                      <div className="h-10 rounded-lg bg-slate-200 dark:bg-slate-800" />
                      <div className="h-3 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
                    </div>
                  ) : brandProfileQuery.isMissingBrandId ? (
                    <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{brandIdMissingMessage}</p>
                  ) : brandProfileQuery.isError ? (
                    <div className="mt-3 space-y-3">
                      <div className="flex items-start gap-2 text-sm text-rose-600 dark:text-rose-300">
                        <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
                        <p>We could not load the brand profile right now.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => brandProfileQuery.refetch()}
                        className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand-primary)] px-3 py-2 text-xs font-semibold text-white"
                      >
                        <ArrowPathIcon className="h-4 w-4" />
                        <span>{t.category?.refresh || 'Refresh'}</span>
                      </button>
                    </div>
                  ) : brandProfileQuery.isEmpty ? (
                    <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                      No brand profile details were returned for this account yet.
                    </p>
                  ) : (
                    <div className="mt-3 space-y-3">
                      <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse text-right' : ''}`}>
                        <BrandAvatar
                          name={displayBrandName}
                          icon={brandProfileQuery.profile.icon}
                          sizeClassName="h-10 w-10"
                          roundedClassName="rounded-2xl"
                          textClassName="text-sm"
                          iconClassName="h-5 w-5"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">{displayBrandName}</p>
                        </div>
                      </div>
                      <div className={`flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 ${isRtl ? 'flex-row-reverse text-right' : ''}`}>
                        <EnvelopeIcon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{displayBrandEmail}</span>
                      </div>
                      <div className="max-w-full rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm dark:bg-slate-900 dark:text-slate-300">
                        <span className="block max-w-[180px] truncate" title={brandProfileQuery.brandId}>
                          Brand ID: {brandProfileQuery.brandId}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

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
