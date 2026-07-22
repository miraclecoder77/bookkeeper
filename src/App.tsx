import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { initDB } from './services/indexeddb';
import * as dal from './services/dal';
import { Navigation } from './components/Navigation';
import { ThemeProvider } from './components/ThemeProvider';
import { LandingPage } from './pages/LandingPage';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { Activity } from './pages/Activity';
import { Invoices } from './pages/Invoices';
import { Clients } from './pages/Clients';
import { Settings } from './pages/Settings';

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
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 bg-brand-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-brand animate-pulse">
            <span className="text-white font-display font-bold text-2xl">B</span>
          </div>
          <p className="font-sans text-slate-400 text-sm">Loading Bookkeeper…</p>
        </div>
      </div>
    );
  }

  if (wiped) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
        <div className="text-center w-full max-w-md bg-surface border border-default rounded-2xl p-8 shadow-elevated">
          <div className="w-12 h-12 bg-expense/10 border border-expense/30 rounded-xl flex items-center justify-center mx-auto mb-4 text-expense">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-display font-bold text-primary mb-2">Remote Erase Executed</h1>
          <p className="text-secondary text-sm mb-6">
            All database tables, cached financial documents, and session keys have been erased successfully.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary w-full"
          >
            Start Fresh
          </button>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
        <div className="text-center max-w-sm w-full">
          <div className="w-12 h-12 bg-expense/10 border border-expense/30 rounded-xl flex items-center justify-center mx-auto mb-4 text-expense">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-expense mb-4 font-sans">{initError}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-ghost"
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
    return (
      <ThemeProvider>
        {showOnboarding ? (
          <Onboarding onComplete={handleOnboardingComplete} />
        ) : (
          <LandingPage onGetStarted={() => setShowOnboarding(true)} />
        )}
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-canvas">
          <Navigation onLogout={handleLogout} />
          <main className="pt-14 md:pt-24 pb-[72px] md:pb-8 max-w-[448px] md:max-w-7xl mx-auto px-4 md:px-8 w-full transition-all duration-300">
            <div className="py-4">
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/activity"  element={<Activity />} />
                <Route path="/invoices"  element={<Invoices />} />
                <Route path="/clients"   element={<Clients />} />
                <Route path="/settings"  element={<Settings />} />
                <Route path="*"          element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </div>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  );
};

export default App;
