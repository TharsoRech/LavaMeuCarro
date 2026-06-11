package com.TFSoftware.lavemeucarro.app.data.remote

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.Response
import okhttp3.RequestBody.Companion.toRequestBody

class AuthInterceptor(private val dataStore: DataStore<Preferences>) : Interceptor {

    companion object {
        val TOKEN_KEY = stringPreferencesKey("access_token")
        val REFRESH_TOKEN_KEY = stringPreferencesKey("refresh_token")
    }

    override fun intercept(chain: Interceptor.Chain): Response = runBlocking {
        val prefs = dataStore.data.first()
        val token = prefs[TOKEN_KEY]

        val request = chain.request().newBuilder().apply {
            if (!token.isNullOrEmpty()) {
                addHeader("Authorization", "Bearer $token")
            }
        }.build()

        val response = chain.proceed(request)

        if (response.code == 401) {
            response.close()
            val refreshToken = prefs[REFRESH_TOKEN_KEY]
            if (!refreshToken.isNullOrEmpty()) {
                try {
                    // Call the actual refresh endpoint
                    val baseUrl = chain.request().url.let { "${it.scheme}://${it.host}${if (it.port != 80 && it.port != 443) ":${it.port}" else ""}" }
                    val refreshUrl = "$baseUrl/api/auth/refresh"
                    val refreshBody = """{"refreshToken":"$refreshToken"}"""
                        .toRequestBody("application/json".toMediaType())

                    val refreshRequest = okhttp3.Request.Builder()
                        .url(refreshUrl)
                        .post(refreshBody)
                        .build()

                    val refreshResponse = chain.call().let {
                        // Use a new client for the refresh call to avoid recursion
                        OkHttpClient().newCall(refreshRequest).execute()
                    }

                    if (refreshResponse.isSuccessful) {
                        val body = refreshResponse.body?.string()
                        val gson = com.google.gson.Gson()
                        val authResponse = gson.fromJson(body, com.TFSoftware.lavemeucarro.app.data.models.AuthResponse::class.java)

                        // Save new tokens
                        dataStore.edit { preferences ->
                            preferences[TOKEN_KEY] = authResponse.token
                            preferences[REFRESH_TOKEN_KEY] = authResponse.refreshToken
                        }

                        // Retry original request with new token
                        val newRequest = chain.request().newBuilder()
                            .addHeader("Authorization", "Bearer ${authResponse.token}")
                            .build()
                        chain.proceed(newRequest)
                    } else {
                        refreshResponse.close()
                        // Refresh failed, clear tokens
                        dataStore.edit { preferences ->
                            preferences.remove(TOKEN_KEY)
                            preferences.remove(REFRESH_TOKEN_KEY)
                        }
                        chain.proceed(request)
                    }
                } catch (_: Exception) {
                    chain.proceed(request)
                }
            } else {
                chain.proceed(request)
            }
        } else {
            response
        }
    }
}
