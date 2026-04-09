import { createContext, useContext, useState, useEffect } from 'react';
// import api from '../services/api'; 

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // Default mock user - no authentication required
  const [user, setUser] = useState({
    id: 1,
    email: 'admin@localbrand.com',
    name: 'Admin User',
    role: 'admin'
  });
  const [loading, setLoading] = useState(false);

  // Skip token check - app works without authentication
  useEffect(() => {
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/login', { email, password });
      const { token, user: userData } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      return { success: true, user: userData };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Login failed' };
    }
  };

  const logout = async () => {
    try {
      await api.post('/logout');
    } catch (error) {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Reset to default mock user
      setUser({
        id: 1,
        email: 'admin@localbrand.com',
        name: 'Admin User',
        role: 'admin'
      });
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: true
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

