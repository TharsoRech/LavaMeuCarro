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
                
                CustomTextField(
                    placeHolder: "Nome Completo",
                    text: $viewModel.fullName
                ).padding(.horizontal, 24)
                    .padding(.vertical, 4)
                
                CustomTextField(
                    placeHolder: "Email",
                    text: $viewModel.email,
                    errorMessage: viewModel.emailError
                )
                .onChange(of: viewModel.email) { _, newValue in
                    viewModel.emailError = viewModel.validateEmail(newValue)
                }
                .padding(.horizontal, 24)
                .padding(.vertical, 4)
                
                
                CustomTextField(
                    placeHolder: "Telefone",
                    text: $viewModel.phone,
                    errorMessage: viewModel.phoneError
                )
                .onChange(of: viewModel.phone) { _, newValue in
                    viewModel.phoneError = viewModel.validatePhone(newValue)
                        
                        let formatted = newValue.formattedAsPhone()
                        if viewModel.phone != formatted {
                            viewModel.phone = formatted
                        }
                }
                .padding(.horizontal, 24)
                .padding(.vertical, 4)
                
                HStack(alignment: .top, spacing: 0){
                    CustomTextField(
                        placeHolder: "CPF",
                        text: $viewModel.cpf,
                        errorMessage: viewModel.cpfError
                    )
                    .onChange(of: viewModel.cpf) { _, newValue in
                        viewModel.cpfError = viewModel.validateCpf(newValue)
                        
                        let formatted = newValue.formattedAsCpf()
                                if viewModel.cpf != formatted {
                                    viewModel.cpf = formatted
                                }
                    }
                    .padding(.leading, 24)
                    .padding(.trailing, 4)
                    .padding(.vertical, 4)
                    
                    CustomTextField(
                        placeHolder: "Nascimento",
                        text: $viewModel.dob,
                        errorMessage: viewModel.dobError
                    )
                    .onChange(of: viewModel.dob) { _, newValue in
                        viewModel.dobError = viewModel.validateDob(newValue)
                        
                        let formatted = newValue.formattedAsDob()
                                if viewModel.dob != formatted {
                                    viewModel.dob = formatted
                                }
                    }
                    .padding(.trailing, 24)
                    .padding(.leading, 4)
                    .padding(.vertical, 4)
                }
                
                CustomTextField(
                    placeHolder: "Senha",
                    text: $viewModel.password,
                    isPassword: true
                ).padding(.horizontal, 24)
                    .padding(.vertical, 4)
            
                
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
