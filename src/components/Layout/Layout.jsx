import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useLanguage } from '../../hooks/useLanguage';

const SIDEBAR_VISIBILITY_KEY = 'dashboardSidebarVisible';

const Layout = () => {
  const { isRtl } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(() => {
    const stored = localStorage.getItem(SIDEBAR_VISIBILITY_KEY);
    return stored === null ? true : JSON.parse(stored);
  });
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      return JSON.parse(saved);
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_VISIBILITY_KEY, JSON.stringify(sidebarVisible));
  }, [sidebarVisible]);

  const desktopSidebarOffset = sidebarVisible ? (isRtl ? 'xl:mr-64' : 'xl:ml-64') : '';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/40 xl:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 z-50 transition-transform duration-200 ${isRtl ? 'right-0' : 'left-0'} ${
          sidebarOpen ? 'translate-x-0' : isRtl ? 'translate-x-full' : '-translate-x-full'
        } ${sidebarVisible ? 'xl:translate-x-0' : isRtl ? 'xl:translate-x-full' : 'xl:-translate-x-full'}`}
      >
        <Sidebar onNavigate={() => setSidebarOpen(false)} />
      </div>

      <div className={`min-h-screen transition-[margin] duration-200 ${desktopSidebarOffset}`}>
        <Header
          toggleMobileSidebar={() => setSidebarOpen((current) => !current)}
          toggleDesktopSidebar={() => setSidebarVisible((current) => !current)}
          sidebarVisible={sidebarVisible}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
        />

        <main className="px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
