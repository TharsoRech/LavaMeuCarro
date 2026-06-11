package com.TFSoftware.lavemeucarro.app.utils

import android.os.Build
import com.TFSoftware.lavemeucarro.app.data.remote.LavaMeuCarroApi
import com.TFSoftware.lavemeucarro.app.data.models.MobileTelemetryRequest
import com.TFSoftware.lavemeucarro.app.managers.AuthManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * New Relic Logger for Android - Logs directly to backend API
 * Following HoraDaBeleza pattern: logs go to backend, backend sends to New Relic
 */
object NewRelicLogger {
    
    private const val TELEMETRY_ENDPOINT = "/telemetry/mobile-log"
    private const val MAX_LOG_STRING_LENGTH = 2000
    private const val MAX_LOG_DEPTH = 4
    
    /**
     * Report an error to New Relic
     */
    fun reportError(error: Throwable, context: String) {
        val message = error.message ?: "Unknown error"
        val stack = error.stackTraceToString()
        sendLogToNewRelic("Error", message, context, stack)
    }
    
    /**
     * Report an error with custom message
     */
    fun reportErrorWithMessage(error: Throwable, context: String, message: String, details: Map<String, Any?>? = null) {
        val stack = error.stackTraceToString()
        val enhancedMessage = if (details != null) {
            "$message | details=${sanitizeValueForLogs(details)}"
        } else {
            message
        }
        sendLogToNewRelic("Error", enhancedMessage, context, stack)
    }
    
    /**
     * Report a warning to New Relic
     */
    fun reportWarning(message: String, context: String, details: Map<String, Any?>? = null) {
        val enhancedMessage = if (details != null) {
            "$message | details=${sanitizeValueForLogs(details)}"
        } else {
            message
        }
        sendLogToNewRelic("Warning", enhancedMessage, context, safeSerialize(details))
    }
    
    /**
     * Report informational message to New Relic
     */
    fun reportInfo(message: String, context: String, details: Map<String, Any?>? = null) {
        val enhancedMessage = if (details != null) {
            "$message | details=${sanitizeValueForLogs(details)}"
        } else {
            message
        }
        sendLogToNewRelic("Information", enhancedMessage, context, safeSerialize(details))
    }
    
    /**
     * Send log to New Relic via backend API
     */
    private fun sendLogToNewRelic(
        level: String,
        message: String,
        context: String,
        stack: String? = null
    ) {
        if (message.isBlank()) return
        
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val authManager = AuthManager.getInstance(
                    com.TFSoftware.lavemeucarro.app.LavaMeuCarroApp.context
                )
                val token = authManager.getAccessToken()
                
                // Only log authenticated users (LGPD compliance)
                if (token == null) return@launch
                
                val userId = authManager.getUserId()?.toString() ?: "anonymous"
                
                // Build device info
                val deviceInfo = buildDeviceInfo()
                
                val request = MobileTelemetryRequest(
                    level = level,
                    message = truncateLogString(message),
                    context = context,
                    stack = stack,
                    platform = "android",
                    appVersion = BuildConfig.VERSION_NAME,
                    appBuildNumber = BuildConfig.VERSION_CODE.toString(),
                    appVersionLabel = null,
                    clientTimestamp = java.text.SimpleDateFormat(
                        "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
                        java.util.Locale.US
                    ).format(java.util.Date()),
                    device = deviceInfo
                )
                
                // Send to backend via Retrofit
                val retrofit = retrofit2.Retrofit.Builder()
                    .baseUrl("https://lavameucarro.tharsorechcuria.com/")
                    .addConverterFactory(retrofit2.converter.gson.GsonConverterFactory.create())
                    .build()
                
                val api = retrofit.create(LavaMeuCarroApi::class.java)
                api.sendTelemetry("Bearer $token", request).execute()
                
            } catch (e: Exception) {
                // Never break app flow due to logging failures
                android.util.Log.e("NewRelicLogger", "Failed to send telemetry", e)
            }
        }
    }
    
    /**
     * Build device information
     */
    private fun buildDeviceInfo(): Map<String, Any?> {
        return mapOf(
            "deviceModel" to Build.MODEL,
            "deviceBrand" to Build.BRAND,
            "deviceManufacturer" to Build.MANUFACTURER,
            "osName" to "Android",
            "osVersion" to Build.VERSION.RELEASE,
            "osBuildId" to Build.DISPLAY,
            "isDevice" to true,
            "totalMemory" to Runtime.getRuntime().maxMemory()
        )
    }
    
    /**
     * Truncate long log strings
     */
    private fun truncateLogString(value: String): String {
        if (value.length <= MAX_LOG_STRING_LENGTH) return value
        return "${value.substring(0, MAX_LOG_STRING_LENGTH)}...[truncated ${value.length - MAX_LOG_STRING_LENGTH} chars]"
    }
    
    /**
     * Sanitize value for logs (prevent sensitive data leakage)
     */
    private fun sanitizeValueForLogs(value: Any?, depth: Int = 0): String {
        if (depth >= MAX_LOG_DEPTH) return "[MaxDepthReached]"
        if (value == null) return "null"
        
        return try {
            val json = android.util.JsonWriter().use { 
                it.value(value.toString())
            }.toString()
            truncateLogString(json)
        } catch (e: Exception) {
            truncateLogString(value.toString())
        }
    }
    
    /**
     * Safe serialize object to string
     */
    private fun safeSerialize(value: Any?): String? {
        if (value == null) return null
        return try {
            val gson = com.google.gson.Gson()
            truncateLogString(gson.toJson(value))
        } catch (e: Exception) {
            truncateLogString(value.toString())
        }
    }
}
