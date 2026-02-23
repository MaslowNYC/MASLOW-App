//
//  WatchConnectivityManager.swift
//  MASLOW Watch
//
//  Created on 2/20/26.
//

import Foundation
import WatchConnectivity

class WatchConnectivityManager: NSObject, ObservableObject {
    @Published var credits: Int = 0
    @Published var memberNumber: Int = 0
    
    override init() {
        super.init()
        
        if WCSession.isSupported() {
            let session = WCSession.default
            session.delegate = self
            session.activate()
        }
    }
}

extension WatchConnectivityManager: WCSessionDelegate {
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        if let error = error {
            print("⌚ Watch activation error: \(error)")
        } else {
            print("⌚ Watch session activated")
        }
    }
    
    func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String : Any]) {
        DispatchQueue.main.async {
            if let credits = applicationContext["credits"] as? Int {
                self.credits = credits
            }
            if let memberNumber = applicationContext["memberNumber"] as? Int {
                self.memberNumber = memberNumber
            }
            print("⌚ Watch synced: \(self.credits) credits, member #\(self.memberNumber)")
        }
    }
}
