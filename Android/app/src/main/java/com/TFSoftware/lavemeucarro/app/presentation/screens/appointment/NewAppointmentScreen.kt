package com.TFSoftware.lavemeucarro.app.presentation.screens.appointment

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.TFSoftware.lavemeucarro.app.data.models.CreateAgendamentoRequest
import com.TFSoftware.lavemeucarro.app.data.models.CreateVeiculoRequest
import com.TFSoftware.lavemeucarro.app.data.models.FuncionarioDto
import com.TFSoftware.lavemeucarro.app.data.models.ServicoDto
import com.TFSoftware.lavemeucarro.app.data.models.UnidadeDto
import com.TFSoftware.lavemeucarro.app.data.models.VeiculoDto
import com.TFSoftware.lavemeucarro.app.data.remote.LavaMeuCarroApi
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import javax.inject.Inject

// ==================== ViewModel ====================

data class AppointmentUiState(
    val unidade: UnidadeDto? = null,
    val services: List<ServicoDto> = emptyList(),
    val veiculos: List<VeiculoDto> = emptyList(),
    val funcionarios: List<FuncionarioDto> = emptyList(),
    val isLoading: Boolean = true,
    val isSubmitting: Boolean = false,
    val error: String? = null,
    val success: Boolean = false
)

@HiltViewModel
class NewAppointmentViewModel @Inject constructor(
    private val api: LavaMeuCarroApi
) : ViewModel() {
    private val _uiState = MutableStateFlow(AppointmentUiState())
    val uiState: StateFlow<AppointmentUiState> = _uiState

    fun loadData(unidadeId: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            try {
                val unidade = api.getUnidadeById(unidadeId)
                val services = api.getServicos(unidadeId).filter { it.ativo }
                val veiculos = api.getMyVeiculos()
                val funcionarios = api.getFuncionarios(unidadeId).filter { it.active }
                _uiState.value = _uiState.value.copy(
                    unidade = unidade,
                    services = services,
                    veiculos = veiculos,
                    funcionarios = funcionarios,
                    isLoading = false
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = e.message ?: "Erro ao carregar dados"
                )
            }
        }
    }

    fun submitAppointment(
        unidadeId: String,
        servicoId: String,
        veiculoId: String,
        data: String,
        hora: String,
        funcionarioId: String?,
        observacoes: String?,
        modalidade: String
    ) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSubmitting = true, error = null)
            try {
                api.createAgendamento(
                    CreateAgendamentoRequest(
                        unidadeId = unidadeId,
                        servicoId = servicoId,
                        veiculoId = veiculoId,
                        data = data,
                        hora = hora,
                        modalidade = modalidade,
                        observacoes = observacoes,
                        funcionarioId = funcionarioId
                    )
                )
                _uiState.value = _uiState.value.copy(isSubmitting = false, success = true)
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isSubmitting = false,
                    error = e.message ?: "Erro ao criar agendamento"
                )
            }
        }
    }

    fun addVehicleInline(
        placa: String, marca: String, modelo: String,
        cor: String?, tamanho: String?, ano: Int?,
        onAdded: (String) -> Unit
    ) {
        viewModelScope.launch {
            try {
                val veiculo = api.createVeiculo(
                    CreateVeiculoRequest(
                        placa = placa.uppercase().replace("-", "").trim(),
                        marca = marca, modelo = modelo,
                        cor = cor, tamanho = tamanho, ano = ano
                    )
                )
                val veiculos = api.getMyVeiculos()
                _uiState.value = _uiState.value.copy(veiculos = veiculos)
                onAdded(veiculo.id)
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(error = e.message ?: "Erro ao adicionar veículo")
            }
        }
    }
}

// ==================== Screen ====================

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NewAppointmentScreen(
    unidadeId: String,
    onBack: () -> Unit,
    viewModel: NewAppointmentViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    var selectedServicoId by remember { mutableStateOf<String?>(null) }
    var selectedDate by remember { mutableStateOf<LocalDate?>(null) }
    var selectedTime by remember { mutableStateOf<String?>(null) }
    var selectedVeiculoId by remember { mutableStateOf<String?>(null) }
    var selectedFuncionarioId by remember { mutableStateOf<String?>(null) }
    var observacoes by remember { mutableStateOf("") }
    var modalidade by remember { mutableStateOf("NoLocal") }
    var showSuccessDialog by remember { mutableStateOf(false) }
    var showInlineAddVehicle by remember { mutableStateOf(false) }

    LaunchedEffect(unidadeId) {
        viewModel.loadData(unidadeId)
    }

    LaunchedEffect(uiState.success) {
        if (uiState.success) showSuccessDialog = true
    }

    // Success dialog
    if (showSuccessDialog) {
        AlertDialog(
            onDismissRequest = { showSuccessDialog = false },
            icon = { Icon(Icons.Default.CheckCircle, null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(48.dp)) },
            title = { Text("Agendamento Confirmado!") },
            text = { Text("Seu agendamento foi criado com sucesso. Você pode acompanhá-lo na tela de Agendamentos.") },
            confirmButton = {
                Button(onClick = {
                    showSuccessDialog = false
                    onBack()
                }) { Text("OK") }
            }
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Novo Agendamento") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, "Voltar")
                    }
                }
            )
        },
        bottomBar = {
            if (!uiState.isLoading && uiState.error == null) {
                Surface(
                    tonalElevation = 2.dp,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    val selectedServico = uiState.services.find { it.id == selectedServicoId }
                    Column(modifier = Modifier.padding(16.dp)) {
                        selectedServico?.let {
                            Text(
                                "Total: R$ ${"%.2f".format(it.preco)}",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                        }
                        Button(
                            onClick = {
                                val sId = selectedServicoId
                                val vId = selectedVeiculoId
                                val d = selectedDate
                                val t = selectedTime
                                if (sId != null && vId != null && d != null && t != null) {
                                    viewModel.submitAppointment(
                                        unidadeId = unidadeId,
                                        servicoId = sId,
                                        veiculoId = vId,
                                        data = d.format(DateTimeFormatter.ISO_LOCAL_DATE),
                                        hora = t,
                                        funcionarioId = selectedFuncionarioId,
                                        observacoes = observacoes.takeIf { it.isNotBlank() },
                                        modalidade = modalidade
                                    )
                                }
                            },
                            modifier = Modifier.fillMaxWidth().height(48.dp),
                            enabled = selectedServicoId != null && selectedVeiculoId != null &&
                                    selectedDate != null && selectedTime != null && !uiState.isSubmitting
                        ) {
                            if (uiState.isSubmitting) {
                                CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                            } else {
                                Text("Confirmar Agendamento")
                            }
                        }
                    }
                }
            }
        }
    ) { padding ->
        if (uiState.isLoading) {
            Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        } else if (uiState.error != null && uiState.unidade == null) {
            Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(uiState.error!!, color = MaterialTheme.colorScheme.error)
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(onClick = { viewModel.loadData(unidadeId) }) { Text("Tentar novamente") }
                }
            }
        } else {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .verticalScroll(rememberScrollState())
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(20.dp)
            ) {
                // Unidade info header
                uiState.unidade?.let { unidade ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(unidade.nome, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                            unidade.address?.let {
                                Spacer(modifier = Modifier.height(4.dp))
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Default.LocationOn, null, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(it, style = MaterialTheme.typography.bodySmall)
                                }
                            }
                        }
                    }
                }

                // Service selection
                SectionTitle("1. Escolha o Serviço")
                if (uiState.services.isEmpty()) {
                    Text("Nenhum serviço disponível", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                } else {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        uiState.services.forEach { servico ->
                            ServiceCard(
                                servico = servico,
                                selected = selectedServicoId == servico.id,
                                onClick = { selectedServicoId = servico.id }
                            )
                        }
                    }
                }

                // Modalidade
                SectionTitle("2. Modalidade")
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterChip(
                        selected = modalidade == "NoLocal",
                        onClick = { modalidade = "NoLocal" },
                        label = { Text("No local") }
                    )
                    if (uiState.unidade?.ofereceLevaTraz == true) {
                        FilterChip(
                            selected = modalidade == "LevaTraz",
                            onClick = { modalidade = "LevaTraz" },
                            label = { Text("Leva e traz") }
                        )
                    }
                }

                // Date selection
                SectionTitle("3. Escolha a Data")
                DatePickerRow(
                    selectedDate = selectedDate,
                    onDateSelected = { selectedDate = it }
                )

                // Time selection
                SectionTitle("4. Escolha o Horário")
                TimePickerRow(
                    selectedTime = selectedTime,
                    onTimeSelected = { selectedTime = it }
                )

                // Vehicle selection
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    SectionTitle("5. Escolha o Veículo")
                    IconButton(onClick = { showInlineAddVehicle = true }) {
                        Icon(Icons.Default.Add, "Adicionar Veículo", tint = MaterialTheme.colorScheme.primary)
                    }
                }

                // Inline add vehicle form
                if (showInlineAddVehicle) {
                    InlineAddVehicleForm(
                        onAdd = { placa, marca, modelo, cor, tamanho, anoVal ->
                            viewModel.addVehicleInline(placa, marca, modelo, cor, tamanho, anoVal) { newId ->
                                selectedVeiculoId = newId
                                showInlineAddVehicle = false
                            }
                        },
                        onCancel = { showInlineAddVehicle = false }
                    )
                }

                if (uiState.veiculos.isEmpty() && !showInlineAddVehicle) {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text("Nenhum veículo cadastrado", fontWeight = FontWeight.Medium)
                            Spacer(modifier = Modifier.height(8.dp))
                            Button(onClick = { showInlineAddVehicle = true }) {
                                Icon(Icons.Default.Add, null, modifier = Modifier.size(18.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Adicionar Veículo")
                            }
                        }
                    }
                } else if (uiState.veiculos.isNotEmpty()) {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        uiState.veiculos.forEach { veiculo ->
                            VeiculoCard(
                                veiculo = veiculo,
                                selected = selectedVeiculoId == veiculo.id,
                                onClick = { selectedVeiculoId = veiculo.id }
                            )
                        }
                    }
                }

                // Funcionario selection (optional)
                if (uiState.funcionarios.isNotEmpty()) {
                    SectionTitle("6. Profissional (opcional)")
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        FilterChip(
                            selected = selectedFuncionarioId == null,
                            onClick = { selectedFuncionarioId = null },
                            label = { Text("Qualquer um") }
                        )
                        uiState.funcionarios.forEach { func ->
                            FilterChip(
                                selected = selectedFuncionarioId == func.id,
                                onClick = { selectedFuncionarioId = func.id },
                                label = { Text(func.nome) }
                            )
                        }
                    }
                }

                // Observations
                SectionTitle("Observações (opcional)")
                OutlinedTextField(
                    value = observacoes,
                    onValueChange = { observacoes = it },
                    label = { Text("Alguma observação?") },
                    modifier = Modifier.fillMaxWidth().height(100.dp),
                    maxLines = 4
                )

                // Error message
                uiState.error?.let {
                    if (!uiState.isSubmitting) {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)
                        ) {
                            Text(it, modifier = Modifier.padding(16.dp), color = MaterialTheme.colorScheme.onErrorContainer)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(80.dp)) // space for bottom bar
            }
        }
    }
}

// ==================== Composables ====================

@Composable
private fun SectionTitle(title: String) {
    Text(
        text = title,
        style = MaterialTheme.typography.titleMedium,
        fontWeight = FontWeight.SemiBold
    )
}

@Composable
private fun ServiceCard(
    servico: ServicoDto,
    selected: Boolean,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = if (selected) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surface
        ),
        border = if (selected) CardDefaults.outlinedCardBorder() else null
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(servico.nome, fontWeight = FontWeight.Medium)
                servico.descricao?.let {
                    Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                Text("${servico.duracaoMinutos} min", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Text(
                "R$ ${"%.2f".format(servico.preco)}",
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
        }
    }
}

@Composable
private fun DatePickerRow(
    selectedDate: LocalDate?,
    onDateSelected: (LocalDate) -> Unit
) {
    val today = remember { LocalDate.now() }
    val dates = remember { (0 until 14).map { today.plusDays(it.toLong()) } }
    val dayFormatter = remember { DateTimeFormatter.ofPattern("EEE") }
    val dateFormatter = remember { DateTimeFormatter.ofPattern("dd/MM") }

    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        items(dates) { date ->
            val isSelected = selectedDate == date
            Card(
                onClick = { onDateSelected(date) },
                colors = CardDefaults.cardColors(
                    containerColor = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surface
                )
            ) {
                Column(
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        date.dayOfWeek.getDisplayName(java.time.format.TextStyle.SHORT, java.util.Locale("pt", "BR")).replace(".", ""),
                        style = MaterialTheme.typography.labelSmall,
                        color = if (isSelected) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        date.format(dateFormatter),
                        fontWeight = FontWeight.Bold,
                        color = if (isSelected) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurface
                    )
                }
            }
        }
    }
}

@Composable
private fun TimePickerRow(
    selectedTime: String?,
    onTimeSelected: (String) -> Unit
) {
    // Generate time slots from 08:00 to 18:00 in 30-min intervals
    val timeSlots = remember {
        val slots = mutableListOf<String>()
        var time = LocalTime.of(8, 0)
        while (time.isBefore(LocalTime.of(18, 1))) {
            slots.add(time.format(DateTimeFormatter.ofPattern("HH:mm")))
            time = time.plusMinutes(30)
        }
        slots
    }

    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        items(timeSlots) { time ->
            val isSelected = selectedTime == time
            FilterChip(
                selected = isSelected,
                onClick = { onTimeSelected(time) },
                label = { Text(time) }
            )
        }
    }
}

@Composable
private fun VeiculoCard(
    veiculo: VeiculoDto,
    selected: Boolean,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = if (selected) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surface
        )
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                Icons.Default.DirectionsCar,
                null,
                modifier = Modifier.size(32.dp),
                tint = if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text(
                    "${veiculo.marca ?: ""} ${veiculo.modelo ?: ""}".trim().ifBlank { veiculo.placa },
                    fontWeight = FontWeight.Medium
                )
                Text(
                    listOfNotNull(
                        veiculo.placa,
                        veiculo.cor,
                        veiculo.tamanho,
                        veiculo.ano?.toString()
                    ).joinToString(" · "),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun InlineAddVehicleForm(
    onAdd: (placa: String, marca: String, modelo: String, cor: String?, tamanho: String?, ano: Int?) -> Unit,
    onCancel: () -> Unit
) {
    var placa by remember { mutableStateOf("") }
    var marca by remember { mutableStateOf("") }
    var modelo by remember { mutableStateOf("") }
    var cor by remember { mutableStateOf("") }
    var tamanho by remember { mutableStateOf("Hatch") }
    var ano by remember { mutableStateOf("") }
    val tamanhoOptions = listOf("Hatch", "Sedan", "SUV", "Pickup", "Van", "Moto")

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text("Novo Veículo", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
            OutlinedTextField(
                value = placa, onValueChange = { placa = it.uppercase() },
                label = { Text("Placa") }, singleLine = true, modifier = Modifier.fillMaxWidth()
            )
            OutlinedTextField(
                value = marca, onValueChange = { marca = it },
                label = { Text("Marca") }, singleLine = true, modifier = Modifier.fillMaxWidth()
            )
            OutlinedTextField(
                value = modelo, onValueChange = { modelo = it },
                label = { Text("Modelo") }, singleLine = true, modifier = Modifier.fillMaxWidth()
            )
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = cor, onValueChange = { cor = it },
                    label = { Text("Cor") }, singleLine = true,
                    modifier = Modifier.weight(1f)
                )
                OutlinedTextField(
                    value = ano, onValueChange = { ano = it.filter { c -> c.isDigit() }.take(4) },
                    label = { Text("Ano") }, singleLine = true,
                    modifier = Modifier.weight(1f)
                )
            }
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                tamanhoOptions.forEach { opt ->
                    FilterChip(
                        selected = tamanho == opt,
                        onClick = { tamanho = opt },
                        label = { Text(opt, style = MaterialTheme.typography.labelSmall) }
                    )
                }
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(
                    onClick = {
                        if (placa.isNotBlank() && marca.isNotBlank() && modelo.isNotBlank()) {
                            onAdd(placa, marca, modelo, cor.trim().takeIf { it.isNotBlank() }, tamanho, ano.toIntOrNull())
                        }
                    },
                    modifier = Modifier.weight(1f),
                    enabled = placa.isNotBlank() && marca.isNotBlank() && modelo.isNotBlank()
                ) { Text("Adicionar") }
                OutlinedButton(
                    onClick = onCancel,
                    modifier = Modifier.weight(1f)
                ) { Text("Cancelar") }
            }
        }
    }
}
