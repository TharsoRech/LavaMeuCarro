package com.TFSoftware.lavemeucarro.app.data.models

import com.google.gson.annotations.SerializedName

// ==================== Auth ====================
data class LoginRequest(
    val email: String,
    val senha: String,
    val tipo: String = "Client"
)

data class RegisterRequest(
    val nome: String,
    val email: String,
    val senha: String,
    val telefone: String? = null,
    val doc: String? = null,
    val dob: String? = null,
    val role: String = "CLIENT",
    val base64Image: String? = null,
    val consents: List<LegalConsentDto>? = null,
    val verificationCode: String? = null
)

data class RefreshRequest(val refreshToken: String)
data class ChangePasswordRequest(val senhaAtual: String, val novaSenha: String)

data class AuthResponse(
    val token: String,
    val refreshToken: String,
    val user: UserDto
)

data class EmailVerificationRequest(val email: String)
data class EmailVerificationResponse(
    val sent: Boolean,
    val developmentCode: String? = null
)

// ==================== User ====================
data class UserDto(
    val id: String,
    val nome: String,
    val email: String,
    val telefone: String? = null,
    val tipo: String,
    val ativo: Boolean = true,
    val doc: String? = null,
    val dob: String? = null,
    val country: String? = null,
    val username: String? = null,
    val base64Image: String? = null,
    val cpfCnpj: String? = null
)

data class UpdateProfileRequest(
    val name: String? = null,
    val phone: String? = null,
    val base64Image: String? = null,
    val doc: String? = null,
    val dob: String? = null,
    val username: String? = null,
    val country: String? = null,
    val tipo: Int? = null
)

// ==================== Unidade ====================
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
    val distanciaKm: Double? = null,
    val ownerId: String? = null,
    val description: String? = null,
    val logoUrl: String? = null,
    val address: String? = null,
    val number: String? = null,
    val complement: String? = null,
    val neighborhood: String? = null,
    val city: String? = null,
    val state: String? = null,
    val zipCode: String? = null,
    val whatsApp: String? = null,
    val instagramUrl: String? = null,
    val rating: Int? = null,
    val reviews: Int? = null,
    val averageRating: Double? = null,
    val published: Boolean = true,
    val gallery: String? = null,
    val schedulingTimeOptions: String? = null,
    val schedulingTimeInterval: Int? = null,
    val ofereceLevaTraz: Boolean = false,
    val raioMaximoKm: Int? = null,
    val tipoTaxaDeslocamento: String? = null,
    val taxaDeslocamento: Double? = null,
    val referencePoint: String? = null,
    val businessHours: String? = null,
    val createdAt: String? = null
)

data class CreateUnidadeRequest(
    val name: String,
    val description: String? = null,
    val logoUrl: String? = null,
    val address: String? = null,
    val number: String? = null,
    val complement: String? = null,
    val neighborhood: String? = null,
    val city: String? = null,
    val state: String? = null,
    val zipCode: String? = null,
    val latitude: Double? = null,
    val longitude: Double? = null,
    val phone: String? = null,
    val email: String? = null,
    val businessHours: String? = null,
    val gallery: String? = null,
    val whatsApp: String? = null,
    val instagramUrl: String? = null,
    val schedulingTimeOptions: String? = null,
    val schedulingTimeInterval: Int? = null,
    val ofereceLevaTraz: Boolean = false,
    val raioMaximoKm: Int? = null,
    val tipoTaxaDeslocamento: String? = null,
    val taxaDeslocamento: Double? = null,
    val referencePoint: String? = null
)

data class UpdateUnidadeRequest(
    val name: String? = null,
    val description: String? = null,
    val logoUrl: String? = null,
    val address: String? = null,
    val number: String? = null,
    val complement: String? = null,
    val neighborhood: String? = null,
    val referencePoint: String? = null,
    val city: String? = null,
    val state: String? = null,
    val zipCode: String? = null,
    val latitude: Double? = null,
    val longitude: Double? = null,
    val phone: String? = null,
    val email: String? = null,
    val businessHours: String? = null,
    val gallery: String? = null,
    val whatsApp: String? = null,
    val instagramUrl: String? = null,
    val schedulingTimeOptions: String? = null,
    val schedulingTimeInterval: Int? = null,
    val active: Boolean? = null,
    val published: Boolean? = null,
    val ofereceLevaTraz: Boolean? = null,
    val raioMaximoKm: Int? = null,
    val tipoTaxaDeslocamento: String? = null,
    val taxaDeslocamento: Double? = null
)

// ==================== Agendamento ====================
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
    val observacoes: String? = null,
    val unidadeId: String? = null,
    val servicoId: String? = null,
    val funcionarioId: String? = null,
    val funcionarioNome: String? = null,
    val scheduledAt: String? = null,
    val totalPrice: Double? = null,
    val cancellationReason: String? = null,
    val isReviewed: Boolean = false,
    val clientPhone: String? = null,
    val clientCity: String? = null,
    val clientId: String? = null,
    val clientTotalAppointments: Int? = null,
    val clientNoShowTotal: Int? = null,
    val clientImage: String? = null,
    val funcionarioImage: String? = null,
    val unidadeLogoUrl: String? = null,
    val unidadeWhatsApp: String? = null,
    val unidadeAddress: String? = null,
    val durationMinutes: Int? = null,
    val veiculoModelo: String? = null
)

// Client appointment history
data class ClientAppointmentHistoryDTO(
    val atThisSalon: List<ClientAppointmentHistoryItemDTO> = emptyList()
)

data class ClientAppointmentHistoryItemDTO(
    val id: Int = 0,
    val scheduledAt: String? = null,
    val status: String = "",
    val serviceName: String? = null,
    val professionalName: String? = null,
    val salonName: String? = null,
    val durationMinutes: Int = 0,
    val totalPrice: Double = 0.0,
    val cancellationReason: String? = null,
    val notes: String? = null
)

// Professional reassignment option
data class ProfessionalOptionDTO(
    val professionalId: Int = 0,
    val professionalName: String = "",
    val professionalImage: String? = null
)

data class ReassignProfessionalRequest(
    val novoFuncionarioId: Int
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
    val enderecoEntrega: String? = null,
    val funcionarioId: String? = null
)

data class UpdateStatusRequest(val status: String)

// ==================== Servico ====================
data class ServicoDto(
    val id: String,
    val nome: String,
    val descricao: String? = null,
    val preco: Double,
    val duracaoMinutos: Int,
    val categoriaNome: String? = null,
    val ativo: Boolean = true,
    val unidadeId: String? = null
)

data class CreateServicoRequest(
    val nome: String,
    val descricao: String? = null,
    val preco: Double,
    val duracaoMinutos: Int,
    val unidadeId: String,
    val categoriaId: String? = null
)

// ==================== Veiculo ====================
data class VeiculoDto(
    val id: String,
    val placa: String,
    val marca: String? = null,
    val modelo: String? = null,
    val cor: String? = null,
    val tamanho: String? = null,
    val ano: Int? = null,
    val fotoBase64: String? = null,
    val createdAt: String? = null
)

data class CreateVeiculoRequest(
    val placa: String,
    val marca: String,
    val modelo: String,
    val cor: String? = null,
    val tamanho: String? = null,
    val ano: Int? = null,
    val fotoBase64: String? = null
)

data class UpdateVeiculoRequest(
    val placa: String? = null,
    val marca: String? = null,
    val modelo: String? = null,
    val cor: String? = null,
    val tamanho: String? = null,
    val ano: Int? = null,
    val fotoBase64: String? = null
)

// ==================== Categoria ====================
data class CategoriaDto(
    val id: String,
    val nome: String,
    val descricao: String? = null
)

// ==================== Funcionario ====================
data class FuncionarioDto(
    val id: String,
    val nome: String,
    val specialty: String? = null,
    val bio: String? = null,
    val active: Boolean = true,
    val unidadeId: String? = null,
    val userId: String? = null,
    val avatarUrl: String? = null
)

data class CreateFuncionarioRequest(
    val nome: String,
    val specialty: String? = null,
    val unidadeId: String,
    val active: Boolean = true
)

// ==================== Notificacao ====================
data class NotificacaoDto(
    val id: String,
    val title: String,
    val body: String,
    val type: String? = null,
    val rawType: String? = null,
    val referenceId: String? = null,
    val isRead: Boolean = false,
    val createdAt: String? = null
) {
    val iconConfig: Pair<String, String>
        get() = when (type?.lowercase()) {
            "promo", "promotion" -> "pricetag-outline" to "#4CAF50"
            "alert" -> "warning-outline" to "#FF9800"
            "success" -> "checkmark-circle-outline" to "#2563EB"
            "review" -> "star-outline" to "#FFA800"
            else -> "notifications-outline" to "#666666"
        }
}

data class NotificacoesResponse(
    val items: List<NotificacaoDto>,
    val unreadCount: Int
)

// ==================== Legal Documents ====================
data class LegalDocumentDto(
    val id: Int,
    val code: String,
    val title: String,
    val version: String,
    val context: String? = null,
    val content: String,
    val isRequired: Boolean = false
)

data class LegalConsentDto(
    val code: String,
    val version: String
)

// ==================== Planos / Assinatura ====================
data class PlanoDto(
    val id: String,
    val name: String,
    val description: String? = null,
    val price: Double,
    val periodDays: Int,
    val appointmentLimit: Int? = null,
    val active: Boolean = true
)

data class AssinaturaDto(
    val id: String,
    val ownerId: String,
    val planoId: String,
    val status: String,
    val startDate: String? = null,
    val endDate: String? = null,
    val trialEndDate: String? = null,
    val agendamentosNoMes: Int = 0,
    val planoName: String? = null
)

// ==================== Support ====================
data class SupportContactDto(
    val email: String? = null,
    val phone: String? = null,
    val whatsapp: String? = null
)

// ==================== Reports ====================
data class BusinessReportDto(
    val period: String,
    val appointmentsOverTime: List<TimeSeriesPoint> = emptyList(),
    val revenueOverTime: List<TimeSeriesPoint> = emptyList(),
    val servicesRanking: List<RankingItem> = emptyList(),
    val professionalsRanking: List<RankingItem> = emptyList(),
    val clientsRanking: List<ClientRankingItem> = emptyList(),
    val statusBreakdown: List<StatusCount> = emptyList(),
    val weekdayDemand: List<WeekdayDemandItem> = emptyList(),
    val hourlyDemand: List<HourlyDemandItem> = emptyList(),
    val insights: List<String> = emptyList(),
    val totalAppointments: Int = 0,
    val totalRevenue: Double = 0.0,
    val averageTicket: Double = 0.0,
    val cancellationRate: Double = 0.0,
    val uniqueClients: Int = 0,
    val completedAppointments: Int = 0,
    val noShowCount: Int = 0,
    val professionalsCount: Int = 0,
    val servicesCount: Int = 0
)

data class TimeSeriesPoint(
    val date: String,
    val value: Double
)

data class RankingItem(
    val name: String,
    val count: Int = 0,
    val revenue: Double = 0.0,
    val averageTicket: Double = 0.0,
    val share: Double = 0.0
)

data class ClientRankingItem(
    val name: String,
    val visits: Int = 0,
    val revenue: Double = 0.0,
    val lastVisit: String? = null
)

data class WeekdayDemandItem(
    val day: String,
    val count: Int
)

data class HourlyDemandItem(
    val hour: String,
    val count: Int
)

data class StatusCount(
    val status: String,
    val count: Int
)

data class DashboardSummaryDTO(
    val totalToday: Int = 0,
    val confirmados: Int = 0,
    val pendentes: Int = 0,
    val finalizadosMes: Int = 0,
    val faturamentoMes: Double = 0.0,
    val finalizadosHoje: Int = 0,
    val faturamentoHoje: Double = 0.0
)

// ==================== Privacy ====================
data class PrivacyExportDto(
    val userData: UserDataExport,
    val appointments: List<AppointmentExport>,
    val exportedAt: String
)

data class UserDataExport(
    val id: String,
    val name: String,
    val email: String,
    val phone: String? = null,
    val doc: String? = null,
    val dob: String? = null,
    val username: String? = null,
    val country: String? = null,
    val type: String,
    val createdAt: String? = null
)

data class AppointmentExport(
    val id: String,
    val unidadeId: String,
    val servicoId: String,
    val scheduledAt: String? = null,
    val totalPrice: Double? = null,
    val status: String,
    val createdAt: String? = null
)

// ==================== Paged Result ====================
data class PagedResult<T>(
    val items: List<T>,
    val total: Int,
    val page: Int,
    val pageSize: Int
)

// ==================== Push ====================
data class PushTokenRequest(val token: String, val plataforma: String = "Android")

data class RegisterPushDeviceRequest(
    val deviceToken: String,
    val platform: String = "android",
    val provider: String? = "fcm",
    val deviceId: String? = null
)

// ==================== Review ====================
data class ReviewDto(
    val id: String,
    val agendamentoId: String? = null,
    val userId: String? = null,
    val userName: String? = null,
    val unidadeId: String? = null,
    val rating: Int,
    val comment: String? = null,
    val createdAt: String? = null
)

data class CreateReviewRequest(
    val agendamentoId: String,
    val rating: Int,
    val comment: String? = null
)

// ==================== Promotions ====================
data class PromotionDto(
    val servicoId: Int = 0,
    val name: String = "",
    val description: String? = null,
    val originalPrice: Double = 0.0,
    val promoPrice: Double? = null,
    val promoEndDate: String? = null,
    val promoDescription: String? = null,
    val durationMinutes: Int = 0,
    val unidadeId: Int = 0,
    val unidadeName: String = "",
    val unidadeCity: String = "",
    val averageRating: Double? = null,
    val unidadeLogoUrl: String? = null,
    val unidadeLatitude: Double? = null,
    val unidadeLongitude: Double? = null
)
