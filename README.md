# TaskNexus Mobile

A comprehensive React Native productivity app built with Expo SDK 56, featuring tools for document processing, image manipulation, scheduling, and more.

## 🎯 Features

### Document Tools
- **PDF Tools** — Merge, compress, split, organize, and convert PDFs
  - Combine PDFs and images into single documents
  - Compress with quality presets or target file size
  - Extract pages with custom ranges
  - Organize pages with drag-and-drop
  - Convert PDFs to images (PNG/JPEG)
  - Generate images from PDFs with resolution control
  
- **PDF Editor** — Annotate and edit PDF documents

### Image Tools
- **Resize** — Scale images with aspect ratio preservation
- **Compress** — Reduce file size with quality/target KB controls
- **Crop Info** — View image metadata and crop ratio presets
- **Convert** — Change formats (JPEG/PNG) with optional target size
- **Enhance** — Transform images (flip, rotate)
- **AI Enhance** — AI-powered image enhancement (Pollinations AI)
- **Remove BG** — Remove image backgrounds with color options
- **Blur BG** — Blur background with adjustable intensity

### Productivity Tools
- **Notes** — Create, search, and organize notes with color-coded cards
- **To-Do** — Task management with priority levels and filters
- **Timer** — Timer, stopwatch, and Pomodoro timer modes
- **Reminders** — Set and manage reminders with notifications
- **Budget Tracker** — Track income and expenses with balance overview

### 20+ Additional Utilities
Unit Converter, QR Code Generator, Text Tools, Dev Tools, Generators, DateTime Tools, Quick Links, SEO Tools, Code Editor, JSX Preview, Data Testing, Network Tools, RSS Reader, Signature Pad, and more.

## 🏗️ Architecture

### Tech Stack
- **Framework**: React Native 0.85.3
- **Build Tool**: Expo SDK 56 (Bare Workflow)
- **Navigation**: Expo Router v3 (File-based routing)
- **State Management**: Zustand (app store)
- **Animations**: React Native Reanimated
- **Icons**: Expo Vector Icons (Ionicons)

### Key Technologies
- **PDF Processing**: pdf-lib.js + PDF.js (CDN)
- **Image Processing**: expo-image-manipulator
- **File Storage**: expo-file-system
- **Document Picking**: expo-document-picker
- **Media Library**: expo-media-library/legacy

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Android SDK or physical Android device

### Installation

```bash
git clone https://github.com/himanshudev28/TaskNexusMobile.git
cd TaskNexus-Mobile
npm install
```

### Development

```bash
# Run on Android (development)
npx expo run:android

# Run on Android (release APK)
npx expo run:android --variant release

# Run with Metro Bundler
npx expo start
```

## 📦 Key Dependencies

- `expo`: ^56.0.0
- `react-native`: ^0.85.3
- `react-native-reanimated`: ^3.x
- `expo-router`: ^3.x
- `zustand`: ^4.x
- `expo-file-system`: ^16.x (legacy API)
- `expo-media-library`: ^16.x (legacy API)
- `expo-image-manipulator`: ^12.x

## 🎨 UI/UX Highlights

- **Responsive Design**: Adapts to all screen sizes
- **Consistent Spacing**: 16px gutters, 8px component gaps
- **Smooth Animations**: React Native Reanimated springify effects
- **Haptic Feedback**: Touch feedback on all interactions
- **Dark-aware Status Bar**: Transparent status bar with appropriate icon colors
- **Download Modals**: Clear file save/share options after processing

## 🔧 Build & Release

```bash
# Production build
npx expo run:android --variant release

# Generated APK location
android/app/build/outputs/apk/release/app-release.apk

# Target SDK: 36 | Min SDK: 24
# ABI Filter: arm64-v8a
```

## 📝 License

MIT License - Open source and free to use.

## 📧 Contact

- GitHub: [@himanshudev28](https://github.com/himanshudev28)

---

**Made with ❤️** — Last updated: 2026-06-21
