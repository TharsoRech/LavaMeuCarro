import Foundation
import SwiftUI
import PhotosUI

@Observable 
class RegisterPageViewModel {
    var email: String = ""
    var password: String = ""
    
    var showingForgotPassword = false

    var emailError: String? = nil
    
    var flowManager: AppFlowManager
    
    var profileType: ProfileType
    
    var base64Image: String? = nil
        var selectedPhotoItem: PhotosPickerItem? = nil {
            didSet {
                // Toda vez que o usuário escolher uma foto, processa em background
                Task {
                    await processSelectedPhoto()
                }
            }
        }
    
    var displayImage: Image? = nil // Imagem pronta para renderizar no SwiftUI
    
    init(flowManager: AppFlowManager) {
            self.flowManager = flowManager
            self.profileType = .client
        }
        
    var emailsIsValid: Bool {
            let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
            let emailPredicate = NSPredicate(format:"SELF MATCHES %@", emailRegex)
            return emailPredicate.evaluate(with: email)
    }
    
    var isFormValid: Bool {
        return !email.isEmpty && emailError == nil && !password.isEmpty
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
    
    func goToHome() {
        flowManager.goToHome();
    }
    
    func sendRecoverCode() {
        print("API: Solicitando código para \(self.email)")
    }

    func updatePassword(codigo: String, novaSenha: String) {
        print("API: Atualizando senha com código \(codigo) e nova senha \(novaSenha)")
    }
    
    @MainActor
        private func processSelectedPhoto() async {
            guard let item = selectedPhotoItem else { return }
            
            // Carrega os dados brutos da imagem (UIKit/UIImage compatível)
            if let data = try? await item.loadTransferable(type: Data.self) {
                // 1. Converte para UIImage para podermos comprimir e garantir o formato correto (JPEG)
                if let uiImage = UIImage(data: data) {
                    // Comprime a imagem (0.7 tira peso sem perder qualidade perceptível no avatar)
                    if let jpegData = uiImage.jpegData(compressionQuality: 0.7) {
                        // 2. Transforma em Base64
                        self.base64Image = jpegData.base64EncodedString()
                        
                        // 3. Atualiza a propriedade visual para a View exibir
                        self.displayImage = Image(uiImage: uiImage)
                        print("Sucesso! Imagem convertida para Base64. Tamanho: \(self.base64Image?.count ?? 0) caracteres.")
                    }
                }
            }
        }
}
