package com.TFSoftware.lavemeucarro.app.presentation.screens.auth

import android.content.Context
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.fragment.app.FragmentActivity
import androidx.hilt.navigation.compose.hiltViewModel
import com.TFSoftware.lavemeucarro.app.managers.AuthManager
import com.TFSoftware.lavemeucarro.app.managers.BiometricHelper
import com.TFSoftware.lavemeucarro.app.presentation.components.AuthHelpModal
import com.TFSoftware.lavemeucarro.app.presentation.theme.AppColors
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoginScreen(
    onLoginSuccess: () -> Unit,
    onNavigateToRegister: () -> Unit,
    viewModel: LoginViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val rememberedEmail by viewModel.rememberedEmail.collectAsState()

    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var showPassword by remember { mutableStateOf(false) }
    var biometricAvailable by remember { mutableStateOf(false) }
    var biometricEnabled by remember { mutableStateOf(false) }

    // Reset password modal state
    var showResetModal by remember { mutableStateOf(false) }
    var resetCode by remember { mutableStateOf("") }
    var resetNewPassword by remember { mutableStateOf("") }
    var resetCodeRequested by remember { mutableStateOf(false) }
    var resetCompleted by remember { mutableStateOf(false) }
    var resetFeedback by remember { mutableStateOf<String?>(null) }
    var resetLoading by remember { mutableStateOf(false) }
    var resetRequestLoading by remember { mutableStateOf(false) }

    // Auth help modal state
    var showHelpModal by remember { mutableStateOf(false) }

    val context = LocalContext.current
    val biometricHelper = remember { BiometricHelper(context) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        biometricAvailable = biometricHelper.isBiometricAvailable()
        biometricEnabled = viewModel.getBiometricEnabled().first()
    }

    // Auto-fill remembered email
    LaunchedEffect(rememberedEmail) {
        if (rememberedEmail != null && email.isEmpty()) {
            email = rememberedEmail!!
        }
    }

    // Auto-attempt biometric login
    LaunchedEffect(biometricAvailable, biometricEnabled) {
        val hasStoredSession = rememberedEmail != null
        if (hasStoredSession && biometricEnabled && biometricAvailable) {
            val activity = context as? FragmentActivity
            if (activity != null) {
                biometricHelper.authenticate(
                    activity = activity,
                    onSuccess = {
                        scope.launch {
                            viewModel.tryAutoLogin()
                        }
                    },
                    onError = { /* User can fall back to password */ }
                )
            }
        }
    }

    LaunchedEffect(uiState.isLoggedIn) {
        if (uiState.isLoggedIn) onLoginSuccess()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "Lava Meu Carro",
            style = MaterialTheme.typography.headlineLarge,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary
        )
        Text(
            text = "Agende seu serviço automotivo",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(bottom = 48.dp)
        )

        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("Email") },
            leadingIcon = { Icon(Icons.Default.Email, null) },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(16.dp))

        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Senha") },
            leadingIcon = { Icon(Icons.Default.Lock, null) },
            trailingIcon = {
                IconButton(onClick = { showPassword = !showPassword }) {
                    Icon(
                        if (showPassword) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                        null
                    )
                }
            },
            visualTransformation = if (showPassword) VisualTransformation.None else PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
        )

        if (uiState.error != null) {
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = uiState.error!!,
                color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodySmall,
                textAlign = TextAlign.Center
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Forgot password link
        TextButton(
            onClick = { showResetModal = true },
            modifier = Modifier.align(Alignment.End)
        ) {
            Text("Esqueci minha senha", fontSize = 12.sp)
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Biometric login button
        if (biometricAvailable && biometricEnabled) {
            OutlinedButton(
                onClick = {
                    val activity = context as? FragmentActivity
                    if (activity != null) {
                        biometricHelper.authenticate(
                            activity = activity,
                            onSuccess = {
                                scope.launch {
                                    viewModel.tryAutoLogin()
                                }
                            },
                            onError = { /* User can fall back to password */ }
                        )
                    }
                },
                modifier = Modifier.fillMaxWidth().height(48.dp)
            ) {
                Icon(Icons.Default.Fingerprint, null, modifier = Modifier.size(20.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text("Entrar com Biometria")
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                "ou",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(8.dp))
        }

        Button(
            onClick = { viewModel.login(email, password) },
            modifier = Modifier.fillMaxWidth().height(48.dp),
            enabled = !uiState.isLoading
        ) {
            if (uiState.isLoading) {
                CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
            } else {
                Text("Entrar")
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        TextButton(onClick = onNavigateToRegister) {
            Text("Ainda não tem conta? Cadastre-se")
        }

        TextButton(onClick = { /* Navigate to Welcome */ }) {
            Text("Ou volte para o início")
        }

        TextButton(onClick = { showHelpModal = true }) {
            Text("Precisa de ajuda? Fale com suporte")
        }
    }

    // ==================== Reset Password Modal ====================
    if (showResetModal) {
        AlertDialog(
            onDismissRequest = {
                showResetModal = false
                resetCode = ""
                resetNewPassword = ""
                resetCodeRequested = false
                resetCompleted = false
                resetFeedback = null
            },
            title = { Text("Redefinir senha") },
            text = {
                Column {
                    Text(
                        when {
                            !resetCodeRequested && !resetCompleted -> "Confirme seu e-mail para enviarmos o código de recuperação."
                            resetCompleted -> "Senha alterada com sucesso."
                            else -> "Digite o código enviado para $email e informe sua nova senha."
                        },
                        fontSize = 14.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    resetFeedback?.let { feedback ->
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            feedback,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = if (feedback.contains("sucesso", ignoreCase = true) || feedback.contains("enviado", ignoreCase = true))
                                AppColors.Success else MaterialTheme.colorScheme.error
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    if (!resetCodeRequested && !resetCompleted) {
                        Button(
                            onClick = {
                                if (email.isBlank()) {
                                    resetFeedback = "Digite seu e-mail para solicitar o código de recuperação."
                                    return@Button
                                }
                                scope.launch {
                                    resetRequestLoading = true
                                    resetFeedback = null
                                    try {
                                        val response = viewModel.requestPasswordReset(email.trim())
                                        if (response.sent) {
                                            resetCodeRequested = true
                                            resetFeedback = response.developmentCode
                                                ? "Código enviado. SMTP não configurado: ${response.developmentCode}"
                                                : "Código enviado para seu e-mail. Verifique caixa de entrada e spam."
                                        } else {
                                            resetFeedback = "Não encontramos uma conta com este e-mail."
                                        }
                                    } catch (e: Exception) {
                                        resetFeedback = "Não foi possível enviar o código agora. Tente novamente."
                                    }
                                    resetRequestLoading = false
                                }
                            },
                            modifier = Modifier.fillMaxWidth(),
                            enabled = !resetRequestLoading
                        ) {
                            if (resetRequestLoading) {
                                CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                            } else {
                                Text("Enviar código")
                            }
                        }
                    }

                    if (resetCodeRequested && !resetCompleted) {
                        OutlinedTextField(
                            value = resetCode,
                            onValueChange = { resetCode = it },
                            label = { Text("Código de recuperação") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth()
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        OutlinedTextField(
                            value = resetNewPassword,
                            onValueChange = { resetNewPassword = it },
                            label = { Text("Nova senha") },
                            visualTransformation = PasswordVisualTransformation(),
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth()
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        Button(
                            onClick = {
                                if (email.isBlank() || resetCode.trim().length < 6 || resetNewPassword.trim().length < 6) {
                                    resetFeedback = "Preencha e-mail, código e nova senha (min. 6 caracteres)."
                                    return@Button
                                }
                                scope.launch {
                                    resetLoading = true
                                    resetFeedback = null
                                    try {
                                        val response = viewModel.confirmPasswordReset(
                                            email.trim(),
                                            resetCode.trim(),
                                            resetNewPassword
                                        )
                                        if (response.reset) {
                                            resetCompleted = true
                                            resetCodeRequested = false
                                            resetCode = ""
                                            resetNewPassword = ""
                                            resetFeedback = if (response.notificationSent)
                                                "Senha redefinida com sucesso. Enviamos um e-mail confirmando essa alteração."
                                            else
                                                "Senha redefinida com sucesso. Agora você já pode entrar."
                                        } else {
                                            resetFeedback = "Não foi possível redefinir a senha."
                                        }
                                    } catch (e: Exception) {
                                        resetFeedback = e.message ?: "Não foi possível redefinir a senha."
                                    }
                                    resetLoading = false
                                }
                            },
                            modifier = Modifier.fillMaxWidth(),
                            enabled = !resetLoading
                        ) {
                            if (resetLoading) {
                                CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                            } else {
                                Text("Salvar nova senha")
                            }
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        TextButton(
                            onClick = {
                                scope.launch {
                                    resetRequestLoading = true
                                    try {
                                        val response = viewModel.requestPasswordReset(email.trim())
                                        if (response.sent) {
                                            resetFeedback = response.developmentCode
                                                ? "Código reenviado. SMTP não configurado: ${response.developmentCode}"
                                                : "Código reenviado para seu e-mail."
                                        }
                                    } catch (_: Exception) {
                                        resetFeedback = "Não foi possível reenviar o código."
                                    }
                                    resetRequestLoading = false
                                }
                            },
                            modifier = Modifier.align(Alignment.CenterHorizontally),
                            enabled = !resetRequestLoading && !resetLoading
                        ) {
                            Text("Reenviar código", fontSize = 12.sp)
                        }
                    }

                    if (resetCompleted) {
                        Button(
                            onClick = {
                                showResetModal = false
                                resetCode = ""
                                resetNewPassword = ""
                                resetCodeRequested = false
                                resetCompleted = false
                                resetFeedback = null
                            },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("Voltar ao login")
                        }
                    }
                }
            },
            confirmButton = {},
            dismissButton = {}
        )
    }

    // ==================== Auth Help Modal ====================
    AuthHelpModal(
        visible = showHelpModal,
        onClose = { showHelpModal = false },
        api = viewModel.getApi,
        contextLabel = "login"
    )
}
