//
//  ContentView.swift
//  MASLOW Watch
//
//  Created on 2/20/26.
//

import SwiftUI

struct ContentView: View {
    @StateObject private var connectivity = WatchConnectivityManager()
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 16) {
                // Maslow Logo
                Image("MaslowLogo")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 60, height: 60)
                
                // Member Number
                Text("Member #\(String(format: "%05d", connectivity.memberNumber))")
                    .font(.caption)
                    .foregroundColor(Color(red: 0x28/255, green: 0x6A/255, blue: 0xBC/255))
                
                Spacer()
                
                // Credits Count
                Text("\(connectivity.credits)")
                    .font(.system(size: 56, weight: .bold))
                    .foregroundColor(Color(red: 0x28/255, green: 0x6A/255, blue: 0xBC/255))
                
                Text("Credits")
                    .font(.caption)
                    .foregroundColor(.gray)
                
                Spacer()
                
                // Show Pass Button
                NavigationLink(destination: PassView(memberNumber: connectivity.memberNumber)) {
                    Text("Show Pass")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color(red: 0x28/255, green: 0x6A/255, blue: 0xBC/255))
                        .cornerRadius(12)
                }
                .buttonStyle(PlainButtonStyle())
            }
            .padding()
        }
    }
}

#Preview {
    ContentView()
}
