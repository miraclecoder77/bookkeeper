# Bookkeeper

Bookkeeper is a privacy-focused bookkeeping web app for freelancers and solopreneurs. It is designed to work well both online and offline, with data stored locally first and backed up to Google Drive.

## What it does

Bookkeeper helps you manage the core parts of a small business workflow in one place:

- Track income and expense transactions
- Create and manage invoices
- Maintain a client address book
- Monitor your dashboard with key financial summaries
- Configure business settings such as your name, logo, and currency
- Keep your data synced to Google Drive automatically

## Key features

- Offline-first experience with local storage in IndexedDB
- Google sign-in and Google Drive backup/sync
- Dashboard for net income, outstanding invoices, overdue invoices, and monthly trends
- Transaction management with categories, notes, and date-based tracking
- Invoice builder with PDF export
- Client management for contacts and billing details
- CSV export for transactions
- Responsive UI that works well on desktop and mobile

## Tech stack

- React 18 + TypeScript + Vite
- Tailwind CSS for styling
- IndexedDB via the idb library
- Google Drive REST API for cloud sync
- Recharts for charts
- jsPDF and html2canvas for invoice export
- Lucide React for icons

## Getting started

### Prerequisites

- Node.js 18 or newer
- npm
- A Google Cloud project with OAuth credentials and the Google Drive API enabled

### 1. Configure Google credentials

1. Open the Google Cloud Console.
2. Create or select a project.
3. Enable the Google Drive API.
4. Create OAuth 2.0 credentials for a web application.
5. Add your local redirect URI, such as http://localhost:5173.
6. Copy your client ID and API key.

### 2. Set up environment variables

Copy the example environment file and add your credentials:

```bash
cp .env.example .env.local
```

Then update .env.local with:

```env
VITE_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=your_api_key_here
```

### 3. Install dependencies

```bash
npm install
```

### 4. Run the app locally

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

### 5. Build for production

```bash
npm run build
```

## How data works

Bookkeeper uses a local-first approach:

1. Your data is stored in IndexedDB for fast access.
2. Changes are synced to your Google Drive as JSON files in a BookkeeperApp folder.
3. If you go offline, changes are queued and synced once the connection is restored.

## Project structure

```text
src/
├── components/   # Reusable UI components
├── hooks/        # Data and state management hooks
├── pages/        # Main app pages
├── services/     # IndexedDB, auth, Drive, and sync logic
├── types.ts      # Shared TypeScript types
└── App.tsx       # App shell and routing
```

## Development commands

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## Notes

- This app does not require a backend server.
- Your data stays on your device first and is backed up to your own Google Drive account.
- It is aimed at solo freelancers and small service businesses.

## License

This project is available under the MIT License. Made with love
