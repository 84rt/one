# 🐛 Debug Guide - Habit Tracker App

## Current Status: ✅ MINIMAL APP RUNNING

I've simplified the app to run without any external dependencies. This helps us debug step by step.

## What I Changed

### Before (Complex - Causing Errors):
- Imported database, auth services, sync services
- Tried to connect to Supabase immediately
- Complex navigation and screens
- Multiple external dependencies

### After (Simple - Working):
- Just basic React Native components
- No external API calls
- Simple UI to confirm app is running
- Only essential dependencies

## Current App Structure

```
App.tsx (SIMPLIFIED)
├── PaperProvider (UI components)
├── SafeAreaProvider (Safe areas)
└── Simple welcome screen
```

## Next Steps - Gradual Integration

### Step 1: ✅ Basic App (Current)
- App runs without errors
- Shows welcome screen
- No external dependencies

### Step 2: Add Navigation (Next)
- Add React Navigation
- Create simple screens
- Test navigation works

### Step 3: Add Database (Later)
- Configure WatermelonDB
- Test local database
- No sync yet

### Step 4: Add Auth (Later)
- Configure Supabase
- Test authentication
- Connect to database

### Step 5: Add Sync (Final)
- Add sync service
- Test offline/online functionality

## How to Test Current Version

1. **Start the app:**
   ```bash
   npm start
   ```

2. **Open in Expo Go:**
   - Scan QR code with Expo Go app
   - Should see: "🎯 Habit Tracker" with "✅ App is running!"

3. **If you see errors:**
   - Check the terminal output
   - Look for specific error messages
   - We can debug each error step by step

## Common Issues & Solutions

### Issue: "Module not found"
**Solution:** Dependencies not installed
```bash
npm install
```

### Issue: "Expo Go can't connect"
**Solution:** Make sure you're on the same network
- Check your phone and computer are on same WiFi
- Try restarting Expo Go app

### Issue: "Metro bundler errors"
**Solution:** Clear cache
```bash
npx expo start --clear
```

## Debugging Commands

```bash
# Check if dependencies are installed
npm list

# Clear Expo cache
npx expo start --clear

# Check for TypeScript errors
npx tsc --noEmit

# Check for linting errors
npx eslint App.tsx
```

## What to Look For

When you run the app, you should see:
- ✅ No red error screens
- ✅ "🎯 Habit Tracker" title
- ✅ "✅ App is running!" message
- ✅ Clean, simple interface

If you see any errors, copy the exact error message and we can debug it step by step!
