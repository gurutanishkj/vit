import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Chatbot from './components/Chatbot';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('fraudshield_token') || '');
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('fraudshield_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [authView, setAuthView] = useState('login'); // 'login' | 'register'
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'analyze' | 'model' | 'assistant'
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Validate stored token on mount
  useEffect(() => {
    if (!token) {
      setCheckingAuth(false);
      return;
    }

    fetch('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Session expired');
        return res.json();
      })
      .then((userData) => {
        setUser(userData);
        localStorage.setItem('fraudshield_user', JSON.stringify(userData));
        setCheckingAuth(false);
      })
      .catch(() => {
        // Token expired or invalid
        localStorage.removeItem('fraudshield_token');
        localStorage.removeItem('fraudshield_user');
        setToken('');
        setUser(null);
        setCheckingAuth(false);
      });
  }, []);

  const handleLoginSuccess = (userData, accessToken) => {
    setUser(userData);
    setToken(accessToken);
    setActiveTab('dashboard');
  };

  const handleRegisterSuccess = (userData, accessToken) => {
    setUser(userData);
    setToken(accessToken);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('fraudshield_token');
    localStorage.removeItem('fraudshield_user');
    setToken('');
    setUser(null);
    setAuthView('login');
  };

  const handleNavTabChange = (tabId) => {
    if (tabId === 'assistant') {
      setIsChatOpen(true);
    }
    setActiveTab(tabId);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#fcfaf6] flex items-center justify-center text-sm font-semibold text-[#78716c]">
        Initializing FraudShield Security Core...
      </div>
    );
  }

  // Unauthenticated Flow
  if (!token) {
    if (authView === 'register') {
      return (
        <Register
          onRegisterSuccess={handleRegisterSuccess}
          onSwitchToLogin={() => setAuthView('login')}
        />
      );
    }
    return (
      <Login
        onLoginSuccess={handleLoginSuccess}
        onSwitchToRegister={() => setAuthView('register')}
      />
    );
  }

  // Authenticated Dashboard Flow
  return (
    <div className="min-h-screen bg-[#fcfaf6] flex flex-col text-[#292524] selection:bg-orange-500 selection:text-white">
      {/* Navbar with Header & Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleNavTabChange}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        <Dashboard
          activeTab={activeTab}
          setActiveTab={handleNavTabChange}
          token={token}
          user={user}
        />
      </main>

      {/* Floating Chatbot Assistant Widget */}
      <Chatbot isOpen={isChatOpen} setIsOpen={setIsChatOpen} />

      {/* Fintech Footer */}
      <footer className="bg-[#f4ede2] border-t border-[#e4d8c5] py-6 text-center text-xs text-[#78716c]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            <strong>FraudShield</strong> • Code Cortex 3.0 (Finance Track) • VIT Vellore
          </span>
          <span className="text-[#a8a29e]">
            Powered by scikit-learn ML & FastAPI • Zero External AI APIs
          </span>
        </div>
      </footer>
    </div>
  );
}
