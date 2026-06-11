package com.TFSoftware.lavemeucarro.app.presentation.screens.reports

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.TFSoftware.lavemeucarro.app.data.models.*
import com.TFSoftware.lavemeucarro.app.data.remote.LavaMeuCarroApi
import com.TFSoftware.lavemeucarro.app.presentation.theme.AppColors
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import java.util.concurrent.atomic.AtomicInteger
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
    val customFrom by viewModel.customFrom.collectAsState()
    val customTo by viewModel.customTo.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val isRefreshing by viewModel.isRefreshing.collectAsState()
    val error by viewModel.error.collectAsState()
    val loadingStage by viewModel.loadingStage.collectAsState()
    val loadingProgress by viewModel.loadingProgress.collectAsState()
    val context = androidx.compose.ui.platform.LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current

    var showDatePicker by remember { mutableStateOf(false) }
    var dateRangeFrom by remember { mutableStateOf<java.time.LocalDate?>(null) }
    var dateRangeTo by remember { mutableStateOf<java.time.LocalDate?>(null) }

    // Refresh on tab return (following HoraDaBeleza useFocusEffect pattern)
    val isFirstFocus = remember { mutableStateOf(true) }
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) {
                if (isFirstFocus.value) {
                    isFirstFocus.value = false
                } else {
                    viewModel.silentRefresh()
                }
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    LaunchedEffect(Unit) { viewModel.loadData() }

    // Date range picker dialog
    if (showDatePicker) {
        DateRangePickerDialog(
            onDismiss = { showDatePicker = false },
            onConfirm = { from, to ->
                viewModel.setCustomDateRange(from, to)
                showDatePicker = false
            }
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Relatórios") }
            )
        }
    ) { padding ->
        PullToRefreshBox(
            isRefreshing = isRefreshing,
            onRefresh = { viewModel.silentRefresh() },
            modifier = Modifier.fillMaxSize()
        ) {
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
                listOf("7d" to "7d", "30d" to "30d", "90d" to "90d", "365d" to "1a").forEach { (value, label) ->
                    FilterChip(
                        selected = selectedPeriod == value,
                        onClick = { viewModel.clearCustomDateRange(); viewModel.selectPeriod(value) },
                        label = { Text(label, fontSize = 11.sp) }
                    )
                }
                // Custom date range button
                FilterChip(
                    selected = selectedPeriod == "custom",
                    onClick = { showDatePicker = true },
                    label = {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.DateRange, null, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Personalizado", fontSize = 11.sp)
                        }
                    }
                )
            }

            // Custom date range indicator
            if (selectedPeriod == "custom" && customFrom != null) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        "${customFrom} até ${customTo ?: "hoje"}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.weight(1f)
                    )
                    TextButton(onClick = { viewModel.clearCustomDateRange() }) {
                        Text("Limpar", fontSize = 12.sp)
                    }
                }
            }

            // PDF export button
            if (report != null) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                    horizontalArrangement = Arrangement.End
                ) {
                    OutlinedButton(
                        onClick = {
                            val r = report!!
                            generateAndSharePdf(context, r)
                        }
                    ) {
                        Icon(Icons.Default.PictureAsPdf, null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Exportar PDF")
                    }
                }
            }

            // Unit selector with horizontal chips
            if (units.isNotEmpty()) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState())
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    units.forEach { unit ->
                        val isSelected = unit.id.toString() == selectedUnitId
                        FilterChip(
                            selected = isSelected,
                            onClick = { viewModel.selectUnit(unit.id.toString()) },
                            label = { Text(unit.nome, fontSize = 12.sp, maxLines = 1) }
                        )
                    }
                }
                Spacer(modifier = Modifier.height(8.dp))
            }

            when {
                isLoading && report == null -> {
                    Card(
                        modifier = Modifier.fillMaxWidth().padding(24.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                    ) {
                        Column(
                            modifier = Modifier.padding(24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            CircularProgressIndicator(modifier = Modifier.size(48.dp))
                            Spacer(modifier = Modifier.height(16.dp))
                            Text(
                                loadingStage,
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                            
                            // Progress bar
                            LinearProgressIndicator(
                                progress = { loadingProgress / 100f },
                                modifier = Modifier.fillMaxWidth()
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                            
                            // Cancel button
                            OutlinedButton(
                                onClick = { viewModel.cancelLoading() },
                                modifier = Modifier.align(Alignment.CenterHorizontally)
                            ) {
                                Icon(Icons.Default.Close, null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Cancelar carregamento", fontSize = 12.sp)
                            }
                        }
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

                    // === 6 Summary Cards with enhanced info ===
                    SectionTitle("Resumo")
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        MetricCard(
                            title = "Faturamento",
                            value = "R$ %.0f".format(r.totalRevenue),
                            helper = "Agendado: R$ %.0f".format(r.scheduledRevenue),
                            icon = Icons.Default.AttachMoney,
                            color = AppColors.Success,
                            modifier = Modifier.weight(1f)
                        )
                        MetricCard(
                            title = "Clientes",
                            value = r.uniqueClients.toString(),
                            helper = "${r.newClients} novos",
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
                            helper = "${r.completedAppointments} concluídos",
                            icon = Icons.Default.CalendarMonth,
                            modifier = Modifier.weight(1f)
                        )
                        MetricCard(
                            title = "Ticket Médio",
                            value = "R$ %.2f".format(r.averageTicket),
                            helper = "Perdido: R$ %.0f".format(r.lostRevenue),
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
                            helper = "${r.servicesCount} serviços",
                            icon = Icons.Default.Badge,
                            modifier = Modifier.weight(1f)
                        )
                        MetricCard(
                            title = "Saúde Operacional",
                            value = "%.0f%%".format(r.completionRate),
                            helper = "No-show %.1f%%".format(r.noShowRate),
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
    helper: String? = null,
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
            if (helper != null) {
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    helper,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f),
                    fontSize = 10.sp
                )
            }
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

    private val _customFrom = MutableStateFlow<String?>(null)
    val customFrom: StateFlow<String?> = _customFrom
    private val _customTo = MutableStateFlow<String?>(null)
    val customTo: StateFlow<String?> = _customTo

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    private val _isRefreshing = MutableStateFlow(false)
    val isRefreshing: StateFlow<Boolean> = _isRefreshing

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error

    private val _loadingStage = MutableStateFlow("Preparando consulta...")
    val loadingStage: StateFlow<String> = _loadingStage

    private val _loadingProgress = MutableStateFlow(0)
    val loadingProgress: StateFlow<Int> = _loadingProgress

    private val latestLoadRequestRef = AtomicInteger(0)

    fun loadData() {
        viewModelScope.launch {
            val requestId = latestLoadRequestRef.incrementAndGet()
            _isLoading.value = true
            _error.value = null
            _loadingStage.value = "Preparando consulta..."
            _loadingProgress.value = 8

            try {
                _loadingStage.value = "Carregando unidades..."
                _loadingProgress.value = 20
                val unitsDeferred = async { api.getMyUnidades() }

                _loadingStage.value = "Carregando dados do relatório..."
                _loadingProgress.value = 50
                val reportDeferred = async {
                    api.getBusinessReport(
                        period = _selectedPeriod.value,
                        unidadeId = _selectedUnitId.value,
                        from = _customFrom.value,
                        to = _customTo.value
                    )
                }

                _loadingStage.value = "Consolidando indicadores e gráficos..."
                _loadingProgress.value = 92

                if (requestId != latestLoadRequestRef.get()) return@launch

                _units.value = unitsDeferred.await()
                _report.value = reportDeferred.await()
                _loadingProgress.value = 100
            } catch (e: Exception) {
                if (requestId != latestLoadRequestRef.get()) return@launch
                _error.value = "Erro ao carregar relatório: ${e.message}"
            }
            _isLoading.value = false
        }
    }

    fun silentRefresh() {
        viewModelScope.launch {
            _isRefreshing.value = true
            try {
                val unitsDeferred = async { api.getMyUnidades() }
                val reportDeferred = async {
                    api.getBusinessReport(
                        period = _selectedPeriod.value,
                        unidadeId = _selectedUnitId.value,
                        from = _customFrom.value,
                        to = _customTo.value
                    )
                }
                _units.value = unitsDeferred.await()
                _report.value = reportDeferred.await()
            } catch (_: Exception) {
                // Silent fail for refresh
            }
            _isRefreshing.value = false
        }
    }

    fun cancelLoading() {
        latestLoadRequestRef.incrementAndGet()
        _isLoading.value = false
        _isRefreshing.value = false
        _loadingStage.value = "Carregamento cancelado."
        _loadingProgress.value = 0
    }

    fun selectPeriod(period: String) {
        _selectedPeriod.value = period
        loadData()
    }

    fun selectUnit(unitId: String?) {
        _selectedUnitId.value = unitId
        loadData()
    }

    fun setCustomDateRange(from: String, to: String) {
        _customFrom.value = from
        _customTo.value = to
        _selectedPeriod.value = "custom"
        loadData()
    }

    fun clearCustomDateRange() {
        _customFrom.value = null
        _customTo.value = null
        _selectedPeriod.value = "30d"
        loadData()
    }
}

// ==================== Date Range Picker Dialog ====================
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DateRangePickerDialog(
    onDismiss: () -> Unit,
    onConfirm: (from: String, to: String) -> Unit
) {
    var from by remember { mutableStateOf<java.time.LocalDate?>(null) }
    var to by remember { mutableStateOf<java.time.LocalDate?>(null) }
    var pickingEnd by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (!pickingEnd) "Data Inicial" else "Data Final") },
        text = {
            Column {
                if (!pickingEnd) {
                    val datePickerState = rememberDatePickerState(
                        initialSelectedDateMillis = from?.atStartOfDay(java.time.ZoneOffset.UTC)?.toInstant()?.toEpochMilli()
                    )
                    DatePicker(state = datePickerState)
                    LaunchedEffect(datePickerState.selectedDateMillis) {
                        datePickerState.selectedDateMillis?.let {
                            from = java.time.Instant.ofEpochMilli(it).atZone(java.time.ZoneOffset.UTC).toLocalDate()
                        }
                    }
                } else {
                    val datePickerState = rememberDatePickerState(
                        initialSelectedDateMillis = to?.atStartOfDay(java.time.ZoneOffset.UTC)?.toInstant()?.toEpochMilli()
                    )
                    DatePicker(state = datePickerState)
                    LaunchedEffect(datePickerState.selectedDateMillis) {
                        datePickerState.selectedDateMillis?.let {
                            to = java.time.Instant.ofEpochMilli(it).atZone(java.time.ZoneOffset.UTC).toLocalDate()
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (!pickingEnd && from != null) {
                        pickingEnd = true
                    } else if (pickingEnd && to != null && from != null) {
                        onConfirm(from!!.toString(), to!!.toString())
                        onDismiss()
                    }
                },
                enabled = if (!pickingEnd) from != null else to != null
            ) {
                Text(if (!pickingEnd) "Próximo" else "Confirmar")
            }
        },
        dismissButton = {
            Row {
                if (pickingEnd) {
                    TextButton(onClick = { pickingEnd = false }) { Text("Voltar") }
                }
                TextButton(onClick = onDismiss) { Text("Cancelar") }
            }
        }
    )
}

// ==================== PDF Generation ====================
fun generateAndSharePdf(context: android.content.Context, report: BusinessReportDto) {
    try {
        val pdfDocument = android.graphics.pdf.PdfDocument()
        val pageInfo = android.graphics.pdf.PdfDocument.PageInfo.Builder(595, 842, 1).create()
        val page = pdfDocument.startPage(pageInfo)
        val canvas = page.canvas
        val titlePaint = android.graphics.Paint().apply {
            color = android.graphics.Color.parseColor("#1a1a1a")
            textSize = 24f
            isAntiAlias = true
            typeface = android.graphics.Typeface.DEFAULT_BOLD
        }
        val bodyPaint = android.graphics.Paint().apply {
            color = android.graphics.Color.parseColor("#333333")
            textSize = 14f
            isAntiAlias = true
        }
        val headerPaint = android.graphics.Paint().apply {
            color = android.graphics.Color.parseColor("#2563EB")
            textSize = 18f
            isAntiAlias = true
            typeface = android.graphics.Typeface.DEFAULT_BOLD
        }

        var y = 60f
        canvas.drawText("Relatório LavaMeuCarro", 40f, y, titlePaint)
        y += 40f

        // Summary section
        canvas.drawText("Resumo", 40f, y, headerPaint)
        y += 30f
        canvas.drawText("Faturamento Total: R$ %.2f".format(report.totalRevenue), 40f, y, bodyPaint); y += 25f
        canvas.drawText("Total de Agendamentos: ${report.totalAppointments}", 40f, y, bodyPaint); y += 25f
        canvas.drawText("Clientes Únicos: ${report.uniqueClients}", 40f, y, bodyPaint); y += 25f
        canvas.drawText("Ticket Médio: R$ %.2f".format(report.averageTicket), 40f, y, bodyPaint); y += 25f
        canvas.drawText("Taxa de Cancelamento: %.1f%%".format(report.cancellationRate), 40f, y, bodyPaint); y += 25f
        canvas.drawText("Profissionais: ${report.professionalsCount}", 40f, y, bodyPaint); y += 25f
        canvas.drawText("Serviços: ${report.servicesCount}", 40f, y, bodyPaint); y += 40f

        // Services ranking
        if (report.servicesRanking.isNotEmpty()) {
            canvas.drawText("Top Serviços", 40f, y, headerPaint); y += 30f
            report.servicesRanking.take(5).forEach { s ->
                canvas.drawText("${s.name} - ${s.count} agendamentos - R$ %.0f".format(s.revenue), 40f, y, bodyPaint); y += 22f
            }
            y += 20f
        }

        // Insights
        if (report.insights.isNotEmpty()) {
            if (y > 700f) { y = 60f } // simple page break
            canvas.drawText("Insights", 40f, y, headerPaint); y += 30f
            report.insights.forEach { insight ->
                canvas.drawText("• $insight", 40f, y, bodyPaint); y += 22f
            }
        }

        pdfDocument.finishPage(page)

        val file = java.io.File(context.cacheDir, "relatorio_lavemeucarro.pdf")
        file.outputStream().use { pdfDocument.writeTo(it) }
        pdfDocument.close()

        val uri = androidx.core.content.FileProvider.getUriForFile(
            context,
            "${context.packageName}.fileprovider",
            file
        )
        val shareIntent = android.content.Intent(android.content.Intent.ACTION_SEND).apply {
            type = "application/pdf"
            putExtra(android.content.Intent.EXTRA_STREAM, uri)
            addFlags(android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        context.startActivity(android.content.Intent.createChooser(shareIntent, "Compartilhar Relatório"))
    } catch (e: Exception) {
        e.printStackTrace()
    }
}
