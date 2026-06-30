import Foundation

@Observable
class HomePageViewModel {
    
    var flowManager: AppFlowManager
    
    init(flowManager: AppFlowManager) {
            self.flowManager = flowManager
        }
    
    var isLoading: Bool = false
    
    func goToRegistry() {
        flowManager.goToRegister()
    }
    
    func gotoLogin() {
        flowManager.goToLogin()
    }
    
    func enterAsGuest() {
        
    }
}
