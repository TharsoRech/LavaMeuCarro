package com.lavemeucarro.app.presentation.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lavemeucarro.app.data.models.AgendamentoDto
import com.lavemeucarro.app.data.models.CreateReviewRequest
import com.lavemeucarro.app.data.models.UnidadeDto
import com.lavemeucarro.app.presentation.theme.AppColors

// ==================== Status Helpers ====================
fun getStatusColor(status: String): androidx.compose.ui.graphics.Color = when (status.lowercase()) {
    "confirmado", "confirmed" -> AppColors.StatusConfirmed
    "pendente", "pending" -> AppColors.StatusPending
    "em andamento", "in_progress" -> AppColors.StatusInProgress
    "concluído", "concluido", "completed" -> AppColors.StatusCompleted
    "cancelado", "cancelled" -> AppColors.StatusCancelled
    "não compareceu", "no_show", "noshow" -> AppColors.StatusNoShow
    else -> AppColors.OnSurfaceVariant
}

fun getStatusLabel(status: String): String = when (status.lowercase()) {
    "confirmado", "confirmed" -> "Confirmado"
    "pendente", "pending" -> "Pendente"
    "em andamento", "in_progress" -> "Em Andamento"
    "concluído", "concluido", "completed" -> "Concluído"
    "cancelado", "cancelled" -> "Cancelado"
    "não compareceu", "no_show", "noshow" -> "Não Compareceu"
    else -> status.replaceFirstChar { it.uppercase() }
}

// ==================== AppointmentCard ====================
@Composable
fun AppointmentCard(
    appointment: AgendamentoDto,
    onClick: (() -> Unit)? = null,
    onConfirm: (() -> Unit)? = null,
    onComplete: (() -> Unit)? = null,
    onCancel: (() -> Unit)? = null,
    onReview: (() -> Unit)? = null
) {
    val statusColor = getStatusColor(appointment.status)

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        appointment.servicoNome ?: "Serviço",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        appointment.unidadeNome ?: "",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                Surface(
                    color = statusColor.copy(alpha = 0.15f),
                    shape = MaterialTheme.shapes.small
                ) {
                    Text(
                        getStatusLabel(appointment.status),
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        style = MaterialTheme.typography.labelSmall,
                        color = statusColor,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Date/time row
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.CalendarToday, null, modifier = Modifier.size(14.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    "${appointment.data ?: ""} ${appointment.hora ?: ""}".trim(),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                if (appointment.preco != null) {
                    Spacer(modifier = Modifier.width(16.dp))
                    Icon(Icons.Default.AttachMoney, null, modifier = Modifier.size(14.dp), tint = AppColors.Success)
                    Spacer(modifier = Modifier.width(2.dp))
                    Text(
                        "R$ %.2f".format(appointment.preco),
                        style = MaterialTheme.typography.bodySmall,
                        fontWeight = FontWeight.Bold,
                        color = AppColors.Success
                    )
                }
            }

            // Client name (for professional view)
            appointment.clienteNome?.let {
                Spacer(modifier = Modifier.height(2.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Person, null, modifier = Modifier.size(14.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }

            // Funcionario name (for client view)
            appointment.funcionarioNome?.let {
                Spacer(modifier = Modifier.height(2.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Badge, null, modifier = Modifier.size(14.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }

            // Action buttons
            val hasActions = onConfirm != null || onComplete != null || onCancel != null || onReview != null
            if (hasActions) {
                Spacer(modifier = Modifier.height(8.dp))
                HorizontalDivider()
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    onReview?.let {
                        TextButton(onClick = it) {
                            Icon(Icons.Default.Star, null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Avaliar")
                        }
                    }
                    onCancel?.let {
                        TextButton(onClick = it) {
                            Text("Cancelar", color = MaterialTheme.colorScheme.error)
                        }
                    }
                    onConfirm?.let {
                        Button(onClick = it, modifier = Modifier.padding(start = 8.dp)) {
                            Text("Confirmar")
                        }
                    }
                    onComplete?.let {
                        Button(onClick = it, modifier = Modifier.padding(start = 8.dp)) {
                            Text("Finalizar")
                        }
                    }
                }
            }
        }
    }
}

// ==================== AppointmentDetailModal ====================
@Composable
fun AppointmentDetailModal(
    appointment: AgendamentoDto,
    onDismiss: () -> Unit,
    onConfirm: (() -> Unit)? = null,
    onComplete: (() -> Unit)? = null,
    onCancel: (() -> Unit)? = null,
    onNavigateToUnidade: (() -> Unit)? = null
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Detalhes do Agendamento") },
        text = {
            Column {
                // Status badge
                Surface(
                    color = getStatusColor(appointment.status).copy(alpha = 0.15f),
                    shape = MaterialTheme.shapes.small
                ) {
                    Text(
                        getStatusLabel(appointment.status),
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
                        fontWeight = FontWeight.Bold,
                        color = getStatusColor(appointment.status)
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Details
                DetailRow(Icons.Default.CalendarToday, "Data", "${appointment.data ?: "-"} às ${appointment.hora ?: "-"}")
                DetailRow(Icons.Default.RoomService, "Serviço", appointment.servicoNome ?: "-")
                DetailRow(Icons.Default.Store, "Unidade", appointment.unidadeNome ?: "-")
                appointment.funcionarioNome?.let { DetailRow(Icons.Default.Badge, "Profissional", it) }
                appointment.clienteNome?.let { DetailRow(Icons.Default.Person, "Cliente", it) }
                appointment.clientPhone?.let { DetailRow(Icons.Default.Phone, "Telefone", it) }
                appointment.preco?.let { DetailRow(Icons.Default.AttachMoney, "Preço", "R$ %.2f".format(it)) }
                appointment.veiculoPlaca?.let { DetailRow(Icons.Default.DirectionsCar, "Veículo", it) }
                appointment.observacoes?.let { DetailRow(Icons.Default.Notes, "Observações", it) }
                appointment.cancellationReason?.let { DetailRow(Icons.Default.Cancel, "Motivo cancelamento", it) }

                if (onNavigateToUnidade != null) {
                    Spacer(modifier = Modifier.height(8.dp))
                    TextButton(onClick = onNavigateToUnidade) {
                        Icon(Icons.Default.OpenInNew, null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Ver unidade")
                    }
                }
            }
        },
        confirmButton = {
            Row {
                onCancel?.let {
                    Button(
                        onClick = it,
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                    ) { Text("Cancelar") }
                }
                onConfirm?.let {
                    Button(onClick = it, modifier = Modifier.padding(start = 8.dp)) { Text("Confirmar") }
                }
                onComplete?.let {
                    Button(onClick = it, modifier = Modifier.padding(start = 8.dp)) { Text("Finalizar") }
                }
                if (onConfirm == null && onComplete == null && onCancel == null) {
                    TextButton(onClick = onDismiss) { Text("Fechar") }
                }
            }
        }
    )
}

@Composable
private fun DetailRow(icon: androidx.compose.ui.graphics.vector.ImageVector, label: String, value: String) {
    Spacer(modifier = Modifier.height(4.dp))
    Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(icon, null, modifier = Modifier.size(16.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(modifier = Modifier.width(8.dp))
        Column {
            Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text(value, style = MaterialTheme.typography.bodyMedium)
        }
    }
}

// ==================== AppointmentFeedbackModal ====================
@Composable
fun AppointmentFeedbackModal(
    appointment: AgendamentoDto,
    onDismiss: () -> Unit,
    onSubmit: (Int, String?) -> Unit
) {
    var rating by remember { mutableStateOf(0) }
    var comment by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Avaliar Serviço") },
        text = {
            Column {
                Text(
                    "Como foi seu atendimento em \"${appointment.servicoNome ?: ""}\"?",
                    style = MaterialTheme.typography.bodyMedium
                )
                Spacer(modifier = Modifier.height(16.dp))

                // Star rating
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.Center
                ) {
                    (1..5).forEach { star ->
                        IconButton(onClick = { rating = star }) {
                            Icon(
                                if (star <= rating) Icons.Default.Star else Icons.Default.StarBorder,
                                null,
                                modifier = Modifier.size(36.dp),
                                tint = if (star <= rating) AppColors.Warning else MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = comment,
                    onValueChange = { comment = it },
                    label = { Text("Comentário (opcional)") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 3
                )
            }
        },
        confirmButton = {
            Button(
                onClick = { if (rating > 0) onSubmit(rating, comment.ifBlank { null }) },
                enabled = rating > 0
            ) { Text("Enviar Avaliação") }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancelar") }
        }
    )
}

// ==================== CustomAlertDialog ====================
@Composable
fun CustomAlertDialog(
    title: String,
    message: String,
    confirmText: String = "OK",
    dismissText: String? = null,
    isDestructive: Boolean = false,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(title) },
        text = { Text(message) },
        confirmButton = {
            Button(
                onClick = onConfirm,
                colors = if (isDestructive) ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                else ButtonDefaults.buttonColors()
            ) { Text(confirmText) }
        },
        dismissButton = {
            dismissText?.let {
                TextButton(onClick = onDismiss) { Text(it) }
            }
        }
    )
}

// ==================== LoadingSkeleton ====================
@Composable
fun LoadingSkeleton(
    modifier: Modifier = Modifier,
    lines: Int = 3
) {
    Column(modifier = modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        repeat(lines) { index ->
            Surface(
                modifier = Modifier
                    .fillMaxWidth(if (index == lines - 1) 0.6f else 1f)
                    .height(16.dp),
                color = MaterialTheme.colorScheme.surfaceVariant,
                shape = MaterialTheme.shapes.small
            ) {}
        }
    }
}
