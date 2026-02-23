//
//  RNWatchSync.swift
//  MASLOW
//
//  Created on 2/20/26.
//
//  React Native module for syncing to Apple Watch
//

import Foundation
import React

@objc(RNWatchSync)
class RNWatchSync: NSObject {
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    @objc
    func syncToWatch(_ credits: NSNumber, memberNumber: NSNumber) {
        iOSWatchConnectivityManager.shared.syncToWatch(
            credits: credits.intValue,
            memberNumber: memberNumber.intValue
        )
    }
    
    @objc
    func clearWatchData() {
        iOSWatchConnectivityManager.shared.clearWatchData()
    }
}
