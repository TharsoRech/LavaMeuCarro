import Foundation

// Usamos @Observable (disponível no iOS 17+) ou ObservableObject (iOS 16 e anteriores)
@Observable
class HomePageViewModel {
    
    // Propriedades de estado (ex: controlam telas de carregamento ou navegação)
    var isLoading: Bool = false
    
    // Funções que a View vai chamar ao interagir com os botões
    func cadastrar() {
        print("MVVM: Lógica para iniciar fluxo de cadastro")
        // Aqui você pode mudar uma variável de navegação ou disparar um evento
    }
    
    func entrar() {
        print("MVVM: Lógica para iniciar fluxo de login")
    }
    
    func continuarComoConvidado() {
        print("MVVM: Lógica para pular autenticação")
    }
}
