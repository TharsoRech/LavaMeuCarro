package com.lavemeucarro.app.presentation.screens.profile

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.lavemeucarro.app.data.models.UserDto
import com.lavemeucarro.app.data.remote.AuthInterceptor
import com.lavemeucarro.app.data.remote.LavaMeuCarroApi
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val api: LavaMeuCarroApi,
    private val dataStore: DataStore<Preferences>
) : ViewModel() {

    private val _user = MutableStateFlow<UserDto?>(null)
    val user: StateFlow<UserDto?> = _user

    init {
        viewModelScope.launch {
            try { _user.value = api.getMe() } catch (_: Exception) {}
        }
    }

    fun logout() {
        viewModelScope.launch {
            dataStore.edit { prefs ->
                prefs.remove(stringPreferencesKey("access_token"))
                prefs.remove(stringPreferencesKey("refresh_token"))
            }
        }
    }
}
