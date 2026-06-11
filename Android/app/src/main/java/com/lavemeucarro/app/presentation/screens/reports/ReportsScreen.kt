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
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.lavemeucarro.app.data.models.*
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

                    // === 6 Summary Cards ===
                    SectionTitle("Resumo")
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        MetricCard(
                            title = "Faturamento",
                            value = "R$ %.0f".format(r.totalRevenue),
                            icon = Icons.Default.AttachMoney,
                            color = AppColors.Success,
                            modifier = Modifier.weight(1f)
                        )
                        MetricCard(
                            title = "Clientes",
                            value = r.uniqueClients.toString(),
                            icon = Icons.Default.People,
                            modifier = Modifier.weight(1f)
                        )
                    }
                    Spacer(modifier = Modifier.height(8.dp))
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
                            title = "Ticket Médio",
                            value = "R$ %.2f".format(r.averageTicket),
                            icon = Icons.Default.Receipt,
                            modifier = Modifier.weight(1f)
                        )
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        MetricCard(
                            title = "Profissionais",
                            value = r.professionalsCount.toString(),
                            icon = Icons.Default.Badge,
                            modifier = Modifier.weight(1f)
                        )
                        val completionRate = if (r.totalAppointments > 0) r.completedAppointments.toDouble() / r.totalAppointments else 0.0
                        MetricCard(
                            title = "Saúde Operacional",
                            value = "%.0f%%".format(completionRate * 100),
                            icon = Icons.Default.HealthAndSafety,
                            color = AppColors.Success,
                            modifier = Modifier.weight(1f)
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // === Revenue over time chart ===
                    if (r.revenueOverTime.isNotEmpty()) {
                        SectionTitle("Faturamento por Período")
                        SimpleBarChart(
                            data = r.revenueOverTime,
                            modifier = Modifier.fillMaxWidth().height(200.dp).padding(horizontal = 16.dp),
                            barColor = AppColors.Success
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                    }

                    // === Donut chart for status distribution ===
                    if (r.statusBreakdown.isNotEmpty()) {
                        SectionTitle("Distribuição por Status")
                        DonutStatusChart(
                            data = r.statusBreakdown,
                            modifier = Modifier.padding(horizontal = 16.dp)
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                    }

                    // === Weekday demand chart ===
                    if (r.weekdayDemand.isNotEmpty()) {
                        SectionTitle("Demanda por Dia da Semana")
                        WeekdayDemandChart(
                            data = r.weekdayDemand,
                            modifier = Modifier.fillMaxWidth().height(180.dp).padding(horizontal = 16.dp)
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                    }

                    // === Hourly demand (peak hours) chart ===
                    if (r.hourlyDemand.isNotEmpty()) {
                        SectionTitle("Horários de Pico")
                        HourlyDemandChart(
                            data = r.hourlyDemand,
                            modifier = Modifier.fillMaxWidth().height(180.dp).padding(horizontal = 16.dp)
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                    }

                    // === Top services ranking ===
                    if (r.servicesRanking.isNotEmpty()) {
                        SectionTitle("Top Serviços")
                        ServiceRankingList(
                            items = r.servicesRanking,
                            modifier = Modifier.padding(horizontal = 16.dp)
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                    }

                    // === Top professionals ranking ===
                    if (r.professionalsRanking.isNotEmpty()) {
                        SectionTitle("Top Profissionais")
                        RankingList(
                            items = r.professionalsRanking,
                            modifier = Modifier.padding(horizontal = 16.dp)
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                    }

                    // === Top clients ranking ===
                    if (r.clientsRanking.isNotEmpty()) {
                        SectionTitle("Clientes Mais Valiosos")
                        ClientRankingList(
                            items = r.clientsRanking,
                            modifier = Modifier.padding(horizontal = 16.dp)
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                    }

                    // === Automatic insights ===
                    if (r.insights.isNotEmpty()) {
                        SectionTitle("Insights Automáticos")
                        Column(modifier = Modifier.padding(horizontal = 16.dp)) {
                            r.insights.forEach { insight ->
                                Card(
                                    modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.3f))
                                ) {
                                    Row(modifier = Modifier.padding(12.dp)) {
                                        Icon(
                                            Icons.Default.Lightbulb,
                                            null,
                                            tint = AppColors.Accent,
                                            modifier = Modifier.size(20.dp)
                                        )
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text(
                                            insight,
                                            style = MaterialTheme.typography.bodySmall,
                                            lineHeight = 18.sp
                                        )
                                    }
                                }
                            }
                        }
                        Spacer(modifier = Modifier.height(16.dp))
                    }

                    // === Appointments over time ===
                    if (r.appointmentsOverTime.isNotEmpty()) {
                        SectionTitle("Agendamentos ao Longo do Tempo")
                        SimpleBarChart(
                            data = r.appointmentsOverTime,
                            modifier = Modifier.fillMaxWidth().height(200.dp).padding(horizontal = 16.dp),
                            barColor = MaterialTheme.colorScheme.primary
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
    val displayData = data.takeLast(14)

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
private fun DonutStatusChart(
    data: List<StatusCount>,
    modifier: Modifier = Modifier
) {
    val total = data.sumOf { it.count }.coerceAtLeast(1)
    val colors = listOf(
        AppColors.Success,        // Confirmado
        AppColors.Warning,        // Pendente
        MaterialTheme.colorScheme.primary, // Finalizado
        MaterialTheme.colorScheme.error,   // Cancelado
        Color.Gray                          // NaoCompareceu
    )

    Card(modifier = modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Donut chart
            Box(
                modifier = Modifier.size(150.dp),
                contentAlignment = Alignment.Center
            ) {
                Canvas(modifier = Modifier.fillMaxSize()) {
                    val strokeWidth = 36f
                    val radius = (size.minDimension - strokeWidth) / 2
                    val center = Offset(size.width / 2, size.height / 2)
                    var startAngle = -90f

                    data.forEachIndexed { index, item ->
                        val sweepAngle = (item.count.toFloat() / total) * 360f
                        drawArc(
                            color = colors[index % colors.size],
                            startAngle = startAngle,
                            sweepAngle = sweepAngle,
                            useCenter = false,
                            topLeft = Offset(center.x - radius, center.y - radius),
                            size = Size(radius * 2, radius * 2),
                            style = Stroke(width = strokeWidth, cap = StrokeCap.Butt)
                        )
                        startAngle += sweepAngle
                    }
                }
                // Center text
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("Total", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text("$total", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Legend
            data.forEachIndexed { index, item ->
                Row(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 3.dp),
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
private fun WeekdayDemandChart(
    data: List<WeekdayDemandItem>,
    modifier: Modifier = Modifier
) {
    if (data.isEmpty()) return
    val maxValue = data.maxOf { it.count }.coerceAtLeast(1)

    Card(modifier = modifier) {
        Column(modifier = Modifier.padding(12.dp)) {
            Canvas(modifier = Modifier.fillMaxSize().weight(1f)) {
                val barWidth = (size.width / data.size) * 0.6f
                val gap = (size.width / data.size) * 0.4f

                data.forEachIndexed { index, item ->
                    val barHeight = (item.count.toFloat() / maxValue * size.height * 0.85f)
                    val x = index * (barWidth + gap) + gap / 2
                    val y = size.height - barHeight

                    drawRect(
                        color = AppColors.Secondary,
                        topLeft = Offset(x, y),
                        size = Size(barWidth, barHeight)
                    )
                }
            }

            // X-axis labels
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                data.forEach { item ->
                    Text(
                        item.day.take(3),
                        style = MaterialTheme.typography.labelSmall,
                        fontSize = 9.sp,
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }
    }
}

@Composable
private fun HourlyDemandChart(
    data: List<HourlyDemandItem>,
    modifier: Modifier = Modifier
) {
    if (data.isEmpty()) return
    val maxValue = data.maxOf { it.count }.coerceAtLeast(1)
    val displayData = data.takeLast(12) // Show last 12 hours

    Card(modifier = modifier) {
        Column(modifier = Modifier.padding(12.dp)) {
            Canvas(modifier = Modifier.fillMaxSize().weight(1f)) {
                val barWidth = (size.width / displayData.size) * 0.6f
                val gap = (size.width / displayData.size) * 0.4f

                displayData.forEachIndexed { index, item ->
                    val barHeight = (item.count.toFloat() / maxValue * size.height * 0.85f)
                    val x = index * (barWidth + gap) + gap / 2
                    val y = size.height - barHeight

                    drawRect(
                        color = AppColors.Accent,
                        topLeft = Offset(x, y),
                        size = Size(barWidth, barHeight)
                    )
                }
            }

            // X-axis labels (show every other)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                displayData.forEachIndexed { index, item ->
                    if (index % 2 == 0) {
                        Text(
                            item.hour,
                            style = MaterialTheme.typography.labelSmall,
                            fontSize = 8.sp,
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                            modifier = Modifier.weight(1f)
                        )
                    } else {
                        Spacer(modifier = Modifier.weight(1f))
                    }
                }
            }
        }
    }
}

@Composable
private fun ServiceRankingList(
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
                        Text(item.name, style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Medium, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        Text(
                            "${item.count} atendimento(s) • ticket R$ %.2f".format(item.averageTicket),
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Column(horizontalAlignment = Alignment.End) {
                        Text(
                            "R$ %.0f".format(item.revenue),
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold,
                            color = AppColors.Success
                        )
                        if (item.share > 0) {
                            Text(
                                "%.1f%%".format(item.share * 100),
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
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

@Composable
private fun ClientRankingList(
    items: List<ClientRankingItem>,
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
                        Text("${item.visits} visita(s)", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    Column(horizontalAlignment = Alignment.End) {
                        Text(
                            "R$ %.0f".format(item.revenue),
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold,
                            color = AppColors.Success
                        )
                        item.lastVisit?.let {
                            Text(
                                it.take(10),
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
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
