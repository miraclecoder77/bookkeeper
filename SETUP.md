# Bookkeeper App - Setup Guide

## Quick Start

### 1. Get Google Cloud Credentials

Before running the app, you need to set up Google OAuth credentials:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Drive API**:
   - Search for "Google Drive API" in the search bar
   - Click Enable
4. Create OAuth 2.0 credentials:
   - Go to **Credentials** in the left menu
   - Click **Create Credentials** → **OAuth client ID**
   - Choose **Web application**
   - Add authorized redirect URIs:
     - `http://localhost:5173` (for development)
     - Your production domain (e.g., `https://yourdomain.com`)
   - Click Create
5. Copy your **Client ID**
6. Go back to **Credentials** and create an **API Key**:
   - Click **Create Credentials** → **API Key**
   - Copy the API key

### 2. Configure Environment Variables

1. In the project root, copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your credentials:
   ```
   VITE_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
   VITE_GOOGLE_API_KEY=your_api_key_here
   ```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

The app will open at `http://localhost:5173`

### 5. Build for Production

```bash
npm run build
npm run preview
```

## First Time Usage

1. **Sign In**: Click "Sign in with Google" and authorize the app
2. **App Folder Created**: The app will create a "BookkeeperApp" folder in your Google Drive
3. **Data Synced**: Your data will be synced to Google Drive automatically

## Important Notes

- **Data Privacy**: All your data stays on your device and Google Drive only
- **Offline Support**: The app works offline and syncs automatically when reconnected
- **Google Drive Scope**: The app only accesses files in the "BookkeeperApp" folder
- **No Backend**: This is a client-side only app, no data is stored on external servers

## Folder Structure

```
BookkeeperApp/ (in Google Drive)
├── transactions.json    # All transactions
├── invoices.json       # All invoices
├── clients.json        # All clients
└── settings.json       # Business settings
```

## Troubleshooting

### "Google Sign-In failed"
- Verify your Client ID is correct in `.env.local`
- Check that `http://localhost:5173` is in authorized redirect URIs

### "Sync Error"
- Check your internet connection
- Verify your Google Drive has available storage
- Check that the app has permission to access Google Drive

### Data Issues
- All data is backed up in your Google Drive `BookkeeperApp` folder
- You can manually download JSON files as backups

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Next Steps

1. Configure your business settings (name, logo, currency)
2. Add your clients
3. Start tracking transactions
4. Create and send invoices
5. Monitor your dashboard

---

For more information, see [README.md](./README.md)
