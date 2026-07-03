import Foundation

@Observable
class HomePageViewModel : BaseViewModel{
    
    var flowManager: AppFlowManager
    
    init(flowManager: AppFlowManager) {
            self.flowManager = flowManager
        }
    
    func goToRegistry() {
        flowManager.goToRegister()
    }
    
    func gotoLogin() {
        flowManager.goToLogin()
    }
    
    func enterAsGuest() {
        
    }
}
