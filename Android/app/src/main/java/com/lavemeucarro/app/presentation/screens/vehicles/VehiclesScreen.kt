package com.lavemeucarro.app.presentation.screens.vehicles

import android.graphics.BitmapFactory
import android.util.Base64
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.lavemeucarro.app.data.models.CreateVeiculoRequest
import com.lavemeucarro.app.data.models.UpdateVeiculoRequest
import com.lavemeucarro.app.data.models.VeiculoDto
import com.lavemeucarro.app.data.remote.LavaMeuCarroApi
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

// ==================== ViewModel ====================

@HiltViewModel
class VehiclesViewModel @Inject constructor(private val api: LavaMeuCarroApi) : ViewModel() {
    private val _vehicles = MutableStateFlow<List<VeiculoDto>>(emptyList())
    val vehicles: StateFlow<List<VeiculoDto>> = _vehicles
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading
    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error

    init { loadVehicles() }

    fun loadVehicles() {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            try { _vehicles.value = api.getMyVeiculos() } catch (e: Exception) { _error.value = e.message }
            _isLoading.value = false
        }
    }

    fun addVehicle(request: CreateVeiculoRequest, onSuccess: () -> Unit = {}) {
        viewModelScope.launch {
            _isLoading.value = true
            try { api.createVeiculo(request); loadVehicles(); onSuccess() } catch (e: Exception) { _error.value = e.message; _isLoading.value = false }
        }
    }

    fun updateVehicle(id: String, request: UpdateVeiculoRequest, onSuccess: () -> Unit = {}) {
        viewModelScope.launch {
            _isLoading.value = true
            try { api.updateVeiculo(id, request); loadVehicles(); onSuccess() } catch (e: Exception) { _error.value = e.message; _isLoading.value = false }
        }
    }

    fun deleteVehicle(id: String) {
        viewModelScope.launch {
            try { api.deleteVeiculo(id); loadVehicles() } catch (e: Exception) { _error.value = e.message }
        }
    }
}

// ==================== Screen ====================

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VehiclesScreen(
    modifier: Modifier = Modifier,
    onBack: () -> Unit,
    viewModel: VehiclesViewModel = hiltViewModel()
) {
    val vehicles by viewModel.vehicles.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val error by viewModel.error.collectAsState()

    var showFormModal by remember { mutableStateOf(false) }
    var editingVehicle by remember { mutableStateOf<VeiculoDto?>(null) }
    var showDeleteConfirm by remember { mutableStateOf<VeiculoDto?>(null) }

    // Form state
    var placa by remember { mutableStateOf("") }
    var marca by remember { mutableStateOf("") }
    var modelo by remember { mutableStateOf("") }
    var cor by remember { mutableStateOf("") }
    var ano by remember { mutableStateOf("") }
    var tamanho by remember { mutableStateOf("Hatch") }
    var fotoBase64 by remember { mutableStateOf<String?>(null) }

    val tamanhoOptions = listOf("Hatch", "Sedan", "SUV", "Pickup", "Van", "Moto")

    val imagePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri ->
        uri?.let {
            try {
                val inputStream = androidx.activity.compose.LocalContext.current.contentResolver.openInputStream(it)
                val bytes = inputStream?.readBytes()
                if (bytes != null) {
                    fotoBase64 = Base64.encodeToString(bytes, Base64.NO_WRAP)
                }
            } catch (_: Exception) {}
        }
    }

    fun openAddForm() {
        editingVehicle = null
        placa = ""; marca = ""; modelo = ""; cor = ""; ano = ""; tamanho = "Hatch"; fotoBase64 = null
        showFormModal = true
    }

    fun openEditForm(veiculo: VeiculoDto) {
        editingVehicle = veiculo
        placa = veiculo.placa
        marca = veiculo.marca ?: ""
        modelo = veiculo.modelo ?: ""
        cor = veiculo.cor ?: ""
        ano = veiculo.ano?.toString() ?: ""
        tamanho = veiculo.tamanho ?: "Hatch"
        fotoBase64 = veiculo.fotoBase64
        showFormModal = true
    }

    fun submitForm() {
        if (placa.isBlank() || marca.isBlank() || modelo.isBlank()) return
        if (editingVehicle != null) {
            viewModel.updateVehicle(
                editingVehicle!!.id,
                UpdateVeiculoRequest(
                    placa = placa.uppercase().replace("-", "").trim(),
                    marca = marca.trim(),
                    modelo = modelo.trim(),
                    cor = cor.trim().takeIf { it.isNotBlank() },
                    tamanho = tamanho,
                    ano = ano.toIntOrNull(),
                    fotoBase64 = fotoBase64
                )
            ) { showFormModal = false }
        } else {
            viewModel.addVehicle(
                CreateVeiculoRequest(
                    placa = placa.uppercase().replace("-", "").trim(),
                    marca = marca.trim(),
                    modelo = modelo.trim(),
                    cor = cor.trim().takeIf { it.isNotBlank() },
                    tamanho = tamanho,
                    ano = ano.toIntOrNull(),
                    fotoBase64 = fotoBase64
                )
            ) { showFormModal = false }
        }
    }

    // Delete confirmation dialog
    showDeleteConfirm?.let { veiculo ->
        AlertDialog(
            onDismissRequest = { showDeleteConfirm = null },
            title = { Text("Excluir Veículo") },
            text = { Text("Deseja excluir ${veiculo.marca} ${veiculo.modelo} (${veiculo.placa})?") },
            confirmButton = {
                Button(
                    onClick = { viewModel.deleteVehicle(veiculo.id); showDeleteConfirm = null },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                ) { Text("Excluir") }
            },
            dismissButton = { TextButton(onClick = { showDeleteConfirm = null }) { Text("Cancelar") } }
        )
    }

    // Add/Edit form modal
    if (showFormModal) {
        ModalBottomSheet(
            onDismissRequest = { showFormModal = false },
            sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp)
                    .padding(bottom = 32.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = if (editingVehicle != null) "Editar Veículo" else "Novo Veículo",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )

                // Photo section
                Box(
                    modifier = Modifier
                        .size(100.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.surfaceVariant)
                        .clickable { imagePickerLauncher.launch("image/*") },
                    contentAlignment = Alignment.Center
                ) {
                    if (fotoBase64 != null) {
                        try {
                            val bytes = Base64.decode(fotoBase64, Base64.DEFAULT)
                            val bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
                            Image(
                                bitmap = bitmap.asImageBitmap(),
                                contentDescription = "Foto do veículo",
                                modifier = Modifier.fillMaxSize(),
                                contentScale = ContentScale.Crop
                            )
                        } catch (_: Exception) {
                            Icon(Icons.Default.CameraAlt, null, modifier = Modifier.size(40.dp))
                        }
                    } else {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(Icons.Default.CameraAlt, null, modifier = Modifier.size(32.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                            Text("Foto", style = MaterialTheme.typography.labelSmall)
                        }
                    }
                }

                OutlinedTextField(
                    value = placa, onValueChange = { placa = it.uppercase() },
                    label = { Text("Placa") }, singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = marca, onValueChange = { marca = it },
                    label = { Text("Marca") }, singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = modelo, onValueChange = { modelo = it },
                    label = { Text("Modelo") }, singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = cor, onValueChange = { cor = it },
                    label = { Text("Cor") }, singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = ano, onValueChange = { ano = it.filter { c -> c.isDigit() }.take(4) },
                    label = { Text("Ano") }, singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                // Tamanho selector
                Text("Tamanho", style = MaterialTheme.typography.labelLarge)
                Row(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    tamanhoOptions.forEach { opt ->
                        FilterChip(
                            selected = tamanho == opt,
                            onClick = { tamanho = opt },
                            label = { Text(opt, style = MaterialTheme.typography.labelSmall) }
                        )
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                Button(
                    onClick = { submitForm() },
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                    enabled = placa.isNotBlank() && marca.isNotBlank() && modelo.isNotBlank() && !isLoading
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                    } else {
                        Text(if (editingVehicle != null) "Salvar Alterações" else "Adicionar Veículo")
                    }
                }

                error?.let {
                    Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
                }
            }
        }
    }

    // Main screen
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Meus Veículos") },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, "Voltar") } }
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = { openAddForm() }) {
                Icon(Icons.Default.Add, "Adicionar")
            }
        }
    ) { padding ->
        if (isLoading && vehicles.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        } else if (vehicles.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Default.DirectionsCar, null, modifier = Modifier.size(64.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(modifier = Modifier.height(16.dp))
                    Text("Nenhum veículo cadastrado", style = MaterialTheme.typography.titleMedium)
                    Text("Toque + para adicionar", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize().padding(padding),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(vehicles, key = { it.id }) { vehicle ->
                    Card(
                        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            // Vehicle photo or default icon
                            if (vehicle.fotoBase64 != null) {
                                try {
                                    val bytes = Base64.decode(vehicle.fotoBase64, Base64.DEFAULT)
                                    val bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
                                    Image(
                                        bitmap = bitmap.asImageBitmap(),
                                        contentDescription = null,
                                        modifier = Modifier.size(56.dp).clip(RoundedCornerShape(8.dp)),
                                        contentScale = ContentScale.Crop
                                    )
                                } catch (_: Exception) {
                                    DefaultVehicleIcon()
                                }
                            } else {
                                DefaultVehicleIcon()
                            }

                            Spacer(modifier = Modifier.width(12.dp))

                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    "${vehicle.marca ?: ""} ${vehicle.modelo ?: ""}".trim(),
                                    fontWeight = FontWeight.Bold,
                                    style = MaterialTheme.typography.bodyLarge
                                )
                                Text(
                                    "Placa: ${vehicle.placa}",
                                    style = MaterialTheme.typography.bodySmall
                                )
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    vehicle.cor?.let { Text("Cor: $it", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant) }
                                    vehicle.ano?.let { Text("Ano: $it", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant) }
                                    vehicle.tamanho?.let { Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant) }
                                }
                            }

                            // Edit button
                            IconButton(onClick = { openEditForm(vehicle) }) {
                                Icon(Icons.Default.Edit, "Editar", tint = MaterialTheme.colorScheme.primary)
                            }
                            // Delete button
                            IconButton(onClick = { showDeleteConfirm = vehicle }) {
                                Icon(Icons.Default.Delete, "Excluir", tint = MaterialTheme.colorScheme.error)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun DefaultVehicleIcon() {
    Box(
        modifier = Modifier.size(56.dp).clip(RoundedCornerShape(8.dp)).background(MaterialTheme.colorScheme.surfaceVariant),
        contentAlignment = Alignment.Center
    ) {
        Icon(
            Icons.Default.DirectionsCar,
            null,
            modifier = Modifier.size(32.dp),
            tint = MaterialTheme.colorScheme.primary
        )
    }
}
