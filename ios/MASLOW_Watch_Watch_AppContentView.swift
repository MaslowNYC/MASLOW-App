//
//  ContentView.swift
//  MASLOW Watch Watch App
//
//  Created on 2/20/26.
//

import SwiftUI
import WatchKit

struct ContentView: View {
    @StateObject private var connectivityManager = WatchConnectivityManager.shared
    @State private var showingPass = false
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                // Maslow Logo
                Image("MaslowLogo")
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: 80, height: 80)
                    .padding(.top)
                
                if let user = connectivityManager.currentUser {
                    // User Info
                    VStack(spacing: 8) {
                        Text(user.name)
                            .font(.headline)
                            .foregroundStyle(.primary)
                        
                        Text(user.membershipTier)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .textCase(.uppercase)
                    }
                    .padding(.vertical)
                    
                    // Show Pass Button
                    Button {
                        showingPass = true
                    } label: {
                        HStack {
                            Image(systemName: "qrcode")
                            Text("Show Pass")
                        }
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.accentColor)
                        .foregroundStyle(.white)
                        .cornerRadius(12)
                    }
                    .buttonStyle(.plain)
                    
                } else {
                    // No user data
                    VStack(spacing: 12) {
                        Image(systemName: "iphone.and.arrow.forward")
                            .font(.largeTitle)
                            .foregroundStyle(.secondary)
                        
                        Text("Open the Maslow app on your iPhone to sync")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .padding()
                }
            }
            .padding()
            .navigationTitle("Maslow")
            .navigationBarTitleDisplayMode(.inline)
        }
        .sheet(isPresented: $showingPass) {
            if let user = connectivityManager.currentUser {
                PassView(user: user)
            }
        }
    }
}

#Preview {
    ContentView()
}
