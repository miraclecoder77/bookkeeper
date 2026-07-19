# Graph Report - c:\Users\user\Documents\bookkeeper  (2026-07-19)

## Corpus Check
- Corpus is ~25,161 words - fits in a single context window. You may not need a graph.

## Summary
- 241 nodes · 455 edges · 27 communities (17 shown, 10 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

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

## God Nodes (most connected - your core abstractions)
1. `BookkeeperDB` - 14 edges
2. `SyncManager` - 12 edges
3. `getDriveFileId()` - 10 edges
4. `useUserProfile()` - 9 edges
5. `getDB()` - 9 edges
6. `Client` - 9 edges
7. `Dashboard()` - 7 edges
8. `Invoices()` - 7 edges
9. `Invoice` - 7 edges
10. `Card()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Invoices()` --references--> `jspdf`  [EXTRACTED]
  src/pages/Invoices.tsx → package.json
- `Navigation()` --indirect_call--> `Settings()`  [INFERRED]
  src/components/Navigation.tsx → src/pages/Settings.tsx
- `Architecture Overview` --references--> `Project README`  [EXTRACTED]
  ARCHITECTURE.md → README.md
- `Architecture Overview` --references--> `Setup Instructions`  [EXTRACTED]
  ARCHITECTURE.md → SETUP.md
- `Quick Start Guide` --references--> `Setup Instructions`  [EXTRACTED]
  QUICKSTART.md → SETUP.md

## Import Cycles
- None detected.

## Communities (27 total, 10 thin omitted)

### Community 0 - "UI Components and Invoices"
Cohesion: 0.12
Nodes (26): Badge(), BadgeProps, Button, ButtonProps, Card(), CardProps, Input, InputProps (+18 more)

### Community 1 - "Database access and invoice hooks"
Cohesion: 0.11
Nodes (33): ai, attachmentCrud, auth, capDocCrud, capture, categoryCrud, clientCrud, clients (+25 more)

### Community 2 - "Development dependencies configuration"
Cohesion: 0.07
Nodes (26): autoprefixer, devDependencies, autoprefixer, postcss, tailwindcss, @types/react, @types/react-dom, typescript (+18 more)

### Community 3 - "Navigation and theme providers"
Cohesion: 0.16
Nodes (12): App(), Navigation(), NavigationProps, Theme, ThemeContext, ThemeContextType, ThemeProvider(), useTheme() (+4 more)

### Community 4 - "External dependencies"
Cohesion: 0.12
Nodes (17): html2canvas, idb, jspdf, lucide-react, dependencies, html2canvas, idb, jspdf (+9 more)

### Community 5 - "Google Drive sync services"
Cohesion: 0.28
Nodes (14): DRIVE_FILE_NAMES, STORES, downloadFile(), getAppFolderOrCreate(), getDriveFileId(), loadClientsFromServer(), loadInvoicesFromServer(), loadSettingsFromServer() (+6 more)

### Community 6 - "OAuth authentication pages"
Cohesion: 0.24
Nodes (11): Login(), LoginProps, fetchUserProfile(), getCurrentUser(), initializeGoogle(), isGoogleConfigured(), loginLocally(), loginWithGoogle() (+3 more)

### Community 8 - "TypeScript project configuration"
Cohesion: 0.22
Nodes (8): vite.config.ts, compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, skipLibCheck, include

### Community 10 - "Payment method picker component"
Cohesion: 0.40
Nodes (4): METHODS, PaymentMethod, PaymentMethodPicker(), PaymentMethodPickerProps

### Community 11 - "Currency utility functions"
Cohesion: 0.50
Nodes (3): CURRENCY_SYMBOLS, formatCurrency(), getCurrencySymbol()

### Community 12 - "Project documentation files"
Cohesion: 0.67
Nodes (4): Architecture Overview, Quick Start Guide, Project README, Setup Instructions

### Community 13 - "Vite environment types"
Cohesion: 0.50
Nodes (3): ImportMeta, ImportMetaEnv, Window

## Knowledge Gaps
- **82 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+77 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `External dependencies` to `Development dependencies configuration`?**
  _High betweenness centrality (0.249) - this node is a cross-community bridge._
- **Why does `Invoices()` connect `UI Components and Invoices` to `External dependencies`?**
  _High betweenness centrality (0.246) - this node is a cross-community bridge._
- **Why does `jspdf` connect `External dependencies` to `UI Components and Invoices`?**
  _High betweenness centrality (0.243) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _82 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Components and Invoices` be split into smaller, more focused modules?**
  _Cohesion score 0.12473572938689217 - nodes in this community are weakly interconnected._
- **Should `Database access and invoice hooks` be split into smaller, more focused modules?**
  _Cohesion score 0.1106612685560054 - nodes in this community are weakly interconnected._
- **Should `Development dependencies configuration` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._