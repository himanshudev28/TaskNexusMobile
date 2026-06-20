# TaskNexus Mobile — React Native + Expo

A production-ready mobile port of TaskNexus built with **Expo**, **React Native**, and **TypeScript**. All-in-one productivity app with notes, todos, reminders, budget tracking, and more.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Android SDK (Android 10+) OR Xcode (iOS 14+)
- Expo CLI: `npm install -g expo-cli`

### Setup

```bash
# 1. Navigate to project
cd TaskNexus-Mobile

# 2. Install dependencies
npm install

# 3. Start Expo dev server
npm start

# 4. Run on Android (requires Android SDK)
npm run android

# 5. Run on iOS (Mac only)
npm run ios

# 6. Run on web
npm run web
```

## 📁 Project Structure

```
TaskNexus-Mobile/
├── app/                          # Expo Router - route definitions
│   ├── _layout.tsx              # Root layout (persists state)
│   └── (tabs)/                  # Bottom tab navigation
│       ├── _layout.tsx          # Tab navigation shell
│       ├── dashboard.tsx        # Overview screen
│       ├── notes.tsx            # Notes management
│       ├── todo.tsx             # Todo management
│       ├── timer.tsx            # Timer/stopwatch
│       └── more.tsx             # Tool grid menu
├── src/
│   ├── store/                   # Zustand state management
│   │   └── app.ts              # Global store (notes, todos, reminders, budget)
│   ├── features/               # Feature modules (to be built)
│   ├── components/             # Shared UI components
│   ├── hooks/                  # Custom hooks
│   ├── services/               # API & services
│   ├── types/                  # TypeScript types
│   ├── utils/                  # Helper functions
│   └── constants/              # Constants
├── tailwind.config.js          # NativeWind config
├── app.json                    # Expo config
└── package.json
```

## ✨ Current Features

### Implemented ✅
- **Dashboard** — Quick overview of all data
- **Notes** — Full CRUD with persistent storage
- **Todos** — With priority levels, completion tracking
- **Timer** — Presets + custom durations
- **Bottom Tab Navigation** — Quick access
- **Tool Grid** — Browse 12+ tools
- **AsyncStorage Persistence** — Auto-save every 3 seconds

### Coming Soon 🚧
- Budget Tracker
- Calculator
- Unit Converter
- QR Generator
- Image Tools (resize, crop, compress, remove BG)
- PDF Tools (combine, compress, edit)
- Code Editor + JSX Preview
- Reminders with notifications
- Settings & theme support

## 🛠 Tech Stack

- **Expo 56** + **React Native 0.85** + **TypeScript**
- **Zustand** (state) + **AsyncStorage** (persistence)
- **NativeWind** (Tailwind styling)
- **Reanimated 4** + **Moti** (animations)
- **Expo Router** (navigation)
- **React Hook Form** + **Zod** (forms)

## 📱 Running the App

```bash
# Development
npm start            # Start Expo dev server
npm run android      # Run on Android device/emulator
npm run ios         # Run on iOS (Mac only)
npm run web         # Run in web browser

# Testing
npx tsc --noEmit    # Type check
npm run lint        # Lint code
```

## 🏗 Build for Production

```bash
# APK for Android
eas build --platform android

# IPA for iOS
eas build --platform ios

# Both
eas build --platform all
```

## 📊 State Management

All data lives in Zustand store (`src/store/app.ts`):

```typescript
// Use in components
const notes = useAppStore((state) => state.notes);

// Add data
useAppStore.getState().addNote({ title: "...", body: "..." });

// Update
useAppStore.getState().updateTodo(id, { done: true });

// Delete
useAppStore.getState().deleteNote(id);
```

Auto-saved to AsyncStorage every 3 seconds.

## 🎨 Styling

Using **NativeWind** (Tailwind for React Native):

```tsx
<View className="flex-1 bg-gray-50 px-4 py-6">
  <Text className="text-2xl font-bold">Hello</Text>
  <TouchableOpacity className="bg-indigo-600 rounded-lg p-4">
    <Text className="text-white">Press</Text>
  </TouchableOpacity>
</View>
```

## 🚨 Troubleshooting

```bash
# Clear cache
expo start --clear

# Full reset
rm -rf node_modules package-lock.json
npm install

# Type check
npx tsc --noEmit

# Check setup
npx expo doctor
```

---

**Status:** MVP Complete, Adding Tools Incrementally  
**Built:** June 2026
