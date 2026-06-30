import SwiftUI

struct RootView: View {
    // Recebe o gerenciador de fluxo vindo do App
    @State var flowManager: AppFlowManager
    
    var body: some View {
        Group {
            switch flowManager.telaAtual {
            case .home:
                HomePage(viewModel: HomePageViewModel(flowManager: flowManager))
                
            case .login:
                LoginPage(viewModel: LoginPageViewModel(flowManager: flowManager))
                
            case .register:
                RegisterPage(viewModel: RegisterPageViewModel(flowManager: flowManager))
            
            }
        }
        .animation(.easeInOut, value: flowManager.telaAtual)
    }
}
