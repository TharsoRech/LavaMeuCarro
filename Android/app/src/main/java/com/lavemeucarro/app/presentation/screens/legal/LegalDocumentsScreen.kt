package com.lavemeucarro.app.presentation.screens.legal

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
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
import com.lavemeucarro.app.data.models.LegalDocumentDto
import com.lavemeucarro.app.data.remote.LavaMeuCarroApi
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LegalDocumentsScreen(
    modifier: Modifier = Modifier,
    onBack: () -> Unit,
    viewModel: LegalDocumentsViewModel = hiltViewModel()
) {
    val selectedTab by viewModel.selectedTab.collectAsState()
    val privacyPolicy by viewModel.privacyPolicy.collectAsState()
    val termsOfUse by viewModel.termsOfUse.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val error by viewModel.error.collectAsState()

    LaunchedEffect(Unit) { viewModel.loadDocuments() }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Documentos Legais") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, "Voltar")
                    }
                }
            )
        }
    ) { padding ->
        Column(modifier = modifier.fillMaxSize().padding(padding)) {
            // Tab row
            TabRow(selectedTabIndex = if (selectedTab == "privacy") 0 else 1) {
                Tab(
                    selected = selectedTab == "privacy",
                    onClick = { viewModel.selectTab("privacy") },
                    text = { Text("Privacidade") }
                )
                Tab(
                    selected = selectedTab == "terms",
                    onClick = { viewModel.selectTab("terms") },
                    text = { Text("Termos de Uso") }
                )
            }

            when {
                isLoading -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator()
                    }
                }
                error != null -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(
                                Icons.Default.Error,
                                null,
                                modifier = Modifier.size(48.dp),
                                tint = MaterialTheme.colorScheme.error
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Text(error ?: "Erro ao carregar documento", color = MaterialTheme.colorScheme.error)
                            Spacer(modifier = Modifier.height(16.dp))
                            Button(onClick = { viewModel.loadDocuments() }) {
                                Text("Tentar novamente")
                            }
                        }
                    }
                }
                else -> {
                    val document = if (selectedTab == "privacy") privacyPolicy else termsOfUse
                    if (document != null) {
                        LegalDocumentContent(document = document)
                    } else {
                        Box(
                            modifier = Modifier.fillMaxSize(),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("Documento não disponível")
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun LegalDocumentContent(document: LegalDocumentDto) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
    ) {
        // Document header
        Text(
            document.title,
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold
        )
        Spacer(modifier = Modifier.height(4.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                "Versão: ${document.version}",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            if (document.isRequired) {
                Spacer(modifier = Modifier.width(8.dp))
                Surface(
                    color = MaterialTheme.colorScheme.errorContainer,
                    shape = MaterialTheme.shapes.small
                ) {
                    Text(
                        "Obrigatório",
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onErrorContainer
                    )
                }
            }
        }
        Spacer(modifier = Modifier.height(16.dp))
        HorizontalDivider()
        Spacer(modifier = Modifier.height(16.dp))

        // Document content - render as paragraphs
        val content = document.content ?: "Conteúdo não disponível."
        val paragraphs = content.split("\n\n")
        paragraphs.forEach { paragraph ->
            if (paragraph.isNotBlank()) {
                Text(
                    paragraph.trim(),
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.padding(vertical = 4.dp)
                )
            }
        }

        Spacer(modifier = Modifier.height(32.dp))
    }
}

@HiltViewModel
class LegalDocumentsViewModel @Inject constructor(
    private val api: LavaMeuCarroApi
) : ViewModel() {
    private val _selectedTab = MutableStateFlow("privacy")
    val selectedTab: StateFlow<String> = _selectedTab

    private val _privacyPolicy = MutableStateFlow<LegalDocumentDto?>(null)
    val privacyPolicy: StateFlow<LegalDocumentDto?> = _privacyPolicy

    private val _termsOfUse = MutableStateFlow<LegalDocumentDto?>(null)
    val termsOfUse: StateFlow<LegalDocumentDto?> = _termsOfUse

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error

    fun selectTab(tab: String) {
        _selectedTab.value = tab
    }

    fun loadDocuments() {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            try {
                _privacyPolicy.value = api.getPrivacyPolicy()
            } catch (e: Exception) {
                _error.value = "Erro ao carregar política de privacidade"
            }
            try {
                _termsOfUse.value = api.getTermsOfUse()
            } catch (e: Exception) {
                _error.value = "Erro ao carregar termos de uso"
            }
            _isLoading.value = false
        }
    }
}
