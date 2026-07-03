import Foundation
import SwiftUI
import PhotosUI

@Observable
class RegisterPageViewModel: BaseViewModel {
    var email: String = ""
    var fullName: String = ""
    
    var showingForgotPassword = false

    var emailError: String? = nil
    
    var flowManager: AppFlowManager
    
    var profileType: ProfileType
    
    var emailHasError: Bool {
        return emailError != nil
    }

    
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
        return !email.isEmpty && emailError == nil
    }
    
    func validateEmail(_ value: String) -> String? {
            if value.isEmpty {
                return nil
            } else {
                let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
                let emailPredicate = NSPredicate(format:"SELF MATCHES %@", emailRegex)
                if !emailPredicate.evaluate(with: value) {
                    return "E-mail inválido"
                }
                return nil
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
    
    func goToRegister() {
        flowManager.goToRegister();
    }
    
    func goToHome() {
        flowManager.goToHome();
    }

    
    @MainActor
        private func processSelectedPhoto() async {
            guard let item = selectedPhotoItem else { return }
            
            if let data = try? await item.loadTransferable(type: Data.self) {
                if let uiImage = UIImage(data: data) {
                    if let jpegData = uiImage.jpegData(compressionQuality: 0.7) {
                        self.base64Image = jpegData.base64EncodedString()
                        self.displayImage = Image(uiImage: uiImage)
                    }
                }
            }
        }
}
