import Foundation

enum AppScreen {
    case login
    case register
    case home
}

@Observable
class AppFlowManager {
    var telaAtual: AppScreen = .home
    
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
