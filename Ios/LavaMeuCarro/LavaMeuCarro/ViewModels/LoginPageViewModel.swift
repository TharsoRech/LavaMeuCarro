import Foundation

@Observable // Ou crie como ObservableObject dependendo da versão do iOS
class LoginPageViewModel {
    var email: String = ""
    var senha: String = ""
    
    var emailError: String? = nil
    
    var flowManager: AppFlowManager
    
    init(flowManager: AppFlowManager) {
            self.flowManager = flowManager
        }
        
    var emailsIsValid: Bool {
            let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
            let emailPredicate = NSPredicate(format:"SELF MATCHES %@", emailRegex)
            return emailPredicate.evaluate(with: email)
    }
    
    func validateEmail() {
            if email.isEmpty {
                emailError = nil // Se apagou tudo, limpa o erro para não irritar o usuário
            } else if !emailsIsValid {
                emailError = "E-mail inválido" // Mostra um aviso curto enquanto digita
            } else {
                emailError = nil // Se o formato ficou correto, some com o erro na hora!
            }
        }
    
    func Login() {
           emailError = nil
            
            if email.isEmpty {
                emailError = "O campo de e-mail não pode estar vazio."
                return
            }
            
            if !emailsIsValid {
                emailError = "Por favor, insira um e-mail válido."
                return
            }
            
            // Se passar na validação, prossegue com o login
            print("E-mail válido! Prosseguindo com a autenticação...")
        }
    
    func forgetPassword() {
        // Fluxo de recuperar senha
    }
    
    func goToRegister() {
        flowManager.goToRegister();
    }
}
