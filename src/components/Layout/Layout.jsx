import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useLanguage } from '../../hooks/useLanguage';

const Layout = () => {
  const { isRtl } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage or system preference
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      return JSON.parse(saved);
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Apply dark mode class to html element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] transition-colors dark:bg-[linear-gradient(180deg,#020617_0%,#0f172a_100%)]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`fixed inset-y-0 z-50 transform transition-transform duration-300 lg:translate-x-0 ${isRtl ? 'right-0' : 'left-0'} ${sidebarOpen ? 'translate-x-0' : isRtl ? 'translate-x-full' : '-translate-x-full'}`}>
        <Sidebar isDarkMode={isDarkMode} onNavigate={() => setSidebarOpen(false)} />
      </div>

      <div className={isRtl ? 'lg:mr-64' : 'lg:ml-64'}>
        <Header
          toggleSidebar={toggleSidebar}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
        />
        
        <main className="min-h-[calc(100vh-80px)] p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;

