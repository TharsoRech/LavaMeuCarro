package com.TFSoftware.lavemeucarro.app.presentation.screens.appointments

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.hilt.navigation.compose.hiltViewModel
import com.TFSoftware.lavemeucarro.app.data.models.AgendamentoDto
import com.TFSoftware.lavemeucarro.app.data.models.ClientAppointmentHistoryDTO
import com.TFSoftware.lavemeucarro.app.data.models.ClientAppointmentHistoryItemDTO
import com.TFSoftware.lavemeucarro.app.data.models.ProfessionalOptionDTO
import com.TFSoftware.lavemeucarro.app.data.models.UnidadeDto
import com.TFSoftware.lavemeucarro.app.presentation.theme.AppColors
import com.TFSoftware.lavemeucarro.app.utils.DateFormatter
import com.TFSoftware.lavemeucarro.app.utils.NewRelicLogger
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

    // Context switching state (following HoraDaBeleza pattern)
    var isContextSwitching by remember { mutableStateOf(false) }
    val CONTEXT_SWITCH_FALLBACK_MS = 75000L // 75 seconds fallback timer
    
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

    // Per-item loading states
    var processingAppointmentIds by remember { mutableStateOf<Set<String>>(emptySet()) }
    
    // Helper functions for per-item loading
    val onQuickConfirmWithLoading: (String) -> Unit = { appointmentId ->
        processingAppointmentIds += appointmentId
        onQuickConfirm(appointmentId)
        // Remove from processing after delay (API call will trigger refresh)
        kotlinx.coroutines.GlobalScope.launch(kotlinx.coroutines.Dispatchers.Main) {
            kotlinx.coroutines.delay(2000)
            processingAppointmentIds -= appointmentId
        }
    }
    
    val onQuickFinalizeWithLoading: (String) -> Unit = { appointmentId ->
        processingAppointmentIds += appointmentId
        onQuickFinalize(appointmentId)
        // Remove from processing after delay
        kotlinx.coroutines.GlobalScope.launch(kotlinx.coroutines.Dispatchers.Main) {
            kotlinx.coroutines.delay(2000)
            processingAppointmentIds -= appointmentId
        }
    }

    // Date picker modal
    var showDatePickerModal by remember { mutableStateOf(false) }

    val dates = remember { DateFormatter.getNext14Days() }
    val selectedDate = dates.getOrElse(selectedDateIndex) { dates.first() }
    val selectedDateStr = DateFormatter.formatIso(selectedDate)
    
    // Context switching fallback timer (prevent infinite loading)
    LaunchedEffect(isContextSwitching) {
        if (!isContextSwitching) return@LaunchedEffect
        
        kotlinx.coroutines.delay(CONTEXT_SWITCH_FALLBACK_MS)
        if (isContextSwitching) {
            // Fallback triggered - force stop context switching
            isContextSwitching = false
            NewRelicLogger.reportWarning(
                "Context switching fallback timer triggered to prevent visual lockup",
                "AppointmentsScreen.contextSwitchFallback",
                mapOf(
                    "timeoutMs" to CONTEXT_SWITCH_FALLBACK_MS,
                    "selectedUnitId" to selectedUnit?.id,
                    "activeTab" to activeSubTab,
                    "selectedDate" to selectedDateStr
                )
            )
        }
    }

    // Load data based on active tab
    LaunchedEffect(isProfessional, selectedUnit, selectedDateStr, activeSubTab, showCancelled) {
        isContextSwitching = true
        try {
            if (isProfessional && activeSubTab == "unidade" && selectedUnit != null) {
                viewModel.loadUnitAppointments(selectedUnit!!.id, selectedDateStr)
                viewModel.loadDashboardSummary(selectedUnit!!.id)
            } else if (activeSubTab == "pessoal" || !isProfessional) {
                viewModel.loadMyAppointments()
            }
        } finally {
            isContextSwitching = false
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
            viewModel = viewModel,
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

    Box(modifier = modifier.fillMaxSize()) {
        Column(modifier = Modifier.fillMaxSize()) {
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

        // Quick sync banner (following HoraDaBeleza isQuickActionSyncing pattern)
        if (isProfessional && (isBatchProcessing || processingAppointmentIds.isNotEmpty())) {
            Surface(
                color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.9f),
                tonalElevation = 1.dp
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(14.dp),
                        strokeWidth = 2.dp,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        "Sincronizando alterações...",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.Medium
                    )
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
                    PullToRefreshBox(
                        isRefreshing = isRefreshing,
                        onRefresh = { viewModel.silentRefresh() },
                        modifier = Modifier.fillMaxSize()
                    ) {
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
                    } // End PullToRefreshBox
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
                    PullToRefreshBox(
                        isRefreshing = isRefreshing,
                        onRefresh = { viewModel.silentRefresh() },
                        modifier = Modifier.fillMaxSize()
                    ) {
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
                    } // End PullToRefreshBox
                }
            }
        }
        
        // Context switching overlay (following HoraDaBeleza pattern)
        if (isContextSwitching) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.3f)),
                contentAlignment = Alignment.Center
            ) {
                Card(
                    modifier = Modifier.padding(32.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(
                        modifier = Modifier.padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(48.dp),
                            strokeWidth = 4.dp
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            "Carregando...",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
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
                                            onClick = { onQuickConfirmWithLoading(ag.id) },
                                            modifier = Modifier.height(28.dp),
                                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 0.dp),
                                            colors = ButtonDefaults.buttonColors(containerColor = AppColors.Success),
                                            enabled = !processingAppointmentIds.contains(ag.id)
                                        ) {
                                            if (processingAppointmentIds.contains(ag.id)) {
                                                CircularProgressIndicator(
                                                    modifier = Modifier.size(12.dp),
                                                    strokeWidth = 2.dp,
                                                    color = Color.White
                                                )
                                            } else {
                                                Icon(Icons.Default.Check, null, modifier = Modifier.size(12.dp))
                                                Spacer(modifier = Modifier.width(2.dp))
                                                Text("Confirmar", fontSize = 10.sp)
                                            }
                                        }
                                    }
                                }
                                if (isReadyToFinalize) {
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Button(
                                        onClick = { onQuickFinalizeWithLoading(ag.id) },
                                        modifier = Modifier.height(28.dp),
                                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 0.dp),
                                        colors = ButtonDefaults.buttonColors(containerColor = AppColors.Primary),
                                        enabled = !processingAppointmentIds.contains(ag.id)
                                    ) {
                                        if (processingAppointmentIds.contains(ag.id)) {
                                            CircularProgressIndicator(
                                                modifier = Modifier.size(12.dp),
                                                strokeWidth = 2.dp,
                                                color = Color.White
                                            )
                                        } else {
                                            Icon(Icons.Default.CheckCircle, null, modifier = Modifier.size(12.dp))
                                            Spacer(modifier = Modifier.width(2.dp))
                                            Text("Finalizar", fontSize = 10.sp)
                                        }
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

// ==================== FULL APPOINTMENT DETAIL MODAL ====================

@Composable
fun AppointmentDetailModal(
    appointment: AgendamentoDto,
    isProfessional: Boolean,
    viewModel: AppointmentsViewModel,
    onDismiss: () -> Unit,
    onUpdateStatus: (String) -> Unit,
    onNavigateToUnit: () -> Unit
) {
    val context = LocalContext.current
    var isProcessing by remember { mutableStateOf(false) }
    var showCancelInput by remember { mutableStateOf(false) }
    var showHistoryOverlay by remember { mutableStateOf(false) }
    var showReassignOverlay by remember { mutableStateOf(false) }
    var alertConfig by remember { mutableStateOf<AlertConfig?>(null) }
    var historyData by remember { mutableStateOf<ClientAppointmentHistoryDTO?>(null) }
    var historyLoading by remember { mutableStateOf(false) }
    var reassignOptions by remember { mutableStateOf<List<ProfessionalOptionDTO>>(emptyList()) }
    var reassignLoading by remember { mutableStateOf(false) }
    var selectedReassignId by remember { mutableStateOf<Int?>(null) }

    // Permission logic
    val canCancel = appointment.status == "Pendente" || appointment.status == "Confirmado"
    val canConfirm = appointment.status == "Pendente" && isProfessional
    val canComplete = appointment.status == "Confirmado" && isProfessional && AppointmentsViewModel.canBeMarkedAsCompleted(appointment)
    val canNoShow = appointment.status == "Confirmado" && isProfessional && AppointmentsViewModel.canBeMarkedAsCompleted(appointment)
    val canReassign = isProfessional && (appointment.status == "Pendente" || appointment.status == "Confirmado")

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
        ) {
            // Header
            Surface(tonalElevation = 2.dp) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Detalhes do Agendamento", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    IconButton(onClick = onDismiss) { Icon(Icons.Default.Close, "Fechar") }
                }
            }

            // Scrollable content
            Column(modifier = Modifier.weight(1f).verticalScroll(rememberScrollState())) {
                // Ticket card
                Card(
                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                    shape = RoundedCornerShape(16.dp),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column {
                        // Unit info header
                        Surface(
                            modifier = Modifier.fillMaxWidth().clickable(onClick = onNavigateToUnit),
                            color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.3f)
                        ) {
                            Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                                // Unit logo placeholder
                                Surface(
                                    modifier = Modifier.size(48.dp),
                                    shape = RoundedCornerShape(8.dp),
                                    color = AppColors.Primary.copy(alpha = 0.1f)
                                ) {
                                    Box(contentAlignment = Alignment.Center) {
                                        Icon(Icons.Default.Store, null, tint = AppColors.Primary, modifier = Modifier.size(24.dp))
                                    }
                                }
                                Spacer(modifier = Modifier.width(12.dp))
                                Column(modifier = Modifier.weight(1f)) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text(
                                            appointment.unidadeNome ?: "Unidade",
                                            style = MaterialTheme.typography.titleSmall,
                                            fontWeight = FontWeight.Bold,
                                            modifier = Modifier.weight(1f, fill = false)
                                        )
                                        Icon(Icons.Default.ChevronRight, null, modifier = Modifier.size(16.dp), tint = Color.Gray)
                                    }
                                    appointment.unidadeAddress?.let { addr ->
                                        Text(addr, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                    }
                                }
                            }
                        }

                        // Dashed divider
                        val dashColor = Color(0xFFE0E0E0)
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp)
                                .drawBehind {
                                    val dashWidth = 8f; val gapWidth = 6f
                                    var x = 0f
                                    while (x < size.width) {
                                        drawLine(dashColor, Offset(x, size.height / 2), Offset(minOf(x + dashWidth, size.width), size.height / 2), 2f)
                                        x += dashWidth + gapWidth
                                    }
                                }
                                .height(1.dp)
                        ) { }

                        // Detail section
                        Column(modifier = Modifier.padding(16.dp)) {
                            IconDetailRow(Icons.Default.Spa, "Serviço", appointment.servicoNome)
                            appointment.durationMinutes?.let { IconDetailRow(Icons.Default.Timer, "Duração", "$it min") }
                            IconDetailRow(Icons.Default.CalendarToday, "Data e Horário", "${appointment.data ?: ""} às ${appointment.hora ?: ""}")
                            IconDetailRow(Icons.Default.CheckCircle, "Status", appointment.status)
                            appointment.observacoes?.let { IconDetailRow(Icons.Default.Notes, "Notas", it) }
                            appointment.cancellationReason?.let { reason ->
                                Spacer(modifier = Modifier.height(8.dp))
                                Surface(
                                    modifier = Modifier.fillMaxWidth(),
                                    color = AppColors.StatusCancelled.copy(alpha = 0.08f),
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    Column(modifier = Modifier.padding(12.dp)) {
                                        Text("Motivo do cancelamento", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = AppColors.StatusCancelled)
                                        Text(reason, style = MaterialTheme.typography.bodySmall)
                                    }
                                }
                            }
                            if (appointment.status == "NaoCompareceu") {
                                Spacer(modifier = Modifier.height(8.dp))
                                Surface(
                                    modifier = Modifier.fillMaxWidth(),
                                    color = Color(0xFFF3F4F6),
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    Column(modifier = Modifier.padding(12.dp)) {
                                        Text("Cliente não compareceu", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = AppColors.StatusNoShow)
                                    }
                                }
                            }

                            // Professional card
                            Spacer(modifier = Modifier.height(12.dp))
                            Surface(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(12.dp),
                                color = Color(0xFFF9FAFB),
                                tonalElevation = 1.dp
                            ) {
                                Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                                    Surface(
                                        modifier = Modifier.size(44.dp),
                                        shape = CircleShape,
                                        color = AppColors.Primary.copy(alpha = 0.1f)
                                    ) {
                                        Box(contentAlignment = Alignment.Center) {
                                            Icon(Icons.Default.Person, null, tint = AppColors.Primary)
                                        }
                                    }
                                    Spacer(modifier = Modifier.width(12.dp))
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text("Profissional", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                        Text(
                                            appointment.funcionarioNome ?: "Não informado",
                                            style = MaterialTheme.typography.bodyMedium,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                }
                            }

                            // Manager-only client info block
                            if (isProfessional) {
                                Spacer(modifier = Modifier.height(12.dp))
                                Surface(
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(12.dp),
                                    color = Color(0xFFF0F7FF),
                                    tonalElevation = 1.dp
                                ) {
                                    Column(modifier = Modifier.padding(12.dp)) {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Surface(modifier = Modifier.size(40.dp), shape = CircleShape, color = AppColors.Primary.copy(alpha = 0.15f)) {
                                                Box(contentAlignment = Alignment.Center) { Icon(Icons.Default.Person, null, tint = AppColors.Primary, modifier = Modifier.size(20.dp)) }
                                            }
                                            Spacer(modifier = Modifier.width(10.dp))
                                            Column(modifier = Modifier.weight(1f)) {
                                                Text(appointment.clienteNome ?: "Cliente", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodyMedium)
                                                appointment.clientPhone?.let { Text("📞 $it", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant) }
                                                appointment.clientCity?.let { Text("📍 $it", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant) }
                                            }
                                        }
                                        appointment.clientTotalAppointments?.let { total ->
                                            Spacer(modifier = Modifier.height(8.dp))
                                            Row(horizontalArrangement = Arrangement.SpaceEvenly, modifier = Modifier.fillMaxWidth()) {
                                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                                    Text("Total", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                                    Text("$total", fontWeight = FontWeight.Bold, color = AppColors.Primary)
                                                }
                                                appointment.clientNoShowTotal?.let { noShow ->
                                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                                        Text("No-show", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                                        Text("$noShow", fontWeight = FontWeight.Bold, color = AppColors.StatusNoShow)
                                                    }
                                                }
                                            }
                                        }
                                        // View history button
                                        Spacer(modifier = Modifier.height(8.dp))
                                        OutlinedButton(
                                            onClick = {
                                                showHistoryOverlay = true
                                                historyLoading = true
                                                viewModel.getClientHistory(appointment.id) { data ->
                                                    historyData = data
                                                    historyLoading = false
                                                }
                                            },
                                            modifier = Modifier.fillMaxWidth(),
                                            contentPadding = PaddingValues(vertical = 6.dp)
                                        ) {
                                            if (historyLoading) {
                                                CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                                                Spacer(modifier = Modifier.width(8.dp))
                                                Text("Carregando histórico...", fontSize = 12.sp)
                                            } else {
                                                Icon(Icons.Default.History, null, modifier = Modifier.size(16.dp))
                                                Spacer(modifier = Modifier.width(4.dp))
                                                Text("Ver histórico", fontSize = 12.sp)
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        // Price section
                        Surface(
                            modifier = Modifier.fillMaxWidth(),
                            color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.2f)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth().padding(16.dp),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("Valor do Serviço", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                val price = appointment.totalPrice ?: appointment.preco
                                if (price != null) {
                                    Text("R$ %.2f".format(price), fontWeight = FontWeight.Bold, color = AppColors.Primary, style = MaterialTheme.typography.titleMedium)
                                }
                            }
                        }
                    }
                }

                // Action buttons
                Column(modifier = Modifier.padding(horizontal = 16.dp)) {
                    if (canComplete) {
                        ActionButton("Marcar como Finalizado", Icons.Default.CheckCircle, AppColors.StatusCompleted, isProcessing) {
                            alertConfig = AlertConfig("Confirmar", "Marcar este atendimento como finalizado?", false) {
                                isProcessing = true
                                onUpdateStatus("Finalizado")
                            }
                        }
                    }
                    if (canNoShow) {
                        ActionButton("Marcar como Não Compareceu", Icons.Default.PersonRemove, AppColors.StatusNoShow, isProcessing) {
                            alertConfig = AlertConfig("Confirmar", "Registrar ausência do cliente?", false) {
                                isProcessing = true
                                onUpdateStatus("NaoCompareceu")
                            }
                        }
                    }
                    if (canConfirm) {
                        ActionButton("Confirmar Agendamento", Icons.Default.Check, AppColors.Success, isProcessing) {
                            isProcessing = true
                            onUpdateStatus("Confirmado")
                        }
                    }
                    // WhatsApp contact
                    val phone = if (isProfessional) appointment.clientPhone else appointment.unidadeWhatsApp
                    if (!phone.isNullOrBlank()) {
                        ActionButton(
                            if (isProfessional) "Contatar Cliente" else "Contatar Unidade",
                            Icons.Default.Chat,
                            Color(0xFF25D366),
                            false
                        ) {
                            try {
                                val cleanNumber = phone.replace(Regex("[^0-9]"), "")
                                val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://wa.me/55$cleanNumber"))
                                context.startActivity(intent)
                            } catch (_: Exception) {
                                alertConfig = AlertConfig("Erro", "Não foi possível abrir o WhatsApp.", false) {}
                            }
                        }
                    }
                    // Reassign professional
                    if (canReassign) {
                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedButton(
                            onClick = {
                                showReassignOverlay = true
                                reassignLoading = true
                                selectedReassignId = null
                                viewModel.getEligibleProfessionals(appointment.id) { options ->
                                    reassignOptions = options.filter { it.professionalId.toString() != appointment.funcionarioId }
                                    reassignLoading = false
                                }
                            },
                            modifier = Modifier.fillMaxWidth(),
                            enabled = !isProcessing && !reassignLoading,
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = AppColors.Primary)
                        ) {
                            if (reassignLoading) {
                                CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                            } else {
                                Text("Trocar Profissional")
                            }
                        }
                    }
                    // Cancel
                    if (canCancel) {
                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedButton(
                            onClick = { showCancelInput = true },
                            modifier = Modifier.fillMaxWidth(),
                            enabled = !isProcessing,
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = AppColors.StatusCancelled)
                        ) {
                            Text("Cancelar Horário")
                        }
                    }
                    Spacer(modifier = Modifier.height(24.dp))
                }
            }
        }

        // ===== OVERLAYS =====

        // Cancel reason modal
        if (showCancelInput) {
            CancelReasonModal(
                onDismiss = { showCancelInput = false },
                onConfirm = { reason ->
                    showCancelInput = false
                    isProcessing = true
                    viewModel.cancelWithReason(appointment.id, reason) { success ->
                        isProcessing = false
                        if (success) onDismiss()
                        else alertConfig = AlertConfig("Erro", "Falha ao cancelar agendamento.", true) {}
                    }
                }
            )
        }

        // Client history overlay
        if (showHistoryOverlay) {
            ClientHistoryOverlay(
                clientName = appointment.clienteNome ?: "Cliente",
                unitName = appointment.unidadeNome,
                isLoading = historyLoading,
                history = historyData,
                onDismiss = { showHistoryOverlay = false; historyData = null }
            )
        }

        // Reassign professional overlay
        if (showReassignOverlay) {
            ReassignProfessionalOverlay(
                isLoading = reassignLoading,
                options = reassignOptions,
                selectedId = selectedReassignId,
                onSelect = { selectedReassignId = it },
                onDismiss = { showReassignOverlay = false },
                onConfirm = {
                    if (selectedReassignId != null) {
                        reassignLoading = true
                        viewModel.reassignProfessional(appointment.id, selectedReassignId!!) { success ->
                            reassignLoading = false
                            if (success) {
                                showReassignOverlay = false
                                onDismiss()
                            } else {
                                alertConfig = AlertConfig("Erro", "Falha ao trocar profissional.", true) {}
                            }
                        }
                    }
                }
            )
        }

        // Custom alert dialog
        alertConfig?.let { config ->
            CustomAlertDialog(
                title = config.title,
                message = config.message,
                isDestructive = config.isDestructive,
                onConfirm = {
                    alertConfig = null
                    config.onConfirm()
                },
                onCancel = { alertConfig = null }
            )
        }
    }
}

// Helper data class for alert config
data class AlertConfig(
    val title: String,
    val message: String,
    val isDestructive: Boolean = false,
    val onConfirm: () -> Unit
)

// showAlert helper - creates AlertConfig and assigns to state

@Composable
fun ActionButton(text: String, icon: androidx.compose.ui.graphics.vector.ImageVector, color: Color, isProcessing: Boolean, onClick: () -> Unit) {
    Spacer(modifier = Modifier.height(8.dp))
    Button(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        enabled = !isProcessing,
        colors = ButtonDefaults.buttonColors(containerColor = color)
    ) {
        if (isProcessing) {
            CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp, color = Color.White)
        } else {
            Icon(icon, null, modifier = Modifier.size(18.dp))
            Spacer(modifier = Modifier.width(8.dp))
            Text(text)
        }
    }
}

@Composable
fun IconDetailRow(icon: androidx.compose.ui.graphics.vector.ImageVector, label: String, value: String?) {
    if (value.isNullOrBlank()) return
    Row(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
        Surface(modifier = Modifier.size(28.dp), shape = RoundedCornerShape(6.dp), color = AppColors.Primary.copy(alpha = 0.1f)) {
            Box(contentAlignment = Alignment.Center) {
                Icon(icon, null, modifier = Modifier.size(14.dp), tint = AppColors.Primary)
            }
        }
        Spacer(modifier = Modifier.width(10.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text(value, style = MaterialTheme.typography.bodySmall)
        }
    }
}

// ==================== CANCEL REASON MODAL ====================
@Composable
fun CancelReasonModal(onDismiss: () -> Unit, onConfirm: (String?) -> Unit) {
    var reason by remember { mutableStateOf("") }
    Dialog(onDismissRequest = onDismiss) {
        Surface(shape = RoundedCornerShape(16.dp), tonalElevation = 4.dp) {
            Column(modifier = Modifier.padding(20.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Surface(modifier = Modifier.size(40.dp), shape = CircleShape, color = AppColors.StatusCancelled.copy(alpha = 0.1f)) {
                        Box(contentAlignment = Alignment.Center) { Icon(Icons.Default.Close, null, tint = AppColors.StatusCancelled) }
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Text("Cancelar Agendamento", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                }
                Spacer(modifier = Modifier.height(12.dp))
                Text("Tem certeza? Informe o motivo do cancelamento (opcional).", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Spacer(modifier = Modifier.height(12.dp))
                OutlinedTextField(
                    value = reason,
                    onValueChange = { reason = it },
                    modifier = Modifier.fillMaxWidth().height(100.dp),
                    placeholder = { Text("Motivo do cancelamento...", fontSize = 13.sp) },
                    maxLines = 4
                )
                Spacer(modifier = Modifier.height(16.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(onClick = onDismiss, modifier = Modifier.weight(1f)) { Text("Voltar") }
                    Button(
                        onClick = { onConfirm(reason.ifBlank { null }) },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = AppColors.StatusCancelled)
                    ) { Text("Cancelar Horário") }
                }
            }
        }
    }
}

// ==================== CLIENT HISTORY OVERLAY ====================
@Composable
fun ClientHistoryOverlay(
    clientName: String,
    unitName: String?,
    isLoading: Boolean,
    history: ClientAppointmentHistoryDTO?,
    onDismiss: () -> Unit
) {
    Dialog(onDismissRequest = onDismiss, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Surface(
            modifier = Modifier.fillMaxSize().padding(24.dp),
            shape = RoundedCornerShape(16.dp),
            color = Color.White
        ) {
            Column {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Histórico — $clientName", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.weight(1f))
                    IconButton(onClick = onDismiss) { Icon(Icons.Default.Close, "Fechar") }
                }
                Column(modifier = Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(horizontal = 16.dp)) {
                    if (isLoading) {
                        Box(modifier = Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
                    } else if (history == null) {
                        Text("Erro ao carregar histórico.", color = AppColors.StatusCancelled)
                    } else {
                        Text("Na unidade (${unitName ?: "N/A"})", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold, color = Color(0xFF374151))
                        Spacer(modifier = Modifier.height(8.dp))
                        if (history.atThisSalon.isEmpty()) {
                            Text("Nenhum registro.", style = MaterialTheme.typography.bodySmall, color = Color(0xFF9CA3AF))
                        } else {
                            history.atThisSalon.forEach { item ->
                                HistoryItemCard(item)
                                Spacer(modifier = Modifier.height(6.dp))
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                }
            }
        }
    }
}

@Composable
fun HistoryItemCard(item: ClientAppointmentHistoryItemDTO) {
    val statusColor = when (item.status) {
        "Confirmado" -> AppColors.StatusConfirmed
        "Pendente" -> AppColors.StatusPending
        "Finalizado" -> AppColors.StatusCompleted
        "Cancelado" -> AppColors.StatusCancelled
        "NaoCompareceu" -> AppColors.StatusNoShow
        else -> MaterialTheme.colorScheme.onSurfaceVariant
    }
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(10.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFFAFAFA))
    ) {
        Column(modifier = Modifier.padding(10.dp)) {
            Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                Text(item.scheduledAt ?: "", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
                Text(item.status, style = MaterialTheme.typography.labelSmall, color = statusColor, fontWeight = FontWeight.SemiBold)
            }
            Text(
                "${item.serviceName ?: "Não informado"} · ${item.professionalName ?: "Não informado"}",
                style = MaterialTheme.typography.bodySmall, color = Color(0xFF4B5563)
            )
            Text("${item.durationMinutes} min · R$ %.2f".format(item.totalPrice), style = MaterialTheme.typography.labelSmall, color = Color(0xFF6B7280))
            item.cancellationReason?.let {
                Text("Cancelamento: $it", style = MaterialTheme.typography.labelSmall, color = AppColors.StatusCancelled)
            }
            item.notes?.let {
                Text("Obs.: $it", style = MaterialTheme.typography.labelSmall, color = Color(0xFF6B7280))
            }
        }
    }
}

// ==================== REASSIGN PROFESSIONAL OVERLAY ====================
@Composable
fun ReassignProfessionalOverlay(
    isLoading: Boolean,
    options: List<ProfessionalOptionDTO>,
    selectedId: Int?,
    onSelect: (Int) -> Unit,
    onDismiss: () -> Unit,
    onConfirm: () -> Unit
) {
    Dialog(onDismissRequest = onDismiss, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Surface(
            modifier = Modifier.fillMaxSize().padding(24.dp),
            shape = RoundedCornerShape(16.dp),
            color = Color.White
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("Trocar profissional", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                Text("Profissionais disponíveis nesta unidade.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Spacer(modifier = Modifier.height(12.dp))
                if (isLoading) {
                    Box(modifier = Modifier.weight(1f), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
                } else {
                    Column(modifier = Modifier.weight(1f).verticalScroll(rememberScrollState())) {
                        if (options.isEmpty()) {
                            Text("Nenhum profissional disponível.", style = MaterialTheme.typography.bodySmall, color = Color(0xFF92400E))
                        } else {
                            options.forEach { opt ->
                                val isSelected = selectedId == opt.professionalId
                                Surface(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 4.dp)
                                        .clickable { onSelect(opt.professionalId) },
                                    shape = RoundedCornerShape(10.dp),
                                    color = if (isSelected) AppColors.Primary.copy(alpha = 0.08f) else Color.White,
                                    tonalElevation = if (isSelected) 2.dp else 0.dp,
                                    border = if (isSelected) androidx.compose.foundation.BorderStroke(1.dp, AppColors.Primary) else null
                                ) {
                                    Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                                        Surface(modifier = Modifier.size(38.dp), shape = CircleShape, color = AppColors.Primary.copy(alpha = 0.1f)) {
                                            Box(contentAlignment = Alignment.Center) { Icon(Icons.Default.Person, null, tint = AppColors.Primary) }
                                        }
                                        Spacer(modifier = Modifier.width(10.dp))
                                        Text(opt.professionalName, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
                                        if (isSelected) Icon(Icons.Default.CheckCircle, null, tint = AppColors.Primary, modifier = Modifier.size(20.dp))
                                    }
                                }
                            }
                        }
                    }
                }
                Spacer(modifier = Modifier.height(12.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(onClick = onDismiss, modifier = Modifier.weight(1f)) { Text("Cancelar") }
                    Button(
                        onClick = onConfirm,
                        modifier = Modifier.weight(1f),
                        enabled = selectedId != null && !isLoading
                    ) { Text("Confirmar troca") }
                }
            }
        }
    }
}

// ==================== CUSTOM ALERT DIALOG ====================
@Composable
fun CustomAlertDialog(
    title: String,
    message: String,
    isDestructive: Boolean = false,
    onConfirm: () -> Unit,
    onCancel: () -> Unit
) {
    Dialog(onDismissRequest = onCancel) {
        Surface(shape = RoundedCornerShape(16.dp), tonalElevation = 4.dp) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Surface(
                    modifier = Modifier.size(56.dp),
                    shape = CircleShape,
                    color = if (isDestructive) Color(0xFFFFF1F0) else Color(0xFFF0F7FF)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            if (isDestructive) Icons.Default.Warning else Icons.Default.Info,
                            null,
                            tint = if (isDestructive) AppColors.StatusCancelled else AppColors.Primary,
                            modifier = Modifier.size(28.dp)
                        )
                    }
                }
                Spacer(modifier = Modifier.height(16.dp))
                Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(8.dp))
                Text(message, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
                Spacer(modifier = Modifier.height(20.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                    OutlinedButton(onClick = onCancel, modifier = Modifier.weight(1f)) { Text("Voltar") }
                    Button(
                        onClick = onConfirm,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = if (isDestructive) AppColors.StatusCancelled else AppColors.Primary)
                    ) { Text("Confirmar") }
                }
            }
        }
    }
}

// ==================== PROFESSIONAL DETAIL MODAL ====================

@Composable
fun ProfessionalDetailModal(
    professionalId: Int,
    professionalName: String,
    onDismiss: () -> Unit,
    viewModel: AppointmentsViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    var professionalAppointments by remember { mutableStateOf<List<AgendamentoDto>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(professionalId) {
        try {
            // Load appointments for this professional
            val allAppointments = viewModel.appointments.value
            professionalAppointments = allAppointments.filter { it.funcionarioId == professionalId }
        } catch (e: Exception) {
            NewRelicLogger.reportErrorWithMessage(
                e,
                "ProfessionalDetailModal.loadProfessionalAppointments",
                "Failed to load professional appointments",
                mapOf("professionalId" to professionalId)
            )
        } finally {
            isLoading = false
        }
    }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
        ) {
            // Header
            Surface(tonalElevation = 2.dp) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Profissional", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    IconButton(onClick = onDismiss) { Icon(Icons.Default.Close, "Fechar") }
                }
            }

            // Content
            if (isLoading) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            } else {
                Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
                    // Professional info
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Surface(
                                    modifier = Modifier.size(48.dp),
                                    shape = CircleShape,
                                    color = AppColors.Primary.copy(alpha = 0.1f)
                                ) {
                                    Box(contentAlignment = Alignment.Center) {
                                        Icon(
                                            Icons.Default.Person,
                                            null,
                                            tint = AppColors.Primary,
                                            modifier = Modifier.size(28.dp)
                                        )
                                    }
                                }
                                Spacer(modifier = Modifier.width(12.dp))
                                Column {
                                    Text(
                                        professionalName,
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        "${professionalAppointments.size} agendamento(s)",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Recent appointments
                    Text(
                        "Agendamentos Recentes",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(8.dp))

                    if (professionalAppointments.isEmpty()) {
                        Text(
                            "Nenhum agendamento encontrado",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    } else {
                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            items(professionalAppointments.take(10)) { appointment ->
                                Card(
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                                ) {
                                    Row(
                                        modifier = Modifier.padding(12.dp),
                                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        // Status indicator
                                        val statusColor = when (appointment.status) {
                                            "Pendente" -> AppColors.StatusPending
                                            "Confirmado" -> AppColors.StatusConfirmed
                                            "Finalizado" -> AppColors.Success
                                            "Cancelado" -> AppColors.StatusCancelled
                                            else -> MaterialTheme.colorScheme.onSurfaceVariant
                                        }
                                        Box(
                                            modifier = Modifier
                                                .size(8.dp)
                                                .clip(CircleShape)
                                                .background(statusColor)
                                        )

                                        Column(modifier = Modifier.weight(1f)) {
                                            Text(
                                                appointment.clienteNome ?: "Cliente",
                                                style = MaterialTheme.typography.bodySmall,
                                                fontWeight = FontWeight.Bold
                                            )
                                            Text(
                                                appointment.servicoNome ?: "Serviço",
                                                style = MaterialTheme.typography.labelSmall,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                        }

                                        Surface(
                                            color = statusColor.copy(alpha = 0.1f),
                                            shape = MaterialTheme.shapes.extraSmall
                                        ) {
                                            Text(
                                                appointment.status,
                                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                                style = MaterialTheme.typography.labelSmall,
                                                color = statusColor,
                                                fontSize = 10.sp
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
