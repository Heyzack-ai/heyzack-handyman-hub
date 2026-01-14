# Sentry Build Error Fix

## Problem
Build failing with error:
```
Execution failed for task ':app:createBundleReleaseJsAndAssets_SentryUpload_com.handyman.heyzack@1.0.2+4_4'.
> Process 'command '/home/expo/workingdir/build/node_modules/@sentry/cli/bin/sentry-cli'' finished with non-zero exit value 1
```

## Root Cause
Sentry is configured but lacks authentication tokens (`SENTRY_AUTH_TOKEN` and `SENTRY_ORG`) required for uploading source maps during the build process.

---

## ✅ Solution 1: Disable Sentry Upload (Quick Fix) - IMPLEMENTED

I've implemented this solution which disables Sentry uploads during builds. This allows your builds to succeed without Sentry integration.

### Changes Made:

1. **app.json** - Added configuration to disable uploads:
   ```json
   {
     "@sentry/react-native/expo": {
       "uploadNativeSymbols": false,
       "uploadSourceMaps": false
     }
   }
   ```

2. **eas.json** - Added environment variable to disable auto-upload:
   ```json
   {
     "env": {
       "SENTRY_DISABLE_AUTO_UPLOAD": "true"
     }
   }
   ```

### Result
- ✅ Builds will now succeed
- ✅ Sentry will still initialize in the app (for error tracking)
- ⚠️ Source maps won't be uploaded (stack traces may be less readable)

---

## 🔧 Solution 2: Proper Sentry Setup (Recommended for Production)

If you want full Sentry functionality with source map uploads, follow these steps:

### Step 1: Get Sentry Auth Token

1. Go to [Sentry.io](https://sentry.io)
2. Navigate to: **Settings** → **Account** → **Auth Tokens**
3. Create a new token with these scopes:
   - `project:releases`
   - `org:read`
   - `project:read`

### Step 2: Configure EAS Build Secrets

Run these commands in your terminal:

```bash
# Set Sentry auth token
eas secret:create --scope project --name SENTRY_AUTH_TOKEN --value YOUR_AUTH_TOKEN

# Set Sentry organization slug (from app.json: "heyzack")
eas secret:create --scope project --name SENTRY_ORG --value heyzack

# Set Sentry project name (from app.json: "heyzack-handyman")
eas secret:create --scope project --name SENTRY_PROJECT --value heyzack-handyman
```

### Step 3: Revert Configuration Changes

1. **app.json** - Remove the disabled flags:
   ```json
   {
     "@sentry/react-native/expo": {
       "url": "https://sentry.io/",
       "project": "heyzack-handyman",
       "organization": "heyzack"
       // Remove: "uploadNativeSymbols": false,
       // Remove: "uploadSourceMaps": false
     }
   }
   ```

2. **eas.json** - Remove the disable environment variable:
   ```json
   {
     "production": {
       "autoIncrement": true,
       "channel": "production"
       // Remove: "env": { "SENTRY_DISABLE_AUTO_UPLOAD": "true" }
     }
   }
   ```

### Step 4: Rebuild

```bash
eas build --platform android --profile production
```

---

## 📝 Notes

- **Solution 1** is active now - builds should work immediately
- **Solution 2** is for when you're ready to set up full Sentry integration
- You can switch between solutions at any time
- Sentry error tracking will still work in both cases, but Solution 2 provides better stack traces

---

## 🔍 Verification

After implementing Solution 1, your next build should:
- ✅ Complete successfully
- ✅ Skip Sentry upload step
- ✅ Produce a working APK/AAB

If you still encounter issues, check:
1. EAS build logs for any other errors
2. Sentry configuration in app.json matches your Sentry project
3. All environment variables are properly set (if using Solution 2)
