package com.TFSoftware.lavemeucarro.app.data.remote

import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.TFSoftware.lavemeucarro.app.R
import com.TFSoftware.lavemeucarro.app.data.models.RegisterPushDeviceRequest
import com.TFSoftware.lavemeucarro.app.managers.AuthManager
import com.TFSoftware.lavemeucarro.app.presentation.MainActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
class FCMService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        // Send token to server
        sendTokenToServer(token)
    }

    private fun sendTokenToServer(token: String) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val authManager = AuthManager.getInstance(applicationContext)
                val authToken = authManager.getAccessToken()
                
                if (authToken != null) {
                    val retrofit = Retrofit.Builder()
                        .baseUrl("https://lavameucarro.tharsorechcuria.com/")
                        .addConverterFactory(GsonConverterFactory.create())
                        .build()
                    
                    val api = retrofit.create(LavaMeuCarroApi::class.java)
                    
                    // Get device ID
                    val deviceId = android.provider.Settings.Secure.getString(
                        applicationContext.contentResolver,
                        android.provider.Settings.Secure.ANDROID_ID
                    )
                    
                    api.registerPushToken(
                        RegisterPushDeviceRequest(
                            deviceToken = token,
                            platform = "android",
                            provider = "fcm",
                            deviceId = deviceId
                        )
                    )
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)

        val notification = message.notification
        if (notification != null) {
            showNotification(notification.title ?: "Lava Meu Carro", notification.body ?: "")
        }
    }

    private fun showNotification(title: String, body: String) {
        val channelId = "lavameucarro_default"

        val notificationManager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Lava Meu Carro",
                NotificationManager.IMPORTANCE_HIGH
            )
            notificationManager.createNotificationChannel(channel)
        }

        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        val pendingIntent = PendingIntent.getActivity(this, 0, intent, PendingIntent.FLAG_IMMUTABLE)

        val notification = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(body)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()

        notificationManager.notify(System.currentTimeMillis().toInt(), notification)
    }
}
