package com.TFSoftware.lavemeucarro.app.presentation.screens.profile

import android.content.Context
import android.content.Intent
import androidx.core.content.FileProvider
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.TFSoftware.lavemeucarro.app.data.models.AssinaturaDto
import com.TFSoftware.lavemeucarro.app.data.models.LegalDocumentDto
import com.TFSoftware.lavemeucarro.app.data.models.SupportContactDto
import com.TFSoftware.lavemeucarro.app.data.models.UpdateProfileRequest
import com.TFSoftware.lavemeucarro.app.data.models.UserDto
import com.TFSoftware.lavemeucarro.app.data.remote.LavaMeuCarroApi
import com.TFSoftware.lavemeucarro.app.managers.AuthManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import java.io.File
import javax.inject.Inject

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val api: LavaMeuCarroApi,
    private val authManager: AuthManager
) : ViewModel() {

    val user: StateFlow<UserDto?> = authManager.currentUser
    val isProfessional: StateFlow<Boolean> = MutableStateFlow(authManager.isProfessional())

    private val _supportContact = MutableStateFlow<SupportContactDto?>(null)
    val supportContact: StateFlow<SupportContactDto?> = _supportContact

    private val _biometricEnabled = MutableStateFlow(false)
    val biometricEnabled: StateFlow<Boolean> = _biometricEnabled

    private val _subscription = MutableStateFlow<AssinaturaDto?>(null)
    val subscription: StateFlow<AssinaturaDto?> = _subscription

    private val _legalDocuments = MutableStateFlow<List<LegalDocumentDto>>(emptyList())
    val legalDocuments: StateFlow<List<LegalDocumentDto>> = _legalDocuments

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    private val _isActionLoading = MutableStateFlow(false)
    val isActionLoading: StateFlow<Boolean> = _isActionLoading

    fun loadProfileFromAPI() {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                // Reload user data from API to get latest updates
                authManager.refreshProfile()
            } catch (_: Exception) {
                // Silent fail for background refresh
            }
            _isLoading.value = false
        }
    }

    fun loadSupportContact() {
        viewModelScope.launch {
            try { _supportContact.value = api.getSupportContact() } catch (_: Exception) {}
        }
    }

    fun loadBiometricState() {
        viewModelScope.launch {
            authManager.getBiometricEnabled().collect { enabled ->
                _biometricEnabled.value = enabled
            }
        }
    }

    fun toggleBiometric(enabled: Boolean) {
        viewModelScope.launch {
            authManager.setBiometricEnabled(enabled)
            _biometricEnabled.value = enabled
        }
    }

    fun loadSubscription() {
        if (!authManager.isProfessional()) return
        viewModelScope.launch {
            try {
                // Try to get subscription info - using planos as proxy
                val planos = api.getPlanos()
                if (planos.isNotEmpty()) {
                    _subscription.value = AssinaturaDto(
                        id = "",
                        ownerId = user.value?.id ?: "",
                        planoId = planos.first().id,
                        status = "active",
                        planoName = planos.first().name
                    )
                }
            } catch (_: Exception) {}
        }
    }

    fun loadLegalDocuments() {
        viewModelScope.launch {
            try {
                _legalDocuments.value = api.getLegalDocuments()
            } catch (_: Exception) {}
        }
    }

    fun changePassword(currentPassword: String, newPassword: String) {
        viewModelScope.launch {
            authManager.changePassword(currentPassword, newPassword)
        }
    }

    fun deleteAccount() {
        viewModelScope.launch {
            authManager.deleteAccount()
        }
    }

    fun exportData(context: Context) {
        viewModelScope.launch {
            try {
                val data = api.exportMyData()
                val gson = com.google.gson.GsonBuilder().setPrettyPrinting().create()
                val json = gson.toJson(data)
                val file = File(context.cacheDir, "meus_dados_lavameucarro.json")
                file.writeText(json)
                val uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)
                val shareIntent = Intent(Intent.ACTION_SEND).apply {
                    type = "application/json"
                    putExtra(Intent.EXTRA_STREAM, uri)
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_GRANT_READ_URI_PERMISSION
                }
                context.startActivity(Intent.createChooser(shareIntent, "Exportar dados").apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                })
            } catch (_: Exception) {}
        }
    }

    // ==================== Formatting Utilities ====================

    fun formatCPF(cpf: String?): String {
        if (cpf.isNullOrBlank()) return ""
        val digits = cpf.replace("\\D".toRegex(), "")
        return when {
            digits.length >= 11 -> "${digits.substring(0, 3)}.${digits.substring(3, 6)}.${digits.substring(6, 9)}-${digits.substring(9, 11)}"
            digits.length > 9 -> "${digits.substring(0, 3)}.${digits.substring(3, 6)}.${digits.substring(6, 9)}-${digits.substring(9)}"
            digits.length > 6 -> "${digits.substring(0, 3)}.${digits.substring(3, 6)}.${digits.substring(6)}"
            digits.length > 3 -> "${digits.substring(0, 3)}.${digits.substring(3)}"
            else -> digits
        }
    }

    fun formatPhone(phone: String?): String {
        if (phone.isNullOrBlank()) return ""
        val digits = phone.replace("\\D".toRegex(), "")
        return when {
            digits.length >= 11 -> "(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7, 11)}"
            digits.length > 6 -> "(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7)}"
            digits.length > 2 -> "(${digits.substring(0, 2)}) ${digits.substring(2)}"
            else -> digits
        }
    }

    fun formatDOB(dob: String?): String {
        if (dob.isNullOrBlank()) return ""
        // If already in DD/MM/YYYY format, return as is
        if (dob.matches(Regex("\\d{2}/\\d{2}/\\d{4}"))) return dob
        // Convert from YYYY-MM-DD to DD/MM/YYYY
        val match = Regex("^(\\d{4})-(\\d{2})-(\\d{2})").find(dob)
        return if (match != null) {
            "${match.groupValues[3]}/${match.groupValues[2]}/${match.groupValues[1]}"
        } else {
            dob
        }
    }
}
