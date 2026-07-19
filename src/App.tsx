import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { initDB } from './services/indexeddb';
import * as dal from './services/dal';
import { Navigation } from './components/Navigation';
import { LandingPage } from './pages/LandingPage';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Invoices } from './pages/Invoices';
import { Clients } from './pages/Clients';
import { Settings } from './pages/Settings';
import { Insights } from './pages/Insights';
import { Capture } from './pages/Capture';

const App: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [wiped, setWiped] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initDB();

        // 1. Check remote wipe status first
        const deviceId = localStorage.getItem('bookkeeper_device_id') || '';
        const deviceSecret = localStorage.getItem(`bk_device_secret_${deviceId}`) || '';
        if (deviceId && deviceSecret) {
          const checkWipe = await dal.auth.checkWipeStatus(deviceId, deviceSecret);
          if (checkWipe.ok && checkWipe.data?.wipeRequested) {
            // Irreversible remote wipe requested
            const db = await initDB();
            await db.clear('userProfile');
            await db.clear('clients');
            await db.clear('categories');
            await db.clear('transactions');
            await db.clear('invoices');
            await db.clear('invoiceLineItems');
            await db.clear('attachments');
            await db.clear('insights');
            await db.clear('capturedDocuments');
            
            localStorage.clear();
            await dal.auth.acknowledgeWipeComplete(deviceId, deviceSecret);
            setWiped(true);
            setLoading(false);
            return;
          }
        }

        // 2. Load user profile
        const profRes = await dal.profile.get();
        if (profRes.ok && profRes.data) {
          const userProf = profRes.data;
          // If the display name is still default 'Freelancer', prompt for onboarding
          if (userProf.displayName === 'Freelancer') {
            setNeedsOnboarding(true);
          } else {
            setProfile(userProf);
          }
        } else {
          setNeedsOnboarding(true);
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

  const handleOnboardingComplete = async () => {
    const profRes = await dal.profile.get();
    if (profRes.ok && profRes.data) {
      setProfile(profRes.data);
      setNeedsOnboarding(false);
    }
  };

  const handleLogout = async () => {
    await dal.auth.logout();
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 bg-gradient-to-tr from-brand-600 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-600/30 animate-pulse">
            <span className="text-white font-display font-bold text-2xl">B</span>
          </div>
          <p className="text-slate-400 text-sm">Loading Bookkeeper…</p>
        </div>
      </div>
    );
  }

  if (wiped) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="w-12 h-12 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-center mx-auto mb-4 text-red-500">
            ⚠
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Remote Erase Executed</h1>
          <p className="text-slate-400 text-sm mb-6">
            All database tables, cached financial documents, and session keys have been erased successfully.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold transition-colors"
          >
            Start Fresh Onboarding
          </button>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <p className="text-red-400 mb-4">{initError}</p>
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

  // If user is not onboarded, default to landing page.
  // Clicking "Get Started" on the landing page will set showOnboarding to true.
  if (needsOnboarding) {
    if (showOnboarding) {
      return <Onboarding onComplete={handleOnboardingComplete} />;
    }
    return <LandingPage onGetStarted={() => setShowOnboarding(true)} />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 md:pb-0">
        <Navigation onLogout={handleLogout} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <Routes>
            <Route path="/dashboard"    element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/invoices"     element={<Invoices />} />
            <Route path="/clients"      element={<Clients />} />
            <Route path="/capture"      element={<Capture />} />
            <Route path="/insights"     element={<Insights />} />
            <Route path="/settings"     element={<Settings />} />
            <Route path="*"             element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
