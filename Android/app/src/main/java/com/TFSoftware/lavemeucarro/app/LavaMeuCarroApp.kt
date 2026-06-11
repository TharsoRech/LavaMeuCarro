package com.TFSoftware.lavemeucarro.app

import android.app.Application
import android.content.Context
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class LavaMeuCarroApp : Application() {
    
    companion object {
        lateinit var context: Context
            private set
    }
    
    override fun onCreate() {
        super.onCreate()
        context = applicationContext
    }
}
