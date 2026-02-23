//
//  PassView.swift
//  MASLOW Watch
//
//  Created on 2/20/26.
//

import SwiftUI
import CoreImage.CIFilterBuiltins

struct PassView: View {
    let memberNumber: Int
    
    var body: some View {
        VStack(spacing: 12) {
            Image(uiImage: generateQRCode(from: generateQRData()))
                .interpolation(.none)
                .resizable()
                .scaledToFit()
                .frame(width: 150, height: 150)
                .padding()
            
            Text("Scan to check in")
                .font(.caption2)
                .foregroundColor(.gray)
        }
        .navigationTitle("Your Pass")
        .navigationBarTitleDisplayMode(.inline)
    }
    
    private func generateQRData() -> String {
        return "https://maslownyc.com/member/\(String(format: "%05d", memberNumber))"
    }
    
    private func generateQRCode(from string: String) -> UIImage {
        let context = CIContext()
        let filter = CIFilter.qrCodeGenerator()
        filter.message = Data(string.utf8)
        filter.correctionLevel = "H"
        
        if let outputImage = filter.outputImage {
            let transform = CGAffineTransform(scaleX: 10, y: 10)
            let scaledImage = outputImage.transformed(by: transform)
            
            if let cgImage = context.createCGImage(scaledImage, from: scaledImage.extent) {
                return UIImage(cgImage: cgImage)
            }
        }
        
        return UIImage(systemName: "xmark.circle") ?? UIImage()
    }
}

#Preview {
    PassView(memberNumber: 12345)
}
