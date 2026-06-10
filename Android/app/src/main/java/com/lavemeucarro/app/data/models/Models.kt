package com.lavemeucarro.app.data.models

import com.google.gson.annotations.SerializedName

// Auth
data class LoginRequest(val email: String, val senha: String, val tipo: String = "Client")
data class RegisterRequest(val nome: String, val email: String, val senha: String, val telefone: String? = null)
data class RefreshRequest(val refreshToken: String)
data class ChangePasswordRequest(val senhaAtual: String, val novaSenha: String)

data class AuthResponse(
    val token: String,
    val refreshToken: String,
    val user: UserDto
)

// User
data class UserDto(
    val id: String,
    val nome: String,
    val email: String,
    val telefone: String? = null,
    val tipo: String,
    val ativo: Boolean = true
)

// Unidade
data class UnidadeDto(
    val id: String,
    val nome: String,
    val email: String? = null,
    val telefone: String? = null,
    val endereco: String? = null,
    val horarioAbertura: String? = null,
    val horarioFechamento: String? = null,
    val latitude: Double? = null,
    val longitude: Double? = null,
    val ativo: Boolean = true,
    val distanciaKm: Double? = null
)

// Agendamento
data class AgendamentoDto(
    val id: String,
    val clienteNome: String? = null,
    val servicoNome: String? = null,
    val unidadeNome: String? = null,
    val data: String? = null,
    val hora: String? = null,
    val status: String,
    val preco: Double? = null,
    val modalidade: String? = null,
    val veiculoPlaca: String? = null,
    val observacoes: String? = null
)

data class CreateAgendamentoRequest(
    val unidadeId: String,
    val servicoId: String,
    val veiculoId: String,
    val data: String,
    val hora: String,
    val modalidade: String = "NoLocal",
    val observacoes: String? = null,
    val enderecoRetirada: String? = null,
    val enderecoEntrega: String? = null
)

data class UpdateStatusRequest(val status: String)

// Servico
data class ServicoDto(
    val id: String,
    val nome: String,
    val descricao: String? = null,
    val preco: Double,
    val duracaoMinutos: Int,
    val categoriaNome: String? = null,
    val ativo: Boolean = true
)

// Veiculo
data class VeiculoDto(
    val id: String,
    val placa: String,
    val marca: String? = null,
    val modelo: String? = null,
    val cor: String? = null,
    val tamanho: String? = null
)

data class CreateVeiculoRequest(
    val placa: String,
    val marca: String,
    val modelo: String,
    val cor: String? = null,
    val tamanho: String? = null
)

// Categoria
data class CategoriaDto(
    val id: String,
    val nome: String,
    val descricao: String? = null
)

// Push
data class PushTokenRequest(val token: String, val plataforma: String = "Android")
