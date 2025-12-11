package com.vitalink.connect

import android.app.Application
import androidx.appcompat.app.AppCompatDelegate

class VitalinkApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        // Force light mode only - never follow system dark mode
        AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO)
    }
}

