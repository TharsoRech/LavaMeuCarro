import SwiftUI

struct LoginPage: View {
    
    @State private var viewModel = LoginPageViewModel()
    
    var body: some View {
        ZStack {
            Color.PrimaryBlue.ignoresSafeArea()
            
            VStack(spacing: 16) {
                // Título
                Text("Entrar")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                    .multilineTextAlignment(.center)
                    .padding(.top, 40)
                
                // Ícone do App
                Image("AppIcon")
                    .resizable()
                    .scaledToFit()
                    .frame(height: 220) // Ajustado para dar espaço aos campos
                
                Text("Lava Meu Carro")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                
                Text("Para frotas e parceiros")
                    .font(.subheadline)
                    .foregroundColor(.white.opacity(0.8))
                    .padding(.top, -16)
                
                VStack(alignment: .leading, spacing: 16) {
                    
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Seu e-mail")
                            .font(.caption)
                            .foregroundColor(.white.opacity(0.9))
                        
                        TextField("", text: $viewModel.email)
                            .autocapitalization(.none)
                            .keyboardType(.emailAddress)
                            .padding()
                            .frame(height: 50)
                            .foregroundColor(.white)
                            .background(Color.clear)
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(Color.white, lineWidth: 1.5)
                            )
                    }
                    
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Sua senha")
                            .font(.caption)
                            .foregroundColor(.white.opacity(0.9))
                        
                        SecureField("", text: $viewModel.senha)
                            .padding()
                            .frame(height: 50)
                            .foregroundColor(.white)
                            .background(Color.clear)
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(Color.white, lineWidth: 1.5)
                            )
                    }
                    
                    Button(action: {
                        viewModel.esqueceuSenha()
                    }) {
                        Text("Esqueceu a senha?")
                            .font(.footnote)
                            .foregroundColor(.white.opacity(0.9))
                            .underline()
                    }
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding(.top, 4)
                }
                .padding(.horizontal, 24)
                
                VStack(spacing: 16) {
                    Button(action: {
                        viewModel.efetuarLogin()
                    }) {
                        Text("Entrar")
                            .font(.headline)
                            .foregroundColor(.PrimaryBlue)
                            .frame(maxWidth: .infinity)
                            .frame(height: 54)
                            .background(Color.white)
                            .cornerRadius(27)
                    }
                    
                    // Link para criar conta
                    Button(action: {
                        viewModel.irParaCadastro()
                    }) {
                        HStack(spacing: 4) {
                            Text("Não tem conta?")
                                .foregroundColor(.white.opacity(0.8))
                            Text("Cadastre-se")
                                .foregroundColor(.white)
                                .fontWeight(.bold)
                                .underline()
                        }
                        .font(.footnote)
                    }
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 20)
                .padding(.top, 20)
                
                Spacer()
            
            }
        }
    }
}

#Preview {
    LoginPage()
}
