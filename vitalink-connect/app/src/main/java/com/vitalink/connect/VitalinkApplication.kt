package com.vitalink.connect

import android.app.Application
import androidx.appcompat.app.AppCompatDelegate

class VitalinkApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        // Force light mode only - never follow system dark mode
        AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO)

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            val channel = android.app.NotificationChannel(
                "reminders",
                "Reminders",
                android.app.NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Patient reminders"
            }
            val nm = getSystemService(android.app.NotificationManager::class.java)
            nm.createNotificationChannel(channel)
        }
    }
}

