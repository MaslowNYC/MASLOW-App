//
//  WatchConnectivityManager.swift
//  MASLOW (iOS)
//
//  Created on 2/20/26.
//
//  Add this file to your iOS app target to sync data with Apple Watch
//

import Foundation
import WatchConnectivity

class iOSWatchConnectivityManager: NSObject, ObservableObject {
    static let shared = iOSWatchConnectivityManager()
    
    @Published var isWatchPaired = false
    @Published var isWatchAppInstalled = false
    
    private override init() {
        super.init()
        
        if WCSession.isSupported() {
            let session = WCSession.default
            session.delegate = self
            session.activate()
        }
    }
    
    /// Send member data to Apple Watch
    /// Call this after login or when credits change
    func syncToWatch(credits: Int, memberNumber: Int) {
        guard WCSession.isSupported() else {
            print("📱 WatchConnectivity not supported")
            return
        }
        
        let session = WCSession.default
        
        guard session.activationState == .activated else {
            print("📱 WCSession not activated")
            return
        }
        
        let context = [
            "credits": credits,
            "memberNumber": memberNumber
        ] as [String : Any]
        
        do {
            try session.updateApplicationContext(context)
            print("📱 Synced to Watch: \(credits) credits, member #\(memberNumber)")
        } catch {
            print("📱 Error syncing to Watch: \(error)")
        }
    }
    
    /// Clear Watch data (e.g., on logout)
    func clearWatchData() {
        syncToWatch(credits: 0, memberNumber: 0)
    }
}

// MARK: - WCSessionDelegate

extension iOSWatchConnectivityManager: WCSessionDelegate {
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        DispatchQueue.main.async {
            self.isWatchPaired = session.isPaired
            self.isWatchAppInstalled = session.isWatchAppInstalled
        }
        
        if let error = error {
            print("📱 WCSession activation error: \(error)")
        } else {
            print("📱 WCSession activated - Watch paired: \(session.isPaired), App installed: \(session.isWatchAppInstalled)")
        }
    }
    
    func sessionDidBecomeInactive(_ session: WCSession) {
        print("📱 WCSession became inactive")
    }
    
    func sessionDidDeactivate(_ session: WCSession) {
        print("📱 WCSession deactivated")
        // Reactivate session on iOS
        session.activate()
    }
    
    func sessionReachabilityDidChange(_ session: WCSession) {
        print("📱 Watch reachability changed: \(session.isReachable)")
    }
}
