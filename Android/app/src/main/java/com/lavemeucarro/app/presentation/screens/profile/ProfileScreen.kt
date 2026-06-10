package com.lavemeucarro.app.presentation.screens.profile

import android.content.Context
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.lavemeucarro.app.data.models.SupportContactDto
import com.lavemeucarro.app.managers.AuthManager
import com.lavemeucarro.app.utils.WhatsAppHelper

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
    val context = LocalContext.current

    var showChangePassword by remember { mutableStateOf(false) }
    var showDeleteConfirm by remember { mutableStateOf(false) }
    var showPrivacyModal by remember { mutableStateOf(false) }
    var supportContact by remember { mutableStateOf<SupportContactDto?>(null) }

    LaunchedEffect(Unit) {
        viewModel.loadSupportContact()
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
            title = { Text("Privacidade e LGPD") },
            text = {
                Column {
                    ListItem(
                        headlineContent = { Text("Exportar meus dados") },
                        supportingContent = { Text("Baixe todos os seus dados em formato JSON") },
                        leadingContent = { Icon(Icons.Default.Download, null) },
                        modifier = Modifier.clickable {
                            viewModel.exportData(context)
                            showPrivacyModal = false
                        }
                    )
                    ListItem(
                        headlineContent = { Text("Documentos legais") },
                        supportingContent = { Text("Política de privacidade e termos de uso") },
                        leadingContent = { Icon(Icons.Default.Description, null) },
                        modifier = Modifier.clickable {
                            showPrivacyModal = false
                            onNavigateToLegal()
                        }
                    )
                }
            },
            confirmButton = {
                TextButton(onClick = { showPrivacyModal = false }) { Text("Fechar") }
            }
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
                Surface(
                    modifier = Modifier.size(80.dp),
                    shape = MaterialTheme.shapes.extraLarge,
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
            if (isProfessional) {
                add(MenuItem(Icons.Default.CardMembership, "Assinatura", "Gerenciar plano", onClick = onNavigateToSubscription))
            }
            add(MenuItem(Icons.Default.Lock, "Alterar Senha", "Atualizar sua senha", onClick = { showChangePassword = true }))
            add(MenuItem(Icons.Default.PrivacyTip, "Privacidade e LGPD", "Exportar dados, documentos legais", onClick = { showPrivacyModal = true }))
            add(MenuItem(Icons.Default.Support, "Suporte", "Falar com suporte via WhatsApp", onClick = {
                supportContact?.let { WhatsAppHelper.openWhatsApp(context, it.whatsapp, "Suporte LavaMeuCarro") }
            }))
        }

        menuItems.forEach { item ->
            ListItem(
                headlineContent = { Text(item.title) },
                supportingContent = { Text(item.subtitle, fontSize = 12.sp) },
                leadingContent = { Icon(item.icon, null, tint = MaterialTheme.colorScheme.primary) },
                trailingContent = { Icon(Icons.Default.ChevronRight, null, tint = MaterialTheme.colorScheme.onSurfaceVariant) },
                modifier = Modifier.clickable(onClick = item.onClick)
            )
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
            "Lava Meu Carro v1.0.0",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.align(Alignment.CenterHorizontally).padding(bottom = 24.dp)
        )
    }
}

data class MenuItem(
    val icon: androidx.compose.ui.graphics.vector.ImageVector,
    val title: String,
    val subtitle: String,
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
