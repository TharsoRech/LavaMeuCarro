import SwiftUI
import _PhotosUI_SwiftUI

struct RegisterPage: View {
    @State var viewModel: RegisterPageViewModel
    @State private var email: String = ""
    @State private var emailError: String? = nil
    
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
                
                CustomTextField(
                    title: "Email",
                    text: $email,
                    errorMessage: emailError
                )
                .onChange(of: email) { _, newValue in
                    viewModel.email = newValue
                    emailError = viewModel.validateEmail(newValue)
                }
                .padding(.horizontal, 24)
                .padding(.vertical, 16)
            
                
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
