import SwiftUI

struct CustomTextField: View {
    let placeHolder: String
    @Binding var text: String
    var errorMessage: String? = nil
    var keyboardType: UIKeyboardType = .default
    var onlyNumbers: Bool = false
    var isPassword: Bool = false

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Group {
                   if isPassword {
                      SecureField("", text: $text, prompt: Text(placeHolder).foregroundColor(.white.opacity(0.4)))
                   } else {
                      TextField("", text: $text, prompt: Text(placeHolder).foregroundColor(.white.opacity(0.4)))
                            }
                }
                .textInputAutocapitalization(.never)
                .keyboardType(keyboardType)
                .frame(height: 50)
                .padding(.horizontal, 16)
                .foregroundColor(.white)
                .background(Color.clear)
                .textContentType(isPassword ? .password : nil)
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(errorMessage != nil ? Color.red : Color.white, lineWidth: 1.5)
                )
                .onChange(of: text) { _, newValue in
                                    if onlyNumbers {
                                        let filtered = newValue.filter { $0.isNumber }
                                        if text != filtered {
                                            text = filtered
                                        }
                                    }
                                }
            
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
            placeHolder: "Email",
            text: .constant("example@email.com"),
            errorMessage: nil
        ).padding()
        .background(Color.blue)
}
