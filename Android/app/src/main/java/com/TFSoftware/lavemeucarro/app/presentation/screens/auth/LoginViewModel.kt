package com.TFSoftware.lavemeucarro.app.presentation.screens.auth

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.TFSoftware.lavemeucarro.app.data.remote.AuthInterceptor
import com.TFSoftware.lavemeucarro.app.data.remote.LavaMeuCarroApi
import com.TFSoftware.lavemeucarro.app.data.models.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class LoginUiState(
    val isLoading: Boolean = false,
    val isLoggedIn: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val api: LavaMeuCarroApi,
    private val dataStore: DataStore<Preferences>
) : ViewModel() {

    // Expose API for AuthHelpModal
    val getApi: LavaMeuCarroApi = api

    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState: StateFlow<LoginUiState> = _uiState

    private val _rememberedEmail = MutableStateFlow<String?>(null)
    val rememberedEmail: StateFlow<String?> = _rememberedEmail

    init {
        viewModelScope.launch {
            val prefs = dataStore.data.first()
            _rememberedEmail.value = prefs[stringPreferencesKey("remembered_email")]
        }
    }

    fun login(email: String, password: String) {
        if (email.isBlank() || password.isBlank()) {
            _uiState.update { it.copy(error = "Preencha todos os campos") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val response = api.login(LoginRequest(email, password))
                dataStore.edit { prefs ->
                    prefs[stringPreferencesKey("access_token")] = response.token
                    prefs[stringPreferencesKey("refresh_token")] = response.refreshToken
                    prefs[stringPreferencesKey("remembered_email")] = email
                }
                _uiState.update { it.copy(isLoading = false, isLoggedIn = true) }
            } catch (e: Exception) {
                _uiState.update { it.copy(isLoading = false, error = "Email ou senha incorretos") }
            }
        }
    }

    fun tryAutoLogin() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val prefs = dataStore.data.first()
                val token = prefs[stringPreferencesKey("access_token")]
                if (!token.isNullOrEmpty()) {
                    // Try to get user info to validate token
                    api.getMe()
                    _uiState.update { it.copy(isLoading = false, isLoggedIn = true) }
                } else {
                    _uiState.update { it.copy(isLoading = false, error = "Nenhuma sessão encontrada") }
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(isLoading = false, error = "Sessão expirada. Faça login novamente.") }
            }
        }
    }

    fun getBiometricEnabled(): Flow<Boolean> {
        return dataStore.data.map { prefs ->
            prefs[booleanPreferencesKey("biometric_enabled")] ?: false
        }
    }

    // ==================== Reset Password ====================

    suspend fun requestPasswordReset(email: String): ForgotPasswordResponse {
        return api.requestPasswordReset(ForgotPasswordRequest(email))
    }

    suspend fun confirmPasswordReset(email: String, code: String, newPassword: String): ResetPasswordResponse {
        return api.confirmPasswordReset(ResetPasswordRequest(email, code, newPassword))
    }
}
