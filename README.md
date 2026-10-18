# DAYZERO — Cross-Platform Productivity & Accountability System

A serious personal planning, execution, and accountability system engineered for high-stakes preparation, study consistency, and rigorous task tracking across **Windows PC** and **Android Mobile** devices from a single unified codebase.

---

## 1. System Architecture

```text
DAYZERO Unified Codebase (React 19 + TypeScript + Vite)
├── Shared Tactical UI & Responsive Layout (Tailwind CSS, Zero-pill, Military-tech)
├── Shared Calendar & Timeline Engine (Local YYYY-MM-DD calculations, leap years)
├── Shared Task Execution Engine (Priority, categories, carry-forward, backlog)
├── Shared Offline Plan Parser (Natural language week/day schedule extractor)
├── Resilient Study Timer Engine (Timestamp-based, sleep/wake recovery)
├── Midnight Crossover & Time Attribution Engine (Mathematical split / prompt)
├── Productivity Heatmap & Analytics Engine (Streaks with rest day protection)
├── Firebase Cross-Device Sync & User-Isolated Security Rules
├── Electron Desktop Integration (Windows .exe)
├── Capacitor Android Integration (Android .apk)
└── GitHub Actions CI/CD (Automated artifact builders)
```

---

## 2. Key Features

1. **Configurable Planning Date Range**:
   - Defaults to **18 October 2026 → 20 January 2027** (or any user-defined period).
   - Accurately generates all dates across month boundaries, year transitions, and leap years.
   - Guaranteed data safety: changing dates never erases historical tasks or sessions.

2. **Horizontal Date Tiles Calendar**:
   - Scrollable date tiles with completion percentages, tracked time badges, and overdue alerts.
   - Month-level quick selector, Today shortcut, and visual color legend.

3. **Three Planning Modes**:
   - **Day-Wise**: Direct task scheduling with priorities, deadlines, and notes.
   - **Week-Wise**: Interactive Natural-Language Plan Editor with offline parser (maps subjects like `Physics — EMI revision` directly to dates with preview and duplicate prevention).
   - **Month-Wise**: High-level target goals linked to daily/weekly tasks.

4. **Persistent Study Timer & Sleep/Wake Survival**:
   - Derived strictly from monotonic and wall-clock timestamps rather than volatile `setInterval` counters.
   - Accurately survives device sleep, window minimization, and app restarts.
   - Controls: Start, Pause, Resume, Restart (with confirm), End Session, End Day.

5. **Midnight Crossover & Time Attribution**:
   - When a session starts before midnight and continues into the next day, DAYZERO detects the boundary and provides 4 options:
     1. Assign 100% to Start Day.
     2. Split mathematically at midnight (exact hours/minutes to each day without double-counting).
     3. Assign 100% to Current Day.
     4. Decide later.

6. **Accountability & Notifications**:
   - Cross-platform notification adapter (Electron native desktop notifications, Capacitor Android local notifications, Web Notification API).
   - Three selectable accountability tones: **Strict** (firm taunts and gap warnings), **Motivational**, and **Neutral**.

7. **Productivity Heatmap & Analytics**:
   - GitHub-style contribution grid with switchable metric (Task Completion % vs Tracked Hours).
   - Consistency streaks calculated with rest-day protection (rest days do not break streaks).

8. **History & Audit Logs**:
   - Browse any past date with complete task status, session timelines, subject distributions, and day-to-day comparison metrics.

---

## 3. Quick Start & Local Development

### Prerequisites
- Node.js 20 or 22+
- npm 10+

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/dayzero.git
cd dayzero

# Install locked dependencies
npm install
```

### Running the App Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Logic Unit Tests
```bash
node --test src/utils/*.test.ts
```

---

## 4. Firebase Configuration & Security Rules

DAYZERO supports real-time synchronization between Windows PC and Android devices via Firebase Auth & Cloud Firestore. It also functions seamlessly in offline local mode using IndexedDB.

### Steps to Configure Firebase:
1. Create a Firebase project in the [Firebase Console](https://console.firebase.google.com).
2. Enable **Authentication** (Email/Password provider).
3. Enable **Cloud Firestore** in production mode.
4. Copy your Web App config values into `.env` (or input them directly in **Settings → Firebase Project Keys** within the app):
   ```env
   VITE_FIREBASE_API_KEY="your-api-key"
   VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
   VITE_FIREBASE_PROJECT_ID="your-project-id"
   VITE_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
   VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
   VITE_FIREBASE_APP_ID="your-app-id"
   ```
5. Deploy the provided `firestore.rules` file to enforce strict user-isolated privacy:
   ```bash
   firebase deploy --only firestore:rules
   ```

---

## 5. Building the Windows Application (.exe)

### Option A: Automated GitHub Actions Build (Recommended)
1. Push your repository to GitHub.
2. In GitHub, navigate to **Actions → Build Windows Application (.exe)**.
3. Click **Run workflow** (or push to `main`).
4. Once completed, download the `DAYZERO-Windows-Setup` artifact containing the `.exe` installer.

### Option B: Local Windows Build
```bash
# Compile web assets
npm run build

# Package executable using electron-builder
npx electron-builder --win --x64
```
The installer will be placed in `dist_electron/`.

---

## 6. Building the Android Application (.apk)

### Option A: Automated GitHub Actions Build (Recommended)
1. In GitHub, navigate to **Actions → Build Android Application (.apk)**.
2. Click **Run workflow**.
3. Download the `DAYZERO-Android-Release-APK` artifact containing the installable `.apk` file.

### Option B: Local Android Build
```bash
# 1. Build production web assets
npm run build

# 2. Sync web assets with Capacitor Android wrapper
npx cap sync android

# 3. Open in Android Studio or compile with Gradle
cd android
./gradlew assembleRelease
```
The release APK is generated at:
`android/app/build/outputs/apk/release/app-release-unsigned.apk`

---

## 7. Android Device Installation & Permissions

When installing on Android:
1. Enable **Install Unknown Apps** on your device for your file manager or browser.
2. In app settings, ensure **Notifications** are allowed (`POST_NOTIFICATIONS`).
3. For reliable alarms and scheduled reminders, permit **Alarms & Reminders** in Android system settings.
4. Note on Android Battery Optimization: Android operating systems suspend JavaScript when an app is backgrounded. DAYZERO's timestamp-based timer engine automatically recalculates and reconciles elapsed time upon resumption without draining battery.

---

## 8. Verification & Test Suite

Run all automated unit tests:
```bash
node --test src/utils/*.test.ts
```
Covers:
- Date manipulation, leap years, month boundaries, and year transitions (`dateUtils.test.ts`).
- Timestamp-based study timer, resume recovery, and mathematical midnight split (`timerEngine.test.ts`).
- Natural language weekly plan schedule parser and duplicate prevention (`planParser.test.ts`).
- Day status summary, completion percentages, and rest-day streak preservation (`analyticsEngine.test.ts`).
