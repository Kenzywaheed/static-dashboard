import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { PaletteProvider } from './context/PaletteContext';
import ErrorBoundary from './components/Common/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import OrderManagement from './pages/OrderManagementLite';
import AddProduct from './pages/AddProduct';
import Notifications from './pages/Notifications';
import Calendar from './pages/CalendarLite';
import CategoryManager from './pages/CategoryManager';
import Login from './pages/Login';
import BrandSetup from './pages/BrandSetup';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <HashRouter>
          <LanguageProvider>
            <PaletteProvider>
              <AuthProvider>
                <Toaster position="top-right" />
                <Routes>
                  <Route path="/login" element={<Login />} />

                  <Route element={<ProtectedRoute />}>
                    <Route path="/setup" element={<BrandSetup />} />
                    <Route element={<Layout />}>
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/orders" element={<OrderManagement />} />
                      <Route path="/add-product" element={<AddProduct />} />
                      <Route path="/products/add" element={<AddProduct />} />
                      <Route path="/add-category" element={<CategoryManager />} />
                      <Route path="/categories" element={<CategoryManager />} />
                      <Route path="/notifications" element={<Notifications />} />
                      <Route path="/calendar" element={<Calendar />} />
                    </Route>
                  </Route>

                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </AuthProvider>
            </PaletteProvider>
          </LanguageProvider>
        </HashRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;


