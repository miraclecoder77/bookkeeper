# Bookkeeper App - Architecture Overview

## Project Summary

A complete offline-first bookkeeping web app for freelancers built with React, Vite, TailwindCSS, and Google Drive sync.

## What Has Been Built

### Core Features Implemented

✅ **Authentication**
- Google OAuth 2.0 login
- Secure token management
- User session persistence

✅ **Data Storage**
- IndexedDB for local storage (fast access)
- Google Drive sync for cloud backup
- Automatic conflict resolution (Drive is source of truth)
- Offline queueing for when internet is unavailable

✅ **Dashboard**
- Net income calculation
- Outstanding/overdue invoices tracking
- Recent transactions display
- Monthly income vs. expenses chart
- Invoice status overview

✅ **Transactions**
- Add/edit/delete income and expenses
- Categorize transactions
- Filter by type, category, or date
- CSV export functionality

✅ **Invoices**
- Create invoices with multiple line items
- Assign clients to invoices
- Track invoice status (draft, sent, paid, overdue)
- PDF export with formatting
- Custom notes and terms

✅ **Clients**
- Create and manage client contacts
- Store address, phone, email, tax ID
- Search functionality
- View all invoices for each client

✅ **Settings**
- Configure business information
- Upload business logo
- Set currency and tax rates
- View sync status

✅ **Sync Management**
- Real-time sync status indicator
- Debounced syncing (2-second delays)
- Offline queue for pending changes
- Automatic reconnection and flush

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Button.tsx       # Styled button component
│   ├── Card.tsx         # Container component
│   ├── Input.tsx        # Form input with validation
│   ├── Select.tsx       # Dropdown select
│   ├── Textarea.tsx     # Multi-line text input
│   ├── Badge.tsx        # Status badges
│   └── Navigation.tsx   # Top navigation bar
│
├── pages/               # Full page components
│   ├── Login.tsx        # Google OAuth login page
│   ├── Dashboard.tsx    # Financial overview
│   ├── Transactions.tsx # Transaction management
│   ├── Invoices.tsx     # Invoice management
│   ├── Clients.tsx      # Client directory
│   └── Settings.tsx     # App settings
│
├── hooks/               # Custom React hooks
│   ├── useTransactions.ts  # Transaction data logic
│   ├── useInvoices.ts      # Invoice data logic
│   ├── useClients.ts       # Client data logic
│   ├── useSettings.ts      # Settings data logic
│   └── useSyncStatus.ts    # Sync status tracking
│
├── services/            # Business logic
│   ├── indexeddb.ts     # IndexedDB operations
│   ├── auth.ts          # Google OAuth flow
│   ├── drive.ts         # Google Drive API integration
│   └── syncManager.ts   # Sync coordination & offline queueing
│
├── types.ts             # TypeScript type definitions
├── config.ts            # App configuration
├── App.tsx              # Main app component
├── main.tsx             # React entry point
└── index.css            # Global styles
```

## Data Flow Architecture

### Local Storage (IndexedDB)
```
User Action → IndexedDB Update (Immediate) → UI Update
                        ↓
                  Sync Manager
                        ↓
            Google Drive (Debounced 2s)
```

### Offline Support
```
User Action (Offline) → IndexedDB Update → Queue for Sync
                                    ↓
                        Internet Reconnects
                                    ↓
                        Flush Queue → Google Drive
```

## Technology Stack Details

### Frontend Framework
- **React 18**: UI library with hooks for state management
- **Vite 8**: Fast build tool and dev server
- **TypeScript**: Type-safe JavaScript

### Styling
- **TailwindCSS**: Utility-first CSS framework
- **Responsive Design**: Mobile-friendly layouts

### Storage
- **idb**: Wrapper around IndexedDB for simplified async operations
- **IndexedDB**: Client-side persistent storage
  - Stores: transactions, invoices, clients, settings, user
  - Fast reads/writes for instant UI feedback
  - Survives page refreshes

### Cloud Sync
- **Google Drive REST API v3**: Cloud storage and backup
- **OAuth 2.0**: Secure authentication
- **Custom SyncManager**: Handles debouncing, offline queueing, and status tracking

### UI/UX
- **Recharts**: Interactive charts for dashboard
- **jsPDF + html2canvas**: PDF export for invoices
- **Lucide React**: Icon library
- **React Router**: Client-side routing

## Key Design Decisions

### 1. Offline-First Architecture
- IndexedDB is the primary data store
- All changes immediately update the UI
- Google Drive acts as backup and sync source
- Changes queue when offline and flush when reconnected

### 2. Sync Strategy
- **2-second debounce**: Prevents excessive Drive API calls
- **Drive is source of truth**: On conflicts, Drive data wins
- **Automatic merging**: New data from Drive merges with local changes
- **Status indicator**: Shows sync state to user

### 3. No Backend Server
- Complete client-side execution
- All data encrypted in transit via HTTPS
- User owns all data in their Google Drive
- Privacy-focused (no third-party data storage)

### 4. Component Architecture
- Stateless presentational components (Button, Card, Badge)
- Form components with built-in validation
- Container components that manage state
- Custom hooks for business logic

### 5. Data Isolation
- Stores data only in Drive's "BookkeeperApp" folder
- Each data type in separate JSON file
- Easy manual export/backup
- Clear data ownership

## API Integration Points

### Google Authentication
```typescript
window.google.accounts.id.initialize() // Set up OAuth
window.google.accounts.id.renderButton() // Render login button
```

### Google Drive API
```typescript
gapi.client.drive.files.list()   // List files
gapi.client.drive.files.create() // Create file
gapi.client.drive.files.update() // Update file
gapi.client.drive.files.get()    // Get file content
```

### IndexedDB
```typescript
db.put(store, data)      // Save data
db.get(store, id)        // Retrieve data
db.getAll(store)         // Get all records
db.delete(store, id)     // Delete data
db.clear(store)          // Clear entire store
```

## File Formats

### transactions.json
```json
[
  {
    "id": "unique_id",
    "type": "income" | "expense",
    "amount": 1000.00,
    "category": "Client Payment",
    "description": "Monthly retainer",
    "date": "2024-01-15",
    "receiptUrl": "optional_url"
  }
]
```

### invoices.json
```json
[
  {
    "id": "unique_id",
    "clientId": "client_id",
    "invoiceNumber": "INV-001",
    "status": "draft" | "sent" | "paid" | "overdue",
    "issueDate": "2024-01-01",
    "dueDate": "2024-02-01",
    "lineItems": [
      {
        "id": "item_id",
        "description": "Web design",
        "quantity": 10,
        "unitPrice": 100.00
      }
    ],
    "total": 1000.00,
    "notes": "optional"
  }
]
```

### clients.json
```json
[
  {
    "id": "unique_id",
    "name": "Acme Inc",
    "email": "contact@acme.com",
    "address": "123 Main St",
    "phone": "555-1234",
    "taxId": "12-3456789"
  }
]
```

### settings.json
```json
{
  "id": "default",
  "name": "Your Business",
  "email": "you@example.com",
  "phone": "555-1234",
  "address": "123 Main St",
  "taxId": "12-3456789",
  "logo": "base64_encoded_image",
  "currency": "USD",
  "taxRate": 0.00
}
```

## Security Considerations

1. **OAuth 2.0**: Secure token-based authentication
2. **HTTPS Only**: All Google API communication encrypted
3. **Limited Scope**: Only accesses "BookkeeperApp" folder in Drive
4. **No Credentials Stored**: OAuth tokens handled by browser/Google
5. **Client-Side**: No sensitive data sent to external servers
6. **IndexedDB**: Isolated per-origin storage

## Performance Optimizations

1. **Lazy Loading**: Components loaded on-demand
2. **Debounced Sync**: Prevents excessive API calls
3. **Batch Operations**: Group multiple changes for sync
4. **Memoization**: React useMemo for expensive computations
5. **Code Splitting**: Vite automatically optimizes bundle

## Browser Compatibility

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Requires IndexedDB support
- Requires modern ES2020 support

## Future Enhancement Possibilities

- Multi-user accounts (team collaboration)
- Email notifications for overdue invoices
- Payment gateway integration
- Receipt image uploads
- Expense categorization AI
- Tax report generation
- Mobile app (React Native)
- Recurring transactions/invoices
- Budget tracking and alerts
- Client portal for invoice viewing

## Development Workflow

1. **Start Dev Server**: `npm run dev`
2. **Make Changes**: Edit components/pages/services
3. **Hot Reload**: Vite automatically refreshes
4. **Test Locally**: Access at http://localhost:5173
5. **Build**: `npm run build` for production

## Deployment Options

- **Vercel**: Zero-config deployment for Vite apps
- **Netlify**: Similar one-click deployment
- **GitHub Pages**: Static hosting
- **Self-hosted**: Any static file server
- **Docker**: Containerized deployment

## Environment Variables

```
VITE_GOOGLE_CLIENT_ID    # Your Google OAuth Client ID
VITE_GOOGLE_API_KEY      # Your Google API Key
```

These must be prefixed with `VITE_` to be exposed to the client.

---

This architecture provides a secure, private, and performant bookkeeping solution that works offline and syncs seamlessly to Google Drive.
