# Graph Report - bookkeeper  (2026-07-19)

## Corpus Check
- 54 files · ~27,605 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 363 nodes · 602 edges · 34 communities (20 shown, 14 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c43f2a12`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- UI Components and Invoices
- Database access and invoice hooks
- Development dependencies configuration
- Navigation and theme providers
- External dependencies
- Google Drive sync services
- OAuth authentication pages
- Sync management system
- TypeScript project configuration
- App landing page
- Payment method picker component
- Currency utility functions
- Project documentation files
- Vite environment types
- Textarea input component
- User onboarding page
- Graphify rules document
- Graphify workflows document
- Copilot custom instructions
- Netlify deployment CI
- Index HTML entrypoint
- Favicon SVG assets
- Bookkeeper App - Setup Guide
- Bookkeeper App - Project Documentation
- graphify.md
- graphify.md
- Quick Start Guide
- Project README
- Setup Instructions

## God Nodes (most connected - your core abstractions)
1. `✅ Bookkeeper App - Project Complete` - 17 edges
2. `Bookkeeper App - Architecture Overview` - 16 edges
3. `BookkeeperDB` - 14 edges
4. `Bookkeeper App - Project Documentation` - 13 edges
5. `SyncManager` - 12 edges
6. `getDB()` - 11 edges
7. `getDriveFileId()` - 10 edges
8. `Client` - 10 edges
9. `useUserProfile()` - 9 edges
10. `Card()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `Invoices()` --references--> `jspdf`  [EXTRACTED]
  src/pages/Invoices.tsx → package.json
- `Navigation()` --indirect_call--> `Settings()`  [INFERRED]
  src/components/Navigation.tsx → src/pages/Settings.tsx
- `runAllTests()` --calls--> `initDB()`  [EXTRACTED]
  src/__tests__/dal.test.ts → src/services/indexeddb.ts
- `Dashboard()` --calls--> `useTheme()`  [EXTRACTED]
  src/pages/Dashboard.tsx → src/components/ThemeProvider.tsx
- `BookkeeperDB` --references--> `Client`  [EXTRACTED]
  src/services/indexeddb.ts → src/types.ts

## Import Cycles
- None detected.

## Communities (34 total, 14 thin omitted)

### Community 0 - "UI Components and Invoices"
Cohesion: 0.10
Nodes (35): Badge(), BadgeProps, Button, ButtonProps, Card(), CardProps, Input, InputProps (+27 more)

### Community 1 - "Database access and invoice hooks"
Cohesion: 0.10
Nodes (35): App(), ai, attachmentCrud, auth, capDocCrud, capture, categoryCrud, clientCrud (+27 more)

### Community 2 - "Development dependencies configuration"
Cohesion: 0.07
Nodes (26): autoprefixer, devDependencies, autoprefixer, postcss, tailwindcss, @types/react, @types/react-dom, typescript (+18 more)

### Community 3 - "Navigation and theme providers"
Cohesion: 0.11
Nodes (11): Navigation(), NavigationProps, Theme, ThemeContext, ThemeContextType, ThemeProvider(), useTheme(), useSettings() (+3 more)

### Community 4 - "External dependencies"
Cohesion: 0.12
Nodes (17): html2canvas, idb, jspdf, lucide-react, dependencies, html2canvas, idb, jspdf (+9 more)

### Community 5 - "Google Drive sync services"
Cohesion: 0.28
Nodes (14): DRIVE_FILE_NAMES, STORES, downloadFile(), getAppFolderOrCreate(), getDriveFileId(), loadClientsFromServer(), loadInvoicesFromServer(), loadSettingsFromServer() (+6 more)

### Community 6 - "OAuth authentication pages"
Cohesion: 0.24
Nodes (11): Login(), LoginProps, fetchUserProfile(), getCurrentUser(), initializeGoogle(), isGoogleConfigured(), loginLocally(), loginWithGoogle() (+3 more)

### Community 7 - "Sync management system"
Cohesion: 0.06
Nodes (36): 1. Offline-First Architecture, 2. Sync Strategy, 3. No Backend Server, 4. Component Architecture, 5. Data Isolation, API Integration Points, Bookkeeper App - Architecture Overview, Browser Compatibility (+28 more)

### Community 8 - "TypeScript project configuration"
Cohesion: 0.22
Nodes (8): vite.config.ts, compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, skipLibCheck, include

### Community 10 - "Payment method picker component"
Cohesion: 0.07
Nodes (29): 1. Get Google Credentials, 2. Configure App, 3. Run It, 🏗️ Architecture, Available Commands, ✅ Bookkeeper App - Project Complete, ✅ Checklist Before Going Live, Data Files in Google Drive (+21 more)

### Community 11 - "Currency utility functions"
Cohesion: 0.50
Nodes (3): CURRENCY_SYMBOLS, formatCurrency(), getCurrencySymbol()

### Community 13 - "Vite environment types"
Cohesion: 0.50
Nodes (3): ImportMeta, ImportMetaEnv, Window

### Community 15 - "User onboarding page"
Cohesion: 0.11
Nodes (15): 1. Configure Google credentials, 2. Set up environment variables, 3. Install dependencies, 4. Run the app locally, 5. Build for production, Development commands, Getting started, How data works (+7 more)

### Community 27 - "Bookkeeper App - Setup Guide"
Cohesion: 0.12
Nodes (16): 1. Get Google Cloud Credentials, 2. Configure Environment Variables, 3. Install Dependencies, 4. Run Development Server, 5. Build for Production, Bookkeeper App - Setup Guide, Data Issues, Development Commands (+8 more)

### Community 28 - "Bookkeeper App - Project Documentation"
Cohesion: 0.14
Nodes (13): Bookkeeper App - Project Documentation, Build Commands, Core Features Implemented, Development Guidelines, File Locations, Key Architecture, Next Steps, Notes (+5 more)

## Knowledge Gaps
- **178 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+173 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `External dependencies` to `Development dependencies configuration`?**
  _High betweenness centrality (0.112) - this node is a cross-community bridge._
- **Why does `Invoices()` connect `UI Components and Invoices` to `External dependencies`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **Why does `jspdf` connect `External dependencies` to `UI Components and Invoices`?**
  _High betweenness centrality (0.109) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _178 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Components and Invoices` be split into smaller, more focused modules?**
  _Cohesion score 0.10025062656641603 - nodes in this community are weakly interconnected._
- **Should `Database access and invoice hooks` be split into smaller, more focused modules?**
  _Cohesion score 0.09872241579558652 - nodes in this community are weakly interconnected._
- **Should `Development dependencies configuration` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._