package com.lavemeucarro.app.utils

import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

object DateFormatter {

    private val displayFormat = SimpleDateFormat("dd/MM/yyyy", Locale("pt", "BR"))
    private val isoFormat = SimpleDateFormat("yyyy-MM-dd", Locale.US)
    private val dateTimeFormat = SimpleDateFormat("dd/MM/yyyy 'às' HH:mm", Locale("pt", "BR"))
    private val timeFormat = SimpleDateFormat("HH:mm", Locale("pt", "BR"))
    private val apiDateTimeFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US)

    fun formatDisplay(date: Date): String = displayFormat.format(date)
    fun formatIso(date: Date): String = isoFormat.format(date)
    fun formatDateTime(date: Date): String = dateTimeFormat.format(date)
    fun formatTime(date: Date): String = timeFormat.format(date)

    fun parseIso(dateString: String): Date? = try {
        isoFormat.parse(dateString)
    } catch (_: Exception) { null }

    fun parseApiDateTime(dateString: String): Date? = try {
        apiDateTimeFormat.parse(dateString)
    } catch (_: Exception) {
        try { displayFormat.parse(dateString) } catch (_: Exception) { null }
    }

    fun formatToDisplay(isoDate: String): String {
        val date = parseIso(isoDate) ?: return isoDate
        return displayFormat.format(date)
    }

    fun formatToIso(displayDate: String): String? {
        val parts = displayDate.split("/")
        if (parts.size != 3) return null
        val day = parts[0].padStart(2, '0')
        val month = parts[1].padStart(2, '0')
        val year = parts[2]
        return "$year-$month-$day"
    }

    fun formatDateInput(value: String): String {
        val digits = value.replace(Regex("[^0-9]"), "").take(8)
        return when {
            digits.length <= 2 -> digits
            digits.length <= 4 -> "${digits.slice(0..1)}/${digits.slice(2..3)}"
            else -> "${digits.slice(0..1)}/${digits.slice(2..3)}/${digits.slice(4..7)}"
        }
    }

    fun validateBirthDate(dateStr: String): DateValidationResult {
        if (dateStr.length != 10) return DateValidationResult(false, "Formato: DD/MM/AAAA")
        val parts = dateStr.split("/")
        if (parts.size != 3) return DateValidationResult(false, "Formato inválido")
        val date = parseIso(formatToIso(dateStr) ?: return DateValidationResult(false, "Data inválida"))
            ?: return DateValidationResult(false, "Data inválida")
        val today = Calendar.getInstance()
        val birth = Calendar.getInstance().apply { time = date }
        val age = today.get(Calendar.YEAR) - birth.get(Calendar.YEAR)
        if (age < 13) return DateValidationResult(false, "Idade mínima: 13 anos")
        if (age > 120) return DateValidationResult(false, "Data de nascimento inválida")
        return DateValidationResult(true, "Data válida")
    }

    fun getNext14Days(): List<Date> {
        val cal = Calendar.getInstance()
        cal.set(Calendar.HOUR_OF_DAY, 0)
        cal.set(Calendar.MINUTE, 0)
        cal.set(Calendar.SECOND, 0)
        cal.set(Calendar.MILLISECOND, 0)
        return (0 until 14).map {
            val d = Calendar.getInstance().apply {
                time = cal.time
                add(Calendar.DAY_OF_MONTH, it)
            }.time
            d
        }
    }

    fun getDayName(date: Date): String {
        val sdf = SimpleDateFormat("EEE", Locale("pt", "BR"))
        return sdf.format(date).replaceFirstChar { it.uppercase() }
    }

    fun getDayMonth(date: Date): String {
        val sdf = SimpleDateFormat("dd/MM", Locale("pt", "BR"))
        return sdf.format(date)
    }

    fun isSameDay(d1: Date, d2: Date): Boolean {
        val c1 = Calendar.getInstance().apply { time = d1 }
        val c2 = Calendar.getInstance().apply { time = d2 }
        return c1.get(Calendar.YEAR) == c2.get(Calendar.YEAR) &&
                c1.get(Calendar.DAY_OF_YEAR) == c2.get(Calendar.DAY_OF_YEAR)
    }

    fun generateTimeSlots(startHour: Int = 7, endHour: Int = 23, intervalMinutes: Int = 30): List<String> {
        val slots = mutableListOf<String>()
        val cal = Calendar.getInstance()
        for (h in startHour until endHour) {
            for (m in listOf(0, 30)) {
                if (intervalMinutes == 30 || m == 0) {
                    cal.set(Calendar.HOUR_OF_DAY, h)
                    cal.set(Calendar.MINUTE, m)
                    slots.add(timeFormat.format(cal.time))
                }
            }
        }
        return slots
    }
}

data class DateValidationResult(val valid: Boolean, val message: String)
