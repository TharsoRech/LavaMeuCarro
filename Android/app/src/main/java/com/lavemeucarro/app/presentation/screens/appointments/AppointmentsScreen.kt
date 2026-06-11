package com.lavemeucarro.app.presentation.screens.appointments

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.lavemeucarro.app.data.models.AgendamentoDto
import com.lavemeucarro.app.data.models.UnidadeDto
import com.lavemeucarro.app.presentation.theme.AppColors
import com.lavemeucarro.app.utils.DateFormatter
import java.util.Date

private val ADMIN_PANEL_URL = "https://lavemeucarro.com/admin"

@OptIn(ExperimentalMaterial3Api::class, ExperimentalFoundationApi::class)
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
    val isRefreshing by viewModel.isRefreshing.collectAsState()
    val pendingDaysMap by viewModel.pendingDaysMap.collectAsState()
    val readyToFinalizeDaysMap by viewModel.readyToFinalizeDaysMap.collectAsState()
    val isBatchProcessing by viewModel.isBatchProcessing.collectAsState()
    val context = LocalContext.current

    // Sub-tab state: "unidade" or "pessoal"
    var activeSubTab by remember { mutableStateOf(if (isProfessional) "unidade" else "pessoal") }
    var selectedStatus by remember { mutableStateOf<String?>(null) }
    var selectedDateIndex by remember { mutableIntStateOf(0) }
    var showCancelled by remember { mutableStateOf(false) }
    var selectedAppointment by remember { mutableStateOf<AgendamentoDto?>(null) }
    var showDetailModal by remember { mutableStateOf(false) }

    // Filters modal state
    var showFiltersModal by remember { mutableStateOf(false) }
    var searchQuery by remember { mutableStateOf("") }
    var unitStatusFilter by remember { mutableStateOf("Todos") }
    var selectedProfessionalFilter by remember { mutableStateOf("all") }

    // Batch selection state
    var isSelectionMode by remember { mutableStateOf(false) }
    var selectedAppointmentIds by remember { mutableStateOf<Set<String>>(emptySet()) }

    // Date picker modal
    var showDatePickerModal by remember { mutableStateOf(false) }

    val dates = remember { DateFormatter.getNext14Days() }
    val selectedDate = dates.getOrElse(selectedDateIndex) { dates.first() }
    val selectedDateStr = DateFormatter.formatIso(selectedDate)

    // Load data based on active tab
    LaunchedEffect(isProfessional, selectedUnit, selectedDateStr, activeSubTab, showCancelled) {
        if (isProfessional && activeSubTab == "unidade" && selectedUnit != null) {
            viewModel.loadUnitAppointments(selectedUnit!!.id, selectedDateStr)
            viewModel.loadDashboardSummary(selectedUnit!!.id)
        } else if (activeSubTab == "pessoal" || !isProfessional) {
            viewModel.loadMyAppointments()
        }
    }

    LaunchedEffect(Unit) {
        if (isProfessional && myUnits.isEmpty()) {
            viewModel.loadMyUnits()
        }
    }

    // Load pending days for date chip indicators
    LaunchedEffect(isProfessional, selectedUnit, activeSubTab) {
        if (isProfessional && activeSubTab == "unidade" && selectedUnit != null) {
            viewModel.loadPendingDays(dates, selectedUnit!!.id)
        }
    }

    // Reset filters on tab/unit change
    LaunchedEffect(activeSubTab, selectedUnit?.id) {
        isSelectionMode = false
        selectedAppointmentIds = emptySet()
        searchQuery = ""
        unitStatusFilter = "Todos"
        selectedProfessionalFilter = "all"
    }

    // Force client to pessoal tab
    LaunchedEffect(isProfessional) {
        if (!isProfessional && activeSubTab == "unidade") {
            activeSubTab = "pessoal"
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

    // Filters modal
    if (showFiltersModal) {
        val availableProfessionals = remember(appointments) {
            appointments.mapNotNull { it.funcionarioId?.let { id -> id to (it.funcionarioNome ?: "Profissional") } }.distinctBy { it.first }
        }
        FiltersModal(
            searchQuery = searchQuery,
            onSearchQueryChange = { searchQuery = it },
            unitStatusFilter = unitStatusFilter,
            onUnitStatusFilterChange = { unitStatusFilter = it; if (it == "Cancelado" && !showCancelled) showCancelled = true },
            selectedProfessionalFilter = selectedProfessionalFilter,
            onProfessionalFilterChange = { selectedProfessionalFilter = it },
            availableProfessionals = availableProfessionals,
            onDismiss = { showFiltersModal = false },
            onClear = {
                searchQuery = ""
                unitStatusFilter = "Todos"
                selectedProfessionalFilter = "all"
                showCancelled = false
            }
        )
    }

    // Filter appointments
    val filteredAppointments = remember(appointments, searchQuery, unitStatusFilter, selectedProfessionalFilter) {
        appointments.filter { ag ->
            val matchesStatus = unitStatusFilter == "Todos" || ag.status == unitStatusFilter
            val matchesProfessional = selectedProfessionalFilter == "all" || ag.funcionarioId == selectedProfessionalFilter
            val matchesSearch = searchQuery.isBlank() || listOfNotNull(
                ag.clienteNome, ag.servicoNome, ag.funcionarioNome, ag.hora
            ).joinToString(" ").lowercase().contains(searchQuery.lowercase())
            val matchesCancelled = showCancelled || ag.status != "Cancelado"
            matchesStatus && matchesProfessional && matchesSearch && matchesCancelled
        }
    }

    // For pessoal tab, also filter by selectedStatus
    val pessoalAppointments = remember(filteredAppointments, selectedStatus) {
        if (activeSubTab == "pessoal" || !isProfessional) {
            if (selectedStatus != null) filteredAppointments.filter { it.status == selectedStatus }
            else filteredAppointments
        } else emptyList()
    }

    // Timeline slots
    val timeSlots = remember {
        buildList {
            for (hour in 7..23) {
                add("${hour.toString().padStart(2, '0')}:00")
                add("${hour.toString().padStart(2, '0')}:30")
            }
            add("00:00")
        }
    }

    // Selection helpers
    val selectedPendingCount = remember(selectedAppointmentIds, filteredAppointments) {
        filteredAppointments.count { selectedAppointmentIds.contains(it.id) && it.status == "Pendente" }
    }
    val selectedReadyToFinalizeCount = remember(selectedAppointmentIds, filteredAppointments) {
        filteredAppointments.count { selectedAppointmentIds.contains(it.id) && AppointmentsViewModel.canBeMarkedAsCompleted(it) }
    }
    val activeFiltersCount = remember(searchQuery, unitStatusFilter, selectedProfessionalFilter) {
        var c = 0
        if (searchQuery.isNotBlank()) c++
        if (unitStatusFilter != "Todos") c++
        if (selectedProfessionalFilter != "all") c++
        c
    }

    Column(modifier = modifier.fillMaxSize()) {
        // Header
        Surface(tonalElevation = 1.dp) {
            Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)) {
                // Title row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            "Agendamentos",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold
                        )
                        if (isRefreshing) {
                            Spacer(modifier = Modifier.width(8.dp))
                            CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                        }
                    }
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        if (isProfessional && activeSubTab == "unidade") {
                            // Filters button
                            Box {
                                IconButton(onClick = { showFiltersModal = true }) {
                                    Icon(Icons.Default.FilterList, "Filtros", tint = AppColors.Primary)
                                }
                                if (activeFiltersCount > 0) {
                                    Surface(
                                        modifier = Modifier.size(18.dp).align(Alignment.TopEnd),
                                        shape = CircleShape,
                                        color = AppColors.Primary
                                    ) {
                                        Box(contentAlignment = Alignment.Center) {
                                            Text(
                                                "$activeFiltersCount",
                                                fontSize = 9.sp,
                                                color = Color.White,
                                                fontWeight = FontWeight.Bold
                                            )
                                        }
                                    }
                                }
                            }
                        }
                        // Admin panel link
                        if (isProfessional) {
                            TextButton(
                                onClick = {
                                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(ADMIN_PANEL_URL))
                                    context.startActivity(intent)
                                }
                            ) {
                                Icon(Icons.Default.OpenInNew, null, modifier = Modifier.size(14.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Painel web", fontSize = 11.sp)
                            }
                        }
                    }
                }

                // Sub-tabs for professionals
                if (isProfessional) {
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(0.dp)
                    ) {
                        SubTabButton("Unidade", activeSubTab == "unidade", onClick = { activeSubTab = "unidade" }, modifier = Modifier.weight(1f))
                        SubTabButton("Pessoal", activeSubTab == "pessoal", onClick = { activeSubTab = "pessoal" }, modifier = Modifier.weight(1f))
                    }
                }
            }
        }

        // Batch action bar
        if (isProfessional && isSelectionMode) {
            Surface(
                color = MaterialTheme.colorScheme.primaryContainer,
                tonalElevation = 2.dp
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Text(
                        "${selectedAppointmentIds.size} selecionado(s)",
                        fontWeight = FontWeight.Bold,
                        style = MaterialTheme.typography.titleSmall
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedButton(
                            onClick = {
                                val ids = filteredAppointments.filter { selectedAppointmentIds.contains(it.id) && it.status == "Pendente" }.map { it.id }
                                if (ids.isNotEmpty()) viewModel.batchUpdateStatus(ids, "Confirmado") { _, _ -> }
                            },
                            enabled = selectedPendingCount > 0 && !isBatchProcessing,
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("Confirmar ($selectedPendingCount)", fontSize = 12.sp)
                        }
                        OutlinedButton(
                            onClick = {
                                val ids = filteredAppointments.filter { selectedAppointmentIds.contains(it.id) && AppointmentsViewModel.canBeMarkedAsCompleted(it) }.map { it.id }
                                if (ids.isNotEmpty()) viewModel.batchUpdateStatus(ids, "Finalizado") { _, _ -> }
                            },
                            enabled = selectedReadyToFinalizeCount > 0 && !isBatchProcessing,
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("Finalizar ($selectedReadyToFinalizeCount)", fontSize = 12.sp)
                        }
                        TextButton(
                            onClick = { isSelectionMode = false; selectedAppointmentIds = emptySet() },
                            modifier = Modifier.weight(0.6f)
                        ) {
                            Text("Limpar", fontSize = 12.sp)
                        }
                    }
                }
            }
        }

        // Content based on active tab
        if (activeSubTab == "unidade" && isProfessional) {
            // === UNIDADE TAB ===
            Column {
                // Unit selector chips
                if (myUnits.size > 1) {
                    LazyRow(
                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 4.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(myUnits) { unit ->
                            UnitChip(
                                unit = unit,
                                isSelected = selectedUnit?.id == unit.id,
                                onClick = { viewModel.selectUnit(unit) }
                            )
                        }
                    }
                }

                // Dashboard summary
                dashboardSummary?.let { summary ->
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp).horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        SummaryChip("Hoje", "${summary.totalToday}", AppColors.StatusConfirmed)
                        SummaryChip("Pendentes", "${summary.pendentes}", AppColors.StatusPending)
                        SummaryChip("Confirmados", "${summary.confirmados}", AppColors.Success)
                        SummaryChip("Receita Mês", "R$%.0f".format(summary.faturamentoMes), AppColors.Primary)
                    }
                }

                // Date chips with P/F indicators
                Row(
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    LazyRow(
                        modifier = Modifier.weight(1f),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        items(dates.size) { index ->
                            val date = dates[index]
                            val dateStr = DateFormatter.formatIso(date)
                            val isSelected = index == selectedDateIndex
                            val pendingCount = pendingDaysMap[dateStr] ?: 0
                            val readyCount = readyToFinalizeDaysMap[dateStr] ?: 0
                            DateChipWithIndicators(
                                date = date,
                                isSelected = isSelected,
                                pendingCount = pendingCount,
                                readyCount = readyCount,
                                onClick = { selectedDateIndex = index }
                            )
                        }
                    }
                }

                // Show cancelled toggle
                Row(
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 2.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Mostrar cancelados", fontSize = 12.sp)
                    Spacer(modifier = Modifier.width(8.dp))
                    Switch(
                        checked = showCancelled,
                        onCheckedChange = { showCancelled = it },
                        modifier = Modifier.height(24.dp)
                    )
                    Spacer(modifier = Modifier.weight(1f))
                    // Refresh button
                    IconButton(onClick = { viewModel.silentRefresh() }, modifier = Modifier.size(32.dp)) {
                        Icon(Icons.Default.Refresh, "Atualizar", modifier = Modifier.size(18.dp))
                    }
                }

                // Timeline view
                if (isLoading && appointments.isEmpty()) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                } else {
                    LazyColumn(
                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                        verticalArrangement = Arrangement.spacedBy(2.dp)
                    ) {
                        items(timeSlots) { time ->
                            val apptsAtTime = filteredAppointments.filter { it.hora?.take(5) == time }
                            TimelineRow(
                                time = time,
                                appointments = apptsAtTime,
                                isProfessional = isProfessional,
                                isSelectionMode = isSelectionMode,
                                selectedAppointmentIds = selectedAppointmentIds,
                                onAppointmentClick = { ag ->
                                    if (isSelectionMode) {
                                        selectedAppointmentIds = if (selectedAppointmentIds.contains(ag.id)) {
                                            selectedAppointmentIds - ag.id
                                        } else {
                                            selectedAppointmentIds + ag.id
                                        }
                                        if (selectedAppointmentIds.isEmpty()) isSelectionMode = false
                                    } else {
                                        selectedAppointment = ag
                                        showDetailModal = true
                                    }
                                },
                                onAppointmentLongClick = { ag ->
                                    if (!isSelectionMode) isSelectionMode = true
                                    selectedAppointmentIds = if (selectedAppointmentIds.contains(ag.id)) {
                                        selectedAppointmentIds - ag.id
                                    } else {
                                        selectedAppointmentIds + ag.id
                                    }
                                    if (selectedAppointmentIds.isEmpty()) isSelectionMode = false
                                },
                                onQuickConfirm = { viewModel.updateStatus(it, "Confirmado") },
                                onQuickFinalize = { viewModel.updateStatus(it, "Finalizado") }
                            )
                        }
                    }
                }
            }
        } else {
            // === PESSOAL TAB (or client view) ===
            Column {
                // Status filter chips for pessoal tab
                if (activeSubTab == "pessoal" || !isProfessional) {
                    LazyRow(
                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
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

                // Appointments list
                if (isLoading && pessoalAppointments.isEmpty() && filteredAppointments.isEmpty()) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                } else if (pessoalAppointments.isEmpty() && filteredAppointments.isEmpty()) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(
                                Icons.Default.EventBusy, null,
                                modifier = Modifier.size(64.dp),
                                tint = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Text("Nenhum agendamento", style = MaterialTheme.typography.titleMedium)
                        }
                    }
                } else {
                    val displayList = if (activeSubTab == "pessoal" || !isProfessional) pessoalAppointments else filteredAppointments
                    LazyColumn(
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(displayList) { ag ->
                            AppointmentCard(
                                appointment = ag,
                                isProfessional = isProfessional && activeSubTab == "unidade",
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
    }
}

@Composable
fun SubTabButton(label: String, isSelected: Boolean, onClick: () -> Unit, modifier: Modifier = Modifier) {
    TextButton(
        onClick = onClick,
        modifier = modifier,
        colors = ButtonDefaults.textButtonColors(
            containerColor = if (isSelected) MaterialTheme.colorScheme.primaryContainer else Color.Transparent
        )
    ) {
        Text(
            label,
            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
            color = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
fun UnitChip(unit: UnidadeDto, isSelected: Boolean, onClick: () -> Unit) {
    FilterChip(
        selected = isSelected,
        onClick = onClick,
        label = {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(unit.nome, fontSize = 12.sp)
            }
        }
    )
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun TimelineRow(
    time: String,
    appointments: List<AgendamentoDto>,
    isProfessional: Boolean,
    isSelectionMode: Boolean,
    selectedAppointmentIds: Set<String>,
    onAppointmentClick: (AgendamentoDto) -> Unit,
    onAppointmentLongClick: (AgendamentoDto) -> Unit,
    onQuickConfirm: (String) -> Unit,
    onQuickFinalize: (String) -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp),
        verticalAlignment = Alignment.Top
    ) {
        // Time column
        Text(
            time,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.width(48.dp).padding(top = 8.dp)
        )

        // Events column
        Column(modifier = Modifier.weight(1f)) {
            if (appointments.isNotEmpty()) {
                appointments.forEach { ag ->
                    val statusColor = when (ag.status) {
                        "Pendente" -> AppColors.StatusPending
                        "Confirmado" -> AppColors.StatusConfirmed
                        "EmExecucao" -> AppColors.StatusInProgress
                        "Pronto" -> AppColors.Primary
                        "Finalizado" -> AppColors.StatusCompleted
                        "Cancelado" -> AppColors.StatusCancelled
                        "NaoCompareceu" -> AppColors.StatusNoShow
                        else -> MaterialTheme.colorScheme.onSurfaceVariant
                    }
                    val isPending = isProfessional && ag.status == "Pendente"
                    val isReadyToFinalize = isProfessional && AppointmentsViewModel.canBeMarkedAsCompleted(ag)
                    val isSelected = selectedAppointmentIds.contains(ag.id)

                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 2.dp)
                            .combinedClickable(
                                onClick = { onAppointmentClick(ag) },
                                onLongClick = { if (isProfessional) onAppointmentLongClick(ag) }
                            ),
                        colors = CardDefaults.cardColors(
                            containerColor = if (isSelected) MaterialTheme.colorScheme.primaryContainer
                            else if (ag.status == "Cancelado") MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                            else MaterialTheme.colorScheme.surface
                        )
                    ) {
                        Row(modifier = Modifier.padding(10.dp)) {
                            // Status indicator bar
                            Box(
                                modifier = Modifier
                                    .width(4.dp)
                                    .height(48.dp)
                                    .clip(MaterialTheme.shapes.extraSmall)
                                    .background(statusColor)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(
                                        ag.clienteNome ?: "Cliente",
                                        style = MaterialTheme.typography.bodySmall,
                                        fontWeight = FontWeight.Bold,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis,
                                        modifier = Modifier.weight(1f)
                                    )
                                    Surface(
                                        color = statusColor.copy(alpha = 0.1f),
                                        shape = MaterialTheme.shapes.extraSmall
                                    ) {
                                        Text(
                                            ag.status.uppercase(),
                                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                                            style = MaterialTheme.typography.labelSmall,
                                            color = statusColor,
                                            fontSize = 9.sp
                                        )
                                    }
                                }
                                Text(
                                    "${ag.servicoNome ?: ""}${ag.funcionarioNome?.let { " • $it" } ?: ""}",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )

                                // Quick action buttons
                                if (isPending) {
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                        Button(
                                            onClick = { onQuickConfirm(ag.id) },
                                            modifier = Modifier.height(28.dp),
                                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 0.dp),
                                            colors = ButtonDefaults.buttonColors(containerColor = AppColors.Success)
                                        ) {
                                            Icon(Icons.Default.Check, null, modifier = Modifier.size(12.dp))
                                            Spacer(modifier = Modifier.width(2.dp))
                                            Text("Confirmar", fontSize = 10.sp)
                                        }
                                    }
                                }
                                if (isReadyToFinalize) {
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Button(
                                        onClick = { onQuickFinalize(ag.id) },
                                        modifier = Modifier.height(28.dp),
                                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 0.dp),
                                        colors = ButtonDefaults.buttonColors(containerColor = AppColors.Primary)
                                    ) {
                                        Icon(Icons.Default.CheckCircle, null, modifier = Modifier.size(12.dp))
                                        Spacer(modifier = Modifier.width(2.dp))
                                        Text("Finalizar", fontSize = 10.sp)
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                // Empty slot line
                HorizontalDivider(
                    modifier = Modifier.padding(vertical = 12.dp),
                    color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.3f)
                )
            }
        }
    }
}

@Composable
fun DateChipWithIndicators(
    date: Date,
    isSelected: Boolean,
    pendingCount: Int,
    readyCount: Int,
    onClick: () -> Unit
) {
    val dayName = DateFormatter.getDayName(date)
    val dayMonth = DateFormatter.getDayMonth(date)

    FilterChip(
        selected = isSelected,
        onClick = onClick,
        label = {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(dayName.take(3), fontSize = 10.sp)
                Text(dayMonth, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                if (pendingCount > 0 || readyCount > 0) {
                    Spacer(modifier = Modifier.height(2.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(2.dp)) {
                        if (pendingCount > 0) {
                            Surface(
                                shape = CircleShape,
                                color = if (isSelected) Color.White.copy(alpha = 0.3f) else AppColors.StatusPending.copy(alpha = 0.2f),
                                modifier = Modifier.size(16.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Text(
                                        "P",
                                        fontSize = 8.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (isSelected) Color.White else AppColors.StatusPending
                                    )
                                }
                            }
                        }
                        if (readyCount > 0) {
                            Surface(
                                shape = CircleShape,
                                color = if (isSelected) Color.White.copy(alpha = 0.3f) else AppColors.Success.copy(alpha = 0.2f),
                                modifier = Modifier.size(16.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Text(
                                        "F",
                                        fontSize = 8.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (isSelected) Color.White else AppColors.Success
                                    )
                                }
                            }
                        }
                    }
                }
            }
        },
        modifier = Modifier.height(64.dp)
    )
}

@Composable
fun FiltersModal(
    searchQuery: String,
    onSearchQueryChange: (String) -> Unit,
    unitStatusFilter: String,
    onUnitStatusFilterChange: (String) -> Unit,
    selectedProfessionalFilter: String,
    onProfessionalFilterChange: (String) -> Unit,
    availableProfessionals: List<Pair<String, String>>,
    onDismiss: () -> Unit,
    onClear: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Filtros da Agenda") },
        text = {
            Column(modifier = Modifier.verticalScroll(rememberScrollState())) {
                // Search
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = onSearchQueryChange,
                    label = { Text("Buscar cliente, serviço ou horário") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    leadingIcon = { Icon(Icons.Default.Search, null) }
                )

                Spacer(modifier = Modifier.height(12.dp))
                Text("Status", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.labelMedium)
                Spacer(modifier = Modifier.height(4.dp))

                // Status chips
                Row(
                    modifier = Modifier.horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    listOf("Todos", "Pendente", "Confirmado", "Finalizado", "Cancelado").forEach { status ->
                        FilterChip(
                            selected = unitStatusFilter == status,
                            onClick = { onUnitStatusFilterChange(status) },
                            label = { Text(status, fontSize = 11.sp) }
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))
                Text("Profissional", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.labelMedium)
                Spacer(modifier = Modifier.height(4.dp))

                // Professional chips
                Row(
                    modifier = Modifier.horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    FilterChip(
                        selected = selectedProfessionalFilter == "all",
                        onClick = { onProfessionalFilterChange("all") },
                        label = { Text("Todos", fontSize = 11.sp) }
                    )
                    availableProfessionals.forEach { (id, name) ->
                        FilterChip(
                            selected = selectedProfessionalFilter == id,
                            onClick = { onProfessionalFilterChange(id) },
                            label = { Text(name, fontSize = 11.sp, maxLines = 1) }
                        )
                    }
                }
            }
        },
        confirmButton = {
            Row {
                TextButton(onClick = onClear) { Text("Limpar") }
                Spacer(modifier = Modifier.weight(1f))
                Button(onClick = onDismiss) { Text("Aplicar") }
            }
        }
    )
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
            Column(modifier = Modifier.verticalScroll(rememberScrollState())) {
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
                    Row(modifier = Modifier.fillMaxWidth()) {
                        TextButton(onClick = { onUpdateStatus("Cancelado") }) {
                            Text("Cancelar", color = AppColors.StatusCancelled)
                        }
                        Spacer(modifier = Modifier.weight(1f))
                        Button(onClick = { onUpdateStatus("Confirmado") }) { Text("Confirmar") }
                    }
                }
                "Confirmado" -> {
                    Row(modifier = Modifier.fillMaxWidth()) {
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
