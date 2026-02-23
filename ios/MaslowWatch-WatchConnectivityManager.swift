//
//  WatchConnectivityManager.swift
//  Maslow Watch
//
//  Created on 2/20/26.
//

import Foundation
import WatchConnectivity

/// Manages communication between iPhone and Apple Watch
class WatchConnectivityManager: NSObject, ObservableObject {
    static let shared = WatchConnectivityManager()
    
    @Published var currentUser: MaslowUser?
    @Published var isReachable = false
    
    private let session: WCSession
    
    private override init() {
        self.session = WCSession.default
        super.init()
        
        if WCSession.isSupported() {
            session.delegate = self
            session.activate()
            loadCachedUser()
        }
    }
    
    // MARK: - User Data Management
    
    /// Loads cached user data from UserDefaults
    private func loadCachedUser() {
        if let data = UserDefaults.standard.data(forKey: "cachedUser"),
           let user = try? JSONDecoder().decode(MaslowUser.self, from: data) {
            DispatchQueue.main.async {
                self.currentUser = user
            }
        }
    }
    
    /// Saves user data to UserDefaults
    private func cacheUser(_ user: MaslowUser) {
        if let data = try? JSONEncoder().encode(user) {
            UserDefaults.standard.set(data, forKey: "cachedUser")
        }
    }
    
    /// Updates the current user
    private func updateUser(from dictionary: [String: Any]) {
        guard let user = MaslowUser(from: dictionary) else {
            print("❌ Failed to parse user from dictionary")
            return
        }
        
        DispatchQueue.main.async {
            self.currentUser = user
            self.cacheUser(user)
            print("✅ User updated: \(user.name)")
        }
    }
    
    // MARK: - Communication
    
    /// Requests user data from iPhone
    func requestUserData() {
        guard session.isReachable else {
            print("⚠️ iPhone is not reachable")
            return
        }
        
        session.sendMessage(
            ["action": "getUserData"],
            replyHandler: { [weak self] reply in
                if let userData = reply["user"] as? [String: Any] {
                    self?.updateUser(from: userData)
                }
            },
            errorHandler: { error in
                print("❌ Error requesting user data: \(error.localizedDescription)")
            }
        )
    }
}

// MARK: - WCSessionDelegate

extension WatchConnectivityManager: WCSessionDelegate {
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        DispatchQueue.main.async {
            self.isReachable = session.isReachable
        }
        
        if let error = error {
            print("❌ Watch Connectivity activation error: \(error.localizedDescription)")
        } else {
            print("✅ Watch Connectivity activated: \(activationState.rawValue)")
            
            // Request user data immediately after activation if iPhone is reachable
            if session.isReachable {
                requestUserData()
            }
        }
    }
    
    func sessionReachabilityDidChange(_ session: WCSession) {
        DispatchQueue.main.async {
            self.isReachable = session.isReachable
            print("📱 iPhone reachability changed: \(session.isReachable)")
        }
        
        if session.isReachable {
            requestUserData()
        }
    }
    
    // MARK: - Receiving Messages
    
    func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
        print("📨 Received message: \(message)")
        
        if let action = message["action"] as? String {
            switch action {
            case "updateUser":
                if let userData = message["user"] as? [String: Any] {
                    updateUser(from: userData)
                }
            default:
                print("⚠️ Unknown action: \(action)")
            }
        }
    }
    
    func session(_ session: WCSession, didReceiveMessage message: [String: Any], replyHandler: @escaping ([String: Any]) -> Void) {
        print("📨 Received message with reply handler: \(message)")
        
        // Handle messages that expect a reply
        if let action = message["action"] as? String {
            switch action {
            case "ping":
                replyHandler(["status": "pong"])
            default:
                replyHandler(["error": "Unknown action"])
            }
        }
    }
    
    // MARK: - Receiving Application Context
    
    func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
        print("📦 Received application context: \(applicationContext)")
        
        if let userData = applicationContext["user"] as? [String: Any] {
            updateUser(from: userData)
        }
    }
    
    // MARK: - Receiving User Info
    
    func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any] = [:]) {
        print("ℹ️ Received user info: \(userInfo)")
        
        if let userData = userInfo["user"] as? [String: Any] {
            updateUser(from: userData)
        }
    }
}
