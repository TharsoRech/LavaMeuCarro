import Foundation

// Usamos @Observable (disponível no iOS 17+) ou ObservableObject (iOS 16 e anteriores)
@Observable
class HomePageViewModel {
    
    var flowManager: AppFlowManager
    
    init(flowManager: AppFlowManager) {
            self.flowManager = flowManager
        }
    
    // Propriedades de estado (ex: controlam telas de carregamento ou navegação)
    var isLoading: Bool = false
    
    // Funções que a View vai chamar ao interagir com os botões
    func goToRegistry() {
        print("MVVM: Lógica para iniciar fluxo de cadastro")
        // Aqui você pode mudar uma variável de navegação ou disparar um evento
    }
    
    func gotoLogin() {
        flowManager.goToLogin()
    }
    
    func enterAsGuest() {
        
    }
}
