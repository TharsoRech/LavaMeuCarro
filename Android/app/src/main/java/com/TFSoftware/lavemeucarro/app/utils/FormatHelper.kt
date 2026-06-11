package com.TFSoftware.lavemeucarro.app.utils

object FormatHelper {

    fun formatPhone(value: String): String {
        val digits = value.replace(Regex("[^0-9]"), "").take(11)
        return when {
            digits.length <= 2 -> digits
            digits.length <= 7 -> "(${digits.slice(0..1)}) ${digits.slice(2..6)}"
            digits.length <= 11 -> "(${digits.slice(0..1)}) ${digits.slice(2..6)}-${digits.slice(7..10)}"
            else -> digits
        }
    }

    fun formatCPF(value: String): String {
        val digits = value.replace(Regex("[^0-9]"), "").take(11)
        return when {
            digits.length <= 3 -> digits
            digits.length <= 6 -> "${digits.slice(0..2)}.${digits.slice(3..5)}"
            digits.length <= 9 -> "${digits.slice(0..2)}.${digits.slice(3..5)}.${digits.slice(6..8)}"
            digits.length <= 11 -> "${digits.slice(0..2)}.${digits.slice(3..5)}.${digits.slice(6..8)}-${digits.slice(9..10)}"
            else -> digits
        }
    }

    fun formatCNPJ(value: String): String {
        val digits = value.replace(Regex("[^0-9]"), "").take(14)
        return when {
            digits.length <= 2 -> digits
            digits.length <= 5 -> "${digits.slice(0..1)}.${digits.slice(2..4)}"
            digits.length <= 8 -> "${digits.slice(0..1)}.${digits.slice(2..4)}.${digits.slice(5..7)}"
            digits.length <= 12 -> "${digits.slice(0..1)}.${digits.slice(2..4)}.${digits.slice(5..7)}/${digits.slice(8..11)}"
            digits.length <= 14 -> "${digits.slice(0..1)}.${digits.slice(2..4)}.${digits.slice(5..7)}/${digits.slice(8..11)}-${digits.slice(12..13)}"
            else -> digits
        }
    }
}
