<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Bookkeeper App - Project Documentation

Client-side bookkeeping web app for freelancers with IndexedDB local storage and Google Drive sync. React 18 + Vite + TailwindCSS, no backend required.

## ✅ Project Status: Complete

All core features have been implemented and the app is ready to configure and run.

## Key Architecture

- **Frontend**: React 18 + Vite with TailwindCSS
- **Auth**: Google OAuth 2.0 (drive.file scope)
- **Local Storage**: IndexedDB with idb wrapper
- **Cloud Sync**: Google Drive REST API v3 (JSON files)
- **Charts**: Recharts for dashboard
- **PDF Export**: jsPDF + html2canvas for invoices

## Core Features Implemented

- ✅ Authentication with Google OAuth 2.0
- ✅ Offline-first with automatic Drive sync
- ✅ Dashboard with net income, invoices, transactions, monthly chart
- ✅ Transaction management (income/expense) with CSV export
- ✅ Invoice builder with PDF export
- ✅ Client address book
- ✅ Business settings (name, logo, currency)
- ✅ Sync status indicator in navigation
- ✅ Debounced sync (2 seconds)
- ✅ Offline queue and flush on reconnect
- ✅ Mobile-friendly UI

## Project Structure

```
src/
├── components/      # UI components (Button, Card, Input, Badge, Navigation)
├── hooks/          # Custom hooks (useTransactions, useInvoices, useClients, useSettings, useSyncStatus)
├── pages/          # Page components (Dashboard, Transactions, Invoices, Clients, Settings, Login)
├── services/       # Business logic (indexeddb, auth, drive, syncManager)
├── types.ts        # TypeScript definitions
├── config.ts       # Configuration
├── App.tsx         # Main app
└── main.tsx        # Entry point
```

## To Get Started

1. **See SETUP.md** for complete setup instructions
2. **See ARCHITECTURE.md** for technical deep dive
3. **See README.md** for feature documentation

## Quick Start

```bash
# 1. Configure .env.local with Google credentials (see SETUP.md)
cp .env.example .env.local

# 2. Install dependencies
npm install

# 3. Run development server
npm run dev

# 4. Open http://localhost:5173 and sign in with Google
```

## Development Guidelines

- Keep IndexedDB as the working layer (fast)
- Google Drive files are the source of truth
- Debounce Drive syncs by 2 seconds
- Queue writes when offline, flush on reconnect
- Mobile-friendly UI throughout
- Use TailwindCSS utilities for styling
- Keep components small and reusable
- Use custom hooks for business logic

## File Locations

- **Setup Guide**: [SETUP.md](./SETUP.md)
- **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Features**: [README.md](./README.md)
- **Environment Config**: [.env.example](./.env.example)
- **Tailwind Config**: [tailwind.config.js](./tailwind.config.js)

## Next Steps

1. Add Google OAuth credentials to `.env.local`
2. Run `npm run dev` to start development server
3. Test Google login
4. Verify IndexedDB and Drive sync working
5. Configure business settings
6. Test all features
7. Run `npm run build` for production

## Tech Stack Versions

- React: 18.3.1
- Vite: 8.0.16
- TypeScript: 5.3.3
- TailwindCSS: 3.4.1
- idb: 8.0.0
- Recharts: 2.15.4
- jsPDF: 4.2.1
- html2canvas: 1.4.1

## Build Commands

- `npm run dev` - Start development server (http://localhost:5173)
- `npm run build` - Build for production (outputs to dist/)
- `npm run preview` - Preview production build locally

## Notes

- No backend server required - complete client-side application
- All data stored in IndexedDB locally and synced to user's Google Drive
- Works offline with automatic sync on reconnect
- Privacy-focused: no data stored on external servers
- Responsive design works on all devices

