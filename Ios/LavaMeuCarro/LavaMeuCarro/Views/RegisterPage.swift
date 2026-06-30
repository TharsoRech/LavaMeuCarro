import SwiftUI
import _PhotosUI_SwiftUI

struct RegisterPage: View {
    @State var viewModel: RegisterPageViewModel
    
    
    
    var body: some View {
        ZStack {
            Color.PrimaryBlue
                .ignoresSafeArea()
            
            VStack(spacing: 20) {
                Text("Criar Conta")
                    .font(.title)
                    .foregroundColor(.white)
                    .multilineTextAlignment(.center)
                    .padding(.top, 40)
                
                SelectProfileView(selectedProfile: $viewModel.profileType)
                
                SelectImage(selectedPhotoItem: $viewModel.selectedPhotoItem, displayImage: $viewModel.displayImage)
                
                
                
                Spacer()

        
                }
                .padding(.horizontal, 0)
                .padding(.bottom, 20)
            }
    }
}

#Preview {
    RegisterPage(viewModel: RegisterPageViewModel(flowManager: AppFlowManager()))
}
