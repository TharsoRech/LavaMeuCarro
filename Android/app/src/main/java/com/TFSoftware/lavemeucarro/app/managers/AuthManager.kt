package com.TFSoftware.lavemeucarro.app.managers

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import com.TFSoftware.lavemeucarro.app.data.models.AuthResponse
import com.TFSoftware.lavemeucarro.app.data.models.RegisterRequest
import com.TFSoftware.lavemeucarro.app.data.models.LoginRequest
import com.TFSoftware.lavemeucarro.app.data.models.UpdateProfileRequest
import com.TFSoftware.lavemeucarro.app.data.models.UserDto
import com.TFSoftware.lavemeucarro.app.data.remote.LavaMeuCarroApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.update
import javax.inject.Inject
import javax.inject.Singleton

enum class UserRole { CLIENT, PROFISSIONAL }

@Singleton
class AuthManager @Inject constructor(
    private val api: LavaMeuCarroApi,
    private val dataStore: DataStore<Preferences>
) {
    private val _currentUser = MutableStateFlow<UserDto?>(null)
    val currentUser: StateFlow<UserDto?> = _currentUser

    private val _isAuthenticated = MutableStateFlow(false)
    val isAuthenticated: StateFlow<Boolean> = _isAuthenticated

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    companion object {
        private val TOKEN_KEY = stringPreferencesKey("access_token")
        private val REFRESH_TOKEN_KEY = stringPreferencesKey("refresh_token")
        private val BIOMETRIC_ENABLED_KEY = booleanPreferencesKey("biometric_enabled")
        private val BIOMETRIC_PROMPTED_KEY = booleanPreferencesKey("biometric_prompted")
    }

    suspend fun tryAutoLogin(): Boolean {
        val prefs = dataStore.data.first()
        val token = prefs[TOKEN_KEY]
        if (!token.isNullOrEmpty()) {
            try {
                _isLoading.value = true
                val user = api.getMe()
                _currentUser.value = user
                _isAuthenticated.value = true
                return true
            } catch (_: Exception) {
                // Token expired, try refresh
                val refreshToken = prefs[REFRESH_TOKEN_KEY]
                if (!refreshToken.isNullOrEmpty()) {
                    try {
                        val response = api.refreshToken(
                            com.TFSoftware.lavemeucarro.app.data.models.RefreshRequest(refreshToken)
                        )
                        saveTokens(response.token, response.refreshToken)
                        _currentUser.value = response.user
                        _isAuthenticated.value = true
                        return true
                    } catch (_: Exception) {
                        logout()
                    }
                } else {
                    logout()
                }
            } finally {
                _isLoading.value = false
            }
        }
        return false
    }

    suspend fun login(email: String, password: String): Result<AuthResponse> {
        return try {
            _isLoading.value = true
            val response = api.login(LoginRequest(email, password))
            saveTokens(response.token, response.refreshToken)
            _currentUser.value = response.user
            _isAuthenticated.value = true
            Result.success(response)
        } catch (e: Exception) {
            Result.failure(e)
        } finally {
            _isLoading.value = false
        }
    }

    suspend fun register(request: RegisterRequest): Result<AuthResponse> {
        return try {
            _isLoading.value = true
            val response = api.register(request)
            saveTokens(response.token, response.refreshToken)
            _currentUser.value = response.user
            _isAuthenticated.value = true
            Result.success(response)
        } catch (e: Exception) {
            Result.failure(e)
        } finally {
            _isLoading.value = false
        }
    }

    suspend fun updateProfile(request: UpdateProfileRequest): Result<UserDto> {
        return try {
            val user = api.updateProfile(request)
            _currentUser.update { user }
            Result.success(user)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun refreshProfile() {
        try {
            val user = api.getMe()
            _currentUser.update { user }
        } catch (_: Exception) {
            // Silent fail for background refresh
        }
    }

    suspend fun changePassword(currentPassword: String, newPassword: String): Result<Unit> {
        return try {
            api.changePassword(
                com.TFSoftware.lavemeucarro.app.data.models.ChangePasswordRequest(currentPassword, newPassword)
            )
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun deleteAccount(): Result<Unit> {
        return try {
            api.deleteMyAccount()
            logout()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun logout() {
        try { api.logout() } catch (_: Exception) {}
        dataStore.edit { prefs ->
            prefs.remove(TOKEN_KEY)
            prefs.remove(REFRESH_TOKEN_KEY)
        }
        _currentUser.value = null
        _isAuthenticated.value = false
    }

    suspend fun requestEmailVerification(email: String): Result<Boolean> {
        return try {
            api.requestEmailVerification(
                com.TFSoftware.lavemeucarro.app.data.models.EmailVerificationRequest(email)
            )
            Result.success(true)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun getUserRole(): UserRole {
        val tipo = _currentUser.value?.tipo?.lowercase()
        return if (tipo == "professional" || tipo == "profissional") UserRole.PROFISSIONAL
        else UserRole.CLIENT
    }

    fun isProfessional(): Boolean = getUserRole() == UserRole.PROFISSIONAL

    // Biometric preferences
    fun getBiometricEnabled(): Flow<Boolean> = dataStore.data.map { it[BIOMETRIC_ENABLED_KEY] ?: false }
    fun getBiometricPrompted(): Flow<Boolean> = dataStore.data.map { it[BIOMETRIC_PROMPTED_KEY] ?: false }

    suspend fun setBiometricEnabled(enabled: Boolean) {
        dataStore.edit { it[BIOMETRIC_ENABLED_KEY] = enabled }
    }

    suspend fun setBiometricPrompted(prompted: Boolean) {
        dataStore.edit { it[BIOMETRIC_PROMPTED_KEY] = prompted }
    }

    private suspend fun saveTokens(token: String, refreshToken: String) {
        dataStore.edit { prefs ->
            prefs[TOKEN_KEY] = token
            prefs[REFRESH_TOKEN_KEY] = refreshToken
        }
    }
}
