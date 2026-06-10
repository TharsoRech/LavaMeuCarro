package com.lavemeucarro.app.presentation.screens.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.lavemeucarro.app.data.models.UnidadeDto
import com.lavemeucarro.app.data.remote.LavaMeuCarroApi
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val api: LavaMeuCarroApi
) : ViewModel() {

    private val _unidades = MutableStateFlow<List<UnidadeDto>>(emptyList())
    val unidades: StateFlow<List<UnidadeDto>> = _unidades

    init { loadUnidades() }

    fun loadUnidades() {
        viewModelScope.launch {
            try { _unidades.value = api.getUnidades() } catch (_: Exception) {}
        }
    }

    fun search(query: String) {
        viewModelScope.launch {
            try { _unidades.value = api.getUnidades(search = query.ifBlank { null }) } catch (_: Exception) {}
        }
    }
}
