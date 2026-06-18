import SwiftUI

struct ForgotPasswordSheet: View {
    let email: String
    var onSendCode: () -> Void
    var onConfirmReset: (String, String) -> Void // Retorna (código, novaSenha)
    
    @Environment(\.dismiss) private var dismiss
    @State private var step = 1
    @State private var codigoVerificacao = ""
    @State private var novaSenha = ""
    
    var body: some View {
        VStack(spacing: 24) {
            // Barra superior
            HStack {
                Spacer()
                Button("Fechar") { dismiss() }
                    .foregroundColor(.blue)
            }
            .padding(.bottom, 10)
            
            if step == 1 {
                // --- ETAPA 1: CONFIRMAR E-MAIL ---
                Text("Recuperar Senha")
                    .font(.title2)
                    .fontWeight(.bold)
                
                Text("Enviaremos um código de 6 dígitos para o e-mail cadastrado:")
                    .font(.subheadline)
                    .foregroundColor(.gray)
                    .multilineTextAlignment(.center)
                
                Text(email.isEmpty ? "(Nenhum e-mail digitado)" : email)
                    .font(.headline)
                    .padding()
                    .frame(maxWidth: .infinity)
                    .background(Color.gray.opacity(0.1))
                    .cornerRadius(12)
                
                Button(action: {
                    onSendCode()
                    withAnimation { step = 2 }
                }) {
                    Text("Enviar Código")
                        .font(.headline)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 50)
                        .background(email.isEmpty ? Color.gray : Color.blue)
                        .cornerRadius(25)
                }
                .disabled(email.isEmpty)
                
            } else {
                // --- ETAPA 2: CÓDIGO + NOVA SENHA ---
                Text("Verificar Código")
                    .font(.title2)
                    .fontWeight(.bold)
                
                Text("Digite o código enviado e escolha sua nova senha.")
                    .font(.subheadline)
                    .foregroundColor(.gray)
                    .multilineTextAlignment(.center)
                
                VStack(alignment: .leading, spacing: 6) {
                    Text("Código de 6 dígitos")
                        .font(.caption)
                    TextField("000000", text: $codigoVerificacao)
                        .keyboardType(.numberPad)
                        .padding()
                        .background(Color.gray.opacity(0.1))
                        .cornerRadius(12)
                }
                
                VStack(alignment: .leading, spacing: 6) {
                    Text("Nova Senha")
                        .font(.caption)
                    SecureField("Digite a nova senha", text: $novaSenha)
                        .padding()
                        .background(Color.gray.opacity(0.1))
                        .cornerRadius(12)
                }
                
                Button(action: {
                    onConfirmReset(codigoVerificacao, novaSenha)
                    dismiss() // Fecha o modal automaticamente
                }) {
                    Text("Alterar Senha")
                        .font(.headline)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 50)
                        .background(codigoVerificacao.isEmpty || novaSenha.isEmpty ? Color.gray : Color.blue)
                        .cornerRadius(25)
                }
                .disabled(codigoVerificacao.isEmpty || novaSenha.isEmpty)
            }
            
            Spacer()
        }
        .padding(24)
        .presentationDetents([.medium])
    }
}
