package com.TFSoftware.lavemeucarro.app.presentation.screens.home

import android.content.Context
import android.location.Geocoder
import android.location.Location
import android.location.LocationManager
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.TFSoftware.lavemeucarro.app.data.models.AgendamentoDto
import com.TFSoftware.lavemeucarro.app.data.models.CategoriaDto
import com.TFSoftware.lavemeucarro.app.data.models.AppointmentFeedbackRequest
import com.TFSoftware.lavemeucarro.app.data.models.NpsFeedbackRequest
import com.TFSoftware.lavemeucarro.app.data.models.NotificacaoDto
import com.TFSoftware.lavemeucarro.app.data.models.PromotionDto
import com.TFSoftware.lavemeucarro.app.data.models.PopularProfessionalDto
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
import java.util.Locale
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

    private val _searchResults = MutableStateFlow<List<UnidadeDto>>(emptyList())
    val searchResults: StateFlow<List<UnidadeDto>> = _searchResults

    private val _hasMoreResults = MutableStateFlow(false)
    val hasMoreResults: StateFlow<Boolean> = _hasMoreResults

    private var _currentSearchQuery: String? = null
    private var _currentSearchFilter: String? = null
    private var _currentSearchPage = 1
    private val _searchPageSize = 20

    private val _categorias = MutableStateFlow<List<CategoriaDto>>(emptyList())
    val categorias: StateFlow<List<CategoriaDto>> = _categorias

    private val _promotions = MutableStateFlow<List<PromotionDto>>(emptyList())
    val promotions: StateFlow<List<PromotionDto>> = _promotions

    private val _professionals = MutableStateFlow<List<PopularProfessionalDto>>(emptyList())
    val professionals: StateFlow<List<PopularProfessionalDto>> = _professionals

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
                
                // Get promotions with location filtering if available
                val lat = _userLatitude.value
                val lng = _userLongitude.value
                val promotionsResult = api.getPromotions(
                    lat = lat,
                    lng = lng,
                    radius = if (lat != null && lng != null) 50 else null
                )
                
                // Get popular professionals
                val professionalsResult = try { api.getPopularProfessionals() } catch (_: Exception) { emptyList() }
                
                _unidades.value = unidadesResult
                _categorias.value = categoriasResult
                _promotions.value = promotionsResult
                _professionals.value = professionalsResult
                
                notificationManager.refreshNotifications()
            } catch (_: Exception) {
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun search(query: String, filter: String, loadMore: Boolean = false) {
        viewModelScope.launch {
            _isLoading.value = !loadMore
            try {
                val lat = _userLatitude.value
                val lng = _userLongitude.value
                val city = _userCity.value
                
                // Store current search for pagination
                if (!loadMore) {
                    _currentSearchQuery = query
                    _currentSearchFilter = filter
                    _currentSearchPage = 1
                }
                
                // Use paged endpoint for search
                val result = api.getUnidadesPaged(
                    page = _currentSearchPage,
                    pageSize = _searchPageSize,
                    city = if (filter == "Unidade") city else null,
                    search = query.ifBlank { null }
                )
                
                val newItems = result.items
                
                if (loadMore) {
                    // Append to existing results
                    _searchResults.value = _searchResults.value + newItems
                } else {
                    // Replace results
                    _searchResults.value = newItems
                    _unidades.value = newItems
                }
                
                // Check if there are more results
                _hasMoreResults.value = _searchResults.value.size < result.total
                
            } catch (_: Exception) {
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun loadMoreSearchResults() {
        if (_hasMoreResults.value && !_isLoading.value) {
            _currentSearchPage++
            search(_currentSearchQuery ?: "", _currentSearchFilter ?: "Unidade", loadMore = true)
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

    val api2: LavaMeuCarroApi get() = api

    fun submitAppointmentFeedback(appointmentId: Int, professionalRating: Int? = null, salonRating: Int? = null, comment: String? = null, onSuccess: () -> Unit) {
        viewModelScope.launch {
            try {
                api.submitAppointmentFeedback(AppointmentFeedbackRequest(appointmentId, salonRating, professionalRating, comment))
                onSuccess()
            } catch (_: Exception) {}
        }
    }

    fun submitNpsFeedback(rating: Int, comment: String? = null, onSuccess: () -> Unit) {
        viewModelScope.launch {
            try {
                api.submitNpsFeedback(NpsFeedbackRequest(rating, comment))
                onSuccess()
            } catch (_: Exception) {}
        }
    }

    // Location state
    private val _userCity = MutableStateFlow<String?>(null)
    val userCity: StateFlow<String?> = _userCity
    private val _userState = MutableStateFlow<String?>(null)
    val userState: StateFlow<String?> = _userState
    private val _userLatitude = MutableStateFlow<Double?>(null)
    val userLatitude: StateFlow<Double?> = _userLatitude
    private val _userLongitude = MutableStateFlow<Double?>(null)
    val userLongitude: StateFlow<Double?> = _userLongitude
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
                    
                    // Reload promotions with location filtering
                    val promotionsResult = api.getPromotions()
                    _promotions.value = promotionsResult
                }
            } catch (_: Exception) {
                _cepResult.value = null
            } finally {
                _isLocationLoading.value = false
            }
        }
    }

    fun setLocationFromGps(city: String, state: String, lat: Double? = null, lng: Double? = null) {
        _userCity.value = city
        _userState.value = state
        if (lat != null) _userLatitude.value = lat
        if (lng != null) _userLongitude.value = lng
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val unidadesResult = api.getUnidades(
                    city = city,
                    lat = lat,
                    lng = lng,
                    radius = if (lat != null && lng != null) 50 else null
                )
                _unidades.value = unidadesResult
                
                // Reload promotions with location filtering
                val promotionsResult = api.getPromotions(
                    lat = lat,
                    lng = lng,
                    radius = if (lat != null && lng != null) 50 else null
                )
                _promotions.value = promotionsResult
            } catch (_: Exception) {}
            _isLoading.value = false
        }
    }

    fun clearLocationFilter() {
        _userCity.value = null
        _userState.value = null
        _userLatitude.value = null
        _userLongitude.value = null
        _cepResult.value = null
        loadData()
    }

    // Biometric state (for prompt on Home)
    private val _biometricPrompted = MutableStateFlow(false)
    val biometricPrompted: StateFlow<Boolean> = _biometricPrompted
    private val _biometricEnabled = MutableStateFlow(false)
    val biometricEnabled: StateFlow<Boolean> = _biometricEnabled
    private val _showBiometricPrompt = MutableStateFlow(false)
    val showBiometricPrompt: StateFlow<Boolean> = _showBiometricPrompt

    fun checkBiometricPrompt() {
        viewModelScope.launch {
            authManager.getBiometricPrompted().collect { prompted ->
                _biometricPrompted.value = prompted
            }
        }
        viewModelScope.launch {
            authManager.getBiometricEnabled().collect { enabled ->
                _biometricEnabled.value = enabled
            }
        }
    }

    fun setShowBiometricPrompt(show: Boolean) {
        _showBiometricPrompt.value = show
    }

    suspend fun setBiometricPrompted(prompted: Boolean) {
        authManager.setBiometricPrompted(prompted)
    }

    suspend fun setBiometricEnabled(enabled: Boolean) {
        authManager.setBiometricEnabled(enabled)
    }
}
