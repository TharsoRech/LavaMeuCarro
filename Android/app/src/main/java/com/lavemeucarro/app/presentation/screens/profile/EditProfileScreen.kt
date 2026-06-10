package com.lavemeucarro.app.presentation.screens.profile

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.lavemeucarro.app.data.models.UpdateProfileRequest
import com.lavemeucarro.app.managers.AuthManager
import com.lavemeucarro.app.utils.DateFormatter
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EditProfileScreen(
    modifier: Modifier = Modifier,
    onBack: () -> Unit,
    viewModel: EditProfileViewModel = hiltViewModel()
) {
    val user by viewModel.user.collectAsState()
    val isSaving by viewModel.isSaving.collectAsState()
    val message by viewModel.message.collectAsState()

    var name by remember(user) { mutableStateOf(user?.nome ?: "") }
    var phone by remember(user) { mutableStateOf(user?.telefone ?: "") }
    var email by remember(user) { mutableStateOf(user?.email ?: "") }

    LaunchedEffect(message) {
        if (message != null) {
            onBack()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Editar Perfil") },
                navigationIcon = {
                    IconButton(onClick = onBack) { Icon(Icons.Default.Close, "Fechar") }
                },
                actions = {
                    TextButton(
                        onClick = {
                            viewModel.save(UpdateProfileRequest(name = name, phone = phone))
                        },
                        enabled = !isSaving
                    ) {
                        if (isSaving) CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                        else Text("Salvar", color = MaterialTheme.colorScheme.primary)
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            OutlinedTextField(
                value = name, onValueChange = { name = it },
                label = { Text("Nome Completo") }, singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )
            OutlinedTextField(
                value = email, onValueChange = { email = it },
                label = { Text("E-mail") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                singleLine = true, enabled = false,
                modifier = Modifier.fillMaxWidth()
            )
            OutlinedTextField(
                value = phone, onValueChange = { phone = it },
                label = { Text("Telefone") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )
            user?.doc?.let {
                OutlinedTextField(
                    value = it, onValueChange = {},
                    label = { Text("CPF/CNPJ") }, singleLine = true, enabled = false,
                    modifier = Modifier.fillMaxWidth()
                )
            }
            user?.dob?.let {
                OutlinedTextField(
                    value = DateFormatter.formatToDisplay(it), onValueChange = {},
                    label = { Text("Nascimento") }, singleLine = true, enabled = false,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }
    }
}

@HiltViewModel
class EditProfileViewModel @Inject constructor(
    private val authManager: AuthManager
) : ViewModel() {
    val user = authManager.currentUser
    private val _isSaving = MutableStateFlow(false)
    val isSaving: StateFlow<Boolean> = _isSaving
    private val _message = MutableStateFlow<String?>(null)
    val message: StateFlow<String?> = _message

    fun save(request: UpdateProfileRequest) {
        viewModelScope.launch {
            _isSaving.value = true
            val result = authManager.updateProfile(request)
            result.fold(
                onSuccess = { _message.value = "Perfil atualizado!" },
                onFailure = { _message.value = "Erro ao atualizar" }
            )
            _isSaving.value = false
        }
    }
}
