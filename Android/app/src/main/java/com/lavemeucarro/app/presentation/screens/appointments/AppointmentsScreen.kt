package com.lavemeucarro.app.presentation.screens.appointments

import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
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
import androidx.hilt.navigation.compose.hiltViewModel
import com.lavemeucarro.app.data.models.AgendamentoDto
import com.lavemeucarro.app.data.models.DashboardSummaryDTO
import com.lavemeucarro.app.data.models.UnidadeDto
import com.lavemeucarro.app.presentation.theme.AppColors
import com.lavemeucarro.app.utils.DateFormatter
import java.util.Date

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppointmentsScreen(
    modifier: Modifier = Modifier,
    onNavigateToDetail: (String) -> Unit,
    viewModel: AppointmentsViewModel = hiltViewModel()
) {
    val appointments by viewModel.appointments.collectAsState()
    val isProfessional by viewModel.isProfessional.collectAsState()
    val myUnits by viewModel.myUnits.collectAsState()
    val selectedUnit by viewModel.selectedUnit.collectAsState()
    val dashboardSummary by viewModel.dashboardSummary.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    var selectedStatus by remember { mutableStateOf<String?>(null) }
    var selectedDateIndex by remember { mutableIntStateOf(0) }
    var showCancelled by remember { mutableStateOf(false) }
    var selectedAppointment by remember { mutableStateOf<AgendamentoDto?>(null) }
    var showDetailModal by remember { mutableStateOf(false) }

    val dates = remember { DateFormatter.getNext14Days() }
    val selectedDate = dates.getOrElse(selectedDateIndex) { dates.first() }
    val selectedDateStr = DateFormatter.formatIso(selectedDate)

    LaunchedEffect(isProfessional, selectedUnit, selectedDateStr) {
        if (isProfessional && selectedUnit != null) {
            viewModel.loadUnitAppointments(selectedUnit!!.id, selectedDateStr)
            viewModel.loadDashboardSummary(selectedUnit!!.id)
        } else {
            viewModel.loadMyAppointments()
        }
    }

    LaunchedEffect(Unit) {
        if (isProfessional && myUnits.isEmpty()) {
            viewModel.loadMyUnits()
        }
    }

    // Detail modal
    if (showDetailModal && selectedAppointment != null) {
        AppointmentDetailModal(
            appointment = selectedAppointment!!,
            isProfessional = isProfessional,
            onDismiss = { showDetailModal = false },
            onUpdateStatus = { status ->
                viewModel.updateStatus(selectedAppointment!!.id, status)
                showDetailModal = false
            },
            onNavigateToUnit = {
                showDetailModal = false
                onNavigateToDetail(selectedAppointment!!.unidadeId ?: "")
            }
        )
    }

    val filteredAppointments = appointments.filter { ag ->
        val statusMatch = selectedStatus == null || ag.status == selectedStatus
        val cancelledMatch = showCancelled || ag.status != "Cancelado"
        statusMatch && cancelledMatch
    }

    Column(modifier = modifier.fillMaxSize()) {
        // Header
        Surface(tonalElevation = 1.dp) {
            Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp)) {
                Text(
                    if (isProfessional) "Gerenciar Agendamentos" else "Meus Agendamentos",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )

                if (isProfessional) {
                    Spacer(modifier = Modifier.height(8.dp))

                    // Unit selector
                    if (myUnits.size > 1) {
                        var expanded by remember { mutableStateOf(false) }
                        ExposedDropdownMenuBox(
                            expanded = expanded,
                            onExpandedChange = { expanded = it }
                        ) {
                            OutlinedTextField(
                                value = selectedUnit?.nome ?: "Selecione uma unidade",
                                onValueChange = {},
                                readOnly = true,
                                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded) },
                                modifier = Modifier.menuAnchor().fillMaxWidth()
                            )
                            ExposedDropdownMenu(
                                expanded = expanded,
                                onDismissRequest = { expanded = false }
                            ) {
                                myUnits.forEach { unit ->
                                    DropdownMenuItem(
                                        text = { Text(unit.nome) },
                                        onClick = {
                                            viewModel.selectUnit(unit)
                                            expanded = false
                                        }
                                    )
                                }
                            }
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                    }

                    // Dashboard summary
                    dashboardSummary?.let { summary ->
                        Row(
                            modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            SummaryChip("Hoje", "${summary.totalToday}", AppColors.StatusConfirmed)
                            SummaryChip("Pendentes", "${summary.pendingToday}", AppColors.StatusPending)
                            SummaryChip("Confirmados", "${summary.confirmedToday}", AppColors.Success)
                            SummaryChip("Receita", "R$%.0f".format(summary.revenueToday), AppColors.Primary)
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                    }

                    // Date picker (14 days)
                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        items(dates.size) { index ->
                            val date = dates[index]
                            val isSelected = index == selectedDateIndex
                            DateChip(
                                date = date,
                                isSelected = isSelected,
                                onClick = { selectedDateIndex = index }
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))

                    // Show cancelled toggle
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("Mostrar cancelados", fontSize = 12.sp)
                        Spacer(modifier = Modifier.width(8.dp))
                        Switch(
                            checked = showCancelled,
                            onCheckedChange = { showCancelled = it },
                            modifier = Modifier.height(24.dp)
                        )
                    }
                } else {
                    // Client: status filter chips
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        item {
                            FilterChip(
                                selected = selectedStatus == null,
                                onClick = { selectedStatus = null },
                                label = { Text("Todos") }
                            )
                        }
                        listOf("Pendente", "Confirmado", "Finalizado", "Cancelado").forEach { status ->
                            item {
                                FilterChip(
                                    selected = selectedStatus == status,
                                    onClick = { selectedStatus = if (selectedStatus == status) null else status },
                                    label = { Text(status) }
                                )
                            }
                        }
                    }
                }
            }
        }

        // Appointments list
        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        } else if (filteredAppointments.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        Icons.Default.EventBusy, null,
                        modifier = Modifier.size(64.dp),
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text("Nenhum agendamento", style = MaterialTheme.typography.titleMedium)
                    Text(
                        if (selectedStatus != null) "com status '$selectedStatus'" else "encontrado",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        } else {
            LazyColumn(
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(filteredAppointments) { ag ->
                    AppointmentCard(
                        appointment = ag,
                        isProfessional = isProfessional,
                        onClick = {
                            selectedAppointment = ag
                            showDetailModal = true
                        },
                        onQuickAction = { status -> viewModel.updateStatus(ag.id, status) }
                    )
                }
            }
        }
    }
}

@Composable
fun AppointmentCard(
    appointment: AgendamentoDto,
    isProfessional: Boolean,
    onClick: () -> Unit,
    onQuickAction: (String) -> Unit
) {
    val statusColor = when (appointment.status) {
        "Pendente" -> AppColors.StatusPending
        "Confirmado" -> AppColors.StatusConfirmed
        "EmExecucao" -> AppColors.StatusInProgress
        "Pronto" -> AppColors.Primary
        "Finalizado" -> AppColors.StatusCompleted
        "Cancelado" -> AppColors.StatusCancelled
        "NaoCompareceu" -> AppColors.StatusNoShow
        else -> MaterialTheme.colorScheme.onSurfaceVariant
    }

    Card(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
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
                        if (isProfessional) appointment.clienteNome ?: "Cliente"
                        else appointment.servicoNome ?: "Serviço",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        if (isProfessional) appointment.servicoNome ?: ""
                        else appointment.unidadeNome ?: "",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Surface(
                    color = statusColor.copy(alpha = 0.1f),
                    shape = MaterialTheme.shapes.small
                ) {
                    Text(
                        appointment.status,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        style = MaterialTheme.typography.labelSmall,
                        color = statusColor,
                        fontWeight = FontWeight.Medium
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Schedule, null, modifier = Modifier.size(14.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        "${appointment.data ?: ""} ${appointment.hora ?: ""}",
                        style = MaterialTheme.typography.bodySmall
                    )
                }
                (appointment.totalPrice ?: appointment.preco)?.let {
                    Text(
                        "R$ %.2f".format(it),
                        style = MaterialTheme.typography.bodySmall,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
            }

            // Quick actions for professional
            if (isProfessional && appointment.status == "Pendente") {
                Spacer(modifier = Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(
                        onClick = { onQuickAction("Confirmado") },
                        modifier = Modifier.weight(1f),
                        contentPadding = PaddingValues(vertical = 4.dp)
                    ) {
                        Icon(Icons.Default.Check, null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Confirmar", fontSize = 12.sp)
                    }
                    OutlinedButton(
                        onClick = { onQuickAction("Cancelado") },
                        modifier = Modifier.weight(1f),
                        contentPadding = PaddingValues(vertical = 4.dp),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = AppColors.StatusCancelled)
                    ) {
                        Icon(Icons.Default.Close, null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Recusar", fontSize = 12.sp)
                    }
                }
            }
            if (isProfessional && appointment.status == "Confirmado") {
                Spacer(modifier = Modifier.height(8.dp))
                Button(
                    onClick = { onQuickAction("Finalizado") },
                    modifier = Modifier.fillMaxWidth(),
                    contentPadding = PaddingValues(vertical = 4.dp)
                ) {
                    Icon(Icons.Default.CheckCircle, null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Finalizar", fontSize = 12.sp)
                }
            }
        }
    }
}

@Composable
fun DateChip(date: Date, isSelected: Boolean, onClick: () -> Unit) {
    val dayName = DateFormatter.getDayName(date)
    val dayMonth = DateFormatter.getDayMonth(date)

    FilterChip(
        selected = isSelected,
        onClick = onClick,
        label = {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(dayName.take(3), fontSize = 10.sp)
                Text(dayMonth, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
        },
        modifier = Modifier.height(56.dp)
    )
}

@Composable
fun SummaryChip(label: String, value: String, color: androidx.compose.ui.graphics.Color) {
    Surface(
        color = color.copy(alpha = 0.1f),
        shape = MaterialTheme.shapes.small
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(value, fontWeight = FontWeight.Bold, color = color, fontSize = 14.sp)
            Text(label, fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
fun AppointmentDetailModal(
    appointment: AgendamentoDto,
    isProfessional: Boolean,
    onDismiss: () -> Unit,
    onUpdateStatus: (String) -> Unit,
    onNavigateToUnit: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                if (isProfessional) appointment.clienteNome ?: "Cliente"
                else appointment.servicoNome ?: "Serviço"
            )
        },
        text = {
            Column {
                DetailRow("Serviço", appointment.servicoNome)
                DetailRow("Unidade", appointment.unidadeNome)
                DetailRow("Data/Hora", "${appointment.data} ${appointment.hora}")
                DetailRow("Status", appointment.status)
                DetailRow("Preço", appointment.totalPrice?.let { "R$ %.2f".format(it) } ?: appointment.preco?.let { "R$ %.2f".format(it) })
                DetailRow("Funcionário", appointment.funcionarioNome)
                DetailRow("Veículo", appointment.veiculoPlaca)
                DetailRow("Observações", appointment.observacoes)

                if (isProfessional) {
                    DetailRow("Telefone Cliente", appointment.clientPhone)
                    DetailRow("Cidade Cliente", appointment.clientCity)
                }

                Spacer(modifier = Modifier.height(12.dp))
                TextButton(onClick = onNavigateToUnit) {
                    Icon(Icons.Default.Store, null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Ver unidade")
                }
            }
        },
        confirmButton = {
            when (appointment.status) {
                "Pendente" -> {
                    Row {
                        TextButton(onClick = { onUpdateStatus("Cancelado") }) {
                            Text("Cancelar", color = AppColors.StatusCancelled)
                        }
                        Spacer(modifier = Modifier.weight(1f))
                        Button(onClick = { onUpdateStatus("Confirmado") }) { Text("Confirmar") }
                    }
                }
                "Confirmado" -> {
                    Row {
                        TextButton(onClick = { onUpdateStatus("Cancelado") }) {
                            Text("Cancelar", color = AppColors.StatusCancelled)
                        }
                        Spacer(modifier = Modifier.weight(1f))
                        Button(onClick = { onUpdateStatus("Finalizado") }) { Text("Finalizar") }
                    }
                }
                else -> {
                    TextButton(onClick = onDismiss) { Text("Fechar") }
                }
            }
        }
    )
}

@Composable
fun DetailRow(label: String, value: String?) {
    if (value != null) {
        Row(modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp)) {
            Text("$label: ", style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text(value, style = MaterialTheme.typography.bodySmall)
        }
    }
}
