import { User } from '../types';
import { saveUser, deleteUser, getUser } from './indexeddb';
import { initializeDriveConnection } from './drive';

declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

let gapiInitialized = false;

export const isGoogleConfigured = (): boolean => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  return !!(
    clientId &&
    clientId !== 'your_client_id_here.apps.googleusercontent.com' &&
    apiKey &&
    apiKey !== 'your_api_key_here'
  );
};

export const isGoogleInitialized = (): boolean => {
  return gapiInitialized;
};

export const loginLocally = async (onSignIn?: () => void): Promise<void> => {
  const localUser: User = {
    id: 'local_user',
    email: 'local@bookkeeper.local',
    name: 'Local User',
    picture: '',
    accessToken: 'local',
    tokenExpiry: Date.now() + 365 * 24 * 60 * 60 * 1000,
  };
  await saveUser(localUser);
  if (onSignIn) {
    onSignIn();
  }
};

export const initializeGoogle = (): Promise<void> => {
  return new Promise((resolve) => {
    if (gapiInitialized) {
      resolve();
      return;
    }

    if (!isGoogleConfigured()) {
      console.warn('Google client ID or API Key is not configured. Google Drive sync will be disabled.');
      resolve();
      return;
    }

    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.warn('Google SDK initialization timed out. Operating in offline/local-only mode.');
        resolve();
      }
    }, 2500);

    const checkAndInit = () => {
      if (typeof window.gapi !== 'undefined' && typeof window.google !== 'undefined') {
        window.gapi.load('client', async () => {
          try {
            await window.gapi.client.init({
              apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
              discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
            });
            gapiInitialized = true;
            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              resolve();
            }
          } catch (err) {
            console.error('Error initializing GAPI client:', err);
            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              resolve(); // Resolve anyway to allow local app operation
            }
          }
        });
      } else {
        if (!resolved) {
          setTimeout(checkAndInit, 100);
        }
      }
    };

    checkAndInit();
  });
};

const fetchUserProfile = async (accessToken: string) => {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) {
    throw new Error('Failed to fetch user profile');
  }
  return await res.json();
};

export const loginWithGoogle = (onSignIn?: () => void): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!isGoogleConfigured() || !window.google || !CLIENT_ID) {
      reject(new Error('Google Sign-In/OAuth SDK is not loaded or configured'));
      return;
    }

    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
        callback: async (response: any) => {
          if (response.error) {
            console.error('Token request error:', response);
            reject(response);
            return;
          }

          try {
            const userData = await fetchUserProfile(response.access_token);
            const tokenExpiry = Date.now() + response.expires_in * 1000;

            const user: User = {
              id: userData.sub,
              email: userData.email,
              name: userData.name,
              picture: userData.picture,
              accessToken: response.access_token,
              tokenExpiry,
            };

            await saveUser(user);
            initializeDriveConnection(user.accessToken);

            if (onSignIn) {
              onSignIn();
            }
            resolve();
          } catch (error) {
            console.error('Failed to process oauth credential response:', error);
            reject(error);
          }
        },
      });

      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (error) {
      console.error('Failed to request access token:', error);
      reject(error);
    }
  });
};

export const getCurrentUser = async (): Promise<User | null> => {
  const user = await getUser();
  if (!user) return null;

  // If token is expired or close to expiring, return user but note it (or could return null to force login)
  if (user.tokenExpiry && Date.now() > user.tokenExpiry) {
    console.warn('Cached Google OAuth token is expired');
  } else {
    initializeDriveConnection(user.accessToken);
  }
  
  return user;
};

export const logout = async (): Promise<void> => {
  await deleteUser();
};
