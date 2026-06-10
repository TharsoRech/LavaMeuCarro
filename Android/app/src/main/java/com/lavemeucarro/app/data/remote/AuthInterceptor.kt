package com.lavemeucarro.app.data.remote

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.stringPreferencesKey
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.Response

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
                val refreshRequest = chain.request().newBuilder()
                    .addHeader("Authorization", "Bearer $refreshToken")
                    .build()
                chain.proceed(refreshRequest)
            } else {
                chain.proceed(request)
            }
        } else {
            response
        }
    }
}
