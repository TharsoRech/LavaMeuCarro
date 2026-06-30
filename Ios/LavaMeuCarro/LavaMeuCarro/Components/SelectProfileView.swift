import SwiftUI

struct SelectProfileView: View {
    
    @Binding var selectedProfile: ProfileType
    
    var body: some View {
            HStack(spacing: 0) {
                // Botão Cliente
                Button(action: {
                    withAnimation(.easeInOut(duration: 0.2)) {
                        selectedProfile = .client
                    }
                }) {
                    HStack {
                        Image(systemName: "person.2.fill")
                        Text("Cliente")
                            .font(.system(size: 14, weight: .medium))
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(selectedProfile == .client ? Color.PrimaryBlue: Color.clear)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(selectedProfile == .client ? Color.white : Color.clear, lineWidth: 1.5)
                    )
                }
                Button(action: {
                    withAnimation(.easeInOut(duration: 0.2)) {
                        selectedProfile = .professional
                    }
                }) {
                    HStack {
                        Image(systemName: "scissors")
                        Text("Profissional")
                            .font(.system(size: 14, weight: .medium))
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(selectedProfile == .professional ? Color.PrimaryBlue : Color.clear)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(selectedProfile == .professional ? Color.white : Color.clear, lineWidth: 1.5)
                    )
                }
            }
            .padding(4)
            .frame(height: 55)
            .background(Color.black.opacity(0.05))
            .cornerRadius(16)
            .padding(.horizontal)
        }
}

#Preview {
    SelectProfileView(selectedProfile: .constant(.client))
}
