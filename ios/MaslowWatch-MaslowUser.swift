//
//  MaslowUser.swift
//  Maslow Watch
//
//  Created on 2/20/26.
//

import Foundation

/// Represents a Maslow member user
struct MaslowUser: Codable, Identifiable {
    let id: String
    let memberId: String
    let name: String
    let membershipTier: String
    let email: String?
    let joinDate: Date?
    
    // Convenience initializer for testing
    init(
        id: String = UUID().uuidString,
        memberId: String,
        name: String,
        membershipTier: String,
        email: String? = nil,
        joinDate: Date? = nil
    ) {
        self.id = id
        self.memberId = memberId
        self.name = name
        self.membershipTier = membershipTier
        self.email = email
        self.joinDate = joinDate
    }
}

extension MaslowUser {
    /// Creates a user from a dictionary (from Watch Connectivity)
    init?(from dictionary: [String: Any]) {
        guard let memberId = dictionary["memberId"] as? String,
              let name = dictionary["name"] as? String,
              let membershipTier = dictionary["membershipTier"] as? String else {
            return nil
        }
        
        self.id = dictionary["id"] as? String ?? UUID().uuidString
        self.memberId = memberId
        self.name = name
        self.membershipTier = membershipTier
        self.email = dictionary["email"] as? String
        
        if let joinDateString = dictionary["joinDate"] as? String,
           let date = ISO8601DateFormatter().date(from: joinDateString) {
            self.joinDate = date
        } else {
            self.joinDate = nil
        }
    }
    
    /// Converts the user to a dictionary (for Watch Connectivity)
    func toDictionary() -> [String: Any] {
        var dict: [String: Any] = [
            "id": id,
            "memberId": memberId,
            "name": name,
            "membershipTier": membershipTier
        ]
        
        if let email = email {
            dict["email"] = email
        }
        
        if let joinDate = joinDate {
            dict["joinDate"] = ISO8601DateFormatter().string(from: joinDate)
        }
        
        return dict
    }
}
