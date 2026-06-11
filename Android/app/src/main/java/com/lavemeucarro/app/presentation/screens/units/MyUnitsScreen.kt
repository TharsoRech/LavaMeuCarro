package com.lavemeucarro.app.presentation.screens.units

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
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
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.lavemeucarro.app.data.models.*
import com.lavemeucarro.app.data.remote.LavaMeuCarroApi
import com.lavemeucarro.app.managers.AuthManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MyUnitsScreen(
    modifier: Modifier = Modifier,
    viewModel: MyUnitsViewModel = hiltViewModel()
) {
    val units by viewModel.units.collectAsState()
    val services by viewModel.services.collectAsState()
    val funcionarios by viewModel.funcionarios.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val selectedUnit by viewModel.selectedUnit.collectAsState()
    val error by viewModel.error.collectAsState()

    var showCreateUnit by remember { mutableStateOf(false) }
    var showEditUnit by remember { mutableStateOf(false) }
    var showDeleteConfirm by remember { mutableStateOf(false) }
    var showServiceModal by remember { mutableStateOf(false) }
    var showFuncionarioModal by remember { mutableStateOf(false) }
    var showUnitDetail by remember { mutableStateOf(false) }

    // Create unit modal
    if (showCreateUnit) {
        UnitEditModal(
            unit = null,
            onDismiss = { showCreateUnit = false },
            onSave = { request ->
                viewModel.createUnit(request)
                showCreateUnit = false
            }
        )
    }

    // Edit unit modal
    if (showEditUnit && selectedUnit != null) {
        UnitEditModal(
            unit = selectedUnit!!,
            onDismiss = { showEditUnit = false; viewModel.clearSelectedUnit() },
            onSave = { request ->
                viewModel.updateUnit(selectedUnit!!.id, request)
                showEditUnit = false
                viewModel.clearSelectedUnit()
            }
        )
    }

    // Delete confirmation
    if (showDeleteConfirm && selectedUnit != null) {
        AlertDialog(
            onDismissRequest = { showDeleteConfirm = false; viewModel.clearSelectedUnit() },
            title = { Text("Excluir Unidade") },
            text = { Text("Deseja realmente excluir \"${selectedUnit!!.nome}\"? Esta ação não pode ser desfeita.") },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.deleteUnit(selectedUnit!!.id)
                        showDeleteConfirm = false
                        viewModel.clearSelectedUnit()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                ) { Text("Excluir") }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteConfirm = false; viewModel.clearSelectedUnit() }) { Text("Cancelar") }
            }
        )
    }

    // Unit detail view
    if (showUnitDetail && selectedUnit != null) {
        UnitDetailModal(
            unit = selectedUnit!!,
            services = services.filter { it.unidadeId == selectedUnit?.id },
            funcionarios = funcionarios.filter { it.unidadeId == selectedUnit?.id },
            onDismiss = { showUnitDetail = false; viewModel.clearSelectedUnit() },
            onEdit = {
                showUnitDetail = false
                showEditUnit = true
            },
            onDelete = {
                showUnitDetail = false
                showDeleteConfirm = true
            },
            onAddService = {
                showServiceModal = true
            },
            onAddFuncionario = {
                showFuncionarioModal = true
            }
        )
    }

    // Service modal
    if (showServiceModal && selectedUnit != null) {
        ServiceEditModal(
            unidadeId = selectedUnit!!.id,
            onDismiss = { showServiceModal = false },
            onSave = { request ->
                viewModel.createService(request)
                showServiceModal = false
            }
        )
    }

    // Funcionario modal
    if (showFuncionarioModal && selectedUnit != null) {
        FuncionarioEditModal(
            unidadeId = selectedUnit!!.id,
            onDismiss = { showFuncionarioModal = false },
            onSave = { nome, specialty ->
                viewModel.addFuncionario(selectedUnit!!.id, nome, specialty)
                showFuncionarioModal = false
            }
        )
    }

    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(error) {
        error?.let {
            snackbarHostState.showSnackbar(it)
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            TopAppBar(
                title = { Text("Minhas Unidades") },
                actions = {
                    IconButton(onClick = { showCreateUnit = true }) {
                        Icon(Icons.Default.Add, "Criar unidade")
                    }
                }
            )
        }
    ) { padding ->
        if (isLoading && units.isEmpty()) {
            Box(
                modifier = Modifier.fillMaxSize().padding(padding),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        } else if (units.isEmpty()) {
            Box(
                modifier = Modifier.fillMaxSize().padding(padding),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        Icons.Default.Store,
                        null,
                        modifier = Modifier.size(64.dp),
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text("Nenhuma unidade cadastrada", style = MaterialTheme.typography.titleMedium)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        "Toque + para criar sua primeira unidade",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(onClick = { showCreateUnit = true }) {
                        Icon(Icons.Default.Add, null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Criar Unidade")
                    }
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize().padding(padding),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(units, key = { it.id }) { unit ->
                    UnitCard(
                        unit = unit,
                        onClick = {
                            viewModel.selectUnit(unit)
                            viewModel.loadUnitDetails(unit.id)
                            showUnitDetail = true
                        }
                    )
                }
            }
        }
    }
}

@Composable
private fun UnitCard(unit: UnidadeDto, onClick: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Surface(
                modifier = Modifier.size(48.dp),
                shape = MaterialTheme.shapes.medium,
                color = MaterialTheme.colorScheme.primaryContainer
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(Icons.Default.Store, null, tint = MaterialTheme.colorScheme.primary)
                }
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(unit.nome, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                unit.address?.let {
                    Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    if (unit.published) {
                        Surface(color = MaterialTheme.colorScheme.primaryContainer, shape = MaterialTheme.shapes.small) {
                            Text("Publicado", modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onPrimaryContainer)
                        }
                    } else {
                        Surface(color = MaterialTheme.colorScheme.surfaceVariant, shape = MaterialTheme.shapes.small) {
                            Text("Rascunho", modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp), style = MaterialTheme.typography.labelSmall)
                        }
                    }
                    if (unit.ofereceLevaTraz) {
                        Spacer(modifier = Modifier.width(8.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.LocalShipping, null, modifier = Modifier.size(14.dp), tint = MaterialTheme.colorScheme.primary)
                            Spacer(modifier = Modifier.width(2.dp))
                            Text("Leva e traz", fontSize = 11.sp, color = MaterialTheme.colorScheme.primary)
                        }
                    }
                }
            }
            Icon(Icons.Default.ChevronRight, null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun UnitDetailModal(
    unit: UnidadeDto,
    services: List<ServicoDto>,
    funcionarios: List<FuncionarioDto>,
    onDismiss: () -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit,
    onAddService: () -> Unit,
    onAddFuncionario: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(unit.nome, modifier = Modifier.weight(1f))
                Row {
                    IconButton(onClick = onEdit) { Icon(Icons.Default.Edit, "Editar") }
                    IconButton(onClick = onDelete) { Icon(Icons.Default.Delete, "Excluir", tint = MaterialTheme.colorScheme.error) }
                }
            }
        },
        text = {
            Column(modifier = Modifier.heightIn(max = 500.dp).verticalScroll(rememberScrollState())) {
                // Unit info
                unit.address?.let {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.LocationOn, null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(it, style = MaterialTheme.typography.bodyMedium)
                    }
                }
                unit.telefone?.let {
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Phone, null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(it, style = MaterialTheme.typography.bodyMedium)
                    }
                }
                unit.email?.let {
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Email, null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(it, style = MaterialTheme.typography.bodyMedium)
                    }
                }
                unit.description?.let {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(it, style = MaterialTheme.typography.bodyMedium)
                }
                unit.horarioAbertura?.let { open ->
                    unit.horarioFechamento?.let { close ->
                        Spacer(modifier = Modifier.height(4.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Schedule, null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("$open - $close", style = MaterialTheme.typography.bodyMedium)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))
                HorizontalDivider()

                // Services section
                Spacer(modifier = Modifier.height(16.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Serviços (${services.size})", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                    TextButton(onClick = onAddService) { Icon(Icons.Default.Add, null, modifier = Modifier.size(18.dp)); Spacer(modifier = Modifier.width(4.dp)); Text("Adicionar") }
                }
                if (services.isEmpty()) {
                    Text("Nenhum serviço cadastrado", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                } else {
                    services.forEach { servico ->
                        ListItem(
                            headlineContent = { Text(servico.nome, maxLines = 1, overflow = TextOverflow.Ellipsis) },
                            supportingContent = { Text("${servico.duracaoMinutos} min") },
                            trailingContent = { Text("R$ %.2f".format(servico.preco), fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary) }
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))
                HorizontalDivider()

                // Funcionarios section
                Spacer(modifier = Modifier.height(16.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Funcionários (${funcionarios.size})", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                    TextButton(onClick = onAddFuncionario) { Icon(Icons.Default.Add, null, modifier = Modifier.size(18.dp)); Spacer(modifier = Modifier.width(4.dp)); Text("Adicionar") }
                }
                if (funcionarios.isEmpty()) {
                    Text("Nenhum funcionário cadastrado", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                } else {
                    funcionarios.forEach { func ->
                        ListItem(
                            headlineContent = { Text(func.nome) },
                            supportingContent = { func.specialty?.let { Text(it) } },
                            leadingContent = {
                                Surface(modifier = Modifier.size(32.dp), shape = MaterialTheme.shapes.small, color = MaterialTheme.colorScheme.secondaryContainer) {
                                    Box(contentAlignment = Alignment.Center) {
                                        Text(func.nome.firstOrNull()?.uppercase() ?: "?", color = MaterialTheme.colorScheme.onSecondaryContainer)
                                    }
                                }
                            }
                        )
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) { Text("Fechar") }
        }
    )
}

@Composable
private fun UnitEditModal(
    unit: UnidadeDto?,
    onDismiss: () -> Unit,
    onSave: (CreateUnidadeRequest) -> Unit
) {
    var name by remember { mutableStateOf(unit?.nome ?: "") }
    var description by remember { mutableStateOf(unit?.description ?: "") }
    var address by remember { mutableStateOf(unit?.address ?: "") }
    var number by remember { mutableStateOf(unit?.number ?: "") }
    var neighborhood by remember { mutableStateOf(unit?.neighborhood ?: "") }
    var city by remember { mutableStateOf(unit?.city ?: "") }
    var state by remember { mutableStateOf(unit?.state ?: "") }
    var zipCode by remember { mutableStateOf(unit?.zipCode ?: "") }
    var phone by remember { mutableStateOf(unit?.telefone ?: "") }
    var email by remember { mutableStateOf(unit?.email ?: "") }
    var whatsApp by remember { mutableStateOf(unit?.whatsApp ?: "") }
    var instagram by remember { mutableStateOf(unit?.instagramUrl ?: "") }
    var horarioAbertura by remember { mutableStateOf(unit?.horarioAbertura ?: "08:00") }
    var horarioFechamento by remember { mutableStateOf(unit?.horarioFechamento ?: "18:00") }
    var ofereceLevaTraz by remember { mutableStateOf(unit?.ofereceLevaTraz ?: false) }
    var error by remember { mutableStateOf<String?>(null) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (unit == null) "Criar Unidade" else "Editar Unidade") },
        text = {
            Column(
                modifier = Modifier.heightIn(max = 500.dp).verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Nome *") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = description, onValueChange = { description = it }, label = { Text("Descrição") }, modifier = Modifier.fillMaxWidth())
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(value = address, onValueChange = { address = it }, label = { Text("Endereço") }, modifier = Modifier.weight(1f), singleLine = true)
                    OutlinedTextField(value = number, onValueChange = { number = it }, label = { Text("Nº") }, modifier = Modifier.width(80.dp), singleLine = true)
                }
                OutlinedTextField(value = neighborhood, onValueChange = { neighborhood = it }, label = { Text("Bairro") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(value = city, onValueChange = { city = it }, label = { Text("Cidade") }, modifier = Modifier.weight(1f), singleLine = true)
                    OutlinedTextField(value = state, onValueChange = { state = it }, label = { Text("UF") }, modifier = Modifier.width(80.dp), singleLine = true)
                }
                OutlinedTextField(value = zipCode, onValueChange = { zipCode = it }, label = { Text("CEP") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = phone, onValueChange = { phone = it }, label = { Text("Telefone") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = email, onValueChange = { email = it }, label = { Text("Email") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = whatsApp, onValueChange = { whatsApp = it }, label = { Text("WhatsApp") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = instagram, onValueChange = { instagram = it }, label = { Text("Instagram") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(value = horarioAbertura, onValueChange = { horarioAbertura = it }, label = { Text("Abertura") }, modifier = Modifier.weight(1f), singleLine = true)
                    OutlinedTextField(value = horarioFechamento, onValueChange = { horarioFechamento = it }, label = { Text("Fechamento") }, modifier = Modifier.weight(1f), singleLine = true)
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(checked = ofereceLevaTraz, onCheckedChange = { ofereceLevaTraz = it })
                    Text("Oferece leva e traz")
                }
                error?.let {
                    Text(it, color = MaterialTheme.colorScheme.error, fontSize = 12.sp)
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (name.isBlank()) {
                        error = "Nome é obrigatório"
                        return@Button
                    }
                    onSave(
                        CreateUnidadeRequest(
                            name = name,
                            description = description.ifBlank { null },
                            address = address.ifBlank { null },
                            number = number.ifBlank { null },
                            neighborhood = neighborhood.ifBlank { null },
                            city = city.ifBlank { null },
                            state = state.ifBlank { null },
                            zipCode = zipCode.ifBlank { null },
                            phone = phone.ifBlank { null },
                            email = email.ifBlank { null },
                            whatsApp = whatsApp.ifBlank { null },
                            instagramUrl = instagram.ifBlank { null },
                            schedulingTimeOptions = "$horarioAbertura-$horarioFechamento",
                            ofereceLevaTraz = ofereceLevaTraz
                        )
                    )
                }
            ) { Text(if (unit == null) "Criar" else "Salvar") }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancelar") }
        }
    )
}

@Composable
private fun ServiceEditModal(
    unidadeId: String,
    onDismiss: () -> Unit,
    onSave: (CreateServicoRequest) -> Unit
) {
    var nome by remember { mutableStateOf("") }
    var descricao by remember { mutableStateOf("") }
    var preco by remember { mutableStateOf("") }
    var duracao by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Adicionar Serviço") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = nome, onValueChange = { nome = it }, label = { Text("Nome do serviço *") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = descricao, onValueChange = { descricao = it }, label = { Text("Descrição") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = preco, onValueChange = { preco = it }, label = { Text("Preço (R$)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = duracao, onValueChange = { duracao = it }, label = { Text("Duração (minutos)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                error?.let { Text(it, color = MaterialTheme.colorScheme.error, fontSize = 12.sp) }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val precoVal = preco.replace(",", ".").toDoubleOrNull()
                    val duracaoVal = duracao.toIntOrNull()
                    when {
                        nome.isBlank() -> error = "Nome é obrigatório"
                        precoVal == null -> error = "Preço inválido"
                        duracaoVal == null -> error = "Duração inválida"
                        else -> onSave(CreateServicoRequest(
                            nome = nome,
                            descricao = descricao.ifBlank { null },
                            preco = precoVal,
                            duracaoMinutos = duracaoVal,
                            unidadeId = unidadeId
                        ))
                    }
                }
            ) { Text("Adicionar") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancelar") } }
    )
}

@Composable
private fun FuncionarioEditModal(
    unidadeId: String,
    onDismiss: () -> Unit,
    onSave: (String, String?) -> Unit
) {
    var nome by remember { mutableStateOf("") }
    var specialty by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Adicionar Funcionário") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = nome, onValueChange = { nome = it }, label = { Text("Nome *") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = specialty, onValueChange = { specialty = it }, label = { Text("Especialidade") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                error?.let { Text(it, color = MaterialTheme.colorScheme.error, fontSize = 12.sp) }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (nome.isBlank()) {
                        error = "Nome é obrigatório"
                        return@Button
                    }
                    onSave(nome, specialty.ifBlank { null })
                }
            ) { Text("Adicionar") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancelar") } }
    )
}

@HiltViewModel
class MyUnitsViewModel @Inject constructor(
    private val api: LavaMeuCarroApi,
    private val authManager: AuthManager
) : ViewModel() {
    private val _units = MutableStateFlow<List<UnidadeDto>>(emptyList())
    val units: StateFlow<List<UnidadeDto>> = _units

    private val _services = MutableStateFlow<List<ServicoDto>>(emptyList())
    val services: StateFlow<List<ServicoDto>> = _services

    private val _funcionarios = MutableStateFlow<List<FuncionarioDto>>(emptyList())
    val funcionarios: StateFlow<List<FuncionarioDto>> = _funcionarios

    private val _selectedUnit = MutableStateFlow<UnidadeDto?>(null)
    val selectedUnit: StateFlow<UnidadeDto?> = _selectedUnit

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error

    init { loadUnits() }

    fun loadUnits() {
        viewModelScope.launch {
            _isLoading.value = true
            try { _units.value = api.getMyUnidades() } catch (_: Exception) {}
            _isLoading.value = false
        }
    }

    fun selectUnit(unit: UnidadeDto) { _selectedUnit.value = unit }
    fun clearSelectedUnit() { _selectedUnit.value = null }

    fun loadUnitDetails(unitId: String) {
        viewModelScope.launch {
            try {
                val servicos = api.getServicos(unitId)
                _services.value = _services.value + servicos.filter { s -> _services.value.none { it.id == s.id } }
            } catch (_: Exception) {}
            try {
                val funcs = api.getFuncionarios(unitId)
                _funcionarios.value = _funcionarios.value + funcs.filter { f -> _funcionarios.value.none { it.id == f.id } }
            } catch (_: Exception) {}
        }
    }

    fun createUnit(request: CreateUnidadeRequest) {
        viewModelScope.launch {
            try { api.createUnidade(request); loadUnits() } catch (_: Exception) {}
        }
    }

    fun updateUnit(id: String, request: CreateUnidadeRequest) {
        viewModelScope.launch {
            try {
                api.updateUnidade(id, UpdateUnidadeRequest(
                    name = request.name,
                    description = request.description,
                    address = request.address,
                    city = request.city,
                    state = request.state,
                    phone = request.phone
                ))
                loadUnits()
            } catch (_: Exception) {}
        }
    }

    fun deleteUnit(id: String) {
        viewModelScope.launch {
            try { api.deleteUnidade(id); loadUnits() } catch (_: Exception) {}
        }
    }

    fun createService(request: CreateServicoRequest) {
        viewModelScope.launch {
            try {
                api.createServico(request)
                _selectedUnit.value?.let { loadUnitDetails(it.id) }
            } catch (_: Exception) {}
        }
    }

    fun addFuncionario(unidadeId: String, nome: String, specialty: String?) {
        viewModelScope.launch {
            try {
                val body = com.lavemeucarro.app.data.models.CreateFuncionarioRequest(
                    nome = nome,
                    specialty = specialty,
                    unidadeId = unidadeId,
                    active = true
                )
                api.createFuncionario(body)
                loadUnitDetails(unidadeId)
            } catch (e: Exception) {
                _error.value = e.message ?: "Erro ao adicionar funcionário"
            }
        }
    }
}
