import Foundation
import SwiftUI
import PhotosUI

@Observable
class RegisterPageViewModel: BaseViewModel {
    var email: String = ""
    
    var fullName: String = ""
    
    var phone: String = ""
    
    var dob: String = ""
    
    var cpf: String = ""
    
    var password: String = ""
    
    var showingForgotPassword = false

    var emailError: String? = nil
    
    var phoneError: String? = nil
    
    var dobError: String? = nil
    
    var cpfError: String? = nil
    
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
    
    func validatePhone(_ value: String) -> String? {
        let digitsOnly = value.filter { $0.isNumber }
        
        if digitsOnly.isEmpty {
            return nil
        } else {
            let phoneRegex = "^[1-9]{2}[2-9][0-9]{7,8}$"
            let phonePredicate = NSPredicate(format: "SELF MATCHES %@", phoneRegex)
            
            if !phonePredicate.evaluate(with: digitsOnly) {
                return "Telefone inválido"
            }
            return nil
        }
    }
    
    func validateDob(_ value: String) -> String? {
        let digitsOnly = value.filter { $0.isNumber }
        
        if digitsOnly.isEmpty {
            return nil
        }
        
        if digitsOnly.count != 8 {
            return "Data de nascimento inválida"
        }
        
        let dateRegex = "^(0[1-9]|[12][0-9]|3[01])(0[1-9]|1[012])[12][0-9]{3}$"
        let datePredicate = NSPredicate(format: "SELF MATCHES %@", dateRegex)
        
        if !datePredicate.evaluate(with: digitsOnly) {
            return "Data inválida"
        }
        
        return nil
    }
    
    func validateCpf(_ value: String) -> String? {
        let digitsOnly = value.filter { $0.isNumber }
        
        if digitsOnly.isEmpty {
            return nil
        }
        
        if digitsOnly.count != 11 {
            return "CPF inválido"
        }
        
        let allEqual = digitsOnly.allSatisfy { $0 == digitsOnly.first }
        if allEqual {
            return "CPF inválido"
        }
        
        let numbers = digitsOnly.compactMap { Int(String($0)) }
        
        var sum = 0
        for i in 0..<9 {
            sum += numbers[i] * (10 - i)
        }
        var firstCheck = 11 - (sum % 11)
        if firstCheck >= 10 { firstCheck = 0 }
        if numbers[9] != firstCheck { return "CPF inválido" }
        
        sum = 0
        for i in 0..<10 {
            sum += numbers[i] * (11 - i)
        }
        var secondCheck = 11 - (sum % 11)
        if secondCheck >= 10 { secondCheck = 0 }
        if numbers[10] != secondCheck { return "CPF inválido" }
        
        return nil
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
