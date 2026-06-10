package com.lavemeucarro.app.presentation.screens.vehicles

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.lavemeucarro.app.data.models.CreateVeiculoRequest
import com.lavemeucarro.app.data.models.VeiculoDto
import com.lavemeucarro.app.data.remote.LavaMeuCarroApi
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VehiclesScreen(
    modifier: Modifier = Modifier,
    onBack: () -> Unit,
    viewModel: VehiclesViewModel = hiltViewModel()
) {
    val vehicles by viewModel.vehicles.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    var showAddDialog by remember { mutableStateOf(false) }
    var placa by remember { mutableStateOf("") }
    var marca by remember { mutableStateOf("") }
    var modelo by remember { mutableStateOf("") }
    var cor by remember { mutableStateOf("") }

    if (showAddDialog) {
        AlertDialog(
            onDismissRequest = { showAddDialog = false },
            title = { Text("Adicionar Veículo") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(value = placa, onValueChange = { placa = it }, label = { Text("Placa") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                    OutlinedTextField(value = marca, onValueChange = { marca = it }, label = { Text("Marca") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                    OutlinedTextField(value = modelo, onValueChange = { modelo = it }, label = { Text("Modelo") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                    OutlinedTextField(value = cor, onValueChange = { cor = it }, label = { Text("Cor") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                }
            },
            confirmButton = {
                Button(onClick = {
                    viewModel.addVehicle(CreateVeiculoRequest(placa, marca, modelo, cor.ifBlank { null }))
                    showAddDialog = false
                    placa = ""; marca = ""; modelo = ""; cor = ""
                }) { Text("Adicionar") }
            },
            dismissButton = { TextButton(onClick = { showAddDialog = false }) { Text("Cancelar") } }
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Meus Veículos") },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, "Voltar") } }
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = { showAddDialog = true }) {
                Icon(Icons.Default.Add, "Adicionar")
            }
        }
    ) { padding ->
        if (isLoading) {
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
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(vehicles) { vehicle ->
                    Card(elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)) {
                        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.DirectionsCar, null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(40.dp))
                            Spacer(modifier = Modifier.width(12.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text("${vehicle.marca ?: ""} ${vehicle.modelo ?: ""}".trim(), fontWeight = FontWeight.Bold)
                                Text("Placa: ${vehicle.placa}", style = MaterialTheme.typography.bodySmall)
                                vehicle.cor?.let { Text("Cor: $it", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant) }
                            }
                            IconButton(onClick = { viewModel.deleteVehicle(vehicle.id) }) {
                                Icon(Icons.Default.Delete, "Excluir", tint = MaterialTheme.colorScheme.error)
                            }
                        }
                    }
                }
            }
        }
    }
}

@HiltViewModel
class VehiclesViewModel @Inject constructor(private val api: LavaMeuCarroApi) : ViewModel() {
    private val _vehicles = MutableStateFlow<List<VeiculoDto>>(emptyList())
    val vehicles: StateFlow<List<VeiculoDto>> = _vehicles
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    init { loadVehicles() }

    fun loadVehicles() {
        viewModelScope.launch {
            _isLoading.value = true
            try { _vehicles.value = api.getMyVeiculos() } catch (_: Exception) {}
            _isLoading.value = false
        }
    }

    fun addVehicle(request: CreateVeiculoRequest) {
        viewModelScope.launch {
            try { api.createVeiculo(request); loadVehicles() } catch (_: Exception) {}
        }
    }

    fun deleteVehicle(id: String) {
        viewModelScope.launch {
            try { api.deleteVeiculo(id); loadVehicles() } catch (_: Exception) {}
        }
    }
}
