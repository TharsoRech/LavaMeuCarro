package com.lavemeucarro.app.presentation.screens.profile

import android.content.Context
import android.content.Intent
import androidx.core.content.FileProvider
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.lavemeucarro.app.data.models.SupportContactDto
import com.lavemeucarro.app.data.models.UpdateProfileRequest
import com.lavemeucarro.app.data.models.UserDto
import com.lavemeucarro.app.data.remote.LavaMeuCarroApi
import com.lavemeucarro.app.managers.AuthManager
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

    fun loadSupportContact() {
        viewModelScope.launch {
            try { _supportContact.value = api.getSupportContact() } catch (_: Exception) {}
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
}
