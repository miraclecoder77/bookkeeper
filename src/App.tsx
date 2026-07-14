import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { initDB } from './services/indexeddb';
import { initializeGoogle, getCurrentUser, logout } from './services/auth';
import { syncManager } from './services/syncManager';
import { Navigation } from './components/Navigation';
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Invoices } from './pages/Invoices';
import { Clients } from './pages/Clients';
import { Settings } from './pages/Settings';
import { User } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  /** Whether the user clicked CTA on the landing page to go to login */
  const [showLogin, setShowLogin] = useState(false);

  // Initialize app on load
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize IndexedDB
        await initDB();

        // Initialize Google SDKs and Clients
        await initializeGoogle();

        // Check if user is logged in
        const savedUser = await getCurrentUser();
        if (savedUser) {
          setUser(savedUser);
          setupSyncCallbacks();
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setInitError('Failed to initialize app. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  const setupSyncCallbacks = () => {
    syncManager.registerSync('transactions', async () => {
      console.log('Syncing transactions...');
    });

    syncManager.registerSync('invoices', async () => {
      console.log('Syncing invoices...');
    });

    syncManager.registerSync('clients', async () => {
      console.log('Syncing clients...');
    });

    syncManager.registerSync('settings', async () => {
      console.log('Syncing settings...');
    });
  };

  const handleLoginSuccess = async () => {
    const savedUser = await getCurrentUser();
    if (savedUser) {
      setUser(savedUser);
      setShowLogin(false);
      setupSyncCallbacks();
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      syncManager.cancelAll();
      setUser(null);
      setShowLogin(false);
    } catch (error) {
      console.error('Logout failed:', error);
      alert('Logout failed');
    }
  };

  // ── Loading screen ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-14 h-14 bg-gradient-brand rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-600/30 animate-pulse-slow">
            <span className="text-white font-display font-bold text-2xl">B</span>
          </div>
          <p className="text-slate-400 text-sm">Loading Bookkeeper…</p>
        </div>
      </div>
    );
  }

  // ── Init error screen ─────────────────────────────────────────────────
  if (initError) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <p className="text-danger-400 mb-4">{initError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 font-semibold transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // ── Unauthenticated: show landing or login ────────────────────────────
  if (!user) {
    if (showLogin) {
      return <Login onLoginSuccess={handleLoginSuccess} />;
    }
    return <LandingPage onGetStarted={() => setShowLogin(true)} />;
  }

  // ── Authenticated app ─────────────────────────────────────────────────
  return (
    <Router>
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900 text-slate-900 dark:text-slate-100">
        <Navigation onLogout={handleLogout} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-28 md:pb-8">
          <Routes>
            <Route path="/dashboard"    element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/invoices"     element={<Invoices />} />
            <Route path="/clients"      element={<Clients />} />
            <Route path="/settings"     element={<Settings />} />
            <Route path="/"             element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
