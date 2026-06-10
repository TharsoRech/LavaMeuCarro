package com.lavemeucarro.app.presentation.screens.appointments

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.lavemeucarro.app.data.models.AgendamentoDto
import com.lavemeucarro.app.data.models.DashboardSummaryDTO
import com.lavemeucarro.app.data.models.UnidadeDto
import com.lavemeucarro.app.data.remote.LavaMeuCarroApi
import com.lavemeucarro.app.managers.AuthManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AppointmentsViewModel @Inject constructor(
    private val api: LavaMeuCarroApi,
    private val authManager: AuthManager
) : ViewModel() {

    private val _appointments = MutableStateFlow<List<AgendamentoDto>>(emptyList())
    val appointments: StateFlow<List<AgendamentoDto>> = _appointments

    private val _isProfessional = MutableStateFlow(authManager.isProfessional())
    val isProfessional: StateFlow<Boolean> = _isProfessional

    private val _myUnits = MutableStateFlow<List<UnidadeDto>>(emptyList())
    val myUnits: StateFlow<List<UnidadeDto>> = _myUnits

    private val _selectedUnit = MutableStateFlow<UnidadeDto?>(null)
    val selectedUnit: StateFlow<UnidadeDto?> = _selectedUnit

    private val _dashboardSummary = MutableStateFlow<DashboardSummaryDTO?>(null)
    val dashboardSummary: StateFlow<DashboardSummaryDTO?> = _dashboardSummary

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    fun loadMyAppointments() {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                _appointments.value = api.getMyAgendamentos()
            } catch (_: Exception) {
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun loadUnitAppointments(unidadeId: String, date: String?) {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                _appointments.value = api.getUnidadeAgendamentos(unidadeId, date)
            } catch (_: Exception) {
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun loadDashboardSummary(unidadeId: String) {
        viewModelScope.launch {
            try {
                _dashboardSummary.value = api.getDashboardSummary(unidadeId)
            } catch (_: Exception) {
            }
        }
    }

    fun loadMyUnits() {
        viewModelScope.launch {
            try {
                val units = api.getMyUnidades()
                _myUnits.value = units
                if (units.isNotEmpty() && _selectedUnit.value == null) {
                    _selectedUnit.value = units.first()
                }
            } catch (_: Exception) {
            }
        }
    }

    fun selectUnit(unit: UnidadeDto) {
        _selectedUnit.value = unit
    }

    fun updateStatus(appointmentId: String, status: String) {
        viewModelScope.launch {
            try {
                api.updateAgendamentoStatus(
                    appointmentId,
                    com.lavemeucarro.app.data.models.UpdateStatusRequest(status)
                )
                // Refresh list
                if (_isProfessional.value && _selectedUnit.value != null) {
                    loadUnitAppointments(_selectedUnit.value!!.id, null)
                    loadDashboardSummary(_selectedUnit.value!!.id)
                } else {
                    loadMyAppointments()
                }
            } catch (_: Exception) {
            }
        }
    }
}
