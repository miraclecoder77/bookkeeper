import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { initDB } from './services/indexeddb';
import { initializeGoogle, getCurrentUser, logout } from './services/auth';
import { syncManager } from './services/syncManager';
import { Navigation } from './components/Navigation';
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
    // These would be set up with actual sync functions
    // For now, they're placeholder implementations
    syncManager.registerSync('transactions', async () => {
      // Sync transactions to Drive
      console.log('Syncing transactions...');
    });

    syncManager.registerSync('invoices', async () => {
      // Sync invoices to Drive
      console.log('Syncing invoices...');
    });

    syncManager.registerSync('clients', async () => {
      // Sync clients to Drive
      console.log('Syncing clients...');
    });

    syncManager.registerSync('settings', async () => {
      // Sync settings to Drive
      console.log('Syncing settings...');
    });
  };

  const handleLoginSuccess = async () => {
    const savedUser = await getCurrentUser();
    if (savedUser) {
      setUser(savedUser);
      setupSyncCallbacks();
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      syncManager.cancelAll();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      alert('Logout failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">B</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Loading Bookkeeper...</p>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{initError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <Navigation onLogout={handleLogout} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
