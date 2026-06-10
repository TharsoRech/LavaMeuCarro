package com.lavemeucarro.app.presentation.screens.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.lavemeucarro.app.data.models.LegalDocumentDto
import com.lavemeucarro.app.data.models.RegisterRequest
import com.lavemeucarro.app.presentation.theme.AppColors
import com.lavemeucarro.app.utils.DateFormatter
import com.lavemeucarro.app.utils.DocumentValidator

data class RegisterUiState(
    val isLoading: Boolean = false,
    val isRegistered: Boolean = false,
    val error: String? = null,
    val legalDocuments: List<LegalDocumentDto> = emptyList(),
    val legalLoading: Boolean = true,
    val showVerifyModal: Boolean = false,
    val verifyCode: String = "",
    val verifyLoading: Boolean = false,
    val verifyError: String? = null
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RegisterScreen(
    onRegisterSuccess: () -> Unit,
    onBackToLogin: () -> Unit,
    viewModel: RegisterViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var doc by remember { mutableStateOf("") }
    var birthDate by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var showPassword by remember { mutableStateOf(false) }
    var isProfessional by remember { mutableStateOf(false) }
    var acceptedDocs by remember { mutableStateOf(setOf<String>()) }
    var selectedLegalDoc by remember { mutableStateOf<LegalDocumentDto?>(null) }

    // Validation
    val isNameValid = name.trim().length > 3
    val isEmailValid = android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()
    val isPhoneValid = phone.replace(Regex("[^0-9]"), "").length >= 10
    val docValidation = DocumentValidator.validateDocument(doc, isProfessional)
    val birthValidation = DateFormatter.validateBirthDate(birthDate)
    val passwordStrength = validatePasswordStrength(password)
    val allRequiredDocsAccepted = uiState.legalDocuments.filter { it.isRequired }
        .all { it.code in acceptedDocs }
    val isFormValid = isNameValid && isEmailValid && isPhoneValid &&
            docValidation.valid && birthValidation.valid &&
            password.length >= 6 && allRequiredDocsAccepted

    LaunchedEffect(uiState.isRegistered) {
        if (uiState.isRegistered) onRegisterSuccess()
    }

    LaunchedEffect(Unit) {
        viewModel.loadLegalDocuments()
    }

    // Verification modal
    if (uiState.showVerifyModal) {
        AlertDialog(
            onDismissRequest = { viewModel.hideVerifyModal() },
            title = { Text("Confirme seu e-mail") },
            text = {
                Column {
                    Text("Digite o código de 6 dígitos enviado para $email")
                    Spacer(modifier = Modifier.height(12.dp))
                    OutlinedTextField(
                        value = uiState.verifyCode,
                        onValueChange = { viewModel.setVerifyCode(it) },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    uiState.verifyError?.let {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(it, color = MaterialTheme.colorScheme.error, fontSize = 12.sp)
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.confirmRegistration(
                            RegisterRequest(
                                nome = name,
                                email = email.lowercase().trim(),
                                senha = password,
                                telefone = phone.replace(Regex("[^0-9]"), ""),
                                doc = doc.replace(Regex("[^0-9]"), ""),
                                dob = DateFormatter.formatToIso(birthDate),
                                role = if (isProfessional) "PROFISSIONAL" else "CLIENT"
                            )
                        )
                    },
                    enabled = uiState.verifyCode.length >= 6 && !uiState.verifyLoading
                ) {
                    if (uiState.verifyLoading) {
                        CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                    } else {
                        Text("Criar Conta")
                    }
                }
            },
            dismissButton = {
                TextButton(onClick = { viewModel.hideVerifyModal() }) { Text("Cancelar") }
            }
        )
    }

    // Legal document viewer modal
    selectedLegalDoc?.let { doc ->
        AlertDialog(
            onDismissRequest = { selectedLegalDoc = null },
            title = { Text(doc.title) },
            text = {
                Column {
                    Text("Versão ${doc.version}", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(modifier = Modifier.height(8.dp))
                    Box(modifier = Modifier.height(300.dp).verticalScroll(rememberScrollState())) {
                        Text(doc.content, fontSize = 14.sp)
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { selectedLegalDoc = null }) { Text("Fechar") }
            }
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Criar Conta") },
                navigationIcon = {
                    IconButton(onClick = onBackToLogin) {
                        Icon(Icons.Default.ArrowBack, "Voltar")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp, vertical = 8.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                "Preencha seus dados abaixo",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Role selection
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                RoleCard(
                    title = "Cliente",
                    icon = Icons.Default.Person,
                    selected = !isProfessional,
                    modifier = Modifier.weight(1f),
                    onClick = { isProfessional = false; doc = "" }
                )
                RoleCard(
                    title = "Profissional",
                    icon = Icons.Default.Business,
                    selected = isProfessional,
                    modifier = Modifier.weight(1f),
                    onClick = { isProfessional = true; doc = "" }
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Name
            OutlinedTextField(
                value = name,
                onValueChange = { name = it },
                label = { Text("Nome Completo") },
                singleLine = true,
                isError = name.isNotEmpty() && !isNameValid,
                supportingText = {
                    if (name.isNotEmpty()) {
                        Text(
                            if (isNameValid) "✓ Nome válido" else "Nome deve ter mais de 3 caracteres",
                            color = if (isNameValid) AppColors.Success else MaterialTheme.colorScheme.error
                        )
                    }
                },
                modifier = Modifier.fillMaxWidth()
            )

            // Email
            OutlinedTextField(
                value = email,
                onValueChange = { email = it },
                label = { Text("E-mail") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                singleLine = true,
                isError = email.isNotEmpty() && !isEmailValid,
                supportingText = {
                    if (email.isNotEmpty()) {
                        Text(
                            if (isEmailValid) "✓ E-mail válido" else "E-mail inválido",
                            color = if (isEmailValid) AppColors.Success else MaterialTheme.colorScheme.error
                        )
                    }
                },
                modifier = Modifier.fillMaxWidth()
            )

            // Phone
            OutlinedTextField(
                value = phone,
                onValueChange = { phone = it },
                label = { Text("Telefone") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                singleLine = true,
                isError = phone.isNotEmpty() && !isPhoneValid,
                supportingText = {
                    if (phone.isNotEmpty()) {
                        Text(
                            if (isPhoneValid) "✓ Telefone válido" else "Mínimo 10 dígitos",
                            color = if (isPhoneValid) AppColors.Success else MaterialTheme.colorScheme.error
                        )
                    }
                },
                modifier = Modifier.fillMaxWidth()
            )

            // Document (CPF/CNPJ)
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = doc,
                    onValueChange = { doc = DocumentValidator.formatDocument(it, isProfessional) },
                    label = { Text(if (isProfessional) "CPF/CNPJ" else "CPF") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    isError = doc.isNotEmpty() && !docValidation.valid,
                    supportingText = {
                        if (doc.isNotEmpty() && docValidation.message.isNotEmpty()) {
                            Text(
                                docValidation.message,
                                color = if (docValidation.valid) AppColors.Success else MaterialTheme.colorScheme.error
                            )
                        }
                    },
                    modifier = Modifier.weight(1.2f)
                )

                OutlinedTextField(
                    value = birthDate,
                    onValueChange = { birthDate = DateFormatter.formatDateInput(it) },
                    label = { Text("Nascimento") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    isError = birthDate.isNotEmpty() && !birthValidation.valid,
                    supportingText = {
                        if (birthDate.isNotEmpty()) {
                            Text(
                                birthValidation.message,
                                color = if (birthValidation.valid) AppColors.Success else MaterialTheme.colorScheme.error
                            )
                        }
                    },
                    modifier = Modifier.weight(1f)
                )
            }

            // Password
            OutlinedTextField(
                value = password,
                onValueChange = { password = it },
                label = { Text("Senha (min. 6 caracteres)") },
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
                supportingText = {
                    if (password.isNotEmpty()) {
                        Column {
                            // Password strength bar
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                repeat(4) { i ->
                                    Box(
                                        modifier = Modifier
                                            .weight(1f)
                                            .height(3.dp)
                                            .clip(RoundedCornerShape(2.dp))
                                            .background(
                                                if (i < passwordStrength.strength) {
                                                    if (passwordStrength.strength >= 3) AppColors.Success else AppColors.Warning
                                                } else Color(0xFFE0E0E0)
                                            )
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                passwordStrength.message,
                                color = if (password.length >= 6) AppColors.Success else MaterialTheme.colorScheme.error,
                                fontSize = 12.sp
                            )
                        }
                    }
                },
                modifier = Modifier.fillMaxWidth()
            )

            // Legal documents consent
            if (uiState.legalDocuments.isNotEmpty()) {
                Spacer(modifier = Modifier.height(16.dp))
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("Termos, privacidade e LGPD", fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.height(8.dp))

                        uiState.legalDocuments.forEach { legalDoc ->
                            val accepted = legalDoc.code in acceptedDocs
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 4.dp),
                                verticalAlignment = Alignment.Top
                            ) {
                                Checkbox(
                                    checked = accepted,
                                    onCheckedChange = {
                                        acceptedDocs = if (it) acceptedDocs + legalDoc.code
                                        else acceptedDocs - legalDoc.code
                                    },
                                    modifier = Modifier.heightIn(max = 24.dp)
                                )
                                Column(modifier = Modifier.padding(start = 4.dp)) {
                                    Text(
                                        if (legalDoc.code.uppercase() == "LGPD_CONSENT")
                                            "Li e concordo com o Consentimento LGPD para tratamento de dados pessoais."
                                        else "Li e aceito ${legalDoc.title}.",
                                        fontSize = 13.sp
                                    )
                                    Text(
                                        "Ler ${legalDoc.title.lowercase()} (v${legalDoc.version})",
                                        fontSize = 12.sp,
                                        color = MaterialTheme.colorScheme.primary,
                                        modifier = Modifier.clickable { selectedLegalDoc = legalDoc }
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // Error
            uiState.error?.let {
                Spacer(modifier = Modifier.height(8.dp))
                Text(it, color = MaterialTheme.colorScheme.error, textAlign = TextAlign.Center)
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Register button
            Button(
                onClick = {
                    viewModel.requestVerification(email.lowercase().trim())
                },
                modifier = Modifier.fillMaxWidth().height(48.dp),
                enabled = isFormValid && !uiState.isLoading
            ) {
                if (uiState.isLoading) {
                    CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                } else {
                    Text("Finalizar Cadastro")
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            TextButton(onClick = onBackToLogin) {
                Text("Já tem conta? Faça login")
            }

            Spacer(modifier = Modifier.height(32.dp))
        }
    }
}

@Composable
private fun RoleCard(
    title: String,
    icon: ImageVector,
    selected: Boolean,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Card(
        modifier = modifier
            .height(60.dp)
            .clickable(onClick = onClick),
        colors = CardDefaults.cardColors(
            containerColor = if (selected) MaterialTheme.colorScheme.primary
            else MaterialTheme.colorScheme.surfaceVariant
        ),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxSize().padding(8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            Icon(
                icon, null,
                tint = if (selected) MaterialTheme.colorScheme.onPrimary
                else MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                title,
                color = if (selected) MaterialTheme.colorScheme.onPrimary
                else MaterialTheme.colorScheme.onSurfaceVariant,
                fontWeight = FontWeight.Medium
            )
        }
    }
}

data class PasswordStrength(val strength: Int, val message: String)

fun validatePasswordStrength(password: String): PasswordStrength {
    if (password.isEmpty()) return PasswordStrength(0, "")
    var score = 0
    if (password.length >= 6) score++
    if (password.any { it.isUpperCase() }) score++
    if (password.any { it.isLowerCase() }) score++
    if (password.any { it.isDigit() }) score++
    val msg = when {
        password.length < 6 -> "Mínimo 6 caracteres"
        score >= 3 -> "Senha forte"
        score >= 2 -> "Senha média"
        else -> "Senha fraca"
    }
    return PasswordStrength(score, msg)
}
