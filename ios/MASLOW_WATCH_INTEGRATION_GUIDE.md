# Maslow Watch App Integration Guide

## Overview
This guide will help you integrate the Apple Watch app into the main MASLOW project.

## ✅ Step-by-Step Instructions

### STEP 1: Add Watch App Target in Xcode

1. Open your MASLOW project in Xcode
2. Go to **File → New → Target**
3. In the template selector:
   - Search for: **"Watch App"**
   - Select: **"Watch App for iOS App"**
4. Configure the target:
   - **Product Name**: `Maslow Watch`
   - **Bundle ID**: `com.maslownyc.app.watchkitapp`
   - **Language**: Swift
   - **UI**: SwiftUI
5. Click **Finish**
6. When prompted, click **Activate** to activate the scheme

### STEP 2: Copy Watch App Files

The following files have been created in your repository root. You need to copy them into the **Maslow Watch** target:

1. **MaslowWatch-MaslowWatchApp.swift** → Rename to `MaslowWatchApp.swift`
   - This is the main app entry point
   
2. **MaslowWatch-ContentView.swift** → Rename to `ContentView.swift`
   - The home screen with logo and user info
   
3. **MaslowWatch-PassView.swift** → Rename to `PassView.swift`
   - The QR code pass screen
   
4. **MaslowWatch-MaslowUser.swift** → Rename to `MaslowUser.swift`
   - The data model for user information
   
5. **MaslowWatch-WatchConnectivityManager.swift** → Rename to `WatchConnectivityManager.swift`
   - Handles iPhone ↔ Watch communication

**How to copy:**
- In Xcode's Project Navigator, right-click on the **Maslow Watch** folder
- Select **Add Files to "Maslow Watch"...**
- Select the files listed above
- Make sure **"Copy items if needed"** is checked
- Under **Add to targets**, select **Maslow Watch**
- Click **Add**

### STEP 3: Add Maslow Logo to Watch Assets

1. In Xcode, navigate to: **Maslow Watch → Assets.xcassets**
2. Right-click in the assets catalog → **New Image Set**
3. Name it: `MaslowLogo`
4. Drag and drop your Maslow logo images:
   - For watchOS, you typically need @2x and @3x versions
   - Recommended size: 80x80 pt (160x160 @2x, 240x240 @3x)

**Note:** If you don't have the logo yet, the app will show a broken image placeholder. Update it later.

### STEP 4: Configure Code Signing

1. In Xcode, select the project in the Project Navigator
2. Select the **Maslow Watch** target
3. Go to **Signing & Capabilities** tab
4. Configure:
   - **Team**: Select your team (patrick@maslownyc.com)
   - **✓ Automatically manage signing**
   - **Bundle Identifier**: Should be `com.maslownyc.app.watchkitapp`

### STEP 5: Add Watch Connectivity Capability

The Watch app needs the WatchConnectivity framework to communicate with the iPhone app.

**For the Watch App:**
1. Select **Maslow Watch** target
2. Go to **Signing & Capabilities**
3. This should already be working since WatchConnectivity is part of the SDK

**For the iOS App (IMPORTANT):**
You'll need to add a matching WatchConnectivityManager to your iPhone app to send data to the Watch. This file should:
- Import WatchConnectivity
- Send user data when the Watch requests it
- Send updates when user data changes

### STEP 6: Build and Test

1. Select the **Maslow Watch** scheme in Xcode
2. Choose an Apple Watch simulator or device
3. Press **⌘R** to build and run
4. The app should launch on the Watch

**Expected behavior:**
- On first launch, the Watch will show "Open the Maslow app on your iPhone to sync"
- When you run the iPhone app and it sends user data, the Watch will display it
- Tapping "Show Pass" will display the QR code

## 📱 iPhone App Integration (Next Step)

To complete the Watch integration, you need to add Watch Connectivity to your iPhone app:

1. Create a similar `WatchConnectivityManager` for iOS
2. Send user data to the Watch when:
   - The user logs in
   - User data changes
   - The Watch requests it
3. Example code for iOS side:

```swift
import WatchConnectivity

class WatchConnectivityManager: NSObject, ObservableObject {
    static let shared = WatchConnectivityManager()
    
    private override init() {
        super.init()
        
        if WCSession.isSupported() {
            WCSession.default.delegate = self
            WCSession.default.activate()
        }
    }
    
    func sendUserData(_ user: MaslowUser) {
        guard WCSession.default.isReachable else { return }
        
        let userData = user.toDictionary()
        WCSession.default.sendMessage(
            ["action": "updateUser", "user": userData],
            replyHandler: nil,
            errorHandler: { error in
                print("Error sending user data: \(error)")
            }
        )
    }
}
```

## 🎨 Customization

### Colors and Branding
- The app uses the accent color defined in Assets
- You can customize colors in ContentView and PassView
- Consider adding a custom color set for Maslow brand colors

### QR Code Format
- Currently uses the `memberId` for QR generation
- Modify `PassView.generateQRCode()` to encode different data
- Consider encoding JSON with more member information

### Additional Features to Consider
1. **Complications** - Show member status on watch face
2. **Notifications** - Event reminders, member updates
3. **Quick Actions** - Shortcuts to common tasks
4. **Health Integration** - Track member activities

## 🐛 Troubleshooting

### "iPhone is not reachable"
- Make sure both iPhone and Watch simulators/devices are running
- Check that both apps are in the foreground
- Try sending application context instead: `updateApplicationContext()`

### QR Code not displaying
- Verify the `memberId` is a valid string
- Check that CoreImage framework is available
- Test with a simple string first

### Files not compiling
- Make sure all files are added to the **Maslow Watch** target
- Check that imports are correct
- Verify Swift version compatibility

## 📋 Checklist

- [ ] Watch App target created
- [ ] All 5 Swift files copied and renamed
- [ ] Maslow logo added to Assets
- [ ] Code signing configured
- [ ] App builds successfully
- [ ] Watch app displays correctly
- [ ] iPhone integration planned/implemented
- [ ] Watch Connectivity working between devices

## 🚀 Next Steps

1. **Test on real devices** - Simulators have limitations with Watch Connectivity
2. **Add to main app** - Integrate WatchConnectivityManager into your React Native/Expo app
3. **Design refinements** - Polish the UI based on watchOS guidelines
4. **Add complications** - Create watch face complications for quick access
5. **Submit to App Store** - Include the Watch app in your app submission

---

**Questions or issues?** Check the Watch app files for detailed comments and implementation notes.

Generated: February 20, 2026
