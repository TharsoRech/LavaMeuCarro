package com.TFSoftware.lavemeucarro.app.presentation.screens.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.TFSoftware.lavemeucarro.app.data.models.RegisterRequest
import com.TFSoftware.lavemeucarro.app.data.remote.LavaMeuCarroApi
import com.TFSoftware.lavemeucarro.app.managers.AuthManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class RegisterViewModel @Inject constructor(
    private val authManager: AuthManager,
    private val api: LavaMeuCarroApi
) : ViewModel() {

    private val _uiState = MutableStateFlow(RegisterUiState())
    val uiState: StateFlow<RegisterUiState> = _uiState

    fun loadLegalDocuments() {
        viewModelScope.launch {
            try {
                val docs = api.getLegalDocuments("registration")
                _uiState.update { it.copy(legalDocuments = docs, legalLoading = false) }
            } catch (_: Exception) {
                _uiState.update { it.copy(legalLoading = false) }
            }
        }
    }

    fun requestVerification(email: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                authManager.requestEmailVerification(email)
                _uiState.update { it.copy(isLoading = false, showVerifyModal = true) }
            } catch (e: Exception) {
                // If email verification endpoint doesn't exist, proceed directly
                _uiState.update { it.copy(isLoading = false, showVerifyModal = true, verifyError = null) }
            }
        }
    }

    fun setVerifyCode(code: String) {
        _uiState.update { it.copy(verifyCode = code, verifyError = null) }
    }

    fun hideVerifyModal() {
        _uiState.update { it.copy(showVerifyModal = false, verifyCode = "", verifyError = null) }
    }

    fun confirmRegistration(request: RegisterRequest) {
        viewModelScope.launch {
            _uiState.update { it.copy(verifyLoading = true, verifyError = null) }
            val result = authManager.register(
                request.copy(verificationCode = _uiState.value.verifyCode.trim())
            )
            result.fold(
                onSuccess = {
                    _uiState.update { it.copy(verifyLoading = false, isRegistered = true) }
                },
                onFailure = { e ->
                    val message = when {
                        e.message?.contains("verificação", ignoreCase = true) == true ->
                            "Código inválido ou expirado"
                        e.message?.contains("already", ignoreCase = true) == true ->
                            "Este e-mail já está cadastrado"
                        e.message?.contains("cpf", ignoreCase = true) == true ||
                        e.message?.contains("cnpj", ignoreCase = true) == true ->
                            "Já existe um usuário com este CPF/CNPJ"
                        else -> e.message ?: "Erro ao registrar. Tente novamente."
                    }
                    _uiState.update { it.copy(verifyLoading = false, verifyError = message) }
                }
            )
        }
    }
}
