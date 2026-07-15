# Graph Report - .  (2026-07-14)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 205 nodes · 423 edges · 18 communities (15 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e3e886d6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Invoices.tsx
- devDependencies
- App.tsx
- indexeddb.ts
- types.ts
- dependencies
- drive.ts
- Navigation.tsx
- SyncManager
- compilerOptions
- LandingPage.tsx
- vite-env.d.ts
- Textarea.tsx

## God Nodes (most connected - your core abstractions)
1. `getDB()` - 22 edges
2. `SyncManager` - 18 edges
3. `getDriveFileId()` - 10 edges
4. `useSettings()` - 9 edges
5. `formatCurrency()` - 8 edges
6. `Dashboard()` - 7 edges
7. `Invoices()` - 7 edges
8. `loginWithGoogle()` - 7 edges
9. `SyncStatus` - 7 edges
10. `App()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Invoices()` --references--> `jspdf`  [EXTRACTED]
  src/pages/Invoices.tsx → package.json
- `Navigation()` --indirect_call--> `Settings()`  [INFERRED]
  src/components/Navigation.tsx → src/pages/Settings.tsx
- `Dashboard()` --calls--> `useTheme()`  [EXTRACTED]
  src/pages/Dashboard.tsx → src/components/ThemeProvider.tsx
- `Invoices()` --calls--> `useClients()`  [EXTRACTED]
  src/pages/Invoices.tsx → src/hooks/useClients.ts
- `App()` --calls--> `getCurrentUser()`  [EXTRACTED]
  src/App.tsx → src/services/auth.ts

## Import Cycles
- None detected.

## Communities (18 total, 3 thin omitted)

### Community 0 - "Invoices.tsx"
Cohesion: 0.16
Nodes (21): Badge(), BadgeProps, Button, ButtonProps, Card(), CardProps, Input, InputProps (+13 more)

### Community 1 - "devDependencies"
Cohesion: 0.07
Nodes (26): autoprefixer, devDependencies, autoprefixer, postcss, tailwindcss, @types/react, @types/react-dom, typescript (+18 more)

### Community 2 - "App.tsx"
Cohesion: 0.23
Nodes (16): App(), Login(), LoginProps, fetchUserProfile(), getCurrentUser(), initializeGoogle(), isGoogleConfigured(), loginLocally() (+8 more)

### Community 3 - "indexeddb.ts"
Cohesion: 0.19
Nodes (19): addClient(), addInvoice(), addTransaction(), clearAllData(), deleteClient(), deleteInvoice(), deleteTransaction(), getAllClients() (+11 more)

### Community 4 - "types.ts"
Cohesion: 0.19
Nodes (13): generateId(), useClients(), generateId(), generateId(), Clients(), BookkeeperDB, SyncCallback, BusinessSettings (+5 more)

### Community 5 - "dependencies"
Cohesion: 0.12
Nodes (17): html2canvas, idb, jspdf, lucide-react, dependencies, html2canvas, idb, jspdf (+9 more)

### Community 6 - "drive.ts"
Cohesion: 0.28
Nodes (14): DRIVE_FILE_NAMES, STORES, downloadFile(), getAppFolderOrCreate(), getDriveFileId(), loadClientsFromServer(), loadInvoicesFromServer(), loadSettingsFromServer() (+6 more)

### Community 7 - "Navigation.tsx"
Cohesion: 0.24
Nodes (8): Navigation(), NavigationProps, Theme, ThemeContext, ThemeContextType, ThemeProvider(), useTheme(), useSyncStatus()

### Community 9 - "compilerOptions"
Cohesion: 0.22
Nodes (8): vite.config.ts, compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, skipLibCheck, include

### Community 11 - "vite-env.d.ts"
Cohesion: 0.50
Nodes (3): ImportMeta, ImportMetaEnv, Window

## Knowledge Gaps
- **50 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+45 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `devDependencies`?**
  _High betweenness centrality (0.303) - this node is a cross-community bridge._
- **Why does `Invoices()` connect `Invoices.tsx` to `App.tsx`, `types.ts`, `dependencies`?**
  _High betweenness centrality (0.297) - this node is a cross-community bridge._
- **Why does `jspdf` connect `dependencies` to `Invoices.tsx`?**
  _High betweenness centrality (0.293) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _50 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._