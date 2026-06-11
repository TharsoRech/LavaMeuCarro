package com.lavemeucarro.app.presentation.screens.appointments

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.lavemeucarro.app.data.models.AgendamentoDto
import com.lavemeucarro.app.data.models.ClientAppointmentHistoryDTO
import com.lavemeucarro.app.data.models.DashboardSummaryDTO
import com.lavemeucarro.app.data.models.ProfessionalOptionDTO
import com.lavemeucarro.app.data.models.ReassignProfessionalRequest
import com.lavemeucarro.app.data.models.UnidadeDto
import com.lavemeucarro.app.data.models.UpdateStatusRequest
import com.lavemeucarro.app.data.remote.LavaMeuCarroApi
import com.lavemeucarro.app.managers.AuthManager
import com.lavemeucarro.app.utils.DateFormatter
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import java.util.Date
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

    private val _isRefreshing = MutableStateFlow(false)
    val isRefreshing: StateFlow<Boolean> = _isRefreshing

    // Pending days map: dateStr -> pending count
    private val _pendingDaysMap = MutableStateFlow<Map<String, Int>>(emptyMap())
    val pendingDaysMap: StateFlow<Map<String, Int>> = _pendingDaysMap

    // Ready to finalize days map: dateStr -> count
    private val _readyToFinalizeDaysMap = MutableStateFlow<Map<String, Int>>(emptyMap())
    val readyToFinalizeDaysMap: StateFlow<Map<String, Int>> = _readyToFinalizeDaysMap

    // Batch processing state
    private val _isBatchProcessing = MutableStateFlow(false)
    val isBatchProcessing: StateFlow<Boolean> = _isBatchProcessing

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

    // Currently selected date for refresh context
    private var _currentDate: String? = null

    fun loadUnitAppointments(unidadeId: String, date: String?) {
        _currentDate = date
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
                    UpdateStatusRequest(status)
                )
                refreshCurrentView()
            } catch (_: Exception) {
            }
        }
    }

    fun batchUpdateStatus(appointmentIds: List<String>, targetStatus: String, onResult: (Int, Int) -> Unit) {
        viewModelScope.launch {
            _isBatchProcessing.value = true
            var successCount = 0
            var failCount = 0
            try {
                val results = appointmentIds.map { id ->
                    async {
                        try {
                            api.updateAgendamentoStatus(id, UpdateStatusRequest(targetStatus))
                            true
                        } catch (_: Exception) {
                            false
                        }
                    }
                }.map { it.await() }
                successCount = results.count { it }
                failCount = results.size - successCount
                refreshCurrentView()
            } catch (_: Exception) {
            } finally {
                _isBatchProcessing.value = false
                onResult(successCount, failCount)
            }
        }
    }

    fun loadPendingDays(dates: List<Date>, unidadeId: String) {
        viewModelScope.launch {
            try {
                val pendingMap = mutableMapOf<String, Int>()
                val readyMap = mutableMapOf<String, Int>()

                // Fetch in batches of 4 to reduce server load
                val batchSize = 4
                for (i in dates.indices step batchSize) {
                    val batch = dates.subList(i, minOf(i + batchSize, dates.size))
                    val results = batch.map { date ->
                        async {
                            val dateStr = DateFormatter.formatIso(date)
                            try {
                                val appts = api.getUnidadeAgendamentos(unidadeId, dateStr)
                                val pending = appts.count { it.status == "Pendente" }
                                val readyToFinalize = appts.count {
                                    it.status == "Confirmado" && canBeMarkedAsCompleted(it)
                                }
                                dateStr to (pending to readyToFinalize)
                            } catch (_: Exception) {
                                dateStr to (0 to 0)
                            }
                        }
                    }.map { it.await() }

                    results.forEach { (dateStr, counts) ->
                        if (counts.first > 0) pendingMap[dateStr] = counts.first
                        if (counts.second > 0) readyMap[dateStr] = counts.second
                    }

                    // Update UI progressively after each batch
                    _pendingDaysMap.value = pendingMap.toMap()
                    _readyToFinalizeDaysMap.value = readyMap.toMap()
                }
            } catch (_: Exception) {
            }
        }
    }

    fun cancelWithReason(appointmentId: String, reason: String?, onResult: (Boolean) -> Unit) {
        viewModelScope.launch {
            try {
                api.cancelAgendamento(appointmentId, reason)
                refreshCurrentView()
                onResult(true)
            } catch (_: Exception) {
                onResult(false)
            }
        }
    }

    fun getClientHistory(appointmentId: String, onResult: (ClientAppointmentHistoryDTO?) -> Unit) {
        viewModelScope.launch {
            try {
                val history = api.getClientAppointmentHistory(appointmentId)
                onResult(history)
            } catch (_: Exception) {
                onResult(null)
            }
        }
    }

    fun getEligibleProfessionals(appointmentId: String, onResult: (List<ProfessionalOptionDTO>) -> Unit) {
        viewModelScope.launch {
            try {
                val options = api.getEligibleProfessionals(appointmentId)
                onResult(options)
            } catch (_: Exception) {
                onResult(emptyList())
            }
        }
    }

    fun reassignProfessional(appointmentId: String, newProfessionalId: Int, onResult: (Boolean) -> Unit) {
        viewModelScope.launch {
            try {
                api.reassignProfessional(appointmentId, ReassignProfessionalRequest(newProfessionalId))
                refreshCurrentView()
                onResult(true)
            } catch (_: Exception) {
                onResult(false)
            }
        }
    }

    fun silentRefresh() {
        viewModelScope.launch {
            _isRefreshing.value = true
            try {
                refreshCurrentView()
            } catch (_: Exception) {
            } finally {
                _isRefreshing.value = false
            }
        }
    }

    private fun refreshCurrentView() {
        if (_isProfessional.value && _selectedUnit.value != null) {
            loadUnitAppointments(_selectedUnit.value!!.id, _currentDate)
            loadDashboardSummary(_selectedUnit.value!!.id)
        } else {
            loadMyAppointments()
        }
    }

    companion object {
        fun canBeMarkedAsCompleted(appointment: AgendamentoDto): Boolean {
            if (appointment.status != "Confirmado") return false
            val dateStr = appointment.data ?: return false
            val timeStr = appointment.hora?.take(5) ?: return false
            return try {
                val parts = dateStr.split("-")
                val timeParts = timeStr.split(":")
                if (parts.size < 3 || timeParts.size < 2) return false
                val year = parts[0].toInt()
                val month = parts[1].toInt()
                val day = parts[2].toInt()
                val hour = timeParts[0].toInt()
                val minute = timeParts[1].toInt()
                val cal = java.util.Calendar.getInstance().apply {
                    set(year, month - 1, day, hour, minute, 0)
                }
                // Add 30 min duration
                cal.add(java.util.Calendar.MINUTE, 30)
                cal.timeInMillis <= System.currentTimeMillis()
            } catch (_: Exception) {
                false
            }
        }
    }
}
