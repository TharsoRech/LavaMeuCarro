package com.lavemeucarro.app.presentation.screens.appointments

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.lavemeucarro.app.data.models.AgendamentoDto
import com.lavemeucarro.app.data.remote.LavaMeuCarroApi
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AppointmentsViewModel @Inject constructor(
    private val api: LavaMeuCarroApi
) : ViewModel() {
    private val _appointments = MutableStateFlow<List<AgendamentoDto>>(emptyList())
    val appointments: StateFlow<List<AgendamentoDto>> = _appointments

    init {
        viewModelScope.launch {
            try { _appointments.value = api.getMyAgendamentos() } catch (_: Exception) {}
        }
    }
}
