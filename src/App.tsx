import { useState, useEffect } from 'react';

import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import LoadingScreen from './components/LoadingScreen';
import { TOKEN_STORAGE_KEY } from './constants/auth';
import { authAPI } from './services/api';
import type { User } from './types';

type AuthView = 'login' | 'register';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authView, setAuthView] = useState<AuthView>('login');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      loadCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  const loadCurrentUser = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      setUser(response.data);
    } catch {
      // Token is invalid, remove it
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (userData: User) => {
    setUser(userData);
  };

  const handleRegisterSuccess = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setUser(null);
    setAuthView('login');
  };

  if (loading) {
    return <LoadingScreen message="Loading your account..." />;
  }

  if (user) {
    return <Dashboard user={user} onLogout={handleLogout} />;
  }

  return (
    <>
      {authView === 'login' ? (
        <Login
          onLoginSuccess={handleLoginSuccess}
          onSwitchToRegister={() => setAuthView('register')}
        />
      ) : (
        <Register
          onRegisterSuccess={handleRegisterSuccess}
          onSwitchToLogin={() => setAuthView('login')}
        />
      )}
    </>
  );
}

export default App;
