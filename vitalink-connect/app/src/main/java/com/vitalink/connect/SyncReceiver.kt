package com.vitalink.connect

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient

class SyncReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val sp = context.getSharedPreferences("vitalink", Context.MODE_PRIVATE)
        val patientId = sp.getString("patientId", null) ?: return
        val baseUrl = context.getString(R.string.api_base_url)
        
        val pendingResult = goAsync()
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val http = OkHttpClient()
                ReminderScheduler.refresh(context, http, baseUrl, patientId)
            } finally {
                pendingResult.finish()
            }
        }
    }
}