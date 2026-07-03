import SwiftUI

struct CustomTextField: View {
    let title: String
    @Binding var text: String
    var errorMessage: String? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.subheadline)
                .foregroundColor(.white.opacity(0.9))
            
            TextField("", text: $text)
                .autocapitalization(.none)
                .keyboardType(.emailAddress)
                .frame(height: 50)
                .padding(.horizontal, 16)
                .foregroundColor(.white)
                .background(Color.clear)
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(errorMessage != nil ? Color.red : Color.white, lineWidth: 1.5)
                )
            
            if let errorMessage {
                Text(errorMessage)
                    .font(.caption)
                    .foregroundColor(.red)
            }
        }
    }
}

#Preview {
    CustomTextField(
            title: "Email", 
            text: .constant("example@email.com"),
            errorMessage: nil
        ).padding()
        .background(Color.blue)
}
