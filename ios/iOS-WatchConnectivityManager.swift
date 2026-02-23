//
//  WatchConnectivityManager.swift
//  Maslow (iOS)
//
//  Created on 2/20/26.
//
//  This file should be added to your iOS app target to enable
//  communication with the Apple Watch app.
//

import Foundation
import WatchConnectivity

/// Manages communication between iPhone and Apple Watch
/// Add this to your iOS app to sync user data with the Watch app
@objc(WatchConnectivityManager)
class WatchConnectivityManager: NSObject, ObservableObject {
    static let shared = WatchConnectivityManager()
    
    @Published var isWatchAppInstalled = false
    @Published var isReachable = false
    
    private let session: WCSession?
    
    private override init() {
        // Check if WatchConnectivity is supported
        if WCSession.isSupported() {
            self.session = WCSession.default
        } else {
            self.session = nil
        }
        
        super.init()
        
        if let session = session {
            session.delegate = self
            session.activate()
        }
    }
    
    // MARK: - Public Methods (Call from React Native)
    
    /// Send user data to the Watch app
    /// Call this method when:
    /// - User logs in
    /// - User data is updated
    /// - Watch requests fresh data
    @objc
    func sendUserData(
        memberId: String,
        name: String,
        membershipTier: String,
        email: String? = nil
    ) {
        guard let session = session else {
            print("⚠️ WatchConnectivity not supported")
            return
        }
        
        let userData: [String: Any] = [
            "id": UUID().uuidString,
            "memberId": memberId,
            "name": name,
            "membershipTier": membershipTier,
            "email": email ?? ""
        ]
        
        let message = [
            "action": "updateUser",
            "user": userData
        ]
        
        // Try to send message if Watch is reachable
        if session.isReachable {
            session.sendMessage(
                message,
                replyHandler: { reply in
                    print("✅ Watch received user data: \(reply)")
                },
                errorHandler: { error in
                    print("❌ Error sending to Watch: \(error.localizedDescription)")
                    // Fallback: Update application context
                    self.updateApplicationContext(with: userData)
                }
            )
        } else {
            // Watch is not reachable, update application context
            // This will be delivered when Watch becomes available
            updateApplicationContext(with: userData)
        }
    }
    
    /// Update application context (persists for when Watch becomes available)
    private func updateApplicationContext(with userData: [String: Any]) {
        guard let session = session else { return }
        
        do {
            try session.updateApplicationContext(["user": userData])
            print("✅ Application context updated")
        } catch {
            print("❌ Error updating application context: \(error.localizedDescription)")
        }
    }
    
    /// Clear user data from Watch (e.g., when user logs out)
    @objc
    func clearUserData() {
        guard let session = session else { return }
        
        let message = [
            "action": "clearUser"
        ]
        
        if session.isReachable {
            session.sendMessage(message, replyHandler: nil) { error in
                print("❌ Error clearing Watch data: \(error.localizedDescription)")
            }
        }
        
        // Also clear application context
        do {
            try session.updateApplicationContext([:])
        } catch {
            print("❌ Error clearing application context: \(error)")
        }
    }
}

// MARK: - WCSessionDelegate

extension WatchConnectivityManager: WCSessionDelegate {
    func sessionDidBecomeInactive(_ session: WCSession) {
        print("📱 Watch session became inactive")
    }
    
    func sessionDidDeactivate(_ session: WCSession) {
        print("📱 Watch session deactivated")
        // Re-activate session for iOS
        session.activate()
    }
    
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        DispatchQueue.main.async {
            self.isWatchAppInstalled = session.isWatchAppInstalled
            self.isReachable = session.isReachable
        }
        
        if let error = error {
            print("❌ Watch Connectivity activation error: \(error.localizedDescription)")
        } else {
            print("✅ Watch Connectivity activated: \(activationState.rawValue)")
            print("   - Watch app installed: \(session.isWatchAppInstalled)")
            print("   - Watch reachable: \(session.isReachable)")
        }
    }
    
    func sessionReachabilityDidChange(_ session: WCSession) {
        DispatchQueue.main.async {
            self.isReachable = session.isReachable
            print("⌚️ Watch reachability changed: \(session.isReachable)")
        }
    }
    
    // MARK: - Receiving Messages from Watch
    
    func session(_ session: WCSession, didReceiveMessage message: [String: Any], replyHandler: @escaping ([String: Any]) -> Void) {
        print("📨 Received message from Watch: \(message)")
        
        guard let action = message["action"] as? String else {
            replyHandler(["error": "No action specified"])
            return
        }
        
        switch action {
        case "getUserData":
            // Watch is requesting user data
            // You would fetch current user data from your app state/storage
            // For now, send a placeholder response
            replyHandler([
                "status": "success",
                "user": getCurrentUserData()
            ])
            
        case "ping":
            replyHandler(["status": "pong"])
            
        default:
            replyHandler(["error": "Unknown action: \(action)"])
        }
    }
    
    // MARK: - Helper Methods
    
    /// Get current user data from your app
    /// This should be replaced with actual user data from your app state
    private func getCurrentUserData() -> [String: Any] {
        // TODO: Replace with actual user data from your app
        // This is just a placeholder
        return [
            "id": "user-123",
            "memberId": "MASLOW-001",
            "name": "Demo User",
            "membershipTier": "Founding Member",
            "email": "demo@maslownyc.com"
        ]
    }
}

// MARK: - React Native Bridge (Optional)

#if RCT_NEW_ARCH_ENABLED
// For new architecture, you'd implement a Turbo Module
// This is a placeholder for future implementation
#else
// For old architecture, you can use RCTBridgeModule

import React

@objc(RNWatchConnectivity)
class RNWatchConnectivity: NSObject {
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    @objc
    func sendUserData(
        _ memberId: String,
        name: String,
        membershipTier: String,
        email: String?
    ) {
        WatchConnectivityManager.shared.sendUserData(
            memberId: memberId,
            name: name,
            membershipTier: membershipTier,
            email: email
        )
    }
    
    @objc
    func clearUserData() {
        WatchConnectivityManager.shared.clearUserData()
    }
}

#endif
