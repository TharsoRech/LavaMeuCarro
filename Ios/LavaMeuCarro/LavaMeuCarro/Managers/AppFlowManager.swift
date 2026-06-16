import Foundation

enum AppScreen {
    case login
    case register
    case home
}

@Observable
class AppFlowManager {
    // A tela inicial padrão do app
    var telaAtual: AppScreen = .home
    
    // Funções simples para mudar de tela
    func goToLogin() {
        telaAtual = .login
    }
    
    func goToHome() {
        telaAtual = .home
    }
    
    func goToRegister() {
        telaAtual = .register
    }
}
