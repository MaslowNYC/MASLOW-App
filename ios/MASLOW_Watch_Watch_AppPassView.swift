//
//  PassView.swift
//  MASLOW Watch Watch App
//
//  Created on 2/20/26.
//

import SwiftUI

struct PassView: View {
    let user: MaslowUser
    @Environment(\.dismiss) private var dismiss
    @State private var brightness: Double = 1.0
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    // User Name
                    Text(user.name)
                        .font(.title3)
                        .fontWeight(.semibold)
                    
                    // Membership Tier
                    Text(user.membershipTier)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .textCase(.uppercase)
                    
                    // QR Code
                    if let qrImage = generateQRCode(from: user.memberId) {
                        Image(uiImage: qrImage)
                            .interpolation(.none)
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.white)
                            .cornerRadius(12)
                    } else {
                        RoundedRectangle(cornerRadius: 12)
                            .fill(Color.gray.opacity(0.2))
                            .frame(height: 140)
                            .overlay {
                                Text("QR Unavailable")
                                    .foregroundStyle(.secondary)
                            }
                    }
                    
                    // Member ID
                    Text("ID: \(user.memberId)")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                        .monospaced()
                    
                    // Brightness tip
                    Text("Tap to adjust brightness")
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                        .padding(.top, 4)
                }
                .padding()
            }
            .navigationTitle("Member Pass")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
            .onTapGesture {
                toggleBrightness()
            }
        }
    }
    
    // MARK: - QR Code Generation
    
    private func generateQRCode(from string: String) -> UIImage? {
        let data = string.data(using: .ascii)
        
        guard let filter = CIFilter(name: "CIQRCodeGenerator") else {
            return nil
        }
        
        filter.setValue(data, forKey: "inputMessage")
        filter.setValue("H", forKey: "inputCorrectionLevel")
        
        guard let outputImage = filter.outputImage else {
            return nil
        }
        
        // Scale up the QR code
        let transform = CGAffineTransform(scaleX: 10, y: 10)
        let scaledImage = outputImage.transformed(by: transform)
        
        let context = CIContext()
        guard let cgImage = context.createCGImage(scaledImage, from: scaledImage.extent) else {
            return nil
        }
        
        return UIImage(cgImage: cgImage)
    }
    
    // MARK: - Brightness Control
    
    private func toggleBrightness() {
        withAnimation {
            brightness = brightness > 0.8 ? 0.5 : 1.0
        }
        WKInterfaceDevice.current().play(.click)
    }
}

#Preview {
    PassView(user: MaslowUser(
        memberId: "MASLOW-001",
        name: "John Doe",
        membershipTier: "Founding Member"
    ))
}
