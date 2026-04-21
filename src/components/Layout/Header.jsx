import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import {
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  BellIcon,
  CheckBadgeIcon,
  ChevronDownIcon,
  LanguageIcon,
  MagnifyingGlassIcon,
  MoonIcon,
  SunIcon,
} from '@heroicons/react/24/outline';

const Header = ({ toggleSidebar, isDarkMode, setIsDarkMode }) => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t, isRtl } = useLanguage();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const closeDropdown = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', closeDropdown);

    return () => document.removeEventListener('mousedown', closeDropdown);
  }, []);

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    navigate('/login', { replace: true });
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || 'B';

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/88 backdrop-blur dark:border-slate-800 dark:bg-slate-900/88">
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <button
            type="button"
            onClick={toggleSidebar}
            className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 lg:hidden"
            aria-label="Open navigation"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          <div className="hidden min-w-0 flex-1 md:block">
            <div className="relative max-w-xl">
              <MagnifyingGlassIcon className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 ${isRtl ? 'right-3' : 'left-3'}`} />
              <input
                type="text"
                placeholder="Search"
                className={`w-full rounded-full border border-slate-300 bg-slate-50 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 ${isRtl ? 'pl-4 pr-10' : 'pl-10 pr-4'}`}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={toggleLanguage}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800"
            aria-label={t.header.language}
          >
            <LanguageIcon className="h-5 w-5" />
            <span>{language === 'en' ? 'AR' : 'EN'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label={t.header.theme}
          >
            {isDarkMode ? (
              <SunIcon className="h-5 w-5" />
            ) : (
              <MoonIcon className="h-5 w-5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => navigate('/notifications')}
            className="relative rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label={t.header.notifications}
          >
            <BellIcon className="h-5 w-5" />
            <span className={`absolute top-1 h-2 w-2 rounded-full bg-red-500 ${isRtl ? 'left-1' : 'right-1'}`} />
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowDropdown((current) => !current)}
              className={`flex items-center gap-2 rounded-full border border-slate-200 bg-white p-2 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-800 ${isRtl ? 'flex-row-reverse' : ''}`}
              aria-label={t.header.profile}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand-primary)]">
                <span className="text-sm font-bold text-white">{userInitial}</span>
              </div>
              <div className={`hidden md:block ${isRtl ? 'text-right' : 'text-start'}`}>
                <p className="max-w-[140px] truncate text-sm font-semibold text-gray-900 dark:text-white">
                  {user?.name || t.app.shortName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t.header.localBrand}</p>
              </div>
              <ChevronDownIcon className={`h-4 w-4 text-gray-500 transition ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showDropdown && (
              <div className={`absolute end-0 mt-3 w-72 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl shadow-gray-950/10 dark:border-gray-700 dark:bg-gray-950 dark:shadow-black/40 ${isRtl ? 'text-right' : 'text-left'}`}>
                <div className="border-b border-gray-200 p-4 dark:border-gray-800">
                  <div className={`flex items-start gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600">
                      <span className="font-bold text-white">{userInitial}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-950 dark:text-white">{user?.name || t.app.shortName}</p>
                      <p className="mt-1 break-all text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                    </div>
                  </div>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 dark:bg-green-950 dark:text-green-200">
                    <CheckBadgeIcon className="h-4 w-4" />
                    {t.auth.sessionReady}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className={`flex w-full items-center gap-2 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950 ${isRtl ? 'flex-row-reverse justify-end' : ''}`}
                >
                  <ArrowRightOnRectangleIcon className={`h-5 w-5 ${isRtl ? 'rotate-180' : ''}`} />
                  {t.auth.logout}
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
