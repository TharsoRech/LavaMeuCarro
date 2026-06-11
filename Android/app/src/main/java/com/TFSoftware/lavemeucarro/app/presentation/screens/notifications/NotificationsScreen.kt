package com.TFSoftware.lavemeucarro.app.presentation.screens.notifications

import androidx.compose.foundation.clickable
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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.TFSoftware.lavemeucarro.app.data.models.NotificacaoDto
import com.TFSoftware.lavemeucarro.app.data.remote.LavaMeuCarroApi
import com.TFSoftware.lavemeucarro.app.managers.NotificationManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationsScreen(
    modifier: Modifier = Modifier,
    onBack: () -> Unit,
    viewModel: NotificationsViewModel = hiltViewModel()
) {
    val notifications by viewModel.notifications.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val unreadCount by viewModel.unreadCount.collectAsState()
    var filter by remember { mutableStateOf("Todas") }

    val filteredNotifications = remember(notifications, filter) {
        when (filter) {
            "Não lidas" -> notifications.filter { !it.isRead }
            "Lidas" -> notifications.filter { it.isRead }
            else -> notifications
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Notificações")
                        if (unreadCount > 0) {
                            Text(
                                "$unreadCount não lida(s)",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, "Voltar")
                    }
                },
                actions = {
                    if (unreadCount > 0) {
                        TextButton(onClick = { viewModel.markAllAsRead() }) {
                            Text("Marcar todas")
                        }
                    }
                }
            )
        }
    ) { padding ->
        Column(modifier = modifier.fillMaxSize().padding(padding)) {
            // Filter chips
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                listOf("Todas", "Não lidas", "Lidas").forEach { f ->
                    FilterChip(
                        selected = filter == f,
                        onClick = { filter = f },
                        label = { Text(f) }
                    )
                }
            }

            if (isLoading && notifications.isEmpty()) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            } else if (filteredNotifications.isEmpty()) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            Icons.Default.NotificationsOff,
                            null,
                            modifier = Modifier.size(64.dp),
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            "Nenhuma notificação",
                            style = MaterialTheme.typography.titleMedium
                        )
                        Text(
                            if (filter != "Todas") "Tente alterar o filtro" else "Suas notificações aparecerão aqui",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            } else {
                LazyColumn(
                    contentPadding = PaddingValues(vertical = 8.dp),
                    verticalArrangement = Arrangement.spacedBy(2.dp)
                ) {
                    items(filteredNotifications, key = { it.id }) { notif ->
                        NotificationItem(
                            notification = notif,
                            onMarkAsRead = { viewModel.markAsRead(notif.id) }
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun NotificationItem(
    notification: NotificacaoDto,
    onMarkAsRead: () -> Unit
) {
    ListItem(
        headlineContent = {
            Text(
                notification.title,
                fontWeight = if (!notification.isRead) FontWeight.Bold else FontWeight.Normal,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        },
        supportingContent = {
            Column {
                Text(
                    notification.body,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
                notification.createdAt?.let {
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        it,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        },
        leadingContent = {
            val icon = when (notification.type?.lowercase()) {
                "success" -> Icons.Default.CheckCircle
                "promo", "promotion" -> Icons.Default.LocalOffer
                "alert" -> Icons.Default.Warning
                "review" -> Icons.Default.Star
                else -> Icons.Default.Notifications
            }
            val tint = when (notification.type?.lowercase()) {
                "success" -> MaterialTheme.colorScheme.primary
                "promo", "promotion" -> MaterialTheme.colorScheme.tertiary
                "alert" -> MaterialTheme.colorScheme.error
                "review" -> MaterialTheme.colorScheme.secondary
                else -> MaterialTheme.colorScheme.onSurfaceVariant
            }
            Icon(icon, null, tint = tint)
        },
        trailingContent = {
            if (!notification.isRead) {
                Surface(
                    modifier = Modifier.size(8.dp),
                    shape = MaterialTheme.shapes.extraSmall,
                    color = MaterialTheme.colorScheme.primary
                ) {}
            }
        },
        modifier = Modifier
            .clickable { if (!notification.isRead) onMarkAsRead() }
    )
}

@HiltViewModel
class NotificationsViewModel @Inject constructor(
    private val notificationManager: NotificationManager
) : ViewModel() {
    val notifications: StateFlow<List<NotificacaoDto>> = notificationManager.notifications
    val unreadCount: StateFlow<Int> = notificationManager.unreadCount
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    init {
        viewModelScope.launch {
            _isLoading.value = true
            notificationManager.refreshNotifications()
            _isLoading.value = false
        }
    }

    fun markAsRead(id: String) {
        viewModelScope.launch { notificationManager.markAsRead(id) }
    }

    fun markAllAsRead() {
        viewModelScope.launch { notificationManager.markAllAsRead() }
    }
}
