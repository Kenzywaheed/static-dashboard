import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/Common/ErrorBoundary';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import OrderManagement from './pages/OrderManagement';
import AddProduct from './pages/AddProduct';
import ProductDetails from './pages/ProductDetails';
import Notifications from './pages/Notifications';
import Calendar from './pages/Calendar';
import PaymentWay from './pages/PaymentWay';
import OrderModel from './pages/OrderModel';
import AdminRoles from './pages/AdminRoles';
import CategoryManager from './pages/CategoryManager';

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
          <AuthProvider>
            <Toaster position="top-right" />
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/orders" element={<OrderManagement />} />
                
                {/* Add Product Routes */}
                <Route path="/add-product" element={<AddProduct />} />
                <Route path="/products/add" element={<AddProduct />} />
                <Route path="/product-details" element={<ProductDetails />} />

                {/* Category Routes */}
                <Route path="/add-category" element={<CategoryManager />} />
                <Route path="/categories" element={<CategoryManager />} />
                
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/payment" element={<PaymentWay />} />
                <Route path="/order-model" element={<OrderModel />} />
                <Route path="/admin-roles" element={<AdminRoles />} />
              </Route>
              
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </AuthProvider>
        </HashRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;

