import React, { useState } from 'react';
import { loginWithGoogle, isGoogleConfigured, loginLocally } from '../services/auth';

interface LoginProps {
  onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle(onLoginSuccess);
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      setError('Google Sign-In failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLocalLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginLocally(onLoginSuccess);
    } catch (err: any) {
      console.error('Local login failed:', err);
      setError('Local login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const googleConfigured = isGoogleConfigured();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-600 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-8 border border-transparent dark:border-gray-700/50">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-3xl">B</span>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-2 font-sans">Bookkeeper</h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
          Simple freelance accounting made easy
        </p>

        {/* Google OAuth Login Button */}
        <div className="mb-4">
          <button
            onClick={handleLogin}
            disabled={loading || !googleConfigured}
            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-750 border border-gray-300 dark:border-gray-600 rounded-lg px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{loading ? 'Connecting...' : 'Sign in with Google'}</span>
          </button>
        </div>

        {/* Local Demo Login Button */}
        <div className="mb-8">
          <button
            onClick={handleLocalLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg px-6 py-3 text-sm font-medium text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Continue in Local Mode</span>
          </button>
        </div>

        {!googleConfigured && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 text-xs text-yellow-800 dark:text-yellow-400 mb-6 text-center rounded-lg">
            Google Sign-In is not configured. Set your Client ID and API Key in <code className="bg-yellow-100 dark:bg-yellow-900/40 px-1 py-0.5 rounded">.env.local</code> to enable Google Drive Sync.
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm mb-6 text-center border border-red-200 dark:border-red-800/50">
            {error}
          </div>
        )}

        {/* Feature List */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6 space-y-4">
          <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1">Why Bookkeeper?</p>
          
          <div className="flex items-start space-x-3">
            <div className="text-blue-600 dark:text-blue-400 font-bold text-sm">✓</div>
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">Offline First</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Works seamlessly offline and syncs when back online</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="text-blue-600 dark:text-blue-400 font-bold text-sm">✓</div>
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">Automatic Google Drive Sync</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Your data is stored securely in your own Google Drive folder</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="text-blue-600 dark:text-blue-400 font-bold text-sm">✓</div>
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">No Backend Server</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Private, secure and serverless. You own all of your business data</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="text-blue-600 dark:text-blue-400 font-bold text-sm">✓</div>
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">Invoicing & PDF Export</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Create, track, and export premium PDF invoices for clients</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
