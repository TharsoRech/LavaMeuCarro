import Foundation

@Observable // Ou crie como ObservableObject dependendo da versão do iOS
class LoginPageViewModel {
    var email: String = ""
    var senha: String = ""
    
    func efetuarLogin() {
        // Lógica de autenticação aqui
    }
    
    func esqueceuSenha() {
        // Fluxo de recuperar senha
    }
    
    func irParaCadastro() {
        // Navegação para a tela de registro
    }
}
