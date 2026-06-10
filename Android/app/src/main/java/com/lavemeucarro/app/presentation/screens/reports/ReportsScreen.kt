package com.lavemeucarro.app.presentation.screens.reports

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.lavemeucarro.app.data.models.BusinessReportDto
import com.lavemeucarro.app.data.models.RankingItem
import com.lavemeucarro.app.data.models.StatusCount
import com.lavemeucarro.app.data.models.TimeSeriesPoint
import com.lavemeucarro.app.data.models.UnidadeDto
import com.lavemeucarro.app.data.remote.LavaMeuCarroApi
import com.lavemeucarro.app.presentation.theme.AppColors
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReportsScreen(
    modifier: Modifier = Modifier,
    viewModel: ReportsViewModel = hiltViewModel()
) {
    val report by viewModel.report.collectAsState()
    val units by viewModel.units.collectAsState()
    val selectedUnitId by viewModel.selectedUnitId.collectAsState()
    val selectedPeriod by viewModel.selectedPeriod.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val error by viewModel.error.collectAsState()

    LaunchedEffect(Unit) { viewModel.loadData() }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Relatórios") },
                actions = {
                    IconButton(onClick = { viewModel.loadData() }) {
                        Icon(Icons.Default.Refresh, "Atualizar")
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
        ) {
            // Period selector
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                listOf("7d" to "7 dias", "30d" to "30 dias", "90d" to "90 dias", "365d" to "1 ano").forEach { (value, label) ->
                    FilterChip(
                        selected = selectedPeriod == value,
                        onClick = { viewModel.selectPeriod(value) },
                        label = { Text(label, fontSize = 11.sp) }
                    )
                }
            }

            // Unit selector
            if (units.size > 1) {
                var expanded by remember { mutableStateOf(false) }
                Box(modifier = Modifier.padding(horizontal = 16.dp)) {
                    OutlinedTextField(
                        value = units.find { it.id == selectedUnitId }?.nome ?: "Todas as unidades",
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Unidade") },
                        trailingIcon = { Icon(Icons.Default.ArrowDropDown, null) },
                        modifier = Modifier.fillMaxWidth()
                    )
                    // Simple dropdown
                    if (expanded) {
                        DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
                            DropdownMenuItem(
                                text = { Text("Todas as unidades") },
                                onClick = { viewModel.selectUnit(null); expanded = false }
                            )
                            units.forEach { unit ->
                                DropdownMenuItem(
                                    text = { Text(unit.nome) },
                                    onClick = { viewModel.selectUnit(unit.id); expanded = false }
                                )
                            }
                        }
                    }
                }
                Spacer(modifier = Modifier.height(8.dp))
            }

            when {
                isLoading && report == null -> {
                    Box(
                        modifier = Modifier.fillMaxWidth().padding(48.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator()
                    }
                }
                error != null -> {
                    Column(
                        modifier = Modifier.fillMaxWidth().padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(Icons.Default.Error, null, tint = MaterialTheme.colorScheme.error, modifier = Modifier.size(48.dp))
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(error ?: "Erro ao carregar relatório", color = MaterialTheme.colorScheme.error)
                        Spacer(modifier = Modifier.height(8.dp))
                        Button(onClick = { viewModel.loadData() }) { Text("Tentar novamente") }
                    }
                }
                report != null -> {
                    val r = report!!

                    // Summary metrics
                    Text(
                        "Resumo",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                    )
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        MetricCard(
                            title = "Agendamentos",
                            value = r.totalAppointments.toString(),
                            icon = Icons.Default.CalendarMonth,
                            modifier = Modifier.weight(1f)
                        )
                        MetricCard(
                            title = "Receita",
                            value = "R$ %.0f".format(r.totalRevenue),
                            icon = Icons.Default.AttachMoney,
                            color = AppColors.Success,
                            modifier = Modifier.weight(1f)
                        )
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        MetricCard(
                            title = "Ticket Médio",
                            value = "R$ %.2f".format(r.averageTicket),
                            icon = Icons.Default.Receipt,
                            modifier = Modifier.weight(1f)
                        )
                        MetricCard(
                            title = "Cancelamentos",
                            value = "%.1f%%".format(r.cancellationRate * 100),
                            icon = Icons.Default.Cancel,
                            color = MaterialTheme.colorScheme.error,
                            modifier = Modifier.weight(1f)
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Revenue over time chart
                    if (r.revenueOverTime.isNotEmpty()) {
                        SectionTitle("Receita ao Longo do Tempo")
                        SimpleBarChart(
                            data = r.revenueOverTime,
                            modifier = Modifier.fillMaxWidth().height(200.dp).padding(horizontal = 16.dp),
                            barColor = AppColors.Success
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                    }

                    // Appointments over time
                    if (r.appointmentsOverTime.isNotEmpty()) {
                        SectionTitle("Agendamentos ao Longo do Tempo")
                        SimpleBarChart(
                            data = r.appointmentsOverTime,
                            modifier = Modifier.fillMaxWidth().height(200.dp).padding(horizontal = 16.dp),
                            barColor = MaterialTheme.colorScheme.primary
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                    }

                    // Status breakdown
                    if (r.statusBreakdown.isNotEmpty()) {
                        SectionTitle("Distribuição por Status")
                        StatusBreakdownChart(
                            data = r.statusBreakdown,
                            modifier = Modifier.padding(horizontal = 16.dp)
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                    }

                    // Services ranking
                    if (r.servicesRanking.isNotEmpty()) {
                        SectionTitle("Top Serviços")
                        RankingList(
                            items = r.servicesRanking,
                            modifier = Modifier.padding(horizontal = 16.dp)
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                    }

                    Spacer(modifier = Modifier.height(24.dp))
                }
            }
        }
    }
}

@Composable
private fun SectionTitle(title: String) {
    Text(
        title,
        style = MaterialTheme.typography.titleMedium,
        fontWeight = FontWeight.Bold,
        modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
    )
}

@Composable
private fun MetricCard(
    title: String,
    value: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    color: Color = MaterialTheme.colorScheme.primary,
    modifier: Modifier = Modifier
) {
    Card(modifier = modifier) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(icon, null, tint = color, modifier = Modifier.size(20.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text(title, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Spacer(modifier = Modifier.height(4.dp))
            Text(value, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun SimpleBarChart(
    data: List<TimeSeriesPoint>,
    modifier: Modifier = Modifier,
    barColor: Color = MaterialTheme.colorScheme.primary
) {
    if (data.isEmpty()) return

    val maxValue = data.maxOf { it.value }.coerceAtLeast(1.0)
    val displayData = data.takeLast(14) // Show last 14 data points max

    Card(modifier = modifier) {
        Column(modifier = Modifier.padding(12.dp)) {
            Canvas(
                modifier = Modifier.fillMaxSize().weight(1f)
            ) {
                val barWidth = (size.width / displayData.size) * 0.7f
                val gap = (size.width / displayData.size) * 0.3f

                displayData.forEachIndexed { index, point ->
                    val barHeight = (point.value / maxValue * size.height * 0.85f).toFloat()
                    val x = index * (barWidth + gap) + gap / 2
                    val y = size.height - barHeight

                    drawRect(
                        color = barColor,
                        topLeft = Offset(x, y),
                        size = Size(barWidth, barHeight)
                    )
                }
            }

            // X-axis labels (show first, middle, last)
            if (displayData.size > 1) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(displayData.first().date.takeLast(5), style = MaterialTheme.typography.labelSmall, fontSize = 9.sp)
                    if (displayData.size > 2) {
                        Text(displayData[displayData.size / 2].date.takeLast(5), style = MaterialTheme.typography.labelSmall, fontSize = 9.sp)
                    }
                    Text(displayData.last().date.takeLast(5), style = MaterialTheme.typography.labelSmall, fontSize = 9.sp)
                }
            }
        }
    }
}

@Composable
private fun StatusBreakdownChart(
    data: List<StatusCount>,
    modifier: Modifier = Modifier
) {
    val total = data.sumOf { it.count }.coerceAtLeast(1)
    val colors = listOf(
        AppColors.Success,    // Confirmed
        AppColors.Warning,    // Pending
        MaterialTheme.colorScheme.primary, // Completed
        MaterialTheme.colorScheme.error,   // Cancelled
        Color.Gray                           // No-show
    )

    Card(modifier = modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(12.dp)) {
            // Horizontal bar
            Canvas(modifier = Modifier.fillMaxWidth().height(24.dp)) {
                var xOffset = 0f
                data.forEachIndexed { index, item ->
                    val width = (item.count.toFloat() / total) * size.width
                    drawRect(
                        color = colors[index % colors.size],
                        topLeft = Offset(xOffset, 0f),
                        size = Size(width, size.height)
                    )
                    xOffset += width
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Legend
            data.forEachIndexed { index, item ->
                Row(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Surface(
                        modifier = Modifier.size(12.dp),
                        color = colors[index % colors.size],
                        shape = MaterialTheme.shapes.extraSmall
                    ) {}
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        item.status,
                        style = MaterialTheme.typography.bodySmall,
                        modifier = Modifier.weight(1f)
                    )
                    Text(
                        "${item.count} (${item.count * 100 / total}%)",
                        style = MaterialTheme.typography.bodySmall,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

@Composable
private fun RankingList(
    items: List<RankingItem>,
    modifier: Modifier = Modifier
) {
    Card(modifier = modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(12.dp)) {
            items.take(10).forEachIndexed { index, item ->
                Row(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Surface(
                        modifier = Modifier.size(24.dp),
                        shape = MaterialTheme.shapes.small,
                        color = if (index < 3) MaterialTheme.colorScheme.primaryContainer
                        else MaterialTheme.colorScheme.surfaceVariant
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Text(
                                "${index + 1}",
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Bold,
                                color = if (index < 3) MaterialTheme.colorScheme.onPrimaryContainer
                                else MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(item.name, style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Medium, maxLines = 1)
                        Text("${item.count} agendamentos", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    Text(
                        "R$ %.0f".format(item.revenue),
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.Bold,
                        color = AppColors.Success
                    )
                }
            }
        }
    }
}

@HiltViewModel
class ReportsViewModel @Inject constructor(
    private val api: LavaMeuCarroApi
) : ViewModel() {
    private val _report = MutableStateFlow<BusinessReportDto?>(null)
    val report: StateFlow<BusinessReportDto?> = _report

    private val _units = MutableStateFlow<List<UnidadeDto>>(emptyList())
    val units: StateFlow<List<UnidadeDto>> = _units

    private val _selectedUnitId = MutableStateFlow<String?>(null)
    val selectedUnitId: StateFlow<String?> = _selectedUnitId

    private val _selectedPeriod = MutableStateFlow("30d")
    val selectedPeriod: StateFlow<String> = _selectedPeriod

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error

    fun loadData() {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            try {
                // Load units and report in parallel
                val unitsDeferred = async { api.getMyUnidades() }
                val reportDeferred = async { api.getBusinessReport(_selectedPeriod.value, _selectedUnitId.value) }

                _units.value = unitsDeferred.await()
                _report.value = reportDeferred.await()
            } catch (e: Exception) {
                _error.value = "Erro ao carregar relatório: ${e.message}"
            }
            _isLoading.value = false
        }
    }

    fun selectPeriod(period: String) {
        _selectedPeriod.value = period
        loadData()
    }

    fun selectUnit(unitId: String?) {
        _selectedUnitId.value = unitId
        loadData()
    }
}
