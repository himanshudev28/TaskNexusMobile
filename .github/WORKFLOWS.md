# 🤖 GitHub Actions Workflows

Automated CI/CD pipelines for TaskNexus Mobile.

## 📦 Build APK Workflow

**File:** `.github/workflows/build-apk.yml`

### Triggers
- ✅ Push to `main` or `develop`
- ✅ Pull requests to `main` or `develop`
- ✅ Manual dispatch (workflow_dispatch)

### What it does
1. 📥 Checks out code
2. 🔧 Sets up Node.js 18
3. 📚 Installs dependencies
4. 🛠️ Sets up Java 17 & Android SDK
5. 🏢 Builds release APK with `npx expo run:android --variant release`
6. 📊 Collects APK size info
7. ⬆️ Uploads APK as artifact (30-day retention)
8. 📝 Comments on PRs with build details
9. 🚀 Creates release on main push

### Outputs
- **Artifacts:** `tasknexus-mobile-apk` (available for 30 days)
- **Release:** Auto-generated on main branch push
- **PR Comments:** Build status with APK size

### View Results
1. Go to Actions tab → "Build APK"
2. Click the workflow run
3. Download artifact or view release

---

## 🚀 Release Workflow

**File:** `.github/workflows/release.yml`

### Triggers
- ✅ Git tags matching `v*` (e.g., `v1.0.0`, `v2.1.3`)

### What it does
1. 📥 Checks out code at tag
2. 🔧 Sets up full build environment
3. 🏢 Builds optimized release APK
4. 📤 Uploads APK to GitHub Release
5. 📢 Publishes release notes

### Usage
```bash
# Create a release
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# Or on GitHub:
# Releases → Draft new release → Choose tag → Publish
```

### Release Notes Include
- APK size
- Features list
- Installation instructions
- System requirements
- Support links

---

## ✅ Code Quality Workflow

**File:** `.github/workflows/quality.yml`

### Triggers
- ✅ Push to `main` or `develop`
- ✅ Pull requests to `main` or `develop`

### Checks
1. 🔍 **TypeScript Type Check**
   - Validates type safety
   - No `tsc` errors required (max-warnings: 10)

2. 📋 **ESLint**
   - Code style validation
   - Max 10 warnings allowed

3. 📊 **Code Complexity**
   - File count analysis
   - Structure overview

4. 🔐 **npm Audit**
   - Security vulnerability scan
   - Dependency check

5. 🏗️ **Build Check**
   - Verifies project structure
   - Pre-build validation

### View Results
- GitHub Actions tab → "Code Quality"
- Check status on PR

---

## 📊 Workflow Status Badge

Add to README.md:

```markdown
[![Build APK](https://github.com/himanshudev28/TaskNexusMobile/actions/workflows/build-apk.yml/badge.svg)](https://github.com/himanshudev28/TaskNexusMobile/actions)
[![Code Quality](https://github.com/himanshudev28/TaskNexusMobile/actions/workflows/quality.yml/badge.svg)](https://github.com/himanshudev28/TaskNexusMobile/actions)
```

---

## 🔧 Environment & Secrets

### Automatic (No setup needed)
- `GITHUB_TOKEN` — Auto-provided for releases
- Java 17, Android SDK — Auto-installed
- Node.js 18 — Auto-setup

### Optional Customization
Edit workflow files to:
- Change Java version (line: `java-version: '17'`)
- Adjust retention days (line: `retention-days: 30`)
- Modify build flags
- Add signing configuration

---

## 📈 Workflow Performance

| Workflow | Time | Runs | Status |
|----------|------|------|--------|
| **Build APK** | ~20-30 min | Every push | ✅ |
| **Release** | ~25-35 min | On tag | ✅ |
| **Quality** | ~5-10 min | Every push | ✅ |

---

## 🆘 Troubleshooting

### Build Fails: "APK not found"
- Check Android SDK is installed
- Verify `app.json` configuration
- Run locally: `npx expo run:android --variant release`

### Java Error: "JAVA_HOME not set"
- Workflow auto-installs Java 17
- Check Actions logs for errors

### Release Not Created
- Ensure tag format: `vX.Y.Z`
- Check GITHUB_TOKEN permissions
- Verify main branch push

### Artifact Not Found
- Check workflow completed successfully
- Artifacts expire after 30 days
- Download immediately after build

---

## 📖 Learn More

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Expo Build Documentation](https://docs.expo.dev/build-reference/overview/)
- [Android Build Tools](https://developer.android.com/build-tools)

---

**Made with ❤️ by TaskNexus Mobile**
