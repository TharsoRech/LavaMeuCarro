package com.TFSoftware.lavemeucarro.app.utils

import android.content.Context
import android.content.Intent
import android.net.Uri

object WhatsAppHelper {

    fun openWhatsApp(context: Context, phoneNumber: String?, subject: String? = null, message: String? = null) {
        val cleanNumber = phoneNumber?.replace(Regex("[^0-9+]"), "") ?: return
        val text = buildString {
            if (subject != null) append("*$subject*\n\n")
            if (message != null) append(message)
        }

        val uri = Uri.parse("https://wa.me/$cleanNumber${if (text.isNotEmpty()) "?text=${Uri.encode(text)}" else ""}")
        val intent = Intent(Intent.ACTION_VIEW, uri).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }

        try {
            context.startActivity(intent)
        } catch (_: Exception) {
            // Fallback: open WhatsApp main screen
            try {
                val fallbackIntent = Intent(Intent.ACTION_VIEW, Uri.parse("https://wa.me/")).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                context.startActivity(fallbackIntent)
            } catch (_: Exception) {}
        }
    }

    fun openWhatsAppChat(context: Context, phoneNumber: String?) {
        openWhatsApp(context, phoneNumber, message = null)
    }
}
