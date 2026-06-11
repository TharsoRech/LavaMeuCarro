package com.TFSoftware.lavemeucarro.app.data.remote

import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query

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

// AwesomeAPI - returns address + coordinates in one request
data class AwesomeCepResponse(
    val cep: String? = null,
    val address: String? = null,
    val address_name: String? = null,
    val district: String? = null,
    val city: String? = null,
    val state: String? = null,
    val lat: String? = null,
    val lng: String? = null
)

// Nominatim (OpenStreetMap) geocoding
data class NominatimResult(
    val lat: String? = null,
    val lon: String? = null,
    val display_name: String? = null,
    val address: NominatimAddress? = null
)

data class NominatimAddress(
    val city: String? = null,
    val town: String? = null,
    val village: String? = null,
    val municipality: String? = null,
    val county: String? = null,
    val state: String? = null,
    val state_code: String? = null,
    val postcode: String? = null
)

interface NominatimApi {
    @GET("search")
    suspend fun search(
        @Query("format") format: String = "jsonv2",
        @Query("addressdetails") addressDetails: Int = 1,
        @Query("limit") limit: Int = 1,
        @Query("countrycodes") countryCodes: String = "br",
        @Query("postalcode") postalCode: String? = null,
        @Query("q") query: String? = null
    ): List<NominatimResult>
}

interface AwesomeCepApi {
    @GET("json/{cep}")
    suspend fun getCep(@Path("cep") cep: String): AwesomeCepResponse
}
