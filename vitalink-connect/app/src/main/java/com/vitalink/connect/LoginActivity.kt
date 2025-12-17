package com.vitalink.connect

import android.os.Bundle
import android.net.Uri
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.providers.builtin.Email
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaType

class LoginActivity : AppCompatActivity() {
    private lateinit var supabase: SupabaseClient
    private lateinit var etEmail: EditText
    private lateinit var etPassword: EditText
    private lateinit var btnLogin: Button
    private lateinit var tvRegister: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        setTheme(android.R.style.Theme_Material_Light_NoActionBar)
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)

        // Initialize views first
        try {
            etEmail = findViewById(R.id.etEmail) ?: throw IllegalStateException("etEmail not found")
            etPassword = findViewById(R.id.etPassword) ?: throw IllegalStateException("etPassword not found")
            btnLogin = findViewById(R.id.btnLogin) ?: throw IllegalStateException("btnLogin not found")
            tvRegister = findViewById(R.id.tvRegister) ?: throw IllegalStateException("tvRegister not found")

            btnLogin.setOnClickListener {
                login()
            }

            tvRegister.setOnClickListener {
                val base = getString(R.string.web_register_url)
                val url = if (base.isNullOrEmpty()) getString(R.string.scan_capture_url) + "register" else base
                startActivity(android.content.Intent(android.content.Intent.ACTION_VIEW, Uri.parse(url)))
            }
        } catch (e: Exception) {
            android.util.Log.e("LoginActivity", "Error setting up views", e)
            e.printStackTrace()
            Toast.makeText(this, "Error loading login screen: ${e.message}", Toast.LENGTH_LONG).show()
            finish()
            return
        }

        // Supabase is initialized lazily during login to avoid startup crashes

    }

    private fun login() {
        val email = etEmail.text.toString().trim()
        val password = etPassword.text.toString().trim()

        if (email.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "Please enter email and password", Toast.LENGTH_SHORT).show()
            return
        }

        if (!::supabase.isInitialized) {
            try {
                val supabaseUrl = getString(R.string.supabase_url)
                val supabaseKey = getString(R.string.supabase_anon_key)
                supabase = createSupabaseClient(supabaseUrl, supabaseKey) { install(Auth) }
            } catch (e: Exception) {
                Toast.makeText(this, "Initialization error: ${e.message}", Toast.LENGTH_LONG).show()
                return
            }
        }

        btnLogin.isEnabled = false
        lifecycleScope.launch {
            try {
                supabase.auth.signInWith(Email) {
                    this.email = email
                    this.password = password
                }

                // Get user ID from the session after sign in
                val session = supabase.auth.currentSessionOrNull()
                val userId = session?.user?.id?.toString()
                if (!userId.isNullOrEmpty()) {
                    val sp = getSharedPreferences("vitalink", MODE_PRIVATE)
                    sp.edit().putString("patientId", userId).putString("userEmail", email).apply()
                    
                    // Ensure patient exists on server
                    ensurePatientOnServer(userId)
                    // Promote to patient role on server (required for data ingestion)
                    promotePatientOnServer(email)
                }

                Toast.makeText(this@LoginActivity, "Login successful", Toast.LENGTH_SHORT).show()
                navigateToMain()
            } catch (e: Exception) {
                android.util.Log.e("LoginActivity", "Login error", e)
                e.printStackTrace()
                Toast.makeText(this@LoginActivity, "Login failed: ${e.message}", Toast.LENGTH_LONG).show()
                btnLogin.isEnabled = true
            }
        }
    }

    private suspend fun ensurePatientOnServer(patientId: String) {
        try {
            val serverUrl = getString(R.string.server_base_url)
            val mediaType = "application/json; charset=utf-8".toMediaType()
            val request = okhttp3.Request.Builder()
                .url("$serverUrl/admin/ensure-patient")
                .post(okhttp3.RequestBody.create(
                    mediaType,
                    """{"patientId":"$patientId"}"""
                ))
                .addHeader("Content-Type", "application/json")
                .build()

            val client = okhttp3.OkHttpClient()
            client.newCall(request).execute()
        } catch (e: Exception) {
            // Ignore errors - patient might already exist
        }
    }

    private suspend fun promotePatientOnServer(email: String) {
        try {
            val serverUrl = getString(R.string.server_base_url)
            val mediaType = "application/json; charset=utf-8".toMediaType()
            val request = okhttp3.Request.Builder()
                .url("$serverUrl/admin/promote")
                .post(okhttp3.RequestBody.create(
                    mediaType,
                    """{"email":"$email","role":"patient"}"""
                ))
                .addHeader("Content-Type", "application/json")
                .build()

            val client = okhttp3.OkHttpClient()
            client.newCall(request).execute()
        } catch (_: Exception) {
        }
    }

    private fun navigateToMain() {
        startActivity(android.content.Intent(this, MainActivity::class.java))
        finish()
    }
}

