# Pharmacy Management System — Mobile App (Offline-First)

A production-minded, offline-first personal pharmacy management mobile application built with React Native, Expo, TypeScript, Expo Router, and Expo SQLite.

---

## 🌟 Key Features

- **100% Offline-First Architecture**:
  - Persistent local database using **Expo SQLite** (`pharmacy_offline.db` with WAL mode).
  - Instant offline medicine search (multi-field partial lookups by name, generic name, brand, barcode).
  - Offline medicine creation, editing, and archiving.
  - Offline inward stock receipts and adjustments with before/after delta audit trails.
  - Real-time offline dashboard valuation and low-stock / expiry monitoring.
- **Durable Sync Engine**:
  - Client-side UUID operation tracking.
  - Durable FIFO sync outbox surviving app crashes and device restarts.
  - Automatic bidirectional sync with `@react-native-community/netinfo` and `AppState` listeners.
  - Manual on-demand "Sync Now" option.
  - Real-time `SyncStatusBar` indicating connection, pending outbox count, and sync state.
- **Isolated Price Calculator**:
  - Temporary cart for rapid customer inquiry price calculations.
  - Completely isolated from stock movements (never alters inventory or processes sales).
- **Security & Storage**:
  - JWT authentication with secure storage via `expo-secure-store`.
  - Automatic Axios 401 token refresh queue.
- **Modern UI & UX**:
  - Clean medical/pharmacy color palette with custom design tokens.
  - Lucide icons, responsive cards, filter chips, and smooth modals.

---

## 🛠 Tech Stack

- **Framework**: React Native with Expo SDK 51 & Expo Router v3
- **Local Storage**: Expo SQLite v14 (with versioned migrations) & Expo SecureStore
- **Networking & Cache**: Axios with interceptors, TanStack Query v5
- **State Management**: Zustand (Auth, Cart, Sync Store)
- **Form Validation**: React Hook Form with Zod schema validation
- **Connectivity**: `@react-native-community/netinfo`

---

## 📱 Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/mohammad-anar/farmacy-management-app.git
   cd farmacy-management-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   Copy `.env.example` to `.env` and set your API base URL:
   ```env
   EXPO_PUBLIC_API_URL=https://your-backend.onrender.com/api/v1
   ```
   *(For local physical device testing, use your computer's LAN IP e.g., `http://192.168.0.105:5000/api/v1`)*

4. **Start the Development Server:**
   ```bash
   npx expo start -c
   ```
   Scan the generated QR code with **Expo Go** on your Android or iOS device.

---

## 📦 Building Android APK (Standalone)

Build a standalone `.apk` directly without Google Play Store via EAS:

```bash
npx eas-cli build -p android --profile preview
```

---

## 📁 Directory Structure

```
mobile/
├── app/                  # Expo Router file-based screens & navigation
│   ├── (auth)/           # Authentication screens (Login)
│   ├── (tabs)/           # Dashboard, Medicines, Low Stock, Calculator, Settings
│   └── medicine/         # Detail, Create, Edit, Adjust-stock modals
├── src/
│   ├── api/              # Axios HTTP client, auth, medicines, and sync APIs
│   ├── components/       # UI design system components & SyncStatusBar
│   ├── constants/        # Theme tokens (Colors, Spacing, Typography)
│   ├── db/               # Expo SQLite database, migrations, and repositories
│   ├── hooks/            # Custom hooks (useDebounce, etc.)
│   ├── services/         # MedicineService & SyncService coordinators
│   ├── store/            # Zustand stores (Auth, Cart, Sync)
│   ├── types/            # TypeScript domain interfaces
│   ├── utils/            # Storage, formatters, and UUID utilities
│   └── validation/       # Zod form validation schemas
├── app.json              # Expo configuration with Android package
└── eas.json              # EAS Build configuration for APKs
```

---

## 📄 License

UNLICENSED — Personal Pharmacy Management System.
