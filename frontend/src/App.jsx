import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Chatbot from './components/Chatbot';
import { X } from 'lucide-react';

const INITIAL_SAMPLE_LOGS = [
  {
    id: 101,
    timestamp: '08:30:15 AM',
    amount: 4.50,
    prediction: 'LEGITIMATE',
    fraud_probability: 0.038,
    risk_level: 'LOW',
    recommended_action: 'Approve Automatically',
    threshold_used: 0.70,
    top_factor: 'V14'
  },
  {
    id: 102,
    timestamp: '05:15:22 PM',
    amount: 78.25,
    prediction: 'LEGITIMATE',
    fraud_probability: 0.062,
    risk_level: 'LOW',
    recommended_action: 'Approve Automatically',
    threshold_used: 0.70,
    top_factor: 'V12'
  },
  {
    id: 103,
    timestamp: '03:15:40 AM',
    amount: 1850.00,
    prediction: 'FRAUD',
    fraud_probability: 0.994,
    risk_level: 'HIGH',
    recommended_action: 'Decline & Flag Transaction',
    threshold_used: 0.70,
    top_factor: 'V14'
  }
];

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

  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'dataset' | 'hotspots' | 'batch' | 'model' | 'audit' | 'assistant'
  const [focusedTransferId, setFocusedTransferId] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'

  const handleFocusTransfer = (transferId) => {
    setFocusedTransferId(transferId);
    setActiveTab('hotspots');
  };

  // Audit Logs State
  const [logs, setLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('fraudshield_audit_logs');
      return saved ? JSON.parse(saved) : INITIAL_SAMPLE_LOGS;
    } catch {
      return INITIAL_SAMPLE_LOGS;
    }
  });

  // Persist logs
  useEffect(() => {
    try {
      localStorage.setItem('fraudshield_audit_logs', JSON.stringify(logs));
    } catch {
      // ignore
    }
  }, [logs]);

  // Validate stored token or auto-acquire guest token
  useEffect(() => {
    if (token) {
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
          // Fall back to guest session
          acquireGuestSession();
        });
    } else {
      acquireGuestSession();
    }
  }, []);

  const acquireGuestSession = async () => {
    try {
      const res = await fetch('/auth/guest', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setToken(data.access_token);
        setUser(data.user);
        localStorage.setItem('fraudshield_token', data.access_token);
        localStorage.setItem('fraudshield_user', JSON.stringify(data.user));
      }
    } catch (e) {
      console.error('Failed to initialize guest session', e);
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleLoginSuccess = (userData, accessToken) => {
    setUser(userData);
    setToken(accessToken);
    localStorage.setItem('fraudshield_token', accessToken);
    localStorage.setItem('fraudshield_user', JSON.stringify(userData));
    setShowAuthModal(false);
  };

  const handleRegisterSuccess = (userData, accessToken) => {
    setUser(userData);
    setToken(accessToken);
    localStorage.setItem('fraudshield_token', accessToken);
    localStorage.setItem('fraudshield_user', JSON.stringify(userData));
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('fraudshield_token');
    localStorage.removeItem('fraudshield_user');
    acquireGuestSession();
  };

  const handleNavTabChange = (tabId) => {
    if (tabId === 'assistant') {
      setIsChatOpen(true);
    }
    setActiveTab(tabId);
  };

  const handleTransactionEvaluated = (newRecord) => {
    setLogs((prev) => [newRecord, ...prev]);
  };

  const handleBatchEvaluated = (batchData) => {
    if (!batchData || !batchData.results) return;
    const now = new Date().toLocaleTimeString();
    const batchRecords = batchData.results.map((r) => ({
      id: Date.now() + Math.random(),
      timestamp: now,
      amount: r.amount,
      prediction: r.prediction,
      fraud_probability: r.fraud_probability,
      risk_level: r.risk_level,
      recommended_action: r.recommended_action,
      threshold_used: batchData.threshold_applied,
      top_factor: r.top_factor
    }));
    setLogs((prev) => [...batchRecords, ...prev]);
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  const handleSeedSampleLogs = () => {
    setLogs(INITIAL_SAMPLE_LOGS);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#fcfaf6] flex flex-col items-center justify-center text-sm font-semibold text-[#78716c] gap-3">
        <div className="w-8 h-8 border-3 border-orange-600 border-t-transparent rounded-full animate-spin" />
        <span>Initializing FraudShield Security Core...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfaf6] flex flex-col text-[#292524] selection:bg-orange-500 selection:text-white">
      {/* Navbar with Header & Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleNavTabChange}
        user={user}
        onLogout={handleLogout}
        onOpenAuthModal={() => {
          setAuthView('login');
          setShowAuthModal(true);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        <Dashboard
          activeTab={activeTab}
          setActiveTab={handleNavTabChange}
          token={token}
          user={user}
          logs={logs}
          onTransactionEvaluated={handleTransactionEvaluated}
          onBatchEvaluated={handleBatchEvaluated}
          onClearLogs={handleClearLogs}
          onSeedSampleLogs={handleSeedSampleLogs}
          focusedTransferId={focusedTransferId}
          onClearFocus={() => setFocusedTransferId(null)}
        />
      </main>

      {/* Floating Chatbot Assistant Widget with Dataset Analytics & Transfer Locator */}
      <Chatbot 
        isOpen={isChatOpen} 
        setIsOpen={setIsChatOpen} 
        logs={logs}
        onDatasetUploaded={(newRows) => setLogs(prev => [...newRows, ...prev])}
        onFocusTransfer={handleFocusTransfer}
      />

      {/* Optional Auth Modal (Sign In / Register) */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#fcfaf6] rounded-2xl shadow-2xl border border-[#e4d8c5] overflow-hidden">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#78716c] hover:text-[#1c1917] hover:bg-[#ebdcc7] transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6">
              {authView === 'register' ? (
                <Register
                  onRegisterSuccess={handleRegisterSuccess}
                  onSwitchToLogin={() => setAuthView('login')}
                />
              ) : (
                <Login
                  onLoginSuccess={handleLoginSuccess}
                  onSwitchToRegister={() => setAuthView('register')}
                />
              )}
            </div>
          </div>
        </div>
      )}

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
