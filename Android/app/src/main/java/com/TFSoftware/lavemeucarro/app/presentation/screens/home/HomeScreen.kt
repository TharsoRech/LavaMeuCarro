package com.TFSoftware.lavemeucarro.app.presentation.screens.home

import android.Manifest
import android.content.pm.PackageManager
import android.location.Geocoder
import android.location.LocationManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.*
import androidx.compose.runtime.derivedStateOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import com.TFSoftware.lavemeucarro.app.data.models.*
import com.TFSoftware.lavemeucarro.app.data.remote.ViaCepResponse
import com.TFSoftware.lavemeucarro.app.managers.AuthManager
import com.TFSoftware.lavemeucarro.app.managers.BiometricHelper
import com.TFSoftware.lavemeucarro.app.presentation.components.AppointmentDetailModal
import com.TFSoftware.lavemeucarro.app.presentation.components.AppointmentFeedbackModal
import com.TFSoftware.lavemeucarro.app.presentation.theme.AppColors
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    modifier: Modifier = Modifier,
    onNavigateToUnidade: (String) -> Unit,
    onNavigateToNotifications: () -> Unit,
    viewModel: HomeViewModel = hiltViewModel()
) {
    val promotions by viewModel.promotions.collectAsState()
    val unidades by viewModel.unidades.collectAsState()
    val categorias by viewModel.categorias.collectAsState()
    val professionals by viewModel.professionals.collectAsState()
    val notifications by viewModel.notifications.collectAsState()
    val unreadCount by viewModel.unreadCount.collectAsState()
    val userName by viewModel.userName.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    var searchQuery by remember { mutableStateOf("") }
    var searchFilter by remember { mutableStateOf("Unidade") }
    var isSearching by remember { mutableStateOf(false) }
    var selectedUnidade by remember { mutableStateOf<UnidadeDto?>(null) }
    var showUnidadeDetail by remember { mutableStateOf(false) }
    var showNotifications by remember { mutableStateOf(false) }
    var showAppointmentDetail by remember { mutableStateOf(false) }
    var showReviewModal by remember { mutableStateOf(false) }
    var reviewReferenceId by remember { mutableStateOf<String?>(null) }
    val selectedAppointment by viewModel.selectedAppointment.collectAsState()
    val userCity by viewModel.userCity.collectAsState()
    val userState by viewModel.userState.collectAsState()
    val isLocationLoading by viewModel.isLocationLoading.collectAsState()
    var showLocationModal by remember { mutableStateOf(false) }
    var cepInput by remember { mutableStateOf("") }
    // Feedback modal state
    var showFeedbackModal by remember { mutableStateOf(false) }
    var feedbackAppointment by remember { mutableStateOf<AgendamentoDto?>(null) }
    // Search pagination state
    var searchPage by remember { mutableIntStateOf(1) }
    var hasMoreResults by remember { mutableStateOf(false) }
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val locationManager = context.getSystemService(LocationManager::class.java)

    // GPS location launcher
    val locationPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val granted = permissions[Manifest.permission.ACCESS_FINE_LOCATION] == true ||
                     permissions[Manifest.permission.ACCESS_COARSE_LOCATION] == true
        if (granted) {
            try {
                val location = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER)
                    ?: locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)
                
                if (location != null) {
                    val lat = location.latitude
                    val lng = location.longitude
                    
                    // Reverse geocode to get city and state
                    val geocoder = Geocoder(context)
                    val addresses = geocoder.getFromLocation(lat, lng, 1)
                    
                    if (!addresses.isNullOrEmpty()) {
                        val address = addresses[0]
                        val city = address.locality ?: address.subAdminArea ?: ""
                        val state = address.adminArea ?: ""
                        
                        if (city.isNotEmpty() && state.isNotEmpty()) {
                            viewModel.setLocationFromGps(city, state, lat, lng)
                            showLocationModal = false
                        }
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    // Search debounce (350ms, following HoraDaBeleza pattern)
    LaunchedEffect(searchQuery, searchFilter, isSearching) {
        if (isSearching && searchQuery.isNotBlank()) {
            kotlinx.coroutines.delay(350)
            viewModel.search(searchQuery, searchFilter)
        }
    }

    LaunchedEffect(Unit) { viewModel.loadData() }

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

    // Biometric setup prompt (following HoraDaBeleza pattern)
    val biometricHelper = remember { BiometricHelper(context) }
    val showBiometricPromptState by viewModel.showBiometricPrompt.collectAsState()
    val biometricPrompted by viewModel.biometricPrompted.collectAsState()
    val biometricEnabled by viewModel.biometricEnabled.collectAsState()
    
    LaunchedEffect(Unit) {
        viewModel.checkBiometricPrompt()
    }
    
    LaunchedEffect(biometricPrompted, biometricEnabled) {
        val available = biometricHelper.isBiometricAvailable()
        if (!biometricPrompted && !biometricEnabled && available) {
            viewModel.setShowBiometricPrompt(true)
        }
    }
    
    if (showBiometricPromptState) {
        AlertDialog(
            onDismissRequest = { viewModel.setShowBiometricPrompt(false) },
            title = { Text("Ativar biometria?", fontWeight = FontWeight.Bold) },
            text = { Text("Voce pode usar biometria para entrar mais rapido no app.") },
            confirmButton = {
                TextButton(onClick = {
                    scope.launch {
                        viewModel.setBiometricPrompted(true)
                        viewModel.setBiometricEnabled(true)
                        viewModel.setShowBiometricPrompt(false)
                    }
                }) { Text("Ativar") }
            },
            dismissButton = {
                TextButton(onClick = {
                    scope.launch {
                        viewModel.setBiometricPrompted(true)
                        viewModel.setShowBiometricPrompt(false)
                    }
                }) { Text("Agora nao") }
            }
        )
    }

    // Notification popup
    if (showNotifications) {
        NotificationPopup(
            notifications = notifications,
            onDismiss = { showNotifications = false },
            onMarkAsRead = { id -> viewModel.markNotificationRead(id) },
            onMarkAllRead = { viewModel.markAllNotificationsRead() },
            onNotificationPress = { notif ->
                if (!notif.isRead) viewModel.markNotificationRead(notif.id)
                notif.referenceId?.let { refId ->
                    val type = notif.type?.lowercase() ?: notif.rawType?.lowercase() ?: ""
                    if (type == "review" || type == "newreview") {
                        // Open feedback modal (following HoraDaBeleza pattern)
                        scope.launch {
                            try {
                                val appt = viewModel.api2.getAgendamentoById(refId)
                                feedbackAppointment = appt
                                showFeedbackModal = true
                            } catch (_: Exception) {
                                // Fallback to simple review modal
                                reviewReferenceId = refId
                                showReviewModal = true
                            }
                        }
                    } else {
                        viewModel.fetchAppointmentById(refId)
                        showAppointmentDetail = true
                    }
                }
            }
        )
    }

    // Appointment detail modal from notification
    if (showAppointmentDetail && selectedAppointment != null) {
        AppointmentDetailModal(
            appointment = selectedAppointment!!,
            onDismiss = {
                showAppointmentDetail = false
                viewModel.clearSelectedAppointment()
            }
        )
    }

    // Review/rating modal from notification
    if (showReviewModal && reviewReferenceId != null) {
        ReviewRatingModal(
            agendamentoId = reviewReferenceId!!,
            onDismiss = { showReviewModal = false },
            onSubmit = { rating, comment ->
                viewModel.submitReview(reviewReferenceId!!, rating, comment) {
                    showReviewModal = false
                }
            }
        )
    }

    // Feedback modal (from notification review tap)
    if (showFeedbackModal && feedbackAppointment != null) {
        AppointmentFeedbackModal(
            appointment = feedbackAppointment!!,
            onDismiss = { showFeedbackModal = false },
            onSubmitted = { viewModel.loadData() }
        )
    }

    // Location modal
    if (showLocationModal) {
        LocationModal(
            cepInput = cepInput,
            onCepChange = { cepInput = it },
            isLoading = isLocationLoading,
            onDismiss = { showLocationModal = false },
            onSearchCep = { viewModel.lookupCep(cepInput) },
            cepResult = viewModel.cepResult.collectAsState().value,
            onUseGps = {
                val hasPermission = ContextCompat.checkSelfPermission(
                    context,
                    Manifest.permission.ACCESS_FINE_LOCATION
                ) == PackageManager.PERMISSION_GRANTED
                
                if (hasPermission) {
                    try {
                        val location = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER)
                            ?: locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)
                        
                        if (location != null) {
                            val lat = location.latitude
                            val lng = location.longitude
                            
                            // Reverse geocode to get city and state
                            val geocoder = Geocoder(context)
                            val addresses = geocoder.getFromLocation(lat, lng, 1)
                            
                            if (!addresses.isNullOrEmpty()) {
                                val address = addresses[0]
                                val city = address.locality ?: address.subAdminArea ?: ""
                                val state = address.adminArea ?: ""
                                
                                if (city.isNotEmpty() && state.isNotEmpty()) {
                                    viewModel.setLocationFromGps(city, state, lat, lng)
                                    showLocationModal = false
                                }
                            }
                        }
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                } else {
                    locationPermissionLauncher.launch(
                        arrayOf(
                            Manifest.permission.ACCESS_FINE_LOCATION,
                            Manifest.permission.ACCESS_COARSE_LOCATION
                        )
                    )
                }
            }
        )
    }

    // Unidade detail modal
    if (showUnidadeDetail && selectedUnidade != null) {
        UnidadeDetailModal(
            unidade = selectedUnidade!!,
            onDismiss = { showUnidadeDetail = false },
            onBook = { onNavigateToUnidade(selectedUnidade!!.id) }
        )
    }

        // Pull-to-refresh wrapper (following HoraDaBeleza refreshControl pattern)
        PullToRefreshBox(
            isRefreshing = isLoading && unidades.isNotEmpty(),
            onRefresh = { viewModel.loadData() },
            modifier = Modifier.fillMaxSize()
        ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
        ) {
        // Header
        Surface(
            color = MaterialTheme.colorScheme.surface,
            tonalElevation = 1.dp
        ) {
            Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            "Olá, ${userName}!",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            "Encontre seu serviço automotivo",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    IconButton(onClick = { showNotifications = true }) {
                        Badge(count = unreadCount) {
                            Icon(Icons.Default.Notifications, "Notificações")
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Location section
                if (userCity != null) {
                    Card(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Default.LocationOn, null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(20.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text("$userCity${userState?.let { " - $it" } ?: ""}", fontWeight = FontWeight.Medium, style = MaterialTheme.typography.bodyMedium)
                            }
                            TextButton(onClick = { viewModel.clearLocationFilter() }) {
                                Text("Limpar", style = MaterialTheme.typography.labelSmall)
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(4.dp))

                // Location button
                Row(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedButton(
                        onClick = { showLocationModal = true },
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(Icons.Default.LocationOn, null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(if (userCity != null) "Alterar Local" else "Definir Local")
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Search bar
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = {
                        searchQuery = it
                        if (it.isNotEmpty()) {
                            isSearching = true
                        } else {
                            isSearching = false
                        }
                    },
                    placeholder = { Text("Buscar unidade, serviço...") },
                    leadingIcon = { Icon(Icons.Default.Search, null) },
                    trailingIcon = {
                        if (isSearching) {
                            IconButton(onClick = {
                                searchQuery = ""
                                isSearching = false
                                viewModel.loadData()
                            }) {
                                Icon(Icons.Default.Close, "Limpar")
                            }
                        }
                    },
                    singleLine = true,
                    shape = MaterialTheme.shapes.large,
                    modifier = Modifier.fillMaxWidth()
                )

                // Search filter chips
                if (isSearching) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf("Unidade", "Serviço", "Profissional").forEach { filter ->
                            FilterChip(
                                selected = searchFilter == filter,
                                onClick = {
                                    searchFilter = filter
                                    viewModel.search(searchQuery, filter)
                                },
                                label = { Text(filter) }
                            )
                        }
                    }
                }
            }
        }

        if (isLoading && unidades.isEmpty()) {
            Box(
                modifier = Modifier.fillMaxWidth().padding(48.dp),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        } else if (isSearching) {
            // Search results with pagination
            if (unidades.isEmpty()) {
                EmptyState(
                    icon = Icons.Default.SearchOff,
                    title = "Nenhum resultado",
                    subtitle = "Tente buscar por outro termo"
                )
            } else {
                val listState = rememberLazyListState()
                val hasMore by viewModel.hasMoreResults.collectAsState()
                
                // Detect when user reaches end of list
                val shouldLoadMore = remember {
                    derivedStateOf {
                        val lastVisibleItem = listState.layoutInfo.visibleItemsInfo.lastOrNull()?.index ?: 0
                        val totalItems = listState.layoutInfo.totalItemsCount
                        lastVisibleItem >= totalItems - 3 && hasMore && !isLoading
                    }
                }
                
                LaunchedEffect(shouldLoadMore.value) {
                    if (shouldLoadMore.value) {
                        viewModel.loadMoreSearchResults()
                    }
                }
                
                LazyColumn(
                    state = listState,
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(unidades) { unidade ->
                        SearchResultCard(unidade = unidade, onClick = {
                            selectedUnidade = unidade
                            showUnidadeDetail = true
                        })
                    }
                    
                    // Loading indicator at bottom
                    if (isLoading) {
                        item {
                            Box(
                                modifier = Modifier.fillMaxWidth().padding(16.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                CircularProgressIndicator(modifier = Modifier.size(24.dp))
                            }
                        }
                    }
                }
            }
        } else {
            // Categories section
            if (categorias.isNotEmpty()) {
                SectionHeader(title = "Categorias", onSeeAll = null)
                LazyRow(
                    contentPadding = PaddingValues(horizontal = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(categorias) { cat ->
                        CategoryChip(
                            categoria = cat,
                            onClick = {
                                searchQuery = cat.nome
                                searchFilter = "Serviço"
                                isSearching = true
                                viewModel.search(cat.nome, "Serviço")
                            }
                        )
                    }
                }
                Spacer(modifier = Modifier.height(16.dp))
            }

            // Promotions section
            if (promotions.isNotEmpty()) {
                SectionHeader(title = "Promoções para você", onSeeAll = {
                    // Navigate to promotions list (following HoraDaBeleza pattern)
                    // For now, trigger a search with empty query to show all units with promotions
                    searchQuery = ""
                    searchFilter = "Unidade"
                    isSearching = true
                    viewModel.search("", "Unidade")
                })
                LazyRow(
                    contentPadding = PaddingValues(horizontal = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(promotions) { promo ->
                        PromotionCard(
                            promotion = promo,
                            onClick = {
                                // Navigate to the unidade that has this promotion
                                onNavigateToUnidade(promo.unidadeId.toString())
                            }
                        )
                    }
                }
                Spacer(modifier = Modifier.height(16.dp))
            }

            // Popular units section
            SectionHeader(title = "Unidades Populares", onSeeAll = {
                searchQuery = ""
                searchFilter = "Unidade"
                isSearching = true
                viewModel.search("", "Unidade")
            })

            if (unidades.isEmpty()) {
                EmptyState(
                    icon = Icons.Default.Store,
                    title = "Nenhuma unidade encontrada",
                    subtitle = "Estamos trabalhando para trazer novas opções"
                )
            } else {
                LazyRow(
                    contentPadding = PaddingValues(horizontal = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(unidades.take(10)) { unidade ->
                        UnidadeCard(
                            unidade = unidade,
                            onClick = {
                                selectedUnidade = unidade
                                showUnidadeDetail = true
                            }
                        )
                    }
                }
            }

            // Melhores Profissionais section (following HoraDaBeleza pattern)
            if (professionals.isNotEmpty()) {
                Spacer(modifier = Modifier.height(24.dp))
                SectionHeader(title = "Melhores Profissionais", onSeeAll = {
                    searchQuery = ""
                    searchFilter = "Profissional"
                    isSearching = true
                    viewModel.search("", "Profissional")
                })
                LazyRow(
                    contentPadding = PaddingValues(horizontal = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(professionals) { prof ->
                        ProfessionalCard(
                            professional = prof,
                            onClick = {
                                // Navigate to the unidade of this professional
                                onNavigateToUnidade(prof.unidadeId.toString())
                            }
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Pull to refresh hint
            TextButton(
                onClick = { viewModel.loadData() },
                modifier = Modifier.align(Alignment.CenterHorizontally)
            ) {
                Icon(Icons.Default.Refresh, null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("Atualizar")
            }

            Spacer(modifier = Modifier.height(16.dp))
        }
    }
    } // End PullToRefreshBox
}

@Composable
fun SectionHeader(title: String, onSeeAll: (() -> Unit)?) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        if (onSeeAll != null) {
            TextButton(onClick = onSeeAll) { Text("Ver todos") }
        }
    }
}

@Composable
fun CategoryChip(categoria: CategoriaDto, onClick: () -> Unit) {
    SuggestionChip(
        onClick = onClick,
        label = { Text(categoria.nome) },
        icon = { Icon(Icons.Default.Category, null, modifier = Modifier.size(16.dp)) }
    )
}

@Composable
fun PromotionCard(promotion: PromotionDto, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .width(220.dp)
            .clickable(onClick = onClick),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.tertiaryContainer)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Surface(
                    modifier = Modifier.size(36.dp),
                    shape = MaterialTheme.shapes.medium,
                    color = MaterialTheme.colorScheme.tertiary
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(Icons.Default.LocalOffer, null, tint = MaterialTheme.colorScheme.onTertiary, modifier = Modifier.size(20.dp))
                    }
                }
                Spacer(modifier = Modifier.width(8.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(promotion.name, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    Text(promotion.unidadeName, style = MaterialTheme.typography.labelSmall, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
            }
            Spacer(modifier = Modifier.height(8.dp))
            promotion.promoDescription?.let {
                Text(it, style = MaterialTheme.typography.bodySmall, maxLines = 2, overflow = TextOverflow.Ellipsis)
            }
            Spacer(modifier = Modifier.height(4.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                promotion.promoPrice?.let { promoP ->
                    Text("R$ ${"%.2f".format(promoP)}", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.tertiary)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        "R$ ${"%.2f".format(promotion.originalPrice)}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                } ?: run {
                    Text("R$ ${"%.2f".format(promotion.originalPrice)}", fontWeight = FontWeight.Bold)
                }
            }
            promotion.promoEndDate?.let {
                Spacer(modifier = Modifier.height(4.dp))
                Text("Válido até ${it.split("-").reversed().joinToString("/")}", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.error)
            }
        }
    }
}

@Composable
fun UnidadeCard(unidade: UnidadeDto, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .width(240.dp)
            .clickable(onClick = onClick),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Surface(
                    modifier = Modifier.size(40.dp),
                    shape = MaterialTheme.shapes.medium,
                    color = MaterialTheme.colorScheme.primaryContainer
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(Icons.Default.Store, null, tint = MaterialTheme.colorScheme.primary)
                    }
                }
                Spacer(modifier = Modifier.width(8.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        unidade.nome,
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    unidade.averageRating?.let {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Star, null, modifier = Modifier.size(14.dp), tint = AppColors.Warning)
                            Text(" %.1f".format(it), fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                }
            }
            Spacer(modifier = Modifier.height(8.dp))
            unidade.address?.let {
                Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 2, overflow = TextOverflow.Ellipsis)
            }
            if (unidade.distanciaKm != null) {
                Spacer(modifier = Modifier.height(4.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.LocationOn, null, modifier = Modifier.size(14.dp), tint = MaterialTheme.colorScheme.primary)
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("%.1f km".format(unidade.distanciaKm), fontSize = 12.sp, color = MaterialTheme.colorScheme.primary)
                }
            }
            if (unidade.ofereceLevaTraz) {
                Spacer(modifier = Modifier.height(4.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.LocalShipping, null, modifier = Modifier.size(14.dp), tint = AppColors.Success)
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Leva e traz", fontSize = 11.sp, color = AppColors.Success)
                }
            }
        }
    }
}

@Composable
fun SearchResultCard(unidade: UnidadeDto, onClick: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
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
                Text(unidade.nome, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                unidade.address?.let {
                    Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    unidade.averageRating?.let {
                        Icon(Icons.Default.Star, null, modifier = Modifier.size(14.dp), tint = AppColors.Warning)
                        Text(" %.1f".format(it), fontSize = 12.sp)
                        Spacer(modifier = Modifier.width(8.dp))
                    }
                    unidade.distanciaKm?.let {
                        Icon(Icons.Default.LocationOn, null, modifier = Modifier.size(14.dp), tint = MaterialTheme.colorScheme.primary)
                        Text(" %.1f km".format(it), fontSize = 12.sp, color = MaterialTheme.colorScheme.primary)
                    }
                }
            }
            Icon(Icons.Default.ChevronRight, null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
fun EmptyState(icon: ImageVector, title: String, subtitle: String) {
    Column(
        modifier = Modifier.fillMaxWidth().padding(48.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(icon, null, modifier = Modifier.size(64.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(modifier = Modifier.height(16.dp))
        Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Medium)
        Spacer(modifier = Modifier.height(4.dp))
        Text(subtitle, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
fun NotificationPopup(
    notifications: List<NotificacaoDto>,
    onDismiss: () -> Unit,
    onMarkAsRead: (String) -> Unit,
    onMarkAllRead: () -> Unit,
    onNotificationPress: (NotificacaoDto) -> Unit = {}
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Notificações")
                if (notifications.any { !it.isRead }) {
                    TextButton(onClick = onMarkAllRead) { Text("Marcar todas") }
                }
            }
        },
        text = {
            if (notifications.isEmpty()) {
                Text("Nenhuma notificação", modifier = Modifier.padding(16.dp))
            } else {
                Column(modifier = Modifier.heightIn(max = 400.dp).verticalScroll(rememberScrollState())) {
                    notifications.forEach { notif ->
                        ListItem(
                            headlineContent = { Text(notif.title, fontWeight = if (!notif.isRead) FontWeight.Bold else FontWeight.Normal) },
                            supportingContent = { Text(notif.body, maxLines = 2, overflow = TextOverflow.Ellipsis) },
                            leadingContent = {
                                Icon(
                                    when (notif.type?.lowercase()) {
                                        "success" -> Icons.Default.CheckCircle
                                        "promo", "promotion" -> Icons.Default.LocalOffer
                                        "alert" -> Icons.Default.Warning
                                        "review" -> Icons.Default.Star
                                        else -> Icons.Default.Notifications
                                    },
                                    null,
                                    tint = if (!notif.isRead) MaterialTheme.colorScheme.primary
                                    else MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            },
                            trailingContent = {
                                if (!notif.isRead) {
                                    Surface(
                                        modifier = Modifier.size(8.dp),
                                        shape = MaterialTheme.shapes.extraSmall,
                                        color = MaterialTheme.colorScheme.primary
                                    ) {}
                                }
                            },
                            modifier = Modifier.clickable {
                                onNotificationPress(notif)
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
fun ProfessionalCard(professional: PopularProfessionalDto, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .width(150.dp)
            .clickable(onClick = onClick),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Avatar with rating badge
            Box {
                Surface(
                    modifier = Modifier.size(60.dp),
                    shape = CircleShape,
                    color = MaterialTheme.colorScheme.secondaryContainer
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            Icons.Default.Person,
                            null,
                            modifier = Modifier.size(30.dp),
                            tint = MaterialTheme.colorScheme.onSecondaryContainer
                        )
                    }
                }
                // Rating badge
                Surface(
                    modifier = Modifier.align(Alignment.BottomEnd),
                    shape = RoundedCornerShape(8.dp),
                    color = Color(0xFFFFF3E0)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Default.Star, null, modifier = Modifier.size(10.dp), tint = AppColors.Warning)
                        Text(
                            " %.1f".format(professional.averageRating ?: 0.0),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = AppColors.Warning
                        )
                    }
                }
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                professional.name,
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.fillMaxWidth()
            )
            professional.specialty?.let {
                Text(
                    it,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.fillMaxWidth()
                )
            }
            Spacer(modifier = Modifier.height(4.dp))
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(
                    Icons.Default.Store,
                    null,
                    modifier = Modifier.size(10.dp),
                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    professional.unidadeName,
                    fontSize = 10.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f)
                )
            }
            if (professional.totalReviews > 0) {
                Text(
                    "${professional.totalReviews} avaliações",
                    fontSize = 9.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }
    }
}

@Composable
fun UnidadeDetailModal(
    unidade: UnidadeDto,
    onDismiss: () -> Unit,
    onBook: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(unidade.nome) },
        text = {
            Column {
                unidade.address?.let {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.LocationOn, null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(it, style = MaterialTheme.typography.bodyMedium)
                    }
                }
                unidade.telefone?.let {
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Phone, null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(it, style = MaterialTheme.typography.bodyMedium)
                    }
                }
                unidade.email?.let {
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Email, null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(it, style = MaterialTheme.typography.bodyMedium)
                    }
                }
                unidade.averageRating?.let {
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Star, null, modifier = Modifier.size(20.dp), tint = AppColors.Warning)
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("%.1f".format(it), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        unidade.reviews?.let { r -> Text(" ($r avaliações)", style = MaterialTheme.typography.bodySmall) }
                    }
                }
                unidade.description?.let {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(it, style = MaterialTheme.typography.bodyMedium)
                }
                if (unidade.ofereceLevaTraz) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.LocalShipping, null, tint = AppColors.Success)
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Oferece leva e traz", color = AppColors.Success, fontWeight = FontWeight.Medium)
                    }
                }
            }
        },
        confirmButton = {
            Button(onClick = onBook) { Text("Agendar") }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Fechar") }
        }
    )
}

@Composable
fun ReviewRatingModal(
    agendamentoId: String,
    onDismiss: () -> Unit,
    onSubmit: (rating: Int, comment: String?) -> Unit
) {
    var rating by remember { mutableStateOf(0) }
    var comment by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Avaliar Serviço") },
        text = {
            Column {
                Text("Como foi sua experiência?", style = MaterialTheme.typography.bodyMedium)
                Spacer(modifier = Modifier.height(16.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    (1..5).forEach { star ->
                        IconButton(onClick = { rating = star }) {
                            Icon(
                                if (star <= rating) Icons.Default.Star else Icons.Default.StarBorder,
                                null,
                                tint = AppColors.Warning,
                                modifier = Modifier.size(36.dp)
                            )
                        }
                    }
                }
                Spacer(modifier = Modifier.height(16.dp))
                OutlinedTextField(
                    value = comment,
                    onValueChange = { comment = it },
                    label = { Text("Comentário (opcional)") },
                    modifier = Modifier.fillMaxWidth().height(100.dp),
                    maxLines = 4
                )
            }
        },
        confirmButton = {
            Button(
                onClick = { onSubmit(rating, comment.takeIf { it.isNotBlank() }) },
                enabled = rating > 0
            ) { Text("Enviar Avaliação") }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancelar") }
        }
    )
}

@Composable
fun LocationModal(
    cepInput: String,
    onCepChange: (String) -> Unit,
    isLoading: Boolean,
    onDismiss: () -> Unit,
    onSearchCep: () -> Unit,
    cepResult: ViaCepResponse?,
    onUseGps: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Definir Localização") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("Digite seu CEP ou use GPS para encontrar unidades na sua região", style = MaterialTheme.typography.bodyMedium)

                // GPS Button
                Button(
                    onClick = onUseGps,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary)
                ) {
                    Icon(Icons.Default.MyLocation, null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Usar minha localização atual")
                }

                Divider()

                Text("Ou busque por CEP:", style = MaterialTheme.typography.bodySmall)

                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value = cepInput,
                        onValueChange = { onCepChange(it.filter { c -> c.isDigit() }.take(8)) },
                        label = { Text("CEP") },
                        placeholder = { Text("00000-000") },
                        singleLine = true,
                        modifier = Modifier.weight(1f)
                    )
                    Button(
                        onClick = onSearchCep,
                        enabled = cepInput.length >= 8 && !isLoading
                    ) {
                        if (isLoading) {
                            CircularProgressIndicator(modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                        } else {
                            Text("Buscar")
                        }
                    }
                }

                if (cepResult != null) {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Icon(Icons.Default.CheckCircle, null, tint = MaterialTheme.colorScheme.primary)
                            Spacer(modifier = Modifier.height(8.dp))
                            Text("${cepResult.localidade} - ${cepResult.uf}", fontWeight = FontWeight.Bold)
                            cepResult.bairro?.let { Text(it, style = MaterialTheme.typography.bodySmall) }
                            cepResult.logradouro?.let { Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant) }
                        }
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) { Text("Fechar") }
        }
    )
}
