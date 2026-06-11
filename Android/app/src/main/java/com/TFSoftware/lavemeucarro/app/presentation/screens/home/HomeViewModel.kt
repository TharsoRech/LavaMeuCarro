package com.TFSoftware.lavemeucarro.app.presentation.screens.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.TFSoftware.lavemeucarro.app.data.models.AgendamentoDto
import com.TFSoftware.lavemeucarro.app.data.models.CategoriaDto
import com.TFSoftware.lavemeucarro.app.data.models.CreateReviewRequest
import com.TFSoftware.lavemeucarro.app.data.models.NotificacaoDto
import com.TFSoftware.lavemeucarro.app.data.models.PromotionDto
import com.TFSoftware.lavemeucarro.app.data.models.UnidadeDto
import com.TFSoftware.lavemeucarro.app.data.remote.LavaMeuCarroApi
import com.TFSoftware.lavemeucarro.app.data.remote.ViaCepApi
import com.TFSoftware.lavemeucarro.app.data.remote.ViaCepResponse
import com.TFSoftware.lavemeucarro.app.managers.AuthManager
import com.TFSoftware.lavemeucarro.app.managers.NotificationManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val api: LavaMeuCarroApi,
    private val viaCepApi: ViaCepApi,
    private val authManager: AuthManager,
    private val notificationManager: NotificationManager
) : ViewModel() {

    private val _unidades = MutableStateFlow<List<UnidadeDto>>(emptyList())
    val unidades: StateFlow<List<UnidadeDto>> = _unidades

    private val _categorias = MutableStateFlow<List<CategoriaDto>>(emptyList())
    val categorias: StateFlow<List<CategoriaDto>> = _categorias

    private val _promotions = MutableStateFlow<List<PromotionDto>>(emptyList())
    val promotions: StateFlow<List<PromotionDto>> = _promotions

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
                val promotionsResult = api.getPromotions()
                _unidades.value = unidadesResult
                _categorias.value = categoriasResult
                _promotions.value = promotionsResult
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

    private val _selectedAppointment = MutableStateFlow<AgendamentoDto?>(null)
    val selectedAppointment: StateFlow<AgendamentoDto?> = _selectedAppointment

    fun fetchAppointmentById(id: String) {
        viewModelScope.launch {
            try { _selectedAppointment.value = api.getAgendamentoById(id) } catch (_: Exception) {}
        }
    }

    fun clearSelectedAppointment() { _selectedAppointment.value = null }

    fun submitReview(agendamentoId: String, rating: Int, comment: String?, onSuccess: () -> Unit) {
        viewModelScope.launch {
            try {
                api.createReview(CreateReviewRequest(agendamentoId, rating, comment))
                onSuccess()
            } catch (_: Exception) {}
        }
    }

    // Location state
    private val _userCity = MutableStateFlow<String?>(null)
    val userCity: StateFlow<String?> = _userCity
    private val _userState = MutableStateFlow<String?>(null)
    val userState: StateFlow<String?> = _userState
    private val _cepResult = MutableStateFlow<ViaCepResponse?>(null)
    val cepResult: StateFlow<ViaCepResponse?> = _cepResult
    private val _isLocationLoading = MutableStateFlow(false)
    val isLocationLoading: StateFlow<Boolean> = _isLocationLoading

    fun lookupCep(cep: String) {
        viewModelScope.launch {
            _isLocationLoading.value = true
            try {
                val result = viaCepApi.getCep(cep.replace("[^0-9]", ""))
                _cepResult.value = result
                result.localidade?.let { city ->
                    _userCity.value = city
                    _userState.value = result.uf
                    // Reload unidades filtered by city
                    val unidadesResult = api.getUnidades(city = city)
                    _unidades.value = unidadesResult
                }
            } catch (_: Exception) {
                _cepResult.value = null
            } finally {
                _isLocationLoading.value = false
            }
        }
    }

    fun setLocationFromGps(city: String, state: String) {
        _userCity.value = city
        _userState.value = state
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val unidadesResult = api.getUnidades(city = city)
                _unidades.value = unidadesResult
            } catch (_: Exception) {}
            _isLoading.value = false
        }
    }

    fun clearLocationFilter() {
        _userCity.value = null
        _userState.value = null
        _cepResult.value = null
        loadData()
    }
}
