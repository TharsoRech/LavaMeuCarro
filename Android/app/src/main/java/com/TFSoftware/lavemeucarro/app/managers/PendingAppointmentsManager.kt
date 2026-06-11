package com.TFSoftware.lavemeucarro.app.managers

import android.content.Context
import com.TFSoftware.lavemeucarro.app.data.remote.LavaMeuCarroApi
import com.TFSoftware.lavemeucarro.app.utils.NewRelicLogger
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Manages pending appointment count for professionals
 * Following HoraDaBeleza pattern: tracks "Pendente" status appointments
 */
@Singleton
class PendingAppointmentsManager @Inject constructor(
    @ApplicationContext private val context: Context,
    private val api: LavaMeuCarroApi
) {
    private val _pendingCount = MutableStateFlow(0)
    val pendingCount: StateFlow<Int> = _pendingCount

    private val _loadingPendingCount = MutableStateFlow(false)
    val loadingPendingCount: StateFlow<Boolean> = _loadingPendingCount

    private var isProfessional = false

    /**
     * Set whether current user is a professional
     */
    fun setUserRole(isProfessional: Boolean) {
        this.isProfessional = isProfessional
        if (!isProfessional) {
            _pendingCount.value = 0
            _loadingPendingCount.value = false
        }
    }

    /**
     * Refresh pending appointments count
     * Only works for professional users
     */
    suspend fun refreshPendingAppointments() {
        if (!isProfessional) {
            _pendingCount.value = 0
            _loadingPendingCount.value = false
            return
        }

        _loadingPendingCount.value = true
        try {
            // Get all pending appointments
            val pendingAppointments = api.getMyAgendamentos()
                .filter { it.status == "Pendente" }
            
            _pendingCount.value = pendingAppointments.size
        } catch (e: Exception) {
            NewRelicLogger.reportErrorWithMessage(
                e,
                "PendingAppointmentsManager.refreshPendingAppointments",
                "Failed to load pending appointments count"
            )
            _pendingCount.value = 0
        } finally {
            _loadingPendingCount.value = false
        }
    }

    /**
     * Decrement pending count (used after confirming an appointment)
     */
    fun decrementPendingCount() {
        if (_pendingCount.value > 0) {
            _pendingCount.value = _pendingCount.value - 1
        }
    }

    /**
     * Reset pending count to zero
     */
    fun reset() {
        _pendingCount.value = 0
        _loadingPendingCount.value = false
    }
}
