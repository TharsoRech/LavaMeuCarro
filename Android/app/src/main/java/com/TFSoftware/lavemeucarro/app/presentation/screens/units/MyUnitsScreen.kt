package com.TFSoftware.lavemeucarro.app.presentation.screens.units

import android.graphics.BitmapFactory
import android.net.Uri
import android.util.Base64
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.PullToRefreshBox
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.unit.IntOffset
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.TFSoftware.lavemeucarro.app.data.models.*
import com.TFSoftware.lavemeucarro.app.data.remote.LavaMeuCarroApi
import com.TFSoftware.lavemeucarro.app.managers.AuthManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import java.io.ByteArrayOutputStream
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
    val isRefreshing by viewModel.isRefreshing.collectAsState()
    val selectedUnit by viewModel.selectedUnit.collectAsState()
    val error by viewModel.error.collectAsState()

    // Enriched unit data (services + professionals counts per unit)
    val unitStats by viewModel.unitStats.collectAsState()

    var showCreateUnit by remember { mutableStateOf(false) }
    var showEditUnit by remember { mutableStateOf(false) }
    var showDeleteConfirm by remember { mutableStateOf(false) }
    var showServiceModal by remember { mutableStateOf(false) }
    var showFuncionarioModal by remember { mutableStateOf(false) }
    var showUnitDetail by remember { mutableStateOf(false) }
    var showOptionsModal by remember { mutableStateOf(false) } // ServiceOptionsModal (bottom sheet)

    // Create unit modal
    if (showCreateUnit) {
        UnitEditModal(
            unit = null,
            viewModel = viewModel,
            onDismiss = { showCreateUnit = false },
            onCreateSave = { request ->
                viewModel.createUnit(request)
                showCreateUnit = false
            },
            onUpdateSave = null
        )
    }

    // Edit unit modal
    if (showEditUnit && selectedUnit != null) {
        UnitEditModal(
            unit = selectedUnit!!,
            viewModel = viewModel,
            onDismiss = { showEditUnit = false; viewModel.clearSelectedUnit() },
            onCreateSave = null,
            onUpdateSave = { request ->
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
                showOptionsModal = false
                showDeleteConfirm = true
            },
            onAddService = {
                showServiceModal = true
            },
            onAddFuncionario = {
                showFuncionarioModal = true
            },
            onDeleteService = { serviceId ->
                viewModel.deleteService(serviceId)
            },
            onDeleteFuncionario = { funcId ->
                viewModel.deleteFuncionario(funcId)
            }
        )
    }

    // ServiceOptionsModal (bottom sheet for Edit/Delete - matching HoraDaBeleza)
    if (showOptionsModal && selectedUnit != null) {
        ServiceOptionsModal(
            unit = selectedUnit!!,
            onDismiss = { showOptionsModal = false; viewModel.clearSelectedUnit() },
            onEdit = {
                showOptionsModal = false
                showEditUnit = true
            },
            onDelete = {
                showOptionsModal = false
                showDeleteConfirm = true
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

    // Refresh on tab return (following HoraDaBeleza useFocusEffect pattern)
    val lifecycleOwner = LocalLifecycleOwner.current
    val isFirstFocus = remember { mutableStateOf(true) }
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) {
                if (isFirstFocus.value) {
                    isFirstFocus.value = false
                } else {
                    viewModel.loadData()
                }
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

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
            // Pull-to-refresh wrapper (following HoraDaBeleza refreshControl pattern)
            PullToRefreshBox(
                isRefreshing = isRefreshing,
                onRefresh = { viewModel.silentRefresh() },
                modifier = Modifier.fillMaxSize()
            ) {
                LazyColumn(
                    modifier = Modifier.fillMaxSize().padding(padding),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(units, key = { it.id }) { unit ->
                        val stats = unitStats[unit.id]
                        UnitCard(
                            unit = unit,
                            serviceCount = stats?.serviceCount ?: 0,
                            professionalCount = stats?.professionalCount ?: 0,
                            onClick = {
                                viewModel.selectUnit(unit)
                                // Open options modal (matching HoraDaBeleza admin flow)
                                showOptionsModal = true
                            }
                        )
                    }
                }
            } // End PullToRefreshBox
        }
    }
}

@Composable
private fun UnitCard(unit: UnidadeDto, serviceCount: Int, professionalCount: Int, onClick: () -> Unit) {
    val context = LocalContext.current
    val bitmap = remember(unit.logoUrl) {
        unit.logoUrl?.let { logo ->
            try {
                val base64Data = if (logo.startsWith("data:image")) {
                    logo.substringAfter("base64,")
                } else {
                    logo
                }
                val decoded = Base64.decode(base64Data, Base64.DEFAULT)
                BitmapFactory.decodeByteArray(decoded, 0, decoded.size)?.asImageBitmap()
            } catch (_: Exception) {
                null
            }
        }
    }

    Card(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Unit image or placeholder with status badge
            Box(modifier = Modifier.size(80.dp)) {
                if (bitmap != null) {
                    Image(
                        bitmap = bitmap,
                        contentDescription = unit.nome,
                        modifier = Modifier
                            .size(80.dp)
                            .clip(RoundedCornerShape(12.dp)),
                        contentScale = ContentScale.Crop
                    )
                } else {
                    Surface(
                        modifier = Modifier
                            .size(80.dp)
                            .clip(RoundedCornerShape(12.dp)),
                        color = MaterialTheme.colorScheme.surfaceVariant
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(Icons.Default.Store, null, modifier = Modifier.size(30.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                }
                
                // Status badge overlay
                Surface(
                    modifier = Modifier
                        .align(Alignment.BottomEnd)
                        .offset { IntOffset(4, 4) },
                    color = if (unit.published) Color(0xFF4CAF50) else Color(0xFFFF9800),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text(
                        if (unit.published) "Publicado" else "Rascunho",
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                        style = MaterialTheme.typography.labelSmall,
                        color = Color.White,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Spacer(modifier = Modifier.width(12.dp))
            
            Column(modifier = Modifier.weight(1f)) {
                Text(unit.nome, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                unit.address?.let {
                    Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
                Spacer(modifier = Modifier.height(6.dp))
                
                // Stats row: services + professionals
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.ContentCut, null, modifier = Modifier.size(14.dp), tint = MaterialTheme.colorScheme.primary)
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("$serviceCount Serviços", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, fontWeight = FontWeight.Medium)
                    }
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.People, null, modifier = Modifier.size(14.dp), tint = MaterialTheme.colorScheme.primary)
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("$professionalCount Profissionais", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, fontWeight = FontWeight.Medium)
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
    onAddFuncionario: () -> Unit,
    onDeleteService: (String) -> Unit,
    onDeleteFuncionario: (String) -> Unit
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
                        var showDeleteService by remember { mutableStateOf(false) }
                        if (showDeleteService) {
                            AlertDialog(
                                onDismissRequest = { showDeleteService = false },
                                title = { Text("Excluir Serviço") },
                                text = { Text("Deseja excluir \"${servico.nome}\"?") },
                                confirmButton = {
                                    Button(
                                        onClick = { onDeleteService(servico.id); showDeleteService = false },
                                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                                    ) { Text("Excluir") }
                                },
                                dismissButton = { TextButton(onClick = { showDeleteService = false }) { Text("Cancelar") } }
                            )
                        }
                        ListItem(
                            headlineContent = { Text(servico.nome, maxLines = 1, overflow = TextOverflow.Ellipsis) },
                            supportingContent = { Text("${servico.duracaoMinutos} min") },
                            trailingContent = {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text("R$ %.2f".format(servico.preco), fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                                    IconButton(onClick = { showDeleteService = true }, modifier = Modifier.size(32.dp)) {
                                        Icon(Icons.Default.Delete, "Excluir", tint = MaterialTheme.colorScheme.error, modifier = Modifier.size(18.dp))
                                    }
                                }
                            }
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
                        var showDeleteFunc by remember { mutableStateOf(false) }
                        if (showDeleteFunc) {
                            AlertDialog(
                                onDismissRequest = { showDeleteFunc = false },
                                title = { Text("Excluir Funcionário") },
                                text = { Text("Deseja excluir \"${func.nome}\"?") },
                                confirmButton = {
                                    Button(
                                        onClick = { onDeleteFuncionario(func.id); showDeleteFunc = false },
                                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                                    ) { Text("Excluir") }
                                },
                                dismissButton = { TextButton(onClick = { showDeleteFunc = false }) { Text("Cancelar") } }
                            )
                        }
                        ListItem(
                            headlineContent = { Text(func.nome) },
                            supportingContent = { func.specialty?.let { Text(it) } },
                            leadingContent = {
                                Surface(modifier = Modifier.size(32.dp), shape = MaterialTheme.shapes.small, color = MaterialTheme.colorScheme.secondaryContainer) {
                                    Box(contentAlignment = Alignment.Center) {
                                        Text(func.nome.firstOrNull()?.uppercase() ?: "?", color = MaterialTheme.colorScheme.onSecondaryContainer)
                                    }
                                }
                            },
                            trailingContent = {
                                IconButton(onClick = { showDeleteFunc = true }, modifier = Modifier.size(32.dp)) {
                                    Icon(Icons.Default.Delete, "Excluir", tint = MaterialTheme.colorScheme.error, modifier = Modifier.size(18.dp))
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
    viewModel: MyUnitsViewModel,
    onDismiss: () -> Unit,
    onCreateSave: ((CreateUnidadeRequest) -> Unit)?,
    onUpdateSave: ((UpdateUnidadeRequest) -> Unit)?
) {
    val context = LocalContext.current
    var name by remember { mutableStateOf(unit?.nome ?: "") }
    var description by remember { mutableStateOf(unit?.description ?: "") }
    var address by remember { mutableStateOf(unit?.address ?: "") }
    var number by remember { mutableStateOf(unit?.number ?: "") }
    var complement by remember { mutableStateOf(unit?.complement ?: "") }
    var neighborhood by remember { mutableStateOf(unit?.neighborhood ?: "") }
    var referencePoint by remember { mutableStateOf(unit?.referencePoint ?: "") }
    var city by remember { mutableStateOf(unit?.city ?: "") }
    var state by remember { mutableStateOf(unit?.state ?: "") }
    var zipCode by remember { mutableStateOf(unit?.zipCode ?: "") }
    var phone by remember { mutableStateOf(unit?.telefone ?: "") }
    var email by remember { mutableStateOf(unit?.email ?: "") }
    var whatsApp by remember { mutableStateOf(unit?.whatsApp ?: "") }
    var instagram by remember { mutableStateOf(unit?.instagramUrl ?: "") }
    var businessHours by remember { mutableStateOf(unit?.businessHours ?: "") }
    var ofereceLevaTraz by remember { mutableStateOf(unit?.ofereceLevaTraz ?: false) }
    var published by remember { mutableStateOf(unit?.published ?: false) }
    var logoBase64 by remember { mutableStateOf(unit?.logoUrl) }
    var galleryBase64 by remember { mutableStateOf<List<String>>(
        unit?.gallery?.let { galleryStr ->
            try {
                // Parse JSON array or comma-separated string
                if (galleryStr.startsWith("[")) {
                    val parsed = kotlinx.serialization.json.Json.decodeFromString<List<String>>(galleryStr)
                    parsed
                } else {
                    galleryStr.split(",").map { it.trim() }.filter { it.isNotBlank() }
                }
            } catch (_: Exception) {
                emptyList()
            }
        } ?: emptyList()
    ) }
    var latitude by remember { mutableStateOf(unit?.latitude) }
    var longitude by remember { mutableStateOf(unit?.longitude) }
    var addressValidated by remember { mutableStateOf(unit?.latitude != null && unit?.longitude != null) }
    var isCepLoading by remember { mutableStateOf(false) }
    var isGeocoding by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    val coroutineScope = rememberCoroutineScope()

    // Email validation (matching HoraDaBeleza real-time validation)
    val isEmailValid = email.isBlank() || android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()
    val showEmailValidation = email.isNotBlank()

    // Phone formatting helper (matching HoraDaBeleza format)
    fun formatPhone(value: String): String {
        val digits = value.replace("\\D".toRegex(), "")
        val match = Regex("^(\\d{2})(\\d{5})(\\d{4})$").find(digits)
        return if (match != null) {
            "(${match.groupValues[1]}) ${match.groupValues[2]}-${match.groupValues[3]}"
        } else if (digits.length > 2 && digits.length <= 6) {
            "(${digits.substring(0, 2)}) ${digits.substring(2)}"
        } else if (digits.length > 6) {
            "(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7)}"
        } else {
            digits
        }
    }

    fun handlePhoneChange(value: String, type: String): String {
        val digits = value.replace("\\D".toRegex(), "").take(11)
        return formatPhone(digits)
    }

    // Photo picker for cover photo
    val photoPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let {
            try {
                val inputStream = context.contentResolver.openInputStream(it)
                val bitmap = BitmapFactory.decodeStream(inputStream)
                inputStream?.close()
                val scaled = android.graphics.Bitmap.createScaledBitmap(bitmap, 600, 400, true)
                val baos = ByteArrayOutputStream()
                scaled.compress(android.graphics.Bitmap.CompressFormat.JPEG, 60, baos)
                logoBase64 = Base64.encodeToString(baos.toByteArray(), Base64.NO_WRAP)
            } catch (_: Exception) {}
        }
    }

    // Gallery photo picker (multiple selection)
    val galleryPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetMultipleContents()
    ) { uris: List<Uri> ->
        if (uris.isNotEmpty()) {
            val newGalleryImages = mutableListOf<String>()
            uris.forEach { uri ->
                try {
                    val inputStream = context.contentResolver.openInputStream(uri)
                    val bitmap = BitmapFactory.decodeStream(inputStream)
                    inputStream?.close()
                    val scaled = android.graphics.Bitmap.createScaledBitmap(bitmap, 800, 600, true)
                    val baos = ByteArrayOutputStream()
                    scaled.compress(android.graphics.Bitmap.CompressFormat.JPEG, 70, baos)
                    newGalleryImages.add(Base64.encodeToString(baos.toByteArray(), Base64.NO_WRAP))
                } catch (_: Exception) {}
            }
            galleryBase64 = galleryBase64 + newGalleryImages
        }
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (unit == null) "Criar Unidade" else "Editar Unidade") },
        text = {
            Column(
                modifier = Modifier.heightIn(max = 550.dp).verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Publication toggle
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Publicado", style = MaterialTheme.typography.labelLarge)
                    Switch(checked = published, onCheckedChange = { published = it })
                }

                // Cover photo
                Text("Foto de Capa *", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold)
                Row(verticalAlignment = Alignment.CenterVertically) {
                    OutlinedButton(onClick = { photoPickerLauncher.launch("image/*") }) {
                        Icon(Icons.Default.CameraAlt, null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(if (logoBase64 != null) "Trocar foto" else "Selecionar foto")
                    }
                    if (logoBase64 != null) {
                        Spacer(modifier = Modifier.width(8.dp))
                        Icon(Icons.Default.CheckCircle, null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(18.dp))
                    }
                }

                // Gallery photos
                Spacer(modifier = Modifier.height(8.dp))
                Text("Galeria de Fotos", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold)
                
                // Add gallery button
                OutlinedButton(onClick = { galleryPickerLauncher.launch("image/*") }) {
                    Icon(Icons.Default.Add, null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Adicionar fotos (${galleryBase64.size})")
                }
                
                // Gallery preview
                if (galleryBase64.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(8.dp))
                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.height(100.dp)
                    ) {
                        items(galleryBase64.size) { index ->
                            val base64 = galleryBase64[index]
                            val galleryBitmap = remember(base64) {
                                try {
                                    val decoded = Base64.decode(base64, Base64.DEFAULT)
                                    BitmapFactory.decodeByteArray(decoded, 0, decoded.size)
                                } catch (_: Exception) {
                                    null
                                }
                            }
                            
                            if (galleryBitmap != null) {
                                Box {
                                    Image(
                                        bitmap = galleryBitmap.asImageBitmap(),
                                        contentDescription = "Gallery photo ${index + 1}",
                                        modifier = Modifier
                                            .size(100.dp)
                                            .clip(RoundedCornerShape(8.dp)),
                                        contentScale = ContentScale.Crop
                                    )
                                    // Remove button
                                    IconButton(
                                        onClick = {
                                            galleryBase64 = galleryBase64.toMutableList().apply { removeAt(index) }
                                        },
                                        modifier = Modifier
                                            .align(Alignment.TopEnd)
                                            .size(24.dp)
                                    ) {
                                        Icon(
                                            Icons.Default.Close,
                                            null,
                                            tint = Color.White,
                                            modifier = Modifier.size(16.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Nome *") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = description, onValueChange = { description = it }, label = { Text("Descrição") }, modifier = Modifier.fillMaxWidth())

                // CEP with lookup button
                Text("Endereço", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold)
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = zipCode, onValueChange = { zipCode = it; addressValidated = false },
                        label = { Text("CEP") }, singleLine = true, modifier = Modifier.weight(1f)
                    )
                    Button(
                        onClick = {
                            coroutineScope.launch {
                                isCepLoading = true
                                val result = viewModel.lookupCep(zipCode)
                                isCepLoading = false
                                if (result != null) {
                                    address = result.street
                                    neighborhood = result.neighborhood
                                    city = result.city
                                    state = result.state
                                    if (result.latitude != null) latitude = result.latitude
                                    if (result.longitude != null) longitude = result.longitude
                                    if (result.latitude != null && result.longitude != null) addressValidated = true
                                }
                            }
                        },
                        enabled = !isCepLoading && zipCode.replace("\\D".toRegex(), "").length == 8
                    ) {
                        if (isCepLoading) CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                        else Text("Buscar")
                    }
                }

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(value = address, onValueChange = { address = it; addressValidated = false }, label = { Text("Logradouro") }, modifier = Modifier.weight(1f), singleLine = true)
                    OutlinedTextField(value = number, onValueChange = { number = it }, label = { Text("Nº") }, modifier = Modifier.width(80.dp), singleLine = true)
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(value = complement, onValueChange = { complement = it }, label = { Text("Complemento") }, modifier = Modifier.weight(1f), singleLine = true)
                    OutlinedTextField(value = referencePoint, onValueChange = { referencePoint = it }, label = { Text("Referência") }, modifier = Modifier.weight(1f), singleLine = true)
                }
                OutlinedTextField(value = neighborhood, onValueChange = { neighborhood = it; addressValidated = false }, label = { Text("Bairro") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(value = city, onValueChange = { city = it; addressValidated = false }, label = { Text("Cidade") }, modifier = Modifier.weight(1f), singleLine = true)
                    OutlinedTextField(value = state, onValueChange = { state = it.uppercase(); addressValidated = false }, label = { Text("UF") }, modifier = Modifier.width(80.dp), singleLine = true)
                }

                // Validate address / geocode button
                OutlinedButton(
                    onClick = {
                        coroutineScope.launch {
                            isGeocoding = true
                            val result = viewModel.geocodeAddress(address, city, state, zipCode)
                            isGeocoding = false
                            if (result != null) {
                                latitude = result.latitude
                                longitude = result.longitude
                                city = result.city
                                state = result.state
                                addressValidated = true
                            }
                        }
                    },
                    enabled = !isGeocoding && address.isNotBlank() && city.isNotBlank() && state.isNotBlank()
                ) {
                    if (isGeocoding) {
                        CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Validando...")
                    } else if (addressValidated) {
                        Icon(Icons.Default.CheckCircle, null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Endereço validado")
                    } else {
                        Icon(Icons.Default.LocationOn, null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Validar endereço e coordenadas")
                    }
                }

                if (latitude != null && longitude != null) {
                    Text(
                        "Coordenadas: %.6f, %.6f".format(latitude!!, longitude!!),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                HorizontalDivider()
                Text("Contato", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold)
                
                // Phone with formatting
                Text("Telefone de Contato *", style = MaterialTheme.typography.labelMedium)
                OutlinedTextField(
                    value = phone, 
                    onValueChange = { phone = handlePhoneChange(it, "phone") },
                    label = { Text("(XX) XXXXX-XXXX") }, 
                    singleLine = true, 
                    modifier = Modifier.fillMaxWidth()
                )
                
                Text("WhatsApp Business", style = MaterialTheme.typography.labelMedium)
                OutlinedTextField(
                    value = whatsApp, 
                    onValueChange = { whatsApp = handlePhoneChange(it, "whatsapp") },
                    label = { Text("(XX) XXXXX-XXXX") }, 
                    singleLine = true, 
                    modifier = Modifier.fillMaxWidth()
                )
                
                OutlinedTextField(value = instagram, onValueChange = { instagram = it }, label = { Text("Instagram") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                
                // Email with real-time validation feedback
                OutlinedTextField(
                    value = email, 
                    onValueChange = { email = it.replace("\\s+".toRegex(), "").trim().lowercase() }, 
                    label = { Text("E-mail da Unidade") }, 
                    singleLine = true, 
                    modifier = Modifier.fillMaxWidth(),
                    isError = showEmailValidation && !isEmailValid,
                    trailingIcon = {
                        if (showEmailValidation) {
                            Icon(
                                if (isEmailValid) Icons.Default.CheckCircle else Icons.Default.Error,
                                null,
                                tint = if (isEmailValid) Color(0xFF4CAF50) else MaterialTheme.colorScheme.error
                            )
                        }
                    }
                )
                if (showEmailValidation) {
                    Text(
                        if (isEmailValid) "✓ E-mail válido" else "E-mail inválido",
                        fontSize = 12.sp,
                        color = if (isEmailValid) Color(0xFF4CAF50) else MaterialTheme.colorScheme.error
                    )
                }
                
                OutlinedTextField(value = businessHours, onValueChange = { businessHours = it }, label = { Text("Horário de funcionamento") }, singleLine = true, modifier = Modifier.fillMaxWidth())
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
                    if (email.isNotBlank() && !isEmailValid) {
                        error = "E-mail inválido"
                        return@Button
                    }
                    if (onCreateSave != null) {
                        onCreateSave(
                            CreateUnidadeRequest(
                                name = name,
                                description = description.ifBlank { null },
                                logoUrl = logoBase64,
                                gallery = if (galleryBase64.isNotEmpty()) {
                                    // Convert to JSON array string
                                    "[${galleryBase64.joinToString(",") { "\"$it\"" }}]"
                                } else {
                                    null
                                },
                                address = address.ifBlank { null },
                                number = number.ifBlank { null },
                                complement = complement.ifBlank { null },
                                neighborhood = neighborhood.ifBlank { null },
                                referencePoint = referencePoint.ifBlank { null },
                                city = city.ifBlank { null },
                                state = state.ifBlank { null },
                                zipCode = zipCode.ifBlank { null },
                                latitude = latitude,
                                longitude = longitude,
                                phone = phone.ifBlank { null },
                                email = email.ifBlank { null },
                                businessHours = businessHours.ifBlank { null },
                                whatsApp = whatsApp.ifBlank { null },
                                instagramUrl = instagram.ifBlank { null },
                                ofereceLevaTraz = ofereceLevaTraz
                            )
                        )
                    } else if (onUpdateSave != null) {
                        onUpdateSave(
                            UpdateUnidadeRequest(
                                name = name,
                                description = description.ifBlank { null },
                                logoUrl = logoBase64,
                                gallery = if (galleryBase64.isNotEmpty()) {
                                    // Convert to JSON array string
                                    "[${galleryBase64.joinToString(",") { "\"$it\"" }}]"
                                } else {
                                    "[]" // Send empty array to clear gallery
                                },
                                address = address.ifBlank { null },
                                number = number.ifBlank { null },
                                complement = complement.ifBlank { null },
                                neighborhood = neighborhood.ifBlank { null },
                                referencePoint = referencePoint.ifBlank { null },
                                city = city.ifBlank { null },
                                state = state.ifBlank { null },
                                zipCode = zipCode.ifBlank { null },
                                latitude = latitude,
                                longitude = longitude,
                                phone = phone.ifBlank { null },
                                email = email.ifBlank { null },
                                businessHours = businessHours.ifBlank { null },
                                whatsApp = whatsApp.ifBlank { null },
                                instagramUrl = instagram.ifBlank { null },
                                published = published,
                                ofereceLevaTraz = ofereceLevaTraz
                            )
                        )
                    }
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
    private val authManager: AuthManager,
    private val viaCepApi: com.TFSoftware.lavemeucarro.app.data.remote.ViaCepApi,
    private val awesomeCepApi: com.TFSoftware.lavemeucarro.app.data.remote.AwesomeCepApi,
    private val nominatimApi: com.TFSoftware.lavemeucarro.app.data.remote.NominatimApi
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

    private val _isRefreshing = MutableStateFlow(false)
    val isRefreshing: StateFlow<Boolean> = _isRefreshing

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error

    // Background enrichment: service/professional counts per unit (matching HoraDaBeleza N+1 pattern)
    private val _unitStats = MutableStateFlow<Map<String, UnitStats>>(emptyMap())
    val unitStats: StateFlow<Map<String, UnitStats>> = _unitStats

    init { loadUnits() }

    fun loadUnits() {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                _units.value = api.getMyUnidades()
                // Enrich with background N+1 queries (matching HoraDaBeleza pattern)
                enrichUnitStats()
            } catch (e: Exception) {
                _error.value = "Erro ao carregar unidades: ${e.message}"
            }
            _isLoading.value = false
        }
    }

    // Silent refresh for pull-to-refresh
    fun silentRefresh() {
        viewModelScope.launch {
            _isRefreshing.value = true
            try {
                _units.value = api.getMyUnidades()
                enrichUnitStats()
            } catch (_: Exception) {
            }
            _isRefreshing.value = false
        }
    }

    // Alias for lifecycle-based refresh
    fun loadData() = silentRefresh()

    // Background enrichment: fetch service & professional counts in parallel (matching HoraDaBeleza Promise.allSettled)
    private fun enrichUnitStats() {
        viewModelScope.launch {
            val currentUnits = _units.value
            if (currentUnits.isEmpty()) return@launch

            val enrichedStats = mutableMapOf<String, UnitStats>()

            currentUnits.forEach { unit ->
                val serviceCount = try {
                    val services = api.getServicos(unit.id)
                    services.size
                } catch (_: Exception) {
                    0
                }

                val professionalCount = try {
                    val funcs = api.getFuncionarios(unit.id)
                    funcs.size
                } catch (_: Exception) {
                    0
                }

                enrichedStats[unit.id] = UnitStats(serviceCount, professionalCount)
            }

            _unitStats.value = enrichedStats
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
            try {
                api.createUnidade(request)
                loadUnits()
            } catch (e: Exception) {
                _error.value = "Erro ao criar unidade: ${e.message}"
            }
        }
    }

    fun updateUnit(id: String, request: UpdateUnidadeRequest) {
        viewModelScope.launch {
            try {
                api.updateUnidade(id, request)
                loadUnits()
            } catch (e: Exception) {
                _error.value = "Erro ao atualizar unidade: ${e.message}"
            }
        }
    }

    fun deleteUnit(id: String) {
        viewModelScope.launch {
            try { 
                api.deleteUnidade(id)
                loadUnits() 
            } catch (_: Exception) {}
        }
    }

    fun createService(request: CreateServicoRequest) {
        viewModelScope.launch {
            try {
                api.createServico(request.unidadeId, request)
                _selectedUnit.value?.let { loadUnitDetails(it.id) }
            } catch (_: Exception) {}
        }
    }

    fun deleteService(serviceId: String) {
        viewModelScope.launch {
            try {
                val unidadeId = _selectedUnit.value?.id ?: return@launch
                api.deleteServico(unidadeId, serviceId)
                loadUnitDetails(unidadeId)
            } catch (_: Exception) {}
        }
    }

    fun addFuncionario(unidadeId: String, nome: String, specialty: String?) {
        viewModelScope.launch {
            try {
                val body = com.TFSoftware.lavemeucarro.app.data.models.CreateFuncionarioRequest(
                    nome = nome,
                    specialty = specialty,
                    unidadeId = unidadeId,
                    active = true
                )
                api.createFuncionario(body)
                loadUnitDetails(unidadeId)
            } catch (e: Exception) {
                _error.value = e.message ?: "Erro ao adicionar funcion\u00e1rio"
            }
        }
    }

    fun deleteFuncionario(funcionarioId: String) {
        viewModelScope.launch {
            try {
                api.deleteFuncionario(funcionarioId)
                _selectedUnit.value?.let { loadUnitDetails(it.id) }
            } catch (_: Exception) {}
        }
    }

    // CEP lookup: tries AwesomeAPI first (has coords), falls back to ViaCEP
    suspend fun lookupCep(cep: String): CepLookupResult? {
        val digits = cep.replace("\\D".toRegex(), "")
        if (digits.length != 8) return null

        // Try AwesomeAPI first (returns lat/lng)
        try {
            val aw = awesomeCepApi.getCep(digits)
            if (aw.address != null || aw.address_name != null) {
                val lat = aw.lat?.toDoubleOrNull()
                val lng = aw.lng?.toDoubleOrNull()
                return CepLookupResult(
                    street = aw.address ?: aw.address_name ?: "",
                    neighborhood = aw.district ?: "",
                    city = aw.city ?: "",
                    state = (aw.state ?: "").uppercase(),
                    latitude = lat,
                    longitude = lng
                )
            }
        } catch (_: Exception) {}

        // Fallback to ViaCEP (no coords)
        try {
            val vc = viaCepApi.getCep(digits)
            if (vc.localidade != null) {
                return CepLookupResult(
                    street = vc.logradouro ?: "",
                    neighborhood = vc.bairro ?: "",
                    city = vc.localidade ?: "",
                    state = (vc.uf ?: "").uppercase(),
                    latitude = null,
                    longitude = null
                )
            }
        } catch (_: Exception) {}

        return null
    }

    // Geocode address via Nominatim (multi-strategy)
    suspend fun geocodeAddress(street: String, city: String, state: String, zipCode: String?): GeocodingResult? {
        // Strategy 1: by postal code
        if (zipCode != null && zipCode.replace("\\D".toRegex(), "").length == 8) {
            try {
                val results = nominatimApi.search(postalCode = zipCode.replace("\\D".toRegex(), ""))
                if (results.isNotEmpty()) {
                    val r = results[0]
                    val apiCity = r.address?.city ?: r.address?.town ?: r.address?.village ?: city
                    val apiUf = normalizeUf(r.address?.state ?: r.address?.state_code ?: state)
                    val lat = r.lat?.toDoubleOrNull() ?: return null
                    val lon = r.lon?.toDoubleOrNull() ?: return null
                    return GeocodingResult(
                        latitude = lat,
                        longitude = lon,
                        city = apiCity,
                        state = apiUf
                    )
                }
            } catch (_: Exception) {}
        }

        // Strategy 2: street + city + state
        if (street.isNotBlank() && city.isNotBlank() && state.isNotBlank()) {
            try {
                val query = "$street, $city, $state, Brasil"
                val results = nominatimApi.search(query = query)
                if (results.isNotEmpty()) {
                    val r = results[0]
                    val apiCity = r.address?.city ?: r.address?.town ?: r.address?.village ?: city
                    val apiUf = normalizeUf(r.address?.state ?: r.address?.state_code ?: state)
                    val lat = r.lat?.toDoubleOrNull() ?: return null
                    val lon = r.lon?.toDoubleOrNull() ?: return null
                    return GeocodingResult(
                        latitude = lat,
                        longitude = lon,
                        city = apiCity,
                        state = apiUf
                    )
                }
            } catch (_: Exception) {}
        }

        // Strategy 3: city + state only
        if (city.isNotBlank() && state.isNotBlank()) {
            try {
                val query = "$city, $state, Brasil"
                val results = nominatimApi.search(query = query)
                if (results.isNotEmpty()) {
                    val r = results[0]
                    val apiCity = r.address?.city ?: r.address?.town ?: r.address?.village ?: city
                    val apiUf = normalizeUf(r.address?.state ?: r.address?.state_code ?: state)
                    val lat = r.lat?.toDoubleOrNull() ?: return null
                    val lon = r.lon?.toDoubleOrNull() ?: return null
                    return GeocodingResult(
                        latitude = lat,
                        longitude = lon,
                        city = apiCity,
                        state = apiUf
                    )
                }
            } catch (_: Exception) {}
        }

        return null
    }

    private fun normalizeUf(value: String): String {
        val v = value.trim().uppercase()
        if (v.length == 2 && v.all { it.isLetter() }) return v
        val stateMap = mapOf(
            "SAO PAULO" to "SP", "RIO DE JANEIRO" to "RJ", "MINAS GERAIS" to "MG",
            "BAHIA" to "BA", "PARANA" to "PR", "RIO GRANDE DO SUL" to "RS",
            "SANTA CATARINA" to "SC", "PERNAMBUCO" to "PE", "CEARA" to "CE",
            "PARA" to "PA", "MARANHAO" to "MA", "GOIAS" to "GO",
            "AMAZONAS" to "AM", "ESPIRITO SANTO" to "ES", "PARAIBA" to "PB",
            "RIO GRANDE DO NORTE" to "RN", "ALAGOAS" to "AL", "PIAUI" to "PI",
            "MATO GROSSO" to "MT", "MATO GROSSO DO SUL" to "MS",
            "SERGIPE" to "SE", "RONDONIA" to "RO", "TOCANTINS" to "TO",
            "ACRE" to "AC", "AMAPA" to "AP", "RORAIMA" to "RR",
            "DISTRITO FEDERAL" to "DF"
        )
        for ((key, uf) in stateMap) {
            if (v.contains(key)) return uf
        }
        return v
    }
}

// ServiceOptionsModal (bottom sheet for Edit/Delete - matching HoraDaBeleza)
@Composable
private fun ServiceOptionsModal(
    unit: UnidadeDto,
    onDismiss: () -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = MaterialTheme.colorScheme.surface
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp, vertical = 24.dp)
        ) {
            // Title
            Text(
                "Gerenciar Unidade",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            Text(
                unit.nome,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(top = 4.dp)
            )
            
            Spacer(modifier = Modifier.height(24.dp))
            
            // Edit option
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable {
                        onEdit()
                    }
                    .padding(vertical = 16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    modifier = Modifier.size(40.dp),
                    shape = MaterialTheme.shapes.medium,
                    color = Color(0xFFE3F2FD)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            Icons.Default.Edit,
                            null,
                            tint = Color(0xFF1976D2),
                            modifier = Modifier.size(22.dp)
                        )
                    }
                }
                Spacer(modifier = Modifier.width(16.dp))
                Text(
                    "Editar Unidade",
                    style = MaterialTheme.typography.bodyLarge,
                    modifier = Modifier.weight(1f)
                )
            }
            
            // Delete option
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable {
                        onDelete()
                    }
                    .padding(vertical = 16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    modifier = Modifier.size(40.dp),
                    shape = MaterialTheme.shapes.medium,
                    color = Color(0xFFFFEBEE)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            Icons.Default.Delete,
                            null,
                            tint = Color(0xFFD32F2F),
                            modifier = Modifier.size(22.dp)
                        )
                    }
                }
                Spacer(modifier = Modifier.width(16.dp))
                Text(
                    "Remover Unidade",
                    style = MaterialTheme.typography.bodyLarge,
                    color = Color(0xFFD32F2F),
                    modifier = Modifier.weight(1f)
                )
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            HorizontalDivider()
            
            // Cancel button
            TextButton(
                onClick = onDismiss,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 8.dp)
            ) {
                Text("Cancelar")
            }
        }
    }
}

data class CepLookupResult(
    val street: String,
    val neighborhood: String,
    val city: String,
    val state: String,
    val latitude: Double?,
    val longitude: Double?
)

data class GeocodingResult(
    val latitude: Double,
    val longitude: Double,
    val city: String,
    val state: String
)

// Background enrichment stats (matching HoraDaBeleza N+1 enrichment pattern)
data class UnitStats(
    val serviceCount: Int,
    val professionalCount: Int
)
