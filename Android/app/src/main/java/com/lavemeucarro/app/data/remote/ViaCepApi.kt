package com.lavemeucarro.app.data.remote

import retrofit2.http.GET
import retrofit2.http.Path

data class ViaCepResponse(
    val cep: String? = null,
    val logradouro: String? = null,
    val complemento: String? = null,
    val bairro: String? = null,
    val localidade: String? = null,
    val uf: String? = null,
    val ibge: String? = null,
    val gia: String? = null,
    val ddd: String? = null,
    val siafi: String? = null
)

interface ViaCepApi {
    @GET("ws/{cep}/json/")
    suspend fun getCep(@Path("cep") cep: String): ViaCepResponse
}
