# Android TWA Project

This folder contains the Android Trusted Web Activity (TWA) project for the Kids Drawing App.

## Structure
- `app/` - Main Android app module
- `build.gradle` - Project build configuration
- `gradlew` / `gradlew.bat` - Gradle wrapper scripts
- `signingKey.keystore` - Release signing key (DO NOT commit - keep secure!)
- `signing-key-info.txt` - Key credentials (DO NOT commit - backup securely!)

## Opening in Android Studio
1. Open Android Studio
2. File → Open → Select this `android` folder
3. Let Gradle sync complete

## Building APK/AAB
**Debug build (testing):**
```bash
./gradlew assembleDebug
```
Output: `app/build/outputs/apk/debug/app-debug.apk`

**Release build (production):**
```bash
./gradlew bundleRelease
```
Output: `app/build/outputs/bundle/release/app-release.aab`

## Important Files to Keep Secure
- `signingKey.keystore` - Your release signing certificate
- `signing-key-info.txt` - Keystore passwords and credentials

**Store these files in a secure location outside the repo!**

## Updating Web Content
Since this is a TWA, the app loads content from:
https://aaronc1992.github.io/kids-drawing-app/

Web changes are reflected immediately without rebuilding the app.

## Version Updates
When releasing a new version:
1. Edit `app/build.gradle` and increment `versionCode` and `versionName`
2. Rebuild the AAB
3. Upload to Play Console
