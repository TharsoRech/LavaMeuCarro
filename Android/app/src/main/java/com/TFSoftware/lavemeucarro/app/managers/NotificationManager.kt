package com.TFSoftware.lavemeucarro.app.managers

import com.TFSoftware.lavemeucarro.app.data.models.NotificacaoDto
import com.TFSoftware.lavemeucarro.app.data.models.NotificacoesResponse
import com.TFSoftware.lavemeucarro.app.data.remote.LavaMeuCarroApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class NotificationManager @Inject constructor(
    private val api: LavaMeuCarroApi
) {
    private val _notifications = MutableStateFlow<List<NotificacaoDto>>(emptyList())
    val notifications: StateFlow<List<NotificacaoDto>> = _notifications

    private val _unreadCount = MutableStateFlow(0)
    val unreadCount: StateFlow<Int> = _unreadCount

    suspend fun refreshNotifications() {
        try {
            val response = api.getNotificacoes()
            _notifications.value = response.items
            _unreadCount.value = response.unreadCount
        } catch (_: Exception) {}
    }

    suspend fun markAsRead(id: String) {
        try {
            api.markNotificacaoAsRead(id)
            _notifications.value = _notifications.value.map {
                if (it.id == id) it.copy(isRead = true) else it
            }
            _unreadCount.value = (_unreadCount.value - 1).coerceAtLeast(0)
        } catch (_: Exception) {}
    }

    suspend fun markAllAsRead() {
        try {
            api.markAllNotificacoesAsRead()
            _notifications.value = _notifications.value.map { it.copy(isRead = true) }
            _unreadCount.value = 0
        } catch (_: Exception) {}
    }
}
