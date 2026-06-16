import SwiftUI

struct HomePage: View {
    // Instanciando o ViewModel que vai gerenciar o estado desta tela
    @State var viewModel: HomePageViewModel
    
    var body: some View {
        ZStack {
            Color.PrimaryBlue
                .ignoresSafeArea()
            
            VStack(spacing: 20) {
                Image("CarWash")
                    .resizable()
                    .scaledToFit()
                    .padding(.top, 80)
                    .padding(.horizontal,10)
                
                Text("Bem Vindo ao Lava Meu Carro")
                    .font(.title)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
                
                Text("Sua Lavagem do sei jeito!")
                    .font(.headline)
                    .foregroundColor(.white.opacity(0.8))
                
                Spacer()
                
                VStack(spacing: 16) {
                    
                    Button(action: {
                        viewModel.goToRegistry()
                    }) {
                        Text("Cadastrar")
                            .font(.headline)
                            .foregroundColor(.PrimaryBlue)
                            .frame(maxWidth: .infinity)
                            .frame(height: 54)
                            .background(Color.white)
                            .cornerRadius(27)
                    }
                    
                    Button(action: {
                        viewModel.gotoLogin()
                    }) {
                        Text("Entrar")
                            .font(.headline)
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .frame(height: 54)
                            .background(Color.clear)
                            .overlay(
                                RoundedRectangle(cornerRadius: 27)
                                    .stroke(Color.white, lineWidth: 2)
                            )
                    }
                    
                    Button(action: {
                        viewModel.enterAsGuest()
                    }) {
                        Text("Ou continue como convidado")
                            .font(.footnote)
                            .foregroundColor(.white.opacity(0.9))
                            .underline()
                            .padding(.top, 8)
                    }
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 20)
            }
        }
    }
}

#Preview {
    HomePage(viewModel: HomePageViewModel(flowManager: AppFlowManager()))
}


