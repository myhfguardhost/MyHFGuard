# Fix Build Directory Lock Error

## Problem
```
Unable to delete directory 'C:\Users\...\vitalink-connect\app\build'
Failed to delete some children. This might happen because a process has files open
```

## Quick Fixes (Try in Order)

### Fix 1: Stop Gradle Daemon
1. In Android Studio, go to **File** → **Settings** → **Build, Execution, Deployment** → **Build Tools** → **Gradle**
2. Click **"Stop Gradle daemon"** button
3. Or run in terminal:
   ```powershell
   cd vitalink-connect
   .\gradlew.bat --stop
   ```

### Fix 2: Close Android Studio
1. **Close Android Studio completely**
2. Wait 10 seconds
3. **Reopen Android Studio**
4. Try building again

### Fix 3: Manually Delete Build Directory
1. **Close Android Studio**
2. Open **File Explorer**
3. Navigate to: `C:\Users\acyp2\OneDrive\Desktop\MyHFGuard-1\vitalink-connect\app\build`
4. **Delete the entire `build` folder**
5. If it says "file is in use":
   - Open **Task Manager** (Ctrl+Shift+Esc)
   - End any **Java** or **Gradle** processes
   - Try deleting again

### Fix 4: Use Command Line to Delete
1. Open **PowerShell as Administrator**
2. Run:
   ```powershell
   cd "C:\Users\acyp2\OneDrive\Desktop\MyHFGuard-1\vitalink-connect\app"
   Remove-Item -Recurse -Force build -ErrorAction SilentlyContinue
   ```

### Fix 5: Clean and Rebuild
1. In Android Studio: **Build** → **Clean Project**
2. Wait for it to finish
3. **Build** → **Rebuild Project**

### Fix 6: Invalidate Caches
1. **File** → **Invalidate Caches...**
2. Check **"Clear file system cache and Local History"**
3. Click **"Invalidate and Restart"**
4. Wait for Android Studio to restart

### Fix 7: Kill All Java Processes
1. Open **Task Manager** (Ctrl+Shift+Esc)
2. Go to **Details** tab
3. Find all **java.exe** processes
4. **End Task** for each one
5. Try building again

### Fix 8: Restart Computer
If nothing else works, restart your computer to release all file locks.

---

## Prevention

To avoid this in the future:
1. **Always stop Gradle daemon** before closing Android Studio
2. **Don't have multiple Android Studio instances** open
3. **Close Android Studio** before deleting build folders manually

---

## Alternative: Build from Command Line

If Android Studio keeps having issues:

```powershell
cd vitalink-connect
.\gradlew.bat clean
.\gradlew.bat assembleDebug
```

This builds the APK without Android Studio's file locking issues.

