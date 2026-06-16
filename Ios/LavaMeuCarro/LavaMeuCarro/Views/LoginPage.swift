import SwiftUI

struct LoginPage: View {
    
    @State var viewModel: LoginPageViewModel
    
    var body: some View {
        ZStack {
            Color.PrimaryBlue.ignoresSafeArea()
            
            VStack(spacing: 16) {
                Text("Entrar")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                    .multilineTextAlignment(.center)
                    .padding(.top, 40)
                
                Image("AppIcon")
                    .resizable()
                    .scaledToFit()
                    .frame(height: 220)
                
                Text("Lava Meu Carro")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                
                Text("Sua Lavagem do sei jeito!")
                    .font(.headline)
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
                                        .stroke(viewModel.emailError != nil ? Color.red : Color.white, lineWidth: 1.5)
                                )
                                // Dispara a validação a cada caractere digitado (Sintaxe iOS 17+)
                                .onChange(of: viewModel.email) {
                                    viewModel.validateEmail()
                                }
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
                        viewModel.forgetPassword()
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
                        viewModel.Login()
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
                        viewModel.goToRegister()
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
    LoginPage(viewModel: LoginPageViewModel(flowManager: AppFlowManager()))
}
