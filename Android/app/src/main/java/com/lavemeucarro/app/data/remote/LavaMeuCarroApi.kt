package com.lavemeucarro.app.data.remote

import com.lavemeucarro.app.data.models.*
import retrofit2.http.*

interface LavaMeuCarroApi {

    // Auth
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): AuthResponse

    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): AuthResponse

    @POST("auth/refresh")
    suspend fun refreshToken(@Body request: RefreshRequest): AuthResponse

    @GET("auth/me")
    suspend fun getMe(): UserDto

    @PUT("auth/me/password")
    suspend fun changePassword(@Body request: ChangePasswordRequest)

    // Unidades
    @GET("unidades")
    suspend fun getUnidades(
        @Query("city") city: String? = null,
        @Query("search") search: String? = null,
        @Query("lat") lat: Double? = null,
        @Query("lng") lng: Double? = null,
        @Query("radius") radius: Int? = null
    ): List<UnidadeDto>

    @GET("unidades/{id}")
    suspend fun getUnidadeById(@Path("id") id: String): UnidadeDto

    // Agendamentos
    @GET("agendamentos")
    suspend fun getMyAgendamentos(
        @Query("page") page: Int = 1,
        @Query("pageSize") pageSize: Int = 20,
        @Query("status") status: String? = null
    ): List<AgendamentoDto>

    @POST("agendamentos")
    suspend fun createAgendamento(@Body request: CreateAgendamentoRequest): AgendamentoDto

    @PATCH("agendamentos/{id}/status")
    suspend fun updateAgendamentoStatus(
        @Path("id") id: String,
        @Body request: UpdateStatusRequest
    )

    @DELETE("agendamentos/{id}")
    suspend fun cancelAgendamento(
        @Path("id") id: String,
        @Query("reason") reason: String? = null
    )

    // Servicos
    @GET("servicos")
    suspend fun getServicos(@Query("unidadeId") unidadeId: String): List<ServicoDto>

    // Veiculos
    @GET("veiculos")
    suspend fun getMyVeiculos(): List<VeiculoDto>

    @POST("veiculos")
    suspend fun createVeiculo(@Body request: CreateVeiculoRequest): VeiculoDto

    // Categorias
    @GET("categorias")
    suspend fun getCategorias(): List<CategoriaDto>

    // Push Token
    @POST("push/register")
    suspend fun registerPushToken(@Body request: PushTokenRequest)
}
