package com.TFSoftware.lavemeucarro.app.presentation.components

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.TFSoftware.lavemeucarro.app.data.remote.LavaMeuCarroApi
import kotlinx.coroutines.launch

enum class HelpChannel { WHATSAPP, EMAIL }

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AuthHelpModal(
    visible: Boolean,
    onClose: () -> Unit,
    api: LavaMeuCarroApi,
    contextLabel: String = "autenticacao"
) {
    if (!visible) return

    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var loadingContact by remember { mutableStateOf(false) }
    var sending by remember { mutableStateOf(false) }
    var channel by remember { mutableStateOf(HelpChannel.WHATSAPP) }
    var whatsAppDestination by remember { mutableStateOf("") }
    var emailDestination by remember { mutableStateOf("") }
    var message by remember { mutableStateOf("") }
    var feedback by remember { mutableStateOf<String?>(null) }

    val defaultMessage = when (contextLabel) {
        "cadastro" -> "Olá! Preciso de ajuda para concluir meu cadastro no Lava Meu Carro."
        "login" -> "Olá! Preciso de ajuda para entrar na minha conta no Lava Meu Carro."
        else -> "Olá! Preciso de ajuda com minha conta no Lava Meu Carro."
    }

    LaunchedEffect(visible) {
        if (visible) {
            loadingContact = true
            feedback = null
            message = defaultMessage
            channel = HelpChannel.WHATSAPP

            try {
                val contact = api.getSupportContact()
                whatsAppDestination = contact.whatsapp?.trim() ?: ""
                emailDestination = contact.email?.trim() ?: ""
            } catch (_: Exception) {
                // Use defaults if API fails
                whatsAppDestination = ""
                emailDestination = ""
            } finally {
                loadingContact = false
            }
        }
    }

    AlertDialog(
        onDismissRequest = onClose,
        title = {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Precisa de ajuda?", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                IconButton(onClick = onClose) {
                    Icon(Icons.Default.Close, "Fechar")
                }
            }
        },
        text = {
            Column {
                Text(
                    "Escolha um canal, ajuste o contato se precisar e envie sua mensagem.",
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Channel selector
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    FilterChip(
                        selected = channel == HelpChannel.WHATSAPP,
                        onClick = { channel = HelpChannel.WHATSAPP },
                        label = { Text("WhatsApp", fontWeight = FontWeight.Bold) },
                        modifier = Modifier.weight(1f)
                    )
                    FilterChip(
                        selected = channel == HelpChannel.EMAIL,
                        onClick = { channel = HelpChannel.EMAIL },
                        label = { Text("E-mail", fontWeight = FontWeight.Bold) },
                        modifier = Modifier.weight(1f)
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                if (loadingContact) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 20.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator()
                    }
                } else {
                    // Contact field
                    Text(
                        text = if (channel == HelpChannel.WHATSAPP) "Número WhatsApp" else "E-mail de suporte",
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 14.sp
                    )

                    Spacer(modifier = Modifier.height(6.dp))

                    OutlinedTextField(
                        value = if (channel == HelpChannel.WHATSAPP) whatsAppDestination else emailDestination,
                        onValueChange = {
                            if (channel == HelpChannel.WHATSAPP) {
                                whatsAppDestination = it
                            } else {
                                emailDestination = it
                            }
                        },
                        keyboardOptions = KeyboardOptions(
                            keyboardType = if (channel == HelpChannel.WHATSAPP) KeyboardType.Phone else KeyboardType.Email
                        ),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    // Message field
                    Text(
                        text = "Mensagem",
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 14.sp
                    )

                    Spacer(modifier = Modifier.height(6.dp))

                    OutlinedTextField(
                        value = message,
                        onValueChange = { message = it },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(120.dp),
                        minLines = 4
                    )
                }

                feedback?.let {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        it,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.error
                    )
                }
            }
        },
        confirmButton = {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedButton(
                    onClick = onClose,
                    modifier = Modifier.weight(1f),
                    enabled = !sending
                ) {
                    Text("Cancelar")
                }

                Button(
                    onClick = {
                        val trimmedMessage = message.trim()
                        if (trimmedMessage.isEmpty()) {
                            feedback = "Escreva uma mensagem para continuar."
                            return@Button
                        }

                        sending = true
                        feedback = null

                        try {
                            if (channel == HelpChannel.WHATSAPP) {
                                val phone = whatsAppDestination.replace("\\D".toRegex(), "")
                                if (phone.length < 10) {
                                    feedback = "Número de WhatsApp inválido."
                                    sending = false
                                    return@Button
                                }

                                // Open WhatsApp
                                val url = "https://wa.me/$phone?text=${Uri.encode(trimmedMessage)}"
                                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                                context.startActivity(intent)
                                onClose()
                            } else {
                                val email = emailDestination.trim()
                                val emailRegex = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"
                                if (!email.matches(emailRegex.toRegex())) {
                                    feedback = "Informe um e-mail válido para contato."
                                    sending = false
                                    return@Button
                                }

                                // Open email client
                                val intent = Intent(Intent.ACTION_SENDTO).apply {
                                    data = Uri.parse("mailto:")
                                    putExtra(Intent.EXTRA_EMAIL, arrayOf(email))
                                    putExtra(Intent.EXTRA_SUBJECT, "Suporte Lava Meu Carro")
                                    putExtra(Intent.EXTRA_TEXT, trimmedMessage)
                                }

                                if (intent.resolveActivity(context.packageManager) != null) {
                                    context.startActivity(intent)
                                    onClose()
                                } else {
                                    feedback = "Não foi possível abrir o app de e-mail neste dispositivo."
                                }
                            }
                        } catch (_: Exception) {
                            feedback = "Não foi possível abrir o canal de suporte agora."
                        } finally {
                            sending = false
                        }
                    },
                    modifier = Modifier.weight(1f),
                    enabled = !sending && !loadingContact
                ) {
                    if (sending) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(16.dp),
                            strokeWidth = 2.dp,
                            color = MaterialTheme.colorScheme.onPrimary
                        )
                    } else {
                        Text("Abrir suporte")
                    }
                }
            }
        },
        dismissButton = {}
    )
}
