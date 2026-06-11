package com.lavemeucarro.app.presentation.screens.profile

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.graphics.BitmapFactory
import android.util.Base64
import androidx.compose.foundation.Image
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.lavemeucarro.app.data.models.SupportContactDto
import com.lavemeucarro.app.managers.AuthManager
import com.lavemeucarro.app.managers.BiometricHelper
import com.lavemeucarro.app.presentation.theme.AppColors
import com.lavemeucarro.app.utils.WhatsAppHelper

private val ADMIN_PANEL_URL = "https://lavemeucarro.com/admin"

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    modifier: Modifier = Modifier,
    onNavigateToEditProfile: () -> Unit,
    onNavigateToVehicles: () -> Unit,
    onNavigateToNotifications: () -> Unit,
    onNavigateToLegal: () -> Unit,
    onNavigateToSubscription: () -> Unit,
    onLogout: () -> Unit,
    viewModel: ProfileViewModel = hiltViewModel()
) {
    val user by viewModel.user.collectAsState()
    val isProfessional by viewModel.isProfessional.collectAsState()
    val biometricEnabled by viewModel.biometricEnabled.collectAsState()
    val subscription by viewModel.subscription.collectAsState()
    val legalDocuments by viewModel.legalDocuments.collectAsState()
    val context = LocalContext.current

    val biometricHelper = remember { BiometricHelper(context) }
    val biometricAvailable = remember { biometricHelper.isBiometricAvailable() }

    var showChangePassword by remember { mutableStateOf(false) }
    var showDeleteConfirm by remember { mutableStateOf(false) }
    var showPrivacyModal by remember { mutableStateOf(false) }
    var showSupportModal by remember { mutableStateOf(false) }
    var showLegalDocModal by remember { mutableStateOf(false) }
    var selectedLegalDoc by remember { mutableStateOf<com.lavemeucarro.app.data.models.LegalDocumentDto?>(null) }
    var supportContact by remember { mutableStateOf<SupportContactDto?>(null) }
    var supportSubject by remember { mutableStateOf("") }
    var supportMessage by remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        viewModel.loadSupportContact()
        viewModel.loadBiometricState()
        viewModel.loadLegalDocuments()
        if (isProfessional) {
            viewModel.loadSubscription()
        }
        supportContact = viewModel.supportContact.value
    }

    // Change password modal
    if (showChangePassword) {
        ChangePasswordModal(
            onDismiss = { showChangePassword = false },
            onChange = { current, newPass ->
                viewModel.changePassword(current, newPass)
                showChangePassword = false
            }
        )
    }

    // Delete account confirmation
    if (showDeleteConfirm) {
        AlertDialog(
            onDismissRequest = { showDeleteConfirm = false },
            title = { Text("Excluir Conta") },
            text = { Text("Esta ação é permanente e apagará todos os seus dados. Deseja continuar?") },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.deleteAccount()
                        showDeleteConfirm = false
                        onLogout()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                ) { Text("Excluir permanentemente") }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteConfirm = false }) { Text("Cancelar") }
            }
        )
    }

    // Privacy/LGPD modal
    if (showPrivacyModal) {
        AlertDialog(
            onDismissRequest = { showPrivacyModal = false },
            title = { Text("Privacidade e Segurança") },
            text = {
                Column {
                    Text(
                        "Em conformidade com a LGPD (Lei 13.709/2018), você tem total controle sobre seus dados.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(bottom = 12.dp)
                    )
                    ListItem(
                        headlineContent = { Text("Exportar meus dados") },
                        supportingContent = { Text("Baixe todos os seus dados em formato JSON") },
                        leadingContent = { Icon(Icons.Default.Download, null, tint = Color(0xFF0284C7)) },
                        modifier = Modifier.clickable {
                            viewModel.exportData(context)
                            showPrivacyModal = false
                        }
                    )
                    legalDocuments.forEach { doc ->
                        ListItem(
                            headlineContent = { Text(doc.title) },
                            supportingContent = { Text("Versão ${doc.version}") },
                            leadingContent = { Icon(Icons.Default.Description, null, tint = Color(0xFF16A34A)) },
                            trailingContent = { Icon(Icons.Default.ChevronRight, null, tint = MaterialTheme.colorScheme.onSurfaceVariant) },
                            modifier = Modifier.clickable {
                                selectedLegalDoc = doc
                                showPrivacyModal = false
                                showLegalDocModal = true
                            }
                        )
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showPrivacyModal = false }) { Text("Fechar") }
            }
        )
    }

    // Legal document reader modal
    if (showLegalDocModal && selectedLegalDoc != null) {
        AlertDialog(
            onDismissRequest = { showLegalDocModal = false },
            title = {
                Column {
                    Text(selectedLegalDoc!!.title, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    Text("Versão ${selectedLegalDoc!!.version}", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            },
            text = {
                Column(modifier = Modifier.verticalScroll(rememberScrollState())) {
                    Text(
                        selectedLegalDoc!!.content,
                        style = MaterialTheme.typography.bodySmall,
                        lineHeight = 20.sp
                    )
                }
            },
            confirmButton = {
                TextButton(onClick = { showLegalDocModal = false }) { Text("Fechar") }
            }
        )
    }

    // Support modal
    if (showSupportModal) {
        AlertDialog(
            onDismissRequest = { showSupportModal = false },
            title = { Text("Suporte") },
            text = {
                Column {
                    Text(
                        "Preencha os campos abaixo para abrir uma conversa com o suporte no WhatsApp.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    OutlinedTextField(
                        value = supportSubject,
                        onValueChange = { supportSubject = it },
                        label = { Text("Assunto") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text("Ex: Problema com pagamento") }
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = supportMessage,
                        onValueChange = { supportMessage = it },
                        label = { Text("Mensagem") },
                        minLines = 3,
                        maxLines = 5,
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text("Descreva o problema com o máximo de detalhes") }
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    val canSend = supportSubject.isNotBlank() && supportMessage.isNotBlank() && !supportContact?.whatsapp.isNullOrBlank()
                    Button(
                        onClick = {
                            val text = "Assunto: ${supportSubject}\n\n${supportMessage}"
                            WhatsAppHelper.openWhatsApp(context, supportContact?.whatsapp, message = text)
                            showSupportModal = false
                        },
                        enabled = canSend,
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (canSend) Color(0xFFE8F5E9) else MaterialTheme.colorScheme.surfaceVariant,
                            contentColor = if (canSend) Color(0xFF1B5E20) else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    ) {
                        Text("Chamar no WhatsApp")
                    }
                }
            },
            confirmButton = {}
        )
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
    ) {
        // Profile header
        Surface(tonalElevation = 1.dp) {
            Column(
                modifier = Modifier.fillMaxWidth().padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Try to show actual user photo
                val photoBitmap = remember(user?.base64Image) {
                    user?.base64Image?.let { b64 ->
                        try {
                            val bytes = Base64.decode(b64, Base64.DEFAULT)
                            BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
                        } catch (_: Exception) { null }
                    }
                }
                if (photoBitmap != null) {
                    Image(
                        bitmap = photoBitmap.asImageBitmap(),
                        contentDescription = "Foto de perfil",
                        modifier = Modifier
                            .size(80.dp)
                            .clip(CircleShape),
                        contentScale = ContentScale.Crop
                    )
                } else {
                    Surface(
                        modifier = Modifier.size(80.dp),
                        shape = CircleShape,
                        color = MaterialTheme.colorScheme.primaryContainer
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Text(
                                text = user?.nome?.firstOrNull()?.uppercase() ?: "?",
                                style = MaterialTheme.typography.headlineLarge,
                                color = MaterialTheme.colorScheme.onPrimaryContainer
                            )
                        }
                    }
                }
                Spacer(modifier = Modifier.height(12.dp))
                Text(user?.nome ?: "Usuário", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                Text(user?.email ?: "", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                if (isProfessional) {
                    Spacer(modifier = Modifier.height(4.dp))
                    Surface(
                        color = MaterialTheme.colorScheme.primaryContainer,
                        shape = MaterialTheme.shapes.small
                    ) {
                        Text(
                            "Profissional",
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onPrimaryContainer,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Menu items
        val menuItems = buildList {
            add(MenuItem(Icons.Default.Edit, "Editar Perfil", "Alterar nome, telefone, foto", onClick = onNavigateToEditProfile))
            add(MenuItem(Icons.Default.DirectionsCar, "Meus Veículos", "Gerenciar veículos", onClick = onNavigateToVehicles))
            add(MenuItem(Icons.Default.Notifications, "Notificações", "Ver todas as notificações", onClick = onNavigateToNotifications))

            // Subscription (professional only)
            if (isProfessional) {
                val subLabel = subscription?.let {
                    if (it.status == "active") "PLANO ${it.planoName?.uppercase() ?: "ATIVO"}"
                    else "Nenhum Plano Ativo"
                } ?: "Gerenciar plano"
                add(MenuItem(Icons.Default.CardMembership, "Minha Assinatura", subLabel, onClick = onNavigateToSubscription))
            }

            // Admin panel (professional only)
            if (isProfessional) {
                add(MenuItem(Icons.Default.Web, "Painel Administrativo", "Acessar painel web", onClick = {
                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(ADMIN_PANEL_URL))
                    context.startActivity(intent)
                }))
            }

            add(MenuItem(Icons.Default.PrivacyTip, "Privacidade e LGPD", "Exportar dados, documentos legais", onClick = { showPrivacyModal = true }))
            add(MenuItem(Icons.Default.Lock, "Alterar Senha", "Atualizar sua senha", onClick = { showChangePassword = true }))

            // Biometric toggle
            add(MenuItem(Icons.Default.Fingerprint, "Login por biometria",
                if (biometricAvailable) "Use biometria para entrar automaticamente."
                else "Biometria não disponível neste aparelho.",
                isToggle = true,
                toggleValue = biometricEnabled,
                toggleEnabled = biometricAvailable || biometricEnabled,
                onToggle = { viewModel.toggleBiometric(it) },
                onClick = {}
            ))

            // Support with modal
            add(MenuItem(Icons.Default.SupportAgent, "Suporte", "Falar com suporte via WhatsApp", onClick = {
                showSupportModal = true
                viewModel.loadSupportContact()
                supportContact = viewModel.supportContact.value
            }))
        }

        menuItems.forEach { item ->
            if (item.isToggle) {
                ListItem(
                    headlineContent = { Text(item.title) },
                    supportingContent = { Text(item.subtitle, fontSize = 12.sp, maxLines = 2, overflow = TextOverflow.Ellipsis) },
                    leadingContent = { Icon(item.icon, null, tint = MaterialTheme.colorScheme.primary) },
                    trailingContent = {
                        Switch(
                            checked = item.toggleValue,
                            onCheckedChange = item.onToggle,
                            enabled = item.toggleEnabled
                        )
                    }
                )
            } else {
                ListItem(
                    headlineContent = { Text(item.title) },
                    supportingContent = { Text(item.subtitle, fontSize = 12.sp) },
                    leadingContent = { Icon(item.icon, null, tint = MaterialTheme.colorScheme.primary) },
                    trailingContent = { Icon(Icons.Default.ChevronRight, null, tint = MaterialTheme.colorScheme.onSurfaceVariant) },
                    modifier = Modifier.clickable(onClick = item.onClick)
                )
            }
            HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp))
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Logout
        Button(
            onClick = onLogout,
            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error),
            modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp)
        ) {
            Icon(Icons.Default.Logout, null)
            Spacer(modifier = Modifier.width(8.dp))
            Text("Sair")
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Delete account
        TextButton(
            onClick = { showDeleteConfirm = true },
            modifier = Modifier.align(Alignment.CenterHorizontally)
        ) {
            Text("Excluir minha conta", color = MaterialTheme.colorScheme.error, fontSize = 12.sp)
        }

        // App version
        Text(
            "Lava Meu Carro",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.align(Alignment.CenterHorizontally)
        )
        Text(
            "v1.0.0",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier.align(Alignment.CenterHorizontally).padding(bottom = 24.dp)
        )
    }
}

data class MenuItem(
    val icon: androidx.compose.ui.graphics.vector.ImageVector,
    val title: String,
    val subtitle: String,
    val isToggle: Boolean = false,
    val toggleValue: Boolean = false,
    val toggleEnabled: Boolean = true,
    val onToggle: (Boolean) -> Unit = {},
    val onClick: () -> Unit
)

@Composable
fun ChangePasswordModal(
    onDismiss: () -> Unit,
    onChange: (String, String) -> Unit
) {
    var currentPassword by remember { mutableStateOf("") }
    var newPassword by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Alterar Senha") },
        text = {
            Column {
                OutlinedTextField(
                    value = currentPassword,
                    onValueChange = { currentPassword = it },
                    label = { Text("Senha atual") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = newPassword,
                    onValueChange = { newPassword = it },
                    label = { Text("Nova senha") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = confirmPassword,
                    onValueChange = { confirmPassword = it },
                    label = { Text("Confirmar nova senha") },
                    singleLine = true,
                    isError = confirmPassword.isNotEmpty() && confirmPassword != newPassword,
                    modifier = Modifier.fillMaxWidth()
                )
                error?.let {
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(it, color = MaterialTheme.colorScheme.error, fontSize = 12.sp)
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    when {
                        currentPassword.isEmpty() -> error = "Informe a senha atual"
                        newPassword.length < 6 -> error = "Nova senha deve ter pelo menos 6 caracteres"
                        newPassword != confirmPassword -> error = "As senhas não coincidem"
                        else -> onChange(currentPassword, newPassword)
                    }
                }
            ) { Text("Alterar") }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancelar") }
        }
    )
}
