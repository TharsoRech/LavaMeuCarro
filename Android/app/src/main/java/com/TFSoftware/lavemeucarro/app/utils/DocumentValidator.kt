package com.TFSoftware.lavemeucarro.app.utils

object DocumentValidator {

    fun validateCpf(cpf: String): Boolean {
        val clean = cpf.replace(Regex("[^0-9]"), "")
        if (clean.length != 11) return false
        if (clean.distinct().size == 1) return false

        var sum = 0
        for (i in 0 until 9) sum += clean[i].digitToInt() * (10 - i)
        var remainder = 11 - (sum % 11)
        if (remainder == 10 || remainder == 11) remainder = 0
        if (remainder != clean[9].digitToInt()) return false

        sum = 0
        for (i in 0 until 10) sum += clean[i].digitToInt() * (11 - i)
        remainder = 11 - (sum % 11)
        if (remainder == 10 || remainder == 11) remainder = 0
        return remainder == clean[10].digitToInt()
    }

    fun validateCnpj(cnpj: String): Boolean {
        val clean = cnpj.replace(Regex("[^0-9]"), "")
        if (clean.length != 14) return false
        if (clean.distinct().size == 1) return false

        val weights1 = intArrayOf(5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2)
        var sum = 0
        for (i in 0 until 12) sum += clean[i].digitToInt() * weights1[i]
        var remainder = sum % 11
        val digit1 = if (remainder < 2) 0 else 11 - remainder
        if (clean[12].digitToInt() != digit1) return false

        val weights2 = intArrayOf(6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2)
        sum = 0
        for (i in 0 until 13) sum += clean[i].digitToInt() * weights2[i]
        remainder = sum % 11
        val digit2 = if (remainder < 2) 0 else 11 - remainder
        return clean[13].digitToInt() == digit2
    }

    fun validateDocument(doc: String, isProfessional: Boolean): ValidationResult {
        val clean = doc.replace(Regex("[^0-9]"), "")
        if (clean.isEmpty()) return ValidationResult(false, "")

        if (isProfessional) {
            return when (clean.length) {
                11 -> if (validateCpf(clean)) ValidationResult(true, "CPF válido")
                else ValidationResult(false, "CPF inválido")
                14 -> if (validateCnpj(clean)) ValidationResult(true, "CNPJ válido")
                else ValidationResult(false, "CNPJ inválido")
                else -> ValidationResult(false, "Informe CPF (11) ou CNPJ (14)")
            }
        } else {
            if (clean.length != 11) return ValidationResult(false, "CPF deve ter 11 dígitos")
            return if (validateCpf(clean)) ValidationResult(true, "CPF válido")
            else ValidationResult(false, "CPF inválido")
        }
    }

    fun formatCpf(value: String): String {
        val digits = value.replace(Regex("[^0-9]"), "").take(11)
        return when {
            digits.length <= 3 -> digits
            digits.length <= 6 -> "${digits.slice(0..2)}.${digits.slice(3..5)}"
            digits.length <= 9 -> "${digits.slice(0..2)}.${digits.slice(3..5)}.${digits.slice(6..8)}"
            else -> "${digits.slice(0..2)}.${digits.slice(3..5)}.${digits.slice(6..8)}-${digits.slice(9..10)}"
        }
    }

    fun formatCnpj(value: String): String {
        val digits = value.replace(Regex("[^0-9]"), "").take(14)
        return when {
            digits.length <= 2 -> digits
            digits.length <= 5 -> "${digits.slice(0..1)}.${digits.slice(2..4)}"
            digits.length <= 8 -> "${digits.slice(0..1)}.${digits.slice(2..4)}.${digits.slice(5..7)}"
            digits.length <= 12 -> "${digits.slice(0..1)}.${digits.slice(2..4)}.${digits.slice(5..7)}/${digits.slice(8..11)}"
            else -> "${digits.slice(0..1)}.${digits.slice(2..4)}.${digits.slice(5..7)}/${digits.slice(8..11)}-${digits.slice(12..13)}"
        }
    }

    fun formatDocument(value: String, isProfessional: Boolean): String {
        val digits = value.replace(Regex("[^0-9]"), "")
        return if (isProfessional && digits.length > 11) formatCnpj(value) else formatCpf(value)
    }
}

data class ValidationResult(val valid: Boolean, val message: String)
