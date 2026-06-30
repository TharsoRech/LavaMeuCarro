import SwiftUI
import PhotosUI

struct SelectImage: View {

    @Binding var selectedPhotoItem: PhotosPickerItem?
    @Binding var displayImage: Image?
    
    var body: some View {
        PhotosPicker(selection: $selectedPhotoItem, matching: .images) {
            if let displayImage = displayImage {
                displayImage
                    .resizable()
                    .scaledToFill()
                    .frame(width: 80, height: 80)
                    .clipShape(Circle())
                    .overlay(Circle().stroke(Color.white, lineWidth: 2))
                    .shadow(radius: 4)
            } else {
                ZStack {
                    Circle()
                        .fill(Color.white.opacity(0.2))
                        .frame(width: 80, height: 80)
                        .overlay(Circle().stroke(Color.white, lineWidth: 2))
                    
                    Image(systemName: "camera.fill")
                        .font(.system(size: 24)) // Ajustado o tamanho para não estourar os 80px
                        .foregroundColor(.white)
                }
            }
        }
        .padding(.top, 10)
    }
}

#Preview {
    ZStack {
        Color.PrimaryBlue.ignoresSafeArea()
        
        SelectImage(
            selectedPhotoItem: .constant(nil),
            displayImage: .constant(nil)
        )
    }
}
