package com.vitalink.connect

import android.content.SharedPreferences
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.google.android.material.button.MaterialButton
import android.widget.ImageButton
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.auth.auth
import kotlinx.coroutines.launch

class SettingsActivity : AppCompatActivity() {
    private lateinit var prefs: SharedPreferences
    private lateinit var supabase: SupabaseClient

    override fun onCreate(savedInstanceState: Bundle?) {
        // Force light theme only - must be called before super.onCreate()
        setTheme(android.R.style.Theme_Material_Light_NoActionBar)
        super.onCreate(savedInstanceState)
        
        setContentView(R.layout.activity_settings)

        // Initialize Supabase
        val supabaseUrl = getString(R.string.supabase_url)
        val supabaseKey = getString(R.string.supabase_anon_key)
        supabase = createSupabaseClient(supabaseUrl, supabaseKey) {
            install(Auth)
        }

        prefs = getSharedPreferences("vitalink", MODE_PRIVATE)

        val btnBack = findViewById<ImageButton>(R.id.btnBack)
        val btnLogout = findViewById<MaterialButton>(R.id.btnLogout)

        btnBack.setOnClickListener {
            finish()
        }

        btnLogout.setOnClickListener {
            logout()
        }
    }

    private fun logout() {
        lifecycleScope.launch {
            try {
                // Sign out from Supabase
                supabase.auth.signOut()
                
                // Clear local storage
                prefs.edit()
                    .remove("patientId")
                    .remove("supabaseAccessToken")
                    .remove("userEmail")
                    .apply()

                // Navigate to login
                startActivity(android.content.Intent(this@SettingsActivity, LoginActivity::class.java))
                finish()
            } catch (e: Exception) {
                // Even if Supabase logout fails, clear local data
                prefs.edit()
                    .remove("patientId")
                    .remove("supabaseAccessToken")
                    .remove("userEmail")
                    .apply()
                
                startActivity(android.content.Intent(this@SettingsActivity, LoginActivity::class.java))
                finish()
            }
        }
    }
}


