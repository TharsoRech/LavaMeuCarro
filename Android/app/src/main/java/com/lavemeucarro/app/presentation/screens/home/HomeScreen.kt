package com.lavemeucarro.app.presentation.screens.home

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.lavemeucarro.app.data.models.*
import com.lavemeucarro.app.managers.AuthManager
import com.lavemeucarro.app.presentation.theme.AppColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    modifier: Modifier = Modifier,
    onNavigateToUnidade: (String) -> Unit,
    onNavigateToNotifications: () -> Unit,
    viewModel: HomeViewModel = hiltViewModel()
) {
    val unidades by viewModel.unidades.collectAsState()
    val categorias by viewModel.categorias.collectAsState()
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

    LaunchedEffect(Unit) { viewModel.loadData() }

    // Notification popup
    if (showNotifications) {
        NotificationPopup(
            notifications = notifications,
            onDismiss = { showNotifications = false },
            onMarkAsRead = { id -> viewModel.markNotificationRead(id) },
            onMarkAllRead = { viewModel.markAllNotificationsRead() }
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

    Column(
        modifier = modifier
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

                // Search bar
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = {
                        searchQuery = it
                        if (it.isNotEmpty()) {
                            isSearching = true
                            viewModel.search(it, searchFilter)
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
            // Search results
            if (unidades.isEmpty()) {
                EmptyState(
                    icon = Icons.Default.SearchOff,
                    title = "Nenhum resultado",
                    subtitle = "Tente buscar por outro termo"
                )
            } else {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    unidades.forEach { unidade ->
                        SearchResultCard(unidade = unidade, onClick = {
                            selectedUnidade = unidade
                            showUnidadeDetail = true
                        })
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
    onMarkAllRead: () -> Unit
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
                            modifier = Modifier.clickable { if (!notif.isRead) onMarkAsRead(notif.id) }
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
