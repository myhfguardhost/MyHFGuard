package com.vitalink.connect

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

class ReminderReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        android.util.Log.d("ReminderReceiver", "onReceive triggered")
        val title = intent.getStringExtra("title") ?: "Reminder"
        val body = intent.getStringExtra("body") ?: ""
        
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as android.app.NotificationManager
        // CHANGE: Match the new channel ID from MainActivity
        val channelId = "vitalink_reminders_v2"
        
        // Ensure channel exists (defensive)
        if (nm.getNotificationChannel(channelId) == null) {
            val ch = android.app.NotificationChannel(channelId, "Vitalink Reminders", android.app.NotificationManager.IMPORTANCE_HIGH)
            ch.enableVibration(true)
            nm.createNotificationChannel(ch)
        }

        val n = NotificationCompat.Builder(context, channelId)
            .setContentTitle(title)
            .setContentText(body)
            .setSmallIcon(android.R.drawable.stat_notify_chat)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setVibrate(longArrayOf(0, 500, 200, 500))
            .setAutoCancel(true)
            .build()
            
        try {
            nm.notify((title + body).hashCode(), n)
            android.util.Log.d("ReminderReceiver", "Notification posted")
        } catch (e: SecurityException) {
            android.util.Log.e("ReminderReceiver", "Permission missing", e)
        } catch (e: Exception) {
            android.util.Log.e("ReminderReceiver", "Error posting notification", e)
        }
    }
}

