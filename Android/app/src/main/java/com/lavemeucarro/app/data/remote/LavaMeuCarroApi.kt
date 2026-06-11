package com.lavemeucarro.app.data.remote

import com.lavemeucarro.app.data.models.*
import retrofit2.http.*

interface LavaMeuCarroApi {

    // ==================== Auth ====================
    @POST("api/auth/login")
    suspend fun login(@Body request: LoginRequest): AuthResponse

    @POST("api/auth/register")
    suspend fun register(@Body request: RegisterRequest): AuthResponse

    @POST("api/auth/refresh")
    suspend fun refreshToken(@Body request: RefreshRequest): AuthResponse

    @POST("api/auth/logout")
    suspend fun logout()

    @GET("api/auth/me")
    suspend fun getMe(): UserDto

    @PUT("api/auth/me")
    suspend fun updateProfile(@Body request: UpdateProfileRequest): UserDto

    @PUT("api/auth/me/password")
    suspend fun changePassword(@Body request: ChangePasswordRequest)

    @DELETE("api/auth/users/{userId}")
    suspend fun deleteUser(@Path("userId") userId: String)

    @POST("api/auth/verify-email")
    suspend fun requestEmailVerification(@Body request: EmailVerificationRequest): EmailVerificationResponse

    // ==================== Unidades ====================
    @GET("api/unidades")
    suspend fun getUnidades(
        @Query("city") city: String? = null,
        @Query("search") search: String? = null,
        @Query("lat") lat: Double? = null,
        @Query("lng") lng: Double? = null,
        @Query("radius") radius: Int? = null
    ): List<UnidadeDto>

    @GET("api/unidades/{id}")
    suspend fun getUnidadeById(@Path("id") id: String): UnidadeDto

    @GET("api/unidades/mine")
    suspend fun getMyUnidades(): List<UnidadeDto>

    @GET("api/unidades/popular")
    suspend fun getPopularUnidades(@Query("limit") limit: Int = 10): List<UnidadeDto>

    @POST("api/unidades")
    suspend fun createUnidade(@Body request: CreateUnidadeRequest): Int

    @PUT("api/unidades/{id}")
    suspend fun updateUnidade(
        @Path("id") id: String,
        @Body request: UpdateUnidadeRequest
    )

    @DELETE("api/unidades/{id}")
    suspend fun deleteUnidade(@Path("id") id: String)

    // ==================== Agendamentos ====================
    @GET("api/appointments/mine")
    suspend fun getMyAgendamentos(): List<AgendamentoDto>

    @GET("api/appointments/{id}")
    suspend fun getAgendamentoById(@Path("id") id: String): AgendamentoDto

    @GET("api/appointments/unidade/{unidadeId}")
    suspend fun getUnidadeAgendamentos(
        @Path("unidadeId") unidadeId: String,
        @Query("date") date: String? = null,
        @Query("funcionarioId") funcionarioId: String? = null
    ): List<AgendamentoDto>

    @GET("api/appointments/unidade/{unidadeId}/paged")
    suspend fun getUnidadeAgendamentosPaged(
        @Path("unidadeId") unidadeId: String,
        @Query("page") page: Int = 1,
        @Query("pageSize") pageSize: Int = 20,
        @Query("search") search: String? = null,
        @Query("status") status: String? = null
    ): PagedResult<AgendamentoDto>

    @GET("api/appointments/unidade/{unidadeId}/dashboard-summary")
    suspend fun getDashboardSummary(@Path("unidadeId") unidadeId: String): DashboardSummaryDTO

    @POST("api/appointments")
    suspend fun createAgendamento(@Body request: CreateAgendamentoRequest): AgendamentoDto

    @PATCH("api/appointments/{id}/status")
    suspend fun updateAgendamentoStatus(
        @Path("id") id: String,
        @Body request: UpdateStatusRequest
    )

    @DELETE("api/appointments/{id}")
    suspend fun cancelAgendamento(
        @Path("id") id: String,
        @Query("reason") reason: String? = null
    )

    @GET("api/appointments/{id}/client-history")
    suspend fun getClientAppointmentHistory(@Path("id") id: String): ClientAppointmentHistoryDTO

    @GET("api/appointments/{id}/eligible-professionals")
    suspend fun getEligibleProfessionals(@Path("id") id: String): List<ProfessionalOptionDTO>

    @PATCH("api/appointments/{id}/reassign")
    suspend fun reassignProfessional(
        @Path("id") id: String,
        @Body request: ReassignProfessionalRequest
    )

    // ==================== Servicos ====================
    @GET("api/servicos")
    suspend fun getServicos(@Query("unidadeId") unidadeId: String): List<ServicoDto>

    @POST("api/servicos")
    suspend fun createServico(@Body request: CreateServicoRequest): ServicoDto

    // ==================== Veiculos ====================
    @GET("api/veiculos")
    suspend fun getMyVeiculos(): List<VeiculoDto>

    @POST("api/veiculos")
    suspend fun createVeiculo(@Body request: CreateVeiculoRequest): VeiculoDto

    @DELETE("api/veiculos/{id}")
    suspend fun deleteVeiculo(@Path("id") id: String)

    // ==================== Categorias ====================
    @GET("api/categorias")
    suspend fun getCategorias(): List<CategoriaDto>

    // ==================== Funcionarios ====================
    @GET("api/funcionarios")
    suspend fun getFuncionarios(@Query("unidadeId") unidadeId: String): List<FuncionarioDto>

    @POST("api/funcionarios")
    suspend fun createFuncionario(@Body request: CreateFuncionarioRequest): FuncionarioDto

    @PUT("api/funcionarios/{id}")
    suspend fun updateFuncionario(
        @Path("id") id: String,
        @Body request: Map<String, @JvmSuppressWildcards Any>
    )

    @DELETE("api/funcionarios/{id}")
    suspend fun deleteFuncionario(@Path("id") id: String)

    // ==================== Notificacoes ====================
    @GET("api/notificacoes")
    suspend fun getNotificacoes(): NotificacoesResponse

    @PATCH("api/notificacoes/{id}/read")
    suspend fun markNotificacaoAsRead(@Path("id") id: String)

    @POST("api/notificacoes/mark-all-read")
    suspend fun markAllNotificacoesAsRead()

    // ==================== Reports ====================
    @GET("api/reports/business")
    suspend fun getBusinessReport(
        @Query("period") period: String = "30d",
        @Query("unidadeId") unidadeId: String? = null
    ): BusinessReportDto

    // ==================== Support ====================
    @GET("api/support/contact")
    suspend fun getSupportContact(): SupportContactDto

    // ==================== Legal ====================
    @GET("api/legal/privacy-policy")
    suspend fun getPrivacyPolicy(): LegalDocumentDto

    @GET("api/legal/terms-of-use")
    suspend fun getTermsOfUse(): LegalDocumentDto

    @GET("api/legal/documents")
    suspend fun getLegalDocuments(
        @Query("context") context: String = "registration"
    ): List<LegalDocumentDto>

    // ==================== Planos ====================
    @GET("api/planos")
    suspend fun getPlanos(): List<PlanoDto>

    // ==================== Privacy / LGPD ====================
    @GET("api/privacy/export")
    suspend fun exportMyData(): PrivacyExportDto

    @DELETE("api/privacy/account")
    suspend fun deleteMyAccount()

    // ==================== Push Token ====================
    @POST("api/push/register")
    suspend fun registerPushToken(@Body request: PushTokenRequest)

    // ==================== Reviews ====================
    @POST("api/reviews")
    suspend fun createReview(@Body request: CreateReviewRequest): ReviewDto

    @GET("api/reviews")
    suspend fun getReviews(@Query("unidadeId") unidadeId: String): List<ReviewDto>
}
