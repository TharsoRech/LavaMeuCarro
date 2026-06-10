package com.lavemeucarro.app.presentation.screens.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.lavemeucarro.app.data.models.CategoriaDto
import com.lavemeucarro.app.data.models.NotificacaoDto
import com.lavemeucarro.app.data.models.UnidadeDto
import com.lavemeucarro.app.data.remote.LavaMeuCarroApi
import com.lavemeucarro.app.managers.AuthManager
import com.lavemeucarro.app.managers.NotificationManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val api: LavaMeuCarroApi,
    private val authManager: AuthManager,
    private val notificationManager: NotificationManager
) : ViewModel() {

    private val _unidades = MutableStateFlow<List<UnidadeDto>>(emptyList())
    val unidades: StateFlow<List<UnidadeDto>> = _unidades

    private val _categorias = MutableStateFlow<List<CategoriaDto>>(emptyList())
    val categorias: StateFlow<List<CategoriaDto>> = _categorias

    val notifications: StateFlow<List<NotificacaoDto>> = notificationManager.notifications
    val unreadCount: StateFlow<Int> = notificationManager.unreadCount

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    val userName: StateFlow<String> = MutableStateFlow(
        authManager.currentUser.value?.nome ?: "Usuário"
    )

    fun loadData() {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val unidadesResult = api.getPopularUnidades()
                val categoriasResult = api.getCategorias()
                _unidades.value = unidadesResult
                _categorias.value = categoriasResult
                notificationManager.refreshNotifications()
            } catch (_: Exception) {
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun search(query: String, filter: String) {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                when (filter) {
                    "Unidade" -> _unidades.value = api.getUnidades(search = query.ifBlank { null })
                    "Serviço" -> {
                        // Search units that might have this service
                        _unidades.value = api.getUnidades(search = query.ifBlank { null })
                    }
                    "Profissional" -> {
                        _unidades.value = api.getUnidades(search = query.ifBlank { null })
                    }
                }
            } catch (_: Exception) {
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun markNotificationRead(id: String) {
        viewModelScope.launch { notificationManager.markAsRead(id) }
    }

    fun markAllNotificationsRead() {
        viewModelScope.launch { notificationManager.markAllAsRead() }
    }
}
